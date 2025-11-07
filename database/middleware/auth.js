/**
 * JWT Authentication Middleware for CityGuardian
 * Provides token verification and route protection
 * 
 * Features:
 * - JWT token verification with error handling
 * - Role-based access control (RBAC)
 * - Token expiration handling
 * - User context injection into requests
 * - Detailed security logging
 * - Flexible permission system
 */

const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { UserModel } = require('../models');
const { dbConnection } = require('../connection');

class AuthMiddleware {
  constructor() {
    this.userModel = new UserModel();
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET not configured. Please run: node config/envSetup.js');
    }
  }

  /**
   * Extract JWT token from request headers
   * @param {Object} req - Express request object
   * @returns {string|null} - JWT token or null if not found
   */
  extractToken(req) {
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // Check query parameter (for WebSocket or special cases)
    if (req.query.token) {
      return req.query.token;
    }

    // Check cookies (if using cookie-based auth)
    if (req.cookies && req.cookies.accessToken) {
      return req.cookies.accessToken;
    }

    return null;
  }

  /**
   * Verify JWT token and decode payload
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object>} - Decoded token payload
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'cityguardian-api',
        audience: 'cityguardian-frontend'
      });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Check if user exists and is active
   * @param {string} userId - User ID from token
   * @returns {Promise<Object>} - User object if valid
   */
  async validateUser(userId) {
    try {
      const user = await this.userModel.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.status.isActive) {
        throw new Error('User account is deactivated');
      }

      if (user.auth.isLocked) {
        throw new Error('User account is locked');
      }

      return user;
    } catch (error) {
      throw new Error(`User validation failed: ${error.message}`);
    }
  }

  /**
   * Main authentication middleware
   * Verifies JWT token and injects user context into request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async authenticate(req, res, next) {
    try {
      // Extract token from request
      const token = this.extractToken(req);

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Access token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify token
      const decoded = await this.verifyToken(token);

      // Validate user
      const user = await this.validateUser(decoded.userId);

      // Update user's last activity
      await this.updateUserActivity(user._id);

      // Inject user context into request
      req.user = {
        id: user._id,
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        fullName: `${decoded.firstName} ${decoded.lastName}`,
        // Add role-specific context
        ...(decoded.zone && { zone: decoded.zone }),
        ...(decoded.department && { department: decoded.department }),
        ...(decoded.managedZones && { managedZones: decoded.managedZones }),
        ...(decoded.citizenId && { citizenId: decoded.citizenId }),
        ...(decoded.employeeId && { employeeId: decoded.employeeId }),
        ...(decoded.managerId && { managerId: decoded.managerId }),
        // Token metadata
        tokenIssuedAt: decoded.iat,
        tokenExpiresAt: decoded.exp
      };

      // Add user object to request for detailed access
      req.userDetails = user;

      console.log(`🔐 Authenticated: ${req.user.email} (${req.user.userType})`);

      next();

    } catch (error) {
      console.error('❌ Authentication failed:', error.message);

      // Determine appropriate error response
      let statusCode = 401;
      let errorCode = 'AUTH_FAILED';

      if (error.message.includes('expired')) {
        statusCode = 401;
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.message.includes('Invalid token')) {
        statusCode = 401;
        errorCode = 'TOKEN_INVALID';
      } else if (error.message.includes('User not found')) {
        statusCode = 401;
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message.includes('deactivated')) {
        statusCode = 403;
        errorCode = 'USER_DEACTIVATED';
      } else if (error.message.includes('locked')) {
        statusCode = 423;
        errorCode = 'USER_LOCKED';
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Role-based access control middleware
   * Restricts access based on user types
   * @param {Array<string>} allowedRoles - Array of allowed user types
   * @returns {Function} - Express middleware function
   */
  requireRole(allowedRoles) {
    return (req, res, next) => {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Check if user's role is allowed
      if (!allowedRoles.includes(req.user.userType)) {
        console.log(`🚫 Access denied: ${req.user.email} (${req.user.userType}) attempted to access ${allowedRoles.join(', ')} only resource`);
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: req.user.userType
        });
      }

      console.log(`✅ Role authorized: ${req.user.email} (${req.user.userType}) accessing ${allowedRoles.join(', ')} resource`);
      next();
    };
  }

  /**
   * Zone-based access control middleware
   * Restricts access based on user's assigned zones
   * @param {string} zoneParam - Request parameter containing zone name
   * @returns {Function} - Express middleware function
   */
  requireZoneAccess(zoneParam = 'zone') {
    return (req, res, next) => {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const requestedZone = req.params[zoneParam] || req.body[zoneParam] || req.query[zoneParam];

      if (!requestedZone) {
        return res.status(400).json({
          success: false,
          error: 'Zone parameter is required',
          code: 'ZONE_REQUIRED'
        });
      }

      // Office managers can access their managed zones
      if (req.user.userType === 'office' && req.user.managedZones) {
        if (!req.user.managedZones.includes(requestedZone)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied to this zone',
            code: 'ZONE_ACCESS_DENIED'
          });
        }
      }

      // Employees can only access their assigned zone
      if (req.user.userType === 'employee' && req.user.zone) {
        if (req.user.zone !== requestedZone) {
          return res.status(403).json({
            success: false,
            error: 'Access denied to this zone',
            code: 'ZONE_ACCESS_DENIED'
          });
        }
      }

      // Citizens can access any zone (for reporting)
      // Environmental users can access any zone (for monitoring)

      next();
    };
  }

  /**
   * Optional authentication middleware
   * Verifies token if present, but doesn't require it
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async optionalAuth(req, res, next) {
    const token = this.extractToken(req);

    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    try {
      // If token is provided, verify it
      const decoded = await this.verifyToken(token);
      const user = await this.validateUser(decoded.userId);

      // Inject user context
      req.user = {
        id: user._id,
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        fullName: `${decoded.firstName} ${decoded.lastName}`
      };

      req.userDetails = user;

    } catch (error) {
      // Token is invalid, but continue without authentication
      console.log(`⚠️  Optional auth failed: ${error.message}`);
    }

    next();
  }

  /**
   * Update user's last activity timestamp
   * @param {string} userId - User ID
   */
  async updateUserActivity(userId) {
    try {
      const db = dbConnection.getDatabase();
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            'status.lastActiveDate': new Date(),
            updatedAt: new Date()
          }
        }
      );
    } catch (error) {
      // Non-critical error, log but don't fail the request
      console.warn('⚠️  Failed to update user activity:', error.message);
    }
  }

  /**
   * Refresh token verification middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async verifyRefreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
          code: 'REFRESH_TOKEN_MISSING'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret, {
        issuer: 'cityguardian-api',
        audience: 'cityguardian-refresh'
      });

      // Check if refresh token exists in database
      const db = dbConnection.getDatabase();
      const storedToken = await db.collection('refresh_tokens').findOne({
        token: refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!storedToken) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token',
          code: 'REFRESH_TOKEN_INVALID'
        });
      }

      // Inject decoded token info
      req.refreshTokenData = decoded;
      next();

    } catch (error) {
      console.error('❌ Refresh token verification failed:', error.message);

      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }
  }

  /**
   * Rate limiting based on user type
   * Different limits for different user types
   * @param {Object} limits - Rate limits by user type
   * @returns {Function} - Express middleware function
   */
  rateLimitByUserType(limits = {}) {
    const defaultLimits = {
      citizen: 100,    // requests per window
      employee: 200,
      office: 500,
      environmental: 300
    };

    const finalLimits = { ...defaultLimits, ...limits };

    return (req, res, next) => {
      if (req.user && req.user.userType) {
        const userLimit = finalLimits[req.user.userType] || defaultLimits.citizen;
        req.rateLimit = { max: userLimit };
      }
      next();
    };
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
module.exports = {
  // Main authentication middleware
  authenticate: authMiddleware.authenticate.bind(authMiddleware),
  
  // Role-based access control
  requireRole: authMiddleware.requireRole.bind(authMiddleware),
  
  // Zone-based access control
  requireZoneAccess: authMiddleware.requireZoneAccess.bind(authMiddleware),
  
  // Optional authentication
  optionalAuth: authMiddleware.optionalAuth.bind(authMiddleware),
  
  // Refresh token verification
  verifyRefreshToken: authMiddleware.verifyRefreshToken.bind(authMiddleware),
  
  // Rate limiting by user type
  rateLimitByUserType: authMiddleware.rateLimitByUserType.bind(authMiddleware),
  
  // Convenience functions for specific roles
  requireCitizen: authMiddleware.requireRole.bind(authMiddleware, ['citizen']),
  requireEmployee: authMiddleware.requireRole.bind(authMiddleware, ['employee']),
  requireManager: authMiddleware.requireRole.bind(authMiddleware, ['office']),
  requireEnvMonitor: authMiddleware.requireRole.bind(authMiddleware, ['environmental']),
  
  // Multiple role access
  requireStaff: authMiddleware.requireRole.bind(authMiddleware, ['employee', 'office']),
  requireAnyUser: authMiddleware.requireRole.bind(authMiddleware, ['citizen', 'employee', 'office', 'environmental']),
  
  // Class export for advanced usage
  AuthMiddleware
};