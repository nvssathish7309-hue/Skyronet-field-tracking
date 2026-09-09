import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Task, Trip } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  ArrowLeft,
  Navigation,
  MapPin,
  Phone,
  Play,
  Square,
  CheckCircle2,
  Camera,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Radio,
  RefreshCw,
  X
} from 'lucide-react';

export const EngineerTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emitLocation } = useSocket();

  const [task, setTask] = useState<Task | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentDist, setCurrentDist] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false);

  // Work completion form
  const [workNotes, setWorkNotes] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [submittingWork, setSubmittingWork] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    fetchTask();
  }, [id]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      if (res.data.success) {
        setTask(res.data.data);
      }

      // Check existing trip
      const resTrip = await api.get(`/trips?taskId=${id}`);
      if (resTrip.data.success && resTrip.data.data.length > 0) {
        const trip = resTrip.data.data[0];
        setActiveTrip(trip);
        if (trip.status === 'Active') {
          setIsTracking(true);
          setCurrentDist(trip.distanceKm);
          setCurrentAmount(trip.totalAmount);
          startGPSWatcher(trip._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTrip = async () => {
    setStartingTrip(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setShowGpsModal(true);
      setStartingTrip(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post('/trips/start', {
            taskId: id,
            startLatitude: pos.coords.latitude,
            startLongitude: pos.coords.longitude,
            tripType: 'One Way'
          });

          if (res.data.success) {
            const newTrip = res.data.data;
            setActiveTrip(newTrip);
            setIsTracking(true);
            setShowGpsModal(false);
            setGpsCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
            startGPSWatcher(newTrip._id);
            fetchTask();
          }
        } catch (err: any) {
          setGpsError(err.response?.data?.message || 'Failed to start trip.');
        } finally {
          setStartingTrip(false);
        }
      },
      (err) => {
        setStartingTrip(false);
        setGpsError(`Location error: ${err.message}. Please turn on location permissions.`);
        setShowGpsModal(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startGPSWatcher = (tripId: string) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;

        setGpsCoords({ lat: latitude, lng: longitude, accuracy });
        setGpsError('');

        if (user?.engineer) {
          emitLocation({
            engineerId: (user.engineer as any)._id || (user.engineer as any).id,
            taskId: id,
            tripId,
            latitude,
            longitude,
            accuracy,
            speed: speed || 0,
            heading: heading || 0
          });
        }
      },
      (err) => {
        setGpsError(`GPS Warning: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  const handleStopTrip = async () => {
    if (!activeTrip) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    try {
      const res = await api.post(`/trips/${activeTrip._id}/stop`, {
        endLatitude: gpsCoords?.lat,
        endLongitude: gpsCoords?.lng
      });

      if (res.data.success) {
        setIsTracking(false);
        setActiveTrip(res.data.data.trip);
        fetchTask();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error stopping trip');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.put(`/tasks/${id}/status`, { status: newStatus });
      fetchTask();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWork(true);

    try {
      await api.put(`/tasks/${id}/status`, {
        status: 'Completed',
        workNotes,
        materialsUsed
      });

      if (photos && photos.length > 0) {
        const formData = new FormData();
        Array.from(photos).forEach((file) => {
          formData.append('photos', file);
        });
        await api.post(`/tasks/${id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      fetchTask();
    } catch (err: any) {
      alert('Error submitting work completion report');
    } finally {
      setSubmittingWork(false);
    }
  };

  if (!task) return null;

  return (
    <div className="space-y-4 max-w-md mx-auto font-sans">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <StatusBadge status={task.status} />
      </div>

      {/* Task Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
        <span className="font-mono text-xs font-bold text-sky-400">{task.taskId}</span>
        <h1 className="text-base font-black text-slate-100">{task.title}</h1>
        <div className="text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{task.locationName} ({task.address})</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Customer: {task.customerName} ({task.customerPhone})</span>
          </div>
        </div>
      </div>

      {/* GPS LIVE TRACKING CARD */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 border border-sky-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isTracking ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="font-black text-xs text-slate-100 tracking-wider">LIVE GPS TRACKING</span>
          </div>
          <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${
            isTracking ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            {isTracking ? 'TRACKING ACTIVE' : 'LOCATION REQUIRED'}
          </span>
        </div>

        {gpsError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{gpsError}</span>
            </div>
            <button
              onClick={() => setShowGpsModal(true)}
              className="text-[10px] font-extrabold text-amber-300 underline shrink-0"
            >
              Turn On GPS
            </button>
          </div>
        )}

        {/* Live Mileage Counter Display */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800">
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

        {/* Trip Action Button */}
        {!isTracking ? (
          <button
            onClick={handleStartTrip}
            disabled={startingTrip}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{startingTrip ? 'Acquiring GPS Signal...' : 'START TRIP & BEGIN GPS TRACKING'}</span>
          </button>
        ) : (
          <button
            onClick={handleStopTrip}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 animate-pulse"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>STOP TRIP & SUBMIT REIMBURSEMENT</span>
          </button>
        )}
      </div>

      {/* Task Status Progress Buttons */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
        <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Field Status Progress</h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleUpdateStatus('Arrived')}
            disabled={task.status === 'Arrived' || task.status === 'Completed'}
            className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 font-bold text-xs rounded-xl text-slate-100"
          >
            Mark Arrived
          </button>
          <button
            onClick={() => handleUpdateStatus('In Progress')}
            disabled={task.status === 'In Progress' || task.status === 'Completed'}
            className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 font-bold text-xs rounded-xl text-white"
          >
            Start Work
          </button>
        </div>
      </div>

      {/* Task Completion Form */}
      {task.status !== 'Completed' && (
        <form onSubmit={handleCompleteTask} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
          <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Complete Work & Upload Site Photos</span>
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Work Notes / Resolution</label>
            <textarea
              required
              rows={2}
              placeholder="Described work done at site..."
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Materials Used (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 50m Fiber Drop Cable, ONU Coupler"
              value={materialsUsed}
              onChange={(e) => setMaterialsUsed(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Upload Site Photos</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPhotos(e.target.files)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submittingWork}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs rounded-xl text-white shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submittingWork ? 'Submitting...' : 'Mark Task Fully Completed'}</span>
          </button>
        </form>
      )}

      {/* Mandatory Turn On GPS Location Modal */}
      {showGpsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Location / GPS Required</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Field Engine tracking policy</p>
                </div>
              </div>
              <button onClick={() => setShowGpsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-semibold space-y-1.5">
              <p>
                To start your trip and log travel reimbursement, your device&apos;s GPS location must be turned on.
              </p>
              <p className="text-[11px] text-rose-700 font-bold">
                Please grant location permissions in your browser or device settings when prompted.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleStartTrip}
                disabled={startingTrip}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${startingTrip ? 'animate-spin' : ''}`} />
                <span>{startingTrip ? 'Acquiring GPS Signal...' : 'Turn On Location & Start Ride'}</span>
              </button>
              <button
                onClick={() => setShowGpsModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineerTaskDetailPage;
