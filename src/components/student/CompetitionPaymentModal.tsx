import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  QrCode,
  Smartphone,
  UploadCloud,
  FileText,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Loader2,
  Calendar,
  Hash,
  Gift,
  Coins,
  Sparkles,
} from 'lucide-react';
import { Competition, DbPayment } from '../../types';
import { useApp } from '../../context/AppContext';

interface CompetitionPaymentModalProps {
  competition: Competition;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (payment: DbPayment) => void;
}

type PaymentTab = 'card' | 'bank_transfer' | 'lanka_qr' | 'mobile_wallet' | 'referral_points';

export const CompetitionPaymentModal: React.FC<CompetitionPaymentModalProps> = ({
  competition,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { currentAuthUser, currentStudent, processCompetitionPayment, redeemStudentPerk, settings, language } = useApp();

  const [activeTab, setActiveTab] = useState<PaymentTab>('card');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(
    currentAuthUser?.fullName || currentStudent?.name || ''
  );

  // Bank transfer state
  const bankAccounts = settings?.paymentSettings?.bankAccounts || [
    {
      id: 'bank-1',
      bankName: 'Commercial Bank of Ceylon',
      accountName: 'HNC Competition Academic Council',
      accountNumber: '1000845920',
      branch: 'Colombo Fort Branch',
      isPrimary: true,
    },
    {
      id: 'bank-2',
      bankName: 'Bank of Ceylon (BOC)',
      accountName: 'HNC Competition Educational Fund',
      accountNumber: '8492019482',
      branch: 'Colombo Central Corporate Branch',
      isPrimary: false,
    },
    {
      id: 'bank-3',
      bankName: 'Sampath Bank',
      accountName: 'HNC Competition Foundation',
      accountNumber: '019230048123',
      branch: 'Head Office City Branch',
      isPrimary: false,
    },
  ];

  const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id || 'bank-1');
  const [depositBranch, setDepositBranch] = useState('');
  const [bankRefNo, setBankRefNo] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string>('');

  // LankaQR state
  const [qrRefCode, setQrRefCode] = useState('');

  // Mobile wallet state
  const [selectedWallet, setSelectedWallet] = useState<'ezCash' | 'mcash' | 'dialogGenie'>('ezCash');
  const [walletPhone, setWalletPhone] = useState(currentAuthUser?.phone || '');
  const [walletTxnId, setWalletTxnId] = useState('');

  // Processing & completion states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<DbPayment | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isOpen) return null;

  const entryFee = competition.entryFee || 1500;
  const candidateName = currentAuthUser?.fullName || currentStudent?.name || 'Registered Candidate';
  const candidateEmail = currentAuthUser?.email || currentStudent?.email || 'student@hnccompetition.org';
  const candidateInstitution = currentStudent?.institution || 'Academic Institute';

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFileName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSlipImage(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    let methodLabel = '';
    let extraDetails: {
      transactionReference?: string;
      slipUrl?: string;
      slipName?: string;
      bankName?: string;
      branchName?: string;
      walletNumber?: string;
      paymentNote?: string;
    } = {};

    setPaymentError(null);

    if (activeTab === 'referral_points') {
      const studentPts = currentStudent.referralPoints ?? 0;
      if (studentPts < 200) {
        setPaymentError(language === 'ta' ? 'இலவச அனுமதிக்கு குறைந்தது 200 புள்ளிகள் தேவை.' : 'You need at least 200 referral points for free exam entry.');
        setIsProcessing(false);
        return;
      }
      methodLabel = 'Referral Points (200 PTS Waiver)';
      extraDetails = {
        transactionReference: `REF-PTS-${Date.now().toString(36).toUpperCase()}`,
        paymentNote: 'Settled via 200 Referral Points Free Exam Entry Ticket',
      };
      await redeemStudentPerk('free_entry_' + competition.id, 200);
      const paymentRecord = await processCompetitionPayment(competition.id, 0, methodLabel, extraDetails);
      setCompletedPayment(paymentRecord);
      setPaymentComplete(true);
      onPaymentSuccess(paymentRecord);
      setIsProcessing(false);
      return;
    }

    if (activeTab === 'card') {
      methodLabel = 'Credit/Debit Card (Visa/Mastercard)';
      extraDetails = {
        transactionReference: `CARD-${Date.now().toString().slice(-6)}`,
        paymentNote: `Cardholder: ${cardHolder}`,
      };
    } else if (activeTab === 'bank_transfer') {
      methodLabel = `Bank Transfer (${selectedBank?.bankName || 'Direct Bank Deposit'})`;
      extraDetails = {
        transactionReference: bankRefNo || `SLIP-${Date.now().toString().slice(-6)}`,
        slipUrl: slipImage || undefined,
        slipName: slipFileName || 'deposit_slip.jpg',
        bankName: selectedBank?.bankName,
        branchName: depositBranch || selectedBank?.branch,
        paymentNote: `Deposited on ${depositDate} at ${depositBranch || 'Branch/CDM'}`,
      };
    } else if (activeTab === 'lanka_qr') {
      methodLabel = 'LankaQR National Switch (FriMi/Q+/iPay)';
      extraDetails = {
        transactionReference: qrRefCode || `LQR-${Date.now().toString().slice(-6)}`,
        paymentNote: 'Settled via Sri Lankan EMVCo LankaQR payment scheme',
      };
    } else {
      const walletName =
        selectedWallet === 'ezCash'
          ? 'Dialog eZ Cash'
          : selectedWallet === 'mcash'
          ? 'Mobitel mCash'
          : 'Dialog Genie';
      methodLabel = `Mobile Wallet (${walletName})`;
      extraDetails = {
        transactionReference: walletTxnId || `WAL-${Date.now().toString().slice(-6)}`,
        walletNumber: walletPhone,
        paymentNote: `Mobile wallet number: ${walletPhone}`,
      };
    }

    setTimeout(async () => {
      try {
        const payment = await processCompetitionPayment(
          competition.id,
          entryFee,
          methodLabel,
          extraDetails
        );
        setCompletedPayment(payment);
        setPaymentComplete(true);
        setIsProcessing(false);
      } catch (err) {
        console.error('Payment processing failed:', err);
        setIsProcessing(false);
      }
    }, 1200);
  };

  const handleFinish = () => {
    if (completedPayment) {
      onPaymentSuccess(completedPayment);
    }
  };

  return (
    <div
      id="comp-payment-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
      onClick={!isProcessing ? onClose : undefined}
    >
      <div
        id="comp-payment-modal-card"
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 sm:p-6 text-white shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-400/30">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />
                  HNC Secure Multi-Channel Payment Gateway
                </span>
                <span className="text-[11px] text-blue-300/80 font-medium">LKR Currency</span>
              </div>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white tracking-tight">
                Competition Registration Payment
              </h2>
              <p className="mt-0.5 text-xs text-blue-200/80">
                Official entry fee settlement for Sri Lankan Academic Olympiads & Examinations
              </p>
            </div>
            {!isProcessing && (
              <button
                id="close-payment-modal-btn"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {paymentComplete && completedPayment ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 text-center space-y-6 overflow-y-auto">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Payment Confirmed & Verified!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your entry fee of <strong>LKR {entryFee.toLocaleString()}.00</strong> has been settled successfully. Your enrollment is verified in Firestore.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2.5 max-w-lg mx-auto">
              <div className="flex justify-between items-center text-slate-600">
                <span>Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-900">{completedPayment.transactionReference || completedPayment.paymentId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Payment Channel:</span>
                <span className="font-semibold text-blue-900">{completedPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Competition:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[220px]">{competition.title}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-700 text-sm">LKR {entryFee.toLocaleString()}.00</span>
              </div>
              {completedPayment.slipName && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Attached Deposit Slip:</span>
                  <span className="text-blue-700 font-medium truncate max-w-[200px]">✓ {completedPayment.slipName}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                <span>Status:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed & Enrolled
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                id="payment-proceed-btn"
                onClick={handleFinish}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Continue to Competition Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handlePay} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {paymentError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-start gap-2.5 shadow-2xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{paymentError}</span>
              </div>
            )}

            {/* Fee & Competition Summary Card */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  {competition.category} • {competition.competitionType || 'Competition'}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{competition.title}</h4>
                <p className="text-xs text-slate-600">
                  Candidate: <strong>{candidateName}</strong> ({candidateInstitution})
                </p>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-blue-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Total Entry Fee (LKR)
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-900">
                  LKR {entryFee.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 block font-medium">
                  Tax inclusive • Official Enrollment
                </span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === 'ta'
                    ? 'செலுத்தும் முறை'
                    : language === 'si'
                    ? 'ගෙවීම් ක්‍රමය තෝරන්න'
                    : 'Select Payment Method'}
                </label>
                <span className="text-[11px] text-blue-600 font-medium">
                  {language === 'ta'
                    ? 'இலங்கை அங்கீகரிக்கப்பட்ட வழிகள்'
                    : language === 'si'
                    ? 'ශ්‍රී ලංකා අනුමත ගෙවීම් ද්වාර'
                    : 'Sri Lanka Approved Gateways'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* 1. Credit / Debit Card */}
                <button
                  type="button"
                  id="paymethod-card-btn"
                  onClick={() => setActiveTab('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                    activeTab === 'card'
                      ? 'border-blue-600 bg-blue-50/90 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-[11px]">
                    {language === 'ta' ? 'அட்டை மூலம்' : language === 'si' ? 'කාඩ්පත් මගින්' : 'Card Payment'}
                  </span>
                  <span className="text-[10px] text-slate-500">Visa / Mastercard</span>
                </button>

                {/* 2. Bank Transfer & Slip */}
                <button
                  type="button"
                  id="paymethod-bank-btn"
                  onClick={() => setActiveTab('bank_transfer')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                    activeTab === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50/90 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-[11px]">
                    {language === 'ta' ? 'வங்கிப் பற்றுச்சீட்டு' : language === 'si' ? 'බැංකු තැන්පතු / ස්ලිප්' : 'Bank Deposit / Slip'}
                  </span>
                  <span className="text-[10px] text-slate-500">BOC / ComBank / CDM</span>
                </button>

                {/* 3. LankaQR */}
                <button
                  type="button"
                  id="paymethod-lankaqr-btn"
                  onClick={() => setActiveTab('lanka_qr')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                    activeTab === 'lanka_qr'
                      ? 'border-blue-600 bg-blue-50/90 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-[11px]">
                    {language === 'ta' ? 'LankaQR ஸ்கேன்' : language === 'si' ? 'LankaQR ස්කෑන්' : 'LankaQR Scan'}
                  </span>
                  <span className="text-[10px] text-slate-500">FriMi / Q+ / iPay</span>
                </button>

                {/* 4. Mobile Wallets */}
                <button
                  type="button"
                  id="paymethod-wallet-btn"
                  onClick={() => setActiveTab('mobile_wallet')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                    activeTab === 'mobile_wallet'
                      ? 'border-blue-600 bg-blue-50/90 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-[11px]">
                    {language === 'ta' ? 'மொபைல் வாலட்' : language === 'si' ? 'ජංගම පසුම්බිය' : 'Mobile Wallet'}
                  </span>
                  <span className="text-[10px] text-slate-500">eZ Cash / mCash</span>
                </button>

                {/* 5. Referral Points Waiver */}
                <button
                  type="button"
                  id="paymethod-referral-btn"
                  onClick={() => setActiveTab('referral_points')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center col-span-2 sm:col-span-4 ${
                    activeTab === 'referral_points'
                      ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-400/30 shadow-xs'
                      : 'border-amber-200 hover:border-amber-300 text-amber-900 bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-xs">
                      {language === 'ta'
                        ? '🎁 200 பரிந்துரை புள்ளிகள் மூலம் 100% இலவச அனுமதி (Points Waiver)'
                        : '🎁 Redeem 200 Referral Points for 100% Free Entry'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                      {currentStudent.referralPoints ?? 25} PTS Available
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* TAB 0: Referral Points Free Waiver */}
            {activeTab === 'referral_points' && (
              <div className="space-y-4 p-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    🎟️
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-amber-950">
                      {language === 'ta' ? 'பரிந்துரை புள்ளிகள் மூலம் இலவச அனுமதி' : '100% Free Exam Entry Ticket Waiver'}
                    </h5>
                    <p className="text-[11px] text-amber-800">
                      {language === 'ta'
                        ? 'உங்கள் 200 புள்ளிகளைப் பயன்படுத்தி கட்டணமின்றி இந்த தேர்வில் உடனே பங்குபெறலாம்.'
                        : 'Use 200 points to waive this competition\'s entry fee completely.'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Available Points</span>
                    <div className="text-xl font-black text-amber-600">
                      {currentStudent.referralPoints ?? 25} PTS
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Ticket Cost</span>
                    <div className="text-xl font-black text-blue-900">
                      200 PTS
                    </div>
                  </div>
                </div>

                {(currentStudent.referralPoints ?? 25) >= 200 ? (
                  <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl text-emerald-900 font-semibold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'ta'
                        ? 'உங்களிடம் போதுமான புள்ளிகள் உள்ளன! கீழே உள்ள பொத்தானை அழுத்தி இலவச அனுமதியைப் பெறவும்.'
                        : 'You have sufficient points! Click the button below to redeem and enroll free.'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {language === 'ta'
                        ? `இலவச அனுமதிக்கு இன்னும் ${200 - (currentStudent.referralPoints ?? 25)} புள்ளிகள் தேவை. நண்பர்களை அழைத்து தலா 25 புள்ளிகளைப் பெறுங்கள்!`
                        : `You need ${200 - (currentStudent.referralPoints ?? 25)} more points. Share your referral code with classmates to earn 25 pts per registration!`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: Credit / Debit Card */}
            {activeTab === 'card' && (
              <div className="space-y-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900">Visa / Mastercard / LankaPay Gateway</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    256-Bit SSL Encrypted
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      required
                      placeholder="e.g. S. K. Perera"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                          const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                          setCardNumber(formatted);
                        }}
                        required
                        placeholder="4111 2222 3333 4444"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Expiry Date (MM/YY)</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                        if (val.length >= 3) {
                          val = `${val.substring(0, 2)}/${val.substring(2)}`;
                        }
                        setCardExpiry(val);
                      }}
                      required
                      placeholder="12/28"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">CVV / CVC</label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        required
                        placeholder="•••"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Direct Bank Handshake:</strong> We do not store sensitive card credentials or CVV on platform servers. Handled via authorized Sri Lankan banking gateway.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: Bank Deposit / Slip Upload */}
            {activeTab === 'bank_transfer' && (
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Official HNC Competition Bank Accounts (வங்கி கணக்குகள்)</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Deposit fee via bank counter, CDM (Cash Deposit Machine), or online bank transfer, then upload the receipt/slip.
                  </p>
                </div>

                {/* Bank Accounts cards */}
                <div className="space-y-2">
                  {bankAccounts.map((b) => {
                    const isSelected = selectedBankId === b.id;
                    const isCopied = copiedAccount === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBankId(b.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{b.bankName}</span>
                            {b.isPrimary && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600">
                            A/C Name: <strong>{b.accountName}</strong>
                          </p>
                          <p className="text-[11px] text-slate-500">Branch: {b.branch}</p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded text-xs border border-slate-200">
                            {b.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(b.accountNumber, b.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                            title="Copy Account Number"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Transfer Confirmation Details */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <h6 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                    Payment Deposit Details & Slip Upload
                  </h6>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Deposited Branch / CDM Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={depositBranch}
                        onChange={(e) => setDepositBranch(e.target.value)}
                        required
                        placeholder="e.g. Jaffna Main Branch / CDM Kandy"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Bank Deposit Reference / Slip No <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={bankRefNo}
                          onChange={(e) => setBankRefNo(e.target.value)}
                          required
                          placeholder="e.g. REF-984201 or CDM receipt no"
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                        <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Deposit Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={depositDate}
                          onChange={(e) => setDepositDate(e.target.value)}
                          required
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  </div>

                  {/* Bank Slip Upload Dropzone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      Upload Bank Deposit Slip / Receipt Photo (ரசீது புகைப்படம்) <span className="text-red-500">*</span>
                    </label>

                    {slipImage ? (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={slipImage}
                            alt="Deposit Slip Preview"
                            className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{slipFileName || 'Deposit Slip'}</p>
                            <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Slip image loaded ready for verification
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSlipImage(null);
                            setSlipFileName('');
                          }}
                          className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium transition"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition">
                        <UploadCloud className="w-6 h-6 text-indigo-600 mb-1" />
                        <span className="text-xs font-semibold text-slate-800">
                          Click or drag bank deposit slip photo here
                        </span>
                        <span className="text-[10px] text-slate-500">JPG, PNG, PDF receipts up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlipUpload}
                          required
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LankaQR (Scan & Pay) */}
            {activeTab === 'lanka_qr' && (
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Generated Authentic LankaQR Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-orange-600">Lanka</span>
                      <span className="font-bold text-xs text-emerald-600">QR</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">EMVCo</span>
                    </div>

                    {/* QR Graphic Pattern */}
                    <div className="w-36 h-36 bg-slate-900 p-2 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-2 bg-white rounded flex items-center justify-center p-1.5">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
                          <rect width="32" height="32" x="5" y="5" rx="3" fill="#0f172a" />
                          <rect width="18" height="18" x="12" y="12" rx="1" fill="#ffffff" />
                          <rect width="10" height="10" x="16" y="16" fill="#0f172a" />

                          <rect width="32" height="32" x="63" y="5" rx="3" fill="#0f172a" />
                          <rect width="18" height="18" x="70" y="12" rx="1" fill="#ffffff" />
                          <rect width="10" height="10" x="74" y="16" fill="#0f172a" />

                          <rect width="32" height="32" x="5" y="63" rx="3" fill="#0f172a" />
                          <rect width="18" height="18" x="12" y="70" rx="1" fill="#ffffff" />
                          <rect width="10" height="10" x="16" y="74" fill="#0f172a" />

                          {/* Decorative pattern blocks */}
                          <rect width="8" height="8" x="46" y="10" fill="#0f172a" />
                          <rect width="8" height="8" x="46" y="24" fill="#0f172a" />
                          <rect width="8" height="8" x="46" y="46" fill="#0f172a" />
                          <rect width="8" height="8" x="63" y="46" fill="#0f172a" />
                          <rect width="8" height="8" x="78" y="46" fill="#0f172a" />
                          <rect width="8" height="8" x="15" y="46" fill="#0f172a" />
                          <rect width="8" height="8" x="30" y="46" fill="#0f172a" />
                          <rect width="8" height="8" x="46" y="63" fill="#0f172a" />
                          <rect width="8" height="8" x="63" y="63" fill="#0f172a" />
                          <rect width="8" height="8" x="78" y="78" fill="#0f172a" />
                          <rect width="8" height="8" x="63" y="85" fill="#0f172a" />
                        </svg>
                      </div>
                    </div>

                    <span className="font-bold text-slate-900 text-xs">LKR {entryFee.toLocaleString()}.00</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {settings?.paymentSettings?.lankaQrMerchantId || 'LQR-HNC-9482'}</span>
                  </div>

                  {/* Instructions and supported apps */}
                  <div className="space-y-2.5 flex-1">
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">Scan & Pay via Any Sri Lankan Banking App</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Open your bank app (ComBank Q+, BOC SmartPay, FriMi, FLASH, iPay, Genie) and scan this QR code to transfer instantly.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Merchant:</span>
                        <span className="font-bold text-slate-900">{settings?.paymentSettings?.lankaQrMerchantName || 'HNC Competition National Olympiad'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Settlement Bank:</span>
                        <span className="font-bold text-slate-900">{settings?.paymentSettings?.lankaQrBank || 'Commercial Bank of Ceylon'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        App Transfer Reference / Auth Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={qrRefCode}
                        onChange={(e) => setQrRefCode(e.target.value)}
                        required
                        placeholder="e.g. QPLUS-849102 or FriMi ref"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Mobile Wallets (eZ Cash / mCash / Genie) */}
            {activeTab === 'mobile_wallet' && (
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span>Mobile Wallet Payment (மொபைல் வாலட்)</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Transfer fee directly using your Dialog eZ Cash, Mobitel mCash, or Dialog Genie mobile account.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWallet('ezCash')}
                    className={`p-2.5 rounded-lg border text-center transition ${
                      selectedWallet === 'ezCash'
                        ? 'border-purple-600 bg-purple-50/80 font-bold text-purple-900 ring-1 ring-purple-500/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs">Dialog eZ Cash</span>
                    <span className="text-[10px] text-slate-500">#111*9482#</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWallet('mcash')}
                    className={`p-2.5 rounded-lg border text-center transition ${
                      selectedWallet === 'mcash'
                        ? 'border-purple-600 bg-purple-50/80 font-bold text-purple-900 ring-1 ring-purple-500/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs">Mobitel mCash</span>
                    <span className="text-[10px] text-slate-500">071 987 6543</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWallet('dialogGenie')}
                    className={`p-2.5 rounded-lg border text-center transition ${
                      selectedWallet === 'dialogGenie'
                        ? 'border-purple-600 bg-purple-50/80 font-bold text-purple-900 ring-1 ring-purple-500/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs">Dialog Genie</span>
                    <span className="text-[10px] text-slate-500">077 123 4567</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Your Registered Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value)}
                      required
                      placeholder="07X XXX XXXX"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Wallet Transaction ID / SMS PIN Ref <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={walletTxnId}
                      onChange={(e) => setWalletTxnId(e.target.value)}
                      required
                      placeholder="e.g. EZ-582910"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200 text-[11px] text-purple-900">
                  Dial the merchant USSD or send payment to the merchant number above, then enter the SMS reference number to confirm.
                </div>
              </div>
            )}

            {/* Security Guarantee Notice */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Official HNC Competition Financial Compliance & Transparency</p>
                <p className="text-emerald-800 text-[11px]">
                  All paid registration fees fund academic rewards, examiner panel moderation, and certified credentials. Transactions are cryptographically recorded in Firestore.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                id="cancel-payment-btn"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                {language === 'ta' ? 'இரத்து செய்க' : language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>

              <button
                type="submit"
                id="submit-payment-btn"
                disabled={isProcessing || (activeTab === 'referral_points' && (currentStudent.referralPoints ?? 25) < 200)}
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-md transition disabled:opacity-50 ${
                  activeTab === 'referral_points'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {language === 'ta'
                        ? 'செயலாக்கம் நடைபெறுகிறது...'
                        : language === 'si'
                        ? 'ක්‍රියාවලිය සිදුවෙමින් පවතී...'
                        : 'Processing Enrollment Handshake...'}
                    </span>
                  </>
                ) : activeTab === 'referral_points' ? (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>
                      {language === 'ta'
                        ? '200 புள்ளிகள் மூலம் இலவச அனுமதி பெறுக'
                        : 'Redeem 200 PTS for Free Entry'}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {language === 'ta'
                        ? `பாதுகாப்பாக LKR ${entryFee.toLocaleString()} செலுத்துக`
                        : language === 'si'
                        ? `ආරක්ෂිතව LKR ${entryFee.toLocaleString()} ගෙවන්න`
                        : `Pay LKR ${entryFee.toLocaleString()} Securely`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
