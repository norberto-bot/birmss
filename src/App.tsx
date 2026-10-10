import React, { useState, useRef, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PatientManagementView } from './components/PatientManagementView';
import { PatientDetailView } from './components/PatientDetailView';
import { ImmunizationMonitoringView } from './components/ImmunizationMonitoringView';
import { VaccinesScheduleView } from './components/VaccinesScheduleView';
import { FollowUpsView } from './components/FollowUpsView';
import { ReportsView } from './components/ReportsView';
import { AuditTrailView } from './components/AuditTrailView';
import { UserManagementView } from './components/UserManagementView';
import { VaccinationCalendarView } from './components/VaccinationCalendarView';
import { PendingApprovalsView } from './components/PendingApprovalsView';
import { PatientPortalView } from './components/PatientPortalView';
import { AddPatientModal } from './components/AddPatientModal';
import { RecordVaccineModal } from './components/RecordVaccineModal';
import { CorrectionModal } from './components/CorrectionModal';
import { FollowUpModal } from './components/FollowUpModal';
import { SMSModal } from './components/SMSModal';
import { DetailedSurveillanceModal } from './components/DetailedSurveillanceModal';
import { ContactUsModal } from './components/ContactUsModal';
import { PrintableImmunizationCard } from './components/PrintableImmunizationCard';
import { LoginView } from './components/LoginView';
import { IdleTimeoutModal } from './components/IdleTimeoutModal';
import { ReactivationComplaintModal } from './components/ReactivationComplaintModal';
import { Patient, VaccinationRecord } from './types';
import { LayoutDashboard, Users, Activity, Syringe, FileText, Calendar, UserCheck, ShieldAlert } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    currentUser, 
    patientPortalPatient,
    activeTab, 
    setActiveTab, 
    selectedPatientId, 
    setSelectedPatientId,
    patients,
    securityAlert,
    dismissSecurityAlert,
    isSurveillanceModalOpen,
    closeSurveillanceModal,
    isContactModalOpen,
    closeContactModal,
    theme
  } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isRecordVaccineOpen, setIsRecordVaccineOpen] = useState(false);
  const [recordVaccinePatientId, setRecordVaccinePatientId] = useState<string | undefined>(undefined);
  const [recordVaccineDefaultCode, setRecordVaccineDefaultCode] = useState<string | undefined>(undefined);
  
  const [followUpPatientId, setFollowUpPatientId] = useState<string | null>(null);
  const [correctionRecord, setCorrectionRecord] = useState<VaccinationRecord | null>(null);
  const [printPatientId, setPrintPatientId] = useState<string | null>(null);
  const [smsPatient, setSmsPatient] = useState<Patient | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // When changing tabs, patient record view, print mode, or roles, always start scrolling at the top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    if (mainRef.current) mainRef.current.scrollTop = 0;

    // In case of async layout changes or component rendering
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (mainRef.current) mainRef.current.scrollTop = 0;
      document.querySelectorAll('main, #root, [data-theme], .overflow-y-auto').forEach((el) => {
        if (el.scrollTop > 0) {
          el.scrollTop = 0;
        }
      });
    }, 10);

    return () => clearTimeout(timer);
  }, [activeTab, selectedPatientId, printPatientId, currentUser?.id, currentUser?.role]);

  // If patient/parent portal session is active, render PatientPortalView (View-Only)
  if (patientPortalPatient) {
    return (
      <div data-theme={theme || 'coral-mint'} className="min-h-screen">
        <PatientPortalView />
      </div>
    );
  }

  // If not logged in as staff or patient, show unified login screen
  if (!currentUser) {
    return (
      <div data-theme={theme || 'coral-mint'} className="min-h-screen">
        <LoginView />
      </div>
    );
  }

  // Handlers for modal workflows
  const handleOpenAddPatient = () => {
    setIsAddPatientOpen(true);
  };

  const handleOpenRecordVaccine = (patientId?: string, vaccineCode?: string) => {
    setRecordVaccinePatientId(patientId || selectedPatientId || undefined);
    setRecordVaccineDefaultCode(vaccineCode);
    setIsRecordVaccineOpen(true);
  };

  const handleOpenFollowUp = (patientId: string) => {
    setFollowUpPatientId(patientId);
  };

  const handleOpenCorrection = (record: VaccinationRecord) => {
    setCorrectionRecord(record);
  };

  const handlePrintCard = (patientId: string) => {
    setPrintPatientId(patientId);
  };

  const handleOpenSMS = (patient: Patient) => {
    setSmsPatient(patient);
  };

  return (
    <div data-theme={theme || 'coral-mint'} className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Bar Contract (1-line header with brand, role switcher, user) */}
      <Navbar 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen} 
      />

      {/* Security Alert Banner for unauthorized attempts or lockouts */}
      {securityAlert && (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top duration-200 z-40">
          <div className="flex items-center gap-2 max-w-4xl">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-200" />
            <span className="leading-snug">{securityAlert}</span>
          </div>
          <button 
            onClick={dismissSecurityAlert}
            className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs"
          >
            Dismiss Alert
          </button>
        </div>
      )}

      <div className="flex-1 flex">
        
        {/* Sidebar Navigation */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenAddPatient={handleOpenAddPatient}
          onOpenRecordVaccine={() => handleOpenRecordVaccine()}
        />

        {/* Main Content Area */}
        <main ref={mainRef} className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-16 lg:pb-8">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
            
            {/* If printable immunization card mode is active */}
            {printPatientId ? (
              <PrintableImmunizationCard
                patientId={printPatientId}
                onBack={() => setPrintPatientId(null)}
              />
            ) : selectedPatientId ? (
              /* Patient Detailed Health Profile & EPI Card */
              <PatientDetailView
                patientId={selectedPatientId}
                onBack={() => setSelectedPatientId(null)}
                onOpenRecordVaccine={(code) => handleOpenRecordVaccine(selectedPatientId, code)}
                onOpenFollowUp={(id) => handleOpenFollowUp(id)}
                onOpenCorrection={(rec) => handleOpenCorrection(rec)}
                onPrintCard={(id) => handlePrintCard(id)}
                onOpenSMS={() => {
                  const p = patients.find((item) => item.id === selectedPatientId);
                  if (p) handleOpenSMS(p);
                }}
              />
            ) : (
              /* View Router Based on Active Tab */
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    onOpenAddPatient={handleOpenAddPatient}
                    onOpenRecordVaccine={() => handleOpenRecordVaccine()}
                    onSelectPatient={(id) => setSelectedPatientId(id)}
                    onOpenFollowUp={(id) => handleOpenFollowUp(id)}
                    onOpenSMS={(p) => handleOpenSMS(p)}
                  />
                )}

                {activeTab === 'patients' && (
                  <PatientManagementView
                    onOpenAddPatient={handleOpenAddPatient}
                    onSelectPatient={(id) => setSelectedPatientId(id)}
                    onOpenSMS={handleOpenSMS}
                  />
                )}

                {activeTab === 'calendar' && (
                  <VaccinationCalendarView
                    onSelectPatient={(id) => setSelectedPatientId(id)}
                    onOpenRecordVaccine={(code) => handleOpenRecordVaccine(undefined, code)}
                  />
                )}

                {activeTab === 'approvals' && (
                  <PendingApprovalsView
                    onSelectPatient={(id) => setSelectedPatientId(id)}
                  />
                )}

                {activeTab === 'monitoring' && (
                  <ImmunizationMonitoringView
                    onSelectPatient={(id) => setSelectedPatientId(id)}
                    onOpenRecordVaccine={(code) => handleOpenRecordVaccine(undefined, code)}
                    onOpenFollowUp={(id) => handleOpenFollowUp(id)}
                    onOpenSMS={handleOpenSMS}
                  />
                )}

                {activeTab === 'vaccines' && (
                  <VaccinesScheduleView
                    onOpenRecordVaccine={(code) => handleOpenRecordVaccine(undefined, code)}
                  />
                )}

                {activeTab === 'followups' && (
                  <FollowUpsView
                    onSelectPatient={(id) => setSelectedPatientId(id)}
                    onOpenFollowUp={(id) => handleOpenFollowUp(id)}
                  />
                )}

                {activeTab === 'reports' && (
                  <ReportsView />
                )}

                {activeTab === 'audit' && (
                  <AuditTrailView />
                )}

                {activeTab === 'admin' && (
                  currentUser?.role === 'admin' ? (
                    <UserManagementView />
                  ) : (
                    <div className="p-8 text-center bg-white rounded-xl border border-red-200 space-y-3">
                      <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
                      <h2 className="text-base font-bold text-slate-900">Administrator Access Restricted</h2>
                      <p className="text-xs text-slate-500">Only the System Administrator has access to User Management & Settings.</p>
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  )
                )}
              </>
            )}

          </div>
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Tab Bar (Accessible on mobile phones / tablets) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 lg:hidden flex items-center justify-around h-14 px-1 no-print shadow-lg">
        <button
          onClick={() => { setActiveTab('dashboard'); setSelectedPatientId(null); setPrintPatientId(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            activeTab === 'dashboard' && !selectedPatientId && !printPatientId ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Dash</span>
        </button>

        <button
          onClick={() => { setActiveTab('patients'); setSelectedPatientId(null); setPrintPatientId(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            activeTab === 'patients' && !selectedPatientId && !printPatientId ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Patients</span>
        </button>

        <button
          onClick={() => { setActiveTab('calendar'); setSelectedPatientId(null); setPrintPatientId(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            activeTab === 'calendar' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => { setActiveTab('approvals'); setSelectedPatientId(null); setPrintPatientId(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            activeTab === 'approvals' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <UserCheck className="w-4 h-4 mb-0.5" />
          <span>Drafts</span>
        </button>

        <button
          onClick={() => { setActiveTab('monitoring'); setSelectedPatientId(null); setPrintPatientId(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            activeTab === 'monitoring' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span>Monitor</span>
        </button>
      </div>

      {/* Global Modals */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={(id) => {
          setSelectedPatientId(id);
          setActiveTab('patients');
        }}
      />

      <RecordVaccineModal
        isOpen={isRecordVaccineOpen}
        onClose={() => setIsRecordVaccineOpen(false)}
        preselectedPatientId={recordVaccinePatientId}
        defaultVaccineCode={recordVaccineDefaultCode}
      />

      <FollowUpModal
        isOpen={!!followUpPatientId}
        onClose={() => setFollowUpPatientId(null)}
        patientId={followUpPatientId || ''}
      />

      <CorrectionModal
        isOpen={!!correctionRecord}
        onClose={() => setCorrectionRecord(null)}
        record={correctionRecord}
      />

      <SMSModal
        isOpen={!!smsPatient}
        onClose={() => setSmsPatient(null)}
        patient={smsPatient}
      />

      {/* Detailed Surveillance Roster & Target Cohort Breakdown Modal */}
      <DetailedSurveillanceModal
        isOpen={isSurveillanceModalOpen}
        onClose={closeSurveillanceModal}
        onSelectPatient={(id) => {
          setSelectedPatientId(id);
          setActiveTab('patients');
        }}
        onOpenSMS={handleOpenSMS}
        onOpenFollowUp={handleOpenFollowUp}
      />

      {/* Contact Health Center Admin via Gmail Modal */}
      <ContactUsModal
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
      />

      {/* 15-Minute Idle Terminal Security Timeout Protection */}
      <IdleTimeoutModal />

      {/* Deactivated Staff Member Complaint & Gmail Redirection Modal */}
      <ReactivationComplaintModal />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
