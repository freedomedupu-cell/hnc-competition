import React, { useState } from 'react';
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
} from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const { admins, addAdmin, toggleAdminStatus, deleteAdmin, language } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Visibility toggle state for table passwords: record ID -> boolean
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Admin selected for detailed credentials view modal
  const [selectedCredAdmin, setSelectedCredAdmin] = useState<AdminUser | null>(null);

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

  const filteredAdmins = admins.filter((admin) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      admin.name.toLowerCase().includes(term) ||
      admin.email.toLowerCase().includes(term) ||
      (admin.username && admin.username.toLowerCase().includes(term)) ||
      admin.department.toLowerCase().includes(term) ||
      admin.staffId.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'all' ? true : admin.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.staffId.trim() || !formData.department.trim()) {
      setFormError('Please complete all required fields.');
      return;
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
      });

      // Show credentials dialog for Super Admin so they never lose the password
      setNewlyCreatedAdmin({
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: assignedUsername,
        password: assignedPassword,
        staffId: formData.staffId.trim(),
        department: formData.department.trim(),
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-admin"
            type="text"
            placeholder={language === 'ta' ? 'பெயர், மின்னஞ்சல், துறை, Staff ID கொண்டு தேடுக...' : 'Search by name, email, username, staff ID...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">{language === 'ta' ? 'நிலை:' : 'Status:'}</span>
          <select
            id="filter-admin-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Admins ({admins.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Admin & Staff ID</th>
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
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
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
                            onClick={() => setSelectedCredAdmin(admin)}
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
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{newlyCreatedAdmin.name} ({newlyCreatedAdmin.department})</span>
              </p>
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

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Staff ID:</span>
                <span className="text-slate-300">{newlyCreatedAdmin.staffId}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const payload = `=== HNC Admin Login Credentials ===\nName: ${newlyCreatedAdmin.name}\nUsername: ${newlyCreatedAdmin.username}\nEmail: ${newlyCreatedAdmin.email}\nPassword: ${newlyCreatedAdmin.password}\nStaff ID: ${newlyCreatedAdmin.staffId}\nPortal: Admin Dashboard`;
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

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-300">{selectedCredAdmin.department}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const usr = selectedCredAdmin.username || selectedCredAdmin.staffId || selectedCredAdmin.email.split('@')[0];
                  const pass = selectedCredAdmin.initialPassword || 'Admin@2026';
                  const payload = `=== HNC Admin Login Credentials ===\nName: ${selectedCredAdmin.name}\nUsername: ${usr}\nEmail: ${selectedCredAdmin.email}\nPassword: ${pass}\nStaff ID: ${selectedCredAdmin.staffId}\nDepartment: ${selectedCredAdmin.department}\nPortal: Admin Dashboard`;
                  handleCopy(payload, 'copy-all-view');
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5"
              >
                {copiedKey === 'copy-all-view' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{language === 'ta' ? 'அனைத்து விபரங்களையும் நகலெடு (Copy All)' : 'Copy All Login Info'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCredAdmin(null)}
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
