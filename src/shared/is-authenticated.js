const { admin } = require('./firebase');
const { send } = require('./send-type');
const { logger } = require('./logger');

/**
 * Middleware to check if a request is authenticated.
 */
function isAuthenticated(req, res, next) {
  let token = req.headers['authorization'];
  if (!token) {
    return send(res, 401, 'token-not-found');
  }

  // Strip "Bearer"
  token = token.split(' ')[1];

  // Verify token
  admin
    .auth()
    .verifyIdToken(token)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      logger.debug(`invalid-token`);
      send(res, 401, 'invalid-token');
    });
}

exports.isAuthenticated = isAuthenticated;
