import React, { useState, useEffect } from 'react';
import { MapPin, Search, Check, X, Loader2, Globe, Sparkles, Building2, Store, Home, Map as MapIcon } from 'lucide-react';

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
  category?: 'Shop / Store' | 'Company / Office' | 'Village / Area' | 'Landmark / Building' | 'Locality / Town';
  isLive?: boolean;
}

const POPULAR_PRESETS: LocationItem[] = [
  {
    name: 'M.barandhur Village, Krishnagiri',
    address: 'M.barandhur Village, Bargur Taluk, Krishnagiri District, Tamil Nadu - 635104',
    lat: 12.5442,
    lng: 78.2381,
    category: 'Village / Area'
  },
  {
    name: 'Gandhipuram Commercial Hub, Coimbatore',
    address: '124, 10th Street, Gandhipuram, Coimbatore, Tamil Nadu - 641012',
    lat: 11.0183,
    lng: 76.9644,
    category: 'Locality / Town'
  },
  {
    name: 'TIDEL Park IT Campus, Coimbatore',
    address: 'ELCOT SEZ, Civil Aerodrome Post, Coimbatore, Tamil Nadu - 641014',
    lat: 11.027,
    lng: 77.022,
    category: 'Company / Office'
  },
  {
    name: 'PSG College of Technology & Labs, Peelamedu',
    address: 'Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu - 641004',
    lat: 11.0247,
    lng: 76.9953,
    category: 'Landmark / Building'
  },
  {
    name: 'Prozone Retail & Shopping Mall, Coimbatore',
    address: 'Sathy Road, Saravanampatti, Coimbatore, Tamil Nadu - 641035',
    lat: 11.0543,
    lng: 76.9944,
    category: 'Shop / Store'
  },
  {
    name: 'TVS Motor Company Complex, Hosur',
    address: 'PB No. 4, Harita, Hosur, Krishnagiri District, Tamil Nadu - 635109',
    lat: 12.7409,
    lng: 77.8253,
    category: 'Company / Office'
  },
  {
    name: 'SIPCOT Industrial Park, Hosur',
    address: 'SIPCOT Industrial Complex, Phase II, Hosur, Tamil Nadu - 635126',
    lat: 12.7215,
    lng: 77.8541,
    category: 'Company / Office'
  },
  {
    name: 'Avinashi Road Commercial Zone, Coimbatore',
    address: 'KMCH Hospital Campus, Avinashi Road, Coimbatore - 641014',
    lat: 11.042,
    lng: 77.035,
    category: 'Locality / Town'
  },
  {
    name: 'RS Puram Shopping District, Coimbatore',
    address: '45, DB Road, RS Puram, Coimbatore, Tamil Nadu - 641002',
    lat: 11.008,
    lng: 76.951,
    category: 'Shop / Store'
  },
  {
    name: 'KCT Tech Park, Saravanampatti',
    address: 'IT Corridor, KCT Tech Park Road, Saravanampatti, Coimbatore - 641035',
    lat: 11.0797,
    lng: 76.9897,
    category: 'Company / Office'
  },
  {
    name: 'Brookefields Shopping Mall, Coimbatore',
    address: '67-71, Krishnaswamy Road, Coimbatore - 641001',
    lat: 11.007,
    lng: 76.959,
    category: 'Shop / Store'
  },
  {
    name: 'Coimbatore Railway Junction',
    address: 'State Bank Road, Gopalapuram, Coimbatore - 641018',
    lat: 10.9982,
    lng: 76.9678,
    category: 'Landmark / Building'
  },
  {
    name: 'Coimbatore International Airport (CJB)',
    address: 'Civil Aerodrome Post, Peelamedu, Coimbatore - 641014',
    lat: 11.0299,
    lng: 77.0434,
    category: 'Landmark / Building'
  },
  {
    name: 'Chennai OMR IT Corridor & Tech Parks',
    address: 'Sholinganallur Junction, OMR, Chennai, Tamil Nadu - 600119',
    lat: 12.8996,
    lng: 80.2279,
    category: 'Company / Office'
  },
  {
    name: 'Bangalore Electronic City Tech Zone',
    address: 'Hosur Road, Electronic City Phase 1, Bengaluru, Karnataka - 560100',
    lat: 12.8452,
    lng: 77.6602,
    category: 'Company / Office'
  }
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onSelectLocation }) => {
  const [search, setSearch] = useState('');
  const [liveSuggestions, setLiveSuggestions] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customAddr, setCustomAddr] = useState('');
  const [lat, setLat] = useState('11.0168');
  const [lng, setLng] = useState('76.9558');

  // Intelligent search for shops, companies, villages, and locations via OpenStreetMap Nominatim
  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setLiveSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const trimmed = search.trim();
        // Step 1: Direct search query
        let queryUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(
          trimmed
        )}`;
        let res = await fetch(queryUrl, { headers: { 'User-Agent': 'SkyronetFieldTrack/1.0' } });
        let data = await res.json();

        // Step 2: Fallback search appending India if direct query yields few results
        if ((!Array.isArray(data) || data.length === 0) && !trimmed.toLowerCase().includes('india')) {
          queryUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(
            `${trimmed}, India`
          )}`;
          res = await fetch(queryUrl, { headers: { 'User-Agent': 'SkyronetFieldTrack/1.0' } });
          data = await res.json();
        }

        if (Array.isArray(data)) {
          const items: LocationItem[] = data.map((item: any) => {
            const addr = item.address || {};

            // Extract specific shop / company / village / building name
            const specificEntity =
              item.name ||
              addr.shop ||
              addr.company ||
              addr.amenity ||
              addr.office ||
              addr.building ||
              addr.industrial ||
              addr.commercial ||
              addr.village ||
              addr.hamlet ||
              addr.suburb;

            const locality =
              addr.village ||
              addr.suburb ||
              addr.neighbourhood ||
              addr.town ||
              addr.city ||
              addr.county ||
              addr.state_district;

            const cityOrDistrict = addr.city || addr.town || addr.county || addr.state_district || addr.state;

            // Form clean title
            let cleanTitle = '';
            if (specificEntity && locality && !specificEntity.toLowerCase().includes(locality.toLowerCase())) {
              cleanTitle = `${specificEntity}, ${locality}`;
            } else if (specificEntity) {
              cleanTitle = specificEntity;
            } else {
              cleanTitle = item.display_name.split(',')[0]?.trim() || 'Searched Location';
            }

            if (cityOrDistrict && !cleanTitle.toLowerCase().includes(cityOrDistrict.toLowerCase())) {
              cleanTitle += `, ${cityOrDistrict}`;
            }

            // Determine category
            let category: LocationItem['category'] = 'Locality / Town';
            if (addr.shop || addr.commercial) category = 'Shop / Store';
            else if (addr.company || addr.office || addr.industrial) category = 'Company / Office';
            else if (addr.amenity || addr.building) category = 'Landmark / Building';
            else if (addr.village || addr.hamlet) category = 'Village / Area';

            return {
              name: cleanTitle,
              address: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              category,
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

  // Filter local preset matches
  const presetMatches = POPULAR_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  // Combine and deduplicate using JS Map
  const combinedMap = new Map<string, LocationItem>();
  presetMatches.forEach((p) => combinedMap.set(p.name.toLowerCase(), p));
  liveSuggestions.forEach((l) => {
    const key = l.name.toLowerCase();
    if (!combinedMap.has(key)) {
      combinedMap.set(key, l);
    }
  });

  const allSuggestions: LocationItem[] = Array.from(combinedMap.values());

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

  const getCategoryIcon = (category?: LocationItem['category']) => {
    switch (category) {
      case 'Shop / Store':
        return <Store className="w-3 h-3 text-emerald-600" />;
      case 'Company / Office':
        return <Building2 className="w-3 h-3 text-blue-600" />;
      case 'Village / Area':
        return <Home className="w-3 h-3 text-amber-600" />;
      case 'Landmark / Building':
        return <MapIcon className="w-3 h-3 text-purple-600" />;
      default:
        return <MapPin className="w-3 h-3 text-sky-600" />;
    }
  };

  const getCategoryBadgeStyle = (category?: LocationItem['category']) => {
    switch (category) {
      case 'Shop / Store':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Company / Office':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Village / Area':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Landmark / Building':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base tracking-tight">Select Task Site Location</h2>
              <p className="text-[11px] font-semibold text-slate-500">Search any location, village, shop, or company in India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search location, village, shop, or company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-3.5" />}
        </div>

        {/* Suggestions List */}
        <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-1">
          {allSuggestions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              {isSearching
                ? 'Searching villages, shops, companies & locations...'
                : 'No matching location found. Enter details below.'}
            </div>
          ) : (
            allSuggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(item)}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-blue-400 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-2xs">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs group-hover:text-blue-700 transition-colors flex flex-wrap items-center gap-1.5">
                      <span>{item.name}</span>

                      {item.category && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-md border flex items-center gap-1 ${getCategoryBadgeStyle(
                            item.category
                          )}`}
                        >
                          {getCategoryIcon(item.category)}
                          <span>{item.category}</span>
                        </span>
                      )}

                      {item.isLive && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold text-[9px] rounded-md flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" /> Live Map
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] font-medium mt-1 leading-snug">{item.address}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
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
            <Sparkles className="w-3 h-3 text-amber-500" /> Selected Location Details & Coordinates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Location / Company / Village Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <input
              type="text"
              placeholder="Full Address (Door No, Street, Village, Pincode)"
              value={customAddr}
              onChange={(e) => setCustomAddr(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <button
            onClick={handleCustomConfirm}
            disabled={!customName || !customAddr}
            className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" /> Use Selected Location
          </button>
        </div>
      </div>
    </div>
  );
};
