import React from 'react';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle2, 
  Building2, 
  ShieldCheck 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  formatDateHuman, 
  calculateAge, 
  getPatientVaccineStatuses 
} from '../utils/immunizationUtils';
import { VACCINE_SCHEDULE } from '../data/initialData';

interface PrintableImmunizationCardProps {
  patientId: string;
  onBack: () => void;
}

export const PrintableImmunizationCard: React.FC<PrintableImmunizationCardProps> = ({
  patientId,
  onBack,
}) => {
  const { patients, vaccinationRecords, settings } = useApp();

  const patient = patients.find((p) => p.id === patientId);

  if (!patient) return null;

  const age = calculateAge(patient.dateOfBirth);
  const statuses = getPatientVaccineStatuses(patient, vaccinationRecords);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      
      {/* Non-print toolbar */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Ready to print on standard letter / A4 paper
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Immunization Card</span>
          </button>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="printable-area bg-white border border-slate-300 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto shadow-md text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
        
        {/* Official Philippine Barangay Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
          <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border border-slate-300 flex items-center justify-center">
            <img
              src="/src/assets/images/barangay_health_logo_1790812695237.jpg"
              alt="Barangay Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center flex-1 px-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-600 font-medium">
              Republic of the Philippines · {settings.province} · {settings.municipalityCity}
            </p>
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-900">
              {settings.barangayName}
            </h2>
            <p className="text-xs font-semibold text-blue-900">
              {settings.healthCenterName}
            </p>
            <p className="text-[11px] text-slate-500 italic mt-0.5">
              Official Child Immunization Record & Health Passport (Bakuna Card)
            </p>
          </div>

          <div className="w-16 h-16 shrink-0 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center p-1 text-[9px] text-center text-slate-500 font-mono">
            <span>OFFICIAL</span>
            <span>HEALTH</span>
            <span>STAMP</span>
          </div>
        </div>

        {/* Patient Demographic Block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs mb-4">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Child's Full Name:</span>
            <span className="font-bold text-sm text-slate-900">
              {patient.lastName}, {patient.firstName} {patient.middleName} {patient.suffix}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient System ID:</span>
            <span className="font-mono font-bold text-blue-800">{patient.id}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Birth:</span>
            <span className="font-tabular font-bold">{formatDateHuman(patient.dateOfBirth)}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Sex / Blood Type:</span>
            <span className="font-semibold">{patient.gender} · {patient.bloodType || 'N/A'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Mother's Name:</span>
            <span className="font-medium text-slate-800">{patient.motherName}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Father's Name:</span>
            <span className="font-medium text-slate-800">{patient.fatherName || '—'}</span>
          </div>

          <div className="col-span-2">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Address / Purok:</span>
            <span className="font-medium text-slate-800">{patient.address}, {patient.purokSitio}</span>
          </div>
        </div>

        {/* Immunization Grid */}
        <div className="border border-slate-300 rounded overflow-hidden mb-6">
          <table className="w-full text-left text-xs divide-y divide-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-2 border-r border-slate-300">Vaccine / Antigen</th>
                <th className="px-2 py-2 border-r border-slate-300">Target Age</th>
                <th className="px-2 py-2 border-r border-slate-300">Route / Site</th>
                <th className="px-3 py-2 border-r border-slate-300">Date Administered</th>
                <th className="px-3 py-2 border-r border-slate-300">Lot / Batch No.</th>
                <th className="px-3 py-2">Vaccinator Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {VACCINE_SCHEDULE.map((v) => {
                const rec = vaccinationRecords.find(
                  (r) => r.patientId === patient.id && r.vaccineCode === v.code
                );
                return (
                  <tr key={v.code} className="hover:bg-slate-50 text-[11px]">
                    <td className="px-3 py-1.5 border-r border-slate-300 font-semibold text-slate-900">
                      {v.name}
                      <span className="text-[10px] text-slate-500 block font-normal">
                        Dose {v.doseNumber} of {v.totalDoses} {v.isBooster ? '(Booster)' : ''}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300 font-medium text-slate-700">
                      {v.targetAgeDescription}
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300 text-slate-600">
                      {v.route}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-300 font-tabular font-bold text-slate-900">
                      {rec ? formatDateHuman(rec.dateAdministered) : '—'}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-300 font-tabular font-medium text-slate-700">
                      {rec ? rec.batchLotNumber : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">
                      {rec ? (
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">{rec.vaccinatorName}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{rec.vaccinatorRole}</div>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-[10px]">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Official Health Center Sign-off Block */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs">
          <div className="text-center space-y-1">
            <div className="h-10"></div>
            <p className="font-bold uppercase text-slate-900 border-t border-slate-800 pt-1">
              {settings.headNurse}
            </p>
            <p className="text-[11px] text-slate-600">Public Health Nurse / Authorized Vaccinator</p>
          </div>

          <div className="text-center space-y-1">
            <div className="h-10"></div>
            <p className="font-bold uppercase text-slate-900 border-t border-slate-800 pt-1">
              {settings.barangayCaptain}
            </p>
            <p className="text-[11px] text-slate-600">Punong Barangay / Health Committee Chair</p>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-6 pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
          <span>Barangay Immunization Record & Monitoring System · Official Document</span>
          <span>Printed on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

      </div>

    </div>
  );
};
