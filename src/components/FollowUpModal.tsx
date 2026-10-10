import React, { useState } from 'react';
import { 
  X, 
  ClipboardList, 
  Calendar, 
  MapPin, 
  Phone, 
  UserCheck 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateISO } from '../utils/immunizationUtils';
import { SmartRemarksSelector } from './SmartRemarksSelector';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  patientId,
}) => {
  const { patients, addFollowUp, currentUser, language } = useApp();

  const patient = patients.find((p) => p.id === patientId);

  const [followUpDate, setFollowUpDate] = useState(formatDateISO(new Date()));
  const [contactMethod, setContactMethod] = useState<'Home Visit' | 'Phone Call' | 'Barangay Health Center Visit' | 'SMS Notice'>('Home Visit');
  const [assignedBHW, setAssignedBHW] = useState(currentUser?.fullName || 'Assigned Barangay Health Worker');
  const [followUpResult, setFollowUpResult] = useState<'Reached - Confirmed Visit' | 'Reached - Rescheduled' | 'Unreachable - Not Home' | 'Transferred Residence' | 'Parent Requested Guidance'>('Reached - Confirmed Visit');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  
  // Smart remarks selection
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [customRemarks, setCustomRemarks] = useState('');

  if (!isOpen || !patient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const combinedRemarks = [...selectedNotes, customRemarks.trim()].filter(Boolean).join('; ');
    if (!combinedRemarks) return;

    addFollowUp({
      patientId: patient.id,
      followUpDate,
      contactMethod,
      assignedBHW,
      followUpResult,
      nextFollowUpDate: nextFollowUpDate || undefined,
      remarks: combinedRemarks,
      specialNotes: selectedNotes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Log Patient Follow-Up Activity</h3>
              <p className="text-xs text-emerald-800 font-medium">
                {patient.firstName} {patient.lastName} ({patient.id}) · {patient.purokSitio}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Follow-Up Date *</label>
              <input
                type="date"
                required
                max={formatDateISO(new Date())}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 bg-white font-tabular"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Contact Method *</label>
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 bg-white"
              >
                <option value="Home Visit">Home Visit (BHW House-to-House)</option>
                <option value="Phone Call">Phone Call to Guardian</option>
                <option value="Barangay Health Center Visit">Barangay Health Center In-Person</option>
                <option value="SMS Notice">SMS Written Notice</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Assigned BHW / Worker *</label>
              <input
                type="text"
                required
                value={assignedBHW}
                onChange={(e) => setAssignedBHW(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Follow-Up Result *</label>
              <select
                value={followUpResult}
                onChange={(e) => setFollowUpResult(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 bg-white"
              >
                <option value="Reached - Confirmed Visit">Reached - Confirmed Clinic Visit</option>
                <option value="Reached - Rescheduled">Reached - Rescheduled Due to Sickness/Travel</option>
                <option value="Unreachable - Not Home">Unreachable - Not Home / Phone Inactive</option>
                <option value="Transferred Residence">Transferred Residence Outside Barangay</option>
                <option value="Parent Requested Guidance">Parent Requested Vaccine Counseling</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Target Next Follow-Up / Clinic Date</label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 bg-white font-tabular"
            />
          </div>

          {/* Smart Remarks / Notes with pre-defined quick chips */}
          <SmartRemarksSelector
            selectedNotes={selectedNotes}
            onChangeNotes={setSelectedNotes}
            customText={customRemarks}
            onChangeCustomText={setCustomRemarks}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              Save Follow-Up Entry
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
