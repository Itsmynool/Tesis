import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Function for connecting to MongoDB
const connectMongoDB = async () => {
  // Constants from .env
  const mongoUri = process.env.DATABASE_MONGO;
  // If DATABASE_MONGO is not defined
  if (!mongoUri) {
    console.error('DATABASE_MONGO is not defined in .env file');
    process.exit(1);
  }
  // Connect to MongoDB
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    // If there is an error
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectMongoDB;