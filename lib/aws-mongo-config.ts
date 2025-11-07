// AWS MongoDB Atlas Configuration
export const mongoConfig = {
  // Connection pool settings optimized for AWS
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  
  // Timeout settings for AWS network latency
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  
  // Write concern for Atlas
  retryWrites: true,
  w: 'majority' as const,
  
  // Authentication for Atlas
  authSource: 'admin',
  
  // Compression for network optimization
  compressors: 'zlib',
  
  // SSL settings
  ssl: true,
  
  // Buffer settings
  bufferCommands: false,
  bufferMaxEntries: 0,
};

// AWS Region mapping for optimal performance
export const awsRegionMapping = {
  'us-east-1': 'US East (N. Virginia)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'Europe (Ireland)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
};

// Connection retry configuration for AWS
export const retryConfig = {
  retryDelayMS: 1000,
  maxRetries: 3,
  backoffMultiplier: 2,
};

export default mongoConfig;