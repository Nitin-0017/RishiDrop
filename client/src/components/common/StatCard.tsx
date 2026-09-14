import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: 'red' | 'emerald' | 'amber' | 'slate' | 'indigo' | 'blue' | 'rose';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'slate',
  onClick,
}) => {
  const colorMap: Record<string, { bgIcon: string; hoverBorder: string; valueColor?: string }> = {
    red: {
      bgIcon: 'bg-rose-50 text-[#A6192E] border-rose-200/80',
      hoverBorder: 'hover:border-[#A6192E]/40',
      valueColor: 'text-slate-900',
    },
    emerald: {
      bgIcon: 'bg-emerald-50 text-[#16865B] border-emerald-200/80',
      hoverBorder: 'hover:border-emerald-400/40',
      valueColor: 'text-slate-900',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-700 border-amber-200/80',
      hoverBorder: 'hover:border-amber-400/40',
      valueColor: 'text-slate-900',
    },
    slate: {
      bgIcon: 'bg-slate-50 text-slate-700 border-slate-200/80',
      hoverBorder: 'hover:border-slate-400/40',
      valueColor: 'text-slate-900',
    },
    indigo: {
      bgIcon: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      hoverBorder: 'hover:border-indigo-400/40',
      valueColor: 'text-slate-900',
    },
    blue: {
      bgIcon: 'bg-sky-50 text-sky-700 border-sky-200/80',
      hoverBorder: 'hover:border-sky-400/40',
      valueColor: 'text-slate-900',
    },
    rose: {
      bgIcon: 'bg-rose-50 text-[#A6192E] border-rose-200/80',
      hoverBorder: 'hover:border-[#A6192E]/40',
      valueColor: 'text-slate-900',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.slate;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs transition-all duration-200 min-h-[132px] flex flex-col justify-between ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 ' + scheme.hoverBorder
          : ''
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
            {title}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 ${scheme.bgIcon}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <div className={`text-2xl sm:text-[28px] font-black tracking-tight leading-none ${scheme.valueColor || 'text-slate-900'}`}>
            {value}
          </div>
          {trend && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : 'bg-slate-100 text-slate-600 border border-slate-200/70'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="mt-2 text-[11px] text-slate-500 font-medium leading-snug">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
