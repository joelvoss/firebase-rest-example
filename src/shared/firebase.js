const admin = require('firebase-admin');
const client = require('firebase');
const { requireServiceAccount } = require('./require-service-account');
const { logger } = require('./logger');

/**
 * Initialize the firebase admin sdk
 * @return {Object} Admin instance
 */
function initializeFirebaseAdmin() {
  try {
    // Create a client to perform the oAuth2 authorization flow.
    logger.info(`Initialize firebase admin.`);
    const key = requireServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(key),
      databaseURL: process.env.FIREBASE_DB_DOMAIN,
    });
    return admin;
  } catch (err) {
    logger.error(err.msg);
    throw err;
  }
}
exports.admin = initializeFirebaseAdmin();

/**
 * Initialize the firebase client sdk
 * @return {Object} Client instance
 */
function initializeFirebaseClient() {
  try {
    logger.info(`Initialize firebase client.`);
    client.initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    return client;
  } catch (err) {
    logger.error(err.msg);
    throw err;
  }
}
exports.client = initializeFirebaseClient();
