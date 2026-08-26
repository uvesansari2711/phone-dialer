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
}

export interface TokenResponse {
  token: string;
}

export interface ApiError {
  error: string;
}
