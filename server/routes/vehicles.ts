import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const tenantWhere = (req: AuthRequest) => {
  if (req.user?.role === 'superadmin') return {};
  return { companyId: req.user?.companyId };
};

// ---- Vehicle Items ----
router.get('/', async (req: AuthRequest, res) => {
  try {
    const vehicles = await prisma.vehicleItem.findMany({
      where: tenantWhere(req),
      orderBy: { name: 'asc' },
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Failed to fetch vehicles' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, plateNumber, odometer, oilChangeInterval, serviceInterval, companyId } = req.body;
    const targetCompanyId = req.user?.role === 'superadmin' 
      ? (companyId || req.user?.companyId) 
      : req.user?.companyId;

    if (!targetCompanyId) {
      res.status(400).json({ message: 'Company ID harus diisi' });
      return;
    }
    if (!name || !plateNumber) {
      res.status(400).json({ message: 'Nama dan plat nomor wajib diisi' });
      return;
    }

    // Prevent duplicate plate number within the same company
    const duplicate = await prisma.vehicleItem.findFirst({
      where: { companyId: targetCompanyId, plateNumber: plateNumber.trim().toUpperCase() },
    });
    if (duplicate) {
      res.status(400).json({ message: `Kendaraan dengan plat ${plateNumber} sudah terdaftar` });
      return;
    }

    const initialOdometer = Math.max(0, Number(odometer) || 0);
    const item = await prisma.vehicleItem.create({
      data: {
        adminId: req.user!.id,
        companyId: targetCompanyId,
        name: name.trim(),
        plateNumber: plateNumber.trim().toUpperCase(),
        status: 'Tersedia',
        odometer: initialOdometer,
        lastOilChangeOdometer: initialOdometer,
        oilChangeInterval: Math.max(1, Number(oilChangeInterval) || 5000),
        lastServiceOdometer: initialOdometer,
        serviceInterval: Math.max(1, Number(serviceInterval) || 10000),
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ message: 'Failed to create vehicle' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res) => {
  try {
    const item = await prisma.vehicleItem.findFirst({ where: { id: req.params.id, ...tenantWhere(req) } });
    if (!item) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    const updated = await prisma.vehicleItem.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({ message: 'Failed to update vehicle status' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const item = await prisma.vehicleItem.findFirst({ where: { id: req.params.id, ...tenantWhere(req) } });
    if (!item) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    await prisma.vehicleItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Failed to delete vehicle' });
  }
});

// ---- Vehicle Logs ----
router.get('/logs', async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.vehicleLog.findMany({
      where: tenantWhere(req),
      orderBy: { startDate: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching vehicle logs:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle logs' });
  }
});

router.post('/logs', async (req: AuthRequest, res) => {
  try {
    const { vehicleId, driver, purpose, startOdometer } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const v = await tx.vehicleItem.findUnique({ where: { id: vehicleId } });
      if (!v) throw new Error('Vehicle not found');

      // Validate vehicle can be used
      if (v.status !== 'Tersedia') {
        throw new Error(`Kendaraan tidak dapat digunakan. Status saat ini: ${v.status}`);
      }

      // Odometer must be >= current odometer
      const startOdo = Math.max(0, Number(startOdometer) || v.odometer);
      if (startOdo < v.odometer) {
        throw new Error(`Odometer awal (${startOdo}) tidak boleh lebih kecil dari odometer terakhir kendaraan (${v.odometer})`);
      }

      // Update vehicle status and odometer
      await tx.vehicleItem.update({ 
        where: { id: vehicleId }, 
        data: { 
          status: 'Sedang Digunakan',
          odometer: startOdo
        } 
      });

      return tx.vehicleLog.create({
        data: {
          adminId: req.user!.id,
          companyId: v.companyId,
          vehicleId,
          driver,
          purpose,
          status: 'JALAN',
          startOdometer: startOdo,
        },
      });
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating vehicle log:', error);
    res.status(400).json({ message: error.message || 'Failed to create vehicle log' });
  }
});

router.patch('/logs/:logId/finish', async (req: AuthRequest, res) => {
  try {
    const { endOdometer } = req.body;
    const log = await prisma.vehicleLog.findUnique({ where: { id: req.params.logId } });
    if (!log) {
      res.status(404).json({ message: 'Log not found' });
      return;
    }
    const result = await prisma.$transaction(async (tx) => {
      // Calculate distance and ensure odometer progression
      if (endOdometer !== undefined && Number(endOdometer) < log.startOdometer) {
        throw new Error(`Odometer akhir (${endOdometer}) tidak boleh lebih kecil dari awalan ${log.startOdometer}`);
      }

      // Update vehicle status and final odometer
      await tx.vehicleItem.update({ 
        where: { id: log.vehicleId }, 
        data: { 
          status: 'Tersedia',
          odometer: endOdometer !== undefined ? Math.max(log.startOdometer, Number(endOdometer)) : undefined
        } 
      });

      return tx.vehicleLog.update({
        where: { id: req.params.logId },
        data: { 
          status: 'SELESAI', 
          endDate: new Date(),
          endOdometer: endOdometer !== undefined ? Math.max(log.startOdometer, Number(endOdometer)) : undefined
        },
      });
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error finishing trip:', error);
    res.status(400).json({ message: error.message || 'Failed to finish trip' });
  }
});

// ---- Vehicle Needs ----
router.get('/needs', async (req: AuthRequest, res) => {
  try {
    const needs = await prisma.vehicleNeed.findMany({
      where: tenantWhere(req),
      orderBy: { date: 'desc' },
    });
    res.json(needs);
  } catch (error) {
    console.error('Error fetching vehicle needs:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle needs' });
  }
});

router.post('/needs', async (req: AuthRequest, res) => {
  try {
    const { vehicleId, type, description, cost, pic } = req.body;
    const v = await prisma.vehicleItem.findUnique({ where: { id: vehicleId } });
    if (!v) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // When oil change is recorded, reset the oil change baseline to current odometer
      // Handles both 'Ganti Oli' (frontend) and 'Servis' (backend convention)
      const oilTypes = ['Ganti Oli', 'Servis', 'Oli', 'Perbaikan'];
      if (oilTypes.includes(type)) {
        await tx.vehicleItem.update({
          where: { id: vehicleId },
          data: { lastOilChangeOdometer: v.odometer },
        });
      }

      // When service is recorded, reset the service baseline and mark vehicle under repair
      if (type === 'Servis' || type === 'Perbaikan') {
        await tx.vehicleItem.update({
          where: { id: vehicleId },
          data: { lastServiceOdometer: v.odometer, status: 'Perbaikan' },
        });
      }

      return tx.vehicleNeed.create({
        data: {
          adminId: req.user!.id,
          companyId: v.companyId,
          vehicleId,
          type,
          description,
          cost: Number(cost) || 0,
          pic,
        },
      });
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating vehicle need:', error);
    res.status(400).json({ message: error.message || 'Failed to create vehicle need' });
  }
});

export default router;
