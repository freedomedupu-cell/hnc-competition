import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Competition, CompetitionParticipant, DbPayment, DbVerificationPhoto } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  School,
  Download,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Camera,
  Check,
  X,
  FileText,
  ExternalLink,
  ZoomIn,
} from 'lucide-react';

interface CompetitionParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: Competition | null;
}

type ModalTab = 'candidates' | 'payments' | 'verifications';

export const CompetitionParticipantsModal: React.FC<CompetitionParticipantsModalProps> = ({
  isOpen,
  onClose,
  competition,
}) => {
  const { payments, verificationPhotos, updatePaymentStatus } = useApp();
  const [activeTab, setActiveTab] = useState<ModalTab>('candidates');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  if (!competition) return null;

  const participants: CompetitionParticipant[] = competition.participants || [];
  const compPayments: DbPayment[] = payments.filter((p) => p.competitionId === competition.id);
  const compPhotos: DbVerificationPhoto[] = verificationPhotos.filter(
    (v) => v.competitionId === competition.id
  );

  const filteredParticipants = participants.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.studentName.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.school && p.school.toLowerCase().includes(term)) ||
      (p.grade && p.grade.toLowerCase().includes(term))
    );
  });

  const filteredPayments = compPayments.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.studentName && p.studentName.toLowerCase().includes(term)) ||
      p.studentId.toLowerCase().includes(term) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(term)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(term))
    );
  });

  const filteredPhotos = compPhotos.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      (v.studentName && v.studentName.toLowerCase().includes(term)) ||
      v.studentId.toLowerCase().includes(term)
    );
  });

  const uniqueSchools = new Set(participants.map((p) => p.school).filter(Boolean)).size;

  const handleExportCsv = () => {
    if (participants.length === 0) return;
    const headers = ['Student ID', 'Full Name', 'Email', 'Institution / School', 'Grade', 'Registered At'];
    const rows = participants.map((p) => [
      p.studentId,
      `"${p.studentName.replace(/"/g, '""')}"`,
      `"${p.email.replace(/"/g, '""')}"`,
      `"${(p.school || '').replace(/"/g, '""')}"`,
      `"${(p.grade || '').replace(/"/g, '""')}"`,
      p.registeredAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${competition.code || 'COMP'}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Management Desk: ${competition.title}`}
      subtitle={`Enrolled Candidates & Verification for ${competition.code || competition.id}`}
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-5">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Total Candidates</p>
              <p className="text-lg font-bold text-slate-900">{competition.enrolledCount || participants.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Fee Verifications</p>
              <p className="text-lg font-bold text-slate-900">{compPayments.length} Records</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide">Camera Photos</p>
                <p className="text-lg font-bold text-slate-900">{compPhotos.length} Verified</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={participants.length === 0}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'candidates'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Enrolled Candidates ({participants.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments & Fees ({compPayments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verifications')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'verifications'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Verifications ({compPhotos.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'candidates'
                ? 'Search candidate by name, school, email, or grade...'
                : activeTab === 'payments'
                ? 'Search payments by student name, transaction ID, or method...'
                : 'Search verification photos by candidate name or ID...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* 1. CANDIDATES TAB */}
        {activeTab === 'candidates' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Institution / School</th>
                    <th className="px-4 py-3">Grade Level</th>
                    <th className="px-4 py-3">Registration Date</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No participants registered yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Students register when the competition is Published or Registration Open.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p, idx) => (
                      <tr key={p.studentId || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {p.studentName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{p.studentName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{p.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{p.school || 'Verified Secondary School'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {p.grade || competition.grade || 'Enrolled'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="success" className="text-[10px]">
                            Enrolled
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Amount & Method</th>
                    <th className="px-4 py-3">Reference / Slip</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No payment records found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {competition.entryType === 'Free'
                            ? 'This is a Free assessment. No fee submission is required.'
                            : 'Payments made by candidates will appear here for verification.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((pay) => (
                      <tr key={pay.paymentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="font-semibold text-slate-900">{pay.studentName || 'Candidate'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">ID: {pay.studentId}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="font-bold text-slate-900">
                            {pay.currency || 'LKR'} {pay.amount.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-500">{pay.paymentMethod || 'IPG Online'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-mono text-[11px] text-slate-700">
                            {pay.transactionReference || pay.paymentId}
                          </div>
                          {pay.slipUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(pay.slipUrl!)}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                            >
                              <FileText className="w-3 h-3" />
                              <span>View Bank Slip</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Instant Gateway</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {pay.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          ) : pay.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertCircle className="w-3 h-3" />
                              Pending Verification
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <X className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pay.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => updatePaymentStatus(pay.paymentId, 'completed', 'Approved by Academic Admin')}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1"
                                title="Approve Payment"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}
                            {pay.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => updatePaymentStatus(pay.paymentId, 'rejected', 'Declined by Academic Admin')}
                                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                                title="Reject Payment"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CAMERA VERIFICATIONS TAB */}
        {activeTab === 'verifications' && (
          <div>
            {filteredPhotos.length === 0 ? (
              <div className="p-10 border border-slate-200 rounded-xl text-center text-slate-400 bg-white">
                <Camera className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No verification photos taken yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Candidates taking Exam competitions capture real-time webcam snapshots before entry.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
                {filteredPhotos.map((v) => (
                  <div
                    key={v.verificationId}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={v.photoUrl}
                        alt={`Verification of ${v.studentName || 'Candidate'}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(v.photoUrl)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        title="Zoom Photo"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {v.studentName || 'Candidate'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {v.studentId}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal footer */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>HNC Competition Governance • Real-time Cloud Synchronization</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Full Photo Zoom Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Verification Asset Inspection</h4>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center">
              <img
                src={previewPhotoUrl}
                alt="Enlarged inspection"
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
