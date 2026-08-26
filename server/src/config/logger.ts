import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  redact: {
    paths: [
      'TWILIO_AUTH_TOKEN',
      'TWILIO_API_KEY_SECRET',
      'req.headers.authorization',
    ],
    remove: true,
  },
});
