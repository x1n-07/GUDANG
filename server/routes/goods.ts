import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const tenantWhere = (req: AuthRequest) => {
  if (req.user?.role === 'superadmin') return {};
  return { companyId: req.user?.companyId };
};

// ---- Goods Items ----
router.get('/', async (req: AuthRequest, res) => {
  try {
    const goods = await prisma.goodsItem.findMany({
      where: tenantWhere(req),
      orderBy: { name: 'asc' },
    });
    res.json(goods);
  } catch (error) {
    console.error('Error fetching goods:', error);
    res.status(500).json({ message: 'Failed to fetch goods' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, category, stock, minStock, unit, companyId } = req.body;
    const targetCompanyId = req.user?.role === 'superadmin' 
      ? (companyId || req.user?.companyId) 
      : req.user?.companyId;

    if (!targetCompanyId) {
      res.status(400).json({ message: 'Company ID harus diisi' });
      return;
    }

    const item = await prisma.goodsItem.create({
      data: {
        adminId: req.user!.id,
        companyId: targetCompanyId,
        name: name.trim(),
        category,
        stock: Math.max(0, Number(stock) || 0),
        minStock: Math.max(0, Number(minStock) || 0),
        unit,
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating goods item:', error);
    res.status(500).json({ message: 'Failed to create goods item' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const item = await prisma.goodsItem.findFirst({ where: { id: req.params.id, ...tenantWhere(req) } });
    if (!item) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    await prisma.goodsItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting goods item:', error);
    res.status(500).json({ message: 'Failed to delete goods item' });
  }
});

// ---- Goods Transactions ----
router.get('/transactions', async (req: AuthRequest, res) => {
  try {
    const transactions = await prisma.goodsTransaction.findMany({
      where: tenantWhere(req),
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

router.post('/transactions', async (req: AuthRequest, res) => {
  try {
    const { itemId, type, quantity, notes, pic } = req.body;
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ message: 'Jumlah kuantitas tidak valid' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const goodsItem = await tx.goodsItem.findUnique({ where: { id: itemId } });
      if (!goodsItem) throw new Error('Item not found');

      if (type === 'OUT' && goodsItem.stock < qty) {
        throw new Error(`Stok tidak mencukupi. Stok saat ini: ${goodsItem.stock}`);
      }

      const newStock = type === 'IN'
        ? goodsItem.stock + qty
        : goodsItem.stock - qty;

      await tx.goodsItem.update({ where: { id: itemId }, data: { stock: newStock } });
      return tx.goodsTransaction.create({
        data: {
          adminId: req.user!.id,
          companyId: goodsItem.companyId,
          itemId,
          type,
          quantity: qty,
          notes,
          pic,
        },
      });
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ message: error.message || 'Failed to create transaction' });
  }
});

export default router;