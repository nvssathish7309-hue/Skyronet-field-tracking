import { Response } from 'express';
import { Trip, TripType } from '../models/Trip';
import { Task } from '../models/Task';
import { Engineer } from '../models/Engineer';
import { Expense } from '../models/Expense';
import { SystemSettings } from '../models/SystemSettings';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';
import { AuditLog } from '../models/AuditLog';

export async function startTrip(req: AuthRequest, res: Response) {
  try {
    const { taskId, startLatitude, startLongitude, tripType } = req.body;

    if (startLatitude === undefined || startLongitude === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide starting GPS coordinates' });
    }

    const engineer = await Engineer.findOne({ userId: req.user!.userId }).populate('assignedBike');
    if (!engineer) {
      return res.status(404).json({ success: false, message: 'Field Engineer profile not found' });
    }

    let task: any = null;
    if (taskId) {
      task = await Task.findById(taskId);
    }

    // Check if engineer already has an active trip
    const existingActiveTrip = await Trip.findOne({ engineerId: engineer._id, status: 'Active' });
    if (existingActiveTrip) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active trip in progress',
        data: existingActiveTrip
      });
    }

    const settings = await SystemSettings.findOne();
    const petrolPrice = settings?.petrolPricePerLiter || 110;
    const bikeMileage = (engineer.assignedBike && (engineer.assignedBike as any).mileage)
      ? (engineer.assignedBike as any).mileage
      : (settings?.defaultMileage || 55);
    const rate = Math.round((petrolPrice / Math.max(bikeMileage, 1)) * 100) / 100;

    const count = await Trip.countDocuments();
    const tripId = `TRIP-${String(count + 1).padStart(4, '0')}`;

    const trip = await Trip.create({
      tripId,
      engineerId: engineer._id,
      taskId: task ? task._id : undefined,
      bikeId: engineer.assignedBike ? (engineer.assignedBike as any)._id : undefined,
      startLatitude: Number(startLatitude),
      startLongitude: Number(startLongitude),
      startTime: new Date(),
      distanceKm: 0,
      tripType: (tripType as TripType) || 'One Way',
      reimbursementRate: rate,
      totalAmount: 0,
      status: 'Active',
      locationPoints: [
        {
          latitude: Number(startLatitude),
          longitude: Number(startLongitude),
          accuracy: 10,
          timestamp: new Date()
        }
      ]
    });

    // Update Task & Engineer status if assigned
    if (task) {
      task.status = 'On The Way';
      if (!task.startTime) task.startTime = new Date();
      await task.save();
      engineer.activeTaskId = task._id as any;
    }

    engineer.status = 'On The Way';
    engineer.activeTripId = trip._id as any;
    engineer.currentLatitude = Number(startLatitude);
    engineer.currentLongitude = Number(startLongitude);
    engineer.lastLocationUpdate = new Date();
    await engineer.save();

    try {
      getIO().emit('trip:started', {
        tripId: trip._id,
        tripCode: trip.tripId,
        engineerId: engineer._id,
        taskId: task ? task._id : undefined
      });
    } catch (_) {}

    await AuditLog.create({
      userId: req.user!.userId as any,
      userName: req.user!.email,
      action: 'START_TRIP',
      entity: 'Trip',
      entityId: trip.tripId,
      description: `Engineer ${engineer.firstName} started trip ${trip.tripId} ${task ? `for task ${task.taskId}` : '(General Travel)'}`
    });

    return res.status(201).json({
      success: true,
      message: 'Trip started successfully. Real-time GPS tracking active.',
      data: trip
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function stopTrip(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { endLatitude, endLongitude } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Trip is not active' });
    }

    trip.endLatitude = Number(endLatitude) || trip.startLatitude;
    trip.endLongitude = Number(endLongitude) || trip.startLongitude;
    trip.endTime = new Date();
    trip.status = 'Completed';

    const multiplier = trip.tripType === 'Round Trip' ? 2 : 1;
    trip.totalAmount = Math.round(trip.distanceKm * multiplier * trip.reimbursementRate * 100) / 100;
    await trip.save();

    // Create automatic expense record for Accounts review
    const expCount = await Expense.countDocuments();
    const expenseId = `EXP-${String(expCount + 1).padStart(4, '0')}`;

    const expense = await Expense.create({
      expenseId,
      tripId: trip._id,
      taskId: trip.taskId || undefined,
      engineerId: trip.engineerId,
      distanceKm: trip.distanceKm * multiplier,
      reimbursementRate: trip.reimbursementRate,
      calculatedAmount: trip.totalAmount,
      submittedAmount: trip.totalAmount,
      status: 'Pending',
      submittedAt: new Date()
    });

    // Update engineer status
    const engineer = await Engineer.findById(trip.engineerId);
    if (engineer) {
      engineer.status = 'Available';
      engineer.activeTripId = undefined;
      await engineer.save();
    }

    // Update task status if associated task exists
    if (trip.taskId) {
      const task = await Task.findById(trip.taskId);
      if (task && task.status !== 'Completed') {
        task.status = 'Arrived';
        await task.save();
      }
    }

    try {
      getIO().emit('trip:completed', {
        tripId: trip._id,
        expenseId: expense._id,
        distanceKm: trip.distanceKm,
        totalAmount: trip.totalAmount
      });
      getIO().emit('expense:submitted', { expenseId: expense._id, amount: expense.calculatedAmount });
    } catch (_) {}

    await AuditLog.create({
      userId: req.user!.userId as any,
      userName: req.user!.email,
      action: 'STOP_TRIP',
      entity: 'Trip',
      entityId: trip.tripId,
      description: `Trip ${trip.tripId} stopped. Total distance: ${trip.distanceKm} KM, Amount: ₹${trip.totalAmount}`
    });

    return res.json({
      success: true,
      message: 'Trip stopped. Expense submitted for accounts approval.',
      data: { trip, expense }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTrips(req: AuthRequest, res: Response) {
  try {
    const { engineerId, taskId, status } = req.query;

    const query: any = {};
    if (engineerId) query.engineerId = engineerId;
    if (taskId) query.taskId = taskId;
    if (status) query.status = status;

    if (req.user?.role === 'FIELD_ENGINEER') {
      const engineer = await Engineer.findOne({ userId: req.user.userId });
      if (engineer) query.engineerId = engineer._id;
    }

    const trips = await Trip.find(query)
      .populate('engineerId')
      .populate('taskId')
      .populate('bikeId')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: trips.length, data: trips });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTripById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id)
      .populate('engineerId')
      .populate('taskId')
      .populate('bikeId');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    return res.json({ success: true, data: trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
