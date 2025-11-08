# CityGuardian Database Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB installation)
- Git

### 2. Database Connection
Your MongoDB connection string:
```
mongodb+srv://myselfkunal8859_db_user:Br4FEbwH7krJTXvi@cluster0.opfzo7f.mongodb.net/cityguardian?appName=Cluster0
```

### 3. Installation & Setup

```bash
# Navigate to database directory
cd database

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env

# Run database setup (creates indexes and sample data)
npm run setup

# Start the development server
npm run dev
```

### 4. Environment Configuration

Edit the `.env` file and update the following:

```env
# Your MongoDB connection (already provided)
MONGODB_URI=mongodb+srv://myselfkunal8859_db_user:Br4FEbwH7krJTXvi@cluster0.opfzo7f.mongodb.net/cityguardian?appName=Cluster0

# Generate a secure JWT secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server configuration
PORT=3001
NODE_ENV=development
```

## Database Schema Overview

### Collections Created:
1. **users** - User accounts (citizens, employees, managers)
2. **reports** - Citizen complaints and reports
3. **tasks** - Employee tasks and assignments
4. **environmental_data** - AQI and environmental monitoring
5. **zones** - Geographic zone management
6. **community_posts** - Community feed and announcements
7. **performance_analytics** - Performance metrics and analytics
8. **notifications** - User notifications
9. **leaderboards** - Ranking and gamification data
10. **system_settings** - Application configuration
11. **audit_logs** - System audit trail

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Reports
- `POST /api/reports` - Create new report
- `GET /api/reports/my-reports` - Get user's reports
- `GET /api/reports/zone/:zone` - Get reports by zone
- `PUT /api/reports/:reportId/status` - Update report status

### Tasks
- `GET /api/tasks/my-tasks` - Get employee tasks
- `PUT /api/tasks/:taskId/progress` - Update task progress

### Environmental Data
- `GET /api/environmental/zone/:zone/latest` - Get latest environmental data
- `GET /api/environmental/latest-all` - Get all latest readings

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Sample API Usage

### 1. User Registration
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    password: 'securepassword123',
    firstName: 'John',
    lastName: 'Doe',
    userType: 'citizen',
    phone: '+91-9876543210'
  })
});
```

### 2. User Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    password: 'securepassword123'
  })
});

const data = await response.json();
const token = data.token; // Store this for authenticated requests
```

### 3. Create Report (Authenticated)
```javascript
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    reportType: 'pothole',
    title: 'Large pothole on Main Street',
    description: 'Dangerous pothole causing vehicle damage',
    location: {
      address: 'Main Street, Downtown',
      coordinates: {
        latitude: 28.6139,
        longitude: 77.2090
      },
      zone: 'Downtown Core'
    },
    priority: 'high',
    category: 'Road Infrastructure'
  })
});
```

## Default Sample Users

The setup script creates these sample users:

### Citizen User
- **Email:** rajesh.kumar@example.com
- **Password:** [Generated during setup]
- **Type:** citizen

### Employee User
- **Email:** priya.sharma@cityguardian.gov
- **Password:** [Generated during setup]
- **Type:** employee

### Manager User
- **Email:** amit.singh@cityguardian.gov
- **Password:** [Generated during setup]
- **Type:** office

## Database Maintenance

### Backup Database
```bash
# Create backup
mongodump --uri="mongodb+srv://myselfkunal8859_db_user:Br4FEbwH7krJTXvi@cluster0.opfzo7f.mongodb.net/cityguardian"

# Restore from backup
mongorestore --uri="mongodb+srv://myselfkunal8859_db_user:Br4FEbwH7krJTXvi@cluster0.opfzo7f.mongodb.net/cityguardian" dump/cityguardian/
```

### Monitor Performance
```javascript
// Check database stats
use cityguardian
db.stats()

// Check collection sizes
db.runCommand("collStats", "users")
db.runCommand("collStats", "reports")
```

## Security Best Practices

1. **Change default JWT secret** in production
2. **Use environment variables** for sensitive data
3. **Enable MongoDB authentication** in production
4. **Set up proper CORS** for your frontend domain
5. **Use HTTPS** in production
6. **Regular database backups**
7. **Monitor and log** API access

## Troubleshooting

### Common Issues:

1. **Connection Error:**
   ```
   Error: MongoNetworkError: failed to connect to server
   ```
   - Check internet connection
   - Verify MongoDB URI
   - Check IP whitelist in MongoDB Atlas

2. **Authentication Error:**
   ```
   Error: Authentication failed
   ```
   - Verify username and password in connection string
   - Check database user permissions

3. **Port Already in Use:**
   ```
   Error: listen EADDRINUSE :::3001
   ```
   - Change PORT in .env file
   - Kill process using the port: `lsof -ti:3001 | xargs kill -9`

## Production Deployment

### Environment Variables for Production:
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-super-secure-jwt-secret
PORT=3001
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### MongoDB Atlas Production Setup:
1. Create production cluster
2. Set up proper user roles and permissions
3. Configure IP whitelist
4. Enable monitoring and alerts
5. Set up automated backups

## Support

For issues or questions:
1. Check the MongoDB Atlas dashboard for connection issues
2. Review server logs for error details
3. Test API endpoints using tools like Postman or curl
4. Verify environment variables are set correctly

## Next Steps

1. **Frontend Integration:** Use the API endpoints in your Next.js frontend
2. **Real-time Features:** Implement WebSocket connections for live updates
3. **File Upload:** Add image/video upload functionality for reports
4. **Push Notifications:** Implement mobile push notifications
5. **Analytics Dashboard:** Create admin dashboard for system analytics