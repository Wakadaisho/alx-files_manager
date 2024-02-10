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

  async getUser(query) {
    return this.client.db(dbName).collection('users').findOne(query);
  }

  async createUser(data) {
    return this.client.db(dbName).collection('users').insertOne(data);
  }

  async getFile(query) {
    return this.client.db(dbName).collection('files').findOne(query);
  }

  async createFile(data) {
    return this.client.db(dbName).collection('files').insertOne(data);
  }

  async getFileByParentId(query) {
    return this.client.db(dbName).collection('files').find(query).toArray();
  }
}

const dbClient = new DBClient();

export default dbClient;
