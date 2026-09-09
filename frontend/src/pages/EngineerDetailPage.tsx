import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Engineer, Task } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LiveMap } from '../components/LiveMap';
import { ArrowLeft, User, Phone, Mail, Bike, Navigation, IndianRupee, ClipboardList } from 'lucide-react';

export const EngineerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/engineers/${id}`);
      if (res.data.success) {
        setEngineer(res.data.data.engineer);
        setTodayStats(res.data.data.todayStats);
        setTaskHistory(res.data.data.taskHistory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !engineer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Engineer Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-sky-600">{engineer.engineerId}</span>
            <StatusBadge status={engineer.status} />
          </div>
          <h1 className="text-lg font-black text-slate-800">
            {engineer.firstName} {engineer.lastName}
          </h1>
        </div>
      </div>

      {/* Grid: Profile Cards & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Profile Information</h3>
            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Email Address:</span>
                <div className="font-semibold text-slate-800">{engineer.email}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Phone Number:</span>
                <div className="font-semibold text-slate-800">{engineer.phone}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Employee ID:</span>
                <div className="font-mono font-bold text-sky-600">{engineer.employeeId}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Bike:</span>
                <div className="font-semibold text-slate-800">
                  {engineer.assignedBike ? `${engineer.assignedBike.bikeModel} (${engineer.assignedBike.bikeNumber})` : 'Unassigned'}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Mileage & Reimbursement Stats */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-xl space-y-3">
            <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider">Today's Travel Summary</span>
            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-700">
              <div>
                <div className="text-[10px] text-slate-400">Total KM</div>
                <div className="text-xl font-black text-emerald-400 font-mono">{todayStats?.totalKm || 0} KM</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Reimbursement</div>
                <div className="text-xl font-black text-amber-400 font-mono">₹{todayStats?.totalAmount || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Map & Task History */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm">Current GPS Position</h3>
            <LiveMap engineers={[engineer]} height="260px" />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Recent Task History</h3>
            <div className="space-y-2">
              {taskHistory.map((t) => (
                <div key={t._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{t.title}</div>
                    <div className="text-[11px] text-slate-500">{t.locationName}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
