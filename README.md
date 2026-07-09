# POS Terminal — Ultra-Fast Checkout PWA

Enterprise-grade, offline-first Point of Sale Progressive Web Application. Runs entirely client-side with zero backend dependencies.

## Features

- **High-Speed Checkout** — Split-screen cart + product search with real-time debounced filtering
- **Barcode Scanner** — Dual-mode: hardware USB/Bluetooth scanner (keyboard emulation) + camera-based scanning via `html5-qrcode`
- **Inventory Management** — Full CRUD with low-stock alerts, category auto-suggest, bulk operations
- **Arabic / English RTL** — Full bilingual interface with right-to-left layout support
- **Thermal Receipt Printing** — CSS-driven 58mm/80mm print layout via native print dialog
- **Analytics Dashboard** — Revenue, profit, transaction count, top-selling items, recent sales
- **Offline PWA** — Service worker caching, installable on desktop/mobile via manifest
- **Data Safety** — Export/import JSON backup, indexedDB persistent storage, wipe with confirmation
- **Monetary Precision** — All calculations in integer cents (branded `Cents` type), no floating-point errors

## Tech Stack

React 19 + TypeScript, Vite 6, Tailwind CSS 3, Dexie.js (IndexedDB), Zustand, Lucide React, html5-qrcode

## Getting Started

```bash
npm install
npm run dev     # Dev server at localhost:5173
npm run build   # Production build to dist/
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F1 | POS Checkout |
| F2 | Inventory |
| F3 | Analytics |
| F4 | Camera Scanner |
| F6 | Settings |
| F8 | Checkout / Pay |

## License

MIT