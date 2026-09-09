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
      // Auto-sync: Ensure every User with role FIELD_ENGINEER has a corresponding Engineer document
      const feUsers = await User.find({ role: 'FIELD_ENGINEER' });
      for (const u of feUsers) {
        const nameParts = (u.name || 'Field Engineer').split(' ');
        const firstName = nameParts[0] || 'Field';
        const lastName = nameParts.slice(1).join(' ') || 'Engineer';

        const engExists = await Engineer.findOne({
          $or: [{ userId: u._id }, { email: u.email }]
        });
        if (!engExists) {
          const count = await Engineer.countDocuments();
          const engId = `FE-${String(count + 1).padStart(4, '0')}`;
          const empId = `EMP-${String(count + 1).padStart(4, '0')}`;

          await Engineer.create({
            engineerId: engId,
            userId: u._id,
            firstName,
            lastName,
            email: u.email,
            phone: u.phone || '',
            employeeId: empId,
            department: 'Field Operations',
            designation: 'Field Engineer',
            status: 'Available',
            joiningDate: (u as any).createdAt || new Date()
          });
        }
      }

      // Deduplicate: remove duplicate engineer records with same email, userId, or full name
      const allEngs = await Engineer.find({}).sort({ createdAt: 1 });
      const seenEmails = new Set<string>();
      const seenUserIds = new Set<string>();
      const seenFullNames = new Set<string>();

      for (const eng of allEngs) {
        const lowerEmail = (eng.email || '').toLowerCase().trim();
        const userIdStr = eng.userId ? String(eng.userId) : '';
        const fullNameKey = `${(eng.firstName || '').toLowerCase().trim()} ${(eng.lastName || '').toLowerCase().trim()}`.replace(/\s+/g, ' ');

        let isDuplicate = false;
        if (lowerEmail && seenEmails.has(lowerEmail)) isDuplicate = true;
        if (userIdStr && seenUserIds.has(userIdStr)) isDuplicate = true;
        if (fullNameKey && seenFullNames.has(fullNameKey)) isDuplicate = true;

        if (isDuplicate) {
          await Engineer.findByIdAndDelete(eng._id);
        } else {
          if (lowerEmail) seenEmails.add(lowerEmail);
          if (userIdStr) seenUserIds.add(userIdStr);
          if (fullNameKey) seenFullNames.add(fullNameKey);
        }
      }

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
      const feUsers = store.users.filter((u) => u.role === 'FIELD_ENGINEER');

      for (const u of feUsers) {
        const nameParts = (u.name || 'Field Engineer').split(' ');
        const firstName = nameParts[0] || 'Field';
        const lastName = nameParts.slice(1).join(' ') || 'Engineer';
        const fullNameKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`.trim();

        const engExists = store.engineers.find(
          (e) =>
            e.userId === u._id ||
            (e.email && u.email && e.email.toLowerCase() === u.email.toLowerCase()) ||
            `${(e.firstName || '').toLowerCase()} ${(e.lastName || '').toLowerCase()}`.trim() === fullNameKey
        );

        if (!engExists) {
          const engId = `FE-${String(store.engineers.length + 1).padStart(4, '0')}`;
          const empId = `EMP-${String(store.engineers.length + 1).padStart(4, '0')}`;

          store.engineers.push({
            _id: `eng_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            engineerId: engId,
            userId: u._id,
            firstName,
            lastName,
            email: u.email,
            phone: u.phone || '',
            employeeId: empId,
            department: 'Field Operations',
            designation: 'Field Engineer',
            status: 'Available',
            joiningDate: (u as any).createdAt || new Date()
          });
        } else if (!engExists.userId) {
          engExists.userId = u._id;
        }
      }

      // Deduplicate in-memory store engineers
      const seenEmails = new Set<string>();
      const seenUserIds = new Set<string>();
      const seenFullNames = new Set<string>();
      const cleanEngineers: any[] = [];

      for (const eng of store.engineers) {
        const lowerEmail = (eng.email || '').toLowerCase().trim();
        const userIdStr = eng.userId ? String(eng.userId) : '';
        const fullNameKey = `${(eng.firstName || '').toLowerCase().trim()} ${(eng.lastName || '').toLowerCase().trim()}`.replace(/\s+/g, ' ');

        let isDuplicate = false;
        if (lowerEmail && seenEmails.has(lowerEmail)) isDuplicate = true;
        if (userIdStr && seenUserIds.has(userIdStr)) isDuplicate = true;
        if (fullNameKey && seenFullNames.has(fullNameKey)) isDuplicate = true;

        if (!isDuplicate) {
          if (lowerEmail) seenEmails.add(lowerEmail);
          if (userIdStr) seenUserIds.add(userIdStr);
          if (fullNameKey) seenFullNames.add(fullNameKey);
          cleanEngineers.push(eng);
        }
      }
      store.engineers = cleanEngineers;

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

    if (!firstName || !lastName || !email || !phone || !password || !employeeId) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      phone,
      role: 'FIELD_ENGINEER'
    });

    const count = await Engineer.countDocuments();
    const engineerId = `FE-${String(count + 1).padStart(4, '0')}`;

    const engineer = await Engineer.create({
      engineerId,
      userId: user._id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      employeeId,
      department: department || 'Field Operations',
      designation: designation || 'Network Engineer',
      status: 'Available'
    });

    return res.status(201).json({
      success: true,
      message: 'Field Engineer created successfully',
      data: engineer
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateEngineer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { firstName, lastName, engineerId, phone, department, designation, status, assignedBike } = req.body;

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
        name: `${engineer.firstName} ${engineer.lastName}`,
        phone: engineer.phone
      });
    }

    return res.json({
      success: true,
      message: 'Engineer updated successfully',
      data: engineer
    });
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

export async function updateLocation(req: AuthRequest, res: Response) {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    let engineer: any = null;

    if (mongoose.connection.readyState === 1) {
      engineer = await Engineer.findOne({ userId: req.user!.userId });
      if (engineer) {
        engineer.currentLatitude = lat;
        engineer.currentLongitude = lng;
        engineer.lastLocationUpdate = new Date();
        if (engineer.status === 'Offline') {
          engineer.status = 'Available';
        }
        await engineer.save();

        await User.findByIdAndUpdate(req.user!.userId, {
          isOnline: true,
          lastActive: new Date()
        });
      }
    } else {
      const store = getInMemoryStore();
      engineer = store.engineers.find((e) => e.userId === req.user!.userId);
      if (engineer) {
        engineer.currentLatitude = lat;
        engineer.currentLongitude = lng;
        engineer.lastLocationUpdate = new Date();
        if (engineer.status === 'Offline') {
          engineer.status = 'Available';
        }
      }
      const user = store.users.find((u) => u._id === req.user!.userId);
      if (user) {
        user.isOnline = true;
        user.lastActive = new Date();
      }
    }

    // Broadcast live location via Socket.IO
    const io = req.app.get('io');
    if (io && engineer) {
      io.emit('location:update', {
        engineerId: engineer._id,
        userId: req.user!.userId,
        latitude: lat,
        longitude: lng,
        engineer
      });
    }

    return res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude: lat,
        longitude: lng
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

      if (eng.userId) {
        const userIdx = store.users.findIndex((u) => u._id === eng.userId);
        if (userIdx !== -1) {
          store.users.splice(userIdx, 1);
        }
      }

      return res.json({ success: true, message: 'Engineer deleted successfully' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
