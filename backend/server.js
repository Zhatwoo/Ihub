import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { config } from './config/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import accountsRoutes from './routes/accounts.js';
import roomsRoutes from './routes/rooms.js';
import schedulesRoutes from './routes/schedules.js';
import virtualOfficeRoutes from './routes/virtualOffice.js';
import deskAssignmentsRoutes from './routes/deskAssignments.js';
import floorsRoutes from './routes/floors.js';
import uploadRoutes from './routes/upload.js';

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
      accounts: '/api/accounts',
      rooms: '/api/rooms',
      schedules: '/api/schedules',
      virtualOffice: '/api/virtual-office',
      deskAssignments: '/api/desk-assignments',
      floors: '/api/floors',
      upload: '/api/upload'
    }
  });
});

// Mount routes
app.use('/api/accounts', accountsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/virtual-office', virtualOfficeRoutes);
app.use('/api/desk-assignments', deskAssignmentsRoutes);
app.use('/api/floors', floorsRoutes);
app.use('/api/upload', uploadRoutes);

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
