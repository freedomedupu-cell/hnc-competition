import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Competition, QuestionItem } from '../../types';
import { APP_LOGO } from '../../assets/logo';
import {
  Trophy,
  Clock,
  Calendar,
  Award,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  Image as ImageIcon,
  Check,
  Globe,
  GraduationCap,
  Sparkles,
  Layers,
  Eye,
  ShieldCheck,
  Camera,
  Share2,
} from 'lucide-react';
import { ShareModal } from '../common/ShareModal';

interface CompetitionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: Partial<Competition>;
  onPublish?: () => void;
  onSaveDraft?: () => void;
}

export const CompetitionPreviewModal: React.FC<CompetitionPreviewModalProps> = ({
  isOpen,
  onClose,
  competition,
  onPublish,
  onSaveDraft,
}) => {
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isShareOpen, setIsShareOpen] = useState(false);

  const questions: QuestionItem[] = competition.questions || [];
  const totalMarks =
    competition.totalMarks ??
    questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  const duration = competition.duration ?? 60;
  const entryFee = competition.entryType === 'Paid' ? `LKR ${competition.entryFee?.toLocaleString()}` : 'Free Entry';

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Competition & Assessment Preview"
      subtitle="Interactive candidate perspective preview with live answer key validation"
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Banner Card with Official Institutional Logo */}
        <div className="rounded-xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md border border-blue-800/40">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/10 p-2 backdrop-blur-md border border-white/20 shrink-0 flex items-center justify-center shadow-lg">
              <img
                src={APP_LOGO}
                alt="HNC Competition Logo"
                className="w-full h-full object-contain filter drop-shadow"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    {competition.competitionType || 'Quiz'}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/10 text-white border border-white/15">
                    {competition.category || 'Mathematics'}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    {competition.grade || 'Open'}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    {competition.language || 'English'}
                  </span>
                  {(typeof competition.requireCameraVerification === 'boolean'
                    ? competition.requireCameraVerification
                    : competition.competitionType === 'Exam') ? (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-500/30 text-purple-200 border border-purple-400/40 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>Camera ID Required</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-500/20 text-slate-300 border border-slate-400/30 flex items-center gap-1">
                      <span>Online Assessment</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15 text-white border border-white/20">
                    {entryFee}
                  </span>
                </div>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
                {competition.title || 'Untitled Assessment Challenge'}
              </h2>

              <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
                {competition.description || 'Comprehensive evaluation covering foundational theories and advanced problem solving.'}
              </p>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                <span className="font-semibold">{duration} Minutes</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-200">
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Questions</span>
                <span className="font-semibold">{questions.length} Items</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-200">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
                <span className="font-semibold">{totalMarks} Points</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-200">
              <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assessment Window</span>
                <span className="font-semibold">{competition.competitionStart || 'TBD'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Prize Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Schedule */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Official Timelines</span>
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Registration Period:</span>
                <span className="font-semibold text-slate-800">
                  {competition.registrationStart || '—'} to {competition.registrationEnd || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Assessment Window:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {competition.competitionStart || '—'} {competition.competitionStartTime ? `(${competition.competitionStartTime})` : ''} to {competition.competitionEnd || '—'} {competition.competitionEndTime ? `(${competition.competitionEndTime})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status:</span>
                <Badge variant={competition.status === 'Draft' ? 'neutral' : 'success'}>
                  {competition.status || 'Draft'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Prizes */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Prizes & Accolades</span>
            </h4>
            {competition.prizesEnabled ? (
              <div className="space-y-1.5 text-amber-900">
                <div className="flex justify-between py-0.5">
                  <span className="font-medium text-amber-800">🥇 1st Place:</span>
                  <span className="font-bold text-right">{competition.prizeDetails?.firstPrize || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-medium text-amber-800">🥈 2nd Place:</span>
                  <span className="font-bold text-right">{competition.prizeDetails?.secondPrize || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="font-medium text-amber-800">🥉 3rd Place:</span>
                  <span className="font-bold text-right">{competition.prizeDetails?.thirdPrize || 'N/A'}</span>
                </div>
                {competition.prizeDetails?.participationCertificate && (
                  <div className="flex justify-between py-0.5 pt-1 border-t border-amber-200 text-[11px] text-amber-800">
                    <span>Participation:</span>
                    <span className="font-semibold">{competition.prizeDetails.participationCertificate}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 italic py-2">Prizes are disabled for this challenge.</p>
            )}
          </div>
        </div>

        {/* Paper & Questions Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          {/* Header of paper */}
          <div className="bg-slate-100/90 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-sm">Examination Question Paper Preview</h3>
              <span className="text-xs text-slate-500">
                ({questions.length} Questions • {totalMarks} Total Marks)
              </span>
            </div>

            {/* Answer Key Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={showAnswerKey}
                  onChange={(e) => setShowAnswerKey(e.target.checked)}
                  className="rounded text-blue-700 focus:ring-blue-500 h-4 w-4"
                />
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Show Admin Answer Key</span>
              </label>
            </div>
          </div>

          {/* Question List */}
          <div className="p-6 space-y-6">
            {questions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <FileQuestion className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No questions have been added yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use the Question Builder tab in the editor to add questions.</p>
              </div>
            ) : (
              questions.map((q, idx) => {
                const isSelected = (val: string) => userAnswers[q.id] === val;
                const isCorrect = (val: string) =>
                  showAnswerKey && q.correctAnswer && q.correctAnswer.trim().toLowerCase() === val.trim().toLowerCase();

                return (
                  <div
                    key={q.id || idx}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-3"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <Badge variant="neutral" className="text-[11px] uppercase tracking-wide">
                          {q.type.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {q.marks || 1} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed pl-9">
                      {q.questionText}
                    </p>

                    {/* Image if Picture Question or Image URL exists */}
                    {(q.imageUrl || q.type === 'picture_question') && (
                      <div className="pl-9 pt-1">
                        {q.imageUrl ? (
                          <div className="max-w-md rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <img
                              src={q.imageUrl}
                              alt={`Question ${idx + 1} reference`}
                              className="w-full max-h-64 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
                            [Picture Question Image Placeholder]
                          </div>
                        )}
                      </div>
                    )}

                    {/* Options / Input Body */}
                    <div className="pl-9 pt-1 space-y-2">
                      {/* Multiple Choice & Picture Question with Options */}
                      {(q.type === 'multiple_choice' || (q.type === 'picture_question' && q.options && q.options.length > 0)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt, optIdx) => {
                            const correct = isCorrect(opt);
                            const selected = isSelected(opt);
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectAnswer(q.id, opt)}
                                className={`text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
                                  correct
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400'
                                    : selected
                                    ? 'bg-blue-50 border-blue-400 text-blue-950 font-medium'
                                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full border border-slate-300 text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </span>
                                {correct && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Correct
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* True / False */}
                      {q.type === 'true_false' && (
                        <div className="flex gap-3">
                          {['True', 'False'].map((tfVal) => {
                            const correct = isCorrect(tfVal);
                            const selected = isSelected(tfVal);
                            return (
                              <button
                                key={tfVal}
                                type="button"
                                onClick={() => handleSelectAnswer(q.id, tfVal)}
                                className={`px-5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                                  correct
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400'
                                    : selected
                                    ? 'bg-blue-50 border-blue-400 text-blue-950'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span>{tfVal}</span>
                                {correct && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Short Answer */}
                      {q.type === 'short_answer' && (
                        <div className="space-y-2 max-w-md">
                          <input
                            type="text"
                            placeholder="Candidate short answer input..."
                            value={userAnswers[q.id] || ''}
                            onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {showAnswerKey && q.correctAnswer && (
                            <div className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 p-2 rounded-lg flex items-center gap-2">
                              <span className="font-bold">Correct Expected Answer:</span>
                              <span className="font-mono">{q.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close Preview
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-2xs flex items-center gap-1.5"
              title="Share Competition Link"
            >
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Share Link</span>
            </button>

            {onSaveDraft && (
              <button
                type="button"
                onClick={() => {
                  onSaveDraft();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Save as Draft
              </button>
            )}

            {onPublish && (
              <button
                type="button"
                onClick={() => {
                  onPublish();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-xs flex items-center gap-2"
              >
                <img
                  src={APP_LOGO}
                  alt="HNC Logo"
                  className="w-4 h-4 object-contain filter brightness-0 invert"
                  referrerPolicy="no-referrer"
                />
                <span>Publish Competition</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          competition={competition}
        />
      )}
    </Modal>
  );
};
