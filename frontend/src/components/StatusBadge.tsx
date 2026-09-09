import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'task' | 'engineer' | 'expense' | 'trip';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Available':
    case 'Completed':
    case 'Approved':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;
    case 'On The Way':
    case 'In Progress':
    case 'Active':
      style = 'bg-blue-50 text-blue-700 border-blue-200/80';
      break;
    case 'On Task':
    case 'Assigned':
    case 'Accepted':
      style = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      break;
    case 'Pending':
    case 'Arrived':
      style = 'bg-amber-50 text-amber-700 border-amber-200/80';
      break;
    case 'Offline':
    case 'Cancelled':
    case 'Rejected':
    case 'Leave':
      style = 'bg-rose-50 text-rose-700 border-rose-200/80';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${style}`}
    >
      {(status === 'Available' || status === 'Completed' || status === 'Approved') && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      )}
      {(status === 'On The Way' || status === 'In Progress' || status === 'Active') && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
      )}
      {(status === 'On Task' || status === 'Assigned' || status === 'Accepted') && (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
      )}
      {(status === 'Pending' || status === 'Arrived') && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      )}
      {(status === 'Offline' || status === 'Rejected' || status === 'Cancelled' || status === 'Leave') && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      )}
      {status}
    </span>
  );
};

