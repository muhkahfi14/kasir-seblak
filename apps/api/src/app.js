import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import pg from 'pg';
import connectPgSimple from 'connect-pg-simple';
import { attachDatabasePool } from '@vercel/functions';
import env from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route Modules
import authRoutes from './modules/auth/auth.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import toppingsRoutes from './modules/toppings/toppings.routes.js';
import ingredientsRoutes from './modules/ingredients/ingredients.routes.js';
import purchasesRoutes from './modules/purchases/purchases.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import expensesRoutes from './modules/expenses/expenses.routes.js';
import capitalRoutes from './modules/capital/capital.routes.js';
import cashSessionsRoutes from './modules/cash-sessions/cash-sessions.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

const app = express();

// Sessions are stored in PostgreSQL so they survive serverless cold starts
// and are shared between Vercel Function instances.
const PgSessionStore = connectPgSimple(session);
const databaseUrl = env.DATABASE_URL;
const sessionPool = new pg.Pool({
  connectionString: databaseUrl,
  max: 3,
  idleTimeoutMillis: 10000,
  ...(/sslmode=(require|verify-ca|verify-full)/i.test(databaseUrl)
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

if (process.env.VERCEL) {
  attachDatabasePool(sessionPool);
}

// Enable trust proxy for Vite / reverse proxy
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(
  session({
    name: 'seblak_session',
    store: new PgSessionStore({
      pool: sessionPool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Server Kasir Seblak beroperasi dengan baik.',
    timestamp: new Date().toISOString(),
    service: 'kasir-seblak-api',
  });
});

// Mount Routes (authLimiter is handled inside auth.routes.js specifically on POST /login)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/toppings', toppingsRoutes);
app.use('/api/v1/ingredients', ingredientsRoutes);
app.use('/api/v1/purchases', purchasesRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/capital', capitalRoutes);
app.use('/api/v1/cash-sessions', cashSessionsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Fallback for not found routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
