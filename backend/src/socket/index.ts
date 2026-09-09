import { Server as SocketIOServer, Socket } from 'socket.io';
import { Engineer } from '../models/Engineer';
import { EngineerLocation } from '../models/EngineerLocation';
import { Trip } from '../models/Trip';
import { SystemSettings } from '../models/SystemSettings';
import { isValidGPSPoint } from '../utils/haversine';
import { AuditLog } from '../models/AuditLog';

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
}

export function initSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room based on role or user
    socket.on('join:room', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Real-time location update from Field Engineer Mobile App
    socket.on(
      'engineer:send-location',
      async (data: {
        engineerId: string;
        taskId?: string;
        tripId?: string;
        latitude: number;
        longitude: number;
        accuracy: number;
        speed?: number;
        heading?: number;
      }) => {
        try {
          const { engineerId, taskId, tripId, latitude, longitude, accuracy, speed, heading } = data;

          const engineer = await Engineer.findById(engineerId);
          if (!engineer) return;

          // Update engineer's current location & heartbeat
          engineer.currentLatitude = latitude;
          engineer.currentLongitude = longitude;
          engineer.lastLocationUpdate = new Date();
          if (engineer.status === 'Offline') {
            engineer.status = engineer.activeTaskId ? 'On Task' : 'Available';
          }
          await engineer.save();

          // Get system settings for accuracy limit
          const settings = await SystemSettings.findOne();
          const maxAccuracy = settings?.minAccuracyMeters || 50;

          // Store location history
          await EngineerLocation.create({
            engineerId,
            taskId,
            tripId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            timestamp: new Date()
          });

          let addedDistance = 0;

          // If engineer is on an active trip, accumulate distance using Haversine
          if (tripId) {
            const trip = await Trip.findById(tripId);
            if (trip && trip.status === 'Active') {
              const lastPoint = trip.locationPoints[trip.locationPoints.length - 1];

              let validPoint = true;
              if (lastPoint) {
                const validation = isValidGPSPoint(
                  lastPoint.latitude,
                  lastPoint.longitude,
                  lastPoint.timestamp,
                  latitude,
                  longitude,
                  new Date(),
                  accuracy,
                  maxAccuracy
                );
                validPoint = validation.valid;
                if (validPoint) {
                  addedDistance = validation.distanceKm;
                }
              }

              if (validPoint) {
                trip.locationPoints.push({
                  latitude,
                  longitude,
                  accuracy,
                  speed,
                  timestamp: new Date()
                });
                trip.distanceKm = Math.round((trip.distanceKm + addedDistance) * 100) / 100;
                const multiplier = trip.tripType === 'Round Trip' ? 2 : 1;
                trip.totalAmount = Math.round(trip.distanceKm * multiplier * trip.reimbursementRate * 100) / 100;
                await trip.save();

                // Broadcast trip update
                io.emit('trip:updated', {
                  tripId: trip._id,
                  distanceKm: trip.distanceKm,
                  totalAmount: trip.totalAmount,
                  locationPointsCount: trip.locationPoints.length
                });
              }
            }
          }

          // Broadcast location update to Admin and Accounts rooms
          io.emit('engineer:location-update', {
            engineerId: engineer._id,
            engineerIdCode: engineer.engineerId,
            name: `${engineer.firstName} ${engineer.lastName}`,
            status: engineer.status,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            lastUpdated: engineer.lastLocationUpdate,
            taskId,
            tripId,
            addedDistance
          });
        } catch (err) {
          console.error('Socket location error:', err);
        }
      }
    );

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
