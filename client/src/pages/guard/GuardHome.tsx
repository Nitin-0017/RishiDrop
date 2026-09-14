import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../services/api/analytics.api';
import { storageApi } from '../../services/api/storage.api';
import { OverviewMetrics, StorageOverview } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  PackagePlus,
  QrCode,
  Box,
  Search,
  ArrowRight,
  Check,
  Package,
  Shield,
} from 'lucide-react';

export const GuardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [storage, setStorage] = useState<StorageOverview | null>(null);

  const fetchGuardHomeData = async () => {
    try {
      const [mRes, sRes] = await Promise.all([
        analyticsApi.getOverview(),
        storageApi.getOverview(),
      ]);
      setMetrics(mRes.data);
      setStorage(sRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGuardHomeData();
    const interval = setInterval(fetchGuardHomeData, 8000);
    return () => clearInterval(interval);
  }, []);

  const today = metrics?.today || { total: 0, stored: 0, collected: 0, pending: 0 };
  const totalOccupied = storage?.summary.totalOccupied || 0;
  const totalCapacity = storage?.summary.totalCapacity || 150;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : (hour < 17 ? 'Good afternoon' : 'Good evening');
  const firstName = user?.name ? user.name.split(' ')[0] : 'Rajesh';

  return (
    <div className="space-y-6 w-full">
      
      {/* 1. Page Header: Polished Admin-Style Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold shrink-0 border border-[#F5C6CB]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <span>{user?.guard?.gateNumber || 'Main Gate 1'}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 text-[#16865B] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7] text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] animate-pulse" />
                Active Shift
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. FOUR PRIMARY ACTION CARDS (Balanced 2x2 grid with Admin design language) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Action 1: Receive Parcel (Primary Rishihood Deep Crimson) */}
        <button
          onClick={() => navigate('/guard/receive')}
          className="p-6 rounded-3xl bg-gradient-to-br from-[#881324] via-[#801020] to-[#670D1B] text-white text-left shadow-xs hover:shadow-md active:scale-[0.99] transition-all flex flex-col justify-between min-h-[156px] group border border-[#A6192E]/60 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#670D1A] text-white flex items-center justify-center border border-[#9E1B2E]">
              <PackagePlus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#FFE4E8] bg-[#500812] px-3 py-1.5 rounded-xl border border-[#8F1628] group-hover:translate-x-0.5 transition-transform flex items-center space-x-1.5">
              <span>Intake</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-black tracking-tight text-white">Receive Parcel</div>
            <p className="text-xs text-[#FCE7E7] mt-1 font-normal leading-relaxed">Register and store parcel at gate</p>
          </div>
        </button>

        {/* Action 2: Handover / Scan QR (Navy Command Surface) */}
        <button
          onClick={() => navigate('/guard/pickup')}
          className="p-6 rounded-3xl bg-gradient-to-br from-[#172033] via-[#0F172A] to-[#0B132B] text-white text-left shadow-xs hover:shadow-md active:scale-[0.99] transition-all flex flex-col justify-between min-h-[156px] group border border-[#273860] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-white flex items-center justify-center border border-[#334155]">
              <QrCode className="w-6 h-6 text-[#38BDF8]" />
            </div>
            <span className="text-xs font-bold text-slate-200 bg-[#1E293B] px-3 py-1.5 rounded-xl border border-[#334155] group-hover:translate-x-0.5 transition-transform flex items-center space-x-1.5">
              <span>Verify</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-black tracking-tight text-white">Handover / Scan QR</div>
            <p className="text-xs text-slate-300 mt-1 font-normal leading-relaxed">Verify student and hand over parcel</p>
          </div>
        </button>

        {/* Action 3: Storage Racks */}
        <button
          onClick={() => navigate('/guard/storage')}
          className="p-6 rounded-3xl bg-white border border-slate-200/80 text-slate-900 text-left hover:border-[#A6192E]/40 hover:bg-[#FFF6F7]/50 active:scale-[0.99] transition-all flex flex-col justify-between min-h-[156px] group shadow-xs hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] text-slate-600 flex items-center justify-center border border-slate-200 group-hover:bg-[#FBEAEC] group-hover:text-[#A6192E] group-hover:border-[#F5C6CB] transition-colors">
              <Box className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#A6192E] bg-[#FBEAEC] px-3 py-1.5 rounded-xl border border-[#F5C6CB] group-hover:translate-x-0.5 transition-transform flex items-center space-x-1.5">
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-black tracking-tight text-slate-900">Storage / Racks</div>
            <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">Racks A, B, C ({totalOccupied}/{totalCapacity} slots filled)</p>
          </div>
        </button>

        {/* Action 4: Search Student */}
        <button
          onClick={() => navigate('/guard/search')}
          className="p-6 rounded-3xl bg-white border border-slate-200/80 text-slate-900 text-left hover:border-[#A6192E]/40 hover:bg-[#FFF6F7]/50 active:scale-[0.99] transition-all flex flex-col justify-between min-h-[156px] group shadow-xs hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] text-slate-600 flex items-center justify-center border border-slate-200 group-hover:bg-[#FBEAEC] group-hover:text-[#A6192E] group-hover:border-[#F5C6CB] transition-colors">
              <Search className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#A6192E] bg-[#FBEAEC] px-3 py-1.5 rounded-xl border border-[#F5C6CB] group-hover:translate-x-0.5 transition-transform flex items-center space-x-1.5">
              <span>Find</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-lg font-black tracking-tight text-slate-900">Search Student</div>
            <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">Find student by phone, ID or name</p>
          </div>
        </button>

      </div>

      {/* 3. COMPACT DASHBOARD KPI STRIP */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* Metric 1: Received */}
        <div className="flex items-center space-x-3.5 px-3 py-1.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FBEAEC] flex items-center justify-center shrink-0 border border-[#F5C6CB]">
            <span className="w-3 h-3 rounded-full bg-[#A6192E]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {today.total}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Received
            </div>
          </div>
        </div>

        {/* Metric 2: Stored */}
        <div className="flex items-center space-x-3.5 px-3 py-1.5 pt-4 lg:pt-1.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-200">
            <span className="w-3 h-3 rounded-full bg-[#D97706]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {today.pending}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Stored
            </div>
          </div>
        </div>

        {/* Metric 3: Racks */}
        <div className="flex items-center space-x-3.5 px-3 py-1.5 pt-4 lg:pt-1.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <span className="w-3 h-3 rounded-full bg-[#475569]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {totalOccupied}/{totalCapacity}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Racks
            </div>
          </div>
        </div>

        {/* Metric 4: Handed Over */}
        <div className="flex items-center space-x-3.5 px-3 py-1.5 pt-4 lg:pt-1.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200">
            <span className="w-3 h-3 rounded-full bg-[#16865B]" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#16865B] leading-none">
              {today.collected}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Handed Over
            </div>
          </div>
        </div>

      </div>

      {/* 4. RECENT PARCEL ACTIVITY PANEL */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Recent parcel activity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live intake and verification logs for today's gate deliveries
            </p>
          </div>
          <button
            onClick={() => navigate('/guard/search')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#A6192E] bg-[#FBEAEC] hover:bg-[#F8D7DA] transition-colors border border-[#F5C6CB] cursor-pointer"
          >
            <span>Search directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
            metrics.recentActivity.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="py-3.5 px-3 -mx-3 rounded-2xl flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      item.status === 'COLLECTED'
                        ? 'bg-[#F0FDF4] text-[#16865B] border-[#DCFCE7]'
                        : 'bg-[#FFF6F7] text-[#A6192E] border-[#FDE8EA]'
                    }`}
                  >
                    {item.status === 'COLLECTED' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Package className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {item.partner} — {item.studentName}
                    </div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                      {item.deliveryNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end">
                  {item.status === 'COLLECTED' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#16865B] border border-[#DCFCE7]">
                      Collected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF6F7] text-[#A6192E] border border-[#FDE8EA] font-mono">
                      Slot {item.slot}
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-slate-400 mt-1">
                    {new Date(item.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent parcels received during this shift.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default GuardHome;
