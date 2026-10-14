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

export async function sendSms(
  to: string,
  from: string,
  body: string,
): Promise<{ sid: string; status: string; numSegments?: number }> {
  logger.info({ to, from }, 'Sending SMS via Twilio REST API');
  const message = await twilioClient.messages.create({
    to,
    from,
    body,
    statusCallback: config.smsStatusWebhookUrl,
  });

  const numSegments = message.numSegments ? Number.parseInt(message.numSegments, 10) : undefined;

  return {
    sid: message.sid,
    status: message.status,
    numSegments: Number.isFinite(numSegments) ? numSegments : undefined,
  };
}

export interface TwilioSmsRecord {
  sid: string;
  from: string;
  to: string;
  body: string;
  status: string;
  direction: string;
  dateSent?: Date;
  numSegments?: number;
  errorCode?: string;
  errorMessage?: string;
}

export async function listRecentSms(limit = 100): Promise<TwilioSmsRecord[]> {
  const messages = await twilioClient.messages.list({ limit });
  return messages.map((msg) => {
    const numSegments = msg.numSegments ? Number.parseInt(String(msg.numSegments), 10) : undefined;
    return {
      sid: msg.sid,
      from: msg.from,
      to: msg.to,
      body: msg.body ?? '',
      status: msg.status,
      direction: msg.direction,
      dateSent: msg.dateSent ?? undefined,
      numSegments: Number.isFinite(numSegments) ? numSegments : undefined,
      errorCode: msg.errorCode != null ? String(msg.errorCode) : undefined,
      errorMessage: msg.errorMessage ?? undefined,
    };
  });
}

export function buildEmptyMessagingTwiml(): string {
  return new twilio.twiml.MessagingResponse().toString();
}

export function mapTwilioMessageStatus(status: string): string {
  const statusMap: Record<string, string> = {
    accepted: 'queued',
    queued: 'queued',
    sending: 'sending',
    sent: 'sent',
    delivered: 'delivered',
    undelivered: 'undelivered',
    failed: 'failed',
    received: 'received',
  };
  return statusMap[status] || status;
}

export function mapTwilioSmsError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: number }).code;
    switch (code) {
      case 21211:
      case 21614:
        return 'Please enter a valid phone number.';
      case 21408:
        return 'SMS is not enabled for this destination.';
      case 21612:
        return 'This sender cannot text that destination. For the UK, send from a UK SMS number.';
      case 21610:
        return 'This number has opted out of messages.';
      case 20003:
        return 'Unable to send the message. Please check Twilio credentials.';
      case 30003:
        return 'The destination phone is unreachable.';
      case 30006:
        return 'This number cannot receive SMS.';
      case 30007:
        return 'The carrier filtered this message.';
      case 30008:
        return 'Unable to deliver the message. Please try again.';
      default:
        return 'Unable to send the message. Please try again.';
    }
  }
  return 'Unable to send the message. Please try again.';
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
