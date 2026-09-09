# 📡 FieldTrack 360

> **Real-Time Field Engineer & Travel Management System**

FieldTrack 360 is an enterprise-grade full-stack web application for telecom and network companies. It manages field network engineers, task dispatching, real-time GPS tracking, bike travel distance, travel reimbursement calculations (e.g. ₹5 / KM), task completion verification with photo uploads, and accounts expense approval workflows.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Super Admin**: Complete administrative oversight, system settings & rate configuration.
   - **Admin**: Create field tasks, choose locations via Google Maps, assign field engineers, view live tracking map.
   - **Accounts**: Review completed trips, verify calculated distance & amounts, approve/reject expenses, export financial reports (CSV / PDF).
   - **Field Engineer**: Mobile-first interface, 1-click `[ START TRIP ]`, live Haversine GPS counter, work notes & site completion photo uploads.

2. **Real-Time GPS Tracking & Google Maps**:
   - Geolocation streaming via Socket.IO.
   - GPS point accuracy filtering (< 50m) and speed jump protection (> 150 km/h).
   - Interactive live map displaying engineer status markers, location details, task progress, and route polylines.
   - **Fallback Radar Map Mode**: Seamless visual simulation mode if Google Maps API Key is not configured.

3. **Automated Mileage Reimbursement Engine**:
   - Haversine formula distance computation.
   - Configurable per-KM reimbursement rates (default ₹5 / KM) and trip multipliers (One Way / Round Trip).
   - Immutable distance calculations prevent manual tampering by field workers.

4. **Accounts Approval Workflow & Reports**:
   - Automated expense claim generation upon trip completion.
   - Rejection reason requirement.
   - 7-day analytics trend charts and CSV export functionality.

---

## 🏗️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, React Router v6, Socket.IO Client.
- **Backend**: Node.js, Express.js, TypeScript, Socket.IO Server, Mongoose, JWT, bcryptjs, Multer, Zod, Helmet.
- **Database**: MongoDB (Supports MongoDB Atlas, Local MongoDB, or In-Memory Server fallback out of the box).

---

## 🚀 Quick Start Guide

### 1. Install Dependencies

In the root directory, run:

```bash
npm run setup
```

This will automatically install packages for both `backend` and `frontend`.

### 2. Environment Variables Configuration

Copy `.env.example` to create your configuration files:

**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=
JWT_SECRET=super_secret_fieldtrack_key_2026
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=
```

### 3. Run Development Server

```bash
# Terminal 1: Backend API & Socket.IO
npm run dev:backend

# Terminal 2: Frontend App
npm run dev:frontend
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Accounts & Seed Data

The database automatically populates with pre-seeded demo accounts upon first startup:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@fieldtrack.com` | `admin123` |
| **Super Admin** | `superadmin@skyronet.com` | `admin@123` |
| **Admin** | `admin@skyronet.com` | `admin@123` |
| **Accounts** | `accounts@skyronet.com` | `account@123` |

---

## 🔄 End-to-End Workflow Demonstration

1. **Admin Login**: Sign in as `admin@skyronet.com`.
2. **Register Engineer / Create Task**: Register or add a new Field Engineer, then go to `Field Tasks` -> `Assign New Task`. Select location coordinates and assign to your Field Engineer.
3. **Engineer Mobile Login**: Open a second window/tab or mobile device and sign in with your Field Engineer credentials.
4. **Start Trip**: Open the assigned task and click `[ START TRIP & BEGIN GPS TRACKING ]`.
5. **Real-time Map**: On the Admin dashboard, navigate to `Live Tracking` (`/live-tracking`) to watch the engineer's marker update live on the map.
6. **Task Completion**: On the mobile app, click `[ MARK ARRIVED ]` -> `[ COMPLETE TASK ]` and upload site photos.
7. **Stop Trip**: Click `[ STOP TRIP ]`. An automated travel expense (`EXP-xxxx`) is generated.
8. **Accounts Review**: Sign in as `accounts@fieldtrack.com`, navigate to `Travel Expenses`, review the distance and amount, and click `[ Approve ]`.
