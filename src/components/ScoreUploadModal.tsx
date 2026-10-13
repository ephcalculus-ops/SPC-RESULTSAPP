import React, { useState, useRef } from 'react';
import { Student, Teacher, SchoolSettings, CAWeightConfig } from '../types';
import { isJuniorClass, getSubjectsForClass, getCAConfig, computeTotal, calculateGrade, normalizeClass, isClassMatch, SCHOOL_CLASSES } from '../data/mockData';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Check, 
  Info,
  HelpCircle
} from 'lucide-react';

interface ScoreUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentUser: Teacher;
  settings: SchoolSettings;
  initialClass: string;
  initialSubject: string;
  activeTerm?: string;
  batchUpdateSubjectScores: (
    className: string,
    subject: string,
    updates: { studentId: string; ca1: number | null; ca2: number | null; ca3: number | null; ca4: number | null; exam: number | null }[],
    termParam?: string
  ) => void;
  addLog: (action: string, details: string) => void;
}

interface ParsedRow {
  studentId: string;
  learnerId: string;
  name: string;
  ca1: number | null;
  ca2: number | null;
  ca3: number | null;
  ca4: number | null;
  exam: number | null;
  total: number;
  grade: string;
  isValid: boolean;
  errorMessage?: string;
}

export const ScoreUploadModal: React.FC<ScoreUploadModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  settings,
  initialClass,
  initialSubject,
  activeTerm,
  batchUpdateSubjectScores,
  addLog,
}) => {
  const isStaffAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer';
  const allowedClasses = React.useMemo(() => {
    if (isStaffAdmin) return Array.from(new Set([...SCHOOL_CLASSES, ...students.map(s => s.className)]));
    const list = [...(currentUser.assignedClasses || [])];
    if (currentUser.isFormTeacherOf && !list.includes(currentUser.isFormTeacherOf)) {
      list.push(currentUser.isFormTeacherOf);
    }
    const normalized = list.map(c => normalizeClass(c));
    return normalized.length > 0 ? Array.from(new Set(normalized)) : [normalizeClass(initialClass)];
  }, [isStaffAdmin, students, currentUser.assignedClasses, currentUser.isFormTeacherOf, initialClass]);

  const defaultClass = allowedClasses.includes(normalizeClass(initialClass)) ? normalizeClass(initialClass) : (allowedClasses[0] || initialClass);
  const defaultSubject = initialSubject || currentUser.assignedSubjects[0] || 'MATHEMATICS';

  const [selectedClass, setSelectedClass] = useState(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState(defaultSubject);
  const [uploadTerm, setUploadTerm] = useState(activeTerm === 'Cumulative' ? 'Third Term' : (activeTerm || 'Third Term'));
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classCurriculumSubjects = getSubjectsForClass(selectedClass);
  const allowedSubjects = React.useMemo(() => {
    if (isStaffAdmin) return classCurriculumSubjects;
    const assigned = currentUser.assignedSubjects || [];
    const valid = assigned.filter(subj => classCurriculumSubjects.some(
      cs => cs.trim().toLowerCase() === subj.trim().toLowerCase()
    ));
    return valid.length > 0 ? valid : assigned;
  }, [isStaffAdmin, classCurriculumSubjects, currentUser.assignedSubjects]);

  const hasEditPermission = React.useMemo(() => {
    if (isStaffAdmin) return true;
    if (settings.allowAllTeachersScoreEntry) return true;
    const assignedClasses = currentUser.assignedClasses || [];
    const teachesClass = assignedClasses.some(c => isClassMatch(c, selectedClass)) ||
      (currentUser.isFormTeacherOf && isClassMatch(currentUser.isFormTeacherOf, selectedClass));

    if (!teachesClass) return false;

    const assignedSubjects = currentUser.assignedSubjects || [];
    if (assignedSubjects.length === 0) return true;

    const cleanSubject = selectedSubject.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const canSubj = assignedSubjects.some(s => {
      const cleanAssigned = s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanAssigned === cleanSubject || cleanAssigned.includes(cleanSubject) || cleanSubject.includes(cleanAssigned);
    });
    return canSubj;
  }, [isStaffAdmin, selectedClass, selectedSubject, settings.allowAllTeachersScoreEntry, currentUser.assignedClasses, currentUser.isFormTeacherOf, currentUser.assignedSubjects]);

  const caConfig = getCAConfig(selectedClass, settings);
  // Match students belonging to this class or grade (e.g. all JSS 3 students if JSS 3 is selected)
  const classStudents = React.useMemo(() => {
    const matched = students.filter(s => isClassMatch(s.className, selectedClass));
    if (matched.length > 0) return matched;
    // Fallback: match by section
    return students.filter(s => isJuniorClass(s.className) === isJuniorClass(selectedClass));
  }, [students, selectedClass]);

  React.useEffect(() => {
    if (isOpen) {
      const targetCls = normalizeClass(initialClass);
      const cls = allowedClasses.includes(targetCls) ? targetCls : (allowedClasses[0] || targetCls);
      setSelectedClass(cls);
      const curSubjects = getSubjectsForClass(cls);
      const validSubj = isStaffAdmin ? curSubjects : (currentUser.assignedSubjects || []).filter(s => curSubjects.some(cs => cs.toLowerCase() === s.toLowerCase()));
      const subj = validSubj.includes(initialSubject as any) ? initialSubject : (validSubj[0] || initialSubject || curSubjects[0]);
      setSelectedSubject(subj);
      setUploadTerm(activeTerm === 'Cumulative' ? 'Third Term' : (activeTerm || 'Third Term'));
      setCsvText('');
      setParsedRows([]);
      setHasParsed(false);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialClass, initialSubject, activeTerm, allowedClasses, isStaffAdmin, currentUser.assignedSubjects]);

  if (!isOpen) return null;

  // Download a ready-to-fill CSV template with the class student roster
  const handleDownloadTemplate = () => {
    const isCa4Used = caConfig.ca4Max > 0;
    const headers = isCa4Used 
      ? ['Learner ID', 'Student Name', `CA1 (Max ${caConfig.ca1Max})`, `CA2 (Max ${caConfig.ca2Max})`, `CA3 (Max ${caConfig.ca3Max})`, `CA4 (Max ${caConfig.ca4Max})`, `Exam (Max ${caConfig.examMax})`]
      : ['Learner ID', 'Student Name', `CA1 (Max ${caConfig.ca1Max})`, `CA2 (Max ${caConfig.ca2Max})`, `CA3 (Max ${caConfig.ca3Max})`, `Exam (Max ${caConfig.examMax})`];
    
    const rows = classStudents.map(st => {
      const currentScore = st.termScores?.[uploadTerm]?.[selectedSubject] || st.scores[selectedSubject];
      if (isCa4Used) {
        return [
          `"${st.learnerId}"`,
          `"${st.name}"`,
          currentScore?.ca1 ?? '',
          currentScore?.ca2 ?? '',
          currentScore?.ca3 ?? '',
          currentScore?.ca4 ?? '',
          currentScore?.exam ?? '',
        ].join(',');
      } else {
        return [
          `"${st.learnerId}"`,
          `"${st.name}"`,
          currentScore?.ca1 ?? '',
          currentScore?.ca2 ?? '',
          currentScore?.ca3 ?? '',
          currentScore?.exam ?? '',
        ].join(',');
      }
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedClass.replace(/\s+/g, '_')}_${selectedSubject.replace(/\s+/g, '_')}_${uploadTerm.replace(/\s+/g, '_')}_Scores.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseScoreData = (content: string) => {
    const rawLines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length < 2) {
      setErrorMessage('The CSV file appears empty or missing data rows.');
      setParsedRows([]);
      setHasParsed(false);
      return;
    }

    // Detect delimiter: comma, semicolon, or tab
    const firstLine = rawLines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    let delimiter = ',';
    if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
    else if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';

    const splitLine = (line: string): string[] => {
      if (delimiter === '\t') {
        return line.split('\t').map(c => c.replace(/^"|"$/g, '').trim());
      }
      if (delimiter === ';') {
        return line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
      }
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    };

    const headerCols = splitLine(rawLines[0]).map(h => h.toLowerCase());
    
    // Check if first line is indeed a header (contains "learner" or "name" or "ca" or "exam")
    const isHeader = headerCols.some(h => 
      h.includes('learner') || h.includes('name') || h.includes('ca') || h.includes('exam') || h.includes('admission') || h.includes('student')
    );
    const dataLines = isHeader ? rawLines.slice(1) : rawLines;

    // Detect column indexes from header if available
    let learnerIdIdx = headerCols.findIndex(h => h.includes('learner') || h.includes('adm') || h.includes('id'));
    let nameIdx = headerCols.findIndex(h => h.includes('name') || h.includes('student'));
    let ca1Idx = headerCols.findIndex(h => h.includes('ca1') || h.includes('ca 1') || h.includes('first ca'));
    let ca2Idx = headerCols.findIndex(h => h.includes('ca2') || h.includes('ca 2') || h.includes('second ca'));
    let ca3Idx = headerCols.findIndex(h => h.includes('ca3') || h.includes('ca 3') || h.includes('third ca'));
    let ca4Idx = headerCols.findIndex(h => h.includes('ca4') || h.includes('ca 4') || h.includes('fourth ca'));
    let examIdx = headerCols.findIndex(h => h.includes('exam'));

    if (learnerIdIdx === -1) learnerIdIdx = 0;
    if (nameIdx === -1) nameIdx = 1;

    const rows: ParsedRow[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const cols = splitLine(line);
      if (cols.length < 3) continue;

      const identifier = (cols[learnerIdIdx] ?? cols[0] ?? '').trim();
      const name = (cols[nameIdx] ?? cols[1] ?? '').trim();

      // Find matching student in this class or across students roster
      const targetId = identifier.toLowerCase();
      const cleanTargetId = targetId.replace(/[^a-z0-9]/g, '');
      const targetName = name.toLowerCase();

      let student = classStudents.find(s => {
        const sLearner = s.learnerId.trim().toLowerCase();
        const sId = s.id.trim().toLowerCase();
        const sName = s.name.trim().toLowerCase();
        const cleanSLearner = sLearner.replace(/[^a-z0-9]/g, '');

        if (targetId && (sLearner === targetId || sId === targetId)) return true;
        if (cleanTargetId && cleanSLearner && (cleanTargetId === cleanSLearner || cleanSLearner.endsWith(cleanTargetId))) return true;
        if (targetName && (sName === targetName || sName.includes(targetName) || targetName.includes(sName))) return true;
        return false;
      });

      // Fallback search across full roster
      if (!student) {
        student = students.find(s => {
          const sLearner = s.learnerId.trim().toLowerCase();
          const sId = s.id.trim().toLowerCase();
          const cleanSLearner = sLearner.replace(/[^a-z0-9]/g, '');
          if (targetId && (sLearner === targetId || sId === targetId)) return true;
          if (cleanTargetId && cleanSLearner && (cleanTargetId === cleanSLearner || cleanSLearner.endsWith(cleanTargetId))) return true;
          return false;
        });
      }

      if (!student) {
        continue;
      }

      // Numerical scores extraction with fallback positional indexes
      const isSixCol = caConfig.ca4Max === 0 || (ca4Idx === -1 && cols.length <= 6);

      const valAt = (idx: number, fallbackPos: number) => {
        const primary = idx !== -1 ? cols[idx] : undefined;
        const valStr = primary !== undefined ? primary : cols[fallbackPos];
        if (valStr === undefined || valStr === '' || isNaN(Number(valStr))) return null;
        return Number(valStr);
      };

      const ca1 = valAt(ca1Idx, 2);
      const ca2 = valAt(ca2Idx, 3);
      const ca3 = valAt(ca3Idx, 4);
      const ca4 = isSixCol ? 0 : valAt(ca4Idx, 5);
      const exam = isSixCol ? valAt(examIdx, 5) : valAt(examIdx, 6);

      let isValid = true;
      let errorMsg: string | undefined;

      if (ca1 !== null && (ca1 < 0 || ca1 > caConfig.ca1Max)) {
        isValid = false;
        errorMsg = `CA1 (${ca1}) exceeds max ${caConfig.ca1Max}`;
      } else if (ca2 !== null && (ca2 < 0 || ca2 > caConfig.ca2Max)) {
        isValid = false;
        errorMsg = `CA2 (${ca2}) exceeds max ${caConfig.ca2Max}`;
      } else if (ca3 !== null && (ca3 < 0 || ca3 > caConfig.ca3Max)) {
        isValid = false;
        errorMsg = `CA3 (${ca3}) exceeds max ${caConfig.ca3Max}`;
      } else if (ca4 !== null && (ca4 < 0 || ca4 > caConfig.ca4Max)) {
        isValid = false;
        errorMsg = `CA4 (${ca4}) exceeds max ${caConfig.ca4Max}`;
      } else if (exam !== null && (exam < 0 || exam > caConfig.examMax)) {
        isValid = false;
        errorMsg = `Exam (${exam}) exceeds max ${caConfig.examMax}`;
      }

      const total = computeTotal(ca1, ca2, ca3, ca4, exam);
      const grade = calculateGrade(total, settings?.gradingScale);

      rows.push({
        studentId: student.id,
        learnerId: student.learnerId,
        name: student.name,
        ca1,
        ca2,
        ca3,
        ca4,
        exam,
        total,
        grade,
        isValid,
        errorMessage: errorMsg,
      });
    }

    if (rows.length === 0) {
      setErrorMessage(`No matching students found for ${selectedClass}. Check your Learner IDs or Student Names in the uploaded file.`);
      setParsedRows([]);
      setHasParsed(false);
      return;
    }

    setParsedRows(rows);
    setHasParsed(true);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        parseScoreData(text);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyUpload = () => {
    if (!hasEditPermission) {
      setErrorMessage(`Security Alert: Access Denied. You are not authorized to upload marks for ${selectedClass} - ${selectedSubject}.`);
      return;
    }

    if (parsedRows.length === 0) return;

    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('None of the rows are valid. Please fix scores exceeding maximum limits.');
      return;
    }

    const updates = validRows.map(r => ({
      studentId: r.studentId,
      ca1: r.ca1,
      ca2: r.ca2,
      ca3: r.ca3,
      ca4: r.ca4,
      exam: r.exam,
    }));

    batchUpdateSubjectScores(selectedClass, selectedSubject, updates, uploadTerm);
    addLog(
      'Teacher Uploaded Scores',
      `${currentUser.name} uploaded scores for ${validRows.length} students in ${selectedClass} - ${selectedSubject} (${uploadTerm})`
    );

    setSuccessMessage(`Successfully uploaded scores for ${validRows.length} students in ${selectedClass} (${uploadTerm})!`);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-300/40 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Red & Gold theme */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-amber-300 font-serif">Upload Student Scores (Self-Service)</h3>
                <span className="bg-amber-400 text-red-950 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  All Teachers
                </span>
              </div>
              <p className="text-xs text-amber-100/80">
                Upload CA1, CA2, CA3, CA4, and Exam marks directly via CSV or Excel spreadsheet
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
        <div className="p-6 overflow-y-auto space-y-5">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-center space-x-2 text-xs text-red-700 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Class, Subject & Term Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Class {isStaffAdmin ? '(All Classes)' : '(My Assigned)'}
              </label>
              <select
                value={selectedClass}
                onChange={e => {
                  setSelectedClass(e.target.value);
                  setHasParsed(false);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-700"
              >
                {allowedClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject ({allowedSubjects.length})
              </label>
              <select
                value={selectedSubject}
                onChange={e => {
                  setSelectedSubject(e.target.value);
                  setHasParsed(false);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-700"
              >
                {allowedSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Term</label>
              <select
                value={uploadTerm}
                onChange={e => {
                  setUploadTerm(e.target.value);
                  setHasParsed(false);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-700"
              >
                <option value="First Term">1st Term</option>
                <option value="Second Term">2nd Term</option>
                <option value="Third Term">3rd Term</option>
              </select>
            </div>
          </div>

          {/* Weight Limits Badge */}
          <div className="p-3 bg-amber-50/70 border border-amber-300/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-amber-900 font-medium">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Active Score Maximums for <strong>{selectedClass}</strong>:
              </span>
            </div>
            <div className="flex items-center space-x-2 font-mono font-bold text-slate-800 text-[11px]">
              <span className="bg-white px-2 py-0.5 rounded border border-amber-200">CA1: {caConfig.ca1Max}%</span>
              <span className="bg-white px-2 py-0.5 rounded border border-amber-200">CA2: {caConfig.ca2Max}%</span>
              <span className="bg-white px-2 py-0.5 rounded border border-amber-200">CA3: {caConfig.ca3Max}%</span>
              <span className="bg-white px-2 py-0.5 rounded border border-amber-200">CA4: {caConfig.ca4Max}%</span>
              <span className="bg-white px-2 py-0.5 rounded border border-amber-200">Exam: {caConfig.examMax}%</span>
            </div>
          </div>

          {/* Two-step upload: Step 1 Template & Step 2 Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 1: Download Template */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Step 1 • Get Class Spreadsheet
                </div>
                <h4 className="text-sm font-bold text-slate-800">Download Pre-filled Template</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Downloads an Excel/CSV file with all {classStudents.length} students enrolled in {selectedClass}. Fill marks offline and upload.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>Download {selectedClass} CSV Template</span>
              </button>
            </div>

            {/* Step 2: Upload Completed File */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Step 2 • Upload Completed Scores
                </div>
                <h4 className="text-sm font-bold text-slate-800">Select Completed CSV File</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Select your saved CSV file to parse student marks and compute cumulative totals.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv, text/csv, .txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow transition"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Browse & Upload CSV File</span>
              </button>
            </div>
          </div>

          {/* Or Paste CSV Text Directly */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Or Paste CSV / Tab-Separated Scores Directly</label>
              {csvText && (
                <button
                  type="button"
                  onClick={() => parseScoreData(csvText)}
                  className="text-xs font-bold text-red-800 hover:text-red-900"
                >
                  Re-parse Text
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={csvText}
              onChange={e => {
                setCsvText(e.target.value);
                if (e.target.value.trim().length > 10) {
                  parseScoreData(e.target.value);
                }
              }}
              placeholder={`Learner ID,Student Name,CA1,CA2,CA3,CA4,Exam\nSTP/2026/001,John Doe,8,9,8,10,54`}
              className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
          </div>

          {/* Parsed Preview Table */}
          {hasParsed && (
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Score Preview ({parsedRows.length} Students Matched)</span>
                <span className="text-emerald-700">
                  {parsedRows.filter(r => r.isValid).length} Valid • {parsedRows.filter(r => !r.isValid).length} Invalid
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">Learner ID</th>
                      <th className="p-2">Student Name</th>
                      <th className="p-2 text-center">CA1 ({caConfig.ca1Max})</th>
                      <th className="p-2 text-center">CA2 ({caConfig.ca2Max})</th>
                      <th className="p-2 text-center">CA3 ({caConfig.ca3Max})</th>
                      <th className="p-2 text-center">CA4 ({caConfig.ca4Max})</th>
                      <th className="p-2 text-center">Exam ({caConfig.examMax})</th>
                      <th className="p-2 text-center">Total</th>
                      <th className="p-2 text-center">Grade</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.isValid ? 'hover:bg-slate-50' : 'bg-red-50/70 text-red-900'}>
                        <td className="p-2 font-mono text-[11px] font-semibold">{r.learnerId}</td>
                        <td className="p-2 font-medium">{r.name}</td>
                        <td className="p-2 text-center">{r.ca1 ?? '-'}</td>
                        <td className="p-2 text-center">{r.ca2 ?? '-'}</td>
                        <td className="p-2 text-center">{r.ca3 ?? '-'}</td>
                        <td className="p-2 text-center">{r.ca4 ?? '-'}</td>
                        <td className="p-2 text-center">{r.exam ?? '-'}</td>
                        <td className="p-2 text-center font-bold">{r.total}</td>
                        <td className="p-2 text-center font-bold">{r.grade}</td>
                        <td className="p-2 text-[10px]">
                          {r.isValid ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Ready
                            </span>
                          ) : (
                            <span className="text-red-700 font-bold">{r.errorMessage}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Teacher: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.staffId})
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
              disabled={!hasParsed || parsedRows.filter(r => r.isValid).length === 0}
              onClick={handleApplyUpload}
              className={`flex items-center space-x-1.5 px-5 py-2 text-xs font-bold rounded-xl shadow-md transition ${
                !hasParsed || parsedRows.filter(r => r.isValid).length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white border border-amber-400'
              }`}
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Apply & Save {parsedRows.filter(r => r.isValid).length} Student Scores</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
