import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Engineer, Task } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LiveMap } from '../components/LiveMap';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Phone, Mail, Bike, Navigation, IndianRupee, ClipboardList, Trash2, AlertTriangle, Pencil, X } from 'lucide-react';

export const EngineerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const canManage = user && ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'].includes(user.role);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/engineers/${id}`);
      if (res.data.success) {
        setEngineer(res.data.data.engineer);
        setTodayStats(res.data.data.todayStats);
        setTaskHistory(res.data.data.taskHistory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!engineer) return;
    setEditFirstName(engineer.firstName);
    setEditLastName(engineer.lastName || '');
    setEditPhone(engineer.phone || '');
    setEditDepartment(engineer.department || 'Field Operations');
    setEditDesignation(engineer.designation || 'Field Engineer');
    setEditStatus(engineer.status || 'Available');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engineer) return;
    setSubmittingEdit(true);
    try {
      const res = await api.put(`/engineers/${engineer._id}`, {
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
        department: editDepartment,
        designation: editDesignation,
        status: editStatus
      });
      if (res.data.success) {
        setShowEditModal(false);
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update engineer profile.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteEngineer = async () => {
    if (!engineer) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/engineers/${engineer._id}`);
      if (res.data.success) {
        navigate('/engineers');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete engineer account.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !engineer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 font-sans">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Engineer Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-blue-600">{engineer.engineerId}</span>
              <StatusBadge status={engineer.status} />
            </div>
            <h1 className="text-lg font-black text-slate-900 mt-0.5">
              {engineer.firstName} {engineer.lastName}
            </h1>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEdit}
              className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 font-extrabold text-xs rounded-xl border border-sky-200 flex items-center gap-1.5 transition-all shadow-2xs"
              title="Edit Engineer Profile"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Member</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-all shadow-2xs"
              title="Delete Engineer Account"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Engineer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-600" />
                <span>Edit Engineer Member</span>
              </h2>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
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
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900">Delete Engineer Account?</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to delete <span className="font-extrabold text-slate-800">{engineer.firstName} {engineer.lastName}</span> ({engineer.engineerId})?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEngineer}
                disabled={deleting}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex-1 shadow-md shadow-rose-600/25"
              >
                {deleting ? 'Deleting...' : 'Delete Engineer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Profile Cards & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Profile Information</h3>
            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Email Address:</span>
                <div className="font-semibold text-slate-800">{engineer.email}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Phone Number:</span>
                <div className="font-semibold text-slate-800">{engineer.phone}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Employee ID:</span>
                <div className="font-mono font-bold text-sky-600">{engineer.employeeId}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Bike:</span>
                <div className="font-semibold text-slate-800">
                  {engineer.assignedBike ? `${engineer.assignedBike.bikeModel} (${engineer.assignedBike.bikeNumber})` : 'Unassigned'}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Mileage & Reimbursement Stats */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-xl space-y-3">
            <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider">Today's Travel Summary</span>
            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-700">
              <div>
                <div className="text-[10px] text-slate-400">Total KM</div>
                <div className="text-xl font-black text-emerald-400 font-mono">{todayStats?.totalKm || 0} KM</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Reimbursement</div>
                <div className="text-xl font-black text-amber-400 font-mono">₹{todayStats?.totalAmount || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Map & Task History */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm">Current GPS Position</h3>
            <LiveMap engineers={[engineer]} height="260px" />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">Recent Task History</h3>
            <div className="space-y-2">
              {taskHistory.map((t) => (
                <div key={t._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{t.title}</div>
                    <div className="text-[11px] text-slate-500">{t.locationName}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
