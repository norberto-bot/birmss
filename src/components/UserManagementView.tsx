import React, { useState, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Palette, 
  Database, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Save, 
  AlertCircle,
  Check,
  ShieldAlert,
  Clock,
  Mail,
  UserX,
  UserCheck,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, ColorTheme, UserAccount } from '../types';

export const UserManagementView: React.FC = () => {
  const { 
    users, 
    addUser, 
    toggleUserStatus, 
    deactivateUser,
    reactivateUser,
    settings, 
    updateSettings, 
    currentUser,
    setActiveTab: setGlobalActiveTab,
    theme,
    setTheme,
    importPatientsFromCSV,
    exportDatabaseJSON,
    importDatabaseJSON,
    patients,
    vaccinationRecords
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'data'>('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Filter for staff accounts: all vs active vs deactivated
  const [staffFilter, setStaffFilter] = useState<'all' | 'active' | 'deactivated'>('all');

  // Deactivation confirmation modal state
  const [userToDeactivate, setUserToDeactivate] = useState<UserAccount | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('Administrative duty suspension / compliance review');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Reactivation / verification modal state
  const [userToReactivate, setUserToReactivate] = useState<UserAccount | null>(null);
  const [adminVerificationRemarks, setAdminVerificationRemarks] = useState('Identity verified and authorized to resume healthcare duties.');
  const [isReactivating, setIsReactivating] = useState(false);
  const [reactivationSuccessToast, setReactivationSuccessToast] = useState<string | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('bhw');
  const [newTitle, setNewTitle] = useState('Barangay Health Worker');
  const [newPurok, setNewPurok] = useState(settings.puroks[0]);
  const [newContact, setNewContact] = useState('');

  // Facility settings form state
  const [facilityData, setFacilityData] = useState({
    barangayName: settings.barangayName,
    municipalityCity: settings.municipalityCity,
    province: settings.province,
    healthCenterName: settings.healthCenterName,
    contactNumber: settings.contactNumber,
    email: settings.email,
    headNurse: settings.headNurse,
    barangayCaptain: settings.barangayCaptain,
  });

  // Strict RBAC Gate: Only Admin can access User Management & Settings
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-red-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Administrator Access Restricted</h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Only the Barangay Health System Administrator can access user management, facility settings, and account deactivation/activation controls.
          </p>
        </div>
        <button
          onClick={() => setGlobalActiveTab('dashboard')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Handle Admin Deactivation
  const handleConfirmDeactivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToDeactivate) return;

    setIsDeactivating(true);
    try {
      const ok = deactivateUser(userToDeactivate.id, deactivationReason.trim());
      if (ok) {
        setUserToDeactivate(null);
        setDeactivationReason('Administrative duty suspension / compliance review');
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  // Handle Admin Reactivation & Verification
  const handleConfirmReactivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReactivate) return;

    setIsReactivating(true);
    try {
      const res = await reactivateUser(userToReactivate.id, adminVerificationRemarks.trim());
      if (res.success) {
        setReactivationSuccessToast(res.message);
        setUserToReactivate(null);
        setAdminVerificationRemarks('Identity verified and authorized to resume healthcare duties.');
        setTimeout(() => setReactivationSuccessToast(null), 5000);
      }
    } finally {
      setIsReactivating(false);
    }
  };

  // CSV Import state
  const [csvInput, setCsvInput] = useState('');
  const [importResult, setImportResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newFullName || !newEmail) return;

    addUser({
      username: newUsername.trim().toLowerCase(),
      fullName: newFullName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      title: newTitle.trim(),
      purokAssigned: newRole === 'bhw' ? newPurok : undefined,
      contactNumber: newContact.trim(),
      isActive: true,
    });

    setShowAddUserModal(false);
    setNewUsername('');
    setNewFullName('');
    setNewEmail('');
    setNewContact('');
  };

  const handleSaveFacilitySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(facilityData);
    alert('Barangay health facility settings saved successfully!');
  };

  const handleDownloadSampleCSV = () => {
    const sampleHeaders = 'firstName,middleName,lastName,dateOfBirth,gender,address,purokSitio,motherName,fatherName,contactNumber\n';
    const sampleRows = [
      'John Mark,Dizon,Santos,2025-08-14,Male,12 Bonifacio St,Purok 1 - Maligaya,Maria Santos,Roberto Santos,0917-123-4567',
      'Bea Clarisse,Lim,Mercado,2026-02-10,Female,Block 5 Lot 2,Purok 2 - Pag-asa,Clarisse Mercado,Danilo Mercado,0922-987-6543',
    ].join('\n');

    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sample_Barangay_Patient_Import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvInput(text);
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteCsvImport = () => {
    if (!csvInput.trim()) {
      alert('Please paste CSV text or select a file first.');
      return;
    }
    const res = importPatientsFromCSV(csvInput);
    setImportResult(res);
    setCsvInput('');
  };

  const handleDownloadJsonBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BIRMS_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const ok = importDatabaseJSON(text);
        if (ok) {
          alert('Database restored successfully from JSON backup!');
        } else {
          alert('Invalid JSON backup file structure.');
        }
      };
      reader.readAsText(file);
    }
  };

  const themes: Array<{ id: ColorTheme; name: string; desc: string; sample: string; border: string; swatches?: string[] }> = [
    {
      id: 'coral-mint',
      name: 'Maternal & Child Health (Blush, Coral & Mint)',
      desc: 'Gentle pastel blush, salmon coral, and refreshing pediatric aqua mint palette',
      sample: 'bg-[#FF9AA2]',
      border: 'border-[#FF9AA2]',
      swatches: ['#FFEAEA', '#FFCCD5', '#FF9AA2', '#B5EAEA', '#E0F9F8'],
    },
    {
      id: 'blue',
      name: 'Department of Health (DOH) Blue',
      desc: 'Trusted Philippine public health and hospital clinical standard',
      sample: 'bg-blue-600',
      border: 'border-blue-600',
      swatches: ['#EFF6FF', '#BFDBFE', '#3B82F6', '#1D4ED8', '#1E3A8A'],
    },
    {
      id: 'emerald',
      name: 'Barangay Emerald Green',
      desc: 'Community health, maternal nutrition, and vitality branding',
      sample: 'bg-emerald-600',
      border: 'border-emerald-600',
      swatches: ['#ECFDF5', '#A7F3D0', '#10B981', '#047857', '#064E3B'],
    },
    {
      id: 'teal',
      name: 'Municipal Health Teal',
      desc: 'Fresh modern local government unit (LGU) clinic look',
      sample: 'bg-teal-600',
      border: 'border-teal-600',
      swatches: ['#F0FDFA', '#99F6E4', '#14B8A6', '#0F766E', '#134E4A'],
    },
    {
      id: 'indigo',
      name: 'Provincial Health Indigo',
      desc: 'Refined administrative and health system monitoring palette',
      sample: 'bg-indigo-600',
      border: 'border-indigo-600',
      swatches: ['#EEF2FF', '#C7D2FE', '#6366F1', '#4338CA', '#312E81'],
    },
    {
      id: 'slate',
      name: 'Clinical Slate & Monochrome',
      desc: 'Minimal high-contrast research and institutional dark slate',
      sample: 'bg-slate-800',
      border: 'border-slate-800',
      swatches: ['#F8FAFC', '#E2E8F0', '#64748B', '#334155', '#0F172A'],
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            System Administration & Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based accounts, color themes, barangay details, and bulk data import/export.
          </p>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Authorized User</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Staff Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Barangay Info & Color Themes
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'data'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Data Import & Backup
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Reactivation Success Toast */}
          {reactivationSuccessToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{reactivationSuccessToast}</span>
            </div>
          )}

          {/* Sub-filter tabs & Pending Appeals Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStaffFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  staffFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Staff ({users.length})
              </button>

              <button
                type="button"
                onClick={() => setStaffFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  staffFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Active ({users.filter((u) => u.isActive).length})
              </button>

              <button
                type="button"
                onClick={() => setStaffFilter('deactivated')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  staffFilter === 'deactivated'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Deactivated ({users.filter((u) => !u.isActive).length})</span>
                {users.filter((u) => !u.isActive && u.pendingReactivation).length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            </div>

            {users.filter((u) => !u.isActive && u.pendingReactivation).length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {users.filter((u) => !u.isActive && u.pendingReactivation).length} Staff Appeal(s) Awaiting Admin Verification
                </span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Full Name & Username</th>
                    <th scope="col" className="px-4 py-3">Assigned Role</th>
                    <th scope="col" className="px-4 py-3">Title / Designation</th>
                    <th scope="col" className="px-4 py-3">Assigned Purok</th>
                    <th scope="col" className="px-4 py-3">Contact</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Account Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users
                    .filter((u) => {
                      if (staffFilter === 'active') return u.isActive;
                      if (staffFilter === 'deactivated') return !u.isActive;
                      return true;
                    })
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">@{u.username} · {u.email}</div>
                          {u.deactivationReason && !u.isActive && (
                            <div className="text-[10px] text-red-600 italic mt-0.5">
                              Deactivation Note: {u.deactivationReason}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            u.role === 'nurse' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {u.title}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          {u.purokAssigned || 'All Puroks'}
                        </td>

                        <td className="px-4 py-3.5 font-tabular text-slate-700">
                          {u.contactNumber}
                        </td>

                        <td className="px-4 py-3.5">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span>Active (Protected)</span>
                            </span>
                          ) : u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Deactivated</span>
                              </span>
                              {u.pendingReactivation && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Appeal Pending</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          {u.role === 'admin' ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg cursor-default shadow-2xs"
                              title="Administrator account is strictly exempted and can never be deactivated as it manages the entire system."
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span>Exempted (Admin)</span>
                            </span>
                          ) : u.isActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUserToDeactivate(u);
                                setDeactivationReason('Administrative duty suspension / compliance review');
                              }}
                              className="px-2.5 py-1 text-xs rounded transition-colors text-red-600 hover:bg-red-50 border border-red-200 flex items-center gap-1 ml-auto font-semibold"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setUserToReactivate(u);
                                setAdminVerificationRemarks(
                                  u.reactivationComplaint 
                                    ? `Reviewed staff appeal: "${u.reactivationComplaint.slice(0, 60)}...". Identity verified and authorized to resume duties.`
                                    : 'Identity and credentials verified by administrator. Re-authorized for healthcare service.'
                                );
                              }}
                              className="px-2.5 py-1 text-xs rounded transition-colors text-emerald-800 hover:bg-emerald-100 border border-emerald-300 bg-emerald-50 flex items-center gap-1 ml-auto font-bold shadow-2xs"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verify & Reactivate</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Account Deactivation Confirmation & Audit Reason Input */}
      {userToDeactivate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-red-200 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setUserToDeactivate(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-red-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Deactivate Staff Account</h3>
                <p className="text-xs text-slate-500">Lifecycle management & automated audit logging</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Health Worker:</span>
                <span>{userToDeactivate.fullName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Username & Role:</span>
                <span className="font-mono">@{userToDeactivate.username} ({userToDeactivate.role.toUpperCase()})</span>
              </div>
            </div>

            <form onSubmit={handleConfirmDeactivation} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason for Account Deactivation (Recorded in Audit Trail) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  placeholder="Enter specific administrative reason for deactivation..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none text-slate-800"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold block w-full">Quick Reasons:</span>
                  {[
                    'End of Contract / Duty Assignment',
                    'Administrative Compliance Review',
                    'Temporary Volunteer Leave',
                    'Confidentiality & Policy Inquiry'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDeactivationReason(preset)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded text-[10px]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1 text-red-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Accountability & Security Impact</span>
                </div>
                <p>
                  1. The user will immediately be logged out, cannot log in, and will not be displayed on active portal rosters.
                </p>
                <p>
                  2. An automated audit trail entry will record the timestamp, admin username (@{currentUser?.username}), and this reason.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserToDeactivate(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDeactivating}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <UserX className="w-4 h-4" />
                  <span>{isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Admin Account Verification & Reactivation */}
      {userToReactivate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-200 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setUserToReactivate(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Admin Verification & Reactivation</h3>
                <p className="text-xs text-slate-500">Official administrator verification clearance</p>
              </div>
            </div>

            {/* Target Account Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Health Worker:</span>
                <span>{userToReactivate.fullName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Username & Role:</span>
                <span className="font-mono">@{userToReactivate.username} ({userToReactivate.title})</span>
              </div>
              {userToReactivate.deactivationReason && (
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-500">Prior Deactivation Reason: </span>
                  <span className="italic">{userToReactivate.deactivationReason}</span>
                </div>
              )}
            </div>

            {/* User Submitted Appeal / Complaint if present */}
            {userToReactivate.reactivationComplaint && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                  <span>Filed Complaint & Reactivation Appeal (via Gmail / Portal):</span>
                </div>
                <p className="italic text-amber-950 bg-white/80 p-2 rounded border border-amber-100 leading-relaxed">
                  "{userToReactivate.reactivationComplaint}"
                </p>
                <div className="text-[10px] text-amber-700 font-mono">
                  Submitted on: {userToReactivate.reactivationRequestedAt || 'Recently'}
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmReactivation} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Administrator Verification Notes & Clearance *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adminVerificationRemarks}
                  onChange={(e) => setAdminVerificationRemarks(e.target.value)}
                  placeholder="Record verification notes, resolution of complaint, and clinical re-authorization..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none text-slate-800"
                />
              </div>

              <div className="space-y-1.5 bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-950">
                <span className="font-bold block text-emerald-900">Administrator Verification Checklist:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked required className="rounded text-emerald-600" />
                  <span>Verified identity and professional standing of healthcare worker</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked required className="rounded text-emerald-600" />
                  <span>Reviewed grounds of appeal / complaint and granted administrative clearance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked required className="rounded text-emerald-600" />
                  <span>Send official reactivated confirmation email to {userToReactivate.email}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserToReactivate(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isReactivating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isReactivating ? 'Verifying & Reactivating...' : 'Confirm Verification & Reactivate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: FACILITY SETTINGS & COLOR THEME */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          
          {/* Color Palette Switcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Palette className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Visual System Color Palette</h3>
                <p className="text-xs text-slate-500">
                  Select a theme to customize primary badges, active highlights, and action buttons.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {themes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? `${t.border} ring-2 ring-blue-500/20 bg-slate-50 shadow-xs`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full ${t.sample}`}></span>
                          <span className="font-bold text-xs text-slate-900">{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {t.desc}
                      </p>

                      {t.swatches && (
                        <div className="flex h-3.5 w-full rounded-md overflow-hidden border border-slate-200 mt-2 shadow-2xs">
                          {t.swatches.map((hex, idx) => (
                            <div 
                              key={idx} 
                              className="flex-1 h-full" 
                              style={{ backgroundColor: hex }} 
                              title={`Swatch ${idx + 1}: ${hex}`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">Theme: {t.id}</span>
                      <span className={`font-semibold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                        {isSelected ? 'Active' : 'Click to apply'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facility Info Form */}
          <form onSubmit={handleSaveFacilitySettings} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Barangay Health Center Details
                </h3>
                <p className="text-xs text-slate-500">
                  These names appear on official printed immunization cards, reports, and header seals.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Barangay Name *</label>
                <input
                  type="text"
                  required
                  value={facilityData.barangayName}
                  onChange={(e) => setFacilityData({ ...facilityData, barangayName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Municipality / City *</label>
                <input
                  type="text"
                  required
                  value={facilityData.municipalityCity}
                  onChange={(e) => setFacilityData({ ...facilityData, municipalityCity: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Province *</label>
                <input
                  type="text"
                  required
                  value={facilityData.province}
                  onChange={(e) => setFacilityData({ ...facilityData, province: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Health Facility / Station Name *</label>
                <input
                  type="text"
                  required
                  value={facilityData.healthCenterName}
                  onChange={(e) => setFacilityData({ ...facilityData, healthCenterName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Public Health Nurse (Head Nurse) *</label>
                <input
                  type="text"
                  required
                  value={facilityData.headNurse}
                  onChange={(e) => setFacilityData({ ...facilityData, headNurse: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Punong Barangay (Captain) *</label>
                <input
                  type="text"
                  required
                  value={facilityData.barangayCaptain}
                  onChange={(e) => setFacilityData({ ...facilityData, barangayCaptain: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Official Contact Number</label>
                <input
                  type="text"
                  value={facilityData.contactNumber}
                  onChange={(e) => setFacilityData({ ...facilityData, contactNumber: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Official Email Address</label>
                <input
                  type="email"
                  value={facilityData.email}
                  onChange={(e) => setFacilityData({ ...facilityData, email: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Facility Configurations</span>
              </button>
            </div>
          </form>

        </div>
      )}

      {/* TAB 3: DATA IMPORT & BACKUP (Direct answer to user's question!) */}
      {activeTab === 'data' && (
        <div className="space-y-6 max-w-4xl">
          
          {/* CSV Import Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bulk Patient CSV / Excel Import
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste or upload your research respondent dataset to automatically populate the system.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Paste CSV Data (or choose a file):
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  ref={fileInputRef}
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose CSV File</span>
                </button>
              </div>

              <textarea
                rows={6}
                placeholder="firstName,middleName,lastName,dateOfBirth,gender,address,purokSitio,motherName,fatherName,contactNumber&#10;Juan,Cruz,Dela Cruz,2026-03-15,Male,12 Rizal St,Purok 1,Maria Dela Cruz,Pedro Dela Cruz,0917-111-2233"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                className="w-full p-2.5 font-mono text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExecuteCsvImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Records Into System</span>
                </button>
              </div>
            </div>

            {/* Import results summary */}
            {importResult && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Import Completed: {importResult.added} patients added, {importResult.skipped} skipped</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="text-slate-600 space-y-0.5 max-h-32 overflow-y-auto font-mono text-[11px]">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="text-amber-800">· {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Complete Database JSON Backup & Transfer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Complete System Backup & Restore (JSON)
                </h3>
                <p className="text-xs text-slate-500">
                  Export all patients ({patients.length}), administered vaccines ({vaccinationRecords.length}), and settings to transfer to another gadget or keep safe for your defense.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-900 block">Export Full Database Backup</span>
                <p className="text-slate-500">
                  Downloads a `.json` backup file containing your complete patient records and vaccination history.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadJsonBackup}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup File</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-900 block">Restore Database from File</span>
                <p className="text-slate-500">
                  Upload a previously exported `.json` file to restore all patient records on any computer or phone.
                </p>
                <input
                  type="file"
                  accept=".json"
                  ref={jsonFileInputRef}
                  onChange={handleJsonFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Upload & Restore JSON</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create Authorized User Account</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. bhw.elena"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Full Name with Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Ramos, RM"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. elena.ramos@csfp.gov.ph"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">System Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewRole(r);
                      if (r === 'nurse') setNewTitle('Public Health Nurse / Vaccinator');
                      if (r === 'bhw') setNewTitle('Barangay Health Worker');
                      if (r === 'admin') setNewTitle('Health Systems Administrator');
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="bhw">BHW</option>
                    <option value="nurse">Nurse</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Assigned Purok</label>
                  <select
                    value={newPurok}
                    onChange={(e) => setNewPurok(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {settings.puroks.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Position / Designation</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Mobile Contact</label>
                <input
                  type="text"
                  placeholder="0917-000-0000"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
