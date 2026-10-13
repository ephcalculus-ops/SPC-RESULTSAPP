import React, { useState, useMemo } from 'react';
import { Student, Teacher, SchoolSettings, AffectiveAssessment, PsychomotorAssessment } from '../types';
import { SCHOOL_CLASSES, isJuniorClass } from '../data/mockData';
import { 
  MessageSquare, 
  Search, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Smile, 
  Activity, 
  ChevronRight,
  Filter
} from 'lucide-react';

interface StudentCommentsWorkspaceProps {
  students: Student[];
  currentUser: Teacher;
  settings: SchoolSettings;
  activeTerm?: string;
  onUpdateAssessments: (
    studentId: string,
    affective: AffectiveAssessment,
    psychomotor: PsychomotorAssessment,
    daysPresent: number,
    formTeacherComment: string
  ) => void;
  onSelectStudentForReport?: (student: Student) => void;
  addLog?: (action: string, details: string) => void;
}

const COMMON_REMARKS = [
  "An exceptionally brilliant and consistent performance. Keep up the high standard!",
  "A very good and disciplined learner. Capable of even greater excellence.",
  "Satisfactory academic performance this term. Needs more dedication in mathematics and sciences.",
  "Fair result, but requires closer attention to classwork and active participation.",
  "Hardworking and polite student. Showed commendable improvement over the term.",
  "Capable student with potential; must avoid distractions and submit assignments promptly.",
  "Promising performance with excellent conduct. Well done!",
];

export const StudentCommentsWorkspace: React.FC<StudentCommentsWorkspaceProps> = ({
  students,
  currentUser,
  settings,
  activeTerm = 'Third Term',
  onUpdateAssessments,
  onSelectStudentForReport,
  addLog,
}) => {
  // Default to the class the teacher is form teacher of, or first assigned class, or 'JSS 1 A'
  const defaultClass = currentUser.isFormTeacherOf || currentUser.assignedClasses?.[0] || 'JSS 1 A';
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students
      .filter(s => s.className === selectedClass)
      .filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.learnerId.toLowerCase().includes(q);
      });
  }, [students, selectedClass, searchQuery]);

  // Draft edits state mapped by student ID
  const [draftComments, setDraftComments] = useState<Record<string, {
    comment: string;
    daysPresent: number;
    affective: AffectiveAssessment;
    psychomotor: PsychomotorAssessment;
  }>>({});

  const handleFieldChange = (
    studentId: string, 
    field: 'comment' | 'daysPresent' | 'affective' | 'psychomotor', 
    val: any
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setDraftComments(prev => {
      const existing = prev[studentId] || {
        comment: student.formTeacherComment || '',
        daysPresent: student.daysPresent || 65,
        affective: student.affective || {
          punctuality: 4,
          neatness: 4,
          politeness: 4,
          honesty: 5,
          relationshipWithOthers: 4,
          perseverance: 4,
          diligence: 4,
          creativity: 4,
          classParticipation: 4,
        },
        psychomotor: student.psychomotor || {
          verbalFluency: 4,
          gamesSports: 4,
          musicalSkills: 3,
          drawingPainting: 3,
          handWriting: 4,
        },
      };

      return {
        ...prev,
        [studentId]: {
          ...existing,
          [field]: val,
        },
      };
    });
  };

  const handleSaveStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const draft = draftComments[studentId];
    const comment = draft?.comment !== undefined 
      ? draft.comment 
      : (student.formTeacherComment || '');
    const daysPresent = draft?.daysPresent !== undefined ? draft.daysPresent : (student.daysPresent || 65);
    const affective = draft?.affective || student.affective || {
      punctuality: 4,
      neatness: 4,
      politeness: 4,
      honesty: 5,
      relationshipWithOthers: 4,
      perseverance: 4,
      diligence: 4,
      creativity: 4,
      classParticipation: 4,
    };
    const psychomotor = draft?.psychomotor || student.psychomotor || {
      verbalFluency: 4,
      gamesSports: 4,
      musicalSkills: 3,
      drawingPainting: 3,
      handWriting: 4,
    };

    onUpdateAssessments(studentId, affective, psychomotor, daysPresent, comment);
    setSaveSuccessId(studentId);
    setTimeout(() => setSaveSuccessId(null), 2500);

    if (addLog) {
      addLog('Saved Student Comment', `Teacher ${currentUser.name} saved remarks and behavioral ratings for ${student.name}`);
    }
  };

  const handleApplyPresetComment = (studentId: string, preset: string) => {
    handleFieldChange(studentId, 'comment', preset);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Teaching Staff Notice */}
      <div className="bg-gradient-to-r from-red-950 via-[#690707] to-slate-900 border-2 border-amber-400/80 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-red-950">
              Teaching Staff Workspace
            </span>
            <span className="text-xs text-amber-300 font-mono">
              {currentUser.role.replace('_', ' ').toUpperCase()} • {currentUser.staffId}
            </span>
          </div>
          <h2 className="text-xl font-black text-amber-300 font-serif mt-1">
            Student Remarks & Behavioral Assessment Center
          </h2>
          <p className="text-xs text-amber-100/80 mt-1 max-w-2xl">
            Authorized for subject and form teachers to enter official pupil comments, term attendance, affective traits (politeness, neatness, honesty), and psychomotor ratings.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-black/40 border border-amber-400/40 px-3 py-2 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Teacher Permissions Active</div>
            <div className="text-[10px] text-amber-200/80">Administrative controls reserved for Principal</div>
          </div>
        </div>
      </div>

      {/* Class Selector & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            Class:
          </span>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-700 focus:outline-none"
          >
            {SCHOOL_CLASSES.map(cls => (
              <option key={cls} value={cls}>
                {cls} {currentUser.isFormTeacherOf === cls ? '(Your Form Class)' : ''}
              </option>
            ))}
          </select>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {filteredStudents.length} Students
          </span>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student by name or Learner ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Student Comments Table / Cards */}
      <div className="space-y-4">
        {filteredStudents.map((student, idx) => {
          const draft = draftComments[student.id];
          const comment = draft?.comment !== undefined 
            ? draft.comment 
            : (student.formTeacherComment || '');
          const daysPresent = draft?.daysPresent !== undefined ? draft.daysPresent : (student.daysPresent || 65);
          const affective = draft?.affective || student.affective || {
            punctuality: 4,
            neatness: 4,
            politeness: 4,
            honesty: 5,
            relationshipWithOthers: 4,
            perseverance: 4,
            diligence: 4,
            creativity: 4,
            classParticipation: 4,
          };
          const psychomotor = draft?.psychomotor || student.psychomotor || {
            verbalFluency: 4,
            gamesSports: 4,
            musicalSkills: 3,
            drawingPainting: 3,
            handWriting: 4,
          };

          const isSaved = saveSuccessId === student.id;

          return (
            <div 
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 transition hover:border-amber-300"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-red-950 text-amber-300 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{student.name}</h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                      <span>{student.learnerId}</span>
                      <span>•</span>
                      <span>{student.className}</span>
                      <span>•</span>
                      <span className="capitalize">{student.gender.toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  {onSelectStudentForReport && (
                    <button
                      type="button"
                      onClick={() => onSelectStudentForReport(student)}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition"
                    >
                      View Report Sheet →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveStudent(student.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                      isSaved 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-red-950 hover:bg-red-900 text-amber-300 border border-amber-400'
                    }`}
                  >
                    {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'Saved to Cloud' : 'Save Remarks'}</span>
                  </button>
                </div>
              </div>

              {/* Remarks Input & Presets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Form Teacher Remark */}
                <div className="lg:col-span-6 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      Teacher's Official Terminal Remark:
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Appears on stamped report sheet</span>
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={e => handleFieldChange(student.id, 'comment', e.target.value)}
                    placeholder="Enter academic observation, discipline, and encouragement for student..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-700 focus:outline-none"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-400 font-bold mr-1">Presets:</span>
                    {COMMON_REMARKS.slice(0, 3).map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyPresetComment(student.id, r)}
                        className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-red-950 px-2 py-0.5 rounded border border-slate-200 transition truncate max-w-[200px]"
                        title={r}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attendance & Behavioral Domains */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {/* Attendance */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      Days Present:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={daysPresent}
                      onChange={e => handleFieldChange(student.id, 'daysPresent', Number(e.target.value))}
                      className="w-full p-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <span className="text-[10px] text-slate-400 block text-center">out of 70 days</span>
                  </div>

                  {/* Affective traits summary */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Smile className="w-3 h-3 text-emerald-600" />
                      Punctuality:
                    </label>
                    <select
                      value={affective.punctuality || 4}
                      onChange={e => handleFieldChange(student.id, 'affective', { ...affective, punctuality: Number(e.target.value) })}
                      className="w-full p-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Fair</option>
                      <option value={2}>2 - Poor</option>
                      <option value={1}>1 - Very Poor</option>
                    </select>

                    <label className="block text-[11px] font-bold text-slate-700 mt-1">Neatness:</label>
                    <select
                      value={affective.neatness || 4}
                      onChange={e => handleFieldChange(student.id, 'affective', { ...affective, neatness: Number(e.target.value) })}
                      className="w-full p-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Fair</option>
                      <option value={2}>2 - Poor</option>
                      <option value={1}>1 - Very Poor</option>
                    </select>
                  </div>

                  {/* Psychomotor skills */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-purple-600" />
                      Handwriting:
                    </label>
                    <select
                      value={psychomotor.handWriting || 4}
                      onChange={e => handleFieldChange(student.id, 'psychomotor', { ...psychomotor, handWriting: Number(e.target.value) })}
                      className="w-full p-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Fair</option>
                      <option value={2}>2 - Poor</option>
                      <option value={1}>1 - Very Poor</option>
                    </select>

                    <label className="block text-[11px] font-bold text-slate-700 mt-1">Sports & Games:</label>
                    <select
                      value={psychomotor.gamesSports || 4}
                      onChange={e => handleFieldChange(student.id, 'psychomotor', { ...psychomotor, gamesSports: Number(e.target.value) })}
                      className="w-full p-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Fair</option>
                      <option value={2}>2 - Poor</option>
                      <option value={1}>1 - Very Poor</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
