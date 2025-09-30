import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export interface WebSocketEventData {
  [key: string]: any;
}

export interface DashboardUpdate {
  dashboardId: number;
  updates: any;
  updatedBy: {
    id: number;
    email: string;
  };
  timestamp: string;
}

export interface CsvProgress {
  uploadId: string;
  progress: {
    percentage: number;
    stage: string;
    message: string;
    errors?: any[];
  };
}

export interface UserStatus {
  online: boolean;
  connectedUsers: number;
  notifications: any[];
}

export const useWebSocket = () => {
  const { token, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  // Event listeners storage
  const eventListeners = useRef<Map<string, Set<Function>>>(new Map());

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('WebSocket disconnected:', reason);
      
      // Attempt to reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect') {
        setConnectionError('Server disconnected. Please refresh the page.');
      }
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      setConnectionError(error.message || 'Connection failed');
      console.error('WebSocket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionError(error.message || 'WebSocket error');
    });

    // Handle user status updates
    socket.on('user:status', (status: UserStatus) => {
      setUserStatus(status);
    });

    // Set up generic event forwarding
    const originalOn = socket.on.bind(socket);
    socket.on = (event: string, listener: Function) => {
      // Forward to custom listeners
      const customListeners = eventListeners.current.get(event);
      if (customListeners && customListeners.size > 0) {
        customListeners.forEach(customListener => {
          originalOn(event, (...args: any[]) => {
            customListener(...args);
            listener(...args);
          });
        });
      } else {
        originalOn(event, listener);
      }
      return socket;
    };

  }, [token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setUserStatus(null);
    }
  }, []);

  // Generic event subscription
  const subscribe = useCallback((event: string, callback: Function) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event)!.add(callback);

    // If socket is already connected, subscribe immediately
    if (socketRef.current?.connected) {
      socketRef.current.on(event, callback as any);
    }

    // Return unsubscribe function
    return () => {
      const listeners = eventListeners.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListeners.current.delete(event);
        }
      }
      if (socketRef.current) {
        socketRef.current.off(event, callback as any);
      }
    };
  }, []);

  // Emit events
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit - socket not connected');
    }
  }, []);

  // Dashboard-specific methods
  const subscribeToDashboard = useCallback((dashboardId: number) => {
    emit('subscribe:dashboard', dashboardId);
  }, [emit]);

  const unsubscribeFromDashboard = useCallback((dashboardId: number) => {
    emit('unsubscribe:dashboard', dashboardId);
  }, [emit]);

  const updateDashboard = useCallback((dashboardId: number, updates: any) => {
    emit('dashboard:update', { dashboardId, updates });
  }, [emit]);

  const onDashboardUpdate = useCallback((callback: (data: DashboardUpdate) => void) => {
    return subscribe('dashboard:updated', callback);
  }, [subscribe]);

  const onDashboardData = useCallback((callback: (data: any) => void) => {
    return subscribe('dashboard:data', callback);
  }, [subscribe]);

  // CSV-specific methods
  const requestCsvProgress = useCallback((uploadId: string) => {
    emit('csv:progress', uploadId);
  }, [emit]);

  const onCsvProgress = useCallback((callback: (data: CsvProgress) => void) => {
    return subscribe('csv:progress', callback);
  }, [subscribe]);

  // Notification methods
  const markNotificationRead = useCallback((notificationId: string) => {
    emit('notification:read', notificationId);
  }, [emit]);

  const onNotification = useCallback((callback: (notification: any) => void) => {
    return subscribe('notification:new', callback);
  }, [subscribe]);

  const onNotificationUpdate = useCallback((callback: (update: any) => void) => {
    return subscribe('notification:updated', callback);
  }, [subscribe]);

  // Connection management
  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    connectionError,
    userStatus,
    
    // Core methods
    connect,
    disconnect,
    subscribe,
    emit,
    
    // Dashboard methods
    subscribeToDashboard,
    unsubscribeFromDashboard,
    updateDashboard,
    onDashboardUpdate,
    onDashboardData,
    
    // CSV methods
    requestCsvProgress,
    onCsvProgress,
    
    // Notification methods
    markNotificationRead,
    onNotification,
    onNotificationUpdate,
  };
};

// Hook for dashboard real-time updates
export const useDashboardRealtime = (dashboardId: number | null) => {
  const webSocket = useWebSocket();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<DashboardUpdate | null>(null);

  useEffect(() => {
    if (!dashboardId || !webSocket.isConnected) return;

    // Subscribe to dashboard
    webSocket.subscribeToDashboard(dashboardId);

    // Listen for updates
    const unsubscribeUpdate = webSocket.onDashboardUpdate((update) => {
      if (update.dashboardId === dashboardId) {
        setLastUpdate(update);
        // Apply updates to current data
        setDashboardData((prev: any) => ({
          ...prev,
          ...update.updates
        }));
      }
    });

    const unsubscribeData = webSocket.onDashboardData((data) => {
      if (data.dashboardId === dashboardId) {
        setDashboardData(data.data);
      }
    });

    return () => {
      webSocket.unsubscribeFromDashboard(dashboardId);
      unsubscribeUpdate();
      unsubscribeData();
    };
  }, [dashboardId, webSocket.isConnected, webSocket]);

  const updateDashboard = useCallback((updates: any) => {
    if (dashboardId) {
      webSocket.updateDashboard(dashboardId, updates);
    }
  }, [dashboardId, webSocket]);

  return {
    dashboardData,
    lastUpdate,
    updateDashboard,
    isConnected: webSocket.isConnected,
  };
};

// Hook for CSV upload progress
export const useCsvProgress = (uploadId: string | null) => {
  const webSocket = useWebSocket();
  const [progress, setProgress] = useState<CsvProgress | null>(null);

  useEffect(() => {
    if (!uploadId || !webSocket.isConnected) return;

    // Request current progress
    webSocket.requestCsvProgress(uploadId);

    // Listen for progress updates
    const unsubscribe = webSocket.onCsvProgress((progressData) => {
      if (progressData.uploadId === uploadId) {
        setProgress(progressData);
      }
    });

    return unsubscribe;
  }, [uploadId, webSocket.isConnected, webSocket]);

  return {
    progress,
    isConnected: webSocket.isConnected,
  };
};

// Hook for notifications
export const useNotifications = () => {
  const webSocket = useWebSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!webSocket.isConnected) return;

    const unsubscribeNew = webSocket.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    const unsubscribeUpdate = webSocket.onNotificationUpdate((update) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === update.notificationId 
            ? { ...notif, ...update }
            : notif
        )
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
    };
  }, [webSocket.isConnected, webSocket]);

  const markAsRead = useCallback((notificationId: string) => {
    webSocket.markNotificationRead(notificationId);
  }, [webSocket]);

  return {
    notifications,
    markAsRead,
    isConnected: webSocket.isConnected,
  };
};