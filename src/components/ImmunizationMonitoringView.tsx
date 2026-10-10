import React, { useState } from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  Syringe, 
  MessageSquare, 
  Printer, 
  Filter, 
  Search,
  ExternalLink,
  ChevronRight,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  evaluatePatientSummary, 
  getPatientVaccineStatuses, 
  formatDateHuman,
  formatDateISO
} from '../utils/immunizationUtils';
import { PatientVaccineStatus, Patient } from '../types';

interface ImmunizationMonitoringViewProps {
  onSelectPatient: (patientId: string) => void;
  onOpenRecordVaccine: (defaultVaccineCode?: string) => void;
  onOpenFollowUp: (patientId: string) => void;
  onOpenSMS?: (patient: Patient) => void;
}

export const ImmunizationMonitoringView: React.FC<ImmunizationMonitoringViewProps> = ({
  onSelectPatient,
  onOpenRecordVaccine,
  onOpenFollowUp,
  onOpenSMS,
}) => {
  const { 
    patients, 
    vaccinationRecords, 
    settings, 
    currentUser 
  } = useApp();

  const [activeStatusTab, setActiveStatusTab] = useState<'missed' | 'upcoming' | 'booster_completed'>('missed');
  const [selectedPurok, setSelectedPurok] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSmsPatient, setSelectedSmsPatient] = useState<{
    name: string;
    phone: string;
    vaccineName: string;
    guardian: string;
  } | null>(null);

  // Evaluate all patients
  const patientEvaluations = patients.map((p) => {
    const summary = evaluatePatientSummary(p, vaccinationRecords);
    const statuses = getPatientVaccineStatuses(p, vaccinationRecords);
    return {
      patient: p,
      summary,
      statuses,
    };
  });

  // Filter by Purok & search
  const filteredEvaluations = patientEvaluations.filter(({ patient }) => {
    if (selectedPurok !== 'ALL' && patient.purokSitio !== selectedPurok) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const name = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      return name.includes(q) || patient.id.toLowerCase().includes(q) || patient.motherName.toLowerCase().includes(q);
    }
    return true;
  });

  // Missed / Defaulters
  const missedList: Array<{
    patient: typeof patients[0];
    missedVaccines: PatientVaccineStatus[];
    ageFormatted: string;
  }> = [];

  // Upcoming
  const upcomingList: Array<{
    patient: typeof patients[0];
    upcomingVaccines: PatientVaccineStatus[];
    ageFormatted: string;
  }> = [];

  // Booster / Completed
  const completedOrBoosterList: Array<{
    patient: typeof patients[0];
    hasBooster: boolean;
    boosterDue: boolean;
    isFullyImmunized: boolean;
    ageFormatted: string;
  }> = [];

  filteredEvaluations.forEach(({ patient, summary, statuses }) => {
    const missed = statuses.filter((s) => s.status === 'missed' || s.status === 'due');
    if (missed.length > 0) {
      missedList.push({
        patient,
        missedVaccines: missed,
        ageFormatted: summary.ageFormatted,
      });
    }

    const upcoming = statuses.filter((s) => s.status === 'upcoming');
    if (upcoming.length > 0) {
      upcomingList.push({
        patient,
        upcomingVaccines: upcoming,
        ageFormatted: summary.ageFormatted,
      });
    }

    if (summary.isFullyImmunized || summary.hasBooster || summary.boosterDue) {
      completedOrBoosterList.push({
        patient,
        hasBooster: summary.hasBooster,
        boosterDue: summary.boosterDue,
        isFullyImmunized: summary.isFullyImmunized,
        ageFormatted: summary.ageFormatted,
      });
    }
  });

  // Generate SMS reminder text
  const generateSmsDraft = (guardian: string, childName: string, vaccine: string) => {
    return `Magandang araw po Nanay/Tatay ${guardian}. Mula po sa ${settings.healthCenterName}, nais po naming ipaalala na ang inyong anak na si ${childName} ay may nakatakdang bakuna (${vaccine}). Mangyaring pumunta po sa Barangay Health Station tuwing Miyerkules/Biyernes 8:00 AM - 12:00 NN para sa libreng bakuna. Maraming salamat po!`;
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Immunization Monitoring Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Automated tracking categorizing children into Missed (Defaulters), Upcoming, and Completed/Booster statuses.
          </p>
        </div>

        {/* Global Print Roster button */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print Monitoring Roster</span>
        </button>
      </div>

      {/* Top 3 Monitoring Status Selectors (As specified in research document) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* 🔴 MISSED TAB BUTTON */}
        <button
          onClick={() => setActiveStatusTab('missed')}
          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
            activeStatusTab === 'missed'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                🔴 Missed Vaccines
              </span>
            </div>
            <span className="text-2xl font-bold font-tabular text-red-700">
              {missedList.length}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Vaccination is overdue past grace period. Priority for BHW home follow-up.
          </p>
        </button>

        {/* 🟡 UPCOMING TAB BUTTON */}
        <button
          onClick={() => setActiveStatusTab('upcoming')}
          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
            activeStatusTab === 'upcoming'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                🟡 Upcoming Vaccines
              </span>
            </div>
            <span className="text-2xl font-bold font-tabular text-amber-700">
              {upcomingList.length}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Approaching target schedule within 14 days. Prepare clinic doses & notices.
          </p>
        </button>

        {/* 🟢 COMPLETED & BOOSTER TAB BUTTON */}
        <button
          onClick={() => setActiveStatusTab('booster_completed')}
          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
            activeStatusTab === 'booster_completed'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                🟢 Completed & Booster
              </span>
            </div>
            <span className="text-2xl font-bold font-tabular text-emerald-700">
              {completedOrBoosterList.length}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Fully Immunized Children (FIC) and 18-month DTP booster monitoring.
          </p>
        </button>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search patient or guardian..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-600 shrink-0" />
          <select
            value={selectedPurok}
            onChange={(e) => setSelectedPurok(e.target.value)}
            className="w-full sm:w-56 text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
          >
            <option value="ALL">All Puroks / Sitios</option>
            {settings.puroks.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Monitoring Content Based on Tab */}
      
      {/* 🔴 TAB 1: MISSED VACCINES (DEFAULTERS) */}
      {activeStatusTab === 'missed' && (
        <div className="space-y-4">
          <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900 space-y-0.5">
              <strong className="font-semibold block">Defaulter Tracing Protocol:</strong>
              <p>
                The following children have passed their scheduled vaccination window without documented administration. Barangay Health Workers (BHWs) are urged to conduct home follow-up visits or send SMS notices.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {missedList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {missedList.map(({ patient, missedVaccines, ageFormatted }) => (
                  <div key={patient.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectPatient(patient.id)}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 text-left transition-colors"
                          >
                            {patient.firstName} {patient.lastName}
                          </button>
                          <span className="text-xs font-mono text-slate-500">({patient.id})</span>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                            {missedVaccines.length} Overdue
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Current Age: <strong>{ageFormatted}</strong></span>
                          <span>·</span>
                          <span>Mother: <strong>{patient.motherName}</strong></span>
                          <span>·</span>
                          <span className="font-tabular text-slate-800">{patient.contactNumber}</span>
                          <span>·</span>
                          <span>{patient.purokSitio}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 no-print">
                        <button
                          onClick={() => {
                            if (onOpenSMS) {
                              onOpenSMS(patient);
                            } else {
                              setSelectedSmsPatient({
                                name: `${patient.firstName} ${patient.lastName}`,
                                phone: patient.contactNumber,
                                vaccineName: missedVaccines.map((v) => v.vaccine.shortLabel).join(', '),
                                guardian: patient.motherName,
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                          title="Send 1-Click SMS reminder to guardian"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>1-Click SMS</span>
                        </button>

                        <button
                          onClick={() => onOpenFollowUp(patient.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Log Home Visit
                        </button>

                        {currentUser?.role !== 'bhw' && (
                          <button
                            onClick={() => {
                              onSelectPatient(patient.id);
                              onOpenRecordVaccine(missedVaccines[0]?.vaccine.code);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                          >
                            <Syringe className="w-3.5 h-3.5" />
                            <span>Administer Now</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Overdue doses grid */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                        Pending Overdue Antigens:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {missedVaccines.map((mv) => (
                          <div key={mv.vaccine.code} className="p-2 bg-white rounded border border-red-200/80 text-xs space-y-0.5">
                            <div className="font-bold text-red-900 truncate">{mv.vaccine.name}</div>
                            <div className="text-slate-600 flex justify-between text-[11px]">
                              <span>Expected: <span className="font-tabular font-medium">{formatDateHuman(mv.dueDate)}</span></span>
                              <span className="text-red-700 font-semibold">{Math.abs(mv.daysDiff)} days late</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-900 text-sm">No Defaulters Recorded</h3>
                <p className="text-xs text-slate-600">All registered children are up to date on their immunization schedule.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🟡 TAB 2: UPCOMING VACCINES */}
      {activeStatusTab === 'upcoming' && (
        <div className="space-y-4">
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-0.5">
              <strong className="font-semibold block">Upcoming Clinic Roster:</strong>
              <p>
                These patients are approaching their scheduled vaccination date within the next 14 days. Prepare required vaccine vials, cold chain equipment, and notify parents.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {upcomingList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingList.map(({ patient, upcomingVaccines, ageFormatted }) => (
                  <div key={patient.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectPatient(patient.id)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 text-left transition-colors"
                        >
                          {patient.firstName} {patient.lastName}
                        </button>
                        <span className="text-xs font-mono text-slate-500">({patient.id})</span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                          Due Soon
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Age: <strong>{ageFormatted}</strong></span>
                        <span>·</span>
                        <span>Purok: <strong>{patient.purokSitio}</strong></span>
                        <span>·</span>
                        <span>Mother: {patient.motherName} ({patient.contactNumber})</span>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {upcomingVaccines.map((uv) => (
                          <span key={uv.vaccine.code} className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-800">
                            {uv.vaccine.shortLabel} · Due {formatDateHuman(uv.dueDate)} ({uv.daysDiff} days left)
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 no-print">
                      {onOpenSMS && (
                        <button
                          onClick={() => onOpenSMS(patient)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                          title="Send upcoming appointment SMS reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>SMS</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectPatient(patient.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        View Record
                      </button>
                      {currentUser?.role !== 'bhw' && (
                        <button
                          onClick={() => {
                            onSelectPatient(patient.id);
                            onOpenRecordVaccine(upcomingVaccines[0]?.vaccine.code);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                        >
                          Administer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                No upcoming vaccinations approaching in the next 14 days.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🟢 TAB 3: FULLY IMMUNIZED (FIC) & BOOSTER DOSES */}
      {activeStatusTab === 'booster_completed' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-0.5">
              <strong className="font-semibold block">Fully Immunized Children & Booster Cohort:</strong>
              <p>
                Recognizes children who completed all primary EPI antigens (FIC) and monitors toddlers due for their 18-month DTP booster dose.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {completedOrBoosterList.map(({ patient, hasBooster, boosterDue, isFullyImmunized, ageFormatted }) => (
                <div key={patient.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectPatient(patient.id)}
                        className="font-bold text-sm text-slate-900 hover:text-blue-600 text-left transition-colors"
                      >
                        {patient.firstName} {patient.lastName}
                      </button>
                      <span className="text-xs font-mono text-slate-500">({patient.id})</span>
                      
                      {isFullyImmunized && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                          🟢 FIC Achieved
                        </span>
                      )}

                      {hasBooster && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                          🟢 Booster Done
                        </span>
                      )}

                      {boosterDue && !hasBooster && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                          🟡 18-Mo Booster Due
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Age: <strong>{ageFormatted}</strong></span>
                      <span>·</span>
                      <span>Purok: {patient.purokSitio}</span>
                      <span>·</span>
                      <span>Mother: {patient.motherName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 no-print">
                    <button
                      onClick={() => onSelectPatient(patient.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Immunization History
                    </button>
                    {boosterDue && !hasBooster && currentUser?.role !== 'bhw' && (
                      <button
                        onClick={() => {
                          onSelectPatient(patient.id);
                          onOpenRecordVaccine('BOOSTER_DTP');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                      >
                        <Syringe className="w-3.5 h-3.5" />
                        <span>Give Booster</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SMS Reminder Template Modal */}
      {selectedSmsPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">SMS Vaccination Notice Draft</h3>
              </div>
              <button
                onClick={() => setSelectedSmsPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>To Guardian: <strong className="text-slate-800">{selectedSmsPatient.guardian}</strong></span>
                <span>Phone: <strong className="font-tabular text-slate-800">{selectedSmsPatient.phone}</strong></span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-sans text-xs">
                {generateSmsDraft(
                  selectedSmsPatient.guardian,
                  selectedSmsPatient.name,
                  selectedSmsPatient.vaccineName
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Copy text to phone messaging or barangay broadcast
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSmsPatient(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      generateSmsDraft(
                        selectedSmsPatient.guardian,
                        selectedSmsPatient.name,
                        selectedSmsPatient.vaccineName
                      )
                    );
                    alert('SMS text copied to clipboard!');
                    setSelectedSmsPatient(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Copy Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
