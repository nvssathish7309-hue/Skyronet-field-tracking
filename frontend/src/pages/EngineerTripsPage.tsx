import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Trip } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Navigation, Calendar, IndianRupee } from 'lucide-react';

export const EngineerTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get('/trips');
      if (res.data.success) setTrips(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h2 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-sky-400" />
        <span>My Travel Trip History</span>
      </h2>

      <div className="space-y-3">
        {trips.map((t) => (
          <div key={t._id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-400">{t.tripId}</span>
              <StatusBadge status={t.status} />
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
              <span className="text-slate-400">Distance Travelled:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{t.distanceKm} KM</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Reimbursement Amount:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">₹{t.totalAmount}</span>
            </div>

            <div className="text-[10px] text-slate-500 font-medium">
              Started: {new Date(t.startTime).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
