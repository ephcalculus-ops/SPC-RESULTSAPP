import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, Teacher, SchoolSettings, AffectiveAssessment, PsychomotorAssessment } from '../types';
import { 
  SCHOOL_CLASSES, 
  isJuniorClass, 
  getSubjectsForClass, 
  getCAConfig, 
  DEFAULT_SCHOOL_LOGO, 
  DEFAULT_OFFICIAL_STAMP,
  DEFAULT_GRADING_SCALE,
  getGradeRemark
} from '../data/mockData';
import { PDFExportService } from '../services/pdfExportService';
import { compressPassportImage, validateImageFile } from '../utils/imageCompressor';
import { StudentBiodataModal } from './StudentBiodataModal';
import { 
  getSuggestedFormTeacherComment, 
  getSuggestedPrincipalComment, 
  FORM_TEACHER_COMMENT_BANK, 
  PRINCIPAL_COMMENT_BANK 
} from '../utils/commentPresets';
import { 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  Edit3, 
  Save, 
  Check, 
  Sparkles, 
  QrCode, 
  ShieldCheck,
  Download,
  Loader2,
  GraduationCap,
  Camera,
  Upload,
  MessageSquare,
  FolderUp,
  Stamp,
  Lock,
  Award
} from 'lucide-react';

const DEFAULT_AFFECTIVE: AffectiveAssessment = {
  punctuality: 5,
  honesty: 5,
  politeness: 5,
  neatness: 5,
  perseverance: 5,
  relationshipWithOthers: 5,
  diligence: 5,
  creativity: 5,
  classParticipation: 5,
};

const DEFAULT_PSYCHOMOTOR: PsychomotorAssessment = {
  verbalFluency: 5,
  gamesSports: 5,
  musicalSkills: 5,
  drawingPainting: 5,
  handWriting: 5,
};

interface ReportCardViewProps {
  students: Student[];
  selectedStudent?: Student;
  onSelectStudent: (student: Student) => void;
  currentUser: Teacher;
  settings: SchoolSettings;
  activeTerm?: string;
  onSelectTerm?: (term: string) => void;
  canEditFormTeacherSection: (className: string) => boolean;
  canEditPrincipalSection: () => boolean;
  updateStudentAssessments: (
    studentId: string,
    affective: AffectiveAssessment,
    psychomotor: PsychomotorAssessment,
    daysPresent: number,
    formTeacherComment: string
  ) => void;
  updatePrincipalComment: (studentId: string, principalComment: string) => void;
  canUpdatePassport?: (className: string) => boolean;
  onUpdateStudentPassport?: (studentId: string, passportPhoto: string) => void;
  onUpdateStudent?: (studentId: string, updates: Partial<Student>) => void;
  onOpenClassCommentsModal?: (initialClass?: string) => void;
  onOpenPassportModal?: (initialClass?: string) => void;
  onOpenStampModal?: () => void;
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({
  students,
  selectedStudent,
  onSelectStudent,
  currentUser,
  settings,
  activeTerm,
  onSelectTerm,
  canEditFormTeacherSection,
  canEditPrincipalSection,
  canUpdatePassport,
  updateStudentAssessments,
  updatePrincipalComment,
  onUpdateStudentPassport,
  onUpdateStudent,
  onOpenClassCommentsModal,
  onOpenPassportModal,
  onOpenStampModal,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(selectedStudent?.className || 'JSS 1 A');
  const [viewTerm, setViewTerm] = useState<string>(activeTerm || 'Third Term');
  const [isEditingComments, setIsEditingComments] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [passportFeedback, setPassportFeedback] = useState<string | null>(null);
  const [isBiodataModalOpen, setIsBiodataModalOpen] = useState(false);

  // Hidden file input for direct passport photo upload
  const reportPassportInputRef = useRef<HTMLInputElement>(null);

  // Sync viewTerm with global activeTerm if changed from outside
  React.useEffect(() => {
    if (activeTerm) {
      setViewTerm(activeTerm);
    }
  }, [activeTerm]);

  // Local draft state for comments and assessments
  const [formCommentDraft, setFormCommentDraft] = useState(selectedStudent?.formTeacherComment || '');
  const [principalCommentDraft, setPrincipalCommentDraft] = useState(selectedStudent?.principalComment || '');
  const [daysPresentDraft, setDaysPresentDraft] = useState(selectedStudent?.daysPresent || 0);
  const [affectiveDraft, setAffectiveDraft] = useState<AffectiveAssessment>(selectedStudent?.affective || DEFAULT_AFFECTIVE);
  const [psychomotorDraft, setPsychomotorDraft] = useState<PsychomotorAssessment>(selectedStudent?.psychomotor || DEFAULT_PSYCHOMOTOR);

  // Keep draft in sync when student changes
  React.useEffect(() => {
    if (selectedStudent) {
      setFormCommentDraft(selectedStudent.formTeacherComment || '');
      setPrincipalCommentDraft(selectedStudent.principalComment || '');
      setDaysPresentDraft(selectedStudent.daysPresent || 0);
      setAffectiveDraft(selectedStudent.affective || DEFAULT_AFFECTIVE);
      setPsychomotorDraft(selectedStudent.psychomotor || DEFAULT_PSYCHOMOTOR);
      setSelectedClass(selectedStudent.className);
    }
  }, [selectedStudent]);

  if (!selectedStudent) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12">
        <GraduationCap className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Student Selected</h3>
        <p className="text-sm text-slate-500 mt-1">Please select or register a student to view and print their terminal continuous assessment report sheet.</p>
      </div>
    );
  }

  const classStudents = students.filter(s => s.className === selectedClass);
  const currentIndex = classStudents.findIndex(s => s.id === selectedStudent.id);

  const canEditForm = canEditFormTeacherSection(selectedStudent.className);
  const canEditPrincipal = canEditPrincipalSection();

  // Junior vs Senior distinction
  const isJunior = isJuniorClass(selectedStudent.className);
  const subjects = (selectedStudent.enrolledSubjects && selectedStudent.enrolledSubjects.length > 0)
    ? selectedStudent.enrolledSubjects
    : getSubjectsForClass(selectedStudent.className);
  const caConfig = getCAConfig(selectedStudent.className, settings);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectStudent(classStudents[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < classStudents.length - 1) {
      onSelectStudent(classStudents[currentIndex + 1]);
    }
  };

  const handleSaveEdits = () => {
    updateStudentAssessments(
      selectedStudent.id,
      affectiveDraft,
      psychomotorDraft,
      daysPresentDraft,
      formCommentDraft
    );
    updatePrincipalComment(selectedStudent.id, principalCommentDraft);
    setIsEditingComments(false);
  };

  const isPassportEditable = canUpdatePassport
    ? canUpdatePassport(selectedStudent.className)
    : (currentUser.role === 'super_admin' || currentUser.role === 'admin' || (currentUser.role === 'form_teacher' && currentUser.isFormTeacherOf === selectedStudent.className));

  const handleTriggerReportPassportUpload = () => {
    if (!isPassportEditable) {
      setPassportFeedback('Passport photo locked: Only Super Admin, Admin, or Assigned Form Teacher can update student photographs.');
      setTimeout(() => setPassportFeedback(null), 4000);
      return;
    }

    if (selectedStudent.passportPhoto) {
      const confirmReplace = window.confirm(
        `Identity Protection Alert:\nLearner "${selectedStudent.name}" (${selectedStudent.learnerId}) already has an official verified passport photograph.\n\nAre you sure you want to replace it? Ensure the new photo belongs strictly to this student to avoid manipulating results.`
      );
      if (!confirmReplace) return;
    }

    if (reportPassportInputRef.current) {
      reportPassportInputRef.current.value = '';
      reportPassportInputRef.current.click();
    }
  };

  const handleReportPassportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isPassportEditable) {
      setPassportFeedback('Access Denied: You do not have authorization to modify this student\'s passport photo.');
      setTimeout(() => setPassportFeedback(null), 4000);
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setPassportFeedback(validation.error || 'Invalid file format.');
      setTimeout(() => setPassportFeedback(null), 3000);
      return;
    }

    try {
      const compressedDataUrl = await compressPassportImage(file);
      if (onUpdateStudentPassport) {
        onUpdateStudentPassport(selectedStudent.id, compressedDataUrl);
      }
      setPassportFeedback(`Passport photo verified and updated for ${selectedStudent.name}!`);
      setTimeout(() => setPassportFeedback(null), 3500);
    } catch (err: any) {
      console.error(err);
      setPassportFeedback('Failed to process image file.');
      setTimeout(() => setPassportFeedback(null), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await PDFExportService.exportReportCard(selectedStudent, 'printable-report-sheet', viewTerm);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      window.alert('Failed to generate PDF. You can also use the Print button to Save as PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const isCumulativeView = viewTerm === 'Cumulative' || viewTerm === 'Third Term';

  // Current term's scores for the student
  const currentScores = useMemo(() => {
    if (viewTerm === 'First Term') {
      return selectedStudent.termScores?.['First Term'] || selectedStudent.scores;
    }
    if (viewTerm === 'Second Term') {
      return selectedStudent.termScores?.['Second Term'] || selectedStudent.scores;
    }
    return selectedStudent.termScores?.['Third Term'] || selectedStudent.scores;
  }, [selectedStudent, viewTerm]);

  // Current term's summary totals for the student
  const currentSummary = useMemo(() => {
    if (viewTerm === 'First Term' && selectedStudent.termTotals?.['First Term']) {
      return selectedStudent.termTotals['First Term'];
    }
    if (viewTerm === 'Second Term' && selectedStudent.termTotals?.['Second Term']) {
      return selectedStudent.termTotals['Second Term'];
    }
    if (viewTerm === 'Third Term' && selectedStudent.termTotals?.['Third Term']) {
      return selectedStudent.termTotals['Third Term'];
    }
    return {
      totalScore: selectedStudent.totalScore ?? 0,
      averageScore: selectedStudent.averageScore ?? 0,
      positionInClass: selectedStudent.positionInClass ?? 0,
      overallGrade: selectedStudent.overallGrade ?? 'F',
    };
  }, [selectedStudent, viewTerm]);

  const affectiveFields: { key: keyof AffectiveAssessment; label: string }[] = [
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'honesty', label: 'Honesty' },
    { key: 'politeness', label: 'Politeness' },
    { key: 'neatness', label: 'Neatness' },
    { key: 'perseverance', label: 'Perseverance' },
    { key: 'relationshipWithOthers', label: 'Relationship with others' },
    { key: 'diligence', label: 'Diligence' },
    { key: 'creativity', label: 'Creativity' },
    { key: 'classParticipation', label: 'Class Participation' },
  ];

  const psychomotorFields: { key: keyof PsychomotorAssessment; label: string }[] = [
    { key: 'verbalFluency', label: 'Verbal Fluency' },
    { key: 'gamesSports', label: 'Games/Sports' },
    { key: 'musicalSkills', label: 'Musical Skills' },
    { key: 'drawingPainting', label: 'Drawing and Painting' },
    { key: 'handWriting', label: 'Hand Writing' },
  ];

  // Calculate class statistics for this student's class
  const totalClassAvgs = classStudents.map(s => s.averageScore || 0);
  const classAverage = totalClassAvgs.length > 0 
    ? Number((totalClassAvgs.reduce((a, b) => a + b, 0) / totalClassAvgs.length).toFixed(2))
    : 0;

  return (
    <div className="space-y-6">
      {/* Interactive Controls Header (Hidden in Print) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:hidden flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Format Indicator Badge */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg border shadow-sm ${
              isJunior 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : 'bg-blue-100 text-blue-900 border-blue-300'
            }`}>
              {isJunior ? 'JUNIOR FORMAT (JSS)' : 'SENIOR FORMAT (SSS)'}
            </span>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter Class
            </label>
            <select
              value={selectedClass}
              onChange={e => {
                const newCls = e.target.value;
                setSelectedClass(newCls);
                const firstInClass = students.find(s => s.className === newCls);
                if (firstInClass) onSelectStudent(firstInClass);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {SCHOOL_CLASSES.map(c => (
                <option key={c} value={c}>
                  {c} {isJuniorClass(c) ? '(Junior)' : '(Senior)'}
                </option>
              ))}
            </select>
          </div>

          {/* Student Picker */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Learner ({classStudents.length})
            </label>
            <select
              value={selectedStudent.id}
              onChange={e => {
                const st = students.find(s => s.id === e.target.value);
                if (st) onSelectStudent(st);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none max-w-xs"
            >
              {classStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.positionInClass}. {st.name} ({st.learnerId})
                </option>
              ))}
            </select>
          </div>

          {/* Prev/Next buttons */}
          <div className="flex items-center space-x-1 pt-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition"
              title="Previous Student"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
            <span className="text-xs font-semibold text-slate-600 px-2">
              {currentIndex + 1} of {classStudents.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex >= classStudents.length - 1}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition"
              title="Next Student"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          {/* Academic Term Switcher */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Academic Term View
            </label>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300">
              {[
                { id: 'First Term', label: '1st Term' },
                { id: 'Second Term', label: '2nd Term' },
                { id: 'Third Term', label: '3rd Term' },
                { id: 'Cumulative', label: 'Cumulative (Annual)' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setViewTerm(id);
                    if (onSelectTerm) onSelectTerm(id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                    viewTerm === id
                      ? 'bg-[#8b1515] text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Learner Profile & Biodata Button */}
          {onUpdateStudent && (
            <button
              type="button"
              onClick={() => setIsBiodataModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 text-xs font-bold rounded-lg border border-amber-300 shadow-2xs transition hover:scale-105"
              title="Edit learner full name, ID, class, medical and guardian biodata"
            >
              <Edit3 className="w-3.5 h-3.5 text-red-950" />
              <span>Edit Learner Biodata</span>
            </button>
          )}

          {/* Direct Local Passport Upload Button */}
          <button
            type="button"
            onClick={() => reportPassportInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition"
            title="Upload local passport photo for this learner"
          >
            <Camera className="w-3.5 h-3.5 text-amber-600" />
            <span>Upload Learner Photo</span>
          </button>

          {/* Open Class Remarks Manager Modal */}
          {onOpenClassCommentsModal && (
            <button
              type="button"
              onClick={() => onOpenClassCommentsModal(selectedClass)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold rounded-lg border border-blue-200 shadow-2xs transition"
              title="Open full class remarks manager for Form Teacher and Principal"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
              <span>Class Remarks Manager</span>
            </button>
          )}

          {/* Open Batch Passport Upload Center */}
          {onOpenPassportModal && (
            <button
              type="button"
              onClick={() => onOpenPassportModal(selectedClass)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg border border-amber-300 shadow-2xs transition"
              title="Open Passport Upload Center for all students"
            >
              <FolderUp className="w-3.5 h-3.5 text-amber-700" />
              <span>Passport Center</span>
            </button>
          )}

          {/* Admin Upload School Stamp Button */}
          {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && onOpenStampModal && (
            <button
              type="button"
              onClick={onOpenStampModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950 text-amber-300 hover:text-white hover:bg-red-900 text-xs font-bold rounded-lg border border-amber-400 shadow-2xs transition"
              title="Upload official school stamp from PC to certify all result sheets"
            >
              <Stamp className="w-3.5 h-3.5 text-amber-400" />
              <span>School Stamp</span>
            </button>
          )}

          {/* Edit Ratings & Remarks Toggle */}
          <button
            onClick={() => {
              if (isEditingComments) {
                handleSaveEdits();
              } else {
                setIsEditingComments(true);
              }
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
              isEditingComments
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isEditingComments ? (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Assessments & Comments</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Ratings & Remarks</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold">
            <Check className="w-3.5 h-3.5 text-amber-700" />
            <span>Guaranteed 1-Page Format</span>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#b91c1c] hover:bg-red-800 disabled:bg-red-300 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            title="Download official PDF guaranteed to fit on exactly 1 page"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating 1-Page PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Official PDF (1 Page)</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#102a43] hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            title="Print or Save as PDF strictly formatted to 1 single page"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Report Sheet (1 Page)</span>
          </button>
        </div>
      </div>

      {/* Hidden local photo file input */}
      <input
        type="file"
        ref={reportPassportInputRef}
        onChange={handleReportPassportChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {/* Passport Photo Upload Success / Error banner */}
      {passportFeedback && (
        <div className="max-w-4xl mx-auto bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{passportFeedback}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* THE OFFICIAL TERMINAL REPORT SHEET CONTAINER (PRINT-READY)   */}
      {/* STRICT 1-PAGE GUARANTEE: PREVENTS 2ND PAGE SPILLOVER        */}
      {/* ============================================================ */}
      <div 
        id="printable-report-sheet"
        className="max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-300 print:shadow-none print:border print:border-slate-900 print:p-1.5 print:m-0 font-sans text-slate-900 relative print:text-[7pt] print:leading-tight select-text"
      >
        {/* 1. Header Section */}
        <div className="flex items-start justify-between border-b-4 border-amber-500 pb-2 mb-1.5 print:pb-0.5 print:mb-0.5 print:border-b-2">
          {/* School Crest / Uploaded Logo */}
          <div className="w-18 h-18 sm:w-22 sm:h-22 flex flex-col items-center justify-center p-0.5 print:w-11 print:h-11 print:p-0">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-amber-500 bg-white flex items-center justify-center shadow-md overflow-hidden p-1 print:w-10 print:h-10 print:rounded-md print:p-0.5 print:shadow-none print:border">
              <img
                src={settings.schoolLogo || DEFAULT_SCHOOL_LOGO}
                alt={`${settings.schoolName || 'School'} Crest`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          {/* School Identity */}
          <div className="flex-1 text-center px-2 sm:px-4">
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-[#8b1515] font-serif uppercase drop-shadow-sm print:text-sm print:drop-shadow-none print:leading-tight">
              {settings.schoolName}
            </h1>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-tight mt-0.5 print:text-[7.5px] print:mt-0 print:leading-tight">
              {settings.schoolAddress}
            </p>
            <p className="text-xs text-amber-900 font-semibold tracking-normal mt-0.5 print:text-[6.8px] print:mt-0 print:leading-tight">
              Email: {settings.schoolEmail} • College Motto: <span className="italic font-bold text-red-900">Excellence & Faith</span>
            </p>
          </div>

          {/* Student Passport Photo (Anti-Tamper Identity Protection) */}
          <div 
            onClick={handleTriggerReportPassportUpload}
            className={`w-18 h-22 sm:w-20 sm:h-24 border-2 border-amber-600 bg-amber-50/40 flex flex-col items-center justify-center relative overflow-hidden shrink-0 shadow-sm rounded-lg group/pass transition print:w-10 print:h-13 print:shadow-none print:border ${
              isPassportEditable ? 'cursor-pointer hover:border-red-700' : 'cursor-default'
            }`}
            title={
              isPassportEditable
                ? "Click to choose a verified local photo for this learner"
                : "Official Verified Passport Photo • Anti-Tamper Sealed"
            }
          >
            {selectedStudent.passportPhoto ? (
              <img
                src={selectedStudent.passportPhoto}
                alt={selectedStudent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-red-950 to-slate-900 flex flex-col items-center justify-center p-1 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-200 border-2 border-amber-400 flex items-center justify-center text-red-950 font-black text-xs shadow-xs print:w-6 print:h-6 print:text-[7.5px]">
                  {selectedStudent.name.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase() || (selectedStudent.gender === 'MALE' ? 'M' : 'F')}
                </div>
                <div className="text-[7.5px] font-bold text-amber-300 mt-1 uppercase text-center px-0.5 leading-tight truncate max-w-full print:text-[6px]">
                  {selectedStudent.name.split(/\s+/)[0] || 'LEARNER'}
                </div>
                <div className="text-[7px] text-amber-200/80 font-mono print:text-[5.5px]">
                  {selectedStudent.className}
                </div>
              </div>
            )}

            {/* Hover Camera Overlay if authorized (Hidden in Print) */}
            {isPassportEditable ? (
              <div className="absolute inset-0 bg-black/65 opacity-0 group-hover/pass:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-center p-1 print:hidden">
                <Camera className="w-5 h-5 text-amber-300 mb-0.5" />
                <span className="text-[7px] font-bold text-amber-200 uppercase leading-tight">
                  Change Photo
                </span>
              </div>
            ) : (
              <div className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 text-amber-300 shadow print:hidden" title="Verified & Locked">
                <Lock className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
        </div>

        {/* 2. Main Title Banner */}
        <div className="bg-gradient-to-r from-[#7a0c0c] via-[#8f1212] to-[#690707] text-amber-300 py-1 text-center font-black tracking-wider text-xs sm:text-sm uppercase mb-1.5 shadow-sm border border-amber-400 print:py-0.5 print:text-[7.5pt] print:mb-0.5 print:shadow-none">
          {isCumulativeView 
            ? "LEARNER'S THIRD TERM & ANNUAL CUMULATIVE REPORT SHEET"
            : `LEARNER'S ${viewTerm.toUpperCase()} REPORT SHEET`}
        </div>

        {/* 3. Learner's Personal Data */}
        <div className="border border-slate-900 mb-1.5 print:mb-0.5 print:text-[7pt]">
          <div className="bg-amber-100 text-red-950 text-center text-[10px] font-black uppercase tracking-wider py-0.5 border-b border-amber-400 flex items-center justify-between px-2 print:py-0 print:text-[6.8pt]">
            <span className="flex-1 text-center">LEARNER'S PERSONAL DATA</span>
            {onUpdateStudent && (
              <button
                type="button"
                onClick={() => setIsBiodataModalOpen(true)}
                className="print:hidden text-[9px] bg-red-900 hover:bg-red-800 text-amber-200 px-2 py-0.5 rounded font-bold uppercase transition flex items-center space-x-1 shrink-0"
                title="Edit this student's profile & biodata"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Edit Biodata</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-12 text-[10px] divide-x divide-slate-800 divide-y sm:divide-y-0 print:text-[8px]">
            <div className="col-span-12 sm:col-span-5 p-1 font-bold print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">NAME: </span>
              <span className="text-slate-950 uppercase">{selectedStudent.name}</span>
            </div>
            <div className="col-span-6 sm:col-span-3 p-1 font-bold print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">GENDER: </span>
              <span className="text-slate-950 uppercase">{selectedStudent.gender}</span>
            </div>
            <div className="col-span-6 sm:col-span-4 p-1 font-bold font-mono print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold font-sans">LEARNER'S ID: </span>
              <span className="text-slate-950">{selectedStudent.learnerId}</span>
            </div>
          </div>

          <div className="grid grid-cols-12 text-[10px] border-t border-slate-800 divide-x divide-slate-800 print:text-[8px]">
            <div className="col-span-6 sm:col-span-4 p-1 print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">TERM: </span>
              <span className="font-bold text-slate-900">
                {isCumulativeView ? '3rd Term & Annual' : viewTerm}
              </span>
            </div>
            <div className="col-span-6 sm:col-span-4 p-1 print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">CLASS: </span>
              <span className="font-black text-slate-900">{selectedStudent.className}</span>
            </div>
            <div className="col-span-12 sm:col-span-4 p-1 print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">DAYS OPENED: </span>
              <span className="font-bold text-slate-900">{settings.daysSchoolOpened}</span>
            </div>
          </div>

          <div className="grid grid-cols-12 text-[10px] border-t border-slate-800 divide-x divide-slate-800 print:text-[8px]">
            <div className="col-span-6 sm:col-span-4 p-1 print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">SESSION: </span>
              <span className="font-bold text-slate-900">{settings.session}</span>
            </div>
            <div className="col-span-6 sm:col-span-4 p-1 print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">CLASS ENROLMENT: </span>
              <span className="font-bold text-slate-900">{classStudents.length}</span>
            </div>
            <div className="col-span-6 sm:col-span-2 p-1 print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">SUBJECTS: </span>
              <span className="font-bold text-slate-900">{subjects.length}</span>
            </div>
            <div className="col-span-6 sm:col-span-2 p-1 print:p-0.5 print:px-1">
              <span className="text-slate-600 uppercase font-semibold">ROLE: </span>
              <span className="font-black text-red-950 uppercase">{selectedStudent.studentRole || 'Student'}</span>
            </div>
          </div>

          <div className="border-t border-slate-800 p-1 text-[10px] print:p-0.5 print:px-1 print:text-[8px]">
            <span className="text-slate-600 uppercase font-semibold">NEXT TERM RESUMPTION: </span>
            <span className="font-bold text-slate-900">{settings.nextTermResumption}</span>
          </div>
        </div>

        {/* 4. Terminal Summary Header Row */}
        {isCumulativeView ? (
          <div className="grid grid-cols-6 text-center text-[10px] font-bold border border-slate-900 mb-1.5 divide-x divide-slate-800 bg-slate-50 print:mb-1 print:text-[8px]">
            <div className="p-1 print:p-0.5">
              <div className="text-[8px] text-slate-600 uppercase print:text-[6.5px]">1ST TERM AVG</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 print:text-[10px]">
                {selectedStudent.termTotals?.['First Term']?.averageScore ? `${selectedStudent.termTotals['First Term'].averageScore}%` : '-'}
              </div>
            </div>
            <div className="p-1 print:p-0.5">
              <div className="text-[8px] text-slate-600 uppercase print:text-[6.5px]">2ND TERM AVG</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 print:text-[10px]">
                {selectedStudent.termTotals?.['Second Term']?.averageScore ? `${selectedStudent.termTotals['Second Term'].averageScore}%` : '-'}
              </div>
            </div>
            <div className="p-1 print:p-0.5">
              <div className="text-[8px] text-slate-600 uppercase print:text-[6.5px]">3RD TERM AVG</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 print:text-[10px]">
                {selectedStudent.termTotals?.['Third Term']?.averageScore ? `${selectedStudent.termTotals['Third Term'].averageScore}%` : `${selectedStudent.averageScore}%`}
              </div>
            </div>
            <div className="p-1 bg-amber-50 print:p-0.5">
              <div className="text-[8px] text-red-900 uppercase font-extrabold print:text-[6.5px]">CUMULATIVE AVG</div>
              <div className="text-xs sm:text-sm font-black text-red-950 print:text-[10px]">
                {selectedStudent.cumulativeAverageScore ?? selectedStudent.averageScore}%
              </div>
            </div>
            <div className="p-1 print:p-0.5">
              <div className="text-[8px] text-slate-600 uppercase print:text-[6.5px]">SESSIONAL RANK</div>
              <div className="text-xs sm:text-sm font-black text-red-700 print:text-[10px]">
                {selectedStudent.cumulativePositionInClass ?? selectedStudent.positionInClass}
              </div>
            </div>
            <div className="p-1 print:p-0.5">
              <div className="text-[8px] text-slate-600 uppercase print:text-[6.5px]">ANNUAL GRADE</div>
              <div className="text-xs sm:text-sm font-black text-slate-950 print:text-[10px]">
                {selectedStudent.cumulativeOverallGrade ?? selectedStudent.overallGrade}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 text-center text-[10px] font-bold border border-slate-900 mb-1.5 divide-x divide-slate-800 bg-slate-50 print:mb-1 print:text-[8px]">
            <div className="p-1 print:p-0.5">
              <div className="text-[8.5px] text-slate-600 uppercase print:text-[6.5px]">TOTAL SCORE</div>
              <div className="text-xs sm:text-sm font-black text-slate-950 print:text-[10px]">{currentSummary.totalScore}</div>
            </div>
            <div className="p-1 print:p-0.5">
              <div className="text-[8.5px] text-slate-600 uppercase print:text-[6.5px]">CLASS AVERAGE</div>
              <div className="text-xs sm:text-sm font-black text-slate-950 print:text-[10px]">{classAverage}</div>
            </div>
            <div className="p-1 print:p-0.5">
              <div className="text-[8.5px] text-slate-600 uppercase print:text-[6.5px]">FINAL AVERAGE</div>
              <div className="text-xs sm:text-sm font-black text-slate-950 print:text-[10px]">{currentSummary.averageScore}%</div>
            </div>
            <div className="p-1 print:p-0.5">
              <div className="text-[8.5px] text-slate-600 uppercase print:text-[6.5px]">POSITION</div>
              <div className="text-xs sm:text-sm font-black text-red-700 print:text-[10px]">{currentSummary.positionInClass}</div>
            </div>
            <div className="p-1 print:p-0.5">
              <div className="text-[8.5px] text-slate-600 uppercase print:text-[6.5px]">GRADE</div>
              <div className="text-xs sm:text-sm font-black text-slate-950 print:text-[10px]">{currentSummary.overallGrade}</div>
            </div>
          </div>
        )}

        {/* 5. Academic Performance Table with Watermark */}
        <div className="border border-slate-900 mb-1.5 overflow-x-auto relative print:mb-1">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
            <span className="text-5xl sm:text-7xl font-serif font-black tracking-widest text-slate-900 uppercase transform -rotate-12 text-center px-4">
              {settings.schoolName || 'ACADEMIC EXCELLENCE'}
            </span>
          </div>

          <table className="w-full text-left text-[9.5px] border-collapse relative z-10 print:text-[7.5px] print:leading-tight">
            <thead>
              {isCumulativeView ? (
                /* Multi-term / Cumulative Official Nigerian Header */
                <tr className="bg-[#b91c1c] text-white font-bold text-center border-b border-slate-900 text-[9px] print:text-[7px]">
                  <th className="py-1 px-1 w-7 border-r border-slate-800 print:py-0.5 print:px-0.5">SN</th>
                  <th className="py-1 px-2 text-left min-w-[150px] border-r border-slate-800 print:py-0.5 print:px-1">SUBJECTS</th>
                  <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">1ST TERM</th>
                  <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">2ND TERM</th>
                  <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">
                    3RD CA ({caConfig.ca1Max + caConfig.ca2Max + caConfig.ca3Max + caConfig.ca4Max})
                  </th>
                  <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">
                    3RD EXAM ({caConfig.examMax})
                  </th>
                  <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">3RD TOTAL</th>
                  <th className="py-1 px-1 w-16 border-r border-slate-800 bg-red-950 print:py-0.5 print:px-0.5">CUM. AVG</th>
                  <th className="py-1 px-1 w-11 border-r border-slate-800 print:py-0.5 print:px-0.5">GRADE</th>
                  <th className="py-1 px-1 w-12 print:py-0.5 print:px-0.5">POS</th>
                </tr>
              ) : (
                /* Single Terminal Header */
                <tr className="bg-[#b91c1c] text-white font-bold text-center border-b border-slate-900 text-[9.5px] print:text-[7.5px]">
                  <th className="py-1 px-1.5 w-8 border-r border-slate-800 print:py-0.5 print:px-0.5">SN</th>
                  <th className="py-1 px-2 text-left min-w-[160px] border-r border-slate-800 print:py-0.5 print:px-1">SUBJECTS</th>
                  <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">CA1 {caConfig.ca1Max}%</th>
                  <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">CA2 {caConfig.ca2Max}%</th>
                  <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">CA3 {caConfig.ca3Max}%</th>
                  {caConfig.ca4Max > 0 && (
                    <th className="py-1 px-1 w-14 border-r border-slate-800 print:py-0.5 print:px-0.5">CA4 {caConfig.ca4Max}%</th>
                  )}
                  <th className="py-1 px-1 w-16 border-r border-slate-800 print:py-0.5 print:px-0.5">EXAMS {caConfig.examMax}%</th>
                  <th className="py-1 px-1 w-16 border-r border-slate-800 print:py-0.5 print:px-0.5">TOTAL 100%</th>
                  <th className="py-1 px-1 w-12 border-r border-slate-800 print:py-0.5 print:px-0.5">GRADE</th>
                  <th className="py-1 px-1 w-14 print:py-0.5 print:px-0.5">POSITION</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {subjects.map((subj, idx) => {
                const sc = currentScores[subj] || {
                  ca1: 0,
                  ca2: 0,
                  ca3: 0,
                  ca4: 0,
                  exam: 0,
                  total: 0,
                  grade: 'F',
                  position: 0,
                };

                if (isCumulativeView) {
                  const cumScore = selectedStudent.cumulativeScores?.[subj];
                  const term1Val = cumScore?.term1Total ?? selectedStudent.termScores?.['First Term']?.[subj]?.total ?? 0;
                  const term2Val = cumScore?.term2Total ?? selectedStudent.termScores?.['Second Term']?.[subj]?.total ?? 0;
                  const term3Scores = selectedStudent.termScores?.['Third Term']?.[subj] || sc;
                  const thirdCA = (term3Scores.ca1 ?? 0) + (term3Scores.ca2 ?? 0) + (term3Scores.ca3 ?? 0) + (term3Scores.ca4 ?? 0);
                  const thirdExam = term3Scores.exam ?? 0;
                  const thirdTotal = term3Scores.total ?? 0;
                  const cumAvg = cumScore?.cumulativeAverage ?? thirdTotal;
                  const cumGrade = cumScore?.cumulativeGrade ?? term3Scores.grade ?? 'F';
                  const cumPos = cumScore?.cumulativePosition ?? term3Scores.position ?? '-';

                  return (
                    <tr key={subj} className="hover:bg-slate-50/80">
                      <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 text-[9px] text-slate-600 print:py-[0.5px] print:text-[7px]">
                        {idx + 1}
                      </td>
                      <td className="py-0.5 px-2 font-bold text-slate-900 border-r border-slate-800 uppercase tracking-tight text-[9px] print:py-[0.5px] print:px-1 print:text-[7.5px]">
                        {subj}
                      </td>
                      <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                        {term1Val}
                      </td>
                      <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                        {term2Val}
                      </td>
                      <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                        {thirdCA}
                      </td>
                      <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                        {thirdExam}
                      </td>
                      <td className="py-0.5 px-1 text-center font-mono font-bold text-slate-900 border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                        {thirdTotal}
                      </td>
                      <td className="py-0.5 px-1 text-center font-mono font-black text-red-950 border-r border-slate-800 bg-amber-50/60 print:py-[0.5px] print:text-[7.5px]">
                        {cumAvg}%
                      </td>
                      <td className="py-0.5 px-1 text-center font-bold border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                        <span className={cumGrade === 'F' ? 'text-red-700 font-bold' : 'text-slate-950'}>
                          {cumGrade}
                        </span>
                      </td>
                      <td className="py-0.5 px-1 text-center font-mono font-semibold text-slate-800 print:py-[0.5px] print:text-[7.5px]">
                        {cumPos}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={subj} className="hover:bg-slate-50/80">
                    <td className="py-0.5 px-1.5 text-center font-mono border-r border-slate-800 text-[9px] text-slate-600 print:py-[0.5px] print:text-[7px]">
                      {idx + 1}
                    </td>
                    <td className="py-0.5 px-2 font-bold text-slate-900 border-r border-slate-800 uppercase tracking-tight text-[9px] print:py-[0.5px] print:px-1 print:text-[7.5px]">
                      {subj}
                    </td>
                    <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                      {sc.ca1 ?? '-'}
                    </td>
                    <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                      {sc.ca2 ?? '-'}
                    </td>
                    <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                      {sc.ca3 ?? '-'}
                    </td>
                    {caConfig.ca4Max > 0 && (
                      <td className="py-0.5 px-1 text-center font-mono border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                        {sc.ca4 ?? '-'}
                      </td>
                    )}
                    <td className="py-0.5 px-1 text-center font-mono font-semibold border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                      {sc.exam ?? '-'}
                    </td>
                    <td className="py-0.5 px-1 text-center font-mono font-bold text-slate-950 border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                      {sc.total}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold border-r border-slate-800 print:py-[0.5px] print:text-[7.5px]">
                      <span className={sc.grade === 'F' ? 'text-red-700 font-bold' : 'text-slate-950'}>
                        {sc.grade}
                      </span>
                    </td>
                    <td className="py-0.5 px-1 text-center font-mono font-semibold text-slate-800 print:py-[0.5px] print:text-[7.5px]">
                      {sc.position || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Promotion Decision Banner (Only shown on Sessional Cumulative / 3rd Term Report) */}
        {isCumulativeView && (
          <div className={`p-2 rounded-lg border-2 mb-1.5 text-center font-black uppercase text-xs flex flex-wrap items-center justify-between gap-2 px-3 shadow-sm print:py-0.5 print:px-2 print:mb-1 print:text-[8px] print:shadow-none ${
            selectedStudent.promotionStatus === 'PROMOTED'
              ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
              : selectedStudent.promotionStatus === 'PROMOTED ON TRIAL'
              ? 'bg-amber-50 border-amber-600 text-amber-950'
              : 'bg-red-50 border-red-600 text-red-950'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider print:text-[7.5px]">ANNUAL PROMOTION STATUS:</span>
              <span className="text-xs sm:text-sm font-black px-2 py-0.5 rounded bg-white shadow-sm border border-current print:text-[8.5px] print:py-0 print:px-1">
                {selectedStudent.promotionStatus || 'PROMOTED'}: {selectedStudent.promotedToClass || 'NEXT ACADEMIC LEVEL'}
              </span>
            </div>
            <div className="text-[10px] font-bold text-slate-700 italic print:text-[7.5px]">
              Academic Board Official Endorsement
            </div>
          </div>
        )}

        {/* 6. Keys to Rating */}
        <div className="bg-[#0f2438] text-white py-0.5 px-2 text-center text-[9px] font-bold tracking-wider mb-1.5 print:py-0 print:text-[6.2px] print:mb-0.5">
          KEYS TO RATING: 80-100=A 70-79=B 60-69=C 56-59=D 50-55=E 0-49=F
        </div>

        {/* 7. Affective & Psychomotor Assessments */}
        <div className="grid grid-cols-12 border border-slate-900 mb-1.5 divide-x divide-slate-800 print:mb-0.5">
          {/* AFFECTIVE DOMAIN (Col 1-6) */}
          <div className="col-span-6">
            <table className="w-full text-left text-[9px] border-collapse print:text-[6.8px]">
              <thead>
                <tr className="bg-slate-200/90 text-slate-900 border-b border-slate-800 font-bold">
                  <th className="py-1 px-1.5 print:py-0.5 print:px-1 print:text-[6.8px]">AFFECTIVE ASSESSMENT</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">1</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">2</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">3</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">4</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {affectiveFields.map(({ key, label }) => {
                  const val = (isEditingComments ? affectiveDraft?.[key] : selectedStudent?.affective?.[key]) ?? DEFAULT_AFFECTIVE[key];
                  return (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="py-0.5 px-1.5 font-medium text-slate-800 text-[9px] print:py-[0.5px] print:px-1 print:text-[6.5px]">{label}</td>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <td 
                          key={rating} 
                          className="py-0.5 text-center border-l border-slate-800 font-bold cursor-pointer print:py-[0.5px]"
                          onClick={() => {
                            if (isEditingComments && canEditForm) {
                              setAffectiveDraft(prev => ({ ...prev, [key]: rating }));
                            }
                          }}
                        >
                          {val === rating ? (
                            <span className="text-blue-900 text-xs font-black print:text-[7.5px]">✓</span>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PSYCHOMOTOR DOMAIN + OFFICIAL SEAL (Col 7-12) */}
          <div className="col-span-6 flex flex-col justify-between">
            <table className="w-full text-left text-[9px] border-collapse print:text-[6.8px]">
              <thead>
                <tr className="bg-slate-200/90 text-slate-900 border-b border-slate-800 font-bold">
                  <th className="py-1 px-1.5 print:py-0.5 print:px-1 print:text-[6.8px]">PSYCHOMOTOR ASSESSMENT</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">1</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">2</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">3</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">4</th>
                  <th className="py-1 w-5 text-center border-l border-slate-800 print:py-0.5 print:w-3.5">5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {psychomotorFields.map(({ key, label }) => {
                  const val = (isEditingComments ? psychomotorDraft?.[key] : selectedStudent?.psychomotor?.[key]) ?? DEFAULT_PSYCHOMOTOR[key];
                  return (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="py-0.5 px-1.5 font-medium text-slate-800 text-[9px] print:py-[0.5px] print:px-1 print:text-[6.5px]">{label}</td>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <td 
                          key={rating} 
                          className="py-0.5 text-center border-l border-slate-800 font-bold cursor-pointer print:py-[0.5px]"
                          onClick={() => {
                            if (isEditingComments && canEditForm) {
                              setPsychomotorDraft(prev => ({ ...prev, [key]: rating }));
                            }
                          }}
                        >
                          {val === rating ? (
                            <span className="text-blue-900 text-xs font-black print:text-[7.5px]">✓</span>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Stamp & Verification QR Code Area */}
            <div className="p-2 border-t border-slate-800 flex items-center justify-around bg-slate-50/50 print:p-0.5">
              {/* Official School Seal Stamp */}
              <div 
                onClick={() => (currentUser.role === 'super_admin' || currentUser.role === 'admin') && onOpenStampModal && onOpenStampModal()}
                className={`relative w-20 h-20 flex items-center justify-center p-0.5 print:w-10 print:h-10 print:p-0 ${currentUser.role === 'super_admin' || currentUser.role === 'admin' ? 'cursor-pointer group' : ''}`}
                title={currentUser.role === 'super_admin' || currentUser.role === 'admin' ? 'Click to change/upload School Stamp from PC' : `${settings.schoolName || 'School'} Official Certified Stamp`}
              >
                <div 
                  className="w-full h-full flex items-center justify-center transition-transform"
                  style={{
                    transform: `rotate(${settings.schoolStampRotation ?? -6}deg)`,
                    opacity: settings.schoolStampOpacity ?? 0.88,
                  }}
                >
                  <img
                    src={settings.schoolStamp || DEFAULT_OFFICIAL_STAMP}
                    alt="Official School Stamp"
                    className="max-w-full max-h-full object-contain drop-shadow-xs"
                  />
                </div>
                {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                  <span className="absolute inset-0 bg-red-950/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-[7px] font-bold text-amber-300 transition print:hidden">
                    Change Stamp
                  </span>
                )}
              </div>

              {/* Verification QR Code */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-white p-1 border border-slate-800 flex items-center justify-center print:w-8 print:h-8 print:p-0.5">
                  <QrCode className="w-12 h-12 text-slate-900 print:w-7 print:h-7" />
                </div>
                <span className="text-[6.5px] font-mono text-slate-600 mt-0.5 font-semibold print:text-[5px]">
                  SCAN TO VERIFY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 7B. OFFICIAL GRADING SCALE & PERFORMANCE KEY TABLE */}
        <div className="border border-slate-900 mb-1.5 p-1.5 bg-slate-50 text-[9px] print:text-[6.5px] print:p-0.5">
          <div className="flex items-center justify-between font-bold text-slate-800 uppercase tracking-tight text-[8px] print:text-[6px] mb-1">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-700 inline print:hidden" />
              <span>COLLEGE GRADING SYSTEM &amp; PERFORMANCE KEY:</span>
            </span>
            <span className="font-mono text-slate-600">ST. PAUL COLLEGE ACADEMIC POLICY</span>
          </div>
          <div className="grid grid-cols-6 gap-1 text-center font-semibold">
            {(settings.gradingScale || DEFAULT_GRADING_SCALE).map(g => (
              <div key={g.grade} className="border border-slate-400 bg-white p-1 rounded-xs print:p-0.5">
                <div className="font-black text-slate-900 text-[10px] print:text-[7px]">
                  {g.grade} ({g.minScore}% – {g.maxScore}%)
                </div>
                <div className="text-[7.5px] text-slate-600 font-medium truncate print:text-[5.5px]">
                  {g.remark}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 8. Remarks & Comments Box */}
        <div className="border border-slate-900 text-[10px] divide-y divide-slate-800 print:text-[7pt]">
          {/* Form Teacher's Comment */}
          <div className="p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:p-0.5 print:gap-1">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1 print:mb-0">
                <span className="font-bold text-slate-950 uppercase tracking-tight mr-2 flex items-center gap-1.5 print:text-[7pt]">
                  <UserCheck className="w-3.5 h-3.5 text-blue-800 print:hidden" />
                  FORM TEACHER'S COMMENT:
                </span>
                {isEditingComments && (
                  <button
                    type="button"
                    onClick={() => setFormCommentDraft(getSuggestedFormTeacherComment(selectedStudent, viewTerm))}
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition print:hidden"
                    title="Auto-generate tailored teacher remark based on student results"
                  >
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Auto-Suggest</span>
                  </button>
                )}
              </div>

              {isEditingComments ? (
                <div className="space-y-1.5 print:hidden">
                  <textarea
                    rows={2}
                    value={formCommentDraft}
                    onChange={e => setFormCommentDraft(e.target.value)}
                    className="w-full text-xs font-semibold p-2 border border-blue-400 rounded-lg bg-blue-50/60 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    placeholder="Enter teacher remark or click a suggestion below..."
                  />
                  {/* Quick Preset Recommendation Chips */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase self-center mr-1">Presets:</span>
                    {[
                      'An outstanding performance! Keep it up.',
                      'A very commendable result. Well done.',
                      'Good effort. Needs to focus on weak subjects.',
                      'Fair attempt. Must work harder next term.',
                      'Promoted to next class with distinction.'
                    ].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormCommentDraft(p)}
                        className="text-[9.5px] px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 rounded border border-slate-300 transition"
                      >
                        {p.split('.')[0]}...
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Printable / Non-editing display */}
              <div className={isEditingComments ? 'hidden print:block' : 'block'}>
                <span className="font-serif italic text-slate-900 font-semibold text-[11px] print:text-[7.5px] print:leading-tight">
                  {formCommentDraft || selectedStudent.formTeacherComment || (isJunior ? 'Excellent performance, keep doing great work.' : 'Good result you can do better')}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 pt-1 sm:pt-0 font-serif italic text-[11px] text-slate-700 border-t sm:border-t-0 border-slate-200 w-full sm:w-auto print:text-[7pt] print:pt-0">
              <span className="font-sans text-[8px] font-bold text-slate-500 uppercase block print:text-[6px]">Sign & Date:</span>
              <span className="underline decoration-slate-400">
                {isJunior ? 'Mr. Jude Chukwuka (23/07/2026)' : 'Mrs. Ngozi Eze (23/07/2026)'}
              </span>
            </div>
          </div>

          {/* Principal's Comment */}
          <div className="p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:p-0.5 print:gap-1">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1 print:mb-0">
                <span className="font-bold text-slate-950 uppercase tracking-tight mr-2 flex items-center gap-1.5 print:text-[7pt]">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-800 print:hidden" />
                  PRINCIPAL'S COMMENT:
                </span>
                {isEditingComments && (
                  <button
                    type="button"
                    onClick={() => setPrincipalCommentDraft(getSuggestedPrincipalComment(selectedStudent, viewTerm))}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 transition print:hidden"
                    title="Auto-generate tailored principal remark based on student results"
                  >
                    <Sparkles className="w-3 h-3 text-amber-700" />
                    <span>Auto-Suggest</span>
                  </button>
                )}
              </div>

              {isEditingComments ? (
                <div className="space-y-1.5 print:hidden">
                  <textarea
                    rows={2}
                    value={principalCommentDraft}
                    onChange={e => setPrincipalCommentDraft(e.target.value)}
                    className="mt-1 w-full text-xs font-semibold p-2 border border-amber-400 rounded-lg bg-amber-50/60 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                    placeholder="Enter principal's remark or click a suggestion below..."
                  />
                  {/* Quick Preset Recommendation Chips */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase self-center mr-1">Presets:</span>
                    {[
                      'A brilliant result. Maintain this high standard.',
                      'Very good result. Keep striving towards top distinction.',
                      'Good performance. Higher heights are attainable.',
                      'Average result. Work harder next session.',
                      'Approved for promotion to the next class.'
                    ].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrincipalCommentDraft(p)}
                        className="text-[9.5px] px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded border border-slate-300 transition"
                      >
                        {p.split('.')[0]}...
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Printable / Non-editing display */}
              <div className={isEditingComments ? 'hidden print:block' : 'block'}>
                <span className="font-serif italic text-slate-900 font-semibold text-[11px] print:text-[7.5px] print:leading-tight">
                  {principalCommentDraft || selectedStudent.principalComment || (isJunior ? 'A brilliant result. Maintain this high standard of excellence.' : 'Average Result, work Harder next session')}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 pt-1 sm:pt-0 font-serif italic text-[11px] text-slate-700 border-t sm:border-t-0 border-slate-200 w-full sm:w-auto relative print:text-[7pt] print:pt-0">
              <span className="font-sans text-[8px] font-bold text-slate-500 uppercase block print:text-[6px]">Principal Signature &amp; Official Stamp:</span>
              <div className="relative inline-block mt-0.5">
                <span className="underline decoration-slate-400 font-bold relative z-10">
                  SUPER ADMIN (24/07/2026)
                </span>
                {/* Official School Stamp applied to Principal Signature */}
                <div 
                  className="absolute -right-3 -top-3.5 pointer-events-none z-0 select-none print:-right-1 print:-top-2"
                  style={{
                    transform: `rotate(${settings.schoolStampRotation ?? -6}deg)`,
                    opacity: (settings.schoolStampOpacity ?? 0.88) * 0.92,
                  }}
                >
                  <img
                    src={settings.schoolStamp || DEFAULT_OFFICIAL_STAMP}
                    alt="Principal Official Stamp"
                    className="w-16 h-16 object-contain print:w-10 print:h-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Biodata Modal */}
      {isBiodataModalOpen && onUpdateStudent && (
        <StudentBiodataModal
          student={selectedStudent}
          currentUser={currentUser}
          isOpen={isBiodataModalOpen}
          onClose={() => setIsBiodataModalOpen(false)}
          onSave={(studentId, updates) => {
            onUpdateStudent(studentId, updates);
            setIsBiodataModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
