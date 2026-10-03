import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import {
  User,
  School,
  Mail,
  Phone,
  Trophy,
  CheckCircle2,
  Medal,
  Award,
  Gift,
  Coins,
  Copy,
  Check,
  Shield,
  Clock,
  Sparkles,
  Lock,
  ShieldCheck,
  MapPin,
  Calendar,
  GraduationCap,
  Camera,
  Upload,
  X,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { StudentMembershipModal } from './StudentMembershipModal';

export const StudentProfileView: React.FC = () => {
  const {
    currentStudent,
    updateStudentProfile,
    setStudentNav,
    language,
    currentMembership,
    membershipSettings,
  } = useApp();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [avatarToast, setAvatarToast] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string>(() => currentStudent.avatarUrl || '');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (currentStudent.avatarUrl) {
      setLocalAvatar(currentStudent.avatarUrl);
    }
  }, [currentStudent.avatarUrl]);

  const activeAvatar = localAvatar || currentStudent.avatarUrl || '';

  const presetAvatars = ['👦', '👧', '👨‍🎓', '👩‍🎓', '🎓', '🚀', '🔬', '🏆', '🌟', '📚', '🤖', '🎨', '🧠', '🎖️', '🥇', '👑'];

  /**
   * Resizes and compresses any image (including large smartphone photos) to a clean 256x256 square JPEG (~15-25KB)
   * Resilient fallback guarantees it never fails or rejects on valid image files.
   */
  const compressImageToAvatar = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => {
        resolve('');
      };
      reader.onload = (evt) => {
        const rawResult = (evt.target?.result as string) || '';
        if (!rawResult) {
          resolve('');
          return;
        }

        const img = new Image();
        img.onerror = () => {
          // If canvas decoder fails on mobile format, return raw result directly
          resolve(rawResult);
        };
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const targetDimension = 256;
            canvas.width = targetDimension;
            canvas.height = targetDimension;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawResult);
              return;
            }

            // Center crop square to preserve facial aspect ratio
            const minSide = Math.min(img.width, img.height);
            const startX = (img.width - minSide) / 2;
            const startY = (img.height - minSide) / 2;

            ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetDimension, targetDimension);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve(compressedDataUrl || rawResult);
          } catch {
            resolve(rawResult);
          }
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Step 1: Immediately compress file on client to crisp 256x256 square (~15-25 KB)
      const compressedDataUrl = await compressImageToAvatar(file);

      if (!compressedDataUrl) {
        alert(language === 'ta' ? 'படத்தை வாசிப்பதில் பிழை ஏற்பட்டது.' : 'Failed to read image file.');
        return;
      }

      // Step 2: Immediate optimistic UI update
      setLocalAvatar(compressedDataUrl);

      // Step 3: Update student profile in context, localStorage and Firestore immediately
      await updateStudentProfile({ avatarUrl: compressedDataUrl });
      setShowAvatarModal(false);
      setAvatarToast(
        language === 'ta'
          ? 'சுயவிவரப் படம் வெற்றிகரமாக மாற்றப்பட்டது!'
          : language === 'si'
          ? 'පැතිකඩ ඡායාරූපය සාර්ථකව යාවත්කාලීන විය!'
          : 'Profile picture updated successfully!'
      );
      setTimeout(() => setAvatarToast(null), 3500);

      // Step 4: Background sync to Firebase Storage if available (non-blocking)
      if (storage) {
        try {
          const fileName = `avatars/${currentStudent.id || currentStudent.studentId || 'std'}_${Date.now()}.jpg`;
          const storageRef = ref(storage, fileName);
          const res = await fetch(compressedDataUrl);
          const blob = await res.blob();
          const snapshot = await uploadBytes(storageRef, blob);
          const cloudUrl = await getDownloadURL(snapshot.ref);
          if (cloudUrl) {
            setLocalAvatar(cloudUrl);
            await updateStudentProfile({ avatarUrl: cloudUrl });
          }
        } catch (storageError) {
          console.warn('Firebase Storage background sync note (local URL active):', storageError);
        }
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert(language === 'ta' ? 'படம் மாற்றுவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.' : 'Failed to update image. Please try again.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSelectPreset = async (emoji: string) => {
    setLocalAvatar(emoji);
    await updateStudentProfile({ avatarUrl: emoji });
    setShowAvatarModal(false);
    setAvatarToast(
      language === 'ta'
        ? 'சுயவிவர சின்னம் வெற்றிகரமாக மாற்றப்பட்டது!'
        : language === 'si'
        ? 'පැතිකඩ නිරූපකය සාර්ථකව වෙනස් විය!'
        : 'Profile avatar updated successfully!'
    );
    setTimeout(() => setAvatarToast(null), 3000);
  };

  const handleRemoveAvatar = async () => {
    setLocalAvatar('');
    await updateStudentProfile({ avatarUrl: '' });
    setShowAvatarModal(false);
    setAvatarToast(
      language === 'ta'
        ? 'சுயவிவரப் படம் அகற்றப்பட்டது.'
        : language === 'si'
        ? 'පැතිකඩ ඡායාරූපය ඉවත් කරන ලදී.'
        : 'Profile picture removed.'
    );
    setTimeout(() => setAvatarToast(null), 3000);
  };

  const referralCode =
    currentStudent.referralCode ||
    `HNC-${(currentStudent.studentId || currentStudent.username || 'STUDENT').toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-700" />
          <span>
            {language === 'ta'
              ? 'மாணவர் சுயவிவரம்'
              : language === 'si'
              ? 'ශිෂ්‍ය අපේක්ෂක පැතිකඩ'
              : 'Student Candidate Profile'}
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'ta'
            ? 'அங்கீகரிக்கப்பட்ட கல்வித் தகைமைகள், பாடசாலைப் பதிவு மற்றும் பாதுகாப்பு விபரங்கள்.'
            : language === 'si'
            ? 'තහවුරු කළ අධ්‍යයන සහතික, පාසල් ලියාපදිංචිය සහ ආරක්ෂිත වාර්තා.'
            : 'Verified academic credentials, school registration, and institutional security records.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Summary Badge */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5 text-center flex flex-col items-center">
          {/* Avatar with Camera Change Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-md overflow-hidden border-4 border-white ring-2 ring-blue-200/80">
              {activeAvatar && (activeAvatar.startsWith('data:') || activeAvatar.startsWith('http')) ? (
                <img src={activeAvatar} alt={currentStudent.name} className="w-full h-full object-cover" />
              ) : activeAvatar ? (
                <span className="text-4xl">{activeAvatar}</span>
              ) : (
                <span>{currentStudent.name.charAt(0)}</span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              title={language === 'ta' ? 'சாதனத்திலிருந்து படம் சேர்க்க' : language === 'si' ? 'ඡායාරූපයක් එක් කරන්න' : 'Choose Photo from Device'}
              className="absolute bottom-0 right-0 p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-md border-2 border-white transition transform hover:scale-110"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta'
                  ? 'படம் பதிவேற்று'
                  : language === 'si'
                  ? 'ඡායාරූපය උඩුගත කරන්න'
                  : 'Upload Photo'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold flex items-center gap-1 transition"
            >
              <span>{language === 'ta' ? 'சின்னங்கள்' : 'Avatars'}</span>
            </button>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{currentStudent.name}</h2>
            <p className="text-xs text-blue-700 font-semibold mt-0.5">{currentStudent.institution}</p>
            <p className="text-xs text-slate-500 mt-0.5">{currentStudent.gradeLevel}</p>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">
                {language === 'ta' ? 'அடையாள எண்:' : language === 'si' ? 'අපේක්ෂක හැඳුනුම්පත:' : 'Candidate ID:'}
              </span>
              <span className="font-mono font-bold text-slate-800">{currentStudent.studentId}</span>
            </div>
            {currentStudent.username && (
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {language === 'ta' ? 'பயனர் பெயர்:' : language === 'si' ? 'පරිශීලක නාමය:' : 'Username:'}
                </span>
                <span className="font-mono font-bold text-blue-700">@{currentStudent.username}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">
                {language === 'ta' ? 'பதிவுசெய்த போட்டிகள்:' : language === 'si' ? 'ලියාපදිංචි වූ තරඟ:' : 'Contests Enrolled:'}
              </span>
              <span className="font-bold text-slate-800">{currentStudent.competitionsEnrolled}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                {language === 'ta' ? 'வென்ற கெளரவங்கள்:' : language === 'si' ? 'දිනාගත් සම්මාන:' : 'Podium Honors:'}
              </span>
              <span className="font-bold text-amber-700">{currentStudent.awardsCount}</span>
            </div>
          </div>

          {/* Referral & Rewards Card */}
          <div className="w-full pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>{language === 'ta' ? 'பரிந்துரை & புள்ளிகள்' : 'Referral & Points'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold">
                {currentStudent.referralPoints ?? 0} PTS
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Code</div>
                <div className="text-xs font-mono font-bold text-slate-800">{referralCode}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStudentNav('Referral & Points')}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Coins className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'ta' ? 'வெகுமதிகள் தளம்' : 'Open Rewards Hub'}</span>
            </button>
          </div>

          {/* Monthly Membership Section */}
          <div className="w-full pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>{language === 'ta' ? 'மாதாந்த அங்கத்துவம்' : 'Monthly Membership'}</span>
              </span>
              {(!currentMembership || currentMembership.status === 'inactive') && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  Inactive
                </span>
              )}
              {currentMembership?.status === 'active' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Membership Active
                </span>
              )}
              {currentMembership?.status === 'expiring_soon' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Expiring Soon
                </span>
              )}
              {currentMembership?.status === 'expired' && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                  Membership Expired
                </span>
              )}
              {currentMembership?.status === 'pending' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Payment Pending
                </span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Fee:</span>
                <span className="font-bold text-slate-900">
                  {(membershipSettings.monthlyFeeLkr || 1500).toLocaleString()} LKR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Started On:</span>
                <span className="font-semibold text-slate-700">
                  {currentMembership?.startDate ? new Date(currentMembership.startDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Until:</span>
                <span className="font-bold text-indigo-900">
                  {currentMembership?.expiryDate ? new Date(currentMembership.expiryDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span className="font-semibold text-slate-700 capitalize">
                  {currentMembership?.paymentStatus || 'unpaid'}
                </span>
              </div>
              {currentMembership?.expiryDate && currentMembership.status === 'active' && (
                <div className="pt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valid Until: {new Date(currentMembership.expiryDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {(!currentMembership || currentMembership.status === 'inactive') && (
              <button
                type="button"
                id="btn-activate-membership"
                onClick={() => setShowMembershipModal(true)}
                className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'ta' ? 'அங்கத்துவத்தை இயக்கவும்' : 'Activate Membership'}</span>
              </button>
            )}

            {currentMembership?.status === 'expired' && (
              <button
                type="button"
                id="btn-renew-membership"
                onClick={() => setShowMembershipModal(true)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'அங்கத்துவத்தைப் புதுப்பிக்கவும்' : 'Renew Membership'}</span>
              </button>
            )}

            {currentMembership?.status === 'expiring_soon' && (
              <button
                type="button"
                onClick={() => setShowMembershipModal(true)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'முன்கூட்டியே புதுப்பிக்கவும்' : 'Renew Membership'}</span>
              </button>
            )}

            {currentMembership?.status === 'pending' && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-semibold text-center">
                Payment Submitted — Super Admin Review in Progress
              </div>
            )}
          </div>
        </div>

        {/* Right: Protected Academic Dossier (Read-Only & Secure) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'ta'
                    ? 'அங்கீகரிக்கப்பட்ட கல்விப் பதிவு விபரங்கள்'
                    : language === 'si'
                    ? 'තහවුරු කළ අපේක්ෂක අධ්‍යයන ලියාපදිංචි විස්තර'
                    : 'Verified Academic Registration Record'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ta'
                  ? 'பாதுகாக்கப்பட்ட உத்தியோகபூர்வ கல்வித் தரவுகள் (பரிசீலனைக்கு மட்டும்)'
                  : language === 'si'
                  ? 'සුරක්ෂිත නිල අධ්‍යයන දත්ත (කියවීමට පමණි)'
                  : 'Official student academic profile (protected & immutable)'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'ta' ? 'பதிவு பூட்டப்பட்டுள்ளது' : 'Profile Locked'}</span>
            </div>
          </div>

          {/* Security & Integrity Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                {language === 'ta'
                  ? 'பாதுகாப்பு & நம்பகத்தன்மை அறிவிப்பு'
                  : language === 'si'
                  ? 'ආරක්ෂක සහ සත්‍යාපන දැනුම්දීම'
                  : 'Security & Academic Record Lock Notice'}
              </span>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                {language === 'ta'
                  ? 'தேர்வு முடிவுகள், மதிப்பீட்டுச் சான்றிதழ்கள் மற்றும் உத்தியோகபூர்வ தரவரிசைகளின் நம்பகத்தன்மையைப் பாதுகாக்க மாணவர் சுயவிவர மாற்றங்கள் பூட்டப்பட்டுள்ளன. பெயர், வகுப்பு அல்லது பாடசாலையில் திருத்தங்கள் செய்ய கல்வி நிர்வாகத்தை அணுகவும்.'
                  : language === 'si'
                  ? 'තරඟ ප්‍රතිඵල, ඊ-සහතික සහ නිල ශ්‍රේණිගත කිරීම්වල නිරවද්‍යතාවය සහතික කිරීම සඳහා පැතිකඩ තොරතුරු සංස්කරණය අක්‍රිය කර ඇත. කිසියම් නිවැරදි කිරීමක් අවශ්‍ය නම් පරිපාලක අමතන්න.'
                  : 'Candidate profile editing is securely disabled to preserve the authentic integrity of competition rankings, Olympiad scorecards, and verifiable certificates. To request formal corrections to your academic record, contact the Academic Registrar.'}
              </p>
            </div>
          </div>

          {/* Read-Only Academic Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'முழுப் பெயர்' : language === 'si' ? 'සම්පූර්ණ නම' : 'Full Name'}
              </span>
              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentStudent.name}</span>
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'மாணவர் அடையாள எண்' : language === 'si' ? 'අපේක්ෂක හැඳුනුම්පත' : 'Student Candidate ID'}
              </span>
              <p className="font-mono font-bold text-blue-700 text-sm">{currentStudent.studentId}</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'பாடசாலை / கல்வி நிலையம்' : language === 'si' ? 'පාසල / ආයතනය' : 'School / Academy'}
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{currentStudent.institution}</span>
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'வகுப்பு / தரம்' : language === 'si' ? 'ශ්‍රේණිය' : 'Grade Level'}
              </span>
              <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{currentStudent.gradeLevel}</span>
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : language === 'si' ? 'විද්‍යුත් තැපෑල' : 'Email Address'}
              </span>
              <p className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{currentStudent.email}</span>
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'தொடர்பு எண்' : language === 'si' ? 'දුරකථන අංකය' : 'Contact Phone'}
              </span>
              <p className="font-medium text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{currentStudent.phone || '—'}</span>
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'பெற்றோர் / பாதுகாவலர்' : language === 'si' ? 'භාරකරුගේ නම' : 'Guardian / Parent Name'}
              </span>
              <p className="font-semibold text-slate-800">{currentStudent.guardianName || 'Parent / Guardian'}</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'பிறந்த திகதி' : language === 'si' ? 'උපන් දිනය' : 'Date of Birth'}
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{currentStudent.dateOfBirth || '—'}</span>
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'மாவட்டம்' : language === 'si' ? 'දිස්ත්‍රික්කය' : 'District'}
              </span>
              <p className="font-semibold text-slate-800">{currentStudent.district || '—'}</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ta' ? 'முகவரி' : language === 'si' ? 'ලිපිනය' : 'Residential Address'}
              </span>
              <p className="font-medium text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{currentStudent.address || '—'}</span>
              </p>
            </div>

            {currentStudent.bio && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'ta' ? 'சுயகுறிப்பு & கல்விசார் ஆர்வங்கள்' : language === 'si' ? 'විස්තරය' : 'Academic Bio & Interests'}
                </span>
                <p className="text-slate-700 italic">"{currentStudent.bio}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {avatarToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-bounce border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{avatarToast}</span>
        </div>
      )}

      {/* Student Membership Payment Modal */}
      <StudentMembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
      />

      {/* Profile Picture & Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ta'
                    ? 'சுயவிவரப் படம் மாற்றுக'
                    : language === 'si'
                    ? 'පැතිකඩ ඡායාරූපය වෙනස් කරන්න'
                    : 'Update Profile Picture'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Avatar Preview */}
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-inner overflow-hidden ring-4 ring-blue-100">
                {activeAvatar && (activeAvatar.startsWith('data:') || activeAvatar.startsWith('http')) ? (
                  <img src={activeAvatar} alt="Preview" className="w-full h-full object-cover" />
                ) : activeAvatar ? (
                  <span className="text-3xl">{activeAvatar}</span>
                ) : (
                  <span>{currentStudent.name.charAt(0)}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {language === 'ta'
                  ? 'உங்கள் சாதனத்திலிருந்து படம் பதிவேற்றலாம் அல்லது சின்னம் தேர்வுசெய்யலாம்.'
                  : language === 'si'
                  ? 'ඔබගේ උපාංගයෙන් ඡායාරූපයක් එක් කරන්න හෝ නිරූපකයක් තෝරන්න.'
                  : 'Upload a photo from device or choose an avatar icon.'}
              </p>
            </div>

            {/* Option 1: Upload Custom Photo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                {language === 'ta' ? '1. சாதனத்திலிருந்து படம் பதிவேற்றவும்' : language === 'si' ? '1. ඡායාරූපයක් උඩුගත කරන්න' : '1. Upload Photo from Device'}
              </label>
              <label className={`flex items-center justify-center gap-2 p-3 ${isUploading ? 'bg-blue-100 opacity-70 cursor-not-allowed' : 'bg-blue-50/70 hover:bg-blue-100/70 cursor-pointer'} border-2 border-dashed border-blue-300 rounded-xl transition text-blue-800 text-xs font-bold`}>
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>
                      {language === 'ta' ? 'பதிவேற்றப்படுகிறது...' : language === 'si' ? 'උඩුගත වෙමින් පවතී...' : 'Uploading Image to Firebase...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-blue-700" />
                    <span>
                      {language === 'ta' ? 'சாதனத்திலிருந்து புகைப்படம் தேர்ந்தெடு' : language === 'si' ? 'ඡායාරූපයක් තෝරන්න' : 'Choose Photo File'}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Option 2: Choose Avatar Icon */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 block">
                {language === 'ta' ? '2. அல்லது மாணவர் சின்னம் தேர்வுசெய்யவும்' : language === 'si' ? '2. නැතහොත් නිරූපකයක් තෝරන්න' : '2. Or Choose Avatar Icon'}
              </label>
              <div className="grid grid-cols-8 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {presetAvatars.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(emoji)}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-blue-100 border border-slate-200 hover:border-blue-400 flex items-center justify-center text-lg transition transform hover:scale-110 shadow-2xs"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Remove photo option if custom avatar set */}
            {activeAvatar && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'ta' ? 'சுயவிவரப் படத்தை அகற்று' : language === 'si' ? 'ඡායාරූපය ඉවත් කරන්න' : 'Remove Profile Picture'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
