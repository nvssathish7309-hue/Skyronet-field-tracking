import { Response } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { getInMemoryStore, saveStoreToDisk } from '../utils/inMemoryDB';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userIdStr = req.user!.userId.toString();

    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      let userNotifs = store.notifications.filter(
        (n) => n.userId === userIdStr || n.userId?.toString() === userIdStr
      );

      if (userNotifs.length === 0) {
        const isEngineer = req.user!.role === 'FIELD_ENGINEER';
        const initialAlerts = isEngineer
          ? [
              {
                _id: `notif_${Date.now()}_1`,
                userId: userIdStr,
                title: 'Welcome to SKYRONET FieldTrack 360',
                message: 'Your field engineer account is active. Live GPS tracking enabled.',
                type: 'SUCCESS',
                isRead: false,
                createdAt: new Date()
              },
              {
                _id: `notif_${Date.now()}_2`,
                userId: userIdStr,
                title: 'Fuel Rate Configured',
                message: 'Petrol rate set to ₹110/Liter (₹2.00/KM distance rate).',
                type: 'INFO',
                isRead: false,
                createdAt: new Date(Date.now() - 3600000)
              }
            ]
          : [
              {
                _id: `notif_${Date.now()}_1`,
                userId: userIdStr,
                title: 'SKYRONET System Active',
                message: 'Live GPS tracking and fleet management modules operational.',
                type: 'SUCCESS',
                isRead: false,
                createdAt: new Date()
              },
              {
                _id: `notif_${Date.now()}_2`,
                userId: userIdStr,
                title: 'Fuel Rate Active',
                message: 'Rate set to ₹110/Liter (₹2.00/KM) for distance claims.',
                type: 'INFO',
                isRead: false,
                createdAt: new Date(Date.now() - 3600000)
              }
            ];

        store.notifications.push(...initialAlerts);
        userNotifs = [...initialAlerts];
        saveStoreToDisk();
      }

      userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const unreadCount = userNotifs.filter((n) => !n.isRead).length;
      return res.json({ success: true, count: userNotifs.length, unreadCount, data: userNotifs });
    }

    let notifications = await Notification.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(30);

    if (notifications.length === 0) {
      const isEngineer = req.user!.role === 'FIELD_ENGINEER';
      const initialAlerts = isEngineer
        ? [
            {
              userId: req.user!.userId as any,
              title: 'Welcome to SKYRONET FieldTrack 360',
              message: 'Your field engineer account is active. Live GPS tracking enabled.',
              type: 'SUCCESS',
              isRead: false,
              createdAt: new Date()
            },
            {
              userId: req.user!.userId as any,
              title: 'Fuel Rate Configured',
              message: 'Petrol rate set to ₹110/Liter (₹2.00/KM distance rate).',
              type: 'INFO',
              isRead: false,
              createdAt: new Date(Date.now() - 3600000)
            }
          ]
        : [
            {
              userId: req.user!.userId as any,
              title: 'SKYRONET System Active',
              message: 'Live GPS tracking and fleet management modules operational.',
              type: 'SUCCESS',
              isRead: false,
              createdAt: new Date()
            },
            {
              userId: req.user!.userId as any,
              title: 'Fuel Rate Active',
              message: 'Rate set to ₹110/Liter (₹2.00/KM) for distance claims.',
              type: 'INFO',
              isRead: false,
              createdAt: new Date(Date.now() - 3600000)
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
    const userIdStr = req.user!.userId.toString();

    if (mongoose.connection.readyState !== 1) {
      const store = getInMemoryStore();
      if (id === 'read-all') {
        store.notifications.forEach((n) => {
          if (n.userId === userIdStr || n.userId?.toString() === userIdStr) {
            n.isRead = true;
          }
        });
        saveStoreToDisk();
        return res.json({ success: true, message: 'All notifications marked as read' });
      }

      const notif = store.notifications.find(
        (n) => n._id === id && (n.userId === userIdStr || n.userId?.toString() === userIdStr)
      );
      if (notif) {
        notif.isRead = true;
        saveStoreToDisk();
      }
      return res.json({ success: true, data: notif });
    }

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

