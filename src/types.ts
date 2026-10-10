export type UserRole = 'admin' | 'doctor' | 'nurse' | 'bhw' | 'patient';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  title: string;
  purokAssigned?: string;
  isActive: boolean;
  contactNumber: string;
  createdAt: string;
  passwordHash?: string;
  isVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: string;
  // Deactivation and Reactivation Complaint & Verification fields
  deactivatedAt?: string;
  deactivatedBy?: string;
  deactivationReason?: string;
  pendingReactivation?: boolean;
  reactivationComplaint?: string;
  reactivationRequestedAt?: string;
  reactivatedAt?: string;
  reactivatedBy?: string;
  adminVerificationNotes?: string;
}

export type PatientStatus = 'Active' | 'Inactive' | 'Transferred';
export type Gender = 'Male' | 'Female';
export type VerificationStatus = 'verified' | 'draft' | 'rejected';

export interface Patient {
  id: string; // e.g. BRGY-2026-001
  firstName: string;
  middleName: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  address: string;
  purokSitio: string;
  motherName: string;
  fatherName: string;
  guardianName?: string;
  contactNumber: string;
  registrationDate: string; // YYYY-MM-DD
  status: PatientStatus;
  birthWeightKg?: number;
  birthPlace?: string;
  bloodType?: string;
  remarks?: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  registeredByRole?: UserRole;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

export type VaccineRoute = 'Intramuscular' | 'Oral' | 'Subcutaneous' | 'Intradermal';

export interface VaccineDefinition {
  code: string;
  name: string;
  shortLabel: string;
  doseNumber: number;
  totalDoses: number;
  targetAgeDays: number; // Target age in days from DOB
  targetAgeDescription: string;
  route: VaccineRoute;
  defaultSite: string;
  description: string;
  isBooster?: boolean;
  isSupplement?: boolean; // For Vitamin A supplementation
  gracePeriodDays: number; // Days after targetAgeDays before considered Missed
}

export interface VaccinationRecordCorrection {
  correctedAt: string;
  correctedBy: string;
  previousValue: {
    dateAdministered?: string;
    batchLotNumber?: string;
    route?: string;
    vaccinatorName?: string;
    remarks?: string;
  };
  updatedValue: {
    dateAdministered?: string;
    batchLotNumber?: string;
    route?: string;
    vaccinatorName?: string;
    remarks?: string;
  };
  reason: string;
}

export interface VaccinationRecord {
  id: string;
  patientId: string;
  vaccineCode: string;
  vaccineName: string;
  doseNumber: number;
  route: VaccineRoute;
  dateAdministered: string; // YYYY-MM-DD
  nextScheduledDate?: string; // YYYY-MM-DD
  vaccinatorName: string;
  vaccinatorRole: string;
  batchLotNumber: string;
  healthFacility: string;
  remarks?: string;
  specialNotes?: string[];
  recordedBy: string;
  recordedAt: string;
  verificationStatus?: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  createdRole?: UserRole;
  corrections?: VaccinationRecordCorrection[];
}

export type VaccinationMonitoringStatus = 'missed' | 'due' | 'upcoming' | 'completed' | 'booster_due' | 'booster_completed';

export interface PatientVaccineStatus {
  vaccine: VaccineDefinition;
  status: VaccinationMonitoringStatus;
  dueDate: string;
  record?: VaccinationRecord;
  daysDiff: number; // Positive = future, Negative = past due
}

export interface PatientFollowUp {
  id: string;
  patientId: string;
  followUpDate: string; // YYYY-MM-DD
  contactMethod: 'Home Visit' | 'Phone Call' | 'Barangay Health Center Visit' | 'SMS Notice';
  assignedBHW: string;
  followUpResult: 'Reached - Confirmed Visit' | 'Reached - Rescheduled' | 'Unreachable - Not Home' | 'Transferred Residence' | 'Parent Requested Guidance';
  nextFollowUpDate?: string;
  remarks: string;
  specialNotes?: string[];
  loggedBy: string;
  loggedAt: string;
}

export type AuditAction = 
  | 'PATIENT_REGISTERED'
  | 'PATIENT_UPDATED'
  | 'VACCINE_RECORDED'
  | 'RECORD_CORRECTED'
  | 'RECORD_VERIFIED'
  | 'DRAFT_APPROVED'
  | 'DRAFT_REJECTED'
  | 'FOLLOWUP_LOGGED'
  | 'SMS_SENT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'REPORT_EXPORTED'
  | 'SETTINGS_UPDATED'
  | 'SECURITY_ALERT'
  | 'FAILED_LOGIN'
  | 'ACCOUNT_LOCKED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'USER_REGISTERED'
  | 'EMAIL_VERIFIED'
  | 'CONTACT_MESSAGE_SENT'
  | 'USER_DEACTIVATED'
  | 'USER_REACTIVATED'
  | 'REACTIVATION_COMPLAINT_SUBMITTED';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  targetId?: string;
  targetName?: string;
  details: string;
  previousData?: any;
  updatedData?: any;
}

export type ColorTheme = 'coral-mint' | 'blue' | 'emerald' | 'teal' | 'indigo' | 'slate';
export type AppLanguage = 'en' | 'fil';

export interface SMSLog {
  id: string;
  patientId: string;
  patientName: string;
  recipientPhone: string;
  guardianName: string;
  vaccineDue: string;
  dueDate: string;
  messageText: string;
  gatewayUsed: 'semaphore' | 'twilio' | 'device_native' | 'simulation';
  status: 'delivered' | 'sent' | 'simulated' | 'failed';
  timestamp: string;
  sentBy: string;
}

export interface OfflineSyncItem {
  id: string;
  action: 'ADD_PATIENT' | 'RECORD_VACCINE' | 'VERIFY_DRAFT' | 'UPDATE_PATIENT';
  title: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
}

export interface BarangaySettings {
  barangayName: string;
  municipalityCity: string;
  province: string;
  region: string;
  healthCenterName: string;
  contactNumber: string;
  email: string;
  headNurse: string;
  ruralHealthPhysician: string;
  barangayCaptain: string;
  puroks: string[];
  theme?: ColorTheme;
  language?: AppLanguage;
  smsGateway?: 'semaphore' | 'twilio' | 'device_native';
  smsApiKey?: string;
  smsSenderName?: string;
  smsTemplate?: string;
}
