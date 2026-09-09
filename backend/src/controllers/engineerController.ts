import { Response } from 'express';
import { Engineer } from '../models/Engineer';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { Trip } from '../models/Trip';
import { Task } from '../models/Task';

export async function getEngineers(req: AuthRequest, res: Response) {
  try {
    const { status, search } = req.query;

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
