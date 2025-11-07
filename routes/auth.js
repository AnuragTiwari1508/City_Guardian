/**
 * Authentication Routes for CityGuardian
 * Comprehensive authentication endpoints with JWT integration
 * Includes register, login, refresh token, logout, and protected route examples
 * 
 * @fileoverview Complete authentication routing with security features
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const AuthController = require('../controllers/authController');
const { 
  authenticateToken, 
  optionalAuth, 
  requireRole, 
  requireZoneAccess,
  requireOwnership,
  rateLimitAuth 
} = require('../middleware/auth');
const { UserModel, UserSessionModel, AuditLogModel } = require('../database/models');

const router = express.Router();
const authController = new AuthController();
const userModel = new UserModel();
const sessionModel = new UserSessionModel();
const auditModel = new AuditLogModel();

// Rate limiting configuration for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for general endpoints
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.'
  }
});

// Validation middleware
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
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
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      details: errors.array()
    });
  }
  next();
};

// =================================
// AUTHENTICATION ENDPOINTS
// =================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @example
 * POST /api/auth/register
 * {
 *   "email": "john.doe@example.com",
 *   "password": "SecurePass123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "userType": "citizen",
 *   "phone": "+1-555-123-4567"
 * }
 */
router.post('/register', 
  authRateLimit,
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Log registration attempt
      await auditModel.logAuthEvent(null, 'register_attempt', {
        email: req.body.email,
        userType: req.body.userType
      }, 'attempted', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      await authController.register(req, res);
    } catch (error) {
      console.error('Registration route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and generate JWT tokens
 * @access  Public
 * @example
 * POST /api/auth/login
 * {
 *   "email": "john.doe@example.com",
 *   "password": "SecurePass123"
 * }
 */
router.post('/login',
  authRateLimit,
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Log login attempt
      await auditModel.logAuthEvent(null, 'login_attempt', {
        email: req.body.email
      }, 'attempted', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      await authController.login(req, res);
    } catch (error) {
      console.error('Login route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @example
 * POST /api/auth/refresh
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post('/refresh',
  generalRateLimit,
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      await authController.refreshToken(req, res);
    } catch (error) {
      console.error('Refresh token route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Protected
 */
router.post('/logout',
  authenticateToken,
  async (req, res) => {
    try {
      // Log logout
      await auditModel.logAuthEvent(req.user.userId, 'logout', {}, 'success', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      await authController.logout(req, res);
    } catch (error) {
      console.error('Logout route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (invalidate all sessions)
 * @access  Protected
 */
router.post('/logout-all',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // Invalidate all user sessions
      await sessionModel.invalidateAllUserSessions(userId);
      
      // Log logout all
      await auditModel.logAuthEvent(userId, 'logout_all', {}, 'success', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      console.error('Logout all route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

// =================================
// USER PROFILE ENDPOINTS
// =================================

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Protected
 */
router.get('/profile',
  authenticateToken,
  async (req, res) => {
    try {
      await authController.getProfile(req, res);
    } catch (error) {
      console.error('Get profile route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.put('/profile',
  authenticateToken,
  [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
    body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/)
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const updateData = {};

      // Only update allowed fields
      const allowedFields = ['firstName', 'lastName', 'phone'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[`personalInfo.${field}`] = req.body[field];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'NO_UPDATES',
          message: 'No valid fields provided for update'
        });
      }

      const result = await userModel.updateProfile(userId, updateData);

      if (result.modifiedCount > 0) {
        res.json({
          success: true,
          message: 'Profile updated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }
    } catch (error) {
      console.error('Update profile route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

// =================================
// SESSION MANAGEMENT ENDPOINTS
// =================================

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user's active sessions
 * @access  Protected
 */
router.get('/sessions',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const sessions = await sessionModel.findActiveByUser(userId);
      
      // Remove sensitive token information
      const safeSessions = sessions.map(session => ({
        _id: session._id,
        metadata: {
          loginTime: session.metadata.loginTime,
          lastActivity: session.metadata.lastActivity,
          ipAddress: session.metadata.ipAddress,
          userAgent: session.metadata.userAgent,
          deviceInfo: session.metadata.deviceInfo
        },
        expiresAt: session.expiresAt,
        isCurrent: session.accessToken === req.token
      }));

      res.json({
        success: true,
        sessions: safeSessions
      });
    } catch (error) {
      console.error('Get sessions route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Invalidate a specific session
 * @access  Protected
 */
router.delete('/sessions/:sessionId',
  authenticateToken,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.userId;

      // Verify the session belongs to the user
      const db = require('../database/connection').dbConnection.getDatabase();
      const session = await db.collection('user_sessions').findOne({
        _id: new require('mongodb').ObjectId(sessionId),
        userId: new require('mongodb').ObjectId(userId)
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        });
      }

      // Invalidate the session
      await sessionModel.invalidateSession(session.accessToken);

      res.json({
        success: true,
        message: 'Session invalidated successfully'
      });
    } catch (error) {
      console.error('Delete session route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

// =================================
// PROTECTED ROUTE EXAMPLES
// =================================

/**
 * @route   GET /api/auth/protected/citizen-only
 * @desc    Example endpoint accessible only to citizens
 * @access  Protected (Citizens only)
 */
router.get('/protected/citizen-only',
  authenticateToken,
  requireRole('citizen'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome, citizen!',
      user: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        userType: req.user.userType,
        citizenId: req.user.citizenId
      }
    });
  }
);

/**
 * @route   GET /api/auth/protected/employee-only
 * @desc    Example endpoint accessible only to employees
 * @access  Protected (Employees only)
 */
router.get('/protected/employee-only',
  authenticateToken,
  requireRole('employee'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome, field agent!',
      user: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        userType: req.user.userType,
        employeeId: req.user.employeeId,
        zone: req.user.zone,
        department: req.user.department
      }
    });
  }
);

/**
 * @route   GET /api/auth/protected/manager-only
 * @desc    Example endpoint accessible only to office managers
 * @access  Protected (Office managers only)
 */
router.get('/protected/manager-only',
  authenticateToken,
  requireRole('office'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome, manager!',
      user: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        userType: req.user.userType,
        managerId: req.user.managerId,
        managedZones: req.user.managedZones
      }
    });
  }
);

/**
 * @route   GET /api/auth/protected/multi-role
 * @desc    Example endpoint accessible to multiple roles
 * @access  Protected (Employees and Managers only)
 */
router.get('/protected/multi-role',
  authenticateToken,
  requireRole(['employee', 'office']),
  (req, res) => {
    res.json({
      success: true,
      message: `Welcome, ${req.user.userType}!`,
      user: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        userType: req.user.userType,
        userId: req.user.userId
      }
    });
  }
);

/**
 * @route   GET /api/auth/protected/zone/:zone
 * @desc    Example zone-based access control
 * @access  Protected (Zone-based access)
 */
router.get('/protected/zone/:zone',
  authenticateToken,
  requireRole(['employee', 'office']),
  requireZoneAccess('zone'),
  (req, res) => {
    const { zone } = req.params;
    res.json({
      success: true,
      message: `Access granted to ${zone}`,
      user: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        userType: req.user.userType,
        accessedZone: zone
      }
    });
  }
);

/**
 * @route   GET /api/auth/public-with-context
 * @desc    Example public endpoint that can use auth context if available
 * @access  Public (Optional auth)
 */
router.get('/public-with-context',
  optionalAuth,
  (req, res) => {
    const response = {
      success: true,
      message: 'This is a public endpoint',
      isAuthenticated: !!req.user
    };

    if (req.user) {
      response.user = {
        name: `${req.user.firstName} ${req.user.lastName}`,
        userType: req.user.userType
      };
    }

    res.json(response);
  }
);

// =================================
// UTILITY ENDPOINTS
// =================================

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Protected
 */
router.get('/verify',
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        userId: req.user.userId,
        email: req.user.email,
        userType: req.user.userType,
        name: `${req.user.firstName} ${req.user.lastName}`
      }
    });
  }
);

/**
 * @route   GET /api/auth/session-stats
 * @desc    Get session statistics for current user
 * @access  Protected
 */
router.get('/session-stats',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const stats = await sessionModel.getUserSessionStats(userId);
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Session stats route error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }
);

module.exports = router;