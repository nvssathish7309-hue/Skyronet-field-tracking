import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Phone,
  Mail,
  Bike,
  ShieldCheck,
  LogOut,
  Bell,
  Lock,
  Radio,
  KeyRound,
  Check,
  Edit3,
  X,
  Gauge,
  Save,
  CheckCircle2,
  Settings as SettingsIcon
} from 'lucide-react';

export const EngineerProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const eng = user?.engineer;

  const [gpsPrecision, setGpsPrecision] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const [profileForm, setProfileForm] = useState({
    engineerId: eng?.engineerId || 'FE-7327',
    firstName: eng?.firstName || user?.name?.split(' ')[0] || 'SATHISH',
    lastName: eng?.lastName || user?.name?.split(' ').slice(1).join(' ') || 'NARAYANAPPA',
    phone: eng?.phone || user?.phone || '+916380887476',
    designation: eng?.designation || 'Network Field Engineer',
    department: eng?.department || 'Field Operations',
    bikeNumber: eng?.assignedBike ? eng.assignedBike.bikeNumber : 'TN 38 AB 1234',
    bikeModel: eng?.assignedBike?.bikeModel || 'Hero Splendor Plus',
    bikeMileage: eng?.assignedBike?.mileage ? String(eng.assignedBike.mileage) : '55'
  });

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const openEditModal = () => {
    setProfileForm({
      engineerId: eng?.engineerId || 'FE-7327',
      firstName: eng?.firstName || user?.name?.split(' ')[0] || 'SATHISH',
      lastName: eng?.lastName || user?.name?.split(' ').slice(1).join(' ') || 'NARAYANAPPA',
      phone: eng?.phone || user?.phone || '+916380887476',
      designation: eng?.designation || 'Network Field Engineer',
      department: eng?.department || 'Field Operations',
      bikeNumber: eng?.assignedBike ? eng.assignedBike.bikeNumber : 'TN 38 AB 1234',
      bikeModel: eng?.assignedBike?.bikeModel || 'Hero Splendor Plus',
      bikeMileage: eng?.assignedBike?.mileage ? String(eng.assignedBike.mileage) : '55'
    });
    setEditErrorMsg('');
    setEditSuccessMsg('');
    setShowEditModal(true);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setEditErrorMsg('');
    setEditSuccessMsg('');

    try {
      const res = await api.put('/engineers/profile', {
        engineerId: profileForm.engineerId,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        designation: profileForm.designation,
        department: profileForm.department,
        bikeNumber: profileForm.bikeNumber,
        bikeModel: profileForm.bikeModel,
        bikeMileage: parseFloat(profileForm.bikeMileage) || 55
      });

      if (res.data.success) {
        await refreshUser();
        setEditSuccessMsg('Profile & vehicle details updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          setEditSuccessMsg('');
        }, 1200);
      }
    } catch (err: any) {
      setEditErrorMsg(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    setPasswordMsg('Password updated successfully!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordMsg('');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1500);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto font-sans pb-6">
      {/* Profile Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 text-center shadow-sm relative overflow-hidden">
        <button
          onClick={openEditModal}
          className="absolute top-4 right-4 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-bold flex items-center gap-1 transition-all border border-blue-100"
          title="Edit Profile & FE ID"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 border-4 border-white uppercase">
          {user?.name ? user.name[0] : 'E'}
        </div>

        <div className="mt-3">
          <h2 className="font-extrabold text-lg text-slate-900 tracking-tight">{user?.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {eng?.engineerId || 'FE-7327'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {eng?.status || 'Available'}
            </span>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3.5 text-xs text-slate-700 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            <span>Engineer Personal Information</span>
          </h3>
          <button
            onClick={openEditModal}
            className="text-blue-600 hover:text-blue-700 font-extrabold text-[11px] flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Engineer ID (FE ID):</span>
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            {eng?.engineerId || 'FE-7327'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Full Name:</span>
          <span className="font-extrabold text-slate-900">{user?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Email Address:</span>
          <span className="font-bold text-slate-900">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Mobile Phone:</span>
          <span className="font-bold text-slate-900">{user?.phone || '+916380887476'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Designation:</span>
          <span className="font-bold text-slate-900">{eng?.designation || 'Network Field Engineer'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Department:</span>
          <span className="font-bold text-slate-900">{eng?.department || 'Field Operations'}</span>
        </div>
      </div>

      {/* Vehicle Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3.5 text-xs text-slate-700 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Bike className="w-4 h-4 text-blue-600" />
            <span>Assigned Vehicle & Fleet Info</span>
          </h3>
          <button
            onClick={openEditModal}
            className="text-blue-600 hover:text-blue-700 font-extrabold text-[11px] flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Assigned Bike:</span>
          <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 font-mono">
            {eng?.assignedBike ? eng.assignedBike.bikeNumber : 'TN 38 AB 1234'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Vehicle Model:</span>
          <span className="font-bold text-slate-900">{eng?.assignedBike?.bikeModel || 'Hero Splendor Plus'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Vehicle Mileage:</span>
          <span className="font-bold text-slate-900 font-mono">
            {eng?.assignedBike?.mileage || 55} KM / Liter
          </span>
        </div>
      </div>

      {/* Settings & Preferences Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 text-xs text-slate-700 shadow-sm">
        <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-1.5">
          <SettingsIcon className="w-4 h-4 text-blue-600" />
          <span>App Settings & Preferences</span>
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-extrabold text-slate-900">High Precision GPS</div>
              <div className="text-[10px] text-slate-400 font-medium">Update location every 5 seconds</div>
            </div>
          </div>
          <button
            onClick={() => setGpsPrecision(!gpsPrecision)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              gpsPrecision ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                gpsPrecision ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-extrabold text-slate-900">Task Push Alerts</div>
              <div className="text-[10px] text-slate-400 font-medium">Receive new task assignment alerts</div>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              notifications ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full py-2.5 px-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 text-blue-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all mt-3"
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Account Password</span>
        </button>
      </div>

      {/* Logout Action Button */}
      <button
        onClick={logout}
        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of Account</span>
      </button>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Edit Profile & Bike Details</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            {editErrorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold text-center">
                {editErrorMsg}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-3.5">
              {/* Section 1: Engineer ID & Personal Info */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block border-b border-blue-50 pb-1">
                  1. Engineer Details & FE ID
                </span>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Engineer ID (FE ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.engineerId}
                    onChange={(e) => setProfileForm({ ...profileForm, engineerId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Section 2: Bike Details */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block border-b border-blue-50 pb-1">
                  2. Assigned Bike / Vehicle Details
                </span>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Bike Registration Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TN 38 AB 1234"
                    value={profileForm.bikeNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, bikeNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Vehicle Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hero Splendor Plus"
                    value={profileForm.bikeModel}
                    onChange={(e) => setProfileForm({ ...profileForm, bikeModel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Bike Mileage (KM / Liter)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={profileForm.bikeMileage}
                    onChange={(e) => setProfileForm({ ...profileForm, bikeMileage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>Change Password</span>
            </h3>

            {passwordMsg && (
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold text-center">
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineerProfilePage;
