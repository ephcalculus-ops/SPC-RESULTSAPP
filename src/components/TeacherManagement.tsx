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
  RotateCcw,
  Table as TableIcon,
  LayoutGrid,
  Download,
  ClipboardPaste,
  Save,
  Plus,
  Cloud,
  RefreshCw
} from 'lucide-react';

interface TeacherManagementProps {
  teachers: Teacher[];
  currentUser: Teacher;
  updateTeacher: (teacher: Teacher, immediate?: boolean) => void;
  batchUpdateTeachers?: (teachers: Teacher[]) => void;
  registerTeacher?: (newTeacherData: Omit<Teacher, 'id'> & { id?: string }) => Teacher;
  setCurrentUser: (teacher: Teacher) => void;
  onOpenTeacherSignupModal?: () => void;
  onNavigateToGradebook?: (teacher: Teacher) => void;
  onOpenDirectScoreModal?: (cls?: string, subj?: string) => void;
  onDeleteTeacher?: (teacherId: string) => void;
  onRestoreOfficialTeachers?: () => void;
  onSyncTeachersNow?: () => Promise<boolean>;
  cloudSyncStatus?: { state: string; message: string; lastSyncedAt: Date | null; pendingCount: number };
  onSignOut?: () => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  currentUser,
  updateTeacher,
  batchUpdateTeachers,
  registerTeacher,
  setCurrentUser,
  onOpenTeacherSignupModal,
  onNavigateToGradebook,
  onOpenDirectScoreModal,
  onDeleteTeacher,
  onRestoreOfficialTeachers,
  onSyncTeachersNow,
  cloudSyncStatus,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isBulkPasteModalOpen, setIsBulkPasteModalOpen] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const isAdminOrOfficer = 
    currentUser.role === 'super_admin' || 
    currentUser.role === 'admin' || 
    currentUser.role === 'exam_officer';

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.gender && t.gender.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.mainClass && t.mainClass.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.assignedSubjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'ALL' || t.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInlineFieldChange = (teacher: Teacher, field: keyof Teacher, value: any) => {
    const updated: Teacher = {
      ...teacher,
      [field]: value,
    };
    // If name changed, keep uppercase
    if (field === 'name' && typeof value === 'string') {
      updated.name = value.toUpperCase();
    }
    // Effect changes in local state AND cloud Firestore immediately
    updateTeacher(updated, true);
    setSavedRowId(teacher.id);
    setStatusNotification(`✓ Changes for ${updated.name} (${updated.staffId}) firmly updated in Cloud Firestore & Local Storage`);
    setTimeout(() => {
      setSavedRowId(null);
    }, 2500);
  };

  const handleSyncToCloudNow = async () => {
    setIsCloudSyncing(true);
    setStatusNotification('Synchronizing all teaching staff records to Cloud Firestore...');
    try {
      if (onSyncTeachersNow) {
        await onSyncTeachersNow();
      } else if (batchUpdateTeachers) {
        batchUpdateTeachers(teachers);
      }
      setStatusNotification(`✓ All ${teachers.length} teaching staff records firmly saved and synchronized to Cloud Firestore!`);
    } catch (e) {
      setStatusNotification('Failed to sync staff records to Cloud. Please retry.');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setStatusNotification(null), 4000);
    }
  };

  const handleAddNewRow = () => {
    const nextNumber = teachers.length + 1;
    const newStaffId = `SPC/STAFF/${nextNumber}`;
    const newTeacher: Teacher = {
      id: `spc-staff-${Date.now()}`,
      staffId: newStaffId,
      name: `NEW TEACHER ${nextNumber}`,
      gender: 'FEMALE',
      mainClass: '',
      classArm: '',
      dor: new Date().toLocaleDateString('en-GB'),
      registeredAt: new Date().toISOString(),
      role: 'subject_teacher',
      email: `teacher${nextNumber}@stpaulcollege.abjce.org.ng`,
      phone: '',
      department: 'Academic Faculty',
      assignedClasses: ['JSS 1 A'],
      assignedSubjects: ['MATHEMATICS'],
      password: 'password123',
    };

    if (batchUpdateTeachers) {
      batchUpdateTeachers([...teachers, newTeacher]);
    } else {
      updateTeacher(newTeacher);
    }

    setStatusNotification(`Added new teacher slot with ID ${newStaffId}. You can edit all details directly.`);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleProcessBulkPaste = () => {
    if (!bulkPasteText.trim()) return;

    const lines = bulkPasteText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsedTeachers: Teacher[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip header lines like "ID DOR NAME..."
      if (/^ID\s+(DOR|DATE)/i.test(line) || /^#|Staff ID/i.test(line)) continue;

      // Split by tab, pipe, or comma
      let tokens = line.includes('\t')
        ? line.split('\t').map(t => t.trim())
        : line.includes('|')
          ? line.split('|').map(t => t.trim())
          : line.includes(',')
            ? line.split(',').map(t => t.trim())
            : line.split(/\s{2,}/).map(t => t.trim());

      tokens = tokens.filter(Boolean);
      if (tokens.length < 2) continue;

      let staffId = tokens[0] || `SPC/STAFF/${teachers.length + i + 1}`;
      let dor = '';
      let name = '';
      let mainClass = '';
      let classArm = '';
      let gender: 'MALE' | 'FEMALE' | 'NA' = 'FEMALE';

      // Detect token layout: e.g. ID, DOR, NAME, MAIN CLASS, CLASS ARM, GENDER
      if (tokens.length >= 6) {
        staffId = tokens[0];
        dor = tokens[1];
        name = tokens[2];
        mainClass = tokens[3];
        classArm = tokens[4];
        const gRaw = tokens[5].toUpperCase();
        gender = gRaw.startsWith('M') ? 'MALE' : gRaw.startsWith('F') ? 'FEMALE' : 'NA';
      } else if (tokens.length === 5) {
        staffId = tokens[0];
        dor = tokens[1];
        name = tokens[2];
        mainClass = tokens[3];
        const gRaw = tokens[4].toUpperCase();
        gender = gRaw.startsWith('M') ? 'MALE' : gRaw.startsWith('F') ? 'FEMALE' : 'NA';
      } else if (tokens.length === 4) {
        staffId = tokens[0];
        dor = tokens[1];
        name = tokens[2];
        const gRaw = tokens[3].toUpperCase();
        gender = gRaw.startsWith('M') ? 'MALE' : gRaw.startsWith('F') ? 'FEMALE' : 'NA';
      } else {
        staffId = tokens[0];
        name = tokens[1];
        if (tokens[2]) {
          const gRaw = tokens[2].toUpperCase();
          gender = gRaw.startsWith('M') ? 'MALE' : gRaw.startsWith('F') ? 'FEMALE' : 'NA';
        }
      }

      if (!name) continue;

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
      const teacherObj: Teacher = {
        id: `spc-${staffId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}-${i}`,
        staffId: staffId.toUpperCase(),
        name: name.toUpperCase(),
        dor: dor || new Date().toLocaleDateString('en-GB'),
        mainClass: mainClass || '',
        classArm: classArm || '',
        gender,
        role: 'subject_teacher',
        email: `${slug}@stpaulcollege.abjce.org.ng`,
        phone: '',
        department: 'Academic Faculty',
        assignedClasses: mainClass ? [`${mainClass} ${classArm || 'A'}`.trim()] : ['JSS 1 A'],
        assignedSubjects: ['MATHEMATICS'],
        registeredAt: new Date().toISOString(),
        password: 'password123',
      };

      parsedTeachers.push(teacherObj);
    }

    if (parsedTeachers.length === 0) {
      alert('Could not parse any teacher lines. Please check the format and try again.');
      return;
    }

    // Keep Super Admin
    const superAdmin = teachers.find(t => t.role === 'super_admin' || t.id === 't-admin') || teachers[0];
    const combined = [superAdmin, ...parsedTeachers.filter(t => t.id !== superAdmin.id)];

    if (batchUpdateTeachers) {
      batchUpdateTeachers(combined);
    } else {
      combined.forEach(t => updateTeacher(t));
    }

    setIsBulkPasteModalOpen(false);
    setBulkPasteText('');
    setStatusNotification(`Successfully imported ${parsedTeachers.length} teachers into roster!`);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = ['Staff ID', 'DOR', 'Full Name', 'Gender', 'Main Class', 'Class Arm', 'Role', 'Assigned Subjects', 'Assigned Classes', 'Email', 'Phone'];
    const rows = teachers.map(t => [
      `"${t.staffId || ''}"`,
      `"${t.dor || ''}"`,
      `"${t.name || ''}"`,
      `"${t.gender || ''}"`,
      `"${t.mainClass || ''}"`,
      `"${t.classArm || ''}"`,
      `"${t.role || ''}"`,
      `"${(t.assignedSubjects || []).join('; ')}"`,
      `"${(t.assignedClasses || []).join('; ')}"`,
      `"${t.email || ''}"`,
      `"${t.phone || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `St_Paul_Teaching_Staff_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteStaff = (teacher: Teacher) => {
    if (teacher.role === 'super_admin' || teacher.id === 't-admin') {
      alert('The Super Administrator account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete ${teacher.name} (${teacher.staffId}) from the roster?`)) {
      if (onDeleteTeacher) {
        onDeleteTeacher(teacher.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Center */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-blue-900 text-blue-200 shadow-sm">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 font-serif">
                Teaching Staff & Faculty Roster
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Official teaching staff for St. Paul&apos;s College. All teacher names, IDs, genders, main classes, arms, and subject allocations are directly editable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'table'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Spreadsheet / Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'cards'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards Grid</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff name, ID, class, gender..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-56 shadow-xs"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold shadow-xs"
            >
              <option value="ALL">All Roles ({teachers.length} Staff)</option>
              <option value="super_admin">Super Administrator</option>
              <option value="admin">Principal / Admin</option>
              <option value="exam_officer">Exam Officer</option>
              <option value="subject_teacher">Subject Teacher</option>
              <option value="form_teacher">Form Teacher</option>
            </select>

            {isAdminOrOfficer && (
              <>
                <button
                  type="button"
                  disabled={isCloudSyncing}
                  onClick={handleSyncToCloudNow}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                  title="Firmly save and synchronize all teaching staff records to Cloud Firestore"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : 'text-blue-200'}`} />
                  <span>{isCloudSyncing ? 'Syncing to Cloud...' : 'Sync with Cloud'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddNewRow}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  title="Add new editable teacher row to roster"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Teacher</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkPasteModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 shadow-xs transition"
                  title="Paste teacher list from Excel or text"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Paste / Import List</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition"
                  title="Export staff roster to CSV / Excel"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export CSV</span>
                </button>

                {onRestoreOfficialTeachers && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Restore the official 23 teachers and Super Admin from the College Register? Any manual edits will be refreshed to official baseline.')) {
                        onRestoreOfficialTeachers();
                      }
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-300 shadow-xs transition"
                    title="Reload official 23 teachers from register"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Restore Register</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {statusNotification && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {statusNotification}
            </span>
            <button type="button" onClick={() => setStatusNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. SPREADSHEET / TABLE VIEW (FAST DIRECT IN-LINE EDITING)                  */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 w-32">Staff ID</th>
                  <th className="py-3 px-3 w-28">DOR</th>
                  <th className="py-3 px-3 min-w-[200px]">Teacher Full Name</th>
                  <th className="py-3 px-3 w-28">Gender</th>
                  <th className="py-3 px-3 w-32">Main Class</th>
                  <th className="py-3 px-3 w-24">Class Arm</th>
                  <th className="py-3 px-3 w-36">Role</th>
                  <th className="py-3 px-3 min-w-[180px]">Assigned Subjects</th>
                  <th className="py-3 px-3 w-36">Phone Number</th>
                  <th className="py-3 px-3 w-32 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTeachers.map((teacher, idx) => {
                  const isSuperAdmin = teacher.role === 'super_admin' || teacher.id === 't-admin';
                  const isCurrent = teacher.id === currentUser.id;
                  const isSaved = savedRowId === teacher.id;

                  return (
                    <tr
                      key={teacher.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isCurrent ? 'bg-amber-50/40' : isSuperAdmin ? 'bg-slate-50/70 font-semibold' : ''
                      }`}
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Staff ID */}
                      <td className="py-2.5 px-3">
                        {isSuperAdmin ? (
                          <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            {teacher.staffId}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={teacher.staffId || ''}
                            onChange={e => handleInlineFieldChange(teacher, 'staffId', e.target.value.trim().toUpperCase())}
                            className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs uppercase"
                            placeholder="SPC/STAFF/..."
                          />
                        )}
                      </td>

                      {/* DOR */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={teacher.dor || ''}
                          onChange={e => handleInlineFieldChange(teacher, 'dor', e.target.value)}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 text-slate-700 text-xs font-mono"
                          placeholder="DD/MM/YY"
                        />
                      </td>

                      {/* Full Name */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={teacher.name || ''}
                            onChange={e => handleInlineFieldChange(teacher, 'name', e.target.value)}
                            className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 font-bold text-slate-900 text-xs uppercase tracking-wide"
                            placeholder="TEACHER FULL NAME"
                          />
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">
                              You
                            </span>
                          )}
                          {isSaved && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0 animate-pulse flex items-center gap-1">
                              <Cloud className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Cloud Synced ✓</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-2.5 px-3">
                        <select
                          value={teacher.gender || 'FEMALE'}
                          onChange={e => handleInlineFieldChange(teacher, 'gender', e.target.value)}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 text-slate-800 text-xs font-medium"
                        >
                          <option value="FEMALE">Female</option>
                          <option value="MALE">Male</option>
                          <option value="NA">NA / Other</option>
                        </select>
                      </td>

                      {/* Main Class */}
                      <td className="py-2.5 px-3">
                        <select
                          value={teacher.mainClass || ''}
                          onChange={e => {
                            const val = e.target.value;
                            handleInlineFieldChange(teacher, 'mainClass', val);
                            if (val && !teacher.assignedClasses.includes(val)) {
                              handleInlineFieldChange(teacher, 'assignedClasses', Array.from(new Set([...teacher.assignedClasses, `${val} ${teacher.classArm || 'A'}`.trim()])));
                            }
                          }}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 text-slate-800 text-xs font-semibold"
                        >
                          <option value="">-- None --</option>
                          <option value="JSS 1">JSS 1</option>
                          <option value="JSS 2">JSS 2</option>
                          <option value="JSS 3">JSS 3</option>
                          <option value="SSS 1">SSS 1</option>
                          <option value="SSS 2">SSS 2</option>
                          <option value="SSS 3">SSS 3</option>
                        </select>
                      </td>

                      {/* Class Arm */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={teacher.classArm || ''}
                          onChange={e => handleInlineFieldChange(teacher, 'classArm', e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 text-slate-800 text-xs font-bold uppercase text-center"
                          placeholder="A / B"
                          maxLength={3}
                        />
                      </td>

                      {/* Role */}
                      <td className="py-2.5 px-3">
                        {isSuperAdmin ? (
                          <span className="text-[10px] bg-red-950 text-amber-300 font-black px-2 py-1 rounded border border-amber-400 block text-center">
                            SUPER ADMIN
                          </span>
                        ) : (
                          <select
                            value={teacher.role}
                            onChange={e => handleInlineFieldChange(teacher, 'role', e.target.value as UserRole)}
                            className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 text-slate-800 text-xs font-medium"
                          >
                            <option value="subject_teacher">Subject Teacher</option>
                            <option value="form_teacher">Form Teacher</option>
                            <option value="exam_officer">Exam Officer</option>
                            <option value="admin">Administrator</option>
                          </select>
                        )}
                      </td>

                      {/* Assigned Subjects */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {teacher.assignedSubjects.slice(0, 2).map(s => (
                            <span key={s} className="bg-blue-50 border border-blue-200 text-blue-900 text-[10px] px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">
                              {s}
                            </span>
                          ))}
                          {teacher.assignedSubjects.length > 2 && (
                            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                              +{teacher.assignedSubjects.length - 2}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingTeacher(teacher)}
                            className="text-[10px] text-blue-700 hover:text-blue-900 font-bold ml-1 underline cursor-pointer"
                            title="Manage subjects and classes"
                          >
                            Edit
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={teacher.phone || ''}
                          onChange={e => handleInlineFieldChange(teacher, 'phone', e.target.value)}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 text-slate-800 text-xs font-mono"
                          placeholder="+234..."
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setCurrentUser(teacher)}
                            className={`p-1 rounded-lg text-xs font-bold transition ${
                              isCurrent 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Switch active session to this teacher"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {onOpenDirectScoreModal && (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentUser(teacher);
                                onOpenDirectScoreModal(
                                  teacher.assignedClasses[0] || (teacher.mainClass ? `${teacher.mainClass} ${teacher.classArm || 'A'}` : 'JSS 1 A'),
                                  teacher.assignedSubjects[0]
                                );
                              }}
                              className="p-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition shadow-xs"
                              title="Enter marks for this teacher"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingTeacher(teacher)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-blue-700 transition"
                            title="Open full profile & credential editor"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {!isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(teacher)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-600 transition"
                              title="Delete teacher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
            <span>Showing <strong>{filteredTeachers.length}</strong> of <strong>{teachers.length}</strong> teachers in register</span>
            <span className="text-[11px] text-slate-500 italic">Changes in table are saved automatically & synced to Cloud Firestore.</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CARDS GRID VIEW                                                        */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
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
                      ? 'border-blue-500 ring-2 ring-blue-200' 
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
                      <div className="text-[11px] font-mono text-slate-500 font-semibold flex items-center gap-2">
                        <span>{teacher.staffId}</span>
                        {teacher.gender && (
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-sans">
                            {teacher.gender}
                          </span>
                        )}
                        {teacher.dor && (
                          <span className="text-[10px] text-slate-400">
                            DOR: {teacher.dor}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border capitalize shrink-0 ${roleBadgeColor}`}>
                      {isSuperAdmin ? 'SUPER ADMIN' : teacher.role.replace('_', ' ')}
                    </span>
                  </div>

                  {teacher.mainClass && (
                    <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-[11px] text-blue-900 font-bold flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Main Class: {teacher.mainClass} {teacher.classArm || ''}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 mb-1.5 truncate flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{teacher.email}</span>
                  </div>

                  {teacher.phone && (
                    <div className="text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{teacher.phone}</span>
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
                </div>

                {/* Card Action Buttons */}
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

                    {onOpenDirectScoreModal && (
                      <button
                        onClick={() => {
                          setCurrentUser(teacher);
                          onOpenDirectScoreModal(
                            teacher.assignedClasses[0] || (teacher.mainClass ? `${teacher.mainClass} ${teacher.classArm || 'A'}` : 'JSS 1 A'),
                            teacher.assignedSubjects[0]
                          );
                        }}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 flex items-center gap-1 transition shadow-xs"
                        title="Enter marks for this teacher"
                      >
                        <BookOpen className="w-3 h-3 text-blue-200" />
                        <span>Input Marks</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingTeacher(teacher)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK PASTE / IMPORT MODAL                                                 */}
      {/* ========================================================================= */}
      {isBulkPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#1e40af] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ClipboardPaste className="w-5 h-5 text-blue-200" />
                <h3 className="font-black text-lg font-serif">Paste & Import Teaching Staff Roster</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkPasteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Copy and paste staff table lines from Excel, Sheets, or text. Supported columns in order:
                <br />
                <code className="bg-slate-100 text-blue-900 px-2 py-1 rounded font-mono text-[11px] block mt-1.5 border border-slate-200">
                  ID | DOR | NAME | MAIN CLASS | CLASS ARM | GENDER
                </code>
              </p>

              <textarea
                rows={9}
                value={bulkPasteText}
                onChange={e => setBulkPasteText(e.target.value)}
                placeholder={`Example:\nSPC/STAFF/31\t06/12/25\tANN AMADI\t\t\tFemale\nSPC/STAFF/13\t21/11/24\tBenjamin Ukaegbu\t\t\tMale\nSPC/STAFF/19\t26/11/24\tCHIDINMA URUAKPA\t\t\tFemale`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkPasteModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessBulkPaste}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-200" />
                  <span>Parse & Import Roster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            updateTeacher(updated, true);
            setEditingTeacher(null);
            setStatusNotification(`✓ Updated profile for ${updated.name} (${updated.staffId}) & firmly saved to Cloud Firestore!`);
            setTimeout(() => setStatusNotification(null), 4000);
          }}
          onSignOut={onSignOut}
          onDeleteTeacher={onDeleteTeacher}
        />
      )}
    </div>
  );
};
