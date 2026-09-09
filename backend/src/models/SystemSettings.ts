import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  petrolPricePerLiter: number; // e.g. 110 ₹/L
  defaultMileage: number; // e.g. 55 KM/L
  twoWheelerRate: number; // ₹/KM (calculated as petrolPricePerLiter / defaultMileage)
  maxReimbursementPerTrip?: number; // ₹
  minAccuracyMeters: number; // e.g. 50 meters
  gpsUpdateIntervalSeconds: number; // e.g. 5 seconds
  offlineTimeoutMinutes: number; // e.g. 2 minutes
  currency: string; // INR
  currencySymbol: string; // ₹
  companyName: string;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    petrolPricePerLiter: { type: Number, default: 110 },
    defaultMileage: { type: Number, default: 55 },
    twoWheelerRate: { type: Number, default: 2.0 },
    maxReimbursementPerTrip: { type: Number, default: 2000 },
    minAccuracyMeters: { type: Number, default: 50 },
    gpsUpdateIntervalSeconds: { type: Number, default: 5 },
    offlineTimeoutMinutes: { type: Number, default: 2 },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    companyName: { type: String, default: 'Skyronet Networks' }
  },
  { timestamps: true }
);

export const SystemSettings = mongoose.model<ISystemSettings>(
  'SystemSettings',
  SystemSettingsSchema
);
