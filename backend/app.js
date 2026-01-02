import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import walletRoutes from './routes/walletRoutes.js';
import { responseFormatter } from './middleware/responseFormatter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';
import { healthCheck } from './controllers/healthController.js';
import { requestContextMiddleware } from './utils/requestContext.js';
import { getCorsOptions } from './utils/cors.js';

const app = express();

// Security middleware
app.use(helmet());

// Compression middleware for better performance
app.use(compression());

// CORS configuration
app.use(cors(getCorsOptions()));

// Request context middleware (must be early in the chain)
app.use(requestContextMiddleware);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware with context
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

// Health check endpoint (before rate limiting)
app.get('/health', healthCheck);

// Rate limiting (apply to all routes except health)
app.use(rateLimiter);

// Response formatter middleware
app.use(responseFormatter);

// API routes
app.use('/api/wallet', walletRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
