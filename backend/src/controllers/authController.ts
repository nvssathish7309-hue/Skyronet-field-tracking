import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Engineer } from '../models/Engineer';
import { comparePassword, hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { getInMemoryStore } from '../utils/inMemoryDB';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user: any = null;

    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: cleanEmail });
    }

    // Fallback to inMemoryStore if DB not connected or user not in DB
    if (!user) {
      const store = getInMemoryStore();
      user = store.users.find((u) => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Mark user online
    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndUpdate(user._id, { isOnline: true, lastActive: new Date() });
      user.isOnline = true;
    } else {
      user.isOnline = true;
      user.lastActive = new Date();
    }

    let engineerInfo: any = null;
    if (user.role === 'FIELD_ENGINEER') {
      if (mongoose.connection.readyState === 1) {
        engineerInfo = await Engineer.findOne({ userId: user._id }).populate('assignedBike');

        if (!engineerInfo) {
          const count = await Engineer.countDocuments();
          const engId = `FE-${String(count + 1).padStart(4, '0')}`;
          const empId = `EMP-${String(count + 1).padStart(4, '0')}`;
          const nameParts = (user.name || 'Field Engineer').split(' ');
          const firstName = nameParts[0] || 'Field';
          const lastName = nameParts.slice(1).join(' ') || 'Engineer';

          engineerInfo = await Engineer.create({
            engineerId: engId,
            userId: user._id,
            firstName,
            lastName,
            email: user.email,
            phone: user.phone || '',
            employeeId: empId,
            department: 'Field Operations',
            designation: 'Field Engineer',
            status: 'Available',
            joiningDate: user.createdAt || new Date()
          });
        } else if (engineerInfo.status === 'Offline') {
          engineerInfo.status = 'Available';
          await engineerInfo.save();
        }
      }

      if (!engineerInfo) {
        const store = getInMemoryStore();
        engineerInfo = store.engineers.find((e) => e.userId === user._id || e.email === user.email);

        if (!engineerInfo) {
          const engId = `FE-${String(store.engineers.length + 1).padStart(4, '0')}`;
          const empId = `EMP-${String(store.engineers.length + 1).padStart(4, '0')}`;
          const nameParts = (user.name || 'Field Engineer').split(' ');
          const firstName = nameParts[0] || 'Field';
          const lastName = nameParts.slice(1).join(' ') || 'Engineer';

          engineerInfo = {
            _id: `eng_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            engineerId: engId,
            userId: user._id,
            firstName,
            lastName,
            email: user.email,
            phone: user.phone || '',
            employeeId: empId,
            department: 'Field Operations',
            designation: 'Field Engineer',
            status: 'Available',
            joiningDate: user.createdAt || new Date()
          };
          store.engineers.push(engineerInfo);
        } else if (engineerInfo.status === 'Offline') {
          engineerInfo.status = 'Available';
        }
      }
    }

    return res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          engineer: engineerInfo
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let user: any = null;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(req.user.userId).select('-password');
    }

    if (!user) {
      const store = getInMemoryStore();
      user = store.users.find((u) => u._id.toString() === req.user!.userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let engineerInfo = null;
    if (user.role === 'FIELD_ENGINEER') {
      if (mongoose.connection.readyState === 1) {
        engineerInfo = await Engineer.findOne({ userId: user._id }).populate('assignedBike');
      }
      if (!engineerInfo) {
        const store = getInMemoryStore();
        engineerInfo = store.engineers.find((e) => e.userId === user._id || e.email === user.email);
      }
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          engineer: engineerInfo
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function registerEngineer(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, phone, password, designation, department } = req.body;

    if (!firstName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide required fields: First name, Email, Phone, Password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    let existingUser: any = null;
    if (mongoose.connection.readyState === 1) {
      existingUser = await User.findOne({ email: cleanEmail });
    } else {
      const store = getInMemoryStore();
      existingUser = store.users.find((u) => u.email === cleanEmail);
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const fullName = `${firstName} ${lastName || ''}`.trim();
    const empIdStr = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const engIdStr = `FE-${Math.floor(1000 + Math.random() * 9000)}`;

    let userObj: any = null;
    let engObj: any = null;

    if (mongoose.connection.readyState === 1) {
      userObj = await User.create({
        email: cleanEmail,
        password: hashedPassword,
        name: fullName,
        phone,
        role: 'FIELD_ENGINEER',
        isOnline: true
      });

      engObj = await Engineer.create({
        engineerId: engIdStr,
        userId: userObj._id,
        firstName,
        lastName: lastName || '',
        email: cleanEmail,
        phone,
        employeeId: empIdStr,
        department: department || 'Field Operations',
        designation: designation || 'Field Engineer',
        joiningDate: new Date(),
        status: 'Available'
      });
    } else {
      const store = getInMemoryStore();
      const userIdStr = `usr_eng_${Date.now()}`;

      userObj = {
        _id: userIdStr,
        email: cleanEmail,
        password: hashedPassword,
        name: fullName,
        phone,
        role: 'FIELD_ENGINEER',
        isOnline: true,
        createdAt: new Date()
      };
      store.users.push(userObj);

      engObj = {
        _id: `eng_${Date.now()}`,
        engineerId: engIdStr,
        userId: userIdStr,
        firstName,
        lastName: lastName || '',
        email: cleanEmail,
        phone,
        employeeId: empIdStr,
        department: department || 'Field Operations',
        designation: designation || 'Field Engineer',
        joiningDate: new Date(),
        status: 'Available'
      };
      store.engineers.push(engObj);
    }

    const token = generateToken({
      userId: userObj._id.toString(),
      email: userObj.email,
      role: userObj.role
    });

    return res.status(201).json({
      success: true,
      message: 'Field Engineer registered successfully',
      data: {
        token,
        user: {
          id: userObj._id,
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          phone: userObj.phone,
          engineer: engObj
        }
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { name, phone, email, currentPassword, newPassword } = req.body;

    let user: any = null;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(req.user.userId);
    } else {
      const store = getInMemoryStore();
      user = store.users.find((u) => u._id.toString() === req.user!.userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Password change check
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Please provide current password to set a new password' });
      }
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match' });
      }
      user.password = await hashPassword(newPassword);
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (email) user.email = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      await user.save();
    }

    // Sync engineer info if field engineer
    let engineerInfo = null;
    if (user.role === 'FIELD_ENGINEER') {
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || 'Field';
      const lastName = nameParts.slice(1).join(' ') || 'Engineer';

      if (mongoose.connection.readyState === 1) {
        engineerInfo = await Engineer.findOneAndUpdate(
          { userId: user._id },
          { firstName, lastName, phone: user.phone, email: user.email },
          { new: true }
        );
      } else {
        const store = getInMemoryStore();
        const eng = store.engineers.find((e) => e.userId === user._id || e.email === user.email);
        if (eng) {
          eng.firstName = firstName;
          eng.lastName = lastName;
          eng.phone = user.phone;
          eng.email = user.email;
          engineerInfo = eng;
        }
      }
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          engineer: engineerInfo
        }
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
}

