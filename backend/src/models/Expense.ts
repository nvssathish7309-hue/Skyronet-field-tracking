import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IExpense extends Document {
  expenseId: string; // EXP-0001
  tripId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  engineerId: mongoose.Types.ObjectId;
  distanceKm: number;
  reimbursementRate: number;
  calculatedAmount: number;
  submittedAmount: number;
  approvedAmount?: number;
  status: ExpenseStatus;
  submittedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseId: { type: String, required: true, unique: true },
    tripId: { type: Schema.Types.Mixed, ref: 'Trip', required: true },
    taskId: { type: Schema.Types.Mixed, ref: 'Task' },
    engineerId: { type: Schema.Types.Mixed, ref: 'Engineer', required: true },
    distanceKm: { type: Number, required: true },
    reimbursementRate: { type: Number, required: true },
    calculatedAmount: { type: Number, required: true },
    submittedAmount: { type: Number, required: true },
    approvedAmount: { type: Number },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    remarks: { type: String }
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
