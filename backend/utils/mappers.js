/**
 * Data Transfer Object (DTO) mappers
 * Transforms database models to API response format
 */

/**
 * Map wallet document to API response format
 * Required format: { id, balance, name, date }
 */
export function mapWalletToResponse(wallet) {
  return {
    id: wallet._id.toString(),
    balance: wallet.balance.toString(),
    name: wallet.name,
    date: wallet.createdAt,
  };
}

/**
 * Map wallet setup response with transaction ID
 * Required format: { id, balance, transactionId, name, date }
 */
export function mapWalletSetupToResponse(wallet, transactionId) {
  return {
    id: wallet._id.toString(),
    balance: wallet.balance.toString(),
    transactionId: transactionId || null,
    name: wallet.name,
    date: wallet.createdAt,
  };
}

/**
 * Map transaction document to API response format for transact endpoint
 * Required format: { balance, transactionId }
 */
export function mapTransactionToTransactResponse(transaction) {
  return {
    balance: transaction.balance.toString(),
    transactionId: transaction._id.toString(),
  };
}

/**
 * Map transaction document to API response format for transactions list
 * Required format: { id, walletId, amount, balance, description, date, type }
 */
export function mapTransactionToResponse(transaction) {
  return {
    id: transaction._id.toString(),
    walletId: transaction.walletId.toString(),
    amount: transaction.amount.toString(),
    balance: transaction.balance.toString(),
    description: transaction.description || '',
    date: transaction.createdAt,
    type: transaction.type,
  };
}

/**
 * Map multiple transactions to API response format
 */
export function mapTransactionsToResponse(transactions) {
  return transactions.map(mapTransactionToResponse);
}

