import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { isRole } from '../../src/utils/text.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password required' });
      return;
    }

    // Try finding exact match first (standard behavior)
    let user = await prisma.user.findUnique({ where: { username: String(username).trim() } });
    
    // If not found, try case-insensitive trim search (for robustness)
    if (!user) {
      const allUsers = await prisma.user.findMany({
        where: { username: { contains: String(username).trim() } }
      });
      user = allUsers.find(u => u.username.toLowerCase() === String(username).trim().toLowerCase()) || null;
    }

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if company is disabled
    if (user.companyId) {
      const company = await prisma.company.findUnique({ where: { id: user.companyId } });
      if (company?.disabled) {
        res.status(403).json({ message: 'Company account is disabled' });
        return;
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET || 'warehouse-app-secret-key-2026',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        companyId: user.companyId,
        name: user.name,
        contact: user.contact,
        disabled: user.disabled,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
