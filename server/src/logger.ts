const info = console.info.bind(null, '\x1b[32m[INFO ]\x1b[0m');
const debug = console.debug.bind(null, '\x1b[34m[DEBUG]\x1b[0m');
const error = console.error.bind(null, '\x1b[31m[ERROR]\x1b[0m');
const warn = console.warn.bind(null, '\x1b[33m[WARN ]\x1b[0m');

const logger = {
  info,
  debug,
  error,
  warn,
};

export default logger;
