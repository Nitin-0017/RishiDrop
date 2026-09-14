import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './Modal';
import { Printer, Copy, Check, Package, MapPin, User, Tag, ShieldCheck } from 'lucide-react';

export interface ParcelQrData {
  parcelId: string;
  qrToken?: string | null;
  qrPayload?: string | null;
  studentName: string;
  studentRoll?: string | null;
  studentPhone?: string | null;
  partnerName: string;
  partnerColor?: string | null;
  trackingNumber?: string | null;
  storageSlot?: string | null;
  rackName?: string | null;
  slotNumber?: string | null;
  receivedAt?: string | null;
  receivedByGuard?: string | null;
}

interface ParcelQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: ParcelQrData | null;
}

export const ParcelQrModal: React.FC<ParcelQrModalProps> = ({
  isOpen,
  onClose,
  parcel,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!parcel) return null;

  // The QR string to encode: formatted JSON with campusdrop_parcel type
  const qrString = parcel.qrPayload || JSON.stringify({
    type: 'campusdrop_parcel',
    parcelId: parcel.parcelId,
    token: parcel.qrToken || parcel.parcelId,
  });

  const handleCopyToken = () => {
    const tokenToCopy = parcel.qrToken || parcel.parcelId;
    navigator.clipboard.writeText(tokenToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const svgElement = printRef.current?.querySelector('svg');
    const svgHtml = svgElement ? svgElement.outerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RishiDrop Parcel Label - ${parcel.parcelId}</title>
          <style>
            @page {
              size: 4in 3in;
              margin: 0.2in;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 12px;
              color: #0f172a;
              background: #ffffff;
            }
            .label-card {
              border: 2px dashed #94a3b8;
              border-radius: 12px;
              padding: 14px;
              display: flex;
              flex-direction: column;
              height: 92%;
              box-sizing: border-box;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #A6192E;
              padding-bottom: 6px;
              margin-bottom: 10px;
            }
            .brand {
              font-size: 14px;
              font-weight: 900;
              color: #A6192E;
              letter-spacing: 0.5px;
            }
            .sub-brand {
              font-size: 9px;
              color: #64748b;
              text-transform: uppercase;
            }
            .badge {
              background: #f1f5f9;
              padding: 2px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 700;
              border: 1px solid #cbd5e1;
            }
            .content {
              display: flex;
              gap: 14px;
              align-items: center;
              flex: 1;
            }
            .qr-box {
              flex-shrink: 0;
              background: white;
              padding: 6px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            .details {
              flex: 1;
              font-size: 11px;
              line-height: 1.35;
            }
            .field-label {
              font-size: 8px;
              text-transform: uppercase;
              font-weight: 800;
              color: #64748b;
              letter-spacing: 0.5px;
            }
            .parcel-id {
              font-family: monospace;
              font-size: 15px;
              font-weight: 900;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .student-name {
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
            }
            .student-roll {
              font-size: 10px;
              font-weight: 600;
              color: #475569;
              margin-bottom: 4px;
            }
            .location-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 4px 8px;
              margin-top: 6px;
              font-weight: 800;
              color: #A6192E;
              font-size: 11px;
            }
            .footer {
              font-size: 8px;
              color: #94a3b8;
              text-align: center;
              margin-top: 8px;
              border-top: 1px solid #f1f5f9;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">
              <div>
                <div class="brand">RISHIDROP</div>
                <div class="sub-brand">Rishihood University • Security Gate Hub</div>
              </div>
              <div class="badge">${parcel.partnerName}</div>
            </div>
            <div class="content">
              <div class="qr-box">
                ${svgHtml}
              </div>
              <div class="details">
                <div class="field-label">Parcel Identifier</div>
                <div class="parcel-id">${parcel.parcelId}</div>
                <div class="field-label">Student Recipient</div>
                <div class="student-name">${parcel.studentName}</div>
                <div class="student-roll">${parcel.studentRoll || 'Campus Student'}</div>
                <div class="location-box">
                  📍 ${parcel.storageSlot || (parcel.rackName ? `${parcel.rackName} • Slot ${parcel.slotNumber}` : 'Hub Storage')}
                </div>
              </div>
            </div>
            <div class="footer">
              Scan this QR with the Guard Handover Scanner to complete student pickup verification.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const slotDisplay = parcel.storageSlot || (parcel.rackName ? `${parcel.rackName} — Slot ${parcel.slotNumber}` : 'Storage Slot');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Parcel QR Pass & Print Slip"
      subtitle={`Official scannable QR pass for parcel #${parcel.parcelId}`}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Printable Label Preview Box */}
        <div
          ref={printRef}
          className="relative bg-gradient-to-b from-white to-slate-50/50 rounded-2xl border-2 border-dashed border-slate-300 p-5 shadow-inner"
        >
          {/* Header strip */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#A6192E] flex items-center justify-center text-white shadow-xs">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wider text-[#A6192E] uppercase">RishiDrop • Rishihood</div>
                <div className="text-[10px] text-slate-500 font-medium">Main Gate Delivery Hub</div>
              </div>
            </div>
            <span
              className="px-2.5 py-1 text-xs font-bold rounded-lg border"
              style={{
                backgroundColor: parcel.partnerColor ? `${parcel.partnerColor}15` : '#f1f5f9',
                borderColor: parcel.partnerColor ? `${parcel.partnerColor}40` : '#cbd5e1',
                color: parcel.partnerColor || '#334155'
              }}
            >
              {parcel.partnerName}
            </span>
          </div>

          {/* Core Body: QR Code + Parcel Meta */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pt-4">
            {/* Real dynamic QR code */}
            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
              <QRCodeSVG
                value={qrString}
                size={160}
                level="M"
                includeMargin={false}
              />
              <div className="text-[9px] text-center text-slate-400 font-mono mt-1.5 font-bold uppercase">
                Scannable QR
              </div>
            </div>

            {/* Details Column */}
            <div className="space-y-2.5 flex-1 w-full text-left">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#A6192E]" /> Parcel ID
                </span>
                <div className="font-mono text-base font-black text-slate-900">{parcel.parcelId}</div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#A6192E]" /> Student Recipient
                </span>
                <div className="text-sm font-bold text-slate-900">{parcel.studentName}</div>
                {parcel.studentRoll && (
                  <div className="text-xs font-medium text-slate-500">{parcel.studentRoll}</div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#A6192E]" /> Storage Location
                </span>
                <div className="inline-flex items-center px-2.5 py-1 bg-red-50 text-[#A6192E] font-black text-xs rounded-md border border-red-200">
                  {slotDisplay}
                </div>
              </div>

              {parcel.trackingNumber && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Tracking No.
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-700">{parcel.trackingNumber}</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer security note */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Unique Parcel Token
            </span>
            <span className="font-mono text-[9px] text-slate-500 font-bold truncate max-w-[150px]">
              {parcel.qrToken || parcel.parcelId}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCopyToken}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs shadow-xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied Token</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Token</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs shadow-xs transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A6192E] hover:bg-[#8F1628] text-white font-bold text-xs shadow-sm shadow-red-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print QR Label</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
