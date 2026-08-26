import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';
import { CALL_STATUSES, type CallDirection, type CallStatus } from '../types/index.js';

export interface ICall {
  to: string;
  from: string;
  twilioCallSid?: string;
  direction: CallDirection;
  status: CallStatus;
  duration?: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CallDocument = HydratedDocument<ICall>;

const callSchema = new Schema<ICall>(
  {
    to: { type: String, required: true, index: true },
    from: { type: String, required: true },
    twilioCallSid: { type: String, sparse: true, unique: true, index: true },
    direction: { type: String, enum: ['outbound'], default: 'outbound' },
    status: { type: String, enum: CALL_STATUSES, default: 'pending', index: true },
    duration: { type: Number },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

callSchema.index({ createdAt: -1 });

export const Call: Model<ICall> =
  mongoose.models.Call || mongoose.model<ICall>('Call', callSchema);
