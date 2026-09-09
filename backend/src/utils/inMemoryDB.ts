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

  store.users = [superAdmin, admin, accounts, eng1User];

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

  store.bikes = [bike1];

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
    status: 'Available',
    currentLatitude: 11.0168,
    currentLongitude: 76.9558,
    lastLocationUpdate: new Date()
  };

  store.engineers = [eng1];
  store.tasks = [];
  store.trips = [];
  store.expenses = [];
  store.notifications = [];
  store.auditLogs = [];

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

  console.log('⚡ InMemoryStore pre-loaded with clean initial system accounts.');
}

export function getInMemoryStore(): InMemoryStore {
  return store;
}
