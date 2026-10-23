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
  MessageCircle,
  Share2,
  ExternalLink,
  Pencil,
  Save,
  Bell,
  Volume2,
  VolumeX,
  BookOpen,
  Settings,
} from 'lucide-react';
import { StudentMembershipModal } from './StudentMembershipModal';
import { StudentAchievements } from './StudentAchievements';
import { EnrolledSubjectsModal } from './EnrolledSubjectsModal';
import { SavePulseIndicator, SaveStatus } from '../common/SavePulseIndicator';
import { SRI_LANKA_25_DISTRICTS } from '../../data/sriLankaDistricts';
import { detectStudentCurriculumPath, AVAILABLE_GRADES } from '../../lib/gradeUtils';
import {
  getStoredSubjectPushSettings,
  saveSubjectPushSettings,
  requestSubjectPushPermission,
  sendSubjectPublicationBrowserPush,
  playSubjectPublicationChime,
  SRI_LANKAN_ACADEMIC_SUBJECTS,
} from '../../utils/subjectNotificationUtils';

export const StudentProfileView: React.FC = () => {
  const {
    currentStudent,
    updateStudentProfile,
    studentEnrolledSubjects,
    competitions,
    setStudentNav,
    language,
    currentMembership,
    membershipSettings,
  } = useApp();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [avatarToast, setAvatarToast] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string>(() => currentStudent.avatarUrl || '');
  const [pushSettings, setPushSettings] = useState(getStoredSubjectPushSettings);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Real-time save status for student profile changes
  const [profileSaveStatus, setProfileSaveStatus] = useState<SaveStatus>('saved');
  const [profileLastSavedAt, setProfileLastSavedAt] = useState<Date | null>(() => new Date());

  // Personal contact details edit state
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    phone: currentStudent.phone || '',
    district: currentStudent.district || '',
    address: currentStudent.address || '',
    bio: currentStudent.bio || '',
  });

  React.useEffect(() => {
    setPersonalForm({
      phone: currentStudent.phone || '',
      district: currentStudent.district || '',
      address: currentStudent.address || '',
      bio: currentStudent.bio || '',
    });
  }, [currentStudent.phone, currentStudent.district, currentStudent.address, currentStudent.bio]);

  React.useEffect(() => {
    if (currentStudent.avatarUrl) {
      setLocalAvatar(currentStudent.avatarUrl);
    }
  }, [currentStudent.avatarUrl]);

  // Grade edit & curriculum path adaptation state
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [selectedNewGrade, setSelectedNewGrade] = useState(currentStudent.gradeLevel || 'Grade 11 (O/L)');
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [gradeSaveToast, setGradeSaveToast] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentStudent.gradeLevel) {
      setSelectedNewGrade(currentStudent.gradeLevel);
    }
  }, [currentStudent.gradeLevel]);

  const handleSaveGrade = async () => {
    if (!selectedNewGrade || selectedNewGrade.trim() === (currentStudent.gradeLevel || '').trim()) {
      setIsEditingGrade(false);
      return;
    }
    setIsSavingGrade(true);
    setProfileSaveStatus('saving');
    try {
      await updateStudentProfile({ gradeLevel: selectedNewGrade.trim() });
      setProfileLastSavedAt(new Date());
      setProfileSaveStatus('saved');
      setIsEditingGrade(false);
      const newPath = detectStudentCurriculumPath(selectedNewGrade);
      setGradeSaveToast(
        language === 'ta'
          ? `வகுப்பு ${selectedNewGrade} ஆக வெற்றிகரமாக புதுப்பிக்கப்பட்டது! "${newPath.titleTa}" பாடத்திட்டப் பாதை செயல்படுத்தப்பட்டுள்ளது.`
          : `Grade updated to ${selectedNewGrade}! "${newPath.titleEn}" path activated.`
      );
      setTimeout(() => setGradeSaveToast(null), 5000);
    } catch (err) {
      console.error('Failed to update student grade:', err);
      setProfileSaveStatus('idle');
    } finally {
      setIsSavingGrade(false);
    }
  };

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
      setProfileSaveStatus('saving');

      // Step 3: Update student profile in context, localStorage and Firestore immediately
      await updateStudentProfile({ avatarUrl: compressedDataUrl });
      setProfileLastSavedAt(new Date());
      setProfileSaveStatus('saved');

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
            setProfileLastSavedAt(new Date());
            setProfileSaveStatus('saved');
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
    setProfileSaveStatus('saving');
    await updateStudentProfile({ avatarUrl: emoji });
    setProfileLastSavedAt(new Date());
    setProfileSaveStatus('saved');
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
    setProfileSaveStatus('saving');
    await updateStudentProfile({ avatarUrl: '' });
    setProfileLastSavedAt(new Date());
    setProfileSaveStatus('saved');
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

  const handleSavePersonalInfo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileSaveStatus('saving');
    try {
      await updateStudentProfile({
        phone: personalForm.phone.trim(),
        district: personalForm.district.trim(),
        address: personalForm.address.trim(),
        bio: personalForm.bio.trim(),
      });
      setProfileLastSavedAt(new Date());
      setProfileSaveStatus('saved');
      setIsEditingPersonal(false);
      setAvatarToast(
        language === 'ta'
          ? 'தொடர்பு விபரங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!'
          : language === 'si'
          ? 'තොරතුරු සාර්ථකව සුරැකිණි!'
          : 'Personal details saved successfully!'
      );
      setTimeout(() => setAvatarToast(null), 3000);
    } catch (err) {
      console.error('Save personal info error:', err);
      setProfileLastSavedAt(new Date());
      setProfileSaveStatus('saved');
    }
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

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {/* Subtle Real-time Save Pulse Indicator */}
              <SavePulseIndicator
                status={profileSaveStatus}
                lastSavedAt={profileLastSavedAt}
                language={language}
                variant="pill"
                size="xs"
                customLabel={
                  language === 'ta'
                    ? 'சுயவிவரம் சேமிக்கப்பட்டது'
                    : language === 'si'
                    ? 'පැතිකඩ සුරැකිණි'
                    : 'Profile saved'
                }
                customSavingLabel={
                  language === 'ta'
                    ? 'சேமிக்கப்படுகிறது...'
                    : language === 'si'
                    ? 'සුරැකෙමින්...'
                    : 'Saving profile...'
                }
              />

              <button
                type="button"
                onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition"
              >
                <Pencil className="w-3 h-3 text-blue-600" />
                <span>
                  {isEditingPersonal
                    ? (language === 'ta' ? 'படிவத்தை மூடு' : 'Close Form')
                    : (language === 'ta' ? 'தொடர்பு விபரம் திருத்து' : 'Edit Contact & Bio')}
                </span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'ta' ? 'அடிப்படை பதிவு பூட்டப்பட்டது' : 'Core Record Locked'}</span>
              </div>
            </div>
          </div>

          {/* Editable Personal Contact & Bio Form */}
          {isEditingPersonal && (
            <form
              onSubmit={handleSavePersonalInfo}
              className="p-4 sm:p-5 rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-50/90 to-indigo-50/70 space-y-4 animate-in fade-in duration-300"
            >
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-700" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {language === 'ta' ? 'தனிப்பட்ட தொடர்பு விபரங்களைத் திருத்தவும்' : 'Edit Personal Contact & Bio'}
                  </h3>
                </div>
                <SavePulseIndicator
                  status={profileSaveStatus}
                  lastSavedAt={profileLastSavedAt}
                  language={language}
                  variant="pill"
                  size="xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {language === 'ta' ? 'தொடர்பு தொலைபேசி எண்' : 'Contact Phone'}
                  </label>
                  <input
                    type="tel"
                    value={personalForm.phone}
                    onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    placeholder="+94 7X XXX XXXX"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {language === 'ta' ? 'மாவட்டம்' : 'District'}
                  </label>
                  <select
                    value={personalForm.district}
                    onChange={(e) => setPersonalForm({ ...personalForm, district: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">{language === 'ta' ? '— மாவட்டம் தேர்வு செய்க —' : '— Select District —'}</option>
                    {SRI_LANKA_25_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.nameEn}>
                        {d.nameEn} {d.nameTa ? `(${d.nameTa})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {language === 'ta' ? 'வசிப்பிட முகவரி' : 'Residential Address'}
                  </label>
                  <input
                    type="text"
                    value={personalForm.address}
                    onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                    placeholder="No. 12, Main Street, Town"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {language === 'ta' ? 'சுயகுறிப்பு & கல்விசார் ஆர்வங்கள்' : 'Academic Bio & Interests'}
                  </label>
                  <textarea
                    rows={2}
                    value={personalForm.bio}
                    onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                    placeholder="Tell us about your Olympiad goals or favorite science/math topics..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <SavePulseIndicator
                  status={profileSaveStatus}
                  lastSavedAt={profileLastSavedAt}
                  language={language}
                  size="xs"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(false)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    {language === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'சேமித்து ஒத்திசைக்கவும்' : 'Save Details'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

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
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'ta' ? 'வகுப்பு / தரம்' : language === 'si' ? 'ශ්‍රේණිය' : 'Grade Level'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingGrade(!isEditingGrade)}
                  className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>{isEditingGrade ? (language === 'ta' ? 'மூடு' : 'Close') : (language === 'ta' ? 'மாற்று' : 'Change')}</span>
                </button>
              </div>
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

          {/* Grade Change Feedback Toast */}
          {gradeSaveToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{gradeSaveToast}</span>
            </div>
          )}

          {/* Grade Edit & Curriculum Path Re-mapping Modal/Panel */}
          {isEditingGrade && (
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-400 bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 space-y-3.5 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-700" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {language === 'ta' ? 'கல்வி வகுப்பு / தரம் புதுப்பித்தல் (Change Grade)' : 'Update Academic Grade Level'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingGrade(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700 block text-[11px]">
                  {language === 'ta' ? 'புதிய வகுப்பைத் தேர்ந்தெடுக்கவும் (Select New Grade):' : 'Select New Grade:'}
                </label>
                <select
                  value={selectedNewGrade}
                  onChange={(e) => setSelectedNewGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {AVAILABLE_GRADES.filter(
                    (g) =>
                      !g.toLowerCase().includes('open') &&
                      !g.toLowerCase().includes('all grades') &&
                      !g.toLowerCase().includes('அனைத்து')
                  ).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Preview of Newly Mapped Curriculum Path */}
              {(() => {
                const previewPath = detectStudentCurriculumPath(selectedNewGrade);
                return (
                  <div className="p-3 rounded-xl border border-indigo-200 bg-white/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>{previewPath.icon}</span>
                        <span>{language === 'ta' ? previewPath.titleTa : previewPath.titleEn}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-2xs">
                        {previewPath.stageBadgeTa}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-snug">
                      {language === 'ta' ? previewPath.descriptionTa : previewPath.descriptionEn}
                    </p>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-1">
                      <span className="font-semibold text-indigo-700">
                        🎯 {previewPath.mcqOptionCount} MCQ தெரிவுகள் ({previewPath.mcqOptionCount}-Option Standard)
                      </span>
                      <span className="text-emerald-700 font-bold">
                        🔒 பொருத்தமற்ற பிற தரங்கள் தானாக மறைக்கப்படும்
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingGrade(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isSavingGrade || selectedNewGrade === currentStudent.gradeLevel}
                  onClick={handleSaveGrade}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingGrade ? (
                    <span>{language === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...'}</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'வகுப்பை உறுதிசெய் & சேமி' : 'Confirm & Save Grade'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE SRI LANKAN SINGLE CURRICULUM PATH SPECIFICATION CARD */}
          {(() => {
            const currentPath = detectStudentCurriculumPath(currentStudent.gradeLevel);
            return (
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white space-y-3.5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-indigo-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xl shadow-md shrink-0 border border-indigo-400/30">
                      {currentPath.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                          {language === 'ta' ? 'ஒற்றைப் பாடத்திட்டப் பாதை' : 'Single Curriculum Path Active'}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-200">
                          {currentPath.stageBadgeTa}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                        {language === 'ta' ? currentPath.titleTa : currentPath.titleEn}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingGrade(true)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'ta' ? 'வகுப்பு மாற்றம்' : 'Change Grade'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ta' ? currentPath.descriptionTa : currentPath.descriptionEn}
                </p>

                {/* Core subjects for this specific single curriculum path */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'ta' ? 'முக்கிய பாடப் பிரிவுகள் (Core Syllabus Subjects):' : 'Core Syllabus Subjects:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(language === 'ta' ? currentPath.coreSubjectsTa : currentPath.coreSubjectsEn).map((subj) => (
                      <span
                        key={subj}
                        className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-slate-200 text-[11px] font-semibold"
                      >
                        {subj}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rules & Isolation Guarantee */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎯</span>
                    <span className="text-indigo-200 font-bold">
                      {currentPath.mcqOptionCount} MCQ தெரிவுகள் ({currentPath.mcqOptionCount}-Option Standard)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {language === 'ta'
                        ? 'பொருத்தமற்ற பிற தரங்கள் மற்றும் தேர்வுகள் அனைத்தும் தானாக மறைக்கப்பட்டுள்ளன'
                        : 'All irrelevant grade tiers & non-applicable contests automatically hidden'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ENROLLED SUBJECTS & REAL-TIME PUSH NOTIFICATION ALERTS CARD */}
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-slate-50 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                  🔔
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {language === 'ta'
                        ? 'பதிவு செய்யப்பட்ட பாடங்கள் & புஷ் அறிவிப்புகள்'
                        : 'Enrolled Subjects & Push Notification Alerts'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {studentEnrolledSubjects.length} {language === 'ta' ? 'பாடங்கள்' : 'Subjects'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'ta'
                      ? 'உங்கள் பாடங்களில் புதிய போட்டி அல்லது வினாடி வினா வெளியிடப்படும் போது உடனடி உலாவி மற்றும் ஒலி அறிவிப்புகளைப் பெறுங்கள்.'
                      : 'Receive instant browser & in-app push notifications whenever a new competition or quiz is published in your enrolled subjects.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubjectsModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'பாடங்களை மாற்றுக' : 'Manage Subjects'}</span>
              </button>
            </div>

            {/* Active Enrolled Subjects Chips */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ta' ? 'தற்போது கண்காணிக்கப்படும் பாடங்கள்' : 'Actively Tracked Subjects'}:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {studentEnrolledSubjects.map((subjectName) => {
                  const meta = SRI_LANKAN_ACADEMIC_SUBJECTS.find(
                    (s) => s.nameEn.toLowerCase() === subjectName.toLowerCase() || s.nameTa === subjectName
                  );
                  return (
                    <div
                      key={subjectName}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-indigo-200 text-slate-800 shadow-2xs flex items-center gap-2"
                    >
                      <span>{meta?.icon || '📚'}</span>
                      <span>{subjectName}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls Bar: Browser Push Permission, Sound Chime, and Instant Test Button */}
            <div className="pt-2 border-t border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-600">
                  {language === 'ta' ? 'அறிவிப்பு நிலை' : 'Browser Alert Status'}:
                </span>
                {pushSettings.permission === 'granted' ? (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'ta' ? 'உலாவி புஷ் தயார்' : 'Desktop Push Active'}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await requestSubjectPushPermission();
                      setPushSettings(getStoredSubjectPushSettings());
                      if (res.granted) {
                        setAvatarToast(language === 'ta' ? '🔔 உலாவி அறிவிப்பு இயக்கப்பட்டது!' : '🔔 Push notifications enabled!');
                        setTimeout(() => setAvatarToast(null), 3000);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition flex items-center gap-1"
                  >
                    <Bell className="w-3 h-3" />
                    <span>{language === 'ta' ? 'உலாவி புஷ் அனுமதிக்க' : 'Allow Desktop Push'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !pushSettings.soundEnabled;
                    const updated = saveSubjectPushSettings({ soundEnabled: nextVal });
                    setPushSettings(updated);
                    if (nextVal) playSubjectPublicationChime();
                  }}
                  className={`p-1.5 rounded-lg border transition ${
                    pushSettings.soundEnabled
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                  title={pushSettings.soundEnabled ? 'Mute Chime' : 'Enable Chime'}
                >
                  {pushSettings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const targetComp = competitions[0] || {
                    id: 'comp-profile-test',
                    title: 'National Mathematics & Science Challenge 2026',
                    competitionType: 'Quiz',
                    category: studentEnrolledSubjects[0] || 'Mathematics',
                  };
                  playSubjectPublicationChime();
                  const sent = sendSubjectPublicationBrowserPush(
                    targetComp as any,
                    studentEnrolledSubjects[0] || 'Mathematics',
                    language
                  );
                  setAvatarToast(
                    sent
                      ? (language === 'ta' ? '🔔 சோதனை அறிவிப்பு உங்கள் திரைக்கு அனுப்பப்பட்டது!' : '🔔 Test notification & chime sent to your screen!')
                      : (language === 'ta' ? '🔔 ஒலி ஒலித்தது! உலாவி அறிவிப்புக்கு Allow அழுத்தவும்.' : '🔔 Audio chime played! Click Allow for desktop push.')
                  );
                  setTimeout(() => setAvatarToast(null), 3500);
                }}
                className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <span>🔔</span>
                <span>{language === 'ta' ? 'சோதனை அறிவிப்பு அனுப்புக' : 'Test Push Notification'}</span>
              </button>
            </div>
          </div>

          {/* Official Higher Novas College Support & Social Channels Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-slate-50 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  HNC
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {language === 'ta' ? 'அதிகாரப்பூர்வ தொடர்புகள் & சமூக ஊடகங்கள்' : language === 'si' ? 'නිල සේවාවන් සහ සමාජ මාධ්‍ය' : 'Higher Novas College Official Support'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {language === 'ta' ? 'சந்தேகங்கள் மற்றும் உதவிக்கு எம்மை அணுகவும்' : language === 'si' ? 'ඕනෑම විමසීමක් සඳහා අප හා සම්බන්ධ වන්න' : 'Get direct institutional support & stay updated'}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {language === 'ta' ? 'நேரலை உதவி' : 'Active Support'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <a
                href="https://whatsapp.com/channel/0029VaEAS90Gk1FwJW7arA23"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-slate-800 text-xs block group-hover:text-emerald-700">WhatsApp Channel</span>
                    <span className="text-[10px] text-slate-500 font-medium">Official Community Updates</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
              </a>

              <a
                href="https://www.facebook.com/share/18cWgwEKmy/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-slate-800 text-xs block group-hover:text-blue-700">Facebook Page</span>
                    <span className="text-[10px] text-slate-500 font-medium">Official Announcements & News</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </a>

              <a
                href="https://wa.me/94741760710"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-slate-800 text-xs block group-hover:text-emerald-700">Phone & WhatsApp Support</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-800">+94 74 176 0710</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
              </a>

              <a
                href="mailto:highernovascollege01@gmail.com"
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="font-extrabold text-slate-800 text-xs block group-hover:text-blue-700">Official Help Email</span>
                    <span className="text-[10.5px] font-mono font-bold text-blue-800 truncate block">highernovascollege01@gmail.com</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Student Milestone Achievements & Badges */}
      <StudentAchievements />

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
              <div className="flex items-center gap-2">
                <SavePulseIndicator
                  status={profileSaveStatus}
                  lastSavedAt={profileLastSavedAt}
                  language={language}
                  variant="pill"
                  size="xs"
                />
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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

      {/* Enrolled Subjects & Push Notification Preferences Modal */}
      <EnrolledSubjectsModal
        isOpen={showSubjectsModal}
        onClose={() => setShowSubjectsModal(false)}
      />
    </div>
  );
};
