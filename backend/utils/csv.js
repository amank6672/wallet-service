export function toCSV(transactions) {
  const header = 'Date,Amount,Balance,Description,Type\n';

  const rows = transactions.map(tx =>
    `${tx.createdAt},${tx.amount},${tx.balance},${tx.description},${tx.type}`
  ).join('\n');

  return header + rows;
}
