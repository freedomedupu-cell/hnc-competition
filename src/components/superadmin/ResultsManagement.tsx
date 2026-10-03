import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { APP_LOGO } from '../../assets/logo';
import {
  FileCheck,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldAlert,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const ResultsManagement: React.FC = () => {
  const { results, competitions, toggleResultPublish, deleteResult, language } = useApp();
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [resultToDelete, setResultToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteResult = async () => {
    if (!resultToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResult(resultToDelete.id);
      setResultToDelete(null);
    } catch (err) {
      console.error('Failed to delete result:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Dynamically compute ranks grouped by competition so higher marks get higher rank (#1)
  const rankedResults = React.useMemo(() => {
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

  const filteredResults = rankedResults.filter((res) => {
    if (selectedCompetition === 'all') return true;
    return res.competitionId === selectedCompetition;
  });

  const getAwardBadge = (award: string) => {
    switch (award) {
      case 'Grand Champion':
        return <Badge variant="amber" dot>Grand Champion</Badge>;
      case 'Gold Medal':
        return <Badge variant="amber">Gold Medal</Badge>;
      case 'Silver Medal':
        return <Badge variant="slate">Silver Medal</Badge>;
      case 'Bronze Medal':
        return <Badge variant="amber">Bronze Medal</Badge>;
      default:
        return <Badge variant="blue">Honorary Mention</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 p-2 flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src={APP_LOGO}
              alt="HNC Competition Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Results & Certification Governance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorize official leaderboards, ratify jury scores, and toggle public publication.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Jury Audit Verified</span>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Filter by Contest:
          </span>
          <select
            id="filter-results-contest"
            value={selectedCompetition}
            onChange={(e) => setSelectedCompetition(e.target.value)}
            className="w-full sm:w-72 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Competition Leaderboards</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredResults.length}</span> certified entries
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Candidate & Institution</th>
                <th className="px-5 py-3.5">Competition</th>
                <th className="px-5 py-3.5 text-center">Score</th>
                <th className="px-5 py-3.5 text-center">National Rank</th>
                <th className="px-5 py-3.5">Award / Honor</th>
                <th className="px-5 py-3.5">Publish Status</th>
                <th className="px-5 py-3.5 text-right">Publication Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No results recorded for this competition yet.
                  </td>
                </tr>
              ) : (
                filteredResults.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-bold text-slate-900">{item.studentName}</p>
                        <p className="text-[11px] text-slate-400">{item.studentInstitution}</p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800 truncate block max-w-[200px]">
                        {item.competitionTitle}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Cert: {item.certificateId}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.score}
                      </span>
                      <span className="text-slate-400 text-[11px]">/{item.maxScore}</span>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        #{item.rank}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Top {100 - item.percentile}%
                      </p>
                    </td>

                    <td className="px-5 py-3.5">{getAwardBadge(item.award)}</td>

                    <td className="px-5 py-3.5">
                      <Badge
                        variant={item.publishStatus === 'published' ? 'emerald' : 'amber'}
                        dot
                      >
                        {item.publishStatus === 'published' ? 'Published' : 'Under Review'}
                      </Badge>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-publish-${item.id}`}
                          onClick={() => toggleResultPublish(item.id)}
                          className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${
                            item.publishStatus === 'published'
                              ? 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                              : 'bg-blue-700 text-white hover:bg-blue-800'
                          }`}
                        >
                          {item.publishStatus === 'published' ? 'Unpublish' : 'Publish to Portal'}
                        </button>
                        <button
                          id={`btn-delete-result-${item.id}`}
                          onClick={() => setResultToDelete(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title={language === 'ta' ? 'முடிவை நீக்குக' : language === 'si' ? 'ප්‍රතිඵලය ඉවත් කරන්න' : 'Delete Result'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {resultToDelete && (
        <Modal
          isOpen={!!resultToDelete}
          onClose={() => !isDeleting && setResultToDelete(null)}
          title={
            language === 'ta'
              ? 'முடிவுப் பதிவை நீக்குவதை உறுதிப்படுத்தவும்'
              : language === 'si'
              ? 'ප්‍රතිඵල ලේඛනය ඉවත් කිරීම තහවුරු කරන්න'
              : 'Confirm Result Deletion'
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-900">
                  {language === 'ta'
                    ? `${resultToDelete.studentName} மாணவரின் (${resultToDelete.competitionTitle}) முடிவை நீக்க விரும்புகிறீர்களா?`
                    : language === 'si'
                    ? `${resultToDelete.studentName} ශිෂ්‍යයාගේ (${resultToDelete.competitionTitle}) ප්‍රතිඵලය ඉවත් කිරීමට අවශ්‍යද?`
                    : `Permanently remove result for ${resultToDelete.studentName} in ${resultToDelete.competitionTitle}?`}
                </p>
                <p className="text-[11px] text-red-700">
                  {language === 'ta'
                    ? 'இந்த முடிவு தரவுத்தளத்திலிருந்து முழுமையாக நீக்கப்படும்.'
                    : language === 'si'
                    ? 'මෙම ප්‍රතිඵලය දත්ත සමුදායෙන් ස්ථිරවම ඉවත් කරනු ලැබේ.'
                    : 'This result entry will be permanently deleted from the registry.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setResultToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {language === 'ta' ? 'ரத்து செய்க' : language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>
              <button
                id="btn-confirm-delete-result"
                disabled={isDeleting}
                onClick={handleDeleteResult}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeleting
                    ? (language === 'ta' ? 'நீக்கப்படுகிறது...' : language === 'si' ? 'ඉවත් කරමින්...' : 'Deleting...')
                    : (language === 'ta' ? 'ஆம், நீக்குக' : language === 'si' ? 'ඔව්, ඉවත් කරන්න' : 'Yes, Delete')}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
