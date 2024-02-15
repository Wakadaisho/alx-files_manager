import { MongoClient, ObjectId } from 'mongodb';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '27017';
const dbName = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    this.client = new MongoClient(`mongodb://${dbHost}:${dbPort}/${dbName}`, {
      useUnifiedTopology: true,
    });
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

  async getUser(id) {
    return this.client
      .db(dbName)
      .collection('users')
      .findOne({ _id: ObjectId(id) });
  }

  async getUserByQuery(query) {
    return this.client.db(dbName).collection('users').findOne(query);
  }

  async createUser(data) {
    return this.client.db(dbName).collection('users').insertOne(data);
  }

  async getFile(id, userId, opts = {}) {
    const { localPath } = opts;

    const aggregate = [
      {
        $match: userId
          ? { _id: ObjectId(id), userId }
          : { _id: ObjectId(id), isPublic: true },
      },
      {
        $project: localPath
          ? {
            id: '$_id',
            _id: 0,
            userId: 1,
            name: 1,
            type: 1,
            isPublic: 1,
            parentId: 1,
            localPath: 1,
          }
          : {
            id: '$_id',
            _id: 0,
            userId: 1,
            name: 1,
            type: 1,
            isPublic: 1,
            parentId: 1,
          },
      },
    ];

    return (
      await this.client
        .db(dbName)
        .collection('files')
        .aggregate(aggregate)
        .toArray()
    )[0];
  }

  async createFile(data) {
    const { ops } = await this.client
      .db(dbName)
      .collection('files')
      .insertOne(data);

    const result = {
      id: ops[0]._id,
      ...ops[0],
    };

    delete result._id;
    delete result.localPath;

    return result;
  }

  async getFilesByParentId(parentId, page, pageSize, user) {
    const aggregate = [
      {
        $match:
          parentId === 0
            ? { userId: user._id, parentId: 0 }
            : { userId: user._id, parentId: ObjectId(parentId) },
      },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          id: '$_id',
          _id: 0,
          userId: 1,
          name: 1,
          type: 1,
          isPublic: 1,
          parentId: 1,
        },
      },
    ];

    return this.client
      .db(dbName)
      .collection('files')
      .aggregate(aggregate)
      .toArray();
  }

  async updateFile(id, data) {
    const { value } = await this.client
      .db(dbName)
      .collection('files')
      .findOneAndUpdate(
        { _id: ObjectId(id) },
        { $set: data },
        { returnDocument: 'after' },
      );

    const result = {
      id: value._id,
      ...value,
    };

    delete result._id;
    delete result.localPath;

    return result;
  }
}

const dbClient = new DBClient();

export default dbClient;
