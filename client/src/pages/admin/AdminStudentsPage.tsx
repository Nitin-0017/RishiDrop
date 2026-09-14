import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/api/student.api';
import { Student } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Search,
  Building,
  Phone,
  Mail,
  GraduationCap,
  Package,
  MessageSquare,
  Calendar
} from 'lucide-react';

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getAll({
        page,
        limit: 25,
        search: search.trim() || undefined,
      });
      setStudents(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const viewStudentDetails = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await studentApi.getById(id);
      setSelectedStudentDetail(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              University Students Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrolled student body (~{totalCount} students) linked with WhatsApp Business platform.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, mobile or hostel..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-brand-500 focus:bg-white"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 hidden sm:block">
          Total Enrolled: {totalCount} Students
        </span>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        {loading ? (
          <LoadingSpinner label="Fetching students directory..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Roll ID</th>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Phone (Masked)</th>
                  <th className="pb-3">Hostel & Room</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">WhatsApp</th>
                  <th className="pb-3">Active Parcels</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900">{s.studentId}</td>
                    <td className="py-3 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 font-mono text-slate-600">{s.maskedPhone}</td>
                    <td className="py-3 text-slate-600">{s.hostel} {s.room}</td>
                    <td className="py-3 text-slate-600">{s.department || 'N/A'}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3">
                      {s.stats?.activeParcelsCount && s.stats.activeParcelsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold text-xs">
                          {s.stats.activeParcelsCount} waiting
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => viewStudentDetails(s.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} students)
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

      {/* STUDENT PROFILE INSPECTOR MODAL */}
      <Modal
        isOpen={!!selectedStudentDetail}
        onClose={() => setSelectedStudentDetail(null)}
        title={selectedStudentDetail?.name || 'Student Profile'}
        subtitle={`Roll: ${selectedStudentDetail?.studentId}`}
        maxWidth="2xl"
      >
        {selectedStudentDetail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone</span>
                <span className="text-xs font-mono font-bold text-slate-900">{selectedStudentDetail.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Email</span>
                <span className="text-xs font-bold text-slate-900 truncate block">{selectedStudentDetail.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Hostel / Room</span>
                <span className="text-xs font-bold text-slate-900">{selectedStudentDetail.hostel} {selectedStudentDetail.room}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Department</span>
                <span className="text-xs font-bold text-slate-900">{selectedStudentDetail.department}</span>
              </div>
            </div>

            {/* Delivery History */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Delivery Intake History ({selectedStudentDetail.deliveries?.length || 0} Total)
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedStudentDetail.deliveries?.map((d: any) => (
                  <div key={d.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-slate-900">{d.deliveryNumber}</div>
                      <div className="text-[11px] text-slate-500">{d.deliveryPartner.name} • {d.type}</div>
                    </div>
                    <div className="text-right">
                      <Badge status={d.status} size="sm" />
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(d.receivedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
