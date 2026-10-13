import React, { useState, useMemo } from 'react';
import { Student, Teacher, SchoolSettings } from '../types';
import { SCHOOL_CLASSES, isJuniorClass } from '../data/mockData';
import { 
  BulkPromotionOptions, 
  PromotionDecision, 
  BulkPromotionResult 
} from '../services/store';
import { 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronRight, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  ArrowUpRight, 
  RotateCcw,
  BookOpen,
  Info,
  Check,
  Search,
  SlidersHorizontal,
  Award
} from 'lucide-react';

interface BulkPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentUser: Teacher;
  settings: SchoolSettings;
  activeTerm?: string;
  initialClass?: string;
  previewBulkPromotion: (options?: BulkPromotionOptions) => BulkPromotionResult;
  bulkPromoteStudents: (options?: BulkPromotionOptions) => BulkPromotionResult;
  addLog: (action: string, details: string) => void;
}

export const BulkPromotionModal: React.FC<BulkPromotionModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  settings,
  activeTerm = 'Third Term',
  initialClass = 'ALL',
  previewBulkPromotion,
  bulkPromoteStudents,
  addLog,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(initialClass || 'ALL');
  const [requireMathAndEnglish, setRequireMathAndEnglish] = useState<boolean>(true);
  const [passingScore, setPassingScore] = useState<number>(50);
  const [minAverageForPromotion, setMinAverageForPromotion] = useState<number>(50);
  const [minAverageForTrial, setMinAverageForTrial] = useState<number>(45);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PROMOTED' | 'TRIAL' | 'REPEAT' | 'GRADUATED'>('ALL');
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<BulkPromotionResult | null>(null);

  const isAdminOrOfficer = currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer';

  // Compute live preview decisions based on options
  const preview = useMemo(() => {
    return previewBulkPromotion({
      targetClass: selectedClass,
      passingScore,
      minAverageForPromotion,
      minAverageForTrial,
      requireMathAndEnglishPass: requireMathAndEnglish,
      term: activeTerm,
    });
  }, [
    previewBulkPromotion,
    selectedClass,
    passingScore,
    minAverageForPromotion,
    minAverageForTrial,
    requireMathAndEnglish,
    activeTerm,
    students,
  ]);

  // Filtered decisions for the table
  const filteredDecisions = useMemo(() => {
    return preview.decisions.filter(d => {
      // Status tab
      if (statusTab === 'PROMOTED' && d.status !== 'PROMOTED') return false;
      if (statusTab === 'TRIAL' && d.status !== 'PROMOTED ON TRIAL') return false;
      if (statusTab === 'REPEAT' && d.status !== 'REPEAT') return false;
      if (statusTab === 'GRADUATED' && d.status !== 'GRADUATED') return false;

      // Search
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.learnerId.toLowerCase().includes(q) ||
          d.currentClass.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [preview.decisions, statusTab, searchFilter]);

  // Breakdown of repeating reasons
  const repeatBreakdown = useMemo(() => {
    let failedMathOnly = 0;
    let failedEnglishOnly = 0;
    let failedBoth = 0;
    let lowAverageOnly = 0;

    for (const d of preview.repeatedStudents) {
      if (!d.mathPassed && !d.englishPassed) {
        failedBoth++;
      } else if (!d.mathPassed) {
        failedMathOnly++;
      } else if (!d.englishPassed) {
        failedEnglishOnly++;
      } else {
        lowAverageOnly++;
      }
    }

    return { failedMathOnly, failedEnglishOnly, failedBoth, lowAverageOnly };
  }, [preview.repeatedStudents]);

  // Handle execution
  const handleExecutePromotion = () => {
    try {
      const result = bulkPromoteStudents({
        targetClass: selectedClass,
        passingScore,
        minAverageForPromotion,
        minAverageForTrial,
        requireMathAndEnglishPass: requireMathAndEnglish,
        term: activeTerm,
      });
      setExecutionResult(result);
      setIsConfirmOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to execute bulk promotion.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-400/50 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white border-b-2 border-amber-500 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center shadow-lg font-black shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black font-serif text-amber-300 tracking-wide">
                  Bulk Student Promotion Center
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-400 text-red-950 tracking-wider">
                  Admin Authority
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Bulk promote students to the next class level based on terminal performance & core Mathematics/English pass requirements
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-red-900/60 hover:bg-red-800 text-amber-200 hover:text-white flex items-center justify-center transition text-sm font-bold border border-red-700/60"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Success Banner if Executed */}
        {executionResult && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3.5 flex items-center justify-between gap-3 text-emerald-900 shrink-0 animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-sm block">
                  Bulk Promotion Successfully Executed!
                </span>
                <span>
                  Processed {executionResult.totalProcessed} students: {executionResult.promotedCount} Promoted Outright, {executionResult.trialCount} Promoted on Trial, {executionResult.repeatCount} Retained to Repeat, {executionResult.graduatedCount} Graduated. Records and broadsheets updated.
                </span>
              </div>
            </div>
            <button
              onClick={() => setExecutionResult(null)}
              className="text-xs font-semibold px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg border border-emerald-300 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Prerequisite & Policy Notice Banner */}
        <div className="bg-amber-50/80 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-bold text-amber-900">Official Promotion Policy:</span>
            <span>
              Both <strong>Mathematics (≥{passingScore}%)</strong> and <strong>English Language (≥{passingScore}%)</strong> must be passed before any student can be promoted or graduated.
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-amber-800 font-medium">
            <span>Terminal Basis: <strong>Annual Cumulative / Third Term</strong></span>
          </div>
        </div>

        {/* Controls & Configuration Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-4 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Class Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Class:
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">All Classes Across School ({students.length} Students)</option>
                {SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>
                    {cls} {isJuniorClass(cls) ? '(Junior Section)' : '(Senior Section)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Core Subject Rule Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm text-xs font-semibold text-slate-800 hover:bg-amber-50/50 transition">
              <input
                type="checkbox"
                checked={requireMathAndEnglish}
                onChange={e => setRequireMathAndEnglish(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
              />
              <span className="text-slate-900">
                Enforce Compulsory Math & English Pass Rule
              </span>
            </label>

            {/* Passing Score Input */}
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700">
              <span>Pass Score:</span>
              <input
                type="number"
                min="40"
                max="75"
                value={passingScore}
                onChange={e => setPassingScore(Number(e.target.value) || 50)}
                className="w-14 px-2 py-0.5 border border-slate-300 rounded font-bold text-center text-xs"
              />
              <span>%</span>
            </div>

            {/* Outright Promotion Threshold */}
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700">
              <span>Min Avg for Promotion:</span>
              <input
                type="number"
                min="45"
                max="70"
                value={minAverageForPromotion}
                onChange={e => setMinAverageForPromotion(Number(e.target.value) || 50)}
                className="w-14 px-2 py-0.5 border border-slate-300 rounded font-bold text-center text-xs"
              />
              <span>%</span>
            </div>

            {/* Trial Threshold */}
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700">
              <span>Trial Avg Cutoff:</span>
              <input
                type="number"
                min="40"
                max="50"
                value={minAverageForTrial}
                onChange={e => setMinAverageForTrial(Number(e.target.value) || 45)}
                className="w-14 px-2 py-0.5 border border-slate-300 rounded font-bold text-center text-xs"
              />
              <span>%</span>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 sm:p-5 bg-white border-b border-slate-200 shrink-0">
          {/* Total Evaluated */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pool Evaluated
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5 flex items-center justify-between">
              <span>{preview.totalProcessed}</span>
              <span className="text-xs font-normal text-slate-500">Learners</span>
            </div>
          </div>

          {/* Outright Promoted */}
          <div 
            onClick={() => setStatusTab('PROMOTED')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusTab === 'PROMOTED' 
                ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-500' 
                : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>Outright Promoted</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <div className="text-xl font-black text-emerald-900 mt-0.5 flex items-center justify-between">
              <span>{preview.promotedCount}</span>
              <span className="text-xs font-bold text-emerald-700">
                {preview.totalProcessed > 0 ? Math.round((preview.promotedCount / preview.totalProcessed) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Promoted on Trial */}
          <div 
            onClick={() => setStatusTab('TRIAL')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusTab === 'TRIAL' 
                ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-500' 
                : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Promoted on Trial</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </span>
            <div className="text-xl font-black text-amber-900 mt-0.5 flex items-center justify-between">
              <span>{preview.trialCount}</span>
              <span className="text-xs font-bold text-amber-700">
                {preview.totalProcessed > 0 ? Math.round((preview.trialCount / preview.totalProcessed) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Repeating / Denied */}
          <div 
            onClick={() => setStatusTab('REPEAT')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusTab === 'REPEAT' 
                ? 'bg-red-100/70 border-red-400 ring-2 ring-red-500' 
                : 'bg-red-50/60 border-red-200 hover:bg-red-50'
            }`}
          >
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider flex items-center justify-between">
              <span>Required to Repeat</span>
              <XCircle className="w-3.5 h-3.5 text-red-600" />
            </span>
            <div className="text-xl font-black text-red-900 mt-0.5 flex items-center justify-between">
              <span>{preview.repeatCount}</span>
              <span className="text-xs font-bold text-red-700">
                {preview.totalProcessed > 0 ? Math.round((preview.repeatCount / preview.totalProcessed) * 100) : 0}%
              </span>
            </div>
            <div className="text-[9.5px] text-red-700/90 mt-1 space-x-1 font-medium truncate" title="Repeat Breakdown">
              <span>Math fail: {repeatBreakdown.failedMathOnly}</span> • 
              <span> Eng fail: {repeatBreakdown.failedEnglishOnly}</span> • 
              <span> Both: {repeatBreakdown.failedBoth}</span>
            </div>
          </div>

          {/* Graduated */}
          <div 
            onClick={() => setStatusTab('GRADUATED')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusTab === 'GRADUATED' 
                ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-500' 
                : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
            }`}
          >
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center justify-between">
              <span>Graduated</span>
              <Award className="w-3.5 h-3.5 text-blue-600" />
            </span>
            <div className="text-xl font-black text-blue-900 mt-0.5 flex items-center justify-between">
              <span>{preview.graduatedCount}</span>
              <span className="text-xs font-bold text-blue-700">Alumni</span>
            </div>
          </div>
        </div>

        {/* Filter and Tab Bar */}
        <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-300 shadow-sm text-xs font-bold">
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                statusTab === 'ALL'
                  ? 'bg-red-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({preview.totalProcessed})
            </button>
            <button
              onClick={() => setStatusTab('PROMOTED')}
              className={`px-3 py-1 rounded-lg transition ${
                statusTab === 'PROMOTED'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              Promoted ({preview.promotedCount})
            </button>
            <button
              onClick={() => setStatusTab('TRIAL')}
              className={`px-3 py-1 rounded-lg transition ${
                statusTab === 'TRIAL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              On Trial ({preview.trialCount})
            </button>
            <button
              onClick={() => setStatusTab('REPEAT')}
              className={`px-3 py-1 rounded-lg transition ${
                statusTab === 'REPEAT'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-red-800 hover:bg-red-50'
              }`}
            >
              Repeating ({preview.repeatCount})
            </button>
            <button
              onClick={() => setStatusTab('GRADUATED')}
              className={`px-3 py-1 rounded-lg transition ${
                statusTab === 'GRADUATED'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-blue-800 hover:bg-blue-50'
              }`}
            >
              Graduated ({preview.graduatedCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search learner name or ID..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 shadow-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Student Decisions Table */}
        <div className="flex-1 overflow-y-auto max-h-[440px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-800 text-amber-200 text-[10.5px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-2">Learner ID</th>
                <th className="py-2.5 px-2 text-center">Current Class</th>
                <th className="py-2.5 px-2 text-center bg-slate-900 text-amber-300">Terminal Avg</th>
                <th className="py-2.5 px-2 text-center bg-slate-900">
                  <div className="flex items-center justify-center space-x-1">
                    <span>Mathematics</span>
                    <span className="text-[9px] text-amber-400 font-mono">(≥{passingScore}%)</span>
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center bg-slate-900">
                  <div className="flex items-center justify-center space-x-1">
                    <span>English Lang</span>
                    <span className="text-[9px] text-amber-400 font-mono">(≥{passingScore}%)</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Promotion Decision</th>
                <th className="py-2.5 px-3 text-center">New Placement</th>
                <th className="py-2.5 px-3">Reason / Academic Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No student records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredDecisions.map(decision => {
                  const isPromoted = decision.status === 'PROMOTED';
                  const isTrial = decision.status === 'PROMOTED ON TRIAL';
                  const isGraduated = decision.status === 'GRADUATED';
                  const isRepeat = decision.status === 'REPEAT';

                  return (
                    <tr 
                      key={decision.studentId}
                      className={`hover:bg-slate-50 transition ${
                        isRepeat ? 'bg-red-50/30' :
                        isTrial ? 'bg-amber-50/20' :
                        isGraduated ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {decision.name}
                      </td>

                      {/* Learner ID */}
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {decision.learnerId}
                      </td>

                      {/* Current Class */}
                      <td className="py-2 px-2 text-center font-bold text-slate-700 whitespace-nowrap">
                        {decision.currentClass}
                      </td>

                      {/* Terminal Average */}
                      <td className="py-2 px-2 text-center font-mono font-black text-slate-900 bg-slate-50/80">
                        {decision.terminalAverage}%
                      </td>

                      {/* Mathematics */}
                      <td className="py-2 px-2 text-center font-mono">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          decision.mathPassed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          <span>{decision.mathScore}%</span>
                          {decision.mathPassed ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <span className="text-[9px] font-black text-red-700">FAIL</span>
                          )}
                        </span>
                      </td>

                      {/* English Language */}
                      <td className="py-2 px-2 text-center font-mono">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          decision.englishPassed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          <span>{decision.englishScore}%</span>
                          {decision.englishPassed ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <span className="text-[9px] font-black text-red-700">FAIL</span>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isPromoted ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          isTrial ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          isGraduated ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          'bg-red-100 text-red-900 border border-red-300'
                        }`}>
                          {decision.status}
                        </span>
                      </td>

                      {/* Next Placement */}
                      <td className="py-2 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-slate-400 font-normal">{decision.currentClass}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          <span className={
                            isRepeat ? 'text-red-700 font-black' :
                            isGraduated ? 'text-blue-700 font-black' :
                            'text-emerald-700 font-black'
                          }>
                            {decision.promotedClass}
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        <span className={isRepeat ? 'text-red-700 font-medium' : ''}>
                          {decision.reason}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Executing promotion moves qualified students to the next academic level, updates broadsheet rosters, and generates official promotion remarks.
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-100 transition shadow-sm"
            >
              Cancel
            </button>

            {isAdminOrOfficer ? (
              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={preview.totalProcessed === 0}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-900 via-red-800 to-red-950 hover:from-red-800 hover:to-red-900 disabled:opacity-50 text-amber-300 font-black text-xs rounded-xl shadow-lg border border-amber-400 transition transform hover:-translate-y-0.5"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>
                  Execute Bulk Promotion ({preview.promotedCount + preview.trialCount} to Advance)
                </span>
              </button>
            ) : (
              <div className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-2 rounded-xl border border-amber-300">
                Admin or Examination Officer credentials required to execute bulk promotion.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-500 max-w-lg w-full overflow-hidden text-slate-900">
            <div className="p-5 bg-gradient-to-r from-red-950 to-red-900 text-white border-b-2 border-amber-500 flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-amber-300 font-serif">
                  Confirm Bulk Student Promotion
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Scope: {selectedClass === 'ALL' ? 'All Classes Across St. Paul College' : selectedClass}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                You are about to execute bulk academic promotion for <strong>{preview.totalProcessed}</strong> student records:
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-emerald-800 font-bold">
                  <span>Outright Promotion (Math & Eng ≥ {passingScore}%, Avg ≥ {minAverageForPromotion}%):</span>
                  <span>{preview.promotedCount} Students</span>
                </div>
                <div className="flex justify-between items-center text-amber-800 font-bold">
                  <span>Promoted on Trial (Math & Eng ≥ {passingScore}%, Avg ≥ {minAverageForTrial}%):</span>
                  <span>{preview.trialCount} Students</span>
                </div>
                <div className="flex justify-between items-center text-red-800 font-bold">
                  <span>Retained to Repeat (Failed Core or Avg &lt; {minAverageForTrial}%):</span>
                  <span>{preview.repeatCount} Students</span>
                </div>
                {preview.graduatedCount > 0 && (
                  <div className="flex justify-between items-center text-blue-800 font-bold">
                    <span>Graduated Alumni:</span>
                    <span>{preview.graduatedCount} Students</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold block">Strict Enforcement Confirmed:</span>
                <span>
                  Students who failed Mathematics or English Language will NOT be promoted and must repeat their current class.
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                className="px-5 py-2 bg-red-900 hover:bg-red-800 text-amber-300 text-xs font-black rounded-xl shadow-md border border-amber-400 transition"
              >
                Yes, Execute Promotion Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
