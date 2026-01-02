import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { toDecimal } from '../utils/decimal.js';
import { toCSV } from '../utils/csv.js';
import { transact } from '../services/walletService.js';

export const exportCSV = async (req, res) => {
  const txs = await Transaction.find({ walletId: req.query.walletId })
    .sort({ createdAt: -1 });

  res.header('Content-Type', 'text/csv');
  res.attachment('transactions.csv');
  res.send(toCSV(txs));
};

export const setupWallet = async (req, res) => {
  const { name, balance = 0 } = req.body;

  const wallet = await Wallet.create({
    name,
    balance: toDecimal(balance)
  });

  await Transaction.create({
    walletId: wallet._id,
    amount: toDecimal(balance),
    balance: toDecimal(balance),
    description: 'Setup',
    type: 'CREDIT'
  });

  res.json({
    id: wallet._id,
    name,
    balance,
    date: wallet.createdAt
  });
};

export const transactAmount = async (req, res) => {
  const tx = await transact(
    req.params.walletId,
    req.body.amount,
    req.body.description
  );

  res.json({
    balance: tx.balance,
    transactionId: tx._id
  });
};

export const getWallet = async (req, res) => {
  const wallet = await Wallet.findById(req.params.id);
  res.json(wallet);
};

export const getTransactions = async (req, res) => {
  const { walletId, skip = 0, limit = 10 } = req.query;

  const txs = await Transaction.find({ walletId })
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit));

  res.json(txs);
};
