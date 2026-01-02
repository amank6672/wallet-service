import { toCSV } from '../utils/csv.js';
import { getTransactions } from './walletService.js';
import { normalizeLimit } from './transactionQueryService.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Export transactions as CSV
 * @param {string} walletId - Wallet ID
 * @param {number} limit - Maximum number of transactions to export
 * @returns {Promise<string>} CSV content
 */
export async function exportTransactionsCSV(walletId, limit = 10000) {
  if (!walletId) {
    throw new ValidationError('walletId is required for CSV export');
  }

  // Limit export size to prevent memory issues
  const exportLimit = normalizeLimit(limit, 1, 100000);
  
  const result = await getTransactions(walletId, {
    limit: exportLimit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return toCSV(result.transactions);
}

/**
 * Generate CSV filename for export
 * @param {string} walletId - Wallet ID
 * @returns {string} Filename
 */
export function generateCSVFilename(walletId) {
  return `transactions_${walletId}_${Date.now()}.csv`;
}

