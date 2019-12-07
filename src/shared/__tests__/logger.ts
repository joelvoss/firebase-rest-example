import { logger } from '../logger';

let originalConsole: Console;

beforeEach(() => {
  originalConsole = global.console;
  global.console.log = () => {};
  global.console.warn = () => {};
  global.console.error = () => {};
});

afterEach(() => {
  jest.resetAllMocks();
  jest.clearAllMocks();
  global.console = originalConsole;
});

describe(`logger`, () => {
  it(`logs error, warn and info messages in info-mode`, () => {
    const spyLog = jest.spyOn(global.console, 'log');
    const spyWarn = jest.spyOn(global.console, 'warn');
    const spyError = jest.spyOn(global.console, 'error');

    process.env.LOG = 'info';
    process.env.NODE_ENV = 'test-console';
    logger.debug('test-debug');
    logger.info('test-info');
    logger.warn('test-warn');
    logger.error('test-error');

    expect(spyLog).toBeCalledTimes(1);
    expect(spyLog).toBeCalledWith('[ info ] test-info');

    expect(spyWarn).toBeCalledTimes(1);
    expect(spyWarn).toBeCalledWith('[ warn ] test-warn');

    expect(spyError).toBeCalledTimes(1);
    expect(spyError).toBeCalledWith('[ error ] test-error');
  });

  it(`logs only error messages in error-mode`, () => {
    const spyLog = jest.spyOn(global.console, 'log');
    const spyWarn = jest.spyOn(global.console, 'warn');
    const spyError = jest.spyOn(global.console, 'error');

    process.env.LOG = 'error';
    process.env.NODE_ENV = 'test-console';
    logger.debug('test-debug');
    logger.info('test-info');
    logger.warn('test-warn');
    logger.error('test-error');

    expect(spyLog).toBeCalledTimes(0);

    expect(spyWarn).toBeCalledTimes(0);

    expect(spyError).toBeCalledTimes(1);
    expect(spyError).toBeCalledWith('[ error ] test-error');
  });

  it(`logs all message types in debug-mode`, () => {
    const spyLog = jest.spyOn(global.console, 'log');
    const spyWarn = jest.spyOn(global.console, 'warn');
    const spyError = jest.spyOn(global.console, 'error');

    process.env.LOG = 'debug';
    process.env.NODE_ENV = 'test-console';
    logger.debug('test-debug');
    logger.info('test-info');
    logger.warn('test-warn');
    logger.error('test-error');

    expect(spyLog).toBeCalledTimes(2);
    expect(spyLog).toBeCalledWith('[ debug ] test-debug');
    expect(spyLog).toBeCalledWith('[ info ] test-info');

    expect(spyWarn).toBeCalledTimes(1);
    expect(spyWarn).toBeCalledWith('[ warn ] test-warn');

    expect(spyError).toBeCalledTimes(1);
    expect(spyError).toBeCalledWith('[ error ] test-error');
  });
});
