import React, { useState, useRef } from 'react';
import { SchoolSettings, Teacher } from '../types';
import { DEFAULT_SCHOOL_LOGO } from '../data/mockData';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SchoolLogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  currentUser: Teacher;
  onUpdateSchoolLogo: (logoDataUrl: string) => void;
}

export const SchoolLogoUploadModal: React.FC<SchoolLogoUploadModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onUpdateSchoolLogo,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(settings.schoolLogo || DEFAULT_SCHOOL_LOGO);
  const [urlInput, setUrlInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPreviewUrl(settings.schoolLogo || DEFAULT_SCHOOL_LOGO);
      setErrorMessage(null);
      setSuccessMessage(null);
      setUrlInput('');
    }
  }, [isOpen, settings.schoolLogo]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size is too large (maximum 5MB). Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPreviewUrl(result);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setPreviewUrl(urlInput.trim());
    setErrorMessage(null);
  };

  const handleResetDefault = () => {
    setPreviewUrl(DEFAULT_SCHOOL_LOGO);
    setErrorMessage(null);
  };

  const handleSave = () => {
    try {
      onUpdateSchoolLogo(previewUrl);
      setSuccessMessage('Official school logo updated successfully! All report cards and broadsheets will reflect this crest.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMessage('Could not save logo. Storage might be full.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-300/40 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Modal Header with School Red & Gold */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-amber-300 font-serif">Upload Official School Logo</h3>
                <span className="bg-amber-400 text-red-950 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-amber-100/80">
                Official crest for {settings.schoolName || 'ST PAUL COLLEGE'} report cards & broadsheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-red-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current Logo Preview Section */}
          <div className="bg-gradient-to-br from-amber-50/50 to-red-50/30 p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-white p-2 shadow-lg border-2 border-amber-500 flex items-center justify-center overflow-hidden">
                <img
                  src={previewUrl}
                  alt="School Crest Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-red-900 text-amber-400 border border-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                Preview
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Active School Crest & Insignia</span>
              </div>
              <div className="text-sm font-bold text-slate-800 font-serif">
                {settings.schoolName || 'ST PAUL COLLEGE'}
              </div>
              <p className="text-xs text-slate-500">
                This logo will appear prominently on all Terminal Report Sheets, Broadsheets, and Official Transcripts.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="inline-flex items-center space-x-1 text-xs text-amber-800 hover:text-amber-900 font-semibold px-2.5 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Use St Paul Red & Gold Crest</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upload Method 1: Local File Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Logo File (From Computer / Device)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-amber-50/40 cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-800 group-hover:scale-110 transition flex items-center justify-center shadow-sm">
                <Upload className="w-6 h-6 text-red-800" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                Click to browse or drag & drop school logo
              </div>
              <div className="text-[11px] text-slate-500">
                Recommended: Square or crest logo with transparent background (PNG, JPG, SVG) • Max 5MB
              </div>
            </div>
          </div>

          {/* Upload Method 2: Image Web URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Or Enter Direct Image URL
            </label>
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://example.com/school-crest.png"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                Load URL
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Uploaded by: <strong className="text-slate-800">{currentUser.name}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 rounded-xl shadow-md border border-amber-400 transition"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Save Official Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
