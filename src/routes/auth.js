const polka = require('polka');
const { send } = require('../shared/send-type');
const { admin, client } = require('../shared/firebase');
const { generateDisplayName } = require('../shared/generate-displayname');
const { logger } = require('../shared/logger');

const auth = polka();

/**
 * POST - Sign up new user.
 * @param {String} body.email Email address
 * @param {String} body.password Raw, unhashed password
 * @param {String} body.displayName (Optional) User's display name
 * @return {String}
 */
auth.post(`/signup`, async (req, res) => {
  if (!req.body.email || !req.body.password) {
    logger.error('insufficent-parameters');
    return send(res, 400, 'insufficent-parameters');
  }

  const displayName = req.body.displayName || generateDisplayName();

  try {
    const { uid } = await admin.auth().createUser({
      email: req.body.email,
      password: req.body.password,
      displayName,
    });

    // In order to send an email verification through firebase, we need to
    //  1) Create a custom token using the admin sdk
    //  2) Sign in using our custom token using the client sdk
    //  3) Send the email verification using the client sdk
    const customToken = await admin.auth().createCustomToken(uid);
    await client.auth().signInWithCustomToken(customToken);
    await client.auth().currentUser.sendEmailVerification();

    return send(res, 200, 'ok');
  } catch (err) {
    logger.error(err.message, req.body);
    return send(res, 400, err.message);
  }
});

/**
 * POST - Sign in user by email and password
 * @param {String} body.email Email address
 * @param {String} body.password Raw, unhashed password
 * @return {Object} Token
 */
auth.post(`/signin`, async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return send(res, 400, 'insufficent-parameters');
  }

  try {
    // Try to sign the user in via email and password
    await client
      .auth()
      .signInWithEmailAndPassword(req.body.email, req.body.password);

    // Get idToken from signed in user
    const idToken = await client.auth().currentUser.getIdToken(true);
    return send(res, 200, { token: idToken });
  } catch (err) {
    logger.error(err.message, req.body);
    return send(res, 400, err.message);
  }
});

/**
 * GET - Confirm a password reset event.
 * @param {String} body.actionCode Firebase action code
 * @param {String} body.password New password
 * @return {String}
 */
auth.get(`/password-reset`, async (req, res) => {
  const actionCode = req.params.actionCode || req.query.actionCode;
  const password = req.params.password || req.query.password;

  if (!actionCode || !password) {
    return send(res, 400, 'insufficent-parameters');
  }

  let email;
  try {
    email = await client.auth().verifyPasswordResetCode(actionCode);
  } catch (err) {
    logger.error(err.message, { actionCode });
    return send(res, 400, err.message);
  }

  try {
    await client.auth().confirmPasswordReset(actionCode, password);
    return send(res, 200, `Password reset for ${email} verified.`);
  } catch (err) {
    logger.error(err.message, { actionCode, password });
    return send(res, 400, err.message);
  }
});

/**
 * POST - Send a password reset email to the users email address.
 * @param {String} body.email Email address
 * @return {String}
 */
auth.post(`/password-reset`, async (req, res) => {
  if (!req.body.email) {
    return send(res, 400, 'insufficent-parameters');
  }

  try {
    await client.auth().sendPasswordResetEmail(req.body.email);
    return send(res, 200, 'ok');
  } catch (err) {
    logger.error(err.message, req.body);
    return send(res, 400, err.message);
  }
});

exports.auth = auth;
