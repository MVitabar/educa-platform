import { MongoClient, Collection, MongoError } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

interface IndexInfo {
  name: string;
  key: { [key: string]: number };
  [key: string]: any;
}

async function removeOrderIndex() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/educa-platform');
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    // Get the lessons collection
    const db = client.db();
    const collection: Collection = db.collection('lessons');

    // List current indexes
    const indexes = await collection.indexes() as IndexInfo[];
    console.log('Current indexes:');
    console.log(indexes.map(idx => idx.name).join('\n'));

    // Remove section_1_order_1 index if it exists
    const sectionOrderIndex = indexes.find(idx => idx.name === 'section_1_order_1');
    if (sectionOrderIndex) {
      console.log('Removing section_1_order_1 index...');
      await collection.dropIndex('section_1_order_1');
      console.log('Successfully removed section_1_order_1 index');
    } else {
      console.log('section_1_order_1 index does not exist');
    }
    
    // Verify the index was removed
    const updatedIndexes = await collection.indexes() as IndexInfo[];
    console.log('\nRemaining indexes:');
    console.log(updatedIndexes.map(idx => idx.name).join('\n'));
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if ('codeName' in error) {
        const mongoError = error as MongoError & { codeName?: string };
        console.error('MongoDB Error Code:', mongoError.codeName);
      }
    } else {
      console.error('An unknown error occurred:', error);
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nConnection closed');
    process.exit(0);
  }
}

// Run the function
removeOrderIndex().catch(console.error);
