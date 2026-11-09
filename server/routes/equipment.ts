import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const tenantWhere = (req: AuthRequest) => {
  if (req.user?.role === 'superadmin') return {};
  return { companyId: req.user?.companyId };
};

// ---- Equipment Items ----
router.get('/', async (req: AuthRequest, res) => {
  try {
    const equipment = await prisma.equipmentItem.findMany({
      where: tenantWhere(req),
      orderBy: { name: 'asc' },
    });
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Failed to fetch equipment' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, condition, companyId } = req.body;
    const targetCompanyId = req.user?.role === 'superadmin' 
      ? (companyId || req.user?.companyId) 
      : req.user?.companyId;

    if (!targetCompanyId) {
      res.status(400).json({ message: 'Company ID harus diisi' });
      return;
    }

    const item = await prisma.equipmentItem.create({
      data: {
        adminId: req.user!.id,
        companyId: targetCompanyId,
        name: name.trim(),
        condition: condition || 'Baik',
        status: 'Tersedia',
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ message: 'Failed to create equipment' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const item = await prisma.equipmentItem.findFirst({ where: { id: req.params.id, ...tenantWhere(req) } });
    if (!item) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    await prisma.equipmentItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Failed to delete equipment' });
  }
});

router.patch('/:id/condition', async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.equipmentItem.findFirst({
      where: { id: req.params.id, ...tenantWhere(req) },
    });
    if (!existing) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    const item = await prisma.equipmentItem.update({
      where: { id: req.params.id },
      data: { condition: req.body.condition },
    });
    res.json(item);
  } catch (error) {
    console.error('Error updating condition:', error);
    res.status(500).json({ message: 'Failed to update condition' });
  }
});

// ---- Equipment Logs ----
router.get('/logs', async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.equipmentLog.findMany({
      where: tenantWhere(req),
      orderBy: { date: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching equipment logs:', error);
    res.status(500).json({ message: 'Failed to fetch equipment logs' });
  }
});

router.post('/logs', async (req: AuthRequest, res) => {
  try {
    const { equipmentId, user, action, condition, notes } = req.body;
    if (action !== 'PINJAM' && action !== 'KEMBALI') {
      res.status(400).json({ message: 'Aksi tidak valid. Harus PINJAM atau KEMBALI' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const eq = await tx.equipmentItem.findUnique({ where: { id: equipmentId } });
      if (!eq) throw new Error('Equipment not found');

      if (action === 'PINJAM' && eq.status === 'Dipinjam') {
        throw new Error(`Peralatan sedang dipinjam oleh ${eq.currentUser || 'pengguna lain'}`);
      }
      if (action === 'KEMBALI' && eq.status !== 'Dipinjam') {
        throw new Error('Peralatan tidak sedang dipinjam');
      }

      await tx.equipmentItem.update({
        where: { id: equipmentId },
        data: {
          status: action === 'PINJAM' ? 'Dipinjam' : 'Tersedia',
          currentUser: action === 'PINJAM' ? user : null,
          condition: condition || eq.condition,
        },
      });
      return tx.equipmentLog.create({
        data: {
          adminId: req.user!.id,
          companyId: eq.companyId,
          equipmentId,
          user,
          action,
          condition: condition || eq.condition,
          notes,
        },
      });
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating equipment log:', error);
    res.status(400).json({ message: error.message || 'Failed to create equipment log' });
  }
});

export default router;