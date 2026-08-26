#!/usr/bin/env node
/**
 * Creates a Twilio API Key using Account SID + Auth Token (which already work)
 * and prints the SID/Secret pair — avoids manual copy mistakes.
 *
 * Usage: npm run setup:api-key -w server
 */
import dotenv from 'dotenv';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import twilio from 'twilio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

if (!accountSid || !authToken) {
  console.error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in server/.env');
  process.exit(1);
}

async function main() {
  const client = twilio(accountSid, authToken);

  console.log('Creating new API Key on account', accountSid, '...\n');

  const key = await client.newKeys.create({
    friendlyName: `phone-dialer-${Date.now()}`,
  });

  console.log('API Key created successfully!\n');
  console.log('TWILIO_API_KEY_SID=' + key.sid);
  console.log('TWILIO_API_KEY_SECRET=' + key.secret);
  console.log('\nSecret length:', key.secret.length);

  const writeEnv = process.argv.includes('--write-env');

  if (writeEnv) {
    let envContent = readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /^TWILIO_API_KEY_SID=.*$/m,
      `TWILIO_API_KEY_SID=${key.sid}`,
    );
    envContent = envContent.replace(
      /^TWILIO_API_KEY_SECRET=.*$/m,
      `TWILIO_API_KEY_SECRET=${key.secret}`,
    );
    writeFileSync(envPath, envContent);
    console.log('\nUpdated server/.env automatically.');
  }

  // API keys cannot call account REST endpoints — validate by generating a JWT instead
  const AccessToken = twilio.jwt.AccessToken;
  const token = new AccessToken(accountSid, key.sid, key.secret, { identity: 'test', ttl: 60 });
  const jwt = token.toJwt();
  if (!jwt || jwt.split('.').length !== 3) {
    throw new Error('Failed to generate access token from new API key');
  }
  console.log('Verified: Access token generated successfully.');
  console.log('\nRestart the server with: npm run dev');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
