import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  Phone, 
  UserCheck, 
  ShieldAlert, 
  ArrowUpDown,
  MessageSquare,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  evaluatePatientSummary, 
  formatDateHuman 
} from '../utils/immunizationUtils';
import { Patient } from '../types';

interface PatientManagementViewProps {
  onOpenAddPatient: () => void;
  onSelectPatient: (patientId: string) => void;
  onOpenSMS?: (patient: Patient) => void;
}

export const PatientManagementView: React.FC<PatientManagementViewProps> = ({
  onOpenAddPatient,
  onSelectPatient,
  onOpenSMS,
}) => {
  const { 
    patients, 
    vaccinationRecords, 
    settings, 
    currentUser,
    verifyPatient,
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurok, setSelectedPurok] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'age' | 'status' | 'purok'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    // Search query matching
    const query = searchTerm.toLowerCase().trim();
    if (query) {
      const fullName = `${patient.firstName} ${patient.middleName} ${patient.lastName} ${patient.suffix || ''}`.toLowerCase();
      const matchesName = fullName.includes(query);
      const matchesId = patient.id.toLowerCase().includes(query);
      const matchesMother = patient.motherName.toLowerCase().includes(query);
      const matchesFather = patient.fatherName.toLowerCase().includes(query);
      const matchesAddress = patient.address.toLowerCase().includes(query);
      const matchesPurok = patient.purokSitio.toLowerCase().includes(query);
      if (!matchesName && !matchesId && !matchesMother && !matchesFather && !matchesAddress && !matchesPurok) {
        return false;
      }
    }

    // Purok filter
    if (selectedPurok !== 'ALL' && patient.purokSitio !== selectedPurok) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      const summary = evaluatePatientSummary(patient, vaccinationRecords);
      if (selectedStatus === 'MISSED' && summary.missedCount === 0) return false;
      if (selectedStatus === 'UPCOMING' && (summary.upcomingCount === 0 || summary.missedCount > 0)) return false;
      if (selectedStatus === 'FIC' && !summary.isFullyImmunized) return false;
      if (selectedStatus === 'BOOSTER' && !summary.boosterDue && !summary.hasBooster) return false;
    }

    return true;
  });

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const summaryA = evaluatePatientSummary(a, vaccinationRecords);
    const summaryB = evaluatePatientSummary(b, vaccinationRecords);

    if (sortField === 'name') {
      const nameA = `${a.lastName}, ${a.firstName}`;
      const nameB = `${b.lastName}, ${b.firstName}`;
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }
    if (sortField === 'purok') {
      return sortOrder === 'asc' ? a.purokSitio.localeCompare(b.purokSitio) : b.purokSitio.localeCompare(a.purokSitio);
    }
    if (sortField === 'age') {
      // Younger first or older first
      const dobA = new Date(a.dateOfBirth).getTime();
      const dobB = new Date(b.dateOfBirth).getTime();
      return sortOrder === 'asc' ? dobB - dobA : dobA - dobB;
    }
    // Default: Sort by attention priority (missed first, then upcoming, then FIC)
    return sortOrder === 'asc' 
      ? summaryB.priorityScore - summaryA.priorityScore 
      : summaryA.priorityScore - summaryB.priorityScore;
  });

  return (
    <div className="space-y-5">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Patient Registry & Profiles
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Registered children and infants under {settings.healthCenterName}. Ages are auto-calculated from birth date.
          </p>
        </div>

        <button
          onClick={onOpenAddPatient}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search by child's name, ID, mother, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Purok Filter */}
          <div>
            <select
              value={selectedPurok}
              onChange={(e) => setSelectedPurok(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            >
              <option value="ALL">All Puroks / Sitios</option>
              {settings.puroks.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            >
              <option value="ALL">All Immunization Statuses</option>
              <option value="MISSED">🔴 Missed / Overdue (Defaulters)</option>
              <option value="UPCOMING">🟡 Upcoming / Due Soon</option>
              <option value="FIC">🟢 Fully Immunized Child (FIC)</option>
              <option value="BOOSTER">🟢 18-Mo Booster Due/Done</option>
            </select>
          </div>

        </div>

        {/* Active Filter Indicators & Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="font-tabular text-slate-800">{sortedPatients.length}</strong> of <strong className="font-tabular text-slate-800">{patients.length}</strong> patients</span>
            {(searchTerm || selectedPurok !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPurok('ALL');
                  setSelectedStatus('ALL');
                }}
                className="text-blue-600 hover:underline font-medium ml-2"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Sort toggler */}
          <div className="flex items-center gap-1.5">
            <span>Sort by:</span>
            <button
              onClick={() => {
                if (sortField === 'status') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('status');
                  setSortOrder('asc');
                }
              }}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                sortField === 'status' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Priority / Status
            </button>
            <button
              onClick={() => {
                if (sortField === 'name') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('name');
                  setSortOrder('asc');
                }
              }}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                sortField === 'name' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => {
                if (sortField === 'age') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('age');
                  setSortOrder('asc');
                }
              }}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                sortField === 'age' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Age
            </button>
          </div>
        </div>
      </div>

      {/* Patient List (Responsive: Desktop Table / Mobile Card Layout) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        
        {/* Desktop / Laptop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-3">Patient ID & Name</th>
                <th scope="col" className="px-4 py-3">Age & Birthdate</th>
                <th scope="col" className="px-4 py-3">Sex</th>
                <th scope="col" className="px-4 py-3">Purok / Sitio</th>
                <th scope="col" className="px-4 py-3">Parent / Guardian</th>
                <th scope="col" className="px-4 py-3">Contact</th>
                <th scope="col" className="px-4 py-3 text-center">Immunization Status</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedPatients.length > 0 ? (
                sortedPatients.map((patient) => {
                  const summary = evaluatePatientSummary(patient, vaccinationRecords);
                  return (
                    <tr 
                      key={patient.id}
                      onClick={() => onSelectPatient(patient.id)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      {/* Name & ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {patient.lastName}, {patient.firstName} {patient.middleName} {patient.suffix}
                          </span>
                          {patient.verificationStatus === 'draft' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Draft
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 font-tabular text-[11px] flex items-center gap-2">
                          <span>{patient.id}</span>
                          {patient.verificationStatus === 'draft' && currentUser?.role !== 'bhw' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                verifyPatient(patient.id);
                              }}
                              className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Age & DOB */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {summary.ageFormatted}
                        </div>
                        <div className="text-slate-600 font-tabular text-[11px]">
                          DOB: {formatDateHuman(patient.dateOfBirth)}
                        </div>
                      </td>

                      {/* Sex */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          patient.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {patient.gender}
                        </span>
                      </td>

                      {/* Address / Purok */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-900 font-medium">{patient.purokSitio}</div>
                        <div className="text-slate-600 text-[11px] truncate max-w-[150px]">{patient.address}</div>
                      </td>

                      {/* Guardian */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-900">{patient.motherName} (Mother)</div>
                        {patient.fatherName && (
                          <div className="text-slate-600 text-[11px]">{patient.fatherName} (Father)</div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 font-tabular text-slate-700">
                        {patient.contactNumber}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        {summary.missedCount > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                              🔴 {summary.missedCount} Missed
                            </span>
                            <span className="text-[10px] text-red-600 mt-0.5">Defaulter follow-up</span>
                          </div>
                        ) : summary.isFullyImmunized ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                              🟢 Fully Immunized
                            </span>
                            <span className="text-[10px] text-emerald-700 mt-0.5">FIC Achieved</span>
                          </div>
                        ) : summary.upcomingCount > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                              🟡 Upcoming
                            </span>
                            <span className="text-[10px] text-amber-700 mt-0.5">{summary.nextExpectedVaccine?.name}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            On Schedule ({summary.completedCount}/{summary.totalScheduled})
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenSMS && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenSMS(patient);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-white hover:bg-blue-600 rounded-md transition-colors border border-blue-200 flex items-center gap-1 shrink-0"
                              title="Send 1-Click SMS Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>SMS</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPatient(patient.id);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 shrink-0"
                          >
                            View Record
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No patients match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / Phone Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {sortedPatients.length > 0 ? (
            sortedPatients.map((patient) => {
              const summary = evaluatePatientSummary(patient, vaccinationRecords);
              return (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className="p-4 hover:bg-blue-50/30 active:bg-blue-50 cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">
                          {patient.firstName} {patient.middleName} {patient.lastName} {patient.suffix}
                        </span>
                        {patient.verificationStatus === 'draft' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-tabular">
                        ID: {patient.id} · Age: <strong className="text-slate-700">{summary.ageFormatted}</strong>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {summary.missedCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                          🔴 Missed ({summary.missedCount})
                        </span>
                      ) : summary.isFullyImmunized ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          🟢 FIC
                        </span>
                      ) : summary.upcomingCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          🟡 Upcoming
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{patient.purokSitio} · {patient.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mother: <strong className="text-slate-700">{patient.motherName}</strong></span>
                      <span className="font-tabular text-slate-700">{patient.contactNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      Completed: <strong className="font-tabular text-slate-800">{summary.completedCount}</strong> of {summary.totalScheduled}
                    </span>
                    <div className="flex items-center gap-2">
                      {onOpenSMS && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSMS(patient);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>SMS</span>
                        </button>
                      )}
                      <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                        <span>Open Record</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No patients match your search criteria.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
