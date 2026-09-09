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

    console.log('✅ FieldTrack 360 database seed completed successfully!');
    console.log('🔑 System Login Accounts:');
    console.log('   - Super Admin: superadmin@skyronet.com / admin@123');
    console.log('   - Admin:       admin@skyronet.com / admin@123');
    console.log('   - Accounts:    accounts@skyronet.com / account@123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}
