import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';
import {
  MESSAGE_STATUSES,
  type MessageDirection,
  type MessageStatus,
} from '../types/index.js';

export interface IMessage {
  contactNumber: string;
  ourNumber: string;
  body: string;
  direction: MessageDirection;
  status: MessageStatus;
  twilioMessageSid?: string;
  errorCode?: string;
  errorMessage?: string;
  numSegments?: number;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageDocument = HydratedDocument<IMessage>;

const messageSchema = new Schema<IMessage>(
  {
    contactNumber: { type: String, required: true, index: true },
    ourNumber: { type: String, required: true },
    body: { type: String, default: '' },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    status: { type: String, enum: MESSAGE_STATUSES, default: 'queued', index: true },
    twilioMessageSid: { type: String, sparse: true, unique: true, index: true },
    errorCode: { type: String },
    errorMessage: { type: String },
    numSegments: { type: Number },
    readAt: { type: Date },
  },
  { timestamps: true },
);

messageSchema.index({ contactNumber: 1, createdAt: 1 });
messageSchema.index({ createdAt: -1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
