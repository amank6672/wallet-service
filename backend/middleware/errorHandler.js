import { logger } from '../utils/logger.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';
import mongoose from 'mongoose';

/**
 * Global error handling middleware
 * Standardizes error responses across the application
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    errorCode: err.errorCode,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({
      success: false,
      error: {
        code: ERROR_CODES.RESOURCE_CONFLICT,
        message: `${field} already exists`,
        details: { field },
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Handle MongoDB connection errors
  if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
    return res.status(503).json({
      success: false,
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Database service unavailable',
        details: process.env.NODE_ENV === 'development' ? { originalError: err.message } : null,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message,
      details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

