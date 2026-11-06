const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { spawn } = require('child_process');
const { mongoUri } = require('./config');

// Cache connection for serverless functions
let cachedConnection = null;

const isPortOpen = (port = 27017, host = '127.0.0.1') => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

const findLocalMongod = () => {
  const cacheDir = path.join(__dirname, '../node_modules/.cache/mongodb-memory-server');
  if (!fs.existsSync(cacheDir)) return null;
  const files = fs.readdirSync(cacheDir);
  const exe = files.find(f => f.startsWith('mongod') && (f.endsWith('.exe') || !f.includes('.')));
  return exe ? path.join(cacheDir, exe) : null;
};

const ensureLocalMongoRunning = async () => {
  const isOpen = await isPortOpen(27017);
  if (isOpen) {
    return true;
  }

  const mongodPath = findLocalMongod();
  if (!mongodPath) {
    console.log('No local mongod binary found in cache');
    return false;
  }

  const dataDir = path.join(__dirname, '../data/db');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Starting local mongod from ${mongodPath}...`);
  const child = spawn(mongodPath, ['--dbpath', dataDir, '--port', '27017'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  // Wait for mongod to start listening
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isPortOpen(27017)) {
      console.log('Local mongod started successfully on port 27017');
      return true;
    }
  }

  console.warn('Timed out waiting for local mongod to listen on port 27017');
  return false;
};

const autoSeedIfEmpty = async () => {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Auto-seeding test users...');
      const seedUsers = require('../seeds/authSeed');
      await seedUsers();
    }
  } catch (err) {
    console.error('Error during auto-seed check:', err.message);
  }
};

const connectDB = async () => {
  // Return cached connection if available
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // If local MongoDB is configured and not running, start it
    if (mongoUri.includes('localhost:27017') || mongoUri.includes('127.0.0.1:27017')) {
      await ensureLocalMongoRunning();
    }

    const conn = await mongoose.connect(mongoUri, {
      // Connection pooling options for serverless
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed if database is brand new
    await autoSeedIfEmpty();

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
