import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus =
  | 'Pending'
  | 'Assigned'
  | 'Accepted'
  | 'On The Way'
  | 'Arrived'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ITaskPhoto {
  url: string;
  filename: string;
  uploadedAt: Date;
  caption?: string;
}

export interface ITask extends Document {
  taskId: string; // TASK-0001
  title: string;
  description: string;
  customerName: string;
  customerPhone: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  assignedEngineer?: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  priority: TaskPriority;
  scheduledDate: Date;
  scheduledTime: string;
  status: TaskStatus;
  startTime?: Date;
  endTime?: Date;
  workNotes?: string;
  materialsUsed?: string;
  photos: ITaskPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    taskId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    locationName: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    assignedEngineer: { type: Schema.Types.ObjectId, ref: 'Engineer' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'Pending',
        'Assigned',
        'Accepted',
        'On The Way',
        'Arrived',
        'In Progress',
        'Completed',
        'Cancelled',
        'Rejected'
      ],
      default: 'Pending'
    },
    startTime: { type: Date },
    endTime: { type: Date },
    workNotes: { type: String },
    materialsUsed: { type: String },
    photos: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        caption: { type: String }
      }
    ]
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', TaskSchema);
