import { Response } from 'express';
import mongoose from 'mongoose';
import { Engineer } from '../models/Engineer';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { Trip } from '../models/Trip';
import { Task } from '../models/Task';
import { getInMemoryStore } from '../utils/inMemoryDB';

export async function getEngineers(req: AuthRequest, res: Response) {
  try {
    const { status, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query: any = {};
      if (status) {
        query.status = status;
      }

      if (search) {
        const searchRegex = new RegExp(String(search), 'i');
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { engineerId: searchRegex },
          { phone: searchRegex },
          { email: searchRegex }
        ];
      }

      const engineers = await Engineer.find(query)
        .populate('userId', 'name email phone role avatarUrl isOnline lastActive')
        .populate('assignedBike')
        .populate('activeTaskId')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: engineers.length, data: engineers });
    } else {
      // In-Memory Store Fallback
      const store = getInMemoryStore();
      let result = [...store.engineers];
      if (status) {
        result = result.filter((e) => e.status === status);
      }

      if (search) {
        const s = String(search).toLowerCase();
        result = result.filter(
          (e) =>
            e.firstName.toLowerCase().includes(s) ||
            e.lastName.toLowerCase().includes(s) ||
            e.engineerId.toLowerCase().includes(s) ||
            e.email.toLowerCase().includes(s)
        );
      }

      return res.json({ success: true, count: result.length, data: result });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getEngineerById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const engineer = await Engineer.findById(id)
      .populate('userId', 'name email phone role avatarUrl isOnline lastActive')
      .populate('assignedBike')
      .populate('activeTaskId');

    if (!engineer) {
      return res.status(404).json({ success: false, message: 'Engineer not found' });
    }

    // Get today's trips & stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTrips = await Trip.find({
      engineerId: id,
      startTime: { $gte: startOfToday }
    });

    const totalKmToday = todayTrips.reduce((acc, t) => acc + t.distanceKm, 0);
    const totalAmountToday = todayTrips.reduce((acc, t) => acc + t.totalAmount, 0);

    // Get recent task history
    const taskHistory = await Task.find({ assignedEngineer: id })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      data: {
        engineer,
        todayStats: {
          totalKm: Math.round(totalKmToday * 100) / 100,
          totalAmount: Math.round(totalAmountToday * 100) / 100,
          tripsCount: todayTrips.length
        },
        taskHistory
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createEngineer(req: AuthRequest, res: Response) {
  try {
    const { firstName, lastName, email, phone, password, employeeId, department, designation } = req.body;

    if (!firstName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields: First Name, Email, Phone, Password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const fullName = `${firstName} ${lastName || ''}`.trim();
    const cleanPhone = phone.trim();

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({
        $or: [{ email: cleanEmail }, { phone: cleanPhone }]
      });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email address or phone number already exists' });
      }

      const existingEng = await Engineer.findOne({
        $or: [{ email: cleanEmail }, { phone: cleanPhone }]
      });
      if (existingEng) {
        return res.status(400).json({ success: false, message: 'An engineer with this email address or phone number already exists' });
      }

      const hashedPassword = await hashPassword(password);

      const user = await User.create({
        email: cleanEmail,
        password: hashedPassword,
        name: fullName,
        phone: cleanPhone,
        role: 'FIELD_ENGINEER',
        isOnline: true
      });

      const count = await Engineer.countDocuments();
      const empIdStr = employeeId || `EMP-${String(count + 1).padStart(4, '0')}`;
      const engineerId = `FE-${String(count + 1).padStart(4, '0')}`;

      const engineer = await Engineer.create({
        engineerId,
        userId: user._id,
        firstName,
        lastName: lastName || '',
        email: cleanEmail,
        phone: cleanPhone,
        employeeId: empIdStr,
        department: department || 'Field Operations',
        designation: designation || 'Field Engineer',
        status: 'Available',
        joiningDate: new Date()
      });

      return res.status(201).json({
        success: true,
        message: 'Field Engineer created successfully',
        data: engineer
      });
    } else {
      const store = getInMemoryStore();
      const existingUser = store.users.find(
        (u) => (u.email && u.email.toLowerCase() === cleanEmail) || (u.phone && u.phone === cleanPhone)
      );
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email address or phone number already exists' });
      }

      const existingEng = store.engineers.find(
        (e) => (e.email && e.email.toLowerCase() === cleanEmail) || (e.phone && e.phone === cleanPhone)
      );
      if (existingEng) {
        return res.status(400).json({ success: false, message: 'An engineer with this email address or phone number already exists' });
      }

      const hashedPassword = await hashPassword(password);
      const userIdStr = `usr_eng_${Date.now()}`;
      const empIdStr = employeeId || `EMP-${String(store.engineers.length + 1).padStart(4, '0')}`;
      const engineerId = `FE-${String(store.engineers.length + 1).padStart(4, '0')}`;

      const userObj = {
        _id: userIdStr,
        email: cleanEmail,
        password: hashedPassword,
        name: fullName,
        phone: cleanPhone,
        role: 'FIELD_ENGINEER',
        isOnline: true,
        createdAt: new Date()
      };
      store.users.push(userObj);

      const engObj = {
        _id: `eng_${Date.now()}`,
        engineerId,
        userId: userIdStr,
        firstName,
        lastName: lastName || '',
        email: cleanEmail,
        phone: cleanPhone,
        employeeId: empIdStr,
        department: department || 'Field Operations',
        designation: designation || 'Field Engineer',
        status: 'Available',
        joiningDate: new Date()
      };
      store.engineers.push(engObj);

      return res.status(201).json({
        success: true,
        message: 'Field Engineer created successfully',
        data: engObj
      });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateEngineer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { firstName, lastName, engineerId, phone, department, designation, status, assignedBike } = req.body;

    if (mongoose.connection.readyState === 1) {
      const engineer = await Engineer.findById(id);
      if (!engineer) {
        return res.status(404).json({ success: false, message: 'Engineer not found' });
      }

      if (firstName) engineer.firstName = firstName;
      if (lastName) engineer.lastName = lastName;
      if (engineerId) engineer.engineerId = engineerId;
      if (phone) engineer.phone = phone;
      if (department) engineer.department = department;
      if (designation) engineer.designation = designation;
      if (status) engineer.status = status;
      if (assignedBike !== undefined) engineer.assignedBike = assignedBike;

      await engineer.save();

      if (engineer.userId) {
        await User.findByIdAndUpdate(engineer.userId, {
          name: `${engineer.firstName} ${engineer.lastName}`.trim(),
          phone: engineer.phone
        });
      }

      return res.json({
        success: true,
        message: 'Engineer updated successfully',
        data: engineer
      });
    } else {
      const store = getInMemoryStore();
      const engineer = store.engineers.find((e) => e._id === id || e.engineerId === id);
      if (!engineer) {
        return res.status(404).json({ success: false, message: 'Engineer not found' });
      }

      if (firstName) engineer.firstName = firstName;
      if (lastName) engineer.lastName = lastName;
      if (engineerId) engineer.engineerId = engineerId;
      if (phone) engineer.phone = phone;
      if (department) engineer.department = department;
      if (designation) engineer.designation = designation;
      if (status) engineer.status = status;
      if (assignedBike !== undefined) engineer.assignedBike = assignedBike;

      if (engineer.userId) {
        const user = store.users.find((u) => u._id === engineer.userId);
        if (user) {
          user.name = `${engineer.firstName} ${engineer.lastName}`.trim();
          user.phone = engineer.phone;
        }
      }

      return res.json({
        success: true,
        message: 'Engineer updated successfully',
        data: engineer
      });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateMyProfile(req: AuthRequest, res: Response) {
  try {
    const { firstName, lastName, engineerId, phone, department, designation, bikeNumber, bikeModel, bikeMileage } = req.body;

    const engineer = await Engineer.findOne({ userId: req.user!.userId }).populate('assignedBike');
    if (!engineer) {
      return res.status(404).json({ success: false, message: 'Engineer profile not found' });
    }

    if (firstName) engineer.firstName = firstName;
    if (lastName) engineer.lastName = lastName;
    if (engineerId) engineer.engineerId = engineerId;
    if (phone) engineer.phone = phone;
    if (department) engineer.department = department;
    if (designation) engineer.designation = designation;

    // Handle Bike Details Update
    const { Bike } = await import('../models/Bike');
    if (bikeNumber || bikeModel || bikeMileage) {
      let bike: any = null;
      if (engineer.assignedBike) {
        bike = await Bike.findById((engineer.assignedBike as any)._id || engineer.assignedBike);
      }
      if (!bike && bikeNumber) {
        bike = await Bike.findOne({ bikeNumber });
      }
      if (!bike && bikeNumber) {
        const count = await Bike.countDocuments();
        bike = new Bike({
          bikeId: `BIKE-${String(count + 1).padStart(3, '0')}`,
          bikeNumber,
          bikeModel: bikeModel || 'Hero Splendor Plus',
          manufacturer: 'Hero',
          mileage: Number(bikeMileage) || 55,
          engineerId: engineer._id
        });
      } else if (bike) {
        if (bikeNumber) bike.bikeNumber = bikeNumber;
        if (bikeModel) bike.bikeModel = bikeModel;
        if (bikeMileage) bike.mileage = Number(bikeMileage);
        bike.engineerId = engineer._id;
      }
      if (bike) {
        await bike.save();
        engineer.assignedBike = bike._id;
      }
    }

    await engineer.save();

    // Update User record name & phone
    const user = await User.findById(req.user!.userId);
    if (user) {
      user.name = `${engineer.firstName} ${engineer.lastName}`;
      user.phone = engineer.phone;
      await user.save();
    }

    const updatedEngineer = await Engineer.findById(engineer._id)
      .populate('userId')
      .populate('assignedBike');

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          phone: user?.phone,
          engineer: updatedEngineer
        },
        engineer: updatedEngineer
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

function calcKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export async function updateLocation(req: AuthRequest, res: Response) {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    let engineer: any = null;
    let activeTrip: any = null;

    if (mongoose.connection.readyState === 1) {
      try {
        engineer = await Engineer.findOne({
          $or: [{ userId: req.user!.userId }, { email: req.user!.email }]
        });
      } catch (_) {
        engineer = await Engineer.findOne({ email: req.user!.email });
      }

      if (engineer) {
        engineer.currentLatitude = lat;
        engineer.currentLongitude = lng;
        engineer.lastLocationUpdate = new Date();
        if (engineer.status === 'Offline') {
          engineer.status = 'Available';
        }
        await engineer.save();

        try {
          await User.findByIdAndUpdate(req.user!.userId, {
            isOnline: true,
            lastActive: new Date()
          });
        } catch (_) {}

        // Calculate live KM and RS for active trip
        activeTrip = await Trip.findOne({ engineerId: engineer._id, status: 'Active' });
        if (activeTrip) {
          const pts = activeTrip.locationPoints || [];
          const lastPt = pts.length > 0
            ? pts[pts.length - 1]
            : { latitude: activeTrip.startLatitude, longitude: activeTrip.startLongitude };

          const distAdded = calcKm(lastPt.latitude, lastPt.longitude, lat, lng);
          if (distAdded > 0.005) {
            activeTrip.distanceKm = Math.round((activeTrip.distanceKm + distAdded) * 100) / 100;
            activeTrip.totalAmount = Math.round((activeTrip.distanceKm * activeTrip.reimbursementRate) * 100) / 100;
            activeTrip.locationPoints.push({
              latitude: lat,
              longitude: lng,
              accuracy: 10,
              timestamp: new Date()
            });
            await activeTrip.save();
          }
        }
      }
    } else {
      const store = getInMemoryStore();
      engineer = store.engineers.find(
        (e) => e.userId === req.user!.userId || e.email === req.user!.email
      );

      if (engineer) {
        engineer.currentLatitude = lat;
        engineer.currentLongitude = lng;
        engineer.lastLocationUpdate = new Date();
        if (engineer.status === 'Offline') {
          engineer.status = 'Available';
        }

        activeTrip = store.trips.find((t) => t.engineerId === engineer._id && t.status === 'Active');
        if (activeTrip) {
          const pts = activeTrip.locationPoints || [];
          const lastPt = pts.length > 0
            ? pts[pts.length - 1]
            : { latitude: activeTrip.startLatitude, longitude: activeTrip.startLongitude };

          const distAdded = calcKm(lastPt.latitude, lastPt.longitude, lat, lng);
          if (distAdded > 0.005) {
            activeTrip.distanceKm = Math.round((activeTrip.distanceKm + distAdded) * 100) / 100;
            activeTrip.totalAmount = Math.round((activeTrip.distanceKm * activeTrip.reimbursementRate) * 100) / 100;
            if (!activeTrip.locationPoints) activeTrip.locationPoints = [];
            activeTrip.locationPoints.push({
              latitude: lat,
              longitude: lng,
              accuracy: 10,
              timestamp: new Date()
            });
          }
        }
      }
      const user = store.users.find((u) => u._id === req.user!.userId);
      if (user) {
        user.isOnline = true;
        user.lastActive = new Date();
      }
    }

    // Broadcast live location & active trip update via Socket.IO
    const io = req.app.get('io');
    if (io && engineer) {
      io.emit('location:update', {
        engineerId: engineer._id,
        userId: req.user!.userId,
        latitude: lat,
        longitude: lng,
        engineer,
        activeTrip
      });
      if (activeTrip) {
        io.emit('trip:location-update', {
          tripId: activeTrip._id,
          distanceKm: activeTrip.distanceKm,
          totalAmount: activeTrip.totalAmount,
          latitude: lat,
          longitude: lng
        });
      }
    }

    return res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude: lat,
        longitude: lng,
        activeTrip
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteEngineer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const engineer = await Engineer.findById(id);
      if (!engineer) {
        return res.status(404).json({ success: false, message: 'Engineer not found' });
      }

      // Delete associated User account if present
      if (engineer.userId) {
        await User.findByIdAndDelete(engineer.userId);
      }
      if (engineer.email) {
        await User.deleteMany({ email: engineer.email.toLowerCase().trim() });
      }

      await Engineer.findByIdAndDelete(id);

      return res.json({ success: true, message: 'Engineer deleted successfully' });
    } else {
      const store = getInMemoryStore();
      const index = store.engineers.findIndex((e) => e._id === id || e.engineerId === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Engineer not found' });
      }

      const eng = store.engineers[index];
      store.engineers.splice(index, 1);

      // Remove associated user accounts by userId or email
      store.users = store.users.filter(
        (u) => u._id !== eng.userId && (!eng.email || !u.email || u.email.toLowerCase().trim() !== eng.email.toLowerCase().trim())
      );

      return res.json({ success: true, message: 'Engineer deleted successfully' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
