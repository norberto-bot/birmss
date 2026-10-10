import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  Syringe, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Printer, 
  Edit3, 
  History, 
  PlusCircle, 
  FileText,
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  Check,
  MessageSquare,
  XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  evaluatePatientSummary, 
  getPatientVaccineStatuses, 
  formatDateHuman, 
  calculateAge 
} from '../utils/immunizationUtils';
import { Patient, VaccinationRecord } from '../types';

interface PatientDetailViewProps {
  patientId: string;
  onBack: () => void;
  onOpenRecordVaccine: (defaultVaccineCode?: string) => void;
  onOpenFollowUp: (patientId: string) => void;
  onOpenCorrection: (record: VaccinationRecord) => void;
  onPrintCard: (patientId: string) => void;
  onOpenSMS?: () => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patientId,
  onBack,
  onOpenRecordVaccine,
  onOpenFollowUp,
  onOpenCorrection,
  onPrintCard,
  onOpenSMS,
}) => {
  const { 
    patients, 
    vaccinationRecords, 
    followUps, 
    currentUser, 
    updatePatient, 
    verifyPatient,
    verifyVaccineRecord,
    rejectVaccineRecord,
    setActiveTab: setGlobalActiveTab,
    setSelectedPatientId,
    settings,
    language 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'schedule' | 'history' | 'followups' | 'audit'>('schedule');
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});

  const patient = patients.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3">
        <p className="text-sm font-semibold text-slate-800">Patient not found</p>
        <button
          onClick={onBack}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg"
        >
          Return to Patient List
        </button>
      </div>
    );
  }

  const patientRecords = vaccinationRecords.filter((r) => r.patientId === patient.id);
  const patientFollowUps = followUps.filter((f) => f.patientId === patient.id);
  const vaccineStatuses = getPatientVaccineStatuses(patient, vaccinationRecords);
  const summary = evaluatePatientSummary(patient, vaccinationRecords);
  const age = calculateAge(patient.dateOfBirth);

  const handleStartEdit = () => {
    setEditFormData({
      address: patient.address,
      purokSitio: patient.purokSitio,
      contactNumber: patient.contactNumber,
      motherName: patient.motherName,
      fatherName: patient.fatherName,
      remarks: patient.remarks || '',
    });
    setIsEditingDemographics(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatient(patient.id, editFormData);
    setIsEditingDemographics(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registry</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* One-Click SMS Reminder Button */}
          {onOpenSMS && (
            <button
              onClick={onOpenSMS}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs transition-colors"
              title="Send 1-Click SMS reminder to registered phone"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Send SMS Reminder</span>
            </button>
          )}

          {/* Print official card button */}
          <button
            onClick={() => onPrintCard(patient.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Immunization Card</span>
          </button>

          {/* Follow-up button */}
          <button
            onClick={() => onOpenFollowUp(patient.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Log BHW Follow-Up</span>
          </button>

          {/* Record vaccine button: BHW saves as Draft, Nurse/Admin records officially */}
          <button
            onClick={() => onOpenRecordVaccine()}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
              currentUser?.role === 'bhw'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>
              {currentUser?.role === 'bhw' ? 'Encode Vaccine Draft' : 'Record Administered Vaccine'}
            </span>
          </button>
        </div>
      </div>

      {/* Role-Based Draft / Rejected Quality Banner */}
      {patient.verificationStatus === 'rejected' && (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border-2 border-rose-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-xs text-rose-900 flex items-center gap-2">
                <span>Patient Registration Returned for BHW Revision</span>
                {patient.rejectedAt && <span className="font-normal text-[11px] text-rose-700">({patient.rejectedAt})</span>}
              </div>
              <p className="text-xs text-rose-950 font-medium">
                Clinical Justification / Remarks: "{patient.rejectionReason || 'Discrepancy noted by clinical supervisor. Please review and modify.'}"
              </p>
              {patient.rejectedBy && (
                <div className="text-[11px] text-rose-700">Returned by: <strong>{patient.rejectedBy}</strong></div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedPatientId(null);
              setGlobalActiveTab('approvals');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Go to Drafts Queue to Redo</span>
          </button>
        </div>
      )}

      {patient.verificationStatus === 'draft' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs text-amber-900">
                Draft Patient Record (Awaiting Clinical Certification)
              </div>
              <p className="text-xs text-amber-800">
                This record was encoded as a draft by a Barangay Health Worker. A Registered Nurse or Doctor must review and certify it to become an official government health record.
              </p>
            </div>
          </div>

          {currentUser?.role !== 'bhw' && (
            <button
              onClick={() => verifyPatient(patient.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs shrink-0 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Verify & Approve Patient Record</span>
            </button>
          )}
        </div>
      )}

      {/* Patient Health Profile Card Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {patient.id}
              </span>
              {patient.verificationStatus === 'draft' ? (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Draft Record
                </span>
              ) : patient.verificationStatus === 'rejected' ? (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3 text-rose-600" />
                  <span>Returned for Redo</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Official Record</span>
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                patient.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
              }`}>
                {patient.gender}
              </span>
              <span className="text-xs text-slate-500">
                Registered: <strong className="font-tabular text-slate-700">{formatDateHuman(patient.registrationDate)}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {patient.lastName}, {patient.firstName} {patient.middleName} {patient.suffix}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <div>
                Date of Birth: <strong className="font-tabular text-slate-800">{formatDateHuman(patient.dateOfBirth)}</strong>
              </div>
              <span>·</span>
              <div>
                Current Age: <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{age.formatted}</strong>
              </div>
              {patient.bloodType && (
                <>
                  <span>·</span>
                  <div>Blood Type: <strong className="text-slate-800">{patient.bloodType}</strong></div>
                </>
              )}
              {patient.birthWeightKg && (
                <>
                  <span>·</span>
                  <div>Birth Weight: <strong className="text-slate-800">{patient.birthWeightKg} kg</strong></div>
                </>
              )}
            </div>
          </div>

          {/* Status Indicator Box (Matches research PDF color logic) */}
          <div className="flex flex-col sm:items-end justify-center shrink-0">
            {summary.missedCount > 0 ? (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-left sm:text-right space-y-0.5">
                <div className="text-xs font-bold text-red-700 flex items-center sm:justify-end gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  <span>🔴 MISSED / OVERDUE DOSES</span>
                </div>
                <div className="text-xs text-red-600 font-medium">
                  {summary.missedCount} overdue immunization{summary.missedCount > 1 ? 's' : ''} require catch-up
                </div>
              </div>
            ) : summary.isFullyImmunized ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-left sm:text-right space-y-0.5">
                <div className="text-xs font-bold text-emerald-800 flex items-center sm:justify-end gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>🟢 FULLY IMMUNIZED CHILD (FIC)</span>
                </div>
                <div className="text-xs text-emerald-700 font-medium">
                  All routine infant EPI vaccines completed successfully
                </div>
              </div>
            ) : summary.upcomingCount > 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-left sm:text-right space-y-0.5">
                <div className="text-xs font-bold text-amber-800 flex items-center sm:justify-end gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>🟡 UPCOMING VACCINATION DUE</span>
                </div>
                <div className="text-xs text-amber-700 font-medium">
                  {summary.nextExpectedVaccine?.name} due {formatDateHuman(summary.nextExpectedVaccine?.dueDate)}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left sm:text-right space-y-0.5">
                <div className="text-xs font-bold text-slate-700">
                  ON SCHEDULE
                </div>
                <div className="text-xs text-slate-500">
                  {summary.completedCount} of {summary.totalScheduled} doses administered
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Demographics & Parent Details */}
        {!isEditingDemographics ? (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-600 block text-xs">Purok / Sitio:</span>
              <span className="font-semibold text-slate-800">{patient.purokSitio}</span>
            </div>
            <div>
              <span className="text-slate-600 block text-xs">Home Address:</span>
              <span className="font-medium text-slate-800 truncate block">{patient.address}</span>
            </div>
            <div>
              <span className="text-slate-600 block text-xs">Mother's Full Name:</span>
              <span className="font-medium text-slate-800">{patient.motherName}</span>
              {patient.fatherName && (
                <div className="text-slate-600 text-xs mt-0.5">Father: {patient.fatherName}</div>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-600 block text-xs">Guardian Contact:</span>
                <span className="font-tabular font-semibold text-slate-800">{patient.contactNumber}</span>
              </div>
              <button
                onClick={handleStartEdit}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ) : (
          /* Inline Demographics Edit Form */
          <form onSubmit={handleSaveEdit} className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg space-y-3">
            <div className="font-semibold text-xs text-slate-800">Edit Demographic & Contact Information</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Purok / Sitio</label>
                <select
                  value={editFormData.purokSitio}
                  onChange={(e) => setEditFormData({ ...editFormData, purokSitio: e.target.value })}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                >
                  {settings.puroks.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Home Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={editFormData.contactNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Mother's Name</label>
                <input
                  type="text"
                  value={editFormData.motherName}
                  onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Father's Name</label>
                <input
                  type="text"
                  value={editFormData.fatherName}
                  onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Remarks</label>
                <input
                  type="text"
                  value={editFormData.remarks}
                  onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingDemographics(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
              >
                Save Updates
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tabs: Standard Schedule vs Administered Records vs BHW Follow-up Logs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="flex items-center gap-1 p-1 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expanded Immunization Schedule (EPI)
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Administered Records ({patientRecords.length})
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'followups'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            BHW Follow-Up History ({patientFollowUps.length})
          </button>
        </div>

        {/* Tab 1: Comprehensive EPI Immunization Schedule with 🔴 Missed, 🟡 Upcoming, 🟢 Done Status */}
        {activeTab === 'schedule' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Vaccine & Dose</th>
                  <th scope="col" className="px-4 py-3">Target Age Schedule</th>
                  <th scope="col" className="px-4 py-3">Route & Site</th>
                  <th scope="col" className="px-4 py-3">Expected Due Date</th>
                  <th scope="col" className="px-4 py-3 text-center">Monitoring Status</th>
                  <th scope="col" className="px-4 py-3">Administration Record</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {vaccineStatuses.map((item) => {
                  const isDone = !!item.record;
                  return (
                    <tr 
                      key={item.vaccine.code}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        item.status === 'missed' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Vaccine name */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {item.vaccine.name}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Dose {item.vaccine.doseNumber} of {item.vaccine.totalDoses}
                          {item.vaccine.isBooster && ' (Booster)'}
                        </div>
                      </td>

                      {/* Target age */}
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.vaccine.targetAgeDescription}
                      </td>

                      {/* Route */}
                      <td className="px-4 py-3">
                        <div className="text-slate-800">{item.vaccine.route}</div>
                        <div className="text-[11px] text-slate-600">{item.vaccine.defaultSite}</div>
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3 font-tabular text-slate-800">
                        {formatDateHuman(item.dueDate)}
                      </td>

                      {/* Status indicator (Matches PDF color requirements) */}
                      <td className="px-4 py-3 text-center">
                        {item.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            🟢 Completed
                          </span>
                        ) : item.status === 'booster_completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                            🟢 Booster Given
                          </span>
                        ) : item.status === 'missed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                            🔴 Missed / Overdue
                          </span>
                        ) : item.status === 'due' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                            🟡 Due Now
                          </span>
                        ) : item.status === 'upcoming' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                            🟡 Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            Scheduled
                          </span>
                        )}
                      </td>

                      {/* Administration details if given */}
                      <td className="px-4 py-3">
                        {item.record ? (
                          <div className="space-y-0.5 text-xs">
                            <div className="font-semibold text-slate-900 font-tabular">
                              Given: {formatDateHuman(item.record.dateAdministered)}
                            </div>
                            <div className="text-slate-600 text-xs">
                              Lot: <span className="font-tabular font-medium">{item.record.batchLotNumber}</span>
                            </div>
                            <div className="text-slate-600 text-xs truncate max-w-[140px]">
                              By: {item.record.vaccinatorName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic text-xs">Not yet administered</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        {isDone ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {item.record?.verificationStatus === 'draft' ? (
                              <>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Draft
                                </span>
                                {currentUser?.role !== 'bhw' && (
                                  <button
                                    onClick={() => verifyVaccineRecord(item.record!.id)}
                                    className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded flex items-center gap-0.5"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Verify</span>
                                  </button>
                                )}
                              </>
                            ) : item.record?.verificationStatus === 'rejected' ? (
                              <div className="flex items-center gap-1">
                                <span 
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300"
                                  title={item.record.rejectionReason}
                                >
                                  Returned
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedPatientId(null);
                                    setGlobalActiveTab('approvals');
                                  }}
                                  className="px-2 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded flex items-center gap-0.5 transition-colors"
                                  title="View remarks and redo draft"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Redo</span>
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Verified
                              </span>
                            )}
                            <button
                              onClick={() => onOpenCorrection(item.record!)}
                              className="px-2 py-1 text-xs text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                              title="Audit correction"
                            >
                              Edit / Correct
                            </button>
                          </div>
                        ) : currentUser?.role !== 'bhw' ? (
                          <button
                            onClick={() => onOpenRecordVaccine(item.vaccine.code)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs"
                          >
                            Administer
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenRecordVaccine(item.vaccine.code)}
                              className="px-2 py-1 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 rounded font-semibold border border-amber-300 shadow-xs"
                            >
                              Encode Draft
                            </button>
                            <button
                              onClick={() => onOpenFollowUp(patient.id)}
                              className="px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 rounded font-medium border border-emerald-200"
                            >
                              Follow Up
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Administered Records Table with Full Details & Audit Corrections */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto p-1">
            {patientRecords.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Vaccine</th>
                    <th scope="col" className="px-4 py-3">Dose & Route</th>
                    <th scope="col" className="px-4 py-3">Date Administered</th>
                    <th scope="col" className="px-4 py-3">Batch / Lot #</th>
                    <th scope="col" className="px-4 py-3">Vaccinator</th>
                    <th scope="col" className="px-4 py-3">Certification</th>
                    <th scope="col" className="px-4 py-3">Remarks</th>
                    <th scope="col" className="px-4 py-3 text-right">Audit & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {patientRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{r.vaccineName}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">Dose {r.doseNumber}</span> · {r.route}
                      </td>
                      <td className="px-4 py-3 font-tabular text-slate-800">
                        {formatDateHuman(r.dateAdministered)}
                      </td>
                      <td className="px-4 py-3 font-tabular font-medium text-slate-700">
                        {r.batchLotNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-medium">{r.vaccinatorName}</div>
                        <div className="text-slate-600 text-xs">{r.vaccinatorRole}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.verificationStatus === 'draft' ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 block w-fit">
                              Draft
                            </span>
                            {currentUser?.role !== 'bhw' && (
                              <button
                                onClick={() => verifyVaccineRecord(r.id)}
                                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify Dose</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Verified Official
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {r.remarks || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.corrections && r.corrections.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-800 font-medium">
                            {r.corrections.length} correction(s)
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenCorrection(r)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Correct Record
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No vaccination records administered yet for this patient.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: BHW Follow-Up History */}
        {activeTab === 'followups' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Follow-up Activity Logs ({patientFollowUps.length})
              </h4>
              <button
                onClick={() => onOpenFollowUp(patient.id)}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              >
                + New Follow-Up Log
              </button>
            </div>

            {patientFollowUps.length > 0 ? (
              <div className="space-y-3">
                {patientFollowUps.map((fol) => (
                  <div key={fol.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                          {fol.contactMethod}
                        </span>
                        <span className="font-semibold text-slate-800">{fol.followUpResult}</span>
                      </div>
                      <span className="text-slate-500 font-tabular">
                        Date: {formatDateHuman(fol.followUpDate)}
                      </span>
                    </div>

                    <p className="text-slate-700 bg-white p-2 rounded border border-slate-100">
                      "{fol.remarks}"
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Assigned BHW: <strong className="text-slate-700">{fol.assignedBHW}</strong></span>
                      {fol.nextFollowUpDate && (
                        <span>Next Target: <strong className="font-tabular text-blue-700">{formatDateHuman(fol.nextFollowUpDate)}</strong></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No follow-ups recorded yet. Click "+ New Follow-Up Log" to record a home visit or phone call.
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
