import React from 'react';
import {
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  CheckCircle,
  FileText,
  Play,
  X,
  ShieldAlert,
  Camera,
  Lock,
} from 'lucide-react';
import { Competition } from '../../types';
import { getCompetitionQuestions } from '../../data/questionPool';
import { getCompetitionScheduleStatus } from '../../utils/competitionTimeUtils';
import { useApp } from '../../context/AppContext';
import { APP_LOGO } from '../../assets/logo';

interface CompetitionInstructionsModalProps {
  competition: Competition;
  isOpen: boolean;
  onClose: () => void;
  onStartNow: () => void;
}

export const CompetitionInstructionsModal: React.FC<CompetitionInstructionsModalProps> = ({
  competition,
  isOpen,
  onClose,
  onStartNow,
}) => {
  const { language } = useApp();
  if (!isOpen) return null;

  const questions = getCompetitionQuestions(competition);
  const questionCount = questions.length || competition.questionsCount || 10;
  const totalMarks = competition.totalMarks || questions.reduce((sum, q) => sum + (q.marks || 0), 0) || 100;
  const duration = competition.duration || 60;

  return (
    <div
      id="comp-instructions-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="comp-instructions-modal-card"
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-8"
      >
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white">
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <FileText className="h-3.5 w-3.5" />
                  {language === 'ta' ? 'பரீட்சை வழிகாட்டல்' : language === 'si' ? 'විභාග මාර්ගෝපදේශය' : 'Pre-Exam Briefing'}
                </span>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {language === 'ta'
                    ? 'பரீட்சை விதிகள் & வழிகாட்டல்கள்'
                    : language === 'si'
                    ? 'විභාග උපදෙස් සහ රීති'
                    : 'Exam Instructions & Guidelines'}
                </h2>
                <p className="mt-1 text-sm text-blue-100 font-medium">
                  {competition.title} ({competition.category})
                </p>
              </div>
            </div>
            <button
              id="close-instructions-btn"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
              aria-label="Cancel instructions"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Parameters Highlight Bar */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                {language === 'ta' ? 'கால அளவு' : language === 'si' ? 'කාලය' : 'Duration'}
              </span>
              <p className="text-xl font-bold text-blue-900">
                {duration} {language === 'ta' ? 'நிமிடங்கள்' : language === 'si' ? 'මිනිත්තු' : 'Mins'}
              </p>
              <span className="text-[11px] text-blue-600 block">
                {language === 'ta' ? 'நேரக் கட்டுப்பாடு' : language === 'si' ? 'නියමිත කාල සීමාව' : 'Strict Admin Limit'}
              </span>
            </div>

            <div className="space-y-1 border-x border-blue-200/60">
              <span className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                {language === 'ta' ? 'மொத்த வினாக்கள்' : language === 'si' ? 'මුළු ප්‍රශ්න' : 'Total Questions'}
              </span>
              <p className="text-xl font-bold text-indigo-900">{questionCount}</p>
              <span className="text-[11px] text-indigo-600 block">
                {language === 'ta' ? 'கட்டாயமானவை' : language === 'si' ? 'සියල්ල අනිවාර්යයි' : 'All Mandatory'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                {language === 'ta' ? 'மொத்த புள்ளிகள்' : language === 'si' ? 'මුළු ලකුණු' : 'Total Marks'}
              </span>
              <p className="text-xl font-bold text-amber-900">{totalMarks}</p>
              <span className="text-[11px] text-amber-600 block">
                {language === 'ta' ? 'அதிகபட்ச புள்ளிகள்' : language === 'si' ? 'උපරිම ලකුණු' : 'Max Score'}
              </span>
            </div>
          </div>

          {/* Camera Verification Notice Box */}
          {(typeof competition.requireCameraVerification === 'boolean'
            ? competition.requireCameraVerification
            : competition.competitionType === 'Exam') ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-900 text-xs">
              <Camera className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-indigo-950">
                  {language === 'ta'
                    ? '📸 கேமரா சரிபார்ப்பு கட்டாயம் (Camera Verification Required)'
                    : language === 'si'
                    ? '📸 කැමරා සත්‍යාපනය අනිවාර්යයි'
                    : '📸 Camera Verification Required Before Starting'}
                </strong>
                <p className="text-indigo-800 text-[11px] mt-0.5 leading-relaxed">
                  {language === 'ta'
                    ? '"இப்போதே தொடங்கு" பொத்தானை அழுத்தியவுடன், உங்களின் புகைப்படத்தை சரிபார்க்க கேமரா அனுமதி கேட்கப்படும். புகைப்படம் உறுதி செய்யப்பட்டதும் தேர்வு ஆரம்பமாகும்.'
                    : language === 'si'
                    ? 'ආරම්භ කිරීමට පෙර ඔබගේ අනන්‍යතාවය තහවුරු කිරීමට කැමරාව භාවිතයෙන් ඡායාරූපයක් ගත යුතුය.'
                    : 'When you click "Start Now", you will be prompted to allow camera access to take a quick verification selfie to ensure academic integrity.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-900 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-emerald-950">
                  {language === 'ta'
                    ? '⚡ உடனடி தொடக்கம் (கேமரா தேவையில்லை)'
                    : language === 'si'
                    ? '⚡ ක්ෂණික ප්‍රවේශය (කැමරාවක් අවශ්‍ය නොවේ)'
                    : '⚡ Instant Start (No Camera Required)'}
                </strong>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  {language === 'ta'
                    ? 'இந்த போட்டிக்கு கேமரா அனுமதி தேவையில்லை. நீங்கள் நேரடியாக வினாக்களுக்கு செல்லலாம்.'
                    : language === 'si'
                    ? 'මෙම තරඟය සඳහා කැමරා සත්‍යාපනය අවශ්‍ය නොවේ.'
                    : 'Camera permission is not required for this contest. You will proceed directly to your questions.'}
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Basic Exam Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-blue-600" />
              {language === 'ta' ? '1. அடிப்படை பரீட்சை விதிமுறைகள்' : language === 'si' ? '1. මූලික විභාග නීති' : '1. Basic Exam Rules'}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{language === 'ta' ? 'ஒற்றை வாய்ப்பு மட்டும்:' : language === 'si' ? 'එක් උත්සාහයක් පමණි:' : 'Single Attempt Only:'}</strong>{' '}
                  {language === 'ta'
                    ? 'உங்களுக்கு ஒரு வாய்ப்பு மட்டுமே அனுமதிக்கப்படும். சமர்ப்பித்த பின் மீண்டும் எழுத முடியாது.'
                    : language === 'si'
                    ? 'ඔබට අවසර ඇත්තේ එක් උත්සාහයකට පමණි. ඉදිරිපත් කළ පසු නැවත විභාගය ලිවිය නොහැක.'
                    : 'You are allowed strictly ONE attempt. Once submitted or timed out, the attempt cannot be reopened or retaken.'}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{language === 'ta' ? 'நேரக் கணிப்பான்:' : language === 'si' ? 'ගණන් කිරීමේ ටයිමරය:' : 'Countdown Timer:'}</strong>{' '}
                  {language === 'ta'
                    ? 'தொடக்க பொத்தானை அழுத்திய உடன் கவுண்ட்டவுன் தொடங்கும்.'
                    : language === 'si'
                    ? 'ආරම්භ බොත්තම ක්ලික් කළ වහාම ගණන් කිරීම ආරම්භ වේ.'
                    : `The countdown timer will start immediately when you click "Start Now". The timer runs continuously (${duration} minutes).`}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{language === 'ta' ? 'சுயமான பதில்:' : language === 'si' ? 'ස්වාධීන පිළිතුරු:' : 'Independent Work:'}</strong>{' '}
                  {language === 'ta'
                    ? 'எந்தவித வெளிப்புற உதவியும் இன்றி சுயமாக விடைகளை எழுத வேண்டும்.'
                    : language === 'si'
                    ? 'කිසිදු බාහිර උදව්වක් නොමැතිව ස්වාධීනව පිළිතුරු දිය යුතුය.'
                    : 'All answers must reflect your own individual knowledge without external aids or assistance.'}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{language === 'ta' ? 'வினாக்களிடையே நகர்தல்:' : language === 'si' ? 'ප්‍රශ්න අතර මාරු වීම:' : 'Free Navigation:'}</strong>{' '}
                  {language === 'ta'
                    ? 'முந்தைய மற்றும் அடுத்த பொத்தான்கள் மூலம் வினாக்களுக்கு இடையே எளிதாக மாறலாம். தெரிவுகள் தானாக சேமிக்கப்படும்.'
                    : language === 'si'
                    ? 'පෙර සහ ඊළඟ බොත්තම් භාවිතයෙන් නිදහසේ ප්‍රශ්න අතර මාරු විය හැක. පිළිතුරු ස්වයංක්‍රීයව සුරැකේ.'
                    : 'You can move freely between questions using Next, Previous, or the palette. Answers are saved automatically.'}
                </span>
              </li>
            </ul>
          </div>

          {/* Section 2: Submit Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              {language === 'ta' ? '2. சமர்ப்பிக்கும் வழிகாட்டல்' : language === 'si' ? '2. ඉදිරිපත් කිරීමේ උපදෙස්' : '2. Submit Instructions'}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{language === 'ta' ? 'இறுதி சமர்ப்பிப்பு:' : language === 'si' ? 'අවසන් ඉදිරිපත් කිරීම:' : 'Manual Submission:'}</strong>{' '}
                  {language === 'ta'
                    ? 'அனைத்து வினாக்களுக்கும் பதிலளித்த பிறகு "சமர்ப்பி" பொத்தானை அழுத்தவும்.'
                    : language === 'si'
                    ? 'සියලු ප්‍රශ්න අවසන් වූ පසු "ඉදිරිපත් කරන්න" බොත්තම ක්ලික් කරන්න.'
                    : 'Click the "Submit Competition" button when you have finished answering all questions.'}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{language === 'ta' ? 'நேரம் முடிந்தவுடன் தானியங்கி சமர்ப்பிப்பு:' : language === 'si' ? 'කාලය අවසන් වූ පසු ස්වයංක්‍රීය ඉදිරිපත් කිරීම:' : 'Automatic Submission at 00:00:'}</strong>{' '}
                  {language === 'ta'
                    ? 'நேரம் பூஜ்ஜியத்தை அடைந்தால், அது தானாகவே சமர்ப்பிக்கப்படும்.'
                    : language === 'si'
                    ? 'කාලය 00:00 ට ළඟා වූ විට ස්වයංක්‍රීයවම විභාගය ඉදිරිපත් කෙරේ.'
                    : 'If the countdown timer reaches 00:00, your exam will automatically submit immediately.'}
                </span>
              </li>
            </ul>
          </div>

          {/* Notice Alert */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {language === 'ta' ? 'ஆரம்பிக்கத் தயாரா?' : language === 'si' ? 'ආරම්භ කිරීමට සූදානම්ද?' : 'Ready to Begin?'}
              </p>
              <p className="text-amber-800 mt-0.5">
                {language === 'ta'
                  ? `"${language === 'ta' ? 'இப்போது தொடங்குக' : 'Start Now'}" பொத்தானை அழுத்தினால் உடனே ${duration} நிமிட கவுண்ட்டவுன் தொடங்கும். அமைதியான சூழலை உறுதிப்படுத்தவும்.`
                  : language === 'si'
                  ? `ආරම්භ කරන්න බොත්තම ක්ලික් කිරීමෙන් මිනිත්තු ${duration} ක ටයිමරය වහාම ක්‍රියාත්මක වේ.`
                  : `Clicking "Start Now" will immediately start the ${duration}-minute countdown timer. Ensure you have a stable connection.`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        {(() => {
          const schedule = getCompetitionScheduleStatus(competition);
          return (
            <div className="border-t border-slate-200 bg-slate-50 p-4 px-6 flex items-center justify-between">
              <button
                id="cancel-instruction-btn"
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                {language === 'ta' ? 'பின்செல்ல' : language === 'si' ? 'ආපසු යන්න' : 'Cancel & Go Back'}
              </button>

              {schedule.isUpcoming ? (
                <button
                  id="upcoming-start-btn"
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 px-5 py-2.5 text-xs font-bold shadow-xs cursor-not-allowed"
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
                  id="start-now-btn"
                  type="button"
                  onClick={onStartNow}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" />
                  {language === 'ta' ? 'இப்போது தொடங்குக' : language === 'si' ? 'දැන් ආරම්භ කරන්න' : 'Start Now'}
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
