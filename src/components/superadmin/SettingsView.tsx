import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  Lock,
  Calendar,
  Save,
  CheckCircle2,
  Building2,
  CreditCard,
  QrCode,
  Smartphone,
  Plus,
  Trash2,
  Copy,
  Check,
  Globe,
  Sliders,
  Clock,
  Users,
  Eye,
  XCircle,
  FileText,
  AlertTriangle,
  MessageSquare,
  Gamepad2,
  Layout,
  Award,
  Gift,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BankAccountDetails, PaymentGatewayConfig, MembershipSettings } from '../../types';
import { simulateSessionTimeoutWarning } from '../../lib/sessionUtils';
import { NotificationsConfigPanel } from '../common/NotificationsConfigPanel';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    memberships,
    membershipPayments,
    membershipSettings,
    updateMembershipSettings,
    reviewMembershipPayment,
    refreshMembershipData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'membership' | 'notifications' | 'security'>('general');
  const [formData, setFormData] = useState({ ...settings });
  const [memConfig, setMemConfig] = useState<MembershipSettings>({ ...membershipSettings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [memSaveSuccess, setMemSaveSuccess] = useState(false);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);

  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // New bank modal/inline state
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState<Omit<BankAccountDetails, 'id'>>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    swiftCode: '',
    isPrimary: false,
  });

  const paymentSettings: PaymentGatewayConfig = formData.paymentSettings || {
    enableCardPayments: true,
    enableBankTransfer: true,
    enableLankaQR: true,
    enableMobileWallets: true,
    bankAccounts: [
      {
        id: 'bank-1',
        bankName: 'Commercial Bank of Ceylon',
        accountName: 'HNC Competition Academic Council',
        accountNumber: '1000845920',
        branch: 'Colombo Fort Branch',
        swiftCode: 'CCEYLKX',
        isPrimary: true,
      },
      {
        id: 'bank-2',
        bankName: 'Bank of Ceylon (BOC)',
        accountName: 'HNC Competition Educational Fund',
        accountNumber: '8492019482',
        branch: 'Colombo Central Corporate Branch',
        swiftCode: 'BCEYLKLX',
        isPrimary: false,
      },
      {
        id: 'bank-3',
        bankName: 'Sampath Bank',
        accountName: 'HNC Competition Foundation',
        accountNumber: '019230048123',
        branch: 'Head Office City Branch',
        swiftCode: 'BSAMLKLX',
        isPrimary: false,
      },
    ],
    lankaQrMerchantName: 'HNC Competition National Olympiad',
    lankaQrMerchantId: 'LQR-HNC-9482',
    lankaQrAccountNo: '1000845920',
    lankaQrBank: 'Commercial Bank of Ceylon',
    mobileWalletNumbers: {
      dialogGenie: '077 123 4567',
      ezCash: '#111*9482# (Merchant: HNC Competition)',
      mcash: '071 987 6543 (HNC Competition)',
    },
  };

  const updatePaymentConfig = (updated: Partial<PaymentGatewayConfig>) => {
    setFormData({
      ...formData,
      paymentSettings: {
        ...paymentSettings,
        ...updated,
      },
    });
  };

  const handleAddBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.bankName || !newBank.accountNumber) return;

    const account: BankAccountDetails = {
      ...newBank,
      id: `bank-${Date.now()}`,
    };

    const updatedAccounts = [...paymentSettings.bankAccounts, account];
    updatePaymentConfig({ bankAccounts: updatedAccounts });

    setNewBank({
      bankName: '',
      accountName: '',
      accountNumber: '',
      branch: '',
      swiftCode: '',
      isPrimary: false,
    });
    setShowAddBank(false);
  };

  const handleDeleteBankAccount = (id: string) => {
    const updatedAccounts = paymentSettings.bankAccounts.filter((b) => b.id !== id);
    updatePaymentConfig({ bankAccounts: updatedAccounts });
  };

  const handleSetPrimaryBank = (id: string) => {
    const updatedAccounts = paymentSettings.bankAccounts.map((b) => ({
      ...b,
      isPrimary: b.id === id,
    }));
    updatePaymentConfig({ bankAccounts: updatedAccounts });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-700" />
            <span>System Settings & Payment Gateways Governance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional parameters, bank accounts, Sri Lankan payment channels, and Firestore security.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
          <button
            type="button"
            id="tab-settings-general"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'general'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General Governance
          </button>
          <button
            type="button"
            id="tab-settings-payments"
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Payment Methods & Banking</span>
          </button>
          <button
            type="button"
            id="tab-settings-membership"
            onClick={() => setActiveTab('membership')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'membership'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Monthly Membership</span>
          </button>
          <button
            type="button"
            id="tab-settings-notifications"
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Notifications & WhatsApp</span>
          </button>
          <button
            type="button"
            id="tab-settings-security"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'security'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security & Architecture
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Platform configuration and payment settings saved successfully to Firestore.</span>
        </div>
      )}

      {/* TAB 1: GENERAL GOVERNANCE */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Academic Platform Parameters
              </h2>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Official Platform Title
                </label>
                <input
                  id="setting-platform-name"
                  type="text"
                  value={formData.platformName}
                  onChange={(e) =>
                    setFormData({ ...formData, platformName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Current Academic Cycle
                  </label>
                  <div className="relative">
                    <input
                      id="setting-academic-year"
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({ ...formData, academicYear: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Institutional Support Email
                  </label>
                  <input
                    id="setting-support-email"
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, supportEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Governance & Access Rules
                </h3>

                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-900 block">
                      Allow Student Self-Registration
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Enable high school & undergraduate students to enroll directly via the registration portal.
                    </span>
                  </div>
                  <input
                    id="setting-allow-reg"
                    type="checkbox"
                    checked={formData.allowStudentRegistration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowStudentRegistration: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-900 block">
                      Maintenance Mode
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Temporarily suspend student test submissions during database indexing.
                    </span>
                  </div>
                  <input
                    id="setting-maintenance"
                    type="checkbox"
                    checked={formData.maintenanceMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceMode: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </label>

                {/* SUPER ADMIN SPINNING OPTIONS CONTROL (அதிர்ஷ்ட சுழல் சக்கரம் கட்டுப்பாடு) */}
                <div className="p-4 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/60 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl shrink-0 shadow-xs border border-amber-500/30">
                        🎡
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            அதிர்ஷ்ட சுழல் சக்கரம் (Daily Lucky Spin Wheel)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              formData.enableDailySpinWheel !== false
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {formData.enableDailySpinWheel !== false
                              ? 'இயங்குகிறது (Active)'
                              : 'முடக்கப்பட்டுள்ளது (Disabled)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          மாணவர்கள் Study Games Hub மற்றும் முகப்புப் பக்கத்தில் தினமும் ஒருமுறை சுழற்றி போனஸ் புள்ளிகளைப் பெறும் Lucky Spin சக்கரத்தின் Super Admin கட்டுப்பாடு.
                          <br />
                          <span className="text-[10px] text-slate-500">
                            (Super Admin Master On/Off switch for the student Spin & Win feature across the platform.)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Master On/Off Switch */}
                    <button
                      type="button"
                      id="toggle-daily-spin-wheel"
                      onClick={() => {
                        const nextState = formData.enableDailySpinWheel === false ? true : false;
                        setFormData({
                          ...formData,
                          enableDailySpinWheel: nextState,
                        });
                        updateSettings({ enableDailySpinWheel: nextState });
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2500);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                        formData.enableDailySpinWheel !== false ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                      aria-label="Toggle Daily Spin Wheel"
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableDailySpinWheel !== false ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-amber-900 font-medium">
                      {formData.enableDailySpinWheel !== false
                        ? '✓ மாணவர்கள் தினமும் 1 முறை இலவசமாக சுழற்றி புள்ளிகள் பெறலாம்.'
                        : '⚠️ சுழல் சக்கரம் மாணவர்களுக்கு தற்காலிகமாக மறைக்கப்பட்டு இடைநிறுத்தப்பட்டுள்ளது.'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-white/70 px-2 py-0.5 rounded border border-amber-200">
                      Super Admin Override
                    </span>
                  </div>
                </div>

                {/* Super Admin Control: Student Subject Publication Alerts Banner */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/90 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-sm shrink-0 font-bold">
                        🌐
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            மாணவர் பாட அறிவிப்புகள் (Student Subject Alerts Banner)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              formData.enableSubjectAlerts !== false
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {formData.enableSubjectAlerts !== false
                              ? 'இயங்குகிறது (Active - ON)'
                              : 'முடக்கப்பட்டுள்ளது (Disabled - OFF)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          மாணவர் முகப்பில் தோன்றும் "Subject Alerts: English, Enable Push, 🔔 Test, Manage Subjects" பேனர்.
                          <br />
                          <span className="text-[10px] text-slate-500">
                            (Super Admin Master On/Off switch for student enrolled subject publication alerts and push prompts.)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Master On/Off Switch */}
                    <button
                      type="button"
                      id="toggle-subject-alerts"
                      onClick={() => {
                        const nextState = formData.enableSubjectAlerts === false ? true : false;
                        setFormData({
                          ...formData,
                          enableSubjectAlerts: nextState,
                        });
                        updateSettings({ enableSubjectAlerts: nextState });
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2500);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                        formData.enableSubjectAlerts !== false ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      aria-label="Toggle Subject Alerts Banner"
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableSubjectAlerts !== false ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-blue-900 font-medium">
                      {formData.enableSubjectAlerts !== false
                        ? '✓ மாணவர்களுக்கு பாட அறிவிப்புகள் மற்றும் புஷ் வசதி இயக்கத்தில் உள்ளது.'
                        : '⚠️ பாட அறிவிப்புகள் பேனர் மாணவர் திரையிலிருந்து மறைக்கப்பட்டுள்ளது.'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-800 bg-white/70 px-2 py-0.5 rounded border border-blue-200">
                      Super Admin Override
                    </span>
                  </div>
                </div>

                {/* Super Admin Control: Student Deadlines Status & Push Banner */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200/90 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-sm shrink-0 font-bold">
                        ⏰
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            கெடுநிலை & புஷ் அறிவிப்புகள் (Deadlines Status & Push Alerts)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              formData.enableDeadlineAlerts !== false
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {formData.enableDeadlineAlerts !== false
                              ? 'இயங்குகிறது (Active - ON)'
                              : 'முடக்கப்பட்டுள்ளது (Disabled - OFF)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          மாணவர் முகப்பில் தோன்றும் "Deadlines Status: No Critical Deadlines Pending... Enable Push Alerts" பேனர்.
                          <br />
                          <span className="text-[10px] text-slate-500">
                            (Super Admin Master On/Off switch for student deadline alert warnings and local push notifications.)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Master On/Off Switch */}
                    <button
                      type="button"
                      id="toggle-deadline-alerts"
                      onClick={() => {
                        const nextState = formData.enableDeadlineAlerts === false ? true : false;
                        setFormData({
                          ...formData,
                          enableDeadlineAlerts: nextState,
                        });
                        updateSettings({ enableDeadlineAlerts: nextState });
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2500);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                        formData.enableDeadlineAlerts !== false ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                      aria-label="Toggle Deadline Alerts Banner"
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableDeadlineAlerts !== false ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-amber-900 font-medium">
                      {formData.enableDeadlineAlerts !== false
                        ? '✓ மாணவர்களுக்கு காலக்கெடு எச்சரிக்கை மற்றும் புஷ் பொத்தான் இயக்கத்தில் உள்ளது.'
                        : '⚠️ கெடுநிலை பேனர் மாணவர் திரையிலிருந்து மறைக்கப்பட்டுள்ளது.'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-white/70 px-2 py-0.5 rounded border border-amber-200">
                      Super Admin Override
                    </span>
                  </div>
                </div>

                {/* Student Dashboard Layout & Interactive Games Master Section */}
                <div className="p-4 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-200/60 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-indigo-700" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          மாணவர் முகப்புப் பலகை & கல்வி விளையாட்டுகள் கட்டுப்பாடு (Dashboard Layout & Games Deck)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        மாணவர் முகப்பில் பல அட்டைகள் தோன்றுவதை சீரமைக்க (Declutter) குறைந்தபட்ச முகப்பு அல்லது முழு முகப்பைத் தேர்வு செய்யவும்.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          const minimalUpdates = {
                            enableStudyGamesCard: false,
                            enableDailySpinWheel: false,
                            enableAiTimetableCard: false,
                            enableSmartDailyTips: false,
                            enableOfflineMaterialsCard: false,
                            enableReferralCard: false,
                            enableEduArenaCard: false,
                            enableLeaderboardsCard: false,
                            enableAchievementsCard: false,
                            enableToastPreviewDeck: false,
                            enableSubjectAlerts: false,
                            enableDeadlineAlerts: true,
                            enableNextCompetitionCountdown: true,
                          };
                          setFormData({ ...formData, ...minimalUpdates });
                          await updateSettings(minimalUpdates);
                          setSavedSuccess(true);
                          setTimeout(() => setSavedSuccess(false), 2500);
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-900 text-amber-300 hover:bg-slate-800 cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>🎯</span>
                        <span>சுத்த முகப்பு (Clean Mode)</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const fullUpdates = {
                            enableStudyGamesCard: true,
                            enableDailySpinWheel: true,
                            enableAiTimetableCard: true,
                            enableSmartDailyTips: true,
                            enableOfflineMaterialsCard: true,
                            enableReferralCard: true,
                            enableEduArenaCard: true,
                            enableLeaderboardsCard: true,
                            enableAchievementsCard: true,
                            enableToastPreviewDeck: true,
                            enableSubjectAlerts: true,
                            enableDeadlineAlerts: true,
                            enableNextCompetitionCountdown: true,
                          };
                          setFormData({ ...formData, ...fullUpdates });
                          await updateSettings(fullUpdates);
                          setSavedSuccess(true);
                          setTimeout(() => setSavedSuccess(false), 2500);
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>🌟</span>
                        <span>முழு முகப்பு (Full Mode)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Daily Study Games & Focus Lounge */}
                    <div className="p-3 bg-white rounded-lg border border-purple-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          🎮 Daily Study Games & Focus Lounge (4-in-1)
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Lucky spin, 60s brain challenge, speed math rush & Lo-Fi Pomodoro study cam
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = formData.enableStudyGamesCard === false;
                          setFormData({ ...formData, enableStudyGamesCard: next });
                          await updateSettings({ enableStudyGamesCard: next });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          formData.enableStudyGamesCard !== false ? 'bg-purple-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableStudyGamesCard !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 2. Lucky Spin Wheel */}
                    <div className="p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          🎡 Daily Lucky Spin Wheel
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          24h Spin limit with 5-50 point sectors
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = formData.enableDailySpinWheel === false;
                          setFormData({ ...formData, enableDailySpinWheel: next });
                          await updateSettings({ enableDailySpinWheel: next });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          formData.enableDailySpinWheel !== false ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableDailySpinWheel !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 3. Edu-Arena Island Quest */}
                    <div className="p-3 bg-white rounded-lg border border-emerald-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          🎯 HNC Edu-Arena: Island Quest
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          25 Districts gamified quiz map banner
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = formData.enableEduArenaCard === false;
                          setFormData({ ...formData, enableEduArenaCard: next });
                          await updateSettings({ enableEduArenaCard: next });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          formData.enableEduArenaCard !== false ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableEduArenaCard !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 4. Gemini AI Timetable */}
                    <div className="p-3 bg-white rounded-lg border border-indigo-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          📅 Gemini AI Study Timetable
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Personalized revision timetable banner
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = formData.enableAiTimetableCard === false;
                          setFormData({ ...formData, enableAiTimetableCard: next });
                          await updateSettings({ enableAiTimetableCard: next });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          formData.enableAiTimetableCard !== false ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableAiTimetableCard !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 5. Smart Daily Tips */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          💡 Smart Daily Tips & Exam Tricks
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Daily motivation & exam tricks card
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = formData.enableSmartDailyTips === false;
                          setFormData({ ...formData, enableSmartDailyTips: next });
                          await updateSettings({ enableSmartDailyTips: next });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          formData.enableSmartDailyTips !== false ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableSmartDailyTips !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 6. Offline Study Materials */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          📦 Offline Study Materials Hub
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Service Worker Cache download deck
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = formData.enableOfflineMaterialsCard === false;
                          setFormData({ ...formData, enableOfflineMaterialsCard: next });
                          await updateSettings({ enableOfflineMaterialsCard: next });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          formData.enableOfflineMaterialsCard !== false ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableOfflineMaterialsCard !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 7. Referral & Share Points */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          🎁 Referral & Share Points Card
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Invitation links and bonus points banner
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = formData.enableReferralCard === false;
                          setFormData({ ...formData, enableReferralCard: next });
                          await updateSettings({ enableReferralCard: next });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          formData.enableReferralCard !== false ? 'bg-pink-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableReferralCard !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 8. Student Achievements Deck */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          🎖️ Student Achievements & Medals
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Unlocked and locked milestone badges
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = formData.enableAchievementsCard === false;
                          setFormData({ ...formData, enableAchievementsCard: next });
                          await updateSettings({ enableAchievementsCard: next });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          formData.enableAchievementsCard !== false ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formData.enableAchievementsCard !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  id="btn-save-general-settings"
                  className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save General Settings</span>
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Platform Status
                </h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                HNC Competition Central Governance platform active with multi-role access control and automated result computation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT METHODS & BANK ACCOUNTS */}
      {activeTab === 'payments' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Active Payment Channels Toggles */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <span>Enabled Payment Channels (கட்டண வழிமுறைகள்)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Turn on or off student payment methods for competition entry fees and examination registrations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Card Payments */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Credit / Debit Cards
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Visa, Mastercard, LankaPay IPG
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettings.enableCardPayments}
                  onChange={(e) =>
                    updatePaymentConfig({ enableCardPayments: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              {/* Bank Transfer & Slip */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Bank Transfer & Slip Upload
                    </span>
                    <span className="text-[11px] text-slate-500">
                      BOC, ComBank, CDM, Cash deposit receipt
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettings.enableBankTransfer}
                  onChange={(e) =>
                    updatePaymentConfig({ enableBankTransfer: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              {/* LankaQR */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      LankaQR (Scan & Pay)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      FriMi, ComBank Q+, BOC SmartPay, iPay
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettings.enableLankaQR}
                  onChange={(e) =>
                    updatePaymentConfig({ enableLankaQR: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              {/* Mobile Wallets */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Mobile Digital Wallets
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Dialog eZ Cash, Mobitel mCash, Genie
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettings.enableMobileWallets}
                  onChange={(e) =>
                    updatePaymentConfig({ enableMobileWallets: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Official Bank Accounts Management */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-700" />
                  <span>Institutional Bank Accounts (வங்கி கணக்குகள்)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official bank accounts displayed to candidates for entry fee deposits and slip verification.
                </p>
              </div>

              <button
                type="button"
                id="btn-add-bank-account"
                onClick={() => setShowAddBank(!showAddBank)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank Account</span>
              </button>
            </div>

            {/* Add Bank Form */}
            {showAddBank && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 animate-in fade-in duration-150">
                <h3 className="text-xs font-bold text-indigo-950">Add New Official Bank Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Bank Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Hatton National Bank (HNB)"
                      value={newBank.bankName}
                      onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Account Holder Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. HNC Competition Academic Board"
                      value={newBank.accountName}
                      onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Account Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 082010482910"
                      value={newBank.accountNumber}
                      onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Branch Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Colombo City Branch"
                      value={newBank.branch}
                      onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">SWIFT / Bank Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. HNBLLKLX"
                      value={newBank.swiftCode}
                      onChange={(e) => setNewBank({ ...newBank, swiftCode: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBank(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBankAccount}
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                  >
                    Add Bank Account
                  </button>
                </div>
              </div>
            )}

            {/* Configured Accounts List */}
            <div className="space-y-2.5">
              {paymentSettings.bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{account.bankName}</span>
                      {account.isPrimary ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Primary Account
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryBank(account.id)}
                          className="text-[10px] text-blue-600 hover:underline font-medium"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600">
                      A/C Name: <strong>{account.accountName}</strong> • Branch: {account.branch}
                    </p>
                    {account.swiftCode && (
                      <p className="text-[11px] text-slate-500 font-mono">SWIFT: {account.swiftCode}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span className="font-mono font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                      {account.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBankAccount(account.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LankaQR & Mobile Wallets Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LankaQR Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>LankaQR Scheme Configuration</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sri Lankan National EMVCo QR Switch details
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">LankaQR Registered Merchant Name</label>
                  <input
                    type="text"
                    value={paymentSettings.lankaQrMerchantName}
                    onChange={(e) => updatePaymentConfig({ lankaQrMerchantName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Merchant Identification Code (MID)</label>
                  <input
                    type="text"
                    value={paymentSettings.lankaQrMerchantId}
                    onChange={(e) => updatePaymentConfig({ lankaQrMerchantId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Settlement Bank</label>
                  <input
                    type="text"
                    value={paymentSettings.lankaQrBank}
                    onChange={(e) => updatePaymentConfig({ lankaQrBank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Wallets Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>Digital Wallets Merchant Codes</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  eZ Cash, mCash, and Dialog Genie merchant numbers
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dialog eZ Cash Merchant Code / USSD</label>
                  <input
                    type="text"
                    value={paymentSettings.mobileWalletNumbers?.ezCash || ''}
                    onChange={(e) =>
                      updatePaymentConfig({
                        mobileWalletNumbers: {
                          ...paymentSettings.mobileWalletNumbers,
                          ezCash: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Mobitel mCash Merchant Mobile Number</label>
                  <input
                    type="text"
                    value={paymentSettings.mobileWalletNumbers?.mcash || ''}
                    onChange={(e) =>
                      updatePaymentConfig({
                        mobileWalletNumbers: {
                          ...paymentSettings.mobileWalletNumbers,
                          mcash: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dialog Genie Business Number</label>
                  <input
                    type="text"
                    value={paymentSettings.mobileWalletNumbers?.dialogGenie || ''}
                    onChange={(e) =>
                      updatePaymentConfig({
                        mobileWalletNumbers: {
                          ...paymentSettings.mobileWalletNumbers,
                          dialogGenie: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              id="btn-save-payment-settings"
              className="px-6 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save All Payment & Gateway Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SECURITY & ARCHITECTURE */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Firestore Database & Production Architecture
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All collections (<code>users</code>, <code>competitions</code>, <code>results</code>, <code>student_attempts</code>, <code>payments</code>, <code>audit_logs</code>) are synced directly with Google Cloud Firestore via real-time WebSocket listeners with strict schema validations.
            </p>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block">Collections Isolation</span>
                <span className="text-[11px] text-slate-500">
                  Role-based query filtering ensures students cannot access other candidates' submissions or answers.
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block">Payment Integrity</span>
                <span className="text-[11px] text-slate-500">
                  Transaction references and slip images are stored with immutable audit log entries.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Security Parameters
                </h2>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">RBAC Enforcement:</span>
                  <span className="font-semibold text-emerald-700">Active</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Audit Logging:</span>
                  <span className="font-semibold text-blue-700">Full Real-Time Log</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Idle Session Limit:</span>
                  <span className="font-semibold text-amber-700">15 Minutes</span>
                </div>
              </div>
            </div>

            {/* Session Timeout Control Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Inactivity Timeout Protection
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Protects sensitive student examination records by prompting users with a 2-minute countdown warning when no mouse, keyboard, or touch events occur.
              </p>
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-test-session-warning"
                  onClick={() => simulateSessionTimeoutWarning(60)}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Preview Warning Modal (60s)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MONTHLY MEMBERSHIP GOVERNANCE */}
      {activeTab === 'membership' && (
        <div className="space-y-6">
          {memSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Membership configuration saved successfully.</span>
            </div>
          )}

          {/* Membership Overview Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Members</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{memberships.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Registered students</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Active Members</p>
              <p className="text-xl font-bold text-emerald-800 mt-1">
                {memberships.filter((m) => m.status === 'active' || m.status === 'expiring_soon').length}
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Valid access</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending Payments</p>
              <p className="text-xl font-bold text-amber-800 mt-1">
                {membershipPayments.filter((p) => p.status === 'pending').length}
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">Needs review</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Expired Members</p>
              <p className="text-xl font-bold text-rose-800 mt-1">
                {memberships.filter((m) => m.status === 'expired').length}
              </p>
              <p className="text-[10px] text-rose-600 mt-0.5">Requires renewal</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs col-span-2 sm:col-span-1">
              <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Membership Revenue</p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {membershipPayments
                  .filter((p) => p.status === 'approved')
                  .reduce((sum, p) => sum + (p.amount || 0), 0)
                  .toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">LKR</span>
              </p>
              <p className="text-[10px] text-blue-600 mt-0.5">Approved subscriptions</p>
            </div>
          </div>

          {/* Membership Configuration Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Monthly Membership System Configuration</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set standard pricing, duration in days, and global access enforcement for student subscriptions.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={memConfig.enabled}
                  onChange={(e) => setMemConfig({ ...memConfig, enabled: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800">
                  {memConfig.enabled ? 'Membership Enabled' : 'Membership Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Monthly Membership Fee (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">LKR</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={memConfig.monthlyFeeLkr}
                    onChange={(e) => setMemConfig({ ...memConfig, monthlyFeeLkr: Number(e.target.value) })}
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Default recurring monthly fee for all students.</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Membership Duration (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={memConfig.durationDays}
                  onChange={(e) => setMemConfig({ ...memConfig, durationDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400">Default validity duration (default: 30 days).</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Membership Access Rules Note</label>
                <input
                  type="text"
                  value={memConfig.accessRulesNote || ''}
                  onChange={(e) => setMemConfig({ ...memConfig, accessRulesNote: e.target.value })}
                  placeholder="e.g. Active monthly membership is required for premium competitions."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400">Notice displayed when competition requires membership.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                id="btn-save-membership-settings"
                onClick={async () => {
                  await updateMembershipSettings(memConfig);
                  setMemSaveSuccess(true);
                  setTimeout(() => setMemSaveSuccess(false), 3000);
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Membership Settings</span>
              </button>
            </div>
          </div>

          {/* Membership Payment Records & Approvals */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                  <span>Student Membership Payment Records & Verification</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review student payment slips, approve subscriptions, or reject invalid bank transfers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refreshMembershipData()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <span>Refresh Records</span>
              </button>
            </div>

            {membershipPayments.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No membership subscription payments submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Submitted At</th>
                      <th className="py-2.5 px-3">Receipt / Slip</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membershipPayments.map((p) => {
                      const isPending = p.status === 'pending';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-900">{p.studentName || 'Student'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{p.studentId}</p>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                            {p.paymentReference}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {p.amount.toLocaleString()} LKR
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3">
                            {p.slipUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewingSlipUrl(p.slipUrl || null)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold text-[11px] flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Slip</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Online Ref</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {p.status === 'approved' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Approved
                              </span>
                            )}
                            {p.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Pending Review
                              </span>
                            )}
                            {p.status === 'rejected' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={reviewLoading === p.id}
                                  onClick={async () => {
                                    setReviewLoading(p.id);
                                    try {
                                      await reviewMembershipPayment(p.id, 'approved');
                                    } finally {
                                      setReviewLoading(null);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition shadow-2xs disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={reviewLoading === p.id}
                                  onClick={async () => {
                                    setReviewLoading(p.id);
                                    try {
                                      await reviewMembershipPayment(p.id, 'rejected');
                                    } finally {
                                      setReviewLoading(null);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-bold text-[11px] transition disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Reviewed by {p.reviewedBy || 'Admin'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS & WHATSAPP GATEWAY */}
      {activeTab === 'notifications' && <NotificationsConfigPanel />}

      {/* Slip Preview Modal */}
      {viewingSlipUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Student Payment Receipt Slip</h3>
              <button
                type="button"
                onClick={() => setViewingSlipUrl(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              <img src={viewingSlipUrl} alt="Bank Transfer Receipt" className="max-w-full h-auto rounded" />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setViewingSlipUrl(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
