import { v4 as uuidv4 } from 'uuid';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    // create Authorization header
    const authHeader = req.header('Authorization');
    const [email] = Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':');
    const userExists = await dbClient.getUser({ email });

    if (!userExists) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    redisClient.set(`auth_${token}`, userExists._id, 24 * 60 * 60);

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const apiToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(`auth_${apiToken}`);

    return res.status(204).send();
  }
}

export default AuthController;
