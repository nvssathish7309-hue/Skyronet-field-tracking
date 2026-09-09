import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Notification } from '../types';
import { Bell, CheckCheck, CheckCircle2, Info, AlertTriangle, AlertCircle, Sparkles, Filter } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'IMPORTANT'>('ALL');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all/read');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'UNREAD') return !n.isRead;
    if (filterTab === 'IMPORTANT') return n.type === 'WARNING' || n.type === 'DANGER';
    return true;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        };
      case 'DANGER':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
        };
      default:
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Info className="w-4 h-4 text-blue-600 shrink-0" />
        };
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-900 text-lg tracking-tight">System Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase font-mono">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Live alerts for task assignments, GPS ride logs & fuel reimbursement updates
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
            filterTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterTab('UNREAD')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
            filterTab === 'UNREAD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilterTab('IMPORTANT')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
            filterTab === 'IMPORTANT' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          System Alerts
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs font-medium">
            Loading system notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/60 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">All caught up!</h3>
            <p className="text-xs text-slate-500 font-medium">No notifications matching the selected filter right now.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const badge = getTypeBadge(n.type);

            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && handleMarkSingleRead(n._id)}
                className={`p-4 rounded-3xl border transition-all space-y-2 cursor-pointer ${
                  n.isRead
                    ? 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                    : 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-500/10 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {badge.icon}
                    <h3 className="font-extrabold text-slate-900 text-xs">{n.title}</h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed pl-6">{n.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
