import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { AdminUser } from '../../types';
import {
  UserCheck,
  Search,
  Plus,
  Mail,
  Building,
  Phone,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Key,
  Shield,
  Sparkles,
  AlertTriangle,
  User,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Layers,
  Filter,
} from 'lucide-react';

export interface SubjectOption {
  id: string;
  en: string;
  ta: string;
  dept: string;
}

export const ACADEMIC_SUBJECTS: SubjectOption[] = [
  { id: 'mathematics', en: 'Mathematics', ta: 'கணிதம்', dept: 'Department of Mathematics & Olympiads' },
  { id: 'science', en: 'Science', ta: 'விஞ்ஞானம்', dept: 'Department of Natural & Applied Sciences' },
  { id: 'english', en: 'English Language & Literature', ta: 'ஆங்கில மொழி & இலக்கியம்', dept: 'Department of English & Linguistics' },
  { id: 'tamil', en: 'Tamil Language & Literature', ta: 'தமிழ் மொழி & இலக்கியம்', dept: 'Department of Tamil Studies' },
  { id: 'ict', en: 'Information & Communication Technology (ICT)', ta: 'தகவல் மற்றும் தொடர்பாடல் தொழினுட்பம் (ICT)', dept: 'Department of Computing & ICT' },
  { id: 'commerce', en: 'Commerce & Accounting', ta: 'வணிகக் கல்வியும் கணக்கீடும்', dept: 'Department of Commerce & Accounting' },
  { id: 'history', en: 'History', ta: 'வரலாறு', dept: 'Department of Historical Studies' },
  { id: 'geography', en: 'Geography', ta: 'புவியியல்', dept: 'Department of Geography' },
  { id: 'health_pe', en: 'Health & Physical Education', ta: 'சுகாதாரமும் உடற்கல்வியும்', dept: 'Department of Health & Physical Education' },
  { id: 'civic_edu', en: 'Civic Education', ta: 'குடியியல் கல்வி', dept: 'Department of Civic Studies' },
  { id: 'general_knowledge', en: 'General Knowledge & Logic (GK)', ta: 'பொது அறிவு & ஏரணம் (Logic)', dept: 'Department of General Aptitude & Olympiads' },
  { id: 'technology', en: 'Science for Technology (SFT)', ta: 'தொழினுட்பவியலுக்கான விஞ்ஞானம் (SFT)', dept: 'Department of Technology Stream' },
  { id: 'arts', en: 'Arts & Aesthetics', ta: 'சித்திரமும் அழகியற்கலையும்', dept: 'Department of Fine Arts & Aesthetics' },
  { id: 'religion', en: 'Religion & Ethics', ta: 'சமயமும் நற்பண்புக் கல்வியும்', dept: 'Department of Religious & Ethical Studies' },
  { id: 'other', en: 'Other / Custom Subject', ta: 'வேறு பாடம் (Custom Subject)...', dept: 'Department of Specialized Academic Studies' },
];

export const GRADE_SCOPE_OPTIONS = [
  { id: 'all', en: 'All Grades (Grades 1 - 13)', ta: 'அனைத்து வகுப்புகளும் (1 - 13)' },
  { id: 'primary', en: 'Primary (Grades 1 - 5)', ta: 'ஆரம்பப் பிரிவு (தரம் 1 - 5)' },
  { id: 'junior', en: 'Junior Secondary (Grades 6 - 9)', ta: 'கீழ்ப் பிரிவு (தரம் 6 - 9)' },
  { id: 'ol', en: 'G.C.E. O/L (Grades 10 - 11)', ta: 'சாதாரண தரம் O/L (தரம் 10 - 11)' },
  { id: 'al', en: 'G.C.E. A/L (Grades 12 - 13)', ta: 'உயர் தரம் A/L (தரம் 12 - 13)' },
];

export const AdminManagement: React.FC = () => {
  const { admins, addAdmin, toggleAdminStatus, deleteAdmin, updateAdminDetails, language } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'subject_admin'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Visibility toggle state for table passwords: record ID -> boolean
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Admin selected for detailed credentials view modal
  const [selectedCredAdmin, setSelectedCredAdmin] = useState<AdminUser | null>(null);
  const [editPasswordInput, setEditPasswordInput] = useState('');
  const [passwordToast, setPasswordToast] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Edit subject state for selected admin in credentials modal
  const [editAdminType, setEditAdminType] = useState<'general' | 'subject_admin'>('general');
  const [editAssignedSubject, setEditAssignedSubject] = useState('');
  const [editCustomSubject, setEditCustomSubject] = useState('');
  const [editGradeScope, setEditGradeScope] = useState<string[]>(['all']);
  const [isUpdatingSubject, setIsUpdatingSubject] = useState(false);

  // Admin selected for deletion confirmation modal
  const [deleteTargetAdmin, setDeleteTargetAdmin] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Newly created credentials banner / modal state
  const [newlyCreatedAdmin, setNewlyCreatedAdmin] = useState<{
    name: string;
    email: string;
    username: string;
    password: string;
    staffId: string;
    department: string;
    adminType?: 'general' | 'subject_admin';
    assignedSubject?: string;
    assignedGrades?: string[];
  } | null>(null);

  // New admin form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    staffId: '',
    department: '',
    phone: '',
    status: 'active' as const,
    adminType: 'general' as 'general' | 'subject_admin',
    assignedSubject: '',
    customSubject: '',
    assignedSubjects: [] as string[],
    assignedGrades: ['all'] as string[],
  });

  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to copy text to clipboard with feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Toggle reveal password for a specific admin row
  const togglePasswordReveal = (adminId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [adminId]: !prev[adminId],
    }));
  };

  // Generate strong random password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'Adm@';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
    setShowFormPassword(true);
  };

  // Dynamic list of subjects from actual registered admins plus common presets
  const dynamicAdminSubjects = useMemo(() => {
    return Array.from(
      new Set([
        ...admins.map((a) => a.assignedSubject?.trim()).filter(Boolean) as string[],
        'Mathematics',
        'Science',
        'ICT',
        'Tamil',
        'English',
        'Commerce',
        'History',
      ])
    ).sort();
  }, [admins]);

  const filteredAdmins = admins.filter((admin) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      admin.name.toLowerCase().includes(term) ||
      admin.email.toLowerCase().includes(term) ||
      (admin.username && admin.username.toLowerCase().includes(term)) ||
      admin.department.toLowerCase().includes(term) ||
      admin.staffId.toLowerCase().includes(term) ||
      (admin.assignedSubject && admin.assignedSubject.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all' ? true : admin.status === statusFilter;

    const matchesType =
      typeFilter === 'all'
        ? true
        : typeFilter === 'subject_admin'
        ? admin.adminType === 'subject_admin' || Boolean(admin.assignedSubject)
        : admin.adminType !== 'subject_admin' && !admin.assignedSubject;

    const matchesSubject =
      subjectFilter === 'all'
        ? true
        : (admin.assignedSubject && (admin.assignedSubject.toLowerCase() === subjectFilter.toLowerCase() || admin.assignedSubject.toLowerCase().includes(subjectFilter.toLowerCase()))) ||
          (admin.assignedSubjects && admin.assignedSubjects.some((s) => s.toLowerCase() === subjectFilter.toLowerCase() || s.toLowerCase().includes(subjectFilter.toLowerCase())));

    return matchesSearch && matchesStatus && matchesType && matchesSubject;
  });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.staffId.trim() || !formData.department.trim()) {
      setFormError('Please complete all required fields.');
      return;
    }

    // Resolve typed subject name and grade if subject admin
    let resolvedSubject = '';
    let resolvedGrades: string[] = [];
    if (formData.adminType === 'subject_admin') {
      resolvedSubject = formData.assignedSubject.trim();
      if (!resolvedSubject) {
        setFormError(
          language === 'ta'
            ? 'தயவுசெய்து பாடத்தின் பெயரை தட்டச்சு செய்யவும் (Please type the subject name).'
            : 'Please type the assigned subject name.'
        );
        return;
      }
      const rawGrade = (formData.assignedGrades[0] || '').trim();
      resolvedGrades = [rawGrade || 'All Grades'];
    }

    const assignedPassword = formData.password.trim() || `Admin@${Math.floor(100000 + Math.random() * 900000)}`;
    if (assignedPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const assignedUsername = (formData.username.trim() || formData.staffId.trim() || formData.email.trim().split('@')[0]);

    try {
      await addAdmin({
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: assignedUsername,
        password: assignedPassword,
        staffId: formData.staffId.trim(),
        department: formData.department.trim(),
        phone: formData.phone.trim() || undefined,
        status: formData.status,
        adminType: formData.adminType,
        assignedSubject: resolvedSubject,
        assignedSubjects: resolvedSubject ? [resolvedSubject, ...formData.assignedSubjects.filter((s) => s !== resolvedSubject)] : [],
        assignedGrades: resolvedGrades,
      });

      // Show credentials dialog for Super Admin so they never lose the password
      setNewlyCreatedAdmin({
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: assignedUsername,
        password: assignedPassword,
        staffId: formData.staffId.trim(),
        department: formData.department.trim(),
        adminType: formData.adminType,
        assignedSubject: resolvedSubject,
        assignedGrades: resolvedGrades,
      });

      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        staffId: '',
        department: '',
        phone: '',
        status: 'active',
        adminType: 'general',
        assignedSubject: '',
        customSubject: '',
        assignedSubjects: [],
        assignedGrades: ['all'],
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create admin in Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetAdmin) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdmin(deleteTargetAdmin.id);
      setDeleteTargetAdmin(null);
    } catch (err: any) {
      setDeleteError('Error deleting admin: ' + (err.message || 'Check network.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const openCredModal = (admin: AdminUser) => {
    setSelectedCredAdmin(admin);
    const resolvedType = admin.adminType || (admin.assignedSubject ? 'subject_admin' : 'general');
    setEditAdminType(resolvedType);
    setEditAssignedSubject(admin.assignedSubject || '');
    setEditCustomSubject('');
    setEditGradeScope(admin.assignedGrades && admin.assignedGrades.length > 0 ? admin.assignedGrades : ['All Grades']);
    setEditPasswordInput('');
    setPasswordToast(null);
  };

  const handleUpdateSubjectAssignment = async () => {
    if (!selectedCredAdmin) return;
    setIsUpdatingSubject(true);
    try {
      const finalSubject = editAdminType === 'subject_admin' ? editAssignedSubject.trim() : '';

      await updateAdminDetails(selectedCredAdmin.id, {
        adminType: editAdminType,
        assignedSubject: finalSubject,
        assignedSubjects: finalSubject ? [finalSubject] : [],
        assignedGrades: editGradeScope,
      });

      setSelectedCredAdmin({
        ...selectedCredAdmin,
        adminType: editAdminType,
        assignedSubject: finalSubject,
        assignedSubjects: finalSubject ? [finalSubject] : [],
        assignedGrades: editGradeScope,
      });

      setPasswordToast(
        language === 'ta'
          ? 'நிர்வாகியின் பாடம் சார்ந்த பொறுப்பு வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது!'
          : 'Subject specialization assignment updated successfully!'
      );
      setTimeout(() => setPasswordToast(null), 3500);
    } catch (err: any) {
      setPasswordToast(err.message || 'Failed to update subject specialization');
    } finally {
      setIsUpdatingSubject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-700" />
            <span>{language === 'ta' ? 'நிர்வாகிகள் மேலாண்மை (Admin Management)' : 'Admin Management'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'நிர்வாகிகளை உருவாக்குதல், கடவுச்சொல்/பயனர்பெயர் பார்த்தல் மற்றும் கணக்குகளை நீக்குதல்.'
              : 'Create, inspect credentials (username/password), monitor and manage institutional administrators.'}
          </p>
        </div>

        <button
          id="btn-add-admin"
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              username: '',
              password: `Admin@${Math.floor(100000 + Math.random() * 900000)}`,
              staffId: `HNC-ADM-${Math.floor(1000 + Math.random() * 9000)}`,
              department: 'Academics & Examinations',
              phone: '',
              status: 'active',
              adminType: 'general',
              assignedSubject: '',
              customSubject: '',
              assignedSubjects: [],
              assignedGrades: ['all'],
            });
            setShowFormPassword(true);
            setFormError('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ta' ? '+ புதிய நிர்வாகியைச் சேர்க்க' : '+ Add New Admin'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-admin"
            type="text"
            placeholder={language === 'ta' ? 'பெயர், மின்னஞ்சல், பாடம், Staff ID...' : 'Search by name, email, subject, staff ID...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* Admin Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">{language === 'ta' ? 'வகை:' : 'Type:'}</span>
            <select
              id="filter-admin-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="all">All Roles ({admins.length})</option>
              <option value="general">🏛️ General Admins</option>
              <option value="subject_admin">📚 Subject Admins (பாடம் சார்ந்த)</option>
            </select>
          </div>

          {/* Subject Filter (Dynamic) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">{language === 'ta' ? 'பாடம்:' : 'Subject:'}</span>
            <select
              id="filter-admin-subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="all">All Subjects (அனைத்துப் பாடங்கள்)</option>
              {dynamicAdminSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">{language === 'ta' ? 'நிலை:' : 'Status:'}</span>
            <select
              id="filter-admin-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Admin & Staff ID</th>
                <th className="px-4 py-3.5">Role & Subject (பாடம்)</th>
                <th className="px-4 py-3.5">Username / Login ID</th>
                <th className="px-4 py-3.5">Password (கடவுச்சொல்)</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    {language === 'ta' ? 'நிர்வாகிகள் எவரும் கிடைக்கவில்லை.' : 'No administrators found matching your search.'}
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin, idx) => {
                  const isRevealed = Boolean(revealedPasswords[admin.id]);
                  const displayPassword = admin.initialPassword || 'Admin@2026';
                  const displayUsername = admin.username || admin.staffId || admin.email.split('@')[0];

                  return (
                    <tr key={admin.id ? `${admin.id}-${idx}` : `admin-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name and Staff ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{admin.name}</p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {admin.staffId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Subject Specialization */}
                      <td className="px-4 py-3.5">
                        {admin.adminType === 'subject_admin' || Boolean(admin.assignedSubject) ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
                              <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{admin.assignedSubject || 'Subject Admin'}</span>
                            </span>
                            {admin.assignedGrades && admin.assignedGrades.length > 0 && !admin.assignedGrades.includes('all') && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium pl-1">
                                <GraduationCap className="w-3 h-3 text-purple-500 shrink-0" />
                                <span>
                                  {admin.assignedGrades
                                    .map((g) => GRADE_SCOPE_OPTIONS.find((opt) => opt.id === g)?.ta || g)
                                    .join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{language === 'ta' ? 'பொது நிர்வாகி' : 'General Admin'}</span>
                          </span>
                        )}
                      </td>

                      {/* Username & Email with Copy */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-blue-900 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                              {displayUsername}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(displayUsername, `user-${admin.id}`)}
                              title="Copy Username"
                              className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            >
                              {copiedKey === `user-${admin.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{admin.email}</p>
                        </div>
                      </td>

                      {/* Password with Eye Reveal & Copy */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 w-fit">
                          <span className="font-mono text-[11px] font-semibold text-slate-800">
                            {isRevealed ? displayPassword : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(admin.id)}
                            title={isRevealed ? 'Hide Password' : 'Show Password (கடவுச்சொல்லைக் காட்டு)'}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(displayPassword, `pass-${admin.id}`)}
                            title="Copy Password"
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            {copiedKey === `pass-${admin.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{admin.department}</span>
                          </div>
                          {admin.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Phone className="w-3 h-3" />
                              <span>{admin.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant={admin.status === 'active' ? 'emerald' : 'slate'}
                          dot
                        >
                          {admin.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Full Credentials Modal Button */}
                          <button
                            type="button"
                            onClick={() => openCredModal(admin)}
                            title="View Full Credentials & Login Card"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                          </button>

                          {/* Toggle Active / Inactive Status */}
                          <button
                            id={`btn-toggle-status-${admin.id}`}
                            onClick={() => toggleAdminStatus(admin.id)}
                            title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                            className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                              admin.status === 'active'
                                ? 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Delete Admin Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetAdmin(admin)}
                            title="Delete Administrator (கணக்கை நீக்கு)"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add New Admin Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={language === 'ta' ? 'புதிய நிர்வாகியை உருவாக்கு (Create Admin)' : 'Accredit New Competition Admin'}
        subtitle="Provision an academic staff member with login credentials & permissions."
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          {/* Admin Type / Role Scope Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>{language === 'ta' ? 'நிர்வாகி வகை (Administrator Role & Scope) *' : 'Administrator Role & Scope *'}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option A: General Admin */}
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    adminType: 'general',
                    department: prev.department.includes('Department of') ? 'Academics & Examinations' : prev.department,
                  }));
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  formData.adminType === 'general'
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.adminType === 'general' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900">
                      {language === 'ta' ? 'பொது நிர்வாகி (General Admin)' : 'General Administrator'}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {language === 'ta'
                      ? 'அனைத்துப் பாடங்கள், பரீட்சைகள் மற்றும் மாணவர்களுக்கான முழு நிர்வாக அதிகாரம்.'
                      : 'Full administrative authority across all subjects and Olympiads.'}
                  </p>
                </div>
              </button>

              {/* Option B: Subject-Specific Admin */}
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => {
                    const defaultSub = prev.assignedSubject || 'mathematics';
                    const subObj = ACADEMIC_SUBJECTS.find((s) => s.id === defaultSub);
                    return {
                      ...prev,
                      adminType: 'subject_admin',
                      assignedSubject: defaultSub,
                      department: subObj ? subObj.dept : 'Department of Specialized Studies',
                    };
                  });
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  formData.adminType === 'subject_admin'
                    ? 'bg-purple-50/80 border-purple-500 shadow-xs ring-1 ring-purple-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.adminType === 'subject_admin' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-purple-950">
                      {language === 'ta' ? 'பாடம் சார்ந்த நிர்வாகி (Subject Admin)' : 'Subject Specialist Admin'}
                    </p>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-800">
                      {language === 'ta' ? 'பாடம் சார்ந்தது' : 'Subject'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {language === 'ta'
                      ? 'குறிப்பிட்ட பாடம் மற்றும் துறை சார்ந்த வினா வங்கிகள், போட்டிகளை வழிநடத்துவார்.'
                      : 'Dedicated admin for specific subject question banks, grading & competitions.'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Subject Specialist Configuration Panel (Visible when Subject Admin selected) */}
          {formData.adminType === 'subject_admin' && (
            <div className="p-3.5 bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border border-purple-200 rounded-xl space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>{language === 'ta' ? 'பாடம் சார்ந்த விபரங்கள் (Subject Specialization)' : 'Assigned Subject Specialization'}</span>
                </span>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                  {language === 'ta' ? 'பாடம் சார்ந்த அதிகாரம்' : 'Subject Specialist'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Primary Subject Input (Type Subject Name) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      {language === 'ta' ? 'பாடத்தின் பெயர் (Type Subject Name) *' : 'Assigned Subject Name *'}
                    </label>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded">
                      {language === 'ta' ? 'தட்டச்சு செய்யவும்' : 'Type freely'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="input-admin-assigned-subject"
                      type="text"
                      list="admin-subject-suggestions"
                      placeholder={language === 'ta' ? 'எ.கா: கணிதம், விஞ்ஞானம், ICT, தமிழ்...' : 'e.g. Mathematics, Science, ICT, Tamil, Commerce...'}
                      value={formData.assignedSubject}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          assignedSubject: val,
                          department: prev.department || `${val} Department`,
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                      required
                    />
                    <datalist id="admin-subject-suggestions">
                      {ACADEMIC_SUBJECTS.filter((s) => s.id !== 'other').map((sub) => (
                        <option key={sub.id} value={sub.en}>
                          {sub.ta}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Grade Scope Input (Type Grade Scope) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                      <span>{language === 'ta' ? 'வகுப்பு வரம்பு (Type Grade Scope)' : 'Grade Scope Assignment'}</span>
                    </label>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded">
                      {language === 'ta' ? 'தட்டச்சு செய்யவும்' : 'Type freely'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="input-admin-grade-scope"
                      type="text"
                      list="admin-grade-suggestions"
                      placeholder={language === 'ta' ? 'எ.கா: Grade 10, Grade 6-11...' : 'e.g. Grade 10, Grade 6-11...'}
                      value={formData.assignedGrades[0] || ''}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          assignedGrades: [e.target.value],
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                    />
                    <datalist id="admin-grade-suggestions">
                      <option value="Grade 6-11 (Junior & O/L)" />
                      <option value="Grade 12-13 (A/L)" />
                      <option value="Grade 10" />
                      <option value="Grade 11 (O/L)" />
                      <option value="Grade 6" />
                      <option value="Grade 7" />
                      <option value="Grade 8" />
                      <option value="Grade 9" />
                      <option value="Grade 1-5 (Primary / புலமைப்பரிசில்)" />
                    </datalist>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Full Name (முழுப் பெயர்) *</label>
              <input
                id="input-admin-name"
                type="text"
                placeholder="Full Name (முழுப் பெயர்)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Official Email (மின்னஞ்சல்) *</label>
              <input
                id="input-admin-email"
                type="email"
                placeholder="admin.email@hnceduhub.lk"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Username / Login ID (பயனர்பெயர்)</label>
              <input
                id="input-admin-username"
                type="text"
                placeholder="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Staff Accreditation ID *</label>
              <input
                id="input-admin-staffid"
                type="text"
                placeholder="Staff ID (e.g. ADM-001)"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Department / Division (துறை) *</label>
              <input
                id="input-admin-dept"
                type="text"
                placeholder="e.g. Pure & Applied Mathematics"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Phone Contact (Optional)</label>
              <input
                id="input-admin-phone"
                type="text"
                placeholder="e.g. +94 77 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Password input with show/hide and auto-generate */}
            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Initial Access Password (கடவுச்சொல்) *</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Generate Strong Password</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="input-admin-password"
                  type={showFormPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters (e.g. Admin@2026)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  title={showFormPassword ? 'Hide' : 'Show'}
                >
                  {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'ta'
                  ? 'இந்த கடவுச்சொல்லை நீங்கள் பிறகு எப்போது வேண்டுமானாலும் இந்த அட்டவணையில் பார்க்கலாம்.'
                  : 'You will be able to inspect and copy this password anytime from the Admin Management table.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-admin"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Admin...</span>
                </>
              ) : (
                <span>Confirm Accreditation (நிர்வாகியைச் சேர்)</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Newly Created Credentials Success Modal */}
      {newlyCreatedAdmin && (
        <Modal
          isOpen={Boolean(newlyCreatedAdmin)}
          onClose={() => setNewlyCreatedAdmin(null)}
          title="🎉 Admin Account Created Successfully!"
          subtitle="Login credentials have been provisioned in Firebase Firestore."
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{newlyCreatedAdmin.name}</span>
                </p>
                {newlyCreatedAdmin.adminType === 'subject_admin' || newlyCreatedAdmin.assignedSubject ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                    <BookOpen className="w-3 h-3 text-purple-700" />
                    <span>{language === 'ta' ? 'பாடம்' : 'Subject'}: {newlyCreatedAdmin.assignedSubject}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    <Shield className="w-3 h-3 text-blue-700" />
                    <span>{language === 'ta' ? 'பொது நிர்வாகி' : 'General Admin'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-800">
                {language === 'ta'
                  ? 'நிர்வாகியின் உள்நுழைவு விபரங்கள் கீழே கொடுக்கப்பட்டுள்ளன. இவற்றை இப்போதே நகலெடுத்துக் கொள்ளலாம் அல்லது அட்டவணையில் எப்போது வேண்டுமானாலும் பார்க்கலாம்.'
                  : 'You can copy these login details below to share with the admin. You can also view them anytime in the table.'}
              </p>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Login Username:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{newlyCreatedAdmin.username}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(newlyCreatedAdmin.username, 'new-user')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  >
                    {copiedKey === 'new-user' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Login Email:</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-300">{newlyCreatedAdmin.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(newlyCreatedAdmin.email, 'new-email')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  >
                    {copiedKey === 'new-email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">{newlyCreatedAdmin.password}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(newlyCreatedAdmin.password, 'new-pass')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  >
                    {copiedKey === 'new-pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Staff ID:</span>
                <span className="text-slate-300">{newlyCreatedAdmin.staffId}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Role / Scope:</span>
                <span className={newlyCreatedAdmin.adminType === 'subject_admin' ? 'text-purple-300 font-bold' : 'text-blue-300 font-bold'}>
                  {newlyCreatedAdmin.adminType === 'subject_admin'
                    ? `Subject Admin (${newlyCreatedAdmin.assignedSubject || 'Specialized'})`
                    : 'General Administrator'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-300">{newlyCreatedAdmin.department}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const subjectLine = newlyCreatedAdmin.assignedSubject ? `\nSpecialized Subject: ${newlyCreatedAdmin.assignedSubject}` : '';
                  const portalTitle = newlyCreatedAdmin.adminType === 'subject_admin'
                    ? 'Subject Admin Portal (Quiz, Exam, Competition)'
                    : 'Admin Dashboard';
                  const payload = `=== HNC Admin Login Credentials ===\nName: ${newlyCreatedAdmin.name}\nRole: ${newlyCreatedAdmin.adminType === 'subject_admin' ? 'Subject-Specific Admin' : 'General Admin'}${subjectLine}\nUsername: ${newlyCreatedAdmin.username}\nEmail: ${newlyCreatedAdmin.email}\nPassword: ${newlyCreatedAdmin.password}\nStaff ID: ${newlyCreatedAdmin.staffId}\nDepartment: ${newlyCreatedAdmin.department}\nPortal: ${portalTitle}`;
                  handleCopy(payload, 'copy-all-new');
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5"
              >
                {copiedKey === 'copy-all-new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{language === 'ta' ? 'அனைத்து விபரங்களையும் நகலெடு (Copy All)' : 'Copy All Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={() => setNewlyCreatedAdmin(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Full Credentials Modal for any Existing Admin */}
      {selectedCredAdmin && (
        <Modal
          isOpen={Boolean(selectedCredAdmin)}
          onClose={() => setSelectedCredAdmin(null)}
          title={`Admin Credentials: ${selectedCredAdmin.name}`}
          subtitle="Official login parameters and portal access keys."
        >
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Username:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">
                    {selectedCredAdmin.username || selectedCredAdmin.staffId || selectedCredAdmin.email.split('@')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        selectedCredAdmin.username || selectedCredAdmin.staffId || selectedCredAdmin.email.split('@')[0],
                        'view-user'
                      )
                    }
                    className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  >
                    {copiedKey === 'view-user' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Email:</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-300">{selectedCredAdmin.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedCredAdmin.email, 'view-email')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  >
                    {copiedKey === 'view-email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">
                    {selectedCredAdmin.initialPassword || 'Admin@2026'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(selectedCredAdmin.initialPassword || 'Admin@2026', 'view-pass')
                    }
                    className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  >
                    {copiedKey === 'view-pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Staff ID:</span>
                <span className="text-slate-300">{selectedCredAdmin.staffId}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Role / Scope:</span>
                <span className={selectedCredAdmin.adminType === 'subject_admin' || selectedCredAdmin.assignedSubject ? 'text-purple-300 font-bold' : 'text-blue-300 font-bold'}>
                  {selectedCredAdmin.adminType === 'subject_admin' || selectedCredAdmin.assignedSubject
                    ? `Subject Admin (${selectedCredAdmin.assignedSubject || 'Specialized'})`
                    : 'General Administrator'}
                </span>
              </div>

              {(selectedCredAdmin.adminType === 'subject_admin' || selectedCredAdmin.assignedSubject) && (
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Assigned Subject:</span>
                  <span className="text-purple-300 font-bold">{selectedCredAdmin.assignedSubject || 'General'}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-300">{selectedCredAdmin.department}</span>
              </div>
            </div>

            {/* Subject Assignment Management */}
            <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-700" />
                  <span>{language === 'ta' ? 'பாடம் மற்றும் வகை மேலாண்மை (Subject Assignment)' : 'Subject Specialization Assignment'}</span>
                </span>
                <span className="text-[10px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                  {editAdminType === 'subject_admin' ? 'Subject Admin' : 'General Admin'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Role Type (வகை):</label>
                  <select
                    value={editAdminType}
                    onChange={(e) => setEditAdminType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                  >
                    <option value="general">🏛️ General Admin (பொது நிர்வாகி)</option>
                    <option value="subject_admin">📚 Subject Admin (பாடம் சார்ந்த நிர்வாகி)</option>
                  </select>
                </div>

                {editAdminType === 'subject_admin' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">Assigned Subject (பாடத்தின் பெயர்):</label>
                      <span className="text-[10px] text-purple-700 font-bold">Type freely</span>
                    </div>
                    <input
                      type="text"
                      list="admin-edit-subject-suggestions"
                      value={editAssignedSubject}
                      onChange={(e) => setEditAssignedSubject(e.target.value)}
                      placeholder="e.g. Mathematics, Science, ICT, Tamil, Commerce..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                    />
                    <datalist id="admin-edit-subject-suggestions">
                      {ACADEMIC_SUBJECTS.filter((s) => s.id !== 'other').map((sub) => (
                        <option key={sub.id} value={sub.en}>
                          {sub.ta}
                        </option>
                      ))}
                    </datalist>
                  </div>
                )}
              </div>

              {editAdminType === 'subject_admin' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">Grade Scope (வகுப்பு வரம்பு):</label>
                    <span className="text-[10px] text-purple-700 font-bold">Type freely</span>
                  </div>
                  <input
                    type="text"
                    list="admin-edit-grade-suggestions"
                    value={editGradeScope[0] || ''}
                    onChange={(e) => setEditGradeScope([e.target.value])}
                    placeholder="e.g. Grade 10, Grade 6-11, All Grades..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                  />
                  <datalist id="admin-edit-grade-suggestions">
                    <option value="Grade 6-11 (Junior & O/L)" />
                    <option value="Grade 12-13 (A/L)" />
                    <option value="Grade 10" />
                    <option value="Grade 11 (O/L)" />
                    <option value="Grade 6" />
                    <option value="Grade 7" />
                    <option value="Grade 8" />
                    <option value="Grade 9" />
                    <option value="Grade 1-5 (Primary / புலமைப்பரிசில்)" />
                  </datalist>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={isUpdatingSubject}
                  onClick={handleUpdateSubjectAssignment}
                  className="px-3 py-1.5 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isUpdatingSubject ? 'Saving...' : language === 'ta' ? 'பாடத்தைப் புதுப்பி (Update Subject)' : 'Update Subject Assignment'}</span>
                </button>
              </div>
            </div>

            {/* Super Admin Password Change Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-blue-700" />
                  <span>{language === 'ta' ? 'கடவுச்சொல்லை மாற்று (Change Password)' : 'Change Admin Password'}</span>
                </span>
              </div>

              {passwordToast && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{passwordToast}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter new password (min 6 chars)..."
                  value={editPasswordInput}
                  onChange={(e) => setEditPasswordInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  disabled={isUpdatingPassword || !editPasswordInput.trim()}
                  onClick={async () => {
                    if (!selectedCredAdmin || !editPasswordInput.trim()) return;
                    if (editPasswordInput.trim().length < 6) {
                      setPasswordToast(language === 'ta' ? 'குறைந்தது 6 எழுத்துக்கள் தேவை.' : 'Min 6 characters required.');
                      return;
                    }
                    setIsUpdatingPassword(true);
                    try {
                      await updateAdminDetails(selectedCredAdmin.id, {
                        initialPassword: editPasswordInput.trim(),
                      });
                      setSelectedCredAdmin({
                        ...selectedCredAdmin,
                        initialPassword: editPasswordInput.trim(),
                      });
                      setPasswordToast(
                        language === 'ta' ? 'கடவுச்சொல் மாற்றப்பட்டது!' : 'Password updated successfully!'
                      );
                      setEditPasswordInput('');
                      setTimeout(() => setPasswordToast(null), 3000);
                    } catch (err: any) {
                      setPasswordToast(err.message || 'Failed to update password');
                    } finally {
                      setIsUpdatingPassword(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isUpdatingPassword ? 'Saving...' : language === 'ta' ? 'சேமி' : 'Save'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const usr = selectedCredAdmin.username || selectedCredAdmin.staffId || selectedCredAdmin.email.split('@')[0];
                  const pass = selectedCredAdmin.initialPassword || 'Admin@2026';
                  const subjectLine = selectedCredAdmin.assignedSubject ? `\nSpecialized Subject: ${selectedCredAdmin.assignedSubject}` : '';
                  const portalTitle = selectedCredAdmin.adminType === 'subject_admin'
                    ? 'Subject Admin Portal (Quiz, Exam, Competition)'
                    : 'Admin Dashboard';
                  const payload = `=== HNC Admin Login Credentials ===\nName: ${selectedCredAdmin.name}\nRole: ${selectedCredAdmin.adminType === 'subject_admin' ? 'Subject-Specific Admin' : 'General Admin'}${subjectLine}\nUsername: ${usr}\nEmail: ${selectedCredAdmin.email}\nPassword: ${pass}\nStaff ID: ${selectedCredAdmin.staffId}\nDepartment: ${selectedCredAdmin.department}\nPortal: ${portalTitle}`;
                  handleCopy(payload, 'copy-all-view');
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5"
              >
                {copiedKey === 'copy-all-view' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{language === 'ta' ? 'அனைத்து விபரங்களையும் நகலெடு (Copy All)' : 'Copy All Login Info'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCredAdmin(null);
                  setEditPasswordInput('');
                  setPasswordToast(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Admin Confirmation Modal */}
      {deleteTargetAdmin && (
        <Modal
          isOpen={Boolean(deleteTargetAdmin)}
          onClose={() => setDeleteTargetAdmin(null)}
          title={language === 'ta' ? 'நிர்வாகியை நீக்க உறுதிப்படுத்தவும்' : 'Confirm Admin Deletion'}
          subtitle="Permanently revoke administrator privileges and remove account."
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-rose-900">
                <p className="font-bold">
                  {language === 'ta'
                    ? `நிர்வாகி "${deleteTargetAdmin.name}" (${deleteTargetAdmin.staffId}) கணக்கை நிச்சயமாக நீக்க விரும்புகிறீர்களா?`
                    : `Are you sure you want to delete "${deleteTargetAdmin.name}" (${deleteTargetAdmin.staffId})?`}
                </p>
                <p className="text-rose-800/80">
                  {language === 'ta'
                    ? 'இந்த செயல்முறையை மாற்ற முடியாது. இந்த நிர்வாகியின் Firestore கணக்கு மற்றும் உள்நுழைவு அனுமதி முற்றிலுமாக நீக்கப்படும்.'
                    : 'This action is irreversible. The administrator credentials and Firestore account will be permanently revoked.'}
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-lg text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetAdmin(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'ஆம், நீக்குக (Delete Admin)' : 'Yes, Delete Administrator'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
