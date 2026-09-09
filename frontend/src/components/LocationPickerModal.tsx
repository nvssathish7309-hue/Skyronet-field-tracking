import React, { useState, useEffect } from 'react';
import { MapPin, Search, Check, X, Loader2, Globe, Sparkles } from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: { locationName: string; address: string; latitude: number; longitude: number }) => void;
}

interface LocationItem {
  name: string;
  address: string;
  lat: number;
  lng: number;
  isLive?: boolean;
}

const POPULAR_PRESETS: LocationItem[] = [
  { name: 'Gandhipuram, Coimbatore', address: '124, 10th Street, Gandhipuram, Coimbatore - 641012', lat: 11.0183, lng: 76.9644 },
  { name: 'Avinashi Road, Coimbatore', address: 'KMCH Hospital Campus, Avinashi Road, Coimbatore - 641014', lat: 11.042, lng: 77.035 },
  { name: 'TIDEL Park, Coimbatore', address: 'ELCOT SEZ, Civil Aerodrome Post, Coimbatore - 641014', lat: 11.027, lng: 77.022 },
  { name: 'RS Puram, Coimbatore', address: '45, DB Road, RS Puram, Coimbatore - 641002', lat: 11.008, lng: 76.951 },
  { name: 'Peelamedu, Coimbatore', address: 'PSG Tech Campus, Avinashi Road, Peelamedu, Coimbatore - 641004', lat: 11.0247, lng: 76.9953 },
  { name: 'Saravanampatti, Coimbatore', address: 'IT Corridor, KCT Tech Park Road, Saravanampatti, Coimbatore - 641035', lat: 11.0797, lng: 76.9897 },
  { name: 'Singanallur, Coimbatore', address: 'Trichy Road, Singanallur Bus Terminal, Coimbatore - 641005', lat: 10.9981, lng: 77.0264 },
  { name: 'Ukkadam, Coimbatore', address: 'Ukkadam Bus Stand, Palakkad Road, Coimbatore - 641001', lat: 10.993, lng: 76.9615 },
  { name: 'Eachanari, Coimbatore', address: 'Eachanari Temple Signal, NH 209, Coimbatore - 641021', lat: 10.9167, lng: 76.9722 },
  { name: 'Brookefields Mall, Coimbatore', address: '67-71, Krishnaswamy Road, Coimbatore - 641001', lat: 11.007, lng: 76.959 },
  { name: 'Coimbatore Railway Station', address: 'State Bank Road, Gopalapuram, Coimbatore - 641018', lat: 10.9982, lng: 76.9678 },
  { name: 'Coimbatore Airport (CJB)', address: 'Civil Aerodrome Post, Peelamedu, Coimbatore - 641014', lat: 11.0299, lng: 77.0434 },
  { name: 'Tiruppur Textile Hub', address: 'PN Road, Tiruppur - 641602', lat: 11.1085, lng: 77.3411 },
  { name: 'Pollachi Industrial Estate', address: 'Palani Road, Pollachi - 642001', lat: 10.6609, lng: 77.0048 },
  { name: 'Erode Central Hub', address: 'Bhavani Main Road, Erode - 638001', lat: 11.341, lng: 77.7172 },
  { name: 'Salem New Bus Stand', address: 'Meyyanur, Salem - 636004', lat: 11.6643, lng: 78.146 },
  { name: 'Madurai Mattuthavani', address: 'KK Nagar, Madurai - 625020', lat: 9.9415, lng: 78.1561 },
  { name: 'Chennai OMR IT Corridor', address: 'Sholinganallur Junction, OMR, Chennai - 600119', lat: 12.8996, lng: 80.2279 },
  { name: 'Bangalore Electronic City', address: 'Hosur Road, Electronic City Phase 1, Bengaluru - 560100', lat: 12.8452, lng: 77.6602 }
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onSelectLocation }) => {
  const [search, setSearch] = useState('');
  const [liveSuggestions, setLiveSuggestions] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customAddr, setCustomAddr] = useState('');
  const [lat, setLat] = useState('11.0168');
  const [lng, setLng] = useState('76.9558');

  // Debounced live geocoding search via OpenStreetMap Nominatim
  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setLiveSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = search.toLowerCase().includes('india') ? search : `${search}, Tamil Nadu, India`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`,
          { headers: { 'User-Agent': 'SkyronetFieldTrack/1.0' } }
        );
        const data = await res.json();

        if (Array.isArray(data)) {
          const items: LocationItem[] = data.map((item: any) => {
            const parts = item.display_name.split(',');
            const name = parts[0]?.trim() || item.name || 'Searched Location';
            const address = parts.slice(1, 4).join(',').trim() || item.display_name;

            return {
              name,
              address: address || item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              isLive: true
            };
          });
          setLiveSuggestions(items);
        }
      } catch (err) {
        console.error('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  if (!isOpen) return null;

  // Combine preset matches + live API suggestions
  const presetMatches = POPULAR_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  // Merge and deduplicate by lat/lng or name
  const combinedSuggestionsMap = new Map<string, LocationItem>();
  presetMatches.forEach((p) => combinedSuggestionsMap.set(p.name.toLowerCase(), p));
  liveSuggestions.forEach((l) => {
    const key = l.name.toLowerCase();
    if (!combinedSuggestionsMap.has(key)) {
      combinedSuggestionsMap.set(key, l);
    }
  });

  const allSuggestions = Array.from(combinedSuggestionsMap.values());

  const handleSelect = (item: LocationItem) => {
    setCustomName(item.name);
    setCustomAddr(item.address);
    setLat(String(item.lat));
    setLng(String(item.lng));

    onSelectLocation({
      locationName: item.name,
      address: item.address,
      latitude: item.lat,
      longitude: item.lng
    });
    onClose();
  };

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
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base tracking-tight">Select Task Site Location</h2>
              <p className="text-[11px] font-semibold text-slate-500">Search any location, landmark or address in India</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search any location, area, landmark, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-3.5" />
          )}
        </div>

        {/* Suggestions List */}
        <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1">
          {allSuggestions.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              {isSearching ? 'Searching live map locations...' : 'No matching locations found. Enter details below.'}
            </div>
          ) : (
            allSuggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(item)}
                className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 group-hover:border-blue-400 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.isLive && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold text-[9px] rounded-md flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" /> Map Verified
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] font-medium mt-0.5 line-clamp-1">{item.address}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      GPS: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="text-blue-600 opacity-0 group-hover:opacity-100 font-bold text-xs shrink-0 self-center transition-opacity flex items-center gap-1">
                  <span>Select</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Custom Location Inputs */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Or Selected Location & Coordinates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Location Name (e.g. Site A)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <input
              type="text"
              placeholder="Full Site Address"
              value={customAddr}
              onChange={(e) => setCustomAddr(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <button
            onClick={handleCustomConfirm}
            disabled={!customName || !customAddr}
            className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition-all"
          >
            <Check className="w-4 h-4" /> Use Selected Location
          </button>
        </div>
      </div>
    </div>
  );
};
