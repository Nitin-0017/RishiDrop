import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { studentApi } from '../../services/api/student.api';
import { deliveryApi } from '../../services/api/delivery.api';
import { storageApi } from '../../services/api/storage.api';
import { Student, DeliveryPartner, StorageOverview } from '../../types';
import { ParcelQrModal } from '../../components/common/ParcelQrModal';
import {
  Search,
  CheckCircle,
  Package,
  PackagePlus,
  ArrowRight,
  PlusCircle,
  Layers,
  Check,
  Printer,
  Maximize2,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function ReceiveDeliveryFlow() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  // Step 1: Student Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Step 2: Delivery Details
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Step 3: Storage Method & Location Selection
  const [storageMethod, setStorageMethod] = useState<'RACK' | 'OVERSIZED'>('RACK');
  const [oversizedRef, setOversizedRef] = useState<string>('');
  const [storageOverview, setStorageOverview] = useState<StorageOverview | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [, setIsLoadingStorage] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Local calendar date fallback for preview: DD-MM-001
  const getLocalOversizedPreview = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-001`;
  };

  const fetchOversizedPreview = async () => {
    try {
      const res = await deliveryApi.getNextOversizedRef();
      if (res?.data?.reference) {
        setOversizedRef(res.data.reference);
      } else {
        setOversizedRef(getLocalOversizedPreview());
      }
    } catch (err) {
      setOversizedRef(getLocalOversizedPreview());
    }
  };

  // Load partners, storage and oversized preview on mount
  useEffect(() => {
    fetchInitialData();
    fetchOversizedPreview();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoadingStorage(true);
      const [partnersData, storageData] = await Promise.all([
        deliveryApi.getPartners(),
        storageApi.getOverview(),
      ]);
      const listPartners = partnersData.data || partnersData;
      setPartners(listPartners);
      if (listPartners.length > 0) {
        setSelectedPartnerId(listPartners[0].id);
      }
      setStorageOverview(storageData.data);
      if (storageData.data.racks.length > 0) {
        setSelectedRackId(storageData.data.racks[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load initial intake metadata', err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const handleSelectOversized = () => {
    setStorageMethod('OVERSIZED');
    fetchOversizedPreview();
  };

  // Live Student Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await studentApi.search(searchQuery.trim());
          setSearchResults(results.data || results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage(null);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
  };

  const selectedRack = storageOverview?.racks.find((r) => r.id === selectedRackId);
  const selectedSlot = selectedRack?.slots.find((s) => s.id === selectedSlotId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedStudent) {
      setErrorMessage('Please search and select a verified student.');
      return;
    }

    if (!selectedPartnerId) {
      setErrorMessage('Please select a delivery partner.');
      return;
    }

    if (storageMethod === 'RACK' && !selectedSlotId) {
      setErrorMessage('Please manually choose an available storage slot.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await deliveryApi.create({
        studentId: selectedStudent.id,
        deliveryPartnerId: selectedPartnerId,
        storageType: storageMethod,
        rackId: storageMethod === 'RACK' ? selectedRackId : undefined,
        slotId: storageMethod === 'RACK' ? selectedSlotId : undefined,
        trackingNumber: trackingNumber.trim() || undefined,
      });

      setSuccessResult(response.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to register parcel. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFlow = () => {
    setSelectedStudent(null);
    setTrackingNumber('');
    setStorageMethod('RACK');
    setSelectedSlotId('');
    setSuccessResult(null);
    setErrorMessage(null);
    fetchInitialData();
    fetchOversizedPreview();
  };

  // SUCCESS CONFIRMATION SCREEN
  if (successResult) {
    const isOversized = successResult.storageType === 'OVERSIZED';
    const storageDisplay = isOversized
      ? `Oversized Storage · Ref: ${successResult.oversizedReference || successResult.storage?.slot}`
      : `${successResult.storage.rack} · Slot ${successResult.storage.slot}`;

    return (
      <div className="space-y-6 w-full">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs text-center max-w-xl mx-auto">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-[#16865B]">
            <CheckCircle className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16865B] border border-emerald-200 mb-2">
            Status: STORED
          </span>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Parcel Received & Stored</h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated WhatsApp notification dispatched to the student.
          </p>

          {/* Key Parcel ID & Storage Info */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mt-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Parcel ID</span>
                <span className="text-lg font-mono font-black text-slate-900">{successResult.parcelId}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isOversized ? 'Storage Method' : 'Storage Slot'}
                </span>
                <span className="text-base font-black text-[#A6192E]">
                  {storageDisplay}
                </span>
              </div>
            </div>

            {/* Dynamic Scannable QR & Quick Print Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0">
                  <QRCodeSVG
                    value={successResult.qrPayload || JSON.stringify({
                      type: 'campusdrop_parcel',
                      parcelId: successResult.parcelId,
                      token: successResult.qrToken || successResult.parcelId
                    })}
                    size={72}
                    level="M"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Parcel QR Pass
                  </span>
                  <p className="font-mono text-xs font-black text-slate-900">{successResult.parcelId}</p>
                  <p className="text-[11px] text-slate-500">Scannable by Guard Handover Scanner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FBEAEC] hover:bg-[#F8D7DA] text-[#A6192E] text-xs font-bold transition-colors border border-[#F5C6CB] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View / Print QR Slip</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm pt-1">
              <div>
                <span className="text-slate-400 text-xs block">Student:</span>
                <span className="font-bold text-slate-900">{successResult.student.name}</span>
                <span className="text-xs text-slate-500 font-mono block">{successResult.student.studentId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Delivery Partner:</span>
                <span className="font-bold text-slate-900">{successResult.partner.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Received At:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(successResult.receivedAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Student Mobile:</span>
                <span className="font-semibold text-slate-800 font-mono">{successResult.student.maskedPhone}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={handleResetFlow}
              className="w-full sm:w-auto px-6 py-3 bg-[#A6192E] hover:bg-[#8F1628] text-white font-bold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Receive Another Parcel</span>
            </button>
            <button
              onClick={handleResetFlow}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

        {/* Print & View QR Modal */}
        <ParcelQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          parcel={{
            parcelId: successResult.parcelId,
            qrToken: successResult.qrToken,
            qrPayload: successResult.qrPayload,
            studentName: successResult.student.name,
            studentRoll: successResult.student.studentId,
            partnerName: successResult.partner.name,
            trackingNumber: trackingNumber || undefined,
            rackName: isOversized ? 'Oversized Storage' : successResult.storage.rack,
            slotNumber: String(isOversized ? (successResult.oversizedReference || successResult.storage.slot) : successResult.storage.slot),
            receivedAt: successResult.receivedAt,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold shrink-0 border border-[#F5C6CB]">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Receive Regular Courier Parcel</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Verify student identity, select courier partner, and assign a physical storage slot or oversized reference.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Student Search & Selection */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-xl bg-[#A6192E] text-white text-xs flex items-center justify-center font-bold shadow-2xs">1</span>
              <span>Select University Student</span>
            </h2>
            {selectedStudent && (
              <button
                type="button"
                onClick={handleClearStudent}
                className="text-xs text-[#A6192E] hover:underline font-medium"
              >
                Change Student
              </button>
            )}
          </div>

          {!selectedStudent ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, roll number, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-3.5">
                    <div className="w-4 h-4 border-2 border-[#A6192E] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Live Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectStudent(st)}
                      className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-sm text-gray-900 block">{st.name}</span>
                        <span className="text-xs text-gray-500">
                          {st.studentId} · {st.department || 'General'} · {st.maskedPhone}
                        </span>
                      </div>
                      <span className="text-xs text-[#A6192E] font-medium flex items-center space-x-1">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected Student Card */
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900 text-base">{selectedStudent.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-[#16865B]">
                    Verified Student
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600 pt-1">
                  <div>
                    <span className="text-gray-400 block">Roll / ID:</span>
                    <span className="font-medium text-gray-800">{selectedStudent.studentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Phone:</span>
                    <span className="font-medium text-gray-800">{selectedStudent.maskedPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Hostel / Room:</span>
                    <span className="font-medium text-gray-800">
                      {selectedStudent.hostel || 'Hostel'} {selectedStudent.room ? `· ${selectedStudent.room}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Delivery Details (Notes removed, clean 2-column grid without empty space) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-xl bg-[#A6192E] text-white text-xs flex items-center justify-center font-bold shadow-2xs">2</span>
              <span>Delivery Details</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Courier Partner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Delivery Partner <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E] bg-white font-medium text-slate-800"
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Courier Tracking Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tracking Number (Optional)
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. TRK-AMZ-991204"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Storage Allocation (Rack Storage vs Oversized / No Rack Slot) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-xl bg-[#A6192E] text-white text-xs flex items-center justify-center font-bold shadow-2xs">3</span>
              <span>Storage Allocation</span>
            </h2>
            {storageMethod === 'RACK' && selectedSlot && (
              <span className="text-xs font-bold text-[#A6192E] bg-[#FBEAEC] px-3 py-1 rounded-full border border-[#F5C6CB] self-start sm:self-auto">
                Selected: {selectedRack?.name} · Slot {selectedSlot.slotNumber} ({selectedSlot.currentOccupied}/{selectedSlot.capacity})
              </span>
            )}
            {storageMethod === 'OVERSIZED' && (
              <span className="text-xs font-bold text-[#A6192E] bg-[#FBEAEC] px-3 py-1 rounded-full border border-[#F5C6CB] self-start sm:self-auto">
                Oversized Parcel · Ref: {oversizedRef || 'Generating...'}
              </span>
            )}
          </div>

          {/* Storage Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Storage Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option A: Normal Rack Storage */}
              <button
                type="button"
                onClick={() => setStorageMethod('RACK')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3.5 ${
                  storageMethod === 'RACK'
                    ? 'border-[#A6192E] bg-[#FBEAEC]/30 ring-2 ring-[#A6192E]/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    storageMethod === 'RACK'
                      ? 'bg-[#A6192E] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">
                      Normal Rack Storage
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        storageMethod === 'RACK'
                          ? 'border-[#A6192E] bg-[#A6192E]'
                          : 'border-slate-300'
                      }`}
                    >
                      {storageMethod === 'RACK' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white block"></span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Select physical rack slot (Rack A, B, C) for parcels fitting inside slots.
                  </p>
                </div>
              </button>

              {/* Option B: Oversized / No Rack Slot */}
              <button
                type="button"
                onClick={handleSelectOversized}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3.5 ${
                  storageMethod === 'OVERSIZED'
                    ? 'border-[#A6192E] bg-[#FBEAEC]/30 ring-2 ring-[#A6192E]/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    storageMethod === 'OVERSIZED'
                      ? 'bg-[#A6192E] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">
                      Oversized / No Rack Slot
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        storageMethod === 'OVERSIZED'
                          ? 'border-[#A6192E] bg-[#A6192E]'
                          : 'border-slate-300'
                      }`}
                    >
                      {storageMethod === 'OVERSIZED' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white block"></span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Use this for parcels that are too large to fit in a rack slot.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Sub-View based on selected Storage Method */}
          {storageMethod === 'OVERSIZED' ? (
            /* OVERSIZED PARCEL CARD */
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FBEAEC] text-[#A6192E] border border-[#F5C6CB] flex items-center justify-center shrink-0">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#A6192E] block">
                      Storage Mode
                    </span>
                    <h3 className="text-base font-black text-slate-900">OVERSIZED PARCEL</h3>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs self-start sm:self-auto">
                  <Clock className="w-3 h-3 text-[#A6192E] mr-1.5" />
                  Daily Auto-Generated
                </span>
              </div>

              {/* Prominent Reference Number Display */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Reference Number
                  </span>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight">
                      {oversizedRef || '...'}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      Ready for assignment
                    </span>
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6 text-xs text-slate-400 font-mono">
                  <span>Format: DD-MM-XXX</span>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">Resets daily to 001</div>
                </div>
              </div>

              {/* Prominent Instruction for Guard */}
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-[#FBEAEC]/70 border border-[#F5C6CB] text-[#8F1628]">
                <FileText className="w-5 h-5 shrink-0 mt-0.5 text-[#A6192E]" />
                <div className="text-xs leading-relaxed font-semibold">
                  <p className="font-bold text-sm text-[#A6192E] mb-0.5">
                    Action required before shelving:
                  </p>
                  <p>
                    "Write this reference number on the parcel and place it in the designated oversized storage area."
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* NORMAL RACK STORAGE: Rack Selection & Slot Grid */
            <div className="space-y-4">
              {storageOverview && storageOverview.racks.length > 0 ? (
                <>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {storageOverview.racks.map((rack) => (
                      <button
                        key={rack.id}
                        type="button"
                        onClick={() => {
                          setSelectedRackId(rack.id);
                          setSelectedSlotId('');
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 flex-shrink-0 cursor-pointer ${
                          selectedRackId === rack.id
                            ? 'bg-[#A6192E] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{rack.name}</span>
                        <span className="text-[10px] opacity-80 font-normal">
                          ({rack.storedParcels}/{rack.capacity} parcels)
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Slot Grid for Chosen Rack */}
                  {selectedRack && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span>Click an available slot to allocate this parcel:</span>
                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                            <span className="font-medium text-slate-700">Available</span>
                          </span>
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                            <span className="font-medium text-slate-700">Partially Occupied</span>
                          </span>
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
                            <span className="font-medium text-slate-700">Full</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 gap-3">
                        {selectedRack.slots.map((slot) => {
                          const isFull = slot.currentOccupied >= slot.capacity;
                          const isSelected = selectedSlotId === slot.id;
                          const isOccupied = slot.currentOccupied > 0 && !isFull;

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={isFull}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                                isFull
                                  ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed text-slate-400'
                                  : isSelected
                                  ? 'bg-[#FBEAEC] border-[#A6192E] ring-2 ring-[#A6192E] text-[#A6192E] shadow-xs'
                                  : isOccupied
                                  ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400 text-slate-900'
                                  : 'bg-white border-slate-200 hover:border-[#A6192E] text-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-sm">{slot.slotNumber}</span>
                                {isSelected && <Check className="w-4 h-4 text-[#A6192E]" />}
                              </div>
                              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Occupancy:</span>
                                <span className="font-bold text-slate-800">
                                  {slot.currentOccupied}/{slot.capacity}
                                </span>
                              </div>
                              {isFull && (
                                <span className="text-[10px] font-extrabold text-red-600 block mt-1">FULL</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  Loading storage racks...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !selectedStudent || (storageMethod === 'RACK' && !selectedSlotId)}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#A6192E] hover:bg-[#8F1628] text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Receiving & Storing...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>RECEIVE & STORE PARCEL</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

