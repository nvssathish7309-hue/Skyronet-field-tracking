import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Engineer } from '../types';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { MapPin, Plus, ArrowLeft, Check, AlertCircle } from 'lucide-react';

export const TaskCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(11.0168);
  const [longitude, setLongitude] = useState<number>(76.9558);
  const [priority, setPriority] = useState('Medium');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:30 AM');
  const [assignedEngineer, setAssignedEngineer] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineers = async () => {
    try {
      const res = await api.get('/engineers');
      if (res.data.success) {
        setEngineers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/tasks', {
        title,
        description,
        customerName,
        customerPhone,
        locationName,
        address,
        latitude,
        longitude,
        priority,
        scheduledDate,
        scheduledTime,
        assignedEngineer: assignedEngineer || undefined
      });

      if (res.data.success) {
        navigate('/tasks');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-xl border border-slate-200">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">Create Field Work Task</h1>
          <p className="text-xs text-slate-500 font-medium">Assign site task to field network engineers</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="font-black text-sm text-blue-700 border-b border-slate-200/80 pb-2">1. Task Details</h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Fiber Cable Installation & ONU Setup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Instructions</label>
            <textarea
              required
              rows={3}
              placeholder="Detailed instructions for field engineer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          <h3 className="font-black text-sm text-blue-700 border-b border-slate-200/80 pb-2">2. Customer Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. ABC Tech Parks"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Phone Number</label>
              <input
                type="text"
                required
                placeholder="e.g. +91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Location Details with Google Maps Picker */}
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h3 className="font-black text-sm text-blue-700">3. Task Site Location</h3>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Select on Map / Presets</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location Area Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Gandhipuram, Coimbatore"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Site Address</label>
              <input
                type="text"
                required
                placeholder="e.g. 124, 10th Street, Gandhipuram, Coimbatore"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Priority, Schedule & Engineer Assignment */}
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          <h3 className="font-black text-sm text-blue-700 border-b border-slate-200/80 pb-2">4. Priority & Engineer Assignment</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Time</label>
              <input
                type="text"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="10:30 AM"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Field Engineer</label>
            <select
              value={assignedEngineer}
              onChange={(e) => setAssignedEngineer(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              <option value="">— Unassigned (Save as Pending) —</option>
              {engineers.map((eng) => (
                <option key={eng._id} value={eng._id}>
                  {eng.firstName} {eng.lastName} ({eng.engineerId}) — Status: {eng.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Check className="w-4 h-4" />
          <span>{submitting ? 'Creating Task...' : 'Confirm & Create Task'}</span>
        </button>
      </form>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => {
          setLocationName(loc.locationName);
          setAddress(loc.address);
          setLatitude(loc.latitude);
          setLongitude(loc.longitude);
        }}
      />
    </div>
  );
};
