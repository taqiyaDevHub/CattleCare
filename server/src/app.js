import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '100kb' }));

app.get('/healthz', (req, res) =>
  res.json({ ok: true, data: { app: 'CattleCare', status: 'up' } })
);
app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;