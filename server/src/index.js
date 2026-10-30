import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/authRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sseRoutes from './routes/sseRoutes.js';

dotenv.config();

// Initialize DB schema on boot
initDatabase();

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
