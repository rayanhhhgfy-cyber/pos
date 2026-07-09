import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { requestPersistentStorage } from './utils/persist';
import { useLangStore } from './stores/langStore';

requestPersistentStorage().then((persisted) => {
  if (persisted) {
    console.log('[POS] Persistent storage granted');
  } else {
    console.warn('[POS] Persistent storage denied — data may be cleared under storage pressure');
  }
});

const savedLang = (localStorage.getItem('pos-lang') as 'en' | 'ar') || 'en';
useLangStore.getState().setLang(savedLang);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);