import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { normalizeBody } from '../../src/utils/text.js';

const router = Router();
router.use(authenticateToken);

// GET all companies
router.get('/', async (_req, res) => {
  try {
    const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

// POST create company
router.post('/', authorizeRole(['superadmin']), async (req, res) => {
  try {
    const normalized = normalizeBody(req.body);
    const { name, disabled } = normalized;
    const company = await prisma.company.create({
      data: { name, disabled: disabled ?? false },
    });
    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Failed to create company' });
  }
});

// PUT update company
router.put('/:id', authorizeRole(['superadmin']), async (req, res) => {
  try {
    const { name, disabled } = req.body;
    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: { ...(name !== undefined && { name }), ...(disabled !== undefined && { disabled }) },
    });
    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Failed to update company' });
  }
});

// PATCH toggle disabled
router.patch('/:id/disabled', authorizeRole(['superadmin']), async (req, res) => {
  try {
    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: { disabled: req.body.disabled },
    });
    res.json(company);
  } catch (error) {
    console.error('Error toggling company:', error);
    res.status(500).json({ message: 'Failed to toggle company' });
  }
});

// DELETE company (cascade deletes related data via Prisma schema)
router.delete('/:id', authorizeRole(['superadmin']), async (req, res) => {
  try {
    await prisma.company.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Failed to delete company' });
  }
});

export default router;
