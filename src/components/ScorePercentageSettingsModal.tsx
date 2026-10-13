import React, { useState, useMemo, useEffect } from 'react';
import { SchoolSettings, CAWeightConfig, Teacher, GradeScaleItem, Grade } from '../types';
import { 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Info, 
  X, 
  Save,
  BookOpen,
  Award,
  Layers,
  GraduationCap,
  Calculator,
  Check
} from 'lucide-react';
import { DEFAULT_JUNIOR_CA_CONFIG, DEFAULT_SENIOR_CA_CONFIG, DEFAULT_GRADING_SCALE } from '../data/mockData';

interface ScorePercentageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  currentUser: Teacher;
  onUpdateSectionCAConfig: (section: 'JUNIOR' | 'SENIOR' | 'BOTH', config: CAWeightConfig, recalculateScores?: boolean) => void;
  onUpdateGradingScale?: (newScale: GradeScaleItem[]) => void;
  addLog: (action: string, details: string) => void;
}

export const ScorePercentageSettingsModal: React.FC<ScorePercentageSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onUpdateSectionCAConfig,
  onUpdateGradingScale,
  addLog,
}) => {
  const [configMode, setConfigMode] = useState<'ca-weights' | 'grading-scale'>('ca-weights');
  const [activeSection, setActiveSection] = useState<'JUNIOR' | 'SENIOR' | 'BOTH'>('JUNIOR');
  const [recalculateScores, setRecalculateScores] = useState<boolean>(true);

  // Local state for weights so the admin can adjust before committing
  const [juniorWeights, setJuniorWeights] = useState<CAWeightConfig>(settings.juniorCAConfig || DEFAULT_JUNIOR_CA_CONFIG);
  const [seniorWeights, setSeniorWeights] = useState<CAWeightConfig>(settings.seniorCAConfig || DEFAULT_SENIOR_CA_CONFIG);
  const [gradingScaleDraft, setGradingScaleDraft] = useState<GradeScaleItem[]>(settings.gradingScale || DEFAULT_GRADING_SCALE);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Test score simulator for interactive grade testing
  const [testScore, setTestScore] = useState<number>(75);

  // Sync with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setJuniorWeights(settings.juniorCAConfig || DEFAULT_JUNIOR_CA_CONFIG);
      setSeniorWeights(settings.seniorCAConfig || DEFAULT_SENIOR_CA_CONFIG);
      setGradingScaleDraft(settings.gradingScale || DEFAULT_GRADING_SCALE);
      setSaveSuccessMessage(null);
    }
  }, [isOpen, settings]);

  const currentWeights = activeSection === 'SENIOR' ? seniorWeights : juniorWeights;
  const currentTotal = 
    Number(currentWeights.ca1Max || 0) + 
    Number(currentWeights.ca2Max || 0) + 
    Number(currentWeights.ca3Max || 0) + 
    Number(currentWeights.ca4Max || 0) + 
    Number(currentWeights.examMax || 0);

  const isExceeded = currentTotal > 100;
  const isExact = currentTotal === 100;
  const isUnder = currentTotal < 100;

  const handleWeightChange = (field: keyof Omit<CAWeightConfig, 'totalMax'>, valStr: string) => {
    const val = valStr === '' ? 0 : Math.max(0, Math.min(100, Number(valStr)));
    if (isNaN(val)) return;

    if (activeSection === 'JUNIOR' || activeSection === 'BOTH') {
      setJuniorWeights(prev => ({
        ...prev,
        [field]: val,
        totalMax: 100,
      }));
    }
    if (activeSection === 'SENIOR' || activeSection === 'BOTH') {
      setSeniorWeights(prev => ({
        ...prev,
        [field]: val,
        totalMax: 100,
      }));
    }
    setSaveSuccessMessage(null);
  };

  const applyPreset = (ca1: number, ca2: number, ca3: number, ca4: number, exam: number) => {
    const presetConfig: CAWeightConfig = {
      ca1Max: ca1,
      ca2Max: ca2,
      ca3Max: ca3,
      ca4Max: ca4,
      examMax: exam,
      totalMax: 100,
    };

    if (activeSection === 'JUNIOR' || activeSection === 'BOTH') {
      setJuniorWeights(presetConfig);
    }
    if (activeSection === 'SENIOR' || activeSection === 'BOTH') {
      setSeniorWeights(presetConfig);
    }
    setSaveSuccessMessage(null);
  };

  const handleScaleItemChange = (grade: Grade, field: keyof GradeScaleItem, value: any) => {
    setGradingScaleDraft(prev => prev.map(item => {
      if (item.grade === grade) {
        return { ...item, [field]: value };
      }
      return item;
    }));
    setSaveSuccessMessage(null);
  };

  const applyGradingPreset = (type: 'stpaul' | 'waec' | 'tertiary' | 'strict') => {
    if (type === 'stpaul') {
      setGradingScaleDraft([
        { grade: 'A', minScore: 80, maxScore: 100, remark: 'Distinction / Excellent', gpaPoints: 5.0, colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
        { grade: 'B', minScore: 70, maxScore: 79, remark: 'Very Good', gpaPoints: 4.0, colorClass: 'text-blue-700 bg-blue-50 border-blue-300' },
        { grade: 'C', minScore: 60, maxScore: 69, remark: 'Credit / Good', gpaPoints: 3.0, colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
        { grade: 'D', minScore: 56, maxScore: 59, remark: 'Pass', gpaPoints: 2.0, colorClass: 'text-amber-700 bg-amber-50 border-amber-300' },
        { grade: 'E', minScore: 50, maxScore: 55, remark: 'Fair / Weak Pass', gpaPoints: 1.0, colorClass: 'text-orange-700 bg-orange-50 border-orange-300' },
        { grade: 'F', minScore: 0, maxScore: 49, remark: 'Fail', gpaPoints: 0.0, colorClass: 'text-red-700 bg-red-50 border-red-300' },
      ]);
    } else if (type === 'waec') {
      setGradingScaleDraft([
        { grade: 'A', minScore: 75, maxScore: 100, remark: 'Excellent (A1)', gpaPoints: 5.0, colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
        { grade: 'B', minScore: 65, maxScore: 74, remark: 'Very Good (B2/B3)', gpaPoints: 4.0, colorClass: 'text-blue-700 bg-blue-50 border-blue-300' },
        { grade: 'C', minScore: 50, maxScore: 64, remark: 'Credit (C4-C6)', gpaPoints: 3.0, colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
        { grade: 'D', minScore: 45, maxScore: 49, remark: 'Pass (D7)', gpaPoints: 2.0, colorClass: 'text-amber-700 bg-amber-50 border-amber-300' },
        { grade: 'E', minScore: 40, maxScore: 44, remark: 'Weak Pass (E8)', gpaPoints: 1.0, colorClass: 'text-orange-700 bg-orange-50 border-orange-300' },
        { grade: 'F', minScore: 0, maxScore: 39, remark: 'Fail (F9)', gpaPoints: 0.0, colorClass: 'text-red-700 bg-red-50 border-red-300' },
      ]);
    } else if (type === 'tertiary') {
      setGradingScaleDraft([
        { grade: 'A', minScore: 70, maxScore: 100, remark: 'Distinction / First Class', gpaPoints: 5.0, colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
        { grade: 'B', minScore: 60, maxScore: 69, remark: 'Very Good / Upper Credit', gpaPoints: 4.0, colorClass: 'text-blue-700 bg-blue-50 border-blue-300' },
        { grade: 'C', minScore: 50, maxScore: 59, remark: 'Credit / Lower Credit', gpaPoints: 3.0, colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
        { grade: 'D', minScore: 45, maxScore: 49, remark: 'Pass', gpaPoints: 2.0, colorClass: 'text-amber-700 bg-amber-50 border-amber-300' },
        { grade: 'E', minScore: 40, maxScore: 44, remark: 'Fair Pass', gpaPoints: 1.0, colorClass: 'text-orange-700 bg-orange-50 border-orange-300' },
        { grade: 'F', minScore: 0, maxScore: 39, remark: 'Fail', gpaPoints: 0.0, colorClass: 'text-red-700 bg-red-50 border-red-300' },
      ]);
    } else {
      setGradingScaleDraft([
        { grade: 'A', minScore: 85, maxScore: 100, remark: 'High Distinction', gpaPoints: 5.0, colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
        { grade: 'B', minScore: 75, maxScore: 84, remark: 'Distinction', gpaPoints: 4.0, colorClass: 'text-blue-700 bg-blue-50 border-blue-300' },
        { grade: 'C', minScore: 65, maxScore: 74, remark: 'Credit', gpaPoints: 3.0, colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
        { grade: 'D', minScore: 60, maxScore: 64, remark: 'Satisfactory Pass', gpaPoints: 2.0, colorClass: 'text-amber-700 bg-amber-50 border-amber-300' },
        { grade: 'E', minScore: 50, maxScore: 59, remark: 'Pass', gpaPoints: 1.0, colorClass: 'text-orange-700 bg-orange-50 border-orange-300' },
        { grade: 'F', minScore: 0, maxScore: 49, remark: 'Fail', gpaPoints: 0.0, colorClass: 'text-red-700 bg-red-50 border-red-300' },
      ]);
    }
    setSaveSuccessMessage(null);
  };

  // Live test result for interactive score simulator
  const simulatedGradeItem = useMemo(() => {
    const scoreVal = Math.round(Number(testScore || 0) * 10) / 10;
    for (const item of gradingScaleDraft) {
      if (scoreVal >= item.minScore) {
        return item;
      }
    }
    return gradingScaleDraft[gradingScaleDraft.length - 1] || { grade: 'F', remark: 'Fail', gpaPoints: 0, colorClass: 'text-red-700 bg-red-50' };
  }, [testScore, gradingScaleDraft]);

  const handleSave = () => {
    if (configMode === 'grading-scale') {
      if (onUpdateGradingScale) {
        onUpdateGradingScale(gradingScaleDraft);
        setSaveSuccessMessage('Official school grading system scale saved and all student grades recalculated!');
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      }
      return;
    }

    if (isExceeded) {
      return;
    }

    onUpdateSectionCAConfig(activeSection, currentWeights, recalculateScores);
    setSaveSuccessMessage(
      `Successfully adjusted ${activeSection === 'BOTH' ? 'Entire College (All Classes)' : `${activeSection} School`} CA & Exam weights to ${currentTotal}%!${recalculateScores ? ' Recalculated student scores.' : ''}`
    );
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Red & Gold theme */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              {configMode === 'ca-weights' ? <Sliders className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-amber-300 font-serif">
                  {configMode === 'ca-weights' ? 'Adjustable CA & Examination Configuration' : 'College Grading System & Scale Key'}
                </h3>
                <span className="bg-amber-400 text-red-950 text-[10px] font-bold px-2 py-0.5 rounded shadow uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-amber-100/80 mt-0.5">
                {configMode === 'ca-weights' 
                  ? 'Adjust Continuous Assessment (CA 1–4) and Examination percentages for Junior & Senior classes (Total = 100%)'
                  : 'Manage official grade thresholds (A, B, C, D, E, F), performance remarks, and GPA point scale.'}
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

        {/* Top-Level Mode Navigation Switcher */}
        <div className="bg-red-950 px-4 py-2 border-b border-red-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 bg-red-900/60 p-1 rounded-xl border border-red-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setConfigMode('ca-weights'); setSaveSuccessMessage(null); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                configMode === 'ca-weights'
                  ? 'bg-amber-400 text-red-950 shadow'
                  : 'text-amber-200 hover:text-white hover:bg-red-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>CA &amp; Exam Weights (100% Split)</span>
            </button>
            <button
              type="button"
              onClick={() => { setConfigMode('grading-scale'); setSaveSuccessMessage(null); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                configMode === 'grading-scale'
                  ? 'bg-amber-400 text-red-950 shadow'
                  : 'text-amber-200 hover:text-white hover:bg-red-800/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>College Grading System &amp; Scale Key</span>
            </button>
          </div>
          <span className="hidden md:inline text-[11px] font-medium text-amber-200/70">
            {configMode === 'ca-weights' ? 'Weights apply to Junior & Senior classes' : 'Official A, B, C, D, E, F criteria'}
          </span>
        </div>

        {/* MODE 1: CA & EXAM WEIGHTS */}
        {configMode === 'ca-weights' && (
          <>
            {/* Section Tabs (Junior vs Senior vs Both) */}
            <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => { setActiveSection('JUNIOR'); setSaveSuccessMessage(null); }}
                className={`flex-1 min-w-[150px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeSection === 'JUNIOR'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>JUNIOR (JSS 1, 2, 3)</span>
              </button>

              <button
                onClick={() => { setActiveSection('SENIOR'); setSaveSuccessMessage(null); }}
                className={`flex-1 min-w-[150px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeSection === 'SENIOR'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Award className="w-4 h-4 text-blue-600" />
                <span>SENIOR (SSS 1, 2, 3)</span>
              </button>

              <button
                onClick={() => { setActiveSection('BOTH'); setSaveSuccessMessage(null); }}
                className={`flex-1 min-w-[150px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeSection === 'BOTH'
                    ? 'bg-amber-400 text-red-950 shadow-sm border border-amber-300 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-red-950" />
                <span>ENTIRE COLLEGE (ALL CLASSES)</span>
              </button>
            </div>

            {/* Body content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Feedback Banner */}
              {saveSuccessMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Real-time Percentage Sum Meter */}
              <div className={`p-4 rounded-xl border transition-all ${
                isExceeded 
                  ? 'bg-red-50 border-red-300' 
                  : isExact 
                    ? 'bg-emerald-50/80 border-emerald-300' 
                    : 'bg-amber-50/80 border-amber-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    {isExceeded ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    ) : isExact ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Info className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {activeSection === 'BOTH' ? 'Entire College' : activeSection} Cumulative Percentage Status
                      </div>
                      <div className={`text-xs font-medium ${
                        isExceeded ? 'text-red-700 font-bold' : isExact ? 'text-emerald-700' : 'text-amber-800'
                      }`}>
                        {isExceeded && `⚠️ INVALID: Total is ${currentTotal}%. IT MUST NOT EXCEED 100%! Please reduce CA or Exam percentages.`}
                        {isExact && `✅ PERFECT: Total is exactly 100%. Ready to apply to student mark sheets.`}
                        {isUnder && `ℹ️ Total is ${currentTotal}% (Under 100%). It is advised to balance components to total 100%.`}
                      </div>
                    </div>
                  </div>

                  {/* Big Percentage Badge */}
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-black font-mono px-3 py-1 rounded-lg border shadow-sm ${
                      isExceeded 
                        ? 'bg-red-600 text-white border-red-700' 
                        : isExact 
                          ? 'bg-emerald-600 text-white border-emerald-700' 
                          : 'bg-amber-500 text-white border-amber-600'
                    }`}>
                      {currentTotal}%
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 100%</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                  <div style={{ width: `${Math.min(100, currentWeights.ca1Max)}%` }} className="bg-blue-600" title={`CA1: ${currentWeights.ca1Max}%`} />
                  <div style={{ width: `${Math.min(100, currentWeights.ca2Max)}%` }} className="bg-sky-500" title={`CA2: ${currentWeights.ca2Max}%`} />
                  <div style={{ width: `${Math.min(100, currentWeights.ca3Max)}%` }} className="bg-indigo-500" title={`CA3: ${currentWeights.ca3Max}%`} />
                  <div style={{ width: `${Math.min(100, currentWeights.ca4Max)}%` }} className="bg-purple-500" title={`CA4: ${currentWeights.ca4Max}%`} />
                  <div style={{ width: `${Math.min(100, currentWeights.examMax)}%` }} className="bg-amber-500" title={`Exam: ${currentWeights.examMax}%`} />
                </div>
              </div>

              {/* Quick Standard Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Quick Standard Academic Presets for {activeSection}
                  </span>
                  <span className="text-[11px] text-slate-500">Click to instantly populate balanced 100% weights</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset(10, 10, 10, 0, 70)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition text-xs group"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-blue-700">30% CA + 70% Exam (Standard 3-Test)</div>
                    <div className="text-[10px] text-slate-500">10 + 10 + 10 + 0 + 70 = 100%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset(10, 10, 0, 0, 80)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition text-xs group"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-emerald-700">20% CA + 80% Exam (WAEC/NECO Standard)</div>
                    <div className="text-[10px] text-slate-500">10 + 10 + 0 + 0 + 80 = 100%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset(20, 20, 0, 0, 60)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition text-xs group"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-purple-700">40% CA + 60% Exam (2-Tier)</div>
                    <div className="text-[10px] text-slate-500">20 + 20 + 0 + 0 + 60 = 100%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset(10, 10, 15, 15, 50)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 transition text-xs group"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-rose-700">50% CA + 50% Exam (Equal Split)</div>
                    <div className="text-[10px] text-slate-500">10 + 10 + 15 + 15 + 50 = 100%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset(5, 5, 5, 5, 80)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 transition text-xs group"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-cyan-700">20% CA + 80% Exam (High Terminal)</div>
                    <div className="text-[10px] text-slate-500">5 + 5 + 5 + 5 + 80 = 100%</div>
                  </button>
                </div>
              </div>

              {/* Interactive Weight Sliders & Number Inputs */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-100 flex items-center justify-between">
                  <span>Adjust Assessment Components for {activeSection}</span>
                  <span className="text-[11px] font-normal text-slate-500">Inputs auto-sync with sliders</span>
                </h4>

                {/* CA 1 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <div className="sm:w-48">
                    <div className="text-xs font-bold text-slate-900">CA 1 (1st Test / Assignment)</div>
                    <div className="text-[10px] text-slate-500">Continuous Assessment 1</div>
                  </div>
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={currentWeights.ca1Max}
                      onChange={e => handleWeightChange('ca1Max', e.target.value)}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentWeights.ca1Max}
                      onChange={e => handleWeightChange('ca1Max', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* CA 2 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <div className="sm:w-48">
                    <div className="text-xs font-bold text-slate-900">CA 2 (2nd Test / Midterm)</div>
                    <div className="text-[10px] text-slate-500">Continuous Assessment 2</div>
                  </div>
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={currentWeights.ca2Max}
                      onChange={e => handleWeightChange('ca2Max', e.target.value)}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentWeights.ca2Max}
                      onChange={e => handleWeightChange('ca2Max', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* CA 3 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <div className="sm:w-48">
                    <div className="text-xs font-bold text-slate-900">CA 3 (Project / Practical)</div>
                    <div className="text-[10px] text-slate-500">Continuous Assessment 3</div>
                  </div>
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={currentWeights.ca3Max}
                      onChange={e => handleWeightChange('ca3Max', e.target.value)}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentWeights.ca3Max}
                      onChange={e => handleWeightChange('ca3Max', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* CA 4 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <div className="sm:w-48">
                    <div className="text-xs font-bold text-slate-900">CA 4 (Classwork &amp; Attendance)</div>
                    <div className="text-[10px] text-slate-500">Continuous Assessment 4</div>
                  </div>
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={currentWeights.ca4Max}
                      onChange={e => handleWeightChange('ca4Max', e.target.value)}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentWeights.ca4Max}
                      onChange={e => handleWeightChange('ca4Max', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* Terminal Exam */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-amber-50/60 rounded-lg border border-amber-200">
                  <div className="sm:w-48">
                    <div className="text-xs font-bold text-slate-900">Terminal Examination</div>
                    <div className="text-[10px] text-slate-500">End of Term Examination</div>
                  </div>
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={currentWeights.examMax}
                      onChange={e => handleWeightChange('examMax', e.target.value)}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentWeights.examMax}
                      onChange={e => handleWeightChange('examMax', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-center font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>
              </div>

              {/* Demonstration Preview Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Live Demonstration for {activeSection} Learner Report</span>
                </div>
                <div className="text-xs text-slate-600 mb-2">
                  If a student scores full marks in all assessments:
                </div>
                <div className="grid grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">CA1</div>
                    <div className="font-bold text-slate-900">{currentWeights.ca1Max} / {currentWeights.ca1Max}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">CA2</div>
                    <div className="font-bold text-slate-900">{currentWeights.ca2Max} / {currentWeights.ca2Max}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">CA3</div>
                    <div className="font-bold text-slate-900">{currentWeights.ca3Max} / {currentWeights.ca3Max}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">CA4</div>
                    <div className="font-bold text-slate-900">{currentWeights.ca4Max} / {currentWeights.ca4Max}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Exam</div>
                    <div className="font-bold text-slate-900">{currentWeights.examMax} / {currentWeights.examMax}</div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-300">
                    <div className="text-[10px] text-emerald-700 font-bold">Total</div>
                    <div className="font-black text-emerald-800">{currentTotal} / 100%</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MODE 2: GRADING SYSTEM & SCALE KEY */}
        {configMode === 'grading-scale' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Feedback Banner */}
            {saveSuccessMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {/* Explainer Banner */}
            <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl flex items-start space-x-3">
              <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-amber-950 uppercase tracking-tight">
                  Standard School Grading Policy &amp; Grade Thresholds
                </h4>
                <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                  Configure the cutoff percentages for each letter grade (A, B, C, D, E, F), official remarks, and GPA grade points. These criteria are printed on all Terminal Report Sheets, Class Broadsheets, and shown on the online Student Results Portal.
                </p>
              </div>
            </div>

            {/* Quick 1-Click Grading Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Preset Academic Grading Benchmarks
                </span>
                <span className="text-[11px] text-slate-500">1-click official scale selection</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyGradingPreset('stpaul')}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition text-xs group shadow-xs"
                >
                  <div className="font-bold text-slate-900 group-hover:text-emerald-700 flex items-center justify-between">
                    <span>St. Paul Standard</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">A ≥ 80%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    A: 80–100, B: 70–79, C: 60–69, D: 56–59, E: 50–55, F: 0–49
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyGradingPreset('waec')}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition text-xs group shadow-xs"
                >
                  <div className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                    <span>WAEC / National</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">A ≥ 75%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    A: 75–100, B: 65–74, C: 50–64, D: 45–49, E: 40–44, F: 0–39
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyGradingPreset('tertiary')}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 transition text-xs group shadow-xs"
                >
                  <div className="font-bold text-slate-900 group-hover:text-cyan-700 flex items-center justify-between">
                    <span>Tertiary (70% Dist.)</span>
                    <span className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded font-mono font-bold">A ≥ 70%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    A: 70–100, B: 60–69, C: 50–59, D: 45–49, E: 40–44, F: 0–39
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyGradingPreset('strict')}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition text-xs group shadow-xs"
                >
                  <div className="font-bold text-slate-900 group-hover:text-purple-700 flex items-center justify-between">
                    <span>Strict Merit Scale</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-mono font-bold">A ≥ 85%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    A: 85–100, B: 75–84, C: 65–74, D: 60–64, E: 50–59, F: 0–49
                  </div>
                </button>
              </div>
            </div>

            {/* Interactive Grading Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Grading Scale Breakdown &amp; Performance Remarks
                </span>
                <span className="text-[11px] text-slate-500">Edit score cutoffs and remarks directly</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-16">Grade</th>
                      <th className="py-2.5 px-3 text-center w-28">Min Score (%)</th>
                      <th className="py-2.5 px-3 text-center w-28">Max Score (%)</th>
                      <th className="py-2.5 px-3">Official Remark</th>
                      <th className="py-2.5 px-3 text-center w-24">GPA (Points)</th>
                      <th className="py-2.5 px-3 text-center w-24">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {gradingScaleDraft.map((item, idx) => {
                      const gradeColor = 
                        item.grade === 'A' ? 'bg-emerald-600 text-white' :
                        item.grade === 'B' ? 'bg-blue-600 text-white' :
                        item.grade === 'C' ? 'bg-cyan-600 text-white' :
                        item.grade === 'D' ? 'bg-amber-600 text-white' :
                        item.grade === 'E' ? 'bg-orange-600 text-white' :
                        'bg-red-600 text-white';

                      return (
                        <tr key={item.grade} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-sm shadow-xs ${gradeColor}`}>
                              {item.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.minScore}
                              onChange={e => handleScaleItemChange(item.grade, 'minScore', Math.max(0, Math.min(100, Number(e.target.value))))}
                              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.maxScore}
                              onChange={e => handleScaleItemChange(item.grade, 'maxScore', Math.max(0, Math.min(100, Number(e.target.value))))}
                              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.remark}
                              onChange={e => handleScaleItemChange(item.grade, 'remark', e.target.value)}
                              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                              placeholder="e.g. Distinction, Credit, Pass"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="5"
                              value={item.gpaPoints ?? 0}
                              onChange={e => handleScaleItemChange(item.grade, 'gpaPoints', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              {item.minScore}% – {item.maxScore}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Live Score Simulator */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-xl shadow-md border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                      Interactive Live Score Tester
                    </h5>
                    <p className="text-[11px] text-slate-300">
                      Test any percentage to verify how it maps to your grading scale in real-time
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-300">Test Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={testScore}
                    onChange={e => setTestScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded-lg text-center font-bold text-sm text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-amber-300">%</span>
                </div>
              </div>

              {/* Slider for test score */}
              <input
                type="range"
                min="0"
                max="100"
                value={testScore}
                onChange={e => setTestScore(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer mb-3"
              />

              {/* Simulation Result Card */}
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-sm ${
                    simulatedGradeItem.grade === 'A' ? 'bg-emerald-500 text-slate-950' :
                    simulatedGradeItem.grade === 'B' ? 'bg-blue-500 text-white' :
                    simulatedGradeItem.grade === 'C' ? 'bg-cyan-500 text-slate-950' :
                    simulatedGradeItem.grade === 'D' ? 'bg-amber-400 text-slate-950' :
                    simulatedGradeItem.grade === 'E' ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {simulatedGradeItem.grade}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Calculated Assessment:</div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{simulatedGradeItem.remark}</span>
                      <span className="text-amber-300 font-mono text-xs">({testScore}% mark)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase">Grade Points</div>
                    <div className="text-xs font-bold text-amber-300 font-mono">{simulatedGradeItem.gpaPoints ?? 0} / 5.0</div>
                  </div>
                  <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase">Threshold Band</div>
                    <div className="text-xs font-bold text-slate-200 font-mono">{simulatedGradeItem.minScore}% – {simulatedGradeItem.maxScore}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {configMode === 'ca-weights' ? (
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-amber-400 transition">
                <input
                  type="checkbox"
                  checked={recalculateScores}
                  onChange={e => setRecalculateScores(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span>Recalculate recorded student scores to match new weights</span>
              </label>
            ) : (
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Synchronizes terminal reports, broadsheets, and student portal grades</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500">
              Admin: <span className="font-bold text-slate-800">{currentUser.name}</span> ({currentUser.staffId})
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={configMode === 'ca-weights' && isExceeded}
              onClick={handleSave}
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition ${
                configMode === 'ca-weights' && isExceeded
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {configMode === 'grading-scale'
                  ? 'Save Official Grading Scale & Update All'
                  : isExceeded 
                    ? 'Cannot Save (Exceeds 100%)' 
                    : `Save ${activeSection} Percentages (${currentTotal}%)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
