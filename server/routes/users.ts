import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth.js';
import { normalizeBody, isRole } from '../../src/utils/text.js';

const router = Router();
router.use(authenticateToken);

// GET all users (for account management - excludes superadmin from the list)
router.get('/', authorizeRole(['superadmin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const where: any = {};
    // Filter out superadmin from the managed accounts list
    // Superadmin is the system manager, not a managed account in the branch view
    if (!isRole(req.user?.role, 'superadmin')) {
      where.companyId = req.user?.companyId;
    }
    
    const allUsers = await prisma.user.findMany({
      where,
      select: {
        id: true, username: true, role: true, name: true,
        companyId: true, contact: true, disabled: true,
      },
      orderBy: { name: 'asc' },
    });

    // Exclude superadmins from the list in JS for case-insensitivity
    const users = allUsers.filter(u => !isRole(u.role, 'superadmin'));

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// POST create user
router.post('/', authorizeRole(['superadmin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const normalized = normalizeBody(req.body);
    let { username, password, role, name, companyId, contact } = normalized;
    if (password && password.length < 8) {
      res.status(400).json({ message: 'Password harus minimal 8 karakter' });
      return;
    }
    role = String(role || 'ADMIN').toUpperCase();
    const hashed = await bcrypt.hash(password || '123', 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        role,
        name,
        companyId: isRole(role, 'superadmin') ? null : (companyId || req.user?.companyId || null),
        contact,
        disabled: false,
      },
    });
    res.status(201).json({
      id: user.id, username: user.username, role: user.role,
      name: user.name, companyId: user.companyId, contact: user.contact,
      disabled: user.disabled,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// PUT update user
router.put('/:id', authorizeRole(['superadmin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const normalized = normalizeBody(req.body);
    let { password, role, ...updates } = normalized;
    if (password && password.length < 8) {
      res.status(400).json({ message: 'Password harus minimal 8 karakter' });
      return;
    }
    // Remove id from updates to prevent primary key modification
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => key !== 'id')
    );
    const data: any = { ...cleanUpdates };
    if (password) data.password = await bcrypt.hash(password, 10);
    if (role) data.role = String(role).toUpperCase();

    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({
      id: user.id, username: user.username, role: user.role,
      name: user.name, companyId: user.companyId, contact: user.contact,
      disabled: user.disabled,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// PATCH toggle disabled
router.patch('/:id/disabled', authorizeRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const { disabled } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { disabled },
    });
    res.json({ id: user.id, disabled: user.disabled });
  } catch (error) {
    console.error('Error toggling user:', error);
    res.status(500).json({ message: 'Failed to toggle user' });
  }
});

// DELETE user
router.delete('/:id', authorizeRole(['superadmin', 'admin']), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
