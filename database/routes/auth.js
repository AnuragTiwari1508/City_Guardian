/**
 * Authentication Routes for CityGuardian
 * Provides REST API endpoints for user authentication
 * 
 * Routes:
 * - POST /auth/register - User registration
 * - POST /auth/login - User login
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - User logout
 * - GET /auth/profile - Get current user profile
 * - GET /auth/verify - Verify token status
 * - GET /auth/protected-example - Protected route example
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const AuthController = require('../controllers/authController');
const {
  authenticate,
  requireRole,
  requireZoneAccess,
  optionalAuth,
  verifyRefreshToken,
  requireCitizen,
  requireEmployee,
  requireManager,
  requireStaff,
  requireAnyUser
} = require('../middleware/auth');

const router = express.Router();
const authController = new AuthController();

// ================================
// RATE LIMITING CONFIGURATION
// ================================

// Strict rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests
  skipSuccessfulRequests: true,
  // Custom key generator to include user agent
  keyGenerator: (req) => {
    return `${req.ip}-${req.get('User-Agent')}`;
  }
});

// Moderate rate limiting for token refresh
const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow more refresh attempts
  message: {
    success: false,
    error: 'Too many token refresh attempts, please try again later',
    code: 'REFRESH_RATE_LIMIT_EXCEEDED'
  }
});

// ================================
// INPUT VALIDATION RULES
// ================================

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('userType')
    .isIn(['citizen', 'employee', 'office', 'environmental'])
    .withMessage('Invalid user type'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Invalid phone number format')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// ================================
// UTILITY MIDDLEWARE
// ================================

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Log API requests for debugging
 */
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`🌐 [${timestamp}] ${method} ${path} - ${ip} - ${userAgent.substring(0, 50)}`);
  next();
};

// ================================
// AUTHENTICATION ROUTES
// ================================

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 * @rateLimit 10 requests per 15 minutes
 */
router.post('/register', 
  authRateLimit,
  logRequest,
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    await authController.register(req, res);
  }
);

/**
 * @route POST /auth/login
 * @desc Authenticate user and return JWT tokens
 * @access Public
 * @rateLimit 10 requests per 15 minutes
 */
router.post('/login',
  authRateLimit,
  logRequest,
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    await authController.login(req, res);
  }
);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public (requires valid refresh token)
 * @rateLimit 20 requests per 15 minutes
 */
router.post('/refresh',
  refreshRateLimit,
  logRequest,
  verifyRefreshToken,
  async (req, res) => {
    await authController.refreshToken(req, res);
  }
);

/**
 * @route POST /auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Public
 */
router.post('/logout',
  logRequest,
  async (req, res) => {
    await authController.logout(req, res);
  }
);

/**
 * @route GET /auth/profile
 * @desc Get current user profile
 * @access Private (any authenticated user)
 */
router.get('/profile',
  logRequest,
  authenticate,
  async (req, res) => {
    await authController.getProfile(req, res);
  }
);

/**
 * @route GET /auth/verify
 * @desc Verify token status and return user info
 * @access Private (any authenticated user)
 */
router.get('/verify',
  logRequest,
  authenticate,
  (req, res) => {
    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: req.user.id,
        userId: req.user.userId,
        email: req.user.email,
        userType: req.user.userType,
        fullName: req.user.fullName,
        tokenExpiresAt: req.user.tokenExpiresAt
      },
      tokenStatus: {
        isValid: true,
        issuedAt: new Date(req.user.tokenIssuedAt * 1000),
        expiresAt: new Date(req.user.tokenExpiresAt * 1000),
        timeUntilExpiry: req.user.tokenExpiresAt * 1000 - Date.now()
      }
    });
  }
);

// ================================
// PROTECTED ROUTE EXAMPLES
// ================================

/**
 * @route GET /auth/protected-example
 * @desc Example of a basic protected route
 * @access Private (any authenticated user)
 */
router.get('/protected-example',
  logRequest,
  authenticate,
  (req, res) => {
    res.json({
      success: true,
      message: `Hello ${req.user.fullName}! This is a protected route.`,
      user: {
        id: req.user.id,
        email: req.user.email,
        userType: req.user.userType
      },
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * @route GET /auth/citizen-only
 * @desc Example route accessible only to citizens
 * @access Private (citizens only)
 */
router.get('/citizen-only',
  logRequest,
  authenticate,
  requireCitizen,
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome citizen! This route is for citizens only.',
      citizenData: {
        citizenId: req.user.citizenId,
        level: req.userDetails?.profile?.level,
        pointsEarned: req.userDetails?.profile?.pointsEarned
      }
    });
  }
);

/**
 * @route GET /auth/employee-only
 * @desc Example route accessible only to employees
 * @access Private (employees only)
 */
router.get('/employee-only',
  logRequest,
  authenticate,
  requireEmployee,
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome employee! This route is for field agents only.',
      employeeData: {
        employeeId: req.user.employeeId,
        zone: req.user.zone,
        department: req.user.department,
        tasksCompleted: req.userDetails?.profile?.tasksCompleted,
        efficiency: req.userDetails?.profile?.efficiency
      }
    });
  }
);

/**
 * @route GET /auth/manager-only
 * @desc Example route accessible only to managers
 * @access Private (managers only)
 */
router.get('/manager-only',
  logRequest,
  authenticate,
  requireManager,
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome manager! This route is for office managers only.',
      managerData: {
        managerId: req.user.managerId,
        managedZones: req.user.managedZones,
        teamSize: req.userDetails?.profile?.teamSize,
        performanceRating: req.userDetails?.profile?.performanceRating
      }
    });
  }
);

/**
 * @route GET /auth/staff-only
 * @desc Example route accessible to employees and managers
 * @access Private (employees and managers only)
 */
router.get('/staff-only',
  logRequest,
  authenticate,
  requireStaff,
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome staff member! This route is for employees and managers.',
      staffData: {
        userType: req.user.userType,
        department: req.user.department,
        zone: req.user.zone || 'Multiple zones (Manager)'
      }
    });
  }
);

/**
 * @route GET /auth/zone/:zone/data
 * @desc Example route with zone-based access control
 * @access Private (users with access to the specified zone)
 */
router.get('/zone/:zone/data',
  logRequest,
  authenticate,
  requireZoneAccess('zone'),
  (req, res) => {
    const zone = req.params.zone;
    
    res.json({
      success: true,
      message: `Access granted to ${zone} data`,
      zoneData: {
        zone: zone,
        userAccess: req.user.userType,
        accessReason: req.user.userType === 'employee' 
          ? 'Assigned to this zone'
          : req.user.userType === 'office'
          ? 'Manages this zone'
          : 'Public access (citizen/environmental)'
      }
    });
  }
);

/**
 * @route GET /auth/optional-auth-example
 * @desc Example route with optional authentication
 * @access Public (enhanced with user context if authenticated)
 */
router.get('/optional-auth-example',
  logRequest,
  optionalAuth,
  (req, res) => {
    if (req.user) {
      res.json({
        success: true,
        message: `Hello ${req.user.fullName}! You are authenticated.`,
        authenticated: true,
        user: {
          email: req.user.email,
          userType: req.user.userType
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Hello anonymous user! No authentication required.',
        authenticated: false,
        publicData: {
          availableFeatures: ['view reports', 'view environmental data'],
          signupUrl: '/auth/register'
        }
      });
    }
  }
);

// ================================
// ROLE-BASED DATA ACCESS EXAMPLES
// ================================

/**
 * @route GET /auth/dashboard-data
 * @desc Get user-specific dashboard data based on role
 * @access Private (any authenticated user)
 */
router.get('/dashboard-data',
  logRequest,
  authenticate,
  async (req, res) => {
    try {
      let dashboardData = {
        user: {
          name: req.user.fullName,
          userType: req.user.userType,
          lastLogin: req.userDetails.auth.lastLogin
        }
      };

      // Add role-specific dashboard data
      switch (req.user.userType) {
        case 'citizen':
          dashboardData.citizenData = {
            reportsSubmitted: req.userDetails.profile.reportsSubmitted,
            pointsEarned: req.userDetails.profile.pointsEarned,
            impactScore: req.userDetails.profile.impactScore,
            level: req.userDetails.profile.level,
            achievements: req.userDetails.profile.achievements
          };
          break;

        case 'employee':
          dashboardData.employeeData = {
            tasksCompleted: req.userDetails.profile.tasksCompleted,
            averageCompletionTime: req.userDetails.profile.averageCompletionTime,
            efficiency: req.userDetails.profile.efficiency,
            currentStreak: req.userDetails.profile.currentStreak,
            zone: req.userDetails.profile.zone,
            rank: req.userDetails.profile.rank
          };
          break;

        case 'office':
          dashboardData.managerData = {
            managedZones: req.userDetails.profile.managedZones,
            teamSize: req.userDetails.profile.teamSize,
            performanceRating: req.userDetails.profile.performanceRating
          };
          break;

        case 'environmental':
          dashboardData.environmentalData = {
            sensorsManaged: req.userDetails.profile.sensorsManaged || 0,
            monitoredZones: req.userDetails.profile.monitoredZones || []
          };
          break;
      }

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('❌ Dashboard data error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }
);

// ================================
// ERROR HANDLING
// ================================

/**
 * Handle undefined routes in auth namespace
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Authentication endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'POST /auth/refresh',
      'POST /auth/logout',
      'GET /auth/profile',
      'GET /auth/verify',
      'GET /auth/protected-example'
    ]
  });
});

/**
 * Global error handler for auth routes
 */
router.use((error, req, res, next) => {
  console.error('❌ Auth route error:', error);

  res.status(500).json({
    success: false,
    error: 'Internal server error in authentication',
    code: 'AUTH_INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;