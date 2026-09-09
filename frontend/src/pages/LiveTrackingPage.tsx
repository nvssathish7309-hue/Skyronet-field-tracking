import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Engineer } from '../types';
import { LiveMap } from '../components/LiveMap';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Navigation, Radio, MapPin, RefreshCw, User, Phone, Bike, Search, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';

export const LiveTrackingPage: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [selectedEng, setSelectedEng] = useState<Engineer | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state for Admin/Accounts management
  const [editingEng, setEditingEng] = useState<Engineer | null>(null);
  const [deletingEng, setDeletingEng] = useState<Engineer | null>(null);

  // Form states for Edit
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const canManage = user && ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'].includes(user.role);

  useEffect(() => {
    fetchEngineers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data: any) => {
      const targetId = data.engineerId || data.userId;
      setEngineers((prev) =>
        prev.map((e) => {
          if (e._id === targetId || e.userId === targetId || (e.userId as any)?._id === targetId) {
            return {
              ...e,
              currentLatitude: data.latitude,
              currentLongitude: data.longitude,
              lastLocationUpdate: data.lastUpdated || new Date().toISOString(),
              status: data.engineer?.status || data.status || e.status
            };
          }
          return e;
        })
      );
    };

    const handleTripChanged = () => {
      fetchEngineers();
    };

    socket.on('location:update', handleLocationUpdate);
    socket.on('engineer:location-update', handleLocationUpdate);
    socket.on('trip:started', handleTripChanged);
    socket.on('trip:location-update', handleLocationUpdate);
    socket.on('trip:completed', handleTripChanged);

    return () => {
      socket.off('location:update', handleLocationUpdate);
      socket.off('engineer:location-update', handleLocationUpdate);
      socket.off('trip:started', handleTripChanged);
      socket.off('trip:location-update', handleLocationUpdate);
      socket.off('trip:completed', handleTripChanged);
    };
  }, [socket]);

  const fetchEngineers = async () => {
    try {
      const res = await api.get('/engineers');
      if (res.data.success) {
        setEngineers(res.data.data);
        if (res.data.data.length > 0 && !selectedEng) {
          setSelectedEng(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (eng: Engineer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEng(eng);
    setEditFirstName(eng.firstName);
    setEditLastName(eng.lastName || '');
    setEditPhone(eng.phone || '');
    setEditDepartment(eng.department || 'Field Operations');
    setEditDesignation(eng.designation || 'Field Engineer');
    setEditStatus(eng.status || 'Available');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEng) return;
    setSubmittingEdit(true);
    try {
      const res = await api.put(`/engineers/${editingEng._id}`, {
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
        department: editDepartment,
        designation: editDesignation,
        status: editStatus
      });
      if (res.data.success) {
        setEditingEng(null);
        fetchEngineers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update engineer');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteEngineer = async () => {
    if (!deletingEng) return;
    setSubmittingDelete(true);
    try {
      const res = await api.delete(`/engineers/${deletingEng._id}`);
      if (res.data.success) {
        if (selectedEng?._id === deletingEng._id) {
          setSelectedEng(null);
        }
        setDeletingEng(null);
        fetchEngineers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete engineer member.');
    } finally {
      setSubmittingDelete(false);
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
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                      <span className="text-slate-600">{eng.status}</span>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEdit(eng, e)}
                          className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded-lg transition-all"
                          title="Edit Member"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingEng(eng);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Engineer Popup Card (Bottom Sidebar) */}
        {selectedEng && (
          <div className="p-4 border-t border-slate-200 bg-slate-900 text-slate-100">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider">Live Engineer Focus</div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(selectedEng)}
                    className="p-1 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition-all text-xs flex items-center gap-1 px-2 font-bold"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeletingEng(selectedEng)}
                    className="p-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-all text-xs flex items-center gap-1 px-2 font-bold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
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

      {/* Edit Engineer Modal */}
      {editingEng && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-600" />
                <span>Edit Field Engineer Profile</span>
              </h2>
              <button onClick={() => setEditingEng(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Available">Available</option>
                  <option value="On Task">On Task</option>
                  <option value="On The Way">On The Way</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEng(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEng && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Delete Engineer Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-800">{deletingEng.firstName} {deletingEng.lastName}</span> ({deletingEng.engineerId})? This action removes their account permanently.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingEng(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEngineer}
                disabled={submittingDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md disabled:opacity-50"
              >
                {submittingDelete ? 'Deleting...' : 'Yes, Delete Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

