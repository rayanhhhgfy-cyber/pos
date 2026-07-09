export type Language = 'en' | 'ar';

export interface Translations {
  lang: string;
  dir: 'ltr' | 'rtl';

  pos: string;
  inventory: string;
  analytics: string;
  settings: string;

  cart: string;
  cartEmpty: string;
  searchProducts: string;
  scanBarcode: string;
  checkoutPay: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  addDiscount: string;
  clearCart: string;
  price: string;
  cost: string;
  stock: string;
  category: string;
  barcode: string;
  name: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;

  barcodeScanner: string;
  pointCamera: string;
  scanning: string;
  cameraUnavailable: string;
  retry: string;
  toggleCamera: string;

  selectPayment: string;
  cash: string;
  card: string;
  mobilePay: string;
  amountDue: string;
  cashTendered: string;
  changeDue: string;
  completeSale: string;
  saleComplete: string;
  paidVia: string;
  done: string;

  quickAddProduct: string;
  scannedBarcode: string;
  productName: string;
  productPrice: string;
  saveAddToCart: string;
  saving: string;
  cancel: string;

  inventoryManager: string;
  addProduct: string;
  editProduct: string;
  deleteProduct: string;
  deleteConfirm: string;
  deleteWarning: string;
  noProducts: string;
  addFirst: string;
  actions: string;

  analyticsDashboard: string;
  revenueToday: string;
  profitToday: string;
  transactions: string;
  lowStockAlert: string;
  topSelling: string;
  recentSales: string;
  noSales: string;

  storeConfig: string;
  storeName: string;
  currencySymbol: string;
  taxRate: string;
  receiptHeader: string;
  receiptFooter: string;
  saveSettings: string;
  dataManagement: string;
  exportDb: string;
  importDb: string;
  wipeData: string;
  wipeWarning: string;
  wipeConfirm: string;
  typeDelete: string;
  wipeEverything: string;
  wiping: string;
  storage: string;
  storageInfo: string;
  storageDesc: string;
  printReport: string;
  dailyReport: string;
  installApp: string;
  installAppDesc: string;
  install: string;
  importing: string;

  welcome: string;
  configureStore: string;
  next: string;
  skip: string;
  startUsing: string;
  systemOverview: string;
  loadSample: string;
  startFresh: string;
  productsLoaded: string;
  keyboardShortcuts: string;

  search: string;
  close: string;
  print: string;
  save: string;
  delete: string;
  edit: string;
  add: string;
  loading: string;
  noResults: string;
  all: string;
}

const en: Translations = {
  lang: 'English',
  dir: 'ltr',

  pos: 'POS',
  inventory: 'Inventory',
  analytics: 'Analytics',
  settings: 'Settings',

  cart: 'Cart',
  cartEmpty: 'Cart is empty',
  searchProducts: 'Search products... (F2)',
  scanBarcode: 'Scan',
  checkoutPay: 'Checkout & Pay',
  subtotal: 'Subtotal',
  tax: 'Tax',
  discount: 'Discount',
  total: 'Total',
  addDiscount: 'Add discount',
  clearCart: 'Clear cart',
  price: 'Price',
  cost: 'Cost',
  stock: 'Stock',
  category: 'Category',
  barcode: 'Barcode',
  name: 'Name',
  inStock: 'in stock',
  lowStock: 'LOW',
  outOfStock: 'Out of stock',

  barcodeScanner: 'Barcode Scanner',
  pointCamera: 'Point camera at barcode',
  scanning: 'Scanning...',
  cameraUnavailable: 'Camera unavailable',
  retry: 'Retry',
  toggleCamera: 'Toggle camera',

  selectPayment: 'Select Payment',
  cash: 'Cash',
  card: 'Card',
  mobilePay: 'Mobile Pay',
  amountDue: 'Amount Due',
  cashTendered: 'Cash Tendered',
  changeDue: 'Change Due',
  completeSale: 'Complete Sale',
  saleComplete: 'Sale Complete!',
  paidVia: 'paid via',
  done: 'Done',

  quickAddProduct: 'Quick Add Product',
  scannedBarcode: 'Scanned Barcode',
  productName: 'Product Name',
  productPrice: 'Price',
  saveAddToCart: 'Save & Add to Cart',
  saving: 'Saving...',
  cancel: 'Cancel',

  inventoryManager: 'Inventory Manager',
  addProduct: 'Add Product',
  editProduct: 'Edit Product',
  deleteProduct: 'Delete Product',
  deleteConfirm: 'Delete Product?',
  deleteWarning: 'This action cannot be undone.',
  noProducts: 'No products found',
  addFirst: 'Add your first product',
  actions: 'Actions',

  analyticsDashboard: 'Analytics Dashboard',
  revenueToday: 'Revenue Today',
  profitToday: 'Profit Today',
  transactions: 'Transactions',
  lowStockAlert: 'Low Stock Alert',
  topSelling: 'Top 5 Selling Items',
  recentSales: 'Recent Sales',
  noSales: 'No sales recorded yet',

  storeConfig: 'Store Configuration',
  storeName: 'Store / Business Name',
  currencySymbol: 'Currency Symbol',
  taxRate: 'Tax Rate (%)',
  receiptHeader: 'Receipt Header Note',
  receiptFooter: 'Receipt Footer Note',
  saveSettings: 'Save Settings',
  dataManagement: 'Data Management',
  exportDb: 'Export Database (JSON)',
  importDb: 'Import Database (JSON)',
  wipeData: 'Wipe All Data',
  wipeWarning: 'This will permanently delete all products, sales, and settings.',
  wipeConfirm: 'Wipe All Data?',
  typeDelete: 'Type DELETE to confirm:',
  wipeEverything: 'Wipe Everything',
  wiping: 'Wiping...',
  storage: 'Storage',
  storageInfo: 'All data stored locally in IndexedDB.',
  storageDesc: 'Persistent storage prevents automatic clearing.',
  printReport: 'Print Daily Report',
  dailyReport: 'Daily Report',
  installApp: 'Install POS App',
  installAppDesc: 'Install on your device for offline access.',
  install: 'Install',
  importing: 'Importing...',

  welcome: 'Welcome to POS Terminal',
  configureStore: 'Configure your store to get started',
  next: 'Next',
  skip: 'Skip setup',
  startUsing: 'Start Using POS',
  systemOverview: 'System Overview',
  loadSample: 'Seed with 10 Sample Products',
  startFresh: 'Start with empty inventory',
  productsLoaded: 'products loaded!',
  keyboardShortcuts: 'F1=POS F2=Inventory F3=Analytics F4=Scanner F8=Pay',

  search: 'Search',
  close: 'Close',
  print: 'Print',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  loading: 'Loading...',
  noResults: 'No results found',
  all: 'All',
};

const ar: Translations = {
  lang: 'العربية',
  dir: 'rtl',

  pos: 'نقطة البيع',
  inventory: 'المخزون',
  analytics: 'الإحصائيات',
  settings: 'الإعدادات',

  cart: 'السلة',
  cartEmpty: 'السلة فارغة',
  searchProducts: 'بحث المنتجات... (F2)',
  scanBarcode: 'مسح',
  checkoutPay: 'الدفع والإتمام',
  subtotal: 'المجموع الفرعي',
  tax: 'الضريبة',
  discount: 'الخصم',
  total: 'المجموع',
  addDiscount: 'إضافة خصم',
  clearCart: 'تفريغ السلة',
  price: 'السعر',
  cost: 'التكلفة',
  stock: 'المخزون',
  category: 'الفئة',
  barcode: 'الباركود',
  name: 'الاسم',
  inStock: 'متوفر',
  lowStock: 'منخفض',
  outOfStock: 'غير متوفر',

  barcodeScanner: 'ماسح الباركود',
  pointCamera: 'وجّه الكاميرا نحو الباركود',
  scanning: 'جارٍ المسح...',
  cameraUnavailable: 'الكاميرا غير متوفرة',
  retry: 'إعادة المحاولة',
  toggleCamera: 'تبديل الكاميرا',

  selectPayment: 'اختر طريقة الدفع',
  cash: 'نقداً',
  card: 'بطاقة',
  mobilePay: 'جوال',
  amountDue: 'المبلغ',
  cashTendered: 'المبلغ المدفوع',
  changeDue: 'الباقي',
  completeSale: 'إتمام البيع',
  saleComplete: 'تمت المعاملة!',
  paidVia: 'عبر',
  done: 'تم',

  quickAddProduct: 'إضافة منتج سريع',
  scannedBarcode: 'الباركود الممسوح',
  productName: 'اسم المنتج',
  productPrice: 'السعر',
  saveAddToCart: 'حفظ وإضافة للسلة',
  saving: 'جارٍ الحفظ...',
  cancel: 'إلغاء',

  inventoryManager: 'إدارة المخزون',
  addProduct: 'إضافة منتج',
  editProduct: 'تعديل منتج',
  deleteProduct: 'حذف منتج',
  deleteConfirm: 'حذف المنتج؟',
  deleteWarning: 'لا يمكن التراجع عن هذا الإجراء.',
  noProducts: 'لا توجد منتجات',
  addFirst: 'أضف منتجك الأول',
  actions: 'إجراءات',

  analyticsDashboard: 'لوحة الإحصائيات',
  revenueToday: 'إيرادات اليوم',
  profitToday: 'أرباح اليوم',
  transactions: 'المعاملات',
  lowStockAlert: 'مخزون منخفض',
  topSelling: 'أفضل 5 منتجات',
  recentSales: 'آخر المبيعات',
  noSales: 'لا توجد مبيعات بعد',

  storeConfig: 'إعدادات المتجر',
  storeName: 'اسم المتجر',
  currencySymbol: 'رمز العملة',
  taxRate: 'نسبة الضريبة (%)',
  receiptHeader: 'نص رأس الإيصال',
  receiptFooter: 'نص ذيل الإيصال',
  saveSettings: 'حفظ الإعدادات',
  dataManagement: 'إدارة البيانات',
  exportDb: 'تصدير (JSON)',
  importDb: 'استيراد (JSON)',
  wipeData: 'مسح جميع البيانات',
  wipeWarning: 'سيتم حذف جميع المنتجات والمبيعات والإعدادات.',
  wipeConfirm: 'مسح جميع البيانات؟',
  typeDelete: 'اكتب DELETE للتأكيد:',
  wipeEverything: 'مسح الكل',
  wiping: 'جارٍ المسح...',
  storage: 'التخزين',
  storageInfo: 'جميع البيانات مخزنة محلياً.',
  storageDesc: 'تم طلب التخزين الدائم لمنع المسح.',
  printReport: 'طباعة التقرير اليومي',
  dailyReport: 'التقرير اليومي',
  installApp: 'تثبيت التطبيق',
  installAppDesc: 'ثبّت على جهازك للعمل دون اتصال.',
  install: 'تثبيت',
  importing: 'جارٍ الاستيراد...',

  welcome: 'مرحباً في نظام نقاط البيع',
  configureStore: 'قم بإعداد متجرك للبدء',
  next: 'التالي',
  skip: 'تخطي',
  startUsing: 'ابدأ الاستخدام',
  systemOverview: 'نظرة عامة',
  loadSample: 'تحميل 10 منتجات تجريبية',
  startFresh: 'البدء بمخزون فارغ',
  productsLoaded: 'منتج تم تحميلها!',
  keyboardShortcuts: 'F1=نقطة البيع F2=المخزون F3=إحصائيات F4=ماسح F8=دفع',

  search: 'بحث',
  close: 'إغلاق',
  print: 'طباعة',
  save: 'حفظ',
  delete: 'حذف',
  edit: 'تعديل',
  add: 'إضافة',
  loading: 'جارٍ التحميل...',
  noResults: 'لا توجد نتائج',
  all: 'الكل',
};

export const translations = { en: en as Translations, ar: ar as Translations };

export function getTranslation(lang: Language): Translations {
  return translations[lang];
}

export function t(key: keyof Translations, lang: Language): string {
  return translations[lang][key] || key;
}

export function getDir(lang: Language): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}