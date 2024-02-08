import { MongoClient } from 'mongodb';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '27017';
const dbName = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    this.client = new MongoClient(`mongodb://${dbHost}:${dbPort}/${dbName}`, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db(dbName).collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db(dbName).collection('files').countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
