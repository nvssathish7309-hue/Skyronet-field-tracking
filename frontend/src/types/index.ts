export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTS' | 'FIELD_ENGINEER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  engineer?: Engineer;
}

export type EngineerStatus = 'Available' | 'On Task' | 'On The Way' | 'Offline' | 'Leave';

export interface Engineer {
  _id: string;
  engineerId: string; // FE-0001
  userId: string | User;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  employeeId: string;
  department: string;
  designation: string;
  assignedBike?: Bike;
  joiningDate: string;
  status: EngineerStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  activeTaskId?: string;
  activeTripId?: string;
}

export interface Bike {
  _id: string;
  bikeId: string;
  engineerId?: Engineer;
  bikeNumber: string;
  bikeModel: string;
  manufacturer: string;
  fuelType: string;
  mileage: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
  assignedDate?: string;
}

export type TaskStatus =
  | 'Pending'
  | 'Assigned'
  | 'Accepted'
  | 'On The Way'
  | 'Arrived'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface TaskPhoto {
  url: string;
  filename: string;
  uploadedAt: string;
  caption?: string;
}

export interface Task {
  _id: string;
  taskId: string;
  title: string;
  description: string;
  customerName: string;
  customerPhone: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  assignedEngineer?: Engineer;
  assignedBy: User;
  priority: TaskPriority;
  scheduledDate: string;
  scheduledTime: string;
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  workNotes?: string;
  materialsUsed?: string;
  photos: TaskPhoto[];
  createdAt: string;
  updatedAt: string;
}

export type TripStatus = 'Active' | 'Completed' | 'Cancelled' | 'Approved' | 'Rejected';
export type TripType = 'One Way' | 'Round Trip';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  timestamp: string;
}

export interface Trip {
  _id: string;
  tripId: string;
  engineerId: Engineer;
  taskId: Task;
  bikeId?: Bike;
  startLatitude: number;
  startLongitude: number;
  startTime: string;
  endLatitude?: number;
  endLongitude?: number;
  endTime?: string;
  distanceKm: number;
  tripType: TripType;
  reimbursementRate: number;
  totalAmount: number;
  status: TripStatus;
  locationPoints: LocationPoint[];
  createdAt: string;
  updatedAt: string;
}

export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Expense {
  _id: string;
  expenseId: string;
  tripId: Trip;
  taskId: Task;
  engineerId: Engineer;
  distanceKm: number;
  reimbursementRate: number;
  calculatedAmount: number;
  submittedAmount: number;
  approvedAmount?: number;
  expenseType?: string;
  status: ExpenseStatus;
  submittedAt: string;
  reviewedBy?: User;
  reviewedAt?: string;
  rejectionReason?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface SystemSettings {
  petrolPricePerLiter?: number;
  defaultMileage?: number;
  twoWheelerRate: number;
  maxReimbursementPerTrip?: number;
  minAccuracyMeters: number;
  gpsUpdateIntervalSeconds: number;
  offlineTimeoutMinutes: number;
  currency: string;
  currencySymbol: string;
  companyName: string;
}
