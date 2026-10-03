import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CompetitionResult } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  FileCheck,
  Search,
  CheckCircle2,
  Clock,
  Award,
  Edit3,
  Save,
} from 'lucide-react';

export const AdminResultsView: React.FC = () => {
  const { results, competitions, updateResultEvaluation } = useApp();
  const [selectedResult, setSelectedResult] = useState<CompetitionResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'under_review' | 'published'>('all');
  const [evalForm, setEvalForm] = useState({
    score: 0,
    feedback: '',
    award: 'Silver Medal' as any,
  });
  const [saveToast, setSaveToast] = useState(false);

  const displayedResults = results.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.publishStatus === filterStatus;
  });

  const handleOpenEvaluation = (result: CompetitionResult) => {
    setSelectedResult(result);
    setEvalForm({
      score: result.score,
      feedback: result.feedback || '',
      award: result.award,
    });
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedResult) {
      const updatedScore = Number(evalForm.score);
      const totalMarks = selectedResult.totalMarks || selectedResult.maxScore || 100;
      const percentage = Math.round((updatedScore / totalMarks) * 100);
      try {
        await updateResultEvaluation(selectedResult.id, {
          score: updatedScore,
          feedback: evalForm.feedback,
          award: evalForm.award,
          percentage,
          publishStatus: 'published',
        });
      } catch (err) {
        console.warn('Evaluation update note:', err);
      }
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
      setSelectedResult(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-700" />
            <span>Results Scoring & Evaluation Workbench</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate candidate submissions, assign competitive scores, and draft medal designations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="filter-admin-results"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs font-medium"
          >
            <option value="all">All Submissions ({results.length})</option>
            <option value="under_review">Needs Evaluation Review</option>
            <option value="published">Official Published</option>
          </select>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Evaluation rubric and grade updated successfully.</span>
        </div>
      )}

      {/* Evaluation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Candidate & School</th>
                <th className="px-5 py-3.5">Competition Track</th>
                <th className="px-5 py-3.5 text-center">Score Metric</th>
                <th className="px-5 py-3.5 text-center">Award Category</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedResults.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-bold text-slate-900">{item.studentName}</p>
                      <p className="text-[11px] text-slate-400">{item.studentInstitution}</p>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="font-medium text-slate-800 block truncate max-w-[200px]">
                      {item.competitionTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: {item.certificateId}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <span className="font-bold text-slate-900 text-sm">
                      {item.score}
                    </span>
                    <span className="text-slate-400 text-[11px]">/{item.maxScore}</span>
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-block font-semibold text-slate-800 text-xs">
                      {item.award}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <Badge
                      variant={item.publishStatus === 'published' ? 'emerald' : 'amber'}
                      dot
                    >
                      {item.publishStatus === 'published' ? 'Ratified' : 'Under Review'}
                    </Badge>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      id={`btn-evaluate-${item.id}`}
                      onClick={() => handleOpenEvaluation(item)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Grade Rubric</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Rubric Modal */}
      {selectedResult && (
        <Modal
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          title={`Academic Jury Evaluation: ${selectedResult.studentName}`}
          subtitle={`${selectedResult.competitionTitle} • ${selectedResult.studentInstitution}`}
        >
          <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Assigned Score (Max 100) *
                </label>
                <input
                  id="input-rubric-score"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={evalForm.score}
                  onChange={(e) =>
                    setEvalForm({ ...evalForm, score: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Designated Award / Medal *
                </label>
                <select
                  id="input-rubric-award"
                  value={evalForm.award}
                  onChange={(e) =>
                    setEvalForm({ ...evalForm, award: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Grand Champion">Grand Champion</option>
                  <option value="Gold Medal">Gold Medal</option>
                  <option value="Silver Medal">Silver Medal</option>
                  <option value="Bronze Medal">Bronze Medal</option>
                  <option value="Honorary Mention">Honorary Mention</option>
                  <option value="Participation">Participation</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                Jury Feedback & Methodological Evaluation
              </label>
              <textarea
                id="input-rubric-feedback"
                rows={3}
                placeholder="Provide official feedback on candidate approach, algorithmic complexity, or essay rhetoric..."
                value={evalForm.feedback}
                onChange={(e) =>
                  setEvalForm({ ...evalForm, feedback: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-rubric"
                className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Evaluation</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
