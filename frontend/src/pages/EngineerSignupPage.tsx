import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Lock, Mail, User as UserIcon, Phone, Briefcase, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const EngineerSignupPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: 'Network Field Engineer',
    department: 'Field Operations',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        department: formData.department,
        password: formData.password
      });

      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        navigate('/my-tasks');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 font-sans bg-white overflow-x-hidden py-10">
      {/* Ambient Blue Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none z-0" />

      <div className="max-w-lg w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200/80 mb-3">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">Field Engineer Registration</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Register your engineer profile to receive tasks, track trips, and manage field expenses.
          </p>
        </div>

        {/* Form Box */}
        <div className="bg-white rounded-3xl p-7 shadow-xl shadow-blue-900/5 border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1 uppercase tracking-wider">
                  First Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1 uppercase tracking-wider">
                  Last Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Kumar"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1 uppercase tracking-wider">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="engineer@skyronet.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1 uppercase tracking-wider">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Designation / Role Specialty */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1 uppercase tracking-wider">
                Engineering Specialty / Designation
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                >
                  <option value="Network Field Engineer">Network Field Engineer</option>
                  <option value="Fiber Splicing & Cabling Specialist">Fiber Splicing & Cabling Specialist</option>
                  <option value="RF & Wireless Telecom Technician">RF & Wireless Telecom Technician</option>
                  <option value="Hardware Installation & Repair Specialist">Hardware Installation & Repair Specialist</option>
                  <option value="Senior On-Site Technical Engineer">Senior On-Site Technical Engineer</option>
                </select>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1 uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1 uppercase tracking-wider">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-6 active:scale-98"
            >
              <span>{submitting ? 'Registering Account...' : 'Complete Engineer Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Back to Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-semibold">
              Already have an engineer or admin account?{' '}
              <Link to="/login" className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline">
                Sign In Here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 font-semibold">
          &copy; 2026 SKYRONET TECHNOLOGY
        </p>
      </div>
    </div>
  );
};

export default EngineerSignupPage;
