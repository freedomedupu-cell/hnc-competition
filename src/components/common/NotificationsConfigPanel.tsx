import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Zap,
  Phone,
  Server,
  Activity,
  Bell,
  Calendar,
  Award,
  Check,
  Save,
  Clock,
  ExternalLink,
  Flame,
} from 'lucide-react';
import {
  getStoredWhatsappSmsSettings,
  saveWhatsappSmsSettings,
  verifyApiGatewayConnection,
  getStoredWhatsappSmsLogs,
  dispatchWhatsappBusinessGateway,
  formatAnnouncementMessage,
  formatResultsPublishedMessage,
  formatExam15MinAlertMessage,
  formatUpcomingCompetitionAlertMessage,
  formatRegistrationConfirmMessage,
  WhatsappSmsSettings,
  DbWhatsappSmsLog,
} from '../../utils/whatsappSmsNotificationService';
import { useApp } from '../../context/AppContext';

export const NotificationsConfigPanel: React.FC = () => {
  const { language, currentAuthUser, settings: appSettings, updateSettings } = useApp();

  const [settings, setSettings] = useState<WhatsappSmsSettings>(() => getStoredWhatsappSmsSettings());
  const [logs, setLogs] = useState<DbWhatsappSmsLog[]>(() => getStoredWhatsappSmsLogs());
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test dispatch form state
  const [testPhone, setTestPhone] = useState('0771234567');
  const [testTrigger, setTestTrigger] = useState<'announcement' | 'result' | '15min' | 'upcoming_comp' | 'reg'>('announcement');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    setLogs(getStoredWhatsappSmsLogs());
  }, []);

  const handleToggle = (key: keyof WhatsappSmsSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    saveWhatsappSmsSettings(updated);
    showSaveIndicator();
  };

  const handleTextChange = (key: keyof WhatsappSmsSettings, value: string) => {
    const updated = {
      ...settings,
      [key]: value,
    };
    setSettings(updated);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    saveWhatsappSmsSettings(settings);
    showSaveIndicator();
  };

  const showSaveIndicator = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleVerifyGateway = async () => {
    setIsVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await verifyApiGatewayConnection();
      setSettings(getStoredWhatsappSmsSettings());
      setVerifyMessage(res.message);
    } catch (err: any) {
      setVerifyMessage('Failed to connect to gateway: Connection timed out.');
    } finally {
      setIsVerifying(false);
      setTimeout(() => setVerifyMessage(null), 6000);
    }
  };

  const handleSendTestDispatch = async () => {
    let messageText = '';
    const now = new Date();

    if (testTrigger === 'announcement') {
      messageText = formatAnnouncementMessage(
        'National Academic Olympiad 2026 Scheduled',
        'Official island-wide competitions are now open for student enrollments.',
        'Platform News',
        'Grade 11',
        language
      );
    } else if (testTrigger === 'result') {
      messageText = formatResultsPublishedMessage(
        'Mathematics All-Island Contest 2026',
        'Kasun Perera',
        92,
        100,
        1,
        'Gold Medal',
        language
      );
    } else if (testTrigger === '15min') {
      messageText = formatExam15MinAlertMessage(
        {
          id: 'comp-test',
          title: 'Science Olympiad Final',
          category: 'Science',
          grade: 'Grade 11',
          code: 'HNC-SCI-01',
          duration: 45,
        } as any,
        'Nimal Shantha',
        language
      );
    } else if (testTrigger === 'upcoming_comp') {
      messageText = formatUpcomingCompetitionAlertMessage(
        {
          id: 'comp-test-upcoming',
          title: 'All-Island Junior Mathematics Olympiad 2026',
          category: 'Mathematics',
          grade: 'Grade 11',
          code: 'HNC-MATH-01',
          duration: 60,
          totalMarks: 100,
          startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          competitionStartTime: '10:00',
        } as any,
        'Nimal Shantha',
        24,
        language
      );
    } else {
      messageText = formatRegistrationConfirmMessage(
        {
          id: 'comp-test',
          title: 'English Language Quest',
          code: 'HNC-ENG-02',
        } as any,
        'Fathima Rizna',
        language
      );
    }

    const res = await dispatchWhatsappBusinessGateway(testPhone, messageText, {
      studentName: 'Test Recipient',
      triggerType: 'manual_test',
    });

    setLogs(getStoredWhatsappSmsLogs());
    setTestStatus(`Test message dispatched! Opening WhatsApp link...`);
    window.open(res.whatsappUrl, '_blank');
    setTimeout(() => setTestStatus(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {language === 'ta'
                  ? 'WhatsApp & SMS அறிவிப்புகள் கட்டுப்பாட்டு மையம்'
                  : 'WhatsApp & SMS Notifications Gateway'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{settings.apiGatewayStatus === 'connected' ? 'Gateway Active' : 'Disconnected'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ta'
                ? 'அறிவிப்புகள், தேர்வு முடிவுகள் மற்றும் 15-நிமிட நினைவூட்டல்களுக்கான தானியங்கி WhatsApp தூண்டுதல்களை நிர்வகிக்கவும்.'
                : 'Manage automated WhatsApp alert triggers for announcements, results publication, and countdown reminders.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVerifyGateway}
            disabled={isVerifying}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying...' : 'Verify Gateway Connection'}</span>
          </button>
        </div>
      </div>

      {/* Status Toasts */}
      {verifyMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{verifyMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold">Notification preferences and API gateway configuration saved.</span>
        </div>
      )}

      {/* Super Admin Direct Student Alerts & Push Banners Control */}
      {currentAuthUser?.role === 'super_admin' && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-amber-500/10 border-2 border-blue-300 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'ta'
                    ? 'மாணவர் பாட அறிவிப்புகள் & கெடுநிலை புஷ் மேலாண்மை (Student Alerts & Push Governance)'
                    : 'Student Subject Alerts & Deadlines Push Banners Control'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {language === 'ta'
                  ? 'மாணவர் முகப்பில் தோன்றும் Subject Alerts மற்றும் Deadlines Status பேனர்களை On/Off செய்யலாம்.'
                  : 'Control whether the Subject Publication Alerts and Deadlines Status banners appear on the student dashboard.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ enableSubjectAlerts: true, enableDeadlineAlerts: true })}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer active:scale-95"
              >
                All ON
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ enableSubjectAlerts: false, enableDeadlineAlerts: false })}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer active:scale-95"
              >
                All OFF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Subject Alerts */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {language === 'ta' ? 'பாட அறிவிப்புகள் (Subject Alerts)' : 'Subject Alerts Banner'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {appSettings?.enableSubjectAlerts !== false ? 'Active (ON)' : 'Disabled (OFF)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="panel-toggle-subject-alerts"
                onClick={() => updateSettings({ enableSubjectAlerts: appSettings?.enableSubjectAlerts === false })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  appSettings?.enableSubjectAlerts !== false ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                aria-label="Toggle Subject Alerts"
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    appSettings?.enableSubjectAlerts !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Deadlines Alerts */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">⏰</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {language === 'ta' ? 'கெடுநிலை நிலை (Deadlines Status)' : 'Deadlines Status Banner'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {appSettings?.enableDeadlineAlerts !== false ? 'Active (ON)' : 'Disabled (OFF)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="panel-toggle-deadline-alerts"
                onClick={() => updateSettings({ enableDeadlineAlerts: appSettings?.enableDeadlineAlerts === false })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  appSettings?.enableDeadlineAlerts !== false ? 'bg-amber-500' : 'bg-slate-300'
                }`}
                aria-label="Toggle Deadline Alerts"
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    appSettings?.enableDeadlineAlerts !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Grid: API Gateway Telemetry & Master Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gateway Telemetry & Verification Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>WhatsApp Cloud Gateway</span>
            </h2>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {settings.apiLatencyMs || 38}ms Latency
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Gateway Protocol:</span>
              <span className="font-mono font-bold text-slate-800">Meta Cloud API v18.0</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">WABA Account ID:</span>
              <span className="font-mono font-bold text-slate-800">{settings.wabaAccountId || 'WABA-HNC-948201'}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Phone Number ID:</span>
              <span className="font-mono font-bold text-slate-800">{settings.phoneNumberId || 'PHONE-ID-LK-77123'}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Last Verified:</span>
              <span className="text-slate-700 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {settings.lastVerifiedAt
                    ? new Date(settings.lastVerifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now'}
                </span>
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleVerifyGateway}
                disabled={isVerifying}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Ping & Validate Gateway Connection</span>
              </button>
            </div>
          </div>
        </div>

        {/* Master Sender Configuration Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Official Sender Channel & Gateway Endpoint</span>
          </h2>

          <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Official Sender WhatsApp Number</label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => handleTextChange('whatsappNumber', e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">WABA Business Account ID</label>
                <input
                  type="text"
                  value={settings.wabaAccountId || ''}
                  onChange={(e) => handleTextChange('wabaAccountId', e.target.value)}
                  placeholder="WABA-HNC-948201"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">API Gateway Endpoint URL</label>
              <input
                type="text"
                value={settings.apiGatewayEndpoint || ''}
                onChange={(e) => handleTextChange('apiGatewayEndpoint', e.target.value)}
                placeholder="https://graph.facebook.com/v18.0/waba-cloud-gateway"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Changes apply instantly across all automated student broadcast hooks.
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Automated Triggers Configuration Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Automated Notification Triggers</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle specific event-based WhatsApp notifications sent to registered candidate phone numbers.
            </p>
          </div>

          {/* Master Service Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Master WhatsApp Service:</span>
            <button
              type="button"
              onClick={() => handleToggle('enableWhatsappAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.enableWhatsappAlerts ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.enableWhatsappAlerts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trigger 1: Announcements */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  {language === 'ta' ? 'அறிவிப்புகள் வெளியீடு (Announcements)' : 'Platform Announcements Broadcast'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automatically dispatch structured WhatsApp messages to candidate numbers when new official platform announcements are created.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('notifyAnnouncements')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                settings.notifyAnnouncements && settings.enableWhatsappAlerts ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifyAnnouncements && settings.enableWhatsappAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trigger 2: Results Published */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  {language === 'ta' ? 'தேர்வு முடிவுகள் அறிவித்தல் (Results Published)' : 'Exam Results & Ratings Notification'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Send candidate score, national ranking (#Rank), and medal award status as soon as an admin ratifies student evaluation rubrics.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('notifyResultsPublished')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                settings.notifyResultsPublished && settings.enableWhatsappAlerts ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifyResultsPublished && settings.enableWhatsappAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trigger 3: 15-Minute Exam Reminders */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  {language === 'ta' ? '15 நிமிட நேரடி நினைவூட்டல் (15-Min Reminder)' : '15-Minute Exam Countdown Alert'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Alert enrolled students exactly 15 minutes before an official competition or Olympiad opens, providing a direct link to the exam room.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('notify15MinBeforeExam')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                settings.notify15MinBeforeExam && settings.enableWhatsappAlerts ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notify15MinBeforeExam && settings.enableWhatsappAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trigger 4: Registration Confirmation */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  {language === 'ta' ? 'பதிவு உறுதிப்படுத்தல் (Registration Confirmation)' : 'Exam Registration Confirmation'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Confirm candidate enrollment with unique entry codes and schedule guidelines upon registering for competitions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('notifyRegistrationConfirm')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                settings.notifyRegistrationConfirm && settings.enableWhatsappAlerts ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifyRegistrationConfirm && settings.enableWhatsappAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trigger 5: Upcoming Competitions Alert */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 transition flex items-start justify-between gap-3 md:col-span-2">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  {language === 'ta'
                    ? 'வரவிருக்கும் போட்டிகள் அறிவிப்பு (Upcoming Competitions Alert)'
                    : 'Upcoming Competitions Scheduled Alert'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Candidate Advance Notice
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl">
                {language === 'ta'
                  ? 'மாணவர்கள் தங்களின் பாடத்திட்டத்திற்குரிய அல்லது பதிவு செய்துள்ள போட்டிகள் தொடங்குவதற்கு முன் முன்கூட்டியே WhatsApp மற்றும் தளத்தில் உடனடி விழிப்பூட்டல்களை பெறுகின்றனர்.'
                  : 'Proactively alert eligible and registered students before academic competitions open, with syllabus overviews and direct prep links.'}
              </p>

              {/* Lead Time Dropdown */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'ta' ? 'அறிவிப்பு இடைவெளி (Lead Time):' : 'Alert Dispatch Window:'}
                </span>
                <select
                  value={settings.upcomingHoursLeadTime || 24}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value, 10);
                    const updated = { ...settings, upcomingHoursLeadTime: hours };
                    setSettings(updated);
                    saveWhatsappSmsSettings(updated);
                    showSaveIndicator();
                  }}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={12}>12 Hours Before Start</option>
                  <option value={24}>24 Hours (1 Day) Before Start</option>
                  <option value={48}>48 Hours (2 Days) Before Start</option>
                  <option value={72}>72 Hours (3 Days) Before Start</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('notifyUpcomingCompetitions')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                settings.notifyUpcomingCompetitions && settings.enableWhatsappAlerts ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifyUpcomingCompetitions && settings.enableWhatsappAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Gateway Verification Sandbox & Test Dispatcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Send className="w-4 h-4 text-emerald-600" />
          <span>Interactive Dispatch Sandbox & Test Message Trigger</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Test Candidate Phone Number</label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="0771234567"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Simulation Trigger Template</label>
            <select
              value={testTrigger}
              onChange={(e) => setTestTrigger(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="announcement">📢 Announcement Broadcast Template</option>
              <option value="result">🏆 Exam Result Publication Template</option>
              <option value="15min">🚨 15-Minute Countdown Reminder Template</option>
              <option value="upcoming_comp">📅 Upcoming Competition Alert Template</option>
              <option value="reg">✅ Registration Confirmation Template</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSendTestDispatch}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch Test WhatsApp Message</span>
            </button>
          </div>
        </div>

        {testStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{testStatus}</span>
          </div>
        )}
      </div>

      {/* Dispatch History Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Recent WhatsApp & SMS Dispatch Log Audit</span>
          </h2>
          <button
            type="button"
            onClick={() => setLogs(getStoredWhatsappSmsLogs())}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Recipient</th>
                <th className="px-4 py-2.5">Trigger Type</th>
                <th className="px-4 py-2.5">Phone Number</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No dispatch records logged yet. Automated triggers record history here.
                  </td>
                </tr>
              ) : (
                logs.slice(0, 15).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      <div>{log.studentName || 'Candidate'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{log.competitionTitle || 'Olympiad'}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 capitalize">
                        {log.triggerType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 text-[11px]">
                      {log.recipientPhone}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                      {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Dispatched</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
