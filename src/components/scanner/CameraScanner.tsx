import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useUIStore } from '../../stores/uiStore';
import { X, Camera, CameraOff, RotateCw } from 'lucide-react';

function CameraScanner() {
  const closeModal = useUIStore((s) => s.closeModal);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'camera-scanner-container';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    try {
      await stopScanner();
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      };

      await scanner.start(
        { facingMode },
        config,
        (decodedText) => {
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          const cb = (window as any).__barcodeScanned;
          if (typeof cb === 'function') {
            cb(decodedText);
          }
          closeModal();
        },
        () => {
          /* keep scanning */
        }
      );
      setScanning(true);
    } catch (err: any) {
      setError(err?.message || 'Camera access denied or not available');
      setScanning(false);
    }
  }, [facingMode, closeModal]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(startScanner, 300);
  };

  const scannerId = 'camera-scanner-container';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-lg mx-4 card-panel overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#a1a1aa]" />
            <span className="text-sm font-bold text-[#f4f4f5]">Barcode Scanner</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCamera}
              className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors"
              title="Toggle camera"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                stopScanner();
                closeModal();
              }}
              className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scanner View */}
        <div className="relative bg-black">
          <div
            id={scannerId}
            className="w-full aspect-[4/3] bg-black"
          />
          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-center p-6">
              <CameraOff className="w-10 h-10 text-[#a1a1aa] mb-3" />
              <p className="text-sm text-[#a1a1aa] mb-1">Camera unavailable</p>
              <p className="text-xs text-[#52525b] mb-3">{error}</p>
              <button
                onClick={startScanner}
                className="btn-secondary text-xs"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#27272a] text-center">
          <p className="text-xs text-[#a1a1aa]">
            Point the camera at a barcode to scan
            {scanning && (
              <span className="text-[#34d399] ml-2">● Scanning...</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CameraScanner;