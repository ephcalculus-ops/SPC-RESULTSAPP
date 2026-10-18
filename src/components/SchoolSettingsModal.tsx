import React, { useState } from 'react';
import { 
  School, 
  Settings, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Upload, 
  ShieldCheck, 
  Palette, 
  BookOpen, 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Sliders, 
  Stamp, 
  Layers, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Calendar, 
  Clock, 
  FileSpreadsheet, 
  Save,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { SchoolSettings, SchoolThemeId, Teacher, GradeScaleItem, SchoolSection } from '../types';
import { SCHOOL_THEMES, getThemeConfig } from '../utils/theme';
import { 
  SCHOOL_CLASSES, 
  JUNIOR_SUBJECTS, 
  SENIOR_SUBJECTS, 
  DEFAULT_OFFICIAL_STAMP, 
  DEFAULT_SCHOOL_LOGO,
  generateSchoolCrestSvg, 
  generateSchoolStampSvg 
} from '../data/mockData';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  currentUser: Teacher;
  onUpdateSettings: (updates: Partial<SchoolSettings>) => void;
  onAddClass?: (className: string) => void;
  onRemoveClass?: (className: string) => void;
  onAddSubject?: (subject: string, section: SchoolSection) => void;
  onRemoveSubject?: (subject: string, section: SchoolSection) => void;
  onOpenPercentageModal?: () => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onUpdateSettings,
  onAddClass,
  onRemoveClass,
  onAddSubject,
  onRemoveSubject,
  onOpenPercentageModal,
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'branding' | 'classes' | 'subjects' | 'academics'>('identity');

  // Form State initialized with settings
  const [schoolName, setSchoolName] = useState(settings.schoolName || 'ST PAUL COLLEGE');
  const [schoolMotto, setSchoolMotto] = useState(settings.schoolMotto || 'PRO DEO ET PATRIA');
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress || 'JEREMIAH USENI ROAD, NEW KUTUNKU, GWAGWALADA, FCT ABUJA');
  const [schoolEmail, setSchoolEmail] = useState(settings.schoolEmail || 'stpaulcollege@abjce.org.ng');
  const [schoolPhone, setSchoolPhone] = useState(settings.schoolPhone || '+234 803 123 4567');
  const [principalName, setPrincipalName] = useState(settings.principalName || 'REV. FR. PRINCIPAL / SUPER ADMIN');
  const [examOfficerName, setExamOfficerName] = useState(settings.examOfficerName || '');
  const [session, setSession] = useState(settings.session || '2025/2026');
  const [term, setTerm] = useState(settings.term || 'Third Term');
  const [daysSchoolOpened, setDaysSchoolOpened] = useState(settings.daysSchoolOpened || 114);
  const [nextTermResumption, setNextTermResumption] = useState(settings.nextTermResumption || '07/09/26');
  const [learnerIdPrefix, setLearnerIdPrefix] = useState(settings.learnerIdPrefix || 'STP/');
  const [staffIdPrefix, setStaffIdPrefix] = useState(settings.staffIdPrefix || 'STP/TCH/');
  const [isTermLocked, setIsTermLocked] = useState(Boolean(settings.isTermLocked));
  const [allowAllTeachersScoreEntry, setAllowAllTeachersScoreEntry] = useState(Boolean(settings.allowAllTeachersScoreEntry));
  const [theme, setTheme] = useState<SchoolThemeId>(settings.theme || 'crimson-gold');

  // Stamp Sliders
  const [stampOpacity, setStampOpacity] = useState(settings.schoolStampOpacity ?? 0.88);
  const [stampRotation, setStampRotation] = useState(settings.schoolStampRotation ?? -6);

  // New Class Input
  const [newClassName, setNewClassName] = useState('');
  // New Subject Input
  const [newJuniorSubject, setNewJuniorSubject] = useState('');
  const [newSeniorSubject, setNewSeniorSubject] = useState('');

  // Notification status
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveIdentity = () => {
    onUpdateSettings({
      schoolName: schoolName.trim().toUpperCase(),
      schoolMotto: schoolMotto.trim(),
      schoolAddress: schoolAddress.trim().toUpperCase(),
      schoolEmail: schoolEmail.trim(),
      schoolPhone: schoolPhone.trim(),
      principalName: principalName.trim(),
      examOfficerName: examOfficerName.trim(),
      session: session.trim(),
      term: term.trim(),
      daysSchoolOpened: Number(daysSchoolOpened) || 114,
      nextTermResumption: nextTermResumption.trim(),
      learnerIdPrefix: learnerIdPrefix.trim(),
      staffIdPrefix: staffIdPrefix.trim(),
      isTermLocked,
      allowAllTeachersScoreEntry,
    });
    setSaveMessage('School details and academic settings updated successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveBranding = () => {
    onUpdateSettings({
      theme,
      schoolStampOpacity: stampOpacity,
      schoolStampRotation: stampRotation,
    });
    setSaveMessage('Branding theme, stamp opacity and rotation applied across all reports!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Upload Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateSettings({ schoolLogo: event.target.result as string });
          setSaveMessage('Custom school crest logo uploaded successfully!');
          setTimeout(() => setSaveMessage(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Stamp
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateSettings({ 
            schoolStamp: event.target.result as string,
            schoolStampFileName: file.name,
            schoolStampUploadedAt: new Date().toISOString()
          });
          setSaveMessage('Official school stamp uploaded from PC! Stamped on all terminal reports.');
          setTimeout(() => setSaveMessage(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Regenerate Vector Crest
  const handleRegenerateCrest = () => {
    const themeCfg = getThemeConfig(theme);
    const newCrest = generateSchoolCrestSvg(schoolName, themeCfg.primaryColor, themeCfg.accentColor);
    onUpdateSettings({ schoolLogo: newCrest });
    setSaveMessage('Regenerated official heraldic crest matching your school name and theme!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Regenerate Vector Stamp
  const handleRegenerateStamp = () => {
    const newStamp = generateSchoolStampSvg(schoolName, schoolAddress, schoolMotto);
    onUpdateSettings({ 
      schoolStamp: newStamp,
      schoolStampFileName: 'vector-official-stamp.svg',
      schoolStampUploadedAt: new Date().toISOString()
    });
    setSaveMessage('Regenerated official rubber seal with your school title and motto!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Class Management
  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    if (onAddClass) {
      onAddClass(newClassName.trim());
      setNewClassName('');
    }
  };

  // Subject Management
  const handleAddJuniorSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJuniorSubject.trim()) return;
    if (onAddSubject) {
      onAddSubject(newJuniorSubject.trim(), 'JUNIOR');
      setNewJuniorSubject('');
    }
  };

  const handleAddSeniorSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeniorSubject.trim()) return;
    if (onAddSubject) {
      onAddSubject(newSeniorSubject.trim(), 'SENIOR');
      setNewSeniorSubject('');
    }
  };

  const currentThemeCfg = getThemeConfig(theme);
  const activeClasses = settings.classes && settings.classes.length > 0 ? settings.classes : SCHOOL_CLASSES;
  const activeJuniorSubjects = settings.juniorSubjects && settings.juniorSubjects.length > 0 ? settings.juniorSubjects : JUNIOR_SUBJECTS;
  const activeSeniorSubjects = settings.seniorSubjects && settings.seniorSubjects.length > 0 ? settings.seniorSubjects : SENIOR_SUBJECTS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-amber-400 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-4 text-slate-100 max-h-[94vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-red-950 via-[#7a0c0c] to-red-950 border-b border-amber-500/50 p-4 sm:p-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center shadow-lg font-black shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-red-950 uppercase tracking-wider">
                  Super Administrator Directorate Hub
                </span>
                <span className="text-xs text-amber-300 font-mono">100% Adjustable Parameters</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-serif text-amber-200 mt-0.5 truncate">
                {settings.schoolName} — School Settings &amp; Customization
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-300 hover:text-white hover:bg-red-900/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-slate-950 px-4 sm:px-6 border-b border-slate-800 flex flex-wrap gap-2 py-2.5 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'identity'
                ? 'bg-amber-400 text-red-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Identity &amp; Officers</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'branding'
                ? 'bg-amber-400 text-red-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Branding &amp; Official Stamp</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'classes'
                ? 'bg-amber-400 text-red-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Classes &amp; Arms ({activeClasses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'subjects'
                ? 'bg-amber-400 text-red-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Curriculum &amp; Subjects</span>
          </button>

          <button
            onClick={() => setActiveTab('academics')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'academics'
                ? 'bg-amber-400 text-red-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>CA Splits &amp; Grading System</span>
          </button>
        </div>

        {/* Save message notification */}
        {saveMessage && (
          <div className="bg-emerald-950 border-b border-emerald-500/50 px-6 py-2.5 text-xs text-emerald-200 flex items-center space-x-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ============================================================ */}
          {/* TAB 1: IDENTITY & LEADERSHIP                                 */}
          {/* ============================================================ */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <School className="w-4 h-4 text-amber-400" />
                  <span>Official Institutional Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Official School Name *
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={e => setSchoolName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Appears on report sheet headers, certificates, official broadsheets, and transcripts.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      School Motto / Slogan
                    </label>
                    <input
                      type="text"
                      value={schoolMotto}
                      onChange={e => setSchoolMotto(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Campus Physical Location
                    </label>
                    <input
                      type="text"
                      value={schoolAddress}
                      onChange={e => setSchoolAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      value={schoolEmail}
                      onChange={e => setSchoolEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Official Contact Phone
                    </label>
                    <input
                      type="text"
                      value={schoolPhone}
                      onChange={e => setSchoolPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Officers & Academic Year Config */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Academic Directorate &amp; Term Scheduling</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Principal Title &amp; Signature Name
                    </label>
                    <input
                      type="text"
                      value={principalName}
                      onChange={e => setPrincipalName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Examination Officer Name
                    </label>
                    <input
                      type="text"
                      value={examOfficerName}
                      onChange={e => setExamOfficerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Current Academic Session
                    </label>
                    <input
                      type="text"
                      value={session}
                      onChange={e => setSession(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Active Term
                    </label>
                    <select
                      value={term}
                      onChange={e => setTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="First Term">First Term</option>
                      <option value="Second Term">Second Term</option>
                      <option value="Third Term">Third Term</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Total Days School Opened
                    </label>
                    <input
                      type="number"
                      value={daysSchoolOpened}
                      onChange={e => setDaysSchoolOpened(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Next Term Resumption Date
                    </label>
                    <input
                      type="text"
                      value={nextTermResumption}
                      onChange={e => setNextTermResumption(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ID Prefixes & Lock Control */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>ID Generation &amp; Academic Security Controls</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Student Learner ID Prefix
                    </label>
                    <input
                      type="text"
                      value={learnerIdPrefix}
                      onChange={e => setLearnerIdPrefix(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Staff ID Prefix
                    </label>
                    <input
                      type="text"
                      value={staffIdPrefix}
                      onChange={e => setStaffIdPrefix(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <input
                      type="checkbox"
                      id="lockTermToggle"
                      checked={isTermLocked}
                      onChange={e => setIsTermLocked(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700"
                    />
                    <label htmlFor="lockTermToggle" className="text-xs cursor-pointer">
                      <span className="font-bold text-amber-300 block">Lock Term (Freeze Score Entry)</span>
                      <span className="text-[11px] text-slate-400">
                        When enabled, subject teachers cannot alter submitted marks. Only Super Admin can edit.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <input
                      type="checkbox"
                      id="allowEntryToggle"
                      checked={allowAllTeachersScoreEntry}
                      onChange={e => setAllowAllTeachersScoreEntry(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700"
                    />
                    <label htmlFor="allowEntryToggle" className="text-xs cursor-pointer">
                      <span className="font-bold text-amber-300 block">Open Teacher Score Entry</span>
                      <span className="text-[11px] text-slate-400">
                        When enabled, all verified teachers can record scores across any allocated class.
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveIdentity}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-black text-xs shadow-lg border border-amber-300 flex items-center space-x-2 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile &amp; Identity Updates</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: BRANDING & OFFICIAL STAMP                             */}
          {/* ============================================================ */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* Theme Scheme */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Official School Brand Palette &amp; Theme</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(SCHOOL_THEMES) as SchoolThemeId[]).map(themeKey => {
                    const t = SCHOOL_THEMES[themeKey];
                    const isSelected = theme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setTheme(themeKey)}
                        className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/50 shadow-lg' 
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span 
                              className="w-4 h-4 rounded-full border border-white/40 shrink-0" 
                              style={{ backgroundColor: t.primaryColor }} 
                            />
                            <span 
                              className="w-4 h-4 rounded-full border border-white/40 shrink-0" 
                              style={{ backgroundColor: t.accentColor }} 
                            />
                            <span className="font-bold text-xs text-white truncate">{t.name}</span>
                          </div>
                          <div className={`mt-2 h-2 rounded-full bg-gradient-to-r ${t.headerStrip}`} />
                        </div>
                        {isSelected && (
                          <div className="mt-2 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active Theme</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo & Stamp Previews & Customizers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Official Crest Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Official School Crest / Logo</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Rendered on broadsheets, learner result sheets, and portal headers.
                    </p>

                    <div className="mt-4 flex items-center space-x-4">
                      <div className="w-24 h-24 rounded-2xl bg-white p-2 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-lg">
                        <img 
                          src={settings.schoolLogo || DEFAULT_SCHOOL_LOGO} 
                          alt="School Crest" 
                          className="max-h-full max-w-full object-contain" 
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload From PC</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={handleRegenerateCrest}
                          className="block text-xs text-amber-400 hover:underline font-bold"
                        >
                          Regenerate Vector Crest ↻
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Stamp & Seal Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Stamp className="w-4 h-4 text-amber-400" />
                      <span>Official Rubber Stamp &amp; Seal</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Certified institutional stamp displayed on official terminal report cards.
                    </p>

                    <div className="mt-4 flex items-center space-x-4">
                      <div className="w-24 h-24 rounded-2xl bg-white p-2 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                        <img 
                          src={settings.schoolStamp || DEFAULT_OFFICIAL_STAMP} 
                          alt="School Stamp" 
                          className="max-h-full max-w-full object-contain transition-transform" 
                          style={{
                            opacity: stampOpacity,
                            transform: `rotate(${stampRotation}deg)`
                          }}
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Rubber Stamp</span>
                          <input type="file" accept="image/*" onChange={handleStampUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={handleRegenerateStamp}
                          className="block text-xs text-amber-400 hover:underline font-bold"
                        >
                          Regenerate Vector Seal ↻
                        </button>
                      </div>
                    </div>

                    {/* Opacity & Rotation Sliders */}
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Stamp Opacity</span>
                          <span className="font-mono text-amber-400">{Math.round(stampOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.05"
                          value={stampOpacity}
                          onChange={e => setStampOpacity(parseFloat(e.target.value))}
                          className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Natural Imprint Angle</span>
                          <span className="font-mono text-amber-400">{stampRotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          step="1"
                          value={stampRotation}
                          onChange={e => setStampRotation(parseInt(e.target.value))}
                          className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveBranding}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-black text-xs shadow-lg border border-amber-300 flex items-center space-x-2 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Apply Branding &amp; Stamp Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: CLASSES & ARMS MANAGEMENT                             */}
          {/* ============================================================ */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>Class Roster &amp; Academic Sections ({activeClasses.length} Classes)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Add, delete, or organize class arms. Gradebooks and broadsheets automatically filter by these classes.
                    </p>
                  </div>

                  {/* Add Class Form */}
                  <form onSubmit={handleAddClassSubmit} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. JSS 1 C, GRADE 7"
                      value={newClassName}
                      onChange={e => setNewClassName(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newClassName.trim()}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-red-950 font-bold text-xs flex items-center space-x-1 transition disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Class</span>
                    </button>
                  </form>
                </div>

                {/* Class Pills Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {activeClasses.map(cls => {
                    const isJunior = cls.toUpperCase().startsWith('JSS') || cls.toUpperCase().includes('JUNIOR');
                    return (
                      <div
                        key={cls}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white block truncate">{cls}</span>
                          <span className={`text-[10px] uppercase font-semibold ${isJunior ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {isJunior ? 'Junior Sec.' : 'Senior Sec.'}
                          </span>
                        </div>
                        {onRemoveClass && activeClasses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveClass(cls)}
                            className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition opacity-60 group-hover:opacity-100"
                            title={`Remove ${cls}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: SUBJECTS & CURRICULUM MANAGEMENT                      */}
          {/* ============================================================ */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              {/* Junior Section Subjects */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>Junior Secondary Curriculum ({activeJuniorSubjects.length} Subjects)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Subjects offered in JSS 1, JSS 2, and JSS 3 classes.
                    </p>
                  </div>

                  <form onSubmit={handleAddJuniorSubjectSubmit} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. FRENCH, MUSIC"
                      value={newJuniorSubject}
                      onChange={e => setNewJuniorSubject(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newJuniorSubject.trim()}
                      className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center space-x-1 transition disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Subject</span>
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {activeJuniorSubjects.map(sub => (
                    <div
                      key={sub}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition"
                    >
                      <span className="font-semibold text-xs text-slate-200 truncate pr-2">{sub}</span>
                      {onRemoveSubject && activeJuniorSubjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveSubject(sub, 'JUNIOR')}
                          className="p-1 rounded text-slate-500 hover:text-red-400 transition opacity-50 group-hover:opacity-100"
                          title={`Remove ${sub}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Senior Section Subjects */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Senior Secondary Curriculum ({activeSeniorSubjects.length} Subjects)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Subjects offered in SSS 1, SSS 2, and SSS 3 classes.
                    </p>
                  </div>

                  <form onSubmit={handleAddSeniorSubjectSubmit} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. TECHNICAL DRAWING"
                      value={newSeniorSubject}
                      onChange={e => setNewSeniorSubject(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newSeniorSubject.trim()}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-red-950 font-bold text-xs flex items-center space-x-1 transition disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Subject</span>
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {activeSeniorSubjects.map(sub => (
                    <div
                      key={sub}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition"
                    >
                      <span className="font-semibold text-xs text-slate-200 truncate pr-2">{sub}</span>
                      {onRemoveSubject && activeSeniorSubjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveSubject(sub, 'SENIOR')}
                          className="p-1 rounded text-slate-500 hover:text-red-400 transition opacity-50 group-hover:opacity-100"
                          title={`Remove ${sub}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: CA WEIGHTS & OFFICIAL GRADING SCALE                   */}
          {/* ============================================================ */}
          {activeTab === 'academics' && (
            <div className="space-y-6">
              {/* Summary of Current CA Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Junior Continuous Assessment &amp; Exam Split</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">CA 1 Test Max:</span>
                      <span className="font-mono text-cyan-300 font-bold">{settings.juniorCAConfig.ca1Max} marks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">CA 2 Test Max:</span>
                      <span className="font-mono text-cyan-300 font-bold">{settings.juniorCAConfig.ca2Max} marks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">CA 3 Project Max:</span>
                      <span className="font-mono text-cyan-300 font-bold">{settings.juniorCAConfig.ca3Max} marks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">CA 4 Assignment Max:</span>
                      <span className="font-mono text-cyan-300 font-bold">{settings.juniorCAConfig.ca4Max} marks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Terminal Exam Max:</span>
                      <span className="font-mono text-cyan-300 font-bold">{settings.juniorCAConfig.examMax} marks</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold">
                      <span className="text-white">Total Continuous Assessment:</span>
                      <span className="font-mono text-emerald-400">
                        {settings.juniorCAConfig.ca1Max + settings.juniorCAConfig.ca2Max + settings.juniorCAConfig.ca3Max + settings.juniorCAConfig.ca4Max + settings.juniorCAConfig.examMax}% (100% Rule)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Senior Continuous Assessment &amp; Exam Split</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">CA 1 Test Max:</span>
                      <span className="font-mono text-amber-300 font-bold">{settings.seniorCAConfig.ca1Max} marks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">CA 2 Test Max:</span>
                      <span className="font-mono text-amber-300 font-bold">{settings.seniorCAConfig.ca2Max} marks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">CA 3 Test Max:</span>
                      <span className="font-mono text-amber-300 font-bold">{settings.seniorCAConfig.ca3Max} marks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">CA 4 (Not used in SSS):</span>
                      <span className="font-mono text-amber-300 font-bold">{settings.seniorCAConfig.ca4Max} marks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Terminal Exam Max:</span>
                      <span className="font-mono text-amber-300 font-bold">{settings.seniorCAConfig.examMax} marks</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold">
                      <span className="text-white">Total Continuous Assessment:</span>
                      <span className="font-mono text-emerald-400">
                        {settings.seniorCAConfig.ca1Max + settings.seniorCAConfig.ca2Max + settings.seniorCAConfig.ca3Max + settings.seniorCAConfig.ca4Max + settings.seniorCAConfig.examMax}% (100% Rule)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Launch Button to Full Dedicated Sliders & Grading Editor Modal */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-2 border-amber-400/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Interactive Percentage Weights &amp; Official Grading Scale Editor
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Adjust score sliders with real-time 100% sum validation, edit grading boundaries (A, B, C, D, E, F), update remarks, and simulate marks directly.
                  </p>
                </div>
                {onOpenPercentageModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPercentageModal();
                    }}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-black text-xs shadow-lg border border-amber-300 flex items-center space-x-2 shrink-0 transition"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Open Score Percentages &amp; Scale Editor →</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 sm:px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Current School: <span className="font-bold text-amber-300">{settings.schoolName}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
