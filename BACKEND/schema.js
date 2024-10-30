const mongoose = require('mongoose');

// Define a schema for session data
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  sessionName: { type: String, required: true },  // Add sessionName to store player name
  imagePaths: [String],  // Array of strings for image paths
  screenshotPaths: [String],  // Array of strings for screenshot paths
  timestamp: { type: [String], default: () => [new Date().toLocaleDateString(), new Date().toLocaleTimeString()] }, // Store date and time as an array
  modelResponse: { type: Array, required: false }
});

// Create a model for the schema
const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

// admin.js

// Define schema for admin information
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String }
});

// Use a different connection for the `adminInfo` database
const adminConnection = mongoose.createConnection(
  'mongodb://<username>:<password>@cluster0.mongodb.net/adminInfoDB'
);

// Create a model for the admin schema
const Admin = adminConnection.model('Admin', adminSchema);

module.exports = {Session,Admin};

