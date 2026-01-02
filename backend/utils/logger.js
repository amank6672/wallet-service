/**
 * Structured logging utility
 * Enhanced with request context and performance metrics
 */

import { getCorrelationId, getRequestId } from './requestContext.js';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Format log entry with context
 */
function formatLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const correlationId = getCorrelationId();
  const requestId = getRequestId();

  const logEntry = {
    timestamp,
    level,
    message,
    correlationId,
    requestId,
    ...data,
  };

  // In production, you might want to use a proper logging library like Winston or Pino
  // For now, we'll use console with JSON formatting
  return JSON.stringify(logEntry);
}

export const logger = {
  error(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, data));
    }
  },

  warn(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, data));
    }
  },

  info(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(formatLog('INFO', message, data));
    }
  },

  debug(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(formatLog('DEBUG', message, data));
    }
  },
};

/**
 * Log slow queries for performance monitoring
 */
export function logSlowQuery(query, duration, threshold = 1000) {
  if (duration > threshold) {
    logger.warn('Slow query detected', {
      query: query.toString(),
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
    });
  }
}

/**
 * Log database operation with timing
 */
export async function logDbOperation(operation, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow database operation', {
        operation,
        duration: `${duration}ms`,
      });
    }
    
    logger.debug('Database operation completed', {
      operation,
      duration: `${duration}ms`,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database operation failed', {
      operation,
      duration: `${duration}ms`,
      error: error.message,
    });
    throw error;
  }
}
