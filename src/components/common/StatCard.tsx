import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconTextColor = 'text-blue-600',
}) => {
  return (
    <div
      id={id}
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 break-words">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 line-clamp-2">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 pt-1 text-xs flex-wrap">
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                {trend.text}
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 ${iconBgColor} ${iconTextColor}`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
};
