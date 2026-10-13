import React, { useState, useMemo, useRef } from 'react';
import { Student, Teacher, SchoolSettings } from '../types';
import { SCHOOL_CLASSES } from '../data/mockData';
import { compressPassportImage, validateImageFile } from '../utils/imageCompressor';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Sparkles,
  Trash2,
  Users,
  Layers,
  RefreshCw,
  FolderUp,
  FileCheck
} from 'lucide-react';

interface StudentPassportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentUser: Teacher;
  settings?: SchoolSettings;
  initialClass?: string;
  onUpdateStudentPassport: (studentId: string, passportPhotoDataUrl: string) => void;
  onBatchUpdatePassports?: (updates: Array<{ studentId: string; passportPhoto: string }>) => void;
  addLog?: (action: string, details: string) => void;
}

export const StudentPassportUploadModal: React.FC<StudentPassportUploadModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  settings,
  initialClass = 'SSS 1 A',
  onUpdateStudentPassport,
  onBatchUpdatePassports,
  addLog,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(
    currentUser.isFormTeacherOf || initialClass || 'SSS 1 A'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MISSING' | 'UPLOADED'>('ALL');
  const [uploadingStudentId, setUploadingStudentId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hidden per-student file input trigger
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetStudentForFile, setTargetStudentForFile] = useState<Student | null>(null);

  // Batch multi-file input trigger
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const [batchMatchedCount, setBatchMatchedCount] = useState<number | null>(null);
  const [allowBatchOverwrite, setAllowBatchOverwrite] = useState(false);

  // Live Camera Snapshot State
  const [cameraActiveStudent, setCameraActiveStudent] = useState<Student | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === selectedClass)
      .filter(s => {
        if (filterMode === 'MISSING') return !s.passportPhoto;
        if (filterMode === 'UPLOADED') return !!s.passportPhoto;
        return true;
      })
      .filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.learnerId.toLowerCase().includes(q);
      });
  }, [students, selectedClass, filterMode, searchQuery]);

  const totalInClass = students.filter(s => s.className === selectedClass).length;
  const withPhotoInClass = students.filter(s => s.className === selectedClass && !!s.passportPhoto).length;
  const percentage = totalInClass > 0 ? Math.round((withPhotoInClass / totalInClass) * 100) : 0;

  // Authorization check: Only Super Admin, Admin, or the Form Teacher of this class can manage passports
  const isAuthorized = currentUser.role === 'super_admin' || currentUser.role === 'admin' || (currentUser.role === 'form_teacher' && currentUser.isFormTeacherOf === selectedClass);

  // Single Student File Selection handler with identity protection confirmation
  const handleTriggerLocalFile = (student: Student) => {
    if (!isAuthorized) {
      setFeedbackMessage({ type: 'error', text: 'Access Denied: Only Super Admin, Admin, or Assigned Form Teacher can modify student photographs.' });
      return;
    }
    if (student.passportPhoto) {
      const confirmReplace = window.confirm(
        `Identity Protection Alert:\nLearner "${student.name}" (${student.learnerId}) already has an official verified passport photograph on file.\n\nAre you sure you want to replace it? Ensure this photo belongs to this learner to avoid replacing another student's result photo.`
      );
      if (!confirmReplace) return;
    }
    setTargetStudentForFile(student);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetStudentForFile) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFeedbackMessage({ type: 'error', text: validation.error || 'Invalid image file.' });
      return;
    }

    try {
      setUploadingStudentId(targetStudentForFile.id);
      // Compress and optimize passport photo locally (approx 20KB output)
      const compressedDataUrl = await compressPassportImage(file);
      onUpdateStudentPassport(targetStudentForFile.id, compressedDataUrl);

      if (addLog) {
        addLog(
          'Uploaded Student Passport',
          `Verified passport photo uploaded and sealed for ${targetStudentForFile.name} (${targetStudentForFile.learnerId})`
        );
      }

      setFeedbackMessage({
        type: 'success',
        text: `Passport photo verified and sealed for ${targetStudentForFile.name}!`,
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to process local image file.',
      });
    } finally {
      setUploadingStudentId(null);
      setTargetStudentForFile(null);
    }
  };

  // Drag and drop handler for student tile with strict identity confirmation
  const handleDropOnStudent = async (e: React.DragEvent, student: Student) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthorized) {
      setFeedbackMessage({ type: 'error', text: 'Access Denied: Only Super Admin, Admin, or Assigned Form Teacher can update student photographs.' });
      return;
    }

    if (student.passportPhoto) {
      const confirmReplace = window.confirm(
        `Identity Protection Alert:\nLearner "${student.name}" (${student.learnerId}) already has an official passport photo.\n\nAre you sure you want to replace it with the dropped image file?`
      );
      if (!confirmReplace) return;
    }

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFeedbackMessage({ type: 'error', text: validation.error || 'Invalid image file.' });
      return;
    }

    try {
      setUploadingStudentId(student.id);
      const compressedDataUrl = await compressPassportImage(file);
      onUpdateStudentPassport(student.id, compressedDataUrl);

      if (addLog) {
        addLog(
          'Uploaded Student Passport (Drag & Drop)',
          `Verified passport photo attached for ${student.name} (${student.learnerId})`
        );
      }

      setFeedbackMessage({
        type: 'success',
        text: `Passport photo updated for ${student.name}!`,
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to process dropped image file.',
      });
    } finally {
      setUploadingStudentId(null);
    }
  };

  // Generate official College uniform avatar for student
  const handleGenerateUniformAvatar = (student: Student) => {
    const initials = student.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const bgGradient = student.gender === 'MALE' ? '#1e293b' : '#334155';
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360">
        <rect width="300" height="360" fill="#f8fafc" />
        <rect x="8" y="8" width="284" height="344" rx="10" fill="${bgGradient}" />
        <circle cx="150" cy="115" r="58" fill="#fde047" stroke="#ca8a04" stroke-width="4" />
        <text x="150" y="126" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#7a0c0c" text-anchor="middle">${initials}</text>
        <path d="M70,350 C70,225 110,195 150,225 C190,195 230,225 230,350 Z" fill="#7a0c0c" stroke="#f59e0b" stroke-width="3" />
        <polygon points="150,225 142,295 150,315 158,295" fill="#f59e0b" />
        <rect x="20" y="20" width="260" height="24" fill="#ca8a04" rx="4" />
        <text x="150" y="36" font-family="serif" font-size="10" font-weight="bold" fill="#450a0a" text-anchor="middle" letter-spacing="1">${(settings?.schoolName || 'COLLEGE').toUpperCase().substring(0, 32)}</text>
      </svg>
    `.trim();

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    onUpdateStudentPassport(student.id, dataUrl);
    setFeedbackMessage({
      type: 'success',
      text: `Official uniform avatar generated for ${student.name}!`,
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Remove passport
  const handleRemovePassport = (student: Student) => {
    onUpdateStudentPassport(student.id, '');
    setFeedbackMessage({
      type: 'success',
      text: `Removed passport photo for ${student.name}.`,
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Live Camera Snapshot Handlers
  const handleStartCamera = async (student: Student) => {
    setCameraActiveStudent(student);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError('Unable to access camera. Please check browser permissions or use file upload.');
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActiveStudent(null);
    setCameraError(null);
  };

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current || !cameraActiveStudent) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw mirrored video snapshot
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onUpdateStudentPassport(cameraActiveStudent.id, dataUrl);

      handleStopCamera();
      setFeedbackMessage({
        type: 'success',
        text: `Snapshot saved as passport for ${cameraActiveStudent.name}!`,
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setCameraError('Failed to capture snapshot.');
    }
  };

  // Batch Multi-File Upload with Strict Identity Verification (prevents cross-replacing another student's photo)
  const handleBatchFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!isAuthorized) {
      setFeedbackMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin, Admin, or Assigned Form Teacher can upload photos.',
      });
      return;
    }

    const currentClassList = students.filter(s => s.className === selectedClass);
    const updates: Array<{ studentId: string; passportPhoto: string }> = [];
    let matched = 0;
    let skippedExisting = 0;
    let ambiguousCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const fileName = file.name.toLowerCase();
      const cleanFile = fileName.replace(/[^a-z0-9]/g, '');

      // Strict Identity Matching: Match against learner ID or comprehensive full name
      const candidates = currentClassList.filter(s => {
        const idParts = s.learnerId.toLowerCase().replace(/[^a-z0-9]/g, '');
        // 1. Strict Learner ID matching (e.g. "STP/2026/001" or "2026001")
        if (idParts && idParts.length >= 4 && cleanFile.includes(idParts)) {
          return true;
        }

        // 2. Exact full clean name without spaces
        const cleanName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanName.length >= 6 && cleanFile.includes(cleanName)) {
          return true;
        }

        // 3. Multi-token match: requires AT LEAST 2 distinct name tokens (e.g. surname + firstname)
        const nameTokens = s.name.toLowerCase().split(/\s+/).filter(t => t.length >= 3);
        const matchingTokens = nameTokens.filter(tok => fileName.includes(tok));
        if (matchingTokens.length >= 2) {
          return true;
        }

        return false;
      });

      // Disambiguation Guard: If multiple students match, DO NOT assign to avoid wrong photo substitution!
      if (candidates.length > 1) {
        ambiguousCount++;
        continue;
      }

      if (candidates.length === 1) {
        const target = candidates[0];

        // Anti-Replacement Guard: If student already has a photo and overwrite is disabled, preserve existing!
        if (target.passportPhoto && !allowBatchOverwrite) {
          skippedExisting++;
          continue;
        }

        try {
          const compressed = await compressPassportImage(file);
          updates.push({ studentId: target.id, passportPhoto: compressed });
          matched++;
        } catch (err) {
          console.error('Failed to compress batch file:', file.name, err);
        }
      }
    }

    if (updates.length > 0) {
      if (onBatchUpdatePassports) {
        onBatchUpdatePassports(updates);
      } else {
        updates.forEach(u => onUpdateStudentPassport(u.studentId, u.passportPhoto));
      }
      setBatchMatchedCount(matched);

      let msg = `Successfully matched and uploaded ${matched} verified student passport(s) in ${selectedClass}!`;
      if (skippedExisting > 0) {
        msg += ` ${skippedExisting} existing photos preserved (untouched).`;
      }
      if (ambiguousCount > 0) {
        msg += ` ${ambiguousCount} files skipped (ambiguous match).`;
      }

      setFeedbackMessage({
        type: 'success',
        text: msg,
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } else {
      let errorMsg = 'No unambiguous student matches found for the selected files.';
      if (skippedExisting > 0) {
        errorMsg += ` ${skippedExisting} student(s) already have verified photos (toggle "Allow Overwriting" to replace).`;
      }
      if (ambiguousCount > 0) {
        errorMsg += ` ${ambiguousCount} file(s) matched multiple students and were blocked for safety.`;
      }
      setFeedbackMessage({
        type: 'error',
        text: errorMsg,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Hidden file input for single local upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {/* Hidden file input for batch multi-upload */}
      <input
        type="file"
        ref={batchFileInputRef}
        onChange={handleBatchFileSelect}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        className="hidden"
      />

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#7a0c0c] via-[#8f1212] to-[#690707] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-400 text-red-950 rounded-xl shadow">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-serif text-amber-200 tracking-wide flex items-center gap-2">
                Student Passport Upload Center
                <span className="text-[10px] bg-red-950 px-2 py-0.5 rounded-full text-amber-300 font-sans font-bold border border-amber-400/40">
                  Local & Instant
                </span>
              </h2>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Easily upload, take live snapshots, or drag-and-drop passport photos for each student locally.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleStopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-amber-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Snapshot Modal Overlay (if active) */}
        {cameraActiveStudent && (
          <div className="p-4 bg-slate-900 text-white border-b border-amber-500/40 flex flex-col items-center justify-center shrink-0">
            <div className="max-w-md w-full bg-slate-800 rounded-xl p-4 border border-slate-700 text-center space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" />
                Capture Live Passport: {cameraActiveStudent.name}
              </h3>

              {cameraError ? (
                <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-lg text-xs text-red-200">
                  {cameraError}
                </div>
              ) : (
                <div className="relative mx-auto w-56 h-68 bg-black rounded-xl overflow-hidden border-2 border-amber-400 shadow-lg">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {/* Portrait guide oval */}
                  <div className="absolute inset-x-8 inset-y-6 border-2 border-dashed border-amber-400/70 rounded-full pointer-events-none" />
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleStopCamera}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                {!cameraError && (
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Snapshot</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress & Filters Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Class Roster
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                {SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Missing vs Uploaded */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Photo Status
              </label>
              <div className="flex items-center bg-slate-200 p-0.5 rounded-lg border border-slate-300 text-xs">
                {(['ALL', 'MISSING', 'UPLOADED'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-2.5 py-1 font-bold rounded-md transition ${
                      filterMode === mode ? 'bg-white text-red-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'ALL' ? 'All' : mode === 'MISSING' ? 'No Photo' : 'Has Photo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <div className="relative pt-4 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-6.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search student by name or ID..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Group: Batch Upload & Stats */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Stats Pill */}
            <div className="bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium">Coverage:</span>
              <strong className="text-red-950 font-bold">
                {withPhotoInClass} / {totalInClass} ({percentage}%)
              </strong>
            </div>

            {/* Anti-Replacement Safety Toggle */}
            <label className="flex items-center space-x-1.5 text-[11px] text-slate-700 font-semibold cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
              <input
                type="checkbox"
                checked={allowBatchOverwrite}
                onChange={e => setAllowBatchOverwrite(e.target.checked)}
                className="w-3.5 h-3.5 text-red-600 rounded border-slate-300 focus:ring-red-500"
              />
              <span>Allow Overwriting Existing Photos</span>
            </label>

            {/* Batch Upload Multiple Photos */}
            <button
              type="button"
              onClick={() => batchFileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-bold rounded-lg shadow-sm border border-amber-300 transition"
              title="Select multiple photo files from your computer and auto-match strictly to students by name/ID"
            >
              <FolderUp className="w-3.5 h-3.5" />
              <span>Batch Upload Multi-Photos</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Strip */}
        {feedbackMessage && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center space-x-2 shrink-0 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Students Photo Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {classStudents.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm">No learners found matching this criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try switching classes or resetting the filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {classStudents.map(student => {
                const hasPhoto = !!student.passportPhoto;
                const isUploading = uploadingStudentId === student.id;

                return (
                  <div
                    key={student.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropOnStudent(e, student)}
                    className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition p-3.5 flex flex-col justify-between group relative"
                  >
                    {/* Top Student Info */}
                    <div className="flex items-start space-x-3">
                      {/* Photo Box with Drag-and-Drop and Click-to-Upload */}
                      <div
                        onClick={() => handleTriggerLocalFile(student)}
                        className={`w-20 h-24 rounded-lg border-2 shrink-0 overflow-hidden relative cursor-pointer group/photo flex flex-col items-center justify-center transition shadow-2xs ${
                          hasPhoto ? 'border-amber-500 bg-slate-100' : 'border-dashed border-slate-300 bg-slate-50 hover:border-amber-400'
                        }`}
                        title="Click to choose a local image from your computer, or drag & drop a file here"
                      >
                        {hasPhoto ? (
                          <img
                            src={student.passportPhoto}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-1 text-center">
                            <Upload className="w-5 h-5 text-slate-400 group-hover/photo:text-red-900 transition mb-1" />
                            <span className="text-[7.5px] font-bold text-slate-400 group-hover/photo:text-red-900 uppercase leading-tight">
                              DROP / UPLOAD
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-center p-1">
                          <Camera className="w-5 h-5 text-amber-300 mb-0.5" />
                          <span className="text-[8px] font-bold text-amber-200 uppercase">
                            {hasPhoto ? 'Replace' : 'Upload'}
                          </span>
                        </div>

                        {/* Uploading Spinner */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
                            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Info & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            #{student.positionInClass || '-'}
                          </span>
                          <span
                            className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              hasPhoto
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {hasPhoto ? 'Photo Set' : 'Missing'}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5" title={student.name}>
                          {student.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          {student.learnerId}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium">
                          {student.gender} • {student.className}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      {/* Upload from Local PC button */}
                      <button
                        type="button"
                        onClick={() => handleTriggerLocalFile(student)}
                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-red-950/90 hover:bg-red-900 text-white text-[10px] font-bold rounded-md shadow-2xs transition"
                        title="Browse photo from your device"
                      >
                        <Upload className="w-3 h-3 text-amber-400" />
                        <span>Upload</span>
                      </button>

                      {/* Webcam Snapshot button */}
                      <button
                        type="button"
                        onClick={() => handleStartCamera(student)}
                        className="p-1 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-md border border-slate-200 transition"
                        title="Take live webcam snapshot"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {/* Generate Uniform Avatar */}
                      <button
                        type="button"
                        onClick={() => handleGenerateUniformAvatar(student)}
                        className="p-1 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-slate-200 transition"
                        title="Generate official College Uniform avatar"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      </button>

                      {/* Remove Photo */}
                      {hasPhoto && (
                        <button
                          type="button"
                          onClick={() => handleRemovePassport(student)}
                          className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md border border-slate-200 transition"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Passports are compressed and saved directly to your local app storage for instant report cards & printing.
          </div>

          <button
            type="button"
            onClick={() => {
              handleStopCamera();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
