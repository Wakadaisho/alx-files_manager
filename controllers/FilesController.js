import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { ObjectId } from 'mongodb';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static getFileTypes() {
    return ['folder', 'file', 'image'];
  }

  static async postUpload(req, res) {
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.getUser({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).send({ error: 'Missing name' });

    if (!type) return res.status(400).send({ error: 'Missing type' });

    if (!FilesController.getFileTypes().includes(type)) {
      return res.status(400).send({ error: 'Invalid type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }

    if (parentId) {
      const parent = await dbClient.getFile({ _id: ObjectId(parentId) });

      if (!parent) return res.status(400).send({ error: 'Parent not found' });

      if (parent.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    if (type !== 'folder') {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
      fs.writeFileSync(`${FOLDER_PATH}/${uuidv4()}`, data, 'base64');
    }

    const { ops } = await dbClient.createFile({
      userId: user._id,
      name,
      type,
      parentId,
      isPublic,
    });

    return res.status(201).send({
      id: ops[0]._id,
      userId: ops[0].userId,
      name: ops[0].name,
      type: ops[0].type,
      isPublic: ops[0].isPublic,
    });
  }

  static async getShow(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.getUser({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const file = await dbClient.getFile({
      _id: ObjectId(req.params.id),
      userId: user._id,
    });

    if (!file) return res.status(404).send({ error: 'Not found' });

    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
    });
  }

  static async getIndex(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.getUser({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { parentId = 0 } = req.query;

    const parent = await dbClient.getFile({ _id: parentId });

    if (!parent || parent.type !== 'folder') {
      return res.status(200).send([]);
    }

    const files = await dbClient.getFiles({ parentId, userId: user._id });

    return res.status(200).send(files);
  }
}

export default FilesController;
