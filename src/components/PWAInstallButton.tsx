import React, { useState } from 'react';
import { Download, Laptop, Smartphone, HelpCircle, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'navbar' | 'prominent' | 'menuItem' }> = ({
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running inside an installed standalone app, show a subtle check badge or hide
  if (isInstalled) {
    if (variant === 'prominent') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Running as Installed Application</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'navbar' ? (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-2xs whitespace-nowrap"
          title="Install BIRMS as a standalone desktop or phone application"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      ) : variant === 'menuItem' ? (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Install App on this Device</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Install BIRMS App on this Device</span>
        </button>
      )}

      {/* Guide Dialog for users where beforeinstallprompt hasn't fired yet or on iOS/Safari */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">How to Install Application</h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-800 block font-semibold">
                  💻 On Laptop or Desktop (Chrome, Edge, Brave):
                </strong>
                <p>
                  Look at your browser's address bar (top right) and click the <strong>Install App (⊕)</strong> icon, or click the browser menu (⋮) → <strong>"Install Barangay Immunization..."</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-800 block font-semibold">
                  📱 On Android (Chrome):
                </strong>
                <p>
                  Tap the three dots (⋮) at top right and choose <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-800 block font-semibold">
                  🍏 On iPhone / iPad (Safari):
                </strong>
                <p>
                  Tap the <strong>Share</strong> button (box with arrow pointing up) at the bottom, scroll down, and tap <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
