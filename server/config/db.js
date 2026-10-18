const mongoose = require('mongoose');
const { mongoUri } = require('./config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server will continue running without MongoDB connection');
    console.log('Note: Authentication features require MongoDB to be running');
    // Don't exit process - allow server to run for health check
  }
};

module.exports = connectDB;
