import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTS' | 'FIELD_ENGINEER';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  isOnline: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'FIELD_ENGINEER'],
      required: true,
      default: 'FIELD_ENGINEER'
    },
    avatarUrl: { type: String },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
