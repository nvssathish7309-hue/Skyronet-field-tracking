import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Expense, SystemSettings } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Receipt, IndianRupee, Plus, AlertCircle, CheckCircle2, FileText, Fuel, Gauge } from 'lucide-react';

export const EngineerExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [claimForm, setClaimForm] = useState({
    expenseType: 'Fuel Reimbursement',
    amount: '',
    description: '',
    receiptPhotoUrl: ''
  });

  useEffect(() => {
    fetchExpenses();
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

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses');
      if (res.data.success) setExpenses(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const petrolPrice = settings?.petrolPricePerLiter || 110;
  const defaultMileage = settings?.defaultMileage || 55;
  const ratePerKm = settings?.twoWheelerRate || (petrolPrice / defaultMileage);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const amt = Number(claimForm.amount) || 0;
    const estDistance = claimForm.expenseType === 'Fuel Reimbursement' ? Math.round((amt / ratePerKm) * 10) / 10 : 0;

    try {
      await api.post('/expenses', {
        expenseType: claimForm.expenseType,
        calculatedAmount: amt,
        description: claimForm.description,
        distanceKm: estDistance,
        ratePerKm: ratePerKm
      });
      setShowClaimModal(false);
      setClaimForm({ expenseType: 'Fuel Reimbursement', amount: '', description: '', receiptPhotoUrl: '' });
      await fetchExpenses();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalApproved = expenses
    .filter((e) => e.status === 'Approved')
    .reduce((sum, e) => sum + (e.calculatedAmount || 0), 0);

  const totalPending = expenses
    .filter((e) => e.status === 'Pending')
    .reduce((sum, e) => sum + (e.calculatedAmount || 0), 0);

  return (
    <div className="space-y-4 max-w-md mx-auto font-sans">
      {/* Top Header & Claim Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Travel Expenses & Claims</span>
          </h1>
          <p className="text-[11px] font-semibold text-slate-500">Track fuel & travel expense reimbursements</p>
        </div>

        <button
          onClick={() => setShowClaimModal(true)}
          className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>New Claim</span>
        </button>
      </div>

      {/* Fuel Rate Information Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-500/30 rounded-3xl p-4 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black text-blue-200 uppercase tracking-wider">Official Fuel Rate</div>
            <div className="text-xs font-black text-white mt-0.5">
              Petrol @ ₹{petrolPrice}/L ÷ {defaultMileage} KM/L
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-base font-black text-amber-400">₹{ratePerKm.toFixed(2)}</span>
          <span className="text-[10px] text-blue-200 font-extrabold block">/ KM</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Total Approved</span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">₹{totalApproved}</div>
          <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Disbursed to account</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">Pending Approval</span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">₹{totalPending}</div>
          <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Under accounts review</span>
        </div>
      </div>

      {/* Expense History List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
          Expense Claims History ({expenses.length})
        </h3>

        {expenses.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">No expense claims recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((e) => (
              <div key={e._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">{e.expenseId}</span>
                  <StatusBadge status={e.status} />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Claim Type:</span>
                  <span className="font-bold text-slate-900">{e.expenseType || 'Fuel Reimbursement'}</span>
                </div>

                {e.distanceKm > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">GPS Distance:</span>
                    <span className="font-mono font-bold text-slate-800">{e.distanceKm} KM</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Claim Amount:</span>
                  <span className="font-mono font-black text-blue-700 text-sm">₹{e.calculatedAmount}</span>
                </div>

                {e.status === 'Rejected' && e.rejectionReason && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Reason: {e.rejectionReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim Expense Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span>Submit Expense Claim</span>
            </h3>

            <form onSubmit={handleSubmitClaim} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Expense Type</label>
                <select
                  value={claimForm.expenseType}
                  onChange={(e) => setClaimForm({ ...claimForm, expenseType: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                >
                  <option value="Fuel Reimbursement">Fuel Reimbursement</option>
                  <option value="Vehicle Maintenance & Repair">Vehicle Maintenance & Repair</option>
                  <option value="Toll & Parking Charges">Toll & Parking Charges</option>
                  <option value="Food & Travel Allowance">Food & Travel Allowance</option>
                  <option value="Hardware Tools & Consumables">Hardware Tools & Consumables</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Claim Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 350"
                  value={claimForm.amount}
                  onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              {claimForm.expenseType === 'Fuel Reimbursement' && claimForm.amount && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-900 flex items-center justify-between font-mono">
                  <span>Equiv. Distance (@ ₹{ratePerKm.toFixed(2)}/KM):</span>
                  <span className="text-sm font-black text-amber-700">
                    {(Number(claimForm.amount) / ratePerKm).toFixed(1)} KM
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Description / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Fuel refill for Site Visit #T-1002"
                  value={claimForm.description}
                  onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineerExpensesPage;
