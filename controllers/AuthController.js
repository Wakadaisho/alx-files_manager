import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    const [email, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':');
    const user = await dbClient.getUser({ email, password: sha1(password) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    redisClient.set(`auth_${token}`, user._id, 24 * 60 * 60);

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
