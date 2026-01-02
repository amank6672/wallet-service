import { RateLimitError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { getCorrelationId } from '../utils/requestContext.js';

/**
 * Rate limiter middleware
 * 
 * For production at scale (10M users), use Redis-based distributed rate limiting:
 * - express-rate-limit with Redis store
 * - AWS API Gateway rate limiting
 * - Kong/Envoy rate limiting
 * - Dedicated rate limiting service
 * 
 * Current implementation is in-memory (single instance only)
 * For multi-instance deployments, MUST use Redis or similar distributed store
 */

// In-memory store (use Redis in production for distributed systems)
const requestCounts = new Map();
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute window
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100; // Max requests per window per IP

// Cleanup old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of requestCounts.entries()) {
    if (now - value.windowStart > WINDOW_MS) {
      requestCounts.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug('Rate limiter cleanup', { cleaned });
  }
}, WINDOW_MS);

/**
 * Get client identifier for rate limiting
 * In production, consider using:
 * - API key
 * - User ID (for authenticated requests)
 * - IP + User-Agent combination
 */
function getClientId(req) {
  // Priority: API key > User ID > IP
  const apiKey = req.headers['x-api-key'];
  const userId = req.user?.id; // If authentication middleware sets req.user
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (apiKey) {
    return `api_key:${apiKey}`;
  }
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${ip}`;
}

export const rateLimiter = (req, res, next) => {
  const clientId = getClientId(req);
  const now = Date.now();
  const correlationId = getCorrelationId();
  
  const record = requestCounts.get(clientId);
  
  if (!record || now - record.windowStart > WINDOW_MS) {
    // New window - reset count
    requestCounts.set(clientId, {
      count: 1,
      windowStart: now,
    });
    
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - 1);
    res.setHeader('X-RateLimit-Reset', new Date(now + WINDOW_MS).toISOString());
    
    return next();
  }
  
  if (record.count >= MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', {
      clientId: clientId.substring(0, 50), // Truncate for logging
      count: record.count,
      path: req.path,
      correlationId,
    });
    
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(record.windowStart + WINDOW_MS).toISOString());
    
    throw new RateLimitError(
      `Rate limit exceeded. Maximum ${MAX_REQUESTS} requests per ${WINDOW_MS / 1000} seconds.`,
      {
        limit: MAX_REQUESTS,
        remaining: 0,
        resetAt: new Date(record.windowStart + WINDOW_MS).toISOString(),
        windowMs: WINDOW_MS,
      }
    );
  }
  
  record.count++;
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - record.count));
  res.setHeader('X-RateLimit-Reset', new Date(record.windowStart + WINDOW_MS).toISOString());
  
  next();
};

/**
 * Create a rate limiter with custom limits
 * Useful for different endpoints with different rate limits
 */
export function createRateLimiter(maxRequests, windowMs = WINDOW_MS) {
  const customRequestCounts = new Map();
  
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of customRequestCounts.entries()) {
      if (now - value.windowStart > windowMs) {
        customRequestCounts.delete(key);
      }
    }
  }, windowMs);
  
  return (req, res, next) => {
    const clientId = getClientId(req);
    const now = Date.now();
    
    const record = customRequestCounts.get(clientId);
    
    if (!record || now - record.windowStart > windowMs) {
      customRequestCounts.set(clientId, {
        count: 1,
        windowStart: now,
      });
      return next();
    }
    
    if (record.count >= maxRequests) {
      throw new RateLimitError(
        `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        {
          limit: maxRequests,
          remaining: 0,
          resetAt: new Date(record.windowStart + windowMs).toISOString(),
        }
      );
    }
    
    record.count++;
    next();
  };
}
