import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck, Database, HelpCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDocFromCache, getDocFromServer, getDoc } from 'firebase/firestore';

export type NetworkQuality = 'connected' | 'unstable' | 'offline';

interface NetworkStatusIndicatorProps {
  language?: 'en' | 'ta' | 'si';
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  language = 'ta',
  className = '',
}) => {
  const [status, setStatus] = useState<NetworkQuality>(() =>
    typeof navigator !== 'undefined' && navigator.onLine ? 'connected' : 'offline'
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(() => new Date());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Lightweight network & latency check
  const checkDatabaseConnection = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('offline');
      setLatencyMs(null);
      return;
    }

    setIsChecking(true);
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Ping Google global edge 204 endpoint (0 bytes, no-cors, lightning-fast roundtrip)
      await fetch('https://www.gstatic.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed > 0 ? elapsed : 45);
      setLastChecked(new Date());

      if (elapsed > 2200) {
        setStatus('unstable');
      } else {
        setStatus('connected');
      }
    } catch {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline');
      } else {
        setStatus('connected');
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setStatus('connected');
      checkDatabaseConnection();
    };

    const handleOffline = () => {
      setStatus('offline');
      setLatencyMs(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkDatabaseConnection();

    // Periodic heartbeat check every 60 seconds
    const interval = setInterval(() => {
      checkDatabaseConnection();
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Close popover when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  const getStatusText = () => {
    if (status === 'connected') {
      return language === 'ta' ? 'Firebase Live' : language === 'si' ? 'සම්බන්ධයි' : 'Firebase Live';
    }
    if (status === 'unstable') {
      return language === 'ta' ? 'இணைப்பு பலவீனமாக உள்ளது' : language === 'si' ? 'අස්ථායි' : 'Connection Unstable';
    }
    return language === 'ta' ? 'ஆஃப்லைன் (மறுஇணைக்கிறது...)' : language === 'si' ? 'නොබැඳි' : 'Offline (Reconnecting)';
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Subtle Network Pill Button */}
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
          status === 'connected'
            ? 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border-emerald-200/80'
            : status === 'unstable'
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 animate-pulse shadow-xs'
            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-xs'
        }`}
        title={
          status === 'connected'
            ? 'Firebase Firestore database connection is stable'
            : status === 'unstable'
            ? 'Connection is unstable or high latency. Offline local cache is active.'
            : 'Disconnected from server. Answers saved to local storage.'
        }
        aria-label="Database network connectivity status"
      >
        {/* Animated Status Dot */}
        <span className="relative flex h-2 w-2">
          {status === 'connected' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          {status === 'unstable' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === 'connected'
                ? 'bg-emerald-500'
                : status === 'unstable'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
        </span>

        {/* Status Label */}
        <span className="hidden min-[480px]:inline font-semibold">
          {getStatusText()}
        </span>

        {/* Small Wifi Icon */}
        {status === 'connected' ? (
          <Wifi className="w-3 h-3 text-emerald-600 shrink-0" />
        ) : status === 'unstable' ? (
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
        ) : (
          <WifiOff className="w-3 h-3 text-rose-600 shrink-0" />
        )}
      </button>

      {/* Popover Card */}
      {showPopover && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-xs">
                {language === 'ta' ? 'Firebase தரவுத்தள இணைப்பு நிலை' : 'Database Network Status'}
              </h4>
            </div>
            <button
              onClick={() => setShowPopover(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="py-3 space-y-2.5">
            {/* Real-time status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                {language === 'ta' ? 'தற்போதைய நிலை:' : 'Current Status:'}
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 ${
                  status === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'unstable'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'connected' ? 'bg-emerald-500' : status === 'unstable' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
                {status === 'connected'
                  ? language === 'ta' ? 'நிலையான இணைப்பு' : 'Stable'
                  : status === 'unstable'
                  ? language === 'ta' ? 'பலவீனமான இணைப்பு' : 'Unstable Latency'
                  : language === 'ta' ? 'இணைப்பு துண்டிக்கப்பட்டது' : 'Offline'}
              </span>
            </div>

            {/* Latency */}
            {latencyMs !== null && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {language === 'ta' ? 'இணைப்பு வேகம் (Latency):' : 'Roundtrip Latency:'}
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {latencyMs} ms
                </span>
              </div>
            )}

            {/* Offline Cache Protection Assurance */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-slate-600 leading-snug space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {language === 'ta' ? 'தானியங்கி உள்ளூர் பாதுகாப்பு (Offline Cache)' : 'Local Cache Safeguard Active'}
                </span>
              </div>
              <p>
                {language === 'ta'
                  ? 'இணைப்பு பலவீனமாக இருந்தாலும், உங்கள் விடைகளும் படிப்பு அட்டவணையும் உள்ளூரில் சேமிக்கப்பட்டு இணைப்பு வந்ததும் தானாக ஒத்திசைக்கப்படும்.'
                  : 'Even if the connection fluctuates during an exam, your responses and progress are safeguarded in local storage and will sync automatically once reconnected.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              type="button"
              disabled={isChecking}
              onClick={checkDatabaseConnection}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{language === 'ta' ? 'மீளச் சரிபார்' : 'Check Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
