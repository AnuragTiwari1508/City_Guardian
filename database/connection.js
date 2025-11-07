// MongoDB Connection Configuration for CityGuardian
// File: database/connection.js

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://myselfkunal8859_db_user:Br4FEbwH7krJTXvi@cluster0.opfzo7f.mongodb.net/cityguardian?appName=Cluster0';
const DB_NAME = 'cityguardian';

class DatabaseConnection {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
      });

      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      
      console.log('Successfully connected to MongoDB Atlas');
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection(collectionName) {
    return this.getDatabase().collection(collectionName);
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

module.exports = {
  DatabaseConnection,
  dbConnection,
  DB_NAME
};