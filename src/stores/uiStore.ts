import { create } from 'zustand';

export type TabId = 'pos' | 'inventory' | 'analytics' | 'settings';

type ModalType =
  | 'none'
  | 'checkout'
  | 'camera_scanner'
  | 'quick_add_product'
  | 'edit_product'
  | 'add_product'
  | 'parked_carts'
  | 'receipt'
  | 'checkout_options';

interface UIState {
  activeTab: TabId;
  searchQuery: string;
  categoryFilter: string;
  activeModal: ModalType;
  modalData: Record<string, unknown>;
  cameraOpen: boolean;
  scannerMode: 'hardware' | 'camera' | 'off';
  showReceipt: boolean;

  setActiveTab: (tab: TabId) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (cat: string) => void;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  setCameraOpen: (open: boolean) => void;
  setScannerMode: (mode: UIState['scannerMode']) => void;
  setShowReceipt: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'pos',
  searchQuery: '',
  categoryFilter: '',
  activeModal: 'none',
  modalData: {},
  cameraOpen: false,
  scannerMode: 'hardware',
  showReceipt: false,

  setActiveTab: (tab) => set({ activeTab: tab, searchQuery: '', categoryFilter: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),
  openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: 'none', modalData: {} }),
  setCameraOpen: (open) => set({ cameraOpen: open }),
  setScannerMode: (mode) => set({ scannerMode: mode }),
  setShowReceipt: (show) => set({ showReceipt: show }),
}));