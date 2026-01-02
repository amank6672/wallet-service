import express from 'express';
import {
  setupWallet,
  transactAmount,
  getWallet,
  getTransactions,
  exportCSV
} from '../controllers/walletController.js';

const router = express.Router();

router.post('/setup', setupWallet);
router.post('/transact/:walletId', transactAmount);
router.get('/wallet/:id', getWallet);
router.get('/transactions', getTransactions);
router.get('/transactions/export/csv', exportCSV);

export default router;
