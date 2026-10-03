import React from 'react';
import {
  X,
  Trophy,
  Medal,
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react';
import { Competition, CompetitionResult } from '../../types';
import { Badge } from './Badge';

interface CompetitionLeaderboardModalProps {
  competition: Competition;
  results: CompetitionResult[];
  currentStudentId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CompetitionLeaderboardModal: React.FC<CompetitionLeaderboardModalProps> = ({
  competition,
  results,
  currentStudentId,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Strict Ranking logic:
  // 1. Higher score first
  // 2. Earlier valid submission time if scores are equal
  const competitionResults = results
    .filter((r) => r.competitionId === competition.id)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const timeA = a.submittedAt || a.publishedAt ? new Date(a.submittedAt || a.publishedAt || '').getTime() : 0;
      const timeB = b.submittedAt || b.publishedAt ? new Date(b.submittedAt || b.publishedAt || '').getTime() : 0;
      return timeA - timeB;
    });

  // Assign computed ranks
  const rankedItems = competitionResults.map((item, idx) => {
    const rankNumber = idx + 1;
    let prize = item.prizeStatus;
    if (!prize) {
      if (rankNumber === 1) {
        prize = competition.prizeDetails?.firstPrize || '1st Prize';
      } else if (rankNumber === 2) {
        prize = competition.prizeDetails?.secondPrize || '2nd Prize';
      } else if (rankNumber === 3) {
        prize = competition.prizeDetails?.thirdPrize || '3rd Prize';
      } else {
        prize = competition.prizeDetails?.participationCertificate || 'Participation Certificate';
      }
    }
    return {
      ...item,
      computedRank: rankNumber,
      resolvedPrize: prize,
    };
  });

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs ring-2 ring-amber-400">
            🥇 1
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-extrabold text-xs ring-2 ring-slate-400">
            🥈 2
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-800/20 text-amber-950 font-extrabold text-xs ring-2 ring-amber-700/40">
            🥉 3
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
            #{rank}
          </span>
        );
    }
  };

  return (
    <div
      id="comp-leaderboard-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="comp-leaderboard-modal-card"
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/30">
                <Trophy className="h-3.5 w-3.5 text-amber-300" />
                Official Certified Leaderboard
              </span>
              <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight">
                {competition.title}
              </h2>
              <p className="mt-1 text-xs text-blue-200/80">
                {competition.category} • {competition.competitionType} • Grade {competition.grade || 'All'}
              </p>
            </div>
            <button
              id="close-leaderboard-modal-btn"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Podium / Prize Allocation Summary */}
        {competition.prizesEnabled && competition.prizeDetails && (
          <div className="bg-amber-50/60 border-b border-amber-200/60 p-4 px-6 text-xs text-amber-950">
            <h4 className="font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 text-[11px] mb-2">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Official Prize Rubric (Admin Configured)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 bg-white/80 rounded-lg border border-amber-200/80">
                <span className="font-bold text-amber-900 block text-[10px] uppercase">1st Place Prize</span>
                <span className="font-semibold text-slate-800 truncate block">{competition.prizeDetails.firstPrize}</span>
              </div>
              <div className="p-2 bg-white/80 rounded-lg border border-amber-200/80">
                <span className="font-bold text-slate-700 block text-[10px] uppercase">2nd Place Prize</span>
                <span className="font-semibold text-slate-800 truncate block">{competition.prizeDetails.secondPrize}</span>
              </div>
              <div className="p-2 bg-white/80 rounded-lg border border-amber-200/80">
                <span className="font-bold text-amber-800 block text-[10px] uppercase">3rd Place Prize</span>
                <span className="font-semibold text-slate-800 truncate block">{competition.prizeDetails.thirdPrize}</span>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">
              Ranked Candidates: <strong>{rankedItems.length}</strong>
            </span>
            <span className="italic text-[11px]">
              Ties resolved by earlier verified submission timestamp
            </span>
          </div>

          {rankedItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                No submitted candidate results recorded yet for this competition.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-center">Rank</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Institution</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Percentage</th>
                    <th className="px-4 py-3">Prize Status</th>
                    <th className="px-4 py-3 text-right">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rankedItems.map((res) => {
                    const isSelf =
                      currentStudentId &&
                      (res.studentId === currentStudentId || res.studentName === currentStudentId);

                    return (
                      <tr
                        key={res.id}
                        className={`transition ${
                          isSelf
                            ? 'bg-blue-50/80 font-semibold ring-1 ring-blue-500/30'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {getRankBadge(res.computedRank)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-900 font-semibold">{res.studentName}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">
                          {res.studentInstitution || 'General Student'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                          {res.score} <span className="text-slate-400 font-normal">/ {res.maxScore}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700 whitespace-nowrap">
                          {res.percentile}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              res.computedRank === 1
                                ? 'bg-amber-100 text-amber-900'
                                : res.computedRank === 2
                                ? 'bg-slate-200 text-slate-900'
                                : res.computedRank === 3
                                ? 'bg-amber-800/10 text-amber-950'
                                : 'bg-blue-50 text-blue-800'
                            }`}
                          >
                            <Medal className="w-3 h-3" />
                            {res.resolvedPrize}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 text-[11px] whitespace-nowrap">
                          {res.publishedAt ? new Date(res.publishedAt).toLocaleDateString() : 'Active'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 px-6 flex justify-end">
          <button
            type="button"
            id="close-leaderboard-footer-btn"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Close Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
