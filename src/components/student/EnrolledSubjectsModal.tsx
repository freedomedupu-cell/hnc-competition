import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Check,
  Plus,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import {
  SRI_LANKAN_ACADEMIC_SUBJECTS,
  SubjectItemMeta,
  getStoredSubjectPushSettings,
  saveSubjectPushSettings,
  requestSubjectPushPermission,
  sendSubjectPublicationBrowserPush,
  playSubjectPublicationChime,
  getDefaultSubjectsForGrade,
} from '../../utils/subjectNotificationUtils';

interface EnrolledSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnrolledSubjectsModal: React.FC<EnrolledSubjectsModalProps> = ({ isOpen, onClose }) => {
  const {
    studentEnrolledSubjects,
    updateStudentEnrolledSubjects,
    currentStudent,
    language,
    competitions,
  } = useApp();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
    return studentEnrolledSubjects && studentEnrolledSubjects.length > 0
      ? [...studentEnrolledSubjects]
      : getDefaultSubjectsForGrade(currentStudent?.gradeLevel || 'Grade 6');
  });

  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [pushSettings, setPushSettings] = useState(getStoredSubjectPushSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleSubject = (subjectName: string) => {
    setSelectedSubjects((prev) => {
      if (prev.some((s) => s.toLowerCase() === subjectName.toLowerCase())) {
        return prev.filter((s) => s.toLowerCase() !== subjectName.toLowerCase());
      } else {
        return [...prev, subjectName];
      }
    });
  };

  const handleAddCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (selectedSubjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast(
        language === 'ta'
          ? 'இந்த பாடம் ஏற்கனவே உங்கள் பட்டியலில் உள்ளது.'
          : 'This subject is already in your enrolled list.'
      );
      return;
    }
    setSelectedSubjects((prev) => [...prev, trimmed]);
    setCustomSubjectInput('');
    showToast(
      language === 'ta'
        ? `பாடம் சேர்க்கப்பட்டது: ${trimmed}`
        : `Added subject: ${trimmed}`
    );
  };

  const handleSelectDefaultRecommendations = () => {
    const defaults = getDefaultSubjectsForGrade(currentStudent?.gradeLevel || 'Grade 6');
    setSelectedSubjects(defaults);
    showToast(
      language === 'ta'
        ? 'உங்கள் வகுப்புக்கான பரிந்துரைக்கப்பட்ட பாடங்கள் தேர்ந்தெடுக்கப்பட்டன.'
        : 'Default subjects for your grade curriculum selected.'
    );
  };

  const handleRequestPushPermission = async () => {
    const res = await requestSubjectPushPermission();
    setPushSettings(getStoredSubjectPushSettings());
    if (res.granted) {
      showToast(
        language === 'ta'
          ? '🔔 உலாவி அறிவிப்பு அனுமதி வழங்கப்பட்டது!'
          : '🔔 Browser notification permission granted!'
      );
    } else {
      showToast(
        language === 'ta'
          ? '⚠️ உலாவி அனுமதி வழங்கப்படவில்லை.'
          : '⚠️ Browser permission was not granted.'
      );
    }
  };

  const handleToggleSound = () => {
    const nextVal = !pushSettings.soundEnabled;
    const updated = saveSubjectPushSettings({ soundEnabled: nextVal });
    setPushSettings(updated);
    if (nextVal) {
      playSubjectPublicationChime();
    }
  };

  const handleTestNotification = () => {
    const sampleComp = competitions[0] || {
      id: 'test-comp-1',
      title: 'Sri Lanka Olympiad Challenge 2026',
      competitionType: 'Quiz',
      category: selectedSubjects[0] || 'Mathematics',
    };
    playSubjectPublicationChime();
    const sent = sendSubjectPublicationBrowserPush(
      sampleComp as any,
      selectedSubjects[0] || 'Mathematics',
      language
    );
    if (sent) {
      showToast(
        language === 'ta'
          ? '🔔 சோதனை அறிவிப்பு உங்கள் திரையில் தோன்றியது!'
          : '🔔 Test notification & chime sent to your screen!'
      );
    } else {
      showToast(
        language === 'ta'
          ? '🔔 ஒலி ஒலித்தது! உலாவி அறிவிப்புக்கு "Allow Notifications" அழுத்தவும்.'
          : '🔔 Chime played! Click Allow Notifications for desktop push.'
      );
    }
  };

  const handleSave = async () => {
    if (selectedSubjects.length === 0) {
      showToast(
        language === 'ta'
          ? 'குறைந்தது ஒரு பாடத்தையாவது தெரிவு செய்யவும்.'
          : 'Please select at least one subject to stay notified.'
      );
      return;
    }
    setIsSaving(true);
    try {
      await updateStudentEnrolledSubjects(selectedSubjects);
      showToast(
        language === 'ta'
          ? 'பாடங்கள் & அறிவிப்பு விருப்பங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!'
          : 'Enrolled subjects & notification preferences saved successfully!'
      );
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Save subjects error:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl shadow-md shrink-0">
              🔔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-amber-300">
                  {language === 'ta' ? 'புஷ் அறிவிப்புகள்' : 'Push Notifications'}
                </span>
                <span className="text-xs text-blue-200 font-semibold">
                  {currentStudent?.gradeLevel || 'Grade 6'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                {language === 'ta'
                  ? 'பதிவு செய்யப்பட்ட பாடங்கள் & அறிவிப்புகள்'
                  : 'My Enrolled Subjects & Push Alerts'}
              </h2>
              <p className="text-xs text-blue-200/90 mt-0.5">
                {language === 'ta'
                  ? 'நீங்கள் தெரிவு செய்யும் பாடங்களில் புதிய போட்டிகள் அல்லது வினாடி வினாக்கள் வெளியாகும் போது உடனுக்குடன் உலாவி மற்றும் இன்-ஆப் அறிவிப்புகளைப் பெறுங்கள்.'
                  : 'Receive instant desktop push & in-app notifications whenever a teacher or admin publishes a new competition or quiz in your subjects.'}
              </p>
            </div>
          </div>
        </div>

        {/* Toast Popup inside modal */}
        {toastMsg && (
          <div className="bg-indigo-900 text-white text-xs px-4 py-2 font-semibold text-center animate-fadeIn shrink-0 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Browser & Sound Settings Control Card */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {language === 'ta' ? 'உலாவி புஷ் அறிவிப்புகள்' : 'Browser Push Notifications'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {pushSettings.permission === 'granted'
                      ? (language === 'ta' ? 'உலாவி அறிவிப்பு இயக்கப்பட்டுள்ளது' : 'Browser push notifications active')
                      : (language === 'ta' ? 'அனுமதி தேவை' : 'Permission required for desktop alerts')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pushSettings.permission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestPushPermission}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'அனுமதிக்க' : 'Allow Notifications'}</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'இயங்குகிறது' : 'Allowed'}</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`p-2 rounded-xl border transition-colors ${
                    pushSettings.soundEnabled
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
                  }`}
                  title={pushSettings.soundEnabled ? 'Mute Chime' : 'Enable Chime'}
                >
                  {pushSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  🔔 {language === 'ta' ? 'சோதனை ஒலி' : 'Test Push'}
                </button>
              </div>
            </div>
          </div>

          {/* 2. Enrolled Subjects Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>
                    {language === 'ta' ? 'உங்கள் விருப்பப் பாடங்கள்' : 'Select Enrolled Subjects'}
                  </span>
                  <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                    {selectedSubjects.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ta'
                    ? 'தெரிவு செய்யப்பட்ட பாடங்களில் மட்டுமே அறிவிப்புகள் அனுப்பப்படும்.'
                    : 'You will receive notifications exclusively for your selected subjects.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSelectDefaultRecommendations}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'வகுப்புப் பரிந்துரைகள்' : 'Grade Recommendations'}</span>
              </button>
            </div>

            {/* Grid of Subject Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SRI_LANKAN_ACADEMIC_SUBJECTS.map((subj) => {
                const isSelected = selectedSubjects.some(
                  (s) =>
                    s.toLowerCase() === subj.nameEn.toLowerCase() ||
                    s.toLowerCase() === subj.nameTa.toLowerCase() ||
                    s.toLowerCase() === subj.id.toLowerCase()
                );

                return (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => handleToggleSubject(subj.nameEn)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{subj.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {subj.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {subj.nameTa}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-transparent border border-slate-300'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Subject */}
            <div className="pt-2">
              <form onSubmit={handleAddCustomSubject} className="flex items-center gap-2">
                <input
                  type="text"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  placeholder={
                    language === 'ta'
                      ? 'பிற பாடம் சேர்க்க (எ.கா: பிரெஞ்சு, சித்திரம், புவியியல்...)'
                      : 'Add custom subject (e.g. French, Art, Geography, Music...)'
                  }
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={!customSubjectInput.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white transition-colors flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'சேர்' : 'Add'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-semibold">
            {selectedSubjects.length} {language === 'ta' ? 'பாடங்கள் தெரிவு செய்யப்பட்டுள்ளன' : 'subjects selected'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors rounded-xl hover:bg-slate-200/60"
            >
              {language === 'ta' ? 'ரத்து' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? (language === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (language === 'ta' ? 'சேமிக்க' : 'Save Preferences')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
