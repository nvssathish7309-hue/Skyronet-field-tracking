import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Engineer } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Users,
  Bike,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  UserPlus
} from 'lucide-react';

export const EngineersPage: React.FC = () => {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editingEng, setEditingEng] = useState<Engineer | null>(null);
  const [deletingEng, setDeletingEng] = useState<Engineer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for Edit
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Form states for Add Engineer
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addEmpId, setAddEmpId] = useState('');
  const [addDepartment, setAddDepartment] = useState('Field Operations');
  const [addDesignation, setAddDesignation] = useState('Field Engineer');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const canManage = user && ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'].includes(user.role);

  useEffect(() => {
    fetchEngineers();
  }, [statusFilter]);

  const fetchEngineers = async () => {
    try {
      let url = '/engineers?';
      if (statusFilter) url += `status=${statusFilter}&`;
      const res = await api.get(url);
      if (res.data.success) {
        setEngineers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (eng: Engineer) => {
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
      alert(err.response?.data?.message || 'Failed to update engineer details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEng) return;

    setSubmittingDelete(true);
    try {
      const res = await api.delete(`/engineers/${deletingEng._id}`);
      if (res.data.success) {
        setDeletingEng(null);
        fetchEngineers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete engineer account.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleAddEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName || !addEmail || !addPassword || !addPhone) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmittingAdd(true);
    try {
      const empIdFinal = addEmpId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await api.post('/engineers', {
        firstName: addFirstName,
        lastName: addLastName,
        email: addEmail,
        phone: addPhone,
        password: addPassword,
        employeeId: empIdFinal,
        department: addDepartment,
        designation: addDesignation
      });

      if (res.data.success) {
        setShowAddModal(false);
        setAddFirstName('');
        setAddLastName('');
        setAddEmail('');
        setAddPhone('');
        setAddPassword('');
        setAddEmpId('');
        fetchEngineers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register new engineer.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const uniqueEngineersMap = new Map<string, Engineer>();
  for (const eng of engineers) {
    const key = (eng.email || eng.engineerId || `${eng.firstName}_${eng.lastName}`).toLowerCase().trim();
    if (!uniqueEngineersMap.has(key)) {
      uniqueEngineersMap.set(key, eng);
    }
  }
  const uniqueEngineers = Array.from(uniqueEngineersMap.values());

  const filtered = uniqueEngineers.filter(
    (e) =>
      e.firstName.toLowerCase().includes(search.toLowerCase()) ||
      e.lastName.toLowerCase().includes(search.toLowerCase()) ||
      e.engineerId.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Field Engineer Management</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage field engineers, edit details, assign bikes & delete redundant accounts
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Field Engineer</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, engineer ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 w-full sm:w-auto focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">All Statuses ({engineers.length})</option>
          <option value="Available">Available</option>
          <option value="On The Way">On The Way</option>
          <option value="On Task">On Task</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      {/* Engineer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((eng) => (
          <div
            key={eng._id}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                    {eng.firstName[0]}
                    {eng.lastName ? eng.lastName[0] : ''}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {eng.firstName} {eng.lastName}
                    </h3>
                    <span className="font-mono text-xs font-bold text-blue-600">{eng.engineerId}</span>
                  </div>
                </div>
                <StatusBadge status={eng.status} />
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100 font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{eng.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{eng.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bike className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">
                    Assigned Bike: {eng.assignedBike ? `${eng.assignedBike.bikeModel} (${eng.assignedBike.bikeNumber})` : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                to={`/engineers/${eng._id}`}
                className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Profile & History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {canManage && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(eng)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Edit Engineer Details"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingEng(eng)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete Engineer Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Engineer Modal */}
      {editingEng && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Edit Field Engineer Member</h2>
                <p className="text-xs text-slate-500 font-medium">Update profile details & roster status</p>
              </div>
              <button
                onClick={() => setEditingEng(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">First Name</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Roster Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="Available">Available</option>
                    <option value="On The Way">On The Way</option>
                    <option value="On Task">On Task</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEng(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Engineer Confirmation Modal */}
      {deletingEng && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900">Delete Engineer Member?</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to delete <span className="font-extrabold text-slate-800">{deletingEng.firstName} {deletingEng.lastName}</span> ({deletingEng.engineerId})?
                This will remove their user account and roster profile.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingEng(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submittingDelete}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex-1 shadow-md shadow-rose-600/25"
              >
                {submittingDelete ? 'Deleting...' : 'Delete Engineer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Engineer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Register New Field Engineer</h2>
                <p className="text-xs text-slate-500 font-medium">Create a new engineer account & roster record</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEngineer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">First Name *</label>
                  <input
                    type="text"
                    value={addFirstName}
                    onChange={(e) => setAddFirstName(e.target.value)}
                    required
                    placeholder="Sathish"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={addLastName}
                    onChange={(e) => setAddLastName(e.target.value)}
                    placeholder="N"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    required
                    placeholder="engineer@skyronet.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Password *</label>
                  <input
                    type="password"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Employee ID (Optional)</label>
                  <input
                    type="text"
                    value={addEmpId}
                    onChange={(e) => setAddEmpId(e.target.value)}
                    placeholder="EMP-1005"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25"
                >
                  {submittingAdd ? 'Creating...' : 'Register Engineer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineersPage;
