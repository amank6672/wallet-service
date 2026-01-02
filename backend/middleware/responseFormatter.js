/**
 * Response formatter middleware
 * Wraps successful responses in a standard format
 */
export const responseFormatter = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // If response already has success field, don't wrap it
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }

    // Wrap successful responses
    return originalJson.call(this, {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  };

  next();
};

