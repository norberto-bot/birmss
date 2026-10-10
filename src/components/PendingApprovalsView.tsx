import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  AlertOctagon,
  UserCheck, 
  Syringe, 
  Clock, 
  ShieldAlert,
  Search,
  Eye,
  Check,
  RotateCcw,
  Edit3,
  X,
  Filter,
  User,
  Calendar,
  MapPin,
  Phone,
  FileText,
  Send,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateHuman } from '../utils/immunizationUtils';
import { Patient, VaccinationRecord, VaccineRoute } from '../types';

export const PendingApprovalsView: React.FC<{
  onSelectPatient: (patientId: string) => void;
}> = ({ onSelectPatient }) => {
  const { 
    patients, 
    vaccinationRecords, 
    verifyPatient, 
    rejectPatient,
    verifyVaccineRecord, 
    rejectVaccineRecord, 
    resubmitVaccineDraft,
    resubmitPatientDraft,
    settings,
    currentUser,
    language 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'vaccines' | 'patients' | 'rejected'>('vaccines');
  const [vaccineStatusFilter, setVaccineStatusFilter] = useState<'all' | 'pending' | 'rejected'>('all');
  const [patientStatusFilter, setPatientStatusFilter] = useState<'all' | 'pending' | 'rejected'>('all');
  const [rejectedFilter, setRejectedFilter] = useState<'all' | 'vaccines' | 'patients'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rejection modals state for Nurse/Admin
  const [rejectVaccineRecordId, setRejectVaccineRecordId] = useState<string | null>(null);
  const [rejectVaccineReason, setRejectVaccineReason] = useState('');

  const [rejectPatientId, setRejectPatientId] = useState<string | null>(null);
  const [rejectPatientReason, setRejectPatientReason] = useState('');

  // Modify & Resubmit Modal state for BHW
  const [redoVaccineRecord, setRedoVaccineRecord] = useState<VaccinationRecord | null>(null);
  const [vaccineFormDate, setVaccineFormDate] = useState('');
  const [vaccineFormRoute, setVaccineFormRoute] = useState<VaccineRoute>('Intramuscular');
  const [vaccineFormBatch, setVaccineFormBatch] = useState('');
  const [vaccineFormRemarks, setVaccineFormRemarks] = useState('');
  const [vaccineFormFacility, setVaccineFormFacility] = useState('');
  const [vaccineResolutionNotes, setVaccineResolutionNotes] = useState('');

  const [redoPatient, setRedoPatient] = useState<Patient | null>(null);
  const [patientFormFirst, setPatientFormFirst] = useState('');
  const [patientFormMiddle, setPatientFormMiddle] = useState('');
  const [patientFormLast, setPatientFormLast] = useState('');
  const [patientFormSuffix, setPatientFormSuffix] = useState('');
  const [patientFormDob, setPatientFormDob] = useState('');
  const [patientFormGender, setPatientFormGender] = useState<'Male' | 'Female'>('Male');
  const [patientFormMother, setPatientFormMother] = useState('');
  const [patientFormFather, setPatientFormFather] = useState('');
  const [patientFormContact, setPatientFormContact] = useState('');
  const [patientFormAddress, setPatientFormAddress] = useState('');
  const [patientFormPurok, setPatientFormPurok] = useState('');
  const [patientFormBirthWeight, setPatientFormBirthWeight] = useState<string>('');
  const [patientFormBirthPlace, setPatientFormBirthPlace] = useState('');
  const [patientFormBloodType, setPatientFormBloodType] = useState('');
  const [patientFormRemarks, setPatientFormRemarks] = useState('');
  const [patientResolutionNotes, setPatientResolutionNotes] = useState('');

  // Draft lists
  const draftPatients = patients.filter((p) => p.verificationStatus === 'draft');
  const draftVaccines = vaccinationRecords.filter((r) => r.verificationStatus === 'draft');

  // Rejected lists (for revision by BHW)
  const rejectedPatients = patients.filter((p) => p.verificationStatus === 'rejected');
  const rejectedVaccines = vaccinationRecords.filter((r) => r.verificationStatus === 'rejected');
  const totalRejectedCount = rejectedPatients.length + rejectedVaccines.length;

  const isNurseOrAdmin = currentUser?.role === 'nurse' || currentUser?.role === 'admin' || currentUser?.role === 'doctor';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Nurse confirms rejection of vaccine draft
  const handleConfirmRejectVaccine = () => {
    if (rejectVaccineRecordId && rejectVaccineReason.trim()) {
      rejectVaccineRecord(rejectVaccineRecordId, rejectVaccineReason.trim());
      setRejectVaccineRecordId(null);
      setRejectVaccineReason('');
      showToast('Vaccine draft returned with admin rejection remarks.');
    }
  };

  // Nurse confirms rejection of patient registration draft
  const handleConfirmRejectPatient = () => {
    if (rejectPatientId && rejectPatientReason.trim()) {
      rejectPatient(rejectPatientId, rejectPatientReason.trim());
      setRejectPatientId(null);
      setRejectPatientReason('');
      showToast('Patient registration draft returned with admin rejection remarks.');
    }
  };

  // Open Resubmit Vaccine Modal with pre-filled values
  const handleOpenResubmitVaccine = (record: VaccinationRecord) => {
    setRedoVaccineRecord(record);
    setVaccineFormDate(record.dateAdministered);
    setVaccineFormRoute(record.route);
    setVaccineFormBatch(record.batchLotNumber);
    setVaccineFormRemarks(record.remarks || '');
    setVaccineFormFacility(record.healthFacility || settings.healthCenterName);
    setVaccineResolutionNotes('');
  };

  // BHW saves and resubmits corrected vaccine draft
  const handleSaveResubmitVaccine = () => {
    if (!redoVaccineRecord) return;
    const updates: Partial<VaccinationRecord> = {
      dateAdministered: vaccineFormDate,
      route: vaccineFormRoute,
      batchLotNumber: vaccineFormBatch.trim(),
      healthFacility: vaccineFormFacility.trim(),
      remarks: vaccineFormRemarks.trim(),
    };

    resubmitVaccineDraft(redoVaccineRecord.id, updates, vaccineResolutionNotes.trim());
    setRedoVaccineRecord(null);
    setActiveTab('vaccines');
    setVaccineStatusFilter('pending');
    showToast(`Corrected vaccine record for ${redoVaccineRecord.vaccineName} has been resubmitted for admin verification.`);
  };

  // Open Resubmit Patient Modal with pre-filled values
  const handleOpenResubmitPatient = (patient: Patient) => {
    setRedoPatient(patient);
    setPatientFormFirst(patient.firstName);
    setPatientFormMiddle(patient.middleName);
    setPatientFormLast(patient.lastName);
    setPatientFormSuffix(patient.suffix || '');
    setPatientFormDob(patient.dateOfBirth);
    setPatientFormGender(patient.gender);
    setPatientFormMother(patient.motherName);
    setPatientFormFather(patient.fatherName);
    setPatientFormContact(patient.contactNumber);
    setPatientFormAddress(patient.address);
    setPatientFormPurok(patient.purokSitio);
    setPatientFormBirthWeight(patient.birthWeightKg !== undefined ? String(patient.birthWeightKg) : '');
    setPatientFormBirthPlace(patient.birthPlace || '');
    setPatientFormBloodType(patient.bloodType || '');
    setPatientFormRemarks(patient.remarks || '');
    setPatientResolutionNotes('');
  };

  // BHW saves and resubmits corrected patient draft
  const handleSaveResubmitPatient = () => {
    if (!redoPatient) return;
    const updates: Partial<Patient> = {
      firstName: patientFormFirst.trim(),
      middleName: patientFormMiddle.trim(),
      lastName: patientFormLast.trim(),
      suffix: patientFormSuffix.trim(),
      dateOfBirth: patientFormDob,
      gender: patientFormGender,
      motherName: patientFormMother.trim(),
      fatherName: patientFormFather.trim(),
      contactNumber: patientFormContact.trim(),
      address: patientFormAddress.trim(),
      purokSitio: patientFormPurok,
      birthWeightKg: patientFormBirthWeight ? parseFloat(patientFormBirthWeight) : undefined,
      birthPlace: patientFormBirthPlace.trim(),
      bloodType: patientFormBloodType.trim(),
      remarks: patientFormRemarks.trim(),
    };

    resubmitPatientDraft(redoPatient.id, updates, patientResolutionNotes.trim());
    setRedoPatient(null);
    setActiveTab('patients');
    setPatientStatusFilter('pending');
    showToast(`Corrected patient registration for ${redoPatient.firstName} ${redoPatient.lastName} has been resubmitted for admin verification.`);
  };

  // Vaccine submissions to display based on status filter
  const displayedVaccines = vaccinationRecords.filter((r) => {
    if (vaccineStatusFilter === 'pending') return r.verificationStatus === 'draft';
    if (vaccineStatusFilter === 'rejected') return r.verificationStatus === 'rejected';
    return r.verificationStatus === 'draft' || r.verificationStatus === 'rejected';
  }).filter((rec) => {
    if (!searchTerm) return true;
    const pt = patients.find((p) => p.id === rec.patientId);
    const q = searchTerm.toLowerCase();
    return (
      rec.vaccineName.toLowerCase().includes(q) ||
      rec.batchLotNumber.toLowerCase().includes(q) ||
      (rec.rejectionReason && rec.rejectionReason.toLowerCase().includes(q)) ||
      (pt && `${pt.firstName} ${pt.lastName}`.toLowerCase().includes(q))
    );
  });

  // Patient submissions to display based on status filter
  const displayedPatients = patients.filter((p) => {
    if (patientStatusFilter === 'pending') return p.verificationStatus === 'draft';
    if (patientStatusFilter === 'rejected') return p.verificationStatus === 'rejected';
    return p.verificationStatus === 'draft' || p.verificationStatus === 'rejected';
  }).filter((pt) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      `${pt.firstName} ${pt.lastName}`.toLowerCase().includes(q) ||
      pt.motherName.toLowerCase().includes(q) ||
      pt.purokSitio.toLowerCase().includes(q) ||
      (pt.rejectionReason && pt.rejectionReason.toLowerCase().includes(q))
    );
  });

  // Filtered rejected items for search in Tab 3
  const filteredRejectedVaccines = rejectedVaccines.filter((rec) => {
    const pt = patients.find((p) => p.id === rec.patientId);
    const q = searchTerm.toLowerCase();
    return (
      rec.vaccineName.toLowerCase().includes(q) ||
      rec.batchLotNumber.toLowerCase().includes(q) ||
      (rec.rejectionReason && rec.rejectionReason.toLowerCase().includes(q)) ||
      (pt && `${pt.firstName} ${pt.lastName}`.toLowerCase().includes(q))
    );
  });

  const filteredRejectedPatients = rejectedPatients.filter((pt) => {
    const q = searchTerm.toLowerCase();
    return (
      `${pt.firstName} ${pt.lastName}`.toLowerCase().includes(q) ||
      pt.motherName.toLowerCase().includes(q) ||
      pt.purokSitio.toLowerCase().includes(q) ||
      (pt.rejectionReason && pt.rejectionReason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {language === 'fil' 
              ? 'Pagsusuri, Pag-apruba at Pagwawasto ng mga Tala (Drafts)' 
              : 'Nurse Clinical Verification & Draft Revision Queue'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Quality Control: Authorizes Registered Nurses and Administrators to validate BHW submissions. BHWs can view rejection remarks, edit discrepancies, and resubmit.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{draftPatients.length + draftVaccines.length} Pending Approval</span>
          </span>

          {totalRejectedCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-700 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{totalRejectedCount} Submissions Rejected</span>
            </span>
          )}
        </div>
      </div>

      {/* Prominent BHW Warning Banner if there are rejected drafts requiring revision */}
      {totalRejectedCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-300 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-700 font-bold mt-0.5">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <span>Action Required: Submissions Returned with Admin Rejection Remarks</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-200 text-rose-800">
                  {totalRejectedCount} Rejected
                </span>
              </h2>
              <p className="text-xs text-slate-700 mt-0.5">
                The supervising Admin or Nurse reviewed your submissions and provided clinical rejection remarks. Review their remarks below, make corrections, and click <strong>'Resubmit'</strong> to re-send.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('rejected')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>View All Rejection Remarks ({totalRejectedCount})</span>
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('vaccines')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'vaccines'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Syringe className="w-3.5 h-3.5" />
          <span>Vaccination Submissions ({draftVaccines.length + rejectedVaccines.length})</span>
          {rejectedVaccines.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700">
              {rejectedVaccines.length} Rejected
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'patients'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Patient Registration Submissions ({draftPatients.length + rejectedPatients.length})</span>
          {rejectedPatients.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700">
              {rejectedPatients.length} Rejected
            </span>
          )}
        </button>

        {/* Tab 3: DEDICATED REJECTED SECTION FOR BHW / CLINICAL STAFF */}
        <button
          onClick={() => setActiveTab('rejected')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rejected'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-rose-700'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>
            Rejected Submissions & Remarks
          </span>
          {totalRejectedCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
              {totalRejectedCount} Action Needed
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-500">0</span>
          )}
        </button>
      </div>

      {/* Search Bar on all tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeTab === 'vaccines' && (
            <>
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Status:
              </span>
              <button
                onClick={() => setVaccineStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  vaccineStatusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({draftVaccines.length + rejectedVaccines.length})
              </button>
              <button
                onClick={() => setVaccineStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  vaccineStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending ({draftVaccines.length})
              </button>
              <button
                onClick={() => setVaccineStatusFilter('rejected')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  vaccineStatusFilter === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-rose-700 hover:bg-slate-200'
                }`}
              >
                Rejected ({rejectedVaccines.length})
              </button>
            </>
          )}

          {activeTab === 'patients' && (
            <>
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Status:
              </span>
              <button
                onClick={() => setPatientStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  patientStatusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({draftPatients.length + rejectedPatients.length})
              </button>
              <button
                onClick={() => setPatientStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  patientStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending ({draftPatients.length})
              </button>
              <button
                onClick={() => setPatientStatusFilter('rejected')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  patientStatusFilter === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-rose-700 hover:bg-slate-200'
                }`}
              >
                Rejected ({rejectedPatients.length})
              </button>
            </>
          )}

          {activeTab === 'rejected' && (
            <>
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter by:
              </span>
              <button
                onClick={() => setRejectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  rejectedFilter === 'all'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Rejected ({totalRejectedCount})
              </button>
              <button
                onClick={() => setRejectedFilter('vaccines')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  rejectedFilter === 'vaccines'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vaccines ({rejectedVaccines.length})
              </button>
              <button
                onClick={() => setRejectedFilter('patients')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  rejectedFilter === 'patients'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Patients ({rejectedPatients.length})
              </button>
            </>
          )}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search submissions, records, or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: VACCINATION SUBMISSIONS */}
      {activeTab === 'vaccines' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {displayedVaccines.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {displayedVaccines.map((record) => {
                const pt = patients.find((p) => p.id === record.patientId);
                const isRejected = record.verificationStatus === 'rejected';

                return (
                  <div 
                    key={record.id} 
                    className={`p-4 sm:p-5 transition-colors space-y-3 ${
                      isRejected ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isRejected ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Status: Rejected</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Status: Pending Nurse Review</span>
                            </span>
                          )}

                          <span className="font-bold text-sm text-slate-900">
                            {record.vaccineName} (Dose {record.doseNumber})
                          </span>
                          <span className="text-xs font-mono text-slate-500 font-bold">({record.id})</span>
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Patient: <strong className="text-slate-900">{pt ? `${pt.firstName} ${pt.lastName}` : record.patientId}</strong></span>
                          <span>·</span>
                          <span>Administered: <strong className="font-tabular text-slate-800">{formatDateHuman(record.dateAdministered)}</strong></span>
                          <span>·</span>
                          <span>Route: <strong>{record.route}</strong></span>
                          <span>·</span>
                          <span>Batch/Lot: <strong className="font-tabular text-slate-800">{record.batchLotNumber}</strong></span>
                        </div>

                        <div className="text-xs text-slate-500">
                          Encoded by: <strong className="text-slate-700">{record.vaccinatorName}</strong> ({record.vaccinatorRole}) at {record.recordedAt}
                        </div>

                        {record.remarks && (
                          <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-600">BHW Observations / Notes:</span> {record.remarks}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {pt && (
                          <button
                            onClick={() => onSelectPatient(pt.id)}
                            className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            View Child
                          </button>
                        )}

                        {/* RESUBMIT BUTTON FOR BHW */}
                        {isRejected && (
                          <button
                            onClick={() => handleOpenResubmitVaccine(record)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
                            title="Edit corrected details and re-send for verification"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Resubmit</span>
                          </button>
                        )}

                        {/* Nurse / Admin actions if pending */}
                        {!isRejected && isNurseOrAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setRejectVaccineRecordId(record.id);
                                setRejectVaccineReason('');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject with Remarks</span>
                            </button>
                            <button
                              onClick={() => {
                                verifyVaccineRecord(record.id);
                                showToast(`Verified ${record.vaccineName} for ${pt ? pt.firstName : record.patientId}.`);
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify & Certify</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* DEDICATED SECTION RENDERING REJECTION REMARKS PROVIDED BY ADMINS */}
                    {isRejected && (
                      <div className="mt-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-rose-900 border-b border-rose-200/60 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
                            </span>
                            <span>Admin / Clinical Supervisor Rejection Remarks:</span>
                          </div>
                          {record.rejectedAt && (
                            <span className="text-[11px] font-medium text-rose-700">
                              Returned: {record.rejectedAt}
                            </span>
                          )}
                        </div>

                        <div className="pl-1">
                          <p className="text-xs text-rose-950 font-semibold leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-200">
                            "{record.rejectionReason || 'No specific reason entered. Please verify dosage and lot number.'}"
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-rose-800 pl-1">
                          <div>
                            Reviewed by: <strong>{record.rejectedBy || 'Clinical Supervisor'}</strong>
                          </div>
                          <div className="text-slate-500 italic">
                            Click 'Resubmit' to update the record and re-send for approval.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500 space-y-1 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">No Vaccination Submissions Found</p>
              <p className="text-slate-500">
                {vaccineStatusFilter === 'rejected'
                  ? 'No rejected vaccine submissions in this queue.'
                  : 'All administered vaccination records have been certified or processed.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PATIENT REGISTRATION SUBMISSIONS */}
      {activeTab === 'patients' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {displayedPatients.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {displayedPatients.map((patient) => {
                const isRejected = patient.verificationStatus === 'rejected';

                return (
                  <div 
                    key={patient.id} 
                    className={`p-4 sm:p-5 transition-colors space-y-3 ${
                      isRejected ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isRejected ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Status: Rejected</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Status: Pending Verification</span>
                            </span>
                          )}

                          <strong className="text-sm text-slate-900">
                            {patient.firstName} {patient.middleName} {patient.lastName} {patient.suffix}
                          </strong>
                          <span className="text-xs font-mono text-slate-500 font-bold">({patient.id})</span>
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>DOB: <strong className="font-tabular text-slate-800">{formatDateHuman(patient.dateOfBirth)}</strong></span>
                          <span>·</span>
                          <span>Mother: <strong>{patient.motherName}</strong> ({patient.contactNumber})</span>
                          <span>·</span>
                          <span>Purok: {patient.purokSitio}</span>
                          {patient.birthWeightKg && (
                            <>
                              <span>·</span>
                              <span>Weight: {patient.birthWeightKg} kg</span>
                            </>
                          )}
                        </div>

                        {patient.remarks && (
                          <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-600">BHW Registration Notes:</span> {patient.remarks}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          onClick={() => onSelectPatient(patient.id)}
                          className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Inspect Record
                        </button>

                        {/* RESUBMIT BUTTON FOR BHW */}
                        {isRejected && (
                          <button
                            onClick={() => handleOpenResubmitPatient(patient)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
                            title="Edit corrected details and re-send for registration"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Resubmit</span>
                          </button>
                        )}

                        {/* Nurse / Admin actions if pending */}
                        {!isRejected && isNurseOrAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setRejectPatientId(patient.id);
                                setRejectPatientReason('');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject with Remarks</span>
                            </button>

                            <button
                              onClick={() => {
                                verifyPatient(patient.id);
                                showToast(`Patient ${patient.firstName} ${patient.lastName} approved into official registry.`);
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Add to Registry</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* DEDICATED SECTION RENDERING REJECTION REMARKS PROVIDED BY ADMINS */}
                    {isRejected && (
                      <div className="mt-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-rose-900 border-b border-rose-200/60 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
                            </span>
                            <span>Admin / Clinical Supervisor Rejection Remarks:</span>
                          </div>
                          {patient.rejectedAt && (
                            <span className="text-[11px] font-medium text-rose-700">
                              Returned: {patient.rejectedAt}
                            </span>
                          )}
                        </div>

                        <div className="pl-1">
                          <p className="text-xs text-rose-950 font-semibold leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-200">
                            "{patient.rejectionReason || 'Discrepancy in demographic information or birth record.'}"
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-rose-800 pl-1">
                          <div>
                            Reviewed by: <strong>{patient.rejectedBy || 'Health Center Admin / Head Nurse'}</strong>
                          </div>
                          <div className="text-slate-500 italic">
                            Click 'Resubmit' to update the record and re-send for approval.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500 space-y-1 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">No Patient Registration Submissions Found</p>
              <p className="text-slate-500">
                {patientStatusFilter === 'rejected'
                  ? 'No rejected patient submissions in this queue.'
                  : 'All registered patients have been certified or processed.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEDICATED REJECTED SECTION WITH ADMIN REMARKS & RESUBMIT ACTION */}
      {activeTab === 'rejected' && (
        <div className="space-y-4">
          
          {totalRejectedCount === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">No Rejected Submissions in Queue</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All submitted records are either pending admin review or have been officially certified.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* REJECTED VACCINES */}
              {(rejectedFilter === 'all' || rejectedFilter === 'vaccines') && filteredRejectedVaccines.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 px-1">
                    <Syringe className="w-4 h-4 text-rose-600" />
                    <span>Rejected Vaccine Submissions ({filteredRejectedVaccines.length})</span>
                  </div>

                  <div className="space-y-3">
                    {filteredRejectedVaccines.map((record) => {
                      const pt = patients.find((p) => p.id === record.patientId);
                      return (
                        <div 
                          key={record.id} 
                          className="bg-white border-2 border-rose-300 rounded-2xl p-5 shadow-xs transition-all space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-xs">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Status: Rejected</span>
                                </span>
                                <span className="font-bold text-sm text-slate-900">
                                  {record.vaccineName} (Dose {record.doseNumber})
                                </span>
                                <span className="text-xs font-mono text-slate-500 font-semibold">({record.id})</span>
                              </div>

                              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>Patient: <strong className="text-slate-900">{pt ? `${pt.firstName} ${pt.lastName}` : record.patientId}</strong></span>
                                <span>·</span>
                                <span>Administered: <strong className="font-tabular text-slate-800">{formatDateHuman(record.dateAdministered)}</strong></span>
                                <span>·</span>
                                <span>Route: {record.route}</span>
                                <span>·</span>
                                <span>Batch: <strong className="font-tabular text-slate-800">{record.batchLotNumber}</strong></span>
                              </div>

                              <div className="text-xs text-slate-500">
                                Originally encoded by: <strong>{record.vaccinatorName}</strong> ({record.recordedAt})
                              </div>
                            </div>

                            {/* Action Buttons for BHW */}
                            <div className="flex items-center gap-2 shrink-0">
                              {pt && (
                                <button
                                  onClick={() => onSelectPatient(pt.id)}
                                  className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                  View Child
                                </button>
                              )}

                              {/* RESUBMIT BUTTON */}
                              <button
                                onClick={() => handleOpenResubmitVaccine(record)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                                title="Edit corrected details and re-send"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Resubmit</span>
                              </button>
                            </div>
                          </div>

                          {/* DEDICATED SECTION RENDERING REJECTION REMARKS PROVIDED BY ADMINS */}
                          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-rose-900 border-b border-rose-200/70 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs">
                                  <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
                                </span>
                                <span>Admin Rejection Remarks & Clinical Justification:</span>
                              </div>
                              {record.rejectedAt && (
                                <span className="text-[11px] font-medium text-rose-700">
                                  Returned on {record.rejectedAt}
                                </span>
                              )}
                            </div>

                            <div className="pl-1">
                              <p className="text-xs text-rose-950 font-semibold leading-relaxed bg-white/90 p-3 rounded-lg border border-rose-200 shadow-xs">
                                "{record.rejectionReason || 'No specific clinical reason entered. Please inspect physical vial and check with supervising nurse.'}"
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-rose-800 pl-1 pt-1">
                              <div>
                                Reviewed & Rejected by Admin: <strong>{record.rejectedBy || 'Clinical Supervisor'}</strong>
                              </div>
                              <div className="text-slate-500 italic">
                                Action: Click 'Resubmit' to edit and re-send the corrected record.
                              </div>
                            </div>
                          </div>

                          {/* Previous BHW encoded notes */}
                          {record.remarks && (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <strong className="text-slate-700">Original BHW Notes:</strong> {record.remarks}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* REJECTED PATIENTS */}
              {(rejectedFilter === 'all' || rejectedFilter === 'patients') && filteredRejectedPatients.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 px-1">
                    <UserCheck className="w-4 h-4 text-rose-600" />
                    <span>Rejected Patient Registrations ({filteredRejectedPatients.length})</span>
                  </div>

                  <div className="space-y-3">
                    {filteredRejectedPatients.map((patient) => (
                      <div 
                        key={patient.id} 
                        className="bg-white border-2 border-rose-300 rounded-2xl p-5 shadow-xs transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-xs">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Status: Rejected</span>
                              </span>
                              <strong className="text-sm text-slate-900">
                                {patient.firstName} {patient.middleName} {patient.lastName} {patient.suffix}
                              </strong>
                              <span className="text-xs font-mono text-slate-500 font-semibold">({patient.id})</span>
                            </div>

                            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>DOB: <strong className="font-tabular text-slate-800">{formatDateHuman(patient.dateOfBirth)}</strong></span>
                              <span>·</span>
                              <span>Mother: <strong>{patient.motherName}</strong> ({patient.contactNumber})</span>
                              <span>·</span>
                              <span>Purok: {patient.purokSitio}</span>
                              {patient.birthWeightKg && (
                                <>
                                  <span>·</span>
                                  <span>Weight: {patient.birthWeightKg} kg</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons for BHW */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => onSelectPatient(patient.id)}
                              className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Inspect Details
                            </button>

                            {/* RESUBMIT BUTTON */}
                            <button
                              onClick={() => handleOpenResubmitPatient(patient)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                              title="Edit corrected details and re-send"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Resubmit</span>
                            </button>
                          </div>
                        </div>

                        {/* DEDICATED SECTION RENDERING REJECTION REMARKS PROVIDED BY ADMINS */}
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-rose-900 border-b border-rose-200/70 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs">
                                <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
                              </span>
                              <span>Admin Rejection Remarks & Clinical Justification:</span>
                            </div>
                            {patient.rejectedAt && (
                              <span className="text-[11px] font-medium text-rose-700">
                                Returned on {patient.rejectedAt}
                              </span>
                            )}
                          </div>

                          <div className="pl-1">
                            <p className="text-xs text-rose-950 font-semibold leading-relaxed bg-white/90 p-3 rounded-lg border border-rose-200 shadow-xs">
                              "{patient.rejectionReason || 'Please verify birth record with official birth certificate or baby book.'}"
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-rose-800 pl-1 pt-1">
                            <div>
                              Reviewed & Rejected by Admin: <strong>{patient.rejectedBy || 'Health Center Admin / Head Nurse'}</strong>
                            </div>
                            <div className="text-slate-500 italic">
                              Action: Click 'Resubmit' to edit and re-send the corrected record.
                            </div>
                          </div>
                        </div>

                        {/* Previous BHW encoded notes */}
                        {patient.remarks && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <strong className="text-slate-700">Original BHW Notes:</strong> {patient.remarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* MODAL 1: NURSE REJECT VACCINE DRAFT MODAL */}
      {rejectVaccineRecordId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-xl text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <span>Return Vaccine Submission with Remarks</span>
              </div>
              <button
                onClick={() => setRejectVaccineRecordId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Please enter the clinical rejection remarks explaining what must be corrected before this vaccine can be certified:
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Discrepancy in batch lot number; physical vial indicates LOT-26-902. Please re-check with health station inventory."
              value={rejectVaccineReason}
              onChange={(e) => setRejectVaccineReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectVaccineRecordId(null)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectVaccine}
                disabled={!rejectVaccineReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                Confirm & Return to BHW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NURSE REJECT PATIENT REGISTRATION MODAL */}
      {rejectPatientId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-xl text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <span>Return Patient Registration with Remarks</span>
              </div>
              <button
                onClick={() => setRejectPatientId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Please enter the clinical rejection remarks or corrections needed before this child can be certified into the official Registry:
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Birth weight or date of birth discrepancy with civil registry birth certificate. Please re-verify with parent's baby book."
              value={rejectPatientReason}
              onChange={(e) => setRejectPatientReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectPatientId(null)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectPatient}
                disabled={!rejectPatientReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                Confirm & Return to BHW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BHW EDIT & RESUBMIT VACCINE DRAFT MODAL */}
      {redoVaccineRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200 shadow-2xl text-xs my-8 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit & Resubmit Vaccine Record
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {redoVaccineRecord.vaccineName} (Dose {redoVaccineRecord.doseNumber}) · Record #{redoVaccineRecord.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRedoVaccineRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DEDICATED ADMIN REJECTION REMARKS SECTION IN MODAL */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between font-bold text-rose-900 text-xs">
                <div className="flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Admin / Supervisor Rejection Remarks:</span>
                </div>
                {redoVaccineRecord.rejectedAt && (
                  <span className="text-[10px] text-rose-700 font-normal">
                    {redoVaccineRecord.rejectedAt}
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-950 font-medium pl-5 bg-white/70 p-2.5 rounded-lg border border-rose-200/80">
                "{redoVaccineRecord.rejectionReason || 'Please review and correct all details before resubmitting.'}"
              </p>
              {redoVaccineRecord.rejectedBy && (
                <div className="text-[10px] text-rose-700 pl-5">
                  Feedback from: <strong>{redoVaccineRecord.rejectedBy}</strong>
                </div>
              )}
            </div>

            {/* Editable Form */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Date Administered */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Date Administered *
                  </label>
                  <input
                    type="date"
                    value={vaccineFormDate}
                    onChange={(e) => setVaccineFormDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                    required
                  />
                </div>

                {/* Route */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Route of Administration *
                  </label>
                  <select
                    value={vaccineFormRoute}
                    onChange={(e) => setVaccineFormRoute(e.target.value as VaccineRoute)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  >
                    <option value="Intramuscular">Intramuscular</option>
                    <option value="Oral">Oral</option>
                    <option value="Subcutaneous">Subcutaneous</option>
                    <option value="Intradermal">Intradermal</option>
                  </select>
                </div>

                {/* Batch / Lot Number */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Batch / Lot Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PNT-26-902"
                    value={vaccineFormBatch}
                    onChange={(e) => setVaccineFormBatch(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs font-mono"
                    required
                  />
                </div>

                {/* Health Facility */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Health Facility
                  </label>
                  <input
                    type="text"
                    value={vaccineFormFacility}
                    onChange={(e) => setVaccineFormFacility(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Remarks / Clinical Notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Corrected Observations / Remarks
                </label>
                <textarea
                  rows={2}
                  value={vaccineFormRemarks}
                  onChange={(e) => setVaccineFormRemarks(e.target.value)}
                  placeholder="e.g. Full dose swallowed, physical vial verified with parent present."
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              {/* Resolution Notes for Nurse */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                <label className="block text-blue-900 font-bold text-xs flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>BHW Resubmission Explanation for Admin:</span>
                </label>
                <textarea
                  rows={2}
                  value={vaccineResolutionNotes}
                  onChange={(e) => setVaccineResolutionNotes(e.target.value)}
                  placeholder="Explain what was corrected (e.g. Checked stock room vial, corrected lot number typo to PNT-26-902)."
                  className="w-full p-2 border border-blue-200 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-blue-700">
                  This note will be attached to the resubmitted record so the reviewing admin can verify your fix immediately.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRedoVaccineRecord(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResubmitVaccine}
                disabled={!vaccineFormDate || !vaccineFormBatch.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Resubmit Record for Verification</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: BHW EDIT & RESUBMIT PATIENT DRAFT MODAL */}
      {redoPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-4 border border-slate-200 shadow-2xl text-xs my-8 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit & Resubmit Patient Registration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Patient ID: {redoPatient.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRedoPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DEDICATED ADMIN REJECTION REMARKS SECTION IN MODAL */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between font-bold text-rose-900 text-xs">
                <div className="flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Admin / Supervisor Rejection Remarks:</span>
                </div>
                {redoPatient.rejectedAt && (
                  <span className="text-[10px] text-rose-700 font-normal">
                    {redoPatient.rejectedAt}
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-950 font-medium pl-5 bg-white/70 p-2.5 rounded-lg border border-rose-200/80">
                "{redoPatient.rejectionReason || 'Please review and correct all demographic details before resubmitting.'}"
              </p>
              {redoPatient.rejectedBy && (
                <div className="text-[10px] text-rose-700 pl-5">
                  Feedback from: <strong>{redoPatient.rejectedBy}</strong>
                </div>
              )}
            </div>

            {/* Editable Form */}
            <div className="space-y-3 pt-1 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    value={patientFormFirst}
                    onChange={(e) => setPatientFormFirst(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={patientFormMiddle}
                    onChange={(e) => setPatientFormMiddle(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={patientFormLast}
                    onChange={(e) => setPatientFormLast(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                    required
                  />
                </div>
              </div>

              {/* DOB, Gender, Suffix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={patientFormDob}
                    onChange={(e) => setPatientFormDob(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender *</label>
                  <select
                    value={patientFormGender}
                    onChange={(e) => setPatientFormGender(e.target.value as 'Male' | 'Female')}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Suffix</label>
                  <input
                    type="text"
                    placeholder="Jr., III"
                    value={patientFormSuffix}
                    onChange={(e) => setPatientFormSuffix(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Parents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mother's Full Name *</label>
                  <input
                    type="text"
                    value={patientFormMother}
                    onChange={(e) => setPatientFormMother(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Father's Full Name</label>
                  <input
                    type="text"
                    value={patientFormFather}
                    onChange={(e) => setPatientFormFather(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Contact & Purok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone Number *</label>
                  <input
                    type="text"
                    value={patientFormContact}
                    onChange={(e) => setPatientFormContact(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Purok / Sitio *</label>
                  <select
                    value={patientFormPurok}
                    onChange={(e) => setPatientFormPurok(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  >
                    {settings.puroks.map((purok) => (
                      <option key={purok} value={purok}>{purok}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  value={patientFormAddress}
                  onChange={(e) => setPatientFormAddress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              {/* Birth Weight & Blood Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Birth Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={patientFormBirthWeight}
                    onChange={(e) => setPatientFormBirthWeight(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Birth Place</label>
                  <input
                    type="text"
                    value={patientFormBirthPlace}
                    onChange={(e) => setPatientFormBirthPlace(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Blood Type</label>
                  <select
                    value={patientFormBloodType}
                    onChange={(e) => setPatientFormBloodType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                  >
                    <option value="">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  General Remarks / Field Notes
                </label>
                <textarea
                  rows={2}
                  value={patientFormRemarks}
                  onChange={(e) => setPatientFormRemarks(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              {/* Resolution Notes for Nurse */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                <label className="block text-blue-900 font-bold text-xs flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>BHW Resubmission Explanation for Admin:</span>
                </label>
                <textarea
                  rows={2}
                  value={patientResolutionNotes}
                  onChange={(e) => setPatientResolutionNotes(e.target.value)}
                  placeholder="Explain what was verified (e.g. Verified birth date and weight directly from hospital birth certificate)."
                  className="w-full p-2 border border-blue-200 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-blue-700">
                  This note will be attached to the resubmitted record so the reviewing admin can certify it quickly.
                </p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRedoPatient(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResubmitPatient}
                disabled={!patientFormFirst.trim() || !patientFormLast.trim() || !patientFormDob || !patientFormMother.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Resubmit Record for Verification</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
