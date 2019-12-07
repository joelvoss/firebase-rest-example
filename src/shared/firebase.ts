import * as fbAdmin from 'firebase-admin';
import * as fbClient from 'firebase';
import { requireServiceAccount } from './require-service-account';
import { logger } from './logger';

/**
 * Initialize the firebase admin sdk
 */
function initializeFirebaseAdmin() {
  try {
    // Create a client to perform the oAuth2 authorization flow.
    logger.info(`Initialize firebase admin.`);
    const key = requireServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT!);
    fbAdmin.initializeApp({
      credential: fbAdmin.credential.cert(key),
      databaseURL: process.env.FIREBASE_DB_DOMAIN,
    });
    return fbAdmin;
  } catch (err) {
    logger.error(err.msg);
    throw err;
  }
}
export const admin = initializeFirebaseAdmin();

/**
 * Initialize the firebase client sdk
 */
function initializeFirebaseClient() {
  try {
    logger.info(`Initialize firebase client.`);
    fbClient.initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    return fbClient;
  } catch (err) {
    logger.error(err.msg);
    throw err;
  }
}
export const client = initializeFirebaseClient();
