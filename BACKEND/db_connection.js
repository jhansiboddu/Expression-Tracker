const mongoose = require('mongoose');
require('dotenv').config();  // Load environment variables

// Get the MongoDB URI from the .env file
const uri = process.env.MONGODB_URI;//for sessions 
const adminUri = process.env.MONGODB_ADMIN_URI; // For adminInfo database

const connectToDB = async () => {
  try {
    await mongoose.connect(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Adjust as needed
      socketTimeoutMS: 45000, // Adjust as needed
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

const adminConnection = mongoose.createConnection(adminUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
});

// Event listeners for adminConnection
adminConnection.on('connected', () => {
  console.log('Connected to adminInfo database');
});
adminConnection.on('error', (error) => {
  console.error('AdminInfo database connection error:', error);
});

module.exports = {connectToDB , adminConnection};