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
      twoWheelerRate: 5,
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

    // 2. Create Field Engineers & Users
    const engineersData = [
      {
        firstName: 'Sathish',
        lastName: 'N',
        email: 'engineer1@fieldtrack.com',
        phone: '+91 98765 11111',
        empId: 'EMP-1001',
        lat: 11.0168,
        lng: 76.9558,
        status: 'On The Way' as const
      },
      {
        firstName: 'Rajesh',
        lastName: 'K',
        email: 'engineer2@fieldtrack.com',
        phone: '+91 98765 22222',
        empId: 'EMP-1002',
        lat: 11.025,
        lng: 76.96,
        status: 'Available' as const
      },
      {
        firstName: 'Anand',
        lastName: 'V',
        email: 'engineer3@fieldtrack.com',
        phone: '+91 98765 33333',
        empId: 'EMP-1003',
        lat: 11.035,
        lng: 76.97,
        status: 'On Task' as const
      },
      {
        firstName: 'Priya',
        lastName: 'M',
        email: 'engineer4@fieldtrack.com',
        phone: '+91 98765 44444',
        empId: 'EMP-1004',
        lat: 11.005,
        lng: 76.945,
        status: 'Available' as const
      },
      {
        firstName: 'Karthik',
        lastName: 'S',
        email: 'engineer5@fieldtrack.com',
        phone: '+91 98765 55555',
        empId: 'EMP-1005',
        lat: 11.045,
        lng: 76.98,
        status: 'Offline' as const
      }
    ];

    const createdEngineers = [];

    for (let i = 0; i < engineersData.length; i++) {
      const e = engineersData[i];
      const u = await User.create({
        email: e.email,
        password: adminPassword,
        name: `${e.firstName} ${e.lastName}`,
        phone: e.phone,
        role: 'FIELD_ENGINEER',
        isOnline: e.status !== 'Offline'
      });

      const eng = await Engineer.create({
        engineerId: `FE-000${i + 1}`,
        userId: u._id,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        employeeId: e.empId,
        department: 'Field Operations',
        designation: 'Network Engineer',
        status: e.status,
        currentLatitude: e.lat,
        currentLongitude: e.lng,
        lastLocationUpdate: new Date()
      });

      createdEngineers.push(eng);
    }

    // 3. Create Bikes
    const bikesData = [
      { number: 'TN 38 AB 1234', model: 'Honda Splendor Plus', manufacturer: 'Hero' },
      { number: 'TN 37 CD 5678', model: 'TVS Pulsar 150', manufacturer: 'TVS' },
      { number: 'TN 66 EF 9012', model: 'Honda Shine', manufacturer: 'Honda' },
      { number: 'TN 38 GH 3456', model: 'Royal Enfield Classic 350', manufacturer: 'RE' },
      { number: 'TN 37 JK 7890', model: 'Yamaha FZ', manufacturer: 'Yamaha' }
    ];

    for (let i = 0; i < bikesData.length; i++) {
      const b = bikesData[i];
      const bike = await Bike.create({
        bikeId: `BIKE-00${i + 1}`,
        engineerId: createdEngineers[i]._id,
        bikeNumber: b.number,
        bikeModel: b.model,
        manufacturer: b.manufacturer,
        fuelType: 'Petrol',
        mileage: 55,
        status: 'Active',
        assignedDate: new Date()
      });

      createdEngineers[i].assignedBike = bike._id as any;
      await createdEngineers[i].save();
    }

    // 4. Create Tasks
    const tasksData = [
      {
        title: 'Fiber Cable Splicing & ONU Installation',
        customer: 'ABC Tech Parks',
        phone: '+91 99887 11223',
        location: 'Gandhipuram, Coimbatore',
        address: '124, 10th Street, Gandhipuram, Coimbatore - 641012',
        lat: 11.0183,
        lng: 76.9644,
        priority: 'Urgent' as const,
        status: 'On The Way' as const,
        engIndex: 0
      },
      {
        title: 'Main Optical Node Maintenance & Signal Audit',
        customer: 'Kovai Medical Center',
        phone: '+91 99887 22334',
        location: 'Avinashi Road, Coimbatore',
        address: 'KMCH Hospital Campus, Avinashi Road, Coimbatore - 641014',
        lat: 11.042,
        lng: 77.035,
        priority: 'High' as const,
        status: 'In Progress' as const,
        engIndex: 2
      },
      {
        title: 'Enterprise Router Switch Configuration',
        customer: 'Skyline Software Systems',
        phone: '+91 99887 33445',
        location: 'TIDEL Park, Coimbatore',
        address: 'ELCOT SEZ, Civil Aerodrome Post, Coimbatore - 641014',
        lat: 11.027,
        lng: 77.022,
        priority: 'Medium' as const,
        status: 'Assigned' as const,
        engIndex: 1
      },
      {
        title: 'Residential FTTH Connection Setup',
        customer: 'Mr. Ramesh Kumar',
        phone: '+91 99887 44556',
        location: 'RS Puram, Coimbatore',
        address: '45, DB Road, RS Puram, Coimbatore - 641002',
        lat: 11.008,
        lng: 76.951,
        priority: 'Low' as const,
        status: 'Pending' as const,
        engIndex: 3
      },
      {
        title: 'Leased Line Link Latency Troubleshooting',
        customer: 'City Union Bank Branch',
        phone: '+91 99887 55667',
        location: 'Cross Cut Road, Coimbatore',
        address: '78, Cross Cut Rd, Ram Nagar, Coimbatore - 641009',
        lat: 11.0195,
        lng: 76.961,
        priority: 'High' as const,
        status: 'Completed' as const,
        engIndex: 0
      }
    ];

    const createdTasks = [];

    for (let i = 0; i < tasksData.length; i++) {
      const t = tasksData[i];
      const task = await Task.create({
        taskId: `TASK-${String(i + 1).padStart(4, '0')}`,
        title: t.title,
        description: `Perform field task for ${t.customer}. Verify signal power levels and report completion.`,
        customerName: t.customer,
        customerPhone: t.phone,
        locationName: t.location,
        address: t.address,
        latitude: t.lat,
        longitude: t.lng,
        assignedEngineer: createdEngineers[t.engIndex]._id,
        assignedBy: adminUser._id,
        priority: t.priority,
        scheduledDate: new Date(),
        scheduledTime: '10:30 AM',
        status: t.status
      });
      createdTasks.push(task);
    }

    // Assign active task to Engineer 0
    createdEngineers[0].activeTaskId = createdTasks[0]._id as any;
    await createdEngineers[0].save();

    // 5. Create Trips & Expenses
    const trip1 = await Trip.create({
      tripId: 'TRIP-0001',
      engineerId: createdEngineers[0]._id,
      taskId: createdTasks[0]._id,
      bikeId: createdEngineers[0].assignedBike,
      startLatitude: 11.0168,
      startLongitude: 76.9558,
      startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      distanceKm: 18.6,
      tripType: 'One Way',
      reimbursementRate: 5,
      totalAmount: 93,
      status: 'Active',
      locationPoints: [
        { latitude: 11.0168, longitude: 76.9558, accuracy: 5, timestamp: new Date(Date.now() - 45 * 60 * 1000) },
        { latitude: 11.0175, longitude: 76.958, accuracy: 8, timestamp: new Date(Date.now() - 30 * 60 * 1000) },
        { latitude: 11.0183, longitude: 76.9644, accuracy: 6, timestamp: new Date() }
      ]
    });

    createdEngineers[0].activeTripId = trip1._id as any;
    await createdEngineers[0].save();

    // Completed Trip & Expense
    const trip2 = await Trip.create({
      tripId: 'TRIP-0002',
      engineerId: createdEngineers[0]._id,
      taskId: createdTasks[4]._id,
      bikeId: createdEngineers[0].assignedBike,
      startLatitude: 11.0168,
      startLongitude: 76.9558,
      endLatitude: 11.0195,
      endLongitude: 76.961,
      startTime: new Date(Date.now() - 180 * 60 * 1000),
      endTime: new Date(Date.now() - 120 * 60 * 1000),
      distanceKm: 24.2,
      tripType: 'Round Trip',
      reimbursementRate: 5,
      totalAmount: 242,
      status: 'Completed',
      locationPoints: [
        { latitude: 11.0168, longitude: 76.9558, accuracy: 6, timestamp: new Date(Date.now() - 180 * 60 * 1000) },
        { latitude: 11.0195, longitude: 76.961, accuracy: 5, timestamp: new Date(Date.now() - 120 * 60 * 1000) }
      ]
    });

    await Expense.create({
      expenseId: 'EXP-0001',
      tripId: trip2._id,
      taskId: createdTasks[4]._id,
      engineerId: createdEngineers[0]._id,
      distanceKm: 48.4,
      reimbursementRate: 5,
      calculatedAmount: 242,
      submittedAmount: 242,
      status: 'Pending',
      submittedAt: new Date(Date.now() - 120 * 60 * 1000)
    });

    console.log('✅ FieldTrack 360 database seed completed successfully!');
    console.log('🔑 Demo Login Accounts:');
    console.log('   - Super Admin: superadmin@fieldtrack.com / admin123');
    console.log('   - Admin:       admin@fieldtrack.com / admin123');
    console.log('   - Accounts:    accounts@fieldtrack.com / admin123');
    console.log('   - Engineer:    engineer1@fieldtrack.com / admin123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}
