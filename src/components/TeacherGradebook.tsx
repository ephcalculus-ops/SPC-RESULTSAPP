import React, { useState, useMemo, useEffect } from 'react';
import { Student, Teacher, SchoolSettings } from '../types';
import { 
  SCHOOL_CLASSES, 
  calculateGrade, 
  computeTotal, 
  isJuniorClass, 
  getSubjectsForClass, 
  getCAConfig,
  normalizeClass,
  isClassMatch,
  DEFAULT_GRADING_SCALE,
  getGradeRemark
} from '../data/mockData';
import { 
  Lock, 
  Unlock, 
  Save, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Sparkles,
  Award,
  AlertCircle,
  FileSpreadsheet,
  UserPlus,
  Upload,
  BookOpen,
  MessageSquare,
  Camera,
  Sliders,
  LogIn,
  Smartphone
} from 'lucide-react';
import { ScoreUploadModal } from './ScoreUploadModal';

interface TeacherGradebookProps {
  students: Student[];
  currentUser: Teacher;
  settings: SchoolSettings;
  activeTerm?: string;
  onSelectTerm?: (term: string) => void;
  canEditSubject: (className: string, subject: string) => boolean;
  updateStudentScore: (
    studentId: string,
    subject: string,
    ca1: number | null,
    ca2: number | null,
    ca3: number | null,
    ca4: number | null,
    exam: number | null,
    status?: 'draft' | 'submitted' | 'approved',
    termParam?: string
  ) => void;
  batchUpdateSubjectScores: (
    className: string,
    subject: string,
    updates: { studentId: string; ca1: number | null; ca2: number | null; ca3: number | null; ca4: number | null; exam: number | null }[],
    termParam?: string
  ) => void;
  onOpenSyncModal: () => void;
  onOpenTeacherSignupModal?: (mode?: 'signup' | 'login') => void;
  onOpenClassCommentsModal?: (initialClass?: string) => void;
  onOpenPassportModal?: (initialClass?: string) => void;
  onOpenDirectScoreModal?: (initialClass?: string, initialSubject?: string) => void;
  onOpenMissingMarksModal?: (initialClass?: string, initialSubject?: string) => void;
  onOpenPercentageModal?: () => void;
  addLog?: (action: string, details: string) => void;
}

export const TeacherGradebook: React.FC<TeacherGradebookProps> = ({
  students,
  currentUser,
  settings,
  activeTerm,
  onSelectTerm,
  canEditSubject,
  updateStudentScore,
  batchUpdateSubjectScores,
  onOpenSyncModal,
  onOpenTeacherSignupModal,
  onOpenClassCommentsModal,
  onOpenPassportModal,
  onOpenDirectScoreModal,
  onOpenMissingMarksModal,
  onOpenPercentageModal,
  addLog,
}) => {
  const isStaffAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer';

  // Allowed classes: Super admins & exam officers can access all; teachers can access their assigned classes (or form class)
  const allowedClasses = useMemo(() => {
    if (isStaffAdmin) return SCHOOL_CLASSES;
    const list = [...(currentUser.assignedClasses || [])];
    if (currentUser.isFormTeacherOf && !list.includes(currentUser.isFormTeacherOf)) {
      list.push(currentUser.isFormTeacherOf);
    }
    // Expand any grade-level assignments (e.g. "JSS 3" -> "JSS 3 A", "JSS 3 B")
    const expanded: string[] = [];
    for (const c of list) {
      const matchingSchoolClasses = SCHOOL_CLASSES.filter(sc => isClassMatch(sc, c));
      if (matchingSchoolClasses.length > 0) {
        expanded.push(...matchingSchoolClasses);
      } else {
        expanded.push(normalizeClass(c));
      }
    }
    return expanded.length > 0 ? Array.from(new Set(expanded)) : ['JSS 1 A'];
  }, [isStaffAdmin, currentUser.assignedClasses, currentUser.isFormTeacherOf]);

  // Pre-select teacher's assigned class and subject if possible
  const defaultClass = allowedClasses[0] || 'JSS 1 A';
  const defaultSubject = currentUser.assignedSubjects?.[0] || 'AGRICULTURAL SCIENCE';

  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubject);
  const [gradebookTerm, setGradebookTerm] = useState<string>(
    activeTerm === 'Cumulative' ? 'Third Term' : (activeTerm || 'Third Term')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Sync gradebookTerm when activeTerm changes from outside
  useEffect(() => {
    if (activeTerm) {
      setGradebookTerm(activeTerm === 'Cumulative' ? 'Third Term' : activeTerm);
    }
  }, [activeTerm]);

  // Sync class & subject when currentUser changes (e.g. after teacher signup or switch)
  useEffect(() => {
    const normSelected = normalizeClass(selectedClass);
    if (allowedClasses.length > 0 && !allowedClasses.includes(normSelected as any)) {
      setSelectedClass(allowedClasses[0]);
    }
    if (currentUser.assignedSubjects && currentUser.assignedSubjects.length > 0) {
      const cleanSubj = selectedSubject.trim().toLowerCase();
      const hasSubj = currentUser.assignedSubjects.some(
        s => s.trim().toLowerCase() === cleanSubj || s.replace(/\s+/g, '').toLowerCase() === cleanSubj.replace(/\s+/g, '')
      );
      if (!hasSubj) {
        setSelectedSubject(currentUser.assignedSubjects[0]);
      }
    }
  }, [currentUser, allowedClasses]);

  // Section config
  const isJunior = isJuniorClass(selectedClass);
  const classCurriculumSubjects = useMemo(() => getSubjectsForClass(selectedClass), [selectedClass]);
  const caConfig = useMemo(() => getCAConfig(selectedClass, settings), [selectedClass, settings]);

  // Allowed subjects: admin gets all; teacher gets their assigned subjects valid for this class
  const allowedSubjects = useMemo(() => {
    if (isStaffAdmin) return classCurriculumSubjects;
    const assigned = currentUser.assignedSubjects || [];
    const validInClass = assigned.filter(subj => classCurriculumSubjects.some(
      cs => cs.trim().toLowerCase() === subj.trim().toLowerCase()
    ));
    return validInClass.length > 0 ? validInClass : assigned;
  }, [isStaffAdmin, classCurriculumSubjects, currentUser.assignedSubjects]);

  // Keep subject in sync with class
  useEffect(() => {
    if (!allowedSubjects.includes(selectedSubject as any)) {
      setSelectedSubject(allowedSubjects[0] || 'MATHEMATICS');
    }
  }, [selectedClass, allowedSubjects, selectedSubject]);

  // Check RBAC permission for current teacher on selectedClass & selectedSubject
  const hasEditPermission = canEditSubject(selectedClass, selectedSubject);

  // Filter students for this class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === selectedClass)
      .filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.learnerId.toLowerCase().includes(q);
      });
  }, [students, selectedClass, searchQuery]);

  // Statistics for this subject & class in the active gradebook term
  const stats = useMemo(() => {
    const allScores = students
      .filter(s => s.className === selectedClass)
      .map(s => {
        const sc = s.termScores?.[gradebookTerm]?.[selectedSubject] || s.scores[selectedSubject];
        return sc?.total || 0;
      });

    if (allScores.length === 0) return { avg: 0, high: 0, low: 0, passRate: 0 };

    const sum = allScores.reduce((a, b) => a + b, 0);
    const avg = Number((sum / allScores.length).toFixed(1));
    const high = Math.max(...allScores);
    const low = Math.min(...allScores);
    const passCount = allScores.filter(sc => sc >= 50).length;
    const passRate = Number(((passCount / allScores.length) * 100).toFixed(1));

    return { avg, high, low, passRate };
  }, [students, selectedClass, selectedSubject, gradebookTerm]);

  // Track how many students have continuous assessment or exam scores entered
  const scoredCount = useMemo(() => {
    return classStudents.filter(s => {
      const sc = s.termScores?.[gradebookTerm]?.[selectedSubject] || s.scores[selectedSubject];
      return sc && (sc.ca1 !== null || sc.ca2 !== null || sc.ca3 !== null || sc.ca4 !== null || sc.exam !== null);
    }).length;
  }, [classStudents, selectedSubject, gradebookTerm]);

  const scoreCompletionPercent = classStudents.length > 0 
    ? Math.round((scoredCount / classStudents.length) * 100) 
    : 0;

  // Track how many students in the current view have missing CA or exam marks
  const missingCountInCurrentView = useMemo(() => {
    return classStudents.filter(s => {
      const sc = s.termScores?.[gradebookTerm]?.[selectedSubject] || s.scores[selectedSubject];
      if (!sc) return true;
      return sc.ca1 === null || sc.ca2 === null || sc.ca3 === null || sc.ca4 === null || sc.exam === null;
    }).length;
  }, [classStudents, selectedSubject, gradebookTerm]);

  const handleScoreChange = (
    studentId: string,
    field: 'ca1' | 'ca2' | 'ca3' | 'ca4' | 'exam',
    valueStr: string
  ) => {
    if (!hasEditPermission) return;

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentScore = student.termScores?.[gradebookTerm]?.[selectedSubject] || student.scores[selectedSubject] || {
      ca1: 0,
      ca2: 0,
      ca3: 0,
      ca4: 0,
      exam: 0,
      total: 0,
      grade: 'F',
    };

    let numVal: number | null = valueStr === '' ? null : Number(valueStr);
    if (numVal !== null && isNaN(numVal)) return;

    // Enforce maximum marks per active section (Junior vs Senior)
    if (numVal !== null) {
      if (field === 'ca1') numVal = Math.min(caConfig.ca1Max, Math.max(0, numVal));
      if (field === 'ca2') numVal = Math.min(caConfig.ca2Max, Math.max(0, numVal));
      if (field === 'ca3') numVal = Math.min(caConfig.ca3Max, Math.max(0, numVal));
      if (field === 'ca4') numVal = Math.min(caConfig.ca4Max, Math.max(0, numVal));
      if (field === 'exam') numVal = Math.min(caConfig.examMax, Math.max(0, numVal));
    }

    const updatedCa1 = field === 'ca1' ? numVal : currentScore.ca1;
    const updatedCa2 = field === 'ca2' ? numVal : currentScore.ca2;
    const updatedCa3 = field === 'ca3' ? numVal : currentScore.ca3;
    const updatedCa4 = field === 'ca4' ? numVal : currentScore.ca4;
    const updatedExam = field === 'exam' ? numVal : currentScore.exam;

    updateStudentScore(
      studentId,
      selectedSubject,
      updatedCa1,
      updatedCa2,
      updatedCa3,
      updatedCa4,
      updatedExam,
      'submitted',
      gradebookTerm
    );

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleBatchFillRandom = () => {
    if (!hasEditPermission) return;
    if (!window.confirm(`Auto-fill realistic demo continuous assessment scores for all students in ${selectedClass} - ${selectedSubject} (${gradebookTerm})?`)) {
      return;
    }

    const updates = classStudents.map(st => {
      const ca1 = Math.round((Math.random() * 0.35 + 0.65) * caConfig.ca1Max);
      const ca2 = Math.round((Math.random() * 0.35 + 0.65) * caConfig.ca2Max);
      const ca3 = Math.round((Math.random() * 0.35 + 0.65) * caConfig.ca3Max);
      const ca4 = Math.round((Math.random() * 0.35 + 0.65) * caConfig.ca4Max);
      const exam = Math.round((Math.random() * 0.45 + 0.55) * caConfig.examMax);

      return {
        studentId: st.id,
        ca1,
        ca2,
        ca3,
        ca4,
        exam,
      };
    });

    batchUpdateSubjectScores(selectedClass, selectedSubject, updates, gradebookTerm);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Teacher Score Upload Workspace Banner */}
      <div className="bg-gradient-to-r from-[#7a0c0c] via-[#8f1212] to-[#690707] rounded-2xl shadow-lg border-2 border-amber-400 p-4 sm:p-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-red-950 uppercase tracking-wider">
                Teacher Score Upload Center
              </span>
              <span className="text-xs text-amber-200/90 font-mono">
                Staff ID: <strong className="text-white font-bold">{currentUser.staffId}</strong>
              </span>
              <span className="text-xs text-amber-200/80">•</span>
              <span className="text-xs text-amber-200 capitalize font-medium">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-amber-300 font-serif">
              {currentUser.name}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-amber-100/90 pt-0.5">
              <span>Your Subjects:</span>
              {(currentUser.assignedSubjects || []).slice(0, 4).map(sub => (
                <span key={sub} className="bg-red-950/80 border border-amber-400/40 px-2 py-0.5 rounded text-[11px] font-medium text-amber-200">
                  {sub}
                </span>
              ))}
              {(currentUser.assignedSubjects || []).length > 4 && (
                <span className="text-[11px] text-amber-300">+{(currentUser.assignedSubjects || []).length - 4} more</span>
              )}
            </div>
          </div>

          {/* Right Action Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Remarks & Comments Button */}
            {onOpenClassCommentsModal && (
              <button
                type="button"
                onClick={() => onOpenClassCommentsModal(selectedClass)}
                className="flex items-center space-x-1.5 px-3 py-2.5 bg-red-950/90 hover:bg-red-900 text-amber-200 hover:text-white font-bold text-xs rounded-xl border border-amber-400/60 shadow-xs transition"
                title="Manage Form Teacher and Principal remarks for this class"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Class Remarks</span>
              </button>
            )}

            {/* Passport Upload Center Button */}
            {onOpenPassportModal && (
              <button
                type="button"
                onClick={() => onOpenPassportModal(selectedClass)}
                className="flex items-center space-x-1.5 px-3 py-2.5 bg-red-950/90 hover:bg-red-900 text-amber-200 hover:text-white font-bold text-xs rounded-xl border border-amber-400/60 shadow-xs transition"
                title="Upload or capture passport photos for students in this class"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Passports</span>
              </button>
            )}

            {/* Direct Score Input for Every Teacher */}
            {onOpenDirectScoreModal && (
              <button
                type="button"
                disabled={!hasEditPermission}
                onClick={() => hasEditPermission && onOpenDirectScoreModal(selectedClass, selectedSubject)}
                className={`flex items-center space-x-2 px-4 py-2.5 font-black text-xs rounded-xl shadow-md border-2 transition ${
                  hasEditPermission
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-red-950 border-amber-200'
                    : 'bg-slate-800 text-slate-400 border-slate-700 opacity-60 cursor-not-allowed'
                }`}
                title={hasEditPermission ? "Open Direct Mark Entry Workspace to input CA and Exam scores directly" : "Scores Portal Restricted: Only assigned subject teacher can input marks"}
              >
                <BookOpen className="w-4 h-4" />
                <span>Direct Mark Entry</span>
              </button>
            )}

            {/* Detect & Audit Missing Marks Button */}
            {onOpenMissingMarksModal && (
              <button
                type="button"
                onClick={() => onOpenMissingMarksModal(selectedClass, selectedSubject)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition border ${
                  missingCountInCurrentView > 0
                    ? 'bg-amber-400 hover:bg-amber-300 text-red-950 border-amber-300 shadow-amber-900/20'
                    : 'bg-red-950/80 hover:bg-red-900 text-amber-200 border-amber-400/60'
                }`}
                title="Detect missing continuous assessment or exam marks and resolve inline"
              >
                <ShieldAlert className="w-4 h-4 text-red-950" />
                <span>
                  {missingCountInCurrentView > 0 
                    ? `Detect Missing Marks (${missingCountInCurrentView} Missing)`
                    : 'Audit Missing Marks'}
                </span>
              </button>
            )}

            {/* Direct Score Upload Button */}
            <button
              type="button"
              disabled={!hasEditPermission}
              onClick={() => hasEditPermission && setIsUploadModalOpen(true)}
              className={`flex items-center space-x-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-md border transition ${
                hasEditPermission
                  ? 'bg-amber-400 hover:bg-amber-300 text-red-950 border-amber-300'
                  : 'bg-slate-800 text-slate-400 border-slate-700 opacity-60 cursor-not-allowed'
              }`}
              title={hasEditPermission ? "Upload Continuous Assessments & Exam Marks via CSV/Excel" : "Scores Portal Restricted: Only assigned subject teacher can upload marks"}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Scores (CSV / Excel)</span>
            </button>

            {/* Sync to Google Sheets Button */}
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md border border-emerald-400/80 transition"
              title="Easily synchronize student continuous assessment and exam marks with Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>Sync to Google Sheets</span>
            </button>

            {/* Admin Adjustable CA & Exams Button */}
            {onOpenPercentageModal && (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer') && (
              <button
                type="button"
                onClick={onOpenPercentageModal}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-950 to-slate-900 hover:from-red-900 hover:to-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-md border border-amber-400/80 transition"
                title="Admin: Adjust Continuous Assessment (CA 1–4) and Examination percentages"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Adjust CA & Exams</span>
              </button>
            )}

            {/* Teacher Sign In / Sign Up Buttons */}
            {onOpenTeacherSignupModal && (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => onOpenTeacherSignupModal('login')}
                  className="flex items-center space-x-1 px-3 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border border-emerald-500 shadow-xs transition"
                  title="Staff Sign In"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTeacherSignupModal('signup')}
                  className="flex items-center space-x-1 px-3 py-2.5 bg-amber-400 hover:bg-amber-300 text-red-950 font-bold text-xs rounded-xl border border-amber-300 shadow-xs transition"
                  title="Register as a new teacher"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar for Current Subject / Class */}
        <div className="mt-4 pt-3 border-t border-red-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-amber-200/90 font-medium">Mark Recording Progress ({selectedClass} • {selectedSubject}):</span>
            <span className="font-bold text-white bg-red-950/90 px-2 py-0.5 rounded border border-amber-400/40">
              {scoredCount} of {classStudents.length} Students Scored ({scoreCompletionPercent}%)
            </span>
          </div>

          <div className="w-full sm:w-48 bg-red-950/90 rounded-full h-2.5 border border-amber-400/40 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${scoreCompletionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Bar & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Format Badge */}
            <div className="self-end lg:self-center pb-1 lg:pb-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black border shadow-sm ${
                isJunior 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-blue-100 text-blue-900 border-blue-300'
              }`}>
                {isJunior ? 'JUNIOR FORMAT' : 'SENIOR FORMAT'}
              </span>
            </div>

            {/* Class Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Class {isStaffAdmin ? '(All Classes)' : '(My Assigned Classes)'}
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {allowedClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {cls} {isJuniorClass(cls) ? '(Junior)' : '(Senior)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Subject {isStaffAdmin ? `(${allowedSubjects.length} Curriculum Subjects)` : `(${allowedSubjects.length} My Assigned)`}
              </label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none max-w-xs"
              >
                {allowedSubjects.map(subj => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Term Switcher */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Academic Term
              </label>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300">
                {[
                  { id: 'First Term', label: '1st Term' },
                  { id: 'Second Term', label: '2nd Term' },
                  { id: 'Third Term', label: '3rd Term' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setGradebookTerm(id);
                      if (onSelectTerm) onSelectTerm(id);
                    }}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition ${
                      gradebookTerm === id
                        ? 'bg-[#8b1515] text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Student Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Search Learner
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by name or learner ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 self-end lg:self-center">
            {/* Direct Mark Entry Workspace */}
            {onOpenDirectScoreModal && (
              <button
                type="button"
                onClick={() => onOpenDirectScoreModal(selectedClass, selectedSubject)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 text-xs font-black rounded-lg shadow-sm border border-amber-300 transition"
                title="Input scores directly with fast keyboard navigation"
              >
                <BookOpen className="w-4 h-4 text-red-950" />
                <span>Direct Mark Entry</span>
              </button>
            )}

            {/* Teacher Self-Service Score Upload Button */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white text-xs font-bold rounded-lg shadow-sm border border-amber-400 transition"
              title="Every teacher can upload student scores via CSV or Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>Upload CSV</span>
            </button>

            {hasEditPermission && (
              <button
                onClick={handleBatchFillRandom}
                title="Fill sample demo scores"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulate Marks</span>
              </button>
            )}

            <button
              onClick={onOpenSyncModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync to DB</span>
            </button>
          </div>
        </div>

        {/* RBAC Notification & Subject Quick Stats */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            {hasEditPermission ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Unlock className="w-3.5 h-3.5 mr-1" />
                Direct Mark Entry Enabled: Every teacher can input CA (1-4) &amp; Exam marks directly in the table or modal
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300">
                <Lock className="w-3.5 h-3.5 mr-1 text-amber-700" />
                Read-Only Access: Assigned to subject specialist. Only assigned teacher or Admin can edit.
              </span>
            )}
          </div>

          {/* Quick subject stats badge */}
          <div className="flex items-center space-x-4 text-slate-600">
            <span>Enrolled: <strong className="text-slate-900">{classStudents.length}</strong></span>
            <span>Class Avg: <strong className="text-slate-900">{stats.avg}%</strong></span>
            <span>Highest: <strong className="text-emerald-700">{stats.high}%</strong></span>
            <span>Pass Rate: <strong className="text-blue-700">{stats.passRate}%</strong></span>
          </div>
        </div>
      </div>

      {/* Grade Entry Table OR Anti-Manipulation Security Lockdown Screen */}
      {!hasEditPermission ? (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-red-300 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 border-2 border-red-300 flex items-center justify-center mx-auto text-red-900 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300 uppercase tracking-wider">
              Security Protocol • Anti-Manipulation Guard Active
            </span>
            <h3 className="text-xl font-black text-slate-900 font-serif">
              Scores Portal Restricted to Assigned Subject Specialist
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To strictly prevent unauthorized manipulation of continuous assessment (CA 1–4) and examination scores, teachers are not permitted to access or alter marks in another teacher's portal.
            </p>
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 font-medium space-y-1.5 text-left max-w-md mx-auto">
              <div>
                Logged-in Staff: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.staffId} • {currentUser.role.replace('_', ' ')})
              </div>
              <div>
                Target Portal: <strong className="text-red-900">{selectedClass} — {selectedSubject}</strong>
              </div>
              <div className="text-[11px] text-red-700 font-semibold pt-1 border-t border-amber-200">
                Notice: Only the designated teacher for this subject or the Super Admin can input marks.
              </div>
            </div>
          </div>
          {allowedClasses.length > 0 && allowedSubjects.length > 0 && (
            <button
              onClick={() => {
                setSelectedClass(allowedClasses[0]);
                setSelectedSubject(allowedSubjects[0]);
              }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-amber-300 font-bold text-xs rounded-xl shadow-md border border-amber-400 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Switch to My Assigned Portal ({allowedClasses[0]} • {allowedSubjects[0]})</span>
            </button>
          )}
        </div>
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-800 text-sm flex flex-wrap items-center gap-2">
              <span>{selectedClass} — {selectedSubject} Continuous Assessment & Exam Gradebook</span>
              <span className="text-xs font-normal text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                CA1: {caConfig.ca1Max}%, CA2: {caConfig.ca2Max}%, CA3: {caConfig.ca3Max}%{caConfig.ca4Max > 0 ? `, CA4: ${caConfig.ca4Max}%` : ''}, Exam: {caConfig.examMax}% (Total: 100%)
              </span>
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            {savedFeedback && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Synchronized (Cloud &amp; Local Storage)</span>
              </span>
            )}
            <div className="text-xs text-slate-500">
              Current User: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.role.replace('_', ' ')})
            </div>
          </div>
        </div>

        {/* Compact College Grading Scale Key Strip */}
        <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-700 font-bold uppercase tracking-tight text-[10px]">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>Grading Key:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(settings.gradingScale || DEFAULT_GRADING_SCALE).map(item => (
              <span 
                key={item.grade}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-semibold text-slate-800"
                title={`${item.grade}: ${item.minScore}% - ${item.maxScore}% (${item.remark})`}
              >
                <strong className={`font-black ${
                  item.grade === 'A' ? 'text-emerald-700' :
                  item.grade === 'B' ? 'text-blue-700' :
                  item.grade === 'C' ? 'text-cyan-700' :
                  item.grade === 'D' ? 'text-amber-700' :
                  item.grade === 'E' ? 'text-orange-700' :
                  'text-red-700'
                }`}>{item.grade}</strong>
                <span className="text-slate-500 font-mono">({item.minScore}–{item.maxScore}%)</span>
                <span className="hidden md:inline text-slate-600 truncate max-w-[80px]">• {item.remark}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Mobile & Tablet Direct Mark Entry Banner */}
        <div className="md:hidden bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 p-3 rounded-xl border border-amber-300 shadow-sm flex items-center justify-between gap-2 m-3 mb-2">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-red-950 shrink-0" />
            <div>
              <div className="text-xs font-black text-red-950">Mobile Direct Mark Entry Active</div>
              <div className="text-[10px] text-red-900 font-medium">Touch-friendly phone cards & rapid 1-by-1 input</div>
            </div>
          </div>
          {onOpenDirectScoreModal && (
            <button
              type="button"
              disabled={!hasEditPermission}
              onClick={() => hasEditPermission && onOpenDirectScoreModal(selectedClass, selectedSubject)}
              className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-amber-300 font-black text-xs rounded-lg shadow-sm border border-amber-400 shrink-0 active:scale-95 transition disabled:opacity-50"
            >
              Open Mobile Entry
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#102a43] text-white border-b border-slate-700 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3 px-2 w-10 text-center sticky left-0 bg-[#102a43] z-20">S/N</th>
                <th className="py-3 px-3 min-w-[170px] sticky left-10 bg-[#102a43] z-20 shadow-xs">Learner Name</th>
                <th className="py-3 px-3 w-32">Learner ID</th>
                <th className="py-3 px-2 w-14 text-center">Gender</th>
                <th className="py-3 px-2 text-center bg-blue-900/60 w-20">CA1 ({caConfig.ca1Max}%)</th>
                <th className="py-3 px-2 text-center bg-blue-900/60 w-20">CA2 ({caConfig.ca2Max}%)</th>
                <th className="py-3 px-2 text-center bg-indigo-900/60 w-20">CA3 ({caConfig.ca3Max}%)</th>
                {caConfig.ca4Max > 0 && (
                  <th className="py-3 px-2 text-center bg-indigo-900/60 w-20">CA4 ({caConfig.ca4Max}%)</th>
                )}
                <th className="py-3 px-2 text-center bg-amber-900/60 w-24">Exam ({caConfig.examMax}%)</th>
                <th className="py-3 px-3 text-center bg-slate-800 w-20">Total (100%)</th>
                <th className="py-3 px-2 text-center w-16">Grade</th>
                <th className="py-3 px-2 text-center w-16">Rank</th>
                <th className="py-3 px-3 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={caConfig.ca4Max > 0 ? 13 : 12} className="py-12 px-4 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-semibold text-slate-700">No students enrolled in {selectedClass} yet.</p>
                      <p className="text-xs text-slate-500">Use "Add / Upload Students" or Excel Import to register learners into this class.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                classStudents.map((student, index) => {
                const score = student.termScores?.[gradebookTerm]?.[selectedSubject] || student.scores[selectedSubject] || {
                  ca1: null,
                  ca2: null,
                  ca3: null,
                  ca4: null,
                  exam: null,
                  total: 0,
                  grade: 'F',
                };

                const total = score.total;
                const grade = score.grade;

                // Grade badge styling
                const gradeColor = 
                  grade === 'A' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  grade === 'B' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  grade === 'C' ? 'bg-cyan-100 text-cyan-800 border-cyan-300' :
                  grade === 'D' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  grade === 'E' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                  'bg-red-100 text-red-800 border-red-300';

                return (
                  <tr 
                    key={student.id} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2.5 px-2 text-center font-mono text-slate-500 sticky left-0 bg-white z-10">{index + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 sticky left-10 bg-white z-10 shadow-xs border-r border-slate-200 whitespace-nowrap">
                      {student.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 font-medium whitespace-nowrap">
                      {student.learnerId}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                      {student.gender === 'MALE' ? 'M' : 'F'}
                    </td>

                    {/* CA1 input */}
                    <td className="py-2 px-1 text-center bg-blue-50/40">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        enterKeyHint="next"
                        min="0"
                        max={caConfig.ca1Max}
                        disabled={!hasEditPermission}
                        value={score.ca1 ?? ''}
                        onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)}
                        placeholder={`0-${caConfig.ca1Max}`}
                        className="w-14 h-8 text-center bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </td>

                    {/* CA2 input */}
                    <td className="py-2 px-1 text-center bg-blue-50/40">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        enterKeyHint="next"
                        min="0"
                        max={caConfig.ca2Max}
                        disabled={!hasEditPermission}
                        value={score.ca2 ?? ''}
                        onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)}
                        placeholder={`0-${caConfig.ca2Max}`}
                        className="w-14 h-8 text-center bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </td>

                    {/* CA3 input */}
                    <td className="py-2 px-1 text-center bg-indigo-50/40">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        enterKeyHint="next"
                        min="0"
                        max={caConfig.ca3Max}
                        disabled={!hasEditPermission}
                        value={score.ca3 ?? ''}
                        onChange={e => handleScoreChange(student.id, 'ca3', e.target.value)}
                        placeholder={`0-${caConfig.ca3Max}`}
                        className="w-14 h-8 text-center bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </td>

                    {/* CA4 input (rendered if ca4Max > 0) */}
                    {caConfig.ca4Max > 0 && (
                      <td className="py-2 px-1 text-center bg-indigo-50/40">
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          enterKeyHint="next"
                          min="0"
                          max={caConfig.ca4Max}
                          disabled={!hasEditPermission}
                          value={score.ca4 ?? ''}
                          onChange={e => handleScoreChange(student.id, 'ca4', e.target.value)}
                          placeholder={`0-${caConfig.ca4Max}`}
                          className="w-14 h-8 text-center bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>
                    )}

                    {/* EXAM input */}
                    <td className="py-2 px-1 text-center bg-amber-50/40">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        enterKeyHint="next"
                        min="0"
                        max={caConfig.examMax}
                        disabled={!hasEditPermission}
                        value={score.exam ?? ''}
                        onChange={e => handleScoreChange(student.id, 'exam', e.target.value)}
                        placeholder={`0-${caConfig.examMax}`}
                        className="w-16 h-8 text-center bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </td>

                    {/* Auto Computed Total */}
                    <td className="py-2.5 px-3 text-center font-bold text-sm text-slate-900 bg-slate-100/70">
                      {total}
                    </td>

                    {/* Grade Badge */}
                    <td className="py-2.5 px-2 text-center" title={`${grade}: ${getGradeRemark(grade, settings.gradingScale)}`}>
                      <span className={`inline-block w-7 py-0.5 text-xs font-bold rounded border ${gradeColor}`}>
                        {grade}
                      </span>
                      <div className="text-[9px] text-slate-500 font-medium truncate max-w-[70px] mx-auto mt-0.5" title={getGradeRemark(grade, settings.gradingScale)}>
                        {getGradeRemark(grade, settings.gradingScale)}
                      </div>
                    </td>

                    {/* Subject Rank */}
                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-600">
                      {score.position ? `#${score.position}` : '-'}
                    </td>

                    {/* Status indicator */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                        Synchronized
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Teacher Self-Service Score Upload Modal */}
      <ScoreUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        students={students}
        currentUser={currentUser}
        settings={settings}
        initialClass={selectedClass}
        initialSubject={selectedSubject}
        activeTerm={gradebookTerm}
        batchUpdateSubjectScores={batchUpdateSubjectScores}
        addLog={addLog || (() => {})}
      />
    </div>
  );
};
