# AWS Deployment Configuration for MongoDB Atlas

## Environment Variables for AWS Production

```bash
# MongoDB Atlas (AWS) - Production
MONGODB_URI=mongodb+srv://anshikakhushikansal122004_db_usre:ciSzK0z11uFKJWO1@cluster0.9fseuc0.mongodb.net/cityguardian?retryWrites=true&w=majority&appName=Cluster0&ssl=true&authSource=admin&serverSelectionTimeoutMS=10000&connectTimeoutMS=10000&socketTimeoutMS=45000&maxPoolSize=10&minPoolSize=2

# AWS Region (Set this to your MongoDB Atlas region)
AWS_REGION=us-east-1

# NextAuth for Production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key-32-chars-min

# JWT Secret for Production
JWT_SECRET=your-jwt-production-secret-key

# Application Environment
NODE_ENV=production
```

## AWS Specific Configurations

### 1. MongoDB Atlas IP Whitelist
- Go to MongoDB Atlas Dashboard
- Navigate to Network Access
- Add your AWS deployment IPs
- For development: Add `0.0.0.0/0` (temporary)
- For production: Add specific AWS EC2/Lambda IPs

### 2. AWS Lambda Configuration (if using serverless)
```yaml
# serverless.yml or similar
environment:
  MONGODB_URI: ${env:MONGODB_URI}
  AWS_REGION: ${env:AWS_REGION}
timeout: 30
memorySize: 512
```

### 3. AWS EC2 Configuration
```bash
# Install Node.js and dependencies
sudo apt update
sudo apt install nodejs npm
npm install

# Set environment variables
export MONGODB_URI="your-connection-string"
export AWS_REGION="us-east-1"
export NODE_ENV="production"

# Start application
npm run build
npm start
```

### 4. AWS ECS/Fargate Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 5. Security Best Practices for AWS
- Use AWS Secrets Manager for sensitive data
- Enable VPC for network isolation
- Use IAM roles for authentication
- Enable CloudWatch logging
- Set up AWS WAF for protection

### 6. Performance Optimization
- Use AWS CloudFront for CDN
- Enable MongoDB Atlas connection pooling
- Use AWS ElastiCache for session storage
- Monitor with AWS CloudWatch

### 7. Backup Strategy
- Enable MongoDB Atlas automatic backups
- Use AWS S3 for additional backups
- Set up cross-region replication
- Regular disaster recovery testing