#!/bin/bash

# AWS MongoDB Atlas Setup Script for CityGuardian
echo "🚀 CityGuardian AWS MongoDB Atlas Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check environment
echo -e "${BLUE}📋 Step 1: Checking environment...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo -e "${YELLOW}💡 Creating .env.local template...${NC}"
    cat > .env.local << EOF
# MongoDB Atlas (AWS) Configuration
MONGODB_URI=mongodb+srv://anshikakhushikansal122004_db_usre:ciSzK0z11uFKJWO1@cluster0.9fseuc0.mongodb.net/cityguardian?retryWrites=true&w=majority&appName=Cluster0&ssl=true&authSource=admin&serverSelectionTimeoutMS=10000&connectTimeoutMS=10000&socketTimeoutMS=45000&maxPoolSize=10&minPoolSize=2

# AWS Configuration
AWS_REGION=us-east-1

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cityguardian-aws-mongodb-secret-key-2025-production

# JWT Configuration
JWT_SECRET=cityguardian-jwt-aws-secret-key-2025

# Application Configuration
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ .env.local created${NC}"
else
    echo -e "${GREEN}✅ .env.local found${NC}"
fi

# Step 2: Install dependencies
echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
if command -v npm &> /dev/null; then
    npm install --legacy-peer-deps
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ npm not found. Please install Node.js first${NC}"
    exit 1
fi

# Step 3: Test database connection
echo -e "${BLUE}🔄 Step 3: Testing MongoDB Atlas connection...${NC}"
npx tsx scripts/test-db.ts

# Step 4: Setup AWS deployment files
echo -e "${BLUE}☁️  Step 4: Setting up AWS deployment files...${NC}"

# Create docker-compose for local AWS testing
cat > docker-compose.aws.yml << EOF
version: '3.8'
services:
  cityguardian:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=\${MONGODB_URI}
      - AWS_REGION=\${AWS_REGION}
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

# Create AWS Lambda deployment script
cat > deploy-lambda.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying to AWS Lambda..."
npm run build
zip -r cityguardian-lambda.zip .next node_modules package.json
echo "📦 Lambda package created: cityguardian-lambda.zip"
echo "💡 Upload this to AWS Lambda or use AWS CLI/Terraform"
EOF

chmod +x deploy-lambda.sh

# Create Terraform configuration
cat > aws-infrastructure.tf << 'EOF'
# AWS Infrastructure for CityGuardian
provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "mongodb_uri" {
  sensitive = true
}

# Lambda function
resource "aws_lambda_function" "cityguardian" {
  filename         = "cityguardian-lambda.zip"
  function_name    = "cityguardian-app"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("cityguardian-lambda.zip")
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      MONGODB_URI = var.mongodb_uri
      NODE_ENV    = "production"
    }
  }
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "cityguardian-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}
EOF

echo -e "${GREEN}✅ AWS deployment files created${NC}"

# Step 5: Create production checklist
echo -e "${BLUE}📋 Step 5: Creating production checklist...${NC}"
cat > PRODUCTION_CHECKLIST.md << 'EOF'
# Production Deployment Checklist for AWS

## Pre-deployment
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Environment variables set for production
- [ ] SSL certificates configured
- [ ] Domain name configured
- [ ] AWS credentials configured

## Security
- [ ] NEXTAUTH_SECRET changed from default
- [ ] JWT_SECRET changed from default
- [ ] Database credentials secured
- [ ] AWS IAM roles configured
- [ ] VPC security groups configured

## Performance
- [ ] MongoDB Atlas connection pooling enabled
- [ ] AWS CloudFront CDN configured
- [ ] Application bundled and optimized
- [ ] Health checks configured
- [ ] Monitoring set up

## Backup & Recovery
- [ ] MongoDB Atlas backups enabled
- [ ] AWS backup strategy implemented
- [ ] Disaster recovery plan tested
- [ ] Data retention policies defined

## Monitoring
- [ ] AWS CloudWatch configured
- [ ] Error tracking set up
- [ ] Performance monitoring enabled
- [ ] Alerts configured
EOF

echo -e "${GREEN}✅ Production checklist created${NC}"

echo ""
echo -e "${GREEN}🎉 AWS MongoDB Atlas setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. 🔐 Add your IP to MongoDB Atlas whitelist"
echo "2. 🌐 Update NEXTAUTH_URL for production domain"
echo "3. 🔑 Change NEXTAUTH_SECRET and JWT_SECRET for production"
echo "4. ☁️  Deploy to AWS using provided deployment scripts"
echo "5. 📊 Monitor using AWS CloudWatch"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- AWS_DEPLOYMENT_GUIDE.md - Detailed deployment guide"
echo "- PRODUCTION_CHECKLIST.md - Pre-deployment checklist"
echo "- aws-infrastructure.tf - Terraform configuration"
echo ""
echo -e "${GREEN}🚀 Your CityGuardian app is AWS-ready!${NC}"