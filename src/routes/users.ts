import express from 'express';
import { isAuthenticated } from '../shared/is-authenticated';
import { admin } from '../shared/firebase';
import { logger } from '../shared/logger';
import { auth } from 'firebase-admin';

const router = express.Router();

/**
 * GET - All users
 * Requires authentication
 * @param {String} query.nextPageToken Pagination token
 * @return {Array} Array of user records
 */
router.get(`/`, isAuthenticated, async (req, res) => {
  try {
    const data = await admin.auth().listUsers(1000, req.query.nextPageToken);
    const users = data.users.map((usr: auth.UserRecord) => ({
      uid: usr.uid,
      email: usr.email,
      verified: usr.emailVerified,
      displayname: usr.displayName,
      lastSignInTime: usr.metadata.lastSignInTime,
      creationTime: usr.metadata.creationTime,
    }));
    logger.info(`/users - List ${users.length}/1000 users`);
    return res.status(200).json(users);
  } catch (err) {
    logger.error(err.message, req.body);
    return res.status(400).json(err.message);
  }
});

/**
 * GET - User by id
 * Requires authentication
 * @return {Object} User record
 */
router.get(`/:userId`, isAuthenticated, async (req, res) => {
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
    logger.info(`/:userId - Get user '${user.uid}'`);
    return res.status(200).json(user);
  } catch (err) {
    logger.error(err.message, req.body);
    return res.status(400).json(err.message);
  }
});

export const users = router;
