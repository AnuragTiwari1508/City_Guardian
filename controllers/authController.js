/**
 * Authentication Controller for CityGuardian
 * Handles user registration, login, and JWT token generation/management
 * Integrates with MongoDB for secure user authentication and session management
 * 
 * @fileoverview Core authentication logic with JWT token generation and validation
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { dbConnection } = require('../database/connection');

class AuthController {
  constructor() {
    this.collection = 'users';
    this.sessionsCollection = 'user_sessions';
    
    // JWT Configuration from environment
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    this.accountLockTime = parseInt(process.env.ACCOUNT_LOCK_TIME) || 300000; // 5 minutes
  }

  /**
   * Generates JWT access token with user payload
   * @param {Object} user - User object from database
   * @returns {string} - Generated JWT token
   */
  generateAccessToken(user) {
    const payload = {
      userId: user._id,
      email: user.personalInfo.email,
      userType: user.userType,
      firstName: user.personalInfo.firstName,
      lastName: user.personalInfo.lastName,
      // Include role-specific data
      ...(user.userType === 'employee' && {
        employeeId: user.profile.employeeId,
        zone: user.profile.zone,
        department: user.profile.department
      }),
      ...(user.userType === 'office' && {
        managerId: user.profile.managerId,
        managedZones: user.profile.managedZones
      }),
      ...(user.userType === 'citizen' && {
        citizenId: user.profile.citizenId,
        level: user.profile.level
      })
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'cityguardian-api',
      audience: 'cityguardian-app'
    });
  }

  /**
   * Generates refresh token for token renewal
   * @param {Object} user - User object from database
   * @returns {string} - Generated refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user._id,
      email: user.personalInfo.email,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
      issuer: 'cityguardian-api',
      audience: 'cityguardian-app'
    });
  }

  /**
   * Stores user session in MongoDB for tracking and security
   * @param {string} userId - User ID
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - Refresh token
   * @param {Object} metadata - Session metadata (IP, user agent, etc.)
   */
  async storeUserSession(userId, accessToken, refreshToken, metadata = {}) {
    try {
      const db = dbConnection.getDatabase();
      const sessionData = {
        userId: new ObjectId(userId),
        accessToken,
        refreshToken,
        metadata: {
          ipAddress: metadata.ip || null,
          userAgent: metadata.userAgent || null,
          loginTime: new Date(),
          lastActivity: new Date(),
          isActive: true,
          deviceInfo: metadata.deviceInfo || null
        },
        expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        createdAt: new Date()
      };

      // Remove old sessions for this user (keep only last 5)
      const existingSessions = await db.collection(this.sessionsCollection)
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

      if (existingSessions.length >= 5) {
        const oldSessionIds = existingSessions.slice(4).map(s => s._id);
        await db.collection(this.sessionsCollection)
          .deleteMany({ _id: { $in: oldSessionIds } });
      }

      const result = await db.collection(this.sessionsCollection).insertOne(sessionData);
      return result.insertedId;
    } catch (error) {
      console.error('Error storing user session:', error);
      throw error;
    }
  }

  /**
   * Validates user account (not locked, email verified, etc.)
   * @param {Object} user - User object from database
   * @returns {Object} - Validation result
   */
  validateUserAccount(user) {
    // Check if account is locked
    if (user.auth.isLocked && user.auth.lockUntil && new Date() < user.auth.lockUntil) {
      const remainingTime = Math.ceil((user.auth.lockUntil - new Date()) / 60000);
      return {
        valid: false,
        reason: 'ACCOUNT_LOCKED',
        message: `Account is locked. Try again in ${remainingTime} minutes.`
      };
    }

    // Check if email is verified (if required)
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.auth.emailVerified) {
      return {
        valid: false,
        reason: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in.'
      };
    }

    // Check if account is active
    if (!user.status.isActive) {
      return {
        valid: false,
        reason: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive. Please contact support.'
      };
    }

    return { valid: true };
  }

  /**
   * Handles failed login attempts and account locking
   * @param {string} userId - User ID
   */
  async handleFailedLoginAttempt(userId) {
    try {
      const db = dbConnection.getDatabase();
      const user = await db.collection(this.collection).findOne({ _id: new ObjectId(userId) });
      
      if (!user) return;

      const attempts = (user.auth.loginAttempts || 0) + 1;
      const updateData = {
        'auth.loginAttempts': attempts,
        'auth.lastFailedLogin': new Date()
      };

      // Lock account if max attempts reached
      if (attempts >= this.maxLoginAttempts) {
        updateData['auth.isLocked'] = true;
        updateData['auth.lockUntil'] = new Date(Date.now() + this.accountLockTime);
      }

      await db.collection(this.collection).updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
    } catch (error) {
      console.error('Error handling failed login attempt:', error);
    }
  }

  /**
   * Resets login attempts after successful login
   * @param {string} userId - User ID
   */
  async resetLoginAttempts(userId) {
    try {
      const db = dbConnection.getDatabase();
      await db.collection(this.collection).updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            'auth.loginAttempts': 0,
            'auth.lastLogin': new Date(),
            'auth.isLocked': false,
            'status.lastActiveDate': new Date()
          },
          $unset: {
            'auth.lockUntil': 1,
            'auth.lastFailedLogin': 1
          }
        }
      );
    } catch (error) {
      console.error('Error resetting login attempts:', error);
    }
  }

  /**
   * Register new user with secure password hashing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        userType, 
        phone,
        zone, // For employees
        department // For employees
      } = req.body;

      // Input validation
      if (!email || !password || !firstName || !lastName || !userType) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'All required fields must be provided',
          required: ['email', 'password', 'firstName', 'lastName', 'userType']
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address'
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long'
        });
      }

      // Validate user type
      const validUserTypes = ['citizen', 'employee', 'office', 'environmental'];
      if (!validUserTypes.includes(userType)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_USER_TYPE',
          message: 'Invalid user type provided'
        });
      }

      const db = dbConnection.getDatabase();

      // Check if user already exists
      const existingUser = await db.collection(this.collection).findOne({
        'personalInfo.email': email.toLowerCase()
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'USER_EXISTS',
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.bcryptRounds);

      // Generate unique user ID
      const userId = `${userType.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      // Prepare user data
      const userData = {
        userId,
        userType: userType.toLowerCase(),
        personalInfo: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase(),
          phone: phone || '',
          profilePicture: null,
          dateOfBirth: null,
          address: {}
        },
        auth: {
          password: hashedPassword,
          salt: null, // bcrypt handles salting internally
          loginAttempts: 0,
          isLocked: false,
          lockUntil: null,
          lastLogin: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          emailVerified: process.env.REQUIRE_EMAIL_VERIFICATION !== 'true', // Auto-verify in development
          emailVerificationToken: null,
          twoFactorEnabled: false
        },
        profile: this.generateUserProfile(userType, { zone, department }),
        settings: {
          notifications: {
            email: true,
            push: true,
            sms: false,
            taskUpdates: true,
            communityUpdates: true
          },
          privacy: {
            profileVisible: true,
            locationSharing: true,
            activityVisible: true
          },
          theme: 'dark'
        },
        status: {
          isActive: true,
          lastActiveDate: new Date(),
          currentStatus: 'online'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert user into database
      const result = await db.collection(this.collection).insertOne(userData);

      if (result.acknowledged) {
        // Generate tokens
        const user = { ...userData, _id: result.insertedId };
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Store session
        await this.storeUserSession(result.insertedId, accessToken, refreshToken, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Remove sensitive information from response
        delete user.auth.password;
        delete user.auth.salt;

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          user: {
            id: result.insertedId,
            userId: user.userId,
            name: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`,
            email: user.personalInfo.email,
            userType: user.userType,
            profile: user.profile
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: this.jwtExpiresIn
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'REGISTRATION_FAILED',
          message: 'Failed to create user account'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error during registration'
      });
    }
  }

  /**
   * User login with JWT token generation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        });
      }

      const db = dbConnection.getDatabase();

      // Find user by email
      const user = await db.collection(this.collection).findOne({
        'personalInfo.email': email.toLowerCase()
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        });
      }

      // Validate user account
      const validation = this.validateUserAccount(user);
      if (!validation.valid) {
        return res.status(401).json({
          success: false,
          error: validation.reason,
          message: validation.message
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.auth.password);
      
      if (!isValidPassword) {
        await this.handleFailedLoginAttempt(user._id);
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        });
      }

      // Reset login attempts and update last login
      await this.resetLoginAttempts(user._id);

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store session
      await this.storeUserSession(user._id, accessToken, refreshToken, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Remove sensitive information
      delete user.auth.password;
      delete user.auth.salt;

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          userId: user.userId,
          name: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`,
          email: user.personalInfo.email,
          userType: user.userType,
          profile: user.profile,
          settings: user.settings
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.jwtExpiresIn
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error during login'
      });
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);
      
      const db = dbConnection.getDatabase();
      const user = await db.collection(this.collection).findOne({
        _id: new ObjectId(decoded.userId)
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid refresh token'
        });
      }

      // Validate user account
      const validation = this.validateUserAccount(user);
      if (!validation.valid) {
        return res.status(401).json({
          success: false,
          error: validation.reason,
          message: validation.message
        });
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update session
      await this.storeUserSession(user._id, newAccessToken, newRefreshToken, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: this.jwtExpiresIn
        }
      });

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid refresh token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Refresh token has expired'
        });
      }

      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error during token refresh'
      });
    }
  }

  /**
   * Logout user and invalidate session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const userId = req.user.userId;
      const token = req.token;

      const db = dbConnection.getDatabase();
      
      // Invalidate session
      await db.collection(this.sessionsCollection).updateOne(
        { 
          userId: new ObjectId(userId),
          accessToken: token
        },
        {
          $set: {
            'metadata.isActive': false,
            logoutTime: new Date()
          }
        }
      );

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error during logout'
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const db = dbConnection.getDatabase();

      const user = await db.collection(this.collection).findOne(
        { _id: new ObjectId(userId) },
        { projection: { 'auth.password': 0, 'auth.salt': 0 } }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generates user profile based on user type
   * @param {string} userType - Type of user
   * @param {Object} additionalData - Additional profile data
   * @returns {Object} - Generated user profile
   */
  generateUserProfile(userType, additionalData = {}) {
    const baseProfile = {};

    switch (userType) {
      case 'citizen':
        return {
          ...baseProfile,
          citizenId: `CIT${Date.now()}`,
          reportsSubmitted: 0,
          pointsEarned: 0,
          impactScore: 0,
          level: 1,
          achievements: [],
          verificationStatus: 'pending'
        };

      case 'employee':
        return {
          ...baseProfile,
          employeeId: `EMP${Date.now()}`,
          department: additionalData.department || 'General',
          position: 'Field Agent',
          zone: additionalData.zone || 'Unassigned',
          tasksCompleted: 0,
          averageCompletionTime: 0,
          efficiency: 0,
          currentStreak: 0,
          rank: 0,
          badgeLevel: 'NOVICE'
        };

      case 'office':
        return {
          ...baseProfile,
          managerId: `MGR${Date.now()}`,
          department: 'Operations',
          position: 'Zone Manager',
          managedZones: [],
          teamSize: 0,
          performanceRating: 0
        };

      case 'environmental':
        return {
          ...baseProfile,
          monitorId: `MON${Date.now()}`,
          department: 'Environmental Monitoring',
          position: 'Environmental Analyst',
          specializations: ['AQI', 'Water Quality', 'Noise Monitoring'],
          certifications: []
        };

      default:
        return baseProfile;
    }
  }
}

module.exports = AuthController;