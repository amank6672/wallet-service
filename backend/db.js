import mongoose from 'mongoose';
import { logger } from './utils/logger.js';
import { ensureIndexes } from './utils/ensureIndexes.js';

const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/wallet';

// Connection pool configuration optimized for 10M users and high throughput
// These settings are critical for handling millions of concurrent requests
const connectionOptions = {
  // Pool configuration - tuned for high concurrency
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 200, // Increased for high load
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 20, // Maintain warm connections
  maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME_MS) || 30000, // 30s idle timeout
  
  // Timeout configurations - critical for preventing hanging connections
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
  connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
  heartbeatFrequencyMS: parseInt(process.env.MONGO_HEARTBEAT_FREQUENCY_MS) || 10000,
  
  // Retry configuration
  retryWrites: true, // Retry writes on network errors
  retryReads: true, // Retry reads on network errors
  
  // Read preference - use 'primaryPreferred' or 'secondary' for read scaling
  // For production with read replicas, use 'primaryPreferred' to offload reads
  readPreference: process.env.MONGO_READ_PREFERENCE || 'primary',
  
  // Write concern - ensure durability
  w: process.env.MONGO_WRITE_CONCERN || 'majority', // Wait for majority of replicas
  wtimeout: parseInt(process.env.MONGO_WRITE_CONCERN_TIMEOUT_MS) || 5000,
  j: process.env.MONGO_JOURNAL === 'true', // Journal durability (slower but safer)
  
  // Compression - reduce network bandwidth
  compressors: ['zlib', 'snappy', 'zstd'],
  
  // Additional optimizations
  // Note: bufferMaxEntries and bufferCommands are deprecated in newer Mongoose versions
  // Mongoose now handles buffering automatically
  
  // Monitoring
  monitorCommands: process.env.MONGO_MONITOR_COMMANDS === 'true', // Log all commands
};

let isConnected = false;
let supportsTransactions = false;

/**
 * Check if MongoDB instance supports transactions (replica set or sharded cluster)
 */
async function checkTransactionSupport() {
  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    
    // Check if it's a replica set or mongos
    const isReplicaSet = serverStatus.repl && serverStatus.repl.setName;
    const isMongos = serverStatus.process === 'mongos';
    
    supportsTransactions = isReplicaSet || isMongos;
    
    logger.info('Transaction support check', {
      supportsTransactions,
      isReplicaSet: !!isReplicaSet,
      isMongos,
      replicaSetName: isReplicaSet ? serverStatus.repl.setName : null,
    });
    
    return supportsTransactions;
  } catch (error) {
    logger.warn('Could not determine transaction support', { error: error.message });
    supportsTransactions = false;
    return false;
  }
}

/**
 * Get read preference for queries
 * Use secondary for read-heavy operations when replicas are available
 */
export function getReadPreference(readHeavy = false) {
  if (readHeavy && supportsTransactions) {
    // If we have replica set, prefer secondary for reads
    return process.env.MONGO_READ_PREFERENCE || 'primaryPreferred';
  }
  return 'primary';
}

export async function connectDB() {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, connectionOptions);
    isConnected = true;

    // Check transaction support after connection
    await checkTransactionSupport();

    // Ensure indexes are created (runs in background)
    await ensureIndexes();

    // Connection event handlers
    mongoose.connection.on('connected', async () => {
      logger.info('MongoDB connected', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
        maxPoolSize: connectionOptions.maxPoolSize,
        minPoolSize: connectionOptions.minPoolSize,
        readPreference: connectionOptions.readPreference,
      });
      // Re-check transaction support on reconnect
      await checkTransactionSupport();
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { 
        error: err.message,
        stack: err.stack,
      });
      isConnected = false;
      supportsTransactions = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
      supportsTransactions = false;
    });

    // Monitor connection pool
    mongoose.connection.on('fullsetup', () => {
      logger.info('MongoDB connection pool fully established');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, closing MongoDB connection gracefully`);
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB shutdown', { error: err.message });
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    logger.info('Database connection established', {
      maxPoolSize: connectionOptions.maxPoolSize,
      minPoolSize: connectionOptions.minPoolSize,
      readPreference: connectionOptions.readPreference,
      writeConcern: connectionOptions.w,
      supportsTransactions,
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      stack: error.stack,
    });
    isConnected = false;
    supportsTransactions = false;
    throw error;
  }
}

export function supportsMongoTransactions() {
  return supportsTransactions;
}

export function getConnectionStatus() {
  const connection = mongoose.connection;
  return {
    isConnected,
    readyState: connection.readyState,
    readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][connection.readyState] || 'unknown',
    host: connection.host,
    port: connection.port,
    database: connection.name,
    supportsTransactions,
    maxPoolSize: connectionOptions.maxPoolSize,
    minPoolSize: connectionOptions.minPoolSize,
    readPreference: connectionOptions.readPreference,
  };
}

/**
 * Get connection pool statistics
 */
export async function getPoolStats() {
  try {
    const serverStatus = await mongoose.connection.db.admin().serverStatus();
    if (serverStatus.connections) {
      return {
        current: serverStatus.connections.current,
        available: serverStatus.connections.available,
        active: serverStatus.connections.active,
      };
    }
    return null;
  } catch (error) {
    logger.warn('Could not fetch pool stats', { error: error.message });
    return null;
  }
}
