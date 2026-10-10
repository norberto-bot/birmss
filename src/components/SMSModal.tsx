import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Copy,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Patient } from '../types';
import { getPatientVaccineStatuses, formatDateHuman } from '../utils/immunizationUtils';

interface SMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export const SMSModal: React.FC<SMSModalProps> = ({ isOpen, onClose, patient }) => {
  const { 
    sendSMS, 
    vaccinationRecords, 
    settings, 
    smsLogs, 
    currentUser,
    language 
  } = useApp();

  if (!isOpen || !patient) return null;

  const statuses = getPatientVaccineStatuses(patient, vaccinationRecords);
  const nextPending = statuses.find(
    (s) => s.status === 'missed' || s.status === 'due' || s.status === 'upcoming'
  );

  const vaccineName = nextPending ? nextPending.vaccine.name : 'Routine Immunization Session';
  const dueDate = nextPending ? nextPending.dueDate : new Date().toISOString().slice(0, 10);

  // Generate initial personalized text
  const initialTemplate = settings.smsTemplate || 
    'Magandang araw po [GUARDIAN]. Mula po sa [HEALTH_CENTER], nais po naming ipaalala na si [CHILD_NAME] ay may nakatakdang bakuna ([VACCINE]) sa [DATE]. Mangyaring pumunta sa Barangay Health Station tuwing Miyerkules/Biyernes (8:00 AM - 12:00 NN). Maraming salamat po!';

  const formattedInitialText = initialTemplate
    .replace(/\[GUARDIAN\]/g, patient.motherName || 'Nanay/Tatay')
    .replace(/\[HEALTH_CENTER\]/g, settings.healthCenterName)
    .replace(/\[CHILD_NAME\]/g, `${patient.firstName} ${patient.lastName}`)
    .replace(/\[VACCINE\]/g, vaccineName)
    .replace(/\[DATE\]/g, formatDateHuman(dueDate));

  const [messageText, setMessageText] = useState(formattedInitialText);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: boolean; text: string } | null>(null);

  const handleSendViaGateway = async () => {
    setIsSending(true);
    setSendStatus(null);
    try {
      const res = await sendSMS(patient.id, messageText);
      setSendStatus({
        success: res.success,
        text: res.message,
      });
    } catch {
      setSendStatus({
        success: false,
        text: 'Failed to dispatch SMS through gateway.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenDeviceSMS = () => {
    const encodedBody = encodeURIComponent(messageText);
    const cleanPhone = patient.contactNumber.replace(/[^0-9+]/g, '');
    // Standard mobile SMS URI scheme
    window.location.href = `sms:${cleanPhone}?body=${encodedBody}`;
  };

  const patientSmsHistory = smsLogs.filter((s) => s.patientId === patient.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'fil' ? 'Magpadala ng SMS Reminder' : 'Dispatch SMS Reminder Notification'}
              </h3>
              <p className="text-xs text-slate-500">
                To: <strong className="text-slate-800">{patient.motherName}</strong> ({patient.contactNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Patient Quick Context */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Child Name:</span>
              <span className="font-bold text-slate-900 truncate block">
                {patient.firstName} {patient.lastName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Vaccine Due:</span>
              <span className="font-semibold text-blue-700 truncate block">
                {vaccineName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Due Date:</span>
              <span className="font-tabular font-medium text-slate-800">
                {formatDateHuman(dueDate)}
              </span>
            </div>
          </div>

          {/* Editable SMS Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">
                SMS Notification Message (Philippine Gateway Format):
              </label>
              <span className="font-mono text-[11px] text-slate-400">
                {messageText.length} chars (approx {Math.ceil(messageText.length / 160)} SMS parts)
              </span>
            </div>
            <textarea
              rows={5}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 font-sans text-xs border border-slate-200 rounded-xl bg-white focus:bg-slate-50 focus:ring-2 focus:ring-blue-500/20 leading-relaxed text-slate-800"
            />
            <p className="text-[11px] text-slate-500">
              Gateway: <strong className="text-slate-700 uppercase">{settings.smsGateway || 'SEMAPHORE'}</strong> (Sender ID: {settings.smsSenderName || 'BHS'})
            </p>
          </div>

          {/* Status Message */}
          {sendStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              sendStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{sendStatus.text}</span>
            </div>
          )}

          {/* Send Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleSendViaGateway}
              disabled={isSending}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending via Gateway...' : 'Send SMS (Semaphore Gateway)'}</span>
            </button>

            <button
              onClick={handleOpenDeviceSMS}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-colors"
              title="Opens your smartphone's messaging app with pre-filled text and phone number"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open on Phone SMS App (Free)</span>
            </button>
          </div>

          {/* Previous SMS History for this patient */}
          {patientSmsHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Previous SMS Notices Sent ({patientSmsHistory.length})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {patientSmsHistory.map((log) => (
                  <div key={log.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-800">{log.vaccineDue}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{log.timestamp} · By {log.sentBy}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
