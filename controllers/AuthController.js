class AuthController {
  static async getConnect(req, res) {
    res.status(200).send({ connect: true });
  }

  static async getDisconnect(req, res) {
    res.status(200).send({ connect: false });
  }
}

export default AuthController;
