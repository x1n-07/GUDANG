import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { isRole } from '../../src/utils/text.js';

const router = Router();
router.use(authenticateToken);

const tenantWhere = (req: AuthRequest) => {
  const role = String(req.user?.role ?? '').toUpperCase();
  if (role === 'SUPERADMIN') return {};
  if (role === 'PENGAWAS') {
    const branchId = String(req.query.branchId ?? '').trim();
    // '' => SEMUA CABANG; jika ada branchId => hanya cabang itu
    return branchId ? { companyId: branchId } : {};
  }
  return { companyId: req.user?.companyId };
};

router.get('/all-data', async (req: AuthRequest, res) => {
  try {
    const where = tenantWhere(req);
    const [
      goods, goodsTransactions,
      equipment, equipmentLogs,
      vehicles, vehicleLogs, vehicleNeeds,
      technicians,
      companies,
      allUsers
    ] = await Promise.all([
      prisma.goodsItem.findMany({ where }),
      prisma.goodsTransaction.findMany({ where, orderBy: { date: 'desc' } }),
      prisma.equipmentItem.findMany({ where }),
      prisma.equipmentLog.findMany({ where, orderBy: { date: 'desc' } }),
      prisma.vehicleItem.findMany({ where }),
      prisma.vehicleLog.findMany({ where, orderBy: { startDate: 'desc' } }),
      prisma.vehicleNeed.findMany({ where, orderBy: { date: 'desc' } }),
      prisma.technician.findMany({ where }),
      prisma.company.findMany({ orderBy: { name: 'asc' } }),
      isRole(req.user?.role, 'superadmin')
        ? prisma.user.findMany({ orderBy: { name: 'asc' } })
        : prisma.user.findMany({ where: { companyId: req.user?.companyId }, orderBy: { name: 'asc' } }),
    ]);

    // Superadmin is the system manager, not a managed account: exclude it from the account list.
    const users = allUsers.filter(u => !isRole(u.role, 'superadmin'));

    res.json({
      goods, goodsTransactions,
      equipment, equipmentLogs,
      vehicles, vehicleLogs, vehicleNeeds,
      technicians,
      companies,
      users
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

export default router;
