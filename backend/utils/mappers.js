/**
 * Data Transfer Object (DTO) mappers
 * Transforms database models to API response format
 */

/**
 * Map wallet document to API response format
 */
export function mapWalletToResponse(wallet) {
  return {
    id: wallet._id.toString(),
    name: wallet.name,
    balance: wallet.balance.toString(),
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

/**
 * Map transaction document to API response format
 */
export function mapTransactionToResponse(transaction) {
  return {
    id: transaction._id.toString(),
    walletId: transaction.walletId.toString(),
    amount: transaction.amount.toString(),
    balance: transaction.balance.toString(),
    type: transaction.type,
    description: transaction.description,
    createdAt: transaction.createdAt,
  };
}

/**
 * Map multiple transactions to API response format
 */
export function mapTransactionsToResponse(transactions) {
  return transactions.map(mapTransactionToResponse);
}

