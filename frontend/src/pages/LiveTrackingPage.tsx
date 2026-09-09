import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Engineer } from '../types';
import { LiveMap } from '../components/LiveMap';
import { useSocket } from '../context/SocketContext';
import { Navigation, Radio, MapPin, RefreshCw, User, Phone, Bike, Search } from 'lucide-react';

export const LiveTrackingPage: React.FC = () => {
  const { socket } = useSocket();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [selectedEng, setSelectedEng] = useState<Engineer | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngineers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('engineer:location-update', (data: any) => {
      setEngineers((prev) =>
        prev.map((e) => {
          if (e._id === data.engineerId) {
            return {
              ...e,
              currentLatitude: data.latitude,
              currentLongitude: data.longitude,
              lastLocationUpdate: data.lastUpdated,
              status: data.status
            };
          }
          return e;
        })
      );
    });

    return () => {
      socket.off('engineer:location-update');
    };
  }, [socket]);

  const fetchEngineers = async () => {
    try {
      const res = await api.get('/engineers');
      if (res.data.success) {
        setEngineers(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedEng(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEngineers = engineers.filter(
    (e) =>
      e.firstName.toLowerCase().includes(search.toLowerCase()) ||
      e.lastName.toLowerCase().includes(search.toLowerCase()) ||
      e.engineerId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* Left Sidebar: Engineer List & Active Card */}
      <div className="w-full md:w-80 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
              <span>Active Field Roster</span>
            </h2>
            <button onClick={fetchEngineers} className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search engineer ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Engineers list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEngineers.map((eng) => {
            const isSelected = selectedEng?._id === eng._id;
            let statusColor = 'bg-emerald-500';
            if (eng.status === 'On The Way') statusColor = 'bg-sky-500';
            if (eng.status === 'On Task') statusColor = 'bg-purple-500';
            if (eng.status === 'Offline') statusColor = 'bg-slate-400';

            return (
              <div
                key={eng._id}
                onClick={() => setSelectedEng(eng)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/20' : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                      {eng.firstName[0]}
                      {eng.lastName[0]}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-800">
                        {eng.firstName} {eng.lastName}
                      </div>
                      <div className="text-[10px] font-mono text-sky-600 font-semibold">{eng.engineerId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                    <span className="text-slate-600">{eng.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Engineer Popup Card (Bottom Sidebar) */}
        {selectedEng && (
          <div className="p-4 border-t border-slate-200 bg-slate-900 text-slate-100">
            <div className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider">Live Engineer Focus</div>
            <div className="font-extrabold text-sm text-white mt-1">
              {selectedEng.firstName} {selectedEng.lastName} ({selectedEng.engineerId})
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bike:</span>
                <span className="font-semibold text-slate-200">{selectedEng.assignedBike ? selectedEng.assignedBike.bikeNumber : 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">GPS Coords:</span>
                <span className="font-mono text-[11px] text-sky-300">
                  {selectedEng.currentLatitude ? `${selectedEng.currentLatitude.toFixed(4)}, ${selectedEng.currentLongitude?.toFixed(4)}` : 'Coimbatore HQ'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Update:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedEng.lastLocationUpdate ? new Date(selectedEng.lastLocationUpdate).toLocaleTimeString() : 'Just Now'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Large Google Map Viewport */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-white relative">
        <LiveMap
          engineers={engineers}
          selectedEngineerId={selectedEng?._id}
          onSelectEngineer={(eng) => setSelectedEng(eng)}
          center={selectedEng?.currentLatitude ? { lat: selectedEng.currentLatitude, lng: selectedEng.currentLongitude! } : { lat: 11.0168, lng: 76.9558 }}
          zoom={14}
          height="100%"
        />
      </div>
    </div>
  );
};
