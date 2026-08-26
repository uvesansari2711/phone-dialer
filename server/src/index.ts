import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { validateTwilioCredentials } from './services/twilioService.js';

async function start() {
  await connectDatabase();

  try {
    await validateTwilioCredentials();
  } catch (err) {
    logger.error(
      { err },
      'Twilio credential validation failed — check TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET in .env',
    );
    process.exit(1);
  }

  const app = createApp();

  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'Server started');
    logger.info({ voiceUrl: config.voiceWebhookUrl }, 'Voice webhook URL');
    logger.info({ statusUrl: config.statusWebhookUrl }, 'Status webhook URL');
  });
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
