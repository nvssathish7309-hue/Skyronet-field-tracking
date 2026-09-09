import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Engineer, Task } from '../types';
import { StatsCard } from '../components/StatsCard';
import { LiveMap } from '../components/LiveMap';
import { StatusBadge } from '../components/StatusBadge';
import { useSocket } from '../context/SocketContext';
import {
  Users,
  Radio,
  ClipboardList,
  CheckCircle2,
  Navigation,
  IndianRupee,
  Plus,
  ArrowRight,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Layers,
  Filter
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState<any>(null);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChartView, setActiveChartView] = useState<'area' | 'bar' | 'donut'>('area');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('engineer:location-update', () => {
      fetchDashboardData();
    });

    socket.on('task:status-updated', () => {
      fetchDashboardData();
    });

    return () => {
      socket.off('engineer:location-update');
      socket.off('task:status-updated');
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [resStats, resEng, resTasks] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/engineers'),
        api.get('/tasks?limit=5')
      ]);

      if (resStats.data.success) setStats(resStats.data.data);
      if (resEng.data.success) setEngineers(resEng.data.data);
      if (resTasks.data.success) setRecentTasks(resTasks.data.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-extrabold text-slate-500">Loading Control Center Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Operations Dashboard</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Track and manage field engineers, real-time GPS tracking, and automated travel reimbursements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/live-tracking"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2 transition-all"
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Live GPS Map</span>
          </Link>
          <Link
            to="/tasks/create"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create & Assign Task</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="ACTIVE FIELD ENGINEERS"
          value={stats?.activeEngineers || 0}
          subtitle={`Total Registered: ${stats?.totalEngineers || 0}`}
          icon={Users}
          color="blue"
          trend="+8% this month"
          trendType="success"
        />
        <StatsCard
          title="ENGINEERS ON DUTY"
          value={stats?.engineersOnTask || 0}
          subtitle="Currently on road or site"
          icon={Radio}
          color="purple"
          trend="Live Dispatch"
          trendType="info"
        />
        <StatsCard
          title="DISTANCE TRAVELLED TODAY"
          value={`${stats?.totalKmToday || 0} KM`}
          subtitle="Calculated via GPS Haversine"
          icon={Navigation}
          color="emerald"
          trend="+12% this week"
          trendType="success"
        />
        <StatsCard
          title="TRAVEL EXPENSE TODAY"
          value={`₹${stats?.totalExpenseToday || 0}`}
          subtitle="Configured Rate: ₹5 / KM"
          icon={IndianRupee}
          color="amber"
          trend="Auto Computed"
          trendType="warning"
        />
      </div>

      {/* Main Section: Live Map + Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Field Map Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Live Field Engineer Map Overview</h2>
                <p className="text-xs text-slate-500 font-semibold">Real-time GPS coordinates synced via WebSockets</p>
              </div>
              <Link
                to="/live-tracking"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100"
              >
                <span>Full Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <LiveMap engineers={engineers} height="360px" />
          </div>

          {/* Travel & Reimbursement Analytics with Chart View Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">7-Day Travel & Expense Analytics</h2>
                <p className="text-xs text-slate-500 font-semibold">Live status distribution and daily mileage pool</p>
              </div>

              {/* Segmented Chart View Selector Pill Bar */}
              <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 self-start">
                <button
                  onClick={() => setActiveChartView('area')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                    activeChartView === 'area'
                      ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Stacked View</span>
                </button>
                <button
                  onClick={() => setActiveChartView('bar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                    activeChartView === 'bar'
                      ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Bar Chart</span>
                </button>
                <button
                  onClick={() => setActiveChartView('donut')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                    activeChartView === 'donut'
                      ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PieIcon className="w-3.5 h-3.5" />
                  <span>Summary</span>
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.weeklyTrend || []}>
                  <defs>
                    <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="km"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorKm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Roster & Recent Field Tasks */}
        <div className="space-y-6">
          {/* Active Field Engineers Roster Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Engineer Roster</h3>
              <Link to="/engineers" className="text-xs font-bold text-blue-600 hover:underline">
                View All ({engineers.length})
              </Link>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {engineers.map((eng) => (
                <div
                  key={eng._id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between hover:bg-blue-50/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {eng.firstName[0]}
                      {eng.lastName[0]}
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-900">
                        {eng.firstName} {eng.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {eng.assignedBike ? eng.assignedBike.bikeNumber : 'No Bike'}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={eng.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Recent Field Tasks</h3>
              <Link to="/tasks" className="text-xs font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentTasks.map((t) => (
                <Link
                  key={t._id}
                  to={`/tasks/${t._id}`}
                  className="block p-3.5 bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/60 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-black text-blue-600">{t.taskId}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="font-black text-xs text-slate-900 mt-1.5 group-hover:text-blue-700 line-clamp-1">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-semibold">{t.locationName}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

