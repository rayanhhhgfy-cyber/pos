import { useEffect, useRef } from 'react';
import { setScannerCallback, registerGlobalScanner } from '../../utils/scanner';

interface ScannerProviderProps {
  children: React.ReactNode;
  onBarcode: (barcode: string) => void;
}

function ScannerProvider({ children, onBarcode }: ScannerProviderProps) {
  const callbackRef = useRef(onBarcode);
  callbackRef.current = onBarcode;

  useEffect(() => {
    const cleanupListener = registerGlobalScanner();

    setScannerCallback((barcode) => {
      callbackRef.current(barcode);
    });

    return () => {
      cleanupListener();
      setScannerCallback(null);
    };
  }, []);

  useEffect(() => {
    (window as any).__barcodeScanned = (barcode: string) => {
      callbackRef.current(barcode);
    };
    return () => {
      delete (window as any).__barcodeScanned;
    };
  }, []);

  return <>{children}</>;
}

export default ScannerProvider;