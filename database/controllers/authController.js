/**
 * Authentication Controller for CityGuardian
 * Handles user registration, login, token generation, and refresh
 * 
 * Features:
 * - JWT token generation with embedded user data
 * - Secure password hashing with bcrypt
 * - Refresh token functionality
 * - User session management in MongoDB
 * - Input validation and sanitization
 * - Rate limiting protection
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { UserModel } = require('../models');
const { dbConnection } = require('../connection');

class AuthController {
  constructor() {
    this.userModel = new UserModel();
    
    // JWT configuration from environment
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    
    // Validate JWT secrets
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets not configured. Please run: node config/envSetup.js');
    }
  }

  /**
   * Generate JWT access token
   * @param {Object} user - User object from database
   * @returns {string} - JWT access token
   */
  generateAccessToken(user) {
    const payload = {
      userId: user._id,
      email: user.personalInfo.email,
      userType: user.userType,
      firstName: user.personalInfo.firstName,
      lastName: user.personalInfo.lastName,
      // Add role-specific data
      ...(user.userType === 'employee' && {
        zone: user.profile.zone,
        department: user.profile.department,
        employeeId: user.profile.employeeId
      }),
      ...(user.userType === 'office' && {
        managedZones: user.profile.managedZones,
        managerId: user.profile.managerId
      }),
      ...(user.userType === 'citizen' && {
        citizenId: user.profile.citizenId,
        level: user.profile.level
      })
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'cityguardian-api',
      audience: 'cityguardian-frontend'
    });
  }

  /**
   * Generate JWT refresh token
   * @param {Object} user - User object from database
   * @returns {string} - JWT refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user._id,
      userType: user.userType,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
      issuer: 'cityguardian-api',
      audience: 'cityguardian-refresh'
    });
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.bcryptRounds);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password from database
   * @returns {Promise<boolean>} - True if password matches
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Password verification failed');
    }
  }

  /**
   * Validate registration input
   * @param {Object} data - Registration data
   * @returns {Object} - Validation result
   */
  validateRegistrationData(data) {
    const errors = [];
    const { email, password, firstName, lastName, userType, phone } = data;

    // Email validation
    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Name validation
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    // User type validation
    const validUserTypes = ['citizen', 'employee', 'office', 'environmental'];
    if (!userType || !validUserTypes.includes(userType)) {
      errors.push('Invalid user type. Must be one of: ' + validUserTypes.join(', '));
    }

    // Phone validation (optional)
    if (phone && typeof phone === 'string' && !/^\+?[\d\s\-\(\)]{10,}$/.test(phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: {
        email: email?.toLowerCase().trim(),
        password,
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        userType,
        phone: phone?.trim() || ''
      }
    };
  }

  /**
   * Store refresh token in database
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to store
   * @returns {Promise<void>}
   */
  async storeRefreshToken(userId, refreshToken) {
    const db = dbConnection.getDatabase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await db.collection('refresh_tokens').insertOne({
      userId: new ObjectId(userId),
      token: refreshToken,
      createdAt: new Date(),
      expiresAt,
      isActive: true
    });
  }

  /**
   * Remove refresh token from database
   * @param {string} refreshToken - Refresh token to remove
   * @returns {Promise<void>}
   */
  async invalidateRefreshToken(refreshToken) {
    const db = dbConnection.getDatabase();
    await db.collection('refresh_tokens').updateOne(
      { token: refreshToken },
      { $set: { isActive: false, invalidatedAt: new Date() } }
    );
  }

  /**
   * Register new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      console.log('📝 Processing user registration...');

      // Validate input data
      const validation = this.validateRegistrationData(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }

      const { email, password, firstName, lastName, userType, phone } = validation.sanitizedData;

      // Check if user already exists
      const existingUser = await this.userModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Generate unique user ID
      const userId = `${userType.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      // Create user data structure
      const userData = {
        userId,
        userType,
        personalInfo: {
          firstName,
          lastName,
          email,
          phone,
          profilePicture: null,
          dateOfBirth: null,
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            coordinates: { latitude: null, longitude: null }
          }
        },
        auth: {
          password: hashedPassword,
          salt: null, // bcrypt handles salt internally
          lastLogin: null,
          loginAttempts: 0,
          isLocked: false,
          lockUntil: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          emailVerified: false,
          emailVerificationToken: null
        },
        profile: this.createUserProfile(userType),
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

      // Create user in database
      const result = await this.userModel.create(userData);

      if (!result.acknowledged) {
        throw new Error('Failed to create user in database');
      }

      console.log(`✅ User registered successfully: ${email} (${userType})`);

      // Generate tokens
      const user = await this.userModel.findById(result.insertedId);
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token
      await this.storeRefreshToken(user._id, refreshToken);

      // Update last login
      await this.userModel.updateLastLogin(user._id);

      // Prepare response (exclude sensitive data)
      const userResponse = {
        id: user._id,
        userId: user.userId,
        name: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`,
        email: user.personalInfo.email,
        userType: user.userType,
        profile: user.profile,
        createdAt: user.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.jwtExpiresIn
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during registration',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * User login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      console.log('🔐 Processing user login...');

      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await this.userModel.findByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Check if account is locked
      if (user.auth.isLocked && user.auth.lockUntil && new Date() < user.auth.lockUntil) {
        return res.status(423).json({
          success: false,
          error: 'Account is temporarily locked due to too many failed login attempts'
        });
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.auth.password);
      if (!isValidPassword) {
        // Increment login attempts
        await this.handleFailedLogin(user._id);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(user._id);

      console.log(`✅ User logged in successfully: ${email} (${user.userType})`);

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token
      await this.storeRefreshToken(user._id, refreshToken);

      // Update last login
      await this.userModel.updateLastLogin(user._id);

      // Prepare response (exclude sensitive data)
      const userResponse = {
        id: user._id,
        userId: user.userId,
        name: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`,
        email: user.personalInfo.email,
        userType: user.userType,
        profile: user.profile,
        lastLogin: new Date()
      };

      res.json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.jwtExpiresIn
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during login',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, this.jwtRefreshSecret);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token'
        });
      }

      // Check if refresh token exists and is active in database
      const db = dbConnection.getDatabase();
      const storedToken = await db.collection('refresh_tokens').findOne({
        token: refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!storedToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token not found or expired'
        });
      }

      // Get user data
      const user = await this.userModel.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        tokens: {
          accessToken: newAccessToken,
          expiresIn: this.jwtExpiresIn
        }
      });

    } catch (error) {
      console.error('❌ Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during token refresh'
      });
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Invalidate refresh token
        await this.invalidateRefreshToken(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during logout'
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object (with user from middleware)
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      const user = await this.userModel.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Remove sensitive information
      const userProfile = {
        id: user._id,
        userId: user.userId,
        userType: user.userType,
        personalInfo: {
          firstName: user.personalInfo.firstName,
          lastName: user.personalInfo.lastName,
          email: user.personalInfo.email,
          phone: user.personalInfo.phone,
          profilePicture: user.personalInfo.profilePicture,
          address: user.personalInfo.address
        },
        profile: user.profile,
        settings: user.settings,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({
        success: true,
        user: userProfile
      });

    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error fetching profile'
      });
    }
  }

  /**
   * Handle failed login attempt
   * @param {string} userId - User ID
   */
  async handleFailedLogin(userId) {
    const db = dbConnection.getDatabase();
    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 minutes

    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $inc: { 'auth.loginAttempts': 1 } },
      { returnDocument: 'after' }
    );

    if (result.value && result.value.auth.loginAttempts >= maxAttempts) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            'auth.isLocked': true,
            'auth.lockUntil': new Date(Date.now() + lockTime)
          }
        }
      );
    }
  }

  /**
   * Reset login attempts after successful login
   * @param {string} userId - User ID
   */
  async resetLoginAttempts(userId) {
    const db = dbConnection.getDatabase();
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: {
          'auth.loginAttempts': 1,
          'auth.lockUntil': 1
        },
        $set: {
          'auth.isLocked': false
        }
      }
    );
  }

  /**
   * Create user profile based on user type
   * @param {string} userType - Type of user
   * @returns {Object} - Profile object
   */
  createUserProfile(userType) {
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
          achievements: []
        };

      case 'employee':
        return {
          ...baseProfile,
          employeeId: `EMP${Date.now()}`,
          department: '',
          position: '',
          zone: '',
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
          department: '',
          position: 'Manager',
          managedZones: [],
          teamSize: 0,
          performanceRating: 0
        };

      case 'environmental':
        return {
          ...baseProfile,
          sensorId: `ENV${Date.now()}`,
          department: 'Environmental Monitoring',
          position: 'Environmental Officer',
          monitoredZones: [],
          sensorsManaged: 0
        };

      default:
        return baseProfile;
    }
  }
}

module.exports = AuthController;