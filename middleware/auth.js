/**
 * JWT Authentication Middleware for CityGuardian
 * Provides token verification, route protection, and role-based access control
 * Handles token validation, user session management, and security features
 * 
 * @fileoverview Comprehensive JWT middleware with advanced security features
 */

const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { dbConnection } = require('../database/connection');

class AuthMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    this.sessionsCollection = 'user_sessions';
    this.usersCollection = 'users';
  }

  /**
   * Main JWT authentication middleware
   * Verifies JWT tokens and attaches user information to request object
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  authenticateToken = async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'ACCESS_TOKEN_REQUIRED',
          message: 'Access token is required for this endpoint'
        });
      }

      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, this.jwtSecret, {
          issuer: 'cityguardian-api',
          audience: 'cityguardian-app'
        });
      } catch (jwtError) {
        return this.handleTokenError(jwtError, res);
      }

      // Validate token session in database
      const sessionValid = await this.validateTokenSession(token, decoded.userId);
      if (!sessionValid) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_SESSION',
          message: 'Token session is invalid or expired'
        });
      }

      // Get user from database with fresh data
      const user = await this.getUserFromDatabase(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User associated with token not found'
        });
      }

      // Validate user account status
      const accountValidation = await this.validateUserAccount(user);
      if (!accountValidation.valid) {
        return res.status(401).json({
          success: false,
          error: accountValidation.reason,
          message: accountValidation.message
        });
      }

      // Update last activity
      await this.updateLastActivity(decoded.userId, token);

      // Attach user information to request object
      req.user = {
        ...decoded,
        fullUser: user // Include complete user object for advanced operations
      };
      req.token = token;

      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: 'Internal error during authentication'
      });
    }
  };

  /**
   * Optional authentication middleware
   * Attaches user info if token is valid, but doesn't require authentication
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        req.user = null;
        return next();
      }

      try {
        const decoded = jwt.verify(token, this.jwtSecret, {
          issuer: 'cityguardian-api',
          audience: 'cityguardian-app'
        });

        const user = await this.getUserFromDatabase(decoded.userId);
        if (user) {
          req.user = {
            ...decoded,
            fullUser: user
          };
          req.token = token;
          await this.updateLastActivity(decoded.userId, token);
        } else {
          req.user = null;
        }
      } catch (jwtError) {
        // Invalid token, but that's okay for optional auth
        req.user = null;
      }

      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      req.user = null;
      next();
    }
  };

  /**
   * Role-based access control middleware
   * Restricts access to specific user types
   * 
   * @param {string|Array} allowedRoles - Allowed user types
   * @returns {Function} - Middleware function
   */
  requireRole = (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required for this endpoint'
        });
      }

      const userRole = req.user.userType;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${roles.join(', ')}`
        });
      }

      next();
    };
  };

  /**
   * Zone-based access control for employees and managers
   * Restricts access to specific zones
   * 
   * @param {string} zoneParam - Parameter name containing the zone (default: 'zone')
   * @returns {Function} - Middleware function
   */
  requireZoneAccess = (zoneParam = 'zone') => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required for this endpoint'
        });
      }

      const requestedZone = req.params[zoneParam] || req.body[zoneParam] || req.query[zoneParam];
      const userType = req.user.userType;

      // Admins and environmental users have access to all zones
      if (['admin', 'environmental'].includes(userType)) {
        return next();
      }

      // Check zone access for employees and office managers
      if (userType === 'employee') {
        if (req.user.zone !== requestedZone) {
          return res.status(403).json({
            success: false,
            error: 'ZONE_ACCESS_DENIED',
            message: `Access denied to zone: ${requestedZone}`
          });
        }
      } else if (userType === 'office') {
        const managedZones = req.user.managedZones || [];
        if (!managedZones.includes(requestedZone)) {
          return res.status(403).json({
            success: false,
            error: 'ZONE_ACCESS_DENIED',
            message: `Access denied to zone: ${requestedZone}`
          });
        }
      }

      next();
    };
  };

  /**
   * Resource ownership middleware
   * Ensures users can only access their own resources
   * 
   * @param {string} userIdParam - Parameter name containing the user ID
   * @returns {Function} - Middleware function
   */
  requireOwnership = (userIdParam = 'userId') => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required for this endpoint'
        });
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
      const currentUserId = req.user.userId;

      // Allow admins and managers to access any resource
      if (['admin', 'office'].includes(req.user.userType)) {
        return next();
      }

      if (resourceUserId !== currentUserId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'RESOURCE_ACCESS_DENIED',
          message: 'You can only access your own resources'
        });
      }

      next();
    };
  };

  /**
   * Rate limiting middleware for authentication endpoints
   * Prevents brute force attacks
   * 
   * @param {number} maxAttempts - Maximum attempts per window
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Function} - Middleware function
   */
  rateLimitAuth = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();

    return (req, res, next) => {
      const key = req.ip;
      const now = Date.now();
      const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };

      // Reset counter if window has passed
      if (now > userAttempts.resetTime) {
        userAttempts.count = 0;
        userAttempts.resetTime = now + windowMs;
      }

      userAttempts.count++;
      attempts.set(key, userAttempts);

      if (userAttempts.count > maxAttempts) {
        const remainingTime = Math.ceil((userAttempts.resetTime - now) / 60000);
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many authentication attempts. Try again in ${remainingTime} minutes.`,
          retryAfter: userAttempts.resetTime
        });
      }

      // Clean up old entries periodically
      if (attempts.size > 1000) {
        for (const [key, value] of attempts) {
          if (now > value.resetTime) {
            attempts.delete(key);
          }
        }
      }

      next();
    };
  };

  /**
   * Validates token session in database
   * @param {string} token - JWT token
   * @param {string} userId - User ID
   * @returns {boolean} - True if session is valid
   */
  async validateTokenSession(token, userId) {
    try {
      const db = dbConnection.getDatabase();
      const session = await db.collection(this.sessionsCollection).findOne({
        userId: new ObjectId(userId),
        accessToken: token,
        'metadata.isActive': true,
        expiresAt: { $gt: new Date() }
      });

      return !!session;
    } catch (error) {
      console.error('Error validating token session:', error);
      return false;
    }
  }

  /**
   * Gets user from database with current information
   * @param {string} userId - User ID
   * @returns {Object|null} - User object or null
   */
  async getUserFromDatabase(userId) {
    try {
      const db = dbConnection.getDatabase();
      return await db.collection(this.usersCollection).findOne(
        { _id: new ObjectId(userId) },
        { projection: { 'auth.password': 0, 'auth.salt': 0 } }
      );
    } catch (error) {
      console.error('Error fetching user from database:', error);
      return null;
    }
  }

  /**
   * Validates user account status
   * @param {Object} user - User object
   * @returns {Object} - Validation result
   */
  async validateUserAccount(user) {
    // Check if account is active
    if (!user.status.isActive) {
      return {
        valid: false,
        reason: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive'
      };
    }

    // Check if account is locked
    if (user.auth.isLocked && user.auth.lockUntil && new Date() < user.auth.lockUntil) {
      const remainingTime = Math.ceil((user.auth.lockUntil - new Date()) / 60000);
      return {
        valid: false,
        reason: 'ACCOUNT_LOCKED',
        message: `Account is locked. Try again in ${remainingTime} minutes.`
      };
    }

    // Check email verification if required
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.auth.emailVerified) {
      return {
        valid: false,
        reason: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address'
      };
    }

    return { valid: true };
  }

  /**
   * Updates user's last activity timestamp
   * @param {string} userId - User ID
   * @param {string} token - Current token
   */
  async updateLastActivity(userId, token) {
    try {
      const db = dbConnection.getDatabase();
      
      // Update session last activity
      await db.collection(this.sessionsCollection).updateOne(
        {
          userId: new ObjectId(userId),
          accessToken: token
        },
        {
          $set: {
            'metadata.lastActivity': new Date()
          }
        }
      );

      // Update user last active date
      await db.collection(this.usersCollection).updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            'status.lastActiveDate': new Date()
          }
        }
      );
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  }

  /**
   * Handles JWT token errors
   * @param {Error} error - JWT error
   * @param {Object} res - Express response object
   */
  handleTokenError(error, res) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid access token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_NOT_ACTIVE',
        message: 'Token is not active yet'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'TOKEN_ERROR',
      message: 'Token validation failed'
    });
  }

  /**
   * Middleware to extract user info from token without requiring authentication
   * Useful for public endpoints that can be enhanced with user context
   */
  extractUserInfo = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, this.jwtSecret);
        req.userInfo = decoded;
      } catch (error) {
        // Token is invalid, but we don't care for this middleware
        req.userInfo = null;
      }
    } else {
      req.userInfo = null;
    }

    next();
  };

  /**
   * Cleanup expired sessions middleware
   * Should be called periodically to maintain database hygiene
   */
  static async cleanupExpiredSessions() {
    try {
      const db = dbConnection.getDatabase();
      const result = await db.collection('user_sessions').deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired sessions`);
      }
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export individual middleware functions for convenience
module.exports = {
  AuthMiddleware,
  authenticateToken: authMiddleware.authenticateToken,
  optionalAuth: authMiddleware.optionalAuth,
  requireRole: authMiddleware.requireRole,
  requireZoneAccess: authMiddleware.requireZoneAccess,
  requireOwnership: authMiddleware.requireOwnership,
  rateLimitAuth: authMiddleware.rateLimitAuth,
  extractUserInfo: authMiddleware.extractUserInfo,
  cleanupExpiredSessions: AuthMiddleware.cleanupExpiredSessions
};