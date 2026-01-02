import { connectDB } from './db.js';
import { logger } from './utils/logger.js';
import app from './app.js';

(async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      logger.info('Server running', { port });
    });
  } catch (err) {
    logger.error('Failed to start server', { err: err.message });
    process.exit(1);
  }
})();
