import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DbLiveProctorSession, ProctorWarning } from '../../types';
import {
  Video,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Send,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  User,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const LiveProctorView: React.FC = () => {
  const {
    liveProctorSessions,
    sendProctorWarning,
    flagCandidateSession,
    endProctorSession,
    saveLiveProctorSession,
    language,
    currentAuthUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'flagged' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<DbLiveProctorSession | null>(null);

  // Warning Modal state
  const [warningModalSession, setWarningModalSession] = useState<DbLiveProctorSession | null>(null);
  const [warningText, setWarningText] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);

  // Flag Modal state
  const [flagModalSession, setFlagModalSession] = useState<DbLiveProctorSession | null>(null);
  const [flagReasonText, setFlagReasonText] = useState('');

  // Preset warning messages
  const presetWarnings = [
    language === 'ta'
      ? 'தயவுசெய்து திரையை கவனிக்கவும்!'
      : 'Please keep your eyes focused on the exam screen!',
    language === 'ta'
      ? 'வார்த்தை மாற்றங்கள் அல்லது Tab Switch கண்டறியப்பட்டுள்ளது!'
      : 'Tab switching or leaving full-screen has been logged!',
    language === 'ta'
      ? 'கேமராவில் உங்கள் முகம் தெளிவாக தெரிய வேண்டும்.'
      : 'Please ensure your face is clearly visible in the camera frame.',
    language === 'ta'
      ? 'இறுதி எச்சரிக்கை: மீண்டும் தவறு செய்தால் தேர்வு ரத்து செய்யப்படும்!'
      : 'Final Warning: Further tab switches will cause exam disqualification!',
  ];

  // Filtering
  const filteredSessions = liveProctorSessions.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.competitionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentInstitution || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'active') return s.status === 'active';
    if (activeTab === 'flagged') return s.isFlagged || s.status === 'flagged';
    if (activeTab === 'completed') return s.status === 'completed' || s.status === 'timeout';
    return true;
  });

  const activeCount = liveProctorSessions.filter((s) => s.status === 'active').length;
  const flaggedCount = liveProctorSessions.filter((s) => s.isFlagged || s.status === 'flagged').length;
  const totalTabSwitches = liveProctorSessions.reduce((acc, curr) => acc + (curr.tabSwitchesCount || 0), 0);

  // Send directive warning handler
  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningModalSession || !warningText.trim()) return;

    setSendingWarning(true);
    try {
      const warning: ProctorWarning = {
        id: `warn_${Date.now()}`,
        message: warningText.trim(),
        sentAt: new Date().toISOString(),
        sentBy: currentAuthUser?.fullName || 'Exam Proctor',
      };
      await sendProctorWarning(warningModalSession.sessionId, warning);
      setWarningText('');
      setWarningModalSession(null);
    } catch (err) {
      console.error('Error sending warning:', err);
    } finally {
      setSendingWarning(false);
    }
  };

  // Flag session handler
  const handleToggleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagModalSession) return;

    const newFlaggedState = !flagModalSession.isFlagged;
    await flagCandidateSession(flagModalSession.sessionId, newFlaggedState, flagReasonText.trim());
    setFlagModalSession(null);
    setFlagReasonText('');
  };

  // End session handler
  const handleTerminateSession = async (session: DbLiveProctorSession) => {
    if (
      window.confirm(
        language === 'ta'
          ? `மாணவர் ${session.studentName}-இன் தேர்வை முடிவுக்கு கொண்டுவர விரும்புகிறீர்களா?`
          : `Are you sure you want to terminate live proctor session for ${session.studentName}?`
      )
    ) {
      await endProctorSession(session.sessionId, 'completed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Video className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-600 text-white flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {language === 'ta' ? 'நேரலை கண்காணிப்பு மேடை' : 'Live Proctor Command Center'}
              </span>
              <span className="text-xs font-semibold text-indigo-200">AI Anti-Cheat Monitor</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'ta' ? 'மாணவர் தேர்வு நேரலை கண்காணிப்பு' : 'Live Exam Candidate Proctoring'}
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
              {language === 'ta'
                ? 'நிகழ்நேர கேமரா படப்பிடிப்பு, Tab Switch எச்சரிக்கைகள் மற்றும் நேரடி உத்தரவு செய்திகளை அனுப்பும் மையம்.'
                : 'Real-time webcam snapshot feeds, tab-switching deterrence, live warnings, and anti-malpractice controls.'}
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/60 text-xs">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 font-semibold mb-1">
              <span>{language === 'ta' ? 'செயலில் உள்ளவை' : 'Active Live Feeds'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-white">{activeCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 font-semibold mb-1">
              <span>{language === 'ta' ? 'சந்தேகத்துக்குரியவை' : 'Flagged Sessions'}</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-300">{flaggedCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 font-semibold mb-1">
              <span>{language === 'ta' ? 'Tab Switch எச்சரிக்கைகள்' : 'Tab Switch Alerts'}</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-black text-red-300">{totalTabSwitches}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 font-semibold mb-1">
              <span>{language === 'ta' ? 'மொத்த அமர்வுகள்' : 'Total Sessions Recorded'}</span>
              <Video className="w-4 h-4 text-indigo-300" />
            </div>
            <p className="text-2xl font-black text-indigo-100">{liveProctorSessions.length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{language === 'ta' ? 'நேரலை (' : 'Live Active ('}</span>
            <span>{activeCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'flagged'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'கொடியிடப்பட்டது (' : 'Flagged ('}</span>
            <span>{flaggedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'முடிவடைந்தது' : 'Closed'}</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ta' ? 'அனைத்தும்' : 'All Sessions'}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'ta' ? 'மாணவர் பெயர் அல்லது போட்டி தேட...' : 'Search student or exam...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Main Video Feeds CCTV Grid */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {language === 'ta' ? 'கண்காணிப்பு அமர்வுகள் ஏதுமில்லை' : 'No Proctor Feeds Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'ta'
              ? 'தற்போது நேரலைத் தேர்வுகள் எதுவும் நடைபெறவில்லை. மாணவர்கள் தேர்வுகளைத் தொடங்கும்போது அவர்களின் நேரலை கேமரா மற்றும் தேர்வு கண்காணிப்புத் திரைகள் இங்கே தானாகக் காட்டப்படும்.'
              : 'No active student exam sessions in progress. Live webcam snapshot feeds and exam monitoring will automatically appear here when candidates start their exams.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const isActive = session.status === 'active';
            const isFlagged = session.isFlagged || session.status === 'flagged';
            const hasTabViolations = (session.tabSwitchesCount || 0) > 0;

            return (
              <div
                key={session.sessionId}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isFlagged
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : isActive
                    ? 'border-red-200'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                {/* Video / Snapshot Container */}
                <div className="relative bg-slate-900 aspect-video w-full flex items-center justify-center overflow-hidden">
                  {session.latestFrameUrl ? (
                    <img
                      src={session.latestFrameUrl}
                      alt={`Live Proctor feed - ${session.studentName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400 space-y-1">
                      <Video className="w-8 h-8 mx-auto opacity-40 animate-pulse" />
                      <p className="text-xs font-semibold">
                        {isActive
                          ? language === 'ta'
                            ? 'கேமரா தரவு பெறப்படுகிறது...'
                            : 'Waiting for camera frame...'
                          : language === 'ta'
                          ? 'கேமரா துண்டிக்கப்பட்டது'
                          : 'Camera Feed Closed'}
                      </p>
                    </div>
                  )}

                  {/* Status Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 text-[10px] font-bold backdrop-blur-xs">
                        CLOSED
                      </span>
                    )}

                    {isFlagged && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-xs">
                        <Flag className="w-3 h-3 fill-slate-950" />
                        FLAGGED
                      </span>
                    )}
                  </div>

                  {/* Tab Switch Alert Badge Overlay */}
                  {hasTabViolations && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-black shadow-md flex items-center gap-1 border border-white/20 animate-bounce">
                        <AlertTriangle className="w-3 h-3" />
                        {session.tabSwitchesCount} Tab Switch{session.tabSwitchesCount > 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}

                  {/* Candidate Name Overlay at Bottom */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 pt-6 text-white flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold leading-tight">{session.studentName}</p>
                      <p className="text-[10px] text-slate-300 font-medium truncate max-w-[180px]">
                        {session.competitionTitle}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                        {session.questionsAnswered || 0}/{session.totalQuestions || '?'} Ans
                      </span>
                    </div>
                  </div>
                </div>

                {/* Candidate Info Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        {session.studentGrade || 'Candidate'} • {session.studentInstitution || 'General Student'}
                      </span>
                    </div>

                    {/* Flag Reason if exists */}
                    {session.flagReason && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-900 font-medium flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Flag Note: {session.flagReason}</span>
                      </div>
                    )}

                    {/* Warnings sent count */}
                    {session.warningsSent && session.warningsSent.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-[11px] text-red-900 font-medium flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span>
                          {session.warningsSent.length} warning(s) issued. Latest:{' '}
                          <span className="italic">"{session.warningsSent[session.warningsSent.length - 1].message}"</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      disabled={!isActive}
                      onClick={() => setWarningModalSession(session)}
                      className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1 text-[11px] transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Send warning message to candidate screen"
                    >
                      <Send className="w-3 h-3" />
                      <span>Warning</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFlagModalSession(session);
                        setFlagReasonText(session.flagReason || '');
                      }}
                      className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1 text-[11px] transition cursor-pointer ${
                        isFlagged
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      }`}
                      title="Flag or unflag candidate session"
                    >
                      <Flag className="w-3 h-3" />
                      <span>{isFlagged ? 'Unflag' : 'Flag'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!isActive}
                      onClick={() => handleTerminateSession(session)}
                      className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1 text-[11px] transition cursor-pointer ${
                        isActive
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title="End live proctor session"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>End Feed</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning Directive Modal */}
      {warningModalSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  <span>{language === 'ta' ? 'நேரலை எச்சரிக்கை செய்தி அனுப்புக' : 'Send Live Proctor Directive'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate: <strong className="text-slate-800">{warningModalSession.studentName}</strong>
                </p>
              </div>
              <button
                onClick={() => setWarningModalSession(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendWarning} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ta' ? 'உடனடி எச்சரிக்கையை தேர்வு செய்' : 'Select Preset Warning Message'}
                </label>
                <div className="space-y-1.5 mb-3">
                  {presetWarnings.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setWarningText(preset)}
                      className="w-full text-left p-2 text-xs rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 font-medium transition cursor-pointer"
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ta' ? 'அல்லது தனிப்பயன் செய்தி எழுதவும்' : 'Or Custom Warning Message'}
                </label>
                <textarea
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  rows={3}
                  required
                  placeholder={
                    language === 'ta'
                      ? 'மாணவர் திரையில் உடனே காட்டும் செய்தி...'
                      : 'Type warning directive to blast on candidate screen...'
                  }
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWarningModalSession(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingWarning || !warningText.trim()}
                  className="px-4 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingWarning ? 'Sending...' : 'Blast Warning'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag / Unflag Modal */}
      {flagModalSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-amber-600" />
                  <span>
                    {flagModalSession.isFlagged
                      ? language === 'ta'
                        ? 'கொடியை நீக்குக (Unflag)'
                        : 'Remove Flag Status'
                      : language === 'ta'
                      ? 'சந்தேகத்துக்குரியதாக கொடியிடுக (Flag)'
                      : 'Flag Candidate Session'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate: <strong className="text-slate-800">{flagModalSession.studentName}</strong>
                </p>
              </div>
              <button
                onClick={() => setFlagModalSession(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleToggleFlag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ta' ? 'காரணம் / குறிப்பு' : 'Flag Reason / Audit Note'}
                </label>
                <textarea
                  value={flagReasonText}
                  onChange={(e) => setFlagReasonText(e.target.value)}
                  rows={3}
                  placeholder={
                    language === 'ta'
                      ? 'சந்தேகத்தின் காரணம் (எ.கா: தொடர்ந்து திரையை விட்டு வெளியேறுதல்)...'
                      : 'E.g., Suspicious tab switches, multiple people visible, unusual movements...'
                  }
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFlagModalSession(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagModalSession.isFlagged ? 'Confirm Unflag' : 'Confirm Flag'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
