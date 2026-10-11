import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeedbackCategory, DbStudentFeedback } from '../../types';
import {
  MessageSquare,
  MessageCircle,
  Star,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  GraduationCap,
  MapPin,
  Trophy,
  Gamepad2,
  HelpCircle,
  Laptop,
  Lightbulb,
  Check,
  AlertCircle,
  CornerDownRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const StudentFeedbackView: React.FC = () => {
  const {
    currentStudent,
    currentAuthUser,
    feedbacks,
    submitFeedback,
    language,
    setStudentNav,
  } = useApp();

  // Tab: 'form' | 'history'
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Form State
  const [category, setCategory] = useState<FeedbackCategory>('competition');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student details fallback
  const studentName = currentAuthUser?.fullName || currentStudent?.name || 'Student';
  const studentSchool = currentAuthUser?.school || currentStudent?.institution || 'Sri Lanka School';
  const studentGrade = currentAuthUser?.grade || currentStudent?.gradeLevel || 'Grade 10';
  const studentDistrict = currentAuthUser?.district || currentStudent?.district || 'General';

  // Category definitions with localized labels
  const categories: {
    id: FeedbackCategory;
    titleEn: string;
    titleTa: string;
    titleSi: string;
    icon: React.ReactNode;
    color: string;
    descTa: string;
    descEn: string;
  }[] = [
    {
      id: 'competition',
      titleEn: 'Competition Experience',
      titleTa: 'போட்டி அனுபவம்',
      titleSi: 'තරඟ අත්දැකීම',
      icon: <Trophy className="w-4 h-4" />,
      color: 'from-amber-500 to-orange-500 text-amber-600 border-amber-200 bg-amber-50',
      descTa: 'நேர அளவு, வினாக்கள் அமைப்பு மற்றும் தேர்வு அனுபவம் பற்றிய கருத்து',
      descEn: 'Timing, exam rules, and overall contest structure',
    },
    {
      id: 'island_quest',
      titleEn: 'Edu-Arena Island Quest',
      titleTa: 'தீவுப் பயணம் / Edu-Arena',
      titleSi: 'Edu-Arena දූපත් තරඟය',
      icon: <Gamepad2 className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-500 text-emerald-600 border-emerald-200 bg-emerald-50',
      descTa: '25 மாவட்ட கேமிங், நிலைகள் மற்றும் புள்ளிகள் அனுபவம்',
      descEn: '25 district challenges, rewards, and gameplay',
    },
    {
      id: 'questions',
      titleEn: 'Question Quality & Doubts',
      titleTa: 'வினாக்கள் தரம் & விளக்கம்',
      titleSi: 'ප්‍රශ්නවල ගුණාත්මකභාවය',
      icon: <HelpCircle className="w-4 h-4" />,
      color: 'from-blue-500 to-cyan-500 text-blue-600 border-blue-200 bg-blue-50',
      descTa: 'பாடத்திட்டம், வினாக்களின் கடினத்தன்மை மற்றும் சந்தேகங்கள்',
      descEn: 'Curriculum alignment, question clarity, or dispute note',
    },
    {
      id: 'platform',
      titleEn: 'Platform Usability',
      titleTa: 'தளத்தின் தொழினுட்பம்',
      titleSi: 'පද්ධතියේ භාවිතය',
      icon: <Laptop className="w-4 h-4" />,
      color: 'from-purple-500 to-indigo-500 text-purple-600 border-purple-200 bg-purple-50',
      descTa: 'வலைத்தள வேகம், மொபைல் பயன்பாடு மற்றும் நேரலை கண்காணிப்பு',
      descEn: 'Page speed, mobile responsiveness, proctoring interface',
    },
    {
      id: 'suggestion',
      titleEn: 'New Ideas & Suggestions',
      titleTa: 'புதிய ஆலோசனைகள்',
      titleSi: 'නව යෝජනා',
      icon: <Lightbulb className="w-4 h-4" />,
      color: 'from-rose-500 to-pink-500 text-rose-600 border-rose-200 bg-rose-50',
      descTa: 'புதிய போட்டிகள், அம்சங்கள் மற்றும் எதிர்கால யோசனைகள்',
      descEn: 'Future contests, learning features, or community perks',
    },
  ];

  const ratingLabels: { [key: number]: { en: string; ta: string; emoji: string } } = {
    1: { en: 'Needs Improvement', ta: 'மேம்படுத்தப்பட வேண்டும்', emoji: '😕' },
    2: { en: 'Fair / Satisfactory', ta: 'சுமாரானது', emoji: '🙂' },
    3: { en: 'Good', ta: 'நன்று', emoji: '😊' },
    4: { en: 'Very Good', ta: 'மிக நன்று', emoji: '😃' },
    5: { en: 'Excellent!', ta: 'அற்புதம்! மிகச் சிறந்தது', emoji: '🌟' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!subject.trim()) {
      setErrorMsg(language === 'ta' ? 'தயவுசெய்து தலைப்பை உள்ளிடவும்.' : 'Please enter a subject.');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setErrorMsg(
        language === 'ta'
          ? 'தயவுசெய்து உங்கள் கருத்தை குறைந்தது 10 எழுத்துக்களில் விரிவாக எழுதவும்.'
          : 'Please enter detailed feedback (at least 10 characters).'
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        category,
        rating,
        subject: subject.trim(),
        message: isAnonymous ? `[அநாமதேய கருத்து / Anonymous Submission]\n${message.trim()}` : message.trim(),
      });

      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
      setRating(5);

      // Auto switch to history after 2 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('history');
      }, 1800);
    } catch (err: any) {
      console.error('Error submitting student feedback:', err);
      setErrorMsg(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter student's feedbacks
  const currentStudentId = currentAuthUser?.uid || currentStudent?.id;
  const myFeedbacks = feedbacks.filter((fb) => {
    if (!currentStudentId) return true;
    return fb.studentId === currentStudentId || fb.studentEmail === currentAuthUser?.email;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {language === 'ta'
                  ? 'மாணவர் குரல் & தர மேலாண்மை'
                  : language === 'si'
                  ? 'ශිෂ්‍ය හඬ සහ ගුණාත්මකභාවය'
                  : 'Student Voice & Platform Quality'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'ta'
                ? 'மாணவர் கருத்துப் படிவம் (Feedback Form)'
                : language === 'si'
                ? 'ශිෂ්‍ය ප්‍රතිපෝෂණ පෝරමය'
                : 'Student Feedback & Query Portal'}
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              {language === 'ta'
                ? 'போட்டிகள், வினாக்களின் தரம், Edu-Arena தீவுப் பயணம் மற்றும் உங்கள் ஆலோசனைகளை நேரடியாகப் பகிர்ந்துகொள்ளுங்கள். நிர்வாகக் குழு உங்கள் கருத்துக்களைக் கவனித்து மேம்படுத்தும்.'
                : language === 'si'
                ? 'තරඟ, ප්‍රශ්නවල ගුණාත්මකභාවය සහ නව යෝජනා පිළිබඳ ඔබේ ප්‍රතිපෝෂණය ලබා දෙන්න.'
                : 'Share your thoughts, report competition queries, evaluate question quality, and propose new features. Our academic jury directly reviews every submission.'}
            </p>
          </div>

          {/* Quick Counter Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xl">
              ⭐
            </div>
            <div>
              <div className="text-xs text-blue-200">
                {language === 'ta' ? 'சமர்ப்பித்த கருத்துகள்' : 'My Submissions'}
              </div>
              <div className="text-2xl font-black text-white">{myFeedbacks.length}</div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'form'
                ? 'bg-white text-blue-800 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{language === 'ta' ? 'கருத்து சமர்ப்பிக்க' : 'Submit Feedback'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-blue-800 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              {language === 'ta' ? 'எனது முந்தைய கருத்துகள்' : 'My Submissions & Replies'}
            </span>
            {myFeedbacks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
                {myFeedbacks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'form' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-8">
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">
                  {language === 'ta'
                    ? 'நன்றி! உங்கள் கருத்து வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது!'
                    : 'Thank you! Your feedback has been submitted successfully.'}
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {language === 'ta'
                    ? 'எங்கள் நடுவர் குழு உங்கள் கருத்தை ஆய்வு செய்து விரைவில் பதிலளிக்கும்.'
                    : 'Our academic panel will review your feedback and update you soon.'}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs sm:text-sm font-semibold">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Category Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1.{' '}
                {language === 'ta'
                  ? 'கருத்துப் பிரிவு (Category):'
                  : language === 'si'
                  ? 'ප්‍රවර්ගය තෝරන්න:'
                  : 'Select Category:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const selected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        selected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`p-2 rounded-lg ${
                            selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cat.icon}
                        </span>
                        {selected && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-800">
                          {language === 'ta'
                            ? cat.titleTa
                            : language === 'si'
                            ? cat.titleSi
                            : cat.titleEn}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {language === 'ta' ? cat.descTa : cat.descEn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Star Rating */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                2.{' '}
                {language === 'ta'
                  ? 'ஒட்டுமொத்த மதிப்பீடு (Rating):'
                  : 'Overall Experience Rating:'}
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating !== null ? hoverRating : rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1.5 text-2xl sm:text-3xl transition-transform hover:scale-125 focus:outline-none"
                      >
                        <span
                          className={
                            isFilled
                              ? 'text-amber-400 drop-shadow-sm'
                              : 'text-slate-300 hover:text-amber-200'
                          }
                        >
                          ★
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2">
                  <span className="text-lg">
                    {ratingLabels[hoverRating || rating]?.emoji || '⭐'}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? ratingLabels[hoverRating || rating]?.ta
                      : ratingLabels[hoverRating || rating]?.en}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                3.{' '}
                {language === 'ta'
                  ? 'கருத்தின் தலைப்பு (Subject):'
                  : 'Subject / Topic:'}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  language === 'ta'
                    ? 'எ.கா: கணித ஒலிம்பியாட் வினாக்கள் விளக்கம் / நேர அளவு பரிந்துரை'
                    : 'e.g., Mathematics Olympiad Question 4 clarification or app feedback'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>

            {/* 4. Detailed Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  4.{' '}
                  {language === 'ta'
                    ? 'விரிவான கருத்து அல்லது ஆலோசனை (Detailed Message):'
                    : 'Detailed Feedback / Query / Suggestion:'}
                </label>
                <span className="text-[11px] text-slate-400">{message.length} chars</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={
                  language === 'ta'
                    ? 'உங்கள் கருத்து, அனுபவம், சந்தேகம் அல்லது யோசனையை இங்கே விரிவாக எழுதவும்...'
                    : 'Describe your feedback, thoughts, or suggestions in detail...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>

            {/* 5. Submitter Profile Preview & Anonymous Option */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span>{isAnonymous ? 'அநாமதேயம் (Anonymous)' : studentName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">
                      {studentGrade}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                    <span>{studentSchool}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {studentDistrict}
                    </span>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>
                  {language === 'ta'
                    ? 'பெயரை மறைத்து அனுப்பவும் (Submit Anonymously)'
                    : 'Submit Anonymously'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubject('');
                  setMessage('');
                  setRating(5);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-all"
              >
                {language === 'ta' ? 'அழிக்க (Reset)' : 'Reset'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'ta' ? 'சமர்ப்பிக்கப்படுகிறது...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {language === 'ta'
                        ? 'கருத்தை சமர்ப்பிக்கவும் (Submit)'
                        : 'Submit Feedback'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>
                {language === 'ta'
                  ? 'நான் சமர்ப்பித்த கருத்துக்கள் & பதில்கள்'
                  : 'My Submitted Feedback & Official Replies'}
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {myFeedbacks.length}{' '}
              {language === 'ta' ? 'பதிவுகள்' : 'records'}
            </span>
          </div>

          {myFeedbacks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
                💬
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                {language === 'ta'
                  ? 'கருத்துகள் எதுவும் சமர்ப்பிக்கப்படவில்லை'
                  : 'No Feedback Submitted Yet'}
              </h4>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                {language === 'ta'
                  ? 'போட்டிகள் அல்லது தளம் பற்றிய உங்கள் கருத்துக்களை சமர்ப்பிக்க மேலே உள்ள "கருத்து சமர்ப்பிக்க" பொத்தானைப் பயன்படுத்தவும்.'
                  : 'Click "Submit Feedback" above to share your competition reviews, questions, or ideas.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'கருத்து எழுத' : 'Write Feedback'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myFeedbacks.map((fb) => {
                const statusBadge =
                  fb.status === 'resolved'
                    ? {
                        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        labelTa: 'பதிலளிக்கப்பட்டது (Resolved)',
                        labelEn: 'Admin Replied',
                      }
                    : fb.status === 'reviewed'
                    ? {
                        bg: 'bg-blue-50 text-blue-700 border-blue-200',
                        labelTa: 'பார்வையிடப்பட்டது (Reviewed)',
                        labelEn: 'Reviewed by Jury',
                      }
                    : {
                        bg: 'bg-amber-50 text-amber-700 border-amber-200',
                        labelTa: 'ஆய்வில் உள்ளது (Pending)',
                        labelEn: 'Under Review',
                      };

                return (
                  <div
                    key={fb.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {fb.category}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}
                          >
                            {language === 'ta' ? statusBadge.labelTa : statusBadge.labelEn}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-base mt-1.5">
                          {fb.subject}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center text-amber-500 font-bold">
                          {'★'.repeat(fb.rating || 5)}
                          <span className="text-slate-400 font-normal ml-1">
                            ({fb.rating || 5}/5)
                          </span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-slate-700 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                      {fb.message}
                    </div>

                    {/* Admin Response Box if available */}
                    {fb.adminResponse && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                            <CornerDownRight className="w-4 h-4 text-blue-600" />
                            <span>
                              {language === 'ta'
                                ? 'நடுவர் / நிர்வாகியின் பதில் (Official Reply):'
                                : 'Academic Director / Jury Response:'}
                            </span>
                          </div>
                          {fb.adminRepliedBy && (
                            <span className="text-[10px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-100">
                              By: {fb.adminRepliedBy}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-blue-950 italic pl-5 leading-relaxed font-medium">
                          "{fb.adminResponse}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
