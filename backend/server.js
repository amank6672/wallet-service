import { connectDB } from './db.js';
import { logger } from './utils/logger.js';
import app from './app.js';
import cluster from 'cluster';
import os from 'os';

const PORT = process.env.PORT || 3000;
const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER === 'true';

/**
 * Start server with clustering support for high throughput
 * For 10M requests/sec, you'll need:
 * - Multiple server instances behind a load balancer
 * - Database replication and sharding
 * - Redis for caching and distributed rate limiting
 * - Message queue for async processing
 */
async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      logger.info('Server running', { 
        port: PORT,
        pid: process.pid,
        cluster: cluster.isWorker ? `worker-${cluster.worker.id}` : 'master',
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { err: err.message });
    process.exit(1);
  }
}

// Cluster mode for utilizing all CPU cores
if (ENABLE_CLUSTER && cluster.isPrimary) {
  const numWorkers = parseInt(process.env.WORKERS) || os.cpus().length;
  logger.info('Starting cluster mode', { numWorkers });
  
  // Fork workers
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    logger.warn('Worker died', { 
      workerId: worker.id, 
      code, 
      signal 
    });
    // Restart worker
    cluster.fork();
  });
  
  // Handle worker online
  cluster.on('online', (worker) => {
    logger.info('Worker online', { workerId: worker.id });
  });
} else {
  // Start server in single process or worker mode
  startServer();
}
