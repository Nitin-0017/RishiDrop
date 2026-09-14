import React, { useState } from 'react';
import { reportsApi } from '../../services/api/reports.api';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Package,
  AlertTriangle,
  Box,
  CheckCircle2
} from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExportDeliveries = async () => {
    setIsExporting('deliveries');
    try {
      await reportsApi.downloadDeliveriesCsv(startDate, endDate);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportUnclaimed = async () => {
    setIsExporting('unclaimed');
    try {
      await reportsApi.downloadUnclaimedCsv();
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportStorage = async () => {
    setIsExporting('storage');
    try {
      await reportsApi.downloadStorageCsv();
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reports & CSV Export Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Export high-fidelity operational reports for university administration and audits.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Report 1: Master Deliveries */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Master Deliveries Report</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete historical ledger with parcel IDs, recipient student names, hostel rooms, delivery partner names, timestamps, and verification proofs.
            </p>

            <div className="pt-2 space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Filter Date Window:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleExportDeliveries}
            disabled={isExporting === 'deliveries'}
            className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 shadow-xs flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting === 'deliveries' ? 'Generating CSV...' : 'Download Deliveries CSV'}</span>
          </button>
        </div>

        {/* Report 2: Unclaimed Parcels */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Aged Unclaimed Parcels</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Active stored parcels held for &gt;24 hours, &gt;48 hours, or &gt;72 hours (escalated overdue items) with reminder attempts and student contact details.
            </p>
          </div>

          <button
            onClick={handleExportUnclaimed}
            disabled={isExporting === 'unclaimed'}
            className="w-full py-3 rounded-2xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 shadow-xs flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting === 'unclaimed' ? 'Generating CSV...' : 'Download Unclaimed CSV'}</span>
          </button>
        </div>

        {/* Report 3: Storage Matrix */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Storage Hub Capacity Report</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete mapping of all 150 storage slots across Racks A, B, and C with slot availability states, stored parcel codes, and duration held.
            </p>
          </div>

          <button
            onClick={handleExportStorage}
            disabled={isExporting === 'storage'}
            className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 shadow-xs flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting === 'storage' ? 'Generating CSV...' : 'Download Storage CSV'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
