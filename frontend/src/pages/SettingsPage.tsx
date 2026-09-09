import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Settings as SettingsIcon, Save, CheckCircle2, Fuel, Gauge, Calculator, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [petrolPrice, setPetrolPrice] = useState('110');
  const [mileage, setMileage] = useState('55');
  const [rate, setRate] = useState('2.00');
  const [maxReimbursement, setMaxReimbursement] = useState('2000');
  const [minAccuracy, setMinAccuracy] = useState('50');
  const [updateInterval, setUpdateInterval] = useState('5');
  const [companyName, setCompanyName] = useState('Skyronet Networks');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update calculated rate whenever petrol price or mileage changes
  useEffect(() => {
    const p = parseFloat(petrolPrice) || 0;
    const m = parseFloat(mileage) || 1;
    if (p > 0 && m > 0) {
      const calcRate = (p / m).toFixed(2);
      setRate(calcRate);
    }
  }, [petrolPrice, mileage]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        const s = res.data.data;
        const p = s.petrolPricePerLiter || 110;
        const m = s.defaultMileage || 55;
        const r = s.twoWheelerRate || (p / m);
        setPetrolPrice(String(p));
        setMileage(String(m));
        setRate(Number(r).toFixed(2));
        setMaxReimbursement(String(s.maxReimbursementPerTrip || 2000));
        setMinAccuracy(String(s.minAccuracyMeters || 50));
        setUpdateInterval(String(s.gpsUpdateIntervalSeconds || 5));
        setCompanyName(s.companyName || 'Skyronet Networks');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const p = parseFloat(petrolPrice) || 110;
    const m = parseFloat(mileage) || 55;
    const calcRate = parseFloat((p / m).toFixed(2));

    try {
      const res = await api.put('/settings', {
        petrolPricePerLiter: p,
        defaultMileage: m,
        twoWheelerRate: calcRate,
        maxReimbursementPerTrip: parseFloat(maxReimbursement) || 2000,
        minAccuracyMeters: parseInt(minAccuracy) || 50,
        gpsUpdateIntervalSeconds: parseInt(updateInterval) || 5,
        companyName
      });

      if (res.data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const currentRateNum = parseFloat(rate) || 2.0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <span>System & Fuel Reimbursement Settings</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Real-time petrol pricing, bike mileage calculations, GPS thresholds & company parameters
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Real-time fuel rates and system parameters saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Real-time Petrol & Mileage Rate Calculator */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-sm tracking-wide flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-500" />
              <span>1. Real-Time Petrol Price & Mileage Calculator</span>
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
              Admin & Accounts Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-600" />
                <span>Real-Time Petrol Price (₹ / Liter)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={petrolPrice}
                  onChange={(e) => setPetrolPrice(e.target.value)}
                  placeholder="110"
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Current market price per liter of petrol.</p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-600" />
                <span>Default Bike Mileage (KM / Liter)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="55"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">KM/L</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Average mileage per liter for two-wheelers.</p>
            </div>
          </div>

          {/* Live Calculation Preview Banner */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-5 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-xs font-black text-blue-200 uppercase tracking-widest">Calculated Rate Result</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400 font-mono">₹{rate}</span>
                <span className="text-xs font-bold text-blue-200"> / KM</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Formula:</span>
              <span className="font-mono text-amber-300 font-bold">
                ₹{petrolPrice || '110'} ÷ {mileage || '55'} KM/L = ₹{rate} / KM
              </span>
            </div>

            {/* Mileage Breakdown Matrix */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                <div className="text-[10px] text-blue-200 font-sans">10 KM Trip</div>
                <div className="text-sm font-black text-white mt-0.5">₹{(10 * currentRateNum).toFixed(1)}</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                <div className="text-[10px] text-blue-200 font-sans">25 KM Trip</div>
                <div className="text-sm font-black text-white mt-0.5">₹{(25 * currentRateNum).toFixed(1)}</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                <div className="text-[10px] text-blue-200 font-sans">50 KM Trip</div>
                <div className="text-sm font-black text-white mt-0.5">₹{(50 * currentRateNum).toFixed(1)}</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                <div className="text-[10px] text-blue-200 font-sans">100 KM Trip</div>
                <div className="text-sm font-black text-amber-400 mt-0.5">₹{(100 * currentRateNum).toFixed(1)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Max Reimbursement Cap Per Trip (₹)</label>
              <input
                type="number"
                required
                value={maxReimbursement}
                onChange={(e) => setMaxReimbursement(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* GPS Controls */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-3">
            2. Real-Time GPS Tracking & Filtering Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Minimum GPS Accuracy Limit (Meters)</label>
              <input
                type="number"
                required
                value={minAccuracy}
                onChange={(e) => setMinAccuracy(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <p className="text-[10px] text-slate-400 mt-1">GPS points with accuracy worse than this limit are filtered out.</p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">GPS Location Ping Interval (Seconds)</label>
              <input
                type="number"
                required
                value={updateInterval}
                onChange={(e) => setUpdateInterval(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Settings...' : 'Save Real-Time Settings'}</span>
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
