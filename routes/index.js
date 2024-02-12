import AppController from '../controllers/AppController';
import UserController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

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

  // FilesController
  app.post('/files', FilesController.postUpload);
  app.get('/files/:id', FilesController.getShow);
  app.get('/files', FilesController.getIndex);
};
