import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { initFirebase } from './config/firebase.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import accountsRoutes from './routes/accounts.js';
import roomsRoutes from './routes/rooms.js';
import schedulesRoutes from './routes/schedules.js';
import virtualOfficeRoutes from './routes/virtualOffice.js';
import deskAssignmentsRoutes from './routes/deskAssignments.js';
import uploadRoutes from './routes/upload.js';
import emailRoutes from './routes/emails.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true, // Important: Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'] // Expose Set-Cookie header for debugging
}));
app.use(cookieParser()); // Parse cookies from requests
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Firebase Admin SDK
// Check Firebase API key configuration
if (!config.firebase?.apiKey) {
  console.warn('⚠️  Firebase API key not found in environment variables');
  console.warn('   Add to backend/.env: NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key');
  console.warn('   Authentication endpoints may not work until this is configured.');
} else {
  console.log('✅ Firebase API key configured');
}

initFirebase().catch(err => {
  console.error('⚠️  Firebase Admin SDK initialization failed:', err.message);
  console.error('   Some features may not work. Check your Firebase configuration.');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Inspire Hub Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// API base route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Inspire Hub Backend API',
    version: '1.0.0',
      endpoints: {
      health: '/health',
      auth: '/api/auth',
      accounts: '/api/accounts',
      rooms: '/api/rooms',
      schedules: '/api/schedules',
      virtualOffice: '/api/virtual-office',
      deskAssignments: '/api/desk-assignments',
      upload: '/api/upload',
      emails: '/api/emails'
    }
  });
});

// Mount routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/virtual-office', virtualOfficeRoutes);
app.use('/api/desk-assignments', deskAssignmentsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/emails', emailRoutes);

// Log mounted routes
console.log('📧 Email routes mounted at /api/emails');

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

export default app;
