import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  LogOut, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  HeartPulse, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Building2,
  Syringe,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  formatDateHuman, 
  calculateAge, 
  getPatientVaccineStatuses, 
  evaluatePatientSummary 
} from '../utils/immunizationUtils';
import { VACCINE_SCHEDULE } from '../data/initialData';

export const PatientPortalView: React.FC = () => {
  const { 
    patientPortalPatient, 
    logoutPatientPortal, 
    vaccinationRecords, 
    settings,
    language 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'card' | 'school_form'>('school_form');

  if (!patientPortalPatient) return null;

  const child = patientPortalPatient;
  const age = calculateAge(child.dateOfBirth);
  const statuses = getPatientVaccineStatuses(child, vaccinationRecords);
  const summary = evaluatePatientSummary(child, vaccinationRecords);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Top Bar for Parents */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs flex items-center justify-between no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-blue-200 bg-blue-50 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 block leading-tight">
              {settings.barangayName} · Patient Health Portal
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Strict Privacy Protected (View-Only Mode)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Official Record / DepEd Form</span>
          </button>

          <button
            onClick={logoutPatientPortal}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium border border-red-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Child Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-800">
                  {child.id}
                </span>
                <span className="text-xs text-slate-500">
                  Registered: {formatDateHuman(child.registrationDate)}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                {child.firstName} {child.middleName} {child.lastName} {child.suffix}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                <span>Date of Birth: <strong className="font-tabular text-slate-800">{formatDateHuman(child.dateOfBirth)}</strong></span>
                <span>·</span>
                <span>Current Age: <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">{age.formatted}</strong></span>
                <span>·</span>
                <span>Mother: <strong className="text-slate-800">{child.motherName}</strong></span>
                <span>·</span>
                <span>Purok: {child.purokSitio}</span>
              </div>
            </div>

            {/* FIC Status */}
            <div>
              {summary.isFullyImmunized ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  <span className="text-xs font-bold text-emerald-800 block">Fully Immunized Child (FIC)</span>
                  <span className="text-[10px] text-emerald-700">All standard infant vaccines completed</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-0.5">
                  <Clock className="w-5 h-5 text-blue-600 mx-auto" />
                  <span className="text-xs font-bold text-blue-800 block">Ongoing Schedule</span>
                  <span className="text-[10px] text-blue-700">{summary.completedCount} of {summary.totalScheduled} primary doses given</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('school_form')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'school_form'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              DepEd Form 138 / Kindergarten Health Card Format
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'card'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Standard Child Immunization Passport
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL SHEET */}
        <div className="printable-area bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-md text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden border border-slate-300 flex items-center justify-center">
              <img
                src="/src/assets/images/barangay_health_logo_1790812695237.jpg"
                alt="Barangay Seal"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>

            <div className="text-center flex-1 px-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
                Republic of the Philippines · Department of Health & DepEd Partner Health Station
              </p>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-slate-900">
                {settings.barangayName}, {settings.municipalityCity}, {settings.province}
              </h2>
              <p className="text-xs font-bold text-blue-900">
                {settings.healthCenterName}
              </p>
              <p className="text-[11px] text-slate-700 font-semibold uppercase mt-0.5">
                {activeTab === 'school_form' 
                  ? 'OFFICIAL STUDENT IMMUNIZATION ASSESSMENT & SCHOOL ENTRY HEALTH CARD (FORM 138 COMPLIANT)'
                  : 'OFFICIAL CHILD IMMUNIZATION PASSPORT & HEALTH RECORD'}
              </p>
            </div>

            <div className="w-14 text-center border border-dashed border-slate-400 p-1 text-[8px] text-slate-500 font-mono">
              OFFICIAL SEAL
            </div>
          </div>

          {/* Child Information Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Child Name:</span>
              <span className="font-bold text-slate-900">
                {child.lastName}, {child.firstName} {child.middleName} {child.suffix}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Birthdate & Sex:</span>
              <span className="font-tabular font-semibold">
                {formatDateHuman(child.dateOfBirth)} ({child.gender})
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Parent / Guardian:</span>
              <span className="font-medium text-slate-800">{child.motherName}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Barangay ID:</span>
              <span className="font-mono font-bold text-blue-800">{child.id}</span>
            </div>
          </div>

          {/* Immunization Table */}
          <div className="border border-slate-300 rounded overflow-hidden mb-5">
            <table className="w-full text-left text-xs divide-y divide-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-300">Vaccine / Antigen</th>
                  <th className="px-2 py-2 border-r border-slate-300">Target Dose</th>
                  <th className="px-3 py-2 border-r border-slate-300">Date Given</th>
                  <th className="px-2 py-2 border-r border-slate-300">Batch / Lot #</th>
                  <th className="px-3 py-2 border-r border-slate-300">Clinical Verification</th>
                  <th className="px-3 py-2">Vaccinator Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {VACCINE_SCHEDULE.map((v) => {
                  const rec = vaccinationRecords.find(
                    (r) => r.patientId === child.id && r.vaccineCode === v.code
                  );
                  const isVerified = rec && rec.verificationStatus === 'verified';
                  return (
                    <tr key={v.code} className="hover:bg-slate-50 text-[11px]">
                      <td className="px-3 py-1.5 border-r border-slate-300 font-semibold text-slate-900">
                        {v.name}
                        {v.isSupplement && <span className="text-[10px] text-blue-600 block">(Micronutrient Supplement)</span>}
                      </td>
                      <td className="px-2 py-1.5 border-r border-slate-300 text-slate-600">
                        Dose {v.doseNumber} ({v.route})
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-300 font-tabular font-bold text-slate-900">
                        {rec ? formatDateHuman(rec.dateAdministered) : '—'}
                      </td>
                      <td className="px-2 py-1.5 border-r border-slate-300 font-tabular font-medium text-slate-700">
                        {rec ? rec.batchLotNumber : '—'}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-300">
                        {isVerified ? (
                          <span className="text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>VERIFIED</span>
                          </span>
                        ) : rec ? (
                          <span className="text-amber-700 font-medium text-[10px]">Pending Verification</span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Unrecorded</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-slate-700">
                        {rec ? (
                          <div>
                            <span className="font-semibold block leading-tight">{rec.vaccinatorName}</span>
                            <span className="text-[9px] text-slate-500">{rec.vaccinatorRole}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* School Certification Seal & Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs">
            <div className="text-center space-y-1">
              <div className="h-8"></div>
              <p className="font-bold uppercase text-slate-900 border-t border-slate-800 pt-1">
                {settings.headNurse}
              </p>
              <p className="text-[10px] text-slate-600">Public Health Nurse / Authorized Vaccinator</p>
            </div>

            <div className="text-center space-y-1">
              <div className="h-8"></div>
              <p className="font-bold uppercase text-slate-900 border-t border-slate-800 pt-1">
                {settings.ruralHealthPhysician || 'Municipal Health Officer'}
              </p>
              <p className="text-[10px] text-slate-600">Rural Health Physician / Medical Officer</p>
            </div>
          </div>

          {/* School notes */}
          <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 space-y-0.5">
            <strong>For DepEd School Enrollment / Form 138:</strong>
            <p>
              This official immunization document certifies that the child's vaccination history has been evaluated in accordance with the Department of Health (DOH) Expanded Program on Immunization standards.
            </p>
          </div>

        </div>

      </main>

    </div>
  );
};
