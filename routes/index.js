import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

export default (app) => {
  // AppController
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  // UsersController
  app.post('/users', UsersController.postNew);
  app.get('/users/me', UsersController.getMe);

  // AuthController
  app.get('/connect', AuthController.getConnect);
  app.get('/disconnect', AuthController.getDisconnect);

  // FilesController
  app.post('/files', FilesController.postUpload);
  app.get('/files/:id', FilesController.getShow);
  app.get('/files', FilesController.getIndex);
};
