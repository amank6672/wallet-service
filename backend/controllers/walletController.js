import { 
  transact, 
  getWallet as getWalletService, 
  getTransactions as getTransactionsService,
  setupWallet as setupWalletService,
} from '../services/walletService.js';
import { 
  mapWalletToResponse, 
  mapWalletSetupToResponse,
  mapTransactionToResponse, 
  mapTransactionToTransactResponse,
  mapTransactionsToResponse 
} from '../utils/mappers.js';
import { 
  exportTransactionsCSV, 
  generateCSVFilename 
} from '../services/exportService.js';

/**
 * Setup a new wallet
 * Required response: { id, balance, transactionId, name, date }
 */
export const setupWallet = async (req, res, next) => {
  try {
    const { name, balance = 0 } = req.body;
    const result = await setupWalletService(name, balance);
    res.json(mapWalletSetupToResponse(result.wallet, result.transactionId));
  } catch (error) {
    next(error);
  }
};

/**
 * Process a transaction
 * Required response: { balance, transactionId }
 */
export const transactAmount = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const { amount, description, idempotencyKey } = req.body;
    
    const transaction = await transact(
      walletId,
      amount,
      description,
      idempotencyKey
    );
    
    res.json(mapTransactionToTransactResponse(transaction));
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet details
 */
export const getWallet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wallet = await getWalletService(id);
    res.json(mapWalletToResponse(wallet));
  } catch (error) {
    next(error);
  }
};

/**
 * Get transactions with pagination
 * Required: Use skip/limit instead of cursor
 * Required response: Array directly [{ id, walletId, amount, balance, description, date, type }, ...]
 */
export const getTransactions = async (req, res, next) => {
  try {
    const { walletId, skip = 0, limit = 25, sortBy, sortOrder } = req.query;
    
    const result = await getTransactionsService(walletId, {
      skip: parseInt(skip),
      limit: parseInt(limit),
      sortBy: sortBy || 'date',
      sortOrder: sortOrder || 'desc',
    });
    
    // Return array directly as per requirements
    res.json(mapTransactionsToResponse(result.transactions));
  } catch (error) {
    next(error);
  }
};

/**
 * Export transactions as CSV
 * Note: For millions of transactions, consider streaming or async job processing
 */
export const exportCSV = async (req, res, next) => {
  try {
    const { walletId, limit = 10000 } = req.query;
    
    const csvContent = await exportTransactionsCSV(walletId, parseInt(limit));
    const filename = generateCSVFilename(walletId);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};
