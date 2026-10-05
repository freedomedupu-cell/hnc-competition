import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DbAdvertisement } from '../../types';
import { getMediaFromIndexedDB } from '../../utils/mediaStorage';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Tag,
  Settings,
  Coffee,
  ShoppingBag,
  Terminal,
  Activity,
  Database,
  RefreshCw,
  Image as ImageIcon,
  Maximize2,
  X,
} from 'lucide-react';

const DEFAULT_FALLBACK_ADS: DbAdvertisement[] = [];

export const DynamicAdBillboard: React.FC = () => {
  const {
    advertisements,
    recordAdClick,
    currentAuthUser,
    setSuperAdminNav,
    setAdminNav,
    language,
  } = useApp();

  // 1. ALL useState hooks declared together at the top
  const [activeIndex, setActiveIndex] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showDiagnosticPanel, setShowDiagnosticPanel] = useState(false);
  const [diagnosticTimestamp, setDiagnosticTimestamp] = useState<string>(() => new Date().toISOString());
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);

  // Filter ONLY real active ads from Firestore
  const activeAds = (advertisements || []).filter(
    (a) => a && a.status === 'active' && (a.targetAudience === 'all' || a.targetAudience === 'students')
  );

  const isSuperAdminOrAdmin =
    currentAuthUser?.role === 'super_admin' || currentAuthUser?.role === 'admin';

  // For Admin preview: show all real ads in database; for students: only active real ads
  const displayAds = isSuperAdminOrAdmin
    ? (advertisements || []).filter(Boolean)
    : activeAds;

  const currentAd = displayAds.length > 0 ? displayAds[activeIndex % displayAds.length] : null;

  // 2. ALL useEffect hooks declared after all useState hooks
  useEffect(() => {
    const timestamp = new Date().toISOString();
    setDiagnosticTimestamp(timestamp);

    const logPayload = {
      operation: 'FETCH_ADVERTISEMENTS',
      component: 'DynamicAdBillboard (Student Dashboard)',
      firestoreDb: 'ai-studio-hnceduhub-87cf124f-0cc7-41e5-bd50-84681e12383b',
      collection: 'advertisements',
      syncStatus: (advertisements || []).length > 0 ? 'REALTIME_FIRESTORE_SYNCED' : 'NO_ADS_IN_DATABASE',
      totalLoadedInState: (advertisements || []).length,
      activeFilteredForStudent: activeAds.length,
      renderingCount: displayAds.length,
      timestamp,
      documents: (advertisements || []).map((ad) => ({
        id: ad?.id || 'unknown',
        brandName: ad?.brandName || 'Sponsor',
        title: ad?.title || '',
        status: ad?.status || 'active',
        mediaType: ad?.mediaType || (ad?.videoUrl ? 'video' : 'image'),
        hasVideoUrl: Boolean(ad?.videoUrl),
        hasImageUrl: Boolean(ad?.imageUrl),
        clicksCount: ad?.clicksCount || 0,
      })),
    };

    console.group(`🔍 [STUDENT_DASHBOARD_DIAGNOSTIC] Advertisement Sync Status (${timestamp})`);
    console.log('Sync Summary:', logPayload);
    console.table(logPayload.documents);
    console.groupEnd();
  }, [(advertisements || []).length, activeAds.length, displayAds.length]);

  // Auto slide every 8 seconds if multiple ads exist
  useEffect(() => {
    if (displayAds.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayAds.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [displayAds.length]);

  // Reset active photo index when active ad changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [currentAd?.id]);

  // Auto-slide between photos every 3.5 seconds if current ad has multiple photos (>2 photos)
  useEffect(() => {
    const gallery = currentAd?.galleryImages;
    if (!gallery || gallery.length <= 1) return;
    const interval = setInterval(() => {
      setActivePhotoIndex((prev) => (prev + 1) % gallery.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentAd?.id, currentAd?.galleryImages?.length]);

  useEffect(() => {
    let isMounted = true;
    const resolveMedia = async () => {
      if (!currentAd) return;
      try {
        // 1. Resolve Video
        if (
          currentAd.videoUrl?.startsWith('local-media:') ||
          (!currentAd.videoUrl && currentAd.mediaType === 'video')
        ) {
          const localVid = await getMediaFromIndexedDB(`ad_video_${currentAd.id}`);
          if (isMounted) setResolvedVideoUrl(localVid || null);
        } else {
          if (isMounted) setResolvedVideoUrl(currentAd.videoUrl || null);
        }

        // 2. Resolve Image
        if (currentAd.imageUrl?.startsWith('local-media:')) {
          const localImg = await getMediaFromIndexedDB(`ad_image_${currentAd.id}`);
          if (isMounted) setResolvedImageUrl(localImg || null);
        } else {
          if (isMounted) setResolvedImageUrl(currentAd.imageUrl || null);
        }
      } catch {
        if (isMounted) {
          setResolvedVideoUrl(currentAd.videoUrl || null);
          setResolvedImageUrl(currentAd.imageUrl || null);
        }
      }
    };

    resolveMedia();
    return () => {
      isMounted = false;
    };
  }, [currentAd?.id, currentAd?.videoUrl, currentAd?.imageUrl, currentAd?.mediaType, currentAd?.brandName]);

  const handleCopyPromo = (code: string) => {
    try {
      navigator.clipboard?.writeText(code);
    } catch {}
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleActionClick = (ad: DbAdvertisement) => {
    try {
      recordAdClick(ad.id);
    } catch {}
    if (ad.actionUrl) {
      window.open(ad.actionUrl, '_blank', 'noopener,noreferrer');
    } else if (ad.menuItems && ad.menuItems.length > 0) {
      setShowMenuDropdown((prev) => !prev);
    }
  };

  const handleManageAds = () => {
    if (currentAuthUser?.role === 'super_admin') {
      setSuperAdminNav('Sponsors & Ads');
    } else if (currentAuthUser?.role === 'admin') {
      setAdminNav('Sponsors & Ads');
    }
  };

  if (displayAds.length === 0 || !currentAd) {
    return null;
  }

  const mediaSource = resolvedVideoUrl || currentAd.videoUrl;
  const imageSource = resolvedImageUrl || currentAd.imageUrl;
  const gallery = currentAd.galleryImages && currentAd.galleryImages.length > 0
    ? currentAd.galleryImages
    : (imageSource ? [imageSource] : []);
  const currentPhotoSrc = gallery[activePhotoIndex % gallery.length] || imageSource || '';

  return (
    <div
      id="student-billboard-ad-banner"
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 text-white shadow-xl border-2 border-amber-500/40 p-4 sm:p-6 mb-4 sm:mb-6 transition-all duration-300 ring-1 ring-amber-400/20"
    >
      {/* Background Subtle Ambient Glows */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Tag */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-500/25">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-amber-400/40 flex items-center gap-1 shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>{currentAd.badgeText || (language === 'ta' ? 'அதிகாரப்பூர்வ விளம்பரம்' : 'Official Sponsor')}</span>
          </span>

          <span className="text-xs font-bold text-amber-200/90 truncate">
            {currentAd.brandName}
          </span>

          {gallery.length > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-amber-400" />
              <span>
                {language === 'ta' ? `${gallery.length} படங்கள்` : `${gallery.length} Photos`}
              </span>
            </span>
          )}

          {currentAd.status === 'inactive' && isSuperAdminOrAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-red-900/60 text-red-200 text-[10px] font-bold border border-red-500/40">
              Admin Preview: Inactive Draft
            </span>
          )}
        </div>

        {/* Diagnostic Log & Admin Manage Action Bar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowDiagnosticPanel((prev) => !prev)}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
            title="Inspect Firestore advertisement fetch diagnostic logs"
          >
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">
              {showDiagnosticPanel ? 'Hide Diagnostic Log' : '🔍 Diagnostic Log'}
            </span>
          </button>

          {isSuperAdminOrAdmin && (
            <button
              type="button"
              onClick={handleManageAds}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              title="Create or edit billboard ads for students"
            >
              <Settings className="w-3 h-3 text-amber-300" />
              <span className="hidden sm:inline">
                {language === 'ta' ? 'விளம்பரம் மேலாண்மை' : 'Manage Ads'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        {/* Left Column: Details */}
        <div className="flex-1 space-y-2 text-center md:text-left w-full">
          {currentAd.tagline && (
            <span className="inline-block text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300">
              {currentAd.tagline}
            </span>
          )}

          <h2 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight">
            {currentAd.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-2xl">
            {currentAd.description}
          </p>

          {/* Mini Thumbnail Row for Multi-Photo Sponsors */}
          {gallery.length > 1 && (
            <div className="pt-1 flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
              <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider flex items-center gap-1 mr-1">
                <ImageIcon className="w-3 h-3 text-amber-400" />
                <span>{language === 'ta' ? 'படங்கள்:' : 'Photos:'}</span>
              </span>
              {gallery.map((gImg, gIdx) => (
                <button
                  key={gIdx}
                  type="button"
                  onClick={() => setActivePhotoIndex(gIdx)}
                  className={`relative w-8 h-6 rounded-md overflow-hidden border transition cursor-pointer shrink-0 ${
                    gIdx === activePhotoIndex % gallery.length
                      ? 'border-amber-400 ring-2 ring-amber-400/70 scale-110 shadow-md'
                      : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  title={`View Photo #${gIdx + 1}`}
                >
                  <img src={gImg} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Promo Code & Action Button Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-center md:justify-start flex-wrap">
            {currentAd.promoCode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 rounded-xl border border-amber-400/40 text-xs font-mono font-bold text-amber-300">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>CODE: {currentAd.promoCode}</span>
                <button
                  type="button"
                  onClick={() => handleCopyPromo(currentAd.promoCode!)}
                  className="ml-1.5 p-1 rounded hover:bg-white/10 text-slate-200 transition cursor-pointer"
                  title="Copy Promo Code"
                >
                  {copiedCode === currentAd.promoCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleActionClick(currentAd)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>{currentAd.actionButtonText || (language === 'ta' ? 'மேலும் விவரங்கள் ➔' : 'Explore Offer ➔')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {currentAd.menuItems && currentAd.menuItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMenuDropdown((prev) => !prev)}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-amber-200 font-bold rounded-xl text-xs border border-amber-400/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {showMenuDropdown
                    ? language === 'ta' ? 'பட்டியலை மறைக்க' : 'Hide Menu'
                    : language === 'ta' ? 'மெனு பார்க்க (4 உணவுகள்)' : `View Menu (${currentAd.menuItems.length} items)`}
                </span>
              </button>
            )}
          </div>

          {/* Optional Featured Menu Items Pills */}
          {showMenuDropdown && currentAd.menuItems && currentAd.menuItems.length > 0 && (
            <div className="mt-3 p-3 rounded-2xl bg-black/60 border border-amber-400/30 text-left space-y-2 animate-in fade-in duration-200">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                ☕ {currentAd.brandName} Student Specials:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentAd.menuItems.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{item.name}</span>
                      {item.description && <span className="text-[10px] text-slate-400">{item.description}</span>}
                    </div>
                    <span className="text-amber-400 font-bold ml-2 shrink-0">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: High-Res Image, Multi-Photo Carousel, or Video Banner */}
        {(mediaSource || imageSource || gallery.length > 0) && (
          <div className="w-full sm:w-56 lg:w-64 h-36 sm:h-40 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-lg shrink-0 relative group bg-slate-950 flex items-center justify-center">
            {currentAd.mediaType === 'video' || mediaSource ? (
              <video
                src={mediaSource || imageSource}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="relative w-full h-full cursor-pointer overflow-hidden"
                onClick={() => setLightboxPhoto(currentPhotoSrc)}
                title="Click to enlarge photo"
              >
                <img
                  src={currentPhotoSrc}
                  alt={currentAd.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                {/* Multi-Photo Counter Overlay */}
                {gallery.length > 1 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-amber-300 text-[10px] font-black border border-amber-400/30 flex items-center gap-1 z-10 shadow">
                    <ImageIcon className="w-3 h-3 text-amber-400" />
                    <span>
                      {(activePhotoIndex % gallery.length) + 1} / {gallery.length}
                    </span>
                  </div>
                )}

                {/* Next / Previous Arrow Controls */}
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex(
                          (prev) => (prev - 1 + gallery.length) % gallery.length
                        );
                      }}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/70 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer shadow"
                      title="Previous Photo"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex((prev) => (prev + 1) % gallery.length);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/70 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer shadow"
                      title="Next Photo"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {/* Pagination Dots at bottom */}
                {gallery.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 z-10 pointer-events-auto">
                    {gallery.map((_, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex(pIdx);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          pIdx === activePhotoIndex % gallery.length
                            ? 'w-4 bg-amber-400'
                            : 'w-1.5 bg-white/50 hover:bg-white/80'
                        }`}
                        title={`Go to photo ${pIdx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Enlarge Hint Icon */}
                <div className="absolute bottom-2 right-2 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition z-10">
                  <Maximize2 className="w-3 h-3 text-amber-300" />
                </div>
              </div>
            )}
            {currentAd.discountPercentage && (
              <div className="absolute top-2 right-2 bg-red-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-md z-10 pointer-events-none">
                {currentAd.discountPercentage}% OFF
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL FOR MULTI-PHOTO ADS */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-3xl border border-amber-500/40 p-4 space-y-3 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                  {currentAd.brandName}
                </span>
                <span className="text-white font-bold text-sm truncate">{currentAd.title}</span>
                {gallery.length > 1 && (
                  <span className="text-amber-400 font-mono text-xs">
                    ({(activePhotoIndex % gallery.length) + 1} / {gallery.length})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={lightboxPhoto}
                alt="Enlarged Sponsor Photo"
                className="w-full h-full object-contain"
              />

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (activePhotoIndex - 1 + gallery.length) % gallery.length;
                      setActivePhotoIndex(nextIdx);
                      setLightboxPhoto(gallery[nextIdx]);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black text-white cursor-pointer shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (activePhotoIndex + 1) % gallery.length;
                      setActivePhotoIndex(nextIdx);
                      setLightboxPhoto(gallery[nextIdx]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black text-white cursor-pointer shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail selector */}
            {gallery.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pt-2">
                {gallery.map((gImg, gIdx) => (
                  <button
                    key={gIdx}
                    type="button"
                    onClick={() => {
                      setActivePhotoIndex(gIdx);
                      setLightboxPhoto(gImg);
                    }}
                    className={`relative w-14 h-10 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                      gImg === lightboxPhoto
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={gImg} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide Navigation Controls */}
      {displayAds.length > 1 && (
        <div className="relative z-10 flex items-center justify-between pt-3 mt-3 border-t border-amber-500/25 text-xs text-amber-200">
          <div className="flex items-center gap-1.5">
            {displayAds.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === activeIndex % displayAds.length
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) => (prev - 1 + displayAds.length) % displayAds.length)
              }
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Previous Ad"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1 font-bold">
              {(activeIndex % displayAds.length) + 1} / {displayAds.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev + 1) % displayAds.length)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Next Ad"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Diagnostic Log & Real-Time Sync Inspector Panel */}
      {showDiagnosticPanel && (
        <div className="relative z-20 mt-4 p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/50 text-slate-200 text-xs font-mono shadow-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-emerald-400 uppercase tracking-wider text-[11px]">
                [DIAGNOSTIC LOG] Firestore Advertisement Fetch & Client Sync State
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">
              Synced: {diagnosticTimestamp}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Collection Path</span>
              <span className="font-bold text-amber-300">/advertisements</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Firestore DB ID</span>
              <span className="font-bold text-blue-300 truncate block">ai-studio-hnceduhub-...</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">State Documents</span>
              <span className="font-bold text-emerald-400">{advertisements.length} loaded</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Active Filtered Ads</span>
              <span className="font-bold text-amber-400">{activeAds.length} active</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider block">
              Synced Document Payload Snapshot ({displayAds.length} items currently in rotation):
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {displayAds.map((ad, idx) => (
                <div
                  key={ad.id || idx}
                  className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-amber-200 shrink-0">{ad.brandName}</span>
                    <span className="text-slate-300 truncate">{ad.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Type: {ad.mediaType || (ad.videoUrl ? 'video' : 'image')}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded font-bold ${ad.status === 'active' ? 'bg-emerald-900/60 text-emerald-200' : 'bg-red-900/60 text-red-200'}`}>
                      {ad.status}
                    </span>
                    <span className="text-slate-400">Clicks: {ad.clicksCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>
              ✓ Listener mode: Realtime Firestore Snapshot (`onSnapshot`). All mutations on Super Admin panel sync instantly.
            </span>
            <button
              type="button"
              onClick={() => setShowDiagnosticPanel(false)}
              className="text-slate-400 hover:text-white font-bold underline cursor-pointer"
            >
              Close Diagnostic Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
