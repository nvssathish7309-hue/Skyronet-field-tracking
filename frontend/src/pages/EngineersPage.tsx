import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Engineer } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Search, Users, Bike, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

export const EngineersPage: React.FC = () => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngineers();
  }, [statusFilter]);

  const fetchEngineers = async () => {
    try {
      let url = '/engineers?';
      if (statusFilter) url += `status=${statusFilter}&`;
      const res = await api.get(url);
      if (res.data.success) {
        setEngineers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = engineers.filter(
    (e) =>
      e.firstName.toLowerCase().includes(search.toLowerCase()) ||
      e.lastName.toLowerCase().includes(search.toLowerCase()) ||
      e.engineerId.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Field Engineer Management</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Roster, live status, bike assignment & travel performance</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, engineer ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 w-full sm:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On The Way">On The Way</option>
          <option value="On Task">On Task</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      {/* Engineer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((eng) => (
          <div key={eng._id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-black text-sm flex items-center justify-center shadow-md">
                  {eng.firstName[0]}
                  {eng.lastName[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {eng.firstName} {eng.lastName}
                  </h3>
                  <span className="font-mono text-xs font-bold text-sky-600">{eng.engineerId}</span>
                </div>
              </div>
              <StatusBadge status={eng.status} />
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{eng.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{eng.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bike className="w-3.5 h-3.5 text-sky-600" />
                <span>Assigned Bike: {eng.assignedBike ? `${eng.assignedBike.bikeModel} (${eng.assignedBike.bikeNumber})` : 'Unassigned'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Dept: {eng.department}</span>
              <Link to={`/engineers/${eng._id}`} className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                <span>Profile & History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
