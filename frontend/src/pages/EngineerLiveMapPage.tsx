import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Task, Trip, Engineer } from '../types';
import { LiveMap } from '../components/LiveMap';
import { StatusBadge } from '../components/StatusBadge';
import { Navigation, MapPin, Radio, Compass, RefreshCw, ExternalLink, CheckCircle2, Play, Square, Fuel } from 'lucide-react';

export const EngineerLiveMapPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [startingRide, setStartingRide] = useState(false);
  const [stoppingRide, setStoppingRide] = useState(false);

  // Live coordinates state
  const eng = user?.engineer;
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(
    eng?.currentLatitude && eng?.currentLongitude
      ? { lat: eng.currentLatitude, lng: eng.currentLongitude }
      : null
  );

  const currentLat = liveCoords?.lat || eng?.currentLatitude || 11.0168;
  const currentLng = liveCoords?.lng || eng?.currentLongitude || 76.9558;

  useEffect(() => {
    fetchData();
    autoFetchGps();
  }, []);

  // Real-time tracking loop when ride is active
  useEffect(() => {
    const active = trips.find((t) => t.status === 'Active');
    if (!active) return;

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLiveCoords({ lat: latitude, lng: longitude });
          try {
            const res = await api.post('/engineers/location', { latitude, longitude });
            if (res.data?.data?.activeTrip) {
              setTrips((prev) =>
                prev.map((t) => (t._id === active._id ? { ...t, ...res.data.data.activeTrip } : t))
              );
            }
          } catch (_) {}
        },
        (err) => console.warn('GPS watch error:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }

    const interval = setInterval(async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const res = await api.post('/engineers/location', {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              });
              if (res.data?.data?.activeTrip) {
                setTrips((prev) =>
                  prev.map((t) => (t._id === active._id ? { ...t, ...res.data.data.activeTrip } : t))
                );
              }
            } catch (_) {}
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }
    }, 5000);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [trips]);

  const autoFetchGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLiveCoords({ lat: latitude, lng: longitude });
          try {
            await api.post('/engineers/location', { latitude, longitude });
          } catch (_) {}
        },
        (err) => {
          console.warn('GPS position error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
  };

  const fetchData = async () => {
    try {
      const [tasksRes, tripsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/trips')
      ]);
      if (tasksRes.data.success) setTasks(tasksRes.data.data);
      if (tripsRes.data.success) setTrips(tripsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLiveCoords({ lat: latitude, lng: longitude });
          await api.post('/engineers/location', { latitude, longitude });
          await fetchData();
        } catch (err) {
          console.error(err);
        } finally {
          setUpdatingLocation(false);
        }
      },
      (err) => {
        console.error(err);
        setUpdatingLocation(false);
        alert('Could not fetch GPS location. Please allow location permissions in your browser/device settings.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStartFreeRide = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on your browser.');
      return;
    }

    setStartingRide(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post('/trips/start', {
            startLatitude: pos.coords.latitude,
            startLongitude: pos.coords.longitude,
            tripType: 'One Way'
          });
          if (res.data.success) {
            await fetchData();
          }
        } catch (err: any) {
          alert(err.response?.data?.message || 'Failed to start GPS ride.');
        } finally {
          setStartingRide(false);
        }
      },
      (err) => {
        setStartingRide(false);
        alert(`Location Error: ${err.message}. Please turn on location permissions.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStopFreeRide = async () => {
    const active = trips.find((t) => t.status === 'Active');
    if (!active) return;

    setStoppingRide(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post(`/trips/${active._id}/stop`, {
            endLatitude: pos.coords.latitude,
            endLongitude: pos.coords.longitude
          });
          if (res.data.success) {
            await fetchData();
          }
        } catch (err: any) {
          alert(err.response?.data?.message || 'Failed to stop ride.');
        } finally {
          setStoppingRide(false);
        }
      },
      async () => {
        // Fallback without coordinates
        try {
          await api.post(`/trips/${active._id}/stop`, {});
          await fetchData();
        } catch (err) {
          console.error(err);
        } finally {
          setStoppingRide(false);
        }
      }
    );
  };

  const activeTask = tasks.find((t) => ['Assigned', 'Accepted', 'On The Way', 'Arrived', 'In Progress'].includes(t.status));
  const activeTrip = trips.find((t) => t.status === 'Active');

  const currentEngineerObj: Engineer[] = eng
    ? [
        {
          _id: eng._id || 'eng_curr',
          engineerId: eng.engineerId || 'FE-ENGINEER',
          userId: eng.userId || user?.id || 'usr_curr',
          firstName: eng.firstName || user?.name || 'Engineer',
          lastName: eng.lastName || '',
          email: eng.email || user?.email || '',
          phone: eng.phone || user?.phone || '',
          employeeId: eng.employeeId || 'EMP-1001',
          department: eng.department || 'Field Operations',
          designation: eng.designation || 'Field Engineer',
          status: eng.status || 'Available',
          currentLatitude: currentLat,
          currentLongitude: currentLng,
          joiningDate: eng.joiningDate || new Date().toISOString()
        }
      ]
    : [];

  return (
    <div className="space-y-4 max-w-md mx-auto font-sans">
      {/* GPS Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-500/30 rounded-3xl p-4 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeTrip ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'}`} />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                {activeTrip ? 'RIDE IN PROGRESS' : 'GPS READY'}
              </span>
            </div>
            <h1 className="text-sm font-black text-white mt-0.5">Real-time Location Map</h1>
          </div>
        </div>

        <button
          onClick={updateLocation}
          disabled={updatingLocation}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0"
          title="Refresh GPS position"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${updatingLocation ? 'animate-spin' : ''}`} />
          <span>Sync GPS</span>
        </button>
      </div>

      {/* Start / Stop GPS Ride Controls (With or Without Task) */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border border-blue-500/30 rounded-3xl p-5 shadow-xl text-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">
              {activeTrip ? (activeTrip.taskId ? 'Task Trip Active' : 'General Travel Active') : 'Unassigned GPS Travel'}
            </span>
            <h2 className="text-sm font-black text-white mt-0.5">
              {activeTrip ? `Trip ${activeTrip.tripId}` : 'Start Travel / Free Ride'}
            </h2>
          </div>

          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-mono border ${
            activeTrip ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {activeTrip ? 'TRACKING ON' : 'STANDBY'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 py-1">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">GPS Distance</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {activeTrip ? activeTrip.distanceKm : 0.0} <span className="text-xs">KM</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reimbursement</span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              ₹{activeTrip ? activeTrip.totalAmount : 0}
            </div>
          </div>
        </div>

        {!activeTrip ? (
          <button
            onClick={handleStartFreeRide}
            disabled={startingRide}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{startingRide ? 'Starting GPS Ride...' : 'START GPS TRAVEL / RIDE'}</span>
          </button>
        ) : (
          <button
            onClick={handleStopFreeRide}
            disabled={stoppingRide}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 animate-pulse"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>{stoppingRide ? 'Calculating KM...' : 'STOP RIDE & LOG KM'}</span>
          </button>
        )}
      </div>

      {/* Live Map Viewport */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col h-[320px] relative">
        <LiveMap
          engineers={currentEngineerObj}
          center={{ lat: currentLat, lng: currentLng }}
          zoom={14}
          destination={
            activeTask && activeTask.latitude && activeTask.longitude
              ? { lat: activeTask.latitude, lng: activeTask.longitude, title: activeTask.title }
              : undefined
          }
          height="100%"
        />
      </div>

      {/* Active Task Info if any */}
      {activeTask && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Assigned Destination</span>
            <StatusBadge status={activeTask.status} />
          </div>

          <div>
            <span className="font-mono text-xs font-bold text-blue-600">{activeTask.taskId}</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{activeTask.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{activeTask.locationName}</span>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activeTask.latitude || currentLat},${activeTask.longitude || currentLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Compass className="w-4 h-4" />
            <span>Open Google Maps Turn-by-Turn Navigation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Recent Trips Log */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-blue-600" />
          <span>My Recent Trip Logs ({trips.length})</span>
        </h3>

        {trips.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">No trips recorded today.</p>
        ) : (
          <div className="space-y-2.5">
            {trips.slice(0, 4).map((t) => (
              <div key={t._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 text-[11px]">{t.tripId}</span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                      {t.taskId ? 'Task Trip' : 'General Travel'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-700 text-xs">{t.distanceKm} KM</span>
                  <div className="text-[10px] font-extrabold text-amber-700">₹{t.totalAmount}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineerLiveMapPage;
