import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { APP_LOGO } from '../../assets/logo';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Phone,
  School,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  PenLine,
  ListFilter,
  Eye,
  EyeOff,
  Hash,
  MapPin,
  Compass,
  AtSign,
  RefreshCw,
  Gift,
  Clock,
  Share2,
  Trophy,
  Key,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  loginWithEmailPassword,
  registerStudentAccount,
  resetUserPasswordByLookup,
} from '../../services/firebaseService';
import { AVAILABLE_GRADES } from '../../lib/gradeUtils';
import { ShareModal } from '../common/ShareModal';

const SRI_LANKA_DISTRICTS = [
  'Jaffna',
  'Kilinochchi',
  'Mullaitivu',
  'Vavuniya',
  'Mannar',
  'Batticaloa',
  'Trincomalee',
  'Ampara',
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

const generateSuggestedStudentId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `STU-${year}-${rand}`;
};

export const AuthView: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    setCurrentAuthUser,
    setCurrentPortal,
    setStudentNav,
    setAdminNav,
    setSuperAdminNav,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register_student'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionTimeoutNotice, setSessionTimeoutNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem('hnc_session_timeout_msg');
      if (msg) {
        setSessionTimeoutNotice(msg);
        sessionStorage.removeItem('hnc_session_timeout_msg');
      }
    } catch {}
  }, []);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Student ID / Username / Email
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Student registration form state - all fields requested by user:
  // Full name, Grade, Date of birth, Student ID, School, District, Address, Phone number, Email, Username, Password, Confirm password, Referral code
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    grade: 'Grade 11 (O/L)',
    dateOfBirth: '',
    studentId: generateSuggestedStudentId(),
    school: '',
    district: 'Jaffna',
    address: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const [autoRefApplied, setAutoRefApplied] = useState<string | null>(null);
  const [invitedCompId, setInvitedCompId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Check URL query parameters for referral link (?ref=HNC-XXX), register flag (?register=true), or competition (?comp=XXX)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        const reg = params.get('register') || params.get('signup') || params.get('mode');
        const comp = params.get('comp');

        if (ref) {
          const cleanRef = ref.trim().toUpperCase();
          setStudentForm((prev) => ({ ...prev, referralCode: cleanRef }));
          setAutoRefApplied(cleanRef);
          setMode('register_student');
        }

        if (reg === 'true' || reg === '1' || reg === 'register') {
          setMode('register_student');
        }

        if (comp) {
          const cleanComp = comp.trim();
          setInvitedCompId(cleanComp);
          try {
            sessionStorage.setItem('hnc_target_competition', cleanComp);
          } catch {}
          // Automatically set register mode so student registers or logs in to join
          setMode('register_student');
        }
      }
    } catch {}
  }, []);

  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot Password Recovery modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotCustomNewPassword, setForgotCustomNewPassword] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotResult, setForgotResult] = useState<{
    uid: string;
    fullName: string;
    studentId?: string;
    username?: string;
    email: string;
    assignedPassword: string;
  } | null>(null);
  const [forgotCopied, setForgotCopied] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const target = forgotIdentifier.trim();
    if (!target) {
      setForgotError(
        language === 'ta'
          ? 'உங்கள் மாணவர் ID, பயனர் பெயர் அல்லது மின்னஞ்சலை உள்ளிடவும்.'
          : 'Please enter your Student ID, Username, or Email.'
      );
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await resetUserPasswordByLookup(target, forgotCustomNewPassword);
      setForgotResult(res);
      setForgotSuccess(
        language === 'ta'
          ? `கணக்கு வெற்றிகரமாக உறுதிசெய்யப்பட்டது! புதிய கடவுச்சொல்: ${res.assignedPassword}`
          : `Account verified successfully! New Password: ${res.assignedPassword}`
      );
      setLoginIdentifier(res.studentId || res.username || res.email);
      setLoginPassword(res.assignedPassword);
    } catch (err: any) {
      console.error('Forgot Password recovery error:', err);
      setForgotError(err.message || 'Failed to locate user account. Please check Student ID / Username.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const identifier = loginIdentifier.trim();
    if (!identifier || !loginPassword) {
      setError(
        language === 'ta'
          ? 'மாணவர் எண் / பயனர் பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.'
          : language === 'si'
          ? 'කරුණාකර ශිෂ්‍ය අංකය / පරිශීලක නාමය සහ මුරපදය ඇතුළත් කරන්න.'
          : 'Please enter your Student ID or Username and password.'
      );
      return;
    }

    setLoading(true);
    try {
      const { userProfile } = await loginWithEmailPassword(identifier, loginPassword);
      setCurrentAuthUser(userProfile);
      setCurrentPortal(userProfile.role);
      if (userProfile.role === 'student') {
        setStudentNav('Dashboard');
      } else if (userProfile.role === 'admin') {
        setAdminNav('Dashboard');
      } else if (userProfile.role === 'super_admin') {
        setSuperAdminNav('Dashboard');
      }
    } catch (err: any) {
      console.warn('Login attempt notification:', err?.message || err);
      let msg = err.message || 'Authentication failed. Please verify credentials.';
      const rawMsg = err.message || '';
      if (rawMsg.includes('Multiple student accounts (siblings) are registered with this email')) {
        msg =
          language === 'ta'
            ? 'இந்த மின்னஞ்சலில் ஒன்றுக்கும் மேற்பட்ட உடன்பிறப்புகள் (Siblings) பதிவு செய்யப்பட்டுள்ளனர். உங்கள் மாணவர் அடையாள எண் (Student ID) அல்லது பயனர் பெயர் (Username) கொண்டு உள்நுழையவும்.'
            : language === 'si'
            ? 'මෙම විද්‍යුත් තැපෑල යටතේ සහෝදර සිසුන් කිහිප දෙනෙකු ලියාපදිංචි වී ඇත. කරුණාකර ඔබගේ ශිෂ්‍ය අංකය (Student ID) හෝ පරිශීලක නාමය (Username) මඟින් ලොග් වන්න.'
            : 'Multiple student accounts (siblings) share this email. Please sign in using your specific Student ID or Username.';
      } else if (rawMsg.includes('No user account found with this Student ID or Username')) {
        msg =
          language === 'ta'
            ? 'இந்த மாணவர் எண் அல்லது பயனர் பெயரில் கணக்கு காணப்படவில்லை. தயவுசெய்து சரிபார்க்கவும்.'
            : language === 'si'
            ? 'මෙම ශිෂ්‍ය අංකය හෝ පරිශීලක නාමය සහිත ගිණුමක් හමු නොවීය. කරුණාකර නැවත පරීක්ෂා කරන්න.'
            : 'No user account found with this Student ID or Username. Please verify and try again.';
      } else if (
        err.code === 'auth/network-request-failed' ||
        rawMsg.includes('network-request-failed') ||
        rawMsg.includes('Network offline') ||
        rawMsg.includes('Failed to fetch')
      ) {
        msg =
          language === 'ta'
            ? 'இணைய இணைப்பு பிழை அல்லது சேவையக இணைப்பு தாமதமாகிறது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
            : language === 'si'
            ? 'ජාල සම්බන්ධතා දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න.'
            : 'Network connection issue. Please check your connection and try again.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg =
          language === 'ta'
            ? 'தவறான கடவுச்சொல் அல்லது பயனர் விபரம். தயவுசெய்து மீண்டும் சரிபார்க்கவும்.'
            : language === 'si'
            ? 'වැරදි මුරපදය හෝ පරිශීලක තොරතුරු. කරුණාකර නැවත පරීක්ෂා කරන්න.'
            : 'Invalid password or credentials. Please verify your details.';
      } else if (err.code === 'auth/user-not-found') {
        msg =
          language === 'ta'
            ? 'இந்த மாணவர் எண் / பயனர் பெயரில் கணக்கு இல்லை.'
            : language === 'si'
            ? 'මෙම ශිෂ්‍ය අංකය / පරිශීලක නාමය සහිත ගිණුමක් හමු නොවීය.'
            : 'No user account found with this identifier.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation for all requested fields
    if (
      !studentForm.fullName.trim() ||
      !studentForm.grade.trim() ||
      !studentForm.dateOfBirth.trim() ||
      !studentForm.studentId.trim() ||
      !studentForm.school.trim() ||
      !studentForm.district.trim() ||
      !studentForm.address.trim() ||
      !studentForm.phone.trim() ||
      !studentForm.email.trim() ||
      !studentForm.username.trim() ||
      !studentForm.password ||
      !studentForm.confirmPassword
    ) {
      setError(
        language === 'ta'
          ? 'அனைத்து தேவையான புலங்களையும் (12 புலங்கள்) தயவுசெய்து பூர்த்தி செய்யவும்.'
          : language === 'si'
          ? 'කරුණාකර සියලුම අවශ්‍ය ක්ෂේත්‍ර පුරවන්න.'
          : 'Please fill out all required registration fields.'
      );
      return;
    }

    if (!studentForm.email.includes('@') || !studentForm.email.includes('.')) {
      setError(
        language === 'ta'
          ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும் (e.g. name@domain.com).'
          : language === 'si'
          ? 'කරුණාකර නිවැරදි විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    const cleanUsername = studentForm.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setError(
        language === 'ta'
          ? 'பயனர் பெயர் குறைந்தது 3 எழுத்துக்களைக் கொண்டிருக்க வேண்டும் (எழுத்துக்கள் மற்றும் எண்கள்).'
          : language === 'si'
          ? 'පරිශීලක නාමය අවම වශයෙන් අක්ෂර 3ක් විය යුතුය.'
          : 'Username must be at least 3 alphanumeric characters (e.g. kavitha01).'
      );
      return;
    }

    if (studentForm.password.length < 6) {
      setError(
        language === 'ta'
          ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்களைக் கொண்டிருக்க வேண்டும்.'
          : language === 'si'
          ? 'මුරපදය අවම වශයෙන් අක්ෂර 6ක් විය යුතුය.'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (studentForm.password !== studentForm.confirmPassword) {
      setError(
        language === 'ta'
          ? 'கடவுச்சொற்கள் பொருந்தவில்லை! கடவுச்சொல்லை உறுதிப்படுத்துக புலத்தை சரிபார்க்கவும்.'
          : language === 'si'
          ? 'මුරපද නොගැලපේ! කරුණාකර මුරපදය තහවුරු කරන්න.'
          : 'Passwords do not match. Please ensure both passwords match identically.'
      );
      return;
    }

    setLoading(true);
    try {
      const { userProfile } = await registerStudentAccount({
        fullName: studentForm.fullName.trim(),
        grade: studentForm.grade.trim(),
        dateOfBirth: studentForm.dateOfBirth.trim(),
        studentId: studentForm.studentId.trim(),
        school: studentForm.school.trim(),
        district: studentForm.district.trim(),
        address: studentForm.address.trim(),
        phone: studentForm.phone.trim(),
        email: studentForm.email.trim(),
        username: cleanUsername,
        password: studentForm.password,
        referralCode: studentForm.referralCode?.trim(),
      });

      setSuccessMessage(
        language === 'ta'
          ? `பதிவு வெற்றிகரமானது! மாணவர் எண்: ${studentForm.studentId.trim()} | பயனர் பெயர்: ${cleanUsername}`
          : language === 'si'
          ? `ලියාපදිංචිය සාර්ථකයි! ශිෂ්‍ය අංකය: ${studentForm.studentId.trim()} | පරිශීලක නාමය: ${cleanUsername}`
          : `Registration successful! Student ID: ${studentForm.studentId.trim()} | Username: ${cleanUsername}`
      );

      setCurrentAuthUser(userProfile);
      setCurrentPortal('student');
      setStudentNav('Dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = err.message || 'Registration failed.';
      const rawMsg = err.message || '';
      if (rawMsg.includes('already taken by another student') || rawMsg.includes('choose a different unique username')) {
        msg =
          language === 'ta'
            ? `இந்த பயனர் பெயர் (${cleanUsername}) ஏற்கனவே பயன்படுத்தப்பட்டுள்ளது. தயவுசெய்து வேறு பயனர் பெயரைத் தேர்ந்தெடுக்கவும்.`
            : language === 'si'
            ? `මෙම පරිශීලක නාමය (${cleanUsername}) දැනටමත් භාවිතයේ ඇත. කරුණාකර වෙනත් පරිශීලක නාමයක් තෝරන්න.`
            : `Username "${cleanUsername}" is already taken. Please choose a different unique username.`;
      } else if (rawMsg.includes('already registered') && rawMsg.includes('Student ID')) {
        msg =
          language === 'ta'
            ? `இந்த மாணவர் அடையாள எண் (${studentForm.studentId.trim()}) ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. புதிய எண்ணை உருவாக்கவும்.`
            : language === 'si'
            ? `මෙම ශිෂ්‍ය හැඳුනුම් අංකය (${studentForm.studentId.trim()}) දැනටමත් ලියාපදිංචි කර ඇත. නව අංකයක් උත්පාදනය කරන්න.`
            : `Student ID "${studentForm.studentId.trim()}" is already registered. Please click Generate for a new ID.`;
      } else if (err.code === 'auth/email-already-in-use') {
        msg =
          language === 'ta'
            ? 'இந்த மின்னஞ்சல் முகவரி ஏற்கனவே பயன்பாட்டில் உள்ளது. தயவுசெய்து உள்நுழையவும்.'
            : language === 'si'
            ? 'මෙම විද්‍යත් තැපෑල දැනටමත් භාවිතයේ ඇත. කරුණාකර ලොග් වන්න.'
            : 'This email is already registered. Please sign in instead.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradient Grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Top Header bar with Language Selector */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
        <div className="flex items-center bg-slate-800/80 backdrop-blur border border-slate-700 p-0.5 rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
              language === 'en' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
            }`}
            title="English (Default)"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
              language === 'ta' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
            }`}
            title="தமிழ் (Tamil)"
          >
            தமிழ்
          </button>
          <button
            type="button"
            onClick={() => setLanguage('si')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
              language === 'si' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
            }`}
            title="සිංහල (Sinhala)"
          >
            සිංහල
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 p-1.5 backdrop-blur-xs border border-white/20 shadow-2xl shadow-blue-500/20 flex items-center justify-center">
            <img
              src={APP_LOGO}
              alt="HNC Competition Official Logo"
              className="w-full h-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {t('appName')}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-300 font-medium">
          {language === 'ta'
            ? 'இலங்கையின் மாணவர் ஆன்லைன் போட்டி தளம்'
            : language === 'si'
            ? 'ශ්‍රී ලංකාවේ මාර්ගගත ශිෂ්‍ය තරඟ වේදිකාව'
            : 'Sri Lanka’s Online Student Competition Platform'}
        </p>
      </div>

      <div
        className={`mt-6 sm:mx-auto sm:w-full z-10 transition-all duration-300 ${
          mode === 'register_student' ? 'sm:max-w-2xl' : 'sm:max-w-md'
        }`}
      >
        <div className="bg-white border border-slate-200 py-6 px-4 sm:px-8 shadow-2xl rounded-2xl">
          {/* Target Competition Invitation Banner */}
          {invitedCompId && (
            <div className="mb-5 p-3.5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl flex items-center justify-between gap-3 shadow-md border border-blue-700/50">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-xs">
                    {language === 'ta'
                      ? '🏆 போட்டி அழைப்பு (Competition Invitation)'
                      : language === 'si'
                      ? '🏆 තරඟ ආරාධනය (Competition Invitation)'
                      : '🏆 Competition Invitation'}
                  </p>
                  <p className="text-[11px] text-blue-200 mt-0.5">
                    {language === 'ta'
                      ? 'நீங்கள் இப்போட்டியில் பங்குபற்ற அழைக்கப்பட்டுள்ளீர்கள்! பங்குபற்ற பதிவு செய்யவும் அல்லது உள்நுழையவும்.'
                      : language === 'si'
                      ? 'ඔබ මෙම තරඟයට සහභාගී වීමට ආරාධනා කර ඇත! කරුණාකර ලියාපදිංචි වන්න හෝ ලොග් වන්න.'
                      : 'You were invited to compete! Please complete student registration or sign in below.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 mb-6 gap-2">
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 flex-1 justify-center ${
                mode === 'login'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {language === 'ta'
                  ? 'உள்நுழைவு (Login)'
                  : language === 'si'
                  ? 'පද්ධති ප්‍රවේශය (Login)'
                  : 'Sign In (Login)'}
              </span>
            </button>

            <button
              id="tab-auth-student-reg"
              type="button"
              onClick={() => {
                setMode('register_student');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 flex-1 justify-center ${
                mode === 'register_student'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>
                {language === 'ta'
                  ? 'மாணவர் பதிவு (Registration)'
                  : language === 'si'
                  ? 'ශිෂ්‍ය ලියාපදිංචිය (Registration)'
                  : 'Student Registration'}
              </span>
            </button>
          </div>

          {/* Feedback Messages */}
          {sessionTimeoutNotice && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl flex items-start gap-2.5 shadow-2xs animate-in fade-in">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold leading-relaxed">{sessionTimeoutNotice}</div>
              <button
                type="button"
                onClick={() => setSessionTimeoutNotice(null)}
                className="text-amber-600 hover:text-amber-800 text-xs font-bold px-1"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex flex-col gap-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
              {error.includes('No user account found') && (
                <div className="mt-1 pt-2 border-t border-rose-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700 font-normal">
                    {language === 'ta'
                      ? 'புதிய கணக்கை தொடங்க வேண்டுமா?'
                      : language === 'si'
                      ? 'නව ගිණුමක් සාදා ගැනීමට අවශ්‍යද?'
                      : 'Need to create a new student account?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register_student');
                      setError(null);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-2xs"
                  >
                    {language === 'ta' ? 'இங்கு பதிவு செய்க' : language === 'si' ? 'ලියාපදිංචි වන්න' : 'Register Account'}
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* =========================================================================
              1. LOGIN PAGE: Student ID / Username, Password
              ========================================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {language === 'ta'
                    ? 'Student ID / username (மாணவர் ID / பயனர் பெயர்) *'
                    : language === 'si'
                    ? 'Student ID / username (ශිෂ්‍ය ID / පරිශීලක නාමය) *'
                    : 'Student ID / username *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-identifier"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="Student ID / username..."
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'கடவுச்சொல் (Password) *'
                      : language === 'si'
                      ? 'මුරපදය (Password) *'
                      : 'Password *'}
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">
                    {language === 'ta' ? 'கடவுச்சொல் நினைவில் இல்லையா?' : 'Forgot your password?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(true);
                      setForgotIdentifier(loginIdentifier || '');
                      setForgotError(null);
                      setForgotSuccess(null);
                      setForgotResult(null);
                    }}
                    className="font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'கடவுச்சொல்லை மீட்டெடுக்க' : 'Forgot Password?'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>
                        {language === 'ta'
                          ? 'பாதுகாப்பாக உள்நுழைக'
                          : language === 'si'
                          ? 'ආරක්ෂිතව ප්‍රවේශ වන්න'
                          : 'Sign In'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {language === 'ta'
                    ? 'புதிய மாணவரா?'
                    : language === 'si'
                    ? 'නව ශිෂ්‍යයෙක්ද?'
                    : 'New candidate?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register_student');
                    setError(null);
                  }}
                  className="font-bold text-blue-700 hover:text-blue-900 underline"
                >
                  {language === 'ta'
                    ? 'இங்கு பதிவு செய்க (Register)'
                    : language === 'si'
                    ? 'මෙහි ලියාපදිංචි වන්න (Register)'
                    : 'Create Student Account'}
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              2. STUDENT REGISTRATION PAGE:
              Full name, Grade, Date of birth, Student ID, School, District, Address,
              Phone number, Email, Username, Password, Confirm password
              ========================================================================= */}
          {mode === 'register_student' && (
            <form onSubmit={handleStudentRegister} className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  {language === 'ta'
                    ? 'மாணவர் பதிவு (Registration)'
                    : language === 'si'
                    ? 'ශිෂ්‍ය ලියාපදිංචිය (Registration)'
                    : 'Student Registration'}
                </span>
              </div>

              {/* Auto-applied referral banner from link */}
              {autoRefApplied && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-start gap-2.5 animate-pulse shadow-xs">
                  <span className="text-lg leading-none shrink-0">🎁</span>
                  <div>
                    <span className="font-extrabold text-emerald-800">
                      {language === 'ta'
                        ? `நண்பரின் பரிந்துரை லிங்க் இணைக்கப்பட்டது (${autoRefApplied})!`
                        : language === 'si'
                        ? `මිතුරාගේ නිර්දේශ ලින්ක් එක සම්බන්ධ විය (${autoRefApplied})!`
                        : `Friend's Referral Link Applied (${autoRefApplied})!`}
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {language === 'ta'
                        ? 'பதிவு முடித்ததும் உங்களுக்கும் உங்களை அழைத்த நண்பருக்கும் தலா +25 புள்ளிகள் நேரடியாக கணக்கில் சேர்க்கப்படும்.'
                        : language === 'si'
                        ? 'ලියාපදිංචිය අවසන් වූ පසු ඔබට සහ ඔබේ මිතුරාට +25 ලකුණු බැගින් හිමිවේ.'
                        : 'Upon registration, +25 Points will be credited to both your account and your friend!'}
                    </p>
                  </div>
                </div>
              )}

              {/* Sibling friendliness guidance note */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-2.5 text-[11px] text-blue-900 flex items-start gap-2">
                <span className="text-base leading-none shrink-0 mt-0.5">👨‍👩‍👧‍👦</span>
                <p className="leading-relaxed">
                  {language === 'ta'
                    ? 'உடன்பிறப்புகள் (Siblings) ஒரே பெற்றோர் மின்னஞ்சல் & தொலைபேசி எண்ணைப் பயன்படுத்தலாம். ஒவ்வொரு பிள்ளைக்கும் தனித்துவமான மாணவர் அடையாள எண் (Student ID) மற்றும் பயனர் பெயர் (Username) மட்டுமே அவசியம்.'
                    : language === 'si'
                    ? 'සහෝදර සහෝදරියන්ට එකම දෙමාපිය විද්‍යුත් තැපෑල සහ දුරකථන අංකය භාවිතා කළ හැක. එක් එක් දරුවා සඳහා වෙනම ශිෂ්‍ය හැඳුනුම් අංකයක් (Student ID) සහ පරිශීලක නාමයක් (Username) පමණක් අවශ්‍ය වේ.'
                    : 'Siblings can share the same parent email & phone number. Only the Student ID and Username must be unique for each child.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Full name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'முழுப் பெயர் (Full name) *'
                      : language === 'si'
                      ? 'සම්පූර්ණ නම (Full name) *'
                      : 'Full Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-fullname"
                      type="text"
                      required
                      placeholder="Enter Full Name / முழுப் பெயர்"
                      value={studentForm.fullName}
                      onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 2. Grade */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      {language === 'ta'
                        ? 'வகுப்பு / தரம் (Grade) *'
                        : language === 'si'
                        ? 'ශ්‍රේණිය (Grade) *'
                        : 'Grade *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomGrade(!isCustomGrade)}
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition-colors flex items-center gap-1"
                    >
                      {isCustomGrade ? (
                        <>
                          <ListFilter className="w-3 h-3" />
                          <span>{language === 'ta' ? 'பட்டியல்' : language === 'si' ? 'ලැයිස්තුව' : 'List'}</span>
                        </>
                      ) : (
                        <>
                          <PenLine className="w-3 h-3" />
                          <span>{language === 'ta' ? 'தட்டச்சு' : language === 'si' ? 'ටයිප් කරන්න' : 'Type'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isCustomGrade ? (
                    <div className="relative">
                      <select
                        id="input-reg-grade"
                        value={AVAILABLE_GRADES.includes(studentForm.grade) ? studentForm.grade : '__custom__'}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomGrade(true);
                          } else {
                            setStudentForm({ ...studentForm, grade: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                      >
                        {AVAILABLE_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                        <option value="__custom__">
                          ✍️ {language === 'ta'
                            ? 'வேறு தரம் தட்டச்சு செய்க...'
                            : language === 'si'
                            ? 'වෙනත් ශ්‍රේණියක් ටයිප් කරන්න...'
                            : 'Type Custom Grade / Level...'}
                        </option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        id="input-reg-grade-custom"
                        type="text"
                        required
                        placeholder="e.g. Grade 11 (O/L), Grade 12 (A/L), Primary..."
                        value={studentForm.grade}
                        onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-400 ring-2 ring-blue-100 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Date of birth */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'பிறந்த திகதி (Date of birth) *'
                      : language === 'si'
                      ? 'උපන් දිනය (Date of birth) *'
                      : 'Date of Birth *'}
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-dob"
                      type="date"
                      required
                      value={studentForm.dateOfBirth}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, dateOfBirth: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 4. Student ID */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      {language === 'ta'
                        ? 'மாணவர் அடையாள எண் (Student ID) *'
                        : language === 'si'
                        ? 'ශිෂ්‍ය හැඳුනුම් අංකය (Student ID) *'
                        : 'Student ID *'}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setStudentForm({
                          ...studentForm,
                          studentId: generateSuggestedStudentId(),
                        })
                      }
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1"
                      title="Generate unique Student ID"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>{language === 'ta' ? 'புதிய எண்' : language === 'si' ? 'සාදන්න' : 'Generate'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-studentid"
                      type="text"
                      required
                      placeholder="e.g. STU-2026-1042 or School ID"
                      value={studentForm.studentId}
                      onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-semibold"
                    />
                  </div>
                </div>

                {/* 5. School */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'பாடசாலை (School) *'
                      : language === 'si'
                      ? 'පාසල (School) *'
                      : 'School *'}
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-school"
                      type="text"
                      required
                      placeholder="e.g. Hartley College, Jaffna / Royal College, Colombo"
                      value={studentForm.school}
                      onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 6. District */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      {language === 'ta'
                        ? 'மாவட்டம் (District) *'
                        : language === 'si'
                        ? 'දිස්ත්‍රික්කය (District) *'
                        : 'District *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomDistrict(!isCustomDistrict)}
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1"
                    >
                      {isCustomDistrict ? (
                        <>
                          <ListFilter className="w-3 h-3" />
                          <span>{language === 'ta' ? 'பட்டியல்' : language === 'si' ? 'ලැයිස්තුව' : 'List'}</span>
                        </>
                      ) : (
                        <>
                          <PenLine className="w-3 h-3" />
                          <span>{language === 'ta' ? 'தட்டச்சு' : language === 'si' ? 'ටයිප් කරන්න' : 'Type'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isCustomDistrict ? (
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <select
                        id="input-reg-district"
                        value={SRI_LANKA_DISTRICTS.includes(studentForm.district) ? studentForm.district : '__other__'}
                        onChange={(e) => {
                          if (e.target.value === '__other__') {
                            setIsCustomDistrict(true);
                          } else {
                            setStudentForm({ ...studentForm, district: e.target.value });
                          }
                        }}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                      >
                        {SRI_LANKA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                        <option value="__other__">✍️ {language === 'ta' ? 'வேறு மாவட்டம் தட்டச்சு செய்க...' : language === 'si' ? 'වෙනත් දිස්ත්‍රික්කයක් ටයිප් කරන්න...' : 'Type other district...'}</option>
                      </select>
                    </div>
                  ) : (
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        id="input-reg-district-custom"
                        type="text"
                        required
                        placeholder="e.g. Jaffna, Colombo, Kandy..."
                        value={studentForm.district}
                        onChange={(e) => setStudentForm({ ...studentForm, district: e.target.value })}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-blue-400 ring-2 ring-blue-100 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* 7. Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'முகவரி (Address) *'
                      : language === 'si'
                      ? 'ලිපිනය (Address) *'
                      : 'Address *'}
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-address"
                      type="text"
                      required
                      placeholder="e.g. No. 24, Main Street, Point Pedro"
                      value={studentForm.address}
                      onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 8. Phone number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'தொலைபேசி எண் (Phone number) *'
                      : language === 'si'
                      ? 'දුරකථන අංකය (Phone number) *'
                      : 'Phone Number *'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-phone"
                      type="tel"
                      required
                      placeholder="+94 77 123 4567"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 9. Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'மின்னஞ்சல் (Email) *'
                      : language === 'si'
                      ? 'විද්‍යුත් තැපෑල (Email) *'
                      : 'Email *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-email"
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 10. Username */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'பயனர் பெயர் (Username) *'
                      : language === 'si'
                      ? 'පරිශීලක නාමය (Username) *'
                      : 'Username *'}
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-username"
                      type="text"
                      required
                      placeholder="e.g. username"
                      value={studentForm.username}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                        })
                      }
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 11. Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'கடவுச்சொல் (Password) *'
                      : language === 'si'
                      ? 'මුරපදය (Password) *'
                      : 'Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={studentForm.password}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, password: e.target.value })
                      }
                      className="w-full pl-9 pr-10 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 12. Confirm password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta'
                      ? 'கடவுச்சொல்லை உறுதிப்படுத்துக (Confirm password) *'
                      : language === 'si'
                      ? 'මුරපදය තහවුරු කරන්න (Confirm password) *'
                      : 'Confirm Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-confirmpassword"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={studentForm.confirmPassword}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, confirmPassword: e.target.value })
                      }
                      className={`w-full pl-9 pr-10 py-1.5 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:bg-white ${
                        studentForm.confirmPassword && studentForm.password !== studentForm.confirmPassword
                          ? 'border-rose-400 ring-1 ring-rose-300'
                          : 'border-slate-300 focus:ring-blue-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                      tabIndex={-1}
                    >
                      {showRegConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {studentForm.confirmPassword && studentForm.password === studentForm.confirmPassword && (
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        {language === 'ta'
                          ? 'கடவுச்சொற்கள் பொருந்துகின்றன'
                          : language === 'si'
                          ? 'මුරපද ගැලපේ'
                          : 'Passwords match'}
                      </span>
                    </p>
                  )}
                </div>

                {/* 13. Referral Code (Optional) */}
                <div className={`space-y-1.5 p-3 rounded-xl sm:col-span-2 border transition-all ${
                  studentForm.referralCode
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Gift className={`w-3.5 h-3.5 ${studentForm.referralCode ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span>
                        {language === 'ta'
                          ? 'நண்பரின் பரிந்துரை குறியீடு (Referral Code - விருப்பத்தேர்வு)'
                          : language === 'si'
                          ? 'මිතුරාගේ නිර්දේශ කේතය (Referral Code - Optional)'
                          : 'Friend Referral Code (Optional)'}
                      </span>
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      studentForm.referralCode
                        ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
                        : 'text-amber-800 bg-amber-100 border-amber-300'
                    }`}>
                      {studentForm.referralCode ? '🎁 +25 BONUS PTS ACTIVE' : '🎁 +25 BONUS PTS'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="input-reg-referral"
                      type="text"
                      placeholder="Referral Code / பரிந்துரை குறியீடு (Leave empty if none)"
                      value={studentForm.referralCode}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, referralCode: e.target.value.toUpperCase() })
                      }
                      className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg text-slate-900 font-mono font-semibold placeholder:font-normal placeholder:normal-case focus:outline-none focus:ring-2 uppercase tracking-wide ${
                        studentForm.referralCode
                          ? 'border-emerald-400 focus:ring-emerald-500'
                          : 'border-amber-300 focus:ring-amber-500'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600">
                    {studentForm.referralCode ? (
                      <span className="text-emerald-700 font-semibold">
                        {language === 'ta'
                          ? '✓ பரிந்துரை குறியீடு சேர்க்கப்பட்டுள்ளது: உங்களுக்கும் உங்களை அழைத்த நண்பருக்கும் தலா +25 புள்ளிகள் கணக்கில் சேரும்!'
                          : language === 'si'
                          ? '✓ නිර්දේශ කේතය ඇතුළත් විය: ඔබට සහ ඔබේ මිතුරාට +25 ලකුණු හිමිවේ!'
                          : '✓ Referral Code active: +25 Points will be awarded to both you and your friend!'}
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        {language === 'ta'
                          ? 'நண்பரின் பரிந்துரை குறியீட்டைப் பயன்படுத்தி பதிவு செய்தால் மட்டுமே +25 புள்ளிகள் கிடைக்கும். (இல்லையெனில் ஆரம்ப இருப்பு 0 புள்ளிகள்)'
                          : language === 'si'
                          ? 'මිතුරෙකුගේ නිර්දේශ කේතය මඟින් ලියාපදිංචි වුවහොත් පමණක් +25 ලකුණු හිමිවේ (නැතහොත් ලකුණු 0).'
                          : 'Register with a friend\'s referral code to unlock +25 Points. (Regular signups start with 0 points)'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <button
                  id="btn-submit-student-register"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering Candidate...
                    </span>
                  ) : (
                    <>
                      <span>
                        {language === 'ta'
                          ? 'மாணவர் கணக்கை உருவாக்குக (Complete Registration)'
                          : language === 'si'
                          ? 'ලියාපදිංචිය සම්පූර්ණ කරන්න (Complete Registration)'
                          : 'Complete Student Registration'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>{language === 'ta' ? 'ஏற்கனவே கணக்கு உள்ளதா?' : language === 'si' ? 'දැනටමත් ගිණුමක් තිබේද?' : 'Already registered?'}</span>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-blue-700 hover:text-blue-900 underline ml-1"
                >
                  {language === 'ta'
                    ? 'இங்கு உள்நுழையவும் (Sign In)'
                    : language === 'si'
                    ? 'මෙහි ප්‍රවේශ වන්න (Sign In)'
                    : 'Sign In with Student ID / Username'}
                </button>
              </div>
            </form>
          )}
          {/* Quick Share Registration Link Bar */}
          <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-[11px] text-slate-500 font-medium">
              {language === 'ta'
                ? 'மாணவர் பதிவு இணைப்பை மற்றவர்களுடன் பகிர வேண்டுமா?'
                : language === 'si'
                ? 'ශිෂ්‍ය ලියාපදිංචි සබැඳිය බෙදා ගැනීමට අවශ්‍යද?'
                : 'Need to share the registration link with friends or students?'}
            </span>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors border border-blue-200 shadow-2xs self-start sm:self-auto shrink-0"
              title="Share Registration Link"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta'
                  ? 'பதிவு இணைப்பைப் பகிர்க'
                  : language === 'si'
                  ? 'ලියාපදිංචි සබැඳිය බෙදාගන්න'
                  : 'Share Registration Link'}
              </span>
            </button>
          </div>
        </div>

        {/* Security Assurance Footer */}
        <div className="mt-4 text-center text-[11px] text-slate-400">
          <span>Protected by Firebase Auth & Cloud Firestore Rules • HNC Competition Governance</span>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Forgot Password Recovery Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center relative shadow-2xl border border-slate-100 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl shadow-inner">
              🔑
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                {language === 'ta' ? 'கடவுச்சொல்லை மீட்டெடுத்தல்' : 'Forgot Password Recovery'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'ta'
                  ? 'உங்கள் மாணவர் அடையாள எண் (Student ID), பயனர் பெயர் (Username) அல்லது பதிவுசெய்த மின்னஞ்சலை உள்ளிட்டு கணக்கை மீட்டெடுக்கவும்.'
                  : 'Enter your Student ID, Username, or Registered Email to recover your account.'}
              </p>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{forgotError}</div>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 text-left animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{forgotSuccess}</div>
              </div>
            )}

            {!forgotResult ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 text-left">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta' ? 'மாணவர் ID / பயனர் பெயர் / மின்னஞ்சல் *' : 'Student ID / Username / Email *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. STU-2026-1002, suganthan, or sugan@gmail.com"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'ta' ? 'விருப்பமான புதிய கடவுச்சொல் (Optional)' : 'Preferred New Password (Optional)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Leaving empty auto-generates a strong key..."
                      value={forgotCustomNewPassword}
                      onChange={(e) => setForgotCustomNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-5 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isForgotLoading ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>{language === 'ta' ? 'கடவுச்சொல்லை ரீசெட் செய்' : 'Reset Password'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs">
                <div className="font-extrabold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
                  <span>Candidate: {forgotResult.fullName}</span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {forgotResult.studentId || forgotResult.username || 'Account Found'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'ta' ? 'உங்கள் புதிய கடவுச்சொல் (New Password):' : 'Your New Password:'}
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-300 font-mono">
                    <span className="font-bold text-sm text-blue-900">{forgotResult.assignedPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(forgotResult.assignedPassword);
                        setForgotCopied(true);
                        setTimeout(() => setForgotCopied(false), 2000);
                      }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors flex items-center gap-1 font-sans font-bold text-xs cursor-pointer"
                    >
                      {forgotCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{forgotCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic pt-1">
                  {language === 'ta'
                    ? 'உள்நுழைவு படிவத்தில் இந்த கடவுச்சொல் தானாக நிரப்பப்பட்டுள்ளது. இப்போது நேரடியாக உள்நுழையலாம்!'
                    : 'Credentials have been filled into the login form. You can now click Sign In directly!'}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setForgotResult(null);
                    }}
                    className="w-full py-2.5 text-xs font-black bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-all shadow-md text-center cursor-pointer"
                  >
                    {language === 'ta' ? 'உள்நுழைவு படிவத்திற்குச் செல்க' : 'Proceed to Sign In'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
