import walletDAO from '../daos/walletDAO.js';
import transactionDAO from '../daos/transactionDAO.js';
import { toDecimal } from '../utils/decimal.js';
import { logger } from '../utils/logger.js';
import { supportsMongoTransactions } from '../db.js';
import mongoose from 'mongoose';
import { processTransaction } from './transactionService.js';
import { 
  buildTransactionQuery, 
  normalizeLimit, 
  buildPaginationMetadata 
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
 * Get transactions with cursor-based pagination for handling millions of records
 * Optimized with proper indexes, lean queries, and read preferences
 */
export async function getTransactions(walletId, options = {}) {
  const {
    limit = 50,
    cursor = null,
    type = null,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Validate and normalize limit
  const queryLimit = normalizeLimit(limit);

  // Build query
  const query = buildTransactionQuery(walletId, type, cursor, sortOrder);

  // Build sort object
  const sortDirection = sortOrder === 'desc' ? -1 : 1;
  const sortObj = { [sortBy]: sortDirection };

  // Execute query through DAO
  // Note: Index hints are disabled by default to avoid errors if indexes don't exist yet
  // MongoDB's query planner will automatically choose the best available index
  // To enable hints, set ENABLE_INDEX_HINTS=true and ensure indexes are created
  const transactions = await transactionDAO.find(query, {
    limit: queryLimit + 1, // Fetch one extra to determine if there's a next page
    sort: sortObj,
    indexHint: null, // Disabled for now - let MongoDB choose the best index
    useReadReplica: true,
  });

  // Build pagination metadata
  const pagination = buildPaginationMetadata(transactions, queryLimit);
  const results = pagination.hasMore ? transactions.slice(0, queryLimit) : transactions;

  logger.debug('Transactions query executed', {
    walletId,
    limit: queryLimit,
    returned: results.length,
    hasMore: pagination.hasMore,
  });

  return {
    transactions: results,
    pagination,
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
    if (parseFloat(initialBalance) > 0) {
      await transactionDAO.create({
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

    return walletDoc;
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
