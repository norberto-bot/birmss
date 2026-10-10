import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  HeartHandshake, 
  Calendar, 
  Phone, 
  Mail, 
  Key, 
  X, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Sparkles, 
  ShieldAlert,
  Send,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { validatePasswordStrength, generateCSRFToken } from '../utils/securityUtils';
import { UserRole } from '../types';
import { ReactivationComplaintModal } from './ReactivationComplaintModal';

export const LoginView: React.FC = () => {
  const { 
    login, 
    loginPatientPortal, 
    users, 
    settings, 
    setCurrentUser, 
    language,
    signupStaffUser,
    requestPasswordReset,
    completePasswordReset,
    verifyAccountEmail,
    openContactModal,
    openReactivationModalForUser,
    setActiveTab
  } = useApp();

  const [activePortalTab, setActivePortalTab] = useState<'staff' | 'patient'>('staff');
  const [activeStaffMode, setActiveStaffMode] = useState<'login' | 'signup'>('login');

  // Staff login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [csrfToken] = useState(() => generateCSRFToken());

  // Patient / Parent credentials
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [patientSecret, setPatientSecret] = useState('');
  const [parentErrorMsg, setParentErrorMsg] = useState('');

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [resetFeedback, setResetFeedback] = useState('');

  // Reset password token completion modal
  const [showResetTokenModal, setShowResetTokenModal] = useState(false);
  const [activeResetToken, setActiveResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetTokenStatus, setResetTokenStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetTokenMsg, setResetTokenMsg] = useState('');

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: '',
    username: '',
    email: '',
    role: 'nurse' as UserRole,
    title: 'Public Health Nurse',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    purokAssigned: 'Purok 1 - Maligaya',
  });
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [signupMsg, setSignupMsg] = useState('');

  // Check URL query parameters for ?action=verify&token=... or ?action=reset-password&token=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const token = params.get('token');

      if (action === 'verify' && token) {
        verifyAccountEmail(token).then((res) => {
          if (res.success) {
            setSuccessNotice('Email address verified successfully! Your healthcare worker account is now active.');
          } else {
            setErrorMsg(res.message);
          }
          // Clean URL without reload
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      } else if (action === 'reset-password' && token) {
        setActiveResetToken(token);
        setShowResetTokenModal(true);
      }
    } catch (e) {
      console.warn('URL param parse error', e);
    }
  }, []);

  // Password strength meter calculation for registration / reset
  const currentPasswordToEvaluate = activeStaffMode === 'signup' ? signupData.password : newPassword;
  const strengthCheck = validatePasswordStrength(currentPasswordToEvaluate);

  const handleSubmitStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both your username/email and password.');
      return;
    }

    const res = login(username.trim(), password);
    if (!res.success) {
      setErrorMsg(res.message);
      if (res.isDeactivated && res.deactivatedUser) {
        openReactivationModalForUser(res.deactivatedUser);
      }
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupStatus('idle');
    setSignupMsg('');

    if (signupData.password !== signupData.confirmPassword) {
      setSignupStatus('error');
      setSignupMsg('Passwords do not match. Please re-type your password confirmation.');
      return;
    }

    if (!strengthCheck.isValid) {
      setSignupStatus('error');
      setSignupMsg(strengthCheck.errors.join(' '));
      return;
    }

    setSignupStatus('loading');
    try {
      const res = await signupStaffUser({
        fullName: signupData.fullName,
        username: signupData.username,
        email: signupData.email,
        role: signupData.role,
        title: signupData.title,
        contactNumber: signupData.contactNumber,
        password: signupData.password,
        purokAssigned: signupData.role === 'bhw' ? signupData.purokAssigned : undefined,
      });

      if (res.success) {
        setSignupStatus('success');
        setSignupMsg(res.message);
        setSignupData({
          fullName: '',
          username: '',
          email: '',
          role: 'nurse',
          title: 'Public Health Nurse',
          contactNumber: '',
          password: '',
          confirmPassword: '',
          purokAssigned: 'Purok 1 - Maligaya',
        });
      } else {
        setSignupStatus('error');
        setSignupMsg(res.message);
      }
    } catch (err: any) {
      setSignupStatus('error');
      setSignupMsg(err.message || 'An error occurred during account creation.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetFeedback('Please enter a valid email address.');
      return;
    }

    setResetStatus('loading');
    try {
      const res = await requestPasswordReset(resetEmail.trim());
      setResetStatus('done');
      setResetFeedback(res.message);
    } catch (err: any) {
      setResetStatus('done');
      setResetFeedback('If an account exists with this email, a reset email has been dispatched via Gmail.');
    }
  };

  const handleCompleteResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetTokenStatus('idle');
    setResetTokenMsg('');

    if (newPassword !== confirmPassword) {
      setResetTokenStatus('error');
      setResetTokenMsg('Passwords do not match.');
      return;
    }

    const check = validatePasswordStrength(newPassword);
    if (!check.isValid) {
      setResetTokenStatus('error');
      setResetTokenMsg(check.errors.join(' '));
      return;
    }

    setResetTokenStatus('loading');
    try {
      const res = await completePasswordReset(activeResetToken, newPassword);
      if (res.success) {
        setResetTokenStatus('success');
        setResetTokenMsg(res.message);
        setTimeout(() => {
          setShowResetTokenModal(false);
          setSuccessNotice('Password reset completed! You can now log in.');
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 1800);
      } else {
        setResetTokenStatus('error');
        setResetTokenMsg(res.message);
      }
    } catch (err: any) {
      setResetTokenStatus('error');
      setResetTokenMsg(err.message || 'Failed to reset password.');
    }
  };

  const handleSubmitParent = (e: React.FormEvent) => {
    e.preventDefault();
    setParentErrorMsg('');

    if (!patientIdentifier.trim() || !patientSecret.trim()) {
      setParentErrorMsg('Please provide both the Child ID / Name and family verification detail.');
      return;
    }

    const ok = loginPatientPortal(patientIdentifier.trim(), patientSecret.trim());
    if (!ok) {
      setParentErrorMsg('Child record not found or verification detail did not match registered records. Please verify information or contact your assigned BHW.');
    }
  };

  // Quick 1-Click Role Login for Defense Presentation
  const handleQuickLoginStaff = (role: 'doctor' | 'nurse' | 'bhw' | 'admin') => {
    const activeUser = users.find((u) => u.role === role && u.isActive);
    if (activeUser) {
      setCurrentUser(activeUser);
      setActiveTab('dashboard');
      return;
    }

    const deactUser = users.find((u) => u.role === role);
    if (deactUser) {
      openReactivationModalForUser(deactUser);
      setErrorMsg(`Access Blocked: The account for ${deactUser.fullName} (@${deactUser.username}) is deactivated. Portal access is blocked.`);
    }
  };

  const handleQuickLoginParent = (patientId: string, secret: string) => {
    loginPatientPortal(patientId, secret);
  };

  return (
    <div data-theme="coral-mint" className="min-h-screen bg-gradient-to-br from-slate-100 via-[#FFEAEA]/40 to-slate-100 flex flex-col items-center justify-center p-4 selection:bg-[#FF9AA2] selection:text-white">
      
      <div className="w-full max-w-md space-y-5">
        
        {/* Branding & Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[#FF9AA2] shadow-md bg-white flex items-center justify-center">
            <img
              src="/src/assets/images/barangay_health_logo_1790812695237.jpg"
              alt="Barangay Health Seal"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Building2 className="w-10 h-10 text-[#FF9AA2]" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {settings.barangayName}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#C94C58]">
            {settings.healthCenterName}
          </p>
          <p className="text-xs text-slate-500">
            Barangay Immunization Record and Monitoring System (BIRMS)
          </p>
        </div>

        {/* Portal Tab Switcher: Staff vs Parent */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center shadow-inner">
          <button
            type="button"
            onClick={() => setActivePortalTab('staff')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activePortalTab === 'staff'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Health Staff Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('patient')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activePortalTab === 'patient'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Parent / Patient Portal</span>
          </button>
        </div>

        {/* Global Notices */}
        {successNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Staff Portal Box */}
        {activePortalTab === 'staff' ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-7 space-y-5">
            
            {/* Staff Sub-tabs: Sign In vs Sign Up */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {activeStaffMode === 'login' ? 'Health Staff Sign In' : 'Register Staff Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeStaffMode === 'login' 
                    ? 'Authorized access for Physicians, Nurses, and BHWs' 
                    : 'Create healthcare profile with Gmail email verification'}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => { setActiveStaffMode('login'); setErrorMsg(''); }}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeStaffMode === 'login' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveStaffMode('signup'); setErrorMsg(''); }}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeStaffMode === 'signup' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            {activeStaffMode === 'login' ? (
              <form onSubmit={handleSubmitStaff} className="space-y-4 text-xs">
                <input type="hidden" name="_csrf" value={csrfToken} />

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Username or Gov Email</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. nurse.kristine or admin.sanisidro@csfp.gov.ph"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">Password</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setResetFeedback(''); setResetStatus('idle'); }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In to Healthcare System</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Signup Form with Password Strength Validation & Gmail Verification */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
                <input type="hidden" name="_csrf" value={csrfToken} />

                {signupStatus === 'success' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <span className="font-bold block">Account Created!</span>
                      <span>{signupMsg}</span>
                    </div>
                  </div>
                )}

                {signupStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{signupMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos, RN"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. nurse.maria"
                      value={signupData.username}
                      onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Email (Gmail for Verification) *</label>
                    <input
                      type="email"
                      required
                      placeholder="maria@csfp.gov.ph"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Contact Mobile *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+63 9XX XXX XXXX"
                      value={signupData.contactNumber}
                      onChange={(e) => setSignupData({ ...signupData, contactNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Role *</label>
                    <select
                      value={signupData.role}
                      onChange={(e) => setSignupData({ ...signupData, role: e.target.value as UserRole })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="nurse">Public Health Nurse (RN)</option>
                      <option value="doctor">Rural Health Physician (MD)</option>
                      <option value="bhw">Barangay Health Worker (BHW)</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Official Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Public Health Nurse"
                      value={signupData.title}
                      onChange={(e) => setSignupData({ ...signupData, title: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {signupData.role === 'bhw' && (
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Assigned Purok / Area *</label>
                    <select
                      value={signupData.purokAssigned}
                      onChange={(e) => setSignupData({ ...signupData, purokAssigned: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      {settings.puroks?.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Password (Min 10 chars, Upper, Lower, Number, Symbol) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  
                  {/* Dynamic Password Strength Meter */}
                  {signupData.password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`h-1.5 flex-1 rounded-full ${
                              step < strengthCheck.score
                                ? strengthCheck.score === 4
                                  ? 'bg-emerald-500'
                                  : strengthCheck.score >= 2
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          {strengthCheck.score === 4 ? '🟢 Strong Password' : '🟡 Incomplete security requirements'}
                        </span>
                        <span>{signupData.password.length}/10+ chars</span>
                      </div>
                      {strengthCheck.errors.length > 0 && (
                        <span className="text-[10px] text-red-600 block">
                          Missing: {strengthCheck.errors[0]}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signupStatus === 'loading'}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{signupStatus === 'loading' ? 'Creating Account & Sending Email...' : 'Register Account via Gmail'}</span>
                </button>
              </form>
            )}

            {/* Quick Demo Credentials Box for Research Presentation */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 block uppercase tracking-wider">
                Research Defense / 1-Click Role Login:
              </span>

              <div className="grid grid-cols-4 gap-1.5">
                {/* Nurse */}
                {(() => {
                  const activeNurse = users.find((u) => u.role === 'nurse' && u.isActive);
                  const deactNurse = users.find((u) => u.role === 'nurse');
                  if (activeNurse) {
                    return (
                      <button
                        type="button"
                        onClick={() => handleQuickLoginStaff('nurse')}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-center transition-colors"
                      >
                        <div className="font-bold text-[11px] text-blue-900">Nurse</div>
                        <div className="text-[10px] text-blue-700 truncate">{activeNurse.fullName}</div>
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => deactNurse && openReactivationModalForUser(deactNurse)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 border border-dashed border-slate-300 text-center transition-colors group"
                      title="Nurse account is deactivated - Click to view status & appeal"
                    >
                      <div className="font-bold text-[11px] text-slate-500">Nurse</div>
                      <div className="text-[10px] text-red-600 font-semibold group-hover:underline">Deactivated</div>
                    </button>
                  );
                })()}

                {/* Doctor */}
                {(() => {
                  const activeDoctor = users.find((u) => u.role === 'doctor' && u.isActive);
                  const deactDoctor = users.find((u) => u.role === 'doctor');
                  if (activeDoctor) {
                    return (
                      <button
                        type="button"
                        onClick={() => handleQuickLoginStaff('doctor')}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-center transition-colors"
                      >
                        <div className="font-bold text-[11px] text-indigo-900">Doctor</div>
                        <div className="text-[10px] text-indigo-700 truncate">{activeDoctor.fullName}</div>
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => deactDoctor && openReactivationModalForUser(deactDoctor)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 border border-dashed border-slate-300 text-center transition-colors group"
                      title="Doctor account is deactivated - Click to view status & appeal"
                    >
                      <div className="font-bold text-[11px] text-slate-500">Doctor</div>
                      <div className="text-[10px] text-red-600 font-semibold group-hover:underline">Deactivated</div>
                    </button>
                  );
                })()}

                {/* BHW */}
                {(() => {
                  const activeBHW = users.find((u) => u.role === 'bhw' && u.isActive);
                  const deactBHW = users.find((u) => u.role === 'bhw');
                  if (activeBHW) {
                    return (
                      <button
                        type="button"
                        onClick={() => handleQuickLoginStaff('bhw')}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center transition-colors"
                      >
                        <div className="font-bold text-[11px] text-emerald-900">BHW</div>
                        <div className="text-[10px] text-emerald-700 truncate">{activeBHW.fullName}</div>
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => deactBHW && openReactivationModalForUser(deactBHW)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 border border-dashed border-slate-300 text-center transition-colors group"
                      title="BHW account is deactivated - Click to view status & appeal"
                    >
                      <div className="font-bold text-[11px] text-slate-500">BHW</div>
                      <div className="text-[10px] text-red-600 font-semibold group-hover:underline">Deactivated</div>
                    </button>
                  );
                })()}

                {/* Admin */}
                {(() => {
                  const activeAdmin = users.find((u) => u.role === 'admin' && u.isActive);
                  return (
                    <button
                      type="button"
                      onClick={() => handleQuickLoginStaff('admin')}
                      className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-center transition-colors"
                    >
                      <div className="font-bold text-[11px] text-purple-900">Admin</div>
                      <div className="text-[10px] text-purple-700 truncate">{activeAdmin?.fullName || 'System Admin'}</div>
                    </button>
                  );
                })()}
              </div>
            </div>

          </div>
        ) : (
          /* Patient & Parent Portal Login Box (Strict View-Only) */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-7 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Patient & Parent Portal</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Strict View-Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Parents can view their child's verified vaccination history and download printable school medical cards (Form 138 / Daycare / Kinder).
              </p>
            </div>

            {parentErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{parentErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitParent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Child Patient ID or Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. BRGY-2026-0001 or Mateo Santos"
                    value={patientIdentifier}
                    onChange={(e) => setPatientIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Family Verification (DOB: YYYY-MM-DD / Contact Number / Mother's Name) *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025-07-15 or Carmela or 0917-882-9102"
                    value={patientSecret}
                    onChange={(e) => setPatientSecret(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Protects patient confidentiality: data is isolated to each child's registered family.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <span>Access Child Immunization Record</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Test for Evaluators */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 block uppercase tracking-wider">
                1-Click Parent Demo Logins (Try It):
              </span>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLoginParent('BRGY-2026-0001', '2025-07-15')}
                  className="w-full p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-emerald-950">Mateo Santos (14 mos - FIC Complete)</div>
                    <div className="text-[11px] text-emerald-700">Mother: Carmela · DOB: 2025-07-15</div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Open Record
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLoginParent('BRGY-2026-0002', '2026-02-10')}
                  className="w-full p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-emerald-950">Sofia Mendoza (7 mos - In Progress)</div>
                    <div className="text-[11px] text-emerald-700">Mother: Teresa · DOB: 2026-02-10</div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Open Record
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security & System info footer with Contact link */}
        <div className="text-center text-xs text-slate-500 space-y-2">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Role-Based Protection · DOH EPI Standard · Bcrypt Hashing</span>
          </p>

          <div>
            <button
              onClick={openContactModal}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Need help? Contact Health Center Administration (Gmail)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal (Requests Email, Rate-Limits Max 3/Hour, Sends 1-Hour Token via Gmail) */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Forgot Your Password?</h3>
                <p className="text-xs text-slate-500">Secure one-time link dispatched via Gmail</p>
              </div>
            </div>

            {resetStatus === 'done' ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 inline mr-1" />
                  <span>{resetFeedback}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                  <strong>⏰ Security Advisory:</strong>
                  <p>The reset link is strictly valid for <strong>1 hour</strong> and will automatically expire once used. Never share your link.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-2 bg-slate-900 text-white font-semibold rounded-lg"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Enter your registered healthcare worker email address. We will send you a cryptographically secure, 1-hour password reset link via Gmail.
                </p>

                {resetFeedback && (
                  <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                    {resetFeedback}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. kristine.alcantara@csfp.gov.ph"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                  Rate limiting: Maximum 3 password reset requests per email per hour.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus === 'loading'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{resetStatus === 'loading' ? 'Dispatching via Gmail...' : 'Send Reset Link'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Password Reset Token Completion Modal (Triggered by reset link from Gmail) */}
      {showResetTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Set New Account Password</h3>
                <p className="text-xs text-slate-500">High-security password reset (Token verified)</p>
              </div>
            </div>

            {resetTokenStatus === 'success' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Password Reset Successfully!</span>
                </div>
                <p>{resetTokenMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleCompleteResetSubmit} className="space-y-3.5 text-xs">
                
                {resetTokenStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{resetTokenMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    New Password (Min 10 chars, uppercase, lowercase, digit, symbol) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />

                  {newPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`h-1.5 flex-1 rounded-full ${
                              step < strengthCheck.score
                                ? strengthCheck.score === 4
                                  ? 'bg-emerald-500'
                                  : strengthCheck.score >= 2
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {strengthCheck.score === 4 ? '🟢 Valid strong password' : '🟡 Must satisfy all healthcare IT criteria'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetTokenModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetTokenStatus === 'loading'}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{resetTokenStatus === 'loading' ? 'Hashing & Updating...' : 'Save New Password'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Deactivated Account Complaint & Redirection to Gmail Modal */}
      <ReactivationComplaintModal />

    </div>
  );
};
