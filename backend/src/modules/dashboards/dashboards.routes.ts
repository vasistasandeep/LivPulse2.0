import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, canAccessDashboard, AuthRequest } from '../common/middleware/auth.middleware';
import { validateDashboardInput, validateDashboardUpdate } from './dashboards.validation';
import { logger } from '../common/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboards - List dashboards
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user!;
    const { page = '1', limit = '10', search, isPublic } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause based on user role
    let where: any = {};

    // Admin and TPM can see all dashboards
    if (!['Admin', 'TPM'].includes(currentUser.role)) {
      where = {
        OR: [
          { createdBy: currentUser.id }, // Own dashboards
          { isPublic: true }, // Public dashboards
          {
            permissions: {
              path: ['roles'],
              array_contains: currentUser.role,
            },
          }, // Role-based access
        ],
      };
    }

    // Apply filters
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const [dashboards, total] = await Promise.all([
      prisma.dashboard.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limitNum,
        skip: offset,
      }),
      prisma.dashboard.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      dashboards,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalDashboards: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

// POST /api/dashboards - Create dashboard
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateDashboardInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { name, description, layout, permissions, isPublic } = req.body;
    const currentUser = req.user!;

    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        description,
        layout: layout || {},
        permissions: permissions || { roles: [] },
        isPublic: isPublic || false,
        createdBy: currentUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Dashboard created: ${dashboard.name} by ${currentUser.email}`);

    res.status(201).json({
      message: 'Dashboard created successfully',
      dashboard,
    });
  } catch (error) {
    logger.error('Error creating dashboard:', error);
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
});

// GET /api/dashboards/:id - Get specific dashboard
router.get('/:id', authenticateToken, canAccessDashboard, async (req: AuthRequest, res: Response) => {
  try {
    const dashboardId = parseInt(req.params.id);

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({ dashboard });
  } catch (error) {
    logger.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// PUT /api/dashboards/:id - Update dashboard
router.put('/:id', authenticateToken, canAccessDashboard, async (req: AuthRequest, res: Response) => {
  try {
    const dashboardId = parseInt(req.params.id);
    const currentUser = req.user!;

    const validation = validateDashboardUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    // Check if user can edit (owner, admin, or TPM)
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const canEdit = 
      dashboard.createdBy === currentUser.id ||
      ['Admin', 'TPM'].includes(currentUser.role);

    if (!canEdit) {
      return res.status(403).json({ error: 'You can only edit your own dashboards' });
    }

    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.layout !== undefined) updateData.layout = req.body.layout;
    if (req.body.permissions !== undefined) updateData.permissions = req.body.permissions;
    if (req.body.isPublic !== undefined) updateData.isPublic = req.body.isPublic;

    const updatedDashboard = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Dashboard updated: ${updatedDashboard.name} by ${currentUser.email}`);

    res.json({
      message: 'Dashboard updated successfully',
      dashboard: updatedDashboard,
    });
  } catch (error) {
    logger.error('Error updating dashboard:', error);
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

// DELETE /api/dashboards/:id - Delete dashboard
router.delete('/:id', authenticateToken, canAccessDashboard, async (req: AuthRequest, res: Response) => {
  try {
    const dashboardId = parseInt(req.params.id);
    const currentUser = req.user!;

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { id: true, name: true, createdBy: true },
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    // Check if user can delete (owner, admin, or TPM)
    const canDelete = 
      dashboard.createdBy === currentUser.id ||
      ['Admin', 'TPM'].includes(currentUser.role);

    if (!canDelete) {
      return res.status(403).json({ error: 'You can only delete your own dashboards' });
    }

    await prisma.dashboard.delete({
      where: { id: dashboardId },
    });

    logger.info(`Dashboard deleted: ${dashboard.name} by ${currentUser.email}`);

    res.json({
      message: 'Dashboard deleted successfully',
      deletedDashboard: {
        id: dashboard.id,
        name: dashboard.name,
      },
    });
  } catch (error) {
    logger.error('Error deleting dashboard:', error);
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
});

// POST /api/dashboards/:id/duplicate - Duplicate dashboard
router.post('/:id/duplicate', authenticateToken, canAccessDashboard, async (req: AuthRequest, res: Response) => {
  try {
    const dashboardId = parseInt(req.params.id);
    const currentUser = req.user!;
    const { name } = req.body;

    const originalDashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
    });

    if (!originalDashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const duplicatedDashboard = await prisma.dashboard.create({
      data: {
        name: name || `${originalDashboard.name} (Copy)`,
        description: originalDashboard.description,
        layout: originalDashboard.layout,
        permissions: { roles: [] }, // Reset permissions for copied dashboard
        isPublic: false, // Reset public status
        createdBy: currentUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Dashboard duplicated: ${duplicatedDashboard.name} by ${currentUser.email}`);

    res.status(201).json({
      message: 'Dashboard duplicated successfully',
      dashboard: duplicatedDashboard,
    });
  } catch (error) {
    logger.error('Error duplicating dashboard:', error);
    res.status(500).json({ error: 'Failed to duplicate dashboard' });
  }
});

// GET /api/dashboards/:id/data - Get dashboard data
router.get('/:id/data', authenticateToken, canAccessDashboard, async (req: AuthRequest, res: Response) => {
  try {
    const dashboardId = parseInt(req.params.id);
    const { timeRange = '7d' } = req.query;

    // This would typically aggregate data from various sources
    // For now, return sample data structure
    const dashboardData = {
      kpiMetrics: [],
      contentPerformance: [],
      infraMetrics: [],
      recentActivity: [],
      lastUpdated: new Date(),
    };

    res.json({ data: dashboardData });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;