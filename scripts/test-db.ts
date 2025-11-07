import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('🔧 Loading environment from:', envPath);
dotenv.config({ path: envPath });

console.log('🌐 MONGODB_URI loaded:', process.env.MONGODB_URI ? 'Yes' : 'No');
console.log('🏗️  AWS_REGION:', process.env.AWS_REGION || 'Not specified');

async function testAWSMongoConnection() {
  try {
    console.log('🔄 Testing MongoDB Atlas (AWS) connection...');
    console.log('🎯 Target Database: cityguardian');
    console.log('☁️  Provider: MongoDB Atlas on AWS');
    
    // Dynamic imports to ensure env is loaded first
    const { default: dbConnect } = await import('@/lib/dbConnect');
    const { default: User } = await import('@/models/User');
    const { default: Complaint } = await import('@/models/Complaint');
    
    const startTime = Date.now();
    await dbConnect();
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ MongoDB Atlas (AWS) connected successfully in ${connectionTime}ms`);
    
    // Test database operations
    console.log('📊 Testing database operations...');
    
    // Test User model
    const userCount = await User.countDocuments();
    console.log(`� Users in database: ${userCount}`);
    
    // Test Complaint model
    const complaintCount = await Complaint.countDocuments();
    console.log(`� Complaints in database: ${complaintCount}`);
    
    // Test database connection info
    const mongoose = await import('mongoose');
    const connection = mongoose.default.connection;
    
    console.log('🔗 Connection Details:');
    console.log(`   Host: ${connection.host}`);
    console.log(`   Database: ${connection.name}`);
    console.log(`   Ready State: ${connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    // Test write operation (create a test document)
    console.log('✍️  Testing write operations...');
    const testUser = new User({
      name: 'Test User AWS',
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      mobile: '1234567890',
      role: 'citizen'
    });
    
    await testUser.save();
    console.log('✅ Write operation successful');
    
    // Cleanup test user
    await User.findByIdAndDelete(testUser._id);
    console.log('🧹 Test data cleaned up');
    
    console.log('🎉 All AWS MongoDB Atlas tests passed!');
    console.log('');
    console.log('🚀 Your application is ready for AWS deployment!');
    console.log('📚 Check AWS_DEPLOYMENT_GUIDE.md for deployment instructions');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ AWS MongoDB Atlas test failed:');
    console.error('');
    
    if (error.message?.includes('serverSelection')) {
      console.error('🚫 Connection Error: Could not connect to MongoDB Atlas');
      console.error('💡 Possible solutions:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify MongoDB Atlas IP whitelist includes your IP');
      console.error('   3. Confirm your MongoDB Atlas credentials are correct');
      console.error('   4. Ensure your MongoDB Atlas cluster is running');
    } else if (error.message?.includes('authentication')) {
      console.error('🔐 Authentication Error: Invalid credentials');
      console.error('💡 Solution: Check your MongoDB Atlas username and password');
    } else {
      console.error('🔍 Error Details:', error.message);
    }
    
    console.error('');
    console.error('🔧 For AWS-specific setup, check the AWS_DEPLOYMENT_GUIDE.md file');
    process.exit(1);
  }
}

testAWSMongoConnection();