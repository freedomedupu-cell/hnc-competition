import React, { useState } from 'react';
import { Modal } from './Modal';
import { Competition } from '../../types';
import { APP_LOGO } from '../../assets/logo';
import {
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  GraduationCap,
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  Award,
  Link as LinkIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition?: Competition | Partial<Competition> | null;
  customReferralCode?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  competition,
  customReferralCode,
}) => {
  const { language, currentAuthUser } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-hf3y3oosirb26omqwqx6g7-151010066822.asia-southeast1.run.app';

  const referralCode =
    customReferralCode ||
    currentAuthUser?.referralCode ||
    (currentAuthUser?.studentId ? `HNC-${currentAuthUser.studentId.toUpperCase().replace(/[^A-Z0-9]/g, '')}` : '');

  // Determine share URL and message
  let shareUrl = `${origin}?register=true`;
  if (competition && competition.id) {
    shareUrl = `${origin}?comp=${encodeURIComponent(competition.id)}&register=true`;
    if (referralCode) {
      shareUrl += `&ref=${encodeURIComponent(referralCode)}`;
    }
  } else if (referralCode) {
    shareUrl = `${origin}?register=true&ref=${encodeURIComponent(referralCode)}`;
  }

  // Generate invitation message
  let shareMessage = '';
  if (competition && competition.title) {
    const totalMarks =
      competition.totalMarks ||
      (competition.questions
        ? competition.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)
        : 100);
    const duration = competition.duration || 60;
    const entryFeeText =
      competition.entryType === 'Paid' && competition.entryFee && competition.entryFee > 0
        ? `LKR ${competition.entryFee.toLocaleString()}`
        : (language === 'ta' ? 'இலவசப் பதிவு (Free Entry)' : 'Free Entry');

    if (language === 'ta') {
      shareMessage = `🏆 *HNC தேசிய கல்விப் போட்டி / பரீட்சை அறிவிப்பு* 🇱🇰\n\n` +
        `📝 *${competition.title}*\n` +
        `🏷️ வகை: ${competition.competitionType || 'Competition'}\n` +
        `📚 தரம்: ${competition.grade || 'அனைத்து தரங்கள்'} | பாடம்: ${competition.category || 'பொது'}\n` +
        `⏱️ காலம்: ${duration} நிமிடங்கள் | புள்ளிகள்: ${totalMarks}\n` +
        `💰 நுழைவு: ${entryFeeText}\n\n` +
        (referralCode ? `🎁 எனது பரிந்துரைக் குறியீடு (Referral Code): *${referralCode}* (உடனடி போனஸ் புள்ளிகள் கிடைக்கும்!)\n\n` : '') +
        `👉 பதிவு செய்து பங்குபற்ற உடனே கிளிக் செய்யவும்:\n` +
        `${shareUrl}\n\n` +
        `தேசிய ரீதியிலான பதக்கங்கள், சான்றிதழ்கள் மற்றும் பரிசுகளை வெல்லுங்கள்! 🌟`;
    } else if (language === 'si') {
      shareMessage = `🏆 *HNC ජාතික ශිෂ්‍ය තරඟය / විභාග නිවේදනය* 🇱🇰\n\n` +
        `📝 *${competition.title}*\n` +
        `🏷️ වර්ගය: ${competition.competitionType || 'Competition'}\n` +
        `📚 ශ්‍රේණිය: ${competition.grade || 'සියලුම ශ්‍රේණි'} | විෂයය: ${competition.category || 'සාමාන්‍ය'}\n` +
        `⏱️ කාලය: මිනිත්තු ${duration} | මුළු ලකුණු: ${totalMarks}\n` +
        `💰 ඇතුල්වීම: ${entryFeeText}\n\n` +
        (referralCode ? `🎁 මගේ යොමු කේතය (Referral Code): *${referralCode}*\n\n` : '') +
        `👉 ලියාපදිංචි වී සහභාගී වීමට මෙතනින් පිවිසෙන්න:\n` +
        `${shareUrl}\n\n` +
        `ජාතික පදක්කම්, සහතික සහ ත්‍යාග දිනා ගන්න! 🌟`;
    } else {
      shareMessage = `🏆 *HNC National Student Competition & Olympiad* 🇱🇰\n\n` +
        `📝 *${competition.title}*\n` +
        `🏷️ Type: ${competition.competitionType || 'Competition'}\n` +
        `📚 Grade: ${competition.grade || 'Open'} | Subject: ${competition.category || 'General'}\n` +
        `⏱️ Duration: ${duration} Mins | Total Marks: ${totalMarks}\n` +
        `💰 Entry: ${entryFeeText}\n\n` +
        (referralCode ? `🎁 Referral Code: *${referralCode}* (Register with code to get instant bonus points!)\n\n` : '') +
        `👉 Register & Participate Now:\n` +
        `${shareUrl}\n\n` +
        `Compete nationwide to win national awards, certificates, and prizes! 🌟`;
    }
  } else {
    // General student registration share message
    if (language === 'ta') {
      shareMessage = `🎓 *HNC தேசிய கல்விப் போட்டி மற்றும் பரீட்சை தளம்* 🇱🇰\n\n` +
        `இலங்கையின் தேசிய மட்ட மாணவர் வினாடி வினாக்கள், போட்டித் தேர்வுகள் மற்றும் ஒலிம்பியாட்களில் பங்குபற்ற இன்றே பதிவு செய்யுங்கள்!\n\n` +
        (referralCode ? `🎁 எனது பரிந்துரைக் குறியீடு: *${referralCode}* (பதிவின் போது உள்ளிட்டு போனஸ் புள்ளிகளைப் பெறுங்கள்)\n\n` : '') +
        `👉 மாணவர் நேரடி பதிவு இணைப்பு:\n` +
        `${shareUrl}\n\n` +
        `அனைத்து மாணவர்களும் பங்குபற்றி சான்றிதழ்கள் மற்றும் பரிசுகளை வெல்லலாம்! 🚀`;
    } else {
      shareMessage = `🎓 *HNC National Student Competition Platform* 🇱🇰\n\n` +
        `Join Sri Lanka's leading national academic competitions, quizzes, and olympiads!\n\n` +
        (referralCode ? `🎁 Referral Code: *${referralCode}* (Use code during registration for instant bonus points!)\n\n` : '') +
        `👉 Student Direct Registration Link:\n` +
        `${shareUrl}\n\n` +
        `Compete, earn recognized certificates, and win prizes! 🚀`;
    }
  }

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Fallback
      prompt('Copy link:', shareUrl);
    }
  };

  const handleCopyText = () => {
    try {
      navigator.clipboard.writeText(shareMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: competition?.title || 'HNC Student Competition',
          text: shareMessage,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleWhatsAppShare();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === 'ta'
          ? 'பகிர்வு மற்றும் பதிவு இணைப்பு (Share & Invite)'
          : language === 'si'
          ? 'බෙදාගැනීම සහ ලියාපදිංචි සබැඳිය'
          : 'Share & Invite Link'
      }
      subtitle={
        competition?.title
          ? `Invite students to: ${competition.title}`
          : 'Share official student registration link with students, parents, and schools'
      }
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Header Preview Banner */}
        <div className="rounded-xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-4.5 border border-blue-800/40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 p-2 border border-white/20 shrink-0 flex items-center justify-center">
              <img
                src={APP_LOGO}
                alt="HNC Logo"
                className="w-full h-full object-contain filter drop-shadow"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider border border-blue-400/30">
                  {competition?.competitionType || 'Student Portal'}
                </span>
                {competition?.grade && (
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-semibold">
                    {competition.grade}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white mt-1 truncate">
                {competition?.title || 'HNC National Student Competition Portal'}
              </h3>
              <p className="text-[11px] text-blue-200/90 mt-0.5">
                {language === 'ta'
                  ? 'மாணவர்கள் இந்த இணைப்பை கிளிக் செய்து நேரடியாக பதிவு செய்யலாம்'
                  : 'Students can click this link to register directly'}
              </p>
            </div>
          </div>
        </div>

        {/* Share URL Box */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta' ? 'நேரடிப் பதிவு இணைப்பு (Direct Link):' : 'Direct Registration URL:'}
              </span>
            </span>
            {copiedLink && (
              <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {language === 'ta' ? 'இணைப்பு நகலெடுக்கப்பட்டது!' : 'Copied to clipboard!'}
                </span>
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono text-xs select-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs shrink-0"
              title="Copy Link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? (language === 'ta' ? 'நகலானது' : 'Copied!') : (language === 'ta' ? 'நகலெடு' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Quick Social Actions: WhatsApp & WebShare */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>
              {language === 'ta'
                ? 'WhatsApp-ல் பகிர்க (WhatsApp Share)'
                : language === 'si'
                ? 'WhatsApp මඟින් බෙදාගන්න'
                : 'Share on WhatsApp'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-2xs"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>
              {copiedText
                ? (language === 'ta' ? 'முழு விபரம் நகலெடுக்கப்பட்டது!' : 'Invitation Text Copied!')
                : (language === 'ta' ? 'முழு அழைப்பை நகலெடு (Copy Text)' : 'Copy Invitation Text')}
            </span>
          </button>
        </div>

        {/* Invitation Preview Message Accordion / Box */}
        <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="font-semibold text-slate-700 text-[11px] block">
            {language === 'ta'
              ? 'பகிர்வு செய்தி மாதிரி (Invitation Message Preview):'
              : 'Invitation Message Preview:'}
          </span>
          <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto leading-relaxed select-all">
            {shareMessage}
          </pre>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            {language === 'ta'
              ? 'மாணவர்கள் கணக்கு தொடங்கியதும் நேரடியாக போட்டியில் இணைக்கப்படுவர்.'
              : 'New students will be directed to register, existing students can sign in.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {language === 'ta' ? 'மூடுக' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
