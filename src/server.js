require('./env');

const polka = require('polka');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const compression = require('compression');
const { logger } = require('./shared/logger');
const { send } = require('./shared/send-type');

// Routes
const { users } = require('./routes/users');
const { auth } = require('./routes/auth');

const server = polka();

// Middlewares
server.use(compression());
server.use(helmet());
server.use(bodyParser.json());

// Route configurations
server.get(`/`, (_, res) => {
  send(res, 200, 'ok');
});
server.get(`/_ah/health`, (_, res) => {
  send(res, 200, 'ok');
});
server.use(`/auth`, auth);
server.use(`/users`, users);

// Start server
server.listen(process.env.PORT, err => {
  if (err) {
    logger.error(err.message);
    throw err;
  }
  logger.info(`Running server on localhost:${process.env.PORT}`);
});
