import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    let notifications = await Notification.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(30);

    // If user has 0 notifications, seed initial role-based system alerts
    if (notifications.length === 0) {
      const isEngineer = req.user!.role === 'FIELD_ENGINEER';
      const initialAlerts = isEngineer
        ? [
            {
              userId: req.user!.userId as any,
              title: 'Welcome to SKYRONET FieldTrack 360',
              message: 'Your field engineer account is active. High-precision GPS tracking and automated mileage reimbursement enabled.',
              type: 'SUCCESS',
              isRead: false,
              createdAt: new Date()
            },
            {
              userId: req.user!.userId as any,
              title: 'Real-Time Fuel Reimbursement Rate Active',
              message: 'Current petrol rate is configured at ₹110 / Liter. Distance reimbursement is calculated automatically at ₹2.00 / KM.',
              type: 'INFO',
              isRead: false,
              createdAt: new Date(Date.now() - 3600000)
            },
            {
              userId: req.user!.userId as any,
              title: 'GPS Location Access Required',
              message: 'Please ensure location permissions are enabled on your device when starting rides or task trips.',
              type: 'WARNING',
              isRead: false,
              createdAt: new Date(Date.now() - 7200000)
            }
          ]
        : [
            {
              userId: req.user!.userId as any,
              title: 'SKYRONET Technology Dashboard Operational',
              message: 'All system services, live GPS tracking, bike fleet management, and accounts approval modules are active.',
              type: 'SUCCESS',
              isRead: false,
              createdAt: new Date()
            },
            {
              userId: req.user!.userId as any,
              title: 'Real-Time Fuel Price Configured',
              message: 'Petrol price set to ₹110 / Liter (₹2.00 / KM). Rate applies automatically to all two-wheeler field travel claims.',
              type: 'INFO',
              isRead: false,
              createdAt: new Date(Date.now() - 3600000)
            },
            {
              userId: req.user!.userId as any,
              title: 'Accounts & Expense Approvals Ready',
              message: 'Automated expense calculation active for field engineer trip logs.',
              type: 'INFO',
              isRead: false,
              createdAt: new Date(Date.now() - 7200000)
            }
          ];

      await Notification.insertMany(initialAlerts);

      notifications = await Notification.find({ userId: req.user!.userId })
        .sort({ createdAt: -1 })
        .limit(30);
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user!.userId,
      isRead: false
    });

    return res.json({ success: true, count: notifications.length, unreadCount, data: notifications });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (id === 'read-all') {
      await Notification.updateMany({ userId: req.user!.userId }, { isRead: true });
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user!.userId },
      { isRead: true },
      { new: true }
    );

    return res.json({ success: true, data: notification });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
