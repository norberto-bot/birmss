import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Syringe, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight,
  UserPlus,
  Phone,
  Home,
  FileCheck,
  Bell,
  MessageSquare,
  Filter,
  Check,
  Send,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  evaluatePatientSummary, 
  formatDateHuman,
  getVaccinationReminders,
  VaccinationRemindersReport
} from '../utils/immunizationUtils';
import { VACCINE_SCHEDULE } from '../data/initialData';
import { Patient } from '../types';

interface DashboardViewProps {
  onOpenAddPatient: () => void;
  onOpenRecordVaccine: () => void;
  onSelectPatient: (patientId: string) => void;
  onOpenFollowUp?: (patientId: string) => void;
  onOpenSMS?: (patient: Patient) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddPatient,
  onOpenRecordVaccine,
  onSelectPatient,
  onOpenFollowUp,
  onOpenSMS,
}) => {
  const { 
    patients, 
    vaccinationRecords, 
    followUps, 
    setActiveTab, 
    currentUser, 
    settings,
    openSurveillanceModal
  } = useApp();

  const [reminderPurokFilter, setReminderPurokFilter] = useState<string>('all');
  const [reminderUrgencyFilter, setReminderUrgencyFilter] = useState<'all' | 'today' | 'tomorrow' | 'soon'>('all');

  // Evaluate all patients
  const patientEvaluations = patients.map((p) =>
    evaluatePatientSummary(p, vaccinationRecords)
  );

  const totalPatients = patients.length;
  const fullyImmunized = patientEvaluations.filter((e) => e.isFullyImmunized).length;
  const missedCount = patientEvaluations.filter((e) => e.missedCount > 0).length;
  const boosterCount = patientEvaluations.filter((e) => e.hasBooster || e.boosterDue).length;

  const ficRate = totalPatients > 0 ? Math.round((fullyImmunized / totalPatients) * 100) : 0;

  // 🔔 7-Day Vaccination Reminders Calculation
  const remindersReport: VaccinationRemindersReport = useMemo(() => {
    return getVaccinationReminders(patients, vaccinationRecords, followUps, 7);
  }, [patients, vaccinationRecords, followUps]);

  // Filter reminder groups based on Purok and Urgency
  const filteredReminderGroups = useMemo(() => {
    return remindersReport.patientGroups.filter((group) => {
      if (reminderPurokFilter !== 'all' && group.purok !== reminderPurokFilter) {
        return false;
      }
      if (reminderUrgencyFilter === 'today' && group.daysRemaining !== 0) {
        return false;
      }
      if (reminderUrgencyFilter === 'tomorrow' && group.daysRemaining !== 1) {
        return false;
      }
      if (reminderUrgencyFilter === 'soon' && group.daysRemaining <= 1) {
        return false;
      }
      return true;
    });
  }, [remindersReport, reminderPurokFilter, reminderUrgencyFilter]);

  // Urgent attention queue: patients with missed vaccines
  const highPriorityPatients = patientEvaluations
    .filter((e) => e.missedCount > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // Recent vaccination records
  const recentRecords = [...vaccinationRecords]
    .sort((a, b) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Health Center Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {settings.healthCenterName}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {settings.barangayName}, {settings.municipalityCity}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Immunization Monitoring Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Welcome back, <strong className="text-slate-800">{currentUser?.fullName}</strong> ({currentUser?.title}).
          </p>
        </div>

        {/* Quick action group */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddPatient}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Patient</span>
          </button>

          {currentUser?.role !== 'bhw' && (
            <button
              onClick={onOpenRecordVaccine}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Syringe className="w-4 h-4" />
              <span>Record Vaccine</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            <FileCheck className="w-4 h-4 text-slate-500" />
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* 🔔 VACCINATION REMINDER: 7-DAY FOLLOW-UP ALERT BANNER FOR BHWS */}
      {remindersReport.totalChildrenDue > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>7-Day Vaccination Reminder Alert</span>
                  </span>
                  <span className="text-xs font-bold text-amber-950">
                    {remindersReport.totalChildrenDue} {remindersReport.totalChildrenDue === 1 ? 'Child' : 'Children'} Due for Immunization
                  </span>
                </div>

                <p className="text-xs text-amber-950 font-medium mt-1 leading-relaxed">
                  There are <strong>{remindersReport.totalDosesDue} upcoming dose{remindersReport.totalDosesDue > 1 ? 's' : ''}</strong> scheduled for children in the database within the next <strong>7 days</strong>. Barangay Health Workers are encouraged to follow up with parents via SMS or home visit to prevent infants from becoming defaulters.
                </p>

                {/* Breakdown stat pills */}
                <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                  {remindersReport.dueTodayCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md font-bold bg-red-100 text-red-800 border border-red-200">
                      🔴 {remindersReport.dueTodayCount} Due Today
                    </span>
                  )}
                  {remindersReport.dueTomorrowCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md font-bold bg-orange-100 text-orange-800 border border-orange-200">
                      🟠 {remindersReport.dueTomorrowCount} Due Tomorrow
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                    🟡 {remindersReport.totalChildrenDue - remindersReport.dueTodayCount - remindersReport.dueTomorrowCount} Later This Week
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const el = document.getElementById('vaccination-reminders-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Review Reminder Roster</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 Population Percentage with Actual Numbers & Clickable Detailed Surveillance */}
      <div 
        onClick={openSurveillanceModal}
        className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md hover:shadow-lg transition-all cursor-pointer border border-emerald-500/30 group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Target Population Surveillance
              </span>
              <span className="text-[11px] text-emerald-200/80 font-medium">
                (Click section to view detailed surveillance list)
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-tabular text-white">
                {ficRate}%
              </h2>
              <span className="text-lg sm:text-xl font-bold text-emerald-300 font-tabular">
                ({fullyImmunized.toLocaleString()} / {totalPatients.toLocaleString()})
              </span>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              <strong>Meaning:</strong> {fullyImmunized.toLocaleString()} patients fully immunized out of {totalPatients.toLocaleString()} total registered patients.
            </p>
          </div>

          {/* 3 Clear Population Count Boxes */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 text-center">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                Total Registered
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-tabular mt-0.5">
                {totalPatients.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-300">Population</span>
            </div>

            <div className="bg-emerald-500/20 backdrop-blur-xs p-3 rounded-xl border border-emerald-400/30 text-center">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                Fully Immunized
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-200 font-tabular mt-0.5">
                {fullyImmunized.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-300 font-bold">{ficRate}% FIC</span>
            </div>

            <div className="bg-amber-500/20 backdrop-blur-xs p-3 rounded-xl border border-amber-400/30 text-center">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                Not Completed
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-200 font-tabular mt-0.5">
                {(totalPatients - fullyImmunized).toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-300">Incomplete</span>
            </div>

          </div>

        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex-1 max-w-md bg-white/20 rounded-full h-2.5 overflow-hidden flex">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${ficRate}%` }} 
            />
          </div>
          <div className="flex items-center gap-1.5 text-emerald-200 group-hover:text-white font-semibold text-xs transition-colors">
            <span>View Detailed Surveillance Breakdown & Defaulter List ({missedCount} Defaulters)</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Patients */}
        <div 
          onClick={() => setActiveTab('patients')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 sm:p-4 shadow-xs cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Patients</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-tabular text-slate-900">{totalPatients}</span>
            <span className="text-xs text-slate-500">Active</span>
          </div>
          <p className="mt-1 text-xs text-blue-600 hover:underline flex items-center gap-1">
            <span>View registry</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* Fully Immunized Child (FIC) */}
        <div 
          onClick={openSurveillanceModal}
          className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-3.5 sm:p-4 shadow-xs cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Fully Immunized</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-bold font-tabular text-emerald-700">{ficRate}%</span>
            <span className="text-xs font-semibold text-emerald-800">({fullyImmunized} / {totalPatients})</span>
          </div>
          <p className="mt-1 text-xs text-emerald-700 flex items-center gap-1">
            <span>Primary series · View roster</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* 🔴 Missed Vaccinations (Alert) */}
        <div 
          onClick={() => setActiveTab('monitoring')}
          className="bg-red-50/70 border border-red-200 hover:border-red-300 rounded-xl p-3.5 sm:p-4 shadow-xs cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800">🔴 Missed / Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-tabular text-red-700">{missedCount}</span>
            <span className="text-xs text-red-700 font-medium">Defaulters</span>
          </div>
          <p className="mt-1 text-xs text-red-700 font-medium flex items-center gap-1">
            <span>Needs BHW follow-up</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* 🔔 7-Day Vaccination Reminder (Alert Badge for BHWs) */}
        <div 
          onClick={() => {
            const el = document.getElementById('vaccination-reminders-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-amber-50/80 border-2 border-amber-300 hover:border-amber-400 rounded-xl p-3.5 sm:p-4 shadow-xs cursor-pointer transition-all hover:shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-900">Vaccination Reminder</span>
              {remindersReport.totalChildrenDue > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                  {remindersReport.totalChildrenDue} Alert
                </span>
              )}
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-tabular text-amber-950">{remindersReport.totalChildrenDue}</span>
            <span className="text-xs text-amber-800 font-semibold">Due in 7 Days</span>
          </div>
          <p className="mt-1 text-xs text-amber-800 font-medium flex items-center gap-1">
            <span>{remindersReport.totalDosesDue} doses to follow up</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* 🟢 Boosters Due / Completed */}
        <div 
          onClick={() => setActiveTab('monitoring')}
          className="col-span-2 lg:col-span-1 bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-3.5 sm:p-4 shadow-xs cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-800">🟢 Booster Doses</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-tabular text-purple-700">{boosterCount}</span>
            <span className="text-xs text-purple-700">Toddler DTP</span>
          </div>
          <p className="mt-1 text-xs text-purple-700 flex items-center gap-1">
            <span>18-Month Booster</span>
          </p>
        </div>

      </div>

      {/* 🔔 DEDICATED SECTION: VACCINATION REMINDERS (UPCOMING DOSES IN NEXT 7 DAYS) */}
      <div 
        id="vaccination-reminders-section" 
        className="bg-white border-2 border-amber-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Vaccination Reminders: Upcoming Doses in Next 7 Days
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{filteredReminderGroups.length} Follow-Ups Needed</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Checks patient registry records for routine immunizations due within the 7-day recall window. BHWs can send SMS reminders or log follow-up visits.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Purok Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">Purok:</span>
              <select
                value={reminderPurokFilter}
                onChange={(e) => setReminderPurokFilter(e.target.value)}
                className="py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white"
              >
                <option value="all">All Puroks ({remindersReport.totalChildrenDue})</option>
                {settings.puroks.map((purok) => {
                  const countInPurok = remindersReport.patientGroups.filter((g) => g.purok === purok).length;
                  return (
                    <option key={purok} value={purok}>
                      {purok} ({countInPurok})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Urgency Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setReminderUrgencyFilter('all')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  reminderUrgencyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All 7d
              </button>
              <button
                onClick={() => setReminderUrgencyFilter('today')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  reminderUrgencyFilter === 'today' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-red-700'
                }`}
              >
                Today ({remindersReport.dueTodayCount})
              </button>
              <button
                onClick={() => setReminderUrgencyFilter('tomorrow')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  reminderUrgencyFilter === 'tomorrow' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-orange-700'
                }`}
              >
                Tomorrow ({remindersReport.dueTomorrowCount})
              </button>
              <button
                onClick={() => setReminderUrgencyFilter('soon')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  reminderUrgencyFilter === 'soon' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                2-7 Days
              </button>
            </div>

          </div>
        </div>

        {/* Reminder Cards Grid */}
        {filteredReminderGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReminderGroups.map((group) => (
              <div 
                key={group.patient.id} 
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 hover:bg-amber-50/60 transition-all space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onSelectPatient(group.patient.id)}
                        className="font-bold text-sm text-slate-900 hover:text-blue-700 text-left transition-colors"
                      >
                        {group.patient.firstName} {group.patient.lastName}
                      </button>
                      <span className="text-xs font-mono text-slate-500 font-bold">({group.patient.id})</span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span>Purok: <strong className="text-slate-800">{group.purok}</strong></span>
                      <span>·</span>
                      <span>Mother: <strong className="text-slate-800">{group.guardianName}</strong></span>
                      <span>·</span>
                      <a 
                        href={`tel:${group.contactNumber}`}
                        className="text-blue-700 hover:underline flex items-center gap-1 font-tabular font-medium"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{group.contactNumber}</span>
                      </a>
                    </div>
                  </div>

                  {/* Due Tag */}
                  <div className="shrink-0 text-right">
                    {group.daysRemaining === 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3 text-red-600" />
                        <span>Due Today!</span>
                      </span>
                    ) : group.daysRemaining === 1 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-600" />
                        <span>Due Tomorrow</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>In {group.daysRemaining} days</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-tabular block mt-0.5">
                      {formatDateHuman(group.earliestDueDate)}
                    </span>
                  </div>
                </div>

                {/* Vaccines Due Chips */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Upcoming Vaccines Due:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.vaccinesDue.map((v) => (
                      <span 
                        key={v.code} 
                        className="px-2 py-0.5 rounded-md text-xs font-semibold bg-white border border-amber-300 text-amber-950 shadow-2xs"
                      >
                        {v.shortLabel} ({v.name})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Follow-up status and Action buttons */}
                <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-[11px] text-slate-600">
                    {group.hasRecentFollowUp ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Follow-up logged on {group.lastFollowUpDate}</span>
                      </span>
                    ) : (
                      <span className="text-amber-800 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>No follow-up logged yet this week</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenSMS && (
                      <button
                        onClick={() => onOpenSMS(group.patient)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                        title="Send SMS reminder to parent"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send SMS</span>
                      </button>
                    )}

                    {onOpenFollowUp && (
                      <button
                        onClick={() => onOpenFollowUp(group.patient.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
                        title="Log home visit or phone call"
                      >
                        <Home className="w-3.5 h-3.5 text-slate-500" />
                        <span>Log Visit</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectPatient(group.patient.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      EPI Card
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl space-y-1">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-bold text-slate-800 text-sm">No Upcoming Doses Found in Filter</p>
            <p className="text-slate-500">
              There are no children scheduled for vaccination within the selected 7-day criteria for {reminderPurokFilter === 'all' ? 'any purok' : reminderPurokFilter}.
            </p>
          </div>
        )}
      </div>

      {/* Main Grid: Priority Missed Follow-up List & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: High Priority Defaulters / Missed Vaccinations List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <h3 className="text-sm font-bold text-slate-900">
                  Priority Defaulter Follow-Up List ({highPriorityPatients.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('monitoring')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all monitoring</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {highPriorityPatients.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {highPriorityPatients.map((item) => (
                  <div 
                    key={item.patient.id} 
                    className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectPatient(item.patient.id)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 text-left transition-colors"
                        >
                          {item.patient.firstName} {item.patient.lastName}
                        </button>
                        <span className="text-xs font-tabular text-slate-500">({item.patient.id})</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                          {item.missedCount} Missed Dose{item.missedCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Age: <strong className="text-slate-700">{item.ageFormatted}</strong></span>
                        <span>·</span>
                        <span>Guardian: <strong className="text-slate-700">{item.patient.motherName}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <strong className="font-tabular text-slate-700">{item.patient.contactNumber}</strong>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3 text-slate-400" />
                          {item.patient.purokSitio}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onSelectPatient(item.patient.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Record
                      </button>
                      {currentUser?.role !== 'bhw' && (
                        <button
                          onClick={() => {
                            onSelectPatient(item.patient.id);
                            onOpenRecordVaccine();
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Syringe className="w-3 h-3" />
                          <span>Administer</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No Missed Defaulters Today</p>
                <p className="text-slate-500 mt-0.5">All scheduled infant doses in the barangay are up to date.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Standard EPI Antigen Coverage & Recent Vaccinations */}
        <div className="space-y-4">
          
          {/* EPI Coverage Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Antigen Coverage Rate</h3>
              <span className="text-xs text-slate-500 font-tabular">{totalPatients} Children</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { name: 'BCG (Tuberculosis)', code: 'BCG' },
                { name: 'Hepatitis B (Birth)', code: 'HEPB' },
                { name: 'Pentavalent 1-3', code: 'PENTA3' },
                { name: 'OPV 1-3 (Polio)', code: 'OPV3' },
                { name: 'PCV 1-3 (Pneumo)', code: 'PCV3' },
                { name: 'MMR 1-2 (Measles)', code: 'MMR2' },
              ].map((item) => {
                const count = vaccinationRecords.filter((r) => r.vaccineCode === item.code).length;
                const pct = totalPatients > 0 ? Math.min(100, Math.round((count / totalPatients) * 100)) : 0;
                return (
                  <div key={item.code} className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="truncate">{item.name}</span>
                      <span className="font-tabular font-semibold">{pct}% ({count})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 85 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Immunization Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Vaccinations</h3>
              <button 
                onClick={() => setActiveTab('vaccines')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {recentRecords.map((r) => {
                const pt = patients.find((p) => p.id === r.patientId);
                return (
                  <div key={r.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{r.vaccineName}</strong>
                      <span className="font-tabular text-slate-500">{formatDateHuman(r.dateAdministered)}</span>
                    </div>
                    <div className="text-slate-600 flex items-center justify-between">
                      <span>Recipient: <strong className="text-slate-800">{pt ? `${pt.firstName} ${pt.lastName}` : r.patientId}</strong></span>
                      <span className="text-slate-500">Dose {r.doseNumber}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      Vaccinator: {r.vaccinatorName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
