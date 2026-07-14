import express from 'express';
import { Packages, Transactions } from '../services/store.js';

const router = express.Router();

router.get('/packages', (req, res) => {
  res.json(Packages.getAll());
});

router.patch('/packages/:id', (req, res) => {
  const { price, label } = req.body;
  const updated = Packages.update(req.params.id, {
    ...(price !== undefined && { price }),
    ...(label !== undefined && { label }),
  });
  if (!updated) return res.status(404).json({ error: 'Package not found' });
  res.json(updated);
});

router.get('/transactions', (req, res) => {
  res.json(Transactions.getAll());
});

router.get('/summary', (req, res) => {
  const transactions = Transactions.getAll();
  const successful = transactions.filter((t) => t.status === 'SUCCESS');

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayTx = successful.filter((t) => t.confirmedAt >= startOfToday.getTime());

  res.json({
    todayRevenue: todayTx.reduce((sum, t) => sum + Number(t.confirmedAmount || t.amount), 0),
    todayTransactions: todayTx.length,
    totalRevenue: successful.reduce((sum, t) => sum + Number(t.confirmedAmount || t.amount), 0),
    totalTransactions: successful.length,
    pendingTransactions: transactions.filter((t) => t.status === 'PENDING').length,
  });
});

export default router;
