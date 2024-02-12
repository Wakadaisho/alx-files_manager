import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(request, response) {
    const authData = request.header('Authorization');

    if (!authData || !authData.startsWith('Basic ')) {
      response.status(401).json({ error: 'Invalid credentials format' });
      return;
    }

    const base64Credentials = authData.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hashedPassword = sha1(password);

    const users = dbClient.db.collection('users');
    users.findOne({ email, password: hashedPassword }, async (err, user) => {
      if (user) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
        response.status(200).json({ token });
      } else {
        response.status(401).json({ error: 'Unauthorized' });
      }
    });
  }

  static async getDisconnect(req, res) {
    const apiToken = req.header('X-Token');

    if (!apiToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${apiToken}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(`auth_${apiToken}`);
    return res.status(204).send();
  }
}

export default AuthController;
