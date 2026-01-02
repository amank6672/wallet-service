import mongoose from 'mongoose';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Idempotency from '../models/Idempotency.js';
import { toDecimal } from '../utils/decimal.js';
import { logger } from '../utils/logger.js';

export async function transact(walletId, amount, description, idempotencyKey) {
  // idempotency guard (DB-side)
  if (idempotencyKey) {
    try {
      await Idempotency.create({ key: idempotencyKey, status: 'processing' });
    } catch (e) {
      // duplicate key -> already processing or done
      const rec = await Idempotency.findOne({ key: idempotencyKey });
      if (rec?.status === 'done') {
        logger.info('Idempotent result returned', { key: idempotencyKey });
        return rec.result;
      }
      // If processing, short-circuit with a clear error so caller can retry/wait
      const err = new Error('Request already in-flight');
      err.status = 409;
      throw err;
    }
  }

  try {
    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      const err = new Error('Wallet not found');
      err.status = 404;
      throw err;
    }

    const newBalance = Number(wallet.balance) + Number(amount);
    if (Number(newBalance) < 0) {
      const err = new Error('Insufficient balance');
      err.status = 400;
      throw err;
    }

    wallet.balance = newBalance;
    await wallet.save();

    const transaction = await Transaction.create({
      walletId,
      amount: Number(amount),
      balance: newBalance,
      description,
      type: amount > 0 ? 'CREDIT' : 'DEBIT'
    });

    if (idempotencyKey) {
      await Idempotency.findOneAndUpdate(
        { key: idempotencyKey },
        { status: 'done', result: transaction },
        { new: true }
      );
    }

    return transaction;
  } catch (e) {
    logger.error('transact error', { err: e?.message || e });
    throw e;
  }
}
