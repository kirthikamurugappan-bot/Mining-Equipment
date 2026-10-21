import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem'
              }
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register PWA Service Worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('MineTrack PWA Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.warn('Service Worker registration skipped:', err);
    });
  });
}
