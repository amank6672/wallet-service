import idempotencyDAO from '../daos/idempotencyDAO.js';
import { logger } from '../utils/logger.js';
import { ConflictError } from '../utils/errors.js';

/**
 * Idempotency Service
 * Business logic for idempotency handling
 * Uses DAO for data access
 */

/**
 * Check and create idempotency record
 * @param {string} idempotencyKey - Unique idempotency key
 * @returns {Promise<Object|null>} Existing result if found, null otherwise
 * @throws {ConflictError} If request is already in-flight
 */
export async function checkIdempotency(idempotencyKey) {
  try {
    // Try to create new idempotency record
    await idempotencyDAO.create(idempotencyKey, 'processing');
    return null; // New idempotency key, proceed with request
  } catch (error) {
    // Duplicate key -> already processing or done
    const existingRecord = await idempotencyDAO.findByKey(idempotencyKey);
    
    if (existingRecord?.status === 'done') {
      logger.info('Idempotent result returned', { key: idempotencyKey });
      return existingRecord.result; // Return cached result
    }
    
    // If processing, return conflict error
    throw new ConflictError('Request already in-flight', 'IDEMPOTENCY_KEY_CONFLICT');
  }
}

/**
 * Mark idempotency record as done with result
 * @param {string} idempotencyKey - Unique idempotency key
 * @param {Object} result - Result to cache
 * @param {Object} session - Optional MongoDB session
 */
export async function markIdempotencyDone(idempotencyKey, result, session = null) {
  await idempotencyDAO.update(
    idempotencyKey,
    {
      status: 'done',
      result,
    },
    { session }
  );
  
  logger.debug('Idempotency marked as done', { key: idempotencyKey });
}
