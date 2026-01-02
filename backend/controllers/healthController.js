import { 
  validateDatabaseConnection, 
  formatDatabaseHealth, 
  getHealthStatus 
} from '../services/healthService.js';

/**
 * Health check controller
 * Returns comprehensive health status including database validation
 */
export const healthCheck = async (req, res) => {
  const timestamp = new Date().toISOString();
  
  // Validate database connection using inline method
  const dbValidation = await validateDatabaseConnection();
  
  // Get overall health status
  const healthStatus = getHealthStatus(dbValidation);
  
  // Format response
  res.status(healthStatus.statusCode).json({
    success: healthStatus.isHealthy,
    status: healthStatus.status,
    timestamp,
    database: formatDatabaseHealth(dbValidation),
  });
};

