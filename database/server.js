// Main Server File with JWT Authentication Integration
// File: database/server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { dbConnection } = require('./connection');
const EnvironmentSetup = require('../config/envSetup');
const authRoutes = require('../routes/auth');
const { cleanupExpiredSessions } = require('../middleware/auth');

// Initialize environment configuration first
async function initializeEnvironment() {
  try {
    console.log('🔧 Initializing environment configuration...');
    await EnvironmentSetup.init();
    console.log('✅ Environment configuration loaded successfully');
  } catch (error) {
    console.error('💥 Failed to initialize environment:', error);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize environment first
    await initializeEnvironment();
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await dbConnection.connect();
    console.log('✅ MongoDB connection established');

    // Create Express app
    const app = express();

    // Trust proxy (for accurate IP addresses in logs and rate limiting)
    app.set('trust proxy', 1);

    // Compression middleware
    app.use(compression());

    // Request logging
    if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
      const logFormat = process.env.NODE_ENV === 'production' 
        ? 'combined' 
        : 'dev';
      app.use(morgan(logFormat));
    }

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // Body parsing middleware
    app.use(express.json({ 
      limit: process.env.MAX_REQUEST_SIZE || '10mb'
    }));
    app.use(express.urlencoded({ 
      extended: true, 
      limit: process.env.MAX_REQUEST_SIZE || '10mb' 
    }));

    // CORS configuration
    const corsOptions = {
      origin: function (origin, callback) {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked request from origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin'
      ],
      maxAge: 86400 // Cache preflight response for 24 hours
    };
    app.use(cors(corsOptions));

    // Rate limiting for API endpoints
    if (process.env.ENABLE_RATE_LIMITING === 'true') {
      const generalLimiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
          // Skip rate limiting for health checks and static assets
          return req.path === '/api/health' || req.path.startsWith('/static');
        }
      });
      app.use('/api/', generalLimiter);
    }

    // Routes
    app.use('/api/auth', authRoutes);

    // Health check endpoint (before any rate limiting)
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'CityGuardian API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        mongodb: dbConnection.client ? 'connected' : 'disconnected'
      });
    });

    // API documentation endpoint
    app.get('/api/docs', (req, res) => {
      res.json({
        service: 'CityGuardian API',
        version: '1.0.0',
        documentation: 'https://docs.cityguardian.app',
        endpoints: {
          authentication: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            refresh: 'POST /api/auth/refresh',
            logout: 'POST /api/auth/logout',
            profile: 'GET /api/auth/profile'
          },
          examples: {
            protected: {
              citizenOnly: 'GET /api/auth/protected/citizen-only',
              employeeOnly: 'GET /api/auth/protected/employee-only',
              managerOnly: 'GET /api/auth/protected/manager-only',
              multiRole: 'GET /api/auth/protected/multi-role',
              zoneAccess: 'GET /api/auth/protected/zone/:zone'
            }
          },
          utilities: {
            health: 'GET /api/health',
            verify: 'GET /api/auth/verify',
            sessions: 'GET /api/auth/sessions'
          }
        }
      });
    });

    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'ENDPOINT_NOT_FOUND',
        message: `API endpoint ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: '/api/docs'
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      
      // CORS error
      if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
          success: false,
          error: 'CORS_ERROR',
          message: 'Cross-origin request blocked'
        });
      }

      // JWT errors
      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Invalid or missing authentication token'
        });
      }

      // Validation errors
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: err.message
        });
      }

      // Default error response
      res.status(500).json({ 
        success: false,
        error: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Setup periodic cleanup of expired sessions
    const cleanupInterval = setInterval(async () => {
      try {
        await cleanupExpiredSessions();
      } catch (error) {
        console.error('Error during session cleanup:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Start the server
    const server = app.listen(PORT, () => {
      console.log('🎉 CityGuardian API Server Started Successfully!');
      console.log('═══════════════════════════════════════════');
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
      console.log(`🗄️  MongoDB: ${dbConnection.client ? '✅ Connected' : '❌ Disconnected'}`);
      console.log('═══════════════════════════════════════════');
      
      // Log available authentication endpoints
      console.log('🔑 Authentication Endpoints:');
      console.log('   POST /api/auth/register - User registration');
      console.log('   POST /api/auth/login    - User login');
      console.log('   POST /api/auth/refresh  - Refresh token');
      console.log('   POST /api/auth/logout   - User logout');
      console.log('   GET  /api/auth/profile  - Get user profile');
      console.log('   GET  /api/auth/verify   - Verify token');
      console.log('');
      console.log('🛡️  Protected Route Examples:');
      console.log('   GET /api/auth/protected/citizen-only');
      console.log('   GET /api/auth/protected/employee-only');
      console.log('   GET /api/auth/protected/manager-only');
      console.log('   GET /api/auth/protected/zone/:zone');
      console.log('═══════════════════════════════════════════');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`🛑 ${signal} received, shutting down gracefully...`);
      
      // Clear cleanup interval
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
      
      // Close server
      server.close(async () => {
        try {
          // Disconnect from database
          await dbConnection.disconnect();
          console.log('✅ Database connection closed');
          
          console.log('✅ Server shut down gracefully');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.log('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();