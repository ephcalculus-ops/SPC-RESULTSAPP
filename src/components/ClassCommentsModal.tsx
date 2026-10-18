import React, { useState, useMemo } from 'react';
import { Student, Teacher, SchoolSettings } from '../types';
import { SCHOOL_CLASSES } from '../data/mockData';
import { 
  FORM_TEACHER_COMMENT_BANK, 
  PRINCIPAL_COMMENT_BANK, 
  getSuggestedFormTeacherComment, 
  getSuggestedPrincipalComment 
} from '../utils/commentPresets';
import { 
  MessageSquare, 
  Sparkles, 
  Check, 
  Save, 
  X, 
  Search, 
  Award, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown,
  RotateCcw
} from 'lucide-react';

interface ClassCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentUser: Teacher;
  settings: SchoolSettings;
  initialClass?: string;
  activeTerm?: string;
  onSaveComments: (
    className: string,
    updates: Array<{ studentId: string; formTeacherComment: string; principalComment: string }>
  ) => void;
  addLog?: (action: string, details: string) => void;
}

export const ClassCommentsModal: React.FC<ClassCommentsModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  settings,
  initialClass = 'SSS 1 A',
  activeTerm = 'Third Term',
  onSaveComments,
  addLog,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(
    currentUser.isFormTeacherOf || initialClass || 'SSS 1 A'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Local state for comments drafts per student
  const [draftComments, setDraftComments] = useState<Record<string, { formTeacher: string; principal: string }>>({});

  // Sync draft state whenever class changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      const initialDraft: Record<string, { formTeacher: string; principal: string }> = {};
      students.forEach(st => {
        initialDraft[st.id] = {
          formTeacher: st.formTeacherComment || '',
          principal: st.principalComment || '',
        };
      });
      setDraftComments(initialDraft);
      setSavedSuccess(false);
    }
  }, [isOpen, selectedClass, students]);

  const classStudents = useMemo(() => {
    return students
      .filter(s => s.className === selectedClass)
      .filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.learnerId.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.positionInClass || 999) - (b.positionInClass || 999));
  }, [students, selectedClass, searchQuery]);

  if (!isOpen) return null;

  const handleUpdateStudentComment = (studentId: string, field: 'formTeacher' | 'principal', value: string) => {
    setDraftComments(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { formTeacher: '', principal: '' }),
        [field]: value,
      },
    }));
    setSavedSuccess(false);
  };

  // 1-Click Auto-Fill for Form Teacher remarks based on academic performance
  const handleAutoFillFormTeacherComments = () => {
    setDraftComments(prev => {
      const next = { ...prev };
      classStudents.forEach(st => {
        next[st.id] = {
          ...(next[st.id] || { formTeacher: '', principal: '' }),
          formTeacher: getSuggestedFormTeacherComment(st, activeTerm),
        };
      });
      return next;
    });
    setSavedSuccess(false);
  };

  // 1-Click Auto-Fill for Principal remarks based on academic performance
  const handleAutoFillPrincipalComments = () => {
    setDraftComments(prev => {
      const next = { ...prev };
      classStudents.forEach(st => {
        next[st.id] = {
          ...(next[st.id] || { formTeacher: '', principal: '' }),
          principal: getSuggestedPrincipalComment(st, activeTerm),
        };
      });
      return next;
    });
    setSavedSuccess(false);
  };

  // 1-Click Auto-Fill BOTH comments
  const handleAutoFillAll = () => {
    setDraftComments(prev => {
      const next = { ...prev };
      classStudents.forEach(st => {
        next[st.id] = {
          formTeacher: getSuggestedFormTeacherComment(st, activeTerm),
          principal: getSuggestedPrincipalComment(st, activeTerm),
        };
      });
      return next;
    });
    setSavedSuccess(false);
  };

  const handleSave = () => {
    const updates = classStudents.map(st => ({
      studentId: st.id,
      formTeacherComment: draftComments[st.id]?.formTeacher ?? st.formTeacherComment ?? '',
      principalComment: draftComments[st.id]?.principal ?? st.principalComment ?? '',
    }));

    onSaveComments(selectedClass, updates);
    if (addLog) {
      addLog(
        'Updated Class Remarks',
        `${currentUser.name} saved Form Teacher and Principal remarks for ${updates.length} students in ${selectedClass} (${activeTerm})`
      );
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (ROYAL BLUE) */}
        <div className="bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#1e40af] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white text-blue-900 rounded-xl shadow">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-serif text-white tracking-wide flex items-center gap-2">
                Class Remarks & Comments Management
                <span className="text-[10px] bg-blue-950 px-2 py-0.5 rounded-full text-blue-100 font-sans font-bold border border-blue-400/40">
                  {activeTerm}
                </span>
              </h2>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Manage, customize, or auto-generate Form Teacher & Principal comments for all students.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Class Selector, Search, Auto-fill presets */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Select Class
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

            {/* Search Filter */}
            <div className="relative pt-4 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-6.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search student in class..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Auto-Fill Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleAutoFillFormTeacherComments}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-300 transition shadow-2xs"
              title="Automatically generate appropriate remarks for form teachers based on each student's average"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto-Fill Teacher Remarks</span>
            </button>

            <button
              type="button"
              onClick={handleAutoFillPrincipalComments}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 transition shadow-2xs"
              title="Automatically generate executive principal commendations based on performance"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Auto-Fill Principal Remarks</span>
            </button>

            <button
              type="button"
              onClick={handleAutoFillAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              title="Auto-fill both Teacher and Principal remarks for all students in class"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Fill All for Class</span>
            </button>
          </div>
        </div>

        {/* Students Remarks Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {classStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">No students found matching your criteria in {selectedClass}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classStudents.map((student, index) => {
                const draft = draftComments[student.id] || {
                  formTeacher: student.formTeacherComment || '',
                  principal: student.principalComment || '',
                };

                const avg = student.averageScore ?? 0;
                const grade = student.overallGrade ?? 'C';

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition space-y-3"
                  >
                    {/* Student Info Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                          {student.positionInClass || index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {student.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {student.learnerId} • {student.gender}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-600">
                          Average: <strong className="text-slate-900 font-bold">{avg}%</strong>
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          grade === 'A' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          grade === 'B' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          grade === 'C' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          Grade {grade}
                        </span>
                        {student.promotionStatus && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-300">
                            {student.promotionStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comments Side-by-Side Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Form Teacher's Comment */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-tight">
                            <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                            Form Teacher Remark
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStudentComment(
                                student.id,
                                'formTeacher',
                                getSuggestedFormTeacherComment(student, activeTerm)
                              )
                            }
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                            title="Auto-suggest based on student grade"
                          >
                            <Sparkles className="w-3 h-3" />
                            Suggest
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={draft.formTeacher}
                          onChange={e => handleUpdateStudentComment(student.id, 'formTeacher', e.target.value)}
                          placeholder="Enter teacher remark or click a suggestion below..."
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-blue-50/20"
                        />

                        {/* Quick Presets Picker Chips */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase self-center mr-1">Presets:</span>
                          {[
                            'An outstanding performance! Keep it up.',
                            'A very commendable result. Well done.',
                            'Good effort. Needs to focus on weak subjects.',
                            'Fair attempt. Must work harder next term.',
                            'Needs drastic improvement in studies.'
                          ].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleUpdateStudentComment(student.id, 'formTeacher', preset)}
                              className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 rounded-md border border-slate-200 transition"
                            >
                              {preset.split('.')[0]}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Principal's Comment */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-tight">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            Principal's Remark
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStudentComment(
                                student.id,
                                'principal',
                                getSuggestedPrincipalComment(student, activeTerm)
                              )
                            }
                            className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline"
                            title="Auto-suggest based on student grade"
                          >
                            <Sparkles className="w-3 h-3" />
                            Suggest
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={draft.principal}
                          onChange={e => handleUpdateStudentComment(student.id, 'principal', e.target.value)}
                          placeholder="Enter principal's remark or click a suggestion below..."
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none bg-amber-50/20"
                        />

                        {/* Quick Presets Picker Chips */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase self-center mr-1">Presets:</span>
                          {[
                            'A brilliant result. Maintain this high standard.',
                            'Very good result. Keep striving towards top distinction.',
                            'Good performance. Higher heights are attainable.',
                            'Average result. Work harder next session.',
                            'Urgent intervention required. Caution advised.'
                          ].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleUpdateStudentComment(student.id, 'principal', preset)}
                              className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-md border border-slate-200 transition"
                            >
                              {preset.split('.')[0]}...
                            </button>
                          ))}
                        </div>
                      </div>
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
            Managing remarks for <strong>{classStudents.length}</strong> students in <strong>{selectedClass}</strong>.
          </div>

          <div className="flex items-center space-x-3">
            {savedSuccess && (
              <span className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 animate-pulse">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Comments Saved Successfully!</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-2 px-5 py-2 bg-[#8b1515] hover:bg-red-900 text-white font-bold text-xs rounded-xl shadow-md border border-amber-400 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save All Comments</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
