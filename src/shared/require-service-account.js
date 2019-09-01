const fs = require('fs');
const { logger } = require('./logger');

/**
 * Require a service account specified by its `keyFileName`.
 * The service account has to be stored inside the `/secret` folder.
 * @param {String} keyFileName Name of the service account keyfile.
 * @return {Object} Required file.
 */
function requireServiceAccount(keyFileName) {
  if (!keyFileName) {
    logger.error('keyFileName missing.');
  }

  try {
    const dir = fs.readdirSync(`${process.env.ROOT}/secret`);
    if (!dir.length) {
      throw new Error(
        `Service account key file is missing. Please store a service account key file in the './secret' folder.`,
      );
    }

    const regex = new RegExp(
      `${keyFileName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`,
      'i',
    );
    const keyFile = dir.find(file => file.match(regex));
    if (!keyFile) {
      throw new Error(
        `No matching service account key file found. Please store a service account key file in the './secret' folder.`,
      );
    }

    // Create a client to perform the oAuth2 authorization flow.
    const key = require(`${process.env.ROOT}/secret/${keyFile}`);
    return key;
  } catch (err) {
    logger.error(err.msg);
    throw new Error(err.msg);
  }
}

exports.requireServiceAccount = requireServiceAccount;
