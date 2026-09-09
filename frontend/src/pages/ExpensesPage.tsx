import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Expense, SystemSettings } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Receipt, CheckCircle2, XCircle, Search, Filter, Fuel, Gauge, Edit3, Calculator } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Quick Petrol Price Edit Modal
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [newPetrolPrice, setNewPetrolPrice] = useState('110');
  const [newMileage, setNewMileage] = useState('55');
  const [updatingFuel, setUpdatingFuel] = useState(false);

  // Rejection Modal
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchSettings();
  }, [statusFilter]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.data);
        setNewPetrolPrice(String(res.data.data.petrolPricePerLiter || 110));
        setNewMileage(String(res.data.data.defaultMileage || 55));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      let url = '/expenses?';
      if (statusFilter) url += `status=${statusFilter}&`;
      const res = await api.get(url);
      if (res.data.success) setExpenses(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFuelPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingFuel(true);
    const p = parseFloat(newPetrolPrice) || 110;
    const m = parseFloat(newMileage) || 55;
    const calcRate = parseFloat((p / m).toFixed(2));

    try {
      const res = await api.put('/settings', {
        petrolPricePerLiter: p,
        defaultMileage: m,
        twoWheelerRate: calcRate
      });
      if (res.data.success) {
        setSettings(res.data.data);
        setShowFuelModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update petrol price');
    } finally {
      setUpdatingFuel(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await api.post(`/expenses/${id}/approve`, {});
      if (res.data.success) fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error approving expense');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingExpenseId || !rejectionReason) return;
    try {
      const res = await api.post(`/expenses/${rejectingExpenseId}/reject`, { rejectionReason });
      if (res.data.success) {
        setRejectingExpenseId(null);
        setRejectionReason('');
        fetchExpenses();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error rejecting expense');
    }
  };

  const filtered = expenses.filter((e) => {
    const engName = e.engineerId ? `${e.engineerId.firstName} ${e.engineerId.lastName}` : '';
    return (
      e.expenseId.toLowerCase().includes(search.toLowerCase()) ||
      engName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const petrolPrice = settings?.petrolPricePerLiter || 110;
  const mileage = settings?.defaultMileage || 55;
  const ratePerKm = settings?.twoWheelerRate || (petrolPrice / mileage);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Live Fuel Rate Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Accounts & Travel Expenses Approval</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Automated mileage reimbursement calculated based on real-time petrol price & vehicle mileage
          </p>
        </div>

        {/* Real-time Fuel Badge for Admin & Accounts */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-3.5 px-4 shadow-sm flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-blue-200 font-extrabold uppercase tracking-wider">Live Fuel Rate</div>
              <div className="text-xs font-black text-white">
                ₹{petrolPrice}/L ÷ {mileage} KM/L = <span className="text-amber-400 font-mono text-sm">₹{ratePerKm.toFixed(2)} / KM</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowFuelModal(true)}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-all shrink-0 shadow-sm"
            title="Edit Petrol Price & Mileage"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Update Price</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search expense ID or engineer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 w-full sm:w-auto outline-none"
        >
          <option value="">All Expense Statuses</option>
          <option value="Pending">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Expenses Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Expense ID</th>
                <th className="py-4 px-4">Field Engineer & Vehicle</th>
                <th className="py-4 px-4">Associated Task</th>
                <th className="py-4 px-4">GPS Distance</th>
                <th className="py-4 px-4">Rate Calculation</th>
                <th className="py-4 px-4">Total Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Accounts Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">No travel expense records found.</td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const bike = e.engineerId?.assignedBike;
                  const bikeMileage = bike?.mileage || mileage;
                  const calcRate = (petrolPrice / bikeMileage).toFixed(2);

                  return (
                    <tr key={e._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-blue-600">{e.expenseId}</td>
                      <td className="py-4 px-4">
                        {e.engineerId ? (
                          <div>
                            <div className="font-extrabold text-slate-900">
                              {e.engineerId.firstName} {e.engineerId.lastName} ({e.engineerId.engineerId})
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                              Bike: {bike ? `${bike.bikeModel} (${bike.bikeNumber}) - ${bike.mileage} KM/L` : 'Default Bike'}
                            </div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {e.taskId ? (
                          <div>
                            <div className="font-extrabold text-slate-800 line-clamp-1">{e.taskId.title}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{e.taskId.locationName}</div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono font-black text-emerald-700 text-sm">{e.distanceKm} KM</td>
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-slate-800 text-xs">₹{petrolPrice} / {bikeMileage} KM/L</div>
                        <div className="text-[10px] text-blue-600 font-extrabold">Rate: ₹{calcRate} / KM</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900 text-sm font-mono">₹{e.calculatedAmount}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{e.distanceKm} KM × ₹{calcRate}</div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        {e.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(e._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingExpenseId(e._id)}
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-extrabold text-[11px] rounded-xl border border-rose-200 flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Fuel Price & Mileage Edit Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdateFuelPrice} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm tracking-wide flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-500" />
                <span>Update Real-Time Petrol Price</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFuelModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Petrol Price (₹ / Liter)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newPetrolPrice}
                  onChange={(e) => setNewPetrolPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Default Bike Mileage (KM / Liter)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newMileage}
                  onChange={(e) => setNewMileage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              {/* Live Preview in Modal */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-900 flex items-center justify-between font-mono">
                <span>Calculated Rate:</span>
                <span className="text-sm font-black text-amber-700">
                  ₹{(parseFloat(newPetrolPrice) / Math.max(parseFloat(newMileage) || 1, 1)).toFixed(2)} / KM
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFuelModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingFuel}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                {updatingFuel ? 'Updating...' : 'Save & Apply Rate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingExpenseId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-slate-900 text-base">Reject Expense Claim</h3>
            <p className="text-xs text-slate-500 font-medium">Please provide a mandatory reason for rejecting this travel claim:</p>

            <textarea
              rows={3}
              required
              placeholder="e.g. Unrealistic route jump / inaccurate GPS logs attached."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingExpenseId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
