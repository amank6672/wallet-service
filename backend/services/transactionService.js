import mongoose from 'mongoose';
import walletDAO from '../daos/walletDAO.js';
import transactionDAO from '../daos/transactionDAO.js';
import { toDecimal } from '../utils/decimal.js';
import { logger, logDbOperation } from '../utils/logger.js';
import { NotFoundError, ConflictError, InsufficientBalanceError } from '../utils/errors.js';
import { supportsMongoTransactions } from '../db.js';
import { checkIdempotency, markIdempotencyDone } from './idempotencyService.js';
import Big from 'big.js';

/**
 * Validate wallet balance for transaction
 * @param {Object} wallet - Wallet document
 * @param {Big} amountDecimal - Transaction amount
 * @throws {InsufficientBalanceError} If balance would be negative
 */
function validateBalance(wallet, amountDecimal) {
  const currentBalance = new Big(wallet.balance.toString());
  const newBalance = currentBalance.plus(amountDecimal);
  
  if (newBalance.lt(0)) {
    throw new InsufficientBalanceError('Insufficient balance', {
      currentBalance: currentBalance.toString(),
      requestedAmount: amountDecimal.toString(),
    });
  }
  
  return { currentBalance, newBalance };
}

/**
 * Process transaction with idempotency support
 * Uses MongoDB transactions when available (replica set), otherwise uses atomic operations
 * Optimized for high throughput with proper error handling and timeouts
 * Uses DAOs for all data access operations
 */
export async function processTransaction(walletId, amount, description, idempotencyKey) {
  const useTransactions = supportsMongoTransactions();
  const session = useTransactions ? await mongoose.startSession() : null;
  
  try {
    // Idempotency check - must be outside transaction to avoid deadlocks
    let cachedResult = null;
    if (idempotencyKey) {
      cachedResult = await checkIdempotency(idempotencyKey);
      if (cachedResult) {
        logger.info('Idempotent request - returning cached result', {
          walletId,
          idempotencyKey,
        });
        return cachedResult;
      }
    }

    // Start transaction if supported
    if (useTransactions && session) {
      session.startTransaction({
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', wtimeout: 5000 },
        maxTimeMS: 10000, // 10 second transaction timeout
      });
    }

    const amountDecimal = new Big(amount);
    const amountValue = amountDecimal.toNumber();

    // Get wallet using DAO
    const wallet = await walletDAO.findById(walletId, {
      session: useTransactions && session ? session : null,
      useReadReplica: false, // Must read from primary for transactions
    });
    
    if (!wallet) {
      if (useTransactions && session && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw new NotFoundError('Wallet not found', 'WALLET_NOT_FOUND');
    }

    // Validate balance (throws error if insufficient)
    const { currentBalance, newBalance } = validateBalance(wallet, amountDecimal);

    // Update wallet balance atomically using DAO
    const updatedWallet = await walletDAO.updateBalance(
      walletId,
      wallet.balance, // Current balance for optimistic lock
      mongoose.Types.Decimal128.fromString(toDecimal(newBalance.toString())),
      { session: useTransactions && session ? session : null }
    );

    if (!updatedWallet) {
      if (useTransactions && session && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw new ConflictError('Wallet balance changed during transaction. Please retry.');
    }

    // Create transaction record using DAO
    const transactionType = amountValue > 0 ? 'CREDIT' : 'DEBIT';
    const transactionDoc = await transactionDAO.create({
      walletId,
      amount: toDecimal(amount),
      balance: toDecimal(newBalance.toString()),
      description,
      type: transactionType,
    }, {
      session: useTransactions && session ? session : null,
    });

    // Update idempotency record if present
    if (idempotencyKey) {
      await markIdempotencyDone(
        idempotencyKey, 
        transactionDoc, 
        useTransactions && session ? session : null
      );
    }

    // Commit transaction if using transactions
    if (useTransactions && session && session.inTransaction()) {
      await session.commitTransaction();
    }

    logger.info('Transaction completed', {
      walletId,
      amount: amountDecimal.toString(),
      transactionId: transactionDoc._id,
      usedTransactions: useTransactions,
    });

    return transactionDoc;
  } catch (error) {
    // Abort transaction on error
    if (useTransactions && session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        logger.error('Error aborting transaction', { error: abortError.message });
      }
    }

    // If it's already an AppError, re-throw it
    if (error instanceof NotFoundError || 
        error instanceof ConflictError || 
        error instanceof InsufficientBalanceError) {
      throw error;
    }

    // Log unexpected errors with full context
    logger.error('Transaction error', {
      walletId,
      amount,
      error: error.message,
      stack: error.stack,
      name: error.name,
    });

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
