import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).send({ error: 'Invalid credentials format' });
    }

    const [email, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':');

    const hashedPassword = sha1(password);
    const user = await dbClient.getUser({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized', details: 'Invalid email or password' });
    }

    const token = uuidv4();
    redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const apiToken = req.header('X-Token');
    if (!apiToken) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${apiToken}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    await redisClient.del(`auth_${apiToken}`);
    return res.status(204).send();
  }
}

export default AuthController;
