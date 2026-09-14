import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pickupApi } from '../../services/api/pickup.api';
import { CameraQrScanner } from '../../components/common/CameraQrScanner';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Package,
  MapPin,
  User,
  Shield,
  Clock,
  Tag,
  CheckCircle,
  MessageSquare,
  Truck,
  QrCode
} from 'lucide-react';

interface VerifiedParcelInfo {
  id: string;
  parcelId: string;
  trackingNumber?: string | null;
  partner: string;
  partnerColor?: string | null;
  status?: string;
  storageLocation: string;
  rackName?: string;
  slotNumber?: string;
  receivedAt: string;
  receivedByGuard: string;
  qrToken?: string;
}

interface VerifiedStudentInfo {
  id: string;
  name: string;
  studentId: string;
  phone?: string;
  maskedPhone: string;
  hostel?: string;
  room?: string;
  department?: string;
}

interface VerifiedGuardInfo {
  id?: string;
  name: string;
  badgeNumber: string;
  displayText: string;
}

export const HandoverScanFlow: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Verification Mode
  const [mode, setMode] = useState<'QR' | 'OTP'>('QR');
  const [otpCode, setOtpCode] = useState('');
  const [manualToken, setManualToken] = useState('');

  // Status
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Scanned / Verified Result
  const [verifiedData, setVerifiedData] = useState<{
    token?: string;
    otpCode?: string;
    student: VerifiedStudentInfo;
    parcel: VerifiedParcelInfo;
    scannedByGuard?: VerifiedGuardInfo;
  } | null>(null);

  const [isCompleting, setIsCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState<any | null>(null);

  const handleQrScan = async (scannedText: string) => {
    let token = scannedText.trim();
    if (token.includes('token=')) {
      try {
        const url = new URL(token);
        token = url.searchParams.get('token') || token;
      } catch (e) {
        // use raw token
      }
    }
    if (isVerifying || verifiedData) return;
    await verifyScannedInput(token);
  };

  const verifyScannedInput = async (tokenOrData: string) => {
    setVerificationError(null);
    setIsVerifying(true);
    try {
      // First attempt dedicated verifyParcelQr API
      try {
        const res = await pickupApi.verifyParcelQr(tokenOrData);
        if (res.data && res.data.parcel) {
          setVerifiedData({
            token: res.data.parcel.qrToken || tokenOrData,
            student: res.data.student,
            parcel: res.data.parcel,
            scannedByGuard: res.data.scannedByGuard,
          });
          return;
        }
      } catch (parcelErr: any) {
        // If it was an explicit conflict (e.g. already collected), throw directly
        if (parcelErr?.response?.status === 409) {
          throw parcelErr;
        }
        // Otherwise attempt legacy student QR verify as fallback
        const res = await pickupApi.verifyQr(tokenOrData);
        if (res.data?.parcel) {
          setVerifiedData({
            token: res.data.parcel.qrToken || tokenOrData,
            student: res.data.student,
            parcel: res.data.parcel,
            scannedByGuard: res.data.scannedByGuard,
          });
          return;
        }
        const target = res.data.targetParcel || res.data.allActiveParcels?.[0];
        if (!target) {
          throw new Error('No active parcel found for this pass.');
        }
        setVerifiedData({
          token: res.data.token,
          student: res.data.student,
          parcel: {
            id: target.id,
            parcelId: target.parcelId,
            trackingNumber: target.trackingNumber || 'N/A',
            partner: target.partner || 'Courier',
            partnerColor: target.partnerColor,
            storageLocation: target.slot || (target.rackName ? `${target.rackName}, Slot ${target.slotNumber}` : 'Hub Storage'),
            rackName: target.rackName,
            slotNumber: String(target.slotNumber || ''),
            receivedAt: target.receivedAt || new Date().toISOString(),
            receivedByGuard: target.receivedByGuard || 'Main Gate Security',
          },
          scannedByGuard: res.data.scannedByGuard || (user?.guard ? {
            name: user.name,
            badgeNumber: user.guard.badgeNumber,
            displayText: `${user.name} (${user.guard.badgeNumber})`,
          } : undefined),
        });
      }
    } catch (err: any) {
      setVerificationError(err?.response?.data?.error || err?.message || 'Invalid or expired QR pass.');
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEnteredOtp = otpCode.trim();
    if (!cleanEnteredOtp) return;

    setVerificationError(null);
    setIsVerifying(true);
    try {
      const res = await pickupApi.verifyOtp(cleanEnteredOtp, cleanEnteredOtp);
      const verifiedOtp = res.data?.otpCode || res.data?.token || cleanEnteredOtp;
      setVerifiedData({
        token: verifiedOtp,
        otpCode: verifiedOtp,
        student: res.data.student,
        parcel: {
          id: res.data.parcel.id,
          parcelId: res.data.parcel.parcelId,
          partner: res.data.parcel.partner,
          storageLocation: res.data.parcel.slot || 'Hub Storage',
          receivedAt: new Date().toISOString(),
          receivedByGuard: 'Main Gate Security',
        },
        scannedByGuard: user?.guard ? {
          name: user.name,
          badgeNumber: user.guard.badgeNumber,
          displayText: `${user.name} (${user.guard.badgeNumber})`,
        } : undefined,
      });
    } catch (err: any) {
      setVerificationError(err?.response?.data?.error || 'Invalid 6-digit OTP code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmHandover = async () => {
    if (!verifiedData?.parcel?.id) return;

    const tokenToSend = verifiedData.token || verifiedData.otpCode || (mode === 'OTP' ? otpCode.trim() : null);

    setVerificationError(null);
    setIsCompleting(true);
    try {
      const res = await pickupApi.completeHandover({
        parcelId: verifiedData.parcel.id,
        verificationMethod: mode === 'OTP' ? 'OTP' : 'QR',
        verificationToken: tokenToSend || null,
        otpCode: mode === 'OTP' ? (tokenToSend || undefined) : undefined,
        notes: 'Handover verified and released at Main Gate',
      });
      setCompletionSuccess(res.data);
    } catch (err: any) {
      setVerificationError(err?.response?.data?.error || 'Failed to complete handover.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDone = () => {
    setVerifiedData(null);
    setCompletionSuccess(null);
    setVerificationError(null);
    setOtpCode('');
    setManualToken('');
  };

  // Guard display string
  const currentGuardText = verifiedData?.scannedByGuard?.displayText || (user?.guard
    ? `${user.name} (${user.guard.badgeNumber})`
    : 'Rajesh Kumar (GD-001)');

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FBEAEC] text-[#A6192E] flex items-center justify-center font-bold shrink-0 border border-[#F5C6CB]">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Handover Parcel & Scan QR</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Scan student or parcel QR pass, or enter the 6-digit WhatsApp OTP to release parcels.
            </p>
          </div>
        </div>
      </div>

      {/* 1. SUCCESS STATE */}
      {completionSuccess && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs text-center max-w-2xl mx-auto animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#16865B] flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
            <Check className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Handover Completed Successfully</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Parcel marked collected and storage slot automatically released.</p>
          </div>

          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2.5 text-left">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="font-medium text-slate-500">Student Recipient:</span>
              <strong className="text-slate-900 font-bold">{completionSuccess.studentName}</strong>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="font-medium text-slate-500">Parcel ID:</span>
              <strong className="font-mono font-bold text-slate-900">{completionSuccess.parcelId}</strong>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="font-medium text-slate-500">Storage Slot:</span>
              <strong className="text-[#16865B] font-bold">Released (Available)</strong>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
              <span className="font-medium text-slate-500">Handed Over By:</span>
              <strong className="text-slate-900 font-bold">
                {completionSuccess.guard
                  ? `${completionSuccess.guard.name} (${completionSuccess.guard.badgeNumber})`
                  : currentGuardText}
              </strong>
            </div>
            <div className="flex justify-between items-center pt-1.5">
              <span className="font-medium text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#16865B]" /> WhatsApp Confirmation:
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#16865B] border border-emerald-200">
                ✓ Dispatched to Student
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDone}
              className="flex-1 py-3.5 rounded-2xl font-bold text-xs bg-[#A6192E] hover:bg-[#8F1628] text-white transition-all shadow-xs cursor-pointer"
            >
              + Scan Next Parcel
            </button>
            <button
              onClick={() => navigate('/guard')}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* 2. VERIFIED STUDENT & PARCEL DETAILS SCREEN */}
      {verifiedData && !completionSuccess && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in w-full">
          {/* Header Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3 text-[#16865B]">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-xs font-bold border border-emerald-200 shadow-2xs">
                <Check className="w-4 h-4 text-[#16865B]" />
              </span>
              <div>
                <span className="text-base font-black text-slate-900">RishiDrop Parcel Verified</span>
                <span className="text-xs text-slate-500 block">Identity and parcel match confirmed</span>
              </div>
            </div>
            <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#FBEAEC] text-[#A6192E] border border-[#F5C6CB]">
              {verifiedData.parcel.partner}
            </span>
          </div>

          {/* Student & Parcel Details Side-by-Side on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Student Details Card */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#A6192E]" /> Student Recipient
              </span>
              <div className="text-lg font-black text-slate-900">{verifiedData.student.name}</div>
              <div className="space-y-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Roll / Student ID:</span>
                  <strong className="font-mono text-slate-900 font-bold">{verifiedData.student.studentId}</strong>
                </div>
                {(verifiedData.student.hostel || verifiedData.student.room) && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Hostel & Room:</span>
                    <strong className="text-slate-900 font-bold">
                      {verifiedData.student.hostel} {verifiedData.student.room ? `• Room ${verifiedData.student.room}` : ''}
                    </strong>
                  </div>
                )}
                {verifiedData.student.maskedPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Student Phone:</span>
                    <strong className="text-slate-900 font-bold font-mono">{verifiedData.student.maskedPhone}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Parcel Details Card */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#A6192E]" /> Parcel Identification
              </span>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Parcel ID</span>
                  <span className="font-mono text-sm font-black text-slate-900">{verifiedData.parcel.parcelId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Storage Slot</span>
                  <span className="font-bold text-xs text-[#A6192E] inline-block px-2.5 py-1 bg-[#FBEAEC] rounded-xl border border-[#F5C6CB]">
                    {verifiedData.parcel.storageLocation}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Tracking Number</span>
                  <span className="font-mono text-xs text-slate-700 font-semibold">{verifiedData.parcel.trackingNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Received Time</span>
                  <span className="text-xs text-slate-700 font-semibold">
                    {new Date(verifiedData.parcel.receivedAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>

              {/* Received by Guard */}
              <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Received By:</span>
                <span className="font-bold text-slate-800">{verifiedData.parcel.receivedByGuard}</span>
              </div>
            </div>
          </div>

          {/* Session verification guard */}
          <div className="bg-[#FBEAEC]/60 p-4 rounded-2xl border border-[#F5C6CB] text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-slate-600 flex items-center gap-2 font-bold">
              <Shield className="w-4 h-4 text-[#A6192E]" />
              Scanned by Guard:
            </span>
            <span className="font-extrabold text-[#A6192E] text-sm">{currentGuardText}</span>
          </div>

          {verificationError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{verificationError}</span>
            </div>
          )}

          {/* Confirm Handover Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleConfirmHandover}
              disabled={isCompleting}
              className="flex-1 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-[#A6192E] hover:bg-[#8F1628] text-white disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{isCompleting ? 'Completing Handover...' : 'CONFIRM HANDOVER'}</span>
            </button>

            <button
              onClick={handleDone}
              className="px-8 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. SCANNER / OTP INPUT */}
      {!verifiedData && !completionSuccess && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs w-full">
          {/* Mode Switcher */}
          <div className="w-full bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('QR');
                setVerificationError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                mode === 'QR'
                  ? 'bg-white text-[#A6192E] shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <QrCode className={`w-4 h-4 ${mode === 'QR' ? 'text-[#A6192E]' : 'text-slate-400'}`} />
              <span>Scan Parcel QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('OTP');
                setVerificationError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                mode === 'OTP'
                  ? 'bg-white text-[#A6192E] shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Shield className={`w-4 h-4 ${mode === 'OTP' ? 'text-[#A6192E]' : 'text-slate-400'}`} />
              <span>6-Digit Student OTP</span>
            </button>
          </div>

          {verificationError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start space-x-2.5 font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{verificationError}</div>
            </div>
          )}

          {/* QR Scanner Mode */}
          {mode === 'QR' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Align the parcel QR code or student pickup pass inside the camera frame.
                </p>
              </div>

              {/* Moderately sized, centered camera preview */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-950">
                  <CameraQrScanner
                    onScanSuccess={handleQrScan}
                    isActive={!verifiedData && !completionSuccess}
                  />
                </div>
              </div>

              {/* Manual token / Parcel ID write-in */}
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Or enter Parcel ID / Token string:
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="e.g. CD-260909-0001 or token"
                    className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#A6192E]"
                  />
                  <button
                    type="button"
                    onClick={() => verifyScannedInput(manualToken)}
                    disabled={!manualToken.trim() || isVerifying}
                    className="px-8 py-3 bg-[#A6192E] hover:bg-[#8F1628] text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer shadow-xs flex items-center justify-center shrink-0 min-h-[44px]"
                  >
                    {isVerifying ? 'Checking...' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OTP Mode */}
          {mode === 'OTP' && (
            <form onSubmit={verifyOtp} className="space-y-6 text-center py-4">
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Enter the 6-digit OTP code sent to student's WhatsApp
                </p>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="• • • • • •"
                    className="w-64 py-3.5 text-center tracking-[0.6em] font-mono text-3xl font-black bg-white border-2 border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:border-[#A6192E] focus:ring-4 focus:ring-[#FBEAEC] shadow-2xs transition-all"
                  />
                </div>
              </div>

              <div className="max-w-md mx-auto pt-2">
                <button
                  type="submit"
                  disabled={otpCode.length !== 6 || isVerifying}
                  className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-[#A6192E] hover:bg-[#8F1628] text-white disabled:opacity-40 transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>{isVerifying ? 'Verifying OTP...' : 'VERIFY OTP'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
