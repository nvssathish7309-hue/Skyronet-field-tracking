import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  trend?: string;
  trendType?: 'success' | 'warning' | 'info';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  trendType = 'success'
}) => {
  let iconBg = 'bg-blue-50 text-blue-600 border-blue-100/80';
  let badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100';

  if (color === 'emerald') {
    iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-100/80';
  } else if (color === 'amber') {
    iconBg = 'bg-amber-50 text-amber-600 border-amber-100/80';
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-100';
  } else if (color === 'purple') {
    iconBg = 'bg-indigo-50 text-indigo-600 border-indigo-100/80';
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-100';
  } else if (color === 'rose') {
    iconBg = 'bg-rose-50 text-rose-600 border-rose-100/80';
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-100';
  }

  if (trendType === 'warning') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-100';
  } else if (trendType === 'info') {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-100';
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</span>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconBg} shadow-2xs`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {trend && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeStyle}`}>
              <span>{trend}</span>
            </span>
          )}
        </div>
      </div>

      {subtitle && <p className="text-xs font-semibold text-slate-400 mt-3 pt-2 border-t border-slate-100">{subtitle}</p>}
    </div>
  );
};

