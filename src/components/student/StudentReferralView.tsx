import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Share2,
  Gift,
  Copy,
  Check,
  Trophy,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Star,
  Download,
  AlertCircle,
} from 'lucide-react';

export const StudentReferralView: React.FC = () => {
  const { currentStudent, currentAuthUser, students, awardSharePoints, redeemStudentPerk, language, setStudentNav } = useApp();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [shareSuccessToast, setShareSuccessToast] = useState<string | null>(null);
  const [redeemSuccessToast, setRedeemSuccessToast] = useState<string | null>(null);
  const [redeemErrorToast, setRedeemErrorToast] = useState<string | null>(null);

  const referralCode =
    currentStudent.referralCode ||
    currentAuthUser?.referralCode ||
    `HNC-${(currentStudent.studentId || currentStudent.username || 'STUDENT').toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

  const currentPoints = currentStudent.referralPoints ?? currentAuthUser?.referralPoints ?? 0;
  const totalReferrals = currentStudent.totalReferrals ?? currentAuthUser?.totalReferrals ?? 0;
  const totalShares = currentStudent.sharesCount ?? currentAuthUser?.sharesCount ?? 0;
  const redeemedPerks = currentStudent.redeemedPerks || currentAuthUser?.redeemedPerks || [];

  // Generate shareable URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-hf3y3oosirb26omqwqx6g7-151010066822.asia-southeast1.run.app';
  const shareUrl = `${baseUrl}?ref=${referralCode}`;

  const shareText =
    language === 'ta'
      ? `🏆 *இலங்கை தேசிய மாணவர் போட்டி தளம் (HNC Competition)* 🇱🇰\n\nநான் HNC தேசிய கல்விப் போட்டிகளில் பங்கேற்கிறேன்! கணிதம், விஞ்ஞானம், ஆங்கிலம் மற்றும் பொது அறிவுப் போட்டிகளில் பங்கேற்று பதக்கங்கள், பரிசுகள் மற்றும் சான்றிதழ்களை வெல்லுங்கள்.\n\nஎன் பரிந்துரை குறியீட்டை (Referral Code: *${referralCode}*) பயன்படுத்தி பதிவு செய்து உடனடி *போனஸ் புள்ளிகளை* பெறுங்கள்!\n\n👉 பதிவு செய்ய: ${shareUrl}`
      : language === 'si'
      ? `🏆 *ශ්‍රී ලංකා ජාතික ශිෂ්‍ය තරඟ වේදිකාව (HNC Competition)* 🇱🇰\n\nමම HNC ජාතික අධ්‍යයන තරඟාවලියට සහභාගී වෙමි! ගණිතය, විද්‍යාව, ඉංග්‍රීසි සහ තර්කන තරඟ ජයග්‍රහණය කර පදක්කම් සහ සහතික දිනාගන්න.\n\nමගේ Referral Code (*${referralCode}*) භාවිතා කර ලියාපදිංචි වී බෝනස් ලකුණු ලබාගන්න!\n\n👉 ලියාපදිංචි වන්න: ${shareUrl}`
      : `🏆 *HNC National Student Competition - Sri Lanka* 🇱🇰\n\nI'm participating in official national academic olympiads and competitions! Test your knowledge in Math, Science, English & IQ, and win national medals, awards and government-recognized certificates.\n\nRegister with my Referral Code *${referralCode}* to unlock instant bonus points!\n\n👉 Join here: ${shareUrl}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setShareSuccessToast(
      language === 'ta'
        ? '📋 லிங்க் பிரதி செய்யப்பட்டது! உங்கள் நண்பர் பதிவு செய்ததும் உங்களுக்கு +25 புள்ளிகள் சேரும்.'
        : language === 'si'
        ? '📋 ලින්ක් එක පිටපත් විය! මිතුරා ලියාපදිංචි වූ පසු ඔබට +25 ලකුණු හිමිවේ.'
        : '📋 Link copied! You will receive +25 points when your friend completes registration.'
    );
    setTimeout(() => setCopiedLink(false), 2500);
    setTimeout(() => setShareSuccessToast(null), 4000);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    setShareSuccessToast(
      language === 'ta'
        ? '📲 WhatsApp-ல் பகிரப்பட்டது! உங்கள் நண்பர் பதிவு செய்தவுடன் உங்களுக்கு +25 புள்ளிகள் சேரும்.'
        : language === 'si'
        ? '📲 WhatsApp වෙත යොමු විය! මිතුරා ලියාපදිංචි වූ පසු ඔබට +25 ලකුණු හිමිවේ.'
        : '📲 Shared to WhatsApp! You will receive +25 points when your friend completes registration.'
    );
    setTimeout(() => setShareSuccessToast(null), 4000);
  };

  const handleRedeem = async (perkId: string, cost: number, perkTitle: string) => {
    setRedeemErrorToast(null);
    setRedeemSuccessToast(null);

    if (currentPoints < cost) {
      setRedeemErrorToast(
        language === 'ta'
          ? `மன்னிக்கவும்! உங்களிடம் போதுமான புள்ளிகள் இல்லை. தேவை: ${cost} புள்ளிகள் (தற்போதைய இருப்பு: ${currentPoints}).`
          : `Insufficient points. Required: ${cost} pts (You have: ${currentPoints} pts).`
      );
      setTimeout(() => setRedeemErrorToast(null), 4000);
      return;
    }

    try {
      const ok = await redeemStudentPerk(perkId, cost);
      if (ok) {
        setRedeemSuccessToast(
          language === 'ta'
            ? `வெற்றிகரமாக செயல்படுத்தப்பட்டது! "${perkTitle}" உங்களுக்காக செயல்படுத்தப்பட்டது.`
            : `Success! "${perkTitle}" has been unlocked for your account!`
        );
        setTimeout(() => setRedeemSuccessToast(null), 4500);
      } else {
        setRedeemErrorToast('Could not redeem perk at this time.');
        setTimeout(() => setRedeemErrorToast(null), 3000);
      }
    } catch (err: any) {
      setRedeemErrorToast(err.message || 'Redemption error');
      setTimeout(() => setRedeemErrorToast(null), 3000);
    }
  };

  // Top Student Ambassadors across the platform
  const ambassadorList = [...students]
    .map((s) => ({
      name: s.name,
      school: s.institution,
      district: s.district || 'National',
      points: s.referralPoints ?? 50,
      referrals: s.totalReferrals ?? 0,
      studentId: s.studentId,
    }))
    .sort((a, b) => b.referrals - a.referrals || b.points - a.points)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notifications */}
      {shareSuccessToast && (
        <div className="p-4 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="font-semibold text-sm">{shareSuccessToast}</span>
          </div>
          <button onClick={() => setShareSuccessToast(null)} className="text-white/80 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {redeemSuccessToast && (
        <div className="p-4 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="font-semibold text-sm">{redeemSuccessToast}</span>
          </div>
          <button onClick={() => setRedeemSuccessToast(null)} className="text-white/80 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {redeemErrorToast && (
        <div className="p-4 bg-rose-600 text-white rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-200" />
            <span className="font-semibold text-sm">{redeemErrorToast}</span>
          </div>
          <button onClick={() => setRedeemErrorToast(null)} className="text-white/80 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-indigo-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {language === 'ta'
                  ? 'மாணவர் தூதுவர் & பரிந்துரை திட்டம்'
                  : language === 'si'
                  ? 'ශිෂ්‍ය තානාපති සහ නිර්දේශ වැඩසටහන'
                  : 'Student Ambassador & Referral Rewards'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {language === 'ta'
                ? 'நண்பர்களை அழைத்து புள்ளிகளைப் பெறுங்கள்! 🎁'
                : language === 'si'
                ? 'මිතුරන්ට ආරාධනා කර ලකුණු දිනාගන්න! 🎁'
                : 'Share & Earn Referral Points! 🎁'}
            </h1>
            <p className="text-indigo-200 text-xs md:text-sm mt-2 max-w-xl leading-relaxed">
              {language === 'ta'
                ? 'உங்கள் நண்பர்களை HNC தேசியப் போட்டிகளுக்கு அழையுங்கள். உங்கள் குறியீட்டைப் பயன்படுத்தி நண்பர் பதிவு செய்யும்போது உங்களுக்கு +25 புள்ளிகள் மற்றும் நண்பருக்கு +25 போனஸ் புள்ளிகள் கிடைக்கும்! 200 புள்ளிகளில் இலவச தேர்வு, 500 புள்ளிகளில் மாணவர் தூதர் சான்றிதழ், 1000 புள்ளிகளில் தங்க நட்சத்திர தூதர் பேட்ஜை வெல்லுங்கள்.'
                : language === 'si'
                ? 'HNC ජාතික තරඟාවලියට ඔබේ මිතුරන්ට ආරාධනා කරන්න. ඔබේ කේතය මඟින් මිතුරෙකු ලියාපදිංචි වූ විට ඔබට +25 ලකුණු සහ මිතුරාට +25 බෝනස් ලකුණු ලැබේ! ලකුණු 200කින් නොමිලේ විභාග, 500කින් තානාපති සහතික සහ 1000කින් රන් තරු ලාංඡන ලබාගන්න.'
                : 'Invite classmates and friends to HNC academic competitions. When a friend registers with your referral code, both of you earn 25 Points! Redeem 200 points for Free Exam entries, 500 points for Student Ambassador Certificate, and 1,000 points for Gold Star Ambassador Badge.'}
            </p>
          </div>

          {/* Points Balance Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center min-w-[220px] shadow-lg flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">
              {language === 'ta' ? 'உங்கள் புள்ளிகள் இருப்பு' : 'Your Reward Points'}
            </span>
            <div className="text-3xl font-extrabold text-amber-300 mt-1">
              {currentPoints} <span className="text-sm font-medium text-white/80">PTS</span>
            </div>
            <div className="text-[11px] text-emerald-300 font-medium mt-1">
              {currentPoints >= 1000
                ? '⭐ Gold Star Ambassador Achieved!'
                : currentPoints >= 500
                ? `Next: Gold Star Badge at 1000 pts (${1000 - currentPoints} to go)`
                : currentPoints >= 200
                ? `Next: Ambassador Cert at 500 pts (${500 - currentPoints} to go)`
                : `Next: Free Exam at 200 pts (${200 - currentPoints} to go)`}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-black/20 rounded-xl p-3">
            <div className="text-slate-300">
              {language === 'ta' ? 'வெற்றிகரமான பதிவுகள்' : 'Registered Friends'}
            </div>
            <div className="text-xl font-bold text-white mt-1">{totalReferrals} Students</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <div className="text-slate-300">
              {language === 'ta' ? 'பரிந்துரை போனஸ்' : 'Referral Rate'}
            </div>
            <div className="text-xl font-bold text-emerald-300 mt-1">+25 PTS / Registration</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="text-slate-300">
              {language === 'ta' ? 'பெறப்பட்ட சலுகைகள்' : 'Perks Redeemed'}
            </div>
            <div className="text-xl font-bold text-amber-300 mt-1">{redeemedPerks.length} Unlocked</div>
          </div>
        </div>
      </div>

      {/* Share Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Your Personal Referral Code & Link */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-base">
              <Share2 className="w-5 h-5 text-blue-600" />
              <span>
                {language === 'ta' ? 'உங்கள் தனித்துவமான பரிந்துரை குறியீடு' : 'Your Unique Referral Code'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ta'
                ? 'உங்கள் நண்பர்கள் தங்கள் கணக்கை பதிவு செய்யும் போது இந்த குறியீட்டை உள்ளிட்டால் மட்டுமே புள்ளிகள் கிடைக்கும்.'
                : 'Share this code with friends. When they complete registration using your code, both of you earn bonus points!'}
            </p>

            {/* Code Box */}
            <div className="bg-slate-50 border-2 border-dashed border-blue-300 rounded-xl p-4 flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  {language === 'ta' ? 'பரிந்துரை குறியீடு' : 'Referral Code'}
                </span>
                <div className="text-xl font-mono font-extrabold text-slate-900 tracking-wider">
                  {referralCode}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Link Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 mb-4">
              <span className="text-xs text-slate-600 font-mono truncate select-all">{shareUrl}</span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block">
              {language === 'ta' ? 'நண்பர்களுடன் பகிர்க:' : 'Share with Classmates:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Share Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Box 2: How It Works & Rewards Rules */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-base">
              <Gift className="w-5 h-5 text-amber-500" />
              <span>{language === 'ta' ? 'எவ்வாறு செயல்படுகிறது?' : 'How Referral Rewards Work'}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ta'
                ? 'நண்பர் பதிவு செய்யும் போது மட்டுமே புள்ளிகள் வழங்கப்படும்:'
                : 'Points are awarded strictly when registration is completed:'}
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-900">
                    {language === 'ta' ? 'லிங்க் அல்லது குறியீட்டைப் பகிருங்கள்' : 'Share Link or Code'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {language === 'ta'
                      ? 'WhatsApp, பள்ளி அல்லது வகுப்பு தோழர்களுடன் உங்கள் பரிந்துரை குறியீட்டைப் பகிருங்கள்.'
                      : 'Share your referral code or direct link with classmates and friends.'}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span>{language === 'ta' ? 'நண்பர் பதிவு செய்தவுடன் (+25 புள்ளிகள்)' : 'Registration Complete (+25 Points)'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px]">On Signup</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {language === 'ta'
                      ? 'நண்பர் தனது புதிய மாணவர் கணக்கை வெற்றிகரமாக பதிவு செய்ததும் உங்களுக்கு +25 புள்ளிகள் மற்றும் நண்பருக்கு +25 போனஸ் புள்ளிகள் கிடைக்கும்.'
                      : 'Points are credited when a new student registers with your referral code (+25 to you, +25 to your friend).'}
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    {language === 'ta' ? 'மைல்கல் பரிசுகளை மீட்டெடுங்கள்' : 'Redeem Milestones & Honors'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {language === 'ta'
                      ? '200 புள்ளிகளில் இலவச தேர்வு, 500 புள்ளிகளில் உத்தியோகபூர்வ மாணவர் தூதர் சான்றிதழ், 1000 புள்ளிகளில் தங்க நட்சத்திர தூதர் பேட்ஜ்!'
                      : 'Unlock 200 pts Free Exam Voucher, 500 pts Student Ambassador Certificate, and 1,000 pts Gold Star Ambassador Badge!'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Store & Perks Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>{language === 'ta' ? 'வெகுமதிகள் பட்டியல்' : 'Rewards & Perks Store'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ta'
                ? 'உங்கள் புள்ளிகளைப் பயன்படுத்தி கீழேயுள்ள அதிகாரப்பூர்வ சலுகைகளை இப்போதே பெற்றுக் கொள்ளுங்கள்.'
                : 'Redeem your points balance for free exams, ambassador certificates, and elite gold star badges.'}
            </p>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>Balance: <strong>{currentPoints} PTS</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Perk 1: Free Paid Competition Ticket */}
          <div className="border border-slate-200 hover:border-blue-400 rounded-xl p-5 bg-gradient-to-b from-white to-slate-50 flex flex-col justify-between transition-all shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  🎟️
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  200 PTS
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {language === 'ta' ? '100% இலவச தேர்வு அனுமதி சீட்டு' : '100% Free Exam Entry Voucher'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'ta'
                  ? 'ரூபாய் 500-1000 பெறுமதியான எந்தவொரு தேசிய ஒலிம்பியாட் அல்லது போட்டித் தேர்விலும் கட்டணமின்றி 100% இலவசமாகப் பங்கேற்கலாம்.'
                  : 'Full exam fee waiver for any paid national Olympiad examination (Value up to 1,000 LKR).'}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() =>
                  handleRedeem('free_entry_ticket', 200, language === 'ta' ? '100% இலவச தேர்வு அனுமதி சீட்டு' : 'Free Exam Entry Voucher')
                }
                disabled={currentPoints < 200}
                className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  currentPoints >= 200
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {currentPoints >= 200 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'ta' ? '200 புள்ளிகள் மூலம் பெறுக' : 'Redeem 200 PTS'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Need {200 - currentPoints} more pts</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Perk 2: Student Ambassador E-Certificate */}
          <div className="border border-slate-200 hover:border-amber-400 rounded-xl p-5 bg-gradient-to-b from-white to-slate-50 flex flex-col justify-between transition-all shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  📜
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  500 PTS
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {language === 'ta' ? 'மாணவர் தூதர் சான்றிதழ்' : 'Student Ambassador Certificate'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'ta'
                  ? 'பள்ளி மற்றும் சமூக மட்டத்தில் போட்டிகளை ஊக்குவித்தமைக்கான அதிகாரப்பூர்வ HNC மாணவர் தூதர் பாராட்டுச் சான்றிதழ்.'
                  : 'Official HNC Educational Council Student Ambassador Certificate of Appreciation and Leadership Distinction.'}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() =>
                  handleRedeem('ambassador_cert', 500, language === 'ta' ? 'மாணவர் தூதர் சான்றிதழ்' : 'Student Ambassador Certificate')
                }
                disabled={currentPoints < 500}
                className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  currentPoints >= 500
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {currentPoints >= 500 ? (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Redeem 500 PTS</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Need {500 - currentPoints} more pts</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Perk 3: Star Ambassador Badge */}
          <div className="border border-slate-200 hover:border-purple-400 rounded-xl p-5 bg-gradient-to-b from-white to-slate-50 flex flex-col justify-between transition-all shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  ⭐
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                  1000 PTS
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {language === 'ta' ? 'தங்க நட்சத்திர தூதர் விருது & பேட்ஜ்' : 'Gold Star Ambassador Badge'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'ta'
                  ? 'உங்கள் மாணவர் சுயவிவரம் மற்றும் முடிவுகள் தரவரிசையில் தோன்றும் நிரந்தர தங்க நட்சத்திர தூதர் கௌரவ பேட்ஜ்.'
                  : 'Permanent Gold Star verified status on your profile and leaderboards, plus physical honors medal presentation.'}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() =>
                  handleRedeem('star_badge', 1000, language === 'ta' ? 'தங்க நட்சத்திர தூதர் விருது' : 'Gold Star Ambassador Badge')
                }
                disabled={currentPoints < 1000}
                className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  currentPoints >= 1000
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {currentPoints >= 1000 ? (
                  <>
                    <Star className="w-4 h-4" />
                    <span>Redeem 1000 PTS</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Need {1000 - currentPoints} more pts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ambassador Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>{language === 'ta' ? 'தேசிய மாணவர் தூதுவர் தரவரிசை' : 'National Student Ambassador Leaderboard'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ta'
                ? 'இலங்கை முழுவதும் அதிக மாணவர்களை இணைத்த சிறந்த தூதுவர்கள்'
                : 'Top ranking student advocates encouraging academic contest participation across Sri Lanka'}
            </p>
          </div>
          <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Top Advocates 🇱🇰
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'மாணவர் பெயர்' : 'Student'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'பாடசாலை' : 'School'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'மாவட்டம்' : 'District'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'ta' ? 'நண்பர்கள்' : 'Referrals'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'ta' ? 'புள்ளிகள்' : 'Points'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Highlight current student if logged in */}
              <tr className="bg-blue-50/70 font-semibold text-blue-900">
                <td className="py-3 px-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] inline-flex items-center justify-center">
                    ★
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{currentStudent.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-200 text-blue-800">You</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{referralCode}</div>
                </td>
                <td className="py-3 px-3 text-slate-700">{currentStudent.institution}</td>
                <td className="py-3 px-3 text-slate-600">{currentStudent.district || 'National'}</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">{totalReferrals}</td>
                <td className="py-3 px-3 text-right font-bold text-amber-600">{currentPoints} PTS</td>
              </tr>

              {ambassadorList.map((amb, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-400">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{amb.name}</td>
                  <td className="py-3 px-3 text-slate-600">{amb.school}</td>
                  <td className="py-3 px-3 text-slate-500">{amb.district}</td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700">{amb.referrals}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{amb.points} PTS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
