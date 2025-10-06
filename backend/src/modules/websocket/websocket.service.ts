import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { logger } from '../common/utils/logger';

const prisma = new PrismaClient();

// Redis with graceful fallback
let redis: Redis | null = null;
let isRedisAvailable = false;

try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
    redis.on('ready', () => {
      isRedisAvailable = true;
      logger.info('WebSocket Redis connected');
    });
    redis.on('error', (err) => {
      logger.error('WebSocket Redis error:', err);
      isRedisAvailable = false;
    });
  } else {
    logger.warn('No REDIS_URL for WebSocket service, running without Redis pub/sub');
  }
} catch (error) {
  logger.error('Failed to initialize Redis for WebSocket:', error);
}

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
  userEmail?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, number>(); // socketId -> userId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisSubscriptions();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Verify user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true, isActive: true }
        });

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        socket.userEmail = user.email;
        
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userEmail} connected with socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.id, socket.userId!);

      // Join user to their personal room
      socket.join(`user:${socket.userId}`);
      
      // Join user to role-based rooms
      socket.join(`role:${socket.userRole}`);

      // Handle dashboard subscription
      socket.on('subscribe:dashboard', (dashboardId: number) => {
        this.handleDashboardSubscription(socket, dashboardId);
      });

      // Handle dashboard unsubscription
      socket.on('unsubscribe:dashboard', (dashboardId: number) => {
        socket.leave(`dashboard:${dashboardId}`);
        logger.info(`User ${socket.userEmail} unsubscribed from dashboard ${dashboardId}`);
      });

      // Handle real-time data updates
      socket.on('dashboard:update', (data) => {
        this.handleDashboardUpdate(socket, data);
      });

      // Handle CSV upload progress
      socket.on('csv:progress', (uploadId: string) => {
        this.handleCsvProgress(socket, uploadId);
      });

      // Handle notifications
      socket.on('notification:read', (notificationId: string) => {
        this.handleNotificationRead(socket, notificationId);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        logger.info(`User ${socket.userEmail} disconnected`);
      });

      // Send initial connection data
      this.sendUserStatus(socket);
    });
  }

  private async handleDashboardSubscription(socket: AuthenticatedSocket, dashboardId: number) {
    try {
      // Check if user has access to dashboard
      const dashboard = await prisma.dashboard.findUnique({
        where: { id: dashboardId },
        select: { id: true, isPublic: true, createdBy: true }
      });

      if (!dashboard) {
        socket.emit('error', { message: 'Dashboard not found' });
        return;
      }

      // Check permissions
      const hasAccess = dashboard.isPublic || 
                       dashboard.createdBy === socket.userId || 
                       ['Admin', 'TPM'].includes(socket.userRole!);

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to dashboard' });
        return;
      }

      socket.join(`dashboard:${dashboardId}`);
      logger.info(`User ${socket.userEmail} subscribed to dashboard ${dashboardId}`);

      // Send current dashboard data
      const dashboardData = await this.getDashboardData(dashboardId);
      socket.emit('dashboard:data', { dashboardId, data: dashboardData });

    } catch (error) {
      logger.error('Dashboard subscription error:', error);
      socket.emit('error', { message: 'Failed to subscribe to dashboard' });
    }
  }

  private async handleDashboardUpdate(socket: AuthenticatedSocket, data: any) {
    try {
      const { dashboardId, updates } = data;

      // Verify user can update this dashboard
      const dashboard = await prisma.dashboard.findUnique({
        where: { id: dashboardId },
        select: { createdBy: true }
      });

      if (!dashboard) {
        socket.emit('error', { message: 'Dashboard not found' });
        return;
      }

      const canUpdate = dashboard.createdBy === socket.userId || 
                       ['Admin', 'TPM'].includes(socket.userRole!);

      if (!canUpdate) {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Broadcast update to all subscribers
      this.io.to(`dashboard:${dashboardId}`).emit('dashboard:updated', {
        dashboardId,
        updates,
        updatedBy: {
          id: socket.userId,
          email: socket.userEmail
        },
        timestamp: new Date().toISOString()
      });

      // Publish to Redis for other server instances
      await redis.publish('dashboard:update', JSON.stringify({
        dashboardId,
        updates,
        updatedBy: socket.userId,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      logger.error('Dashboard update error:', error);
      socket.emit('error', { message: 'Failed to update dashboard' });
    }
  }

  private async handleCsvProgress(socket: AuthenticatedSocket, uploadId: string) {
    try {
      // Get CSV upload progress from Redis or database
      const progress = await redis.get(`csv:progress:${uploadId}`);
      
      if (progress) {
        socket.emit('csv:progress', {
          uploadId,
          progress: JSON.parse(progress)
        });
      }
    } catch (error) {
      logger.error('CSV progress error:', error);
    }
  }

  private async handleNotificationRead(socket: AuthenticatedSocket, notificationId: string) {
    try {
      // Mark notification as read in database
      // This would integrate with a notifications system
      socket.emit('notification:updated', {
        notificationId,
        status: 'read'
      });
    } catch (error) {
      logger.error('Notification read error:', error);
    }
  }

  private async sendUserStatus(socket: AuthenticatedSocket) {
    try {
      // Send user's online status and any pending notifications
      const onlineUsers = Array.from(this.connectedUsers.values());
      
      socket.emit('user:status', {
        online: true,
        connectedUsers: onlineUsers.length,
        notifications: [], // Would fetch from database
      });
    } catch (error) {
      logger.error('User status error:', error);
    }
  }

  private async getDashboardData(dashboardId: number) {
    try {
      // Fetch latest dashboard data
      const dashboard = await prisma.dashboard.findUnique({
        where: { id: dashboardId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Fetch related data based on dashboard config
      const data = {
        dashboard,
        lastUpdated: new Date().toISOString(),
        // Additional real-time data would be fetched here
      };

      return data;
    } catch (error) {
      logger.error('Get dashboard data error:', error);
      return null;
    }
  }

  private setupRedisSubscriptions() {
    // Subscribe to Redis channels for cross-server communication
    redis.subscribe('dashboard:update', 'csv:progress', 'notification:new');

    redis.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);

        switch (channel) {
          case 'dashboard:update':
            this.io.to(`dashboard:${data.dashboardId}`).emit('dashboard:updated', data);
            break;

          case 'csv:progress':
            this.io.to(`user:${data.userId}`).emit('csv:progress', data);
            break;

          case 'notification:new':
            this.io.to(`user:${data.userId}`).emit('notification:new', data);
            break;
        }
      } catch (error) {
        logger.error('Redis message processing error:', error);
      }
    });
  }

  // Public methods for other services to use
  public async notifyUser(userId: number, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
    
    // Also publish to Redis for other server instances
    await redis.publish('notification:new', JSON.stringify({
      userId,
      event,
      data,
      timestamp: new Date().toISOString()
    }));
  }

  public async notifyRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  public async updateDashboard(dashboardId: number, data: any) {
    this.io.to(`dashboard:${dashboardId}`).emit('dashboard:updated', {
      dashboardId,
      updates: data,
      timestamp: new Date().toISOString()
    });

    await redis.publish('dashboard:update', JSON.stringify({
      dashboardId,
      updates: data,
      timestamp: new Date().toISOString()
    }));
  }

  public async updateCsvProgress(userId: number, uploadId: string, progress: any) {
    const progressData = {
      uploadId,
      progress,
      timestamp: new Date().toISOString()
    };

    this.io.to(`user:${userId}`).emit('csv:progress', progressData);
    
    await redis.setex(`csv:progress:${uploadId}`, 3600, JSON.stringify(progress));
    await redis.publish('csv:progress', JSON.stringify({
      userId,
      ...progressData
    }));
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public isUserOnline(userId: number): boolean {
    return Array.from(this.connectedUsers.values()).includes(userId);
  }
}

export let webSocketService: WebSocketService;

export const initializeWebSocket = (server: HTTPServer) => {
  webSocketService = new WebSocketService(server);
  logger.info('WebSocket service initialized');
  return webSocketService;
};