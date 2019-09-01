/**
 * Get all log levels below a target log level.
 * If the targetLevel is 'INFO', log levels 'INFO', 'WARN' and 'ERROR' are
 * returned.
 * @param {String} targetLevel The target log level, e.g. 'DEBUG' or 'WARN'.
 * @return {Array} All log levels below the target one.
 */
function getLogLevel(targetLevel) {
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  if (!targetLevel || !levels.includes(targetLevel.toUpperCase())) {
    return [];
  }
  return levels.slice(levels.indexOf(targetLevel.toUpperCase()));
}

/**
 * Custom logger that only logs to stdout and stderr if the appropriate log
 * level is set.
 * @return {Object} Logger methods
 */
const logger = {
  debug: (...args) => {
    const logLevel = getLogLevel(process.env.LOG);
    if (logLevel.includes('DEBUG') && process.env.NODE_ENV !== 'test') {
      console.log(`[ debug ] ${args[0]}`, ...args.slice(1));
    }
  },
  info: (...args) => {
    const logLevel = getLogLevel(process.env.LOG);
    if (logLevel.includes('INFO') && process.env.NODE_ENV !== 'test') {
      console.log(`[ info ] ${args[0]}`, ...args.slice(1));
    }
  },
  warn: (...args) => {
    const logLevel = getLogLevel(process.env.LOG);
    if (logLevel.includes('WARN') && process.env.NODE_ENV !== 'test') {
      console.warn(`[ warn ] ${args[0]}`, ...args.slice(1));
    }
  },
  error: (...args) => {
    const logLevel = getLogLevel(process.env.LOG);
    if (logLevel.includes('ERROR') && process.env.NODE_ENV !== 'test') {
      console.error(`[ error ] ${args[0]}`, ...args.slice(1));
    }
  },
};

exports.logger = logger;
