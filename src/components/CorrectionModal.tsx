import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VaccinationRecord, VaccineRoute } from '../types';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: VaccinationRecord | null;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { correctVaccinationRecord, currentUser } = useApp();

  const [dateAdministered, setDateAdministered] = useState(record?.dateAdministered || '');
  const [batchLotNumber, setBatchLotNumber] = useState(record?.batchLotNumber || '');
  const [route, setRoute] = useState<VaccineRoute>(record?.route || 'Intramuscular');
  const [vaccinatorName, setVaccinatorName] = useState(record?.vaccinatorName || '');
  const [remarks, setRemarks] = useState(record?.remarks || '');
  const [reason, setReason] = useState('');

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    correctVaccinationRecord(
      record.id,
      {
        dateAdministered,
        batchLotNumber: batchLotNumber.trim(),
        route,
        vaccinatorName: vaccinatorName.trim(),
        remarks: remarks.trim(),
      },
      reason.trim()
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Audited Vaccination Record Correction</h3>
              <p className="text-xs text-amber-800 font-medium">
                Record #{record.id} · {record.vaccineName}
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

        {/* Notice */}
        <div className="px-5 pt-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Immutable Audit Trail Requirement</span>
            </p>
            <p>
              In accordance with barangay health clinical standards, previous data values will be retained permanently in the audit history alongside your user identity (<strong className="text-slate-800">{currentUser?.fullName}</strong>) and mandatory correction justification.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Date Administered</label>
              <input
                type="date"
                required
                value={dateAdministered}
                onChange={(e) => setDateAdministered(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white font-tabular"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Original: {record.dateAdministered}</span>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Batch / Lot Number</label>
              <input
                type="text"
                required
                value={batchLotNumber}
                onChange={(e) => setBatchLotNumber(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white font-tabular"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Original: {record.batchLotNumber}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Route</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as VaccineRoute)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="Intramuscular">Intramuscular</option>
                <option value="Oral">Oral</option>
                <option value="Subcutaneous">Subcutaneous</option>
                <option value="Intradermal">Intradermal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Vaccinator Name</label>
              <input
                type="text"
                required
                value={vaccinatorName}
                onChange={(e) => setVaccinatorName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          {/* Mandatory Reason */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-slate-900 mb-1 font-bold">
              Mandatory Justification / Reason for Correction *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Typographical error on lot number confirmed with physical vaccine logbook..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 bg-white"
            />
          </div>

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
              disabled={!reason.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              Confirm Audited Correction
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
