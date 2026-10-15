import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Purge any stale client-side caches and service workers on boot safely
if (typeof window !== 'undefined') {
  try {
    if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key).catch(() => {}));
      }).catch(() => {});
    }
  } catch {}

  try {
    if (
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      navigator.serviceWorker &&
      typeof navigator.serviceWorker.getRegistrations === 'function'
    ) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    }
  } catch {}
}

interface RootBoundaryProps {
  children: React.ReactNode;
}

interface RootBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<RootBoundaryProps, RootBoundaryState> {
  constructor(props: RootBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RootBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RootErrorBoundary caught fatal exception:', error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.removeItem('hnc_eduhub_active_user_corrupted');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-3xl mb-4 shadow-xl">
            🏆
          </div>
          <h1 className="text-xl font-bold mb-2 tracking-tight">
            HNC Competition Platform
          </h1>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            பக்கத்தை ஏற்றுவதில் தற்காலிக இடையூறு ஏற்பட்டுள்ளது. பக்கத்தை மீண்டும் ஏற்றுவதன் மூலம் தொடரலாம்.
            <br />
            <span className="text-xs text-slate-400 mt-1 inline-block">
              (A temporary display issue occurred. Please click below to refresh the page.)
            </span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition cursor-pointer"
            >
              பக்கத்தை புதுப்பி (Reload Platform)
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                } catch {}
                window.location.href = '/';
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              மீட்டமைத்து தொடங்கு (Reset & Start)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>,
  );
}

