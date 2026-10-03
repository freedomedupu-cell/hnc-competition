import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DbAnnouncement } from '../../types';
import {
  Megaphone,
  Gift,
  Coins,
  Share2,
  Trophy,
  Pin,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Flame,
  Award,
  Bell,
} from 'lucide-react';

export const StudentAnnouncementsView: React.FC = () => {
  const { announcements, setStudentNav, currentStudent, language } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter only announcements intended for students or everyone
  const studentAnnouncements = announcements.filter(
    (a) => a.targetAudience === 'all' || a.targetAudience === 'students'
  );

  const filteredAnnouncements = studentAnnouncements.filter((a) => {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  const pinnedPointsAnnouncements = studentAnnouncements.filter(
    (a) => a.isPinned && (a.category === 'points_referral' || a.pointsReward)
  );

  const handleActionClick = (actionUrl?: string) => {
    if (actionUrl === 'referral') {
      setStudentNav('Referral & Points');
    } else if (actionUrl === 'competitions') {
      setStudentNav('Competitions');
    } else if (actionUrl === 'results') {
      setStudentNav('My Results');
    } else {
      setStudentNav('Referral & Points');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
              <Megaphone className="w-3.5 h-3.5" />
              <span>
                {language === 'ta'
                  ? 'உத்தியோகபூர்வ அறிவிப்புகள் பலகை'
                  : language === 'si'
                  ? 'නිල නිවේදන පුවරුව'
                  : 'Official Student Notice Board'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {language === 'ta'
                ? 'அதிகாரப்பூர்வ அறிவிப்புகள் & சுற்றறிக்கைகள்'
                : language === 'si'
                ? 'නිල නිවේදන සහ චක්‍රලේඛ'
                : 'Official Announcements & Circulars'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'ta'
                ? 'தேசிய கல்விப் போட்டிகள், தேர்வு சுற்றறிக்கைகள், வழிகாட்டல்கள், முடிவுகள் வெளியீடு மற்றும் நிர்வாக அறிவிப்புகள்.'
                : language === 'si'
                ? 'ජාතික අධ්‍යාපන තරඟ, විභාග උපදෙස්, ප්‍රතිඵල සහ නිල නිවේදන.'
                : 'Verified circulars, examination schedules, syllabus guidelines, results publications, and official notices.'}
            </p>
          </div>

          {/* Quick Points Balance Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-black flex items-center justify-center shadow-md">
              <Coins className="w-6 h-6 fill-amber-200" />
            </div>
            <div>
              <span className="text-[11px] text-amber-200 uppercase font-extrabold tracking-wider block">
                {language === 'ta' ? 'உங்கள் புள்ளிகள் இருப்பு' : 'Your Reward Points'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">
                  {currentStudent.referralPoints !== undefined ? currentStudent.referralPoints : 25}
                </span>
                <span className="text-xs font-bold text-amber-300">pts</span>
              </div>
              <button
                onClick={() => setStudentNav('Referral & Points')}
                className="text-[10px] text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1 mt-0.5"
              >
                <span>{language === 'ta' ? 'பகிர்ந்து மேலும் வெல்க' : 'Share & Earn More'}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PINNED POINTS ANNOUNCEMENTS SPOTLIGHT BANNER */}
      {pinnedPointsAnnouncements.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-amber-600 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">
              {language === 'ta'
                ? 'முக்கிய புள்ளி & பரிந்துரை சலுகை அறிவிப்பு (Featured Reward Campaign)'
                : 'Featured Points & Referral Reward Broadcast'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedPointsAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                      <Gift className="w-3.5 h-3.5 text-amber-600" />
                      <span>{ann.badgeText || `+${ann.pointsReward || 25} Points Bonus`}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {ann.publishedAt?.split('T')[0]}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {language === 'ta' && ann.titleTa ? ann.titleTa : ann.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {language === 'ta' && ann.contentTa ? ann.contentTa : ann.content}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 italic">
                    By {ann.authorName || 'HNC Board'}
                  </span>
                  <button
                    onClick={() => handleActionClick(ann.actionUrl)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>
                      {language === 'ta' && ann.actionLabelTa
                        ? ann.actionLabelTa
                        : ann.actionLabel || 'Claim & Share Now'}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {language === 'ta' ? 'அனைத்தும்' : language === 'si' ? 'සියල්ල' : 'All Updates'} ({studentAnnouncements.length})
        </button>

        <button
          onClick={() => setSelectedCategory('competition')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            selectedCategory === 'competition'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{language === 'ta' ? 'போட்டிகள் & தேர்வுகள்' : language === 'si' ? 'තරඟ සහ විභාග' : 'Competitions & Exams'}</span>
        </button>

        <button
          onClick={() => setSelectedCategory('award')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            selectedCategory === 'award'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'விருதுகள் & முடிவுகள்' : language === 'si' ? 'සම්මාන සහ ප්‍රතිඵල' : 'Awards & Results'}</span>
        </button>

        <button
          onClick={() => setSelectedCategory('general')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            selectedCategory === 'general'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{language === 'ta' ? 'பொதுவான அறிவிப்புகள்' : language === 'si' ? 'සාමාන්‍ය නිවේදන' : 'General Notices'}</span>
        </button>

        {studentAnnouncements.some((a) => a.category === 'points_referral') && (
          <button
            onClick={() => setSelectedCategory('points_referral')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
              selectedCategory === 'points_referral'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'புள்ளிகள் சலுகைகள்' : 'Points & Rewards'}</span>
          </button>
        )}
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-2xs">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">
              {language === 'ta'
                ? 'தற்போது புதிய அறிவிப்புகள் எதுவும் வெளியிடப்படவில்லை'
                : language === 'si'
                ? 'දැනට නව නිවේදන නොමැත'
                : 'No official announcements published yet'}
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              {language === 'ta'
                ? 'நிர்வாகக் குழுவினால் புதிய போட்டி வழிகாட்டல்கள், தேர்வு சுற்றறிக்கைகள் அல்லது முடிவுகள் வெளியிடப்பட்டதும் அவை உடனுக்குடன் இங்கு காண்பிக்கப்படும்.'
                : language === 'si'
                ? 'පරිපාලනය විසින් නව තරඟ උපදෙස්, විභාග චක්‍රලේඛ හෝ ප්‍රතිඵල ප්‍රකාශයට පත් කළ විට මෙහි දිස්වනු ඇත.'
                : 'Official competition circulars, exam schedules, and board notices will appear here as soon as they are broadcasted.'}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => {
            const isPoints = ann.category === 'points_referral' || !!ann.pointsReward;
            return (
              <div
                key={ann.id}
                className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all shadow-2xs hover:shadow-md ${
                  ann.isPinned
                    ? 'border-amber-300/80 bg-gradient-to-r from-amber-50/20 to-white'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {ann.isPinned && (
                      <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-amber-700" />
                        <span>Pinned Notice</span>
                      </span>
                    )}

                    {isPoints && (
                      <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{ann.badgeText || `🎁 +${ann.pointsReward || 25} Points Bonus`}</span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3" />
                      <span>{ann.publishedAt?.split('T')[0] || 'Recent'}</span>
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {language === 'ta' && ann.titleTa ? ann.titleTa : ann.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {language === 'ta' && ann.contentTa ? ann.contentTa : ann.content}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">
                      Official communication from <strong className="text-slate-600">{ann.authorName || 'HNC Examination Board'}</strong>
                    </span>

                    {ann.actionLabel && (
                      <button
                        onClick={() => handleActionClick(ann.actionUrl)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto ${
                          isPoints
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'
                        }`}
                      >
                        <span>
                          {language === 'ta' && ann.actionLabelTa ? ann.actionLabelTa : ann.actionLabel}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
