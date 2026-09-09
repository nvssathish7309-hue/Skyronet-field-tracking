import { Response } from 'express';
import mongoose from 'mongoose';
import { Trip, TripType } from '../models/Trip';
import { Task } from '../models/Task';
import { Engineer } from '../models/Engineer';
import { Expense } from '../models/Expense';
import { SystemSettings } from '../models/SystemSettings';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';
import { AuditLog } from '../models/AuditLog';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { getInMemoryStore, saveStoreToDisk } from '../utils/inMemoryDB';
import { createNotification } from '../utils/notificationHelper';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export async function startTrip(req: AuthRequest, res: Response) {
  try {
    const { taskId, startLatitude, startLongitude, tripType } = req.body;

    if (startLatitude === undefined || startLongitude === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide starting GPS coordinates' });
    }

    const startLat = Number(startLatitude);
    const startLng = Number(startLongitude);

    if (mongoose.connection.readyState === 1) {
      let engineer: any = null;
      try {
        engineer = await Engineer.findOne({
          $or: [
            { userId: req.user!.userId },
            { email: req.user!.email }
          ]
        }).populate('assignedBike');
      } catch (_) {
        engineer = await Engineer.findOne({ email: req.user!.email }).populate('assignedBike');
      }

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
        startLatitude: startLat,
        startLongitude: startLng,
        startTime: new Date(),
        distanceKm: 0,
        tripType: (tripType as TripType) || 'One Way',
        reimbursementRate: rate,
        totalAmount: 0,
        status: 'Active',
        locationPoints: [
          {
            latitude: startLat,
            longitude: startLng,
            accuracy: 10,
            timestamp: new Date()
          }
        ]
      });

      if (task) {
        task.status = 'On The Way';
        if (!task.startTime) task.startTime = new Date();
        await task.save();
        engineer.activeTaskId = task._id as any;
      }

      engineer.status = 'On The Way';
      engineer.activeTripId = trip._id as any;
      engineer.currentLatitude = startLat;
      engineer.currentLongitude = startLng;
      engineer.lastLocationUpdate = new Date();
      await engineer.save();

      // Emit Socket events for Admin & Accounts live dashboards
      try {
        getIO().emit('trip:started', {
          tripId: trip._id,
          tripCode: trip.tripId,
          engineerId: engineer._id,
          taskId: task ? task._id : undefined,
          trip,
          engineer
        });
        getIO().emit('location:update', {
          engineerId: engineer._id,
          userId: req.user!.userId,
          latitude: startLat,
          longitude: startLng,
          engineer,
          activeTrip: trip
        });
      } catch (_) {}

      // Create Admin & Accounts Alert Notifications
      try {
        await createNotification({
          roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'],
          title: 'Ride Started',
          message: `${engineer.firstName} ${engineer.lastName} started ride ${trip.tripId}`,
          type: 'INFO',
          link: '/live-tracking'
        });
      } catch (_) {}

      try {
        await AuditLog.create({
          userId: req.user!.userId as any,
          userName: req.user!.email,
          action: 'START_TRIP',
          entity: 'Trip',
          entityId: trip.tripId,
          description: `Engineer ${engineer.firstName} started trip ${trip.tripId} ${task ? `for task ${task.taskId}` : '(General Travel)'}`
        });
      } catch (_) {}

      return res.status(201).json({
        success: true,
        message: 'Trip started successfully. Real-time GPS tracking active.',
        data: trip
      });
    } else {
      // In-Memory Store Fallback
      const store = getInMemoryStore();
      const engineer = store.engineers.find(
        (e) => e.userId === req.user!.userId || e.email === req.user!.email
      );

      if (!engineer) {
        return res.status(404).json({ success: false, message: 'Field Engineer profile not found' });
      }

      const existingActiveTrip = store.trips.find(
        (t) => t.engineerId === engineer._id && t.status === 'Active'
      );
      if (existingActiveTrip) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active trip in progress',
          data: existingActiveTrip
        });
      }

      let task: any = null;
      if (taskId) {
        task = store.tasks.find((t) => t._id === taskId);
      }

      const rate = 2.0; // ₹2/km standard reimbursement rate
      const tripId = `TRIP-${String(store.trips.length + 1).padStart(4, '0')}`;

      const newTrip = {
        _id: `trip_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        tripId,
        engineerId: engineer._id,
        taskId: task ? task._id : undefined,
        bikeId: engineer.assignedBike ? engineer.assignedBike._id : undefined,
        startLatitude: startLat,
        startLongitude: startLng,
        startTime: new Date(),
        distanceKm: 0,
        tripType: (tripType as TripType) || 'One Way',
        reimbursementRate: rate,
        totalAmount: 0,
        status: 'Active',
        locationPoints: [
          {
            latitude: startLat,
            longitude: startLng,
            accuracy: 10,
            timestamp: new Date()
          }
        ]
      };

      store.trips.push(newTrip);

      if (task) {
        task.status = 'On The Way';
        if (!task.startTime) task.startTime = new Date();
        engineer.activeTaskId = task._id;
      }

      engineer.status = 'On The Way';
      engineer.activeTripId = newTrip._id;
      engineer.currentLatitude = startLat;
      engineer.currentLongitude = startLng;
      engineer.lastLocationUpdate = new Date();

      saveStoreToDisk();

      try {
        getIO().emit('trip:started', {
          tripId: newTrip._id,
          tripCode: newTrip.tripId,
          engineerId: engineer._id,
          taskId: task ? task._id : undefined,
          trip: newTrip,
          engineer
        });
        getIO().emit('location:update', {
          engineerId: engineer._id,
          userId: req.user!.userId,
          latitude: startLat,
          longitude: startLng,
          engineer,
          activeTrip: newTrip
        });
        await createNotification({
          roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'],
          title: 'Ride Started',
          message: `${engineer.firstName} ${engineer.lastName} started ride ${newTrip.tripId}`,
          type: 'INFO',
          link: '/live-tracking'
        });
      } catch (_) {}

      return res.status(201).json({
        success: true,
        message: 'Trip started successfully. Real-time GPS tracking active.',
        data: newTrip
      });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function stopTrip(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { endLatitude, endLongitude } = req.body;

    if (mongoose.connection.readyState === 1) {
      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      if (trip.status !== 'Active') {
        return res.status(400).json({ success: false, message: 'Trip is not active' });
      }

      const endLat = Number(endLatitude) || trip.startLatitude;
      const endLng = Number(endLongitude) || trip.startLongitude;

      trip.endLatitude = endLat;
      trip.endLongitude = endLng;
      trip.endTime = new Date();
      trip.status = 'Completed';

      // Final distance calculation from locationPoints or straight line
      let totalDist = trip.distanceKm;
      if (totalDist === 0 && (endLat !== trip.startLatitude || endLng !== trip.startLongitude)) {
        totalDist = calculateDistanceKm(trip.startLatitude, trip.startLongitude, endLat, endLng);
      }
      trip.distanceKm = Math.round(totalDist * 100) / 100;

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

      const engineer = await Engineer.findById(trip.engineerId);
      if (engineer) {
        engineer.status = 'Available';
        engineer.activeTripId = undefined;
        await engineer.save();
      }

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
          totalAmount: trip.totalAmount,
          trip,
          expense
        });
        getIO().emit('expense:created', { expense });
      } catch (_) {}

      // Create Admin & Accounts Alert Notifications
      try {
        const engName = engineer ? `${engineer.firstName} ${engineer.lastName}` : 'Field Engineer';
        await createNotification({
          roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'],
          title: 'Ride Stopped',
          message: `${engName} stopped ride ${trip.tripId} (${trip.distanceKm} km)`,
          type: 'SUCCESS',
          link: '/expenses'
        });
      } catch (_) {}

      return res.json({
        success: true,
        message: 'Trip stopped. Expense submitted for accounts approval.',
        data: { trip, expense }
      });
    } else {
      // In-Memory Store Fallback
      const store = getInMemoryStore();
      const trip = store.trips.find((t) => t._id === id || t.tripId === id);

      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      const endLat = Number(endLatitude) || trip.startLatitude;
      const endLng = Number(endLongitude) || trip.startLongitude;

      trip.endLatitude = endLat;
      trip.endLongitude = endLng;
      trip.endTime = new Date();
      trip.status = 'Completed';

      let totalDist = trip.distanceKm;
      if (totalDist === 0 && (endLat !== trip.startLatitude || endLng !== trip.startLongitude)) {
        totalDist = calculateDistanceKm(trip.startLatitude, trip.startLongitude, endLat, endLng);
      }
      trip.distanceKm = Math.round(totalDist * 100) / 100;

      const multiplier = trip.tripType === 'Round Trip' ? 2 : 1;
      trip.totalAmount = Math.round(trip.distanceKm * multiplier * trip.reimbursementRate * 100) / 100;

      const expense = {
        _id: `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        expenseId: `EXP-${String(store.expenses.length + 1).padStart(4, '0')}`,
        tripId: trip._id,
        taskId: trip.taskId || undefined,
        engineerId: trip.engineerId,
        distanceKm: trip.distanceKm * multiplier,
        reimbursementRate: trip.reimbursementRate,
        calculatedAmount: trip.totalAmount,
        submittedAmount: trip.totalAmount,
        status: 'Pending',
        submittedAt: new Date()
      };

      store.expenses.push(expense);

      const engineer = store.engineers.find((e) => e._id === trip.engineerId);
      if (engineer) {
        engineer.status = 'Available';
        engineer.activeTripId = undefined;
      }

      if (trip.taskId) {
        const task = store.tasks.find((t) => t._id === trip.taskId);
        if (task && task.status !== 'Completed') {
          task.status = 'Arrived';
        }
      }

      saveStoreToDisk();

      try {
        getIO().emit('trip:completed', {
          tripId: trip._id,
          expenseId: expense._id,
          distanceKm: trip.distanceKm,
          totalAmount: trip.totalAmount,
          trip,
          expense
        });
        getIO().emit('expense:created', { expense });
        const engName = engineer ? `${engineer.firstName} ${engineer.lastName}` : 'Field Engineer';
        await createNotification({
          roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'],
          title: 'Ride Stopped',
          message: `${engName} stopped ride ${trip.tripId} (${trip.distanceKm} km)`,
          type: 'SUCCESS',
          link: '/expenses'
        });
      } catch (_) {}

      return res.json({
        success: true,
        message: 'Trip stopped. Expense submitted for accounts approval.',
        data: { trip, expense }
      });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


export async function getTrips(req: AuthRequest, res: Response) {
  try {
    const { engineerId, taskId, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query: any = {};
      if (engineerId) query.engineerId = engineerId;
      if (taskId) query.taskId = taskId;
      if (status) query.status = status;

      if (req.user?.role === 'FIELD_ENGINEER') {
        const engineer = await Engineer.findOne({
          $or: [{ userId: req.user.userId }, { email: req.user.email }]
        });
        if (engineer) query.engineerId = engineer._id;
      }

      const trips = await Trip.find(query)
        .populate('engineerId')
        .populate('taskId')
        .populate('bikeId')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: trips.length, data: trips });
    } else {
      const store = getInMemoryStore();
      let result = [...store.trips];

      if (req.user?.role === 'FIELD_ENGINEER') {
        const engineer = store.engineers.find(
          (e) => e.userId === req.user!.userId || e.email === req.user!.email
        );
        if (engineer) {
          result = result.filter((t) => t.engineerId === engineer._id);
        }
      }

      if (engineerId) {
        result = result.filter((t) => t.engineerId === engineerId);
      }
      if (taskId) {
        result = result.filter((t) => t.taskId === taskId);
      }
      if (status) {
        result = result.filter((t) => t.status === status);
      }

      return res.json({ success: true, count: result.length, data: result });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTripById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const trip = await Trip.findById(id)
        .populate('engineerId')
        .populate('taskId')
        .populate('bikeId');

      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      return res.json({ success: true, data: trip });
    } else {
      const store = getInMemoryStore();
      const trip = store.trips.find((t) => t._id === id || t.tripId === id);

      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      return res.json({ success: true, data: trip });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
