import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Task, Trip } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LiveMap } from '../components/LiveMap';
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Calendar,
  Clock,
  Navigation,
  IndianRupee,
  Camera,
  CheckCircle,
  FileText
} from 'lucide-react';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      if (res.data.success) {
        setTask(res.data.data);

        // Fetch associated active trip if any
        const resTrip = await api.get(`/trips?taskId=${id}`);
        if (resTrip.data.success && resTrip.data.data.length > 0) {
          setActiveTrip(resTrip.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !task) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Task Details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-sky-600">{task.taskId}</span>
              <StatusBadge status={task.status} />
            </div>
            <h1 className="text-lg font-black text-slate-800 mt-0.5">{task.title}</h1>
          </div>
        </div>
      </div>

      {/* Grid: Task Info + Map Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task & Customer Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Customer & Site Location</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">{task.customerName}</div>
                  <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-sky-600" />
                    <span>{task.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100">
                <MapPin className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">{task.locationName}</div>
                  <div className="text-slate-500 leading-tight mt-0.5">{task.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Engineer Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Assigned Field Engineer</h3>
            {task.assignedEngineer ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-md">
                  {task.assignedEngineer.firstName[0]}
                  {task.assignedEngineer.lastName[0]}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-800">
                    {task.assignedEngineer.firstName} {task.assignedEngineer.lastName}
                  </div>
                  <div className="text-[11px] text-sky-600 font-mono font-semibold">{task.assignedEngineer.engineerId}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Status: {task.assignedEngineer.status}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600 font-medium">No engineer assigned yet</p>
            )}
          </div>

          {/* Active Trip Reimbursement Card */}
          {activeTrip && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider">Live GPS Trip Tracking</span>
                <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-bold rounded-full border border-sky-500/30">
                  {activeTrip.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-700/60">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Distance Travelled</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">{activeTrip.distanceKm} KM</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Estimated Expense</div>
                  <div className="text-lg font-black text-amber-400 font-mono">₹{activeTrip.totalAmount}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Viewport & Site Photos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm">Site Location Map</h3>
            <LiveMap
              engineers={task.assignedEngineer ? [task.assignedEngineer] : []}
              center={{ lat: task.latitude, lng: task.longitude }}
              height="300px"
            />
          </div>

          {/* Work Notes & Materials */}
          {(task.workNotes || task.materialsUsed) && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Engineer Field Work Report</span>
              </h3>
              {task.workNotes && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Work Summary:</span>
                  <p className="text-xs text-slate-700 mt-1 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{task.workNotes}</p>
                </div>
              )}
              {task.materialsUsed && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Materials Used:</span>
                  <p className="text-xs text-slate-700 mt-1 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{task.materialsUsed}</p>
                </div>
              )}
            </div>
          )}

          {/* Site Photos Gallery */}
          {task.photos && task.photos.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-600" />
                <span>Uploaded Site Photos ({task.photos.length})</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {task.photos.map((photo, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                      <span className="text-[10px] text-white font-medium">{photo.caption || 'Site Photo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
