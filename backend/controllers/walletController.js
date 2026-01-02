import { 
  transact, 
  getWallet as getWalletService, 
  getTransactions as getTransactionsService,
  setupWallet as setupWalletService,
} from '../services/walletService.js';
import { 
  mapWalletToResponse, 
  mapTransactionToResponse, 
  mapTransactionsToResponse 
} from '../utils/mappers.js';
import { 
  exportTransactionsCSV, 
  generateCSVFilename 
} from '../services/exportService.js';

/**
 * Setup a new wallet
 */
export const setupWallet = async (req, res, next) => {
  try {
    const { name, balance = 0 } = req.body;
    const wallet = await setupWalletService(name, balance);
    res.json(mapWalletToResponse(wallet));
  } catch (error) {
    next(error);
  }
};

/**
 * Process a transaction
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
    
    res.json(mapTransactionToResponse(transaction));
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
 */
export const getTransactions = async (req, res, next) => {
  try {
    const { walletId, limit, cursor, type, sortBy, sortOrder } = req.query;
    
    const result = await getTransactionsService(walletId, {
      limit: limit ? parseInt(limit) : 50,
      cursor,
      type,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    });
    
    res.json({
      transactions: mapTransactionsToResponse(result.transactions),
      pagination: result.pagination,
    });
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
