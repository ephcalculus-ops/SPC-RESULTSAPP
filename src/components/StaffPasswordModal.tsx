import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { 
  verifySuperAdminPassword, 
  verifyStaffPassword, 
  setSuperAdminUnlocked, 
  setStaffPortalUnlocked 
} from '../config/portalSecurity';

interface StaffPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isSuperAdmin?: boolean) => void;
  title?: string;
  description?: string;
}

export const StaffPasswordModal: React.FC<StaffPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Academic Staff & Teachers Portal Gate',
  description = 'Please enter the master staff access password to enter the gradebook and academic management portal.'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setShake(false);
      // Auto-focus input on open
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!password.trim()) {
      setError('Incorrect password. Access denied.');
      setShake(true);
      setIsSubmitting(false);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const trimmed = password.trim();
    if (verifySuperAdminPassword(trimmed)) {
      setSuperAdminUnlocked();
      setIsSubmitting(false);
      onSuccess(true);
      onClose();
    } else if (verifyStaffPassword(trimmed)) {
      if (title.toLowerCase().includes('super admin')) {
        setError('Access Denied: General staff password cannot unlock Super Administrator access. Master password is UPgrade2026.');
        setShake(true);
        setIsSubmitting(false);
        setTimeout(() => setShake(false), 500);
        return;
      }
      setStaffPortalUnlocked();
      setIsSubmitting(false);
      onSuccess(false);
      onClose();
    } else {
      setError('Incorrect password. Access denied.');
      setShake(true);
      setIsSubmitting(false);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-transform duration-200 ${
          shake ? 'animate-bounce' : 'scale-100'
        }`}
        style={shake ? { animation: 'shake 0.4s ease-in-out' } : undefined}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        `}</style>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-[#7a0c0c] to-red-950 px-6 py-5 border-b border-amber-500/40 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-amber-200/80 hover:text-white hover:bg-black/30 transition"
            title="Cancel and return to Public Results Checker"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-amber-300 mb-1.5">
            <div className="p-2 rounded-xl bg-red-900/80 border border-amber-400/60 shadow-inner">
              <Lock className="w-5 h-5 text-amber-300" />
            </div>
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              <span>Staff Security Gate</span>
            </div>
          </div>

          <h3 className="text-lg font-black text-amber-200 font-serif tracking-wide">
            {title}
          </h3>
          <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-900">
          {/* Error Message Box */}
          {error && (
            <div className="p-3.5 bg-red-950/90 border border-red-500 text-red-200 rounded-xl text-xs flex items-center space-x-2.5 shadow-md">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-bold tracking-wide">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-2">
              Staff Master Password *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter staff security password"
                autoComplete="current-password"
                className={`w-full bg-slate-950 border ${
                  error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-amber-500'
                } text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-11 py-3 focus:ring-2 focus:outline-none transition`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-amber-300 p-0.5 rounded transition"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Protected area for St. Paul College verified subject specialists, form teachers, and administrators.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-red-950 font-black text-sm rounded-xl shadow-lg border border-amber-300 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <span>Unlock Staff Portal &amp; Gradebook</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              Cancel / Back to Student &amp; Parent Results
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Student &amp; Parent Result Checker remains completely public</span>
          </p>
        </div>
      </div>
    </div>
  );
};
