import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../services/api/analytics.api';
import { storageApi } from '../../services/api/storage.api';
import { reportsApi } from '../../services/api/reports.api';
import { OverviewMetrics, StorageOverview, ForecastData } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { WhatsAppStatusBadge } from '../../components/common/WhatsAppStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Package,
  Clock,
  Box,
  ArrowRight,
  Download,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Archive,
  Sparkles,
  TrendingUp,
  Layers,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [storage, setStorage] = useState<StorageOverview | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [mRes, sRes, fRes] = await Promise.all([
        analyticsApi.getOverview(),
        storageApi.getOverview(),
        analyticsApi.getForecast(),
      ]);
      setMetrics(mRes.data);
      setStorage(sRes.data);
      setForecast(fRes.data);
    } catch (e) {
      console.error('Failed to load admin dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading Campus Logistics Command Center..." />;
  }

  const s = metrics?.summary || {
    totalDeliveries: 0,
    storedParcels: 0,
    totalPending: 0,
    collectedDeliveries: 0,
    storageUtilization: 0,
    avgPickupTimeMinutes: 0,
    unclaimed: { unclaimed24h: 0, unclaimed48h: 0, unclaimed72hPlus: 0, totalUnclaimed: 0 },
  };

  const today = metrics?.today || {
    total: 0,
    stored: 0,
    collected: 0,
    pending: 0,
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* 1. TOP HERO / OPERATIONS COMMAND HEADER (Rishihood Deep Crimson Brand Theme) */}
      <div className="relative overflow-hidden bg-[#881324] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-[#A6192E]/60">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#FDA4AF] ring-4 ring-[#FDA4AF]/30" />
              <span className="text-[#FFE4E8] font-bold tracking-widest text-[10px]">
                RISHIHOOD UNIVERSITY • CAMPUS PARCEL OPERATIONS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
              Parcel Logistics Overview
            </h1>
            <p className="text-sm text-[#FCE7E7] mt-1.5 max-w-xl font-normal leading-relaxed">
              Managing university courier intake, rack storage, and student collections across campus gates.
            </p>
          </div>

          {/* Integrated Tomorrow's Forecast Module */}
          {forecast && (
            <div className="bg-[#6B0D1B] p-5 rounded-2xl border border-[#9E1B2E] text-xs max-w-md w-full shadow-md space-y-3.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 font-bold text-[#FDE047] text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span>Tomorrow's Forecast ({forecast.targetDayName})</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#4C0812] text-[#FDE68A] border border-[#8F1628] px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0">
                  <TrendingUp className="w-3 h-3 text-[#FBBF24]" />
                  {forecast.predictions.confidenceScore}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-[#8F1628]/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FECDD3] block mb-1">
                    Expected Parcels
                  </span>
                  <div className="text-lg font-black text-[#FFFFFF] flex items-baseline gap-1.5">
                    {forecast.predictions.expectedTotalDeliveries}{' '}
                    <span className="text-xs font-normal text-[#FECDD3]">packages</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FECDD3] block mb-1">
                    Peak Arrival Window
                  </span>
                  <div className="text-lg font-black text-[#FDE047] flex items-baseline gap-1.5">
                    {forecast.predictions.peakWindow.period}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. THE 6 PRIMARY KPI METRICS (Spacious responsive grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="TOTAL PARCELS TODAY"
          value={today.total}
          subtitle="Received today"
          icon={Package}
          colorScheme="slate"
          onClick={() => navigate('/admin/deliveries')}
        />
        <StatCard
          title="STORED PARCELS"
          value={s.storedParcels}
          subtitle="Currently in racks"
          icon={Archive}
          colorScheme="red"
          onClick={() => navigate('/admin/storage')}
        />
        <StatCard
          title="AWAITING COLLECTION"
          value={s.totalPending}
          subtitle="Ready for student pickup"
          icon={Clock}
          colorScheme="amber"
          onClick={() => navigate('/admin/deliveries')}
        />
        <StatCard
          title="COLLECTED TODAY"
          value={today.collected}
          subtitle="Handed over today"
          icon={CheckCircle2}
          colorScheme="emerald"
          onClick={() => navigate('/admin/pickups')}
        />
        <StatCard
          title="STORAGE UTILIZATION"
          value={`${s.storageUtilization}%`}
          subtitle={`${storage?.summary.totalOccupied || 0}/${storage?.summary.totalCapacity || 150} slots`}
          icon={Box}
          colorScheme="slate"
          onClick={() => navigate('/admin/storage')}
        />
        <StatCard
          title="AVG COLLECTION TIME"
          value={`${s.avgPickupTimeMinutes}m`}
          subtitle="Average collection turnaround"
          icon={Activity}
          colorScheme="slate"
          onClick={() => navigate('/admin/analytics')}
        />
      </div>

      {/* 3. AGED UNCLAIMED PARCELS ALERT */}
      {s.unclaimed.totalUnclaimed > 0 && (
        <div className="bg-[#FFFBEB] border border-amber-300/80 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                {s.unclaimed.totalUnclaimed} Aged Parcels Awaiting Collection
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {s.unclaimed.unclaimed24h} parcels &gt;24h · {s.unclaimed.unclaimed48h} parcels &gt;48h ·{' '}
                <span className="font-bold text-[#A6192E]">{s.unclaimed.unclaimed72hPlus} parcels &gt;72h (Overdue)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => reportsApi.downloadUnclaimedCsv()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#A6192E] hover:bg-[#8F1628] text-white shadow-2xs transition-colors cursor-pointer"
            >
              Send Reminders →
            </button>
          </div>
        </div>
      )}

      {/* 4. TWO COLUMN OPERATIONAL GRID: Storage Racks (4 cols on XL) + Live Deliveries Feed (8 cols on XL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Storage Rack Utilization (4 cols on XL, 5 cols on LG) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight">Rack Utilization</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live storage capacity across university shelves</p>
              </div>
              <button
                onClick={() => navigate('/admin/storage')}
                className="text-xs font-bold text-[#A6192E] hover:text-[#8F1628] flex items-center space-x-1 group transition-colors cursor-pointer"
              >
                <span>Manage Racks</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="space-y-3.5 mt-4">
              {storage?.racks.map((rack) => (
                <div
                  key={rack.id}
                  className="p-4 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                      <span className="font-bold text-slate-900">{rack.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">({rack.zone})</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-mono text-slate-600 font-medium">
                        {rack.storedParcels ?? rack.stats?.occupied ?? 0} / {rack.capacity} Parcels
                      </span>
                      <span className="text-xs font-mono font-bold text-[#A6192E]">
                        {rack.utilization}%
                      </span>
                    </div>
                  </div>

                  {/* Refined Smooth Progress Bar */}
                  <div className="w-full bg-slate-200/90 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rack.utilization === 0 ? 'bg-transparent' : 'bg-[#A6192E]'
                      }`}
                      style={{ width: `${Math.max(rack.utilization, 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Total Active Racks: <strong>{storage?.racks.length || 0}</strong>
            </span>
            <span className="font-mono text-[11px]">
              Available Slots:{' '}
              <strong className="text-slate-800">
                {(storage?.summary.totalCapacity || 150) - (storage?.summary.totalOccupied || 0)}
              </strong>
            </span>
          </div>
        </div>

        {/* Right: Live Recent Deliveries Feed (8 cols on XL, 7 cols on LG) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Recent Parcels Received</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live gate intake stream logged by security guards</p>
            </div>
            <button
              onClick={() => navigate('/admin/deliveries')}
              className="text-xs font-bold text-[#A6192E] hover:text-[#8F1628] flex items-center space-x-1 group transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Parcel ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">Student</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[95px]">Partner</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[80px]">Slot</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[100px]">Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">WhatsApp</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[85px]">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recentActivity.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.parcelId || item.deliveryNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="truncate max-w-[140px]">{item.studentName}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-800 shadow-2xs">
                        {item.partner}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#A6192E] whitespace-nowrap">
                      <span className="bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-xs">
                        {item.slot}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <Badge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <WhatsAppStatusBadge
                        status={item.whatsappStatus}
                        error={item.whatsappError}
                        size="xs"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-medium">
                      {new Date(item.receivedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;

