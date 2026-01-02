import express from 'express';
import cors from 'cors';
import walletRoutes from './routes/walletRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(walletRoutes);

export default app;
