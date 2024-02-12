import sha1 from 'sha1';
import { ObjectId } from 'mongodb';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }

    const user = await dbClient.getUser({ email });
    if (user) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);
    const { ops } = await dbClient.createUser({
      email,
      password: hashedPassword,
    });

    return res.status(201).send({ id: ops[0]._id, email: ops[0].email });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectId(userId);

      users.findOne({ _id: idObject }, (err, user) => {
        if (user) {
          res.status(200).json({ id: userId, email: user.email });
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      console.log('Token not found!');
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = UserController;
