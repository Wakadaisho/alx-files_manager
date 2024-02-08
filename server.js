import express from 'express';
import routes from './routes/index';

const port = process.env.PORT || 5000;

const app = express();
routes(app);

app.listen(port);

export default app;
