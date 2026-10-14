import React, { useState, useEffect } from 'react';
import { StudentUser } from '../../types';
import { Modal } from '../common/Modal';
import { AVAILABLE_GRADES } from '../../lib/gradeUtils';
import { SRI_LANKA_DISTRICTS } from '../../data/sriLankaDistricts';
import {
  User,
  School,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Home,
  ShieldCheck,
  Coins,
  Key,
  Lock,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentUser | null;
  duplicateWarning?: {
    isEmailDup: boolean;
    isPhoneDup: boolean;
    emailCount?: number;
    phoneCount?: number;
  };
  onSave: (
    studentUid: string,
    updatedData: {
      fullName: string;
      studentId: string;
      username: string;
      email: string;
      phone: string;
      grade: string;
      school: string;
      district: string;
      address: string;
      dateOfBirth: string;
      guardianName: string;
      status: 'active' | 'inactive';
      referralPoints: number;
      referralCode: string;
      newPassword?: string;
      oldStudentId?: string;
    }
  ) => Promise<void>;
  language: 'ta' | 'en' | 'si';
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  duplicateWarning,
  onSave,
  language,
}) => {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [district, setDistrict] = useState('Jaffna');
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [referralPoints, setReferralPoints] = useState<number>(25);
  const [referralCode, setReferralCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCustomGrade, setIsCustomGrade] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state whenever selected student changes
  useEffect(() => {
    if (student) {
      setFullName(student.name || student.fullName || '');
      setStudentId(student.studentId || '');
      setUsername(student.username || '');
      setEmail(student.email || '');
      setPhone(student.phone || '');
      setGrade(student.gradeLevel || student.grade || 'Grade 11 (O/L)');
      setSchool(student.institution || student.school || '');
      
      const stdDistrict = student.district || 'Jaffna';
      if (SRI_LANKA_DISTRICTS.includes(stdDistrict)) {
        setDistrict(stdDistrict);
        setIsCustomDistrict(false);
      } else if (stdDistrict) {
        setDistrict(stdDistrict);
        setIsCustomDistrict(true);
      } else {
        setDistrict('Jaffna');
        setIsCustomDistrict(false);
      }

      setAddress(student.address || '');
      setDateOfBirth(student.dateOfBirth || '');
      setGuardianName(student.guardianName || '');
      setStatus(student.status === 'inactive' ? 'inactive' : 'active');
      setReferralPoints(
        student.referralPoints !== undefined ? student.referralPoints : 25
      );
      setReferralCode(
        student.referralCode ||
          `HNC-${student.studentId.toUpperCase().replace(/[^A-Z0-9]/g, '')}`
      );
      setNewPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [student, isOpen]);

  const generateNewStudentId = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setStudentId(`STU-${year}-${rand}`);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let gen = 'HNC@';
    for (let i = 0; i < 5; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (!fullName.trim()) {
      setErrorMsg(
        language === 'ta'
          ? 'மாணவர் பெயர் அவசியமானது.'
          : 'Student Full Name is required.'
      );
      return;
    }

    if (!studentId.trim()) {
      setErrorMsg(
        language === 'ta'
          ? 'மாணவர் இலக்கம் (Student ID) அவசியமானது.'
          : 'Student ID is required.'
      );
      return;
    }

    if (newPassword && newPassword.trim().length < 4) {
      setErrorMsg(
        language === 'ta'
          ? 'கடவுச்சொல் குறைந்தது 4 எழுத்துக்கள் கொண்டிருக்க வேண்டும்.'
          : 'Password must be at least 4 characters.'
      );
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave(student.id, {
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        grade: grade.trim(),
        school: school.trim(),
        district: district.trim(),
        address: address.trim(),
        dateOfBirth: dateOfBirth.trim(),
        guardianName: guardianName.trim(),
        status,
        referralPoints: Number(referralPoints) || 0,
        referralCode: referralCode.trim().toUpperCase(),
        newPassword: newPassword.trim() || undefined,
        oldStudentId: student.studentId,
      });

      setSuccessMsg(
        language === 'ta'
          ? 'மாணவர் விபரங்கள் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டன!'
          : 'Student details updated successfully!'
      );

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(
        err?.message ||
          (language === 'ta'
            ? 'புதுப்பித்தலில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
            : 'Failed to update student details. Please try again.')
      );
    }
  };

  if (!isOpen || !student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === 'ta'
          ? 'மாணவர் விபரங்களைத் திருத்து (Edit Student)'
          : language === 'si'
          ? 'ශිෂ්‍ය තොරතුරු සංස්කරණය කරන්න'
          : 'Edit Student Details'
      }
      subtitle={`UID: ${student.id} • ${student.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Helper Note Banner */}
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {language === 'ta'
                ? 'Super Admin மாணவர் திருத்தக் கட்டுப்பாடு'
                : 'Super Admin Student Correction Panel'}
            </span>
            <span className="text-[11px] text-blue-700">
              {language === 'ta'
                ? 'மாணவர்கள் தவறுதலாகப் பதிவு செய்த பெயர்கள், வகுப்பு, பாடசாலை, தொலைபேசி எண், Student ID அல்லது கடவுச்சொல்லை இங்கு எளிதாக மாற்றிச் சரிசெய்யலாம்.'
                : 'Correct typos, change grade, school, phone, registration number, or reset password for any candidate. Updates sync in real-time.'}
            </span>
          </div>
        </div>

        {/* Duplicate Conflict Alert Banner */}
        {duplicateWarning && (duplicateWarning.isEmailDup || duplicateWarning.isPhoneDup) && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-950 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-rose-900">
                {language === 'ta'
                  ? '⚠️ நகல் பதிவு முரண்பாடு கண்டறியப்பட்டது (Duplicate Conflict Detected)'
                  : '⚠️ Duplicate Conflict Detected'}
              </span>
              <span className="text-[11px] text-rose-800">
                {language === 'ta'
                  ? `இந்த மாணவரின் ${
                      duplicateWarning.isEmailDup && duplicateWarning.isPhoneDup
                        ? 'மின்னஞ்சல் மற்றும் தொலைபேசி எண்'
                        : duplicateWarning.isEmailDup
                        ? 'மின்னஞ்சல் முகவரி'
                        : 'தொலைபேசி எண்'
                    } வேறு மாணவர் கணக்கிலும் பதிவு செய்யப்பட்டுள்ளது. இம்முரண்பாட்டைத் தீர்க்க கீழே உள்ள விபரங்களைத் திருத்திச் சேமிக்கவும்.`
                  : `This candidate's ${
                      duplicateWarning.isEmailDup && duplicateWarning.isPhoneDup
                        ? 'email address and phone number'
                        : duplicateWarning.isEmailDup
                        ? 'email address'
                        : 'phone number'
                    } is shared with another registered account. Update the values below to resolve this duplicate.`}
              </span>
            </div>
          </div>
        )}

        {/* Status & Feedback */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Grid of Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta'
                  ? 'மாணவர் முழுப் பெயர் (Full Name) *'
                  : 'Student Full Name *'}
              </span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Harish Vigneswaran / ஹரிஷ் விக்னேஸ்வரன்"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
            />
          </div>

          {/* Student ID (Index No) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                {language === 'ta'
                  ? 'மாணவர் எண் (Student ID / Index) *'
                  : 'Student ID / Registration No *'}
              </label>
              <button
                type="button"
                onClick={generateNewStudentId}
                className="text-[10px] text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1"
                title="Generate New ID"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>{language === 'ta' ? 'புதிய எண்' : 'New ID'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. STU-2026-1001"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {language === 'ta'
                ? 'பயனர்பெயர் (Login Username)'
                : 'Username (for login)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Grade / Class */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {language === 'ta' ? 'வகுப்பு / தரம் (Grade) *' : 'Grade / Class *'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomGrade(!isCustomGrade)}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                {isCustomGrade ? 'List' : 'Type freely'}
              </button>
            </div>
            {isCustomGrade ? (
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. Grade 12 (A/L Maths)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
              />
            ) : (
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
              >
                {AVAILABLE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                {!AVAILABLE_GRADES.includes(grade) && grade && (
                  <option value={grade}>{grade}</option>
                )}
              </select>
            )}
          </div>

          {/* School / Institution */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta'
                  ? 'பாடசாலை (School / Institution) *'
                  : 'School / Institution *'}
              </span>
            </label>
            <input
              type="text"
              required
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Royal College, Colombo / Hartley College"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
            />
          </div>

          {/* District */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {language === 'ta' ? 'மாவட்டம் (District) *' : 'District *'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomDistrict(!isCustomDistrict)}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                {isCustomDistrict ? 'List' : 'Type freely'}
              </button>
            </div>
            {isCustomDistrict ? (
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Jaffna, Colombo, Kandy"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
              />
            ) : (
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
              >
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                {!SRI_LANKA_DISTRICTS.includes(district) && district && (
                  <option value={district}>{district}</option>
                )}
              </select>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta' ? 'தொலைபேசி எண் (Phone / WhatsApp)' : 'Phone Number'}
              </span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0771234567"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta' ? 'மின்னஞ்சல் (Email)' : 'Email Address'}
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta' ? 'பிறந்த திகதி (Date of Birth)' : 'Date of Birth'}
              </span>
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
            />
          </div>

          {/* Guardian Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {language === 'ta'
                ? 'பெற்றோர் / பாதுகாவலர் (Parent/Guardian)'
                : 'Parent / Guardian Name'}
            </label>
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="Guardian Full Name"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'ta' ? 'முகவரி (Address)' : 'Address'}</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Point Pedro, Jaffna"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Account Status */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'ta' ? 'கணக்கு நிலை (Account Status)' : 'Account Status'}
              </span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-bold"
            >
              <option value="active">Active (இயங்கும்)</option>
              <option value="inactive">Inactive / Suspended (முடக்கம்)</option>
            </select>
          </div>

          {/* Referral Points Balance */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>
                  {language === 'ta'
                    ? 'வெகுமதி புள்ளிகள் (Points)'
                    : 'Reward Points Balance'}
                </span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReferralPoints((p) => Math.max(0, p + 25))}
                  className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold hover:bg-amber-100"
                >
                  +25
                </button>
                <button
                  type="button"
                  onClick={() => setReferralPoints((p) => Math.max(0, p + 50))}
                  className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold hover:bg-amber-100"
                >
                  +50
                </button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              value={referralPoints}
              onChange={(e) => setReferralPoints(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Referral Code */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700">
              {language === 'ta'
                ? 'பரிந்துரைக் குறியீடு (Referral Code)'
                : 'Referral Code'}
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. HNC-2026-HARISH"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Optional Password Reset Panel */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {language === 'ta'
                  ? 'கடவுச்சொல்லை மாற்றுக (விரும்பினால் மட்டும்)'
                  : 'Reset / Change Student Password (Optional)'}
              </span>
            </span>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-md font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>{language === 'ta' ? 'தானியங்கி கடவுச்சொல்' : 'Generate'}</span>
            </button>
          </div>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'மாற்ற விரும்பினால் புதிய கடவுச்சொல்லை தட்டச்சு செய்க...'
                  : 'Leave empty to keep existing password, or enter new password...'
              }
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg placeholder:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {language === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{language === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>
                  {language === 'ta'
                    ? 'விபரங்களைச் சேமி (Save Changes)'
                    : 'Save Changes'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
