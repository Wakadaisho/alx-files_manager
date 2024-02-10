import sha1 from 'sha1';

import dbClient from '../utils/db';

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }

    const userExists = await dbClient.getUser({ email });
    if (userExists) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);
    const { ops } = await dbClient.createUser({
      email,
      password: hashedPassword,
    });

    return res.status(201).send({ id: ops[0]._id, email: ops[0].email });
  }

  static getMe(req, res) {
    return res.status(200).send({});
  }
}

export default UserController;
