const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  await mongoose.connect(env.mongodbUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = { connectDB, mongoose };
