import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'gate' | 'compact' | 'footer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, do not display
  if (isInstalled) {
    return null;
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm border ${
            variant === 'gate'
              ? 'bg-amber-400 hover:bg-amber-300 text-red-950 border-amber-300'
              : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-500/70'
          } ${className}`}
          title="Install ST PAUL COLLEGE Portal on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-300" />
          <span>Install App (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border-2 border-amber-400 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-red-900 text-amber-300 flex items-center justify-center font-bold">
                    SPC
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-serif text-red-950">Install on iPhone / iPad</h3>
                    <p className="text-[10px] text-slate-500">ST PAUL COLLEGE Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start space-x-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-red-950 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Tap the Share button</p>
                    <p className="text-[11px] text-slate-500">
                      Tap the <Share2 className="w-3 h-3 inline text-blue-600" /> icon in your Safari bottom toolbar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-red-950 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Add to Home Screen</p>
                    <p className="text-[11px] text-slate-500">
                      Scroll down the options and select <strong className="text-red-900 font-bold">"Add to Home Screen"</strong> (<PlusSquare className="w-3 h-3 inline text-slate-700" />).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px]">
                    The app icon will be installed on your iOS home screen for instant full-screen offline access!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-red-950 py-2.5 text-xs font-bold text-amber-300 hover:bg-black transition shadow-md border border-amber-400"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Android / Chrome / Desktop PWA prompt flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm border ${
          variant === 'gate'
            ? 'bg-amber-400 hover:bg-amber-300 text-red-950 border-amber-300'
            : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-400/80'
        } ${className}`}
        title="Install ST PAUL COLLEGE Portal on this device for offline and app-like access"
      >
        <Download className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
        <span>Install App</span>
      </button>
    );
  }

  // If browser hasn't fired beforeinstallprompt yet (or user already dismissed), provide a clean helper button
  return (
    <button
      onClick={() => {
        alert(
          'To install this application on your device:\n\n• On Chrome / Edge (Desktop): Click the install icon (computer with down arrow) in the browser address bar.\n• On Android (Chrome): Tap the three-dot menu (⋮) and select "Install app" or "Add to Home screen".\n• On iOS (Safari): Tap the Share button and select "Add to Home screen".'
        );
      }}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm border ${
        variant === 'gate'
          ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-200 hover:text-white border-amber-400/40'
          : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border-emerald-500/50'
      } ${className}`}
      title="How to install ST PAUL COLLEGE Portal app"
    >
      <Download className="w-3.5 h-3.5 text-amber-300" />
      <span>Install PWA</span>
    </button>
  );
};
