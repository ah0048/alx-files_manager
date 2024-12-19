const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017'; // Fixed the port
    const database = process.env.DB_DATABASE || 'files_manager';

    // Create a new MongoClient instance
    this.mongoClient = new MongoClient(`mongodb://${host}:${port}`, { useNewUrlParser: true, useUnifiedTopology: true });

    // Connect to MongoDB
    this.mongoClient.connect((error) => {
      if (error) {
        console.error('Error connecting to MongoDB:', error);
      } else {
        this.db = this.mongoClient.db(database);
        console.log('Connected to MongoDB');
      }
    });
  }

  // Check if the client is alive by pinging the database
  isAlive() {
    return this.mongoClient.isConnected();
  }

  // Get the number of documents in the "users" collection
  async nbUsers() {
    const usersCollection = this.db.collection('users');
    const numUsersCollection = await usersCollection.countDocuments();
    return numUsersCollection;
  }

  // Get the number of documents in the "files" collection
  async nbFiles() {
    const filesCollection = this.db.collection('files');
    const numFilesCollection = await filesCollection.countDocuments();
    return numFilesCollection;
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
module.exports = dbClient;
