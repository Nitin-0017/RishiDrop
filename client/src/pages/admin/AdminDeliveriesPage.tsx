import React, { useState, useEffect } from 'react';
import { deliveryApi } from '../../services/api/delivery.api';
import { reportsApi } from '../../services/api/reports.api';
import { DeliveryItem, DeliveryPartner } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { WhatsAppStatusBadge } from '../../components/common/WhatsAppStatusBadge';
import { ParcelQrModal, ParcelQrData } from '../../components/common/ParcelQrModal';
import { useSocket } from '../../context/SocketContext';
import {
  Truck,
  Search,
  Download,
  Calendar,
  RotateCcw,
  QrCode,
  CheckCircle2,
} from 'lucide-react';

export const AdminDeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrParcel, setSelectedQrParcel] = useState<ParcelQrData | null>(null);

  const { socket } = useSocket();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    deliveryApi.getPartners().then((res) => setPartners(res.data));
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await deliveryApi.getAll({
        page,
        limit: 25,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        partnerId: partnerFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setDeliveries(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [page, statusFilter, partnerFilter, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDeliveries();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Real-time WebSocket updates
  useEffect(() => {
    if (!socket) return;

    const handleWhatsAppUpdate = (data: any) => {
      setDeliveries((prev) =>
        prev.map((d) => {
          if (
            d.parcel?.id === data.parcelId ||
            d.parcel?.parcelId === data.customParcelId ||
            (d.parcel as any)?.id === data.parcelId
          ) {
            return {
              ...d,
              whatsappStatus: data.status,
              parcel: d.parcel
                ? {
                    ...d.parcel,
                    whatsappStatus: data.status,
                    whatsappError: data.error,
                  }
                : null,
            };
          }
          return d;
        })
      );
    };

    const handleParcelStatusUpdate = (data: any) => {
      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.parcel?.id === data.id || d.parcel?.parcelId === data.parcelId) {
            return {
              ...d,
              status: (data.status as any) || d.status,
              completedAt: data.collectedAt || d.completedAt,
              parcel: d.parcel
                ? {
                    ...d.parcel,
                    slot: 'Released',
                  }
                : null,
            };
          }
          return d;
        })
      );
    };

    const handleDeliveryCreated = () => {
      fetchDeliveries();
    };

    socket.on('parcel_whatsapp_updated', handleWhatsAppUpdate);
    socket.on('parcel_status_updated', handleParcelStatusUpdate);
    socket.on('delivery_created', handleDeliveryCreated);

    return () => {
      socket.off('parcel_whatsapp_updated', handleWhatsAppUpdate);
      socket.off('parcel_status_updated', handleParcelStatusUpdate);
      socket.off('delivery_created', handleDeliveryCreated);
    };
  }, [socket]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPartnerFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleOpenQr = (item: DeliveryItem) => {
    setSelectedQrParcel({
      parcelId: item.parcel?.parcelId || item.deliveryNumber,
      qrToken: item.parcel?.qrToken,
      qrPayload: item.parcel?.qrPayload,
      studentName: item.student.name,
      studentRoll: item.student.studentId,
      studentPhone: item.student.maskedPhone,
      partnerName: item.partner.name,
      partnerColor: item.partner.color,
      trackingNumber: item.trackingNumber,
      storageSlot: item.parcel?.slot,
      receivedAt: item.receivedAt,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Master Deliveries Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive registry of all {totalCount} courier parcels received across campus gates.
            </p>
          </div>
        </div>

        <button
          onClick={() => reportsApi.downloadDeliveriesCsv(startDate, endDate)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#A6192E] hover:bg-[#8F1628] shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Deliveries (CSV)</span>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parcel, student, phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-[#A6192E] focus:bg-white"
            />
          </div>

          {/* Partner Filter */}
          <select
            value={partnerFilter}
            onChange={(e) => {
              setPartnerFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="">All Delivery Partners</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="STORED">STORED</option>
            <option value="COLLECTED">COLLECTED</option>
            <option value="RETURNED">RETURNED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 font-semibold">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      </div>

      {/* Deliveries Table with WhatsApp Status and QR columns */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        {loading ? (
          <LoadingSpinner label="Loading ledger data..." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 min-w-[170px] whitespace-nowrap">Parcel ID</th>
                  <th className="py-3.5 px-4 min-w-[190px] whitespace-nowrap">Student</th>
                  <th className="py-3.5 px-4 min-w-[130px] whitespace-nowrap">Delivery Partner</th>
                  <th className="py-3.5 px-4 min-w-[150px] whitespace-nowrap">Received At</th>
                  <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">Storage Location</th>
                  <th className="py-3.5 px-4 min-w-[110px] whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">WhatsApp Alert</th>
                  <th className="py-3.5 px-4 min-w-[110px] whitespace-nowrap text-center">QR Pass</th>
                  <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">Collected At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 align-middle font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-900 tracking-tight text-xs">
                        {item.parcel?.parcelId || item.deliveryNumber}
                      </div>
                      {item.trackingNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[160px]" title={item.trackingNumber}>
                          AWB: {item.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-900 text-xs">
                        {item.student.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                        {item.student.studentId} • {item.student.maskedPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-md font-bold text-[10px] text-white shadow-2xs"
                        style={{ backgroundColor: item.partner.color || '#4F46E5' }}
                      >
                        {item.partner.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap text-slate-600">
                      <div className="font-medium text-slate-900 text-xs">
                        {new Date(item.receivedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.receivedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="font-bold text-[#A6192E] text-xs">
                        {item.parcel?.slot || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <Badge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <WhatsAppStatusBadge
                        status={item.parcel?.whatsappStatus || item.whatsappStatus}
                        error={item.parcel?.whatsappError}
                        size="xs"
                      />
                    </td>
                    <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenQr(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#FFF6F7] hover:bg-[#FBEAEC] text-[#A6192E] rounded-lg font-bold text-[11px] transition-colors border border-[#F5C6CB] cursor-pointer shadow-2xs whitespace-nowrap"
                        title="View & Print Parcel QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View QR</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {item.completedAt ? (
                        <div className="flex items-start space-x-1.5 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-xs text-emerald-700">
                              {new Date(item.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                              {new Date(item.completedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex flex-col text-[10px] font-medium bg-slate-50 border border-slate-200/80 rounded-md px-2.5 py-1">
                          <span className="font-semibold text-slate-600">Pending</span>
                          <span className="text-slate-400">Collection</span>
                        </span>
                      )}
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
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} items)
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

      {/* Parcel QR Code & Print Slip Modal */}
      <ParcelQrModal
        isOpen={!!selectedQrParcel}
        onClose={() => setSelectedQrParcel(null)}
        parcel={selectedQrParcel}
      />

    </div>
  );
};
