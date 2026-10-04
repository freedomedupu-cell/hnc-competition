import React from 'react';
import {
  X,
  Clock,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Play,
  Lock,
  Camera,
  Shield,
} from 'lucide-react';
import { Competition } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCompetitionQuestions } from '../../data/questionPool';
import { getCompetitionScheduleStatus } from '../../utils/competitionTimeUtils';
import { APP_LOGO } from '../../assets/logo';

interface CompetitionDetailsModalProps {
  competition: Competition;
  isOpen: boolean;
  onClose: () => void;
  onStartExam: (comp: Competition) => void;
}

export const CompetitionDetailsModal: React.FC<CompetitionDetailsModalProps> = ({
  competition,
  isOpen,
  onClose,
  onStartExam,
}) => {
  const { isStudentRegistered, registerStudentForCompetition, hasStudentSubmitted, getStudentAttempt, language } = useApp();

  if (!isOpen) return null;

  const isRegistered = isStudentRegistered(competition.id);
  const isSubmitted = hasStudentSubmitted(competition.id);
  const previousAttempt = getStudentAttempt(competition.id);
  const questions = getCompetitionQuestions(competition);
  const questionCount = questions.length || competition.questionsCount || 10;
  const totalMarks = competition.totalMarks || questions.reduce((sum, q) => sum + (q.marks || 0), 0) || 100;

  const schedule = getCompetitionScheduleStatus(competition);

  const handleAction = () => {
    if (isSubmitted) return;

    if (schedule.isUpcoming) {
      alert(
        language === 'ta'
          ? `⚠️ இந்த பரீட்சை இன்னும் தொடங்கவில்லை! ${schedule.formattedStart} அன்று தான் தானாகவே திறக்கப்படும்.`
          : language === 'si'
          ? `⚠️ මෙම විභාගය තවම ආරම්භ වී නැත! ${schedule.formattedStart} දින විවෘත වේ.`
          : `⚠️ Exam has not started yet! Opens automatically on ${schedule.formattedStart}.`
      );
      return;
    }

    if (!isRegistered) {
      registerStudentForCompetition(competition.id);
    }
    onStartExam(competition);
  };

  return (
    <div
      id="comp-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="comp-details-modal-card"
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shrink-0 flex items-center justify-center shadow-md">
                <img
                  src={APP_LOGO}
                  alt="HNC Competition Logo"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-400/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  {competition.category} • {competition.competitionType}
                </span>
                <h2 className="mt-2 text-2xl font-bold text-white tracking-tight">
                  {competition.title}
                </h2>
                <p className="mt-1 text-xs text-blue-200/80 font-mono">
                  Code: {competition.code || `HNC-${competition.id.toUpperCase()}`}
                </p>
              </div>
            </div>
            <button
              id="close-details-modal-btn"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {language === 'ta'
                ? 'கண்ணோட்டம் & விளக்கம்'
                : language === 'si'
                ? 'දළ විශ්ලේෂණය සහ විස්තරය'
                : 'Overview & Description'}
            </h3>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              {competition.description ||
                (language === 'ta'
                  ? 'உங்கள் திறமைகளை சோதிக்கவும், உத்தியோகபூர்வ தரவரிசையைப் பெறவும், விருதுகளை வெல்லவும் இந்த HNC Competition கல்விசார் போட்டியில் பங்கேற்கவும்.'
                  : language === 'si'
                  ? 'ඔබේ කුසලතා පරීක්ෂා කිරීමට, පිළිගත් ප්‍රතිශතයන් ලබා ගැනීමට සහ සම්මාන සඳහා සුදුසුකම් ලැබීමට මෙම නිල HNC Competition අධ්‍යයන තරඟයට සහභාගී වන්න.'
                  : 'Participate in this official HNC Competition academic competition to test your skills, achieve recognized percentiles, and qualify for awards.')}
            </p>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                {language === 'ta' ? 'கால அளவு' : language === 'si' ? 'කාලය' : 'Duration'}
              </span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {competition.duration || 60}{' '}
                {language === 'ta' ? 'நிமிடங்கள்' : language === 'si' ? 'මිනිත්තු' : 'Minutes'}
              </p>
              <span className="text-[11px] text-slate-500">
                {language === 'ta' ? 'நிர்வாக அமைவு' : language === 'si' ? 'පරිපාලක සැකසුම' : 'Admin-Configured'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                {language === 'ta' ? 'Quiz வினாக்கள்' : language === 'si' ? 'Quiz ප්‍රශ්න' : 'Quiz Questions'}
              </span>
              <p className="mt-1 text-base font-bold text-blue-900">
                {questionCount} {language === 'ta' ? 'வினாக்கள்' : language === 'si' ? 'ප්‍රශ්න' : 'Questions'}
              </p>
              <span className="text-[11px] text-slate-500">
                {language === 'ta' ? 'பாடத்திட்ட வினாக்கள்' : language === 'si' ? 'විෂය ප්‍රශ්න' : 'Curriculum Items'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                {language === 'ta' ? 'மொத்த மதிப்பெண்' : language === 'si' ? 'මුළු ලකුණු' : 'Total Marks'}
              </span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {totalMarks} {language === 'ta' ? 'புள்ளிகள்' : language === 'si' ? 'ලකුණු' : 'Marks'}
              </p>
              <span className="text-[11px] text-slate-500">
                {language === 'ta' ? 'அதிகபட்ச புள்ளிகள்' : language === 'si' ? 'උපරිම ලකුණු' : 'Maximum Score'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                {language === 'ta' ? 'வகுப்பு / தரம்' : language === 'si' ? 'ශ්‍රේණිය' : 'Grade / Level'}
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {competition.grade || 'Open Level'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs font-medium text-slate-500">
                {language === 'ta' ? 'மொழி' : language === 'si' ? 'භාෂාව' : 'Language Medium'}
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {competition.language || 'English'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs font-medium text-slate-500">
                {language === 'ta' ? 'நுழைவுக் கட்டணம்' : language === 'si' ? 'ප්‍රවේශ ගාස්තුව' : 'Entry Fee'}
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {competition.entryType === 'Paid' && competition.entryFee
                  ? `LKR ${competition.entryFee.toLocaleString()}`
                  : (language === 'ta' ? 'இலவசப் பதிவு' : language === 'si' ? 'නොමිලේ ලියාපදිංචිය' : 'Free Enrollment')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-purple-600" />
                {language === 'ta' ? 'கேமரா அணுகல்' : language === 'si' ? 'කැමරා ප්‍රවේශය' : 'Camera Access'}
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {(typeof competition.requireCameraVerification === 'boolean'
                  ? competition.requireCameraVerification
                  : competition.competitionType === 'Exam')
                  ? (language === 'ta' ? '📸 தேவை (சரிபார்ப்பு)' : language === 'si' ? '📸 අවශ්‍යයි (සත්‍යාපනය)' : '📸 Required (Photo ID)')
                  : (language === 'ta' ? '⚡ தேவையில்லை' : language === 'si' ? '⚡ අවශ්‍ය නැත' : '⚡ Not Required')}
              </p>
              <span className="text-[11px] text-slate-500">
                {(typeof competition.requireCameraVerification === 'boolean'
                  ? competition.requireCameraVerification
                  : competition.competitionType === 'Exam')
                  ? (language === 'ta' ? 'தொடக்க முன் செல்ஃபி' : language === 'si' ? 'ආරම්භයට පෙර සෙල්ෆි' : 'Pre-exam selfie check')
                  : (language === 'ta' ? 'உடனடி நுழைவு' : language === 'si' ? 'ක්ෂණික ප්‍රවේශය' : 'Direct start')}
              </span>
            </div>
          </div>

          {/* Membership Requirement Banner */}
          {competition.membershipRequired && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
                  <Shield className="w-4 h-4 text-purple-700" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-950 block">
                    {language === 'ta'
                      ? 'மாதாந்த அங்கத்துவ அனுமதி தேவை (Monthly Membership Pass Required)'
                      : 'Monthly Membership Pass Required'}
                  </span>
                  <span className="text-[11px] text-purple-700">
                    {language === 'ta'
                      ? 'இந்தப் போட்டியில் பங்கேற்க செயற்பாட்டில் உள்ள மாதாந்த அங்கத்துவம் தேவை.'
                      : 'An active monthly membership subscription is required to enter and submit this competition.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dates & Timeline */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <Calendar className="h-4 w-4 text-blue-600" />
              {language === 'ta' ? 'போட்டி & பதிவு அட்டவணை' : language === 'si' ? 'තරඟ සහ ලියාපදිංචි කාලසටහන' : 'Competition & Registration Schedule'}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-500 font-medium block mb-1">
                  {language === 'ta' ? '📅 பதிவு காலம் (Registration Period):' : language === 'si' ? '📅 ලියාපදිංචි කාලය:' : '📅 Registration Window:'}
                </span>
                <p className="font-semibold text-slate-800">
                  {competition.registrationStart || '—'} {language === 'ta' ? 'முதல்' : language === 'si' ? 'සිට' : 'to'} {competition.registrationEnd || competition.registrationDeadline || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-slate-500 font-medium block mb-1">
                  {language === 'ta' ? '⏰ தேர்வு காலம் & நேரம் (Competition Date & Time):' : language === 'si' ? '⏰ තරඟ දිනය සහ වේලාව:' : '⏰ Competition Date & Time:'}
                </span>
                <p className="font-semibold text-purple-900">
                  {competition.competitionStart || competition.startDate || '—'} {competition.competitionStartTime ? `(${competition.competitionStartTime})` : ''} 
                  {' '}{language === 'ta' ? 'முதல்' : language === 'si' ? 'සිට' : 'to'}{' '}
                  {competition.competitionEnd || competition.endDate || '—'} {competition.competitionEndTime ? `(${competition.competitionEndTime})` : ''}
                </p>
              </div>
            </div>
            
            <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-100">
              <span className="text-slate-500">
                {language === 'ta' ? 'பதிவு நிலை:' : language === 'si' ? 'ලියාපදිංචි තත්ත්වය:' : 'Registration Status:'}
              </span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isRegistered
                  ? (language === 'ta' ? 'பதிவு செய்யப்பட்டுள்ளது' : language === 'si' ? 'ලියාපදිංචි වී ඇත' : 'Enrolled & Verified')
                  : (language === 'ta' ? 'பதிவுக்கு திறந்துள்ளது' : language === 'si' ? 'ලියාපදිංචිය සඳහා විවෘතයි' : 'Open for Registration')}
              </span>
            </div>
          </div>

          {/* Prize Details */}
          {competition.prizesEnabled && competition.prizeDetails && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-600" />
                {language === 'ta' ? 'பரிசு விபரங்கள் & சான்றிதழ்கள்' : language === 'si' ? 'ත්‍යාග විස්තර සහ සහතික' : 'Prize Details & Accreditations'}
              </h4>
              <ul className="mt-2.5 space-y-1.5 text-xs text-amber-950">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  <strong>{language === 'ta' ? '1ஆம் இடம்:' : language === 'si' ? '1 වන ස්ථානය:' : '1st Place:'}</strong> {competition.prizeDetails.firstPrize}
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
                  <strong>{language === 'ta' ? '2ஆம் இடம்:' : language === 'si' ? '2 වන ස්ථානය:' : '2nd Place:'}</strong> {competition.prizeDetails.secondPrize}
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-700" />
                  <strong>{language === 'ta' ? '3ஆம் இடம்:' : language === 'si' ? '3 වන ස්ථානය:' : '3rd Place:'}</strong> {competition.prizeDetails.thirdPrize}
                </li>
                {competition.prizeDetails.participationCertificate && (
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                    <strong>{language === 'ta' ? 'அனைத்து மாணவர்களுக்கும்:' : language === 'si' ? 'සියලු අපේක්ෂකයින්ට:' : 'All Candidates:'}</strong> {competition.prizeDetails.participationCertificate}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Attempt Notice */}
          {isSubmitted ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {language === 'ta' ? 'போட்டி நிறைவடைந்தது' : language === 'si' ? 'උත්සාහය සම්පූර්ණයි' : 'Attempt Completed'}
                </p>
                <p className="text-blue-700 mt-0.5">
                  {language === 'ta'
                    ? 'நீங்கள் ஏற்கனவே இப்போட்டியை எழுதி சமர்ப்பித்து விட்டீர்கள். விதிமுறைகளின்படி ஒரு மாணவருக்கு ஒரு முறை மட்டுமே அனுமதி உண்டு.'
                    : language === 'si'
                    ? 'ඔබ දැනටමත් මෙම තරඟය ඉදිරිපත් කර ඇත. ආයතනික නීති යටතේ එක් අපේක්ෂකයෙකුට එක් උත්සාහයකට පමණක් අවසර ඇත.'
                    : `You have already submitted this competition on ${previousAttempt?.submittedAt ? new Date(previousAttempt.submittedAt).toLocaleString() : 'record'}. Under institutional rules, only one attempt is permitted per candidate.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">
                  {language === 'ta' ? 'உத்தியோகபூர்வ பரீட்சை விதிமுறைகள்' : language === 'si' ? 'නිල විභාග රෙගුලාසි' : 'Official Exam Regulations'}
                </p>
                <p className="text-slate-600 mt-0.5">
                  {language === 'ta'
                    ? 'ஒவ்வொரு மாணவருக்கும் கண்டிப்பாக ஒரே ஒரு வாய்ப்பு மட்டுமே உண்டு.'
                    : language === 'si'
                    ? 'සෑම සිසුවෙකුටම තදින්ම ඇත්තේ එක් උත්සාහයක් පමණි.'
                    : 'Each student has strictly ONE attempt. Once you click "Start Competition", you will view the instruction checklist before launching the countdown timer.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 px-6 flex items-center justify-between">
          <button
            id="modal-cancel-btn"
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            {language === 'ta' ? 'மூடுக' : language === 'si' ? 'වසන්න' : 'Close'}
          </button>

          {isSubmitted ? (
            <button
              id="already-completed-btn"
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              {language === 'ta' ? 'முடிவடைந்தது' : language === 'si' ? 'සම්පූර්ණයි' : 'Completed'}
            </button>
          ) : schedule.isUpcoming ? (
            <button
              id="upcoming-competition-btn"
              type="button"
              onClick={handleAction}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 px-5 py-2.5 text-xs font-bold shadow-xs hover:bg-amber-200 transition cursor-pointer"
            >
              <Lock className="h-4 w-4 text-amber-700" />
              <span>
                {language === 'ta'
                  ? `பரீட்சை தொடங்கவில்லை (${schedule.formattedStart})`
                  : language === 'si'
                  ? `විභාගය ආරම්භ වී නැත (${schedule.formattedStart})`
                  : `Opens On ${schedule.formattedStart}`}
              </span>
            </button>
          ) : (
            <button
              id="start-competition-btn"
              type="button"
              onClick={handleAction}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
            >
              <Play className="h-4 w-4 fill-white" />
              {isRegistered
                ? (language === 'ta' ? 'போட்டியைத் தொடங்கு' : language === 'si' ? 'තරඟය ආරම්භ කරන්න' : 'Start Competition')
                : (language === 'ta' ? 'பதிவு செய்து தொடங்கு' : language === 'si' ? 'ලියාපදිංචි වී ආරම්භ කරන්න' : 'Register & Start')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
