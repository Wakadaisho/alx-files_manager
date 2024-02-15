import sha1 from 'sha1';
import Bull from 'bull';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Bull('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }

    const user = await dbClient.getUserByQuery({ email });
    if (user) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);
    const { ops } = await dbClient.createUser({
      email,
      password: hashedPassword,
    });

    userQueue.add({ userId: ops[0]._id.toString(), email: ops[0].email });
    return res.status(201).send({ id: ops[0]._id, email: ops[0].email });
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.getUser(userId);

    return response.status(200).send({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
