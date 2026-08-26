import type {
  ApiError,
  CallRecord,
  CreateCallResponse,
  PhoneNumbersResponse,
  TokenResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      'Network error. Please check your connection and try again.',
      0,
    );
  }

  if (!response.ok) {
    let message = 'An unexpected error occurred. Please try again.';
    try {
      const data = (await response.json()) as ApiError;
      if (data.error) message = data.error;
    } catch {
      // use default message
    }
    throw new ApiClientError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => request<{ status: string }>('/api/health'),

  getToken: () => request<TokenResponse>('/api/twilio/token'),

  getPhoneNumbers: () => request<PhoneNumbersResponse>('/api/twilio/phone-numbers'),

  createCall: (to: string, from: string) =>
    request<CreateCallResponse>('/api/calls', {
      method: 'POST',
      body: JSON.stringify({ to, from }),
    }),

  linkCallSid: (callId: string, callSid: string) =>
    request<CallRecord>(`/api/calls/${callId}/sid`, {
      method: 'PATCH',
      body: JSON.stringify({ callSid }),
    }),

  getCalls: () => request<CallRecord[]>('/api/calls'),

  getCall: (callSid: string) => request<CallRecord>(`/api/calls/${callSid}`),

  endCall: (callSid: string) =>
    request<CallRecord>(`/api/calls/${callSid}/end`, { method: 'POST' }),
};

export { ApiClientError };
