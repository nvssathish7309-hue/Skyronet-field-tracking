import mongoose, { Schema, Document } from 'mongoose';

export interface IBike extends Document {
  bikeId: string; // BIKE-001
  engineerId?: mongoose.Types.ObjectId;
  bikeNumber: string;
  bikeModel: string;
  manufacturer: string;
  fuelType: string;
  mileage: number; // KM/L
  status: 'Active' | 'Maintenance' | 'Inactive';
  assignedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BikeSchema = new Schema<IBike>(
  {
    bikeId: { type: String, required: true, unique: true },
    engineerId: { type: Schema.Types.ObjectId, ref: 'Engineer' },
    bikeNumber: { type: String, required: true, unique: true },
    bikeModel: { type: String, required: true },
    manufacturer: { type: String, required: true },
    fuelType: { type: String, default: 'Petrol' },
    mileage: { type: Number, default: 45 },
    status: { type: String, enum: ['Active', 'Maintenance', 'Inactive'], default: 'Active' },
    assignedDate: { type: Date }
  },
  { timestamps: true }
);

export const Bike = mongoose.model<IBike>('Bike', BikeSchema);
