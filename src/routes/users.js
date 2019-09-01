const polka = require('polka');
const { send } = require('../shared/send-type');
const { isAuthenticated } = require('../shared/is-authenticated');
const { admin } = require('../shared/firebase');
const { logger } = require('../shared/logger');

const users = polka();

/**
 * GET - All users
 * Requires authentication
 * @param {String} query.nextPageToken Pagination token
 * @return {Array} Array of user records
 */
users.use(isAuthenticated).get(`/`, async (req, res) => {
  try {
    const data = await admin.auth().listUsers(1000, req.query.nextPageToken);
    const users = data.users.map(usr => ({
      uid: usr.uid,
      email: usr.email,
      verified: usr.emailVerified,
      displayname: usr.displayName,
      lastSignInTime: usr.metadata.lastSignInTime,
      creationTime: usr.metadata.creationTime,
    }));
    send(res, 200, users);
  } catch (err) {
    logger.error(err.message, req.body);
    return send(res, 400, err.message);
  }
});

/**
 * GET - User by id
 * Requires authentication
 * @return {Object} User record
 */
users.use(isAuthenticated).get(`/:userId`, async (req, res) => {
  try {
    const userRecord = await admin.auth().getUser(req.params.userId);
    const user = {
      uid: userRecord.uid,
      email: userRecord.email,
      verified: userRecord.emailVerified,
      displayname: userRecord.displayName,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      creationTime: userRecord.metadata.creationTime,
    };
    return send(res, 200, user);
  } catch (err) {
    logger.error(err.message, req.body);
    return send(res, 400, err.message);
  }
});

exports.users = users;
