import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Download, FileSpreadsheet, Calendar, Filter, BarChart2, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    try {
      let url = '/reports/travel?';
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/reports/export-csv`, '_blank');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Financial & Travel Mileage Reports</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Audit travel distance, bike usage & reimbursement payouts</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-4 items-center print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span>Date Range:</span>
        </div>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        />
        <span className="text-slate-400 text-xs font-bold">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Field Trips</span>
          <h2 className="text-2xl font-black text-slate-800 mt-1">{reportData?.totalTrips || 0} Trips</h2>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Distance (KM)</span>
          <h2 className="text-2xl font-black text-emerald-600 font-mono mt-1">{reportData?.totalKm || 0} KM</h2>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Travel Reimbursement</span>
          <h2 className="text-2xl font-black text-amber-600 font-mono mt-1">₹{reportData?.totalAmount || 0}</h2>
        </div>
      </div>

      {/* Engineer Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3">Engineer Mileage & Expense Breakdown</h3>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Engineer Code</th>
              <th className="py-3 px-4">Engineer Name</th>
              <th className="py-3 px-4">Trips Conducted</th>
              <th className="py-3 px-4">Total KM</th>
              <th className="py-3 px-4">Calculated Reimbursement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {reportData?.engineerBreakdown?.map((e: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-sky-600">{e.idCode}</td>
                <td className="py-3 px-4 font-extrabold text-slate-800">{e.name}</td>
                <td className="py-3 px-4 font-semibold text-slate-600">{e.count}</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-600">{e.km} KM</td>
                <td className="py-3 px-4 font-mono font-black text-slate-800">₹{e.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
