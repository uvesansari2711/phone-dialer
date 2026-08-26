import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      const testDefaults: Record<string, string> = {
        TWILIO_ACCOUNT_SID: 'ACtestaccountsid1234567890abcdef',
        TWILIO_AUTH_TOKEN: 'test_auth_token',
        TWILIO_API_KEY_SID: 'SKtestapikeysid1234567890abcdef',
        TWILIO_API_KEY_SECRET: 'test_api_key_secret',
        TWILIO_TWIML_APP_SID: 'APtesttwimlapp1234567890abcdef',
      };
      return testDefaults[name] || `test_${name}`;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/phone-dialer',
  twilio: {
    accountSid: requireEnv('TWILIO_ACCOUNT_SID'),
    authToken: requireEnv('TWILIO_AUTH_TOKEN'),
    apiKeySid: requireEnv('TWILIO_API_KEY_SID'),
    apiKeySecret: requireEnv('TWILIO_API_KEY_SECRET'),
    twimlAppSid: requireEnv('TWILIO_TWIML_APP_SID'),
  },
  voiceWebhookUrl: `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/api/twilio/voice`,
  statusWebhookUrl: `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/api/twilio/status`,
} as const;

export type Config = typeof config;
