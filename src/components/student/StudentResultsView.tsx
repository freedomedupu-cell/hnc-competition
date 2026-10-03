import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition, CompetitionResult } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { CompetitionLeaderboardModal } from '../common/CompetitionLeaderboardModal';
import { APP_LOGO } from '../../assets/logo';
import {
  Medal,
  Award,
  Calendar,
  FileCheck,
  Download,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Trophy,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const StudentResultsView: React.FC = () => {
  const { currentStudent, currentAuthUser, results, competitions, language } = useApp();
  const [selectedCertificate, setSelectedCertificate] = useState<CompetitionResult | null>(null);
  const [leaderboardComp, setLeaderboardComp] = useState<Competition | null>(null);
  const [exportedCert, setExportedCert] = useState<string | null>(null);

  const studentId = currentAuthUser?.uid || currentStudent.id;
  const studentName = currentAuthUser?.fullName || currentStudent.name;

  // Compute dynamic ranks per competition
  const rankedAllResults = React.useMemo(() => {
    const groups: Record<string, typeof results> = {};
    results.forEach((r) => {
      const compId = r.competitionId || 'default';
      if (!groups[compId]) groups[compId] = [];
      groups[compId].push(r);
    });

    const rankMap = new Map<string, { rank: number; percentile: number }>();

    Object.values(groups).forEach((compResults) => {
      const sorted = [...compResults].sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const timeA = a.submittedAt || a.publishedAt ? new Date(a.submittedAt || a.publishedAt || '').getTime() : 0;
        const timeB = b.submittedAt || b.publishedAt ? new Date(b.submittedAt || b.publishedAt || '').getTime() : 0;
        return timeA - timeB;
      });

      const total = sorted.length;
      sorted.forEach((r, idx) => {
        const computedRank = idx + 1;
        const percentile = total > 0 ? Math.max(1, Math.round(((total - idx) / total) * 100)) : 100;
        rankMap.set(r.id, { rank: computedRank, percentile });
      });
    });

    return results.map((r) => {
      const computed = rankMap.get(r.id);
      return {
        ...r,
        rank: computed ? computed.rank : (r.rank || 1),
        percentile: computed ? computed.percentile : (r.percentile || 100),
      };
    });
  }, [results]);

  const studentResults = rankedAllResults.filter(
    (r) =>
      r.studentId === studentId ||
      r.studentId === currentStudent.id ||
      r.studentName === studentName ||
      r.studentName === currentStudent.name
  );

  const getPrizeBadge = (rank?: number, prizeStatus?: string) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>
            {prizeStatus ||
              (language === 'ta'
                ? '1ஆம் பரிசு வெற்றியாளர்'
                : language === 'si'
                ? '1 වන ත්‍යාගලාභී'
                : '1st Prize Winner')}
          </span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
          <Medal className="w-3.5 h-3.5 text-slate-600 fill-slate-400" />
          <span>
            {prizeStatus ||
              (language === 'ta'
                ? '2ஆம் பரிசு வெற்றியாளர்'
                : language === 'si'
                ? '2 වන ත්‍යාගලාභී'
                : '2nd Prize Winner')}
          </span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
          <Medal className="w-3.5 h-3.5 text-amber-700 fill-amber-600" />
          <span>
            {prizeStatus ||
              (language === 'ta'
                ? '3ஆம் பரிசு வெற்றியாளர்'
                : language === 'si'
                ? '3 වන ත්‍යාගලාභී'
                : '3rd Prize Winner')}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
        <Award className="w-3.5 h-3.5 text-blue-600" />
        <span>
          {prizeStatus ||
            (language === 'ta'
              ? 'பங்கேற்புச் சான்றிதழ்'
              : language === 'si'
              ? 'සහභාගීත්ව සහතිකය'
              : 'Participation Certificate')}
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Medal className="w-5 h-5 text-blue-700" />
            <span>
              {language === 'ta'
                ? 'எனது முடிவுகள், தரவரிசை & கெளரவங்கள்'
                : language === 'si'
                ? 'මගේ ප්‍රතිඵල, ශ්‍රේණිගත කිරීම් සහ සම්මාන'
                : 'My Results, Rankings & Honors'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'உறுதிப்படுத்தப்பட்ட போட்டிப் புள்ளிகள், தனிநபர் தரவரிசை, பரிசு ஒதுக்கீடுகள் மற்றும் உத்தியோகபூர்வ சான்றிதழ்கள்.'
              : language === 'si'
              ? 'තහවුරු කරන ලද ලකුණු, තනි ශ්‍රේණිගත කිරීම්, ත්‍යාග සහ නිල සහතික.'
              : 'Ratified competition scores, individual rank standing, prize allocations, and official certificates.'}
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-600" />
          <span>
            {studentResults.length}{' '}
            {language === 'ta'
              ? 'உத்தியோகபூர்வ முடிவுகள்'
              : language === 'si'
              ? 'නිල ප්‍රතිඵල'
              : 'Official Results'}
          </span>
        </div>
      </div>

      {/* Results Cards List */}
      <div className="space-y-4">
        {studentResults.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
            <Trophy className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-800 text-sm">
              {language === 'ta'
                ? 'இன்னும் வெளியிடப்பட்ட முடிவுகள் இல்லை'
                : language === 'si'
                ? 'තවමත් ප්‍රකාශිත ප්‍රතිඵල නොමැත'
                : 'No Published Results Yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {language === 'ta'
                ? 'நீங்கள் ஒலிம்பியாட் அல்லது வினாடி வினாப் போட்டியை முடித்தவுடன், முடிவுகள் மதிப்பீடு செய்யப்பட்டு இங்கே தோன்றும்.'
                : language === 'si'
                ? 'ඔබ තරඟයක් අවසන් කළ පසු සහ ප්‍රතිඵල ඇගයීමෙන් පසු, ඔබේ නිල ලකුණු සහ ශ්‍රේණිය මෙහි දිස්වනු ඇත.'
                : 'Once you complete an Olympiad or Quiz competition and results are evaluated and ratified, your official score, rank, and prize status will appear here.'}
            </p>
          </div>
        ) : (
          studentResults.map((res) => {
            const comp = competitions.find((c) => c.id === res.competitionId);

            return (
              <div
                key={res.id}
                id={`result-card-${res.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">
                        {res.competitionTitle}
                      </span>
                      {getPrizeBadge(res.rank, res.prizeStatus)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>{language === 'ta' ? 'மாணவர்:' : language === 'si' ? 'අපේක්ෂකයා:' : 'Candidate:'} {res.studentName}</span>
                      <span>•</span>
                      <span>Ref: {res.certificateId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {comp && (
                      <button
                        id={`btn-view-leaderboard-${res.id}`}
                        onClick={() => setLeaderboardComp(comp)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {language === 'ta'
                            ? 'தரவரிசை'
                            : language === 'si'
                            ? 'ප්‍රමුඛතා පුවරුව'
                            : 'Leaderboard'}
                        </span>
                      </button>
                    )}
                    <button
                      id={`btn-cert-${res.id}`}
                      onClick={() => setSelectedCertificate(res)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-blue-700" />
                      <span>
                        {language === 'ta'
                          ? 'சான்றிதழ்'
                          : language === 'si'
                          ? 'සහතිකය'
                          : 'Certificate'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      {language === 'ta'
                        ? 'பெற்ற புள்ளிகள்'
                        : language === 'si'
                        ? 'ලබාගත් ලකුණු'
                        : 'Earned Score'}
                    </span>
                    <div className="font-bold text-slate-900 text-base mt-0.5">
                      {res.score} <span className="text-xs text-slate-400 font-normal">/ {res.maxScore}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      {language === 'ta'
                        ? 'தேசிய தரவரிசை'
                        : language === 'si'
                        ? 'ජාතික ශ්‍රේණිය'
                        : 'National Rank'}
                    </span>
                    <div className="font-bold text-blue-800 text-base mt-0.5">
                      {language === 'ta'
                        ? `தரம் #${res.rank}`
                        : language === 'si'
                        ? `ස්ථානය #${res.rank}`
                        : `Rank #${res.rank}`}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      {language === 'ta'
                        ? 'பரிசு நிலை'
                        : language === 'si'
                        ? 'ත්‍යාග තත්ත්වය'
                        : 'Prize Standing'}
                    </span>
                    <div className="font-bold text-amber-700 text-xs mt-1 truncate">
                      {res.prizeStatus || (res.rank && res.rank <= 3 ? `${res.rank === 1 ? '1st' : res.rank === 2 ? '2nd' : '3rd'} Prize` : 'Certificate')}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      {language === 'ta'
                        ? 'சமர்ப்பிக்கப்பட்ட நேரம்'
                        : language === 'si'
                        ? 'ඉදිරිපත් කළ වේලාව'
                        : 'Submission Time'}
                    </span>
                    <div className="font-medium text-slate-700 text-xs mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {res.submittedAt
                          ? new Date(res.submittedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : res.publishedAt || 'Recorded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jury Evaluation Comment */}
                {res.feedback && (
                  <div className="p-3 bg-white rounded-lg border border-slate-100 text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      {language === 'ta'
                        ? 'நடுவர் கருத்து & வழிகாட்டல்:'
                        : language === 'si'
                        ? 'විනිසුරු ඇගයීම සහ ප්‍රතිපෝෂණය:'
                        : 'Jury Commendation & Academic Feedback:'}
                    </span>
                    <p className="text-slate-700 italic">"{res.feedback}"</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Official Certificate Modal */}
      {selectedCertificate && (
        <Modal
          isOpen={!!selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
          title={
            language === 'ta'
              ? 'உத்தியோகபூர்வ சாதனைச் சான்றிதழ்'
              : language === 'si'
              ? 'නිල අධ්‍යයන කුසලතා සහතිකය'
              : 'Official Academic Certificate of Achievement'
          }
          subtitle="HNC Competition Central Olympiad Registry"
          maxWidthClass="max-w-2xl"
        >
          <div className="space-y-6">
            {/* The Certificate Paper */}
            <div className="p-8 border-4 border-double border-blue-900/40 bg-gradient-to-b from-white to-blue-50/20 rounded-xl text-center space-y-5 shadow-inner">
              <div className="flex justify-center">
                <img
                  src={APP_LOGO}
                  alt="Official HNC Competition Seal"
                  className="w-16 h-16 rounded-2xl object-contain shadow-md border-2 border-blue-900/20 bg-white p-1"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-blue-900">
                  HNC Competition Academic Council
                </p>
                <h3 className="text-xl font-bold font-serif text-slate-900 mt-1">
                  {language === 'ta' ? 'சான்றிதழ்' : language === 'si' ? 'සහතිකය' : 'Certificate'} - {selectedCertificate.award}
                </h3>
                {selectedCertificate.prizeStatus && (
                  <p className="text-xs font-semibold text-amber-800 mt-1">
                    {language === 'ta' ? 'பரிசு கெளரவம்:' : language === 'si' ? 'ත්‍යාග ගෞරවය:' : 'Prize Honor:'} {selectedCertificate.prizeStatus}
                  </p>
                )}
              </div>

              <div className="space-y-1 py-1">
                <p className="text-xs text-slate-500">
                  {language === 'ta'
                    ? 'இவ்விருது பெருமையுடன் வழங்கப்படுகிறது'
                    : language === 'si'
                    ? 'මෙම සම්මානය සාඩම්බරයෙන් පිරිනමනු ලැබේ'
                    : 'This honor is proudly awarded to'}
                </p>
                <p className="text-lg font-bold text-slate-900 underline underline-offset-4 decoration-blue-500">
                  {selectedCertificate.studentName}
                </p>
                <p className="text-xs text-slate-600">
                  {language === 'ta'
                    ? 'பாடசாலை:'
                    : language === 'si'
                    ? 'නියෝජනය කරන්නේ:'
                    : 'Representing'}{' '}
                  {selectedCertificate.studentInstitution}
                </p>
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {language === 'ta' ? (
                  <>
                    <strong>{selectedCertificate.competitionTitle}</strong> போட்டியில் சிறப்பாக செயல்பட்டு, <strong>{selectedCertificate.score}/{selectedCertificate.maxScore}</strong> புள்ளிகளைப் பெற்று, தேசிய அளவில் <strong>தரவரிசை #{selectedCertificate.rank}</strong> பெற்றுள்ளார்.
                  </>
                ) : language === 'si' ? (
                  <>
                    <strong>{selectedCertificate.competitionTitle}</strong> තරඟයේ කැපී පෙනෙන දස්කම් දක්වමින්, <strong>{selectedCertificate.score}/{selectedCertificate.maxScore}</strong> ක තහවුරු කළ ලකුණු ලබා ගනිමින් ජාතික මට්ටමින් <strong>#{selectedCertificate.rank} වන ස්ථානය</strong> දිනා ගැනීම වෙනුවෙන්.
                  </>
                ) : (
                  <>
                    For distinguished performance in the <strong>{selectedCertificate.competitionTitle}</strong>, achieving a verified score of <strong>{selectedCertificate.score}/{selectedCertificate.maxScore}</strong> and placing <strong>Rank #{selectedCertificate.rank}</strong> nationwide.
                  </>
                )}
              </p>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <div className="text-left">
                  <p className="font-mono text-[10px] text-slate-400">
                    ID: {selectedCertificate.certificateId}
                  </p>
                  <p className="text-[10px]">HNC Digital Registry Verification</p>
                </div>

                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>
                    {language === 'ta'
                      ? 'சரிபார்க்கப்பட்ட சான்றிதழ்'
                      : language === 'si'
                      ? 'සත්‍යාපිත සහතිකය'
                      : 'Authenticated Credential'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                {language === 'ta' ? 'மூடுக' : language === 'si' ? 'වසන්න' : 'Dismiss'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportedCert(selectedCertificate.certificateId);
                  setTimeout(() => setExportedCert(null), 3000);
                  try {
                    window.print();
                  } catch {}
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                {exportedCert === selectedCertificate.certificateId ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{language === 'ta' ? 'சேமிக்கப்பட்டது!' : 'Credential Ready!'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {language === 'ta'
                        ? 'பதிவிறக்குக'
                        : language === 'si'
                        ? 'බාගන්න'
                        : 'Export Credential'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leaderboard Modal */}
      {leaderboardComp && (
        <CompetitionLeaderboardModal
          competition={leaderboardComp}
          results={results}
          currentStudentId={studentId}
          isOpen={!!leaderboardComp}
          onClose={() => setLeaderboardComp(null)}
        />
      )}
    </div>
  );
};
