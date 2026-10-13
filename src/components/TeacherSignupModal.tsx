import React, { useState, useMemo } from 'react';
import { Teacher, UserRole, SchoolSettings } from '../types';
import { 
  SCHOOL_CLASSES, 
  JUNIOR_SUBJECTS, 
  SENIOR_SUBJECTS, 
  ALL_SUBJECTS, 
  DEFAULT_SCHOOL_LOGO 
} from '../data/mockData';
import { 
  UserPlus, 
  LogIn, 
  X, 
  CheckCircle2, 
  BookOpen, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  Users, 
  GraduationCap, 
  Sparkles,
  KeyRound,
  Mail,
  User,
  Phone,
  Briefcase
} from 'lucide-react';

interface TeacherSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterTeacher: (teacher: Omit<Teacher, 'id'> & { id?: string }) => Teacher;
  onLoginTeacher: (staffIdOrEmail: string, password?: string) => { success: boolean; teacher?: Teacher; message: string };
  teachers: Teacher[];
  currentUser: Teacher;
  setCurrentUser: (teacher: Teacher) => void;
  onAfterTeacherSignupOrLogin?: (teacher: Teacher, openScoreUpload?: boolean) => void;
  initialMode?: 'signup' | 'login';
  settings?: SchoolSettings;
}

export const TeacherSignupModal: React.FC<TeacherSignupModalProps> = ({
  isOpen,
  onClose,
  onRegisterTeacher,
  onLoginTeacher,
  teachers,
  currentUser,
  setCurrentUser,
  onAfterTeacherSignupOrLogin,
  initialMode = 'signup',
  settings,
}) => {
  const [activeMode, setActiveMode] = useState<'signup' | 'login' | 'roster'>(initialMode);

  React.useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setActiveMode(initialMode);
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  // Signup form state
  const nextStaffNum = teachers.length + 1;
  const defaultStaffId = `STP/TCH/${String(nextStaffNum).padStart(3, '0')}`;

  const [title, setTitle] = useState('Mr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffId, setStaffId] = useState(defaultStaffId);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('subject_teacher');
  const [department, setDepartment] = useState('Sciences & Mathematics');
  const [phone, setPhone] = useState('');
  const [assignedClasses, setAssignedClasses] = useState<string[]>(['SSS 1 A', 'SSS 1 B']);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>(['MATHEMATICS']);
  const [isFormTeacherOf, setIsFormTeacherOf] = useState<string>('SSS 1 A');
  const [openScoreUploadAfter, setOpenScoreUploadAfter] = useState<boolean>(true);

  // Subject search filter in signup
  const [subjectSearch, setSubjectSearch] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');

  // Feedback messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset errors when mode changes
  const switchMode = (mode: 'signup' | 'login' | 'roster') => {
    setActiveMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (!isOpen) return null;

  // Toggle class selection
  const handleToggleClass = (cls: string) => {
    setAssignedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // Toggle subject selection
  const handleToggleSubject = (sub: string) => {
    setAssignedSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  // Bulk select helpers
  const handleSelectAllJuniorSubjects = () => {
    const juniorList = [...JUNIOR_SUBJECTS];
    setAssignedSubjects(prev => Array.from(new Set([...prev, ...juniorList])));
  };

  const handleSelectAllSeniorSubjects = () => {
    const seniorList = [...SENIOR_SUBJECTS];
    setAssignedSubjects(prev => Array.from(new Set([...prev, ...seniorList])));
  };

  const handleClearSubjects = () => {
    setAssignedSubjects([]);
  };

  const handleSelectAllClasses = () => {
    setAssignedClasses([...SCHOOL_CLASSES]);
  };

  const handleClearClasses = () => {
    setAssignedClasses([]);
  };

  // Handle Signup submission (Assign Teacher in ONCE)
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fName = firstName.trim();
    const lName = lastName.trim();
    const fullTeacherName = [title, fName, lName].filter(Boolean).join(' ') || name.trim();

    if (!fName && !name.trim()) {
      setErrorMessage('Please enter the teacher first name and last name.');
      return;
    }

    const teacherEmail = email.trim() || (fName && lName ? `${fName.toLowerCase()}.${lName.toLowerCase()}@stpaulcollege.abjce.org.ng` : `${fullTeacherName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@stpaulcollege.abjce.org.ng`);

    if (assignedClasses.length === 0) {
      setErrorMessage('Please select at least one assigned class.');
      return;
    }

    if (assignedSubjects.length === 0) {
      setErrorMessage('Please select at least one assigned subject for mark entry.');
      return;
    }

    try {
      const createdTeacher = onRegisterTeacher({
        name: fullTeacherName,
        firstName: fName || undefined,
        lastName: lName || undefined,
        title: title || undefined,
        email: teacherEmail.toLowerCase(),
        staffId: staffId.trim() || defaultStaffId,
        password: password.trim() || undefined,
        role,
        department,
        phone: phone.trim() || undefined,
        assignedClasses,
        assignedSubjects,
        isFormTeacherOf: role === 'form_teacher' ? isFormTeacherOf : undefined,
      });

      setSuccessMessage(`Account assigned successfully in ONCE! Welcome, ${createdTeacher.name}.`);

      setTimeout(() => {
        onClose();
        if (onAfterTeacherSignupOrLogin) {
          onAfterTeacherSignupOrLogin(createdTeacher, openScoreUploadAfter);
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign up teacher. Please check details.');
    }
  };

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your Staff ID or registered email.');
      return;
    }

    const res = onLoginTeacher(loginIdentifier, loginPassword.trim() || undefined);
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setSuccessMessage(res.message);
    setTimeout(() => {
      onClose();
      if (res.teacher && onAfterTeacherSignupOrLogin) {
        onAfterTeacherSignupOrLogin(res.teacher, true);
      }
    }, 700);
  };

  // Quick switch from roster
  const handleSelectFromRoster = (teacher: Teacher) => {
    setCurrentUser(teacher);
    setSuccessMessage(`Switched to ${teacher.name} (${teacher.staffId})`);
    setTimeout(() => {
      onClose();
      if (onAfterTeacherSignupOrLogin) {
        onAfterTeacherSignupOrLogin(teacher, true);
      }
    }, 600);
  };

  const filteredRoster = teachers.filter(t => 
    t.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    t.staffId.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    t.assignedSubjects.some(s => s.toLowerCase().includes(rosterSearch.toLowerCase()))
  );

  const filteredJuniorSubjects = JUNIOR_SUBJECTS.filter(s => 
    s.toLowerCase().includes(subjectSearch.toLowerCase())
  );
  const filteredSeniorSubjects = SENIOR_SUBJECTS.filter(s => 
    s.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7a0c0c] via-[#8f1212] to-[#690707] text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 border-2 border-amber-400 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <img src={DEFAULT_SCHOOL_LOGO} alt="Crest" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-amber-300 font-serif tracking-wide">
                  Teacher Portal & Score Entry Access
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-red-950 uppercase">
                  Academic Staff
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">
                {settings?.schoolName || 'ST PAUL COLLEGE'} • Upload Continuous Assessment & Terminal Exam Marks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white hover:bg-red-800/80 p-1.5 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Modes */}
        <div className="bg-red-950/10 border-b border-amber-200/60 px-6 pt-3 flex space-x-2">
          <button
            onClick={() => switchMode('signup')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeMode === 'signup'
                ? 'bg-white text-red-950 border-amber-500 shadow-sm'
                : 'text-slate-600 hover:text-red-950 border-transparent'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Sign Up as New Teacher</span>
          </button>

          <button
            onClick={() => switchMode('login')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeMode === 'login'
                ? 'bg-white text-red-950 border-amber-500 shadow-sm'
                : 'text-slate-600 hover:text-red-950 border-transparent'
            }`}
          >
            <LogIn className="w-4 h-4 text-amber-600" />
            <span>Teacher Sign In (Staff ID / Email)</span>
          </button>

          <button
            onClick={() => switchMode('roster')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeMode === 'roster'
                ? 'bg-white text-red-950 border-amber-500 shadow-sm'
                : 'text-slate-600 hover:text-red-950 border-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Quick Staff Switch ({teachers.length})</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {/* ================= MODE: SIGN UP ================= */}
          {activeMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Instant Score Upload Readiness:</span> Registering creates your teacher profile with permissions for your selected subjects and classes. You will be logged in immediately to upload marks or input continuous assessments.
                </div>
              </div>

              {/* Identity & Name Assignment */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Teacher Name &amp; Identity Assignment</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Assigned in ONCE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Title</label>
                    <select
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Pastor">Pastor</option>
                      <option value="Engr.">Engr.</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Emmanuel"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Last Name (Surname) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Okon"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {(firstName || lastName) && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-slate-500">Official Roster Name:</span>
                    <strong className="text-amber-900 font-serif">
                      {[title, firstName.trim(), lastName.trim()].filter(Boolean).join(' ')}
                    </strong>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email Address (School or Personal) *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. e.okonkwo@stpaulcollege.abjce.org.ng"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Staff Identification Number (Staff ID)</span>
                  </label>
                  <input
                    type="text"
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    placeholder="e.g. STP/TCH/001"
                    className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Auto-generated or enter official school code</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Password / Access PIN (Optional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. 1234 or secure phrase"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>Teacher Role *</span>
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  >
                    <option value="subject_teacher">Subject Specialist (Uploads & Enters Subject Marks)</option>
                    <option value="form_teacher">Form Teacher / Class Master (Subject Marks + Domain Remarks)</option>
                    <option value="exam_officer">Examination Officer (School-wide Mark Verification)</option>
                    <option value="admin">Principal / Vice-Principal (Full School Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span>Academic Department / Faculty</span>
                  </label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Sciences & Mathematics">Sciences & Mathematics</option>
                    <option value="Humanities & Arts">Humanities & Arts</option>
                    <option value="Commercial & Business Studies">Commercial & Business Studies</option>
                    <option value="Languages & Literature">Languages & Literature</option>
                    <option value="Vocational & Technical Education">Vocational & Technical Education</option>
                    <option value="Junior Basic Education">Junior Basic Education</option>
                  </select>
                </div>
              </div>

              {/* If Form Teacher: Form Class */}
              {role === 'form_teacher' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Form Class Supervision (Class Master of):
                  </label>
                  <select
                    value={isFormTeacherOf}
                    onChange={e => setIsFormTeacherOf(e.target.value)}
                    className="w-full max-w-xs px-3 py-1.5 text-xs border border-blue-300 rounded-lg bg-white font-bold text-blue-950 focus:outline-none"
                  >
                    {SCHOOL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-blue-700 mt-1">
                    As Form Teacher of this class, you will be authorized to assess psychomotor domains and write terminal student remarks.
                  </p>
                </div>
              )}

              {/* Assigned Classes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Assigned Classes for Score Entry * ({assignedClasses.length} selected)</span>
                  </label>
                  <div className="space-x-2 text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectAllClasses}
                      className="text-amber-700 font-bold hover:underline"
                    >
                      Select All Classes
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleClearClasses}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SCHOOL_CLASSES.map(cls => {
                    const isSelected = assignedClasses.includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleToggleClass(cls)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold text-center border transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-400 text-red-950 border-amber-500 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cls}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-red-950 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Subjects */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>Assigned Subjects to Teach & Upload Marks * ({assignedSubjects.length} selected)</span>
                  </label>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectAllJuniorSubjects}
                      className="text-amber-700 font-bold hover:underline"
                    >
                      + Junior Subjects
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleSelectAllSeniorSubjects}
                      className="text-amber-700 font-bold hover:underline"
                    >
                      + Senior Subjects
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleClearSubjects}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Filter subjects (e.g. Math, English, Physics, Science)..."
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  className="w-full px-3 py-1.5 mb-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-56 overflow-y-auto space-y-3">
                  {/* Senior Subjects Group */}
                  <div>
                    <h5 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                      Senior School Subjects (SSS)
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredSeniorSubjects.map(sub => {
                        const isSelected = assignedSubjects.includes(sub);
                        return (
                          <button
                            key={`sen-${sub}`}
                            type="button"
                            onClick={() => handleToggleSubject(sub)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border flex items-center space-x-1 ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span>{sub}</span>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Junior Subjects Group */}
                  <div>
                    <h5 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                      Junior Basic Subjects (JSS)
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredJuniorSubjects.map(sub => {
                        const isSelected = assignedSubjects.includes(sub);
                        return (
                          <button
                            key={`jun-${sub}`}
                            type="button"
                            onClick={() => handleToggleSubject(sub)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border flex items-center space-x-1 ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span>{sub}</span>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post signup checkbox */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  id="openScoreUpload"
                  checked={openScoreUploadAfter}
                  onChange={e => setOpenScoreUploadAfter(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="openScoreUpload" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Immediately open <span className="text-red-900 font-bold">Student Score Upload Center</span> for my subject upon sign up
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-red-700 via-red-800 to-red-900 hover:from-red-800 hover:to-red-950 text-amber-300 font-bold text-xs rounded-xl shadow-lg border border-amber-400 transition"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Create Account & Upload Marks</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE: SIGN IN ================= */}
          {activeMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-md mx-auto py-2">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-red-900 mx-auto flex items-center justify-center mb-2">
                  <LogIn className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Teacher Login</h4>
                <p className="text-xs text-slate-500">Sign in with your First Name, Last Name, Staff ID (e.g. STP/TCH/003), or Email</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  First Name, Last Name, Staff ID, or Email *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jude, Chioma, STP/TCH/003, or teacher@stpaul.edu.ng"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Access PIN / Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Enter password if configured, or leave blank"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-red-800 to-red-950 text-amber-300 font-bold text-xs rounded-xl shadow-md border border-amber-400 hover:from-red-900 hover:to-black transition"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Sign In & Open Mark Entry</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-xs font-bold text-red-900 hover:underline"
                >
                  Sign Up Here
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE: QUICK ROSTER SWITCH ================= */}
          {activeMode === 'roster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Academic Staff Roster ({teachers.length})</h4>
                  <p className="text-xs text-slate-500">Select any teacher profile to switch context and upload their scores</p>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-xs font-bold text-red-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Sign Up New Teacher</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Search teacher by name, staff ID, or subject..."
                value={rosterSearch}
                onChange={e => setRosterSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredRoster.map(t => {
                  const isCurrent = t.id === currentUser.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectFromRoster(t)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                        isCurrent
                          ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-300'
                          : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                          <span>{t.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono font-bold text-red-950">{t.staffId}</span>
                          <span>•</span>
                          <span className="capitalize">{t.role.replace('_', ' ')}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 truncate mt-1">
                          Subjects: {t.assignedSubjects.slice(0, 3).join(', ')}
                          {t.assignedSubjects.length > 3 && ` +${t.assignedSubjects.length - 3}`}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-400 hover:bg-amber-500 text-red-950 shrink-0 shadow-xs"
                      >
                        Select & Upload
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
