import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bike, Engineer, SystemSettings } from '../types';
import { Bike as BikeIcon, Plus, Search, Check, X, Fuel, Calculator } from 'lucide-react';

export const BikesPage: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [search, setSearch] = useState('');

  // Register Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bikeNumber, setBikeNumber] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [mileage, setMileage] = useState('55');

  useEffect(() => {
    fetchBikes();
    fetchEngineers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBikes = async () => {
    try {
      const res = await api.get('/bikes');
      if (res.data.success) setBikes(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEngineers = async () => {
    try {
      const res = await api.get('/engineers');
      if (res.data.success) setEngineers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/bikes', {
        bikeNumber,
        bikeModel,
        manufacturer,
        fuelType,
        mileage: parseFloat(mileage) || 55
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setBikeNumber('');
        setBikeModel('');
        setManufacturer('');
        setMileage('55');
        fetchBikes();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error registering bike');
    }
  };

  const handleAssignBike = async (bikeId: string, engineerId: string) => {
    try {
      await api.post(`/bikes/${bikeId}/assign`, { engineerId });
      fetchBikes();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = bikes.filter(
    (b) =>
      b.bikeNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.bikeModel.toLowerCase().includes(search.toLowerCase()) ||
      b.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  const petrolPrice = settings?.petrolPricePerLiter || 110;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BikeIcon className="w-6 h-6 text-blue-600" />
            <span>Bike Fleet & Mileage Management</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Two-wheeler fleet registration, mileage specs & automated rate calculations
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all active:scale-98 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Bike</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search bike number or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((b) => {
          const bikeMileage = b.mileage || 55;
          const costPerKm = (petrolPrice / bikeMileage).toFixed(2);

          return (
            <div key={b._id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                    <BikeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{b.bikeModel}</h3>
                    <span className="font-mono text-xs font-bold text-blue-600">{b.bikeNumber}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {b.status}
                </span>
              </div>

              {/* Specs & Fuel Calculation */}
              <div className="space-y-2 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Manufacturer:</span>
                  <span className="font-bold text-slate-800">{b.manufacturer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fuel Mileage:</span>
                  <span className="font-bold text-slate-900 font-mono">{bikeMileage} KM / L</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-[11px]">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-amber-600" />
                    <span>Rate @ ₹{petrolPrice}/L:</span>
                  </span>
                  <span className="font-mono text-xs font-black text-amber-700">₹{costPerKm} / KM</span>
                </div>
              </div>

              {/* Engineer assignment dropdown */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned Field Engineer:</label>
                <select
                  value={b.engineerId ? (b.engineerId as any)._id || b.engineerId : ''}
                  onChange={(e) => handleAssignBike(b._id, e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">— Unassigned —</option>
                  {engineers.map((eng) => (
                    <option key={eng._id} value={eng._id}>
                      {eng.firstName} {eng.lastName} ({eng.engineerId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Register Two-Wheeler</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Bike Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TN 38 AB 1234"
                  value={bikeNumber}
                  onChange={(e) => setBikeNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Bike Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hero Splendor Plus"
                  value={bikeModel}
                  onChange={(e) => setBikeModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hero / Honda / TVS"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Fuel Type</label>
                  <input
                    type="text"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Mileage (KM/L)</label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Calculated per KM estimate preview */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-900 flex items-center justify-between font-mono">
                <span>Calculated Rate (@ ₹{petrolPrice}/L):</span>
                <span className="text-sm font-black text-amber-700">
                  ₹{(petrolPrice / Math.max(parseFloat(mileage) || 1, 1)).toFixed(2)} / KM
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg mt-4"
              >
                Register Bike
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BikesPage;
