import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'System' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
