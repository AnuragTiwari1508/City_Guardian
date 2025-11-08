/**
 * Environment Setup Configuration
 * Automatically creates and manages environment variables for CityGuardian
 * 
 * Features:
 * - Auto-generates secure JWT_SECRET if missing
 * - Creates .env file with sensible defaults
 * - Validates environment configuration
 * - Provides fallback values for development
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvironmentSetup {
  constructor() {
    this.envPath = path.join(__dirname, '..', '.env');
    this.requiredVars = {
      // Database Configuration
      MONGODB_URI: 'mongodb+srv://myselfkunal8859_db_user:Br4FEbwH7krJTXvi@cluster0.opfzo7f.mongodb.net/cityguardian?appName=Cluster0',
      DB_NAME: 'cityguardian',
      
      // JWT Configuration - Auto-generated if missing
      JWT_SECRET: null, // Will be auto-generated
      JWT_EXPIRES_IN: '24h',
      JWT_REFRESH_SECRET: null, // Will be auto-generated
      JWT_REFRESH_EXPIRES_IN: '7d',
      
      // Server Configuration
      PORT: '3001',
      NODE_ENV: 'development',
      
      // Security
      BCRYPT_ROUNDS: '12',
      SESSION_TIMEOUT: '86400000', // 24 hours in milliseconds
      
      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
      RATE_LIMIT_MAX_REQUESTS: '100',
      
      // CORS Settings
      ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3001,https://your-frontend-domain.com',
      
      // Notifications
      ENABLE_EMAIL_NOTIFICATIONS: 'true',
      ENABLE_PUSH_NOTIFICATIONS: 'true',
      
      // Environmental Monitoring
      AQI_UPDATE_INTERVAL: '300000', // 5 minutes
      SENSOR_TIMEOUT: '30000', // 30 seconds
      
      // File Upload Limits
      MAX_FILE_SIZE: '10485760', // 10MB
      ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/webp,video/mp4'
    };
  }

  /**
   * Generate a cryptographically secure random string
   * @param {number} length - Length of the secret (default: 64)
   * @returns {string} - Secure random string
   */
  generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Parse existing .env file if it exists
   * @returns {Object} - Parsed environment variables
   */
  parseExistingEnv() {
    if (!fs.existsSync(this.envPath)) {
      return {};
    }

    try {
      const envContent = fs.readFileSync(this.envPath, 'utf-8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
      
      return envVars;
    } catch (error) {
      console.warn('Warning: Could not parse existing .env file:', error.message);
      return {};
    }
  }

  /**
   * Validate JWT secret strength
   * @param {string} secret - JWT secret to validate
   * @returns {boolean} - True if secret is strong enough
   */
  validateJWTSecret(secret) {
    if (!secret || typeof secret !== 'string') return false;
    if (secret.length < 32) return false;
    if (secret === 'your-super-secret-jwt-key-change-this-in-production') return false;
    return true;
  }

  /**
   * Generate environment configuration with secure defaults
   * @returns {Object} - Complete environment configuration
   */
  generateConfig() {
    console.log('🔧 Setting up environment configuration...');
    
    // Parse existing environment variables
    const existingEnv = this.parseExistingEnv();
    const config = { ...this.requiredVars };

    // Preserve existing values
    Object.keys(existingEnv).forEach(key => {
      if (config.hasOwnProperty(key)) {
        config[key] = existingEnv[key];
      }
    });

    // Generate secure JWT secrets if missing or weak
    if (!this.validateJWTSecret(config.JWT_SECRET)) {
      console.log('🔐 Generating secure JWT_SECRET...');
      config.JWT_SECRET = `jwt_${this.generateSecureSecret(48)}`;
    }

    if (!this.validateJWTSecret(config.JWT_REFRESH_SECRET)) {
      console.log('🔐 Generating secure JWT_REFRESH_SECRET...');
      config.JWT_REFRESH_SECRET = `refresh_${this.generateSecureSecret(48)}`;
    }

    return config;
  }

  /**
   * Create formatted .env file content
   * @param {Object} config - Environment configuration
   * @returns {string} - Formatted .env file content
   */
  createEnvContent(config) {
    return `# CityGuardian Environment Configuration
# Generated automatically on ${new Date().toISOString()}
# 
# SECURITY WARNING: Never commit this file to version control!
# Keep your secrets secure and rotate them regularly.

# ===================================
# DATABASE CONFIGURATION
# ===================================
MONGODB_URI=${config.MONGODB_URI}
DB_NAME=${config.DB_NAME}

# ===================================
# JWT AUTHENTICATION
# ===================================
# Primary JWT secret for access tokens
JWT_SECRET=${config.JWT_SECRET}
JWT_EXPIRES_IN=${config.JWT_EXPIRES_IN}

# Refresh token configuration
JWT_REFRESH_SECRET=${config.JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=${config.JWT_REFRESH_EXPIRES_IN}

# ===================================
# SERVER CONFIGURATION
# ===================================
PORT=${config.PORT}
NODE_ENV=${config.NODE_ENV}

# ===================================
# SECURITY SETTINGS
# ===================================
BCRYPT_ROUNDS=${config.BCRYPT_ROUNDS}
SESSION_TIMEOUT=${config.SESSION_TIMEOUT}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=${config.RATE_LIMIT_WINDOW_MS}
RATE_LIMIT_MAX_REQUESTS=${config.RATE_LIMIT_MAX_REQUESTS}

# CORS Settings
ALLOWED_ORIGINS=${config.ALLOWED_ORIGINS}

# ===================================
# FEATURE FLAGS
# ===================================
ENABLE_EMAIL_NOTIFICATIONS=${config.ENABLE_EMAIL_NOTIFICATIONS}
ENABLE_PUSH_NOTIFICATIONS=${config.ENABLE_PUSH_NOTIFICATIONS}

# ===================================
# ENVIRONMENTAL MONITORING
# ===================================
AQI_UPDATE_INTERVAL=${config.AQI_UPDATE_INTERVAL}
SENSOR_TIMEOUT=${config.SENSOR_TIMEOUT}

# ===================================
# FILE UPLOAD CONFIGURATION
# ===================================
MAX_FILE_SIZE=${config.MAX_FILE_SIZE}
ALLOWED_FILE_TYPES=${config.ALLOWED_FILE_TYPES}

# ===================================
# EMAIL CONFIGURATION (Optional)
# ===================================
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# ===================================
# CLOUDINARY CONFIGURATION (Optional)
# ===================================
# CLOUDINARY_CLOUD_NAME=your-cloudinary-name
# CLOUDINARY_API_KEY=your-cloudinary-key
# CLOUDINARY_API_SECRET=your-cloudinary-secret
`;
  }

  /**
   * Write configuration to .env file
   * @param {Object} config - Environment configuration
   */
  writeEnvFile(config) {
    const envContent = this.createEnvContent(config);
    
    try {
      fs.writeFileSync(this.envPath, envContent, 'utf-8');
      console.log('✅ Environment configuration written to .env file');
    } catch (error) {
      console.error('❌ Failed to write .env file:', error.message);
      throw error;
    }
  }

  /**
   * Validate that all required environment variables are set
   * @returns {Object} - Validation results
   */
  validateEnvironment() {
    const config = this.generateConfig();
    const issues = [];
    const warnings = [];

    // Check for production readiness
    if (config.NODE_ENV === 'production') {
      if (config.JWT_SECRET.includes('your-super-secret')) {
        issues.push('JWT_SECRET must be changed for production');
      }
      
      if (config.ALLOWED_ORIGINS.includes('localhost')) {
        warnings.push('ALLOWED_ORIGINS contains localhost in production');
      }
    }

    // Check JWT secret strength
    if (!this.validateJWTSecret(config.JWT_SECRET)) {
      issues.push('JWT_SECRET is too weak or missing');
    }

    if (!this.validateJWTSecret(config.JWT_REFRESH_SECRET)) {
      issues.push('JWT_REFRESH_SECRET is too weak or missing');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      config
    };
  }

  /**
   * Initialize environment setup
   * @param {boolean} force - Force regeneration of secrets
   * @returns {Object} - Setup results
   */
  async initialize(force = false) {
    console.log('🚀 Initializing CityGuardian environment setup...\n');

    try {
      // Generate configuration
      const config = this.generateConfig();
      
      // Force regeneration if requested
      if (force) {
        console.log('🔄 Force regenerating JWT secrets...');
        config.JWT_SECRET = `jwt_${this.generateSecureSecret(48)}`;
        config.JWT_REFRESH_SECRET = `refresh_${this.generateSecureSecret(48)}`;
      }

      // Write .env file
      this.writeEnvFile(config);

      // Validate configuration
      const validation = this.validateEnvironment();

      // Display results
      console.log('\n📋 Environment Setup Summary:');
      console.log(`✅ JWT_SECRET: ${config.JWT_SECRET.substring(0, 20)}...`);
      console.log(`✅ JWT_REFRESH_SECRET: ${config.JWT_REFRESH_SECRET.substring(0, 20)}...`);
      console.log(`✅ Database: ${config.DB_NAME}`);
      console.log(`✅ Port: ${config.PORT}`);
      console.log(`✅ Environment: ${config.NODE_ENV}`);

      if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validation.warnings.forEach(warning => console.log(`   - ${warning}`));
      }

      if (validation.issues.length > 0) {
        console.log('\n❌ Issues:');
        validation.issues.forEach(issue => console.log(`   - ${issue}`));
      }

      console.log('\n🎉 Environment setup completed successfully!');
      console.log('💡 Tip: Add .env to your .gitignore to keep secrets secure.\n');

      return {
        success: true,
        config,
        validation
      };

    } catch (error) {
      console.error('\n💥 Environment setup failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other modules
module.exports = EnvironmentSetup;

// Auto-initialize when run directly
if (require.main === module) {
  const envSetup = new EnvironmentSetup();
  
  // Check for command line arguments
  const force = process.argv.includes('--force') || process.argv.includes('-f');
  
  envSetup.initialize(force)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}