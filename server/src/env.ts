const env = {
  cookieSecret: process.env['COOKIE_SECRET'] || 'cookie_secret',
  db: {
    user: process.env['DB_USER'] || 'user',
    pw: process.env['DB_PASSWORD'] || 'password',
  },
  logLevel: 'debug' as 'debug' | 'info',
};

export default env;
