import React, { useState } from 'react';
import { MapPin, Search, Check, X } from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: { locationName: string; address: string; latitude: number; longitude: number }) => void;
}

const PRESET_LOCATIONS = [
  { name: 'Gandhipuram, Coimbatore', address: '124, 10th Street, Gandhipuram, Coimbatore - 641012', lat: 11.0183, lng: 76.9644 },
  { name: 'Avinashi Road, Coimbatore', address: 'KMCH Hospital Campus, Avinashi Road, Coimbatore - 641014', lat: 11.042, lng: 77.035 },
  { name: 'TIDEL Park, Coimbatore', address: 'ELCOT SEZ, Civil Aerodrome Post, Coimbatore - 641014', lat: 11.027, lng: 77.022 },
  { name: 'RS Puram, Coimbatore', address: '45, DB Road, RS Puram, Coimbatore - 641002', lat: 11.008, lng: 76.951 },
  { name: 'Tiruppur Textile Park', address: 'PN Road, Tiruppur - 641602', lat: 11.1085, lng: 77.3411 },
  { name: 'Pollachi Industrial Estate', address: 'Palani Road, Pollachi - 642001', lat: 10.6609, lng: 77.0048 }
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onSelectLocation }) => {
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [customAddr, setCustomAddr] = useState('');
  const [lat, setLat] = useState('11.0168');
  const [lng, setLng] = useState('76.9558');

  if (!isOpen) return null;

  const filtered = PRESET_LOCATIONS.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleCustomConfirm = () => {
    if (!customName || !customAddr) return;
    onSelectLocation({
      locationName: customName,
      address: customAddr,
      latitude: parseFloat(lat) || 11.0168,
      longitude: parseFloat(lng) || 76.9558
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" />
            <h2 className="font-extrabold text-slate-800 text-lg">Select Task Site Location</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search location presets or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Presets List */}
        <div className="mt-4 max-h-48 overflow-y-auto space-y-2 pr-1">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectLocation({
                  locationName: item.name,
                  address: item.address,
                  latitude: item.lat,
                  longitude: item.lng
                });
                onClose();
              }}
              className="p-3 bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 rounded-xl cursor-pointer transition-all flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 text-xs">{item.name}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">{item.address}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Or Custom Location & Coordinates</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Location Name (e.g. Site A)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <input
              type="text"
              placeholder="Full Address"
              value={customAddr}
              onChange={(e) => setCustomAddr(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
          <button
            onClick={handleCustomConfirm}
            disabled={!customName || !customAddr}
            className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
          >
            <Check className="w-4 h-4" /> Use Custom Location
          </button>
        </div>
      </div>
    </div>
  );
};
