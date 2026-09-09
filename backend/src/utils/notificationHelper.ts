import mongoose from 'mongoose';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { getInMemoryStore, saveStoreToDisk } from './inMemoryDB';
import { getIO } from '../socket';

export interface CreateNotificationParams {
  roles?: ('SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTS' | 'FIELD_ENGINEER')[];
  userIds?: (string | mongoose.Types.ObjectId)[];
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { roles, userIds, title, message, type = 'INFO', link } = params;

    let targetUserIds: string[] = [];

    if (mongoose.connection.readyState === 1) {
      const query: any = {};
      if (roles && roles.length > 0) query.role = { $in: roles };
      if (userIds && userIds.length > 0) query._id = { $in: userIds };

      const users = await User.find(query).select('_id');
      targetUserIds = users.map((u) => u._id.toString());

      if (targetUserIds.length > 0) {
        const notifDocs = targetUserIds.map((uId) => ({
          userId: new mongoose.Types.ObjectId(uId),
          title,
          message,
          type,
          link,
          isRead: false,
          createdAt: new Date()
        }));
        await Notification.insertMany(notifDocs);
      }
    } else {
      const store = getInMemoryStore();
      let matchedUsers = store.users;

      if (roles && roles.length > 0) {
        matchedUsers = matchedUsers.filter((u) => roles.includes(u.role));
      }
      if (userIds && userIds.length > 0) {
        const strIds = userIds.map((id) => id.toString());
        matchedUsers = matchedUsers.filter((u) => strIds.includes(u._id.toString()));
      }

      targetUserIds = matchedUsers.map((u) => u._id.toString());

      targetUserIds.forEach((uId) => {
        const notif = {
          _id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId: uId,
          title,
          message,
          type,
          link,
          isRead: false,
          createdAt: new Date()
        };
        store.notifications.unshift(notif);
      });
      saveStoreToDisk();
    }

    // Broadcast Socket.IO event for instant real-time notification & bell shake
    try {
      getIO().emit('notification:new', {
        title,
        message,
        type,
        link,
        targetUserIds,
        createdAt: new Date()
      });
    } catch (_) {}
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
