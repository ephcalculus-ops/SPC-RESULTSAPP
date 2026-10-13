import React, { useState, useMemo, useEffect } from 'react';
import { Student, Teacher, SchoolSettings } from '../types';
import { SCHOOL_CLASSES, isJuniorClass, getSubjectsForClass, DEFAULT_OFFICIAL_STAMP, getCAConfig, DEFAULT_GRADING_SCALE } from '../data/mockData';
import { PDFExportService } from '../services/pdfExportService';
import { 
  Printer, 
  Download, 
  Search, 
  FileText, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Award,
  ChevronRight,
  FileDown,
  Loader2,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  ShieldAlert,
  Sliders
} from 'lucide-react';

interface ClassBroadsheetProps {
  students: Student[];
  settings: SchoolSettings;
  currentUser?: Teacher;
  activeTerm?: string;
  onSelectTerm?: (term: string) => void;
  onSelectStudentForReport: (student: Student) => void;
  onOpenSyncModal: () => void;
  onOpenBulkPromotionModal?: (cls?: string) => void;
  onOpenDirectScoreModal?: (cls?: string, subj?: string) => void;
  onOpenMissingMarksModal?: (cls?: string, subj?: string) => void;
  onOpenPercentageModal?: () => void;
}

export const ClassBroadsheet: React.FC<ClassBroadsheetProps> = ({
  students,
  settings,
  currentUser,
  activeTerm,
  onSelectTerm,
  onSelectStudentForReport,
  onOpenSyncModal,
  onOpenBulkPromotionModal,
  onOpenDirectScoreModal,
  onOpenMissingMarksModal,
  onOpenPercentageModal,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('JSS 2 B');
  const [broadsheetTerm, setBroadsheetTerm] = useState<string>(activeTerm || 'Third Term');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    if (activeTerm) {
      setBroadsheetTerm(activeTerm);
    }
  }, [activeTerm]);

  const isJunior = isJuniorClass(selectedClass);
  const isCumulative = broadsheetTerm === 'Cumulative';
  const subjects = useMemo(() => getSubjectsForClass(selectedClass), [selectedClass]);

  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === selectedClass)
      .filter(s => genderFilter === 'ALL' || s.gender === genderFilter)
      .filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.learnerId.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (isCumulative) {
          return (a.cumulativePositionInClass || 999) - (b.cumulativePositionInClass || 999);
        }
        const posA = a.termTotals?.[broadsheetTerm]?.positionInClass ?? a.positionInClass ?? 999;
        const posB = b.termTotals?.[broadsheetTerm]?.positionInClass ?? b.positionInClass ?? 999;
        return posA - posB;
      });
  }, [students, selectedClass, genderFilter, searchQuery, broadsheetTerm, isCumulative]);

  // Overall Class Statistics for selected term
  const stats = useMemo(() => {
    const rawClassStudents = students.filter(s => s.className === selectedClass);
    const count = rawClassStudents.length;
    if (count === 0) return { count: 0, avg: 0, high: 0, low: 0, males: 0, females: 0 };

    const totalAvgs = rawClassStudents.map(s => {
      if (isCumulative) return s.cumulativeAverageScore ?? s.averageScore ?? 0;
      return s.termTotals?.[broadsheetTerm]?.averageScore ?? s.averageScore ?? 0;
    });
    const sum = totalAvgs.reduce((a, b) => a + b, 0);
    const avg = Number((sum / count).toFixed(2));
    const high = Math.max(...totalAvgs);
    const low = Math.min(...totalAvgs);
    const males = rawClassStudents.filter(s => s.gender === 'MALE').length;
    const females = rawClassStudents.filter(s => s.gender === 'FEMALE').length;

    return { count, avg, high, low, males, females };
  }, [students, selectedClass, broadsheetTerm, isCumulative]);

  // Track total missing scores in this class
  const classMissingScoresCount = useMemo(() => {
    let count = 0;
    const rawClassStudents = students.filter(s => s.className === selectedClass);
    const targetTerm = broadsheetTerm === 'Cumulative' ? 'Third Term' : broadsheetTerm;
    const caCfg = getCAConfig(selectedClass, settings);
    for (const st of rawClassStudents) {
      for (const subj of subjects) {
        const sc = st.termScores?.[targetTerm]?.[subj] || st.scores[subj];
        if (!sc || sc.ca1 === null || sc.ca2 === null || sc.ca3 === null || (caCfg.ca4Max > 0 && sc.ca4 === null) || sc.exam === null) {
          count++;
        }
      }
    }
    return count;
  }, [students, selectedClass, subjects, broadsheetTerm, settings]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await PDFExportService.exportBroadsheet(selectedClass, 'printable-broadsheet', settings.session, broadsheetTerm);
    } catch (err) {
      console.error('Failed to export broadsheet PDF:', err);
      window.alert('Failed to generate PDF. You can also use the Print button to Save as PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = () => {
    const extraHeaders = isCumulative ? ['Promotion Status', 'Promoted Class'] : [];
    const headers = ['Rank', 'Learner ID', 'Student Name', 'Gender', ...subjects, 'Total', 'Average %', 'Overall Grade', ...extraHeaders, 'Remarks'];
    const rows = classStudents.map(st => {
      const subjectCols = subjects.map(subj => {
        if (isCumulative) {
          const cum = st.cumulativeScores?.[subj];
          return cum ? `${cum.cumulativeAverage} (${cum.cumulativeGrade})` : '0 (F)';
        }
        const sc = st.termScores?.[broadsheetTerm]?.[subj] || st.scores[subj];
        return sc ? `${sc.total} (${sc.grade})` : '0 (F)';
      });

      const pos = isCumulative 
        ? (st.cumulativePositionInClass ?? st.positionInClass ?? '-')
        : (st.termTotals?.[broadsheetTerm]?.positionInClass ?? st.positionInClass ?? '-');
      const tot = isCumulative 
        ? (st.cumulativeTotalScore ?? st.totalScore ?? 0)
        : (st.termTotals?.[broadsheetTerm]?.totalScore ?? st.totalScore ?? 0);
      const avg = isCumulative 
        ? (st.cumulativeAverageScore ?? st.averageScore ?? 0)
        : (st.termTotals?.[broadsheetTerm]?.averageScore ?? st.averageScore ?? 0);
      const grd = isCumulative 
        ? (st.cumulativeOverallGrade ?? st.overallGrade ?? 'F')
        : (st.termTotals?.[broadsheetTerm]?.overallGrade ?? st.overallGrade ?? 'F');

      const extraCols = isCumulative ? [`"${st.promotionStatus || 'PROMOTED'}"`, `"${st.promotedToClass || ''}"`] : [];

      return [
        pos,
        st.learnerId,
        `"${st.name}"`,
        st.gender,
        ...subjectCols,
        tot,
        `${avg}%`,
        grd,
        ...extraCols,
        `"${st.formTeacherComment ?? 'Good'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedClass}_${broadsheetTerm.replace(/\s+/g, '_')}_Broadsheet_${settings.session}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const getSubjectAbbrev = (subj: string) => {
    return subj
      .replace('CHRISTIAN RELIGIOUS STUDIES', 'CRS')
      .replace('AGRICULTURAL SCIENCE', 'AGRIC')
      .replace('PHYSICAL AND HEALTH EDUCATION', 'PHE')
      .replace('BUSINESS STUDIES', 'BUS')
      .replace('LOCAL LANGUAGE (YORUBA, IGBO & HAUSA)', 'LOC.LANG')
      .replace('BASIC SCIENCE', 'B.SCI')
      .replace('CULTURAL & CREATIVE ARTS', 'CCA')
      .replace('HOME ECONOMICS', 'H.ECON')
      .replace('BASIC TECHNOLOGY', 'B.TECH')
      .replace('FINANCIAL ACCOUNTING', 'ACC')
      .replace('FURTHER MATHEMATICS', 'F/MATH')
      .replace('COMPUTER SCIENCE', 'COMP')
      .replace('ANIMAL HUSBANDRY', 'ANIMAL')
      .replace('CIVIC EDUCATION', 'CIVIC')
      .replace('SOCIAL STUDIES', 'SOC')
      .replace('LITERATURE IN ENGLISH', 'LIT')
      .replace('ENGLISH LANGUAGE', 'ENG')
      .replace('MATHEMATICS', 'MATH');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 print:hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Format Badge */}
            <div className="self-end lg:self-center pb-1 lg:pb-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black border shadow-sm ${
                isJunior 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-blue-100 text-blue-900 border-blue-300'
              }`}>
                {isJunior ? 'JUNIOR BROADSHEET (16 Subj)' : 'SENIOR BROADSHEET (18 Subj)'}
              </span>
            </div>

            {/* Class Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>
                    {cls} {isJuniorClass(cls) ? '(Junior)' : '(Senior)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Term Switcher */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Broadsheet Term
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
                      setBroadsheetTerm(id);
                      if (onSelectTerm) onSelectTerm(id);
                    }}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition ${
                      broadsheetTerm === id
                        ? 'bg-[#8b1515] text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Gender Filter
              </label>
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="ALL">All ({stats.count})</option>
                <option value="MALE">Males only ({stats.males})</option>
                <option value="FEMALE">Females only ({stats.females})</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Search in Class
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
            {/* Direct Mark Entry for Teachers */}
            {onOpenDirectScoreModal && (
              <button
                type="button"
                onClick={() => onOpenDirectScoreModal(selectedClass)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-red-800 to-red-950 hover:from-red-700 hover:to-red-900 text-amber-300 font-bold text-xs rounded-lg shadow-sm border border-amber-400/80 transition"
                title="Input or update continuous assessments & exam marks directly"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Direct Mark Entry</span>
              </button>
            )}

            {/* Missing Scores Audit */}
            {onOpenMissingMarksModal && (
              <button
                type="button"
                onClick={() => onOpenMissingMarksModal(selectedClass)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold shadow-sm border transition ${
                  classMissingScoresCount > 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-red-950 border-amber-300'
                    : 'bg-red-950 hover:bg-red-900 text-amber-200 border-amber-400/60'
                }`}
                title="Detect missing marks for this class before generating broadsheet"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-950" />
                <span>
                  {classMissingScoresCount > 0
                    ? `Audit Missing Marks (${classMissingScoresCount})`
                    : 'Audit Missing Marks'}
                </span>
              </button>
            )}

            {/* Bulk Promotion Center Button (Super Admin / Exam Officer) */}
            {onOpenBulkPromotionModal && (!currentUser || currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer') && (
              <button
                type="button"
                onClick={() => onOpenBulkPromotionModal(selectedClass)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-800 text-amber-300 text-xs font-black rounded-lg shadow-sm border border-amber-400 transition"
                title="Super Admin: Bulk promote students to next class level based on terminal performance & core subjects pass"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>Bulk Promotion Center</span>
              </button>
            )}

            {/* Adjust CA & Exams (Admin & Exam Officer) */}
            {onOpenPercentageModal && (!currentUser || currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer') && (
              <button
                type="button"
                onClick={onOpenPercentageModal}
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-slate-900 to-red-950 hover:from-slate-800 hover:to-red-900 text-amber-300 text-xs font-bold rounded-lg shadow-sm border border-amber-400 transition"
                title="Admin: Adjust CA 1–4 and Exam percentages"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjust CA & Exams</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#b91c1c] hover:bg-red-800 disabled:bg-red-300 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Broadsheet PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={onOpenSyncModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm border border-emerald-400/80 transition"
              title="Easily synchronize this class broadsheet with Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>Google Sheets Sync</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Class Enrolment</div>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{stats.count} Students</span>
              <span className="text-xs text-slate-400 font-normal">({stats.males}M / {stats.females}F)</span>
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Class Average</div>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{stats.avg}%</span>
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Highest Average</div>
            <div className="text-lg font-bold text-emerald-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{stats.high}%</span>
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Session & Term</div>
            <div className="text-sm font-bold text-slate-800 truncate">
              {settings.session} • {broadsheetTerm}
            </div>
          </div>
        </div>
      </div>

      {/* Broadsheet Big Matrix Table */}
      <div id="printable-broadsheet" className="bg-white rounded-xl shadow-sm border border-amber-300/60 overflow-hidden">
        {/* Printable Header with School Logo & Red/Gold branding */}
        <div className="p-4 bg-gradient-to-r from-red-50 via-amber-50/40 to-red-50 border-b-2 border-amber-400 text-center flex items-center justify-between gap-4">
          <div className="w-14 h-14 rounded-xl border border-amber-400 bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
            <img
              src={settings.schoolLogo || 'data:image/svg+xml;utf8,<svg></svg>'}
              alt="Crest"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="flex-1 text-center">
            <h2 className="text-xl font-black font-serif text-[#8b1515] tracking-wide uppercase">
              {settings.schoolName}
            </h2>
            <p className="text-xs text-slate-700 font-medium">
              {settings.schoolAddress} • Email: {settings.schoolEmail}
            </p>
            <div className="mt-1.5 inline-flex flex-wrap items-center justify-center gap-2 text-xs bg-amber-100/90 border border-amber-300 px-3 py-0.5 rounded-full font-bold text-red-950">
              <span>{isCumulative ? "CLASS MASTER CUMULATIVE & PROMOTION BROADSHEET" : (isJunior ? "JUNIOR LEARNER'S MASTER BROADSHEET" : "SENIOR LEARNER'S MASTER BROADSHEET")}</span>
              <span>•</span>
              <span>CLASS: {selectedClass}</span>
              <span>•</span>
              <span>ENROLMENT: {stats.count}</span>
              <span>•</span>
              <span>SUBJECTS: {subjects.length}</span>
              <span>•</span>
              <span>SESSION: {settings.session}</span>
              <span>•</span>
              <span>TERM: {broadsheetTerm}</span>
            </div>
          </div>

          <div className="w-14 h-14 rounded-xl border border-amber-400 bg-white p-1 shadow-sm flex items-center justify-center shrink-0 hidden sm:flex">
            <img
              src={settings.schoolLogo || 'data:image/svg+xml;utf8,<svg></svg>'}
              alt="Crest"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-amber-200 border-b-2 border-amber-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-2 text-center w-10 sticky left-0 bg-red-950 z-30">Pos</th>
                <th className="py-2.5 px-3 min-w-[170px] sticky left-10 bg-red-950 z-30 text-white">Student Name</th>
                <th className="py-2.5 px-2 text-center w-12">Gen</th>
                <th className="py-2.5 px-3 w-28">Learner ID</th>
                
                {/* Subjects Columns */}
                {subjects.map(subj => {
                  const shortSubj = getSubjectAbbrev(subj);
                  return (
                    <th key={subj} className="py-2 px-1.5 text-center min-w-[55px] border-l border-red-800 font-mono text-[9.5px]">
                      <div className="truncate w-14" title={subj}>{shortSubj}</div>
                    </th>
                  );
                })}

                <th className="py-2.5 px-2 text-center min-w-[70px] bg-red-900 border-l border-red-800 text-amber-300">Total</th>
                <th className="py-2.5 px-2 text-center min-w-[60px] bg-slate-800 border-l border-slate-700">Avg %</th>
                <th className="py-2.5 px-2 text-center w-14 border-l border-slate-700">Grade</th>
                {isCumulative && (
                  <th className="py-2.5 px-2 text-center min-w-[125px] bg-amber-950 border-l border-amber-700 text-amber-300">
                    Annual Promotion
                  </th>
                )}
                <th className="py-2.5 px-2 text-center w-16 print:hidden">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classStudents.map((student) => {
                const currentPos = isCumulative
                  ? (student.cumulativePositionInClass ?? student.positionInClass ?? '-')
                  : (student.termTotals?.[broadsheetTerm]?.positionInClass ?? student.positionInClass ?? '-');

                const currentTotal = isCumulative
                  ? (student.cumulativeTotalScore ?? student.totalScore ?? 0)
                  : (student.termTotals?.[broadsheetTerm]?.totalScore ?? student.totalScore ?? 0);

                const currentAvg = isCumulative
                  ? (student.cumulativeAverageScore ?? student.averageScore ?? 0)
                  : (student.termTotals?.[broadsheetTerm]?.averageScore ?? student.averageScore ?? 0);

                const currentGrade = isCumulative
                  ? (student.cumulativeOverallGrade ?? student.overallGrade ?? 'F')
                  : (student.termTotals?.[broadsheetTerm]?.overallGrade ?? student.overallGrade ?? 'F');

                const positionBadge = 
                  currentPos === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black' :
                  currentPos === 2 ? 'bg-slate-200 text-slate-800 border border-slate-300 font-bold' :
                  currentPos === 3 ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold' :
                  'text-slate-600 font-medium';

                return (
                  <tr 
                    key={student.id} 
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    {/* Position in class */}
                    <td className="py-2 px-2 text-center font-mono text-xs font-bold sticky left-0 bg-white z-10 border-r border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${positionBadge}`}>
                        {currentPos}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap sticky left-10 bg-white z-10 border-r border-slate-200">
                      <div className="flex items-center space-x-1.5">
                        <span>{student.name}</span>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="py-2 px-2 text-center text-slate-600 font-medium">
                      {student.gender === 'MALE' ? 'M' : 'F'}
                    </td>

                    {/* Learner ID */}
                    <td className="py-2 px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {student.learnerId}
                    </td>

                    {/* Subjects Cells */}
                    {subjects.map(subj => {
                      let total = 0;
                      let grade: string = 'F';

                      if (isCumulative) {
                        const cum = student.cumulativeScores?.[subj];
                        total = cum?.cumulativeAverage ?? student.scores[subj]?.total ?? 0;
                        grade = cum?.cumulativeGrade ?? student.scores[subj]?.grade ?? 'F';
                      } else {
                        const sc = student.termScores?.[broadsheetTerm]?.[subj] || student.scores[subj];
                        total = sc?.total ?? 0;
                        grade = sc?.grade ?? 'F';
                      }
                      
                      const gradeColor = 
                        grade === 'A' ? 'text-emerald-700 font-bold' :
                        grade === 'B' ? 'text-blue-700 font-bold' :
                        grade === 'C' ? 'text-slate-800' :
                        grade === 'D' ? 'text-amber-800' :
                        grade === 'E' ? 'text-orange-700' :
                        'text-red-600 font-bold';

                      return (
                        <td 
                          key={subj} 
                          className="py-1.5 px-1 text-center font-mono border-l border-slate-100 text-xs"
                        >
                          <div className="font-semibold text-slate-900">{total}</div>
                          <div className={`text-[10px] ${gradeColor}`}>{grade}</div>
                        </td>
                      );
                    })}

                    {/* Grand Total */}
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 bg-slate-50 border-l border-slate-200">
                      {currentTotal}
                    </td>

                    {/* Average */}
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 bg-slate-50 border-l border-slate-200">
                      {currentAvg}%
                    </td>

                    {/* Overall Grade */}
                    <td className="py-2 px-2 text-center border-l border-slate-200">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        currentGrade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        currentGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                        currentGrade === 'C' ? 'bg-cyan-100 text-cyan-800' :
                        currentGrade === 'D' ? 'bg-amber-100 text-amber-800' :
                        currentGrade === 'E' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {currentGrade}
                      </span>
                    </td>

                    {/* Annual Promotion Status for Cumulative View */}
                    {isCumulative && (
                      <td className="py-2 px-2 text-center border-l border-slate-200">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          student.promotionStatus === 'PROMOTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          student.promotionStatus === 'PROMOTED ON TRIAL' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          student.promotionStatus === 'GRADUATED' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {student.promotionStatus || 'PROMOTED'}
                        </span>
                        {student.promotedToClass && student.promotionStatus !== 'REPEAT' && (
                          <div className="text-[9px] text-slate-600 font-bold mt-0.5 whitespace-nowrap">
                            To {student.promotedToClass}
                          </div>
                        )}
                      </td>
                    )}

                    {/* View Report Card Button */}
                    <td className="py-2 px-2 text-center print:hidden">
                      <button
                        onClick={() => onSelectStudentForReport(student)}
                        className="p-1 rounded hover:bg-blue-100 text-blue-700 transition"
                        title="View Individual Report Card"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Official College Grading System & Scale Key Banner */}
        <div className="bg-slate-100/90 border-t border-slate-300 p-3 sm:p-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-slate-800 uppercase tracking-tight text-[11px]">
                Official College Grading System &amp; Performance Key:
              </span>
            </div>
            {onOpenPercentageModal && (
              <button
                type="button"
                onClick={onOpenPercentageModal}
                className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-900 bg-amber-400 hover:bg-amber-300 px-2 py-1 rounded shadow-xs transition print:hidden"
                title="Adjust score percentages & grading scale in Admin Studio"
              >
                <Sliders className="w-3 h-3" />
                <span>Adjust Grading System Scale</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
            {(settings.gradingScale || DEFAULT_GRADING_SCALE).map(item => {
              const badgeBg = 
                item.grade === 'A' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                item.grade === 'B' ? 'bg-blue-50 border-blue-300 text-blue-800' :
                item.grade === 'C' ? 'bg-cyan-50 border-cyan-300 text-cyan-800' :
                item.grade === 'D' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                item.grade === 'E' ? 'bg-orange-50 border-orange-300 text-orange-800' :
                'bg-red-50 border-red-300 text-red-800';

              return (
                <div key={item.grade} className={`p-2 rounded-lg border shadow-xs ${badgeBg}`}>
                  <div className="font-black text-xs font-mono">
                    Grade {item.grade} ({item.minScore}% – {item.maxScore}%)
                  </div>
                  <div className="text-[10px] font-medium truncate mt-0.5" title={item.remark}>
                    {item.remark}
                  </div>
                  {item.gpaPoints !== undefined && (
                    <div className="text-[9px] font-bold text-slate-500 mt-0.5">
                      {item.gpaPoints} GPA
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Official Broadsheet Certification & School Stamp Block */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-300 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
              <img
                src={settings.schoolStamp || DEFAULT_OFFICIAL_STAMP}
                alt="Official School Stamp"
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `rotate(${settings.schoolStampRotation ?? -6}deg)`,
                  opacity: settings.schoolStampOpacity ?? 0.88,
                }}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Official Broadsheet Certification &amp; School Seal
              </div>
              <div className="text-[11px] text-slate-600">
                Certified accurate, graded according to curriculum standards, and approved by the Academic Examination Committee.
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Class: <strong className="text-slate-800">{selectedClass}</strong> • Session: {settings.session} • Term: {broadsheetTerm}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-700">
            <div className="text-center">
              <span className="font-bold underline block font-serif text-[11px]">Mr. Kenneth Adams</span>
              <span className="text-[9px] text-slate-500 uppercase">Examination Officer</span>
            </div>
            <div className="text-center">
              <span className="font-bold underline block font-serif text-[11px]">SUPER ADMIN</span>
              <span className="text-[9px] text-slate-500 uppercase">Super Admin / Principal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
