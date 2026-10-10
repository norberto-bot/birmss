import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud, 
  Database, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  X,
  Layers,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfflineSyncIndicator: React.FC = () => {
  const { 
    isOnline, 
    offlineQueue, 
    syncOfflineData, 
    swCacheInfo, 
    refreshSwCache,
    patients,
    vaccinationRecords,
    toggleOfflineSimulation,
    language 
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const pendingCount = offlineQueue.length;

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowDetails(false);
      }
    };
    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  const handlePushToServer = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncOfflineData();
      await refreshSwCache();
      setSyncFeedback(
        language === 'fil' 
          ? `Matagumpay na nai-push ang ${res.syncedCount || pendingCount} record sa server!` 
          : `Successfully pushed ${res.syncedCount || pendingCount} records to server!`
      );
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch {
      setSyncFeedback(language === 'fil' ? 'Nagkaroon ng aberya sa pag-sync.' : 'Sync failed. Will retry automatically.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefreshCache = async () => {
    setIsSyncing(true);
    await refreshSwCache();
    setIsSyncing(false);
    setSyncFeedback(language === 'fil' ? 'Na-update ang local offline cache!' : 'Local offline cache refreshed!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Navbar Main Trigger Badge */}
      <div
        onClick={() => setShowDetails(!showDetails)}
        className={`group cursor-pointer flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border transition-all select-none shadow-2xs ${
          pendingCount > 0
            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-400 text-amber-900 animate-pulse'
            : !isOnline
            ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800'
            : 'bg-emerald-50/90 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800'
        }`}
        title={
          pendingCount > 0 
            ? `${pendingCount} immunization records in local cache need push to server. Click to inspect or push.`
            : !isOnline 
            ? 'Working in offline mode. Click for offline cache diagnostics.' 
            : 'All immunization records in local cache are synchronized with the server.'
        }
      >
        {pendingCount > 0 ? (
          <>
            <div className="relative flex items-center justify-center">
              <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="hidden xs:inline">
                {language === 'fil' ? 'Kailangang I-push:' : 'Needs Push:'}
              </span>
              <span className="font-tabular font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                {pendingCount}
              </span>
            </div>

            {/* Quick 1-Click Push Button inside Navbar */}
            <button
              type="button"
              onClick={handlePushToServer}
              disabled={isSyncing || !isOnline}
              className={`hidden md:inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs transition-all ${
                !isOnline 
                  ? 'bg-slate-400 cursor-not-allowed opacity-75' 
                  : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
              }`}
              title={!isOnline ? 'Cannot push while offline' : 'Push local drafts to server now'}
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Pushing...' : 'Push to Server'}</span>
            </button>
          </>
        ) : !isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden xs:inline font-medium">
              {language === 'fil' ? 'Offline Mode' : 'Offline Cache Ready'}
            </span>
            <span className="xs:hidden font-medium">Offline</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
            <span className="hidden sm:inline font-medium">
              {language === 'fil' ? 'Naka-sync sa Server' : 'Records Synced'}
            </span>
            <span className="sm:hidden font-medium">Synced</span>
          </>
        )}

        <ChevronDown className={`w-3 h-3 transition-transform text-slate-400 group-hover:text-slate-600 ${showDetails ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Diagnostic & Push Popover Panel */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                pendingCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {language === 'fil' ? 'Katayuan ng Pag-sync (Sync Status)' : 'Offline Sync & Cache Status'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {language === 'fil' ? 'Pagsusuri ng Immunization Records' : 'Immunization Record Synchronization'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDetails(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback Alert */}
          {syncFeedback && (
            <div className="mt-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Server & Connectivity Status Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-rose-500" />}
                <span>Server Network</span>
              </div>
              <div className="font-bold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className={isOnline ? 'text-emerald-700' : 'text-rose-700'}>
                  {isOnline ? 'Online / Connected' : 'Offline / No Signal'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-blue-600" />
                <span>Local Cache</span>
              </div>
              <div className="font-bold text-slate-800">
                {pendingCount > 0 ? (
                  <span className="text-amber-600">{pendingCount} needs push</span>
                ) : (
                  <span className="text-emerald-600">100% Up to Date</span>
                )}
              </div>
            </div>
          </div>

          {/* Critical Immunization Data Statistics */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Cached Patients & Schedules:</span>
              </span>
              <span className="font-tabular font-bold text-slate-900">
                {patients.length} patients ({vaccinationRecords.length} records)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                <span>Unpushed Drafts in Local Queue:</span>
              </span>
              <span className={`font-tabular font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pendingCount} records
              </span>
            </div>

            {swCacheInfo?.lastCachedTimestamp && (
              <div className="flex items-center justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-200/60">
                <span>Last Cache Snapshot:</span>
                <span className="font-tabular">
                  {new Date(swCacheInfo.lastCachedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Pending Queue List (if records need push) */}
          {pendingCount > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-bold text-amber-800 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Immunization Records Waiting to Push:</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {offlineQueue.map((item) => (
                  <div key={item.id} className="p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-[11px] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-tabular">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-800 text-[9px] font-bold uppercase">
                      Local Draft
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {pendingCount > 0 ? (
              <button
                type="button"
                onClick={handlePushToServer}
                disabled={isSyncing || !isOnline}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-xs transition-all ${
                  !isOnline 
                    ? 'bg-slate-400 cursor-not-allowed opacity-80' 
                    : 'bg-amber-600 hover:bg-amber-700 active:scale-98'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing 
                    ? 'Pushing records to server...' 
                    : !isOnline 
                    ? 'Cannot push while offline (Reconnect to push)' 
                    : `Push ${pendingCount} ${pendingCount === 1 ? 'Record' : 'Records'} to Server Now`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRefreshCache}
                disabled={isSyncing}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Refresh Local Offline Snapshot</span>
              </button>
            )}

            {/* Offline Simulation Switcher for Testing Field Operations */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Simulate Offline Field Visit:</span>
              <button
                type="button"
                onClick={toggleOfflineSimulation}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors border ${
                  !isOnline 
                    ? 'bg-rose-100 border-rose-300 text-rose-800' 
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {!isOnline ? 'Active (Click to Go Online)' : 'Go Offline (Simulate)'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
