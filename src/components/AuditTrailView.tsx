import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLog } from '../types';

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedAction !== 'ALL' && log.action !== selectedAction) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchTarget = (log.targetName || '').toLowerCase().includes(q) || (log.targetId || '').toLowerCase().includes(q);
      return matchDetails || matchUser || matchTarget;
    }
    return true;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'VACCINE_RECORDED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RECORD_CORRECTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PATIENT_REGISTERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PATIENT_UPDATED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'FOLLOWUP_LOGGED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'USER_CREATED':
      case 'USER_UPDATED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'USER_DEACTIVATED':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'USER_REACTIVATED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'REACTIVATION_COMPLAINT_SUBMITTED':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'SECURITY_ALERT':
      case 'ACCOUNT_LOCKED':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            System Security & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of clinical actions, record updates, audited corrections, and authentication events.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Tamper-Resistant Log</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, affected patient ID, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
          >
            <option value="ALL">All Actions ({auditLogs.length})</option>
            <option value="USER_DEACTIVATED">Account Deactivations (Admin Reason & Timestamp)</option>
            <option value="USER_REACTIVATED">Account Reactivations (Admin Verified)</option>
            <option value="REACTIVATION_COMPLAINT_SUBMITTED">Reactivation Complaints / Appeals</option>
            <option value="VACCINE_RECORDED">Vaccine Recorded</option>
            <option value="RECORD_CORRECTED">Record Corrected (Audited)</option>
            <option value="PATIENT_REGISTERED">Patient Registered</option>
            <option value="PATIENT_UPDATED">Patient Updated</option>
            <option value="FOLLOWUP_LOGGED">Follow-Up Logged</option>
            <option value="USER_CREATED">User Account Created</option>
            <option value="REPORT_EXPORTED">Report Exported</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-3">Timestamp</th>
                <th scope="col" className="px-4 py-3">User & Role</th>
                <th scope="col" className="px-4 py-3">Action Type</th>
                <th scope="col" className="px-4 py-3">Affected Entity</th>
                <th scope="col" className="px-4 py-3">Details / Audit Description</th>
                <th scope="col" className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 font-tabular text-slate-800 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* User */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        {log.userRole}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Affected Entity */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      {log.targetName || log.targetId || '—'}
                      {log.targetId && (
                        <span className="block font-mono text-[10px] text-slate-400">{log.targetId}</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 text-slate-700 max-w-md">
                      <div className="line-clamp-2">{log.details}</div>
                    </td>

                    {/* Action button */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {log.previousData || log.updatedData ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          View Diff
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-xs">
                    No matching audit log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Difference / Historical View Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Audit Record Diff: {selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <strong className="block text-slate-800">Action:</strong>
                <p className="text-slate-600">{selectedLog.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="font-bold text-red-800 block text-[11px] mb-1">Previous Values:</span>
                  <pre className="text-[10px] text-red-900 overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog.previousData, null, 2)}
                  </pre>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="font-bold text-emerald-800 block text-[11px] mb-1">Updated Values:</span>
                  <pre className="text-[10px] text-emerald-900 overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog.updatedData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3.5 py-1.5 text-xs bg-slate-800 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
