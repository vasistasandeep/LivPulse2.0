import { Dashboard, DashboardCreateInput, DashboardUpdateInput, DashboardFilters } from '../types/dashboard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface DashboardsResponse {
  dashboards: Dashboard[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDashboards: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class DashboardApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getDashboards(params: {
    page?: number;
    limit?: number;
  } & DashboardFilters): Promise<DashboardsResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<DashboardsResponse>(`/dashboards?${searchParams}`);
  }

  async getDashboard(id: number): Promise<Dashboard> {
    return this.request<Dashboard>(`/dashboards/${id}`);
  }

  async createDashboard(data: DashboardCreateInput): Promise<Dashboard> {
    return this.request<Dashboard>('/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDashboard(id: number, data: DashboardUpdateInput): Promise<Dashboard> {
    return this.request<Dashboard>(`/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDashboard(id: number): Promise<void> {
    await this.request<void>(`/dashboards/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateDashboard(id: number): Promise<Dashboard> {
    return this.request<Dashboard>(`/dashboards/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async shareDashboard(id: number, shareData: {
    userIds: number[];
    permissions: 'read' | 'write';
  }): Promise<void> {
    await this.request<void>(`/dashboards/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(shareData),
    });
  }

  async getSharedDashboards(): Promise<Dashboard[]> {
    return this.request<Dashboard[]>('/dashboards/shared');
  }

  async exportDashboard(id: number, format: 'pdf' | 'json'): Promise<Blob> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/dashboards/${id}/export?format=${format}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async importDashboard(file: File): Promise<Dashboard> {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/dashboards/import`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Import failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getDashboardStats(): Promise<{
    total: number;
    public: number;
    private: number;
    shared: number;
    recent: Dashboard[];
  }> {
    return this.request<{
      total: number;
      public: number;
      private: number;
      shared: number;
      recent: Dashboard[];
    }>('/dashboards/stats');
  }
}

export const dashboardApi = new DashboardApiService();