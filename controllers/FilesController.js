// controllers/FilesController.js

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import mime from 'mime-types';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import Bull from 'bull';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Create Bull queue
const fileQueue = new Bull('fileQueue');

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

    const fileData = {
      userId: user._id,
      name,
      type,
      parentId,
      isPublic,
    };

    if (type !== 'folder') {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
      const filePath = `${FOLDER_PATH}/${uuidv4()}`;
      fs.writeFileSync(filePath, data, 'base64');
      fileData.localPath = filePath;

      // Add thumbnail generation job to the queue
      fileQueue.add({
        userId: user._id.toString(),
        fileId: fileData._id.toString(),
      });
    }

    const { ops } = await dbClient.createFile(fileData);

    return res.status(201).send({
      id: ops[0]._id,
      userId: ops[0].userId,
      name: ops[0].name,
      type: ops[0].type,
      isPublic: ops[0].isPublic,
    });
  }

  static async putPublish(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const user = await dbClient.getUser({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const file = await dbClient.getFile({
      _id: ObjectId(fileId),
      userId: user._id,
    });

    if (!file) return res.status(404).send({ error: 'Not found' });

    file.isPublic = true;
    await dbClient.updateFile(fileId, { isPublic: true });

    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const user = await dbClient.getUser({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const file = await dbClient.getFile({
      _id: ObjectId(fileId),
      userId: user._id,
    });

    if (!file) return res.status(404).send({ error: 'Not found' });

    file.isPublic = false;
    await dbClient.updateFile(fileId, { isPublic: false });

    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const user = await dbClient.getUser({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const file = await dbClient.getFile({
      _id: ObjectId(fileId),
      userId: user._id,
    });

    if (!file) return res.status(404).send({ error: 'Not found' });

    if (!file.isPublic && (file.userId.toString() !== userId)) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }

    const filePath = file.localPath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (req.query.size) {
      const thumbnailPath = `${filePath}_${req.query.size}`;
      if (!fs.existsSync(thumbnailPath)) {
        return res.status(404).send({ error: 'Not found' });
      }
      const mimeType = mime.lookup(thumbnailPath);
      res.setHeader('Content-Type', mimeType);
      return fs.createReadStream(thumbnailPath).pipe(res);
    }

    const mimeType = mime.lookup(filePath);
    res.setHeader('Content-Type', mimeType);
    return fs.createReadStream(filePath).pipe(res);
  }
}

export default FilesController;
