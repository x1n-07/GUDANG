import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requireWriteAccess, AuthRequest } from '../middleware/auth.js';
import { normalizeBody, isRole } from '../../src/utils/text.js';

const router = Router();
router.use(authenticateToken);

const tenantWhere = (req: AuthRequest) => {
  if (isRole(req.user?.role, 'superadmin')) return {};
  if (isRole(req.user?.role, 'pengawas')) return {};
  return { companyId: req.user?.companyId };
};

router.get('/', async (req: AuthRequest, res) => {
  try {
    const technicians = await prisma.technician.findMany({
      where: tenantWhere(req),
      orderBy: { name: 'asc' },
    });
    res.json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ message: 'Failed to fetch technicians' });
  }
});

router.post('/', requireWriteAccess, async (req: AuthRequest, res) => {
  try {
    const normalized = normalizeBody(req.body);
    const { name, role, phone, companyId } = normalized;
    const targetCompanyId = isRole(req.user?.role, 'superadmin') 
      ? (companyId || req.user?.companyId) 
      : req.user?.companyId;

    if (!targetCompanyId) {
      res.status(400).json({ message: 'Company ID harus diisi' });
      return;
    }

    const tech = await prisma.technician.create({
      data: {
        adminId: req.user!.id,
        companyId: targetCompanyId,
        name,
        role: role ? role.toUpperCase() : '',
        phone: phone || '',
      },
    });
    res.status(201).json(tech);
  } catch (error) {
    console.error('Error creating technician:', error);
    res.status(500).json({ message: 'Failed to create technician' });
  }
});

router.delete('/:id', requireWriteAccess, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.technician.findFirst({ where: { id: req.params.id, ...tenantWhere(req) } });
    if (!item) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    await prisma.technician.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting technician:', error);
    res.status(500).json({ message: 'Failed to delete technician' });
  }
});

export default router;
