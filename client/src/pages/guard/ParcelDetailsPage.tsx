import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { deliveryApi } from '../../services/api/delivery.api';
import { ParcelDetails } from '../../types';
import {
  Package,
  User,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  FileText,
  ArrowLeft,
  Shield,
  AlertCircle,
  Hash
} from 'lucide-react';

export default function ParcelDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parcel, setParcel] = useState<ParcelDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchParcelDetails(id);
    }
  }, [id]);

  const fetchParcelDetails = async (parcelId: string) => {
    try {
      setIsLoading(true);
      const data = await deliveryApi.getParcelDetails(parcelId);
      setParcel(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Parcel not found or failed to load details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A6192E]"></div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl border border-gray-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#B30B00] mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">Parcel Not Found</h3>
        <p className="text-sm text-gray-600">{errorMessage || 'Unable to locate parcel record.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#A6192E] text-white rounded-xl text-sm font-semibold hover:bg-[#8F1628] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isCollected = parcel.status === 'COLLECTED' || parcel.status === 'HANDED_OVER';

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold shrink-0 border border-[#F5C6CB]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Parcel Tracking Details</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isCollected
                    ? 'bg-emerald-50 text-[#16865B] border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {parcel.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium font-mono">
              Identifier: <strong className="text-slate-800">{parcel.parcelId}</strong> · Physical Slot: <strong className="text-[#A6192E]">{parcel.storage?.location || 'Hub Counter'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-2xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to List</span>
        </button>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Student Information */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <User className="w-4 h-4 text-[#A6192E]" />
              <span>Student Recipient Profile</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 text-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Name:</span>
                <span className="font-bold text-slate-900">{parcel.student.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Student ID / Roll:</span>
                <span className="font-bold text-slate-900 font-mono">{parcel.student.studentId}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone Number:</span>
                <span className="font-bold text-slate-900 font-mono">{parcel.student.maskedPhone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Email Address:</span>
                <span className="font-medium text-slate-900">{parcel.student.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Hostel / Room:</span>
                <span className="font-medium text-slate-900">
                  {parcel.student.hostel || 'Campus Residence'} {parcel.student.room ? `· ${parcel.student.room}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Department:</span>
                <span className="font-medium text-slate-900">{parcel.student.department || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Package Details */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#A6192E]" />
              <span>Logistics & Courier Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 text-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Courier Partner:</span>
                <span className="font-bold text-slate-900">{parcel.partner.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Tracking Number:</span>
                <span className="font-bold text-slate-900 font-mono">{parcel.trackingNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Parcel Notes:</span>
                <span className="font-medium text-slate-900">{parcel.notes || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Chain of Custody / Guard Log */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#A6192E]" />
              <span>Chain of Custody & Audit Log</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Received Checkpoint */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-[#16865B]" />
                  <span>Received & Inwarded</span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guard:</span>
                    <span className="font-bold text-slate-900">
                      {parcel.receivedBy.name} ({parcel.receivedBy.badgeNumber})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gate:</span>
                    <span className="font-medium text-slate-900">{parcel.receivedBy.gateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="font-medium text-slate-900">
                      {new Date(parcel.receivedAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Handover Checkpoint */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isCollected ? 'bg-slate-50/70 border-slate-200/80' : 'bg-slate-50/40 border-dashed border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <CheckCircle className={`w-4 h-4 ${isCollected ? 'text-[#16865B]' : 'text-slate-400'}`} />
                  <span>Student Collection Handover</span>
                </div>
                {isCollected ? (
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Handed Over By:</span>
                      <span className="font-bold text-slate-900">
                        {parcel.handedOverBy?.name || 'Duty Guard'} ({parcel.handedOverBy?.badgeNumber || 'GD'})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Method:</span>
                      <span className="font-medium text-slate-900">{parcel.verificationMethod || 'QR Pass'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Completed At:</span>
                      <span className="font-medium text-slate-900">
                        {parcel.handedOverAt ? new Date(parcel.handedOverAt).toLocaleString('en-IN') : 'Completed'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                    Awaiting collection by student. Stored safely in <strong className="text-slate-700">{parcel.storage?.location || 'Storage Hub'}</strong>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
