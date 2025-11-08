# CityGuardian MongoDB Database Schema

## Connection String
```
mongodb+srv://myselfkunal8859_db_user:Br4FEbwH7krJTXvi@cluster0.opfzo7f.mongodb.net/cityguardian?appName=Cluster0
```

## Database: `cityguardian`

## Collections and Schema

### 1. Users Collection (`users`)
```javascript
{
  _id: ObjectId,
  userId: String, // Unique user identifier
  userType: String, // "citizen", "employee", "office", "environmental"
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String, // Unique, required for login
    phone: String,
    profilePicture: String, // URL to profile image
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  auth: {
    password: String, // Hashed password
    salt: String, // Password salt
    lastLogin: Date,
    loginAttempts: Number,
    isLocked: Boolean,
    lockUntil: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerified: Boolean,
    emailVerificationToken: String
  },
  profile: {
    // Citizen specific fields
    citizenId: String,
    reportsSubmitted: Number,
    pointsEarned: Number,
    impactScore: Number,
    level: Number,
    achievements: [String],
    
    // Employee specific fields
    employeeId: String,
    department: String,
    position: String,
    zone: String,
    tasksCompleted: Number,
    averageCompletionTime: Number,
    efficiency: Number,
    currentStreak: Number,
    rank: Number,
    badgeLevel: String, // "NOVICE", "SPECIALIST", "ELITE"
    
    // Office Manager specific fields
    managerId: String,
    managedZones: [String],
    teamSize: Number,
    performanceRating: Number
  },
  settings: {
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean,
      taskUpdates: Boolean,
      communityUpdates: Boolean
    },
    privacy: {
      profileVisible: Boolean,
      locationSharing: Boolean,
      activityVisible: Boolean
    },
    theme: String // "light", "dark", "auto"
  },
  status: {
    isActive: Boolean,
    lastActiveDate: Date,
    currentStatus: String // "online", "offline", "busy", "break" (for employees)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Reports/Complaints Collection (`reports`)
```javascript
{
  _id: ObjectId,
  reportId: String, // Unique report identifier
  reportedBy: ObjectId, // Reference to users collection
  reportType: String, // "pothole", "garbage", "air_pollution", "noise", "water_quality", "streetlight", "other"
  title: String,
  description: String,
  location: {
    address: String,
    landmark: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    zone: String
  },
  evidence: {
    photos: [String], // URLs to uploaded images
    videos: [String], // URLs to uploaded videos
    audioNotes: [String] // URLs to audio recordings
  },
  priority: String, // "low", "medium", "high", "critical"
  category: String, // "Road Infrastructure", "Environment", "Sanitation", "Public Safety"
  status: String, // "pending", "acknowledged", "in_progress", "resolved", "rejected", "cancelled"
  assignedTo: ObjectId, // Reference to users collection (employee)
  assignedZone: String,
  urgencyLevel: Number, // 1-10 scale
  estimatedResolution: Date,
  actualResolution: Date,
  resolutionNotes: String,
  resolutionEvidence: [String], // URLs to resolution photos
  citizenFeedback: {
    rating: Number, // 1-5 stars
    comment: String,
    isResolved: Boolean,
    feedbackDate: Date
  },
  interactions: {
    likes: Number,
    comments: Number,
    shares: Number,
    views: Number
  },
  tags: [String],
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date
}
```

### 3. Tasks Collection (`tasks`)
```javascript
{
  _id: ObjectId,
  taskId: String,
  title: String,
  description: String,
  taskType: String, // "infrastructure", "environmental", "sanitation", "monitoring", "emergency"
  assignedTo: ObjectId, // Reference to users collection
  assignedBy: ObjectId, // Reference to users collection (manager)
  relatedReport: ObjectId, // Reference to reports collection (if task is based on citizen report)
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    zone: String
  },
  priority: String, // "low", "medium", "high", "critical"
  status: String, // "pending", "accepted", "in_progress", "completed", "cancelled"
  dueDate: Date,
  estimatedDuration: Number, // in hours
  actualDuration: Number, // in hours
  difficulty: Number, // 1-5 scale
  rewardPoints: Number,
  equipment: [String], // Required tools/equipment
  skills: [String], // Required skills
  checklist: [{
    item: String,
    completed: Boolean,
    completedAt: Date
  }],
  progress: {
    percentage: Number,
    notes: String,
    photos: [String],
    lastUpdate: Date
  },
  completion: {
    completedAt: Date,
    completionNotes: String,
    completionPhotos: [String],
    qualityRating: Number, // 1-5 stars (rated by manager)
    managerNotes: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Environmental Data Collection (`environmental_data`)
```javascript
{
  _id: ObjectId,
  sensorId: String,
  location: {
    name: String, // "Downtown Core", "Industrial East", etc.
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    zone: String
  },
  measurements: {
    aqi: {
      value: Number,
      status: String, // "good", "moderate", "unhealthy", "hazardous"
      trend: String, // "up", "down", "stable"
      components: {
        pm25: Number,
        pm10: Number,
        ozone: Number,
        no2: Number,
        so2: Number,
        co: Number
      }
    },
    weather: {
      temperature: Number,
      humidity: Number,
      windSpeed: Number,
      windDirection: String,
      pressure: Number,
      rainfall: Number
    },
    noise: {
      level: Number, // in decibels
      category: String // "quiet", "moderate", "loud", "very_loud"
    },
    waterQuality: {
      ph: Number,
      turbidity: Number,
      dissolvedOxygen: Number,
      temperature: Number
    }
  },
  targets: {
    aqiTarget: Number,
    noiseTarget: Number,
    temperatureTarget: Number
  },
  alerts: [{
    type: String, // "threshold_exceeded", "sensor_malfunction", "data_anomaly"
    severity: String, // "low", "medium", "high", "critical"
    message: String,
    triggeredAt: Date,
    resolvedAt: Date,
    isActive: Boolean
  }],
  timestamp: Date,
  createdAt: Date
}
```

### 5. Zones Management Collection (`zones`)
```javascript
{
  _id: ObjectId,
  zoneId: String,
  name: String, // "Downtown Core", "Industrial East", "Residential West"
  boundaries: {
    type: String, // "Polygon"
    coordinates: [[[Number]]] // GeoJSON coordinates
  },
  manager: ObjectId, // Reference to users collection
  employees: [ObjectId], // References to users collection
  statistics: {
    totalArea: Number, // in square kilometers
    population: Number,
    coverage: Number, // percentage
    activeIssues: Number,
    resolvedIssues: Number,
    averageResolutionTime: Number, // in hours
    employeeCount: Number,
    performanceScore: Number
  },
  targets: {
    aqiTarget: Number,
    resolutionTimeTarget: Number, // in hours
    customerSatisfactionTarget: Number
  },
  currentMetrics: {
    averageAqi: Number,
    activeReports: Number,
    completedTasks: Number,
    employeeEfficiency: Number,
    citizenSatisfaction: Number
  },
  settings: {
    priorityResponseTime: Number, // in minutes
    workingHours: {
      start: String, // "09:00"
      end: String, // "17:00"
    },
    emergencyContacts: [String]
  },
  status: String, // "operational", "alert", "maintenance", "emergency"
  lastUpdated: Date,
  createdAt: Date
}
```

### 6. Community Posts Collection (`community_posts`)
```javascript
{
  _id: ObjectId,
  postId: String,
  author: ObjectId, // Reference to users collection
  postType: String, // "update", "announcement", "discussion", "complaint", "municipal_post"
  title: String,
  content: String,
  attachments: {
    images: [String],
    videos: [String],
    documents: [String]
  },
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    zone: String
  },
  category: String, // "Municipal Notice", "Community Event", "Safety Alert"
  tags: [String],
  interactions: {
    likes: [{
      userId: ObjectId,
      likedAt: Date
    }],
    comments: [{
      _id: ObjectId,
      userId: ObjectId,
      comment: String,
      createdAt: Date,
      likes: Number
    }],
    shares: Number,
    views: Number
  },
  visibility: String, // "public", "zone", "private"
  isOfficial: Boolean, // true for municipal posts
  isPromoted: Boolean,
  priority: String, // "normal", "high", "urgent"
  expiresAt: Date, // for time-sensitive announcements
  status: String, // "active", "archived", "hidden"
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Performance Analytics Collection (`performance_analytics`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  userType: String, // "employee", "manager", "zone"
  timeframe: String, // "daily", "weekly", "monthly", "yearly"
  period: Date, // Start of the time period
  metrics: {
    // Employee metrics
    tasksCompleted: Number,
    averageCompletionTime: Number,
    qualityScore: Number,
    efficiencyRating: Number,
    pointsEarned: Number,
    rank: Number,
    
    // Manager metrics
    teamPerformance: Number,
    targetsAchieved: Number,
    teamSatisfaction: Number,
    zoneImprovement: Number,
    
    // Zone metrics
    aqiImprovement: Number,
    issueResolutionRate: Number,
    citizenSatisfaction: Number,
    operationalEfficiency: Number
  },
  achievements: [String],
  streaks: {
    currentStreak: Number,
    longestStreak: Number,
    streakType: String // "completion", "quality", "punctuality"
  },
  rankings: {
    departmentRank: Number,
    zoneRank: Number,
    cityRank: Number
  },
  createdAt: Date
}
```

### 8. Notifications Collection (`notifications`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  type: String, // "task_assigned", "report_update", "achievement", "system", "emergency"
  title: String,
  message: String,
  data: Object, // Additional data payload
  priority: String, // "low", "normal", "high", "urgent"
  category: String, // "task", "report", "community", "system", "emergency"
  isRead: Boolean,
  isActionRequired: Boolean,
  actionUrl: String,
  expiresAt: Date,
  deliveryChannels: {
    push: Boolean,
    email: Boolean,
    sms: Boolean
  },
  deliveryStatus: {
    push: String, // "sent", "delivered", "failed"
    email: String,
    sms: String
  },
  createdAt: Date,
  readAt: Date
}
```

### 9. Leaderboards Collection (`leaderboards`)
```javascript
{
  _id: ObjectId,
  type: String, // "employee", "citizen", "zone", "department"
  timeframe: String, // "daily", "weekly", "monthly", "all_time"
  period: Date,
  rankings: [{
    rank: Number,
    userId: ObjectId, // or zoneId for zone leaderboards
    name: String,
    score: Number,
    badge: String, // emoji or badge identifier
    level: String, // "NOVICE", "SPECIALIST", "ELITE"
    metrics: {
      tasksCompleted: Number,
      pointsEarned: Number,
      efficiency: Number,
      streak: Number
    }
  }],
  lastUpdated: Date,
  createdAt: Date
}
```

### 10. System Settings Collection (`system_settings`)
```javascript
{
  _id: ObjectId,
  category: String, // "general", "performance", "notifications", "security"
  settings: {
    // General settings
    cityName: String,
    timezone: String,
    language: String,
    
    // Performance settings
    taskRewardMultiplier: Number,
    qualityThreshold: Number,
    responseTimeTargets: Object,
    
    // Notification settings
    emailTemplates: Object,
    notificationSchedule: Object,
    
    // Security settings
    passwordPolicy: Object,
    sessionTimeout: Number,
    maxLoginAttempts: Number
  },
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 11. Audit Log Collection (`audit_logs`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  action: String, // "login", "create_report", "complete_task", "update_profile"
  category: String, // "auth", "reports", "tasks", "admin"
  details: {
    resource: String, // What was affected
    resourceId: String,
    changes: Object, // What changed (before/after)
    ip: String,
    userAgent: String,
    location: Object
  },
  result: String, // "success", "failed", "partial"
  timestamp: Date
}
```

## Indexes for Performance

```javascript
// Users collection indexes
db.users.createIndex({ "personalInfo.email": 1 }, { unique: true })
db.users.createIndex({ "userId": 1 }, { unique: true })
db.users.createIndex({ "userType": 1 })
db.users.createIndex({ "profile.zone": 1 })

// Reports collection indexes
db.reports.createIndex({ "reportedBy": 1 })
db.reports.createIndex({ "assignedTo": 1 })
db.reports.createIndex({ "status": 1 })
db.reports.createIndex({ "location.zone": 1 })
db.reports.createIndex({ "createdAt": -1 })
db.reports.createIndex({ "reportType": 1 })

// Tasks collection indexes
db.tasks.createIndex({ "assignedTo": 1 })
db.tasks.createIndex({ "assignedBy": 1 })
db.tasks.createIndex({ "status": 1 })
db.tasks.createIndex({ "dueDate": 1 })
db.tasks.createIndex({ "location.zone": 1 })

// Environmental data indexes
db.environmental_data.createIndex({ "sensorId": 1 })
db.environmental_data.createIndex({ "location.zone": 1 })
db.environmental_data.createIndex({ "timestamp": -1 })
db.environmental_data.createIndex({ "location.coordinates": "2dsphere" })

// Zones collection indexes
db.zones.createIndex({ "zoneId": 1 }, { unique: true })
db.zones.createIndex({ "manager": 1 })
db.zones.createIndex({ "boundaries": "2dsphere" })

// Community posts indexes
db.community_posts.createIndex({ "author": 1 })
db.community_posts.createIndex({ "location.zone": 1 })
db.community_posts.createIndex({ "createdAt": -1 })
db.community_posts.createIndex({ "postType": 1 })

// Notifications indexes
db.notifications.createIndex({ "userId": 1 })
db.notifications.createIndex({ "isRead": 1 })
db.notifications.createIndex({ "createdAt": -1 })
db.notifications.createIndex({ "priority": 1 })

// Performance analytics indexes
db.performance_analytics.createIndex({ "userId": 1 })
db.performance_analytics.createIndex({ "period": -1 })
db.performance_analytics.createIndex({ "userType": 1 })

// Audit logs indexes
db.audit_logs.createIndex({ "userId": 1 })
db.audit_logs.createIndex({ "timestamp": -1 })
db.audit_logs.createIndex({ "action": 1 })
```

## Sample Data Insertion Scripts

### Insert Sample Users
```javascript
// Citizen user
db.users.insertOne({
  userId: "CITIZEN_001",
  userType: "citizen",
  personalInfo: {
    firstName: "Rajesh",
    lastName: "Kumar",
    email: "rajesh.kumar@example.com",
    phone: "+91-9876543210",
    address: {
      street: "MG Road, Sector 14",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110001",
      coordinates: {
        latitude: 28.6139,
        longitude: 77.2090
      }
    }
  },
  auth: {
    password: "$2b$12$LQv3c1yqBTLaqrKDPwrKDe9P0ZEhWt.VWLP8X9X9X9X9X9X9X9X9X", // hashed "password123"
    lastLogin: new Date(),
    loginAttempts: 0,
    isLocked: false,
    emailVerified: true
  },
  profile: {
    citizenId: "CIT001",
    reportsSubmitted: 5,
    pointsEarned: 1250,
    impactScore: 85,
    level: 2,
    achievements: ["First Report", "Environment Protector"]
  },
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
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Employee user
db.users.insertOne({
  userId: "EMP_001",
  userType: "employee",
  personalInfo: {
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@cityguardian.gov",
    phone: "+91-9876543211",
    address: {
      street: "Green Park Extension",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110016",
      coordinates: {
        latitude: 28.5594,
        longitude: 77.2067
      }
    }
  },
  auth: {
    password: "$2b$12$LQv3c1yqBTLaqrKDPwrKDe9P0ZEhWt.VWLP8X9X9X9X9X9X9X9X9Y",
    lastLogin: new Date(),
    loginAttempts: 0,
    isLocked: false,
    emailVerified: true
  },
  profile: {
    employeeId: "EMP001",
    department: "Environmental Services",
    position: "Field Agent",
    zone: "Downtown Core",
    tasksCompleted: 28,
    averageCompletionTime: 2.5,
    efficiency: 92,
    currentStreak: 15,
    rank: 5,
    badgeLevel: "SPECIALIST"
  },
  settings: {
    notifications: {
      email: true,
      push: true,
      sms: true,
      taskUpdates: true,
      communityUpdates: false
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
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Office Manager user
db.users.insertOne({
  userId: "MGR_001",
  userType: "office",
  personalInfo: {
    firstName: "Amit",
    lastName: "Singh",
    email: "amit.singh@cityguardian.gov",
    phone: "+91-9876543212",
  },
  auth: {
    password: "$2b$12$LQv3c1yqBTLaqrKDPwrKDe9P0ZEhWt.VWLP8X9X9X9X9X9X9X9X9Z",
    lastLogin: new Date(),
    loginAttempts: 0,
    isLocked: false,
    emailVerified: true
  },
  profile: {
    managerId: "MGR001",
    department: "Operations",
    position: "Zone Manager",
    managedZones: ["Downtown Core", "Industrial East"],
    teamSize: 15,
    performanceRating: 4.7
  },
  settings: {
    notifications: {
      email: true,
      push: true,
      sms: true,
      taskUpdates: true,
      communityUpdates: true
    },
    theme: "light"
  },
  status: {
    isActive: true,
    lastActiveDate: new Date(),
    currentStatus: "online"
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

This comprehensive database schema covers all the major functionality of your CityGuardian application including user management, reports/complaints, task management, environmental monitoring, community features, performance analytics, and more. The schema is designed to be scalable and includes proper indexing for performance optimization.