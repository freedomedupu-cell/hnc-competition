import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Users,
  Search,
  School,
  Trophy,
  Mail,
  Phone,
  Eye,
  FileCheck,
  Coins,
  Gift,
  Share2,
  Shield,
  Clock,
} from 'lucide-react';

export const StudentInfoView: React.FC = () => {
  const { students, competitions, currentAdmin, language, memberships } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);

  const totalPoints = students.reduce(
    (acc, s) => acc + (s.referralPoints !== undefined ? s.referralPoints : 25),
    0
  );

  const filteredStudents = students.filter((std) => {
    return (
      std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (std.referralCode && std.referralCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>
              {language === 'ta'
                ? 'மாணவர் தகவல்கள் & புள்ளிகள் பட்டியல்'
                : 'Student Information & Candidate Roster'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'மாணவர் கல்வி விபரங்கள், மொத்த வெகுமதி புள்ளிகள் மற்றும் போட்டிப் பதிவுகள்.'
              : 'Academic records, total student reward points, and institutional affiliations.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            {language === 'ta' ? 'மொத்த மாணவர்கள்: ' : 'Candidates: '}
            <span className="font-bold">{students.length}</span>
          </div>

          <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>{totalPoints.toLocaleString()} pts</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-admin-students"
            type="text"
            placeholder={language === 'ta' ? 'மாணவர் பெயர், ஐடி, பாடசாலை...' : 'Search by candidate name, ID, school, code...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <span className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredStudents.length}</span> students
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Candidate Name & ID</th>
                <th className="px-5 py-3.5">School / Institution</th>
                <th className="px-5 py-3.5">Grade</th>
                <th className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'ta' ? 'புள்ளிகள்' : 'Total Points'}</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-center">Enrolled Contests</th>
                <th className="px-5 py-3.5 text-center">Olympiad Awards</th>
                <th className="px-5 py-3.5 text-center">Membership Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((std) => {
                const pts = std.referralPoints !== undefined ? std.referralPoints : 25;
                return (
                  <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {std.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{std.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {std.studentId}
                          </p>
                          {std.referralCode && (
                            <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 inline-block mt-0.5">
                              Ref: {std.referralCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{std.institution}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {std.gradeLevel}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs">
                          <Coins className="w-3 h-3 text-amber-500 fill-amber-400" />
                          <span>{pts} pts</span>
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {std.totalReferrals || 0} refs
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

                    <td className="px-5 py-3.5 text-center">
                      {(() => {
                        const mem = memberships.find((m) => m.studentId === std.id);
                        if (!mem || mem.status === 'inactive') {
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Inactive</span>;
                        }
                        if (mem.status === 'active') {
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span>;
                        }
                        if (mem.status === 'expiring_soon') {
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Expiring Soon</span>;
                        }
                        if (mem.status === 'expired') {
                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Expired</span>;
                        }
                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pending</span>;
                      })()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        id={`btn-admin-view-std-${std.id}`}
                        onClick={() => setSelectedStudent(std)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                      >
                        {language === 'ta' ? 'விபரம்' : 'Dossier'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Candidate Roster Record: ${selectedStudent.name}`}
          subtitle={`Student ID: ${selectedStudent.studentId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedStudent.name}</span>
                <Badge variant="emerald" dot>Verified Competitor</Badge>
              </div>
              <p className="text-slate-600">
                School: <strong className="text-slate-800">{selectedStudent.institution}</strong> ({selectedStudent.gradeLevel})
              </p>
              <p className="text-slate-500 italic">
                "{selectedStudent.bio || 'Candidate participating in HNC academic competitions.'}"
              </p>
            </div>

            {/* Points and Referral details */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5 fill-amber-200" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Reward Points</span>
                  <span className="text-lg font-black text-amber-900">
                    {selectedStudent.referralPoints !== undefined ? selectedStudent.referralPoints : 25} Points
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 block">Referral Code</span>
                <span className="font-mono font-bold text-xs text-slate-800">
                  {selectedStudent.referralCode || `HNC-${selectedStudent.studentId}`}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  👥 {selectedStudent.totalReferrals || 0} friends joined
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-slate-200 rounded-lg space-y-1 bg-white">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                <p className="text-slate-800 font-medium">{selectedStudent.email}</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg space-y-1 bg-white">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Guardian Contact</span>
                <p className="text-slate-800 font-medium">{selectedStudent.guardianName || 'Parent / Guardian'}</p>
              </div>
            </div>

            {/* Membership Details Card */}
            {(() => {
              const mem = memberships.find((m) => m.studentId === selectedStudent.id);
              return (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Monthly Membership Subscription</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border border-indigo-200 text-indigo-900">
                      {mem?.status || 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1 border-t border-indigo-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Valid Until</span>
                      <span className="font-bold text-slate-900">
                        {mem?.expiryDate ? new Date(mem.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Payment Reference</span>
                      <span className="font-mono text-slate-900 font-semibold">{mem?.paymentReference || 'None'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

