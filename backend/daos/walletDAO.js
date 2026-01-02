import Wallet from '../models/Wallet.js';
import { logger, logDbOperation } from '../utils/logger.js';
import { getReadPreference } from '../db.js';
import { NotFoundError } from '../utils/errors.js';
import mongoose from 'mongoose';

/**
 * Wallet Data Access Object
 * Centralizes all wallet database operations
 * Provides abstraction layer for easier optimization, caching, and testing
 */
class WalletDAO {
  /**
   * Find wallet by ID
   * Optimized with lean() and field projection
   * @param {string} walletId - Wallet ID
   * @param {Object} options - Query options
   * @param {Object} options.session - MongoDB session
   * @param {boolean} options.useReadReplica - Use read replica for reads
   * @returns {Promise<Object>} Wallet document
   * @throws {NotFoundError} If wallet not found
   */
  async findById(walletId, options = {}) {
    const { session = null, useReadReplica = false } = options;
    
    return logDbOperation('walletDAO.findById', async () => {
      const query = Wallet.findById(walletId)
        .select('name balance createdAt updatedAt')
        .lean()
        .maxTimeMS(5000);
      
      // Use read replica for read operations
      if (useReadReplica) {
        const readPreference = getReadPreference(true);
        query.read(readPreference);
      }
      
      if (session) {
        query.session(session);
      }
      
      const wallet = await query;
      
      if (!wallet) {
        throw new NotFoundError('Wallet not found', 'WALLET_NOT_FOUND');
      }
      
      return wallet;
    });
  }

  /**
   * Create a new wallet
   * @param {Object} walletData - Wallet data
   * @param {string} walletData.name - Wallet name
   * @param {mongoose.Types.Decimal128} walletData.balance - Initial balance
   * @param {Object} options - Create options
   * @param {Object} options.session - MongoDB session
   * @returns {Promise<Object>} Created wallet document
   */
  async create(walletData, options = {}) {
    const { session = null } = options;
    
    return logDbOperation('walletDAO.create', async () => {
      const createOptions = session ? { session } : {};
      
      const wallets = await Wallet.create([{
        name: walletData.name.trim(),
        balance: walletData.balance,
      }], createOptions);
      
      return wallets[0];
    });
  }

  /**
   * Update wallet balance atomically with optimistic locking
   * @param {string} walletId - Wallet ID
   * @param {mongoose.Types.Decimal128} currentBalance - Current balance (for optimistic lock)
   * @param {mongoose.Types.Decimal128} newBalance - New balance
   * @param {Object} options - Update options
   * @param {Object} options.session - MongoDB session
   * @returns {Promise<Object|null>} Updated wallet or null if optimistic lock failed
   */
  async updateBalance(walletId, currentBalance, newBalance, options = {}) {
    const { session = null } = options;
    
    return logDbOperation('walletDAO.updateBalance', async () => {
      const updateQuery = Wallet.findOneAndUpdate(
        { 
          _id: walletId,
          // Optimistic locking: ensure balance hasn't changed
          balance: currentBalance,
        },
        { 
          $set: { 
            balance: newBalance,
          },
        },
        { 
          new: true, 
          runValidators: true,
          lean: true,
        }
      ).maxTimeMS(5000);
      
      if (session) {
        updateQuery.session(session);
      }
      
      return await updateQuery;
    });
  }

  /**
   * Check if wallet exists
   * @param {string} walletId - Wallet ID
   * @returns {Promise<boolean>} True if wallet exists
   */
  async exists(walletId) {
    return logDbOperation('walletDAO.exists', async () => {
      const count = await Wallet.countDocuments({ _id: walletId })
        .maxTimeMS(2000)
        .limit(1);
      
      return count > 0;
    });
  }

  /**
   * Find wallets by IDs (batch operation)
   * Useful for bulk operations
   * @param {string[]} walletIds - Array of wallet IDs
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} Array of wallet documents
   */
  async findByIds(walletIds, options = {}) {
    const { useReadReplica = false } = options;
    
    return logDbOperation('walletDAO.findByIds', async () => {
      const query = Wallet.find({ _id: { $in: walletIds } })
        .select('name balance createdAt updatedAt')
        .lean()
        .maxTimeMS(5000);
      
      if (useReadReplica) {
        const readPreference = getReadPreference(true);
        query.read(readPreference);
      }
      
      return await query;
    });
  }
}

// Export singleton instance
export default new WalletDAO();

