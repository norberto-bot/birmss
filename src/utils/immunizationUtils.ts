import { 
  Patient, 
  VaccinationRecord, 
  VaccineDefinition, 
  PatientVaccineStatus, 
  VaccinationMonitoringStatus,
  PatientFollowUp
} from '../types';
import { VACCINE_SCHEDULE } from '../data/initialData';

// Format Date object to YYYY-MM-DD
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date to human friendly "Sep 30, 2026"
export function formatDateHuman(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Calculate precise age breakdown (Years, Months, Days) from DOB
export function calculateAge(dobStr: string, referenceDate: Date = new Date()): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formatted: string;
  isInfant: boolean;
} {
  const [y, m, d] = dobStr.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  const now = referenceDate;

  const totalTimeDiff = now.getTime() - birth.getTime();
  const totalDays = Math.max(0, Math.floor(totalTimeDiff / (1000 * 3600 * 24)));

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let formatted = '';
  if (years > 0) {
    formatted = `${years} yr${years > 1 ? 's' : ''}${months > 0 ? `, ${months} mo${months > 1 ? 's' : ''}` : ''}`;
  } else if (months > 0) {
    formatted = `${months} mo${months > 1 ? 's' : ''}${days > 0 ? `, ${days} day${days > 1 ? 's' : ''}` : ''}`;
  } else {
    formatted = `${days} day${days === 1 ? '' : 's'} old`;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays,
    formatted,
    isInfant: totalDays <= 365,
  };
}

// Calculate target due date for a vaccine based on patient's DOB
export function getVaccineDueDate(dobStr: string, targetAgeDays: number): string {
  const [y, m, d] = dobStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  targetDate.setDate(targetDate.getDate() + targetAgeDays);
  return formatDateISO(targetDate);
}

// Evaluate status for a specific vaccine for a given patient
export function evaluateVaccineStatus(
  patient: Patient,
  vaccine: VaccineDefinition,
  records: VaccinationRecord[],
  currentDate: Date = new Date()
): PatientVaccineStatus {
  // Check if vaccine was administered
  const record = records.find(
    (r) => r.patientId === patient.id && r.vaccineCode === vaccine.code
  );

  const dueDateStr = getVaccineDueDate(patient.dateOfBirth, vaccine.targetAgeDays);
  const [dy, dm, dd] = dueDateStr.split('-').map(Number);
  const dueDate = new Date(dy, dm - 1, dd);

  const diffTime = dueDate.getTime() - currentDate.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 3600 * 24)); // >0: in future; <0: past due

  if (record) {
    return {
      vaccine,
      status: vaccine.isBooster ? 'booster_completed' : 'completed',
      dueDate: dueDateStr,
      record,
      daysDiff,
    };
  }

  // Not administered yet
  // If grace period has elapsed: MISSED
  if (daysDiff < -vaccine.gracePeriodDays) {
    return {
      vaccine,
      status: 'missed',
      dueDate: dueDateStr,
      daysDiff,
    };
  }

  // If due date has passed or is today (within grace period): DUE
  if (daysDiff <= 0) {
    return {
      vaccine,
      status: vaccine.isBooster ? 'booster_due' : 'due',
      dueDate: dueDateStr,
      daysDiff,
    };
  }

  // If due date is within upcoming 14 days: UPCOMING
  if (daysDiff <= 14) {
    return {
      vaccine,
      status: 'upcoming',
      dueDate: dueDateStr,
      daysDiff,
    };
  }

  // Further in the future
  return {
    vaccine,
    status: vaccine.isBooster ? 'booster_due' : 'upcoming',
    dueDate: dueDateStr,
    daysDiff,
  };
}

// Get all vaccine statuses for a patient
export function getPatientVaccineStatuses(
  patient: Patient,
  allRecords: VaccinationRecord[],
  currentDate: Date = new Date()
): PatientVaccineStatus[] {
  const patientRecords = allRecords.filter((r) => r.patientId === patient.id);
  return VACCINE_SCHEDULE.map((vaccine) =>
    evaluateVaccineStatus(patient, vaccine, patientRecords, currentDate)
  );
}

export interface PatientSummaryEvaluation {
  patient: Patient;
  ageFormatted: string;
  totalScheduled: number;
  completedCount: number;
  missedCount: number;
  dueCount: number;
  upcomingCount: number;
  isFullyImmunized: boolean; // FIC - Completed all mandatory infant EPI doses (excluding booster)
  hasBooster: boolean;
  boosterDue: boolean;
  overallStatus: 'MISSED' | 'DUE' | 'UPCOMING' | 'FIC' | 'IN_PROGRESS';
  priorityScore: number; // For sorting critical follow-ups
  nextExpectedVaccine?: {
    name: string;
    dueDate: string;
    status: VaccinationMonitoringStatus;
  };
}

// Evaluate overall patient summary
export function evaluatePatientSummary(
  patient: Patient,
  records: VaccinationRecord[],
  currentDate: Date = new Date()
): PatientSummaryEvaluation {
  const statuses = getPatientVaccineStatuses(patient, records, currentDate);
  const age = calculateAge(patient.dateOfBirth, currentDate);

  const mandatoryVaccines = VACCINE_SCHEDULE.filter((v) => !v.isBooster && !v.isSupplement);
  const boosterVaccines = VACCINE_SCHEDULE.filter((v) => v.isBooster);
  const supplementVaccines = VACCINE_SCHEDULE.filter((v) => v.isSupplement);

  const completedMandatory = statuses.filter(
    (s) => !s.vaccine.isBooster && !s.vaccine.isSupplement && s.status === 'completed' && (!s.record || s.record.verificationStatus === 'verified')
  );
  const missedList = statuses.filter((s) => s.status === 'missed');
  const dueList = statuses.filter((s) => s.status === 'due');
  const upcomingList = statuses.filter((s) => s.status === 'upcoming');

  const boosterStatus = statuses.find((s) => s.vaccine.isBooster);
  const hasBooster = boosterStatus?.status === 'booster_completed';
  const boosterDue = boosterStatus?.status === 'booster_due' || (age.totalDays >= 540 && !hasBooster);

  const isFullyImmunized = completedMandatory.length === mandatoryVaccines.length;

  let overallStatus: 'MISSED' | 'DUE' | 'UPCOMING' | 'FIC' | 'IN_PROGRESS' = 'IN_PROGRESS';
  if (missedList.length > 0) {
    overallStatus = 'MISSED';
  } else if (dueList.length > 0) {
    overallStatus = 'DUE';
  } else if (isFullyImmunized) {
    overallStatus = 'FIC';
  } else if (upcomingList.length > 0) {
    overallStatus = 'UPCOMING';
  }

  // Find next expected vaccine
  const pendingStatuses = statuses
    .filter((s) => s.status !== 'completed' && s.status !== 'booster_completed')
    .sort((a, b) => a.daysDiff - b.daysDiff);

  const nextExpectedVaccine = pendingStatuses.length > 0 ? {
    name: pendingStatuses[0].vaccine.shortLabel,
    dueDate: pendingStatuses[0].dueDate,
    status: pendingStatuses[0].status,
  } : undefined;

  // Priority score for attention queue
  const priorityScore = (missedList.length * 100) + (dueList.length * 10) + (upcomingList.length * 1);

  return {
    patient,
    ageFormatted: age.formatted,
    totalScheduled: mandatoryVaccines.length,
    completedCount: completedMandatory.length,
    missedCount: missedList.length,
    dueCount: dueList.length,
    upcomingCount: upcomingList.length,
    isFullyImmunized,
    hasBooster,
    boosterDue,
    overallStatus,
    priorityScore,
    nextExpectedVaccine,
  };
}

// Duplicate record check
export function checkDuplicatePatient(
  newPatient: Partial<Patient>,
  existingPatients: Patient[],
  excludeId?: string
): Patient | undefined {
  if (!newPatient.firstName || !newPatient.lastName || !newPatient.dateOfBirth) {
    return undefined;
  }

  const cleanFirst = newPatient.firstName.trim().toLowerCase();
  const cleanLast = newPatient.lastName.trim().toLowerCase();
  const dob = newPatient.dateOfBirth;

  return existingPatients.find((p) => {
    if (excludeId && p.id === excludeId) return false;
    const sameFirst = p.firstName.trim().toLowerCase() === cleanFirst;
    const sameLast = p.lastName.trim().toLowerCase() === cleanLast;
    const sameDob = p.dateOfBirth === dob;
    return sameFirst && sameLast && sameDob;
  });
}

// Generate new IDs
export function generatePatientId(existingPatients: Patient[]): string {
  const currentYear = new Date().getFullYear();
  const maxNumber = existingPatients.reduce((max, p) => {
    const match = p.id.match(/BRGY-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);

  const nextNum = String(maxNumber + 1).padStart(4, '0');
  return `BRGY-${currentYear}-${nextNum}`;
}

export function generateVaccineRecordId(existingRecords: VaccinationRecord[]): string {
  const maxNumber = existingRecords.reduce((max, r) => {
    const match = r.id.match(/VAC-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);

  const nextNum = String(maxNumber + 1).padStart(4, '0');
  return `VAC-${nextNum}`;
}

export function generateFollowUpId(existingFollowUps: PatientFollowUp[]): string {
  const maxNumber = existingFollowUps.reduce((max, f) => {
    const match = f.id.match(/FOL-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);

  const nextNum = String(maxNumber + 1).padStart(4, '0');
  return `FOL-${nextNum}`;
}

export function generateAuditLogId(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `AUD-${Date.now().toString().slice(-4)}-${randomSuffix}`;
}

export interface VaccinationReminderItem {
  patient: Patient;
  vaccine: VaccineDefinition;
  dueDate: string;
  daysRemaining: number; // 0 = today, 1 = tomorrow, 2..7 = in X days
  status: 'today' | 'tomorrow' | 'upcoming';
  guardianName: string;
  contactNumber: string;
  purok: string;
}

export interface PatientReminderGroup {
  patient: Patient;
  vaccinesDue: VaccineDefinition[];
  earliestDueDate: string;
  daysRemaining: number;
  guardianName: string;
  contactNumber: string;
  purok: string;
  hasRecentFollowUp: boolean;
  lastFollowUpDate?: string;
  lastFollowUpResult?: string;
}

export interface VaccinationRemindersReport {
  reminders: VaccinationReminderItem[];
  patientGroups: PatientReminderGroup[];
  totalDosesDue: number;
  totalChildrenDue: number;
  dueTodayCount: number;
  dueTomorrowCount: number;
  dueWithin7DaysCount: number;
}

/**
 * Checks the database for upcoming vaccination doses due within the specified window (default 7 days).
 */
export function getVaccinationReminders(
  patients: Patient[],
  records: VaccinationRecord[],
  followUps: PatientFollowUp[] = [],
  daysWindow: number = 7,
  referenceDate: Date = new Date()
): VaccinationRemindersReport {
  const reminders: VaccinationReminderItem[] = [];
  const patientGroupsMap = new Map<string, PatientReminderGroup>();

  for (const patient of patients) {
    if (patient.status !== 'Active') continue;

    const statuses = getPatientVaccineStatuses(patient, records, referenceDate);

    for (const item of statuses) {
      // Must not have an active verified/draft record
      if (item.record && item.record.verificationStatus !== 'rejected') {
        continue;
      }

      // Check if due within the next [daysWindow] days (daysDiff between -1 and daysWindow)
      if (item.daysDiff >= -1 && item.daysDiff <= daysWindow) {
        const daysRemaining = Math.max(0, item.daysDiff);
        const status = daysRemaining === 0 ? 'today' : daysRemaining === 1 ? 'tomorrow' : 'upcoming';

        const guardianName = patient.motherName || patient.guardianName || patient.fatherName || 'Parent/Guardian';

        reminders.push({
          patient,
          vaccine: item.vaccine,
          dueDate: item.dueDate,
          daysRemaining,
          status,
          guardianName,
          contactNumber: patient.contactNumber,
          purok: patient.purokSitio,
        });

        // Group by patient
        const existingGroup = patientGroupsMap.get(patient.id);
        const recentFollowUp = followUps.find((f) => f.patientId === patient.id);

        if (existingGroup) {
          existingGroup.vaccinesDue.push(item.vaccine);
          if (daysRemaining < existingGroup.daysRemaining) {
            existingGroup.daysRemaining = daysRemaining;
            existingGroup.earliestDueDate = item.dueDate;
          }
        } else {
          patientGroupsMap.set(patient.id, {
            patient,
            vaccinesDue: [item.vaccine],
            earliestDueDate: item.dueDate,
            daysRemaining,
            guardianName,
            contactNumber: patient.contactNumber,
            purok: patient.purokSitio,
            hasRecentFollowUp: !!recentFollowUp,
            lastFollowUpDate: recentFollowUp?.followUpDate,
            lastFollowUpResult: recentFollowUp?.followUpResult,
          });
        }
      }
    }
  }

  // Sort reminders by days remaining ascending
  reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);
  const patientGroups = Array.from(patientGroupsMap.values()).sort(
    (a, b) => a.daysRemaining - b.daysRemaining
  );

  const dueTodayCount = patientGroups.filter((g) => g.daysRemaining === 0).length;
  const dueTomorrowCount = patientGroups.filter((g) => g.daysRemaining === 1).length;
  const dueWithin7DaysCount = patientGroups.length;

  return {
    reminders,
    patientGroups,
    totalDosesDue: reminders.length,
    totalChildrenDue: patientGroups.length,
    dueTodayCount,
    dueTomorrowCount,
    dueWithin7DaysCount,
  };
}
