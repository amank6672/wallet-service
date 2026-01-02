import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';
import {
  walletSetupRules,
  transactionRules,
  walletIdRules,
  getTransactionsRules,
} from '../utils/validationRules.js';

/**
 * Validation result handler middleware
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    throw new ValidationError('Validation failed', details);
  }
  next();
};

/**
 * Wallet setup validation middleware
 */
export const validateWalletSetup = [
  ...walletSetupRules,
  handleValidationErrors,
];

/**
 * Transaction validation middleware
 */
export const validateTransaction = [
  ...transactionRules,
  handleValidationErrors,
];

/**
 * Wallet ID validation middleware
 */
export const validateWalletId = [
  ...walletIdRules,
  handleValidationErrors,
];

/**
 * Get transactions validation middleware
 */
export const validateGetTransactions = [
  ...getTransactionsRules,
  handleValidationErrors,
];

