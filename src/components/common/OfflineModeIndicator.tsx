import React, { useState, useEffect, useRef } from 'react';
import {
  WifiOff,
  Wifi,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  getServiceWorkerCacheInfo,
  OfflineStudyMaterial,
  getOfflineMaterialsList,
} from '../../services/studyMaterialsOfflineService';

interface OfflineModeIndicatorProps {
  language?: 'en' | 'ta' | 'si';
  isStudent?: boolean;
  onNavigateStudyHub?: () => void;
  className?: string;
}

export const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({
  language = 'ta',
  isStudent = false,
  onNavigateStudyHub,
  className = '',
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [cachedItems, setCachedItems] = useState<OfflineStudyMaterial[]>([]);
  const [isSwActive, setIsSwActive] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const checkCacheStatus = async () => {
    try {
      const info = await getServiceWorkerCacheInfo();
      setCachedCount(info.cacheCount);
      setCachedItems(info.items);
      setIsSwActive(info.isActive);
    } catch {
      const list = getOfflineMaterialsList();
      setCachedCount(list.length);
      setCachedItems(list);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkCacheStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkCacheStatus();
    };

    const handleCacheUpdated = () => {
      checkCacheStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('hnc_offline_materials_updated', handleCacheUpdated);

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setIsSwActive(true);
        checkCacheStatus();
      });
      if (navigator.serviceWorker.controller) {
        setIsSwActive(true);
      }
    }

    checkCacheStatus();

    // Check periodically
    const interval = setInterval(checkCacheStatus, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hnc_offline_materials_updated', handleCacheUpdated);
      clearInterval(interval);
    };
  }, []);

  const handleScrollToStudyHub = () => {
    setShowModal(false);
    if (onNavigateStudyHub) {
      onNavigateStudyHub();
    }
    setTimeout(() => {
      const el = document.getElementById('offline-study-materials-hub');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Student currently accessing cached study materials condition:
  // Either currently offline, or has cached materials available in service worker cache
  const isCurrentlyOffline = !isOnline;
  const isAccessingCachedMaterials = isCurrentlyOffline && cachedCount > 0;

  return (
    <>
      <div className={`relative inline-flex items-center ${className}`}>
        {/* Offline Mode Active Badge */}
        {isCurrentlyOffline ? (
          <button
            type="button"
            id="btn-header-offline-mode"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer select-none bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400 active:scale-95 animate-pulse"
            title={
              language === 'ta'
                ? `ஆஃப்லைன் பயன்முறை: சேவைப் பணியாளர் கேச் மூலம் ${cachedCount} பாடக் குறிப்புகள் கிடைக்கின்றன.`
                : `Offline Mode: Accessing ${cachedCount} cached study materials via Service Worker.`
            }
          >
            <WifiOff className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span className="font-extrabold whitespace-nowrap">
              {language === 'ta'
                ? 'ஆஃப்லைன் பயன்முறை'
                : language === 'si'
                ? 'නොබැඳි මාදිලිය'
                : 'Offline Mode'}
            </span>
            {cachedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black shrink-0">
                {cachedCount}
              </span>
            )}
          </button>
        ) : (
          /* Online: Service Worker Cache Ready Indicator */
          <button
            type="button"
            id="btn-header-cache-status"
            onClick={() => setShowModal(true)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer select-none border ${
              cachedCount > 0
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title={
              language === 'ta'
                ? `சேவைப் பணியாளர் கேச்: ${cachedCount} ஆஃப்லைன் பாடக் குறிப்புகள் தயார்`
                : `Service Worker Cache: ${cachedCount} materials cached for offline study`
            }
          >
            <div className="relative flex items-center justify-center">
              <HardDrive className={`w-3.5 h-3.5 ${cachedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span
                className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                  cachedCount > 0 ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
            </div>
            <span className="hidden min-[480px]:inline font-semibold">
              {cachedCount > 0
                ? language === 'ta'
                  ? `ஆஃப்லைன் கேச் (${cachedCount})`
                  : `Offline Ready (${cachedCount})`
                : language === 'ta'
                ? 'கேச் தயார்'
                : 'SW Cache'}
            </span>
          </button>
        )}
      </div>

      {/* Interactive Service Worker Cache Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div
            ref={popoverRef}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    isCurrentlyOffline
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {isCurrentlyOffline ? (
                    <WifiOff className="w-5 h-5 text-slate-950" />
                  ) : (
                    <FolderDown className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      {isCurrentlyOffline
                        ? language === 'ta'
                          ? 'ஆஃப்லைன் பயன்முறை இயங்குகிறது'
                          : 'Offline Mode Active'
                        : language === 'ta'
                        ? 'சேவைப் பணியாளர் கேச் நிலை'
                        : 'Service Worker Cache Status'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCurrentlyOffline
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {isCurrentlyOffline ? 'Offline' : 'Online'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isCurrentlyOffline
                      ? language === 'ta'
                        ? 'நீங்கள் தற்போது கேச் செய்யப்பட்ட பாடக் குறிப்புகளைப் பயன்படுத்துகிறீர்கள்.'
                        : 'Currently serving cached study materials from local Service Worker Cache.'
                      : language === 'ta'
                      ? 'இணைய இணைப்பு உள்ளது. பதிவிறக்கிய குறிப்புகள் ஆஃப்லைனிலும் கிடைக்கும்.'
                      : 'Connected online. Downloaded study packs remain ready for offline study.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Service Worker Architecture & Cache Spec */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Service Worker Controller:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isSwActive ? 'Active & Controlling Page' : 'Registered / Ready'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">CacheStorage Bucket:</span>
                  <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    student-study-materials-cache
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Cached Materials:</span>
                  <span className="font-bold text-slate-900">
                    {cachedCount} {language === 'ta' ? 'கோப்புகள் சேமிப்பில்' : 'Items Stored'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Cache Validity:</span>
                  <span className="text-slate-700 font-semibold">60 Days Retained</span>
                </div>
              </div>

              {/* Status Notice */}
              {isCurrentlyOffline ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      {language === 'ta'
                        ? 'இணைய இணைப்பு துண்டிக்கப்பட்டுள்ளது'
                        : 'No Internet Connection Detected'}
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      {language === 'ta'
                        ? 'கவலைப்பட வேண்டாம்! நீங்கள் ஏற்கனவே பதிவிறக்கம் செய்த கணிதம் மற்றும் விஞ்ஞானப் பாடக் குறிப்புகள், அட்டவணைகள் சேவைப் பணியாளர் கேச் மூலம் எவ்விதத் தடையுமின்றி திறக்கப்படும்.'
                        : 'No worries! All study materials and formula sheets previously saved to your device are being loaded seamlessly from your browser cache.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      {language === 'ta'
                        ? 'சேவைப் பணியாளர் ஆஃப்லைன் தயார் நிலையில் உள்ளது'
                        : 'Offline Caching Engine Ready'}
                    </p>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      {language === 'ta'
                        ? 'நீங்கள் பதிவிறக்கும் அனைத்துப் பாடக் குறிப்புகளும் உங்கள் உலாவியில் பாதுகாப்பாக சேமிக்கப்பட்டு ஆஃப்லைனில் படிப்பதற்கு எப்போதும் தயாராக இருக்கும்.'
                        : 'Downloaded study materials are stored in CacheStorage so you can revise anytime without an active internet connection.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Cached Items List Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {language === 'ta'
                        ? `சேமிக்கப்பட்ட பாடங்கள் (${cachedItems.length})`
                        : `Locally Cached Materials (${cachedItems.length})`}
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Offline Capable</span>
                </div>

                {cachedItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                    <HardDrive className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      {language === 'ta'
                        ? 'இன்னும் பாடக் குறிப்புகள் சேமிக்கப்படவில்லை'
                        : 'No Study Materials Cached Yet'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {language === 'ta'
                        ? 'Offline Study Materials Hub சென்று குறிப்புகளைப் பதிவிறக்கவும்.'
                        : 'Visit the Offline Study Materials Hub to download notes and formula sheets for offline use.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {cachedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </h5>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-blue-700">{item.subject}</span>
                            <span>•</span>
                            <span>{item.grade}</span>
                            <span>•</span>
                            <span className="uppercase text-[9px] font-bold text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                              {item.fileType}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                          Cached
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Action Button */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
              >
                {language === 'ta' ? 'மூடுக' : 'Close'}
              </button>

              <button
                type="button"
                id="btn-modal-open-study-hub"
                onClick={handleScrollToStudyHub}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  {language === 'ta'
                    ? 'ஆஃப்லைன் மையத்தைத் திறக்க'
                    : 'Open Offline Study Hub'}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
