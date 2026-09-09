import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Lock, Mail, ShieldAlert, ArrowRight, Radio, Sun, Moon } from 'lucide-react';

import { BrandLogo } from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);

        if (user.role === 'FIELD_ENGINEER') {
          navigate('/my-tasks');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectDemoEmail = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(''); // Password must be entered manually by the user
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 font-sans bg-white text-slate-800 overflow-hidden">

      {/* Soft Radial Ambient Blue Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Container Header */}
        <div className="text-center mb-8">
          {/* Spinning gradient border wrapper */}
          <div className="inline-flex spin-border-wrapper">
            <div className="spin-border-inner">
              <div className="inline-flex items-center justify-center bg-white px-6 py-4 rounded-2xl">
                <BrandLogo size="lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-blue-900/5 border border-slate-200/80">
          <h2 className="text-xl font-black text-slate-900 mb-6 text-center tracking-tight">Sign In to Platform</h2>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="xxxx@skyronet.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-6 active:scale-98"
            >
              <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectDemoEmail('admin@skyronet.com')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-[11px] font-extrabold text-blue-700 text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>🛡️ Admin</span>
              </button>
              <button
                type="button"
                onClick={() => selectDemoEmail('accounts@skyronet.com')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-[11px] font-extrabold text-blue-700 text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>💼 Accounts</span>
              </button>
            </div>
          </div>

          {/* Field Engineer Signup Link */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <p className="text-xs font-black text-slate-800 mb-1 flex items-center justify-center gap-1.5">
                <span>🏍️ Field Engineer Portal</span>
              </p>
              <p className="text-[11px] font-semibold text-slate-500 mb-3">
                Are you a field engineer? Register your details to receive tasks and track trips.
              </p>
              <button
                type="button"
                onClick={() => navigate('/engineer-signup')}
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all active:scale-98"
              >
                <span>Register as Field Engineer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 font-semibold">
          &copy; 2026 SKYRONET TECHNOLOGY
        </p>
      </div>
    </div>
  );
};

