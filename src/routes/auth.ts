import express, { Request, Response } from 'express';
import { admin, client } from '../shared/firebase';
import { generateDisplayName } from '../shared/generate-displayname';
import { logger } from '../shared/logger';

const router = express.Router();

/**
 * POST - Sign up new user.
 * @param {String} body.email Email address
 * @param {String} body.password Raw, unhashed password
 * @param {String} body.displayName (Optional) User's display name
 * @return {String}
 */
router.post(`/signup`, async (req: Request, res: Response) => {
  if (!req.body.email || !req.body.password) {
    logger.error('insufficent-parameters');
    return res.status(400).json('insufficent-parameters');
  }

  const displayName = req.body.displayName || generateDisplayName();

  try {
    const { uid } = await admin.auth().createUser({
      email: req.body.email,
      password: req.body.password,
      displayName,
    });
    logger.info(`/auth/signup - Created user '${uid}'`);

    // In order to send an email verification through firebase, we need to
    //  1) Create a custom token using the admin sdk
    //  2) Sign in using our custom token using the client sdk
    //  3) Send the email verification using the client sdk
    const customToken = await admin.auth().createCustomToken(uid);
    await client.auth().signInWithCustomToken(customToken);
    await client.auth().currentUser!.sendEmailVerification();

    logger.info(`/auth/signup - Email verification sent`);
    return res.status(200).json('ok');
  } catch (err) {
    logger.error(err.message, req.body);
    return res.status(400).json(err.message);
  }
});

/**
 * POST - Sign in user by email and password
 * @param {String} body.email Email address
 * @param {String} body.password Raw, unhashed password
 * @return {Object} Token
 */
router.post(`/signin`, async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json('insufficent-parameters');
  }

  try {
    // Try to sign the user in via email and password
    await client
      .auth()
      .signInWithEmailAndPassword(req.body.email, req.body.password);

    // Get idToken from signed in user
    const idToken = await client.auth().currentUser!.getIdToken(true);
    logger.info(
      `/auth/signin - Mint access token '${idToken.slice(0, 10)}...'`,
    );
    return res.status(200).json({ token: idToken });
  } catch (err) {
    logger.error(err.message, req.body);
    return res.status(400).json(err.message);
  }
});

/**
 * GET - Confirm a password reset event.
 * @param {String} body.actionCode Firebase action code
 * @param {String} body.password New password
 * @return {String}
 */
router.get(`/password-reset`, async (req, res) => {
  const actionCode = req.params.actionCode || req.query.actionCode;
  const password = req.params.password || req.query.password;

  if (!actionCode || !password) {
    return res.status(400).json('insufficent-parameters');
  }

  let email;
  try {
    email = await client.auth().verifyPasswordResetCode(actionCode);
    logger.info(`/auth/password-reset - Password reset code verified`);
  } catch (err) {
    logger.error(err.message, { actionCode });
    return res.status(400).json(err.message);
  }

  try {
    await client.auth().confirmPasswordReset(actionCode, password);
    logger.info(`/auth/password-reset - Password reset for ${email} verified.`);
    return res.status(200).json(`Password reset for ${email} verified.`);
  } catch (err) {
    logger.error(err.message, { actionCode, password });
    return res.status(400).json(err.message);
  }
});

/**
 * POST - Send a password reset email to the users email address.
 * @param {String} body.email Email address
 * @return {String}
 */
router.post(`/password-reset`, async (req, res) => {
  if (!req.body.email) {
    return res.status(400).json('insufficent-parameters');
  }

  try {
    await client.auth().sendPasswordResetEmail(req.body.email);
    logger.info(`/auth/password-reset - Password reset email sent`);
    return res.status(200).json('ok');
  } catch (err) {
    logger.error(err.message, req.body);
    return res.status(400).json(err.message);
  }
});

export const auth = router;
