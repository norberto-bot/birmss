import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Search, 
  Phone, 
  MapPin, 
  User, 
  MessageSquare, 
  Calendar, 
  ShieldAlert, 
  Download, 
  Eye, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Building2,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { evaluatePatientSummary, formatDateHuman } from '../utils/immunizationUtils';
import { Patient } from '../types';

interface DetailedSurveillanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patientId: string) => void;
  onOpenSMS?: (patient: Patient) => void;
  onOpenFollowUp?: (patientId: string) => void;
}

export const DetailedSurveillanceModal: React.FC<DetailedSurveillanceModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  onOpenSMS,
  onOpenFollowUp,
}) => {
  const { patients, vaccinationRecords, currentUser, settings } = useApp();
  
  const [filterPurok, setFilterPurok] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'missed' | 'upcoming' | 'incomplete'>('incomplete');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  // Strict Role-Based Access Enforcement
  if (currentUser?.role === 'patient') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-600">
            Epidemiological surveillance data and patient lists are strictly restricted to authorized barangay healthcare workers.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isBHW = currentUser?.role === 'bhw';
  const assignedPurok = currentUser?.purokAssigned;

  // Evaluate all patients
  const allEvaluations = patients.map((p) => evaluatePatientSummary(p, vaccinationRecords));

  // Role-based scope filtering: BHWs strictly restricted to their assigned purok
  const scopedEvaluations = allEvaluations.filter((ev) => {
    if (isBHW && assignedPurok) {
      return ev.patient.purokSitio.toLowerCase() === assignedPurok.toLowerCase();
    }
    return true;
  });

  const totalUnderSurveillance = scopedEvaluations.length;
  const fullyImmunizedList = scopedEvaluations.filter((ev) => ev.isFullyImmunized);
  const notFullyImmunizedList = scopedEvaluations.filter((ev) => !ev.isFullyImmunized);
  const missedList = scopedEvaluations.filter((ev) => ev.missedCount > 0);
  const upcomingList = scopedEvaluations.filter((ev) => ev.upcomingCount > 0 && ev.missedCount === 0);

  const ficRate = totalUnderSurveillance > 0 
    ? Math.round((fullyImmunizedList.length / totalUnderSurveillance) * 100) 
    : 0;

  // Filter list for table
  const displayedPatients = scopedEvaluations.filter((ev) => {
    // Status filter
    if (statusFilter === 'missed' && ev.missedCount === 0) return false;
    if (statusFilter === 'upcoming' && (ev.upcomingCount === 0 || ev.missedCount > 0)) return false;
    if (statusFilter === 'incomplete' && ev.isFullyImmunized) return false;

    // Purok filter (for nurses/admins)
    if (!isBHW && filterPurok !== 'all' && ev.patient.purokSitio !== filterPurok) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${ev.patient.firstName} ${ev.patient.lastName}`.toLowerCase().includes(q);
      const matchId = ev.patient.id.toLowerCase().includes(q);
      const matchPurok = ev.patient.purokSitio.toLowerCase().includes(q);
      const matchMother = ev.patient.motherName.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPurok && !matchMother) return false;
    }

    return true;
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  const handlePrintSurveillance = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Surveillance Registry
              </span>
              {isBHW ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Restricted Scope: {assignedPurok || 'Assigned Area'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Comprehensive Barangay Scope (All Puroks)
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Immunization Coverage Surveillance & Defaulter Tracking
            </h2>
            <p className="text-xs text-slate-300">
              {settings.barangayName}, {settings.municipalityCity} · Monitoring children needing follow-up
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintSurveillance}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export List</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Population & Coverage Stat Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">
              Total Under Surveillance
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-tabular">
                {totalUnderSurveillance}
              </span>
              <span className="text-xs text-slate-500">registered</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Active infant & child cohort</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-800 block uppercase">
              Fully Immunized (FIC)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 font-tabular">
                {fullyImmunizedList.length}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {ficRate}%
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Completed primary series</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-800 block uppercase">
              Not Yet Fully Immunized
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700 font-tabular">
                {notFullyImmunizedList.length}
              </span>
              <span className="text-xs text-amber-700 font-medium">
                ({totalUnderSurveillance > 0 ? Math.round((notFullyImmunizedList.length / totalUnderSurveillance) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[10px] text-amber-700 mt-0.5">In-progress or overdue</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-red-200 shadow-xs">
            <span className="text-[11px] font-semibold text-red-800 block uppercase">
              🔴 Urgent Defaulters
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-700 font-tabular">
                {missedList.length}
              </span>
              <span className="text-xs text-red-700 font-medium">Priority</span>
            </div>
            <p className="text-[10px] text-red-700 mt-0.5">Missed scheduled window</p>
          </div>

        </div>

        {/* Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          
          {/* Status Segment Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('incomplete')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'incomplete'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Needs Follow-Up ({notFullyImmunizedList.length})
            </button>

            <button
              onClick={() => setStatusFilter('missed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'missed'
                  ? 'bg-red-100 text-red-900 border border-red-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🔴 Missed / Defaulters ({missedList.length})
            </button>

            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'upcoming'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🟡 Upcoming Due ({upcomingList.length})
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Cohort ({totalUnderSurveillance})
            </button>
          </div>

          {/* Search & Purok (If authorized) */}
          <div className="flex items-center gap-2">
            {!isBHW && (
              <select
                value={filterPurok}
                onChange={(e) => setFilterPurok(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700"
              >
                <option value="all">All Puroks ({settings.puroks?.length || 0})</option>
                {settings.puroks?.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, ID, mother..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44 sm:w-56"
              />
            </div>
          </div>

        </div>

        {/* Scrollable Surveillance List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {displayedPatients.length > 0 ? (
            <div className="space-y-3">
              {displayedPatients.map((ev) => {
                const nextVaccine = ev.nextExpectedVaccine;
                const isMissed = ev.missedCount > 0;

                return (
                  <div
                    key={ev.patient.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      isMissed
                        ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                        : ev.isFullyImmunized
                        ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    } shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3`}
                  >
                    {/* Patient Core Info */}
                    <div className="space-y-1 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {ev.patient.lastName}, {ev.patient.firstName} {ev.patient.middleName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          {ev.patient.id}
                        </span>
                        {isMissed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Defaulter ({ev.missedCount} Missed)
                          </span>
                        ) : ev.isFullyImmunized ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            FIC Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            In Progress
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Age: <strong>{ev.ageFormatted}</strong> (DOB: {ev.patient.dateOfBirth})</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.patient.purokSitio}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Mother: {ev.patient.motherName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.patient.contactNumber}</span>
                        </span>
                      </div>
                    </div>

                    {/* Next Vaccine Due Status */}
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 min-w-[220px]">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Vaccine Surveillance Status
                      </span>
                      {nextVaccine ? (
                        <div className="mt-1">
                          <div className="font-semibold text-xs text-slate-800">
                            {nextVaccine.name}
                          </div>
                          <div className={`text-[11px] font-medium mt-0.5 ${
                            isMissed ? 'text-red-700 font-bold' : 'text-slate-600'
                          }`}>
                            Target Date: {formatDateHuman(nextVaccine.dueDate)}
                            {nextVaccine.status === 'missed' && (
                              <span className="ml-1 text-red-600 font-bold">
                                (Overdue)
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-700 font-semibold mt-1">
                          Primary series complete · No pending doses
                        </div>
                      )}
                    </div>

                    {/* Action Group */}
                    <div className="flex items-center gap-2 shrink-0">
                      {onOpenSMS && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenSMS(ev.patient);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Send One-Click SMS reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>SMS</span>
                        </button>
                      )}

                      {onOpenFollowUp && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenFollowUp(ev.patient.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Log Home Visit or Follow-up"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Follow-up</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onClose();
                          onSelectPatient(ev.patient.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Defaulters Found in this Filter</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All registered patients in this criteria have completed their scheduled vaccines or are up to date!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>
              Real-time synchronization with active patient masterlist and vaccine log.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Close Surveillance View
          </button>
        </div>

      </div>
    </div>
  );
};
