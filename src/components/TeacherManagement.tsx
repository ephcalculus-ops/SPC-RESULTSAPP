import React, { useState } from 'react';
import { Teacher, UserRole } from '../types';
import { ALL_SUBJECTS, SCHOOL_CLASSES, JUNIOR_SUBJECTS, SENIOR_SUBJECTS } from '../data/mockData';
import { TeacherProfileModal } from './TeacherProfileModal';
import { 
  Users, 
  ShieldCheck, 
  Search, 
  Edit, 
  Check, 
  X, 
  BookOpen, 
  GraduationCap, 
  UserPlus, 
  Upload, 
  Mail, 
  Phone, 
  Briefcase, 
  Award, 
  Trash2, 
  CheckCircle2, 
  SlidersHorizontal 
} from 'lucide-react';

interface TeacherManagementProps {
  teachers: Teacher[];
  currentUser: Teacher;
  updateTeacher: (teacher: Teacher) => void;
  setCurrentUser: (teacher: Teacher) => void;
  onOpenTeacherSignupModal?: () => void;
  onNavigateToGradebook?: (teacher: Teacher) => void;
  onOpenDirectScoreModal?: (cls?: string, subj?: string) => void;
  onDeleteTeacher?: (teacherId: string) => void;
  onSignOut?: () => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  currentUser,
  updateTeacher,
  setCurrentUser,
  onOpenTeacherSignupModal,
  onNavigateToGradebook,
  onOpenDirectScoreModal,
  onDeleteTeacher,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');

  const isAdminOrOfficer = 
    currentUser.role === 'super_admin' || 
    currentUser.role === 'admin' || 
    currentUser.role === 'exam_officer';

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.assignedSubjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'ALL' || t.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher({
      ...teacher,
      assignedClasses: [...teacher.assignedClasses],
      assignedSubjects: [...teacher.assignedSubjects],
    });
    setEditSuccessMessage(null);
    setSubjectSearch('');
  };

  const handleSaveTeacherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    if (!editingTeacher.name.trim()) {
      alert('Teacher full name cannot be blank.');
      return;
    }
    if (!editingTeacher.staffId.trim()) {
      alert('Staff ID cannot be blank.');
      return;
    }

    updateTeacher(editingTeacher);
    setEditSuccessMessage(`Teacher details for ${editingTeacher.name} successfully updated!`);
    setTimeout(() => {
      setEditingTeacher(null);
      setEditSuccessMessage(null);
    }, 900);
  };

  const toggleSubject = (subject: string) => {
    if (!editingTeacher) return;
    const current = editingTeacher.assignedSubjects;
    const updated = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject];
    setEditingTeacher({ ...editingTeacher, assignedSubjects: updated });
  };

  const toggleClass = (cls: string) => {
    if (!editingTeacher) return;
    const current = editingTeacher.assignedClasses;
    const updated = current.includes(cls)
      ? current.filter(c => c !== cls)
      : [...current, cls];
    setEditingTeacher({ ...editingTeacher, assignedClasses: updated });
  };

  const handleSelectJuniorClasses = () => {
    if (!editingTeacher) return;
    const junior = ['JSS 1 A', 'JSS 1 B', 'JSS 2 A', 'JSS 2 B', 'JSS 3 A', 'JSS 3 B'];
    const combined = Array.from(new Set([...editingTeacher.assignedClasses, ...junior]));
    setEditingTeacher({ ...editingTeacher, assignedClasses: combined });
  };

  const handleSelectSeniorClasses = () => {
    if (!editingTeacher) return;
    const senior = ['SSS 1 A', 'SSS 1 B', 'SSS 2 A', 'SSS 2 B', 'SSS 3 A', 'SSS 3 B'];
    const combined = Array.from(new Set([...editingTeacher.assignedClasses, ...senior]));
    setEditingTeacher({ ...editingTeacher, assignedClasses: combined });
  };

  const handleSelectAllClasses = () => {
    if (!editingTeacher) return;
    setEditingTeacher({ ...editingTeacher, assignedClasses: [...SCHOOL_CLASSES] });
  };

  const handleClearClasses = () => {
    if (!editingTeacher) return;
    setEditingTeacher({ ...editingTeacher, assignedClasses: [] });
  };

  const handleSelectJuniorSubjects = () => {
    if (!editingTeacher) return;
    const combined = Array.from(new Set([...editingTeacher.assignedSubjects, ...JUNIOR_SUBJECTS]));
    setEditingTeacher({ ...editingTeacher, assignedSubjects: combined });
  };

  const handleSelectSeniorSubjects = () => {
    if (!editingTeacher) return;
    const combined = Array.from(new Set([...editingTeacher.assignedSubjects, ...SENIOR_SUBJECTS]));
    setEditingTeacher({ ...editingTeacher, assignedSubjects: combined });
  };

  const handleSelectAllSubjects = () => {
    if (!editingTeacher) return;
    setEditingTeacher({ ...editingTeacher, assignedSubjects: [...ALL_SUBJECTS] });
  };

  const handleClearSubjects = () => {
    if (!editingTeacher) return;
    setEditingTeacher({ ...editingTeacher, assignedSubjects: [] });
  };

  const handleDeleteStaff = (teacher: Teacher) => {
    if (teacher.role === 'super_admin' || teacher.id === 't-admin') {
      alert('The Super Administrator account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to remove ${teacher.name} (${teacher.staffId}) from the school staff roster?`)) {
      if (onDeleteTeacher) {
        onDeleteTeacher(teacher.id);
        setEditingTeacher(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-red-950 text-amber-300">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 font-serif">
                Academic Staff & Teacher Management
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Super Admin and School Leadership can review, edit teacher names, modify staff IDs, allocate teaching subjects, assign classes, and update contact information.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, ID, or subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none w-64 shadow-xs"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold shadow-xs"
            >
              <option value="ALL">All Roles ({teachers.length} Staff)</option>
              <option value="super_admin">Super Administrator</option>
              <option value="admin">Principal / Administrator</option>
              <option value="exam_officer">Examination Officer</option>
              <option value="form_teacher">Form / Class Teachers</option>
              <option value="subject_teacher">Subject Specialists</option>
            </select>

            {onOpenTeacherSignupModal && (
              <button
                type="button"
                onClick={onOpenTeacherSignupModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-red-700 via-red-800 to-red-900 hover:from-red-800 hover:to-red-950 text-amber-300 text-xs font-black rounded-xl border border-amber-400 shadow-md transition hover:scale-105"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>+ Register New Teacher</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map(teacher => {
          const isCurrentUser = teacher.id === currentUser.id;
          const isSuperAdmin = teacher.role === 'super_admin';

          const roleBadgeColor = 
            isSuperAdmin ? 'bg-red-950 text-amber-300 border-amber-400 font-black shadow-xs' :
            teacher.role === 'admin' ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' :
            teacher.role === 'exam_officer' ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold' :
            teacher.role === 'form_teacher' ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold' :
            'bg-slate-100 text-slate-800 border-slate-300 font-medium';

          return (
            <div
              key={teacher.id}
              className={`bg-white rounded-2xl shadow-sm border p-4 transition-all hover:shadow-md flex flex-col justify-between ${
                isSuperAdmin 
                  ? 'border-2 border-amber-500/80 bg-gradient-to-b from-amber-50/20 to-white' 
                  : isCurrentUser 
                    ? 'border-amber-400 ring-2 ring-amber-200' 
                    : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5 truncate">
                      <span className="truncate">{teacher.name}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 font-semibold">{teacher.staffId}</div>
                  </div>

                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border capitalize shrink-0 ${roleBadgeColor}`}>
                    {isSuperAdmin ? 'SUPER ADMIN' : teacher.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 mb-2 truncate flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{teacher.email}</span>
                </div>

                {teacher.phone && (
                  <div className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{teacher.phone}</span>
                  </div>
                )}

                {teacher.department && (
                  <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{teacher.department}</span>
                  </div>
                )}

                {teacher.isFormTeacherOf && (
                  <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-[11px] text-blue-900 font-bold flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Form Teacher: {teacher.isFormTeacherOf}</span>
                  </div>
                )}

                {/* Assigned Subjects */}
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Assigned Subjects ({teacher.assignedSubjects.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {teacher.assignedSubjects.slice(0, 3).map(s => (
                      <span key={s} className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                        {s}
                      </span>
                    ))}
                    {teacher.assignedSubjects.length > 3 && (
                      <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                        +{teacher.assignedSubjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Classes */}
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Assigned Classes ({teacher.assignedClasses.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {teacher.assignedClasses.map(c => (
                      <span key={c} className="bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentUser(teacher)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition ${
                      isCurrentUser 
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCurrentUser ? 'Active' : 'Switch'}
                  </button>

                  {onNavigateToGradebook && (
                    <button
                      onClick={() => {
                        setCurrentUser(teacher);
                        onNavigateToGradebook(teacher);
                      }}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-red-950 flex items-center gap-1 transition shadow-xs"
                      title="Switch to this teacher and open Mark Entry"
                    >
                      <Upload className="w-3 h-3 text-red-950" />
                      <span>Marks</span>
                    </button>
                  )}

                  {onOpenDirectScoreModal && (
                    <button
                      onClick={() => {
                        setCurrentUser(teacher);
                        onOpenDirectScoreModal(teacher.assignedClasses[0] || 'JSS 1 A', teacher.assignedSubjects[0]);
                      }}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-red-950 text-amber-300 hover:bg-red-900 border border-amber-400/60 flex items-center gap-1 transition shadow-xs"
                      title="Direct score input for this teacher"
                    >
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span>Input</span>
                    </button>
                  )}
                </div>

                {(isAdminOrOfficer || isCurrentUser) && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(teacher)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs"
                    title={isCurrentUser ? "Edit your teacher profile & biodata" : `Edit ${teacher.name}'s profile, credentials, subjects, or classes`}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{isCurrentUser ? 'Edit My Biodata' : 'Edit Staff'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* COMPREHENSIVE EDIT TEACHER MODAL (ADMIN FUNCTIONALITY)                   */}
      {/* ========================================================================= */}
      {/* COMPREHENSIVE EDIT TEACHER & BIODATA MODAL                                */}
      {/* ========================================================================= */}
      {editingTeacher && (
        <TeacherProfileModal
          teacher={editingTeacher}
          currentUser={currentUser}
          isOpen={!!editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSave={(updated) => {
            updateTeacher(updated);
            setEditingTeacher(null);
          }}
          onSignOut={onSignOut}
          onDeleteTeacher={onDeleteTeacher}
        />
      )}
    </div>
  );
};
