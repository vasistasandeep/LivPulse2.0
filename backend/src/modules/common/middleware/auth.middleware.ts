import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name?: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, status: true },
    });

    if (!user || !user.status) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access control
export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role 
      });
    }

    next();
  };
};

// Specific role middlewares for convenience
export const requireAdmin = requireRoles(['Admin']);
export const requireAdminOrTPM = requireRoles(['Admin', 'TPM']);
export const requireDataAccess = requireRoles(['Admin', 'TPM', 'PM', 'EM', 'SRE']);
export const requireInfraAccess = requireRoles(['Admin', 'TPM', 'EM', 'SRE']);
export const requireKPIAccess = requireRoles(['Admin', 'TPM', 'PM', 'Executive']);

// Check if user can access specific resource
export const canAccessDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const dashboardId = parseInt(req.params.id);
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    // Admin and TPM can access all dashboards
    if (['Admin', 'TPM'].includes(req.user.role)) {
      return next();
    }

    // Check if dashboard is public
    if (dashboard.isPublic) {
      return next();
    }

    // Check if user owns the dashboard
    if (dashboard.createdBy === req.user.id) {
      return next();
    }

    // Check permissions in dashboard config
    const permissions = dashboard.permissions as any;
    if (permissions?.roles?.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied to this dashboard' });
  } catch (error) {
    return res.status(500).json({ error: 'Error checking dashboard access' });
  }
};