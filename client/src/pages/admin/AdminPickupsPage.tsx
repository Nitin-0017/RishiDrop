import React, { useState, useEffect } from 'react';
import { pickupApi } from '../../services/api/pickup.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  CheckCircle2,
  QrCode,
  KeyRound
} from 'lucide-react';

export const AdminPickupsPage: React.FC = () => {
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const res = await pickupApi.getPickups({ page, limit: 25 });
      setPickups(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [page]);

  if (loading) return <LoadingSpinner label="Loading Pickup Verification Ledger..." />;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Verified Handover & Pickup Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Digital proof of delivery records ({totalCount} student handovers completed).
            </p>
          </div>
        </div>
      </div>

      {/* Pickups Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Parcel ID</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Roll ID</th>
                <th className="pb-3">Partner</th>
                <th className="pb-3">Verification Method</th>
                <th className="pb-3">Verified By Guard</th>
                <th className="pb-3">Handover Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pickups.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-900">{p.parcelId}</td>
                  <td className="py-3 font-bold text-slate-900">{p.studentName}</td>
                  <td className="py-3 font-mono text-slate-500">{p.studentRoll}</td>
                  <td className="py-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: p.partnerColor || '#4F46E5' }}
                    >
                      {p.partner}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      p.verificationMethod === 'QR' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {p.verificationMethod === 'QR' ? <QrCode className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
                      <span>{p.verificationMethod}</span>
                    </span>
                  </td>
                  <td className="py-3 text-slate-700 font-semibold">
                    {p.guardName} ({p.badgeNumber})
                  </td>
                  <td className="py-3 text-slate-500 font-mono">
                    {new Date(p.verifiedAt).toLocaleDateString()} {new Date(p.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} records)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
