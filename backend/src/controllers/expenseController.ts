import { Response } from 'express';
import { Expense } from '../models/Expense';
import { Trip } from '../models/Trip';
import { Engineer } from '../models/Engineer';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

export async function getExpenses(req: AuthRequest, res: Response) {
  try {
    const { status, engineerId, search } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (engineerId) query.engineerId = engineerId;

    if (req.user?.role === 'FIELD_ENGINEER') {
      const engineer = await Engineer.findOne({ userId: req.user.userId });
      if (engineer) query.engineerId = engineer._id;
    }

    const expenses = await Expense.find(query)
      .populate({
        path: 'engineerId',
        populate: { path: 'assignedBike' }
      })
      .populate('taskId')
      .populate('tripId')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getExpenseById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate('engineerId')
      .populate('taskId')
      .populate('tripId')
      .populate('reviewedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    return res.json({ success: true, data: expense });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function approveExpense(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { approvedAmount, remarks } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    expense.status = 'Approved';
    expense.approvedAmount = approvedAmount !== undefined ? Number(approvedAmount) : expense.calculatedAmount;
    expense.reviewedBy = req.user!.userId as any;
    expense.reviewedAt = new Date();
    if (remarks) expense.remarks = remarks;

    await expense.save();

    // Update trip status to Approved
    await Trip.findByIdAndUpdate(expense.tripId, { status: 'Approved' });

    // Notify engineer
    const engineer = await Engineer.findById(expense.engineerId);
    if (engineer) {
      await Notification.create({
        userId: engineer.userId,
        title: 'Expense Approved',
        message: `Your travel expense ${expense.expenseId} (₹${expense.approvedAmount}) has been approved by Accounts.`,
        type: 'SUCCESS',
        link: `/my-expenses`
      });
    }

    try {
      getIO().emit('expense:approved', { expenseId: expense._id, approvedAmount: expense.approvedAmount });
    } catch (_) {}

    await AuditLog.create({
      userId: req.user!.userId as any,
      userName: req.user!.email,
      action: 'APPROVE_EXPENSE',
      entity: 'Expense',
      entityId: expense.expenseId,
      description: `Accounts approved expense ${expense.expenseId} for ₹${expense.approvedAmount}`
    });

    return res.json({ success: true, message: 'Expense approved successfully', data: expense });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function rejectExpense(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    expense.status = 'Rejected';
    expense.rejectionReason = rejectionReason;
    expense.reviewedBy = req.user!.userId as any;
    expense.reviewedAt = new Date();

    await expense.save();

    // Update trip status to Rejected
    await Trip.findByIdAndUpdate(expense.tripId, { status: 'Rejected' });

    const engineer = await Engineer.findById(expense.engineerId);
    if (engineer) {
      await Notification.create({
        userId: engineer.userId,
        title: 'Expense Rejected',
        message: `Your travel expense ${expense.expenseId} was rejected. Reason: ${rejectionReason}`,
        type: 'DANGER',
        link: `/my-expenses`
      });
    }

    try {
      getIO().emit('expense:rejected', { expenseId: expense._id, rejectionReason });
    } catch (_) {}

    await AuditLog.create({
      userId: req.user!.userId as any,
      userName: req.user!.email,
      action: 'REJECT_EXPENSE',
      entity: 'Expense',
      entityId: expense.expenseId,
      description: `Accounts rejected expense ${expense.expenseId}. Reason: ${rejectionReason}`
    });

    return res.json({ success: true, message: 'Expense rejected', data: expense });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
