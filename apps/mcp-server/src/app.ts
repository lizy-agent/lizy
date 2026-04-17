import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import healthRouter from './routes/health';
import toolsRouter from './routes/tools';
import mcpRouter from './routes/mcp';
import adminRouter from './routes/admin';
import playgroundRouter from './routes/playground';
import a2aRouter from './routes/a2a';

const ALLOWED_ORIGINS = [
  'https://lizy.world',
  'https://www.lizy.world',
  'https://mcp.lizy.world',
  ...(config.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:3001'] : []),
];

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.mainnet.abs.xyz', 'https://rpc.abs.xyz'],
      },
    },
  }));

  // A2A discovery endpoints must be publicly accessible (no CORS restriction)
  app.use('/.well-known', cors({ origin: '*', methods: ['GET', 'OPTIONS'] }));

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Wallet-Address',
      'X-Wallet-Signature',
      'X-Wallet-Nonce',
      'X-Mpp-Session-Id',
      'X-Payment',
      'X-Admin-Secret',
    ],
    exposedHeaders: [
      'X-Quota-Used',
      'X-Quota-Limit',
      'X-Quota-Remaining',
      'X-Payment-Method',
      'X-RateLimit-Remaining-IP',
      'X-RateLimit-Remaining-Wallet',
    ],
  }));

  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));

  // Routes
  app.use('/', healthRouter);
  app.use('/', a2aRouter);
  app.use('/tools', toolsRouter);
  app.use('/', mcpRouter);
  app.use('/', playgroundRouter);
  app.use('/admin', adminRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Express Error]', err);
    res.status(500).json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message },
    });
  });

  return app;
}
