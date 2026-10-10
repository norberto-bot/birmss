import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  HeartPulse, 
  Check 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { checkDuplicatePatient, calculateAge, formatDateISO } from '../utils/immunizationUtils';
import { Patient, Gender, PatientStatus } from '../types';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (patientId: string) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded,
}) => {
  const { patients, addPatient, settings, currentUser } = useApp();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfBirth: '',
    gender: 'Male' as Gender,
    address: '',
    purokSitio: settings.puroks[0] || 'Purok 1',
    motherName: '',
    fatherName: '',
    guardianName: '',
    contactNumber: '',
    birthWeightKg: '',
    birthPlace: '',
    bloodType: 'O+',
    remarks: '',
  });

  const [duplicateWarning, setDuplicateWarning] = useState<Patient | undefined>(undefined);
  const [allowDuplicateBypass, setAllowDuplicateBypass] = useState(false);

  // Check duplicate whenever names or DOB changes
  useEffect(() => {
    if (formData.firstName && formData.lastName && formData.dateOfBirth) {
      const duplicate = checkDuplicatePatient(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
        },
        patients
      );
      setDuplicateWarning(duplicate);
    } else {
      setDuplicateWarning(undefined);
    }
  }, [formData.firstName, formData.lastName, formData.dateOfBirth, patients]);

  if (!isOpen) return null;

  const agePreview = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (duplicateWarning && !allowDuplicateBypass) {
      return;
    }

    const res = addPatient({
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim(),
      lastName: formData.lastName.trim(),
      suffix: formData.suffix.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      address: formData.address.trim(),
      purokSitio: formData.purokSitio,
      motherName: formData.motherName.trim(),
      fatherName: formData.fatherName.trim(),
      guardianName: formData.guardianName.trim() || undefined,
      contactNumber: formData.contactNumber.trim(),
      birthWeightKg: formData.birthWeightKg ? parseFloat(formData.birthWeightKg) : undefined,
      birthPlace: formData.birthPlace.trim() || undefined,
      bloodType: formData.bloodType || undefined,
      remarks: formData.remarks.trim() || undefined,
      status: 'Active' as PatientStatus,
    });

    if (res.success && res.patientId) {
      onPatientAdded(res.patientId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Register New Patient</h3>
              <p className="text-xs text-slate-500">
                Barangay Immunization Master Registry & Child Record
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Duplicate Record Checking Alert Banner */}
          {duplicateWarning && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-xs">
                  Duplicate Record Warning Detected!
                </p>
                <p className="text-amber-800 text-xs">
                  A patient named <strong className="font-semibold">{duplicateWarning.firstName} {duplicateWarning.lastName}</strong> with birthdate <strong className="font-semibold">{duplicateWarning.dateOfBirth}</strong> is already registered under ID <span className="font-mono font-bold">{duplicateWarning.id}</span> in {duplicateWarning.purokSitio}.
                </p>
                <label className="flex items-center gap-2 pt-1 text-xs text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDuplicateBypass}
                    onChange={(e) => setAllowDuplicateBypass(e.target.checked)}
                    className="rounded border-amber-400 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Confirm: This is a different child with a coincidental name & birthdate</span>
                </label>
              </div>
            </div>
          )}

          {/* Child Name Section */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              1. Child / Infant Demographic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1 font-medium">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Christian John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Middle Name</label>
                <input
                  type="text"
                  placeholder="e.g. Reyes"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mendoza"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Suffix (e.g. Jr., III)</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={formData.suffix}
                  onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Date of Birth *</label>
                <input
                  type="date"
                  required
                  max={formatDateISO(new Date())}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-tabular"
                />
                {agePreview && (
                  <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">
                    Calculated Age: {agePreview.formatted}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Sex / Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Contact Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              2. Address & Residence Location
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Purok / Sitio *</label>
                <select
                  value={formData.purokSitio}
                  onChange={(e) => setFormData({ ...formData, purokSitio: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {settings.puroks.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">House / Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 54 Rizal Street, Sitio Maligaya"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Parents & Guardians */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              3. Parent / Guardian & Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Mother's Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Maiden or full name"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Father's Full Name</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0917-123-4567"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-tabular"
                />
              </div>
            </div>
          </div>

          {/* Birth & Medical Info */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              4. Birth & Health Center Clinical Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Birth Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.2"
                  value={formData.birthWeightKg}
                  onChange={(e) => setFormData({ ...formData, birthWeightKg: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-tabular"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Place of Delivery</label>
                <input
                  type="text"
                  placeholder="e.g. City Hospital / Lying-in"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Blood Type</label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Remarks / Special Notes</label>
              <textarea
                rows={2}
                placeholder="Allergies, maternal history, or health conditions..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* BHW Draft notice */}
          {currentUser?.role === 'bhw' && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">BHW Draft Registration Mode:</strong>
                <span className="text-[11px]">
                  As a Barangay Health Worker, new registrations are stored as <strong>Drafts</strong> until verified and officially certified by a Public Health Nurse or Doctor.
                </span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <span className="text-slate-500 text-[11px]">
              Assigned ID format: <strong>BRGY-2026-XXXX</strong> · Mode: <strong>{currentUser?.role === 'bhw' ? 'Draft' : 'Official Verified'}</strong>
            </span>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!(duplicateWarning && !allowDuplicateBypass)}
                className={`px-4 py-2 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors text-xs flex items-center gap-1.5 ${
                  currentUser?.role === 'bhw'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {currentUser?.role === 'bhw'
                    ? 'Save as Draft (Queue for Nurse Review)'
                    : 'Register & Certify Patient Record'}
                </span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
