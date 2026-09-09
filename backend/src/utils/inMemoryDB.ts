/**
 * Instant In-Memory Database Store
 * Guarantees 0-millisecond startup & lightning fast response times
 * when external MongoDB instance is not available.
 */
import { hashPassword } from './password';

export interface InMemoryStore {
  users: any[];
  engineers: any[];
  bikes: any[];
  tasks: any[];
  trips: any[];
  expenses: any[];
  notifications: any[];
  auditLogs: any[];
  settings: any;
}

let store: InMemoryStore = {
  users: [],
  engineers: [],
  bikes: [],
  tasks: [],
  trips: [],
  expenses: [],
  notifications: [],
  auditLogs: [],
  settings: null
};

export async function seedInMemoryStore() {
  const adminPassword = await hashPassword('admin@123');
  const accountsPassword = await hashPassword('account@123');

  const superAdmin = {
    _id: 'usr_superadmin',
    email: 'superadmin@skyronet.com',
    password: adminPassword,
    name: 'Super Administrator',
    phone: '+91 98765 00001',
    role: 'SUPER_ADMIN',
    isOnline: true,
    createdAt: new Date()
  };

  const admin = {
    _id: 'usr_admin',
    email: 'admin@skyronet.com',
    password: adminPassword,
    name: 'Admin Manager',
    phone: '+91 98765 00002',
    role: 'ADMIN',
    isOnline: true,
    createdAt: new Date()
  };

  const accounts = {
    _id: 'usr_accounts',
    email: 'accounts@skyronet.com',
    password: accountsPassword,
    name: 'Accounts Executive',
    phone: '+91 98765 00003',
    role: 'ACCOUNTS',
    isOnline: true,
    createdAt: new Date()
  };

  const eng1User = {
    _id: 'usr_eng1',
    email: 'engineer1@skyronet.com',
    password: adminPassword,
    name: 'Field Engineer',
    phone: '+91 98765 11111',
    role: 'FIELD_ENGINEER',
    isOnline: true,
    createdAt: new Date()
  };

  const eng2User = {
    _id: 'usr_eng2',
    email: 'engineer2@skyronet.com',
    password: adminPassword,
    name: 'Rajesh K',
    phone: '+91 98765 22222',
    role: 'FIELD_ENGINEER',
    isOnline: true,
    createdAt: new Date()
  };

  store.users = [superAdmin, admin, accounts, eng1User, eng2User];

  const bike1 = {
    _id: 'bike_1',
    bikeId: 'BIKE-001',
    bikeNumber: 'TN 38 AB 1234',
    bikeModel: 'Honda Splendor Plus',
    manufacturer: 'Hero',
    fuelType: 'Petrol',
    mileage: 55,
    status: 'Active',
    assignedDate: new Date()
  };

  const bike2 = {
    _id: 'bike_2',
    bikeId: 'BIKE-002',
    bikeNumber: 'TN 37 CD 5678',
    bikeModel: 'TVS Pulsar 150',
    manufacturer: 'TVS',
    fuelType: 'Petrol',
    mileage: 50,
    status: 'Active',
    assignedDate: new Date()
  };

  store.bikes = [bike1, bike2];

  const eng1 = {
    _id: 'eng_1',
    engineerId: 'FE-0001',
    userId: eng1User._id,
    firstName: 'Field',
    lastName: 'Engineer',
    email: 'engineer1@skyronet.com',
    phone: '+91 98765 11111',
    employeeId: 'EMP-1001',
    department: 'Field Operations',
    designation: 'Network Engineer',
    assignedBike: bike1,
    status: 'On The Way',
    currentLatitude: 11.0168,
    currentLongitude: 76.9558,
    lastLocationUpdate: new Date(),
    activeTaskId: 'task_1',
    activeTripId: 'trip_1'
  };

  const eng2 = {
    _id: 'eng_2',
    engineerId: 'FE-0002',
    userId: eng2User._id,
    firstName: 'Rajesh',
    lastName: 'K',
    email: 'engineer2@skyronet.com',
    phone: '+91 98765 22222',
    employeeId: 'EMP-1002',
    department: 'Field Operations',
    designation: 'Senior Engineer',
    assignedBike: bike2,
    status: 'Available',
    currentLatitude: 11.025,
    currentLongitude: 76.96,
    lastLocationUpdate: new Date()
  };

  store.engineers = [eng1, eng2];

  const task1 = {
    _id: 'task_1',
    taskId: 'TASK-0001',
    title: 'Fiber Cable Splicing & ONU Installation',
    description: 'Perform field task for ABC Tech Parks. Verify signal power levels.',
    customerName: 'ABC Tech Parks',
    customerPhone: '+91 99887 11223',
    locationName: 'Gandhipuram, Coimbatore',
    address: '124, 10th Street, Gandhipuram, Coimbatore - 641012',
    latitude: 11.0183,
    longitude: 76.9644,
    assignedEngineer: eng1,
    assignedBy: admin,
    priority: 'Urgent',
    scheduledDate: new Date(),
    scheduledTime: '10:30 AM',
    status: 'On The Way',
    photos: []
  };

  const task2 = {
    _id: 'task_2',
    taskId: 'TASK-0002',
    title: 'Main Optical Node Maintenance & Signal Audit',
    description: 'Signal audit and power testing.',
    customerName: 'Kovai Medical Center',
    customerPhone: '+91 99887 22334',
    locationName: 'Avinashi Road, Coimbatore',
    address: 'KMCH Hospital Campus, Avinashi Road, Coimbatore - 641014',
    latitude: 11.042,
    longitude: 77.035,
    assignedEngineer: eng2,
    assignedBy: admin,
    priority: 'High',
    scheduledDate: new Date(),
    scheduledTime: '11:00 AM',
    status: 'Assigned',
    photos: []
  };

  store.tasks = [task1, task2];

  const trip1 = {
    _id: 'trip_1',
    tripId: 'TRIP-0001',
    engineerId: eng1,
    taskId: task1,
    bikeId: bike1,
    startLatitude: 11.0168,
    startLongitude: 76.9558,
    startTime: new Date(Date.now() - 45 * 60 * 1000),
    distanceKm: 18.6,
    tripType: 'One Way',
    reimbursementRate: 2,
    totalAmount: 37.2,
    status: 'Active',
    locationPoints: [
      { latitude: 11.0168, longitude: 76.9558, accuracy: 5, timestamp: new Date(Date.now() - 45 * 60 * 1000) },
      { latitude: 11.0183, longitude: 76.9644, accuracy: 6, timestamp: new Date() }
    ]
  };

  store.trips = [trip1];

  const exp1 = {
    _id: 'exp_1',
    expenseId: 'EXP-0001',
    tripId: trip1,
    taskId: task1,
    engineerId: eng1,
    distanceKm: 18.6,
    reimbursementRate: 2,
    calculatedAmount: 37.2,
    submittedAmount: 37.2,
    status: 'Pending',
    submittedAt: new Date(Date.now() - 10 * 60 * 1000)
  };

  store.expenses = [exp1];

  store.settings = {
    twoWheelerRate: 2,
    maxReimbursementPerTrip: 2000,
    minAccuracyMeters: 50,
    gpsUpdateIntervalSeconds: 5,
    offlineTimeoutMinutes: 2,
    currency: 'INR',
    currencySymbol: '₹',
    companyName: 'Skyronet Networks'
  };

  console.log('⚡ InMemoryStore pre-loaded instantly with demo accounts.');
}

export function getInMemoryStore(): InMemoryStore {
  return store;
}
