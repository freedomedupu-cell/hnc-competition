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
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Copy,
  Layers,
  Check,
  Eye,
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
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    if (adToEdit?.galleryImages && adToEdit.galleryImages.length > 0) {
      return adToEdit.galleryImages;
    }
    return adToEdit?.imageUrl ? [adToEdit.imageUrl] : [];
  });
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState('');
  const [videoUrl, setVideoUrl] = useState(adToEdit?.videoUrl || '');

  // Multi-Photo Add Options (Supports >2 photos via file upload, individual slots, bulk URLs, and presets)
  const [photoAddMethod, setPhotoAddMethod] = useState<'upload' | 'slots' | 'bulk'>('upload');
  const [bulkUrlsInput, setBulkUrlsInput] = useState('');
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const [customPhotoSlots, setCustomPhotoSlots] = useState<string[]>(['', '', '']);

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
      const initialGallery = adToEdit?.galleryImages && adToEdit.galleryImages.length > 0
        ? adToEdit.galleryImages
        : (adToEdit?.imageUrl ? [adToEdit.imageUrl] : []);
      setGalleryImages(initialGallery);
      setNewPhotoUrlInput('');
      setBulkUrlsInput('');
      setPreviewSlideIdx(0);
      setCustomPhotoSlots(
        initialGallery.length > 0
          ? [...initialGallery, ...Array(Math.max(0, 3 - initialGallery.length)).fill('')]
          : ['', '', '']
      );
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

  // Live Auto-Slide for In-Modal Multi-Photo Preview when 2+ photos exist
  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const timer = setInterval(() => {
      setPreviewSlideIdx((prev) => (prev + 1) % galleryImages.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [galleryImages.length]);

  if (!isOpen) return null;

  // Handle Multiple or Single Photo Files Upload (Supports 2+ photos)
  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadLoading(true);
    setErrorMsg(null);

    const uploadedList: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const compressedDataUrl = await compressImageFile(file, 1200, 700, 0.75);
        uploadedList.push(compressedDataUrl);
      } catch (err) {
        console.warn('Fallback reader for:', file.name, err);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
        if (dataUrl) uploadedList.push(dataUrl);
      }
    }

    if (uploadedList.length > 0) {
      setGalleryImages((prev) => {
        const combined = [...prev, ...uploadedList];
        if (!imageUrl || prev.length === 0) {
          setImageUrl(combined[0]);
        }
        return combined;
      });
      setMediaType('image');
    }

    setUploadLoading(false);
    e.target.value = '';
  };

  const handleAddPhotoByUrl = () => {
    if (!newPhotoUrlInput.trim()) return;
    const url = newPhotoUrlInput.trim();
    setGalleryImages((prev) => {
      const combined = [...prev, url];
      if (!imageUrl || prev.length === 0) setImageUrl(combined[0]);
      return combined;
    });
    setNewPhotoUrlInput('');
    setMediaType('image');
  };

  // Add individual slot for "+ மற்றொரு புகைப்படம் சேர்க்க / Add Another Photo Slot"
  const handleAddPhotoSlot = () => {
    setCustomPhotoSlots((prev) => [...prev, '']);
  };

  const handleUpdatePhotoSlot = (index: number, val: string) => {
    setCustomPhotoSlots((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemovePhotoSlot = (index: number) => {
    setCustomPhotoSlots((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleApplyCustomSlotsToGallery = () => {
    const validUrls = customPhotoSlots.map((u) => u.trim()).filter(Boolean);
    if (validUrls.length === 0) {
      setErrorMsg(
        language === 'ta'
          ? 'தயவுசெய்து குறைந்தது ஒரு புகைப்பட இணைப்பை உள்ளிடவும்.'
          : 'Please enter at least one photo URL in the slots.'
      );
      return;
    }
    setGalleryImages(validUrls);
    setImageUrl(validUrls[0] || '');
    setMediaType('image');
    setErrorMsg(null);
  };

  // Bulk URL Importer (Allows pasting 2, 3, 5+ links at once)
  const handleImportBulkUrls = () => {
    if (!bulkUrlsInput.trim()) return;
    const urls = bulkUrlsInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 5 && (u.startsWith('http') || u.startsWith('data:image')));

    if (urls.length === 0) {
      setErrorMsg(
        language === 'ta'
          ? 'செல்லுபடியாகும் புகைப்பட இணைய முகவரிகளைக் காணவில்லை.'
          : 'No valid image URLs found.'
      );
      return;
    }

    setGalleryImages((prev) => {
      const combined = [...prev, ...urls];
      if (!imageUrl || prev.length === 0) setImageUrl(combined[0]);
      return combined;
    });
    setBulkUrlsInput('');
    setMediaType('image');
    setErrorMsg(null);
  };

  const handleRemovePhoto = (idx: number) => {
    setGalleryImages((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (imageUrl === prev[idx] || updated.length === 0) {
        setImageUrl(updated[0] || '');
      }
      return updated;
    });
  };

  const handleSetPrimaryCover = (idx: number) => {
    setGalleryImages((prev) => {
      if (idx === 0) return prev;
      const target = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      const reordered = [target, ...rest];
      setImageUrl(target);
      setPreviewSlideIdx(0);
      return reordered;
    });
  };

  const handleMovePhoto = (idx: number, direction: 'left' | 'right') => {
    setGalleryImages((prev) => {
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      setImageUrl(copy[0]);
      return copy;
    });
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
        imageUrl: mediaType === 'image'
          ? (galleryImages[0] || imageUrl.trim() || undefined)
          : (galleryImages[0] || imageUrl.trim() || undefined),
        galleryImages: mediaType === 'image'
          ? (galleryImages.length > 0 ? galleryImages : (imageUrl.trim() ? [imageUrl.trim()] : []))
          : [],
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
              <div className="space-y-4">
                {/* Multi-Photo Feature Header & Mode Switcher */}
                <div className="bg-white/80 p-3 rounded-2xl border border-amber-300 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-2xs">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>2+ Photos</span>
                      </span>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">
                          {language === 'ta'
                            ? 'பல புகைப்படங்கள் இணைக்கும் விருப்பங்கள் (Multi-Photo Showcase)'
                            : 'Multi-Photo Advertisement Options (2+ Photos Supported)'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {language === 'ta'
                            ? '2 முதல் 10+ வரை புகைப்படங்களை சேர்க்கலாம். மாணவர் பலகையில் அழகிய ஸ்லைடராக சுழலும்.'
                            : 'Add 2 to 10+ photos to create an engaging auto-rotating sponsor carousel for students.'}
                        </span>
                      </div>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="flex items-center gap-1 bg-amber-100/80 p-1 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPhotoAddMethod('upload')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          photoAddMethod === 'upload'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-900 hover:text-amber-950'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>{language === 'ta' ? 'கோப்பு பதிவேற்றம்' : 'File Upload'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhotoAddMethod('slots')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          photoAddMethod === 'slots'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-900 hover:text-amber-950'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>{language === 'ta' ? 'தனித்தனி ஸ்லாட்டுகள்' : 'Photo Slots (1,2,3...)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhotoAddMethod('bulk')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          photoAddMethod === 'bulk'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-900 hover:text-amber-950'
                        }`}
                      >
                        <Copy className="w-3 h-3" />
                        <span>{language === 'ta' ? 'மொத்த இணைப்புகள்' : 'Bulk URLs'}</span>
                      </button>
                    </div>
                  </div>

                  {/* OPTION 1: MULTI-FILE UPLOAD (Supports selecting 2, 3, 5+ files at once) */}
                  {photoAddMethod === 'upload' && (
                    <div className="space-y-2 pt-2 border-t border-amber-200">
                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <label className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0">
                          {uploadLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span>
                            {language === 'ta'
                              ? '📁 கணினியிலிருந்து பல படங்களைத் தேர்ந்தெடுக்கவும் (Upload 2+ Photos)'
                              : '📁 Select Multiple Photo Files (2+ Photos from Device)'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotosUpload}
                            className="hidden"
                          />
                        </label>

                        <div className="flex-1 w-full flex items-center gap-1.5">
                          <input
                            type="url"
                            placeholder={
                              language === 'ta'
                                ? 'அல்லது ஒற்றை புகைப்பட இணைய முகவரி (Image URL)...'
                                : 'Or enter single image URL to add to gallery...'
                            }
                            value={newPhotoUrlInput}
                            onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddPhotoByUrl();
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddPhotoByUrl}
                            disabled={!newPhotoUrlInput.trim()}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? '+ சேர்' : '+ Add'}</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-900/80 font-medium">
                        💡 {language === 'ta'
                          ? 'குறிப்பு: ஒரே நேரத்தில் 2, 3, 4 அல்லது அதற்கு மேற்பட்ட புகைப்படங்களை Ctrl அல்லது Shift அழுத்தி தேர்ந்தெடுக்கலாம்.'
                          : 'Pro Tip: Hold Ctrl (or Cmd on Mac) / Shift to multi-select 2, 3, or more photos simultaneously.'}
                      </p>
                    </div>
                  )}

                  {/* OPTION 2: MULTI-SLOT URL MANAGER (Photo 1, Photo 2, Photo 3... with Add Slot button) */}
                  {photoAddMethod === 'slots' && (
                    <div className="space-y-3 pt-2 border-t border-amber-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-950">
                          {language === 'ta'
                            ? 'ஒவ்வொரு புகைப்படத்திற்கும் தனித்தனி ஸ்லாட்டுகள்:'
                            : 'Dedicated Photo Slots (Manage Individual Photo URLs):'}
                        </span>
                        <button
                          type="button"
                          onClick={handleAddPhotoSlot}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {language === 'ta'
                              ? '+ மற்றொரு புகைப்பட ஸ்லாட் சேர்க்க'
                              : `+ Add Photo #${customPhotoSlots.length + 1} Slot`}
                          </span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {customPhotoSlots.map((slotVal, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200"
                          >
                            <span className="px-2 py-1 rounded-md bg-amber-200 text-amber-950 text-[10px] font-black shrink-0">
                              #{sIdx + 1} {sIdx === 0 ? '(Cover)' : ''}
                            </span>
                            <input
                              type="url"
                              placeholder={`Enter Photo #${sIdx + 1} direct URL (https://...)...`}
                              value={slotVal}
                              onChange={(e) => handleUpdatePhotoSlot(sIdx, e.target.value)}
                              className="flex-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                            {customPhotoSlots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePhotoSlot(sIdx)}
                                className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer shrink-0"
                                title="Delete this slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleApplyCustomSlotsToGallery}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {language === 'ta'
                              ? '✓ அனைத்து ஸ்லாட்டுகளையும் கேலரியில் இணைக்க'
                              : '✓ Apply All Photo Slots to Gallery'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OPTION 3: BULK URL IMPORTER (Paste 2, 3, 5+ links at once) */}
                  {photoAddMethod === 'bulk' && (
                    <div className="space-y-2 pt-2 border-t border-amber-200">
                      <label className="block text-xs font-bold text-amber-950">
                        {language === 'ta'
                          ? 'பல புகைப்பட இணைப்புகளை ஒரே நேரத்தில் ஒட்டவும் (ஒவ்வொரு வரியிலும் ஒரு இணைப்பு):'
                          : 'Bulk Paste Photo URLs (One URL per line or comma-separated):'}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={
                          "https://images.unsplash.com/photo-1576092768241...\nhttps://images.unsplash.com/photo-1594631252845...\nhttps://images.unsplash.com/photo-15447872197f4..."
                        }
                        value={bulkUrlsInput}
                        onChange={(e) => setBulkUrlsInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] text-slate-500">
                          {language === 'ta'
                            ? 'ஒரே நேரத்தில் 3, 4, 5 அல்லது 10 இணைய முகவரிகளையும் இணைக்கலாம்.'
                            : 'Paste 2, 3, 4, 5+ image links and import them all with one click.'}
                        </span>
                        <button
                          type="button"
                          onClick={handleImportBulkUrls}
                          disabled={!bulkUrlsInput.trim()}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {language === 'ta'
                              ? 'அனைத்து லிங்க்குகளையும் இணைக்க (Import All)'
                              : 'Import All URLs to Gallery'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preset Multi-Photo Packages (Rich 3 to 4 Photo Collections) */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="text-slate-600 font-bold">
                    {language === 'ta' ? 'மாதிரி புகைப்பட தொகுப்புகள் (1-Click Presets):' : '1-Click Multi-Photo Presets:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [
                        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=1200&q=80',
                      ];
                      setGalleryImages(list);
                      setImageUrl(list[0]);
                      setPreviewSlideIdx(0);
                    }}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 transition cursor-pointer"
                  >
                    🍃 Ceylon Tea (4 Photos)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [
                        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
                      ];
                      setGalleryImages(list);
                      setImageUrl(list[0]);
                      setPreviewSlideIdx(0);
                    }}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 transition cursor-pointer"
                  >
                    🎓 STEM & Academy (4 Photos)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [
                        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
                      ];
                      setGalleryImages(list);
                      setImageUrl(list[0]);
                      setPreviewSlideIdx(0);
                    }}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 transition cursor-pointer"
                  >
                    📚 Book Fair & Stationery (3 Photos)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [
                        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
                      ];
                      setGalleryImages(list);
                      setImageUrl(list[0]);
                      setPreviewSlideIdx(0);
                    }}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 transition cursor-pointer"
                  >
                    💻 Tech & AI Innovations (4 Photos)
                  </button>
                </div>

                {/* Photo Gallery Grid & Live Carousel Preview */}
                {galleryImages.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-amber-300">
                    {/* Status notification banner for 2+ photos */}
                    <div className="flex items-center justify-between text-xs font-bold text-amber-950 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ImageIcon className="w-4 h-4 text-amber-700" />
                        <span>
                          {language === 'ta'
                            ? `இணைக்கப்பட்ட புகைப்படங்கள் (${galleryImages.length} படங்கள்)`
                            : `Attached Photos Gallery (${galleryImages.length} Photos)`}
                        </span>
                        {galleryImages.length >= 2 ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                            <span>
                              {language === 'ta'
                                ? `✓ 2-க்கும் மேற்பட்ட படங்கள் உள்ளன (Auto Carousel Active - ${galleryImages.length} படங்கள்)`
                                : `✓ Multi-Photo Carousel Active (${galleryImages.length} Photos)`}
                            </span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                            {language === 'ta'
                              ? '💡 2-க்கும் மேற்பட்ட படங்களைச் சேர்த்தால் ஸ்லைடராக மாறும்'
                              : '💡 Add 2 or more photos to activate carousel slider'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setGalleryImages([]);
                          setImageUrl('');
                          setPreviewSlideIdx(0);
                        }}
                        className="text-[11px] text-red-600 hover:text-red-800 font-bold transition cursor-pointer"
                      >
                        {language === 'ta' ? 'அனைத்தையும் நீக்கு (Clear All)' : 'Clear All'}
                      </button>
                    </div>

                    {/* LIVE IN-MODAL MULTI-PHOTO CAROUSEL PREVIEW */}
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 text-white border-2 border-amber-500/40 shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {language === 'ta'
                              ? 'நேரடி மாதிரி காட்சி (Student Billboard Live Preview)'
                              : 'Live Student Billboard Multi-Photo Carousel Preview:'}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-black/60 rounded-full text-amber-200 border border-amber-400/30">
                          {galleryImages.length > 0 ? `${(previewSlideIdx % galleryImages.length) + 1} / ${galleryImages.length}` : '0 / 0'}
                        </span>
                      </div>

                      <div className="relative h-44 sm:h-52 rounded-xl overflow-hidden bg-black/80 flex items-center justify-center border border-white/10 group">
                        {galleryImages.length > 0 ? (
                          <>
                            <img
                              src={galleryImages[previewSlideIdx % galleryImages.length]}
                              alt={`Slide ${(previewSlideIdx % galleryImages.length) + 1}`}
                              className="w-full h-full object-cover transition duration-500"
                            />

                            {/* Slide Counter Overlay */}
                            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-amber-300 text-[10px] font-black border border-amber-400/40 flex items-center gap-1.5 shadow">
                              <ImageIcon className="w-3 h-3 text-amber-400" />
                              <span>
                                Photo {(previewSlideIdx % galleryImages.length) + 1} of {galleryImages.length}
                              </span>
                              {(previewSlideIdx % galleryImages.length) === 0 && (
                                <span className="text-emerald-400 ml-1">★ Cover</span>
                              )}
                            </div>

                            {/* Next / Prev Controls */}
                            {galleryImages.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewSlideIdx(
                                      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                                    )
                                  }
                                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer shadow-lg"
                                  title="Previous Slide"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewSlideIdx((prev) => (prev + 1) % galleryImages.length)
                                  }
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer shadow-lg"
                                  title="Next Slide"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Pagination Dots */}
                            {galleryImages.length > 1 && (
                              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
                                {galleryImages.map((_, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setPreviewSlideIdx(pIdx)}
                                    className={`h-2 rounded-full transition-all cursor-pointer ${
                                      pIdx === previewSlideIdx % galleryImages.length
                                        ? 'w-6 bg-amber-400'
                                        : 'w-2 bg-white/40 hover:bg-white/70'
                                    }`}
                                    title={`Go to photo ${pIdx + 1}`}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs">No photos attached yet</span>
                        )}
                      </div>

                      {/* Thumbnail strip */}
                      {galleryImages.length > 1 && (
                        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                          {galleryImages.map((imgSrc, tIdx) => (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => setPreviewSlideIdx(tIdx)}
                              className={`relative w-12 h-9 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                                tIdx === previewSlideIdx % galleryImages.length
                                  ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                                  : 'border-white/20 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 right-0 px-1 text-[8px] bg-black/80 font-bold text-white rounded-tl">
                                #{tIdx + 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PHOTO MANAGEMENT GRID WITH RE-ORDERING & COVER SETTINGS */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        {language === 'ta'
                          ? 'படங்களை வரிசைப்படுத்துக / முதன்மை அட்டை மாற்றுக (Reorder & Set Cover):'
                          : 'Manage Attached Photos (Reorder, Set Cover, or Remove):'}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {galleryImages.map((imgSrc, idx) => {
                          const isPrimary = idx === 0;

                          return (
                            <div
                              key={idx}
                              className={`relative rounded-xl overflow-hidden border-2 transition group flex flex-col justify-between bg-slate-900 ${
                                isPrimary
                                  ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                                  : 'border-slate-200 hover:border-amber-300'
                              }`}
                            >
                              <div className="relative h-24 w-full overflow-hidden bg-slate-950">
                                <img
                                  src={imgSrc}
                                  alt={`Ad Photo ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />

                                {/* Number Badge */}
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded">
                                  #{idx + 1}
                                </span>

                                {/* Primary Cover Badge */}
                                {isPrimary && (
                                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded shadow-xs">
                                    Cover
                                  </span>
                                )}

                                {/* Move Arrows (Reorder Left / Right) */}
                                <div className="absolute top-1.5 left-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMovePhoto(idx, 'left')}
                                      className="p-1 bg-black/80 hover:bg-black text-amber-300 rounded text-[9px] font-bold transition cursor-pointer"
                                      title="Move Left / Earlier"
                                    >
                                      ◀
                                    </button>
                                  )}
                                  {idx < galleryImages.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMovePhoto(idx, 'right')}
                                      className="p-1 bg-black/80 hover:bg-black text-amber-300 rounded text-[9px] font-bold transition cursor-pointer"
                                      title="Move Right / Later"
                                    >
                                      ▶
                                    </button>
                                  )}
                                </div>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(idx)}
                                  className="absolute bottom-1.5 right-1.5 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-md transition shadow cursor-pointer"
                                  title="Remove this photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Set As Cover Button */}
                              {!isPrimary ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryCover(idx)}
                                  className="w-full py-1 text-center bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[10px] font-bold border-t border-slate-200 transition cursor-pointer"
                                >
                                  {language === 'ta' ? 'முகப்புப் படம் (Set Cover)' : 'Set as Cover'}
                                </button>
                              ) : (
                                <div className="w-full py-1 text-center bg-amber-500/20 text-amber-900 text-[10px] font-black border-t border-amber-300">
                                  ★ {language === 'ta' ? 'முதன்மை முகப்பு அட்டை' : 'Primary Cover'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
