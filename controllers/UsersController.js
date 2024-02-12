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

  static async getMe(request, response) {
    try {
      const token = request.header('X-Token');
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId) {
        console.log('Token not found!');
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const users = dbClient.db.collection('users');
      const idObject = new ObjectId(userId);
      const user = await users.findOne({ _id: idObject });

      if (user) {
        response.status(200).json({ id: userId, email: user.email });
      } else {
        response.status(401).json({ error: 'Unauthorized' });
      }
      return null;
    } catch (error) {
      console.error('Error in getMe:', error);
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UserController;
