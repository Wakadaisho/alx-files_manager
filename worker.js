import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import { ObjectId } from 'mongodb';

import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  const sizes = [100, 250, 500];

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.getFile(fileId, ObjectId(userId), {
    localPath: true,
  });

  if (!file) throw new Error('File not found');

  if (file.type === 'folder') {
    return;
  }

  const thumbnails = sizes.map(async (size) => {
    const thumbnail = await imageThumbnail(file.localPath, { width: size });
    const thumbnailSizePath = `${file.localPath}_${size}`;
    fs.writeFileSync(thumbnailSizePath, thumbnail);
  });
  await Promise.all(thumbnails);
  done();
});

userQueue.process((job, done) => {
  const { email, userId } = job.data;

  if (!userId) throw new Error('Missing userId');

  const user = dbClient.getUser(userId);

  if (!user) throw new Error('User not found');

  console.log(`Welcome ${email}!`);
  job.log(`Welcome ${email}!`);
  done();
});

module.exports = { fileQueue, userQueue };
