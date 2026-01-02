import Transaction from '../models/Transaction.js';
import { logger, logDbOperation } from '../utils/logger.js';
import { getReadPreference } from '../db.js';
import mongoose from 'mongoose';

/**
 * Transaction Data Access Object
 * Centralizes all transaction database operations
 * Optimized for high-scale queries with proper indexes
 */
class TransactionDAO {
  /**
   * Find transactions with skip/limit pagination
   * Optimized with indexes, lean queries, and read replicas
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options
   * @param {number} options.skip - Number of documents to skip
   * @param {number} options.limit - Number of results
   * @param {Object} options.sort - Sort object
   * @param {string} options.indexHint - Index hint for query optimization
   * @param {Object} options.session - MongoDB session
   * @param {boolean} options.useReadReplica - Use read replica
   * @returns {Promise<Object[]>} Array of transaction documents
   */
  async find(query, options = {}) {
    const {
      skip = 0,
      limit = 50,
      sort = { createdAt: -1 },
      indexHint = null,
      session = null,
      useReadReplica = true,
    } = options;
    
    return logDbOperation('transactionDAO.find', async () => {
      const queryBuilder = Transaction.find(query)
        .select('walletId amount balance description type createdAt')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(10000);
      
      // Use read replica for read operations
      if (useReadReplica) {
        const readPreference = getReadPreference(true);
        queryBuilder.read(readPreference);
      }
      
      if (session) {
        queryBuilder.session(session);
      }
      
      return await queryBuilder;
    });
  }

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @param {Object} options - Create options
   * @param {Object} options.session - MongoDB session
   * @returns {Promise<Object>} Created transaction document
   */
  async create(transactionData, options = {}) {
    const { session = null } = options;
    
    return logDbOperation('transactionDAO.create', async () => {
      const createOptions = session ? { session } : {};
      
      // Limit description length
      const description = (transactionData.description || '').trim().substring(0, 1000);
      
      const transactions = await Transaction.create([{
        walletId: transactionData.walletId,
        amount: transactionData.amount,
        balance: transactionData.balance,
        description,
        type: transactionData.type,
      }], createOptions);
      
      return transactions[0];
    });
  }

  /**
   * Count transactions matching query
   * Use with caution - can be slow for large datasets
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options
   * @returns {Promise<number>} Count of matching documents
   */
  async count(query, options = {}) {
    const { useReadReplica = true } = options;
    
    return logDbOperation('transactionDAO.count', async () => {
      const countQuery = Transaction.countDocuments(query)
        .maxTimeMS(5000);
      
      if (useReadReplica) {
        const readPreference = getReadPreference(true);
        countQuery.read(readPreference);
      }
      
      return await countQuery;
    });
  }

  /**
   * Find transaction by ID
   * @param {string} transactionId - Transaction ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Transaction document or null
   */
  async findById(transactionId, options = {}) {
    const { useReadReplica = true } = options;
    
    return logDbOperation('transactionDAO.findById', async () => {
      const query = Transaction.findById(transactionId)
        .lean()
        .maxTimeMS(5000);
      
      if (useReadReplica) {
        const readPreference = getReadPreference(true);
        query.read(readPreference);
      }
      
      return await query;
    });
  }

  /**
   * Find transactions by wallet IDs (batch operation)
   * Useful for bulk queries
   * @param {string[]} walletIds - Array of wallet IDs
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit per wallet
   * @returns {Promise<Object[]>} Array of transaction documents
   */
  async findByWalletIds(walletIds, options = {}) {
    const { limit = 50, useReadReplica = true } = options;
    
    return logDbOperation('transactionDAO.findByWalletIds', async () => {
      const query = Transaction.find({
        walletId: { $in: walletIds },
      })
        .select('walletId amount balance description type createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .maxTimeMS(10000);
      
      if (useReadReplica) {
        const readPreference = getReadPreference(true);
        query.read(readPreference);
      }
      
      return await query;
    });
  }

  /**
   * Get index hint based on query parameters
   * Helps MongoDB use the optimal index
   * @param {Object} params - Query parameters
   * @param {string} params.walletId - Wallet ID
   * @param {string} params.type - Transaction type
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order
   * @returns {string|null} Index hint name or null
   */
  getIndexHint(params) {
    const { walletId, type, sortBy, sortOrder } = params;
    
    if (!walletId || sortBy !== 'createdAt') {
      return null;
    }
    
    if (type && sortOrder === 'desc') {
      return 'walletId_type_createdAt_desc';
    }
    if (type && sortOrder === 'asc') {
      return 'walletId_type_createdAt_asc';
    }
    if (sortOrder === 'desc') {
      return 'walletId_createdAt_desc';
    }
    if (sortOrder === 'asc') {
      return 'walletId_createdAt_asc';
    }
    
    return null;
  }
}

// Export singleton instance
export default new TransactionDAO();

