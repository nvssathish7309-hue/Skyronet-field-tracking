import mongoose, { Schema, Document } from 'mongoose';

export type EngineerStatus = 'Available' | 'On Task' | 'On The Way' | 'Offline' | 'Leave';

export interface IEngineer extends Document {
  engineerId: string; // FE-0001
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  employeeId: string;
  department: string;
  designation: string;
  assignedBike?: mongoose.Types.ObjectId;
  joiningDate: Date;
  status: EngineerStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: Date;
  activeTaskId?: mongoose.Types.ObjectId;
  activeTripId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EngineerSchema = new Schema<IEngineer>(
  {
    engineerId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.Mixed, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    profilePhoto: { type: String },
    employeeId: { type: String, required: true, unique: true },
    department: { type: String, default: 'Field Operations' },
    designation: { type: String, default: 'Network Engineer' },
    assignedBike: { type: Schema.Types.Mixed, ref: 'Bike' },
    joiningDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Available', 'On Task', 'On The Way', 'Offline', 'Leave'],
      default: 'Available'
    },
    currentLatitude: { type: Number },
    currentLongitude: { type: Number },
    lastLocationUpdate: { type: Date },
    activeTaskId: { type: Schema.Types.Mixed, ref: 'Task' },
    activeTripId: { type: Schema.Types.Mixed, ref: 'Trip' }
  },
  { timestamps: true }
);

export const Engineer = mongoose.model<IEngineer>('Engineer', EngineerSchema);
