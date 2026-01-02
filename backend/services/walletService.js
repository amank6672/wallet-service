import walletDAO from '../daos/walletDAO.js';
import transactionDAO from '../daos/transactionDAO.js';
import { toDecimal } from '../utils/decimal.js';
import { logger } from '../utils/logger.js';
import { supportsMongoTransactions } from '../db.js';
import mongoose from 'mongoose';
import { processTransaction } from './transactionService.js';
import { 
  normalizeLimit
} from './transactionQueryService.js';

/**
 * Process transaction with idempotency support
 * Delegates to transactionService for actual processing
 */
export async function transact(walletId, amount, description, idempotencyKey) {
  return processTransaction(walletId, amount, description, idempotencyKey);
}

/**
 * Get wallet by ID with optimized query
 * Uses DAO for data access
 */
export async function getWallet(walletId) {
  return walletDAO.findById(walletId, { useReadReplica: true });
}

/**
 * Get transactions with skip/limit pagination
 * Required format: Array directly with skip/limit instead of cursor
 */
export async function getTransactions(walletId, options = {}) {
  const {
    skip = 0,
    limit = 25,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Validate and normalize limit
  const queryLimit = normalizeLimit(limit, 1, 100);
  const querySkip = Math.max(0, parseInt(skip) || 0);

  // Build query - no cursor, just walletId filter
  const query = {};
  if (walletId) {
    query.walletId = new mongoose.Types.ObjectId(walletId);
  }

  // Map sortBy field - API uses 'date' but DB uses 'createdAt'
  const sortField = sortBy === 'date' ? 'createdAt' : sortBy;
  
  // Build sort object
  const sortDirection = sortOrder === 'desc' ? -1 : 1;
  const sortObj = { [sortField]: sortDirection };

  // Execute query through DAO with skip/limit
  const transactions = await transactionDAO.find(query, {
    skip: querySkip,
    limit: queryLimit,
    sort: sortObj,
    useReadReplica: true,
  });

  logger.debug('Transactions query executed', {
    walletId,
    skip: querySkip,
    limit: queryLimit,
    returned: transactions.length,
  });

  // Return transactions array directly (no pagination metadata)
  return {
    transactions,
  };
}

/**
 * Setup wallet with initial balance
 * Optimized with proper error handling and transaction support
 */
export async function setupWallet(name, initialBalance = 0) {
  const useTransactions = supportsMongoTransactions();
  const session = useTransactions ? await mongoose.startSession() : null;
  
  try {
    if (useTransactions && session) {
      session.startTransaction({
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', wtimeout: 5000 },
      });
    }

    const balance = toDecimal(initialBalance);
    const options = { session: useTransactions && session ? session : null };
    
    // Create wallet using DAO
    const walletDoc = await walletDAO.create({
      name: name.trim(),
      balance,
    }, options);

    // Create initial transaction if balance > 0
    let initialTransaction = null;
    if (parseFloat(initialBalance) > 0) {
      initialTransaction = await transactionDAO.create({
        walletId: walletDoc._id,
        amount: balance,
        balance: balance,
        description: 'Initial wallet setup',
        type: 'CREDIT',
      }, options);
    }

    if (useTransactions && session && session.inTransaction()) {
      await session.commitTransaction();
    }

    logger.info('Wallet setup completed', {
      walletId: walletDoc._id,
      name: name.trim(),
      initialBalance: balance,
      usedTransactions: useTransactions,
    });

    // Return wallet with transaction ID if initial transaction was created
    return {
      wallet: walletDoc,
      transactionId: initialTransaction ? initialTransaction._id.toString() : null,
    };
  } catch (error) {
    if (useTransactions && session && session.inTransaction()) {
      await session.abortTransaction();
    }
    logger.error('Wallet setup error', { 
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
