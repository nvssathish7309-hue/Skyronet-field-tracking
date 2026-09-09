import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import { Engineer } from '../types';
import { Radio, Globe, Moon } from 'lucide-react';

interface LiveMapProps {
  engineers: Engineer[];
  selectedEngineerId?: string;
  onSelectEngineer?: (engineer: Engineer) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  routePoints?: { latitude: number; longitude: number }[];
  destination?: { lat: number; lng: number; title: string };
  height?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  engineers,
  selectedEngineerId,
  onSelectEngineer,
  center = { lat: 11.0168, lng: 76.9558 }, // Default Coimbatore HQ
  zoom = 13,
  routePoints = [],
  destination,
  height = '100%'
}) => {
  const { isLoaded, hasKey } = useGoogleMaps();

  // View modes: 'streets' | 'radar' | 'dark' (All 100% Watermark-Free)
  const [viewMode, setViewMode] = useState<'streets' | 'radar' | 'dark'>('streets');

  // Leaflet Map Refs
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletInstanceRef = useRef<L.Map | null>(null);
  const leafletMarkersRef = useRef<{ [id: string]: L.Marker }>({});
  const leafletPolylineRef = useRef<L.Polyline | null>(null);
  const leafletDestMarkerRef = useRef<L.Marker | null>(null);

  // Google Maps Refs
  const gmapContainerRef = useRef<HTMLDivElement>(null);
  const gmapInstanceRef = useRef<any>(null);

  const [selectedEng, setSelectedEng] = useState<Engineer | null>(null);

  // 100% Free, High-Definition Tile Providers with ZERO Watermarks
  const getTileConfig = (mode: 'streets' | 'dark') => {
    if (mode === 'dark') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
      };
    }
    // Esri World Street Map (Crisp HD Street view - 100% Watermark Free)
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS',
      maxZoom: 19
    };
  };

  // -------------------------------------------------------------
  // LEAFLET MAP INITIALIZATION (100% Clean Watermark-Free Engine)
  // -------------------------------------------------------------
  useEffect(() => {
    if (viewMode === 'radar') return;
    if (hasKey && isLoaded) return;
    if (!leafletContainerRef.current) return;

    const config = getTileConfig(viewMode as 'streets' | 'dark');

    if (!leafletInstanceRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: true
      });

      L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution
      }).addTo(map);

      leafletInstanceRef.current = map;
    } else {
      const map = leafletInstanceRef.current;
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });
      L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution
      }).addTo(map);
      map.setView([center.lat, center.lng], zoom);
    }
  }, [viewMode, hasKey, isLoaded, center, zoom]);

  // Update Leaflet Markers
  useEffect(() => {
    if (viewMode === 'radar') return;
    if (hasKey && isLoaded) return;
    if (!leafletInstanceRef.current) return;
    const map = leafletInstanceRef.current;

    Object.keys(leafletMarkersRef.current).forEach((id) => {
      if (!engineers.find((e) => e._id === id)) {
        leafletMarkersRef.current[id].remove();
        delete leafletMarkersRef.current[id];
      }
    });

    engineers.forEach((eng) => {
      const lat = eng.currentLatitude || center.lat;
      const lng = eng.currentLongitude || center.lng;

      let badgeBg = '#10b981'; // Green Available
      if (eng.status === 'On The Way') badgeBg = '#0284c7'; // Blue
      else if (eng.status === 'On Task') badgeBg = '#8b5cf6'; // Purple
      else if (eng.status === 'Offline') badgeBg = '#64748b'; // Gray

      const customHtmlIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            background-color: #0f172a;
            border: 2px solid ${badgeBg};
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            cursor: pointer;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: ${badgeBg};
            "></span>
            <span>${eng.firstName}</span>
            <span style="font-size: 9px; opacity: 0.7;">(${eng.engineerId})</span>
          </div>
        `,
        iconSize: [120, 30],
        iconAnchor: [60, 15]
      });

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 180px;">
          <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${eng.firstName} ${eng.lastName}</div>
          <div style="font-size: 11px; font-weight: 700; color: #0284c7; margin-bottom: 4px;">ID: ${eng.engineerId}</div>
          <div style="font-size: 12px; color: #475569;">Status: <strong style="color: ${badgeBg}">${eng.status}</strong></div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            Bike: <strong>${eng.assignedBike ? eng.assignedBike.bikeNumber : 'Unassigned'}</strong>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">
            GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `;

      if (!leafletMarkersRef.current[eng._id]) {
        const marker = L.marker([lat, lng], { icon: customHtmlIcon }).addTo(map);
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setSelectedEng(eng);
          if (onSelectEngineer) onSelectEngineer(eng);
        });
        leafletMarkersRef.current[eng._id] = marker;
      } else {
        leafletMarkersRef.current[eng._id].setLatLng([lat, lng]);
        leafletMarkersRef.current[eng._id].setIcon(customHtmlIcon);
        leafletMarkersRef.current[eng._id].setPopupContent(popupContent);
      }
    });
  }, [viewMode, hasKey, isLoaded, engineers, center]);

  // Update Route Polyline & Destination in Leaflet
  useEffect(() => {
    if (viewMode === 'radar') return;
    if (hasKey && isLoaded) return;
    if (!leafletInstanceRef.current) return;
    const map = leafletInstanceRef.current;

    if (leafletPolylineRef.current) {
      leafletPolylineRef.current.remove();
      leafletPolylineRef.current = null;
    }

    if (routePoints && routePoints.length > 1) {
      const latLngs: [number, number][] = routePoints.map((p) => [p.latitude, p.longitude]);
      leafletPolylineRef.current = L.polyline(latLngs, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(map);
    }

    if (destination) {
      if (leafletDestMarkerRef.current) leafletDestMarkerRef.current.remove();
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `
          <div style="background-color: #ef4444; color: white; padding: 4px 8px; border-radius: 12px; font-weight: bold; font-size: 11px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            📍 ${destination.title}
          </div>
        `,
        iconSize: [100, 26],
        iconAnchor: [50, 13]
      });
      leafletDestMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map);
    }
  }, [viewMode, hasKey, isLoaded, routePoints, destination]);

  // Google Maps Native Render (If Google API key active)
  useEffect(() => {
    if (!hasKey || !isLoaded || !gmapContainerRef.current) return;

    if (!gmapInstanceRef.current) {
      gmapInstanceRef.current = new (window as any).google.maps.Map(gmapContainerRef.current, {
        center,
        zoom,
        styles: [
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0f172a' }] }
        ]
      });
    } else {
      gmapInstanceRef.current.setCenter(center);
    }
  }, [hasKey, isLoaded, center, zoom]);

  // View Switcher Bar Header
  const renderViewControls = () => (
    <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 shadow-lg">
      <button
        onClick={() => setViewMode('streets')}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
          viewMode === 'streets' ? 'bg-blue-600 text-white shadow shadow-blue-500/30' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>HD Street Map</span>
      </button>
      <button
        onClick={() => setViewMode('dark')}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
          viewMode === 'dark' ? 'bg-blue-600 text-white shadow shadow-blue-500/30' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Dark Canvas</span>
      </button>
      <button
        onClick={() => setViewMode('radar')}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
          viewMode === 'radar' ? 'bg-blue-600 text-white shadow shadow-blue-500/30' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Radio className="w-3.5 h-3.5" />
        <span>Radar Tech View</span>
      </button>
    </div>
  );

  // If Google Maps API key is not present
  if (!hasKey || !isLoaded) {
    if (viewMode === 'radar') {
      return (
        <div
          className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ height }}
        >
          {/* Banner header */}
          <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-full px-4 py-1.5 text-xs text-slate-300 flex items-center gap-2.5 shadow-xl">
            <span className="pulse-green" />
            <span className="font-bold text-slate-100">Live GPS Radar Tracking</span>
            <span className="text-slate-600">•</span>
            <span className="text-sky-400 font-semibold">{engineers.length} Engineers Tracked</span>
          </div>

          {/* View Switcher Controls */}
          {renderViewControls()}

          {/* Visual Map Radar Grid */}
          <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,132,199,0.1)_0%,transparent_70%)]" />

            {/* Interactive Engineer Nodes */}
            <div className="relative w-full h-full p-8 flex flex-wrap items-center justify-around gap-8 z-10">
              {engineers.map((eng, idx) => {
                const isSelected = selectedEngineerId === eng._id || selectedEng?._id === eng._id;
                let colorBg = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
                if (eng.status === 'On The Way') colorBg = 'bg-sky-500/10 border-sky-500/50 text-sky-400';
                if (eng.status === 'On Task') colorBg = 'bg-purple-500/10 border-purple-500/50 text-purple-400';
                if (eng.status === 'Offline') colorBg = 'bg-slate-800/40 border-slate-700 text-slate-400';

                return (
                  <div
                    key={eng._id || idx}
                    onClick={() => {
                      setSelectedEng(eng);
                      if (onSelectEngineer) onSelectEngineer(eng);
                    }}
                    className={`cursor-pointer transition-all duration-300 transform hover:scale-105 p-3.5 rounded-2xl border backdrop-blur-md shadow-xl flex items-center gap-3.5 ${colorBg} ${
                      isSelected ? 'ring-2 ring-sky-400 scale-105 bg-sky-950/40' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-sm text-slate-100 shadow-inner">
                        {eng.firstName[0]}
                        {eng.lastName[0]}
                      </div>
                      {eng.status === 'On The Way' && <span className="absolute -top-1 -right-1 pulse-green" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {eng.firstName} {eng.lastName}
                        <span className="text-[10px] font-mono opacity-60">({eng.engineerId})</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                        <span>{eng.status}</span>
                        <span>•</span>
                        <span className="text-sky-400 font-mono text-[11px]">
                          {eng.currentLatitude
                            ? `${eng.currentLatitude.toFixed(3)}, ${eng.currentLongitude?.toFixed(3)}`
                            : 'Coimbatore HQ'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Engineer Info Drawer */}
          {selectedEng && (
            <div className="bg-slate-900/95 border-t border-slate-800 p-4 flex items-center justify-between backdrop-blur z-20">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  {selectedEng.firstName[0]}
                  {selectedEng.lastName[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span>{selectedEng.firstName} {selectedEng.lastName}</span>
                    <span className="text-sky-400 font-mono text-xs">({selectedEng.engineerId})</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>Bike: <strong className="text-slate-200">{selectedEng.assignedBike ? selectedEng.assignedBike.bikeNumber : 'Unassigned'}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-emerald-400">{selectedEng.status}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEng(null)}
                className="text-xs text-slate-400 hover:text-slate-100 font-bold px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700"
              >
                Dismiss Info
              </button>
            </div>
          )}
        </div>
      );
    }

    // Leaflet Tile Map Render (HD Street or Dark Canvas)
    return (
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col"
        style={{ height }}
      >
        {/* Top Controls Overlay */}
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
          <span className="pulse-green" />
          <span className="font-bold text-slate-100">
            {viewMode === 'dark' ? 'Dark Canvas Map' : 'Clean HD Street Map'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-sky-400 font-semibold">{engineers.length} Engineers Tracked</span>
        </div>

        {/* View Switcher Controls */}
        {renderViewControls()}

        {/* Leaflet Map Div */}
        <div ref={leafletContainerRef} className="w-full flex-1 z-0" />

        {/* Footer Selected Engineer Drawer */}
        {selectedEng && (
          <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3 shadow-2xl backdrop-blur flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-xs">
                {selectedEng.firstName[0]}
                {selectedEng.lastName[0]}
              </div>
              <div>
                <div className="font-extrabold text-slate-100 text-xs flex items-center gap-2">
                  <span>{selectedEng.firstName} {selectedEng.lastName}</span>
                  <span className="font-mono text-sky-400">({selectedEng.engineerId})</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Status: <strong className="text-emerald-400">{selectedEng.status}</strong></span>
                  <span>•</span>
                  <span>Bike: <strong>{selectedEng.assignedBike ? selectedEng.assignedBike.bikeNumber : 'Unassigned'}</strong></span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedEng(null)}
              className="text-xs text-slate-400 hover:text-slate-100 font-bold px-2 py-1 bg-slate-800 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  // Google Maps Native Render
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg" style={{ height }}>
      <div ref={gmapContainerRef} className="w-full h-full" />
    </div>
  );
};
