import Idempotency from '../models/Idempotency.js';
import { logger, logDbOperation } from '../utils/logger.js';

/**
 * Idempotency Data Access Object
 * Centralizes idempotency key operations
 */
class IdempotencyDAO {
  /**
   * Create idempotency record
   * @param {string} key - Idempotency key
   * @param {string} status - Status (processing, done, failed)
   * @param {Object} options - Create options
   * @param {Object} options.session - MongoDB session
   * @returns {Promise<Object>} Created idempotency document
   */
  async create(key, status = 'processing', options = {}) {
    const { session = null } = options;
    
    return logDbOperation('idempotencyDAO.create', async () => {
      const createOptions = session ? { session } : {};
      
      const records = await Idempotency.create([{
        key,
        status,
      }], createOptions);
      
      return records[0];
    });
  }

  /**
   * Find idempotency record by key
   * @param {string} key - Idempotency key
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Idempotency document or null
   */
  async findByKey(key, options = {}) {
    return logDbOperation('idempotencyDAO.findByKey', async () => {
      const record = await Idempotency.findOne({ key })
        .lean()
        .maxTimeMS(2000);
      
      return record;
    });
  }

  /**
   * Update idempotency record
   * @param {string} key - Idempotency key
   * @param {Object} update - Update object
   * @param {string} update.status - New status
   * @param {Object} update.result - Result to cache
   * @param {Object} options - Update options
   * @param {Object} options.session - MongoDB session
   * @returns {Promise<Object>} Updated document
   */
  async update(key, update, options = {}) {
    const { session = null } = options;
    
    return logDbOperation('idempotencyDAO.update', async () => {
      const updateQuery = Idempotency.findOneAndUpdate(
        { key },
        { 
          $set: {
            status: update.status,
            result: update.result,
          },
        },
        { 
          new: true,
          lean: true,
        }
      ).maxTimeMS(2000);
      
      if (session) {
        updateQuery.session(session);
      }
      
      return await updateQuery;
    });
  }
}

// Export singleton instance
export default new IdempotencyDAO();

