import React, { useState } from 'react';
import { 
  Syringe, 
  Info, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  Search
} from 'lucide-react';
import { VACCINE_SCHEDULE } from '../data/initialData';
import { useApp } from '../context/AppContext';

export const VaccinesScheduleView: React.FC<{ onOpenRecordVaccine: (vaccineCode?: string) => void }> = ({
  onOpenRecordVaccine,
}) => {
  const { currentUser, vaccinationRecords } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVaccines = VACCINE_SCHEDULE.filter((v) => {
    const q = searchTerm.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.code.toLowerCase().includes(q) ||
      v.targetAgeDescription.toLowerCase().includes(q) ||
      v.route.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Expanded Program on Immunization (EPI) Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approved Philippine Department of Health (DOH) standard childhood vaccination timeline.
          </p>
        </div>

        <button
          onClick={() => onOpenRecordVaccine()}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 ${
            currentUser?.role === 'bhw'
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Syringe className="w-4 h-4" />
          <span>{currentUser?.role === 'bhw' ? 'Encode Vaccine Draft' : 'Record Administration'}</span>
        </button>
      </div>

      {/* DOH Vitamin A Guidelines Special Card */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>DOH National Micronutrient Supplementation Program: Vitamin A Guidelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-amber-950">
          <div className="bg-white/80 p-3 rounded-lg border border-amber-200 space-y-1">
            <span className="font-bold text-blue-900 block flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              Infants 6–11 Months Old:
            </span>
            <p className="text-[11px] text-slate-700">
              <strong>100,000 IU (Blue Capsule)</strong> given <strong>once</strong> at 6 months of age (or during catch-up before 12 months). Route: Oral, oil-based.
            </p>
          </div>
          <div className="bg-white/80 p-3 rounded-lg border border-amber-200 space-y-1">
            <span className="font-bold text-red-900 block flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              Children 12–59 Months Old (1 to 4.9 Years):
            </span>
            <p className="text-[11px] text-slate-700">
              <strong>200,000 IU (Red Capsule)</strong> administered <strong>every 4–6 months</strong> (up to 8 cumulative doses during Garantisadong Pambata).
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search antigen name, route, or target age..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
          />
        </div>
      </div>

      {/* Vaccines Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVaccines.map((v) => {
          const totalAdministered = vaccinationRecords.filter((r) => r.vaccineCode === v.code).length;

          return (
            <div
              key={v.code}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700">
                      {v.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">
                      {v.name}
                    </h3>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    Dose {v.doseNumber} of {v.totalDoses}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Schedule:</span>
                    <strong className="text-slate-800">{v.targetAgeDescription}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Route & Site:</span>
                    <span className="text-slate-800 font-medium">{v.route} ({v.defaultSite})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Grace Period:</span>
                    <span className="text-slate-800">{v.gracePeriodDays} days allowed</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-3">
                  {v.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Total Given in BHS: <strong className="font-tabular text-slate-800">{totalAdministered}</strong>
                </span>

                {currentUser?.role !== 'bhw' && (
                  <button
                    onClick={() => onOpenRecordVaccine(v.code)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Administer Dose →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
