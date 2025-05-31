// config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Added write concern and read concern for stronger consistency guarantees
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      writeConcern: { w: 'majority', j: true },
      readConcern: { level: 'majority' },
      readPreference: 'primary'
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
