import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DbStudentFeedback, FeedbackCategory } from '../../types';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Star,
  Trash2,
  Reply,
  Send,
  User,
  GraduationCap,
  MapPin,
  HelpCircle,
  Trophy,
  Gamepad2,
  Laptop,
  Lightbulb,
  Check,
  X,
  Sparkles,
  AlertCircle,
  CornerDownRight,
} from 'lucide-react';

export const AdminFeedbackView: React.FC = () => {
  const {
    feedbacks,
    updateFeedbackStatus,
    deleteFeedback,
    language,
    currentAuthUser,
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Replying state
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'reviewed' | 'resolved'>('resolved');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Deletion confirmation modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Statistics calculation
  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter((f) => f.status === 'pending').length;
  const resolvedCount = feedbacks.filter((f) => f.status === 'resolved').length;
  const avgRating =
    totalCount > 0
      ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalCount).toFixed(1)
      : '5.0';

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      (fb.subject || '').toLowerCase().includes(term) ||
      (fb.message || '').toLowerCase().includes(term) ||
      (fb.studentName || '').toLowerCase().includes(term) ||
      (fb.studentSchool || '').toLowerCase().includes(term) ||
      (fb.district || '').toLowerCase().includes(term);

    // Category
    const matchCategory = categoryFilter === 'all' || fb.category === categoryFilter;

    // Status
    const matchStatus = statusFilter === 'all' || fb.status === statusFilter;

    // Rating
    const matchRating = ratingFilter === 'all' || String(fb.rating) === ratingFilter;

    return matchSearch && matchCategory && matchStatus && matchRating;
  });

  const handleOpenReply = (fb: DbStudentFeedback) => {
    setReplyingId(fb.id);
    setReplyText(fb.adminResponse || '');
    setReplyStatus(fb.status === 'pending' ? 'resolved' : fb.status);
  };

  const handleSendReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await updateFeedbackStatus(feedbackId, replyStatus, replyText.trim());
      setReplyingId(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to reply to feedback:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    try {
      await deleteFeedback(feedbackId);
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    }
  };

  const getCategoryIcon = (category: FeedbackCategory) => {
    switch (category) {
      case 'competition':
        return <Trophy className="w-3.5 h-3.5 text-amber-600" />;
      case 'island_quest':
        return <Gamepad2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'questions':
        return <HelpCircle className="w-3.5 h-3.5 text-blue-600" />;
      case 'platform':
        return <Laptop className="w-3.5 h-3.5 text-purple-600" />;
      case 'suggestion':
        return <Lightbulb className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>
              {language === 'ta'
                ? 'மாணவர் கருத்து மேலாண்மை'
                : 'Student Feedback & Governance'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {language === 'ta'
              ? 'மாணவர் கருத்துக்கள் & பரிந்துரைகள்'
              : 'Student Feedback & Inquiries'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {language === 'ta'
              ? 'மாணவர்கள் சமர்ப்பித்த போட்டிகள், வினாக்கள் மற்றும் தளம் பற்றிய கருத்துக்களை மதிப்பாய்வு செய்து பதிலளியுங்கள்.'
              : 'Review, respond, and evaluate candidate feedback, contest experiences, and feature requests.'}
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <div className="text-[11px] text-blue-700 font-semibold">
              {language === 'ta' ? 'மொத்தம்' : 'Total Submissions'}
            </div>
            <div className="text-xl font-black text-blue-900">{totalCount}</div>
          </div>
          <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <div className="text-[11px] text-amber-700 font-semibold">
              {language === 'ta' ? 'ஆய்வில்' : 'Pending'}
            </div>
            <div className="text-xl font-black text-amber-900">{pendingCount}</div>
          </div>
          <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <div className="text-[11px] text-emerald-700 font-semibold">
              {language === 'ta' ? 'பதிலளிக்கப்பட்டது' : 'Resolved'}
            </div>
            <div className="text-xl font-black text-emerald-900">{resolvedCount}</div>
          </div>
          <div className="px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-center">
            <div className="text-[11px] text-purple-700 font-semibold">
              {language === 'ta' ? 'சராசரி மதிப்பீடு' : 'Avg Rating'}
            </div>
            <div className="text-xl font-black text-purple-900 flex items-center justify-center gap-1">
              <span>{avgRating}</span>
              <span className="text-amber-500 text-sm">★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'மாணவர், பள்ளி, மாவட்டம், தலைப்பு...'
                  : 'Search by student, school, subject...'
              }
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">
                {language === 'ta' ? 'அனைத்துப் பிரிவுகள் (All Categories)' : 'All Categories'}
              </option>
              <option value="competition">
                {language === 'ta' ? '🏆 போட்டி அனுபவம்' : '🏆 Competition Experience'}
              </option>
              <option value="island_quest">
                {language === 'ta' ? '🎯 Edu-Arena தீவுப் பயணம்' : '🎯 Edu-Arena Island Quest'}
              </option>
              <option value="questions">
                {language === 'ta' ? '❓ வினாக்கள் தரம் & விளக்கம்' : '❓ Questions Quality'}
              </option>
              <option value="platform">
                {language === 'ta' ? '💻 தளத்தின் தொழினுட்பம்' : '💻 Platform Usability'}
              </option>
              <option value="suggestion">
                {language === 'ta' ? '💡 புதிய ஆலோசனைகள்' : '💡 Suggestions'}
              </option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">
                {language === 'ta' ? 'அனைத்து நிலைகள் (All Status)' : 'All Statuses'}
              </option>
              <option value="pending">
                {language === 'ta' ? '🟡 ஆய்வில் உள்ளது (Pending)' : '🟡 Pending Review'}
              </option>
              <option value="reviewed">
                {language === 'ta' ? '🔵 பார்வையிடப்பட்டது (Reviewed)' : '🔵 Reviewed'}
              </option>
              <option value="resolved">
                {language === 'ta' ? '🟢 பதிலளிக்கப்பட்டது (Resolved)' : '🟢 Resolved & Replied'}
              </option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">
                {language === 'ta' ? 'அனைத்து மதிப்பீடுகள் (All Ratings)' : 'All Ratings'}
              </option>
              <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
              <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
              <option value="3">⭐⭐⭐ (3 Stars)</option>
              <option value="2">⭐⭐ (2 Stars)</option>
              <option value="1">⭐ (1 Star)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              💬
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {language === 'ta'
                ? 'கருத்துகள் எதுவும் கண்டறியப்படவில்லை'
                : 'No Feedback Found'}
            </h3>
            <p className="text-slate-500 text-xs">
              {language === 'ta'
                ? 'தேடல் அல்லது வடிகட்டி அமைப்புகளை மாற்றி முயற்சிக்கவும்.'
                : 'Try adjusting your search filters.'}
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((fb) => {
            const isReplying = replyingId === fb.id;
            return (
              <div
                key={fb.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 transition-all hover:border-slate-300"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {getCategoryIcon(fb.category)}
                        <span>{fb.category.replace('_', ' ')}</span>
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          fb.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : fb.status === 'reviewed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {fb.status === 'resolved'
                          ? 'Resolved'
                          : fb.status === 'reviewed'
                          ? 'Reviewed'
                          : 'Pending'}
                      </span>

                      <div className="flex items-center text-amber-400 text-xs font-bold">
                        {'★'.repeat(fb.rating || 5)}
                        <span className="text-slate-400 text-[11px] font-normal ml-1">
                          ({fb.rating}/5)
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 pt-1">
                      {fb.subject}
                    </h3>
                  </div>

                  {/* Top Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenReply(fb)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>{fb.adminResponse ? 'Edit Reply' : 'Reply'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteId(fb.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submitter info card */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{fb.studentName}</span>
                  </div>
                  {fb.studentGrade && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fb.studentGrade}</span>
                    </div>
                  )}
                  {fb.studentSchool && (
                    <div>
                      <span>🏫 {fb.studentSchool}</span>
                    </div>
                  )}
                  {fb.district && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fb.district}</span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line pl-1">
                  {fb.message}
                </div>

                {/* Existing Reply View */}
                {fb.adminResponse && !isReplying && (
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                      <span className="flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
                        Official Response ({fb.adminRepliedBy || 'Exam Directorate'})
                      </span>
                      {fb.repliedAt && (
                        <span className="text-slate-400 font-normal">
                          {new Date(fb.repliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-950 font-medium italic pl-4">
                      "{fb.adminResponse}"
                    </p>
                  </div>
                )}

                {/* Inline Reply Box */}
                {isReplying && (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Reply className="w-3.5 h-3.5 text-blue-600" />
                        <span>Send Official Academic Reply to Student</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setReplyingId(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Write administrative response, guidance, or resolution note here..."
                      className="w-full p-3 rounded-lg border border-blue-300 bg-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600 font-semibold">Mark Status as:</span>
                        <select
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value as any)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none"
                        >
                          <option value="resolved">🟢 Resolved (பதிலளிக்கப்பட்டது)</option>
                          <option value="reviewed">🔵 Reviewed (பார்வையிடப்பட்டது)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingId(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingReply || !replyText.trim()}
                          onClick={() => handleSendReply(fb.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingReply ? 'Sending...' : 'Send Reply'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ta' ? 'கருத்தை நீக்கவா?' : 'Delete Feedback?'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ta'
                  ? 'இந்த மாணவர் கருத்தை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?'
                  : 'Are you sure you want to permanently delete this feedback entry?'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
