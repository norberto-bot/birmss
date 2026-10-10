import React, { useState, useEffect } from 'react';
import { 
  X, 
  Syringe, 
  Calendar, 
  User, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  HeartPulse 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VACCINE_SCHEDULE } from '../data/initialData';
import { formatDateISO } from '../utils/immunizationUtils';
import { VaccineRoute } from '../types';
import { SmartRemarksSelector } from './SmartRemarksSelector';

interface RecordVaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: string;
  defaultVaccineCode?: string;
}

export const RecordVaccineModal: React.FC<RecordVaccineModalProps> = ({
  isOpen,
  onClose,
  preselectedPatientId,
  defaultVaccineCode,
}) => {
  const { 
    patients, 
    vaccinationRecords, 
    addVaccinationRecord, 
    currentUser, 
    settings,
    language 
  } = useApp();

  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || (patients[0]?.id || ''));
  const [selectedVaccineCode, setSelectedVaccineCode] = useState(defaultVaccineCode || VACCINE_SCHEDULE[0].code);
  const [dateAdministered, setDateAdministered] = useState(formatDateISO(new Date()));
  const [batchLotNumber, setBatchLotNumber] = useState('');
  const [route, setRoute] = useState<VaccineRoute>('Intramuscular');
  const [vaccinatorName, setVaccinatorName] = useState(currentUser?.fullName || settings.headNurse);
  const [vaccinatorRole, setVaccinatorRole] = useState(currentUser?.title || 'Public Health Nurse / Vaccinator');
  const [nextScheduledDate, setNextScheduledDate] = useState('');
  
  // Smart remarks selection
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [customRemarks, setCustomRemarks] = useState('');

  // Update vaccine details when selected code changes
  useEffect(() => {
    const vDef = VACCINE_SCHEDULE.find((v) => v.code === selectedVaccineCode);
    if (vDef) {
      setRoute(vDef.route);
      
      // Auto-suggest mock batch number based on antigen
      setBatchLotNumber(`${vDef.code}-26-${Math.floor(100 + Math.random() * 900)}`);

      // Auto-suggest next vaccination date (typically +28 or +75 days or +180 days for Vit A)
      const d = new Date(dateAdministered);
      if (vDef.code === 'PENTA1' || vDef.code === 'PENTA2' || vDef.code === 'OPV1' || vDef.code === 'OPV2') {
        d.setDate(d.getDate() + 28);
        setNextScheduledDate(formatDateISO(d));
      } else if (vDef.code === 'PENTA3') {
        d.setMonth(d.getMonth() + 5);
        setNextScheduledDate(formatDateISO(d));
      } else if (vDef.isSupplement) {
        // Vitamin A is given every 4-6 months (approx 180 days)
        d.setMonth(d.getMonth() + 6);
        setNextScheduledDate(formatDateISO(d));
      } else {
        setNextScheduledDate('');
      }
    }
  }, [selectedVaccineCode, dateAdministered]);

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  useEffect(() => {
    if (defaultVaccineCode) {
      setSelectedVaccineCode(defaultVaccineCode);
    }
  }, [defaultVaccineCode]);

  if (!isOpen) return null;

  const currentPatient = patients.find((p) => p.id === selectedPatientId);
  const currentVaccine = VACCINE_SCHEDULE.find((v) => v.code === selectedVaccineCode);
  const isBHW = currentUser?.role === 'bhw';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVaccine || !currentPatient) return;

    const combinedRemarks = [...selectedNotes, customRemarks.trim()].filter(Boolean).join('; ');

    addVaccinationRecord({
      patientId: selectedPatientId,
      vaccineCode: currentVaccine.code,
      vaccineName: currentVaccine.name,
      doseNumber: currentVaccine.doseNumber,
      route,
      dateAdministered,
      nextScheduledDate: nextScheduledDate || undefined,
      vaccinatorName,
      vaccinatorRole,
      batchLotNumber: batchLotNumber.trim(),
      healthFacility: settings.healthCenterName,
      remarks: combinedRemarks || undefined,
      specialNotes: selectedNotes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Administered Vaccination</h3>
              <p className="text-xs text-slate-500">
                Official health center immunization administration entry
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Patient Selection */}
          <div>
            <label className="block text-slate-600 mb-1 font-medium">Select Recipient Patient *</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-semibold text-slate-900"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lastName}, {p.firstName} {p.middleName} ({p.id}) · {p.purokSitio}
                </option>
              ))}
            </select>
            {currentPatient && (
              <span className="text-[11px] text-slate-500 block mt-1">
                Mother: {currentPatient.motherName} · DOB: {currentPatient.dateOfBirth}
              </span>
            )}
          </div>

          {/* Vaccine Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Vaccine Antigen *</label>
              <select
                value={selectedVaccineCode}
                onChange={(e) => setSelectedVaccineCode(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-semibold text-slate-900"
              >
                {VACCINE_SCHEDULE.map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.name} (Dose {v.doseNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Route of Administration *</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as VaccineRoute)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Intramuscular">Intramuscular (IM)</option>
                <option value="Oral">Oral (Drops)</option>
                <option value="Subcutaneous">Subcutaneous (SC)</option>
                <option value="Intradermal">Intradermal (ID)</option>
              </select>
            </div>
          </div>

          {/* Dates & Lot Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Date Administered *</label>
              <input
                type="date"
                required
                max={formatDateISO(new Date())}
                value={dateAdministered}
                onChange={(e) => setDateAdministered(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-tabular"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Batch / Lot Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. PNT-26-881"
                value={batchLotNumber}
                onChange={(e) => setBatchLotNumber(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-tabular font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Next Due Date (If any)</label>
              <input
                type="date"
                value={nextScheduledDate}
                onChange={(e) => setNextScheduledDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-tabular"
              />
            </div>
          </div>

          {/* Vaccinator & Health Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Vaccinator Full Name *</label>
              <input
                type="text"
                required
                value={vaccinatorName}
                onChange={(e) => setVaccinatorName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Vaccinator Role / Title</label>
              <input
                type="text"
                value={vaccinatorRole}
                onChange={(e) => setVaccinatorRole(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* DOH Vitamin A Supplementation Protocol Banner */}
          {currentVaccine?.isSupplement && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <HeartPulse className="w-4 h-4 text-amber-600" />
                <span>DOH Micronutrient Supplementation: Vitamin A</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                • <strong>6–11 months:</strong> 100,000 IU (Blue Capsule, 1 dose)<br />
                • <strong>12–59 months:</strong> 200,000 IU (Red Capsule, every 4–6 months)<br />
                • <strong>Route:</strong> Oral oil-based drops squeezed directly onto child's tongue.
              </p>
            </div>
          )}

          {/* BHW Role-Based Draft Indicator */}
          {isBHW && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">BHW Draft Encoding Mode:</strong>
                <span className="text-[11px]">
                  As a Barangay Health Worker, this administration is saved with <strong>Draft status</strong>. A Registered Nurse or Doctor will review and verify it into an official government record.
                </span>
              </div>
            </div>
          )}

          {/* Smart Remarks Selector (Replaces free-text remarks with pre-defined chips + optional text) */}
          <SmartRemarksSelector
            selectedNotes={selectedNotes}
            onChangeNotes={setSelectedNotes}
            customText={customRemarks}
            onChangeCustomText={setCustomRemarks}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <span className="text-slate-500 text-[11px]">
              Encoder: <strong className="text-slate-700">{currentUser?.fullName}</strong> ({currentUser?.role?.toUpperCase()})
            </span>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 font-semibold text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 text-xs ${
                  isBHW ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>
                  {isBHW ? 'Save as Draft (Awaiting Nurse Verification)' : 'Save & Certify Official Record'}
                </span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
