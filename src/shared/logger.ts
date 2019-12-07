/**
 * Get all log levels below a target log level.
 * If the targetLevel is 'INFO', log levels 'INFO', 'WARN' and 'ERROR' are
 * returned.
 */
function getLogLevel(targetLevel: string) {
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
export const logger = {
  debug: (...args: any[]) => {
    const logLevel = getLogLevel(process.env.LOG!);
    if (logLevel.includes('DEBUG') && process.env.NODE_ENV !== 'test') {
      console.log(`[ debug ] ${args[0]}`, ...args.slice(1));
    }
  },
  info: (...args: any[]) => {
    const logLevel = getLogLevel(process.env.LOG!);
    if (logLevel.includes('INFO') && process.env.NODE_ENV !== 'test') {
      console.log(`[ info ] ${args[0]}`, ...args.slice(1));
    }
  },
  warn: (...args: any[]) => {
    const logLevel = getLogLevel(process.env.LOG!);
    if (logLevel.includes('WARN') && process.env.NODE_ENV !== 'test') {
      console.warn(`[ warn ] ${args[0]}`, ...args.slice(1));
    }
  },
  error: (...args: any[]) => {
    const logLevel = getLogLevel(process.env.LOG!);
    if (logLevel.includes('ERROR') && process.env.NODE_ENV !== 'test') {
      console.error(`[ error ] ${args[0]}`, ...args.slice(1));
    }
  },
};
