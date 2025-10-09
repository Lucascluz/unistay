import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import reviewsRoutes from './routes/reviews';
import locationsRoutes from './routes/locations';
import companiesRoutes from './routes/companies';
import responsesRoutes from './routes/responses';
import adminRoutes from './routes/admin';
import adminAliasRoutes from './routes/admin-aliases';
import searchRoutes from './routes/search';
import { testConnection } from './db/migrate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configure CORS to allow requests from frontend
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local port
  'http://localhost:5174', // Alternative local port
  process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash if present
].filter(Boolean); // Remove undefined values

console.log('🔐 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked origin: ${origin}`);
      console.error('   Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/responses', responsesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminAliasRoutes); // Admin alias management
app.use('/api/search', searchRoutes); // Public search with aliases

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server with database connection test
async function startServer() {
  console.log('\n🚀 Starting UniStay Backend Server\n');
  console.log('='.repeat(50));
  
  // Test database connection
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('\n⚠️  WARNING: Database connection failed!');
    console.error('   Server will start but database operations will fail.');
    console.error('   Check your DATABASE_URL in .env file\n');
  }
  
  console.log('='.repeat(50) + '\n');
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health\n`);
    
    if (dbConnected) {
      console.log('💡 Tip: Run "pnpm migrate" to update database schema\n');
    }
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
