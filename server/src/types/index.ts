export const CALL_STATUSES = [
  'pending',
  'queued',
  'initiated',
  'ringing',
  'in-progress',
  'completed',
  'busy',
  'failed',
  'no-answer',
  'canceled',
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export type CallDirection = 'outbound';

export interface CallRecord {
  _id: string;
  to: string;
  from: string;
  twilioCallSid?: string;
  direction: CallDirection;
  status: CallStatus;
  duration?: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCallResponse {
  callId: string;
  to: string;
}

export interface TokenResponse {
  token: string;
}

export interface ApiError {
  error: string;
}
