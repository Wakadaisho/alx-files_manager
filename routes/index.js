import AppController from '../controllers/AppController';
import UserController from '../controllers/UserController';
import AuthController from '../controllers/AuthController';

export default (app) => {
  // AppController
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  // UserController
  app.post('/users', UserController.postNew);
  app.get('/users/me', UserController.getMe);

  // AuthController
  app.get('/connect', AuthController.getConnect);
  app.get('/disconnect', AuthController.getDisconnect);
};
