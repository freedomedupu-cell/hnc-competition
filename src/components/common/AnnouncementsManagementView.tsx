import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DbAnnouncement, AnnouncementCategory } from '../../types';
import { Modal } from '../common/Modal';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Gift,
  Coins,
  Trophy,
  ExternalLink,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Search,
} from 'lucide-react';

export const AnnouncementsManagementView: React.FC = () => {
  const {
    announcements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    currentAuthUser,
    language,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<DbAnnouncement | null>(null);
  const [annToDelete, setAnnToDelete] = useState<DbAnnouncement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formTitleTa, setFormTitleTa] = useState('');
  const [formTitleSi, setFormTitleSi] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formContentTa, setFormContentTa] = useState('');
  const [formContentSi, setFormContentSi] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementCategory>('general');
  const [formAudience, setFormAudience] = useState<'all' | 'students' | 'admins'>('all');
  const [formPoints, setFormPoints] = useState<string>('');
  const [formBadgeText, setFormBadgeText] = useState('');
  const [formActionUrl, setFormActionUrl] = useState('');
  const [formActionLabel, setFormActionLabel] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);

  const resetForm = () => {
    setEditingAnn(null);
    setFormTitle('');
    setFormTitleTa('');
    setFormTitleSi('');
    setFormContent('');
    setFormContentTa('');
    setFormContentSi('');
    setFormCategory('general');
    setFormAudience('all');
    setFormPoints('');
    setFormBadgeText('');
    setFormActionUrl('');
    setFormActionLabel('');
    setFormIsPinned(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (ann: DbAnnouncement) => {
    setEditingAnn(ann);
    setFormTitle(ann.title);
    setFormTitleTa(ann.titleTa || '');
    setFormTitleSi(ann.titleSi || '');
    setFormContent(ann.content);
    setFormContentTa(ann.contentTa || '');
    setFormContentSi(ann.contentSi || '');
    setFormCategory(ann.category);
    setFormAudience(ann.targetAudience);
    setFormPoints(ann.pointsReward ? String(ann.pointsReward) : '');
    setFormBadgeText(ann.badgeText || '');
    setFormActionUrl(ann.actionUrl || '');
    setFormActionLabel(ann.actionLabel || '');
    setFormIsPinned(!!ann.isPinned);
    setIsModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Omit<DbAnnouncement, 'id'> = {
        title: formTitle.trim(),
        titleTa: formTitleTa.trim() || undefined,
        titleSi: formTitleSi.trim() || undefined,
        content: formContent.trim(),
        contentTa: formContentTa.trim() || undefined,
        contentSi: formContentSi.trim() || undefined,
        category: formCategory,
        targetAudience: formAudience,
        pointsReward: formPoints ? parseInt(formPoints, 10) : undefined,
        badgeText: formBadgeText.trim() || undefined,
        actionUrl: formActionUrl.trim() || undefined,
        actionLabel: formActionLabel.trim() || undefined,
        isPinned: formIsPinned,
        publishedAt: editingAnn?.publishedAt || new Date().toISOString(),
        publishedBy: currentAuthUser?.uid || 'admin',
        authorName: currentAuthUser?.fullName || 'HNC Examination Board',
      };

      if (editingAnn) {
        await updateAnnouncement(editingAnn.id, payload);
        setToastMessage(language === 'ta' ? 'அறிவிப்பு வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : 'Announcement updated successfully!');
      } else {
        await createAnnouncement(payload);
        setToastMessage(language === 'ta' ? 'புதிய அறிவிப்பு வெளியிடப்பட்டது!' : 'New announcement broadcasted successfully!');
      }

      setIsModalOpen(false);
      resetForm();
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Error saving announcement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (ann: DbAnnouncement) => {
    try {
      await updateAnnouncement(ann.id, { isPinned: !ann.isPinned });
    } catch (err) {
      console.error('Error pinning announcement:', err);
    }
  };

  const handleDelete = async () => {
    if (!annToDelete) return;
    try {
      await deleteAnnouncement(annToDelete.id);
      setAnnToDelete(null);
      setToastMessage(language === 'ta' ? 'அறிவிப்பு நீக்கப்பட்டது.' : 'Announcement deleted successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setToastMessage(language === 'ta' ? 'அறிவிப்பை நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Failed to delete announcement. Please try again.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesCat = activeCategory === 'all' || a.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCat;

    const matchesSearch =
      a.title.toLowerCase().includes(query) ||
      (a.titleTa && a.titleTa.toLowerCase().includes(query)) ||
      a.content.toLowerCase().includes(query) ||
      (a.contentTa && a.contentTa.toLowerCase().includes(query));

    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-700" />
            <span>
              {language === 'ta'
                ? 'உத்தியோகபூர்வ அறிவிப்புகள் மேலாண்மை'
                : language === 'si'
                ? 'නිල නිවේදන කළමනාකරණය'
                : 'Official Announcements & Circulars'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'தேசிய கல்விப் போட்டிகள், தேர்வு சுற்றறிக்கைகள், வழிகாட்டல்கள் மற்றும் அறிவிப்புகளை வெளியிடவும்.'
              : 'Create, broadcast, and manage official competition notices, circulars, and examination updates.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {toastMessage && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </span>
          )}

          <button
            id="btn-create-announcement"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ta' ? '+ புதிய அறிவிப்பு' : '+ New Announcement'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-2xs">
        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {language === 'ta' ? 'அனைத்தும்' : 'All'} ({announcements.length})
          </button>

          <button
            onClick={() => setActiveCategory('general')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeCategory === 'general'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {language === 'ta' ? 'பொதுவானவை' : 'General Notices'}
          </button>

          <button
            onClick={() => setActiveCategory('competition')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeCategory === 'competition'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {language === 'ta' ? 'போட்டிகள் & தேர்வுகள்' : 'Competitions'}
          </button>

          <button
            onClick={() => setActiveCategory('award')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
              activeCategory === 'award'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'விருதுகள் & முடிவுகள்' : 'Awards & Results'}</span>
          </button>

          <button
            onClick={() => setActiveCategory('urgent')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
              activeCategory === 'urgent'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'அவசர அறிவிப்புகள்' : 'Urgent Alerts'}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ta' ? 'அறிவிப்பைத் தேடுக...' : 'Search notices...'}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-2xs">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">
              {language === 'ta' ? 'அறிவிப்புகள் எதுவும் இல்லை' : 'No announcements published yet'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {language === 'ta'
                ? 'மாணவர்கள் மற்றும் கல்வி சமூகத்திற்கு அதிகாரப்பூர்வ சுற்றறிக்கைகள் அல்லது வழிகாட்டல்களை வெளியிட "+ புதிய அறிவிப்பு" பொத்தானை அழுத்தவும்.'
                : 'Click "+ New Announcement" above to publish official circulars, examination instructions, or updates.'}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => {
            const isPointsAnn = ann.category === 'points_referral' || !!ann.pointsReward;
            return (
              <div
                key={ann.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs relative ${
                  ann.isPinned
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50/30 via-white to-white'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {ann.isPinned && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Pin className="w-3 h-3 fill-amber-700" />
                          <span>Pinned</span>
                        </span>
                      )}

                      {isPointsAnn && (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Coins className="w-3 h-3 text-amber-500 fill-amber-400" />
                          <span>{ann.badgeText || `🎁 +${ann.pointsReward} Points`}</span>
                        </span>
                      )}

                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                        Audience: {ann.targetAudience}
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{ann.publishedAt?.split('T')[0] || 'Recent'}</span>
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                      {language === 'ta' && ann.titleTa ? ann.titleTa : ann.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {language === 'ta' && ann.contentTa ? ann.contentTa : ann.content}
                    </p>

                    {ann.actionLabel && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                          <span>{language === 'ta' && ann.actionLabelTa ? ann.actionLabelTa : ann.actionLabel}</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => handleTogglePin(ann)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        ann.isPinned
                          ? 'text-amber-700 bg-amber-50 border-amber-300'
                          : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                      }`}
                      title={ann.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${ann.isPinned ? 'fill-amber-600' : ''}`} />
                    </button>

                    <button
                      onClick={() => openEditModal(ann)}
                      className="p-1.5 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setAnnToDelete(ann)}
                      className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={
            editingAnn
              ? (language === 'ta' ? 'அறிவிப்பைத் திருத்தவும்' : 'Edit Announcement')
              : (language === 'ta' ? 'புதிய அதிகாரப்பூர்வ அறிவிப்பு' : 'Publish Official Announcement')
          }
          subtitle="Publish platform notices, examination circulars, or competition updates"
        >
          <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
            {/* Category & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Category (பிரிவு) *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  <option value="general">📢 General Academic Notice</option>
                  <option value="competition">📝 Competitions & Olympiads</option>
                  <option value="award">🏆 Awards, Prizes & Results</option>
                  <option value="points_referral">🎁 Points & Referral Updates</option>
                  <option value="urgent">🚨 Urgent Circular</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={formAudience}
                  onChange={(e) => setFormAudience(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  <option value="all">Everyone (Students & Admins)</option>
                  <option value="students">Students Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>
            </div>

            {/* Title (English + Tamil) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Title (English) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. National Mathematics Olympiad 2026 Examination Notice"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Title in Tamil (தமிழ் தலைப்பு) - Optional
              </label>
              <input
                type="text"
                placeholder="எ.கா: தேசிய கணித ஒலிம்பியாட் 2026 தேர்வு சுற்றறிக்கை"
                value={formTitleTa}
                onChange={(e) => setFormTitleTa(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            {/* Content (English + Tamil) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Announcement Content (English) *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Write full details, examination dates, eligibility, and instructions..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Content in Tamil (தமிழ் விளக்கம்) - Optional
              </label>
              <textarea
                rows={3}
                placeholder="முழுமையான அறிவிப்பு விபரம், தேர்வு வழிகாட்டல்கள் தமிழில்..."
                value={formContentTa}
                onChange={(e) => setFormContentTa(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            {/* Optional Points & Referral Incentive */}
            {formCategory === 'points_referral' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Points & Referral Incentive Options (புள்ளிகள் விருப்பங்கள்)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Points Reward (Bonus PTS)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={formPoints}
                      onChange={(e) => setFormPoints(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Badge Text (அடையாள உரை)</label>
                    <input
                      type="text"
                      placeholder="e.g. 🪙 25 PTS"
                      value={formBadgeText}
                      onChange={(e) => setFormBadgeText(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Call to Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Destination Tab (இணைப்பு)
                </label>
                <select
                  value={formActionUrl}
                  onChange={(e) => setFormActionUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="">None (No Button)</option>
                  <option value="competitions">Competitions Arena</option>
                  <option value="results">My Results</option>
                  <option value="referral">Referral & Points Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Button Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. View Competitions"
                  value={formActionLabel}
                  onChange={(e) => setFormActionLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
            </div>

            {/* Pin Toggle */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <label htmlFor="pin-announcement" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'ta' ? 'முக்கிய அறிவிப்பாக மேலே பொருத்துக (Pin to Top)' : 'Pin announcement to top of notice board'}</span>
              </label>
              <input
                id="pin-announcement"
                type="checkbox"
                checked={formIsPinned}
                onChange={(e) => setFormIsPinned(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold disabled:opacity-50"
              >
                {isSubmitting
                  ? (language === 'ta' ? 'வெளியிடப்படுகிறது...' : 'Publishing...')
                  : editingAnn
                  ? (language === 'ta' ? 'புதுப்பிக்கவும்' : 'Update Notice')
                  : (language === 'ta' ? 'ஒளிபரப்பு செய்க' : 'Broadcast Notice')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {annToDelete && (
        <Modal
          isOpen={!!annToDelete}
          onClose={() => setAnnToDelete(null)}
          title={language === 'ta' ? 'அறிவிப்பை நீக்குதல்' : 'Delete Announcement'}
          subtitle="This action cannot be undone"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              {language === 'ta'
                ? `"${annToDelete.title}" என்ற அறிவிப்பை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?`
                : `Are you sure you want to permanently delete the announcement "${annToDelete.title}"?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setAnnToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {language === 'ta' ? 'உறுதியாக நீக்குக' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
