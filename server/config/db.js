const mongoose = require('mongoose');
const { mongoUri } = require('./config');

// Cache connection for serverless functions
let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection if available
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      // Connection pooling options for serverless
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server will continue running without MongoDB connection');
    console.log('Note: Authentication features require MongoDB to be running');
    // Don't exit process - allow server to run for health check
    return null;
  }
};

module.exports = connectDB;
