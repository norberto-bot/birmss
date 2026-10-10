import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Syringe, 
  Users,
  Search,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VACCINE_SCHEDULE } from '../data/initialData';
import { 
  getPatientVaccineStatuses, 
  formatDateHuman, 
  formatDateISO 
} from '../utils/immunizationUtils';
import { PatientVaccineStatus, Patient } from '../types';

interface CalendarEvent {
  patient: Patient;
  vaccineStatus: PatientVaccineStatus;
  dateStr: string; // YYYY-MM-DD
  isCompleted: boolean;
  isOverdue: boolean;
  isUpcoming: boolean;
}

export const VaccinationCalendarView: React.FC<{
  onSelectPatient: (patientId: string) => void;
  onOpenRecordVaccine: (vaccineCode?: string) => void;
}> = ({ onSelectPatient, onOpenRecordVaccine }) => {
  const { patients, vaccinationRecords, settings, language } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Oct 2026 (matching system current anchor)
  const [selectedPurok, setSelectedPurok] = useState('ALL');
  const [selectedVaccine, setSelectedVaccine] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'upcoming' | 'missed' | 'completed'>('ALL');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Compile all calendar events (both scheduled due dates and administered records)
  const events: CalendarEvent[] = [];

  patients.forEach((patient) => {
    if (selectedPurok !== 'ALL' && patient.purokSitio !== selectedPurok) return;

    const statuses = getPatientVaccineStatuses(patient, vaccinationRecords);
    statuses.forEach((st) => {
      if (selectedVaccine !== 'ALL' && st.vaccine.code !== selectedVaccine) return;

      const dateStr = st.record ? st.record.dateAdministered : st.dueDate;
      const isCompleted = !!st.record;
      const isOverdue = st.status === 'missed' || st.status === 'due';
      const isUpcoming = st.status === 'upcoming';

      if (statusFilter === 'completed' && !isCompleted) return;
      if (statusFilter === 'missed' && !isOverdue) return;
      if (statusFilter === 'upcoming' && !isUpcoming) return;

      events.push({
        patient,
        vaccineStatus: st,
        dateStr,
        isCompleted,
        isOverdue,
        isUpcoming,
      });
    });
  });

  // Calculate workloads
  const todayStr = formatDateISO(new Date(2026, 9, 1));
  const todayEvents = events.filter((e) => e.dateStr === todayStr);
  const overdueEvents = events.filter((e) => e.isOverdue);
  const upcomingWeekEvents = events.filter((e) => {
    const d = new Date(e.dateStr);
    const now = new Date(2026, 9, 1);
    const diff = Math.floor((d.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diff >= 0 && diff <= 7;
  });

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const jumpToday = () => {
    setCurrentDate(new Date(2026, 9, 1));
  };

  // Build grid days for Month View
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {language === 'fil' ? 'Kalendaryo ng Pagbabakuna' : 'Vaccination Schedule Calendar'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'fil' 
              ? 'Pang-araw-araw at lingguhang iskedyul ng mga bakuna sa barangay'
              : 'Daily and weekly workload planner for BHWs and nurses across all puroks'}
          </p>
        </div>

        {/* Workload Highlights */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <span className="text-amber-800 font-medium">Workload Today: </span>
            <strong className="font-tabular font-bold text-amber-900">{todayEvents.length} due</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
            <span className="text-blue-800 font-medium">Next 7 Days: </span>
            <strong className="font-tabular font-bold text-blue-900">{upcomingWeekEvents.length} sessions</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs">
            <span className="text-red-800 font-medium">Overdue Defaulters: </span>
            <strong className="font-tabular font-bold text-red-900">{overdueEvents.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Month / Year Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>

            <span className="text-sm font-bold text-slate-900 min-w-44 text-center">
              {monthName}
            </span>

            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>

            <button
              onClick={jumpToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors ml-2"
            >
              Today
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedPurok}
              onChange={(e) => setSelectedPurok(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            >
              <option value="ALL">All Puroks</option>
              {settings.puroks.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={selectedVaccine}
              onChange={(e) => setSelectedVaccine(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 max-w-44 truncate"
            >
              <option value="ALL">All Vaccines & Supplements</option>
              {VACCINE_SCHEDULE.map((v) => (
                <option key={v.code} value={v.code}>{v.shortLabel}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="missed">🔴 Missed / Overdue</option>
              <option value="upcoming">🟡 Upcoming</option>
              <option value="completed">🟢 Administered / Done</option>
            </select>
          </div>

        </div>
      </div>

      {/* Calendar Grid (Month View) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold text-slate-600 py-2.5">
          <span>SUN</span>
          <span>MON</span>
          <span>TUE</span>
          <span>WED (Clinic)</span>
          <span>THU</span>
          <span>FRI (Clinic)</span>
          <span>SAT</span>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
          {/* Empty cells before 1st of month */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/50 p-1.5 min-h-[90px]"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = events.filter((e) => e.dateStr === dateISO);
            const isToday = dateISO === todayStr;

            return (
              <div 
                key={dayNum} 
                className={`p-1.5 min-h-[90px] flex flex-col justify-between transition-colors ${
                  isToday ? 'bg-blue-50/40 ring-1 ring-inset ring-blue-500/20' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full font-bold font-tabular text-[11px] ${
                    isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                  }`}>
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="space-y-1 overflow-y-auto max-h-24">
                  {dayEvents.slice(0, 3).map((ev, evIdx) => (
                    <button
                      key={evIdx}
                      onClick={() => onSelectPatient(ev.patient.id)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate block transition-all ${
                        ev.isCompleted
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : ev.isOverdue
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title={`${ev.patient.firstName} ${ev.patient.lastName} - ${ev.vaccineStatus.vaccine.shortLabel}`}
                    >
                      <span className="font-bold">{ev.vaccineStatus.vaccine.shortLabel}</span> · {ev.patient.firstName}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-slate-500 font-semibold block text-center">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
