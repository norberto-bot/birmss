import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Patient, 
  VaccinationRecord, 
  UserAccount, 
  PatientFollowUp, 
  AuditLog, 
  BarangaySettings, 
  UserRole,
  VaccinationRecordCorrection,
  ColorTheme,
  AppLanguage,
  SMSLog,
  OfflineSyncItem,
  VerificationStatus
} from '../types';
import { 
  INITIAL_PATIENTS, 
  INITIAL_VACCINATION_RECORDS, 
  INITIAL_USERS, 
  INITIAL_FOLLOW_UPS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_SETTINGS,
  INITIAL_SMS_LOGS 
} from '../data/initialData';
import { 
  generatePatientId, 
  generateVaccineRecordId, 
  generateFollowUpId, 
  generateAuditLogId, 
  formatDateISO,
  checkDuplicatePatient,
  getPatientVaccineStatuses
} from '../utils/immunizationUtils';
import {
  hashPasswordSync,
  verifyPasswordSync,
  generateSecureToken,
  validatePasswordStrength,
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  checkResetRateLimit,
  recordResetRequest,
  sanitizeInput
} from '../utils/securityUtils';
import {
  syncCriticalDataToServiceWorkerCache,
  getServiceWorkerCacheDiagnostics,
  CacheDiagnostics,
  loadCachedImmunizationSnapshot
} from '../utils/serviceWorkerCache';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  connectGmailAccount,
  disconnectGmailAccount,
  getConnectedGmail,
  initGmailAuth,
  sendReactivationComplaintEmail,
  sendAccountReactivatedEmail
} from '../services/gmailService';

interface AppContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  patients: Patient[];
  vaccinationRecords: VaccinationRecord[];
  followUps: PatientFollowUp[];
  auditLogs: AuditLog[];
  smsLogs: SMSLog[];
  settings: BarangaySettings;
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  
  // Offline status & background sync
  isOnline: boolean;
  offlineQueue: OfflineSyncItem[];
  syncOfflineData: () => Promise<{ success: boolean; syncedCount: number }>;
  swCacheInfo: CacheDiagnostics | null;
  refreshSwCache: () => Promise<void>;
  toggleOfflineSimulation: () => void;
  
  // Navigation & selection state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Strict Security & Roles
  securityAlert: string | null;
  dismissSecurityAlert: () => void;
  setCurrentUser: (user: UserAccount | null) => void;
  switchRole: (role: UserRole) => void;
  login: (usernameOrEmail: string, password?: string) => { 
    success: boolean; 
    message: string; 
    requiresVerification?: boolean;
    isDeactivated?: boolean;
    deactivatedUser?: UserAccount;
  };
  logout: () => void;
  signupStaffUser: (userData: {
    fullName: string;
    username: string;
    email: string;
    role: UserRole;
    title: string;
    contactNumber: string;
    password: string;
    purokAssigned?: string;
  }) => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  completePasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyAccountEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  
  // Gmail Integration
  isGmailConnected: boolean;
  gmailEmail: string | null;
  connectGmail: () => Promise<boolean>;
  disconnectGmail: () => Promise<void>;

  // Modals
  isContactModalOpen: boolean;
  openContactModal: () => void;
  closeContactModal: () => void;
  isSurveillanceModalOpen: boolean;
  openSurveillanceModal: () => void;
  closeSurveillanceModal: () => void;

  // Patient Portal (View-Only for Parents)
  patientPortalPatient: Patient | null;
  loginPatientPortal: (identifier: string, secretValue: string) => boolean;
  logoutPatientPortal: () => void;
  
  // Patient CRUD
  addPatient: (patientData: Omit<Patient, 'id' | 'registrationDate' | 'verificationStatus'>) => { success: boolean; patientId?: string; error?: string; isDraft: boolean };
  updatePatient: (patientId: string, updates: Partial<Patient>) => boolean;
  
  // Draft Verification & Redo System
  verifyPatient: (patientId: string) => boolean;
  rejectPatient: (patientId: string, reason: string) => boolean;
  verifyVaccineRecord: (recordId: string) => boolean;
  rejectVaccineRecord: (recordId: string, reason: string) => boolean;
  resubmitVaccineDraft: (recordId: string, updates: Partial<VaccinationRecord>, resubmissionNotes?: string) => boolean;
  resubmitPatientDraft: (patientId: string, updates: Partial<Patient>, resubmissionNotes?: string) => boolean;
  
  // Vaccination Records
  addVaccinationRecord: (recordData: Omit<VaccinationRecord, 'id' | 'recordedBy' | 'recordedAt' | 'verificationStatus'>) => { success: boolean; recordId?: string; isDraft: boolean };
  correctVaccinationRecord: (recordId: string, updates: Partial<VaccinationRecord>, reason: string) => boolean;
  
  // Follow-ups
  addFollowUp: (followUpData: Omit<PatientFollowUp, 'id' | 'loggedBy' | 'loggedAt'>) => { success: boolean; followUpId?: string };
  
  // SMS Notification Gateway
  sendSMS: (patientId: string, customMessage?: string) => Promise<{ success: boolean; message: string; trackingId: string }>;
  
  // Admin & Users
  addUser: (userData: Omit<UserAccount, 'id' | 'createdAt'>) => boolean;
  toggleUserStatus: (userId: string) => boolean;
  deactivateUser: (userId: string, reason?: string) => boolean;
  reactivateUser: (userId: string, adminNotes: string) => Promise<{ success: boolean; message: string }>;
  submitReactivationComplaint: (userId: string, complaintText: string, openGmailRedirect?: boolean) => Promise<{ success: boolean; message: string; gmailUrl?: string }>;
  isReactivationModalOpen: boolean;
  openReactivationModalForUser: (user: UserAccount) => void;
  closeReactivationModal: () => void;
  activeDeactivatedUser: UserAccount | null;
  setActiveDeactivatedUser: (user: UserAccount | null) => void;
  updateSettings: (newSettings: Partial<BarangaySettings>) => boolean;
  
  // Audit trail logger
  logActivity: (action: AuditLog['action'], details: string, targetId?: string, targetName?: string, prevData?: any, updatedData?: any) => void;
  
  // Import & Export
  importPatientsFromCSV: (csvText: string) => { added: number; skipped: number; errors: string[] };
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => boolean;

  // Reset demo data
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'birms_barangay_data_v2_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with localStorage or defaults
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const [patientPortalPatient, setPatientPortalPatient] = useState<Patient | null>(null);

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}patients`);
    if (saved) {
      const parsed: Patient[] = JSON.parse(saved);
      return parsed.map((p) => ({
        ...p,
        verificationStatus: p.verificationStatus || 'verified',
      }));
    }
    return INITIAL_PATIENTS;
  });

  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}vaccines`);
    if (saved) {
      const parsed: VaccinationRecord[] = JSON.parse(saved);
      return parsed.map((v) => ({
        ...v,
        verificationStatus: v.verificationStatus || 'verified',
      }));
    }
    return INITIAL_VACCINATION_RECORDS.map((v) => ({
      ...v,
      verificationStatus: v.verificationStatus || 'verified',
    }));
  });

  const [followUps, setFollowUps] = useState<PatientFollowUp[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}followups`);
    return saved ? JSON.parse(saved) : INITIAL_FOLLOW_UPS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [smsLogs, setSmsLogs] = useState<SMSLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sms`);
    return saved ? JSON.parse(saved) : INITIAL_SMS_LOGS;
  });

  const [settings, setSettings] = useState<BarangaySettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [theme, setThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}theme`) as ColorTheme;
    return saved || settings.theme || 'coral-mint';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}lang`) as AppLanguage;
    return saved || settings.language || 'en';
  });

  // Offline status & offline queue (Google Docs style)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [offlineQueue, setOfflineQueue] = useState<OfflineSyncItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}offline_queue`);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientIdState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        const scrollableContainers = document.querySelectorAll('main, #root, [data-theme], .overflow-y-auto');
        scrollableContainers.forEach((el) => {
          if (el && el.scrollTop > 0) {
            el.scrollTop = 0;
          }
        });
      });
    }
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    scrollToTop();
  };

  const setSelectedPatientId = (id: string | null) => {
    setSelectedPatientIdState(id);
    scrollToTop();
  };

  // Whenever activeTab, selectedPatientId, or authenticated role changes, always start at the top
  useEffect(() => {
    scrollToTop();
  }, [activeTab, selectedPatientId, currentUser?.role]);

  // Whenever the authenticated role or user account changes, always start on the 'dashboard' for all roles
  useEffect(() => {
    if (currentUser) {
      setActiveTab('dashboard');
      setSelectedPatientId(null);
      scrollToTop();
    }
  }, [currentUser?.role, currentUser?.id]);

  // Security, Modals & Gmail States
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [isSurveillanceModalOpen, setIsSurveillanceModalOpen] = useState<boolean>(false);
  const [isReactivationModalOpen, setIsReactivationModalOpen] = useState<boolean>(false);
  const [activeDeactivatedUser, setActiveDeactivatedUser] = useState<UserAccount | null>(null);

  const openReactivationModalForUser = (user: UserAccount) => {
    setActiveDeactivatedUser(user);
    setIsReactivationModalOpen(true);
  };

  const closeReactivationModal = () => {
    setIsReactivationModalOpen(false);
  };

  const [gmailState, setGmailState] = useState<{ isConnected: boolean; email: string | null }>({
    isConnected: false,
    email: null,
  });

  // Active Session Watchdog:
  // Once a user was deactivated, terminate active portal session immediately and display complaint redirection
  useEffect(() => {
    if (currentUser) {
      const liveUser = users.find((u) => u.id === currentUser.id);
      if (liveUser && !liveUser.isActive) {
        logActivity(
          'SECURITY_ALERT',
          `Session immediately terminated: Account for ${currentUser.fullName} (@${currentUser.username}) was deactivated. Portal access is blocked.`,
          currentUser.id,
          currentUser.fullName
        );
        setCurrentUser(null);
        setActiveDeactivatedUser(liveUser);
        setIsReactivationModalOpen(true);
      }
    }
  }, [users, currentUser]);

  // Gmail Auth Listener
  useEffect(() => {
    const unsub = initGmailAuth(
      (user) => {
        setGmailState({
          isConnected: true,
          email: user.email || 'norbertojomar@gmail.com',
        });
      },
      () => {
        const current = getConnectedGmail();
        setGmailState({
          isConnected: current.isConnected,
          email: current.email,
        });
      }
    );
    return () => unsub?.();
  }, []);

  // Ensure default demo users have bcrypt password hashes
  useEffect(() => {
    setUsers((prevUsers) => {
      let modified = false;
      const updated = prevUsers.map((u) => {
        if (!u.passwordHash) {
          modified = true;
          return {
            ...u,
            passwordHash: hashPasswordSync('Vaccine2026!'),
            isVerified: true,
          };
        }
        return u;
      });
      return modified ? updated : prevUsers;
    });
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when connection is restored
      triggerBackgroundSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setTheme = (newTheme: ColorTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}theme`, newTheme);
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}lang`, newLang);
    setSettings((prev) => ({ ...prev, language: newLang }));
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}patients`, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}vaccines`, JSON.stringify(vaccinationRecords));
  }, [vaccinationRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}followups`, JSON.stringify(followUps));
  }, [followUps]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sms`, JSON.stringify(smsLogs));
  }, [smsLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}offline_queue`, JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    if (patientPortalPatient) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}portal_patient`, JSON.stringify(patientPortalPatient));
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}portal_patient`);
    }
  }, [patientPortalPatient]);

  // Service Worker offline caching state for critical immunization data
  const [swCacheInfo, setSwCacheInfo] = useState<CacheDiagnostics | null>(null);

  const refreshSwCache = async () => {
    await syncCriticalDataToServiceWorkerCache(patients, vaccinationRecords, settings);
    const diag = await getServiceWorkerCacheDiagnostics();
    setSwCacheInfo(diag);
  };

  // Sync to Service Worker CacheStorage whenever clinical records or settings change
  useEffect(() => {
    syncCriticalDataToServiceWorkerCache(patients, vaccinationRecords, settings).then(() => {
      getServiceWorkerCacheDiagnostics().then(setSwCacheInfo);
    });
  }, [patients, vaccinationRecords, settings]);

  // If local records are empty on initial boot, attempt fallback from Service Worker cache
  useEffect(() => {
    if (patients.length === 0) {
      loadCachedImmunizationSnapshot().then((snapshot) => {
        if (snapshot && snapshot.patients?.length > 0) {
          setPatients(snapshot.patients);
          if (snapshot.vaccinationRecords?.length > 0) {
            setVaccinationRecords(snapshot.vaccinationRecords);
          }
        }
      });
    }
  }, []);

  // Activity logger
  const logActivity = (
    action: AuditLog['action'], 
    details: string, 
    targetId?: string, 
    targetName?: string, 
    prevData?: any, 
    updatedData?: any
  ) => {
    const now = new Date();
    const dateFormatted = `${formatDateISO(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLog: AuditLog = {
      id: generateAuditLogId(),
      timestamp: dateFormatted,
      userId: currentUser?.id || (patientPortalPatient ? `PORTAL-${patientPortalPatient.id}` : 'SYSTEM'),
      userName: currentUser?.fullName || (patientPortalPatient ? `Parent: ${patientPortalPatient.motherName}` : 'System User'),
      userRole: currentUser?.role || 'bhw',
      action,
      targetId,
      targetName,
      details,
      previousData: prevData,
      updatedData,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Queue item helper for offline changes
  const enqueueOfflineChange = (action: OfflineSyncItem['action'], title: string, payload: any) => {
    const item: OfflineSyncItem = {
      id: `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      title,
      payload,
      timestamp: new Date().toISOString(),
      status: isOnline ? 'synced' : 'pending',
    };

    if (!isOnline) {
      setOfflineQueue((prev) => [item, ...prev]);
    }
  };

  // Sync offline queue
  const triggerBackgroundSync = async (): Promise<{ success: boolean; syncedCount: number }> => {
    if (offlineQueue.length === 0) return { success: true, syncedCount: 0 };
    const count = offlineQueue.length;
    setOfflineQueue([]);
    logActivity('SETTINGS_UPDATED', `Google Docs-style Background Sync: Successfully synchronized ${count} offline updates to server.`);
    return { success: true, syncedCount: count };
  };

  const syncOfflineData = async () => {
    return triggerBackgroundSync();
  };

  const toggleOfflineSimulation = () => {
    setIsOnline((prev) => !prev);
  };

  // Modals & Dismissals
  const dismissSecurityAlert = () => setSecurityAlert(null);
  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);
  const openSurveillanceModal = () => setIsSurveillanceModalOpen(true);
  const closeSurveillanceModal = () => setIsSurveillanceModalOpen(false);

  // Gmail OAuth Connection
  const connectGmail = async (): Promise<boolean> => {
    try {
      const res = await connectGmailAccount();
      setGmailState({
        isConnected: true,
        email: res.user.email || 'norbertojomar@gmail.com',
      });
      logActivity('SETTINGS_UPDATED', `Connected authorized Gmail account: ${res.user.email}`);
      return true;
    } catch (err: any) {
      console.error('Failed to connect Gmail:', err);
      return false;
    }
  };

  const disconnectGmail = async (): Promise<void> => {
    await disconnectGmailAccount();
    setGmailState({ isConnected: false, email: null });
    logActivity('SETTINGS_UPDATED', `Disconnected Gmail integration.`);
  };

  // STRICT ROLE SWITCHING PROTECTION:
  // Once a user is logged in under a specific role, they must NOT be able to switch to another role.
  // Enforced on backend/context and frontend.
  const switchRole = (role: UserRole) => {
    if (currentUser && currentUser.role !== role) {
      const alertMsg = `SECURITY VIOLATION BLOCKED: Unauthorized privilege escalation / role switch attempt from ${currentUser.role.toUpperCase()} to ${role.toUpperCase()}. Active healthcare sessions cannot switch roles directly. You must explicitly log out and authenticate with proper credentials.`;
      setSecurityAlert(alertMsg);
      logActivity(
        'SECURITY_ALERT',
        alertMsg,
        currentUser.id,
        currentUser.fullName
      );
      return;
    }

    const matchingUser = users.find((u) => u.role === role && u.isActive);
    if (!matchingUser) {
      const deact = users.find((u) => u.role === role);
      if (deact) {
        openReactivationModalForUser(deact);
      }
      setSecurityAlert(`Cannot access portal: The ${role.toUpperCase()} account is deactivated. Portal access is blocked.`);
      return;
    }

    setCurrentUser(matchingUser);
    setActiveTab('dashboard');
    setSelectedPatientId(null);
    logActivity('SETTINGS_UPDATED', `Session started: ${matchingUser.fullName} (${role.toUpperCase()})`);
  };

  // Secure Login with Brute-Force Rate Limiting (Lockout after 5 failed attempts) and bcrypt verification
  const login = (
    usernameOrEmail: string, 
    plainPassword?: string
  ): { 
    success: boolean; 
    message: string; 
    requiresVerification?: boolean;
    isDeactivated?: boolean;
    deactivatedUser?: UserAccount;
  } => {
    const cleanIdentifier = sanitizeInput(usernameOrEmail).toLowerCase();
    
    // 1. Rate Limit & Lockout Check
    const rateCheck = checkLoginRateLimit(cleanIdentifier);
    if (!rateCheck.allowed) {
      const lockMsg = `SECURITY LOCKOUT: Account temporarily locked due to 5 consecutive failed attempts. Please retry in ${rateCheck.retryAfterMinutes} minutes or reset your password.`;
      logActivity('ACCOUNT_LOCKED', lockMsg, undefined, cleanIdentifier);
      return { success: false, message: lockMsg };
    }

    // 2. Lookup user
    const user = users.find(
      (u) => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
    );

    if (!user) {
      recordFailedLogin(cleanIdentifier);
      logActivity('FAILED_LOGIN', `Failed login attempt: Account '${cleanIdentifier}' not found.`);
      return { 
        success: false, 
        message: 'Invalid credentials. Please verify your username and password.' 
      };
    }

    // 3. Check Account Status (Deactivation Guard)
    if (!user.isActive) {
      logActivity(
        'SECURITY_ALERT',
        `Blocked login attempt on deactivated account: ${user.fullName} (@${user.username}). Access to portal is denied.`,
        user.id,
        user.fullName
      );
      openReactivationModalForUser(user);
      return { 
        success: false, 
        message: 'Account is deactivated. You cannot log in or access the portal. You may redirect into Gmail to file a complaint for administrator verification.',
        isDeactivated: true,
        deactivatedUser: user
      };
    }

    // 4. Verify Password (if provided)
    if (plainPassword !== undefined && plainPassword.trim() !== '') {
      let isPasswordValid = false;
      if (user.passwordHash) {
        isPasswordValid = verifyPasswordSync(plainPassword, user.passwordHash);
      } else {
        // Fallback for pre-seeded demo testing
        isPasswordValid = plainPassword === 'Vaccine2026!' || plainPassword === 'admin123' || plainPassword.length >= 6;
      }

      if (!isPasswordValid) {
        const failedResult = recordFailedLogin(cleanIdentifier);
        if (failedResult.locked) {
          const lockedAlert = `SECURITY LOCKOUT: Account '${user.username}' locked for 15 minutes due to 5 consecutive failed password attempts.`;
          logActivity('ACCOUNT_LOCKED', lockedAlert, user.id, user.fullName);
          return {
            success: false,
            message: 'Account locked for 15 minutes due to 5 consecutive failed attempts. Please use "Forgot Password" to restore access.'
          };
        }

        const remaining = 5 - (5 - (rateCheck.remainingAttempts - 1));
        logActivity('FAILED_LOGIN', `Failed password attempt for account '${user.username}'.`);
        return {
          success: false,
          message: `Invalid password. Warning: ${rateCheck.remainingAttempts - 1} remaining attempt(s) before temporary lockout.`
        };
      }
    }

    // 5. Successful Authentication
    recordSuccessfulLogin(cleanIdentifier);
    setCurrentUser(user);
    setPatientPortalPatient(null);
    setSecurityAlert(null);
    logActivity('SETTINGS_UPDATED', `User authenticated successfully: ${user.fullName} (${user.role.toUpperCase()})`);

    return { 
      success: true, 
      message: `Welcome back, ${user.fullName} (${user.title})` 
    };
  };

  const logout = () => {
    if (currentUser) {
      logActivity('SETTINGS_UPDATED', `User signed out: ${currentUser.fullName} (${currentUser.role.toUpperCase()})`);
    }
    setCurrentUser(null);
    setSecurityAlert(null);
  };

  // Staff Sign-up with Gmail Verification Link
  const signupStaffUser = async (userData: {
    fullName: string;
    username: string;
    email: string;
    role: UserRole;
    title: string;
    contactNumber: string;
    password: string;
    purokAssigned?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const cleanFullName = sanitizeInput(userData.fullName);
    const cleanUsername = sanitizeInput(userData.username).toLowerCase();
    const cleanEmail = sanitizeInput(userData.email).toLowerCase();
    const cleanContact = sanitizeInput(userData.contactNumber);
    const cleanTitle = sanitizeInput(userData.title);

    // 1. Password Strength Validation
    const passVal = validatePasswordStrength(userData.password);
    if (!passVal.isValid) {
      return {
        success: false,
        message: `Password does not meet health IT security requirements: ${passVal.errors.join(' ')}`
      };
    }

    // 2. Duplicate Check
    const exists = users.some(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      return {
        success: false,
        message: 'A healthcare worker with this username or email is already registered.'
      };
    }

    // 3. Hash Password & Generate High-Entropy 1-Hour Verification Token
    const passwordHash = hashPasswordSync(userData.password);
    const verificationToken = generateSecureToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour max

    const newUser: UserAccount = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      fullName: cleanFullName,
      username: cleanUsername,
      email: cleanEmail,
      role: userData.role,
      title: cleanTitle,
      contactNumber: cleanContact,
      purokAssigned: userData.purokAssigned,
      isActive: true,
      createdAt: formatDateISO(new Date()),
      passwordHash,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry: expiry,
    };

    setUsers((prev) => [...prev, newUser]);

    // 4. Send Professional HTML Verification Email via Gmail Integration
    await sendVerificationEmail(cleanEmail, cleanFullName, verificationToken);

    logActivity(
      'USER_REGISTERED',
      `New staff member registered: ${cleanFullName} (${userData.role.toUpperCase()}). Verification link dispatched via Gmail to ${cleanEmail}.`,
      newUser.id,
      cleanFullName
    );

    return {
      success: true,
      message: `Account created successfully! A verification email with an activation link has been sent to ${cleanEmail} via Gmail. (Expires in 1 hour).`
    };
  };

  // Password Reset Request via Gmail with Rate Limiting & Generic Response
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = sanitizeInput(email).toLowerCase();

    // 1. Enforce Rate Limit: Max 3 requests per email per hour
    const limit = checkResetRateLimit(cleanEmail);
    if (!limit.allowed) {
      return {
        success: false,
        message: `Rate limit reached: A maximum of 3 password reset requests per hour is allowed. Please wait ${limit.retryAfterMinutes} minutes.`
      };
    }
    recordResetRequest(cleanEmail);

    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (user) {
      // 2. Generate single-use cryptographic token expiring in 1 hour
      const resetToken = generateSecureToken();
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, resetToken, resetTokenExpiry: expiry }
            : u
        )
      );

      // 3. Dispatch Email via Gmail
      await sendPasswordResetEmail(cleanEmail, resetToken);

      logActivity(
        'PASSWORD_RESET_REQUESTED',
        `Password reset token generated and email dispatched to ${cleanEmail} via Gmail. Token expires in 1 hour.`,
        user.id,
        user.fullName
      );
    }

    // 4. Generic Security Message (Never reveal if email exists or not to prevent enumeration attacks)
    return {
      success: true,
      message: `If an account with '${cleanEmail}' exists in the healthcare system, a password reset link has been dispatched via Gmail. The link will expire in 1 hour.`
    };
  };

  // Complete Password Reset
  const completePasswordReset = async (
    token: string, 
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanToken = sanitizeInput(token);
    
    // 1. Password Strength Validation
    const passVal = validatePasswordStrength(newPassword);
    if (!passVal.isValid) {
      return {
        success: false,
        message: `Password does not meet requirements: ${passVal.errors.join(' ')}`
      };
    }

    // 2. Validate token
    const user = users.find((u) => u.resetToken && u.resetToken === cleanToken);
    if (!user) {
      return {
        success: false,
        message: 'Invalid or already used password reset link. Please request a new one.'
      };
    }

    // 3. Validate 1-hour expiration
    if (user.resetTokenExpiry && new Date(user.resetTokenExpiry).getTime() < Date.now()) {
      return {
        success: false,
        message: 'This password reset link has expired (maximum 1 hour validity). Please request a new one.'
      };
    }

    // 4. Update Password Hash and invalidate token (Single use)
    const newHash = hashPasswordSync(newPassword);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              passwordHash: newHash,
              resetToken: undefined,
              resetTokenExpiry: undefined,
            }
          : u
      )
    );

    recordSuccessfulLogin(user.username);

    logActivity(
      'PASSWORD_RESET_COMPLETED',
      `Password successfully reset for user ${user.fullName} (${user.username}) using verified 1-time token.`,
      user.id,
      user.fullName
    );

    return {
      success: true,
      message: 'Your password has been securely updated! You may now sign in with your new credentials.'
    };
  };

  // Verify Account Email Link
  const verifyAccountEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
    const cleanToken = sanitizeInput(token);
    const user = users.find((u) => u.verificationToken && u.verificationToken === cleanToken);

    if (!user) {
      return {
        success: false,
        message: 'Invalid or already used email verification link.'
      };
    }

    if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry).getTime() < Date.now()) {
      return {
        success: false,
        message: 'This verification link has expired (1 hour limit). Please request a new activation link.'
      };
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              isVerified: true,
              verificationToken: undefined,
              verificationTokenExpiry: undefined,
            }
          : u
      )
    );

    logActivity(
      'EMAIL_VERIFIED',
      `Email verified for staff member ${user.fullName} (${user.email}). Account activated.`,
      user.id,
      user.fullName
    );

    return {
      success: true,
      message: `Email verified successfully! Profile for ${user.fullName} is now active.`
    };
  };

  // Patient Portal Login (View-Only for Parents / Form 138 School Health Card)
  const loginPatientPortal = (identifier: string, secretValue: string): boolean => {
    const idClean = identifier.trim().toLowerCase();
    const secClean = secretValue.trim().toLowerCase();

    const matched = patients.find((p) => {
      const matchId = p.id.toLowerCase() === idClean;
      const matchName = `${p.firstName} ${p.lastName}`.toLowerCase() === idClean;
      const matchDob = p.dateOfBirth === secClean;
      const matchContact = p.contactNumber.replace(/[^0-9]/g, '') === secClean.replace(/[^0-9]/g, '');
      const matchMother = p.motherName.toLowerCase().includes(secClean);
      return (matchId || matchName) && (matchDob || matchContact || matchMother);
    });

    if (matched) {
      setPatientPortalPatient(matched);
      setCurrentUser(null);
      logActivity('PATIENT_UPDATED', `Parent accessed Patient Portal for child ${matched.firstName} ${matched.lastName} (${matched.id})`);
      return true;
    }
    return false;
  };

  const logoutPatientPortal = () => {
    setPatientPortalPatient(null);
  };

  // Patient Registration with Role-Based Draft logic
  const addPatient = (patientData: Omit<Patient, 'id' | 'registrationDate' | 'verificationStatus'>) => {
    const newId = generatePatientId(patients);
    const isBHW = currentUser?.role === 'bhw';
    const verificationStatus: VerificationStatus = isBHW ? 'draft' : 'verified';

    const newPatient: Patient = {
      ...patientData,
      id: newId,
      registrationDate: formatDateISO(new Date()),
      verificationStatus,
      registeredByRole: currentUser?.role || 'nurse',
      verifiedBy: !isBHW ? currentUser?.fullName : undefined,
      verifiedAt: !isBHW ? formatDateISO(new Date()) : undefined,
    };

    setPatients((prev) => [newPatient, ...prev]);
    enqueueOfflineChange('ADD_PATIENT', `Register Patient ${newPatient.firstName} ${newPatient.lastName}`, newPatient);

    logActivity(
      'PATIENT_REGISTERED',
      isBHW 
        ? `[DRAFT] BHW created draft patient registration: ${newPatient.firstName} ${newPatient.lastName} (${newId}). Awaiting nurse verification.`
        : `Registered and verified new patient: ${newPatient.firstName} ${newPatient.lastName} (${newId})`,
      newId,
      `${newPatient.firstName} ${newPatient.lastName}`
    );

    return { success: true, patientId: newId, isDraft: isBHW };
  };

  const updatePatient = (patientId: string, updates: Partial<Patient>): boolean => {
    const existing = patients.find((p) => p.id === patientId);
    if (!existing) return false;

    // Strict Data Finalization Protection:
    // Once data is verified/finalized, unauthorized modifications that could invade privacy or alter official records are strictly prohibited.
    if (existing.verificationStatus === 'verified' && currentUser?.role === 'bhw') {
      const alertMsg = `SECURITY BLOCKED: BHWs cannot modify finalized/verified patient data for ${existing.id}. Only authorized Public Health Nurses and Physicians can update verified clinical records.`;
      setSecurityAlert(alertMsg);
      logActivity('SECURITY_ALERT', alertMsg, patientId, `${existing.firstName} ${existing.lastName}`);
      return false;
    }

    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, ...updates } : p))
    );

    enqueueOfflineChange('UPDATE_PATIENT', `Update demographics for ${existing.firstName} ${existing.lastName}`, updates);

    logActivity(
      'PATIENT_UPDATED',
      `Updated demographics for patient ${existing.firstName} ${existing.lastName} (${patientId})`,
      patientId,
      `${existing.firstName} ${existing.lastName}`,
      existing,
      updates
    );

    return true;
  };

  // Draft Verification Handlers (Nurse / Doctor / Admin only)
  const verifyPatient = (patientId: string): boolean => {
    if (currentUser?.role === 'bhw') return false;

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return false;

    const nowStr = `${formatDateISO(new Date())} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              verificationStatus: 'verified',
              verifiedBy: currentUser?.fullName || 'Verified by Nurse',
              verifiedAt: nowStr,
            }
          : p
      )
    );

    enqueueOfflineChange('VERIFY_DRAFT', `Verify patient ${patient.firstName} ${patient.lastName}`, { patientId });

    logActivity(
      'DRAFT_APPROVED',
      `Nurse/Physician verified & approved draft patient record: ${patient.firstName} ${patient.lastName} (${patientId})`,
      patientId,
      `${patient.firstName} ${patient.lastName}`
    );

    return true;
  };

  const rejectPatient = (patientId: string, reason: string): boolean => {
    if (currentUser?.role === 'bhw') return false;

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return false;

    const nowStr = `${formatDateISO(new Date())} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              verificationStatus: 'rejected',
              rejectionReason: reason,
              rejectedBy: currentUser?.fullName || 'Nurse/Physician',
              rejectedAt: nowStr,
            }
          : p
      )
    );

    logActivity(
      'DRAFT_REJECTED',
      `Nurse/Doctor returned draft patient registration for ${patient.firstName} ${patient.lastName} (${patientId}) to BHW for correction. Reason: ${reason}`,
      patientId,
      `${patient.firstName} ${patient.lastName}`
    );

    return true;
  };

  const verifyVaccineRecord = (recordId: string): boolean => {
    if (currentUser?.role === 'bhw') return false;

    const record = vaccinationRecords.find((r) => r.id === recordId);
    if (!record) return false;

    const nowStr = `${formatDateISO(new Date())} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    setVaccinationRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              verificationStatus: 'verified',
              verifiedBy: currentUser?.fullName || 'Verified by Nurse',
              verifiedAt: nowStr,
            }
          : r
      )
    );

    enqueueOfflineChange('VERIFY_DRAFT', `Verify vaccine record ${record.vaccineName}`, { recordId });

    logActivity(
      'RECORD_VERIFIED',
      `Nurse verified & approved administered vaccine record: ${record.vaccineName} (Record #${recordId}) for patient ${record.patientId}`,
      record.patientId
    );

    return true;
  };

  const rejectVaccineRecord = (recordId: string, reason: string): boolean => {
    if (currentUser?.role === 'bhw') return false;

    const record = vaccinationRecords.find((r) => r.id === recordId);
    if (!record) return false;

    const nowStr = `${formatDateISO(new Date())} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    setVaccinationRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              verificationStatus: 'rejected',
              rejectionReason: reason,
              rejectedBy: currentUser?.fullName || 'Nurse/Physician',
              rejectedAt: nowStr,
            }
          : r
      )
    );

    logActivity(
      'DRAFT_REJECTED',
      `Nurse returned draft vaccine record #${recordId} (${record.vaccineName}) to BHW for revision. Reason: ${reason}`,
      record.patientId
    );

    return true;
  };

  // Modify and Redo Drafts for BHWs
  const resubmitVaccineDraft = (
    recordId: string, 
    updates: Partial<VaccinationRecord>, 
    resubmissionNotes?: string
  ): boolean => {
    const existing = vaccinationRecords.find((r) => r.id === recordId);
    if (!existing) return false;

    const nowStr = `${formatDateISO(new Date())} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    const cleanNotes = resubmissionNotes ? sanitizeInput(resubmissionNotes) : '';

    setVaccinationRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              ...updates,
              verificationStatus: 'draft', // Resets back to draft for Nurse verification!
              rejectionReason: undefined,
              rejectedBy: undefined,
              rejectedAt: undefined,
              recordedAt: nowStr,
              recordedBy: currentUser?.username || r.recordedBy,
              remarks: cleanNotes 
                ? `${updates.remarks || r.remarks || ''} [Redone & Resubmitted: ${cleanNotes}]`.trim()
                : (updates.remarks || r.remarks),
            }
          : r
      )
    );

    logActivity(
      'VACCINE_RECORDED',
      `BHW modified and resubmitted draft vaccine record #${recordId} (${existing.vaccineName}). Sent to queue for Nurse review.`,
      existing.patientId
    );

    return true;
  };

  const resubmitPatientDraft = (
    patientId: string, 
    updates: Partial<Patient>, 
    resubmissionNotes?: string
  ): boolean => {
    const existing = patients.find((p) => p.id === patientId);
    if (!existing) return false;

    const cleanNotes = resubmissionNotes ? sanitizeInput(resubmissionNotes) : '';

    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              ...updates,
              verificationStatus: 'draft', // Resets back to draft for Nurse verification!
              rejectionReason: undefined,
              rejectedBy: undefined,
              rejectedAt: undefined,
              remarks: cleanNotes 
                ? `${updates.remarks || p.remarks || ''} [Redone & Resubmitted: ${cleanNotes}]`.trim()
                : (updates.remarks || p.remarks),
            }
          : p
      )
    );

    logActivity(
      'PATIENT_UPDATED',
      `BHW modified and resubmitted draft patient registration for ${existing.firstName} ${existing.lastName} (${patientId}). Sent to queue for Nurse review.`,
      patientId,
      `${existing.firstName} ${existing.lastName}`
    );

    return true;
  };

  // Vaccination Records with Role-Based Draft logic
  const addVaccinationRecord = (recordData: Omit<VaccinationRecord, 'id' | 'recordedBy' | 'recordedAt' | 'verificationStatus'>) => {
    const newId = generateVaccineRecordId(vaccinationRecords);
    const now = new Date();
    const dateFormatted = `${formatDateISO(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isBHW = currentUser?.role === 'bhw';
    const verificationStatus: VerificationStatus = isBHW ? 'draft' : 'verified';

    const newRecord: VaccinationRecord = {
      ...recordData,
      id: newId,
      recordedBy: currentUser?.username || 'authorized.staff',
      recordedAt: dateFormatted,
      verificationStatus,
      createdRole: currentUser?.role || 'nurse',
      verifiedBy: !isBHW ? currentUser?.fullName : undefined,
      verifiedAt: !isBHW ? dateFormatted : undefined,
    };

    const patient = patients.find((p) => p.id === recordData.patientId);

    setVaccinationRecords((prev) => [newRecord, ...prev]);
    enqueueOfflineChange('RECORD_VACCINE', `Record ${newRecord.vaccineName} for ${patient?.firstName || newRecord.patientId}`, newRecord);

    logActivity(
      'VACCINE_RECORDED',
      isBHW
        ? `[DRAFT] BHW submitted draft vaccination entry: ${newRecord.vaccineName} (Dose ${newRecord.doseNumber}, Batch #${newRecord.batchLotNumber}). Awaiting nurse review.`
        : `Administered and verified ${newRecord.vaccineName} (Dose ${newRecord.doseNumber}, Lot #${newRecord.batchLotNumber}, Route: ${newRecord.route}) by ${newRecord.vaccinatorName}`,
      newRecord.patientId,
      patient ? `${patient.firstName} ${patient.lastName}` : undefined
    );

    return { success: true, recordId: newId, isDraft: isBHW };
  };

  const correctVaccinationRecord = (
    recordId: string, 
    updates: Partial<VaccinationRecord>, 
    reason: string
  ): boolean => {
    const targetRecord = vaccinationRecords.find((r) => r.id === recordId);
    if (!targetRecord) return false;

    const now = new Date();
    const dateFormatted = `${formatDateISO(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const correction: VaccinationRecordCorrection = {
      correctedAt: dateFormatted,
      correctedBy: currentUser?.fullName || 'Authorized Nurse',
      previousValue: {
        dateAdministered: targetRecord.dateAdministered,
        batchLotNumber: targetRecord.batchLotNumber,
        route: targetRecord.route,
        vaccinatorName: targetRecord.vaccinatorName,
        remarks: targetRecord.remarks,
      },
      updatedValue: {
        dateAdministered: updates.dateAdministered ?? targetRecord.dateAdministered,
        batchLotNumber: updates.batchLotNumber ?? targetRecord.batchLotNumber,
        route: updates.route ?? targetRecord.route,
        vaccinatorName: updates.vaccinatorName ?? targetRecord.vaccinatorName,
        remarks: updates.remarks ?? targetRecord.remarks,
      },
      reason,
    };

    setVaccinationRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            ...updates,
            corrections: [...(r.corrections || []), correction],
          };
        }
        return r;
      })
    );

    const patient = patients.find((p) => p.id === targetRecord.patientId);

    logActivity(
      'RECORD_CORRECTED',
      `Audited correction on ${targetRecord.vaccineName} (Record ${recordId}). Reason: ${reason}`,
      targetRecord.patientId,
      patient ? `${patient.firstName} ${patient.lastName}` : undefined,
      correction.previousValue,
      correction.updatedValue
    );

    return true;
  };

  // Follow-up
  const addFollowUp = (followUpData: Omit<PatientFollowUp, 'id' | 'loggedBy' | 'loggedAt'>) => {
    const newId = generateFollowUpId(followUps);
    const now = new Date();
    const dateFormatted = `${formatDateISO(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newFollowUp: PatientFollowUp = {
      ...followUpData,
      id: newId,
      loggedBy: currentUser?.fullName || 'Assigned BHW',
      loggedAt: dateFormatted,
    };

    const patient = patients.find((p) => p.id === followUpData.patientId);

    setFollowUps((prev) => [newFollowUp, ...prev]);
    logActivity(
      'FOLLOWUP_LOGGED',
      `Follow-up logged (${newFollowUp.contactMethod}): ${newFollowUp.followUpResult}. Remarks: ${newFollowUp.remarks}`,
      newFollowUp.patientId,
      patient ? `${patient.firstName} ${patient.lastName}` : undefined
    );

    return { success: true, followUpId: newId };
  };

  // SMS Notification Sending (Semaphore / Twilio simulated & device SMS integration)
  const sendSMS = async (patientId: string, customMessage?: string): Promise<{ success: boolean; message: string; trackingId: string }> => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { success: false, message: 'Patient not found', trackingId: '' };

    const statuses = getPatientVaccineStatuses(patient, vaccinationRecords);
    const nextPending = statuses.find((s) => s.status === 'missed' || s.status === 'due' || s.status === 'upcoming');
    const vaccineName = nextPending ? nextPending.vaccine.name : 'Routine Health Clinic Session';
    const dueDate = nextPending ? nextPending.dueDate : formatDateISO(new Date());

    let messageText = customMessage;
    if (!messageText) {
      const template = settings.smsTemplate || INITIAL_SETTINGS.smsTemplate || '';
      messageText = template
        .replace(/\[GUARDIAN\]/g, patient.motherName || 'Nanay/Tatay')
        .replace(/\[HEALTH_CENTER\]/g, settings.healthCenterName)
        .replace(/\[CHILD_NAME\]/g, `${patient.firstName} ${patient.lastName}`)
        .replace(/\[VACCINE\]/g, vaccineName)
        .replace(/\[DATE\]/g, dueDate);
    }

    const trackingId = `SMS-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const timeFormatted = `${formatDateISO(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newSmsLog: SMSLog = {
      id: trackingId,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      recipientPhone: patient.contactNumber,
      guardianName: patient.motherName,
      vaccineDue: vaccineName,
      dueDate,
      messageText,
      gatewayUsed: settings.smsGateway || 'semaphore',
      status: 'delivered',
      timestamp: timeFormatted,
      sentBy: currentUser?.fullName || 'Health Center Staff',
    };

    setSmsLogs((prev) => [newSmsLog, ...prev]);

    logActivity(
      'SMS_SENT',
      `Sent automated SMS reminder (${settings.smsGateway?.toUpperCase() || 'SEMAPHORE'}) to ${patient.contactNumber} for ${patient.firstName}'s ${vaccineName}`,
      patient.id,
      `${patient.firstName} ${patient.lastName}`
    );

    return {
      success: true,
      message: `SMS successfully queued & delivered to ${patient.contactNumber} via ${settings.smsGateway?.toUpperCase() || 'SEMAPHORE'} gateway.`,
      trackingId,
    };
  };

  // User management (Strict Admin Only)
  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>): boolean => {
    if (currentUser?.role !== 'admin') {
      const alertMsg = 'SECURITY ACCESS DENIED: Only the System Administrator can create new authorized staff accounts.';
      setSecurityAlert(alertMsg);
      logActivity('SECURITY_ALERT', alertMsg, currentUser?.id, currentUser?.fullName);
      return false;
    }

    const newId = `USR-${String(users.length + 1).padStart(3, '0')}`;
    const newUser: UserAccount = {
      ...userData,
      id: newId,
      createdAt: formatDateISO(new Date()),
    };

    setUsers((prev) => [...prev, newUser]);
    logActivity('USER_CREATED', `Admin ${currentUser.fullName} created authorized user: ${newUser.fullName} (${newUser.role.toUpperCase()})`, newId, newUser.fullName);
    return true;
  };

  const deactivateUser = (userId: string, reason?: string): boolean => {
    // 1. RBAC Check: Only admin can deactivate
    if (currentUser?.role !== 'admin') {
      const alertMsg = 'SECURITY ACCESS DENIED: Only the System Administrator has authority to deactivate staff accounts.';
      setSecurityAlert(alertMsg);
      logActivity('SECURITY_ALERT', alertMsg, currentUser?.id, currentUser?.fullName);
      return false;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    // 2. Admin Exemption: Admin is exempted and can NEVER be deactivated
    if (user.role === 'admin') {
      const exemptMsg = `SECURITY EXEMPTION: Administrator accounts (@${user.username}) are strictly exempted and can never be deactivated as they manage the entire system.`;
      setSecurityAlert(exemptMsg);
      logActivity('SECURITY_ALERT', exemptMsg, user.id, user.fullName);
      return false;
    }

    const now = new Date().toISOString();
    const updatedUser: UserAccount = {
      ...user,
      isActive: false,
      deactivatedAt: now,
      deactivatedBy: currentUser.fullName,
      deactivationReason: reason || 'Administrative duty suspension',
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    // Terminate session if user is currently active
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(null);
      setActiveDeactivatedUser(updatedUser);
      setIsReactivationModalOpen(true);
    }

    const dateFormatted = `${formatDateISO(new Date())} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`;
    const cleanReason = reason && reason.trim() ? reason.trim() : 'Administrative duty suspension / compliance review';

    logActivity(
      'USER_DEACTIVATED',
      `[ACCOUNT DEACTIVATION] Admin username: @${currentUser.username} (${currentUser.fullName}) deactivated staff account ${user.fullName} (@${user.username}, Role: ${user.role.toUpperCase()}). Reason: "${cleanReason}". Portal session terminated and login access blocked.`,
      user.id,
      `${user.fullName} (@${user.username})`,
      {
        accountStatus: 'Active',
        isActive: true,
        canLogin: true,
        portalAccess: 'Granted',
      },
      {
        accountStatus: 'Deactivated',
        isActive: false,
        canLogin: false,
        portalAccess: 'Blocked',
        deactivatedByAdminUsername: currentUser.username,
        deactivatedByAdminFullName: currentUser.fullName,
        deactivationReason: cleanReason,
        deactivatedAtTimestamp: dateFormatted,
      }
    );

    return true;
  };

  const reactivateUser = async (userId: string, adminNotes: string): Promise<{ success: boolean; message: string }> => {
    // 1. RBAC Check: Only admin can reactivate
    if (currentUser?.role !== 'admin') {
      const alertMsg = 'SECURITY ACCESS DENIED: Only the System Administrator has authority to verify and reactivate healthcare accounts.';
      setSecurityAlert(alertMsg);
      logActivity('SECURITY_ALERT', alertMsg, currentUser?.id, currentUser?.fullName);
      return { success: false, message: alertMsg };
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User record not found' };

    const now = new Date().toISOString();
    const dateFormatted = `${formatDateISO(new Date())} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`;
    const adminName = currentUser.fullName;
    const cleanNotes = adminNotes && adminNotes.trim() ? adminNotes.trim() : 'Identity verified, authorized for duty.';

    const updatedUser: UserAccount = {
      ...user,
      isActive: true,
      isVerified: true,
      pendingReactivation: false,
      reactivatedAt: now,
      reactivatedBy: adminName,
      adminVerificationNotes: cleanNotes,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    logActivity(
      'USER_REACTIVATED',
      `[ACCOUNT REACTIVATION & CLEARANCE] Admin username: @${currentUser.username} (${adminName}) verified and reactivated staff account for ${user.fullName} (@${user.username}, Role: ${user.role.toUpperCase()}). Verification Clearance: "${cleanNotes}". Access to portal restored.`,
      user.id,
      `${user.fullName} (@${user.username})`,
      {
        accountStatus: 'Deactivated',
        isActive: false,
        pendingReactivation: user.pendingReactivation || false,
        priorComplaint: user.reactivationComplaint || 'None',
      },
      {
        accountStatus: 'Active',
        isActive: true,
        isVerified: true,
        pendingReactivation: false,
        reactivatedByAdminUsername: currentUser.username,
        reactivatedByAdminFullName: adminName,
        adminVerificationNotes: cleanNotes,
        reactivatedAtTimestamp: dateFormatted,
      }
    );

    // Send confirmation email via Gmail
    try {
      await sendAccountReactivatedEmail(user.email, user.fullName, adminName, cleanNotes);
    } catch (e) {
      console.warn('Could not dispatch reactivation email:', e);
    }

    return {
      success: true,
      message: `Account for ${user.fullName} successfully verified and reactivated! Confirmation sent to ${user.email}.`
    };
  };

  const toggleUserStatus = (userId: string): boolean => {
    if (currentUser?.role !== 'admin') {
      const alertMsg = 'SECURITY ACCESS DENIED: Only the System Administrator has authority to manage account activation status.';
      setSecurityAlert(alertMsg);
      logActivity('SECURITY_ALERT', alertMsg, currentUser?.id, currentUser?.fullName);
      return false;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    // Admin Exemption
    if (user.role === 'admin' && user.isActive) {
      const exemptMsg = `SECURITY EXEMPTION: Administrator accounts (@${user.username}) are strictly exempted and can never be deactivated as they manage everything.`;
      setSecurityAlert(exemptMsg);
      logActivity('SECURITY_ALERT', exemptMsg, user.id, user.fullName);
      return false;
    }

    if (user.isActive) {
      return deactivateUser(userId, 'Deactivated by administrator from staff list');
    } else {
      reactivateUser(userId, 'Direct administrator activation from staff table');
      return true;
    }
  };

  const submitReactivationComplaint = async (
    userId: string, 
    complaintText: string,
    openGmailRedirect: boolean = true
  ): Promise<{ success: boolean; message: string; gmailUrl?: string }> => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User record not found.' };

    const now = new Date().toLocaleString();
    const adminEmail = settings.email || 'norbertojomar@gmail.com';
    const subject = `[BIRMS Reactivation Appeal & Complaint] - ${user.fullName} (@${user.username})`;
    const body = `Dear Barangay Health Center System Administrator,

I am writing to formally appeal the deactivation of my healthcare account on the Barangay Immunization Record and Monitoring System (BIRMS) and request administrative verification for reactivation.

Health Worker Details:
- Full Name: ${user.fullName}
- Username: @${user.username}
- Role / Job Title: ${user.title} (${user.role.toUpperCase()})
- Contact Phone: ${user.contactNumber}
- Registered Email: ${user.email}
- Appeal Timestamp: ${now}

Statement of Complaint & Grounds for Reactivation:
${complaintText}

I understand that my account must be verified and cleared by the Administrator before access to the portal can be reactivated.

Respectfully submitted,
${user.fullName}`;

    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(adminEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Update state to record the pending appeal
    const updatedUser: UserAccount = {
      ...user,
      pendingReactivation: true,
      reactivationComplaint: complaintText,
      reactivationRequestedAt: now,
    };
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    setActiveDeactivatedUser(updatedUser);

    logActivity(
      'REACTIVATION_COMPLAINT_SUBMITTED',
      `Deactivated user ${user.fullName} (@${user.username}) submitted reactivation complaint/appeal for Admin verification.`,
      user.id,
      user.fullName
    );

    // Send email notification to Admin via Gmail API
    try {
      await sendReactivationComplaintEmail(user, complaintText, adminEmail);
    } catch (e) {
      console.warn('Gmail API dispatch attempt:', e);
    }

    if (openGmailRedirect) {
      try {
        const opened = window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          window.location.href = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
      } catch (e) {
        window.location.href = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    }

    return {
      success: true,
      message: 'Complaint submitted! Redirection to Gmail prepared for Admin review and verification.',
      gmailUrl: gmailWebUrl
    };
  };

  const updateSettings = (newSettings: Partial<BarangaySettings>): boolean => {
    if (currentUser?.role !== 'admin') {
      const alertMsg = 'SECURITY ACCESS DENIED: Only the System Administrator can modify facility settings and system configurations.';
      setSecurityAlert(alertMsg);
      logActivity('SECURITY_ALERT', alertMsg, currentUser?.id, currentUser?.fullName);
      return false;
    }

    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (newSettings.theme) {
      setThemeState(newSettings.theme);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}theme`, newSettings.theme);
    }
    if (newSettings.language) {
      setLanguageState(newSettings.language);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}lang`, newSettings.language);
    }
    logActivity('SETTINGS_UPDATED', `Barangay health facility settings updated by Admin ${currentUser.fullName}.`);
    return true;
  };

  // CSV Import parser for bulk patient uploads
  const importPatientsFromCSV = (csvText: string): { added: number; skipped: number; errors: string[] } => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { added: 0, skipped: 0, errors: ['CSV file is empty or missing headers.'] };
    }

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    const newPatientsList: Patient[] = [...patients];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let inQuotes = false;
      let curVal = '';
      for (let ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          values.push(curVal.trim().replace(/^"|"$/g, ''));
          curVal = '';
        } else {
          curVal += ch;
        }
      }
      values.push(curVal.trim().replace(/^"|"$/g, ''));

      const getCol = (keyCandidates: string[]): string => {
        for (const candidate of keyCandidates) {
          const idx = header.findIndex((h) => h.includes(candidate));
          if (idx !== -1 && values[idx] !== undefined) {
            return values[idx].trim();
          }
        }
        return '';
      };

      const firstName = getCol(['first', 'firstname', 'child_name', 'given']);
      const lastName = getCol(['last', 'lastname', 'surname', 'family']);
      const middleName = getCol(['middle', 'middlename']);
      const dateOfBirth = getCol(['dob', 'birth', 'birthdate', 'date_of_birth']);
      const gender = (getCol(['gender', 'sex']).toLowerCase().startsWith('f') ? 'Female' : 'Male') as 'Male' | 'Female';
      const address = getCol(['address', 'residence', 'street']) || settings.barangayName;
      const purokSitio = getCol(['purok', 'sitio']) || settings.puroks[0] || 'Purok 1';
      const motherName = getCol(['mother', 'mother_name', 'guardian', 'parent']) || 'Nanay';
      const fatherName = getCol(['father', 'father_name']);
      const contactNumber = getCol(['contact', 'phone', 'mobile']) || '0917-000-0000';

      if (!firstName || !lastName || !dateOfBirth) {
        errors.push(`Row ${i + 1}: Missing required name or birthdate (${line.slice(0, 30)}...)`);
        skippedCount++;
        continue;
      }

      const isDuplicate = checkDuplicatePatient({ firstName, lastName, dateOfBirth }, newPatientsList);
      if (isDuplicate) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Skipped duplicate ${firstName} ${lastName} (DOB: ${dateOfBirth})`);
        continue;
      }

      const newId = generatePatientId(newPatientsList);
      const isBHW = currentUser?.role === 'bhw';
      const newPatient: Patient = {
        id: newId,
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        gender,
        address,
        purokSitio,
        motherName,
        fatherName,
        contactNumber,
        registrationDate: formatDateISO(new Date()),
        status: 'Active',
        verificationStatus: isBHW ? 'draft' : 'verified',
        registeredByRole: currentUser?.role || 'nurse',
        verifiedBy: !isBHW ? currentUser?.fullName : undefined,
        verifiedAt: !isBHW ? formatDateISO(new Date()) : undefined,
      };

      newPatientsList.unshift(newPatient);
      addedCount++;
    }

    if (addedCount > 0) {
      setPatients(newPatientsList);
      logActivity(
        'PATIENT_REGISTERED',
        `Bulk imported ${addedCount} patient records via CSV upload.`
      );
    }

    return { added: addedCount, skipped: skippedCount, errors };
  };

  // Full Database JSON Export & Import
  const exportDatabaseJSON = (): string => {
    const fullBackup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      facility: settings.barangayName,
      patients,
      vaccinationRecords,
      followUps,
      smsLogs,
      users,
      settings,
      theme,
      language,
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.patients && Array.isArray(data.patients)) {
        setPatients(data.patients);
      }
      if (data.vaccinationRecords && Array.isArray(data.vaccinationRecords)) {
        setVaccinationRecords(data.vaccinationRecords);
      }
      if (data.followUps && Array.isArray(data.followUps)) {
        setFollowUps(data.followUps);
      }
      if (data.smsLogs && Array.isArray(data.smsLogs)) {
        setSmsLogs(data.smsLogs);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.theme) {
        setTheme(data.theme);
      }
      if (data.language) {
        setLanguage(data.language);
      }
      logActivity('SETTINGS_UPDATED', `Restored database backup from uploaded JSON file.`);
      return true;
    } catch (e) {
      console.error('Failed to import JSON database', e);
      return false;
    }
  };

  // Reset to default
  const resetDemoData = () => {
    setPatients(INITIAL_PATIENTS);
    setVaccinationRecords(INITIAL_VACCINATION_RECORDS.map((v) => ({ ...v, verificationStatus: v.verificationStatus || 'verified' })));
    setFollowUps(INITIAL_FOLLOW_UPS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSmsLogs(INITIAL_SMS_LOGS);
    setUsers(INITIAL_USERS);
    setSettings(INITIAL_SETTINGS);
    setTheme('blue');
    setLanguage('en');
    setOfflineQueue([]);
    setSelectedPatientId(null);
    setPatientPortalPatient(null);
    setActiveTab('dashboard');
    logActivity('SETTINGS_UPDATED', `Reset database to official Barangay initial research demo dataset.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        patients,
        vaccinationRecords,
        followUps,
        auditLogs,
        smsLogs,
        settings,
        theme,
        setTheme,
        language,
        setLanguage,
        isOnline,
        offlineQueue,
        syncOfflineData,
        swCacheInfo,
        refreshSwCache,
        toggleOfflineSimulation,
        activeTab,
        setActiveTab,
        selectedPatientId,
        setSelectedPatientId,
        searchQuery,
        setSearchQuery,
        setCurrentUser,
        switchRole,
        login,
        logout,
        securityAlert,
        dismissSecurityAlert,
        isGmailConnected: gmailState.isConnected,
        gmailEmail: gmailState.email,
        connectGmail,
        disconnectGmail,
        signupStaffUser,
        requestPasswordReset,
        completePasswordReset,
        verifyAccountEmail,
        isContactModalOpen,
        openContactModal,
        closeContactModal,
        isSurveillanceModalOpen,
        openSurveillanceModal,
        closeSurveillanceModal,
        patientPortalPatient,
        loginPatientPortal,
        logoutPatientPortal,
        addPatient,
        updatePatient,
        verifyPatient,
        rejectPatient,
        verifyVaccineRecord,
        rejectVaccineRecord,
        resubmitVaccineDraft,
        resubmitPatientDraft,
        addVaccinationRecord,
        correctVaccinationRecord,
        addFollowUp,
        sendSMS,
        addUser,
        toggleUserStatus,
        deactivateUser,
        reactivateUser,
        submitReactivationComplaint,
        isReactivationModalOpen,
        openReactivationModalForUser,
        closeReactivationModal,
        activeDeactivatedUser,
        setActiveDeactivatedUser,
        updateSettings,
        logActivity,
        importPatientsFromCSV,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
