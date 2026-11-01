import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Play,
  Award,
  Zap,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings,
  Clock,
  Coins,
} from 'lucide-react';

interface SpinWheelGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SECTORS = [
  { label: '5 PTS', points: 5, color: '#3B82F6', textColor: '#ffffff', title: 'Bronze Scholar' },
  { label: '10 PTS', points: 10, color: '#10B981', textColor: '#ffffff', title: 'Silver Mind' },
  { label: '15 PTS', points: 15, color: '#F59E0B', textColor: '#ffffff', title: 'Gold Champion' },
  { label: '20 PTS', points: 20, color: '#8B5CF6', textColor: '#ffffff', title: 'Diamond Brain' },
  { label: '25 PTS', points: 25, color: '#EC4899', textColor: '#ffffff', title: 'Ruby Master' },
  { label: '50 PTS', points: 50, color: '#EF4444', textColor: '#ffffff', title: 'Grand Jackpot' },
];

export const SpinWheelGovernanceModal: React.FC<SpinWheelGovernanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, students, language } = useApp();

  const isSpinEnabled = settings.enableDailySpinWheel !== false;
  const [isEnabledState, setIsEnabledState] = useState(isSpinEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetToast, setResetToast] = useState<string | null>(null);

  // Wheel test simulation state
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggle = async () => {
    const nextState = !isEnabledState;
    setIsEnabledState(nextState);
    await updateSettings({ enableDailySpinWheel: nextState });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetLockouts = () => {
    // Clear today's lockouts from local storage
    const today = new Date().toISOString().split('T')[0];
    try {
      localStorage.removeItem('hnc_spin_date_last');
      localStorage.removeItem('hnc_spin_last_timestamp');
      students.forEach((s) => {
        localStorage.removeItem(`hnc_spin_date_${s.id}`);
        localStorage.removeItem(`hnc_spin_date_${s.studentId}`);
      });
      window.dispatchEvent(new Event('hnc_spin_reset'));
    } catch {}

    setResetToast(
      language === 'ta'
        ? 'இன்றைய சுழல் பூட்டு அனைத்து மாணவர்களுக்கும் மீட்டமைக்கப்பட்டது! (Today’s spin lockout reset for all students)'
        : 'All student spin lockouts for today have been successfully reset!'
    );
    setTimeout(() => setResetToast(null), 4000);
  };

  const handleSimulateSpin = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setTestResult(null);

    const randomIndex = Math.floor(Math.random() * DEFAULT_SECTORS.length);
    const selectedSector = DEFAULT_SECTORS[randomIndex];
    const segmentAngle = 360 / DEFAULT_SECTORS.length;
    // Extra rotations for excitement
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = fullSpins * 360 + (360 - (randomIndex * segmentAngle + segmentAngle / 2));

    setWheelRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSimulating(false);
      setTestResult(`${selectedSector.label} - ${selectedSector.title}`);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/90 text-slate-950 flex items-center justify-center text-xl shadow-xs">
              🎡
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>
                  {language === 'ta'
                    ? 'அதிர்ஷ்ட சுழல் சக்கரம் மேலாண்மை'
                    : 'Lucky Spin Wheel Super Admin Governance'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </h2>
              <p className="text-xs text-amber-950/80 font-medium">
                {language === 'ta'
                  ? 'மாணவர் தினசரி சுழல் சக்கரம் On/Off கட்டுப்பாடு மற்றும் அமைப்புகள்'
                  : 'Master ON/OFF switch, sector reward multipliers & daily limits'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-950 hover:bg-black/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">
                {language === 'ta'
                  ? 'சுழல் சக்கர அமைப்புகள் சேமிக்கப்பட்டன! (Settings updated successfully)'
                  : 'Spin wheel configuration saved and synchronized with Firestore!'}
              </span>
            </div>
          )}

          {resetToast && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold">{resetToast}</span>
            </div>
          )}

          {/* 1. Master On/Off Switch Card */}
          <div className="p-5 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-yellow-50/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  {language === 'ta'
                    ? 'சுழல் சக்கரத்தின் நிலை (Master Status):'
                    : 'Spin Wheel Master State:'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                    isEnabledState
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {isEnabledState
                    ? (language === 'ta' ? 'இயங்குகிறது (ACTIVE - ON)' : 'ACTIVE (ON)')
                    : (language === 'ta' ? 'முடக்கப்பட்டுள்ளது (DISABLED - OFF)' : 'DISABLED (OFF)')}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed max-w-md">
                {language === 'ta'
                  ? 'இதனை OFF செய்தால், மாணவர்களின் Study Games Hub மற்றும் முகப்புப் பக்கத்தில் உள்ள அதிர்ஷ்ட சக்கரம் உடனடியாக முடக்கப்படும்.'
                  : 'When turned OFF, the Lucky Spin Wheel is instantly disabled across student portals and dashboards.'}
              </p>
            </div>

            {/* Toggle switch button */}
            <button
              type="button"
              id="modal-toggle-spin-wheel"
              onClick={handleToggle}
              className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                isEnabledState ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              aria-label="Toggle Spin Wheel Master Switch"
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  isEnabledState ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Sector Reward Breakdown */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-xs">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>
                {language === 'ta'
                  ? 'சக்கரப் பரிசுகள் & புள்ளிகள் கட்டமைப்பு (Wheel Sectors)'
                  : 'Wheel Sectors & Point Allocations'}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DEFAULT_SECTORS.map((sector, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{sector.title}</span>
                    <span className="text-[10px] text-slate-500">Sector #{idx + 1}</span>
                  </div>
                  <span
                    className="px-2 py-1 rounded-lg text-white font-mono font-black text-xs shadow-xs"
                    style={{ backgroundColor: sector.color }}
                  >
                    {sector.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Live Simulator & Test Spin */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {language === 'ta' ? 'சக்கர சோதனை முன்னோட்டம் (Simulator)' : 'Wheel Simulator Test'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'ta'
                    ? 'மாணவர்கள் சுழற்றும் அதே வேகத்தில் சக்கரத்தை சுழற்றி சோதிக்கவும்.'
                    : 'Test the wheel physics and probability without consuming points.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateSpin}
                disabled={isSimulating}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Spinning...' : 'Test Spin 🎡'}</span>
              </button>
            </div>

            {testResult && (
              <div className="p-2.5 bg-amber-100/80 border border-amber-300 text-amber-950 font-bold rounded-xl text-center">
                🎯 Simulation Result: {testResult}
              </div>
            )}
          </div>

          {/* 4. Special Event Action: Reset Daily Lockouts */}
          <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-indigo-700" />
                <span>
                  {language === 'ta'
                    ? 'இன்றைய சுழல் பூட்டுகளை மீட்டமை (Reset Lockouts)'
                    : 'Reset Today’s Daily Lockouts'}
                </span>
              </span>
              <p className="text-[11px] text-slate-600 leading-snug">
                {language === 'ta'
                  ? 'போட்டித் திருவிழாக்கள் போன்ற சிறப்பு நாட்களில் மாணவர்களுக்கு மீண்டும் ஒரு இலவச சுழல் வழங்க பூட்டை நீக்கலாம்.'
                  : 'Grant a bonus free spin today for all students on special competition days.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetLockouts}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl transition cursor-pointer shadow-xs text-center shrink-0"
            >
              {language === 'ta' ? 'அனைவருக்கும் மீட்டமை' : 'Reset for All'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {language === 'ta'
              ? 'மாற்றங்கள் உடனடியாக அனைத்து மாணவர் கணக்குகளிலும் செயல்படும்.'
              : 'Changes take effect immediately across all active student sessions.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {language === 'ta' ? 'முடிந்தது (Done)' : 'Close & Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
