import React, { useState, useMemo, useCallback } from 'react';
import { Student, Teacher, SchoolSettings, SubjectScore } from '../types';
import { 
  SCHOOL_CLASSES, 
  getSubjectsForClass, 
  isJuniorClass, 
  calculateGrade, 
  computeTotal, 
  ALL_SUBJECTS, 
  DEFAULT_OFFICIAL_STAMP, 
  getCAConfig 
} from '../data/mockData';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Save, 
  BookOpen, 
  GraduationCap, 
  FileSpreadsheet, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  CheckCheck,
  Lock
} from 'lucide-react';

interface MissingMarksAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  currentUser: Teacher;
  settings: SchoolSettings;
  activeTerm: string;
  initialClass?: string;
  initialSubject?: string;
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
  addLog?: (action: string, details: string) => void;
}

export type DeficiencyFilterType = 'ALL_DEFICIENCIES' | 'MISSING_EXAM' | 'MISSING_CA' | 'COMPLETELY_BLANK';

interface DeficientRecord {
  student: Student;
  subject: string;
  className: string;
  term: string;
  currentScore: SubjectScore;
  missingCA1: boolean;
  missingCA2: boolean;
  missingCA3: boolean;
  missingCA4: boolean;
  missingExam: boolean;
  isCompletelyBlank: boolean;
  // Local edit states
  inputCA1: string;
  inputCA2: string;
  inputCA3: string;
  inputCA4: string;
  inputExam: string;
  isDirty: boolean;
}

export const MissingMarksAuditModal: React.FC<MissingMarksAuditModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  currentUser,
  settings,
  activeTerm,
  initialClass,
  initialSubject,
  updateStudentScore,
  batchUpdateSubjectScores,
  addLog,
}) => {
  const isStaffAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer';
  const allowedClasses = useMemo(() => {
    if (isStaffAdmin) return ['ALL', ...SCHOOL_CLASSES];
    const list = [...(currentUser.assignedClasses || [])];
    if (currentUser.isFormTeacherOf && !list.includes(currentUser.isFormTeacherOf)) {
      list.push(currentUser.isFormTeacherOf);
    }
    return list.length > 0 ? list : ['ALL'];
  }, [isStaffAdmin, currentUser.assignedClasses, currentUser.isFormTeacherOf]);

  const defaultClass = initialClass && allowedClasses.includes(initialClass)
    ? initialClass
    : (isStaffAdmin ? 'ALL' : (allowedClasses[0] || 'ALL'));

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject || 'ALL');
  const [auditTerm, setAuditTerm] = useState<string>(
    activeTerm === 'Cumulative' ? 'Third Term' : activeTerm || 'Third Term'
  );
  const [deficiencyType, setDeficiencyType] = useState<DeficiencyFilterType>('ALL_DEFICIENCIES');
  const [searchQuery, setSearchQuery] = useState('');

  // Local draft inputs state map: key `${studentId}__${subject}` -> { ca1, ca2, ca3, ca4, exam }
  const [draftEdits, setDraftEdits] = useState<Record<string, { ca1: string; ca2: string; ca3: string; ca4: string; exam: string }>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const canTeacherEditRecord = useCallback((className: string, subject: string): boolean => {
    if (isStaffAdmin) return true;
    const teachesClass = (currentUser.assignedClasses || []).includes(className) ||
      (currentUser.role === 'form_teacher' && currentUser.isFormTeacherOf === className);
    const teachesSubject = (currentUser.assignedSubjects || []).includes(subject);
    return !!(teachesClass && teachesSubject);
  }, [isStaffAdmin, currentUser]);

  if (!isOpen) return null;

  // Available subjects based on class filter
  const availableSubjects = useMemo(() => {
    const subs = selectedClass === 'ALL' ? ALL_SUBJECTS : getSubjectsForClass(selectedClass);
    if (isStaffAdmin) return subs;
    const assigned = currentUser.assignedSubjects || [];
    const filtered = assigned.filter(s => subs.includes(s as any));
    return filtered.length > 0 ? filtered : subs;
  }, [isStaffAdmin, selectedClass, currentUser.assignedSubjects]);

  // Compute all deficient records based on current filters
  const { allRecords, totalAudited, totalComplete, deficiencyStats } = useMemo(() => {
    const list: DeficientRecord[] = [];
    let auditedCount = 0;
    let completeCount = 0;

    let ca1MissingCount = 0;
    let ca2MissingCount = 0;
    let ca3MissingCount = 0;
    let ca4MissingCount = 0;
    let examMissingCount = 0;
    let blankCount = 0;

    // Filter students by selectedClass
    const scopedStudents = selectedClass === 'ALL' 
      ? students 
      : students.filter(s => s.className === selectedClass);

    for (const student of scopedStudents) {
      // Which subjects to audit for this student?
      const classSubjects = getSubjectsForClass(student.className);
      const targetSubjects = selectedSubject === 'ALL' 
        ? classSubjects 
        : classSubjects.filter(sub => sub === selectedSubject);

      for (const subj of targetSubjects) {
        auditedCount++;

        // Get score for auditTerm
        const sc: SubjectScore = student.termScores?.[auditTerm]?.[subj] || student.scores[subj] || {
          ca1: null,
          ca2: null,
          ca3: null,
          ca4: null,
          exam: null,
          total: 0,
          grade: 'F',
        };

        const caConfig = getCAConfig(student.className, settings);
        const missingCA1 = caConfig.ca1Max > 0 && (sc.ca1 === null || sc.ca1 === undefined);
        const missingCA2 = caConfig.ca2Max > 0 && (sc.ca2 === null || sc.ca2 === undefined);
        const missingCA3 = caConfig.ca3Max > 0 && (sc.ca3 === null || sc.ca3 === undefined);
        const missingCA4 = caConfig.ca4Max > 0 && (sc.ca4 === null || sc.ca4 === undefined);
        const missingExam = caConfig.examMax > 0 && (sc.exam === null || sc.exam === undefined);

        const isCompletelyBlank = missingCA1 && missingCA2 && missingCA3 && (caConfig.ca4Max === 0 || missingCA4) && missingExam;
        const isMissingAnyCA = missingCA1 || missingCA2 || missingCA3 || missingCA4;
        const isMissingExamOnly = !isMissingAnyCA && missingExam;

        const hasDeficiency = missingCA1 || missingCA2 || missingCA3 || missingCA4 || missingExam;

        if (!hasDeficiency) {
          completeCount++;
          continue;
        }

        if (missingCA1) ca1MissingCount++;
        if (missingCA2) ca2MissingCount++;
        if (missingCA3) ca3MissingCount++;
        if (missingCA4) ca4MissingCount++;
        if (missingExam) examMissingCount++;
        if (isCompletelyBlank) blankCount++;

        // Check if matching deficiencyType
        let matchesDeficiency = true;
        if (deficiencyType === 'MISSING_EXAM') {
          matchesDeficiency = missingExam;
        } else if (deficiencyType === 'MISSING_CA') {
          matchesDeficiency = isMissingAnyCA;
        } else if (deficiencyType === 'COMPLETELY_BLANK') {
          matchesDeficiency = isCompletelyBlank;
        }

        if (!matchesDeficiency) continue;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesSearch = 
            student.name.toLowerCase().includes(q) || 
            student.learnerId.toLowerCase().includes(q) ||
            subj.toLowerCase().includes(q) ||
            student.className.toLowerCase().includes(q);
          if (!matchesSearch) continue;
        }

        // Get draft edit if already modified locally
        const key = `${student.id}__${subj}`;
        const draft = draftEdits[key];

        list.push({
          student,
          subject: subj,
          className: student.className,
          term: auditTerm,
          currentScore: sc,
          missingCA1,
          missingCA2,
          missingCA3,
          missingCA4,
          missingExam,
          isCompletelyBlank,
          inputCA1: draft ? draft.ca1 : (sc.ca1 !== null && sc.ca1 !== undefined ? String(sc.ca1) : ''),
          inputCA2: draft ? draft.ca2 : (sc.ca2 !== null && sc.ca2 !== undefined ? String(sc.ca2) : ''),
          inputCA3: draft ? draft.ca3 : (sc.ca3 !== null && sc.ca3 !== undefined ? String(sc.ca3) : ''),
          inputCA4: draft ? draft.ca4 : (sc.ca4 !== null && sc.ca4 !== undefined ? String(sc.ca4) : ''),
          inputExam: draft ? draft.exam : (sc.exam !== null && sc.exam !== undefined ? String(sc.exam) : ''),
          isDirty: !!draft,
        });
      }
    }

    return {
      allRecords: list,
      totalAudited: auditedCount,
      totalComplete: completeCount,
      deficiencyStats: {
        ca1MissingCount,
        ca2MissingCount,
        ca3MissingCount,
        ca4MissingCount,
        examMissingCount,
        blankCount,
      },
    };
  }, [students, selectedClass, selectedSubject, auditTerm, deficiencyType, searchQuery, draftEdits]);

  // Completion percentage
  const completionPercentage = totalAudited > 0 
    ? Math.round((totalComplete / totalAudited) * 100) 
    : 100;

  // Handle inline score change for a specific deficient record
  const handleScoreInputChange = (
    studentId: string, 
    subject: string, 
    field: 'ca1' | 'ca2' | 'ca3' | 'ca4' | 'exam', 
    val: string
  ) => {
    const key = `${studentId}__${subject}`;
    setDraftEdits(prev => {
      const existing = prev[key] || {
        ca1: '',
        ca2: '',
        ca3: '',
        ca4: '',
        exam: '',
      };

      // Find current record
      const rec = allRecords.find(r => r.student.id === studentId && r.subject === subject);
      if (rec) {
        if (!prev[key]) {
          existing.ca1 = rec.inputCA1;
          existing.ca2 = rec.inputCA2;
          existing.ca3 = rec.inputCA3;
          existing.ca4 = rec.inputCA4;
          existing.exam = rec.inputExam;
        }
      }

      return {
        ...prev,
        [key]: {
          ...existing,
          [field]: val,
        },
      };
    });
  };

  // Save single record
  const handleSaveSingleRecord = (rec: DeficientRecord) => {
    if (!canTeacherEditRecord(rec.className, rec.subject)) {
      alert(`Access Blocked: You do not have authorization to edit marks for ${rec.subject} in ${rec.className}. This portal belongs to another teacher.`);
      return;
    }

    const key = `${rec.student.id}__${rec.subject}`;
    const draft = draftEdits[key];

    const rawCA1 = draft ? draft.ca1 : rec.inputCA1;
    const rawCA2 = draft ? draft.ca2 : rec.inputCA2;
    const rawCA3 = draft ? draft.ca3 : rec.inputCA3;
    const rawCA4 = draft ? draft.ca4 : rec.inputCA4;
    const rawExam = draft ? draft.exam : rec.inputExam;

    const caConfig = getCAConfig(rec.student.className, settings);
    const ca1 = rawCA1 !== '' ? Math.min(caConfig.ca1Max, Math.max(0, Number(rawCA1))) : null;
    const ca2 = rawCA2 !== '' ? Math.min(caConfig.ca2Max, Math.max(0, Number(rawCA2))) : null;
    const ca3 = rawCA3 !== '' ? Math.min(caConfig.ca3Max, Math.max(0, Number(rawCA3))) : null;
    const ca4 = caConfig.ca4Max > 0 && rawCA4 !== '' ? Math.min(caConfig.ca4Max, Math.max(0, Number(rawCA4))) : (caConfig.ca4Max === 0 ? 0 : null);
    const exam = rawExam !== '' ? Math.min(caConfig.examMax, Math.max(0, Number(rawExam))) : null;

    updateStudentScore(
      rec.student.id,
      rec.subject,
      ca1,
      ca2,
      ca3,
      ca4,
      exam,
      'submitted',
      auditTerm
    );

    // Clear draft edit for this record
    setDraftEdits(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    setSaveSuccessMessage(`Resolved score for ${rec.student.name} in ${rec.subject}!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);

    if (addLog) {
      addLog('Missing Score Resolved', `${currentUser.name} resolved missing score in ${rec.subject} for ${rec.student.name} (${rec.className})`);
    }
  };

  // Quick fill Absent "0"
  const handleQuickFillAbsent = (rec: DeficientRecord) => {
    if (!canTeacherEditRecord(rec.className, rec.subject)) {
      alert(`Access Blocked: You do not have authorization to edit marks for ${rec.subject} in ${rec.className}. This portal belongs to another teacher.`);
      return;
    }

    updateStudentScore(
      rec.student.id,
      rec.subject,
      rec.currentScore.ca1 ?? 0,
      rec.currentScore.ca2 ?? 0,
      rec.currentScore.ca3 ?? 0,
      rec.currentScore.ca4 ?? 0,
      0, // absent for exam
      'submitted',
      auditTerm
    );

    setSaveSuccessMessage(`Marked ${rec.student.name} as Absent (0) for ${rec.subject} exam.`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Save all modified drafts at once
  const handleSaveAllModified = () => {
    const keys = Object.keys(draftEdits);
    if (keys.length === 0) {
      alert('No mark modifications detected. Type in scores before clicking save all.');
      return;
    }

    let savedCount = 0;
    let blockedCount = 0;
    for (const key of keys) {
      const [studentId, subject] = key.split('__');
      const draft = draftEdits[key];
      const student = students.find(s => s.id === studentId);
      if (!student) continue;

      // Strict Anti-Manipulation: Prevent editing another teacher's subject portal
      if (!canTeacherEditRecord(student.className, subject)) {
        blockedCount++;
        continue;
      }

      const caConfig = getCAConfig(student.className, settings);
      const ca1 = draft.ca1 !== '' ? Math.min(caConfig.ca1Max, Math.max(0, Number(draft.ca1))) : null;
      const ca2 = draft.ca2 !== '' ? Math.min(caConfig.ca2Max, Math.max(0, Number(draft.ca2))) : null;
      const ca3 = draft.ca3 !== '' ? Math.min(caConfig.ca3Max, Math.max(0, Number(draft.ca3))) : null;
      const ca4 = caConfig.ca4Max > 0 && draft.ca4 !== '' ? Math.min(caConfig.ca4Max, Math.max(0, Number(draft.ca4))) : (caConfig.ca4Max === 0 ? 0 : null);
      const exam = draft.exam !== '' ? Math.min(caConfig.examMax, Math.max(0, Number(draft.exam))) : null;

      updateStudentScore(
        studentId,
        subject,
        ca1,
        ca2,
        ca3,
        ca4,
        exam,
        'submitted',
        auditTerm
      );
      savedCount++;
    }

    setDraftEdits({});
    if (blockedCount > 0) {
      setSaveSuccessMessage(`Saved ${savedCount} marks. ${blockedCount} records skipped (protected: belongs to another teacher).`);
    } else {
      setSaveSuccessMessage(`Successfully saved and resolved ${savedCount} missing mark records!`);
    }
    setTimeout(() => setSaveSuccessMessage(null), 4000);

    if (addLog) {
      addLog('Batch Missing Marks Resolved', `${currentUser.name} batch-resolved ${savedCount} missing scores in ${selectedClass} (${auditTerm})`);
    }
  };

  // Print official Defaulters / Missing Scores Notice
  const handlePrintMissingNotice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = allRecords.map((r, i) => {
      const missingBadges = [];
      if (r.missingCA1) missingBadges.push('CA1(5)');
      if (r.missingCA2) missingBadges.push('CA2(5)');
      if (r.missingCA3) missingBadges.push('CA3(10)');
      if (r.missingCA4) missingBadges.push('CA4(10)');
      if (r.missingExam) missingBadges.push('EXAM(70)');

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px; text-align: center;">${i + 1}</td>
          <td style="padding: 6px; font-family: monospace; font-weight: bold;">${r.student.learnerId}</td>
          <td style="padding: 6px; font-weight: bold;">${r.student.name}</td>
          <td style="padding: 6px; text-align: center;">${r.className}</td>
          <td style="padding: 6px; font-weight: bold; color: #7f1d1d;">${r.subject}</td>
          <td style="padding: 6px; color: #b91c1c; font-weight: bold;">${missingBadges.join(', ') || 'Incomplete'}</td>
          <td style="padding: 6px; width: 120px; border-bottom: 1px dashed #94a3b8;"></td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MISSING SCORES AUDIT REPORT - ${settings.schoolName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; margin: 0; }
            .header { text-align: center; border-bottom: 2px solid #7f1d1d; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 18px; font-weight: bold; color: #7f1d1d; margin: 0; }
            .subtitle { font-size: 12px; color: #475569; margin: 4px 0 0 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            th { background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 8px; font-size: 11px; text-align: left; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #cbd5e1; padding-top: 12px; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${settings.schoolName}</h1>
            <p class="subtitle">${settings.schoolAddress} • EXAMINATION & CONTINUOUS ASSESSMENT AUDIT</p>
            <h3 style="margin: 8px 0 0 0; font-size: 14px; color: #1e293b;">
              OFFICIAL MISSING MARKS & SCORE DEFICIENCY NOTICE (${auditTerm.toUpperCase()} - ${settings.session})
            </h3>
            <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">
              Class Scope: <strong>${selectedClass}</strong> | Subject Scope: <strong>${selectedSubject}</strong> | Generated: ${new Date().toLocaleString()}
            </p>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #991b1b; margin-bottom: 12px;">
            <strong>ATTENTION SUBJECT TEACHERS:</strong> The following <strong>${allRecords.length} student scores</strong> are currently missing from the college examination database. Subject masters are instructed to enter and submit all pending Continuous Assessments (CA 1-4) and Examination marks immediately.
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">S/N</th>
                <th style="width: 110px;">Learner ID</th>
                <th>Student Full Name</th>
                <th style="width: 70px; text-align: center;">Class</th>
                <th>Subject</th>
                <th>Missing Components</th>
                <th>Teacher Signature / Mark</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>
              <p>Generated by: <strong>${currentUser.name}</strong> (${currentUser.role.replace('_', ' ').toUpperCase()})</p>
              <p>Total Deficiencies: <strong>${allRecords.length} records</strong></p>
            </div>
            <div style="text-align: right;">
              <p>Examination Officer / Principal Signature & Stamp</p>
              <div style="height: 40px; border-bottom: 1px solid #000; width: 200px; margin-top: 10px;"></div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // Export Defaulters to CSV
  const handleExportCSV = () => {
    const headers = ['S/N,Learner ID,Student Name,Gender,Class,Subject,Missing Components,Current CA1,Current CA2,Current CA3,Current CA4,Current Exam,Total,Grade'];
    const rows = allRecords.map((r, i) => {
      const missingList: string[] = [];
      if (r.missingCA1) missingList.push('CA1');
      if (r.missingCA2) missingList.push('CA2');
      if (r.missingCA3) missingList.push('CA3');
      if (r.missingCA4) missingList.push('CA4');
      if (r.missingExam) missingList.push('Exam');

      return [
        i + 1,
        `"${r.student.learnerId}"`,
        `"${r.student.name}"`,
        r.student.gender,
        `"${r.className}"`,
        `"${r.subject}"`,
        `"${missingList.join(';')}"`,
        r.currentScore.ca1 ?? 'MISSING',
        r.currentScore.ca2 ?? 'MISSING',
        r.currentScore.ca3 ?? 'MISSING',
        r.currentScore.ca4 ?? 'MISSING',
        r.currentScore.exam ?? 'MISSING',
        r.currentScore.total,
        r.currentScore.grade,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join('\n'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Missing_Scores_Audit_${selectedClass}_${auditTerm}_${settings.session}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-900 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Modal Top Header Bar */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white p-4 sm:p-5 border-b-2 border-amber-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-red-950 flex items-center justify-center font-black shadow-lg shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg font-serif text-amber-300 tracking-wide">
                  Teacher Missing Marks & Score Audit Engine
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-red-800 text-amber-200 text-[10px] font-bold border border-amber-400/40 uppercase">
                  Quality Assurance
                </span>
              </div>
              <p className="text-xs text-amber-100/80">
                Instantly scan all classes & subjects for unentered Continuous Assessments (CA 1–4) and Exam marks.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintMissingNotice}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 hover:text-white border border-amber-400/50 text-xs font-bold transition shadow-sm"
              title="Print official Missing Marks Defaulters Notice for Exam Committee / Notice Board"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Print Notice</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 hover:text-white border border-amber-400/50 text-xs font-bold transition shadow-sm"
              title="Download CSV audit list of missing scores"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-amber-200/80 hover:text-white hover:bg-red-800/80 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls & KPI Overview Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {/* Class Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Class Scope
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600"
              >
                {allowedClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {cls === 'ALL' ? (isStaffAdmin ? 'All Classes (Entire School)' : 'All My Classes') : cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Subject Scope
              </label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600"
              >
                <option value="ALL">All Subjects</option>
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Academic Term */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Academic Term
              </label>
              <select
                value={auditTerm}
                onChange={e => setAuditTerm(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 text-red-950"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            {/* Deficiency Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Defect Category
              </label>
              <select
                value={deficiencyType}
                onChange={e => setDeficiencyType(e.target.value as DeficiencyFilterType)}
                className="w-full text-xs font-bold px-2.5 py-1.5 bg-amber-50 border border-amber-300 text-red-950 rounded-lg focus:ring-2 focus:ring-red-600"
              >
                <option value="ALL_DEFICIENCIES">Any Missing Mark ({allRecords.length})</option>
                <option value="MISSING_EXAM">Missing Exam Only</option>
                <option value="MISSING_CA">Missing Continuous Assessment</option>
                <option value="COMPLETELY_BLANK">Completely Blank (No Scores)</option>
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Search Student or Subject
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* KPI Cards & Submission Health Progress Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Expected Marks</span>
              <span className="text-base font-black text-slate-900">{totalAudited}</span>
            </div>

            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] text-emerald-700 block uppercase font-bold">Complete Entries</span>
              <span className="text-base font-black text-emerald-800">{totalComplete}</span>
            </div>

            <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 shadow-xs">
              <span className="text-[10px] text-red-700 block uppercase font-bold">Missing Records</span>
              <span className="text-base font-black text-red-900">{allRecords.length}</span>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 shadow-xs">
              <span className="text-[10px] text-amber-800 block uppercase font-bold">Missing Exams</span>
              <span className="text-base font-black text-amber-900">{deficiencyStats.examMissingCount}</span>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 shadow-xs">
              <span className="text-[10px] text-amber-800 block uppercase font-bold">Missing CAs</span>
              <span className="text-base font-black text-amber-900">
                {deficiencyStats.ca1MissingCount + deficiencyStats.ca2MissingCount + deficiencyStats.ca3MissingCount + deficiencyStats.ca4MissingCount}
              </span>
            </div>

            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-purple-700 block uppercase font-bold">Completion Rate</span>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black text-purple-900">{completionPercentage}%</span>
                <div className="flex-1 bg-purple-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-purple-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback alert toast */}
        {saveSuccessMessage && (
          <div className="bg-emerald-100 border-b border-emerald-300 px-4 py-2.5 text-xs text-emerald-900 font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-800 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Audit Results Table */}
        <div className="flex-1 p-4 overflow-y-auto">
          {allRecords.length === 0 ? (
            <div className="text-center py-16 px-4 bg-emerald-50/50 rounded-2xl border-2 border-dashed border-emerald-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
                <CheckCheck className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-emerald-950 font-serif">
                100% Complete! No Missing Marks Detected
              </h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto mt-1">
                All continuous assessments (CA 1–4) and examination scores for <strong>{selectedClass}</strong> in <strong>{selectedSubject}</strong> ({auditTerm}) have been successfully recorded and verified.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-700">
                  Showing <strong>{allRecords.length}</strong> deficient records. Enter missing marks inline and click <strong>"Save"</strong>:
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveAllModified}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save All Entered Marks ({Object.keys(draftEdits).length})</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Student & ID</th>
                      <th className="py-2.5 px-2">Class</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Deficiencies Detected</th>
                      <th className="py-2.5 px-2 text-center w-16">CA1</th>
                      <th className="py-2.5 px-2 text-center w-16">CA2</th>
                      <th className="py-2.5 px-2 text-center w-16">CA3</th>
                      <th className="py-2.5 px-2 text-center w-16">CA4</th>
                      <th className="py-2.5 px-2 text-center w-20">Exam</th>
                      <th className="py-2.5 px-2 text-center w-16">Total</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allRecords.map((rec, index) => {
                      const canEdit = canTeacherEditRecord(rec.className, rec.subject);
                      const totalVal = computeTotal(
                        rec.inputCA1 !== '' ? Number(rec.inputCA1) : null,
                        rec.inputCA2 !== '' ? Number(rec.inputCA2) : null,
                        rec.inputCA3 !== '' ? Number(rec.inputCA3) : null,
                        rec.inputCA4 !== '' ? Number(rec.inputCA4) : null,
                        rec.inputExam !== '' ? Number(rec.inputExam) : null
                      );
                      const gradeVal = calculateGrade(totalVal, settings?.gradingScale);

                      return (
                        <tr 
                          key={`${rec.student.id}__${rec.subject}`}
                          className={`hover:bg-amber-50/40 transition ${
                            rec.isDirty ? 'bg-amber-50/70 border-l-4 border-amber-500' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">
                            {index + 1}
                          </td>

                          {/* Student name & ID */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 leading-tight">
                              {rec.student.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              {rec.student.learnerId} • {rec.student.gender}
                            </div>
                          </td>

                          {/* Class */}
                          <td className="py-2.5 px-2">
                            <span className="font-bold text-red-950 bg-red-100/70 px-1.5 py-0.5 rounded text-[10px]">
                              {rec.className}
                            </span>
                          </td>

                          {/* Subject */}
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 text-[11px]">
                              {rec.subject}
                            </span>
                          </td>

                          {/* Deficiency Badges */}
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {rec.isCompletelyBlank ? (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[9px] uppercase border border-red-200">
                                  No Scores Recorded
                                </span>
                              ) : (
                                <>
                                  {rec.missingCA1 && (
                                    <span className="px-1 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[9px]">
                                      No CA1
                                    </span>
                                  )}
                                  {rec.missingCA2 && (
                                    <span className="px-1 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[9px]">
                                      No CA2
                                    </span>
                                  )}
                                  {rec.missingCA3 && (
                                    <span className="px-1 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[9px]">
                                      No CA3
                                    </span>
                                  )}
                                  {rec.missingCA4 && (
                                    <span className="px-1 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[9px]">
                                      No CA4
                                    </span>
                                  )}
                                  {rec.missingExam && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-900 rounded font-black text-[9px] border border-red-300">
                                      ⚠️ Missing Exam
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          {/* CA1 (Max 5) */}
                          <td className="py-2 px-1 text-center">
                            <input
                              type="number"
                              disabled={!canEdit}
                              min="0"
                              max="5"
                              step="0.5"
                              placeholder="5"
                              value={rec.inputCA1}
                              onChange={e => handleScoreInputChange(rec.student.id, rec.subject, 'ca1', e.target.value)}
                              className={`w-12 text-center text-xs font-bold py-1 px-1 rounded border disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                                rec.missingCA1 && rec.inputCA1 === ''
                                  ? 'border-red-400 bg-red-50 text-red-900'
                                  : 'border-slate-300 bg-white text-slate-800'
                              } focus:ring-1 focus:ring-red-600 focus:outline-none`}
                            />
                          </td>

                          {/* CA2 (Max 5) */}
                          <td className="py-2 px-1 text-center">
                            <input
                              type="number"
                              disabled={!canEdit}
                              min="0"
                              max="5"
                              step="0.5"
                              placeholder="5"
                              value={rec.inputCA2}
                              onChange={e => handleScoreInputChange(rec.student.id, rec.subject, 'ca2', e.target.value)}
                              className={`w-12 text-center text-xs font-bold py-1 px-1 rounded border disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                                rec.missingCA2 && rec.inputCA2 === ''
                                  ? 'border-red-400 bg-red-50 text-red-900'
                                  : 'border-slate-300 bg-white text-slate-800'
                              } focus:ring-1 focus:ring-red-600 focus:outline-none`}
                            />
                          </td>

                          {/* CA3 (Max 10) */}
                          <td className="py-2 px-1 text-center">
                            <input
                              type="number"
                              disabled={!canEdit}
                              min="0"
                              max="10"
                              step="0.5"
                              placeholder="10"
                              value={rec.inputCA3}
                              onChange={e => handleScoreInputChange(rec.student.id, rec.subject, 'ca3', e.target.value)}
                              className={`w-12 text-center text-xs font-bold py-1 px-1 rounded border disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                                rec.missingCA3 && rec.inputCA3 === ''
                                  ? 'border-red-400 bg-red-50 text-red-900'
                                  : 'border-slate-300 bg-white text-slate-800'
                              } focus:ring-1 focus:ring-red-600 focus:outline-none`}
                            />
                          </td>

                          {/* CA4 (Max 10) */}
                          <td className="py-2 px-1 text-center">
                            <input
                              type="number"
                              disabled={!canEdit}
                              min="0"
                              max="10"
                              step="0.5"
                              placeholder="10"
                              value={rec.inputCA4}
                              onChange={e => handleScoreInputChange(rec.student.id, rec.subject, 'ca4', e.target.value)}
                              className={`w-12 text-center text-xs font-bold py-1 px-1 rounded border disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                                rec.missingCA4 && rec.inputCA4 === ''
                                  ? 'border-red-400 bg-red-50 text-red-900'
                                  : 'border-slate-300 bg-white text-slate-800'
                              } focus:ring-1 focus:ring-red-600 focus:outline-none`}
                            />
                          </td>

                          {/* Exam (Max 70) */}
                          <td className="py-2 px-1 text-center">
                            <input
                              type="number"
                              disabled={!canEdit}
                              min="0"
                              max="70"
                              step="0.5"
                              placeholder="70"
                              value={rec.inputExam}
                              onChange={e => handleScoreInputChange(rec.student.id, rec.subject, 'exam', e.target.value)}
                              className={`w-16 text-center text-xs font-black py-1 px-1 rounded border disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                                rec.missingExam && rec.inputExam === ''
                                  ? 'border-red-500 bg-red-100 text-red-950 animate-pulse'
                                  : 'border-slate-300 bg-white text-slate-900'
                              } focus:ring-2 focus:ring-red-600 focus:outline-none`}
                            />
                          </td>

                          {/* Total & Grade preview */}
                          <td className="py-2.5 px-2 text-center font-bold">
                            <span className="text-slate-900">{totalVal}</span>
                            <span className={`ml-1 text-[10px] px-1 py-0.2 rounded font-black ${
                              gradeVal === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              gradeVal === 'F' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {gradeVal}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            {!canEdit ? (
                              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 shadow-2xs" title="Scores Portal Restricted: This subject belongs to another teacher">
                                <Lock className="w-3 h-3 text-amber-700" />
                                <span>Locked</span>
                              </span>
                            ) : (
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickFillAbsent(rec)}
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-300"
                                  title="Mark as Absent (0)"
                                >
                                  Absent (0)
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleRecord(rec)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shadow-xs flex items-center space-x-1"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Save</span>
                                </button>
                              </div>
                            )}
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

        {/* Modal Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <span className="font-bold text-red-950">ST. PAUL COLLEGE GWAGWALADA</span>
            <span>•</span>
            <span>Continuous Assessment (CA 1: 5%, CA 2: 5%, CA 3: 10%, CA 4: 10%, Exam: 70%)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveAllModified}
              disabled={Object.keys(draftEdits).length === 0}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Save All Modified Records ({Object.keys(draftEdits).length})
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
