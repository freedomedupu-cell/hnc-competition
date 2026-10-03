import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  Save,
  ShieldCheck,
  Calendar,
  Award,
} from 'lucide-react';

export const AdminProfileView: React.FC = () => {
  const { currentAdmin, updateAdminProfile } = useApp();
  const [formData, setFormData] = useState({
    name: currentAdmin.name,
    email: currentAdmin.email,
    phone: currentAdmin.phone || '',
    department: currentAdmin.department,
  });
  const [successToast, setSuccessToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
    });
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-700" />
          <span>Academic Admin Profile</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Institutional credentials, contact information, and departmental assignment details.
        </p>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile credentials updated successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary Identity Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-blue-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {currentAdmin.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{currentAdmin.name}</h2>
            <p className="text-xs text-blue-700 font-semibold mt-0.5">Academic Lead</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">{currentAdmin.department}</p>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Staff Accreditation:</span>
              <span className="font-mono font-bold text-slate-800">{currentAdmin.staffId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Accredited Since:</span>
              <span className="text-slate-700 font-medium">{currentAdmin.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Olympiads:</span>
              <span className="font-bold text-blue-700">{currentAdmin.assignedCompetitionsCount}</span>
            </div>
          </div>
        </div>

        {/* Right: Editable Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Institutional Contact & Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Official Name *</label>
                <input
                  id="admin-profile-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Institutional Email *</label>
                <input
                  id="admin-profile-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Department / Division *</label>
                <input
                  id="admin-profile-dept"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Contact Number</label>
                <input
                  id="admin-profile-phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                id="btn-save-admin-profile"
                className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
