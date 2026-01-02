import express from 'express';
import {
  setupWallet,
  transactAmount,
  getWallet,
  getTransactions,
  exportCSV
} from '../controllers/walletController.js';
import {
  validateWalletSetup,
  validateTransaction,
  validateWalletId,
  validateGetTransactions,
} from '../middleware/validator.js';

const router = express.Router();

// Wallet routes
router.post('/setup', validateWalletSetup, setupWallet);
router.get('/wallet/:id', validateWalletId, getWallet);

// Transaction routes
router.post('/transact/:walletId', validateTransaction, transactAmount);
router.get('/transactions', validateGetTransactions, getTransactions);
router.get('/transactions/export/csv', validateGetTransactions, exportCSV);

export default router;
