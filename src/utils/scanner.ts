export type BarcodeCallback = (barcode: string) => void;

interface ScannerState {
  buffer: string;
  lastKeyTime: number;
  MIN_INTERVAL: number;
  MAX_BARCODE_LENGTH: number;
}

const state: ScannerState = {
  buffer: '',
  lastKeyTime: 0,
  MIN_INTERVAL: 20,
  MAX_BARCODE_LENGTH: 48,
};

const SCANNER_THRESHOLD = 50;
const SCANNER_BUFFER_TIMEOUT = 100;

let callback: BarcodeCallback | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function setScannerCallback(cb: BarcodeCallback | null): void {
  callback = cb;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName;
  const role = el.getAttribute('role');
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.getAttribute('contenteditable') === 'true') return true;
  if (role === 'textbox' || role === 'searchbox') return true;
  return false;
}

export function handleScannerKeydown(e: KeyboardEvent): boolean {
  if (isInputFocused()) return false;

  const now = performance.now();
  const elapsed = now - state.lastKeyTime;

  if (elapsed > SCANNER_THRESHOLD && state.buffer.length > 0) {
    state.buffer = '';
  }

  state.lastKeyTime = now;

  if (e.key === 'Enter') {
    if (state.buffer.length >= 4 && state.buffer.length <= state.MAX_BARCODE_LENGTH) {
      const barcode = state.buffer;
      state.buffer = '';
      if (callback) {
        e.preventDefault();
        callback(barcode);
        return true;
      }
    }
    state.buffer = '';
    return false;
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    state.buffer += e.key;

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (state.buffer.length > 4) {
        const fullBarcode = state.buffer;
        state.buffer = '';
        if (callback) {
          callback(fullBarcode);
        }
      } else {
        state.buffer = '';
      }
    }, SCANNER_BUFFER_TIMEOUT);

    return true;
  }

  return false;
}

export function registerGlobalScanner(): () => void {
  const handler = (e: KeyboardEvent) => {
    handleScannerKeydown(e);
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}