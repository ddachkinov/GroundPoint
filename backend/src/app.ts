import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import { env } from './config/env';
import routes from './routes';
import { subscriptionController } from './controllers/subscription.controller';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Stripe webhook requires raw body for signature verification
// Must be registered BEFORE express.json() middleware
app.post(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => subscriptionController.handleWebhook(req, res)
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: {
      message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
});

export { app };
