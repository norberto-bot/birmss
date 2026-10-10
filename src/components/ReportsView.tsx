import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar,
  Building2,
  Table
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  evaluatePatientSummary, 
  formatDateHuman, 
  getPatientVaccineStatuses 
} from '../utils/immunizationUtils';
import { VACCINE_SCHEDULE } from '../data/initialData';

export const ReportsView: React.FC = () => {
  const { 
    patients, 
    vaccinationRecords, 
    settings, 
    currentUser, 
    logActivity 
  } = useApp();

  const [reportType, setReportType] = useState<'monthly' | 'fic' | 'missed' | 'antigen_purok'>('monthly');
  const [selectedPurok, setSelectedPurok] = useState('ALL');

  const evaluations = patients.map((p) => ({
    patient: p,
    summary: evaluatePatientSummary(p, vaccinationRecords),
    statuses: getPatientVaccineStatuses(p, vaccinationRecords),
  }));

  const filtered = evaluations.filter((e) => {
    if (selectedPurok !== 'ALL' && e.patient.purokSitio !== selectedPurok) {
      return false;
    }
    return true;
  });

  const ficList = filtered.filter((e) => e.summary.isFullyImmunized);
  const missedList = filtered.filter((e) => e.summary.missedCount > 0);

  const handleExportCSV = () => {
    let headers = '';
    let rows: string[] = [];

    if (reportType === 'fic') {
      headers = 'Patient ID,First Name,Last Name,Date of Birth,Age,Sex,Purok,Mother,Contact\n';
      rows = ficList.map((e) => 
        `"${e.patient.id}","${e.patient.firstName}","${e.patient.lastName}","${e.patient.dateOfBirth}","${e.summary.ageFormatted}","${e.patient.gender}","${e.patient.purokSitio}","${e.patient.motherName}","${e.patient.contactNumber}"`
      );
    } else if (reportType === 'missed') {
      headers = 'Patient ID,First Name,Last Name,Date of Birth,Age,Purok,Missed Vaccines,Mother,Contact\n';
      rows = missedList.map((e) => {
        const missedAntigens = e.statuses
          .filter((s) => s.status === 'missed' || s.status === 'due')
          .map((s) => s.vaccine.shortLabel)
          .join('; ');
        return `"${e.patient.id}","${e.patient.firstName}","${e.patient.lastName}","${e.patient.dateOfBirth}","${e.summary.ageFormatted}","${e.patient.purokSitio}","${missedAntigens}","${e.patient.motherName}","${e.patient.contactNumber}"`;
      });
    } else {
      headers = 'Patient ID,First Name,Last Name,DOB,Purok,Status,Doses Completed\n';
      rows = filtered.map((e) => 
        `"${e.patient.id}","${e.patient.firstName}","${e.patient.lastName}","${e.patient.dateOfBirth}","${e.patient.purokSitio}","${e.summary.overallStatus}","${e.summary.completedCount}/${e.summary.totalScheduled}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BIRMS_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logActivity('REPORT_EXPORTED', `Exported CSV report: ${reportType.toUpperCase()}`);
  };

  const handlePrint = () => {
    logActivity('REPORT_EXPORTED', `Printed official report: ${reportType.toUpperCase()}`);
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Report Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Barangay Immunization Reports & Summaries
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Department of Health (DOH) standard reporting templates and export tools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>

        {/* Report Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                reportType === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Monthly Health Station Summary
            </button>

            <button
              onClick={() => setReportType('fic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                reportType === 'fic'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Fully Immunized Children (FIC)
            </button>

            <button
              onClick={() => setReportType('missed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                reportType === 'missed'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Defaulter / Missed List
            </button>

            <button
              onClick={() => setReportType('antigen_purok')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                reportType === 'antigen_purok'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Coverage by Purok & Antigen
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPurok}
              onChange={(e) => setSelectedPurok(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-slate-700"
            >
              <option value="ALL">All Puroks / Sitios</option>
              {settings.puroks.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="printable-area bg-white border border-slate-300 rounded-xl p-6 sm:p-8 max-w-5xl mx-auto shadow-md text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
        
        {/* Official Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
          <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border border-slate-300 flex items-center justify-center">
            <img
              src="/src/assets/images/barangay_health_logo_1790812695237.jpg"
              alt="Seal"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center flex-1 px-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-600">
              Republic of the Philippines · {settings.province} · {settings.municipalityCity}
            </p>
            <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">
              {settings.barangayName}
            </h2>
            <p className="text-xs font-semibold text-blue-900">
              {settings.healthCenterName}
            </p>
            <p className="text-xs font-bold uppercase text-slate-800 mt-1">
              {reportType === 'monthly' && 'Monthly Expanded Program on Immunization (EPI) Summary Report'}
              {reportType === 'fic' && 'Master List of Fully Immunized Children (FIC)'}
              {reportType === 'missed' && 'Defaulter Tracing & Missed Immunization Master Roster'}
              {reportType === 'antigen_purok' && 'Immunization Coverage Breakdown by Purok / Sitio'}
            </p>
          </div>

          <div className="w-16 text-right text-[10px] text-slate-500 font-mono">
            <div>FORM-EPI</div>
            <div>STATUS: OK</div>
          </div>
        </div>

        {/* Report 1: Monthly Health Station Summary */}
        {reportType === 'monthly' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Registered Under-5</span>
                <span className="text-xl font-bold font-tabular text-slate-900">{patients.length}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Fully Immunized (FIC)</span>
                <span className="text-xl font-bold font-tabular text-emerald-700">{ficList.length}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Missed / Defaulters</span>
                <span className="text-xl font-bold font-tabular text-red-700">{missedList.length}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">FIC Rate</span>
                <span className="text-xl font-bold font-tabular text-blue-700">
                  {patients.length > 0 ? Math.round((ficList.length / patients.length) * 100) : 0}%
                </span>
              </div>
            </div>

            <table className="w-full text-left text-xs divide-y divide-slate-300 border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-300">Antigen / Vaccine</th>
                  <th className="px-3 py-2 border-r border-slate-300">Target Age</th>
                  <th className="px-3 py-2 border-r border-slate-300">Route</th>
                  <th className="px-3 py-2 border-r border-slate-300 text-center">Doses Administered</th>
                  <th className="px-3 py-2 text-center">Coverage Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {VACCINE_SCHEDULE.map((v) => {
                  const dosesGiven = vaccinationRecords.filter((r) => r.vaccineCode === v.code).length;
                  const rate = patients.length > 0 ? Math.min(100, Math.round((dosesGiven / patients.length) * 100)) : 0;
                  return (
                    <tr key={v.code} className="hover:bg-slate-50 text-[11px]">
                      <td className="px-3 py-1.5 border-r border-slate-300 font-semibold">{v.name}</td>
                      <td className="px-3 py-1.5 border-r border-slate-300">{v.targetAgeDescription}</td>
                      <td className="px-3 py-1.5 border-r border-slate-300">{v.route}</td>
                      <td className="px-3 py-1.5 border-r border-slate-300 text-center font-tabular font-bold">{dosesGiven}</td>
                      <td className="px-3 py-1.5 text-center font-tabular">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 2: FIC List */}
        {reportType === 'fic' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600 mb-2">
              The following infants have received all mandatory Expanded Program on Immunization antigens (BCG, Hep B birth, 3 doses Pentavalent, 3 doses OPV, 2 doses IPV, 3 doses PCV, and 2 doses MMR) before reaching 12-24 months of age:
            </div>

            <table className="w-full text-left text-xs divide-y divide-slate-300 border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-300">Patient ID</th>
                  <th className="px-3 py-2 border-r border-slate-300">Child's Name</th>
                  <th className="px-3 py-2 border-r border-slate-300">Birthdate</th>
                  <th className="px-3 py-2 border-r border-slate-300">Age</th>
                  <th className="px-3 py-2 border-r border-slate-300">Purok</th>
                  <th className="px-3 py-2">Mother / Guardian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {ficList.map((e) => (
                  <tr key={e.patient.id} className="hover:bg-slate-50 text-[11px]">
                    <td className="px-3 py-2 border-r border-slate-300 font-mono font-bold text-blue-800">{e.patient.id}</td>
                    <td className="px-3 py-2 border-r border-slate-300 font-semibold">{e.patient.firstName} {e.patient.lastName}</td>
                    <td className="px-3 py-2 border-r border-slate-300 font-tabular">{formatDateHuman(e.patient.dateOfBirth)}</td>
                    <td className="px-3 py-2 border-r border-slate-300 font-medium">{e.summary.ageFormatted}</td>
                    <td className="px-3 py-2 border-r border-slate-300">{e.patient.purokSitio}</td>
                    <td className="px-3 py-2">{e.patient.motherName} ({e.patient.contactNumber})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 3: Missed Defaulters */}
        {reportType === 'missed' && (
          <div className="space-y-4">
            <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded border border-red-200">
              Defaulter List: Assigned BHWs must visit these households to reschedule vaccination and minimize drop-out rates.
            </div>

            <table className="w-full text-left text-xs divide-y divide-slate-300 border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-300">Patient ID</th>
                  <th className="px-3 py-2 border-r border-slate-300">Child's Name</th>
                  <th className="px-3 py-2 border-r border-slate-300">Purok / Address</th>
                  <th className="px-3 py-2 border-r border-slate-300">Overdue Antigens</th>
                  <th className="px-3 py-2">Parent Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {missedList.map((e) => {
                  const missedVaccines = e.statuses
                    .filter((s) => s.status === 'missed' || s.status === 'due')
                    .map((s) => `${s.vaccine.shortLabel} (${Math.abs(s.daysDiff)}d late)`)
                    .join(', ');

                  return (
                    <tr key={e.patient.id} className="hover:bg-slate-50 text-[11px]">
                      <td className="px-3 py-2 border-r border-slate-300 font-mono font-bold text-red-700">{e.patient.id}</td>
                      <td className="px-3 py-2 border-r border-slate-300 font-semibold">{e.patient.firstName} {e.patient.lastName}</td>
                      <td className="px-3 py-2 border-r border-slate-300">{e.patient.purokSitio}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-red-800 font-medium">{missedVaccines}</td>
                      <td className="px-3 py-2">{e.patient.motherName} · {e.patient.contactNumber}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 4: Antigen coverage by Purok */}
        {reportType === 'antigen_purok' && (
          <div className="space-y-4">
            <table className="w-full text-left text-xs divide-y divide-slate-300 border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-300">Purok / Sitio</th>
                  <th className="px-3 py-2 border-r border-slate-300 text-center">Total Children</th>
                  <th className="px-3 py-2 border-r border-slate-300 text-center">FIC Count</th>
                  <th className="px-3 py-2 border-r border-slate-300 text-center">Missed Count</th>
                  <th className="px-3 py-2 text-center">Coverage Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {settings.puroks.map((p) => {
                  const pPatients = evaluations.filter((e) => e.patient.purokSitio === p);
                  const pFIC = pPatients.filter((e) => e.summary.isFullyImmunized).length;
                  const pMissed = pPatients.filter((e) => e.summary.missedCount > 0).length;
                  const rate = pPatients.length > 0 ? Math.round((pFIC / pPatients.length) * 100) : 0;
                  return (
                    <tr key={p} className="hover:bg-slate-50 text-[11px]">
                      <td className="px-3 py-2 border-r border-slate-300 font-semibold">{p}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-center font-tabular">{pPatients.length}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-center font-tabular text-emerald-700 font-bold">{pFIC}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-center font-tabular text-red-700 font-bold">{pMissed}</td>
                      <td className="px-3 py-2 text-center font-tabular font-bold">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-8 mt-6 border-t border-slate-300 text-xs">
          <div className="text-center space-y-1">
            <div className="h-8"></div>
            <p className="font-bold uppercase text-slate-900 border-t border-slate-800 pt-1">
              {currentUser?.fullName}
            </p>
            <p className="text-[10px] text-slate-600">Prepared by / Reporting Officer</p>
          </div>

          <div className="text-center space-y-1">
            <div className="h-8"></div>
            <p className="font-bold uppercase text-slate-900 border-t border-slate-800 pt-1">
              {settings.headNurse}
            </p>
            <p className="text-[10px] text-slate-600">Verified by / Public Health Nurse</p>
          </div>

          <div className="text-center space-y-1">
            <div className="h-8"></div>
            <p className="font-bold uppercase text-slate-900 border-t border-slate-800 pt-1">
              {settings.barangayCaptain}
            </p>
            <p className="text-[10px] text-slate-600">Noted by / Punong Barangay</p>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
          <span>Barangay Immunization Record and Monitoring System</span>
          <span>Generated: {new Date().toLocaleString()}</span>
        </div>

      </div>

    </div>
  );
};
