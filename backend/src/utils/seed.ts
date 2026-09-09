import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { Engineer } from '../models/Engineer';
import { Bike } from '../models/Bike';
import { Task } from '../models/Task';
import { Trip } from '../models/Trip';
import { Expense } from '../models/Expense';
import { SystemSettings } from '../models/SystemSettings';
import { hashPassword } from './password';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting FieldTrack 360 database seed...');

    // Clear existing collections
    await User.deleteMany({});
    await Engineer.deleteMany({});
    await Bike.deleteMany({});
    await Task.deleteMany({});
    await Trip.deleteMany({});
    await Expense.deleteMany({});
    await SystemSettings.deleteMany({});

    // Create System Settings
    await SystemSettings.create({
      twoWheelerRate: 2,
      maxReimbursementPerTrip: 2000,
      minAccuracyMeters: 50,
      gpsUpdateIntervalSeconds: 5,
      offlineTimeoutMinutes: 2,
      currency: 'INR',
      currencySymbol: '₹',
      companyName: 'Skyronet Networks'
    });

    const adminPassword = await hashPassword('admin@123');
    const accountsPassword = await hashPassword('account@123');

    // 1. Create Core Role Users
    const superAdminUser = await User.create({
      email: 'superadmin@skyronet.com',
      password: adminPassword,
      name: 'Super Administrator',
      phone: '+91 98765 00001',
      role: 'SUPER_ADMIN',
      isOnline: true
    });

    const adminUser = await User.create({
      email: 'admin@skyronet.com',
      password: adminPassword,
      name: 'Admin Manager',
      phone: '+91 98765 00002',
      role: 'ADMIN',
      isOnline: true
    });

    const accountsUser = await User.create({
      email: 'accounts@skyronet.com',
      password: accountsPassword,
      name: 'Accounts Executive',
      phone: '+91 98765 00003',
      role: 'ACCOUNTS',
      isOnline: true
    });

    // 2. Create Field Engineer & User
    const engUser = await User.create({
      email: 'engineer1@skyronet.com',
      password: adminPassword,
      name: 'Field Engineer',
      phone: '+91 98765 11111',
      role: 'FIELD_ENGINEER',
      isOnline: true
    });

    const engineer = await Engineer.create({
      engineerId: 'FE-0001',
      userId: engUser._id,
      firstName: 'Field',
      lastName: 'Engineer',
      email: 'engineer1@skyronet.com',
      phone: '+91 98765 11111',
      employeeId: 'EMP-1001',
      department: 'Field Operations',
      designation: 'Network Engineer',
      status: 'Available',
      currentLatitude: 11.0168,
      currentLongitude: 76.9558,
      lastLocationUpdate: new Date()
    });

    // 3. Create Bike
    const bike = await Bike.create({
      bikeId: 'BIKE-001',
      engineerId: engineer._id,
      bikeNumber: 'TN 38 AB 1234',
      bikeModel: 'Honda Splendor Plus',
      manufacturer: 'Hero',
      fuelType: 'Petrol',
      mileage: 55,
      status: 'Active',
      assignedDate: new Date()
    });

    engineer.assignedBike = bike._id as any;
    await engineer.save();

    console.log('✅ FieldTrack 360 database seed completed successfully!');
    console.log('🔑 System Login Accounts:');
    console.log('   - Super Admin: superadmin@skyronet.com / admin@123');
    console.log('   - Admin:       admin@skyronet.com / admin@123');
    console.log('   - Accounts:    accounts@skyronet.com / account@123');
    console.log('   - Engineer:    engineer1@skyronet.com / admin@123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}
