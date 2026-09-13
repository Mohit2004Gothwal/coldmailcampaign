import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for iframe/browser popup rejections in Firebase Auth
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg =
      reason?.message ||
      (typeof reason === 'string' ? reason : '') ||
      String(reason || '');
    if (
      msg.includes('Pending promise was never set') ||
      msg.includes('auth/popup-closed-by-user') ||
      msg.includes('auth/cancelled-popup-request')
    ) {
      event.preventDefault();
      console.info('[Firebase Auth Notice] Handled popup closure gracefully.');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
