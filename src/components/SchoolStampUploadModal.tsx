import React, { useState, useRef, useEffect } from 'react';
import { SchoolSettings, Teacher } from '../types';
import { DEFAULT_OFFICIAL_STAMP } from '../data/mockData';
import { 
  Stamp, 
  Upload, 
  X, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  RotateCw,
  Trash2
} from 'lucide-react';

interface SchoolStampUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  currentUser: Teacher;
  onUpdateSchoolStamp: (stampBase64: string, fileName?: string) => void;
  onRemoveSchoolStamp?: () => void;
  onUpdateSettings?: (updates: Partial<SchoolSettings>) => void;
}

export const SchoolStampUploadModal: React.FC<SchoolStampUploadModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onUpdateSchoolStamp,
  onRemoveSchoolStamp,
  onUpdateSettings,
}) => {
  const [previewStamp, setPreviewStamp] = useState<string>(settings.schoolStamp || DEFAULT_OFFICIAL_STAMP);
  const [uploadedFileName, setUploadedFileName] = useState<string>(settings.schoolStampFileName || 'official-stamp.png');
  const [opacity, setOpacity] = useState<number>(settings.schoolStampOpacity ?? 0.88);
  const [rotation, setRotation] = useState<number>(settings.schoolStampRotation ?? -6);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewStamp(settings.schoolStamp || DEFAULT_OFFICIAL_STAMP);
      setUploadedFileName(settings.schoolStampFileName || 'official-stamp.png');
      setOpacity(settings.schoolStampOpacity ?? 0.88);
      setRotation(settings.schoolStampRotation ?? -6);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, settings.schoolStamp, settings.schoolStampFileName, settings.schoolStampOpacity, settings.schoolStampRotation]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file from your PC (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size is too large (maximum 8MB). Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPreviewStamp(result);
        setUploadedFileName(file.name);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file from your PC. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleResetDefault = () => {
    setPreviewStamp(DEFAULT_OFFICIAL_STAMP);
    setUploadedFileName('default-official-seal.svg');
    setOpacity(0.88);
    setRotation(-6);
    setErrorMessage(null);
  };

  const handleSave = () => {
    try {
      onUpdateSchoolStamp(previewStamp, uploadedFileName);
      if (onUpdateSettings) {
        onUpdateSettings({
          schoolStampOpacity: opacity,
          schoolStampRotation: rotation,
        });
      }
      setSuccessMessage('Official school stamp successfully saved and applied to all student results, report cards, and broadsheets!');
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setErrorMessage('Could not save school stamp. Storage might be full.');
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove the custom uploaded stamp and revert to the default official seal?')) {
      if (onRemoveSchoolStamp) {
        onRemoveSchoolStamp();
      }
      setPreviewStamp(DEFAULT_OFFICIAL_STAMP);
      setUploadedFileName('default-official-seal.svg');
      setSuccessMessage('Restored default official school seal.');
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-300/40 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-amber-300 font-serif">Upload Official School Stamp</h3>
                <span className="bg-amber-400 text-red-950 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-amber-100/80">
                Upload your official school stamp from PC to automatically certify all student results
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
        <div className="p-6 space-y-5 overflow-y-auto max-h-[82vh]">
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

          {/* Upload Dropzone from PC */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
              isDragOver 
                ? 'border-blue-600 bg-blue-50/70 scale-[1.01]' 
                : 'border-slate-300 bg-slate-50 hover:bg-amber-50/30 hover:border-amber-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 mb-3 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              Click to browse your PC or drag & drop school stamp
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Supports PNG (transparent background recommended), JPG, SVG, WebP up to 8MB
            </p>
            {uploadedFileName && (
              <span className="mt-2.5 inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check className="w-3.5 h-3.5 mr-1" />
                Selected: {uploadedFileName}
              </span>
            )}
          </div>

          {/* Stamp Preview on Mock Certificate/Result Sheet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                Live Result Sheet Stamp Preview
              </label>
              <div className="text-[11px] text-slate-500 font-medium">
                Appears on all 200+ Report Cards & Broadsheets
              </div>
            </div>

            <div className="bg-amber-50/40 border-2 border-amber-200/80 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-inner">
              <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm relative">
                {/* Result header mock snippet */}
                <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-[11px] font-black text-[#8f1212] tracking-wider uppercase font-serif">
                      {settings.schoolName || 'ST PAUL COLLEGE'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-sans">
                      OFFICIAL LEARNER'S TERMINAL REPORT SHEET
                    </div>
                  </div>
                  <div className="text-[9px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    SESSION 2025/2026
                  </div>
                </div>

                {/* Simulated signature & stamp certification box */}
                <div className="grid grid-cols-2 gap-4 items-center pt-2">
                  <div className="border border-slate-200 rounded p-2.5 bg-slate-50/60">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">
                      Form Teacher Certification
                    </span>
                    <span className="font-serif italic text-xs text-slate-800 block">
                      Form Teacher Signature
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">Date: 23/07/2026</span>
                  </div>

                  <div className="border border-slate-200 rounded p-2.5 bg-slate-50/60 relative min-h-[90px] flex flex-col justify-between overflow-hidden">
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">
                        Principal Signature & Official Stamp
                      </span>
                      <span className="font-serif italic text-xs text-slate-800 font-bold block mt-0.5">
                        SUPER ADMIN
                      </span>
                    </div>

                    {/* The Live Stamped Image */}
                    <div 
                      className="absolute right-2 bottom-1 pointer-events-none transition-all duration-150"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        opacity: opacity,
                      }}
                    >
                      <img
                        src={previewStamp}
                        alt="Official School Stamp Preview"
                        className="w-20 h-20 object-contain drop-shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stamp Style Controls: Opacity & Rotation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Stamp Opacity:
                </span>
                <span className="font-mono font-bold text-slate-900">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={e => setOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  Stamp Rotation Angle:
                </span>
                <span className="font-mono font-bold text-slate-900">{rotation}°</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={rotation}
                onChange={e => setRotation(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Quick presets or reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Use Default School Seal</span>
            </button>

            {settings.schoolStampFileName && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Custom Stamp</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-red-800 to-red-950 hover:from-red-700 hover:to-red-900 text-amber-300 font-bold text-xs rounded-xl shadow-lg border border-amber-400 hover:text-white transition"
          >
            <Check className="w-4 h-4 text-amber-300" />
            <span>Apply Stamp to All Results</span>
          </button>
        </div>
      </div>
    </div>
  );
};
