const fs = require('fs');
const path = require('path');
const readPkgUp = require('read-pkg-up');
const { path: pkgPath } = readPkgUp.sync({
  cwd: fs.realpathSync(process.cwd()),
});

// Load environment variables from a .env file. dotenv will never modify any
// environment variables that have already been set. Variable expansion is
// supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
if (fs.existsSync('.env')) {
  require('dotenv').config({
    path: '.env',
  });
}

/**
 * Creates an object of all environment variables and sets sensible defaults.
 * @return {object}
 */
process.env = Object.keys(process.env).reduce(
  (env, key) => {
    env[key] = process.env[key];
    return env;
  },
  {
    // Defaults
    ROOT: path.dirname(pkgPath),
    LOG: process.env.LOG || 'info',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3000',
  },
);
