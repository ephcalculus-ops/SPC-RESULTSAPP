import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, Teacher, SchoolSettings, SubjectScore } from '../types';
import { 
  SCHOOL_CLASSES, 
  isJuniorClass, 
  getSubjectsForClass, 
  getCAConfig, 
  computeTotal, 
  calculateGrade,
  normalizeClass,
  isClassMatch
} from '../data/mockData';
import { 
  BookOpen, 
  Save, 
  X, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  ArrowDown, 
  ArrowUp,
  Users, 
  Award, 
  Lock,
  Smartphone,
  Table as TableIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  SlidersHorizontal,
  ArrowRight,
  Filter
} from 'lucide-react';

interface DirectScoreInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentUser: Teacher;
  settings: SchoolSettings;
  activeTerm?: string;
  initialClass?: string;
  initialSubject?: string;
  batchUpdateSubjectScores: (
    className: string,
    subject: string,
    updates: { studentId: string; ca1: number | null; ca2: number | null; ca3: number | null; ca4: number | null; exam: number | null }[],
    termParam?: string
  ) => void;
  addLog?: (action: string, details: string) => void;
}

export const DirectScoreInputModal: React.FC<DirectScoreInputModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  settings,
  activeTerm,
  initialClass,
  initialSubject,
  batchUpdateSubjectScores,
  addLog,
}) => {
  const isStaffAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer';
  const allowedClasses = useMemo(() => {
    if (isStaffAdmin) return SCHOOL_CLASSES;
    const list = [...(currentUser.assignedClasses || [])];
    if (currentUser.isFormTeacherOf && !list.includes(currentUser.isFormTeacherOf)) {
      list.push(currentUser.isFormTeacherOf);
    }
    const normalized = list.map(c => normalizeClass(c));
    return normalized.length > 0 ? Array.from(new Set(normalized)) : ['JSS 1 A'];
  }, [isStaffAdmin, currentUser.assignedClasses, currentUser.isFormTeacherOf]);

  const defaultClass = (initialClass && allowedClasses.includes(normalizeClass(initialClass) as any))
    ? normalizeClass(initialClass)
    : (allowedClasses[0] || 'JSS 1 A');
  const defaultSubject = initialSubject || currentUser.assignedSubjects[0] || 'MATHEMATICS';

  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubject);
  const [selectedTerm, setSelectedTerm] = useState<string>(
    activeTerm === 'Cumulative' ? 'Third Term' : (activeTerm || 'Third Term')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unscored' | 'scored'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // View mode: 'cards' (mobile card list), 'focus' (1-by-1 step through on phone), 'table' (broadsheet grid)
  const [viewMode, setViewMode] = useState<'cards' | 'focus' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'cards';
  });

  // Focused student index for 1-by-1 mobile step-through mode
  const [focusIndex, setFocusIndex] = useState(0);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [localScores, setLocalScores] = useState<Record<string, { ca1: number | null; ca2: number | null; ca3: number | null; ca4: number | null; exam: number | null }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const classCurriculumSubjects = useMemo(() => getSubjectsForClass(selectedClass), [selectedClass]);
  const allowedSubjects = useMemo(() => {
    if (isStaffAdmin) return classCurriculumSubjects;
    const assigned = currentUser.assignedSubjects || [];
    const filtered = assigned.filter(subj => classCurriculumSubjects.some(
      cs => cs.trim().toLowerCase() === subj.trim().toLowerCase()
    ));
    return filtered.length > 0 ? filtered : assigned;
  }, [isStaffAdmin, classCurriculumSubjects, currentUser.assignedSubjects]);

  const caConfig = useMemo(() => getCAConfig(selectedClass, settings), [selectedClass, settings]);
  const hasEditPermission = useMemo(() => {
    if (isStaffAdmin) return true;
    if (settings.allowAllTeachersScoreEntry) return true;
    const assignedClasses = currentUser.assignedClasses || [];
    const canClass = assignedClasses.some(c => isClassMatch(c, selectedClass)) ||
      (currentUser.isFormTeacherOf && isClassMatch(currentUser.isFormTeacherOf, selectedClass));

    if (!canClass) return false;

    const assigned = currentUser.assignedSubjects || [];
    if (assigned.length === 0) return true;

    const cleanSubject = selectedSubject.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const canSubj = assigned.some(
      s => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSubject) ||
           cleanSubject.includes(s.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    return canSubj;
  }, [isStaffAdmin, selectedClass, selectedSubject, settings.allowAllTeachersScoreEntry, currentUser.assignedClasses, currentUser.isFormTeacherOf, currentUser.assignedSubjects]);

  // Keep subject in sync when class changes
  useEffect(() => {
    if (!allowedSubjects.includes(selectedSubject as any)) {
      setSelectedSubject(allowedSubjects[0] || 'MATHEMATICS');
    }
  }, [selectedClass, allowedSubjects, selectedSubject]);

  // Update selection if modal opened with specific initialClass/Subject
  useEffect(() => {
    if (isOpen) {
      if (initialClass) {
        const matchingClass = allowedClasses.find(c => isClassMatch(c, initialClass));
        if (matchingClass) {
          setSelectedClass(matchingClass);
        } else if (allowedClasses.length > 0) {
          setSelectedClass(allowedClasses[0]);
        }
      }
      if (initialSubject && allowedSubjects.includes(initialSubject as any)) {
        setSelectedSubject(initialSubject);
      } else if (allowedSubjects.length > 0 && !allowedSubjects.includes(selectedSubject as any)) {
        setSelectedSubject(allowedSubjects[0]);
      }
    }
  }, [isOpen, initialClass, initialSubject, allowedClasses, allowedSubjects, selectedSubject]);

  // Initialize draft scores from students whenever class, subject, or term changes
  useEffect(() => {
    if (!isOpen) return;

    const classStudents = students.filter(s => s.className === selectedClass);
    const initialMap: Record<string, { ca1: number | null; ca2: number | null; ca3: number | null; ca4: number | null; exam: number | null }> = {};

    for (const student of classStudents) {
      const scoreObj = student.termScores?.[selectedTerm]?.[selectedSubject] || student.scores[selectedSubject];
      initialMap[student.id] = {
        ca1: scoreObj?.ca1 ?? null,
        ca2: scoreObj?.ca2 ?? null,
        ca3: scoreObj?.ca3 ?? null,
        ca4: scoreObj?.ca4 ?? null,
        exam: scoreObj?.exam ?? null,
      };
    }

    setLocalScores(initialMap);
    setHasUnsavedChanges(false);
    setFeedbackMessage(null);
    setFocusIndex(0);
  }, [isOpen, selectedClass, selectedSubject, selectedTerm, students]);

  if (!isOpen) return null;

  const classStudents = students.filter(s => s.className === selectedClass);
  
  // Filter by query and status
  const filteredStudents = classStudents.filter(s => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = s.name.toLowerCase().includes(q) || s.learnerId.toLowerCase().includes(q);
      if (!match) return false;
    }

    const sc = localScores[s.id];
    const isScored = sc && (sc.ca1 !== null || sc.ca2 !== null || sc.ca3 !== null || sc.ca4 !== null || sc.exam !== null);

    if (statusFilter === 'unscored') return !isScored;
    if (statusFilter === 'scored') return isScored;
    return true;
  });

  const handleScoreChange = (
    studentId: string,
    field: 'ca1' | 'ca2' | 'ca3' | 'ca4' | 'exam',
    valueStr: string
  ) => {
    let numVal: number | null = valueStr === '' ? null : Number(valueStr);
    if (numVal !== null && isNaN(numVal)) return;

    // Enforce max limits
    if (numVal !== null) {
      if (field === 'ca1') numVal = Math.min(caConfig.ca1Max, Math.max(0, numVal));
      if (field === 'ca2') numVal = Math.min(caConfig.ca2Max, Math.max(0, numVal));
      if (field === 'ca3') numVal = Math.min(caConfig.ca3Max, Math.max(0, numVal));
      if (field === 'ca4') numVal = Math.min(caConfig.ca4Max, Math.max(0, numVal));
      if (field === 'exam') numVal = Math.min(caConfig.examMax, Math.max(0, numVal));
    }

    setLocalScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { ca1: null, ca2: null, ca3: null, ca4: null, exam: null }),
        [field]: numVal,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Smooth scroll into center when input is focused on mobile (prevents virtual keyboard hiding the field)
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  };

  // Keyboard navigation: Enter or Down Arrow moves to same or next field
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number,
    field: 'ca1' | 'ca2' | 'ca3' | 'ca4' | 'exam',
    mode: 'table' | 'card'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // In card mode on mobile: step horizontally CA1 -> CA2 -> CA3 -> (CA4) -> Exam -> next student's CA1
      if (mode === 'card') {
        const order: ('ca1' | 'ca2' | 'ca3' | 'ca4' | 'exam')[] = ['ca1', 'ca2', 'ca3'];
        if (caConfig.ca4Max > 0) order.push('ca4');
        order.push('exam');

        const currentFieldIdx = order.indexOf(field);
        if (currentFieldIdx < order.length - 1) {
          const nextField = order[currentFieldIdx + 1];
          const nextInput = document.getElementById(`card-input-${currentIndex}-${nextField}`);
          if (nextInput) {
            nextInput.focus();
            (nextInput as HTMLInputElement).select();
            return;
          }
        } else {
          // Jump to next student's first field
          const nextIndex = currentIndex + 1;
          const nextInput = document.getElementById(`card-input-${nextIndex}-ca1`);
          if (nextInput) {
            nextInput.focus();
            (nextInput as HTMLInputElement).select();
            return;
          }
        }
      } else {
        // Table mode: Enter jumps down to same field in next row
        const nextIndex = currentIndex + 1;
        const nextInput = document.getElementById(`score-input-${nextIndex}-${field}`);
        if (nextInput) {
          nextInput.focus();
          (nextInput as HTMLInputElement).select();
          return;
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const prefix = mode === 'card' ? 'card' : 'score';
      const nextIndex = currentIndex + 1;
      const nextInput = document.getElementById(`${prefix}-input-${nextIndex}-${field}`);
      if (nextInput) {
        nextInput.focus();
        (nextInput as HTMLInputElement).select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prefix = mode === 'card' ? 'card' : 'score';
      const prevIndex = currentIndex - 1;
      const prevInput = document.getElementById(`${prefix}-input-${prevIndex}-${field}`);
      if (prevInput) {
        prevInput.focus();
        (prevInput as HTMLInputElement).select();
      }
    }
  };

  const handleSaveAll = () => {
    if (!hasEditPermission) {
      setFeedbackMessage('Security Error: Access Denied. You are not assigned to record scores for this class or subject.');
      return;
    }

    const updates = classStudents.map(student => {
      const sc = localScores[student.id] || { ca1: null, ca2: null, ca3: null, ca4: null, exam: null };
      return {
        studentId: student.id,
        ca1: sc.ca1,
        ca2: sc.ca2,
        ca3: sc.ca3,
        ca4: sc.ca4,
        exam: sc.exam,
      };
    });

    batchUpdateSubjectScores(selectedClass, selectedSubject, updates, selectedTerm);
    setHasUnsavedChanges(false);
    setFeedbackMessage(`✓ Saved marks for ${updates.length} students in ${selectedClass} (${selectedSubject})!`);

    if (addLog) {
      addLog(
        'Direct Mark Entry',
        `Teacher ${currentUser.name} (${currentUser.staffId}) entered marks directly for ${updates.length} students in ${selectedClass} - ${selectedSubject} (${selectedTerm})`
      );
    }

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const handleSimulateDemo = () => {
    const newMap = { ...localScores };
    for (const student of classStudents) {
      newMap[student.id] = {
        ca1: Math.round((Math.random() * 0.35 + 0.65) * caConfig.ca1Max),
        ca2: Math.round((Math.random() * 0.35 + 0.65) * caConfig.ca2Max),
        ca3: Math.round((Math.random() * 0.35 + 0.65) * caConfig.ca3Max),
        ca4: Math.round((Math.random() * 0.35 + 0.65) * caConfig.ca4Max),
        exam: Math.round((Math.random() * 0.45 + 0.55) * caConfig.examMax),
      };
    }
    setLocalScores(newMap);
    setHasUnsavedChanges(true);
  };

  // Completion stats
  const totalStudents = classStudents.length;
  const scoredStudents = classStudents.filter(s => {
    const sc = localScores[s.id];
    return sc && (sc.ca1 !== null || sc.ca2 !== null || sc.ca3 !== null || sc.ca4 !== null || sc.exam !== null);
  }).length;
  const completionPercentage = totalStudents > 0 ? Math.round((scoredStudents / totalStudents) * 100) : 0;

  // Active student for 1-by-1 focus mode
  const currentFocusStudent = filteredStudents[focusIndex] || filteredStudents[0];
  const currentFocusScore = currentFocusStudent ? (localScores[currentFocusStudent.id] || { ca1: null, ca2: null, ca3: null, ca4: null, exam: null }) : null;
  const currentFocusTotal = currentFocusScore ? computeTotal(currentFocusScore.ca1, currentFocusScore.ca2, currentFocusScore.ca3, currentFocusScore.ca4, currentFocusScore.exam) : 0;
  const currentFocusGrade = calculateGrade(currentFocusTotal, settings?.gradingScale);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-sm sm:p-3 sm:items-center sm:justify-center animate-in fade-in duration-200">
      {/* Main Container: Full screen on mobile phones, rounded modal on tablet & desktop */}
      <div className="w-full h-full sm:h-[92vh] sm:max-w-5xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-amber-300/40">
        
        {/* 1. Header Banner - Compact & Touch-Friendly */}
        <div className="px-4 py-3 sm:py-3.5 bg-gradient-to-r from-red-950 via-red-900 to-[#7a0c0c] text-white flex items-center justify-between border-b-2 border-amber-400 shrink-0 shadow-sm">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-amber-300 font-serif truncate">
                  Direct Mark Entry
                </h3>
                <span className="bg-amber-400 text-red-950 text-[10px] font-black px-1.5 py-0.2 rounded shadow-xs">
                  {selectedClass}
                </span>
                <span className="bg-red-800 text-amber-200 border border-amber-400/50 text-[10px] font-semibold px-1.5 py-0.2 rounded hidden sm:inline truncate max-w-[150px]">
                  {selectedSubject}
                </span>
              </div>
              <p className="text-[11px] text-amber-100/90 truncate">
                {currentUser.name} • <span className="font-mono">{scoredStudents}/{totalStudents} Scored</span> ({completionPercentage}%)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="bg-red-950/90 p-0.5 rounded-lg border border-amber-400/40 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                  viewMode === 'cards' 
                    ? 'bg-amber-400 text-red-950 shadow-sm' 
                    : 'text-amber-200 hover:text-white'
                }`}
                title="Phone Cards View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('focus')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                  viewMode === 'focus' 
                    ? 'bg-amber-400 text-red-950 shadow-sm' 
                    : 'text-amber-200 hover:text-white'
                }`}
                title="1-by-1 Step-Through Phone Mode"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">1-by-1</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                  viewMode === 'table' 
                    ? 'bg-amber-400 text-red-950 shadow-sm' 
                    : 'text-amber-200 hover:text-white'
                }`}
                title="Broadsheet Table View (Tablet & PC)"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-amber-200 hover:text-white p-1.5 rounded-lg hover:bg-red-800 transition touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Compact Selectors & Filter Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* Quick Filter toggle on phone */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                <span>Filters {showFilters ? '▲' : '▼'}</span>
              </button>

              {/* Quick Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Find student..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setFocusIndex(0);
                  }}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg pl-8 pr-2 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="hidden xs:flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                    statusFilter === 'all' 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({classStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('unscored')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                    statusFilter === 'unscored' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-white border border-slate-300 text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  Pending ({totalStudents - scoredStudents})
                </button>
              </div>
            </div>

            {/* Quick Demo & Save buttons for tablet/desktop */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                disabled={!hasEditPermission}
                onClick={handleSimulateDemo}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition disabled:opacity-40"
                title="Fill sample demo marks"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">Simulate</span>
              </button>

              <button
                type="button"
                disabled={!hasEditPermission}
                onClick={handleSaveAll}
                className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold shadow-sm transition touch-manipulation ${
                  !hasEditPermission
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : hasUnsavedChanges
                    ? 'bg-amber-500 hover:bg-amber-400 text-red-950 font-black animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{hasUnsavedChanges ? 'Save *' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Dropdowns on Mobile, Always Visible on Tablet/Desktop */}
          <div className={`${showFilters ? 'block' : 'hidden sm:flex'} pt-2 sm:pt-2 border-t sm:border-t-0 border-slate-200 mt-2 sm:mt-1 flex-wrap items-center gap-2`}>
            {/* Class Dropdown */}
            <div className="flex-1 min-w-[120px] sm:flex-initial">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {allowedClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Dropdown */}
            <div className="flex-1 min-w-[140px] sm:flex-initial">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none max-w-xs"
              >
                {allowedSubjects.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Switcher */}
            <div className="flex-1 min-w-[140px] sm:flex-initial">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Academic Term
              </label>
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
                {['First Term', 'Second Term', 'Third Term'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTerm(t)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex-1 text-center ${
                      selectedTerm === t
                        ? 'bg-red-900 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {t.replace(' Term', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Max limits pill */}
            <div className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md mt-1 sm:mt-3">
              CA1:{caConfig.ca1Max} | CA2:{caConfig.ca2Max} | CA3:{caConfig.ca3Max}{caConfig.ca4Max > 0 ? ` | CA4:${caConfig.ca4Max}` : ''} | Exam:{caConfig.examMax}
            </div>
          </div>
        </div>

        {/* Lock warning or feedback banner */}
        {!hasEditPermission && (
          <div className="p-2.5 bg-red-50 border-b border-red-300 flex items-center space-x-2 text-xs text-red-800 font-semibold shrink-0">
            <Lock className="w-4 h-4 text-red-700 shrink-0" />
            <span>Scores Portal Locked: You are not assigned to record scores for {selectedSubject} in {selectedClass}.</span>
          </div>
        )}

        {feedbackMessage && (
          <div className="p-2.5 bg-emerald-50 border-b border-emerald-300 flex items-center space-x-2 text-xs text-emerald-800 font-bold shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* 3. Main Scoring Body: 3 Modes */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-2 sm:p-4">
          
          {/* ========================================================= */}
          {/* MODE A: MOBILE CARDS VIEW (DEFAULT ON PHONES & TABLETS) */}
          {/* ========================================================= */}
          {viewMode === 'cards' && (
            <div className="space-y-3 max-w-3xl mx-auto pb-16 sm:pb-4">
              {filteredStudents.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-sm">No students found matching your filter</p>
                  <button
                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                    className="mt-2 text-xs text-amber-700 font-bold hover:underline"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredStudents.map((student, index) => {
                  const sc = localScores[student.id] || { ca1: null, ca2: null, ca3: null, ca4: null, exam: null };
                  const total = computeTotal(sc.ca1, sc.ca2, sc.ca3, sc.ca4, sc.exam);
                  const grade = calculateGrade(total, settings?.gradingScale);

                  const gradeBadge = 
                    grade === 'A' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    grade === 'B' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    grade === 'C' ? 'bg-cyan-100 text-cyan-800 border-cyan-300' :
                    grade === 'D' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    grade === 'E' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    'bg-red-100 text-red-800 border-red-300';

                  const isComplete = sc.ca1 !== null && sc.ca2 !== null && sc.ca3 !== null && sc.exam !== null;

                  return (
                    <div 
                      key={student.id}
                      className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition shadow-xs ${
                        isComplete 
                          ? 'border-emerald-200 hover:border-emerald-300' 
                          : 'border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      {/* Card Header: Student Name + Live Total Score */}
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-950 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">
                              {student.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                              <span>{student.learnerId}</span>
                              <span>•</span>
                              <span className="capitalize">{student.gender || 'Learner'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Total & Grade Pill */}
                        <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-none">
                              {total}
                              <span className="text-[10px] text-slate-400 font-normal">/100</span>
                            </div>
                            <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold border mt-0.5 ${gradeBadge}`}>
                              Grade {grade}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Mark Inputs Grid: Big Touch Targets for Android Phones */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {/* CA1 */}
                        <div className="bg-blue-50/50 p-1.5 rounded-lg border border-blue-200/60 flex flex-col">
                          <label className="text-[10px] font-bold text-blue-900 uppercase text-center mb-1">
                            CA1 <span className="text-slate-400 font-normal">({caConfig.ca1Max})</span>
                          </label>
                          <input
                            id={`card-input-${index}-ca1`}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            enterKeyHint="next"
                            disabled={!hasEditPermission}
                            min="0"
                            max={caConfig.ca1Max}
                            value={sc.ca1 ?? ''}
                            onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)}
                            onFocus={handleInputFocus}
                            onKeyDown={e => handleKeyDown(e, index, 'ca1', 'card')}
                            placeholder="—"
                            className="w-full h-11 sm:h-10 text-center bg-white border border-slate-300 rounded-md font-bold text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        {/* CA2 */}
                        <div className="bg-blue-50/50 p-1.5 rounded-lg border border-blue-200/60 flex flex-col">
                          <label className="text-[10px] font-bold text-blue-900 uppercase text-center mb-1">
                            CA2 <span className="text-slate-400 font-normal">({caConfig.ca2Max})</span>
                          </label>
                          <input
                            id={`card-input-${index}-ca2`}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            enterKeyHint="next"
                            disabled={!hasEditPermission}
                            min="0"
                            max={caConfig.ca2Max}
                            value={sc.ca2 ?? ''}
                            onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)}
                            onFocus={handleInputFocus}
                            onKeyDown={e => handleKeyDown(e, index, 'ca2', 'card')}
                            placeholder="—"
                            className="w-full h-11 sm:h-10 text-center bg-white border border-slate-300 rounded-md font-bold text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        {/* CA3 */}
                        <div className="bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-200/60 flex flex-col">
                          <label className="text-[10px] font-bold text-indigo-900 uppercase text-center mb-1">
                            CA3 <span className="text-slate-400 font-normal">({caConfig.ca3Max})</span>
                          </label>
                          <input
                            id={`card-input-${index}-ca3`}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            enterKeyHint="next"
                            disabled={!hasEditPermission}
                            min="0"
                            max={caConfig.ca3Max}
                            value={sc.ca3 ?? ''}
                            onChange={e => handleScoreChange(student.id, 'ca3', e.target.value)}
                            onFocus={handleInputFocus}
                            onKeyDown={e => handleKeyDown(e, index, 'ca3', 'card')}
                            placeholder="—"
                            className="w-full h-11 sm:h-10 text-center bg-white border border-slate-300 rounded-md font-bold text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        {/* CA4 (optional) */}
                        {caConfig.ca4Max > 0 && (
                          <div className="bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-200/60 flex flex-col">
                            <label className="text-[10px] font-bold text-indigo-900 uppercase text-center mb-1">
                              CA4 <span className="text-slate-400 font-normal">({caConfig.ca4Max})</span>
                            </label>
                            <input
                              id={`card-input-${index}-ca4`}
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              enterKeyHint="next"
                              disabled={!hasEditPermission}
                              min="0"
                              max={caConfig.ca4Max}
                              value={sc.ca4 ?? ''}
                              onChange={e => handleScoreChange(student.id, 'ca4', e.target.value)}
                              onFocus={handleInputFocus}
                              onKeyDown={e => handleKeyDown(e, index, 'ca4', 'card')}
                              placeholder="—"
                              className="w-full h-11 sm:h-10 text-center bg-white border border-slate-300 rounded-md font-bold text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </div>
                        )}

                        {/* Exam */}
                        <div className={`bg-amber-50/60 p-1.5 rounded-lg border border-amber-300 flex flex-col ${caConfig.ca4Max === 0 ? 'col-span-3 sm:col-span-2' : 'col-span-2 sm:col-span-1'}`}>
                          <label className="text-[10px] font-bold text-amber-950 uppercase text-center mb-1">
                            Exam <span className="text-amber-800 font-normal">({caConfig.examMax})</span>
                          </label>
                          <input
                            id={`card-input-${index}-exam`}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            enterKeyHint="next"
                            disabled={!hasEditPermission}
                            min="0"
                            max={caConfig.examMax}
                            value={sc.exam ?? ''}
                            onChange={e => handleScoreChange(student.id, 'exam', e.target.value)}
                            onFocus={handleInputFocus}
                            onKeyDown={e => handleKeyDown(e, index, 'exam', 'card')}
                            placeholder={`0-${caConfig.examMax}`}
                            className="w-full h-11 sm:h-10 text-center bg-white border border-amber-400 rounded-md font-black text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Card Footer: Quick jump button */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>
                          {isComplete ? (
                            <span className="text-emerald-700 font-bold flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              All scores recorded
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              Tab or tap Next to advance
                            </span>
                          )}
                        </span>

                        {index < filteredStudents.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextInput = document.getElementById(`card-input-${index + 1}-ca1`);
                              if (nextInput) {
                                nextInput.focus();
                                (nextInput as HTMLInputElement).select();
                              }
                            }}
                            className="text-amber-800 font-bold hover:text-amber-900 flex items-center space-x-0.5 px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100"
                          >
                            <span>Next Student</span>
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MODE B: 1-BY-1 STEP-THROUGH FOCUS MODE (RAPID PHONE ENTRY) */}
          {/* ========================================================= */}
          {viewMode === 'focus' && (
            <div className="max-w-md mx-auto pb-16 sm:pb-4">
              {filteredStudents.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
                  <p className="font-semibold text-sm">No students match current filter</p>
                </div>
              ) : currentFocusStudent ? (
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-amber-300 shadow-lg space-y-4">
                  {/* Stepper Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <button
                      type="button"
                      disabled={focusIndex <= 0}
                      onClick={() => setFocusIndex(prev => Math.max(0, prev - 1))}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>

                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Learner {focusIndex + 1} of {filteredStudents.length}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {selectedClass} • {selectedSubject}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={focusIndex >= filteredStudents.length - 1}
                      onClick={() => setFocusIndex(prev => Math.min(filteredStudents.length - 1, prev + 1))}
                      className="px-3 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-amber-300 font-bold text-xs flex items-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Student Identity Card */}
                  <div className="bg-gradient-to-r from-red-950 to-red-900 text-white rounded-xl p-3.5 flex items-center justify-between border border-amber-400/60 shadow-xs">
                    <div>
                      <div className="text-[10px] text-amber-300 font-mono tracking-wider font-bold">
                        {currentFocusStudent.learnerId}
                      </div>
                      <h3 className="text-base font-black font-serif text-white leading-tight">
                        {currentFocusStudent.name}
                      </h3>
                      <div className="text-[11px] text-amber-100/80 capitalize mt-0.5">
                        Gender: {currentFocusStudent.gender}
                      </div>
                    </div>

                    <div className="text-right bg-amber-400/20 border border-amber-400/60 rounded-xl p-2 min-w-[70px]">
                      <div className="text-2xl font-black text-amber-300 font-mono leading-none">
                        {currentFocusTotal}
                      </div>
                      <div className="text-[10px] font-bold text-white mt-1">
                        Grade {currentFocusGrade}
                      </div>
                    </div>
                  </div>

                  {/* Large Score Inputs for Phone Tapping */}
                  <div className="space-y-3">
                    {/* CA1 */}
                    <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-blue-950">1st Continuous Assessment (CA1)</div>
                        <div className="text-[10px] text-blue-700">Max Score: {caConfig.ca1Max}%</div>
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!hasEditPermission}
                        min="0"
                        max={caConfig.ca1Max}
                        value={currentFocusScore?.ca1 ?? ''}
                        onChange={e => handleScoreChange(currentFocusStudent.id, 'ca1', e.target.value)}
                        placeholder={`0-${caConfig.ca1Max}`}
                        className="w-24 h-12 text-center bg-white border-2 border-blue-400 rounded-xl font-black text-xl text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-xs"
                      />
                    </div>

                    {/* CA2 */}
                    <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-blue-950">2nd Continuous Assessment (CA2)</div>
                        <div className="text-[10px] text-blue-700">Max Score: {caConfig.ca2Max}%</div>
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!hasEditPermission}
                        min="0"
                        max={caConfig.ca2Max}
                        value={currentFocusScore?.ca2 ?? ''}
                        onChange={e => handleScoreChange(currentFocusStudent.id, 'ca2', e.target.value)}
                        placeholder={`0-${caConfig.ca2Max}`}
                        className="w-24 h-12 text-center bg-white border-2 border-blue-400 rounded-xl font-black text-xl text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-xs"
                      />
                    </div>

                    {/* CA3 */}
                    <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-indigo-950">3rd Continuous Assessment (CA3)</div>
                        <div className="text-[10px] text-indigo-700">Max Score: {caConfig.ca3Max}%</div>
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!hasEditPermission}
                        min="0"
                        max={caConfig.ca3Max}
                        value={currentFocusScore?.ca3 ?? ''}
                        onChange={e => handleScoreChange(currentFocusStudent.id, 'ca3', e.target.value)}
                        placeholder={`0-${caConfig.ca3Max}`}
                        className="w-24 h-12 text-center bg-white border-2 border-indigo-400 rounded-xl font-black text-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none shadow-xs"
                      />
                    </div>

                    {/* CA4 (if configured) */}
                    {caConfig.ca4Max > 0 && (
                      <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-indigo-950">4th Assessment (CA4)</div>
                          <div className="text-[10px] text-indigo-700">Max Score: {caConfig.ca4Max}%</div>
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          disabled={!hasEditPermission}
                          min="0"
                          max={caConfig.ca4Max}
                          value={currentFocusScore?.ca4 ?? ''}
                          onChange={e => handleScoreChange(currentFocusStudent.id, 'ca4', e.target.value)}
                          placeholder={`0-${caConfig.ca4Max}`}
                          className="w-24 h-12 text-center bg-white border-2 border-indigo-400 rounded-xl font-black text-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none shadow-xs"
                        />
                      </div>
                    )}

                    {/* Terminal Examination */}
                    <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-300 flex items-center justify-between shadow-xs">
                      <div>
                        <div className="font-black text-xs text-red-950 uppercase tracking-wide">Terminal Examination (Exam)</div>
                        <div className="text-[10px] text-amber-800">Max Score: {caConfig.examMax}%</div>
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!hasEditPermission}
                        min="0"
                        max={caConfig.examMax}
                        value={currentFocusScore?.exam ?? ''}
                        onChange={e => handleScoreChange(currentFocusStudent.id, 'exam', e.target.value)}
                        placeholder={`0-${caConfig.examMax}`}
                        className="w-24 h-12 text-center bg-white border-2 border-amber-500 rounded-xl font-black text-xl text-red-950 focus:ring-2 focus:ring-amber-600 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Big Step to Next Learner Button */}
                  <div className="pt-2 flex items-center space-x-2">
                    {focusIndex < filteredStudents.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setFocusIndex(prev => prev + 1)}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-red-900 to-red-800 text-amber-300 font-black text-sm flex items-center justify-center space-x-2 shadow-md border border-amber-400 active:scale-98 transition touch-manipulation"
                      >
                        <span>Next Learner</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveAll}
                        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md transition touch-manipulation"
                      >
                        <Save className="w-4 h-4" />
                        <span>All Learners Completed — Save Marks</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ========================================================= */}
          {/* MODE C: TABLE SPREADSHEET VIEW (TABLET & DESKTOP) */}
          {/* ========================================================= */}
          {viewMode === 'table' && (
            <div className="border border-slate-300 rounded-xl bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#102a43] text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-20">
                      <th className="py-2.5 px-2.5 w-10 text-center sticky left-0 bg-[#102a43] z-30">S/N</th>
                      <th className="py-2.5 px-3 min-w-[160px] sticky left-10 bg-[#102a43] z-30">
                        Learner Name
                      </th>
                      <th className="py-2.5 px-2 w-28 text-center">ID</th>
                      <th className="py-2.5 px-2 text-center bg-blue-900/80 w-20">
                        CA1 ({caConfig.ca1Max})
                      </th>
                      <th className="py-2.5 px-2 text-center bg-blue-900/80 w-20">
                        CA2 ({caConfig.ca2Max})
                      </th>
                      <th className="py-2.5 px-2 text-center bg-indigo-900/80 w-20">
                        CA3 ({caConfig.ca3Max})
                      </th>
                      {caConfig.ca4Max > 0 && (
                        <th className="py-2.5 px-2 text-center bg-indigo-900/80 w-20">
                          CA4 ({caConfig.ca4Max})
                        </th>
                      )}
                      <th className="py-2.5 px-2 text-center bg-amber-900/80 w-24">
                        Exam ({caConfig.examMax})
                      </th>
                      <th className="py-2.5 px-3 text-center bg-slate-800 w-20">
                        Total
                      </th>
                      <th className="py-2.5 px-2 text-center w-16">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.map((student, index) => {
                      const sc = localScores[student.id] || { ca1: null, ca2: null, ca3: null, ca4: null, exam: null };
                      const total = computeTotal(sc.ca1, sc.ca2, sc.ca3, sc.ca4, sc.exam);
                      const grade = calculateGrade(total, settings?.gradingScale);

                      const gradeBadge = 
                        grade === 'A' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' :
                        grade === 'B' ? 'bg-blue-100 text-blue-800 font-bold border border-blue-300' :
                        grade === 'C' ? 'bg-cyan-100 text-cyan-800 font-bold border border-cyan-300' :
                        grade === 'D' ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300' :
                        grade === 'E' ? 'bg-orange-100 text-orange-800 font-bold border border-orange-300' :
                        'bg-red-100 text-red-800 font-bold border border-red-300';

                      return (
                        <tr key={student.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-2 px-2 text-center font-mono text-slate-500 sticky left-0 bg-white z-10">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 sticky left-10 bg-white z-10 shadow-xs border-r border-slate-200 whitespace-nowrap">
                            {student.name}
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-500 text-center whitespace-nowrap">
                            {student.learnerId}
                          </td>

                          {/* CA1 */}
                          <td className="py-1.5 px-1 text-center bg-blue-50/30">
                            <input
                              id={`score-input-${index}-ca1`}
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              enterKeyHint="next"
                              disabled={!hasEditPermission}
                              min="0"
                              max={caConfig.ca1Max}
                              value={sc.ca1 ?? ''}
                              onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)}
                              onFocus={handleInputFocus}
                              onKeyDown={e => handleKeyDown(e, index, 'ca1', 'table')}
                              placeholder={`0-${caConfig.ca1Max}`}
                              className="w-16 h-9 text-center bg-white border border-slate-300 rounded font-bold text-base sm:text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>

                          {/* CA2 */}
                          <td className="py-1.5 px-1 text-center bg-blue-50/30">
                            <input
                              id={`score-input-${index}-ca2`}
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              enterKeyHint="next"
                              disabled={!hasEditPermission}
                              min="0"
                              max={caConfig.ca2Max}
                              value={sc.ca2 ?? ''}
                              onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)}
                              onFocus={handleInputFocus}
                              onKeyDown={e => handleKeyDown(e, index, 'ca2', 'table')}
                              placeholder={`0-${caConfig.ca2Max}`}
                              className="w-16 h-9 text-center bg-white border border-slate-300 rounded font-bold text-base sm:text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>

                          {/* CA3 */}
                          <td className="py-1.5 px-1 text-center bg-indigo-50/30">
                            <input
                              id={`score-input-${index}-ca3`}
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              enterKeyHint="next"
                              disabled={!hasEditPermission}
                              min="0"
                              max={caConfig.ca3Max}
                              value={sc.ca3 ?? ''}
                              onChange={e => handleScoreChange(student.id, 'ca3', e.target.value)}
                              onFocus={handleInputFocus}
                              onKeyDown={e => handleKeyDown(e, index, 'ca3', 'table')}
                              placeholder={`0-${caConfig.ca3Max}`}
                              className="w-16 h-9 text-center bg-white border border-slate-300 rounded font-bold text-base sm:text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>

                          {/* CA4 */}
                          {caConfig.ca4Max > 0 && (
                            <td className="py-1.5 px-1 text-center bg-indigo-50/30">
                              <input
                                id={`score-input-${index}-ca4`}
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                enterKeyHint="next"
                                disabled={!hasEditPermission}
                                min="0"
                                max={caConfig.ca4Max}
                                value={sc.ca4 ?? ''}
                                onChange={e => handleScoreChange(student.id, 'ca4', e.target.value)}
                                onFocus={handleInputFocus}
                                onKeyDown={e => handleKeyDown(e, index, 'ca4', 'table')}
                                placeholder={`0-${caConfig.ca4Max}`}
                                className="w-16 h-9 text-center bg-white border border-slate-300 rounded font-bold text-base sm:text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                              />
                            </td>
                          )}

                          {/* Exam */}
                          <td className="py-1.5 px-1 text-center bg-amber-50/30">
                            <input
                              id={`score-input-${index}-exam`}
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              enterKeyHint="next"
                              disabled={!hasEditPermission}
                              min="0"
                              max={caConfig.examMax}
                              value={sc.exam ?? ''}
                              onChange={e => handleScoreChange(student.id, 'exam', e.target.value)}
                              onFocus={handleInputFocus}
                              onKeyDown={e => handleKeyDown(e, index, 'exam', 'table')}
                              placeholder={`0-${caConfig.examMax}`}
                              className="w-20 h-9 text-center bg-white border border-amber-300 rounded font-bold text-base sm:text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>

                          {/* Total */}
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 bg-slate-50">
                            {total}
                          </td>

                          {/* Grade */}
                          <td className="py-2 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${gradeBadge}`}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 4. Sticky Bottom Action Bar (Optimized for Mobile Phone Thumbs) */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center space-x-2 text-xs min-w-0">
            {hasUnsavedChanges ? (
              <span className="font-bold text-amber-700 flex items-center gap-1.5 truncate">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="hidden xs:inline">Unsaved:</span> Tap Save
              </span>
            ) : (
              <span className="font-medium text-emerald-700 flex items-center gap-1.5 truncate">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Synchronized</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Close
            </button>

            <button
              type="button"
              disabled={!hasEditPermission}
              onClick={handleSaveAll}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-black text-xs shadow-md border transition touch-manipulation ${
                !hasEditPermission
                  ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                  : hasUnsavedChanges
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-red-950 border-amber-300 animate-pulse shadow-amber-900/20'
                  : 'bg-gradient-to-r from-red-900 to-red-950 text-amber-300 border-amber-400 hover:text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save All Marks ({scoredStudents}/{totalStudents})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
