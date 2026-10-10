import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_COUNTDOWN_SECONDS = 60; // Show warning 60s before logout

export const IdleTimeoutModal: React.FC = () => {
  const { currentUser, logout, logActivity } = useApp();
  
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckRef = useRef<NodeJS.Timeout | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSecondsRemaining(null);
  }, []);

  // Listen to user interactions to reset idle timer
  useEffect(() => {
    if (!currentUser) {
      setSecondsRemaining(null);
      return;
    }

    lastActivityRef.current = Date.now();

    const handleUserActivity = () => {
      // Throttle: only update if warning is not active or to reset warning
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        lastActivityRef.current = now;
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // Ticking interval: check every 1 second
    timerCheckRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeLeftMs = IDLE_TIMEOUT_MS - elapsed;

      if (timeLeftMs <= 0) {
        // 15 minutes expired! Trigger automatic security logout
        if (timerCheckRef.current) clearInterval(timerCheckRef.current);
        setSecondsRemaining(null);

        logActivity(
          'SECURITY_ALERT',
          `[AUTOMATED IDLE LOGOUT] User ${currentUser.fullName} (@${currentUser.username}, ${currentUser.role.toUpperCase()}) was automatically logged out after 15 minutes of inactivity on terminal.`,
          currentUser.id,
          currentUser.fullName,
          { sessionState: 'Active' },
          { sessionState: 'Terminated', reason: '15-minute idle timeout on BHW terminal' }
        );

        logout();
      } else if (timeLeftMs <= WARNING_COUNTDOWN_SECONDS * 1000) {
        // Within the last 60 seconds: show warning dialog with countdown
        const secs = Math.ceil(timeLeftMs / 1000);
        setSecondsRemaining(secs);
      } else {
        setSecondsRemaining(null);
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
    };
  }, [currentUser, logout, logActivity]);

  if (!currentUser || secondsRemaining === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-amber-500 selection:text-white">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-amber-300 relative animate-in fade-in zoom-in duration-150">
        
        {/* Warning Icon & Badge */}
        <div className="flex items-start gap-3.5 border-b border-amber-100 pb-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mb-1">
              <span>BHW Terminal Security · Inactivity Alert</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Session About to Expire
            </h3>
            <p className="text-xs text-slate-500">
              Automatic 15-minute idle timeout protection
            </p>
          </div>
        </div>

        {/* Big Countdown Timer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-1">
          <div className="text-3xl font-extrabold text-amber-900 font-mono">
            00:{secondsRemaining.toString().padStart(2, '0')}
          </div>
          <p className="text-xs font-semibold text-amber-800">
            Seconds remaining before automatic logout
          </p>
          <p className="text-[11px] text-amber-700 leading-relaxed pt-1">
            No activity detected on this terminal for 14 minutes. For patient data privacy, you will be automatically logged out to prevent unauthorized access.
          </p>
        </div>

        {/* Current user confirmation */}
        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <span>Logged-in account:</span>
          <span className="font-bold text-slate-800 font-mono">@{currentUser.username} ({currentUser.fullName})</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={logout}
            className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Log Out Now</span>
          </button>

          <button
            type="button"
            onClick={resetActivity}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Stay Signed In</span>
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-400">
          Philippine DOH EPI Standard · Barangay San Isidro RHU Security Protocol
        </div>
      </div>
    </div>
  );
};
