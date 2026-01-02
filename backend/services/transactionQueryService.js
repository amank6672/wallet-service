import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Build query for transaction filtering
 * Optimized for index usage
 * @param {string} walletId - Wallet ID
 * @param {string} type - Transaction type (CREDIT/DEBIT)
 * @param {string} cursor - Cursor for pagination (ISO date string)
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} MongoDB query object
 */
export function buildTransactionQuery(walletId, type, cursor, sortOrder) {
  const query = {};
  
  // Always filter by walletId if provided (required for proper index usage)
  if (walletId) {
    query.walletId = new mongoose.Types.ObjectId(walletId);
  }
  
  // Filter by type if provided
  if (type && ['CREDIT', 'DEBIT'].includes(type)) {
    query.type = type;
  }
  
  // Cursor-based pagination - optimized for index usage
  // The cursor should match the sort order for efficient queries
  if (cursor) {
    try {
      const cursorDate = new Date(cursor);
      if (isNaN(cursorDate.getTime())) {
        logger.warn('Invalid cursor date', { cursor });
      } else {
        // Use $lt for descending, $gt for ascending
        // This ensures we use the index efficiently
        if (sortOrder === 'desc') {
          query.createdAt = { $lt: cursorDate };
        } else {
          query.createdAt = { $gt: cursorDate };
        }
      }
    } catch (error) {
      logger.warn('Invalid cursor format', { cursor, error: error.message });
    }
  }
  
  return query;
}

/**
 * Validate and normalize pagination limit
 * Prevents excessive data fetching and protects against DoS
 * @param {number|string} limit - Requested limit
 * @param {number} min - Minimum limit (default: 1)
 * @param {number} max - Maximum limit (default: 1000)
 * @returns {number} Normalized limit
 */
export function normalizeLimit(limit, min = 1, max = 1000) {
  const parsed = parseInt(limit);
  if (isNaN(parsed) || parsed < min) {
    return min;
  }
  if (parsed > max) {
    logger.warn('Limit exceeded maximum', { requested: parsed, max });
    return max;
  }
  return parsed;
}

/**
 * Build pagination metadata
 * Efficiently determines if there are more results without additional query
 * @param {Array} transactions - Transaction results (includes one extra if hasMore)
 * @param {number} limit - Requested limit
 * @returns {Object} Pagination metadata
 */
export function buildPaginationMetadata(transactions, limit) {
  const hasMore = transactions.length > limit;
  const results = hasMore ? transactions.slice(0, limit) : transactions;
  
  // Generate next cursor from the last item in the returned results
  let nextCursor = null;
  if (hasMore && results.length > 0) {
    const lastItem = results[results.length - 1];
    nextCursor = lastItem.createdAt ? lastItem.createdAt.toISOString() : null;
  } else if (!hasMore && results.length > 0) {
    // Even if no more results, provide cursor for consistency
    const lastItem = results[results.length - 1];
    nextCursor = lastItem.createdAt ? lastItem.createdAt.toISOString() : null;
  }
  
  return {
    limit,
    hasMore,
    nextCursor,
    count: results.length,
  };
}

/**
 * Estimate total count for a wallet (optional - can be expensive for large datasets)
 * Use with caution - this can be slow for wallets with millions of transactions
 * Consider using approximate counts or cached values instead
 */
export async function estimateTransactionCount(walletId, type = null) {
  try {
    const query = { walletId: new mongoose.Types.ObjectId(walletId) };
    if (type && ['CREDIT', 'DEBIT'].includes(type)) {
      query.type = type;
    }
    
    // Use countDocuments with timeout
    const count = await Transaction.countDocuments(query)
      .maxTimeMS(5000)
      .lean();
    
    return count;
  } catch (error) {
    logger.warn('Failed to count transactions', { 
      walletId, 
      error: error.message 
    });
    return null;
  }
}
