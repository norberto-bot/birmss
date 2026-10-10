import React, { useState } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  PlusCircle, 
  Calendar, 
  User, 
  MapPin, 
  Phone 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateHuman } from '../utils/immunizationUtils';

export const FollowUpsView: React.FC<{
  onSelectPatient: (patientId: string) => void;
  onOpenFollowUp: (patientId: string) => void;
}> = ({ onSelectPatient, onOpenFollowUp }) => {
  const { followUps, patients, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const filtered = followUps.filter((f) => {
    const pt = patients.find((p) => p.id === f.patientId);
    if (methodFilter !== 'ALL' && f.contactMethod !== methodFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const ptName = pt ? `${pt.firstName} ${pt.lastName}`.toLowerCase() : '';
      const notes = f.remarks.toLowerCase();
      const bhw = f.assignedBHW.toLowerCase();
      return ptName.includes(q) || notes.includes(q) || bhw.includes(q) || f.patientId.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Patient Follow-Up & Defaulter Tracking Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Documented BHW home visits, phone reminders, and parent counseling sessions.
          </p>
        </div>

        <button
          onClick={() => onOpenFollowUp(patients[0]?.id || '')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Follow-Up Activity</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, BHW, or follow-up notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
          >
            <option value="ALL">All Contact Methods</option>
            <option value="Home Visit">Home Visit</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Barangay Health Center Visit">Barangay Health Center Visit</option>
            <option value="SMS Notice">SMS Notice</option>
          </select>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const pt = patients.find((p) => p.id === item.patientId);
              return (
                <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {item.contactMethod}
                      </span>
                      <strong className="text-slate-900 text-xs sm:text-sm">
                        {item.followUpResult}
                      </strong>
                    </div>

                    <span className="text-xs text-slate-500 font-tabular">
                      Date: <strong className="text-slate-700">{formatDateHuman(item.followUpDate)}</strong>
                    </span>
                  </div>

                  {pt && (
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Patient: <button onClick={() => onSelectPatient(pt.id)} className="font-bold text-blue-700 hover:underline">{pt.firstName} {pt.lastName} ({pt.id})</button></span>
                      <span>·</span>
                      <span>Purok: {pt.purokSitio}</span>
                      <span>·</span>
                      <span>Mother: {pt.motherName} ({pt.contactNumber})</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    "{item.remarks}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Assigned BHW: <strong className="text-slate-700">{item.assignedBHW}</strong></span>
                    {item.nextFollowUpDate && (
                      <span>Next Visit Target: <strong className="font-tabular text-blue-700">{formatDateHuman(item.nextFollowUpDate)}</strong></span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-slate-500 text-xs">
              No follow-up entries found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
