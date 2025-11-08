// API Routes for Authentication
// File: database/api-examples.js

const express = require('express');
const jwt = require('jsonwebtoken');
const { UserModel, ReportModel, TaskModel, EnvironmentalDataModel, NotificationModel } = require('./models');

// Initialize models
const userModel = new UserModel();
const reportModel = new ReportModel();
const taskModel = new TaskModel();
const environmentalDataModel = new EnvironmentalDataModel();
const notificationModel = new NotificationModel();

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authentication Routes
const authRoutes = express.Router();

// Login endpoint
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userModel.authenticate(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.personalInfo.email,
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`,
        email: user.personalInfo.email,
        userType: user.userType,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
authRoutes.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType, phone } = req.body;

    if (!email || !password || !firstName || !lastName || !userType) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Generate unique user ID
    const userId = `${userType.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const userData = {
      userId,
      userType,
      personalInfo: {
        firstName,
        lastName,
        email,
        phone: phone || ''
      },
      auth: {
        password, // Will be hashed in the model
        loginAttempts: 0,
        isLocked: false,
        emailVerified: false
      },
      profile: userType === 'citizen' ? {
        citizenId: `CIT${Date.now()}`,
        reportsSubmitted: 0,
        pointsEarned: 0,
        impactScore: 0,
        level: 1,
        achievements: []
      } : userType === 'employee' ? {
        employeeId: `EMP${Date.now()}`,
        tasksCompleted: 0,
        averageCompletionTime: 0,
        efficiency: 0,
        currentStreak: 0,
        rank: 0,
        badgeLevel: "NOVICE"
      } : {},
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
        theme: "dark"
      },
      status: {
        isActive: true,
        lastActiveDate: new Date(),
        currentStatus: "online"
      }
    };

    const result = await userModel.create(userData);
    
    if (result.acknowledged) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        userId: result.insertedId
      });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User profile endpoint
authRoutes.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive information
    delete user.auth.password;
    delete user.auth.salt;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reports Routes
const reportsRoutes = express.Router();

// Create new report
reportsRoutes.post('/', authenticateToken, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      reportedBy: req.user.userId
    };

    const result = await reportModel.create(reportData);
    
    if (result.acknowledged) {
      // Create notification for relevant employees/managers
      // This would typically be done in a background job
      
      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        reportId: result.insertedId
      });
    } else {
      res.status(500).json({ error: 'Failed to create report' });
    }
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's reports
reportsRoutes.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const reports = await reportModel.getByUser(req.user.userId, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reports by zone (for employees/managers)
reportsRoutes.get('/zone/:zone', authenticateToken, async (req, res) => {
  try {
    const { zone } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    
    // Check if user has access to this zone
    if (req.user.userType === 'employee' || req.user.userType === 'office') {
      const reports = await reportModel.getByZone(zone, status, parseInt(limit), parseInt(offset));
      
      res.json({
        success: true,
        reports
      });
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  } catch (error) {
    console.error('Zone reports fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update report status (for employees/managers)
reportsRoutes.put('/:reportId/status', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, notes } = req.body;
    
    if (req.user.userType === 'employee' || req.user.userType === 'office') {
      const result = await reportModel.updateStatus(reportId, status, req.user.userId, notes);
      
      if (result.modifiedCount > 0) {
        res.json({
          success: true,
          message: 'Report status updated successfully'
        });
      } else {
        res.status(404).json({ error: 'Report not found' });
      }
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  } catch (error) {
    console.error('Report status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tasks Routes
const tasksRoutes = express.Router();

// Get employee tasks
tasksRoutes.get('/my-tasks', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'employee') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, limit = 20, offset = 0 } = req.query;
    const tasks = await taskModel.getByEmployee(req.user.userId, status, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task progress
tasksRoutes.put('/:taskId/progress', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'employee') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { taskId } = req.params;
    const { percentage, notes, photos } = req.body;
    
    const result = await taskModel.updateProgress(taskId, percentage, notes, photos);
    
    if (result.modifiedCount > 0) {
      res.json({
        success: true,
        message: 'Task progress updated successfully'
      });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Task progress update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Environmental Data Routes
const environmentalRoutes = express.Router();

// Get latest environmental data by zone
environmentalRoutes.get('/zone/:zone/latest', authenticateToken, async (req, res) => {
  try {
    const { zone } = req.params;
    const data = await environmentalDataModel.getLatestByZone(zone);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Environmental data fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all latest readings
environmentalRoutes.get('/latest-all', authenticateToken, async (req, res) => {
  try {
    const data = await environmentalDataModel.getAllLatestReadings();
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Environmental data fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notifications Routes
const notificationsRoutes = express.Router();

// Get user notifications
notificationsRoutes.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;
    const notifications = await notificationModel.getByUser(
      req.user.userId, 
      parseInt(limit), 
      parseInt(offset), 
      unreadOnly === 'true'
    );
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
notificationsRoutes.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await notificationModel.markAsRead(notificationId);
    
    if (result.modifiedCount > 0) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Example Express app setup
const setupExpressApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/environmental', environmentalRoutes);
  app.use('/api/notifications', notificationsRoutes);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'CityGuardian API'
    });
  });
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });
  
  return app;
};

module.exports = {
  authRoutes,
  reportsRoutes,
  tasksRoutes,
  environmentalRoutes,
  notificationsRoutes,
  setupExpressApp,
  authenticateToken
};