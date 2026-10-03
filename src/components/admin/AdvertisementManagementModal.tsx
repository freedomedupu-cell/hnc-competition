import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Tag,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Video,
  Image as ImageIcon,
  Play,
  Film,
} from 'lucide-react';
import { DbAdvertisement } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  compressImageFile,
  extractVideoThumbnail,
} from '../../utils/mediaStorage';

interface AdvertisementManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  adToEdit?: DbAdvertisement | null;
}

export const AdvertisementManagementModal: React.FC<AdvertisementManagementModalProps> = ({
  isOpen,
  onClose,
  adToEdit,
}) => {
  const { saveAdvertisement, currentAuthUser, language } = useApp();

  const [brandName, setBrandName] = useState(adToEdit?.brandName || '');
  const [title, setTitle] = useState(adToEdit?.title || '');
  const [tagline, setTagline] = useState(adToEdit?.tagline || '');
  const [description, setDescription] = useState(adToEdit?.description || '');
  const [badgeText, setBadgeText] = useState(adToEdit?.badgeText || 'Featured Sponsor');
  const [category, setCategory] = useState(adToEdit?.category || 'Education & Sponsor');

  // Media Type & Media URLs
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    adToEdit?.mediaType || (adToEdit?.videoUrl ? 'video' : 'image')
  );
  const [imageUrl, setImageUrl] = useState(adToEdit?.imageUrl || '');
  const [videoUrl, setVideoUrl] = useState(adToEdit?.videoUrl || '');

  const [promoCode, setPromoCode] = useState(adToEdit?.promoCode || '');
  const [discountPercentage, setDiscountPercentage] = useState<number>(adToEdit?.discountPercentage || 0);
  const [actionButtonText, setActionButtonText] = useState(adToEdit?.actionButtonText || 'Explore Offer');
  const [actionUrl, setActionUrl] = useState(adToEdit?.actionUrl || '');
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'admins'>(adToEdit?.targetAudience || 'students');
  const [status, setStatus] = useState<'active' | 'inactive'>(adToEdit?.status || 'active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when adToEdit changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setBrandName(adToEdit?.brandName || '');
      setTitle(adToEdit?.title || '');
      setTagline(adToEdit?.tagline || '');
      setDescription(adToEdit?.description || '');
      setBadgeText(adToEdit?.badgeText || 'Featured Sponsor');
      setCategory(adToEdit?.category || 'Education & Sponsor');
      setMediaType(adToEdit?.mediaType || (adToEdit?.videoUrl ? 'video' : 'image'));
      setImageUrl(adToEdit?.imageUrl || '');
      setVideoUrl(adToEdit?.videoUrl || '');
      setPromoCode(adToEdit?.promoCode || '');
      setDiscountPercentage(adToEdit?.discountPercentage || 0);
      setActionButtonText(adToEdit?.actionButtonText || 'Explore Offer');
      setActionUrl(adToEdit?.actionUrl || '');
      setTargetAudience(adToEdit?.targetAudience || 'students');
      setStatus(adToEdit?.status || 'active');
      setErrorMsg(null);
    }
  }, [adToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle Photo File Upload with client-side downscaling and compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setUploadLoading(true);
    setErrorMsg(null);

    try {
      // Downscale and compress image to stay safely under 100KB
      const compressedDataUrl = await compressImageFile(file, 1200, 700, 0.75);
      setImageUrl(compressedDataUrl);
      setMediaType('image');
    } catch (err) {
      console.warn('Image compression fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
        setMediaType('image');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle Video File Upload with automatic poster thumbnail extraction
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file (MP4, WebM).');
      return;
    }

    setUploadLoading(true);
    setErrorMsg(null);

    try {
      // 1. Generate lightweight poster frame so image fallback is available
      const posterThumb = await extractVideoThumbnail(file);
      if (posterThumb && !imageUrl) {
        setImageUrl(posterThumb);
      }

      // 2. Read video data URL safely
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setVideoUrl(dataUrl);
        setMediaType('video');
        setUploadLoading(false);
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read video file.');
        setUploadLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Video upload error:', err);
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !title.trim() || !description.trim()) {
      setErrorMsg(
        language === 'ta'
          ? 'தயவுசெய்து பிராண்ட் பெயர், தலைப்பு மற்றும் விவரிப்பை நிரப்பவும்.'
          : 'Please enter brand name, title, and description.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: DbAdvertisement = {
        id: adToEdit?.id || `ad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        brandName: brandName.trim(),
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        badgeText: badgeText.trim() || 'Featured Partner',
        category: category.trim() || 'General Sponsor',
        mediaType,
        imageUrl: mediaType === 'image' ? imageUrl.trim() : (imageUrl.trim() || undefined),
        videoUrl: mediaType === 'video' ? videoUrl.trim() : (videoUrl.trim() || undefined),
        promoCode: promoCode.trim().toUpperCase(),
        discountPercentage: Number(discountPercentage) || 0,
        actionButtonText: actionButtonText.trim() || 'Learn More',
        actionUrl: actionUrl.trim(),
        targetAudience,
        status,
        priority: adToEdit?.priority || 1,
        createdAt: adToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
          uid: currentAuthUser?.uid || 'super-admin-uid',
          name: currentAuthUser?.fullName || 'Super Admin',
          role: currentAuthUser?.role || 'super_admin',
        },
        clicksCount: adToEdit?.clicksCount || 0,
      };

      await saveAdvertisement(payload);
      onClose();
    } catch (err: any) {
      console.error('Failed to save advertisement:', err);
      setErrorMsg(err?.message || 'Failed to save advertisement. Please check network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shrink-0 font-bold shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {adToEdit
                  ? language === 'ta'
                    ? 'விளம்பரத்தைத் திருத்துக (Photo / Video)'
                    : 'Edit Billboard Advertisement'
                  : language === 'ta'
                  ? 'புதிய விளம்பரம் உருவாக்குங்கள் (Photo / Video)'
                  : 'Create Super Admin Advertising Banner'}
              </h2>
              <p className="text-xs text-amber-200/80">
                Upload Photo Banner or Video Clip to display above Student Welcome Board
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Brand Name & Badge Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ta' ? 'பிராண்ட் / ஸ்பான்சர் பெயர் *' : 'Sponsor / Brand Name *'}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ponder Sip / HNC Foundation"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ta' ? 'பேட்ஜ் உரை (Badge Tag)' : 'Badge Label / Tag'}
              </label>
              <input
                type="text"
                placeholder="e.g. Featured Sponsor / Official Grant"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'ta' ? 'விளம்பரத் தலைப்பு (Ad Main Title) *' : 'Billboard Headline / Main Title *'}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ponder Sip — Organic Ceylon Tea & Refreshments for Students"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Row 3: Tagline */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'ta' ? 'துணைத் தலைப்பு / டேக்லைன்' : 'Tagline / Short Subtitle'}
            </label>
            <input
              type="text"
              placeholder="e.g. Sip Pure Ceylon Excellence • 20% Special Discount for Students"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'ta' ? 'விளம்பர விவரிப்பு (Full Description) *' : 'Detailed Ad Description *'}
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter detailed promotion offer description for student candidates..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* MEDIA UPLOAD SECTION (PHOTO & VIDEO OPTIONS) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                <Film className="w-4 h-4 text-amber-700" />
                <span>
                  {language === 'ta'
                    ? 'ஊடகப் பதிவேற்றம்: புகைப்படம் அல்லது வீடியோ (Photo / Video Upload)'
                    : 'Billboard Media Attachment (Photo & Video Options)'}
                </span>
              </span>

              {/* Media Type Switcher */}
              <div className="p-0.5 rounded-xl bg-amber-200/80 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                    mediaType === 'image'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-900 hover:text-amber-950'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'புகைப்படம் (Photo)' : 'Photo Banner'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                    mediaType === 'video'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-900 hover:text-amber-950'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'வீடியோ (Video)' : 'Video Clip'}</span>
                </button>
              </div>
            </div>

            {/* Media Upload Control depending on Media Type */}
            {mediaType === 'image' ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Photo File Upload Button */}
                  <label className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{language === 'ta' ? 'புகைப்படம் பதிவேற்றுக (Upload Photo)' : 'Upload Photo File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[11px] text-slate-500 font-medium">or enter Direct Image URL:</span>

                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Stock Photo Presets */}
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="text-slate-500 font-bold">Preset Photo Banners:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl(
                        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80'
                      )
                    }
                    className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-md border border-amber-300 transition cursor-pointer"
                  >
                    🍃 Ponder Sip Ceylon Tea
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl(
                        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'
                      )
                    }
                    className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-md border border-amber-300 transition cursor-pointer"
                  >
                    🎓 STEM Scholarship
                  </button>
                </div>

                {/* Image Preview */}
                {imageUrl && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-amber-400/40 bg-slate-900">
                    <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-full transition cursor-pointer"
                      title="Clear Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Video File Upload Button */}
                  <label className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{language === 'ta' ? 'வீடியோ பதிவேற்றுக (Upload Video)' : 'Upload Video File'}</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[11px] text-slate-500 font-medium">or enter Direct Video URL:</span>

                  <input
                    type="url"
                    placeholder="https://assets.mixkit.co/videos/preview/mixkit-..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 w-full px-3 py-1.5 bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* Preset Video Clips */}
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="text-slate-500 font-bold">Preset Video Clips:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setVideoUrl(
                        'https://assets.mixkit.co/videos/preview/mixkit-hot-tea-poured-into-a-cup-42861-large.mp4'
                      )
                    }
                    className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold rounded-md border border-purple-300 transition cursor-pointer"
                  >
                    🍵 Ceylon Tea Steeping
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setVideoUrl(
                        'https://assets.mixkit.co/videos/preview/mixkit-chemical-reaction-in-a-laboratory-glass-container-42981-large.mp4'
                      )
                    }
                    className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold rounded-md border border-purple-300 transition cursor-pointer"
                  >
                    🧪 STEM Science Lab
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setVideoUrl(
                        'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-43407-large.mp4'
                      )
                    }
                    className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold rounded-md border border-purple-300 transition cursor-pointer"
                  >
                    💻 Technology & AI
                  </button>
                </div>

                {/* Video Clip Preview */}
                {videoUrl && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-purple-400/40 bg-slate-950 flex items-center justify-center">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setVideoUrl('')}
                      className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-full transition cursor-pointer z-10"
                      title="Clear Video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 6: Category, Promo Code & Discount % */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
            <div>
              <label className="block font-bold text-amber-900 mb-1">
                {language === 'ta' ? 'வகை (Category)' : 'Category'}
              </label>
              <input
                type="text"
                placeholder="e.g. Food & Beverage"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-amber-900 mb-1">
                {language === 'ta' ? 'ப்ரொமோ கோடு (Promo Code)' : 'Promo Code'}
              </label>
              <input
                type="text"
                placeholder="e.g. HNCSTUDENT20"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-amber-900 mb-1">
                {language === 'ta' ? 'தள்ளுபடி % (Discount)' : 'Discount %'}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="20"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 7: Action Button Text & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ta' ? 'பொத்தான் உரை (Button Text)' : 'Action Button Text'}
              </label>
              <input
                type="text"
                placeholder="e.g. Explore Ponder Sip / Order Now"
                value={actionButtonText}
                onChange={(e) => setActionButtonText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ta' ? 'பொத்தான் லிங்க் (Website Link)' : 'Destination URL / Link'}
              </label>
              <input
                type="url"
                placeholder="https://pondersip.com"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 8: Status & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ta' ? 'விளம்பர நிலை (Status)' : 'Publication Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              >
                <option value="active">Active (Live on Student Billboard)</option>
                <option value="inactive">Inactive (Hidden / Draft)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ta' ? 'இலக்கு பார்வையாளர்கள் (Target)' : 'Target Audience'}
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">All Portals (Students & Admins)</option>
                <option value="students">Students Portal Only</option>
                <option value="admins">Admin Deck Only</option>
              </select>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || uploadLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting || uploadLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'ta' ? 'விளம்பரத்தைச் சேமிக்கவும்' : 'Save & Publish Banner'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
