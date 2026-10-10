import React, { useState } from 'react';
import { 
  Shield, 
  User, 
  LogOut, 
  Menu, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Bell,
  Building2,
  Languages,
  Lock,
  Mail,
  MailCheck,
  Download,
  Sparkles,
  Clock,
  ShieldCheck,
  Palette,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, ColorTheme } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { 
    currentUser, 
    logout, 
    settings, 
    resetDemoData, 
    searchQuery, 
    setSearchQuery, 
    setActiveTab, 
    patients,
    setSelectedPatientId,
    language,
    setLanguage,
    isGmailConnected,
    gmailEmail,
    connectGmail,
    openContactModal
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Search results
  const filteredPatients = searchQuery.trim()
    ? patients.filter((p) => {
        const query = searchQuery.toLowerCase();
        const fullName = `${p.firstName} ${p.middleName} ${p.lastName}`.toLowerCase();
        return (
          fullName.includes(query) ||
          p.id.toLowerCase().includes(query) ||
          p.motherName.toLowerCase().includes(query) ||
          p.purokSitio.toLowerCase().includes(query)
        );
      }).slice(0, 5)
    : [];

  const handleSelectSearchedPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
    setShowSearchDropdown(false);
    setShowMobileSearch(false);
    setSearchQuery('');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const roleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'System Administrator';
      case 'doctor':
        return 'Rural Health Physician';
      case 'nurse':
        return 'Public Health Nurse';
      case 'bhw':
        return 'Barangay Health Worker';
      case 'patient':
        return 'Patient / Guardian';
    }
  };

  const roleBadgeStyle = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'doctor':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'nurse':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bhw':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs select-none no-print">
      <div className="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Section: Mobile toggle & Brand Logo + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden focus:outline-hidden shrink-0"
            aria-label={isSidebarOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => { setActiveTab('dashboard'); setSelectedPatientId(null); }}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full overflow-hidden border border-blue-200 bg-blue-50 flex items-center justify-center shadow-2xs">
              <img
                src="/src/assets/images/barangay_health_logo_1790812695237.jpg"
                alt="Barangay Seal"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700 absolute" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                {settings.barangayName}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 truncate hidden md:inline">
                Immunization Record & Monitoring System
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Spacious Search Bar (Desktop / Tablet) */}
        <div className="relative flex-1 max-w-xs md:max-w-sm lg:max-w-md hidden md:block mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, ID, guardian, or purok..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
              <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500">
                Patients Found ({filteredPatients.length})
              </div>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSearchedPatient(p.id)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {p.firstName} {p.middleName ? `${p.middleName} ` : ''}{p.lastName} {p.suffix}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        ID: <span className="font-tabular font-medium">{p.id}</span> · Mother: {p.motherName}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 font-tabular font-medium">{p.purokSitio}</span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching patients found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Organized, uncrowded actions with responsive grouping */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 md:hidden transition-colors"
            title="Search patients"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Strict Role Switching Protection: Active role badge */}
          <div 
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/80 text-slate-700"
            title="Role is strictly locked to your authenticated healthcare credentials."
          >
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden sm:inline text-slate-500 font-medium">Role:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${roleBadgeStyle(currentUser?.role)}`}>
              {currentUser?.role}
            </span>
          </div>

          {/* BHW Terminal 15m Idle Protection Indicator */}
          <div 
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800"
            title="BHW Terminal Security: Inactive sessions are automatically logged out after 15 minutes."
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>15m Idle Security</span>
          </div>

          {/* Contact Admin / Support Button (Desktop) */}
          <button
            onClick={openContactModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
            title="Send message to Health Center via Gmail"
          >
            <Mail className="w-3.5 h-3.5 text-slate-600" />
            <span>Contact Us</span>
          </button>

          {/* Offline Sync Indicator displaying records sync status and push-to-server action */}
          <div className="inline-flex items-center">
            <OfflineSyncIndicator />
          </div>

          {/* Language Toggle (Desktop & Tablet) */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'fil' : 'en')}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Toggle Language (English / Tagalog)"
          >
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'fil' ? 'FIL' : 'EN'}</span>
          </button>

          {/* PWA Install Button (Large Screens) */}
          <div className="hidden xl:inline-flex">
            <PWAInstallButton variant="navbar" />
          </div>

          {/* User Account Avatar & Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-400/40 transition-all focus:outline-hidden"
              title="User Account Menu"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100 shadow-2xs">
                {currentUser?.fullName.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden 2xl:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser?.fullName}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  {roleLabel(currentUser?.role || 'bhw')}
                </div>
              </div>
            </button>

            {/* Comprehensive Dropdown Menu (Accessible on both Desktop & Mobile) */}
            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 divide-y divide-slate-100 animate-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                {/* Profile Header */}
                <div className="px-3 py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.fullName}</p>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${roleBadgeStyle(currentUser?.role)}`}>
                      {currentUser?.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                  <p className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-medium inline-block">
                    {currentUser?.title}
                  </p>
                </div>

                {/* Mobile-Friendly Quick Actions (grouped inside menu to declutter navbar) */}
                <div className="py-1 sm:hidden">
                  <button
                    onClick={() => {
                      setLanguage(language === 'en' ? 'fil' : 'en');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Languages className="w-3.5 h-3.5 text-blue-600" />
                      <span>Language</span>
                    </span>
                    <span className="font-bold text-blue-700 text-[11px] bg-blue-50 px-1.5 py-0.5 rounded">
                      {language === 'fil' ? 'Tagalog (FIL)' : 'English (EN)'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      openContactModal();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>Contact Health Center via Gmail</span>
                  </button>
                </div>

                {/* Navigation & Preferences */}
                <div className="py-1">
                  <button
                    onClick={() => { setActiveTab('dashboard'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Barangay Dashboard</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('audit'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-600" />
                    <span>Security & Audit Trail</span>
                  </button>

                  {/* Admin-only Users & Settings Access */}
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => { setActiveTab('admin'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 rounded-lg text-left font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>User Management & Settings</span>
                    </button>
                  )}

                  {/* Install PWA Option */}
                  <div onClick={() => setShowUserMenu(false)}>
                    <PWAInstallButton variant="menuItem" />
                  </div>
                </div>

                {/* Demo Data Reset (Safe inside menu) */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowResetConfirm(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-lg text-left font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reset Research Test Data</span>
                  </button>
                </div>

                {/* Sign Out */}
                <div className="py-1">
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg text-left font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out / Switch User</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Search Overlay Bar */}
      {showMobileSearch && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 md:hidden animate-in slide-in-from-top-2 duration-150 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient name, ID, purok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSearchedPatient(p.id)}
                    className="w-full px-3 py-2.5 text-left hover:bg-blue-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {p.firstName} {p.middleName ? `${p.middleName} ` : ''}{p.lastName} {p.suffix}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        ID: {p.id} · Mother: {p.motherName}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{p.purokSitio}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  No matching patients found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reset Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Reset Demo Dataset?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Restores patients, missed/upcoming records, and audit logs to the initial research test dataset.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Yes, Reset Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
