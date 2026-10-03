import React from 'react';
import {
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { DbAttempt, Competition } from '../../types';
import { useApp } from '../../context/AppContext';

interface SubmissionConfirmationViewProps {
  attempt: DbAttempt;
  competition: Competition;
  onReturnToCompetitions: () => void;
  onViewResults?: () => void;
}

export const SubmissionConfirmationView: React.FC<SubmissionConfirmationViewProps> = ({
  attempt,
  competition,
  onReturnToCompetitions,
  onViewResults,
}) => {
  const { language } = useApp();
  const isTimeout = attempt.status === 'timeout';
  const answeredCount = Object.keys(attempt.answers || {}).length;
  const totalQuestions = competition.questions?.length || competition.questionsCount || 10;
  const percentage = Math.round(((attempt.score || 0) / (attempt.totalMarks || 100)) * 100);

  return (
    <div
      id="submission-confirmation-container"
      className="max-w-3xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Confirmation Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Banner */}
        <div
          className={`p-8 text-white text-center ${
            isTimeout
              ? 'bg-gradient-to-br from-amber-600 via-orange-600 to-slate-900'
              : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900'
          }`}
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/20 backdrop-blur-md mb-4 ring-4 ring-white/10">
            {isTimeout ? (
              <Clock className="h-10 w-10 text-amber-200 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-emerald-200" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isTimeout
              ? (language === 'ta' ? 'நேரம் முடிந்தது – தானாகச் சமர்ப்பிக்கப்பட்டது' : language === 'si' ? 'කාලය අවසන් – ස්වයංක්‍රීයව යොමු විය' : 'Time Expired – Auto-Submitted')
              : (language === 'ta' ? 'போட்டி வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!' : language === 'si' ? 'තරඟය සාර්ථකව යොමු කරන ලදී!' : 'Competition Submitted Successfully!')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/80 max-w-lg mx-auto">
            {isTimeout
              ? (language === 'ta'
                  ? 'கவுண்டவுன் நேரம் 00:00 ஐ எட்டியது. பதிவு செய்யப்பட்ட விடைகள் அனைத்தும் தானாகவே சேமிக்கப்பட்டு மதிப்பீட்டிற்கு அனுப்பப்பட்டன.'
                  : language === 'si'
                  ? 'ඔබගේ ගණන් කිරීමේ කාලය 00:00 ට ළඟා විය. ඔබගේ සියලු සටහන් කළ පිළිතුරු ස්වයංක්‍රීයව සුරකින ලදී.'
                  : 'Your countdown timer reached 00:00. All your recorded answers have been automatically saved and processed in Firestore.')
              : (language === 'ta'
                  ? 'உங்கள் விடைகள் அதிகாரப்பூர்வ HNC Competition தேர்வுப் பதிவேட்டில் பாதுகாப்பாகப் பதிவு செய்யப்பட்டுள்ளன.'
                  : language === 'si'
                  ? 'ඔබගේ පිළිතුරු නිල HNC Competition විභාග ලේඛනයට ආරක්ෂිතව ඇතුළත් කර ඇත.'
                  : 'Your answers have been securely recorded into the official HNC Competition examination registry.')}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-1.5 text-xs font-mono text-white/90">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            {language === 'ta' ? 'முயற்சி எண்:' : language === 'si' ? 'උත්සාහ ID:' : 'Attempt ID:'} {attempt.attemptId}
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
              <span className="text-xs font-medium text-slate-500">
                {language === 'ta' ? 'பெற்ற புள்ளிகள்' : language === 'si' ? 'ලබා ගත් ලකුණු' : 'Score Achieved'}
              </span>
              <p className="text-2xl font-black text-blue-900 mt-1">
                {attempt.score} <span className="text-sm font-medium text-slate-400">/ {attempt.totalMarks}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
              <span className="text-xs font-medium text-slate-500">
                {language === 'ta' ? 'சதவீதம்' : language === 'si' ? 'ප්‍රතිශතය' : 'Percentage'}
              </span>
              <p className="text-2xl font-black text-indigo-900 mt-1">{percentage}%</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
              <span className="text-xs font-medium text-slate-500">
                {language === 'ta' ? 'விடையளித்தவை' : language === 'si' ? 'පිළිතුරු සැපයූ' : 'Answered'}
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {answeredCount} <span className="text-sm font-medium text-slate-400">/ {totalQuestions}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
              <span className="text-xs font-medium text-slate-500">
                {language === 'ta' ? 'நிலை' : language === 'si' ? 'තත්වය' : 'Status'}
              </span>
              <p className="text-sm font-bold text-emerald-700 mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {language === 'ta' ? 'நிறைவடைந்தது' : language === 'si' ? 'සම්පූර්ණයි' : 'Completed'}
              </p>
            </div>
          </div>

          {/* Verification Record */}
          <div className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-600" />
              {language === 'ta' ? 'சமர்ப்பிப்பு விவரங்கள் & சான்றிதழ்' : language === 'si' ? 'යොමු කිරීමේ විස්තර සහ ලදුපත' : 'Submission Details & Audit Receipt'}
            </h3>

            <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-700 pt-1">
              <div>
                <span className="text-slate-400 block">{language === 'ta' ? 'போட்டி பெயர்:' : language === 'si' ? 'තරඟයේ නම:' : 'Competition Name:'}</span>
                <span className="font-semibold text-slate-900">{competition.title}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{language === 'ta' ? 'வகை & மொழி:' : language === 'si' ? 'කාණ්ඩය සහ භාෂාව:' : 'Category & Medium:'}</span>
                <span className="font-semibold text-slate-900">
                  {competition.category} ({competition.language || 'English'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">{language === 'ta' ? 'சமர்ப்பிக்கப்பட்ட நேரம்:' : language === 'si' ? 'යොමු කළ වේලාව:' : 'Submission Timestamp:'}</span>
                <span className="font-semibold text-slate-900">
                  {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">{language === 'ta' ? 'வகுப்பு:' : language === 'si' ? 'ශ්‍රේණිය:' : 'Target Grade Level:'}</span>
                <span className="font-semibold text-slate-900">{competition.grade || 'Open'}</span>
              </div>
            </div>
          </div>

          {/* Single-Attempt Rule Banner */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-950">
                {language === 'ta' ? 'ஒரே ஒரு முறை மட்டுமே பங்கேற்க அனுமதி' : language === 'si' ? 'තනි උත්සාහ ප්‍රතිපත්තිය' : 'Strict Single-Attempt Policy Enforced'}
              </p>
              <p className="text-blue-800 mt-1">
                {language === 'ta'
                  ? 'உங்கள் தேர்வு முயற்சி நிறைவடைந்தது. கல்வி விதிமுறைகளின்படி, ஒவ்வொரு போட்டிக்கும் ஒரு மாணவர் ஒரு முறை மட்டுமே எழுத அனுமதிக்கப்படுகிறார்.'
                  : language === 'si'
                  ? 'ඔබගේ විභාග උත්සාහය අවසන් විය. අධ්‍යාපන මාර්ගෝපදේශ අනුව එක් සිසුවෙකුට එක් තරඟයක් සඳහා එක් උත්සාහයක් පමණක් අවසර දෙනු ලැබේ.'
                  : 'Your examination attempt has concluded. Per academic guidelines, candidates are permitted strictly one attempt per competition. The "Start Competition" button has been locked to "Completed" for this event.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200">
            {onViewResults && (
              <button
                id="view-in-results-btn"
                type="button"
                onClick={onViewResults}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Award className="h-4 w-4 text-amber-600" />
                {language === 'ta' ? 'எனது பெறுபேறுகளைப் பார்' : language === 'si' ? 'මගේ ප්‍රතිඵල බලන්න' : 'View in My Results'}
              </button>
            )}

            <button
              id="return-to-competitions-btn"
              type="button"
              onClick={onReturnToCompetitions}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
            >
              <span>{language === 'ta' ? 'போட்டிகளுக்குத் திரும்புக' : language === 'si' ? 'තරඟ වෙත ආපසු යන්න' : 'Return to Competitions'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
