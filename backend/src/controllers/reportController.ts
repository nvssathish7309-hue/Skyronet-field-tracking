import { Response } from 'express';
import mongoose from 'mongoose';
import { Engineer } from '../models/Engineer';
import { Task } from '../models/Task';
import { Trip } from '../models/Trip';
import { Expense } from '../models/Expense';
import { Bike } from '../models/Bike';
import { AuthRequest } from '../middleware/auth';
import { getInMemoryStore } from '../utils/inMemoryDB';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      const totalEngineers = store.engineers.length;
      const activeEngineers = store.engineers.filter(e => ['Available', 'On Task', 'On The Way'].includes(e.status)).length;
      const engineersOnTask = store.engineers.filter(e => ['On Task', 'On The Way'].includes(e.status)).length;
      const todaysTasks = store.tasks.length;
      const completedTasksToday = store.tasks.filter(t => t.status === 'Completed').length;
      const pendingTasks = store.tasks.filter(t => ['Pending', 'Assigned', 'Accepted'].includes(t.status)).length;
      const totalKmToday = store.trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
      const totalExpenseToday = store.trips.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const pendingExpenses = store.expenses.filter(e => e.status === 'Pending').length;
      const approvedExpenses = store.expenses.filter(e => e.status === 'Approved').length;
      const rejectedExpenses = store.expenses.filter(e => e.status === 'Rejected').length;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const weeklyTrend = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTrips = store.trips.filter(t => t.startTime && new Date(t.startTime).toISOString().split('T')[0] === dateStr);
        const km = dayTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
        const expense = dayTrips.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        weeklyTrend.push({
          date: dateStr,
          km: Math.round(km * 10) / 10,
          expense: Math.round(expense)
        });
      }

      return res.json({
        success: true,
        data: {
          totalEngineers,
          activeEngineers,
          engineersOnTask,
          todaysTasks,
          completedTasksToday,
          pendingTasks,
          totalKmToday: Math.round(totalKmToday * 10) / 10,
          totalExpenseToday: Math.round(totalExpenseToday),
          expensesSummary: {
            pending: pendingExpenses,
            approved: approvedExpenses,
            rejected: rejectedExpenses
          },
          weeklyTrend
        }
      });
    }

    const totalEngineers = await Engineer.countDocuments();
    const activeEngineers = await Engineer.countDocuments({
      status: { $in: ['Available', 'On Task', 'On The Way'] }
    });
    const engineersOnTask = await Engineer.countDocuments({ status: { $in: ['On Task', 'On The Way'] } });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysTasks = await Task.countDocuments({ scheduledDate: { $gte: startOfToday } });
    const completedTasksToday = await Task.countDocuments({
      updatedAt: { $gte: startOfToday },
      status: 'Completed'
    });
    const pendingTasks = await Task.countDocuments({ status: { $in: ['Pending', 'Assigned', 'Accepted'] } });

    // Today's trips
    const todayTrips = await Trip.find({ startTime: { $gte: startOfToday } });
    const totalKmToday = todayTrips.reduce((sum, t) => sum + t.distanceKm, 0);
    const totalExpenseToday = todayTrips.reduce((sum, t) => sum + t.totalAmount, 0);

    // Pending vs Approved vs Rejected Expenses
    const pendingExpenses = await Expense.countDocuments({ status: 'Pending' });
    const approvedExpenses = await Expense.countDocuments({ status: 'Approved' });
    const rejectedExpenses = await Expense.countDocuments({ status: 'Rejected' });

    // Weekly trend data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentTrips = await Trip.find({ startTime: { $gte: sevenDaysAgo } });

    const dailyTrendsMap: { [date: string]: { km: number; expense: number } } = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailyTrendsMap[dateStr] = { km: 0, expense: 0 };
    }

    recentTrips.forEach((t) => {
      const dateStr = new Date(t.startTime).toISOString().split('T')[0];
      if (dailyTrendsMap[dateStr]) {
        dailyTrendsMap[dateStr].km += t.distanceKm;
        dailyTrendsMap[dateStr].expense += t.totalAmount;
      }
    });

    const weeklyTrend = Object.keys(dailyTrendsMap).map((date) => ({
      date,
      km: Math.round(dailyTrendsMap[date].km * 10) / 10,
      expense: Math.round(dailyTrendsMap[date].expense)
    }));

    return res.json({
      success: true,
      data: {
        totalEngineers,
        activeEngineers,
        engineersOnTask,
        todaysTasks,
        completedTasksToday,
        pendingTasks,
        totalKmToday: Math.round(totalKmToday * 10) / 10,
        totalExpenseToday: Math.round(totalExpenseToday),
        expensesSummary: {
          pending: pendingExpenses,
          approved: approvedExpenses,
          rejected: rejectedExpenses
        },
        weeklyTrend
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTravelReports(req: AuthRequest, res: Response) {
  try {
    const { startDate, endDate, engineerId } = req.query;

    const query: any = {};
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(String(startDate));
      if (endDate) query.startTime.$lte = new Date(String(endDate));
    }

    if (engineerId) query.engineerId = engineerId;

    const trips = await Trip.find(query)
      .populate('engineerId')
      .populate('taskId')
      .populate('bikeId')
      .sort({ startTime: -1 });

    const totalKm = trips.reduce((sum, t) => sum + t.distanceKm, 0);
    const totalAmount = trips.reduce((sum, t) => sum + t.totalAmount, 0);

    // Engineer breakdown
    const engineerMap: { [id: string]: { name: string; idCode: string; km: number; amount: number; count: number } } = {};

    trips.forEach((t: any) => {
      if (t.engineerId) {
        const engId = t.engineerId._id.toString();
        if (!engineerMap[engId]) {
          engineerMap[engId] = {
            name: `${t.engineerId.firstName} ${t.engineerId.lastName}`,
            idCode: t.engineerId.engineerId,
            km: 0,
            amount: 0,
            count: 0
          };
        }
        engineerMap[engId].km += t.distanceKm;
        engineerMap[engId].amount += t.totalAmount;
        engineerMap[engId].count += 1;
      }
    });

    const engineerBreakdown = Object.values(engineerMap).map((e) => ({
      ...e,
      km: Math.round(e.km * 10) / 10,
      amount: Math.round(e.amount)
    }));

    return res.json({
      success: true,
      data: {
        totalTrips: trips.length,
        totalKm: Math.round(totalKm * 10) / 10,
        totalAmount: Math.round(totalAmount),
        engineerBreakdown,
        trips
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function exportCSV(req: AuthRequest, res: Response) {
  try {
    const expenses = await Expense.find()
      .populate('engineerId')
      .populate('taskId')
      .populate('tripId')
      .sort({ createdAt: -1 });

    let csv = 'Expense ID,Trip ID,Engineer ID,Engineer Name,Task,Distance (KM),Rate (INR),Calculated (INR),Approved (INR),Status,Date\n';

    expenses.forEach((e: any) => {
      const engName = e.engineerId ? `"${e.engineerId.firstName} ${e.engineerId.lastName}"` : 'N/A';
      const engIdCode = e.engineerId ? e.engineerId.engineerId : 'N/A';
      const taskTitle = e.taskId ? `"${e.taskId.title}"` : 'N/A';
      const date = new Date(e.createdAt).toISOString().split('T')[0];

      csv += `${e.expenseId},${e.tripId ? (e.tripId as any).tripId : 'N/A'},${engIdCode},${engName},${taskTitle},${e.distanceKm},${e.reimbursementRate},${e.calculatedAmount},${e.approvedAmount || 0},${e.status},${date}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=FieldTrack360_Expenses_Report.csv');
    return res.status(200).send(csv);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
