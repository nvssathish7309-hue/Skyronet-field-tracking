import React, { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ClipboardList, Navigation, Receipt, User, LogOut, Radio, AlertTriangle, RefreshCw, CheckCircle2, Sun, Moon } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';

export const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [gpsStatus, setGpsStatus] = useState<'prompt' | 'enabled' | 'disabled' | 'denied'>('prompt');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [requestingGps, setRequestingGps] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (user?.role === 'FIELD_ENGINEER') {
      initGpsTracking();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user]);

  const initGpsTracking = () => {
    if (!navigator.geolocation) {
      setGpsStatus('disabled');
      return;
    }

    setRequestingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGpsStatus('enabled');
        setRequestingGps(false);
        await sendLocationToBackend(latitude, longitude);
        startWatch();
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        setRequestingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('disabled');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGpsStatus('enabled');
        await sendLocationToBackend(latitude, longitude);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('disabled');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const sendLocationToBackend = async (lat: number, lng: number) => {
    try {
      await api.post('/engineers/location', { latitude: lat, longitude: lng });
    } catch (_) {}
  };

  const handleEnableGps = () => {
    initGpsTracking();
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col pb-20 font-sans">
      {/* Mobile Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-3 sticky top-0 z-40 backdrop-blur-md flex items-center justify-between shadow-2xs">
        <BrandLogo size="sm" />

        <div className="flex items-center gap-2">
          {gpsStatus === 'enabled' ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              GPS ON
            </span>
          ) : (
            <button
              onClick={handleEnableGps}
              className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase border border-rose-200 flex items-center gap-1 animate-pulse"
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              GPS OFF
            </button>
          )}

          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase border border-blue-100">
            {user?.engineer?.engineerId || 'FE-ENGINEER'}
          </span>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mandatory GPS Turn-On Alert Banner */}
      {gpsStatus !== 'enabled' && (
        <div className="bg-gradient-to-r from-rose-900 to-slate-900 border-b border-rose-500/40 p-3 px-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-black text-white">Location / GPS Required</div>
              <div className="text-[10px] font-semibold text-slate-300">
                Turn on GPS location to track rides & log distance reimbursement.
              </div>
            </div>
          </div>

          <button
            onClick={handleEnableGps}
            disabled={requestingGps}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${requestingGps ? 'animate-spin' : ''}`} />
            <span>{requestingGps ? 'Connecting...' : 'Turn On GPS'}</span>
          </button>
        </div>
      )}

      {/* Main Mobile Screen Viewport */}
      <main className="flex-1 p-4">{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/80 z-50 flex items-center justify-around px-2 shadow-lg">
        {user?.role === 'FIELD_ENGINEER' ? (
          <>
            <NavLink
              to="/my-tasks"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <ClipboardList className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/my-map"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Navigation className="w-5 h-5" />
              <span>Live Map</span>
            </NavLink>

            <NavLink
              to="/my-expenses"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Receipt className="w-5 h-5" />
              <span>Expenses</span>
            </NavLink>

            <NavLink
              to="/my-profile"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <ClipboardList className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/live-tracking"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Navigation className="w-5 h-5" />
              <span>Live Map</span>
            </NavLink>

            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <ClipboardList className="w-5 h-5" />
              <span>Tasks</span>
            </NavLink>

            <NavLink
              to="/expenses"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Receipt className="w-5 h-5" />
              <span>Expenses</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
};

export default MobileLayout;
