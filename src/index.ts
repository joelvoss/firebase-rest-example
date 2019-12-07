import './env';

import express, { Request, Response } from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import compression from 'compression';
import { logger } from './shared/logger';

// Routes
import { users } from './routes/users';
import { auth } from './routes/auth';

const app = express();

// Middlewares
app.use(compression());
app.use(helmet());
app.use(bodyParser.json());

// Route configurations
app.get(`/`, (_: Request, res: Response) => {
  return res.status(200).json('ok');
});

// Handle App-Engine /_ah/start, /_ah/stop, /_ah/health routes
app.get(`/_ah/**`, (_, res) => {
  return res.status(200).send('ok');
});

app.use(`/auth`, auth);
app.use(`/users`, users);

// Start server
app.listen(process.env.PORT, () => {
  logger.info(`Running server on port ${process.env.PORT}`);
});
