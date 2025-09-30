export interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  department?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  config: Record<string, any>;
  tags?: string[];
  isPublic: boolean;
  createdBy: number;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardCreateInput {
  name: string;
  description?: string;
  config: Record<string, any>;
  tags?: string[];
  isPublic?: boolean;
}

export interface DashboardUpdateInput {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  tags?: string[];
  isPublic?: boolean;
}

export interface DashboardFilters {
  search?: string;
  createdBy?: number;
  isPublic?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}