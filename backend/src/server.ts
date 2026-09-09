import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

import authRoutes from './routes/authRoutes';
import engineerRoutes from './routes/engineerRoutes';
import bikeRoutes from './routes/bikeRoutes';
import taskRoutes from './routes/taskRoutes';
import tripRoutes from './routes/tripRoutes';
import expenseRoutes from './routes/expenseRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import settingsRoutes from './routes/settingsRoutes';
import auditLogRoutes from './routes/auditLogRoutes';

import { initSocketIO } from './socket';
import { errorHandler } from './middleware/errorHandler';
import { seedDatabase } from './utils/seed';
import { User } from './models/User';
import { seedInMemoryStore } from './utils/inMemoryDB';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Socket.IO Server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

initSocketIO(io);

// Express Middlewares
app.use(cors());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder for photo attachments
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/engineers', engineerRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'FieldTrack 360 API',
    timestamp: new Date()
  });
});

app.use(errorHandler);

// ⚡ Handle server listen errors gracefully
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use by another process.`);
    console.error(`💡 Tip: Run 'Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force' in PowerShell to release the port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// ⚡ Start Express Server IMMEDIATELY so port 5000 listens without waiting
server.listen(PORT, () => {
  console.log(`🚀 FieldTrack 360 Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO Real-time Engine initialized`);
});

// Database Connection & Boot Handler
async function connectDatabase() {
  await seedInMemoryStore(); // Pre-load instant fallback store

  let mongoUri = process.env.MONGODB_URI;

  try {
    if (mongoUri) {
      console.log(`Connecting to MongoDB at ${mongoUri}...`);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log('✅ Connected to MongoDB database');
    } else {
      console.log('⚡ Attempting local MongoDB connection at mongodb://127.0.0.1:27017/fieldtrack360...');
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/fieldtrack360', { serverSelectionTimeoutMS: 2000 });
        console.log('✅ Connected to Local MongoDB database');
      } catch (_) {
        console.log('⚡ Local MongoDB not active. Launching MongoMemoryServer in background...');
        MongoMemoryServer.create()
          .then(async (mongod) => {
            const memoryUri = mongod.getUri();
            await mongoose.connect(memoryUri);
            console.log('✅ Connected to In-Memory MongoDB Server');
            const userCount = await User.countDocuments();
            if (userCount === 0) {
              await seedDatabase();
            }
          })
          .catch((err) => {
            console.log('⚡ Running in instant fallback Memory DB mode');
          });
      }
    }

    if (mongoose.connection.readyState === 1) {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await seedDatabase();
      }
    }
  } catch (error) {
    console.log('⚡ Running with instant InMemoryStore fallback');
  }
}

connectDatabase();
