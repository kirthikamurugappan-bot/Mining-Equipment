const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = (process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();
  
  // Clean up any quotes or whitespace that might be pasted by accident in Render UI
  uri = uri.replace(/^["']+|["']+$/g, '').trim();

  // If "MONGO_URI=..." was pasted into the value input field
  if (uri.startsWith('MONGO_URI=')) {
    uri = uri.replace(/^MONGO_URI=\s*/, '').replace(/^["']+|["']+$/g, '').trim();
  }

  if (!uri) {
    console.error('❌ MongoDB Connection Error: MONGO_URI (or MONGODB_URI) environment variable is missing.');
    console.error('👉 Please add MONGO_URI to your Render Environment Variables.');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host} → ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
