// Database Models and Helper Functions with JWT Session Management
// File: database/models.js

const { dbConnection } = require('./connection');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

/**
 * User Session Model for JWT token management
 * Handles active sessions, token validation, and security tracking
 */
class UserSessionModel {
  constructor() {
    this.collection = 'user_sessions';
  }

  /**
   * Create a new user session
   * @param {Object} sessionData - Session information
   * @returns {Object} - Insert result
   */
  async create(sessionData) {
    const db = dbConnection.getDatabase();
    
    sessionData.createdAt = new Date();
    sessionData.updatedAt = new Date();
    
    const result = await db.collection(this.collection).insertOne(sessionData);
    return result;
  }

  /**
   * Find active session by token
   * @param {string} token - JWT token
   * @returns {Object|null} - Session object or null
   */
  async findByToken(token) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).findOne({
      accessToken: token,
      'metadata.isActive': true,
      expiresAt: { $gt: new Date() }
    });
  }

  /**
   * Find all active sessions for a user
   * @param {string} userId - User ID
   * @returns {Array} - Array of active sessions
   */
  async findActiveByUser(userId) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection)
      .find({
        userId: new ObjectId(userId),
        'metadata.isActive': true,
        expiresAt: { $gt: new Date() }
      })
      .sort({ 'metadata.loginTime': -1 })
      .toArray();
  }

  /**
   * Update session activity
   * @param {string} token - JWT token
   * @returns {Object} - Update result
   */
  async updateActivity(token) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).updateOne(
      { accessToken: token },
      {
        $set: {
          'metadata.lastActivity': new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  /**
   * Invalidate session (logout)
   * @param {string} token - JWT token
   * @returns {Object} - Update result
   */
  async invalidateSession(token) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).updateOne(
      { accessToken: token },
      {
        $set: {
          'metadata.isActive': false,
          logoutTime: new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User ID
   * @returns {Object} - Update result
   */
  async invalidateAllUserSessions(userId) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).updateMany(
      { 
        userId: new ObjectId(userId),
        'metadata.isActive': true
      },
      {
        $set: {
          'metadata.isActive': false,
          logoutTime: new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  /**
   * Clean up expired sessions
   * @returns {Object} - Delete result
   */
  async cleanupExpired() {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { 
          'metadata.isActive': false,
          logoutTime: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days old
        }
      ]
    });
  }

  /**
   * Get session statistics for a user
   * @param {string} userId - User ID
   * @returns {Object} - Session statistics
   */
  async getUserSessionStats(userId) {
    const db = dbConnection.getDatabase();
    const stats = await db.collection(this.collection).aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$metadata.isActive', true] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          lastLogin: { $max: '$metadata.loginTime' },
          avgSessionDuration: {
            $avg: {
              $cond: [
                { $ne: ['$logoutTime', null] },
                {
                  $subtract: ['$logoutTime', '$metadata.loginTime']
                },
                null
              ]
            }
          }
        }
      }
    ]).toArray();

    return stats[0] || {
      totalSessions: 0,
      activeSessions: 0,
      lastLogin: null,
      avgSessionDuration: null
    };
  }
}

class UserModel {
  constructor() {
    this.collection = 'users';
  }

  async create(userData) {
    const db = dbConnection.getDatabase();
    
    // Hash password before storing
    if (userData.auth && userData.auth.password) {
      const saltRounds = 12;
      userData.auth.password = await bcrypt.hash(userData.auth.password, saltRounds);
    }

    userData.createdAt = new Date();
    userData.updatedAt = new Date();
    
    const result = await db.collection(this.collection).insertOne(userData);
    return result;
  }

  async findByEmail(email) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).findOne({ 
      "personalInfo.email": email 
    });
  }

  async findByUserId(userId) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).findOne({ userId });
  }

  async findById(id) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).findOne({ 
      _id: new ObjectId(id) 
    });
  }

  async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.auth.password);
    if (!isValidPassword) return null;

    // Update last login
    await this.updateLastLogin(user._id);
    
    // Remove password from returned object
    delete user.auth.password;
    delete user.auth.salt;
    
    return user;
  }

  async updateLastLogin(userId) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          "auth.lastLogin": new Date(),
          "status.lastActiveDate": new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  async updateProfile(userId, profileData) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          ...profileData,
          updatedAt: new Date()
        }
      }
    );
  }

  async getByUserType(userType, zone = null) {
    const db = dbConnection.getDatabase();
    const query = { userType };
    
    if (zone && userType === 'employee') {
      query['profile.zone'] = zone;
    }
    
    return await db.collection(this.collection)
      .find(query)
      .project({ "auth.password": 0, "auth.salt": 0 })
      .toArray();
  }
}

class ReportModel {
  constructor() {
    this.collection = 'reports';
  }

  async create(reportData) {
    const db = dbConnection.getDatabase();
    
    reportData.reportId = `REP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    reportData.status = reportData.status || 'pending';
    reportData.createdAt = new Date();
    reportData.updatedAt = new Date();
    
    const result = await db.collection(this.collection).insertOne(reportData);
    return result;
  }

  async findById(id) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).findOne({ 
      _id: new ObjectId(id) 
    });
  }

  async findByReportId(reportId) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).findOne({ reportId });
  }

  async getByUser(userId, limit = 10, offset = 0) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection)
      .find({ reportedBy: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async getByZone(zone, status = null, limit = 50, offset = 0) {
    const db = dbConnection.getDatabase();
    const query = { "location.zone": zone };
    
    if (status) {
      query.status = status;
    }
    
    return await db.collection(this.collection)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async updateStatus(reportId, status, assignedTo = null, notes = null) {
    const db = dbConnection.getDatabase();
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (assignedTo) {
      updateData.assignedTo = new ObjectId(assignedTo);
    }

    if (notes) {
      updateData.resolutionNotes = notes;
    }

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    return await db.collection(this.collection).updateOne(
      { reportId },
      { $set: updateData }
    );
  }

  async getStats(zone = null, timeframe = '30days') {
    const db = dbConnection.getDatabase();
    
    const startDate = new Date();
    if (timeframe === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const matchStage = {
      createdAt: { $gte: startDate }
    };

    if (zone) {
      matchStage["location.zone"] = zone;
    }

    const stats = await db.collection(this.collection).aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          pendingReports: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          inProgressReports: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
          },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          averageResolutionTime: {
            $avg: {
              $cond: [
                { $ne: ["$resolvedAt", null] },
                {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$createdAt"] },
                    1000 * 60 * 60 // Convert to hours
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]).toArray();

    return stats[0] || {
      totalReports: 0,
      pendingReports: 0,
      inProgressReports: 0,
      resolvedReports: 0,
      averageResolutionTime: 0
    };
  }
}

class TaskModel {
  constructor() {
    this.collection = 'tasks';
  }

  async create(taskData) {
    const db = dbConnection.getDatabase();
    
    taskData.taskId = `TASK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    taskData.status = taskData.status || 'pending';
    taskData.createdAt = new Date();
    taskData.updatedAt = new Date();
    
    const result = await db.collection(this.collection).insertOne(taskData);
    return result;
  }

  async findById(id) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).findOne({ 
      _id: new ObjectId(id) 
    });
  }

  async getByEmployee(employeeId, status = null, limit = 20, offset = 0) {
    const db = dbConnection.getDatabase();
    const query = { assignedTo: new ObjectId(employeeId) };
    
    if (status) {
      query.status = status;
    }
    
    return await db.collection(this.collection)
      .find(query)
      .sort({ dueDate: 1, priority: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async getByZone(zone, status = null, limit = 50, offset = 0) {
    const db = dbConnection.getDatabase();
    const query = { "location.zone": zone };
    
    if (status) {
      query.status = status;
    }
    
    return await db.collection(this.collection)
      .find(query)
      .sort({ dueDate: 1, priority: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async updateStatus(taskId, status, notes = null, completionData = null) {
    const db = dbConnection.getDatabase();
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (notes) {
      updateData["progress.notes"] = notes;
      updateData["progress.lastUpdate"] = new Date();
    }

    if (status === 'completed' && completionData) {
      updateData.completion = {
        completedAt: new Date(),
        ...completionData
      };
    }

    return await db.collection(this.collection).updateOne(
      { taskId },
      { $set: updateData }
    );
  }

  async updateProgress(taskId, percentage, notes = null, photos = []) {
    const db = dbConnection.getDatabase();
    const updateData = {
      "progress.percentage": percentage,
      "progress.lastUpdate": new Date(),
      updatedAt: new Date()
    };

    if (notes) {
      updateData["progress.notes"] = notes;
    }

    if (photos.length > 0) {
      updateData["progress.photos"] = photos;
    }

    return await db.collection(this.collection).updateOne(
      { taskId },
      { $set: updateData }
    );
  }
}

class EnvironmentalDataModel {
  constructor() {
    this.collection = 'environmental_data';
  }

  async create(environmentalData) {
    const db = dbConnection.getDatabase();
    
    environmentalData.timestamp = environmentalData.timestamp || new Date();
    environmentalData.createdAt = new Date();
    
    const result = await db.collection(this.collection).insertOne(environmentalData);
    return result;
  }

  async getLatestByZone(zone) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection)
      .findOne(
        { "location.zone": zone },
        { sort: { timestamp: -1 } }
      );
  }

  async getByZoneAndTimeRange(zone, startDate, endDate) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection)
      .find({
        "location.zone": zone,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ timestamp: -1 })
      .toArray();
  }

  async getAllLatestReadings() {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection)
      .aggregate([
        {
          $sort: { "location.zone": 1, timestamp: -1 }
        },
        {
          $group: {
            _id: "$location.zone",
            latestReading: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$latestReading" }
        }
      ])
      .toArray();
  }

  async getAQITrends(zone, days = 7) {
    const db = dbConnection.getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db.collection(this.collection)
      .aggregate([
        {
          $match: {
            "location.zone": zone,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp"
              }
            },
            averageAQI: { $avg: "$measurements.aqi.value" },
            minAQI: { $min: "$measurements.aqi.value" },
            maxAQI: { $max: "$measurements.aqi.value" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
      .toArray();
  }
}

class NotificationModel {
  constructor() {
    this.collection = 'notifications';
  }

  async create(notificationData) {
    const db = dbConnection.getDatabase();
    
    notificationData.isRead = false;
    notificationData.createdAt = new Date();
    
    const result = await db.collection(this.collection).insertOne(notificationData);
    return result;
  }

  async getByUser(userId, limit = 20, offset = 0, unreadOnly = false) {
    const db = dbConnection.getDatabase();
    const query = { userId: new ObjectId(userId) };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    return await db.collection(this.collection)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async markAsRead(notificationId) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).updateOne(
      { _id: new ObjectId(notificationId) },
      { 
        $set: { 
          isRead: true,
          readAt: new Date()
        }
      }
    );
  }

  async markAllAsRead(userId) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).updateMany(
      { 
        userId: new ObjectId(userId),
        isRead: false
      },
      { 
        $set: { 
          isRead: true,
          readAt: new Date()
        }
      }
    );
  }

  async getUnreadCount(userId) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).countDocuments({
      userId: new ObjectId(userId),
      isRead: false
    });
  }
}

/**
 * Audit Log Model for security and compliance tracking
 * Tracks all authentication and critical operations
 */
class AuditLogModel {
  constructor() {
    this.collection = 'audit_logs';
  }

  /**
   * Log authentication event
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {Object} details - Event details
   * @param {string} result - Result of action
   * @param {Object} metadata - Request metadata
   */
  async logAuthEvent(userId, action, details = {}, result = 'success', metadata = {}) {
    const db = dbConnection.getDatabase();
    
    const logEntry = {
      userId: userId ? new ObjectId(userId) : null,
      action,
      category: 'authentication',
      details: {
        ...details,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date()
      },
      result,
      timestamp: new Date()
    };

    await db.collection(this.collection).insertOne(logEntry);
  }

  /**
   * Get authentication logs for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of logs to return
   * @returns {Array} - Array of log entries
   */
  async getAuthLogs(userId, limit = 50) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection)
      .find({
        userId: new ObjectId(userId),
        category: 'authentication'
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get failed login attempts from an IP
   * @param {string} ip - IP address
   * @param {Date} since - Time threshold
   * @returns {number} - Number of failed attempts
   */
  async getFailedLoginAttempts(ip, since) {
    const db = dbConnection.getDatabase();
    return await db.collection(this.collection).countDocuments({
      action: 'login',
      result: 'failed',
      'details.ip': ip,
      timestamp: { $gte: since }
    });
  }
}

module.exports = {
  UserModel,
  UserSessionModel,
  ReportModel,
  TaskModel,
  EnvironmentalDataModel,
  NotificationModel,
  AuditLogModel
};