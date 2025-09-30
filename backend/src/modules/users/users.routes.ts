import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdminOrTPM, requireAdmin, AuthRequest } from '../common/middleware/auth.middleware';
import { validateUserInput, validateUserUpdate } from './users.validation';
import { logger } from '../common/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users - List all users (Admin/TPM only)
router.get('/', authenticateToken, requireAdminOrTPM, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '10', search, role, status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status !== undefined) {
      where.status = status === 'true';
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              dashboards: true,
              kpiMetrics: true,
              csvUploads: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user (Admin/TPM only)
router.get('/:id', authenticateToken, requireAdminOrTPM, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            dashboards: true,
            kpiMetrics: true,
            contentPerf: true,
            risks: true,
            bugsSprints: true,
            infraMetrics: true,
            csvUploads: true,
            createdReports: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateUserInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { email, password, name, role } = req.body;
    const currentUser = req.user!;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User created: ${newUser.email} (${newUser.role}) by ${currentUser.email}`);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user (Admin/TPM)
router.put('/:id', authenticateToken, requireAdminOrTPM, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUser = req.user!;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const validation = validateUserUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // TPM cannot modify Admin users
    if (currentUser.role === 'TPM' && existingUser.role === 'Admin') {
      return res.status(403).json({ error: 'TPM cannot modify Admin users' });
    }

    // Prevent self-deactivation
    if (userId === currentUser.id && req.body.status === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updateData: any = {};
    
    // Only include fields that are being updated
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    
    // Handle password update
    if (req.body.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(req.body.password, saltRounds);
    }

    // Handle email update (check for duplicates)
    if (req.body.email && req.body.email.toLowerCase() !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: req.body.email.toLowerCase() },
      });
      
      if (emailExists) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      
      updateData.email = req.body.email.toLowerCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated: ${updatedUser.email} by ${currentUser.email}`);

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUser = req.user!;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use transaction to handle related data
    await prisma.$transaction(async (tx) => {
      // Delete user's sessions
      await tx.session.deleteMany({
        where: { userId },
      });

      // Transfer or delete user's data based on business rules
      // For now, we'll keep the data but set createdBy to null or another user
      
      // Delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    logger.info(`User deleted: ${userToDelete.email} by ${currentUser.email}`);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        role: userToDelete.role,
      },
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/users/stats - Get user statistics (Admin/TPM only)
router.get('/api/stats', authenticateToken, requireAdminOrTPM, async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, activeUsers, roleStats, recentLogins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      prisma.user.findMany({
        where: {
          lastLogin: { not: null },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLogin: true,
        },
        orderBy: { lastLogin: 'desc' },
        take: 10,
      }),
    ]);

    const roleDistribution = roleStats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution,
      recentLogins,
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export default router;