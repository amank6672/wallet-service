import { body, param, query } from 'express-validator';

/**
 * Validation rules for wallet setup
 */
export const walletSetupRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Balance must be a non-negative number')
    .custom((value) => {
      if (value !== undefined) {
        if (isNaN(value) || value < 0) {
          throw new Error('Balance must be a valid non-negative number');
        }
        // Check decimal precision (up to 4 decimal places)
        const numValue = parseFloat(value);
        const strValue = numValue.toString();
        const decimalPart = strValue.split('.')[1];
        if (decimalPart && decimalPart.length > 4) {
          throw new Error('Balance can have up to 4 decimal places (e.g., 20.5612)');
        }
      }
      return true;
    }),
];

/**
 * Validation rules for transaction
 */
export const transactionRules = [
  param('walletId')
    .isMongoId()
    .withMessage('Invalid wallet ID format'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat()
    .withMessage('Amount must be a valid number')
    .custom((value) => {
      if (value === 0) {
        throw new Error('Amount cannot be zero');
      }
      // Check decimal precision (up to 4 decimal places)
      const numValue = Math.abs(parseFloat(value));
      const strValue = numValue.toString();
      const decimalPart = strValue.split('.')[1];
      if (decimalPart && decimalPart.length > 4) {
        throw new Error('Amount can have up to 4 decimal places (e.g., 4.1203, 0.321, 1.0045)');
      }
      return true;
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('idempotencyKey')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Idempotency key must be between 1 and 255 characters'),
];

/**
 * Validation rules for wallet ID parameter
 */
export const walletIdRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid wallet ID format'),
];

/**
 * Validation rules for get transactions query
 */
export const getTransactionsRules = [
  query('walletId')
    .optional()
    .isMongoId()
    .withMessage('Invalid wallet ID format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
    .toInt(),
  query('cursor')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Invalid cursor format'),
];

