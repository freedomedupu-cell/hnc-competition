import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  GraduationCap,
  Search,
  School,
  Trophy,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Eye,
  Trash2,
  AlertTriangle,
  Coins,
  Gift,
  Share2,
  Copy,
  Check,
  Plus,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { students, competitions, results, deleteStudentAccount, adjustStudentPoints, language } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'default' | 'points_desc' | 'referrals_desc' | 'awards_desc' | 'name'>('default');
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Bonus points adjustment state
  const [customPointsInput, setCustomPointsInput] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [pointAdjustToast, setPointAdjustToast] = useState<string | null>(null);
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);

  const totalCirculatingPoints = students.reduce(
    (acc, s) => acc + (s.referralPoints !== undefined ? s.referralPoints : 25),
    0
  );
  const totalReferralsCount = students.reduce((acc, s) => acc + (s.totalReferrals || 0), 0);

  const handleAdjustPoints = async (studentId: string, delta: number, reason?: string) => {
    setIsAdjustingPoints(true);
    try {
      const newPts = await adjustStudentPoints(studentId, delta, reason);
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({
          ...selectedStudent,
          referralPoints: newPts,
        });
      }
      setPointAdjustToast(
        language === 'ta'
          ? `புள்ளிகள் வெற்றிகரமாக மாற்றப்பட்டன! தற்போதைய இருப்பு: ${newPts} pts`
          : language === 'si'
          ? `ලකුණු යාවත්කාලීන කරන ලදී! නව ශේෂය: ${newPts} pts`
          : `Points adjusted successfully! Current balance: ${newPts} pts`
      );
      setTimeout(() => setPointAdjustToast(null), 3500);
      setCustomPointsInput('');
      setPointsReason('');
    } catch (err) {
      console.error('Failed to adjust points:', err);
    } finally {
      setIsAdjustingPoints(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudentAccount(studentToDelete.id);
      if (selectedStudent?.id === studentToDelete.id) {
        setSelectedStudent(null);
      }
      setStudentToDelete(null);
    } catch (err) {
      console.error('Failed to delete student account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = students
    .filter((std) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        std.name.toLowerCase().includes(term) ||
        std.studentId.toLowerCase().includes(term) ||
        (std.username && std.username.toLowerCase().includes(term)) ||
        (std.district && std.district.toLowerCase().includes(term)) ||
        std.institution.toLowerCase().includes(term) ||
        std.email.toLowerCase().includes(term) ||
        (std.referralCode && std.referralCode.toLowerCase().includes(term));

      const matchesGrade =
        gradeFilter === 'all' ? true : std.gradeLevel.includes(gradeFilter);

      return matchesSearch && matchesGrade;
    })
    .sort((a, b) => {
      if (sortBy === 'points_desc') {
        const ptsA = a.referralPoints !== undefined ? a.referralPoints : 25;
        const ptsB = b.referralPoints !== undefined ? b.referralPoints : 25;
        return ptsB - ptsA;
      }
      if (sortBy === 'referrals_desc') {
        return (b.totalReferrals || 0) - (a.totalReferrals || 0);
      }
      if (sortBy === 'awards_desc') {
        return (b.awardsCount || 0) - (a.awardsCount || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-700" />
            <span>
              {language === 'ta'
                ? 'மாணவர் முகாமைத்துவம் & புள்ளிகள்'
                : language === 'si'
                ? 'ශිෂ්‍ය කළමනාකරණය සහ ලකුණු'
                : 'Student Management & Points Oversight'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'மாணவர் பதிவுகள், மொத்த வெகுமதி புள்ளிகள், பரிந்துரை புள்ளிவிவரங்கள் மற்றும் கல்வி சான்றளிப்பு.'
              : language === 'si'
              ? 'ශිෂ්‍ය ලියාපදිංචි කිරීම්, මුළු ත්‍යාග ලකුණු, යොමු දත්ත සහ සහතික කිරීම.'
              : 'Institutional verification, student total points balance, referral rewards stats, and academic dossiers.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            {language === 'ta' ? 'மொத்த மாணவர்கள்: ' : 'Total Candidates: '}
            <span className="font-bold">{students.length}</span>
          </span>

          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>
              {language === 'ta' ? 'சுழற்சியில் உள்ள புள்ளிகள்: ' : 'Points Circulating: '}
              <span className="font-extrabold text-amber-800">{totalCirculatingPoints.toLocaleString()} pts</span>
            </span>
          </span>

          <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalReferralsCount} Referrals</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-student"
            type="text"
            placeholder={
              language === 'ta'
                ? 'மாணவர் பெயர், ஐடி, பாடசாலை அல்லது பரிந்துரைக் குறியீடு...'
                : 'Search student name, ID, school, or referral code...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">
              {language === 'ta' ? 'வரிசைப்படுத்து:' : 'Sort By:'}
            </span>
            <select
              id="sort-student-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="default">{language === 'ta' ? 'இயல்புநிலை' : 'Default'}</option>
              <option value="points_desc">
                🪙 {language === 'ta' ? 'அதிக புள்ளிகள் (Top Earners)' : 'Highest Points (Top Earners)'}
              </option>
              <option value="referrals_desc">
                👥 {language === 'ta' ? 'அதிக பரிந்துரைகள்' : 'Most Referrals'}
              </option>
              <option value="awards_desc">
                🏆 {language === 'ta' ? 'அதிக விருதுகள்' : 'Most Honors / Awards'}
              </option>
              <option value="name">🔤 {language === 'ta' ? 'பெயர் (A-Z)' : 'Name (A-Z)'}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Grade:</span>
            <select
              id="filter-student-grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Grades</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table with Total Points and Referral metrics */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Candidate & ID</th>
                <th className="px-5 py-3.5">Educational Institution</th>
                <th className="px-5 py-3.5">Grade Level</th>
                <th className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'ta' ? 'மொத்த புள்ளிகள் & பரிந்துரைகள்' : 'Total Points & Referrals'}</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-center">Enrolled Contests</th>
                <th className="px-5 py-3.5 text-center">Honors / Awards</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No student records match your query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const points = std.referralPoints !== undefined ? std.referralPoints : 25;
                  return (
                    <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {std.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{std.name}</p>
                            <p className="text-[11px] font-mono text-slate-400">
                              {std.studentId}
                            </p>
                            {std.referralCode && (
                              <span className="text-[10px] font-mono text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/50 inline-block mt-0.5">
                                Ref: {std.referralCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{std.institution}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {std.gradeLevel}
                      </td>

                      {/* Student Total Points & Referral Stats Column */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1.5 font-black text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                            <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            <span>{points} pts</span>
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                            <span className="text-emerald-700 font-semibold">👥 {std.totalReferrals || 0} refs</span>
                            <span>•</span>
                            <span className="text-blue-700">🔗 {std.sharesCount || 0} shares</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {std.competitionsEnrolled}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3 text-amber-600" />
                          {std.awardsCount}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant="emerald" dot>
                          Verified
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-view-student-${std.id}`}
                            onClick={() => {
                              setSelectedStudent(std);
                              setPointAdjustToast(null);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 border border-blue-200"
                            title="View Dossier & Manage Points"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'விபரம்' : 'Manage'}</span>
                          </button>
                          <button
                            id={`btn-delete-student-${std.id}`}
                            onClick={() => setStudentToDelete(std)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title={language === 'ta' ? 'மாணவரை நீக்குக' : language === 'si' ? 'ශිෂ්‍යයා ඉවත් කරන්න' : 'Remove Student'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details & Points Management Dossier Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Candidate Dossier: ${selectedStudent.name}`}
          subtitle={`Registration Reference: ${selectedStudent.studentId} • Points & Academic Oversight`}
        >
          <div className="space-y-5">
            {/* Candidate Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-700 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                {selectedStudent.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedStudent.name}
                  </h4>
                  <Badge variant="emerald" dot>
                    Active Candidate
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  {selectedStudent.institution} ({selectedStudent.gradeLevel})
                </p>
                <p className="text-xs text-slate-500 italic">
                  "{selectedStudent.bio || 'Registered academic competitor.'}"
                </p>
              </div>
            </div>

            {/* DEDICATED STUDENT TOTAL POINTS & REFERRAL MANAGEMENT PANEL */}
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50 border-2 border-amber-300 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Coins className="w-6 h-6 fill-amber-200" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                      {language === 'ta' ? 'மாணவர் மொத்த வெகுமதி புள்ளிகள்' : 'Candidate Total Reward Points'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-900">
                        {selectedStudent.referralPoints !== undefined ? selectedStudent.referralPoints : 25}
                      </span>
                      <span className="text-xs font-bold text-amber-700">Points (புள்ளிகள்)</span>
                    </div>
                  </div>
                </div>

                {/* Referral Code & Copy */}
                <div className="bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'ta' ? 'பரிந்துரைக் குறியீடு:' : 'Referral Code:'}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {selectedStudent.referralCode || `HNC-${selectedStudent.studentId.replace(/[^A-Z0-9]/g, '')}`}
                    </span>
                    <button
                      onClick={() => {
                        const code = selectedStudent.referralCode || `HNC-${selectedStudent.studentId.replace(/[^A-Z0-9]/g, '')}`;
                        navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                      title="Copy Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Referral Activity Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {language === 'ta' ? 'வெற்றிகரமான பரிந்துரைகள்' : 'Successful Referrals'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    👥 {selectedStudent.totalReferrals || 0} friends
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {language === 'ta' ? 'பகிர்வு எண்ணிக்கைகள்' : 'Links Shared'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    🔗 {selectedStudent.sharesCount || 0} times
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {language === 'ta' ? 'பரிந்துரைத்தவர்' : 'Referred By'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 truncate block">
                    {selectedStudent.referredBy || (language === 'ta' ? 'நேரடிப் பதிவு' : 'Direct')}
                  </span>
                </div>
              </div>

              {/* Admin Points Adjustment Controls */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {language === 'ta' ? 'நிர்வாக புள்ளி சரிசெய்தல் / போனஸ் புள்ளிகளை வழங்கு' : 'Admin Point Management / Award Bonus Points'}
                    </span>
                  </span>
                  {pointAdjustToast && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {pointAdjustToast}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Quick Grant:</span>
                  <button
                    disabled={isAdjustingPoints}
                    onClick={() => handleAdjustPoints(selectedStudent.id, 25, 'Quick bonus +25')}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 25 pts
                  </button>
                  <button
                    disabled={isAdjustingPoints}
                    onClick={() => handleAdjustPoints(selectedStudent.id, 50, 'Ambassador reward +50')}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 50 pts
                  </button>
                  <button
                    disabled={isAdjustingPoints}
                    onClick={() => handleAdjustPoints(selectedStudent.id, 100, 'Milestone award +100')}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 100 pts
                  </button>
                  <button
                    disabled={isAdjustingPoints}
                    onClick={() => handleAdjustPoints(selectedStudent.id, -25, 'Point correction -25')}
                    className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                  >
                    -25 pts
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <input
                    type="number"
                    placeholder="Custom pts (+/-)"
                    value={customPointsInput}
                    onChange={(e) => setCustomPointsInput(e.target.value)}
                    className="w-32 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    disabled={isAdjustingPoints || !customPointsInput}
                    onClick={() => {
                      const num = parseInt(customPointsInput, 10);
                      if (!isNaN(num) && num !== 0) {
                        handleAdjustPoints(selectedStudent.id, num, pointsReason || 'Admin adjustment');
                      }
                    }}
                    className="px-3 py-1 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Academic Dossier Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 border border-slate-200 rounded-lg space-y-2 bg-white">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Contact & Accreditation
                </span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStudent.email}</span>
                </div>
                {selectedStudent.username && (
                  <div className="flex items-center gap-2 text-slate-700 font-mono">
                    <span className="text-slate-400">@</span>
                    <span>Username: {selectedStudent.username}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStudent.phone || 'Not provided'}</span>
                </div>
                {selectedStudent.district && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400 font-bold">📍</span>
                    <span>District: {selectedStudent.district}</span>
                  </div>
                )}
                {selectedStudent.address && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400 font-bold">🏠</span>
                    <span>Address: {selectedStudent.address}</span>
                  </div>
                )}
                {selectedStudent.dateOfBirth && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400 font-bold">🎂</span>
                    <span>DOB: {selectedStudent.dateOfBirth}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Guardian: {selectedStudent.guardianName || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-lg space-y-2 bg-white">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Participation Metrics
                </span>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Active Competitions:</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.competitionsEnrolled}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Olympiad Awards:</span>
                  <span className="font-bold text-amber-700">
                    {selectedStudent.awardsCount} Honors
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Enrollment Date:</span>
                  <span className="font-mono text-slate-700">
                    {selectedStudent.createdAt}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                id="btn-dossier-delete"
                onClick={() => setStudentToDelete(selectedStudent)}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'மாணவரை நீக்குக' : language === 'si' ? 'ශිෂ්‍යයා ඉවත් කරන්න' : 'Remove Student Account'}</span>
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {studentToDelete && (
        <Modal
          isOpen={!!studentToDelete}
          onClose={() => !isDeleting && setStudentToDelete(null)}
          title={
            language === 'ta'
              ? 'மாணவர் கணக்கை நீக்குவதை உறுதிப்படுத்தவும்'
              : language === 'si'
              ? 'ශිෂ්‍ය ගිණුම ඉවත් කිරීම තහවුරු කරන්න'
              : 'Confirm Student Account Removal'
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-900">
                  {language === 'ta'
                    ? `${studentToDelete.name} (${studentToDelete.studentId}) மாணவர் கணக்கை நிச்சயமாக நீக்க விரும்புகிறீர்களா?`
                    : language === 'si'
                    ? `${studentToDelete.name} (${studentToDelete.studentId}) ශිෂ්‍ය ගිණුම ඉවත් කිරීමට ඔබට විශ්වාසද?`
                    : `Are you sure you want to permanently remove candidate ${studentToDelete.name} (${studentToDelete.studentId})?`}
                </p>
                <p className="text-[11px] text-red-700">
                  {language === 'ta'
                    ? 'இந்த நடவடிக்கை தரவுத்தளத்திலிருந்து மாணவர் பதிவு மற்றும் தொடர்புடைய விபரங்களை முழுமையாக நீக்கும்.'
                    : language === 'si'
                    ? 'මෙම ක්‍රියාව දත්ත සමුදායෙන් ශිෂ්‍ය වාර්තාව සම්පූර්ණයෙන්ම ඉවත් කරනු ඇත.'
                    : 'This action will completely remove the student record and login credentials from the database.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {language === 'ta' ? 'ரத்து செய்க' : language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>
              <button
                id="btn-confirm-delete-student"
                disabled={isDeleting}
                onClick={handleDeleteStudent}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeleting
                    ? (language === 'ta' ? 'நீக்கப்படுகிறது...' : language === 'si' ? 'ඉවත් කරමින්...' : 'Deleting...')
                    : (language === 'ta' ? 'ஆம், நீக்குக' : language === 'si' ? 'ඔව්, ඉවත් කරන්න' : 'Yes, Remove Candidate')}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

