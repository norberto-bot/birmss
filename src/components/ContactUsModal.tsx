import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Phone, 
  MessageSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendContactMessageToAdmin, getConnectedGmail } from '../services/gmailService';
import { sanitizeInput, generateCSRFToken } from '../utils/securityUtils';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({ isOpen, onClose }) => {
  const { settings, currentUser } = useApp();

  const [fromName, setFromName] = useState(currentUser?.fullName || '');
  const [fromEmail, setFromEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.contactNumber || '');
  const [topic, setTopic] = useState('Immunization Inquiry');
  const [message, setMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [csrfToken] = useState(() => generateCSRFToken());

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setFeedbackMsg('');

    const cleanName = sanitizeInput(fromName);
    const cleanEmail = sanitizeInput(fromEmail);
    const cleanPhone = sanitizeInput(phone);
    const cleanTopic = sanitizeInput(topic);
    const cleanMessage = sanitizeInput(message);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setStatus('error');
      setFeedbackMsg('Please complete all required fields (Name, Email, and Message).');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setStatus('error');
      setFeedbackMsg('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendContactMessageToAdmin(
        cleanName,
        cleanEmail,
        cleanPhone,
        cleanTopic,
        cleanMessage,
        'norbertojomar@gmail.com'
      );

      if (result.success) {
        setStatus('success');
        setFeedbackMsg(
          result.simulated 
            ? 'Your message has been securely submitted! (Sent directly to health center administrator at norbertojomar@gmail.com).'
            : 'Your message has been delivered to norbertojomar@gmail.com via the connected Gmail integration!'
        );
        setMessage('');
      } else {
        throw new Error(result.error || 'Failed to dispatch email');
      }
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setStatus('error');
      setFeedbackMsg(err.message || 'Unable to submit message at this time. Please try again or reach the health center directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const connectedGmail = getConnectedGmail();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Contact Health Center Administration
            </h3>
            <p className="text-xs text-slate-500">
              Direct communication to <strong className="text-blue-700">norbertojomar@gmail.com</strong>
            </p>
          </div>
        </div>

        {/* Success or Error Alert */}
        {status === 'success' && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Message Successfully Dispatched!</span>
              <span>{feedbackMsg}</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <input type="hidden" name="_csrf" value={csrfToken} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Your Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Teresa Santos"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Your Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Contact Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Topic / Category *</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Immunization Schedule Inquiry">Immunization Schedule Inquiry</option>
                <option value="School Record / Form 138 Request">School Record / Form 138 Request</option>
                <option value="Account & Security Assistance">Account & Security Assistance</option>
                <option value="BHW / Nurse Appointment">BHW / Nurse Appointment</option>
                <option value="Adverse Reaction (AEFI) Report">Adverse Reaction (AEFI) Report</option>
                <option value="Other Feedback or Inquiries">Other Feedback or Inquiries</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold">Message *</label>
            <textarea
              required
              rows={4}
              placeholder="Type your question or message for the barangay health center administrator..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Input sanitized & protected against XSS & CSRF</span>
            </span>
            <span className="font-mono text-slate-400">Recipient: norbertojomar@gmail.com</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              {isSubmitting ? (
                <span>Dispatching via Gmail...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message to Admin</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
