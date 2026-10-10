import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Syringe, 
  ClipboardList, 
  FileText, 
  ShieldCheck, 
  Settings, 
  PlusCircle, 
  ChevronRight,
  AlertCircle,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { evaluatePatientSummary } from '../utils/immunizationUtils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddPatient: () => void;
  onOpenRecordVaccine: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onOpenAddPatient, 
  onOpenRecordVaccine 
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    patients, 
    vaccinationRecords, 
    setSelectedPatientId,
    language,
    theme
  } = useApp();

  const isCoralMint = theme === 'coral-mint';

  // Calculate missed count for badges
  const missedCount = patients.reduce((count, p) => {
    const summary = evaluatePatientSummary(p, vaccinationRecords);
    return count + (summary.missedCount > 0 ? 1 : 0);
  }, 0);

  const upcomingCount = patients.reduce((count, p) => {
    const summary = evaluatePatientSummary(p, vaccinationRecords);
    return count + (summary.upcomingCount > 0 ? 1 : 0);
  }, 0);

  const draftCount = patients.filter((p) => p.verificationStatus === 'draft').length +
    vaccinationRecords.filter((r) => r.verificationStatus === 'draft').length;

  const rejectedCount = patients.filter((p) => p.verificationStatus === 'rejected').length +
    vaccinationRecords.filter((r) => r.verificationStatus === 'rejected').length;

  const approvalsBadge = rejectedCount > 0 
    ? `${draftCount} Pending · ${rejectedCount} Redo`
    : draftCount > 0 
      ? `${draftCount} ${language === 'fil' ? 'Draft' : 'Pending'}` 
      : undefined;

  const approvalsBadgeColor = rejectedCount > 0
    ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
    : 'bg-amber-100 text-amber-800 font-bold';

  const navItems = [
    {
      id: 'dashboard',
      label: language === 'fil' ? 'Dashboard' : 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'nurse', 'bhw'],
    },
    {
      id: 'patients',
      label: language === 'fil' ? 'Talaan ng Pasyente' : 'Patient Records',
      icon: Users,
      badge: patients.length,
      roles: ['admin', 'nurse', 'bhw'],
    },
    {
      id: 'calendar',
      label: language === 'fil' ? 'Kalendaryo ng Bakuna' : 'Vaccination Calendar',
      icon: Calendar,
      roles: ['admin', 'nurse', 'bhw'],
    },
    {
      id: 'approvals',
      label: language === 'fil' ? 'Drafts at Pagwawasto' : 'Drafts & Revisions',
      icon: UserCheck,
      badge: approvalsBadge,
      badgeColor: approvalsBadgeColor,
      roles: ['admin', 'nurse', 'bhw'],
    },
    {
      id: 'monitoring',
      label: language === 'fil' ? 'Pagmamanman (Status)' : 'Vaccine Monitoring',
      icon: Activity,
      badge: missedCount > 0 ? `${missedCount} Missed` : undefined,
      badgeColor: 'bg-red-100 text-red-700',
      roles: ['admin', 'nurse', 'bhw'],
    },
    {
      id: 'vaccines',
      label: language === 'fil' ? 'Iskedyul ng Bakuna (EPI)' : 'Immunization Schedule',
      icon: Syringe,
      roles: ['admin', 'nurse', 'bhw'],
    },
    {
      id: 'followups',
      label: language === 'fil' ? 'BHW Follow-Ups' : 'Patient Follow-Ups',
      icon: ClipboardList,
      roles: ['admin', 'nurse', 'bhw'],
    },
    {
      id: 'reports',
      label: language === 'fil' ? 'Ulat at Talaan' : 'Reports & Forms',
      icon: FileText,
      roles: ['admin', 'nurse', 'bhw'],
    },
    {
      id: 'audit',
      label: language === 'fil' ? 'Audit Trail' : 'Audit Trail',
      icon: ShieldCheck,
      roles: ['admin', 'nurse'],
    },
    {
      id: 'admin',
      label: language === 'fil' ? 'Pasilidad at Staff' : 'Users & Settings',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'patients') {
      setSelectedPatientId(null);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    onClose();
  };

  const isAllowed = (roles: string[]) => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Quick Action Buttons */}
        <div className="p-3 border-b border-slate-100 space-y-1.5">
          <button
            onClick={() => { onOpenAddPatient(); onClose(); }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
              isCoralMint
                ? 'bg-[#FF9AA2] hover:bg-[#FF7B86] text-white shadow-xs'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>

          {currentUser?.role !== 'bhw' && (
            <button
              onClick={() => { onOpenRecordVaccine(); onClose(); }}
              className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                isCoralMint
                  ? 'text-[#C94C58] bg-[#FFEAEA] hover:bg-[#FFCCD5] border-[#FFCCD5]'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
              }`}
            >
              <Syringe className={`w-3.5 h-3.5 ${isCoralMint ? 'text-[#FF9AA2]' : 'text-blue-600'}`} />
              <span>Record Vaccination</span>
            </button>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.filter((item) => isAllowed(item.roles)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? isCoralMint 
                      ? 'bg-[#FFEAEA] text-[#C94C58] font-bold border-l-4 border-[#FF9AA2]' 
                      : 'bg-blue-50 text-blue-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${
                    isActive 
                      ? (isCoralMint ? 'text-[#C94C58]' : 'text-blue-600') 
                      : 'text-slate-400'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full font-tabular ${
                      item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Monitoring Status indicator footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Vaccination Watch</span>
            <span className="font-tabular text-slate-600">{patients.length} Registered</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
            <div 
              onClick={() => handleSelectTab('monitoring')}
              className="p-1.5 bg-red-50 hover:bg-red-100 rounded border border-red-100 cursor-pointer transition-colors"
            >
              <div className="text-red-700 font-bold font-tabular">{missedCount}</div>
              <div className="text-red-600 text-xs truncate">🔴 Missed</div>
            </div>
            <div 
              onClick={() => handleSelectTab('monitoring')}
              className="p-1.5 bg-amber-50 hover:bg-amber-100 rounded border border-amber-100 cursor-pointer transition-colors"
            >
              <div className="text-amber-700 font-bold font-tabular">{upcomingCount}</div>
              <div className="text-amber-600 text-xs truncate">🟡 Upcoming</div>
            </div>
            <div 
              onClick={() => handleSelectTab('monitoring')}
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-100 cursor-pointer transition-colors"
            >
              <div className="text-emerald-700 font-bold font-tabular">
                {patients.filter((p) => evaluatePatientSummary(p, vaccinationRecords).isFullyImmunized).length}
              </div>
              <div className="text-emerald-600 text-xs truncate">🟢 FIC</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
