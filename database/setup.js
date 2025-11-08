// Database Setup and Initialization Script
// File: database/setup.js

const { dbConnection } = require('./connection');
const bcrypt = require('bcrypt');

class DatabaseSetup {
  constructor() {
    this.db = null;
  }

  async initialize() {
    this.db = await dbConnection.connect();
    console.log('Database connection established');
    
    // Create indexes for performance
    await this.createIndexes();
    
    // Insert sample data if collections are empty
    await this.insertSampleData();
    
    console.log('Database setup completed successfully');
  }

  async createIndexes() {
    console.log('Creating database indexes...');
    
    try {
      // Users collection indexes
      await this.db.collection('users').createIndex({ "personalInfo.email": 1 }, { unique: true });
      await this.db.collection('users').createIndex({ "userId": 1 }, { unique: true });
      await this.db.collection('users').createIndex({ "userType": 1 });
      await this.db.collection('users').createIndex({ "profile.zone": 1 });

      // Reports collection indexes
      await this.db.collection('reports').createIndex({ "reportedBy": 1 });
      await this.db.collection('reports').createIndex({ "assignedTo": 1 });
      await this.db.collection('reports').createIndex({ "status": 1 });
      await this.db.collection('reports').createIndex({ "location.zone": 1 });
      await this.db.collection('reports').createIndex({ "createdAt": -1 });
      await this.db.collection('reports').createIndex({ "reportType": 1 });

      // Tasks collection indexes
      await this.db.collection('tasks').createIndex({ "assignedTo": 1 });
      await this.db.collection('tasks').createIndex({ "assignedBy": 1 });
      await this.db.collection('tasks').createIndex({ "status": 1 });
      await this.db.collection('tasks').createIndex({ "dueDate": 1 });
      await this.db.collection('tasks').createIndex({ "location.zone": 1 });

      // Environmental data indexes
      await this.db.collection('environmental_data').createIndex({ "sensorId": 1 });
      await this.db.collection('environmental_data').createIndex({ "location.zone": 1 });
      await this.db.collection('environmental_data').createIndex({ "timestamp": -1 });
      await this.db.collection('environmental_data').createIndex({ "location.coordinates": "2dsphere" });

      // Zones collection indexes
      await this.db.collection('zones').createIndex({ "zoneId": 1 }, { unique: true });
      await this.db.collection('zones').createIndex({ "manager": 1 });

      // Community posts indexes
      await this.db.collection('community_posts').createIndex({ "author": 1 });
      await this.db.collection('community_posts').createIndex({ "location.zone": 1 });
      await this.db.collection('community_posts').createIndex({ "createdAt": -1 });
      await this.db.collection('community_posts').createIndex({ "postType": 1 });

      // Notifications indexes
      await this.db.collection('notifications').createIndex({ "userId": 1 });
      await this.db.collection('notifications').createIndex({ "isRead": 1 });
      await this.db.collection('notifications').createIndex({ "createdAt": -1 });
      await this.db.collection('notifications').createIndex({ "priority": 1 });

      // Performance analytics indexes
      await this.db.collection('performance_analytics').createIndex({ "userId": 1 });
      await this.db.collection('performance_analytics').createIndex({ "period": -1 });
      await this.db.collection('performance_analytics').createIndex({ "userType": 1 });

      // Audit logs indexes
      await this.db.collection('audit_logs').createIndex({ "userId": 1 });
      await this.db.collection('audit_logs').createIndex({ "timestamp": -1 });
      await this.db.collection('audit_logs').createIndex({ "action": 1 });

      console.log('✅ All indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      throw error;
    }
  }

  async insertSampleData() {
    console.log('Checking and inserting sample data...');

    try {
      // Check if users collection is empty
      const userCount = await this.db.collection('users').countDocuments();
      if (userCount === 0) {
        await this.insertSampleUsers();
      }

      // Check if zones collection is empty
      const zoneCount = await this.db.collection('zones').countDocuments();
      if (zoneCount === 0) {
        await this.insertSampleZones();
      }

      // Check if environmental_data collection is empty
      const envCount = await this.db.collection('environmental_data').countDocuments();
      if (envCount === 0) {
        await this.insertSampleEnvironmentalData();
      }

      console.log('✅ Sample data insertion completed');
    } catch (error) {
      console.error('❌ Error inserting sample data:', error);
      throw error;
    }
  }

  async insertSampleUsers() {
    console.log('Inserting sample users...');
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    const sampleUsers = [
      {
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
          password: hashedPassword,
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
      },
      {
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
          password: hashedPassword,
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
      },
      {
        userId: "MGR_001",
        userType: "office",
        personalInfo: {
          firstName: "Amit",
          lastName: "Singh",
          email: "amit.singh@cityguardian.gov",
          phone: "+91-9876543212",
          address: {
            street: "Command Center, Municipal Building",
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
          password: hashedPassword,
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
      }
    ];

    await this.db.collection('users').insertMany(sampleUsers);
    console.log('✅ Sample users inserted');
  }

  async insertSampleZones() {
    console.log('Inserting sample zones...');
    
    const sampleZones = [
      {
        zoneId: "ZONE_DTC",
        name: "Downtown Core",
        boundaries: {
          type: "Polygon",
          coordinates: [[
            [77.2000, 28.6100],
            [77.2200, 28.6100],
            [77.2200, 28.6300],
            [77.2000, 28.6300],
            [77.2000, 28.6100]
          ]]
        },
        statistics: {
          totalArea: 25.5,
          population: 150000,
          coverage: 95,
          activeIssues: 8,
          resolvedIssues: 245,
          averageResolutionTime: 4.2,
          employeeCount: 12,
          performanceScore: 92
        },
        targets: {
          aqiTarget: 80,
          resolutionTimeTarget: 4,
          customerSatisfactionTarget: 90
        },
        currentMetrics: {
          averageAqi: 65,
          activeReports: 8,
          completedTasks: 156,
          employeeEfficiency: 92,
          citizenSatisfaction: 87
        },
        settings: {
          priorityResponseTime: 30,
          workingHours: {
            start: "08:00",
            end: "18:00"
          },
          emergencyContacts: ["+91-9876543200"]
        },
        status: "operational",
        lastUpdated: new Date(),
        createdAt: new Date()
      },
      {
        zoneId: "ZONE_IE",
        name: "Industrial East",
        boundaries: {
          type: "Polygon",
          coordinates: [[
            [77.2500, 28.6000],
            [77.2800, 28.6000],
            [77.2800, 28.6200],
            [77.2500, 28.6200],
            [77.2500, 28.6000]
          ]]
        },
        statistics: {
          totalArea: 45.2,
          population: 80000,
          coverage: 88,
          activeIssues: 12,
          resolvedIssues: 189,
          averageResolutionTime: 5.8,
          employeeCount: 18,
          performanceScore: 78
        },
        targets: {
          aqiTarget: 100,
          resolutionTimeTarget: 6,
          customerSatisfactionTarget: 85
        },
        currentMetrics: {
          averageAqi: 110,
          activeReports: 12,
          completedTasks: 134,
          employeeEfficiency: 78,
          citizenSatisfaction: 82
        },
        settings: {
          priorityResponseTime: 45,
          workingHours: {
            start: "07:00",
            end: "19:00"
          },
          emergencyContacts: ["+91-9876543201"]
        },
        status: "alert",
        lastUpdated: new Date(),
        createdAt: new Date()
      }
    ];

    await this.db.collection('zones').insertMany(sampleZones);
    console.log('✅ Sample zones inserted');
  }

  async insertSampleEnvironmentalData() {
    console.log('Inserting sample environmental data...');
    
    const now = new Date();
    const sampleEnvironmentalData = [
      {
        sensorId: "SENSOR_DTC_001",
        location: {
          name: "Downtown Core",
          address: "Central Business District",
          coordinates: {
            latitude: 28.6139,
            longitude: 77.2090
          },
          zone: "Downtown Core"
        },
        measurements: {
          aqi: {
            value: 65,
            status: "good",
            trend: "down",
            components: {
              pm25: 25,
              pm10: 40,
              ozone: 60,
              no2: 30,
              so2: 15,
              co: 8
            }
          },
          weather: {
            temperature: 28.5,
            humidity: 65,
            windSpeed: 8.2,
            windDirection: "NW",
            pressure: 1013.2,
            rainfall: 0
          },
          noise: {
            level: 58,
            category: "moderate"
          }
        },
        targets: {
          aqiTarget: 80,
          noiseTarget: 55,
          temperatureTarget: 30
        },
        alerts: [],
        timestamp: now,
        createdAt: now
      },
      {
        sensorId: "SENSOR_IE_001",
        location: {
          name: "Industrial East",
          address: "Industrial Zone Central",
          coordinates: {
            latitude: 28.6100,
            longitude: 77.2650
          },
          zone: "Industrial East"
        },
        measurements: {
          aqi: {
            value: 110,
            status: "unhealthy",
            trend: "up",
            components: {
              pm25: 55,
              pm10: 80,
              ozone: 95,
              no2: 65,
              so2: 35,
              co: 18
            }
          },
          weather: {
            temperature: 32.1,
            humidity: 58,
            windSpeed: 5.5,
            windDirection: "SE",
            pressure: 1011.8,
            rainfall: 0
          },
          noise: {
            level: 72,
            category: "loud"
          }
        },
        targets: {
          aqiTarget: 100,
          noiseTarget: 65,
          temperatureTarget: 35
        },
        alerts: [
          {
            type: "threshold_exceeded",
            severity: "medium",
            message: "AQI exceeds target threshold",
            triggeredAt: new Date(now.getTime() - 3600000), // 1 hour ago
            resolvedAt: null,
            isActive: true
          }
        ],
        timestamp: now,
        createdAt: now
      }
    ];

    await this.db.collection('environmental_data').insertMany(sampleEnvironmentalData);
    console.log('✅ Sample environmental data inserted');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.initialize()
    .then(() => {
      console.log('🎉 Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseSetup;