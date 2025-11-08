/**
 * Environment Setup Configuration for CityGuardian
 * Automatically creates JWT_SECRET and other environment variables if they don't exist
 * Ensures secure defaults and proper configuration management
 * 
 * @fileoverview This module handles environment variable initialization and validation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvironmentSetup {
  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
    this.envExamplePath = path.join(process.cwd(), '.env.example');
    this.requiredVars = {
      // MongoDB Configuration
      MONGODB_URI: 'mongodb+srv://myselfkunal8859_db_user:Br4FEbwH7krJTXvi@cluster0.opfzo7f.mongodb.net/cityguardian?appName=Cluster0',
      DB_NAME: 'cityguardian',
      
      // JWT Configuration - Generated dynamically
      JWT_SECRET: null, // Will be generated
      JWT_EXPIRES_IN: '24h',
      REFRESH_TOKEN_SECRET: null, // Will be generated
      REFRESH_TOKEN_EXPIRES_IN: '7d',
      
      // Server Configuration
      PORT: '3001',
      NODE_ENV: 'development',
      
      // Security Configuration
      BCRYPT_ROUNDS: '12',
      MAX_LOGIN_ATTEMPTS: '5',
      ACCOUNT_LOCK_TIME: '300000', // 5 minutes in milliseconds
      
      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
      RATE_LIMIT_MAX_REQUESTS: '100',
      
      // CORS Settings
      ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3001,https://cityguardian.vercel.app',
      
      // Session Configuration
      SESSION_SECRET: null, // Will be generated
      SESSION_TIMEOUT: '86400000', // 24 hours in milliseconds
      
      // File Upload Configuration
      MAX_FILE_SIZE: '10485760', // 10MB
      ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/webp,video/mp4,application/pdf',
      
      // Email Configuration (Optional)
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '587',
      EMAIL_USER: '',
      EMAIL_PASS: '',
      EMAIL_FROM: 'noreply@cityguardian.app',
      
      // Features Toggle
      ENABLE_EMAIL_NOTIFICATIONS: 'true',
      ENABLE_PUSH_NOTIFICATIONS: 'true',
      ENABLE_FILE_UPLOAD: 'true',
      ENABLE_RATE_LIMITING: 'true',
      
      // Monitoring and Logging
      LOG_LEVEL: 'info',
      ENABLE_REQUEST_LOGGING: 'true',
      
      // Environmental Data Configuration
      AQI_UPDATE_INTERVAL: '300000', // 5 minutes
      SENSOR_TIMEOUT: '30000', // 30 seconds
      
      // Notification Configuration
      NOTIFICATION_BATCH_SIZE: '50',
      NOTIFICATION_RETRY_ATTEMPTS: '3'
    };
  }

  /**
   * Generates a cryptographically secure random string
   * @param {number} length - Length of the generated string
   * @returns {string} - Generated secure string
   */
  generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Reads existing .env file and returns parsed variables
   * @returns {Object} - Parsed environment variables
   */
  readExistingEnv() {
    if (!fs.existsSync(this.envPath)) {
      return {};
    }

    try {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      });

      return envVars;
    } catch (error) {
      console.warn('Warning: Could not read existing .env file:', error.message);
      return {};
    }
  }

  /**
   * Generates the complete environment configuration
   * @returns {Object} - Complete environment configuration
   */
  generateEnvConfig() {
    const existingEnv = this.readExistingEnv();
    const config = { ...this.requiredVars };

    // Generate secure secrets if they don't exist
    if (!existingEnv.JWT_SECRET) {
      config.JWT_SECRET = this.generateSecureSecret(64);
      console.log('🔐 Generated new JWT_SECRET');
    } else {
      config.JWT_SECRET = existingEnv.JWT_SECRET;
    }

    if (!existingEnv.REFRESH_TOKEN_SECRET) {
      config.REFRESH_TOKEN_SECRET = this.generateSecureSecret(64);
      console.log('🔐 Generated new REFRESH_TOKEN_SECRET');
    } else {
      config.REFRESH_TOKEN_SECRET = existingEnv.REFRESH_TOKEN_SECRET;
    }

    if (!existingEnv.SESSION_SECRET) {
      config.SESSION_SECRET = this.generateSecureSecret(32);
      console.log('🔐 Generated new SESSION_SECRET');
    } else {
      config.SESSION_SECRET = existingEnv.SESSION_SECRET;
    }

    // Preserve existing values for other variables
    Object.keys(existingEnv).forEach(key => {
      if (key in config && existingEnv[key]) {
        config[key] = existingEnv[key];
      }
    });

    return config;
  }

  /**
   * Writes environment configuration to .env file
   * @param {Object} config - Environment configuration object
   */
  writeEnvFile(config) {
    const envContent = [
      '# CityGuardian Environment Configuration',
      '# Generated automatically - Do not edit secrets manually',
      `# Generated on: ${new Date().toISOString()}`,
      '',
      '# =================================',
      '# DATABASE CONFIGURATION',
      '# =================================',
      `MONGODB_URI=${config.MONGODB_URI}`,
      `DB_NAME=${config.DB_NAME}`,
      '',
      '# =================================',
      '# JWT & AUTHENTICATION',
      '# =================================',
      `JWT_SECRET=${config.JWT_SECRET}`,
      `JWT_EXPIRES_IN=${config.JWT_EXPIRES_IN}`,
      `REFRESH_TOKEN_SECRET=${config.REFRESH_TOKEN_SECRET}`,
      `REFRESH_TOKEN_EXPIRES_IN=${config.REFRESH_TOKEN_EXPIRES_IN}`,
      '',
      '# =================================',
      '# SERVER CONFIGURATION',
      '# =================================',
      `PORT=${config.PORT}`,
      `NODE_ENV=${config.NODE_ENV}`,
      `ALLOWED_ORIGINS=${config.ALLOWED_ORIGINS}`,
      '',
      '# =================================',
      '# SECURITY SETTINGS',
      '# =================================',
      `BCRYPT_ROUNDS=${config.BCRYPT_ROUNDS}`,
      `MAX_LOGIN_ATTEMPTS=${config.MAX_LOGIN_ATTEMPTS}`,
      `ACCOUNT_LOCK_TIME=${config.ACCOUNT_LOCK_TIME}`,
      `SESSION_SECRET=${config.SESSION_SECRET}`,
      `SESSION_TIMEOUT=${config.SESSION_TIMEOUT}`,
      '',
      '# =================================',
      '# RATE LIMITING',
      '# =================================',
      `RATE_LIMIT_WINDOW_MS=${config.RATE_LIMIT_WINDOW_MS}`,
      `RATE_LIMIT_MAX_REQUESTS=${config.RATE_LIMIT_MAX_REQUESTS}`,
      `ENABLE_RATE_LIMITING=${config.ENABLE_RATE_LIMITING}`,
      '',
      '# =================================',
      '# FILE UPLOAD CONFIGURATION',
      '# =================================',
      `MAX_FILE_SIZE=${config.MAX_FILE_SIZE}`,
      `ALLOWED_FILE_TYPES=${config.ALLOWED_FILE_TYPES}`,
      `ENABLE_FILE_UPLOAD=${config.ENABLE_FILE_UPLOAD}`,
      '',
      '# =================================',
      '# EMAIL CONFIGURATION (Optional)',
      '# =================================',
      `EMAIL_HOST=${config.EMAIL_HOST}`,
      `EMAIL_PORT=${config.EMAIL_PORT}`,
      `EMAIL_USER=${config.EMAIL_USER}`,
      `EMAIL_PASS=${config.EMAIL_PASS}`,
      `EMAIL_FROM=${config.EMAIL_FROM}`,
      `ENABLE_EMAIL_NOTIFICATIONS=${config.ENABLE_EMAIL_NOTIFICATIONS}`,
      '',
      '# =================================',
      '# FEATURES & MONITORING',
      '# =================================',
      `ENABLE_PUSH_NOTIFICATIONS=${config.ENABLE_PUSH_NOTIFICATIONS}`,
      `LOG_LEVEL=${config.LOG_LEVEL}`,
      `ENABLE_REQUEST_LOGGING=${config.ENABLE_REQUEST_LOGGING}`,
      '',
      '# =================================',
      '# ENVIRONMENTAL DATA',
      '# =================================',
      `AQI_UPDATE_INTERVAL=${config.AQI_UPDATE_INTERVAL}`,
      `SENSOR_TIMEOUT=${config.SENSOR_TIMEOUT}`,
      '',
      '# =================================',
      '# NOTIFICATION SETTINGS',
      '# =================================',
      `NOTIFICATION_BATCH_SIZE=${config.NOTIFICATION_BATCH_SIZE}`,
      `NOTIFICATION_RETRY_ATTEMPTS=${config.NOTIFICATION_RETRY_ATTEMPTS}`,
      ''
    ].join('\n');

    fs.writeFileSync(this.envPath, envContent);
    console.log('✅ Environment file created/updated at:', this.envPath);
  }

  /**
   * Validates that all required environment variables are present
   * @param {Object} config - Environment configuration to validate
   * @returns {boolean} - True if all required variables are present
   */
  validateConfig(config) {
    const missingVars = [];
    const criticalVars = ['MONGODB_URI', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

    criticalVars.forEach(varName => {
      if (!config[varName]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.error('❌ Missing critical environment variables:', missingVars);
      return false;
    }

    // Validate JWT_SECRET strength
    if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
      console.warn('⚠️  JWT_SECRET is shorter than recommended (32+ characters)');
    }

    return true;
  }

  /**
   * Loads environment variables into process.env
   * @param {Object} config - Environment configuration to load
   */
  loadEnvVars(config) {
    Object.keys(config).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = config[key];
      }
    });
  }

  /**
   * Main initialization method
   * Creates or updates .env file with secure defaults and loads variables
   */
  async initialize() {
    try {
      console.log('🔧 Initializing CityGuardian environment configuration...');

      // Check if .env exists, if not, inform user
      if (!fs.existsSync(this.envPath)) {
        console.log('📝 .env file not found, creating with secure defaults...');
      } else {
        console.log('📝 Updating existing .env file with any missing variables...');
      }

      // Generate complete configuration
      const config = this.generateEnvConfig();

      // Validate configuration
      if (!this.validateConfig(config)) {
        throw new Error('Environment configuration validation failed');
      }

      // Write to .env file
      this.writeEnvFile(config);

      // Load into process.env
      this.loadEnvVars(config);

      console.log('✅ Environment configuration initialized successfully');
      console.log(`📊 Database: ${config.DB_NAME}`);
      console.log(`🚀 Server Port: ${config.PORT}`);
      console.log(`🔒 Environment: ${config.NODE_ENV}`);
      console.log(`🔐 JWT Expiry: ${config.JWT_EXPIRES_IN}`);
      
      return config;
    } catch (error) {
      console.error('💥 Failed to initialize environment configuration:', error);
      throw error;
    }
  }

  /**
   * Generates a backup of the current .env file
   */
  backupEnvFile() {
    if (fs.existsSync(this.envPath)) {
      const backupPath = `${this.envPath}.backup.${Date.now()}`;
      fs.copyFileSync(this.envPath, backupPath);
      console.log(`💾 Backup created at: ${backupPath}`);
    }
  }

  /**
   * Static method to quickly initialize environment
   * @returns {Promise<Object>} - Environment configuration
   */
  static async init() {
    const envSetup = new EnvironmentSetup();
    return await envSetup.initialize();
  }
}

module.exports = EnvironmentSetup;

// Auto-initialize if this file is run directly
if (require.main === module) {
  EnvironmentSetup.init()
    .then(config => {
      console.log('🎉 Environment setup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Environment setup failed:', error);
      process.exit(1);
    });
}