export type CallState =
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'connected'
  | 'ended'
  | 'failed';

export type CallStatus =
  | 'pending'
  | 'queued'
  | 'initiated'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled';

export interface CallRecord {
  _id: string;
  to: string;
  from: string;
  twilioCallSid?: string;
  direction: 'outbound';
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
  from: string;
}

export interface OutgoingPhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  sid: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
}

export type MessageStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed'
  | 'received';

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

export interface PhoneNumbersResponse {
  numbers: OutgoingPhoneNumber[];
  default: string;
}

export interface TokenResponse {
  token: string;
}

export interface ApiError {
  error: string;
}
