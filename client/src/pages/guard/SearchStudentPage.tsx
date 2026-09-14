import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api/student.api';
import { Student } from '../../types';
import {
  ArrowLeft,
  Search,
  Users,
  Package,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const SearchStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await studentApi.search(query.trim(), 8);
          setResults(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const viewStudent = async (id: string) => {
    try {
      const res = await studentApi.getById(id);
      setSelectedStudent(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold shrink-0 border border-[#F5C6CB]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Search Student Directory</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Lookup student records, campus contact details, and actively stored parcels.
            </p>
          </div>
        </div>
      </div>

      {/* Search Field Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-xl bg-[#A6192E] text-white text-xs flex items-center justify-center font-bold shadow-2xs">
              <Search className="w-3.5 h-3.5" />
            </span>
            <span>Student Quick Search</span>
          </h2>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by phone number, student ID, roll number, or name..."
            className="w-full pl-11 pr-11 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#A6192E] font-medium transition-all"
          />
          {isSearching && (
            <div className="absolute right-4 top-3.5">
              <div className="w-4 h-4 border-2 border-[#A6192E] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Quick test preset */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 pt-0.5">
          <span className="font-medium">Quick sample:</span>
          <button
            type="button"
            onClick={() => setQuery('9876543210')}
            className="font-bold text-[#A6192E] hover:underline cursor-pointer"
          >
            Manjeet (9876543210)
          </button>
        </div>
      </div>

      {/* Results List */}
      {results.length > 0 && !selectedStudent && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Matching Students ({results.length})</span>
            <span>Action</span>
          </div>
          {results.map((s) => (
            <div
              key={s.id}
              className="p-5 flex items-center justify-between hover:bg-[#FBEAEC]/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-500 font-mono flex flex-wrap gap-x-3">
                  <span className="font-bold text-slate-700">{s.studentId}</span>
                  <span>{s.maskedPhone}</span>
                  <span>{s.hostel} {s.room ? `· ${s.room}` : ''}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-600 hidden sm:inline-block">
                  Active parcels: <strong className="text-slate-900 font-bold">{s.activeParcelsCount || 0}</strong>
                </span>

                <button
                  onClick={() => viewStudent(s.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B132B] hover:bg-[#1C2541] text-white transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
                >
                  <span>View parcels</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Student Deliveries View */}
      {selectedStudent && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-black text-slate-900">{selectedStudent.name}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#16865B] border border-emerald-200">
                  Verified
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono flex flex-wrap gap-x-3">
                <span className="font-bold text-slate-700">{selectedStudent.studentId}</span>
                <span>{selectedStudent.phone}</span>
                <span>{selectedStudent.hostel} {selectedStudent.room ? `· ${selectedStudent.room}` : ''}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-xs font-bold text-[#A6192E] hover:underline cursor-pointer px-3.5 py-2 rounded-xl bg-[#FBEAEC] border border-[#F5C6CB] transition-colors"
            >
              Back to search
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Package className="w-4 h-4 text-[#A6192E]" />
              <span>Active Stored Parcels ({selectedStudent.deliveries?.filter((d: any) => d.status !== 'COLLECTED').length || 0})</span>
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
              {selectedStudent.deliveries?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No parcels on record for this student.
                </div>
              ) : (
                selectedStudent.deliveries?.map((d: any) => {
                  const isOversized = d.parcel?.storageType === 'OVERSIZED';
                  const storageDisplay = isOversized
                    ? `Oversized Storage (Ref: ${d.parcel?.oversizedReference || 'OVERSIZED'})`
                    : d.parcel?.storageSlot
                    ? `${d.parcel.storageSlot.rack.name} · Slot ${d.parcel.storageSlot.slotNumber}`
                    : 'Hub Storage';

                  return (
                    <div key={d.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1">
                        <div className="font-black text-slate-900 text-sm flex items-center space-x-2">
                          <span>{d.deliveryPartner.name}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-[#A6192E] font-black">{d.parcel?.parcelId || d.deliveryNumber}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-x-2">
                          <span>Storage:</span>
                          <strong className="text-slate-800">{storageDisplay}</strong>
                          <span className="text-slate-300">•</span>
                          <span>{new Date(d.receivedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div>
                        {d.status === 'COLLECTED' ? (
                          <span className="text-[11px] font-bold text-[#16865B] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            Collected
                          </span>
                        ) : (
                          <button
                            onClick={() => navigate('/guard/pickup')}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#A6192E] hover:bg-[#8F1628] text-white shadow-2xs transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span>Handover</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
