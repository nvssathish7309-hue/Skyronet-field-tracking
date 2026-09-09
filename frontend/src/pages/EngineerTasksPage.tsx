import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Task } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ClipboardList, MapPin, Phone, ArrowRight, CheckCircle2, Navigation, Play, Radio } from 'lucide-react';

export const EngineerTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const res = await api.get('/tasks');
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeTask = tasks.find((t) => ['Assigned', 'Accepted', 'On The Way', 'Arrived', 'In Progress'].includes(t.status));

  return (
    <div className="space-y-4 font-sans max-w-md mx-auto">
      {/* Active Task Banner */}
      {activeTask ? (
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 border border-blue-500/40 rounded-3xl p-5 shadow-2xl text-white space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Task Assigned</span>
            <StatusBadge status={activeTask.status} />
          </div>

          <div>
            <span className="font-mono text-xs text-blue-300 font-bold">{activeTask.taskId}</span>
            <h2 className="text-lg font-black text-white mt-0.5">{activeTask.title}</h2>
            <div className="text-xs text-slate-300 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{activeTask.locationName}</span>
            </div>
          </div>

          <Link
            to={`/my-tasks/${activeTask._id}`}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <span>OPEN ACTIVE TASK & TRACKING</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Standby / General Travel Ride Banner */
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 border border-blue-500/30 rounded-3xl p-5 shadow-lg text-white space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">General Travel Ready</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              No Task Assigned
            </span>
          </div>

          <div>
            <h2 className="text-base font-black text-white">Start Unassigned GPS Ride</h2>
            <p className="text-xs text-slate-300 font-medium mt-1">
              You can start GPS tracking anytime from start to end location to log distance & claim reimbursement.
            </p>
          </div>

          <button
            onClick={() => navigate('/my-map')}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>OPEN LIVE MAP & START FREE RIDE</span>
          </button>
        </div>
      )}

      {/* Task Roster List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
        <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
          Assigned Tasks ({tasks.length})
        </h3>

        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-3">No tasks assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <Link
                key={t._id}
                to={`/my-tasks/${t._id}`}
                className="block bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">{t.taskId}</span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-1">{t.title}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{t.customerName} • {t.locationName}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineerTasksPage;
