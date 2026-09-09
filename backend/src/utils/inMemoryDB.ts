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

  store.users = [superAdmin, admin, accounts];
  store.bikes = [];
  store.engineers = [];
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
