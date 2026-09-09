import mongoose, { Schema, Document } from 'mongoose';

export interface IEngineerLocation extends Document {
  engineerId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  tripId?: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

const EngineerLocationSchema = new Schema<IEngineerLocation>(
  {
    engineerId: { type: Schema.Types.ObjectId, ref: 'Engineer', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', index: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    speed: { type: Number },
    heading: { type: Number },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

EngineerLocationSchema.index({ engineerId: 1, timestamp: -1 });

export const EngineerLocation = mongoose.model<IEngineerLocation>(
  'EngineerLocation',
  EngineerLocationSchema
);
