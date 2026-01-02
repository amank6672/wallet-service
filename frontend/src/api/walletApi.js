const BASE_URL = 'http://localhost:3000';

export async function setupWallet(payload) {
  const res = await fetch(`${BASE_URL}/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getWallet(id) {
  return fetch(`${BASE_URL}/wallet/${id}`).then(r => r.json());
}

export async function transact(walletId, payload) {
  const res = await fetch(`${BASE_URL}/transact/${walletId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getTransactions(walletId, skip = 0, limit = 10) {
  return fetch(
    `${BASE_URL}/transactions?walletId=${walletId}&skip=${skip}&limit=${limit}`
  ).then(r => r.json());
}

export function exportCSV(walletId) {
  window.location.href =
    `${BASE_URL}/transactions/export/csv?walletId=${walletId}`;
}
