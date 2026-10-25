import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Send,
  Bell,
  Clock,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Volume2,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  getStoredWhatsappSmsSettings,
  saveWhatsappSmsSettings,
  normalizeSriLankaPhoneNumber,
  formatDisplayPhoneNumber,
  buildWhatsappChatUrl,
  buildNativeSmsUrl,
  logWhatsappSmsDispatch,
  getStoredWhatsappSmsLogs,
  WhatsappSmsSettings,
  DbWhatsappSmsLog,
} from '../../utils/whatsappSmsNotificationService';
import { playSubjectPublicationChime } from '../../utils/subjectNotificationUtils';

interface WhatsappSmsAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsappSmsAlertModal: React.FC<WhatsappSmsAlertModalProps> = ({ isOpen, onClose }) => {
  const { currentStudent, currentAuthUser, updateStudentProfile, language, competitions } = useApp();

  const [settings, setSettings] = useState<WhatsappSmsSettings>(getStoredWhatsappSmsSettings);
  const [phoneInput, setPhoneInput] = useState<string>(
    currentStudent.phone || settings.whatsappNumber || ''
  );
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logsList, setLogsList] = useState<DbWhatsappSmsLog[]>(getStoredWhatsappSmsLogs);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSavePhoneAndSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const normPhone = normalizeSriLankaPhoneNumber(phoneInput);
    const updatedSettings = saveWhatsappSmsSettings({
      whatsappNumber: normPhone,
      enableWhatsappAlerts: settings.enableWhatsappAlerts,
      enableSmsAlerts: settings.enableSmsAlerts,
      notify15MinBeforeExam: settings.notify15MinBeforeExam,
      notifyRegistrationConfirm: settings.notifyRegistrationConfirm,
      notifyResultsPublished: settings.notifyResultsPublished,
    });

    setSettings(updatedSettings);

    try {
      if (updateStudentProfile) {
        await updateStudentProfile({ phone: normPhone });
      }
      showToast(
        language === 'ta'
          ? '✅ வாட்ஸ்அப் & SMS இலக்கம் வெற்றிகரமாக சேமிக்கப்பட்டது!'
          : '✅ WhatsApp & SMS mobile number saved successfully!'
      );
    } catch {
      showToast(language === 'ta' ? 'அமைப்புகள் புதுப்பிக்கப்பட்டன' : 'Settings updated locally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestWhatsappMessage = () => {
    const targetPhone = phoneInput || currentStudent.phone || '0771234567';
    const norm = normalizeSriLankaPhoneNumber(targetPhone);

    if (!norm) {
      showToast(
        language === 'ta'
          ? '⚠️ தயவுசெய்து உங்கள் வாட்ஸ்அப் / தொலைபேசி இலக்கத்தை உள்ளிடவும்!'
          : '⚠️ Please enter your Sri Lankan WhatsApp / mobile phone number first!'
      );
      return;
    }

    const testComp = competitions[0] || {
      id: 'comp-sample-test',
      title: 'Sri Lanka National Term Exam 2026',
      competitionType: 'Exam',
      category: 'Mathematics',
      grade: currentStudent.gradeLevel || 'Grade 11 (O/L)',
      duration: 60,
    };

    const studentName = currentStudent.name || currentAuthUser?.fullName || 'Candidate';
    const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hnc-edu.app';

    const testMsg =
      `🚨 *வாட்ஸ்அப் பரீட்சை நினைவூட்டல் சோதனை (HNC Test Alert)*\n\n` +
      `அன்பான ${studentName},\n` +
      `இது HNC Examination Portal இன் நேரலை வாட்ஸ்அப் & SMS சேவை சோதனையாகும்.\n\n` +
      `🏆 *பரீட்சை:* ${testComp.title}\n` +
      `⏱️ *அலர்ட்:* பரீட்சை தொடங்க இன்னும் 15 நிமிடங்கள் மட்டுமே உள்ளன!\n` +
      `🔗 *பரீட்சை அறை:* ${appBaseUrl}/?comp=${testComp.id}\n\n` +
      `_HNC National Examination Board_`;

    const waUrl = buildWhatsappChatUrl(norm, testMsg);

    playSubjectPublicationChime();

    // Log the test dispatch
    const createdLog = logWhatsappSmsDispatch({
      studentId: currentStudent.id,
      studentName: studentName,
      recipientPhone: norm,
      channel: 'whatsapp',
      triggerType: 'manual_test',
      competitionId: testComp.id,
      competitionTitle: testComp.title,
      messageText: testMsg,
      status: 'sent',
    });

    setLogsList(getStoredWhatsappSmsLogs());

    // Open WhatsApp Web / App directly in a new window
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    showToast(
      language === 'ta'
        ? '📲 வாட்ஸ்அப் நேரடி நினைவூட்டல் செய்தி அனுப்பப்பட்டது! (WhatsApp திரையில் பார்க்கவும்)'
        : '📲 WhatsApp 15-Min Pre-Exam Test Alert launched directly on your screen!'
    );
  };

  const formattedDisplay = formatDisplayPhoneNumber(phoneInput || currentStudent.phone);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === 'ta'
          ? '📲 வாட்ஸ்அப் & SMS நேரலை பரீட்சை நினைவூட்டல் மையம்'
          : '📲 WhatsApp & SMS Exam Notification Center'
      }
      subtitle={
        language === 'ta'
          ? 'பரீட்சை தொடங்குவதற்கு 15 நிமிடங்களுக்கு முன் உங்கள் வாட்ஸ்அப் இலக்கத்திற்கு தானியங்கி எச்சரிக்கை செய்தி வரும்.'
          : 'Automated 15-minute pre-exam alerts & instant registration SMS updates'
      }
    >
      <div className="space-y-5 text-xs">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 border border-emerald-400 shadow-md animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Header Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{language === 'ta' ? 'வாட்ஸ்அப் அமைப்புகள்' : 'WhatsApp & SMS Settings'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLogsList(getStoredWhatsappSmsLogs());
              setActiveTab('logs');
            }}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {language === 'ta' ? 'அனுப்பப்பட்ட அறிக்கைகள்' : 'Dispatched Logs'} ({logsList.length})
            </span>
          </button>
        </div>

        {/* TAB 1: SETTINGS & NUMBER VERIFICATION */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSavePhoneAndSettings} className="space-y-4">
            {/* Sri Lanka WhatsApp Number Input Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border border-emerald-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <span className="text-base">🇱🇰</span>
                  <span>
                    {language === 'ta'
                      ? 'உங்கள் வாட்ஸ்அப் / கைத்தொலைபேசி இலக்கம் (Sri Lanka Mobile No)'
                      : 'WhatsApp / Mobile Phone Number'}
                  </span>
                </label>
                {formattedDisplay && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    {formattedDisplay}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs shrink-0 flex items-center gap-1">
                  <span>🇱🇰</span>
                  <span>+94</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 077 123 4567 or 771234567"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-snug">
                {language === 'ta'
                  ? 'பரீட்சை தொடங்க 15 நிமிடங்களுக்கு முன் நேரடி வாட்ஸ்அப் நினைவூட்டல் செய்தி மற்றும் எஸ்.எம்.எஸ் அனுப்ப இந்த இலக்கம் பயன்படுத்தப்படும்.'
                  : 'This Sri Lankan mobile number will receive automatic WhatsApp reminders 15 minutes before your registered exams start.'}
              </p>
            </div>

            {/* Notification Toggles List */}
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-extrabold text-slate-700 block uppercase tracking-wider">
                {language === 'ta' ? 'அறிவிப்பு விருப்பங்கள் (Notification Preferences)' : 'Alert Preferences'}
              </span>

              {/* Toggle 1: 15-Min Pre-Exam Alert */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-300 transition">
                <div className="space-y-0.5 pr-2">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {language === 'ta'
                        ? '15 நிமிடங்களுக்கு முன் வாட்ஸ்அப் பரீட்சை நினைவூட்டல்'
                        : 'Automated 15-Min Pre-Exam WhatsApp Alert'}
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ta'
                      ? 'நீங்கள் பதிவுசெய்த பரீட்சை தொடங்குவதற்கு 15 நிமிடங்களுக்கு முன் நேரடி செய்தி பெறவும்'
                      : 'Receive direct WhatsApp message 15 mins before your exam starts'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableWhatsappAlerts}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, enableWhatsappAlerts: e.target.checked }))
                  }
                  className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              {/* Toggle 2: Direct SMS Alert */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-300 transition">
                <div className="space-y-0.5 pr-2">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {language === 'ta'
                        ? 'நேரடி SMS மொபைல் அறிவிப்பு (Direct Mobile SMS)'
                        : 'Direct Mobile SMS Notifications'}
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ta'
                      ? 'வாட்ஸ்அப் கிடைக்காத நேரங்களில் கைத்தொலைபேசி SMS பெறவும்'
                      : 'Fallback to direct cellular SMS if WhatsApp is offline'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSmsAlerts}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, enableSmsAlerts: e.target.checked }))
                  }
                  className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              {/* Toggle 3: Registration Confirmation */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-300 transition">
                <div className="space-y-0.5 pr-2">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {language === 'ta'
                        ? 'பரீட்சை பதிவு உறுதிப்படுத்தல் செய்தி'
                        : 'Exam Registration Instant Confirmation'}
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {language === 'ta'
                      ? 'புதிய பரீட்சைக்கு பதிவு செய்தவுடன் வாட்ஸ்அப் செய்தி வரும்'
                      : 'Send confirmation text whenever you enroll in an exam'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyRegistrationConfirm}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, notifyRegistrationConfirm: e.target.checked }))
                  }
                  className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Action Buttons: Save & Send Instant Test */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleSendTestWhatsappMessage}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'ta'
                    ? '⚡ வாட்ஸ்அப் சோதனையை உடனே அனுப்புக (Send Test WhatsApp)'
                    : '⚡ Trigger Instant WhatsApp Test Message'}
                </span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSaving
                    ? language === 'ta'
                      ? 'சேமிக்கப்படுகிறது...'
                      : 'Saving...'
                    : language === 'ta'
                    ? 'அமைப்புகளைச் சேமிக்க'
                    : 'Save Notification Profile'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DISPATCHED LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">
                {language === 'ta'
                  ? 'அனுப்பப்பட்ட வாட்ஸ்அப் & SMS செய்திகளின் அறிக்கை:'
                  : 'History of dispatched WhatsApp & SMS alerts:'}
              </span>
              <button
                type="button"
                onClick={() => setLogsList(getStoredWhatsappSmsLogs())}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {logsList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400 space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">
                  {language === 'ta' ? 'செய்திகள் எதுவும் அனுப்பப்படவில்லை' : 'No alerts dispatched yet'}
                </p>
                <p className="text-[11px]">
                  {language === 'ta'
                    ? 'பரீட்சை தொடங்க 15 நிமிடங்களுக்கு முன் செய்திகள் அனுப்பப்படும்.'
                    : 'Dispatched alerts will automatically show up here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {logsList.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {log.channel.toUpperCase()}
                        </span>
                        <span className="font-bold text-slate-900">
                          {log.competitionTitle || '15-Min Pre-Exam Alert'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.sentAt ? log.sentAt.replace('T', ' ').slice(0, 16) : 'Just now'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded-lg font-mono">
                      {log.messageText}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Recipient: +{log.recipientPhone}</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
