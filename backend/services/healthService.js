import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { getConnectionStatus } from '../db.js';

/**
 * Get readable readyState text
 */
function getReadyStateText(readyState) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[readyState] || 'unknown';
}

/**
 * Comprehensive database health validation
 * Tests actual database operations to ensure connection is fully functional
 * This method validates the same connection methods used by the application
 * 
 * @returns {Promise<Object>} Validation results with detailed health metrics
 */
export async function validateDatabaseConnection() {
  const validationStart = Date.now();
  const results = {
    isConnected: false,
    readyState: mongoose.connection.readyState,
    readyStateText: getReadyStateText(mongoose.connection.readyState),
    host: mongoose.connection.host || null,
    port: mongoose.connection.port || null,
    database: mongoose.connection.name || null,
    pingTime: null,
    queryTime: null,
    writeTest: false,
    readTest: false,
    supportsTransactions: false,
    poolSize: null,
    errors: [],
  };

  try {
    // Test 1: Check connection state
    if (mongoose.connection.readyState !== 1) {
      results.errors.push(`Connection state is ${results.readyStateText} (expected: connected)`);
      return { ...results, validationTime: Date.now() - validationStart };
    }

    results.isConnected = true;

    // Test 2: Ping database (admin command)
    try {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      results.pingTime = Date.now() - pingStart;
    } catch (error) {
      results.errors.push(`Ping failed: ${error.message}`);
      return { ...results, validationTime: Date.now() - validationStart };
    }

    // Test 3: Test read operation (listCollections - same method used by Mongoose)
    try {
      const queryStart = Date.now();
      await mongoose.connection.db.listCollections().toArray();
      results.queryTime = Date.now() - queryStart;
      results.readTest = true;
    } catch (error) {
      results.errors.push(`Read test failed: ${error.message}`);
    }

    // Test 4: Test write capability (using a test collection)
    try {
      const testCollection = mongoose.connection.db.collection('_health_check');
      const writeStart = Date.now();
      await testCollection.insertOne({ 
        timestamp: new Date(),
        test: true 
      });
      await testCollection.deleteOne({ test: true });
      results.writeTest = true;
    } catch (error) {
      results.errors.push(`Write test failed: ${error.message}`);
    }

    // Test 5: Check connection pool status
    try {
      const serverStatus = await mongoose.connection.db.admin().serverStatus();
      if (serverStatus.connections) {
        results.poolSize = {
          current: serverStatus.connections.current,
          available: serverStatus.connections.available,
          active: serverStatus.connections.active,
        };
      }
    } catch (error) {
      // Non-critical, just log
      logger.debug('Could not fetch pool status', { error: error.message });
    }

    // Test 6: Check transaction support (same method as db.js)
    try {
      const admin = mongoose.connection.db.admin();
      const serverStatus = await admin.serverStatus();
      const isReplicaSet = serverStatus.repl && serverStatus.repl.setName;
      const isMongos = serverStatus.process === 'mongos';
      results.supportsTransactions = isReplicaSet || isMongos;
    } catch (error) {
      // Non-critical, transaction support check may fail
      logger.debug('Could not check transaction support', { error: error.message });
    }

  } catch (error) {
    results.errors.push(`Validation error: ${error.message}`);
    logger.error('Database validation failed', { error: error.message, stack: error.stack });
  }

  results.validationTime = Date.now() - validationStart;
  return results;
}

/**
 * Format database validation results for health check response
 * 
 * @param {Object} dbValidation - Validation results from validateDatabaseConnection
 * @returns {Object} Formatted database health information
 */
export function formatDatabaseHealth(dbValidation) {
  return {
    connected: dbValidation.isConnected,
    healthy: dbValidation.isConnected && 
             dbValidation.pingTime !== null && 
             dbValidation.readTest && 
             dbValidation.writeTest &&
             dbValidation.errors.length === 0,
    readyState: dbValidation.readyState,
    readyStateText: dbValidation.readyStateText,
    host: dbValidation.host,
    port: dbValidation.port,
    database: dbValidation.database,
    pingTime: dbValidation.pingTime ? `${dbValidation.pingTime}ms` : null,
    queryTime: dbValidation.queryTime ? `${dbValidation.queryTime}ms` : null,
    writeTest: dbValidation.writeTest,
    readTest: dbValidation.readTest,
    supportsTransactions: dbValidation.supportsTransactions,
    poolSize: dbValidation.poolSize,
    validationTime: `${dbValidation.validationTime}ms`,
    errors: dbValidation.errors.length > 0 ? dbValidation.errors : undefined,
  };
}

/**
 * Get overall health status
 * 
 * @param {Object} dbValidation - Validation results from validateDatabaseConnection
 * @returns {Object} Overall health status with status code
 */
export function getHealthStatus(dbValidation) {
  const isHealthy = dbValidation.isConnected && 
                    dbValidation.pingTime !== null && 
                    dbValidation.readTest && 
                    dbValidation.writeTest &&
                    dbValidation.errors.length === 0;
  
  return {
    isHealthy,
    statusCode: isHealthy ? 200 : 503,
    status: isHealthy ? 'healthy' : 'unhealthy',
  };
}

