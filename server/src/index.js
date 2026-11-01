import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db/database.js';
import { seed } from './db/seed.js';
import authRoutes from './routes/authRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sseRoutes from './routes/sseRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema on boot
initDatabase();

// Auto-seed if database is fresh or empty
try {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get()?.count || 0;
  if (userCount === 0) {
    console.log('[Database] Database is empty. Auto-seeding initial BookLeaf authors, books, and tickets...');
    seed();
  }
} catch (seedErr) {
  console.error('[Database Seed Warning]', seedErr.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (e.g. 5173) and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger for debugging & traceability
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/realtime')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/author', authorRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/realtime', sseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BookLeaf Author Support & Communication API',
    timestamp: new Date().toISOString()
  });
});

// API Documentation & Catalog
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'BookLeaf Author Support & Communication API Specification',
    version: '1.0.0',
    description: 'RESTful API supporting Author and Admin portals with AI auto-classification and real-time SSE updates.',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', desc: 'Authenticate with email and password' },
      { method: 'GET', path: '/api/auth/me', desc: 'Get current user profile' },
      { method: 'GET', path: '/api/auth/demo-accounts', desc: 'List of pre-seeded test accounts for quick switcher' },
      { method: 'GET', path: '/api/author/books', desc: 'Get books published by logged-in author' },
      { method: 'GET', path: '/api/author/dashboard', desc: 'Financial stats and royalty summary' },
      { method: 'GET', path: '/api/tickets/my-tickets', desc: 'Get tickets submitted by logged-in author' },
      { method: 'POST', path: '/api/tickets', desc: 'Submit a new support ticket with AI auto-classification' },
      { method: 'GET', path: '/api/tickets/:id', desc: 'Get ticket thread and conversation messages' },
      { method: 'POST', path: '/api/tickets/:id/messages', desc: 'Post a response message to ticket thread' },
      { method: 'GET', path: '/api/admin/tickets', desc: 'Get all tickets across authors with filtering and sorting' },
      { method: 'PATCH', path: '/api/admin/tickets/:id', desc: 'Update status, override AI category/priority, or assign' },
      { method: 'POST', path: '/api/admin/tickets/:id/notes', desc: 'Add internal admin note (hidden from author)' },
      { method: 'POST', path: '/api/admin/tickets/:id/regenerate-draft', desc: 'Regenerate AI draft with custom guidance' },
      { method: 'GET', path: '/api/realtime/stream', desc: 'Server-Sent Events stream for live real-time sync' }
    ]
  });
});

// Locate static frontend build directory (checks both server/public and client/dist)
let staticDir = null;
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const serverPublicPath = path.resolve(__dirname, '../public');

if (fs.existsSync(serverPublicPath)) {
  staticDir = serverPublicPath;
} else if (fs.existsSync(clientDistPath)) {
  staticDir = clientDistPath;
}

if (staticDir) {
  console.log(`[Static Files] Serving frontend from: ${staticDir}`);
  app.use(express.static(staticDir));

  // SPA fallback for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  // If static files are not present, provide a helpful dashboard at root
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>BookLeaf API Server</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fbfbfc; color: #2d2d2d; padding: 3rem 1.5rem; text-align: center; }
            .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 600px; margin: 0 auto; padding: 2.5rem; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
            h1 { color: #f16977; margin-bottom: 0.5rem; font-size: 1.5rem; }
            p { color: #64748b; line-height: 1.5; font-size: 0.95rem; }
            .links { margin-top: 1.5rem; display: flex; justify-content: center; gap: 1rem; }
            a { color: #f16977; font-weight: 600; text-decoration: none; padding: 0.5rem 1rem; border: 1px solid #fed7db; border-radius: 6px; background: #fff5f6; }
            a:hover { background: #fee2e2; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>BookLeaf API Server Online</h1>
            <p>The backend API is active and ready to accept requests.</p>
            <div class="links">
              <a href="/api/health">System Health</a>
              <a href="/api/docs">API Documentation</a>
            </div>
          </div>
        </body>
      </html>
    `);
  });
}

// Centralized meaningful error handler (prevents generic 500s)
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` BookLeaf API Server listening on port ${PORT}`);
  console.log(` API Docs available at: http://localhost:${PORT}/api/docs`);
  console.log(`=================================================`);
});
