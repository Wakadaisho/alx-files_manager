// controllers/FilesController.js

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import mime from 'mime-types';
import Bull from 'bull';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

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
    const user = await dbClient.getUser(userId);

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).send({ error: 'Missing name' });

    if (!(type && FilesController.getFileTypes().includes(type))) {
      return res.status(400).send({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }

    if (parentId) {
      const parent = await dbClient.getFile(parentId, user._id);

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
    }

    const file = await dbClient.createFile(fileData);

    // Add thumbnail generation job to the queue
    fileQueue.add({
      userId: file.userId.toString(),
      fileId: file.id.toString(),
    });

    return res.status(201).send(file);
  }

  static async getShow(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.getUser(userId);

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { id: fileId } = req.params;

    const file = await dbClient.getFile(fileId, user._id);

    if (!file) return res.status(404).send({ error: 'Not found' });

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);
    const pageSize = 20;

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.getUser(userId);

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { parentId = 0, page = 1 } = req.query;

    const files = await dbClient.getFilesByParentId(
      parentId,
      page,
      pageSize,
      user,
    );

    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    const { id: fileId } = req.params;
    const user = await dbClient.getUser(userId);

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const file = await dbClient.getFile(fileId, user._id);

    if (!file) return res.status(404).send({ error: 'Not found' });

    const result = await dbClient.updateFile(fileId, { isPublic: true });

    return res.status(200).send(result);
  }

  static async putUnpublish(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    const { id: fileId } = req.params;
    const user = await dbClient.getUser(userId);

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const file = await dbClient.getFile(fileId, user._id);

    if (!file) return res.status(404).send({ error: 'Not found' });

    const result = await dbClient.updateFile(fileId, { isPublic: false });

    return res.status(200).send(result);
  }

  static async getFile(req, res) {
    const sizes = ['100', '250', '500'];

    const { id: fileId } = req.params;
    const { size } = req.query;

    let file = await dbClient.getFile(fileId, null, {
      localPath: true,
    });

    if (!file) {
      const apiToken = req.header('X-Token');
      const userId = await redisClient.get(`auth_${apiToken}`);

      if (!userId) return res.status(401).send({ error: 'Unauthorized' });

      const user = await dbClient.getUser(userId);

      if (!user) return res.status(401).send({ error: 'Unauthorized' });

      file = await dbClient.getFile(fileId, user._id, {
        localPath: true,
      });
    }

    if (!file) return res.status(404).send({ error: 'Not found' });

    if (file.type === 'folder') {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }

    let filePath = file.localPath;

    console.log('file.name', file.name);
    console.log('size', size);

    if (sizes.includes(size)) {
      filePath += `_${size}`;
    }

    console.log('filePath', filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const stat = fs.statSync(filePath);

    res.writeHead(200, {
      'Content-Type': mime.lookup(file.name),
      'Content-Length': stat.size,
    });

    const readStream = fs.createReadStream(filePath);
    readStream.on('open', () => {
      readStream.pipe(res);
    });

    readStream.on('error', (err) => res.end(err));

    return res;
  }
}

export default FilesController;
