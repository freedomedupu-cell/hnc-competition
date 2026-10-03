import React, { useState } from 'react';
import {
  Shield,
  CreditCard,
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Clock,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BankAccountDetails } from '../../types';

interface StudentMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentMembershipModal: React.FC<StudentMembershipModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentStudent,
    currentAuthUser,
    settings,
    membershipSettings,
    currentMembership,
    submitMembershipPayment,
    language,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'card' | 'lanka_qr'>('bank_transfer');
  const [selectedBankId, setSelectedBankId] = useState<string>('bank-1');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const fee = membershipSettings.monthlyFeeLkr || 1500;
  const duration = membershipSettings.durationDays || 30;

  const defaultBanks: BankAccountDetails[] = [
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
  ];

  const bankAccounts =
    settings.paymentSettings?.bankAccounts && settings.paymentSettings.bankAccounts.length > 0
      ? settings.paymentSettings.bankAccounts
      : defaultBanks;

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const ref = paymentRef.trim();
    if (!ref) {
      setErrorMsg(
        language === 'ta'
          ? 'பரிவர்த்தனை குறிப்பு எண்ணை உள்ளிடவும் (Reference ID).'
          : 'Please provide a valid transaction reference or receipt number.'
      );
      return;
    }

    // Check duplicate active or pending membership (Item 12)
    if (currentMembership?.status === 'pending') {
      setErrorMsg(
        language === 'ta'
          ? 'உங்கள் அங்கத்துவக் கோரிக்கை ஏற்கனவே முதன்மை நிர்வாகியின் சரிபார்ப்பில் உள்ளது.'
          : 'You already have a membership payment under review by the Super Admin.'
      );
      return;
    }

    if (currentMembership?.status === 'active' && currentMembership.expiryDate && new Date(currentMembership.expiryDate).getTime() > Date.now()) {
      const daysLeft = Math.ceil((new Date(currentMembership.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 3) {
        setErrorMsg(
          language === 'ta'
            ? `உங்களிடம் ஏற்கனவே செல்லுபடியாகும் அங்கத்துவம் உள்ளது (முடிவடையும் திகதி: ${new Date(currentMembership.expiryDate).toLocaleDateString()}). முடிவடைவதற்கு 3 நாட்களுக்கு முன் புதுப்பிக்கலாம்.`
            : `You already possess an active membership valid until ${new Date(currentMembership.expiryDate).toLocaleDateString()}. Renewal is available 3 days before expiry.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await submitMembershipPayment({
        amount: fee,
        paymentReference: ref,
        paymentMethod: paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod === 'card' ? 'Online Card' : 'LankaQR',
        slipUrl: slipImage || undefined,
        slipName: slipFileName || undefined,
        membershipPeriodDays: duration,
        notes: `Selected bank: ${selectedBank.bankName}`,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Membership payment submission error:', err);
      setErrorMsg(err?.message || 'Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-t-2xl relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {language === 'ta'
                  ? 'மாதாந்த அங்கத்துவம் (Monthly Membership)'
                  : 'Activate Monthly Membership'}
              </h2>
              <p className="text-xs text-blue-200">
                {duration} Days Full Access to Premium Contests & Olympiads
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSubmitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'ta' ? 'கட்டண விபரம் சமர்ப்பிக்கப்பட்டது!' : 'Subscription Payment Submitted!'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                {language === 'ta'
                  ? 'உங்கள் கட்டண ரசீது சரிபார்ப்புக்காக Super Admin-க்கு அனுப்பப்பட்டுள்ளது. சரிபார்க்கப்பட்டதும் அங்கத்துவம் தானாகவே இயங்கும்.'
                  : 'Your payment reference has been submitted. Status is now Pending Review. Once accredited by the Academic Admin, your membership will become active.'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 text-left max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold text-slate-900">{currentAuthUser?.fullName || currentStudent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-indigo-700">{fee.toLocaleString()} LKR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-900">{duration} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-amber-700">Pending Review</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Plan Summary Card */}
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                  Official Academic Pass
                </span>
                <h4 className="font-bold text-slate-900 text-sm">HNC Monthly Student Membership</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">30-day unlimited eligibility for all protected competitions</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-indigo-900">{fee.toLocaleString()} <span className="text-xs font-semibold">LKR</span></p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  / Month
                </span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>Bank Deposit / Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Online Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('lanka_qr')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex flex-col items-center gap-1 ${
                    paymentMethod === 'lanka_qr'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-amber-700" />
                  <span>LankaQR</span>
                </button>
              </div>
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank_transfer' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Select Bank Account:</label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bank:</span>
                    <span className="font-bold text-slate-800">{selectedBank.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Account No:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-blue-900">
                      <span>{selectedBank.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedBank.accountNumber, selectedBank.id)}
                        className="text-slate-400 hover:text-blue-700 p-0.5"
                      >
                        {copiedAccount === selectedBank.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="font-semibold text-slate-800">{selectedBank.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branch:</span>
                    <span className="text-slate-700">{selectedBank.branch}</span>
                  </div>
                </div>
              </div>
            )}

            {/* LankaQR Details */}
            {paymentMethod === 'lanka_qr' && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-center space-y-2">
                <p className="font-bold text-amber-900">Scan & Pay with LankaQR</p>
                <div className="w-32 h-32 bg-white rounded-lg border border-amber-300 mx-auto flex items-center justify-center p-2">
                  <QrCode className="w-24 h-24 text-slate-800" />
                </div>
                <p className="text-[11px] text-slate-600 font-mono">
                  Merchant: {settings.paymentSettings?.lankaQrMerchantName || 'HNC Competition'}
                </p>
              </div>
            )}

            {/* Card Mock/Direct Reference */}
            {paymentMethod === 'card' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Visa / Mastercard / IPG</p>
                <p className="text-[11px]">Pay online via bank portal and paste your transaction approval code below.</p>
              </div>
            )}

            {/* Payment Reference & Slip Upload */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Transaction Reference / Slip No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN-948201 or Bank Slip Reference"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Attach Deposit Slip / Screenshot (Optional)</label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 text-xs font-semibold">
                    {slipFileName ? slipFileName : 'Click to upload bank transfer slip (JPG/PNG)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlipUpload}
                    className="hidden"
                  />
                </label>
                {slipImage && (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Receipt image attached</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Submit Membership Payment</span>
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
