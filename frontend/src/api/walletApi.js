import { apiClient } from '../utils/apiClient.js';

/**
 * Setup a new wallet
 */
export async function setupWallet(payload, signal) {
  return apiClient.post('/setup', payload, { signal });
}

/**
 * Get wallet by ID
 */
export async function getWallet(id, signal) {
  return apiClient.get(`/wallet/${id}`, { signal });
}

/**
 * Process a transaction
 * @param {string} walletId - Wallet ID
 * @param {object} payload - Transaction payload
 * @param {number} payload.amount - Transaction amount
 * @param {string} payload.description - Transaction description
 * @param {string} payload.idempotencyKey - Optional idempotency key
 * @param {AbortSignal} signal - Abort signal for request cancellation
 */
export async function transact(walletId, payload, signal) {
  const headers = {};
  if (payload.idempotencyKey) {
    headers['X-Idempotency-Key'] = payload.idempotencyKey;
  }

  return apiClient.post(
    `/transact/${walletId}`,
    {
      amount: payload.amount,
      description: payload.description,
      idempotencyKey: payload.idempotencyKey,
    },
    { headers, signal }
  );
}

/**
 * Get transactions with skip/limit pagination
 * @param {string} walletId - Wallet ID
 * @param {object} options - Query options
 * @param {number} options.skip - Number of transactions to skip
 * @param {number} options.limit - Number of transactions to fetch
 * @param {string} options.sortBy - Field to sort by (date or amount)
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {AbortSignal} signal - Abort signal for request cancellation
 */
export async function getTransactions(walletId, options = {}, signal) {
  const { skip = 0, limit = 25, sortBy = 'date', sortOrder = 'desc' } = options;
  const params = new URLSearchParams({
    walletId,
    skip: skip.toString(),
    limit: limit.toString(),
  });
  
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  
  return apiClient.get(`/transactions?${params.toString()}`, { signal });
}

/**
 * Export transactions as CSV
 */
export function exportCSV(walletId) {
  window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/wallet'}/transactions/export/csv?walletId=${walletId}`;
}
