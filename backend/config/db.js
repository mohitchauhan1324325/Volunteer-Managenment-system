const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('------------------------------------------------------------');
    console.log('WARNING: MONGODB_URI is not defined in backend/.env');
    console.log('Falling back to local JSON database storage.');
    console.log('------------------------------------------------------------');
    global.isMockDatabase = true;
    return;
  }
  
  try {
    // Attempt connecting to MongoDB with a short timeout so the dev server starts quickly
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('------------------------------------------------------------');
    console.log('SUCCESS: Connected to MongoDB database.');
    console.log('------------------------------------------------------------');
    global.isMockDatabase = false;
  } catch (error) {
    console.log('------------------------------------------------------------');
    console.warn(`WARNING: Failed to connect to MongoDB at ${uri}`);
    console.warn(`Reason: ${error.message}`);
    console.warn('Falling back to local JSON database storage.');
    console.log('------------------------------------------------------------');
    global.isMockDatabase = true;
  }
};

module.exports = { connectDB };
