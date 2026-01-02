import { v4 as uuidv4 } from 'uuid';

/**
 * Request context for correlation IDs and tracing
 * Essential for debugging and monitoring in distributed systems
 */

// Use AsyncLocalStorage for request context (Node.js 12.17+)
// Falls back to async_hooks for older versions
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Create request context middleware
 * Adds correlation ID and request metadata to context
 */
export function requestContextMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  const requestId = uuidv4();
  const startTime = Date.now();

  // Set correlation ID in response header
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', requestId);

  const context = {
    correlationId,
    requestId,
    startTime,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  asyncLocalStorage.run(context, () => {
    next();
  });
}

/**
 * Get current request context
 */
export function getRequestContext() {
  return asyncLocalStorage.getStore() || {};
}

/**
 * Get correlation ID from context
 */
export function getCorrelationId() {
  const context = getRequestContext();
  return context.correlationId || 'unknown';
}

/**
 * Get request ID from context
 */
export function getRequestId() {
  const context = getRequestContext();
  return context.requestId || 'unknown';
}

/**
 * Add metadata to current context
 */
export function addContextMetadata(key, value) {
  const context = getRequestContext();
  if (context) {
    context[key] = value;
  }
}

