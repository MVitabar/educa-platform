import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function listIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/educa-platform');
    console.log('Connected to MongoDB');

    // Get the lessons collection
    const db = mongoose.connection.db;
    const collection = db.collection('lessons');

    // Get all indexes
    const indexes = await collection.indexes();
    
    console.log('Current indexes on lessons collection:');
    console.log(JSON.stringify(indexes, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing indexes:', error);
    process.exit(1);
  }
}

listIndexes();
