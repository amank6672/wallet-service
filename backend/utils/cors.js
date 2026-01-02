/**
 * CORS configuration utility
 * Handles origin validation with support for:
 * - Multiple origins (comma-separated)
 * - Vercel preview URLs (auto-allows all *.vercel.app subdomains)
 * - Wildcard patterns (e.g., https://*.example.com)
 */

/**
 * Get CORS origin configuration function
 * @returns {string|Function} CORS origin value or validation function
 */
export function getCorsOrigin() {
  const corsOrigin = process.env.CORS_ORIGIN;
  
  // If not set, allow all origins (development)
  if (!corsOrigin || corsOrigin === '*') {
    return '*';
  }
  
  // Support comma-separated list of origins
  const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
  
  // Function to check if origin is allowed
  return (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin is a Vercel preview URL and we have any vercel.app origin configured
    const hasVercelOrigin = allowedOrigins.some(allowed => allowed.includes('vercel.app'));
    if (hasVercelOrigin && origin.includes('.vercel.app')) {
      // Allow all vercel.app subdomains (for preview deployments)
      return callback(null, true);
    }
    
    // Check wildcard patterns (e.g., https://*.example.com)
    const wildcardMatch = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Convert wildcard pattern to regex
        const pattern = allowedOrigin
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
          .replace(/\*/g, '.*'); // Replace * with .*
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return false;
    });
    
    if (wildcardMatch) {
      return callback(null, true);
    }
    
    // Origin not allowed
    callback(new Error('Not allowed by CORS'));
  };
}

/**
 * Get CORS options configuration
 * @returns {object} CORS options object
 */
export function getCorsOptions() {
  return {
    origin: getCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
    credentials: true,
  };
}

