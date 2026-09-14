import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isActive?: boolean;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  onScanError,
  isActive = true,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'reader-container';

  useEffect(() => {
    let qrInstance: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        setCameraError(null);
        qrInstance = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = qrInstance;

        await qrInstance.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Audio beep on successful camera scan
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              osc.type = 'sine';
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.1);
            } catch (e) {
              // Audio context optional
            }

            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            if (onScanError) onScanError(errorMessage);
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        console.error('Camera QR scanner init error:', err);
        setCameraError(err?.message || 'Unable to access device camera. Please check camera permissions.');
        setIsScanning(false);
      }
    };

    if (isActive) {
      startScanner();
    }

    return () => {
      if (qrInstance && qrInstance.isScanning) {
        qrInstance.stop().catch(console.error);
      }
    };
  }, [isActive, onScanSuccess, onScanError]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
      {/* Scanner Viewport */}
      <div id={scannerContainerId} className="w-full h-full max-w-[340px]" />

      {/* Target Aim Reticle Overlay */}
      {isScanning && !cameraError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-56 h-56 border-2 border-dashed border-emerald-400/80 rounded-2xl relative animate-pulse">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
          </div>
          <div className="absolute bottom-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-emerald-300 font-semibold border border-emerald-500/30 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Align Student QR Code inside frame</span>
          </div>
        </div>
      )}

      {/* Error or Permission Denied State */}
      {cameraError && (
        <div className="p-6 text-center text-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <CameraOff className="w-6 h-6" />
          </div>
          <p className="text-xs text-rose-300 max-w-xs">{cameraError}</p>
          <p className="text-[11px] text-slate-400">
            You can enter the token or 6-digit OTP code manually below.
          </p>
        </div>
      )}
    </div>
  );
};
