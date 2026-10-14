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

export const MESSAGE_STATUSES = [
  'queued',
  'sending',
  'sent',
  'delivered',
  'undelivered',
  'failed',
  'received',
] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export type MessageDirection = 'inbound' | 'outbound';

export interface MessageRecord {
  _id: string;
  contactNumber: string;
  ourNumber: string;
  body: string;
  direction: MessageDirection;
  status: MessageStatus;
  twilioMessageSid?: string;
  errorCode?: string;
  errorMessage?: string;
  numSegments?: number;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  contactNumber: string;
  lastBody: string;
  lastDirection: MessageDirection;
  lastStatus: MessageStatus;
  lastAt: string;
  ourNumber: string;
  unreadCount: number;
}

export interface ApiError {
  error: string;
}
