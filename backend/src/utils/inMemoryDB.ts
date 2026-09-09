import fs from 'fs';
import path from 'path';
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

const DATA_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'db_store.json');

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

export function saveStoreToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store to disk:', err);
  }
}

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

  // Attempt to load existing store from disk
  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      store.users = loaded.users || [];
      store.engineers = loaded.engineers || [];
      store.bikes = loaded.bikes || [];
      store.tasks = loaded.tasks || [];
      store.trips = loaded.trips || [];
      store.expenses = loaded.expenses || [];
      store.notifications = loaded.notifications || [];
      store.auditLogs = loaded.auditLogs || [];
      store.settings = loaded.settings || null;
      console.log(`💾 Loaded persistent store from disk (${store.users.length} users, ${store.engineers.length} engineers, ${store.tasks.length} tasks).`);
    } catch (err) {
      console.error('Failed to parse persistent store file, reinitializing clean store:', err);
    }
  }

  // Ensure system core accounts are always present
  if (!store.users.some(u => u.email === superAdmin.email)) store.users.push(superAdmin);
  if (!store.users.some(u => u.email === admin.email)) store.users.push(admin);
  if (!store.users.some(u => u.email === accounts.email)) store.users.push(accounts);

  if (!store.settings) {
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
  }

  saveStoreToDisk();
  console.log('⚡ InMemoryStore ready & synchronized with disk storage.');
}

export function getInMemoryStore(): InMemoryStore {
  return store;
}
