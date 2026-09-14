import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  parcelId?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  parcelId,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-200/80 shadow-md">
      <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-100">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={false}
        />
      </div>
      {parcelId && (
        <div className="mt-3 text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Parcel ID</span>
          <p className="font-mono text-sm font-black text-slate-900">{parcelId}</p>
        </div>
      )}
    </div>
  );
};
