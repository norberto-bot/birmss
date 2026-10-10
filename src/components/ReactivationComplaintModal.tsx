import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Mail, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ReactivationComplaintModal: React.FC = () => {
  const { 
    isReactivationModalOpen, 
    closeReactivationModal, 
    activeDeactivatedUser, 
    submitReactivationComplaint,
    settings 
  } = useApp();

  const [complaintText, setComplaintText] = useState(
    'I am formally filing a complaint and appeal regarding the deactivation of my account. I request an administrative review and verification of my credentials and standing to reactivate my access to the BIRMS portal.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  if (!isReactivationModalOpen || !activeDeactivatedUser) return null;

  const adminEmail = settings.email || 'norbertojomar@gmail.com';

  const handleRedirectToGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmittedNotice(null);

    try {
      const res = await submitReactivationComplaint(
        activeDeactivatedUser.id,
        complaintText.trim(),
        true // Open Gmail redirection
      );

      if (res.success) {
        setSubmittedNotice(
          `Redirected to Gmail! Your complaint has been submitted and recorded. The Administrator (${adminEmail}) will verify your request to reactivate your account.`
        );
      }
    } catch (err: any) {
      console.error('Failed to submit reactivation complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitInPortalOnly = async () => {
    setIsSubmitting(true);
    setSubmittedNotice(null);

    try {
      const res = await submitReactivationComplaint(
        activeDeactivatedUser.id,
        complaintText.trim(),
        false // Do not redirect popup, record in-portal
      );

      if (res.success) {
        setSubmittedNotice(
          `Your appeal has been recorded in the health system! The Administrator will review your complaint and verify your account in User Management.`
        );
      }
    } catch (err: any) {
      console.error('Failed to record appeal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-red-500 selection:text-white">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-red-200 relative animate-in fade-in zoom-in duration-150">
        
        {/* Close Button */}
        <button
          onClick={closeReactivationModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-red-100 pb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 mb-1">
              <span>Account Deactivated · Login Prohibited</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Portal Access Restricted
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Barangay Immunization Record and Monitoring System (BIRMS)
            </p>
          </div>
        </div>

        {/* Deactivated User Info Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Account:</span>
            </span>
            <span className="font-bold text-slate-900">{activeDeactivatedUser.fullName}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Username & Role:</span>
            <span className="font-mono text-slate-800">
              @{activeDeactivatedUser.username} · {activeDeactivatedUser.role.toUpperCase()} ({activeDeactivatedUser.title})
            </span>
          </div>

          {activeDeactivatedUser.deactivatedAt && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Deactivated On:</span>
              </span>
              <span className="text-slate-800">
                {new Date(activeDeactivatedUser.deactivatedAt).toLocaleDateString()}
              </span>
            </div>
          )}

          {activeDeactivatedUser.deactivationReason && (
            <div className="pt-2 border-t border-slate-200 text-slate-700">
              <span className="font-semibold text-slate-500">Deactivation Reason: </span>
              <span className="italic">{activeDeactivatedUser.deactivationReason}</span>
            </div>
          )}
        </div>

        {/* System Directive Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Healthcare IT Compliance Notice</span>
          </div>
          <p className="leading-relaxed">
            Once a user has been deactivated, you cannot log in or be displayed on the portal. Access to immunization logs and patient data is completely blocked.
          </p>
          <p className="leading-relaxed font-semibold text-amber-950 pt-1">
            To restore access, you may redirect to Gmail to file an official complaint/appeal for the Admin, which will be verified and approved by the Administrator to reactivate your account.
          </p>
        </div>

        {/* Pending Appeal Notice if already requested */}
        {activeDeactivatedUser.pendingReactivation && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-800">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Pending Administrator Verification</span>
            </div>
            <p className="leading-relaxed">
              Your reactivation appeal was filed on <strong>{activeDeactivatedUser.reactivationRequestedAt || 'recently'}</strong> and is awaiting administrative clearance.
            </p>
            {activeDeactivatedUser.reactivationComplaint && (
              <p className="text-[11px] italic bg-white/80 p-2 rounded border border-blue-100 text-blue-950">
                "{activeDeactivatedUser.reactivationComplaint}"
              </p>
            )}
          </div>
        )}

        {/* Success Confirmation Notice */}
        {submittedNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Reactivation Complaint Dispatched!</span>
              <span>{submittedNotice}</span>
            </div>
          </div>
        )}

        {/* Complaint & Appeal Form */}
        <form onSubmit={handleRedirectToGmail} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Your Complaint / Grounds for Reactivation (Sent to Administrator):
            </label>
            <textarea
              rows={3}
              required
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="State your clarification, explanation, or request for reactivation..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 bg-white leading-relaxed resize-none"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Recipient: <strong>{adminEmail}</strong> (Barangay Health System Administrator)
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Redirect into Gmail for Complaint to Admin</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleSubmitInPortalOnly}
                disabled={isSubmitting}
                className="py-1.5 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Send className="w-3 h-3 text-slate-500" />
                <span>Submit Appeal in Portal</span>
              </button>

              <button
                type="button"
                onClick={closeReactivationModal}
                className="py-1.5 px-3 text-slate-500 hover:text-slate-800 text-xs font-medium"
              >
                Dismiss / Back
              </button>
            </div>
          </div>
        </form>

        {/* Footer Guarantee */}
        <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Admin verification required prior to account reactivation · CSFP RHU</span>
        </div>

      </div>
    </div>
  );
};
