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
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.getUser({ _id: ObjectId(userId) });

    return res.status(200).send({ id: user._id, email: user.email });
  }
}

export default UserController;
