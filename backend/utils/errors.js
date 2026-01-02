/**
 * Standardized error codes and error handling
 */

export const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  
  // Authentication/Authorization errors (401, 403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Not found errors (404)
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Conflict errors (409)
  IDEMPOTENCY_KEY_CONFLICT: 'IDEMPOTENCY_KEY_CONFLICT',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

export class AppError extends Error {
  constructor(message, statusCode, errorCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message, errorCode = ERROR_CODES.RESOURCE_NOT_FOUND, details = null) {
    super(message, 404, errorCode, details);
  }
}

export class ConflictError extends AppError {
  constructor(message, errorCode = ERROR_CODES.RESOURCE_CONFLICT, details = null) {
    super(message, 409, errorCode, details);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message = 'Insufficient balance', details = null) {
    super(message, 400, ERROR_CODES.INSUFFICIENT_BALANCE, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details = null) {
    super(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED, details);
  }
}

