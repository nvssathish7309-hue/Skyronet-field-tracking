import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Navigation,
  ClipboardList,
  Users,
  Bike as BikeIcon,
  Receipt,
  BarChart3,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Radio,
  Search,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

import { BrandLogo } from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';

export const DesktopLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success && Array.isArray(res.data.data)) {
          const count = res.data.data.filter((n: any) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (err) {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Accounts Overview', path: '/dashboard', icon: LayoutDashboard, roles: ['ACCOUNTS'] },
    { label: 'Live Tracking', path: '/live-tracking', icon: Navigation, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'] },
    { label: 'Field Tasks', path: '/tasks', icon: ClipboardList, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'] },
    { label: 'Field Engineers', path: '/engineers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'] },
    { label: 'Bike Fleet', path: '/bikes', icon: BikeIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Travel Expenses', path: '/expenses', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'] },
  ];

  const systemNavItems = [
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'] },
    { label: 'My Account Profile', path: '/profile', icon: UserCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'] },
    { label: 'System Settings', path: '/settings', icon: SettingsIcon, roles: ['SUPER_ADMIN', 'ADMIN'] }
  ];

  const filteredMain = mainNavItems.filter((item) => user && item.roles.includes(user.role));
  const filteredSystem = systemNavItems.filter((item) => user && item.roles.includes(user.role));

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'FE';

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-800">
      {/* White Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-slate-200/80 text-slate-700 flex flex-col shrink-0 z-30 transition-all duration-300 shadow-xs`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          <Link to="/dashboard">
            <BrandLogo collapsed={collapsed} size="md" />
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-all shrink-0 ml-1"
            title={collapsed ? 'Expand Menu' : 'Collapse Menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section Items */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* MAIN MENU */}
          <div>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Main Menu
              </div>
            )}
            <div className="space-y-1">
              {filteredMain.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center ${
                      collapsed ? 'justify-center px-0' : 'px-3.5'
                    } py-2.5 rounded-xl font-bold text-xs transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                      }`}
                    />
                    {!collapsed && (
                      <>
                        <span className="ml-3 truncate flex-1">{item.label}</span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive
                              ? 'text-white/80'
                              : 'text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5'
                          }`}
                        />
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* SYSTEM & PORTAL */}
          {filteredSystem.length > 0 && (
            <div>
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  System & Portal
                </div>
              )}
              <div className="space-y-1">
                {filteredSystem.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path + item.label}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center ${
                        collapsed ? 'justify-center px-0' : 'px-3.5'
                      } py-2.5 rounded-xl font-bold text-xs transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <span className="ml-3 truncate flex-1">{item.label}</span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isActive
                                ? 'text-white/80'
                                : 'text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5'
                            }`}
                          />
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!collapsed && (
            <div className="mb-2 px-3 py-2 bg-blue-50/80 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{user?.role.replace('_', ' ')}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200/80 font-bold text-xs shadow-2xs transition-all ${
              collapsed ? 'p-2' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-rose-600" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/70 px-6 flex items-center justify-between shrink-0 z-20 shadow-2xs">
          {/* Quick Search Bar */}
          <div className="relative w-96">
            <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, engineers, trips, bikes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner-2xs"
            />
          </div>

          {/* Right Control Icons & User Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell Icon */}
            <Link
              to="/notifications"
              className="relative w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all shadow-2xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-blue-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="h-6 w-px bg-slate-200" />

            {/* User Avatar Chip */}
            <Link to="/profile" className="flex items-center gap-3 group p-1 rounded-xl hover:bg-slate-50 transition-all cursor-pointer" title="Edit My Profile">
              <div className="w-9 h-9 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-100 transition-all">
                {userInitials}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-black text-xs text-slate-900 group-hover:text-blue-600 tracking-tight transition-all">{user?.name || 'Super Admin'}</div>
                <div className="mt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black uppercase tracking-wider">
                    {user?.role ? user.role.replace('_', ' ') : 'SUPER ADMIN'}
                  </span>
                </div>
              </div>
            </Link>

            {/* Quick Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-white">{children}</main>
      </div>
    </div>
  );
};

