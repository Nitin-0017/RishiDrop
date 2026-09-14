import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api/analytics.api';
import { OverviewMetrics, DetailedAnalytics, ForecastData } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Sparkles,
  BarChart3,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  unit?: string;
}

const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Determine title: label from XAxis, or payload item name for pie charts
  const rawTitle = label !== undefined && label !== null && label !== ''
    ? String(label)
    : (payload[0]?.payload?.name ?? payload[0]?.name);

  return (
    <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 shadow-lg shadow-slate-900/5 border border-[#FBEAEC] ring-1 ring-[#A6192E]/10 min-w-[170px] max-w-[260px] pointer-events-none animate-tooltip">
      {rawTitle && (
        <div className="text-[13px] font-semibold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
          <span className="truncate">{rawTitle}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry: any, idx: number) => {
          // If in pie chart, show "Parcels" or entry.name
          const entryName = (label === undefined || label === null || label === '') && entry.payload?.name
            ? 'Parcels'
            : (entry.name || entry.dataKey);

          const isReceived =
            String(entryName).toLowerCase().includes('received') ||
            String(entryName).toLowerCase().includes('arrived') ||
            entry.dataKey === 'total' ||
            entry.dataKey === 'count';
          const isCollected =
            String(entryName).toLowerCase().includes('collected') ||
            String(entryName).toLowerCase().includes('handed over') ||
            entry.dataKey === 'collected';

          const dotColor = entry.color || entry.payload?.color || (isCollected ? '#16865B' : '#A6192E');
          const valueColor = isCollected ? 'text-[#16865B]' : isReceived ? 'text-[#A6192E]' : 'text-slate-900';

          return (
            <div key={`tooltip-${idx}`} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center space-x-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="text-slate-500 font-medium text-xs truncate">
                  {entryName}
                </span>
              </div>
              <span className={`font-bold text-xs shrink-0 ${valueColor}`}>
                {entry.value?.toLocaleString()}{unit ? ` ${unit}` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdminAnalyticsPage: React.FC = () => {
  const [detailed, setDetailed] = useState<DetailedAnalytics | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [dRes, fRes] = await Promise.all([
        analyticsApi.getDetailed(),
        analyticsApi.getForecast(),
      ]);
      setDetailed(dRes.data);
      setForecast(fRes.data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Computing Real-Time PostgreSQL Analytics & AI Forecast..." />;
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Operational Analytics & AI Forecast
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Time-series parcel trends, peak arrival windows, courier distribution, and predictive intelligence.
            </p>
          </div>
        </div>
      </div>

      {/* AI PREDICTIVE INTELLIGENCE CARD (Rishihood Deep Crimson Brand Theme) */}
      {forecast && (
        <div className="bg-gradient-to-br from-[#881324] via-[#7B1120] to-[#670D1B] rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-[#A6192E]/60 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#A6192E]/40">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-[#FFE4E8] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#FDE047]" />
                <span>AI Logistics Forecasting Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight text-white">
                Predictive Outlook for Tomorrow ({forecast.targetDayName}, {forecast.targetDate})
              </h2>
              <p className="text-xs text-[#FCE7E7] mt-0.5 max-w-2xl font-normal leading-relaxed">
                Computed via weighted moving average regression across {forecast.historicalBaseline.daysAnalyzed} days of university parcel logs.
              </p>
            </div>

            <div className="bg-[#500812] px-3.5 py-1.5 rounded-xl border border-[#8F1628] text-xs font-bold text-emerald-300 shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{forecast.predictions.confidenceScore}% Model Confidence</span>
            </div>
          </div>

          {/* 4 Forecast KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#670D1A] p-4 rounded-2xl border border-[#9E1B2E]">
              <span className="text-[11px] text-[#FECDD3] font-bold uppercase tracking-wider">Expected Volume</span>
              <div className="text-2xl font-black text-white mt-1">
                {forecast.predictions.expectedTotalDeliveries} <span className="text-sm font-normal text-[#FECDD3]">parcels</span>
              </div>
              <div className="text-[11px] text-[#FCE7E7] mt-1">
                Regular courier intake
              </div>
            </div>

            <div className="bg-[#670D1A] p-4 rounded-2xl border border-[#9E1B2E]">
              <span className="text-[11px] text-[#FECDD3] font-bold uppercase tracking-wider">Peak Arrival Window</span>
              <div className="text-2xl font-black text-[#FDE047] mt-1">
                {forecast.predictions.peakWindow.period}
              </div>
              <div className="text-[11px] text-[#FCE7E7] mt-1">
                ~{forecast.predictions.peakWindow.expectedVolume} parcels in 2 hours
              </div>
            </div>

            <div className="bg-[#670D1A] p-4 rounded-2xl border border-[#9E1B2E]">
              <span className="text-[11px] text-[#FECDD3] font-bold uppercase tracking-wider">Expected Storage Util.</span>
              <div className="text-2xl font-black text-white mt-1">
                {forecast.predictions.storageForecast.expectedOccupancyRate}%
              </div>
              <div className="text-[11px] text-[#FCE7E7] mt-1">
                Risk: <strong className="text-emerald-300">{forecast.predictions.storageForecast.overflowRisk}</strong>
              </div>
            </div>

            <div className="bg-[#670D1A] p-4 rounded-2xl border border-[#9E1B2E]">
              <span className="text-[11px] text-[#FECDD3] font-bold uppercase tracking-wider">Historical Baseline</span>
              <div className="text-2xl font-black text-white mt-1">
                {forecast.historicalBaseline.averageDailyVolume} <span className="text-sm font-normal text-[#FECDD3]">daily avg</span>
              </div>
              <div className="text-[11px] text-[#FCE7E7] mt-1">
                Trend Slope: {forecast.historicalBaseline.recentTrendSlope > 0 ? '+' : ''}{forecast.historicalBaseline.recentTrendSlope}
              </div>
            </div>
          </div>

          {/* Actionable Recommendations List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#FFE4E8] uppercase tracking-wider flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-[#FDE047]" />
              <span>Actionable Operational Recommendations</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {forecast.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-[#670D1A] p-4 rounded-2xl border border-[#9E1B2E] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{rec.title}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      rec.priority === 'HIGH' ? 'bg-[#500812] text-rose-200 border border-rose-400/40' : 'bg-[#500812] text-amber-200 border border-amber-400/40'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <p className="text-[11px] text-[#FCE7E7] leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="text-[11px] text-emerald-300 font-semibold pt-1 flex items-center space-x-1.5">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{rec.actionableStep}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CHART SECTION: 14-Day Delivery Volume Trends */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              14-Day Parcel Volume Trends
            </h3>
            <p className="text-xs text-slate-500">Daily courier arrivals and completed student handovers</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={detailed?.dailyTrends || []}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A6192E" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#A6192E" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16865B" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#16865B" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EC" />
              <XAxis dataKey="date" stroke="#667085" fontSize={11} />
              <YAxis stroke="#667085" fontSize={11} />
              <Tooltip
                content={<CustomChartTooltip />}
                cursor={{ stroke: '#A6192E', strokeWidth: 1, strokeDasharray: '3 3' }}
                wrapperStyle={{ outline: 'none', zIndex: 50 }}
              />
              <Legend />
              <Area type="monotone" dataKey="total" name="Parcels Received" stroke="#A6192E" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
              <Area type="monotone" dataKey="collected" name="Parcels Handed Over" stroke="#16865B" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TWO COLUMN CHARTS: Peak Hours Bar Chart + Courier Partner Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Peak Hours (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Hourly Arrival Distribution (08:00 – 22:00)
            </h3>
            <p className="text-xs text-slate-500">Hourly gate parcel intake volume</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detailed?.hourlyDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EC" />
                <XAxis dataKey="hour" stroke="#667085" fontSize={10} />
                <YAxis stroke="#667085" fontSize={10} />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ fill: 'rgba(166, 25, 46, 0.04)' }}
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                />
                <Bar dataKey="count" name="Parcels Arrived" fill="#A6192E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Partner Market Share Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Courier Partner Distribution
            </h3>
            <p className="text-xs text-slate-500">Volume share by courier company</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={detailed?.partnerDistribution || []}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {detailed?.partnerDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#A6192E'} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomChartTooltip />}
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Chips */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {detailed?.partnerDistribution.slice(0, 8).map((p) => (
              <div key={p.slug} className="flex items-center space-x-1 text-[11px] font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name}: {p.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
