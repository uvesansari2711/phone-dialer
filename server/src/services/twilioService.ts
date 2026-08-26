import twilio from 'twilio';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

export async function validateTwilioCredentials(): Promise<void> {
  await twilioClient.api.accounts(config.twilio.accountSid).fetch();

  // API keys cannot authenticate general REST calls — verify the key exists on the account
  const keys = await twilioClient.keys.list({ limit: 50 });
  const keyExists = keys.some((k) => k.sid === config.twilio.apiKeySid);
  if (!keyExists) {
    throw new Error(
      `API Key ${config.twilio.apiKeySid} not found on this Twilio account`,
    );
  }

  await twilioClient.applications(config.twilio.twimlAppSid).fetch();

  // Verify JWT can be generated (API key secret is used for signing)
  const token = generateVoiceToken('validation-check');
  if (!token || token.split('.').length !== 3) {
    throw new Error('Failed to generate Voice access token');
  }

  logger.info('Twilio credentials validated successfully');
}

export function generateVoiceToken(identity = 'dialer-user'): string {
  const token = new AccessToken(
    config.twilio.accountSid,
    config.twilio.apiKeySid,
    config.twilio.apiKeySecret,
    { identity, ttl: 3600 },
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: config.twilio.twimlAppSid,
    incomingAllow: false,
  });

  token.addGrant(voiceGrant);
  return token.toJwt();
}

export async function hangupCall(callSid: string): Promise<void> {
  logger.info({ callSid }, 'Hanging up call via Twilio REST API');
  await twilioClient.calls(callSid).update({ status: 'completed' });
}

export function validateTwilioRequest(
  signature: string | undefined,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature) return false;
  return twilio.validateRequest(config.twilio.authToken, signature, url, params);
}

export function buildVoiceTwiml(to: string, callerId: string): string {
  const response = new twilio.twiml.VoiceResponse();
  const dial = response.dial({
    callerId,
    answerOnBridge: true,
  });
  dial.number(
    {
      statusCallback: config.statusWebhookUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    },
    to,
  );
  return response.toString();
}

export function mapTwilioStatus(status: string): string {
  const statusMap: Record<string, string> = {
    queued: 'queued',
    initiated: 'initiated',
    ringing: 'ringing',
    'in-progress': 'in-progress',
    completed: 'completed',
    busy: 'busy',
    failed: 'failed',
    'no-answer': 'no-answer',
    canceled: 'canceled',
  };
  return statusMap[status] || status;
}

export function mapTwilioError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: number }).code;
    switch (code) {
      case 21211:
      case 21217:
        return 'Please enter a valid phone number.';
      case 20003:
        return 'Unable to initiate the call. Please check Twilio credentials.';
      case 20404:
        return 'Call not found.';
      default:
        return 'Unable to initiate the call. Please try again.';
    }
  }
  return 'Unable to initiate the call. Please try again.';
}
