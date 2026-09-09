import mongoose, { Schema, Document } from 'mongoose';

export type TripStatus = 'Active' | 'Completed' | 'Cancelled' | 'Approved' | 'Rejected';
export type TripType = 'One Way' | 'Round Trip';

export interface ILocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  timestamp: Date;
}

export interface ITrip extends Document {
  tripId: string; // TRIP-0001
  engineerId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  bikeId?: mongoose.Types.ObjectId;
  startLatitude: number;
  startLongitude: number;
  startTime: Date;
  endLatitude?: number;
  endLongitude?: number;
  endTime?: Date;
  distanceKm: number;
  tripType: TripType;
  reimbursementRate: number; // ₹/KM
  totalAmount: number; // ₹
  status: TripStatus;
  locationPoints: ILocationPoint[];
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    tripId: { type: String, required: true, unique: true },
    engineerId: { type: Schema.Types.Mixed, ref: 'Engineer', required: true },
    taskId: { type: Schema.Types.Mixed, ref: 'Task' },
    bikeId: { type: Schema.Types.Mixed, ref: 'Bike' },
    startLatitude: { type: Number, required: true },
    startLongitude: { type: Number, required: true },
    startTime: { type: Date, default: Date.now },
    endLatitude: { type: Number },
    endLongitude: { type: Number },
    endTime: { type: Date },
    distanceKm: { type: Number, default: 0 },
    tripType: { type: String, enum: ['One Way', 'Round Trip'], default: 'One Way' },
    reimbursementRate: { type: Number, default: 5 },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled', 'Approved', 'Rejected'],
      default: 'Active'
    },
    locationPoints: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        accuracy: { type: Number, required: true },
        speed: { type: Number },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);
