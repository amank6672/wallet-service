import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import Idempotency from '../models/Idempotency.js';
import { logger } from './logger.js';

/**
 * Ensure all indexes are created
 * Call this after database connection to ensure indexes exist
 * Indexes are created in the background to avoid blocking operations
 */
export async function ensureIndexes() {
  try {
    logger.info('Ensuring database indexes are created...');
    
    // Create indexes for all models
    // Mongoose will create indexes automatically, but we can ensure they exist
    await Promise.all([
      Transaction.createIndexes(),
      Wallet.createIndexes(),
      Idempotency.createIndexes(),
    ]);
    
    logger.info('Database indexes ensured');
  } catch (error) {
    logger.error('Error ensuring indexes', {
      error: error.message,
      stack: error.stack,
    });
    // Don't throw - indexes will be created automatically by Mongoose
  }
}

