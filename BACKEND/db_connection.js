const mongoose = require('mongoose');
require('dotenv').config();  // Load environment variables

// Get the MongoDB URI from the .env file
const uri = process.env.MONGODB_URI;//for sessions 

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

module.exports = connectToDB;