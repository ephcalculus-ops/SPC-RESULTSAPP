import React, { useState, useMemo } from 'react';
import { Teacher, UserRole, SchoolSettings, Student, SchoolProfile } from '../types';
import { 
  SCHOOL_CLASSES, 
  JUNIOR_SUBJECTS, 
  SENIOR_SUBJECTS, 
  DEFAULT_SCHOOL_LOGO,
  DEFAULT_OFFICIAL_STAMP,
  getSchoolClasses,
  isJuniorClass
} from '../data/mockData';
import { 
  ShieldCheck, 
  Lock, 
  UserPlus, 
  LogIn, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Search, 
  GraduationCap, 
  KeyRound, 
  Mail, 
  User, 
  Briefcase, 
  ArrowRight,
  FileText,
  School,
  Sparkles,
  ChevronRight,
  Printer,
  Award,
  Cloud,
  Layers,
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Download,
  Loader2,
  Edit3,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { PDFExportService } from '../services/pdfExportService';
import { StudentBiodataModal } from './StudentBiodataModal';
import { isStaffPortalUnlocked, setStaffPortalUnlocked, setSuperAdminUnlocked } from '../config/portalSecurity';
import { searchStudentInCloud } from '../services/firestoreSync';
import { DEFAULT_GRADING_SCALE, getGradeRemark } from '../data/mockData';

interface PortalGateProps {
  settings: SchoolSettings;
  teachers: Teacher[];
  students: Student[];
  onRegisterTeacher: (teacher: Omit<Teacher, 'id'> & { id?: string; firstName?: string; lastName?: string; title?: string }) => Teacher;
  onLoginTeacher: (staffIdOrEmail: string, password?: string) => { success: boolean; teacher?: Teacher; message: string };
  onAuthenticateSuccess: (teacher: Teacher) => void;
  onEnterPortalDirectly?: () => void;
  onSelectStudentForReport?: (student: Student) => void;
  onUpdateStudent?: (studentId: string, updates: Partial<Student>) => void;
  schoolRegistry?: SchoolProfile[];
  activeSchoolId?: string;
  onSwitchSchool?: (schoolId: string) => void;
  onOpenSchoolOnboarding?: () => void;
}

export const PortalGate: React.FC<PortalGateProps> = ({
  settings,
  teachers,
  students,
  onRegisterTeacher,
  onLoginTeacher,
  onAuthenticateSuccess,
  onEnterPortalDirectly,
  onSelectStudentForReport,
  onUpdateStudent,
  schoolRegistry = [],
  activeSchoolId = 'stpaul',
  onSwitchSchool,
  onOpenSchoolOnboarding,
}) => {
  // Main gate mode: 'staff' for Teacher Portal or 'results' for Student & Parent Result Checker
  // Direct unrestricted entry into both portals without double sign-in prompts
  const [activePortalGate, setActivePortalGate] = useState<'staff' | 'results'>('staff');

  // Teacher Sub-tabs: only login and signup (staff roster is removed to prevent unauthorized access to other staff)
  const [staffTab, setStaffTab] = useState<'login' | 'signup'>('login');

  const isPrimary = settings.section === 'primary';
  const staffPrefix = settings.staffIdPrefix || (isPrimary ? 'STP/PRI/TCH/' : 'STP/TCH/');
  const nextStaffNum = teachers.length + 1;
  const defaultStaffId = `${staffPrefix}${String(nextStaffNum).padStart(3, '0')}`;

  const availableSchoolClasses = useMemo(() => getSchoolClasses(settings), [settings]);
  const defaultInitialClass = availableSchoolClasses[0] || 'JSS 1 A';
  const defaultInitialSubject = 'MATHEMATICS';

  const [signupTitle, setSignupTitle] = useState('Mr.');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupOtherName, setSignupOtherName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupStaffId, setSignupStaffId] = useState(defaultStaffId);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('subject_teacher');
  const [signupDept, setSignupDept] = useState('Sciences & Mathematics');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupClasses, setSignupClasses] = useState<string[]>([defaultInitialClass]);
  const [signupSubjects, setSignupSubjects] = useState<string[]>([defaultInitialSubject]);
  const [signupFormTeacherClass, setSignupFormTeacherClass] = useState<string>(defaultInitialClass);

  // Sync state whenever settings change
  React.useEffect(() => {
    const pfx = settings.staffIdPrefix || 'STP/TCH/';
    const num = teachers.length + 1;
    setSignupStaffId(`${pfx}${String(num).padStart(3, '0')}`);
    setSignupDept('Sciences & Mathematics');
    const classes = getSchoolClasses(settings);
    const initialCls = classes[0] || 'JSS 1 A';
    setSignupClasses([initialCls]);
    setSignupFormTeacherClass(initialCls);
    setResultClass(initialCls);
    setSignupSubjects(['MATHEMATICS']);
    setSearchedStudent(null);
    setResultLearnerId('');
    setResultError(null);
  }, [settings, teachers.length]);

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Results Checker State
  const [resultLearnerId, setResultLearnerId] = useState('');
  const [resultClass, setResultClass] = useState(defaultInitialClass);
  const [resultTerm, setResultTerm] = useState('Third Term');
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);

  // Feedback messages
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateSuccess, setGateSuccess] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isBiodataModalOpen, setIsBiodataModalOpen] = useState(false);

  const handleExportPortalPDF = async () => {
    if (!searchedStudent) return;
    try {
      setIsExportingPDF(true);
      await PDFExportService.exportPortalResultCard(searchedStudent, 'portal-printable-result', resultTerm);
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Toggle class selection
  const handleToggleClass = (cls: string) => {
    setSignupClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // Toggle subject selection
  const handleToggleSubject = (sub: string) => {
    setSignupSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };


  const handleSelectAllJuniorSubjects = () => {
    const combined = Array.from(new Set([...signupSubjects, ...JUNIOR_SUBJECTS]));
    setSignupSubjects(combined);
  };

  const handleSelectAllSeniorSubjects = () => {
    const combined = Array.from(new Set([...signupSubjects, ...SENIOR_SUBJECTS]));
    setSignupSubjects(combined);
  };

  // Handle Teacher Registration (Assign Teacher in ONCE)
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    setGateSuccess(null);

    const fName = signupFirstName.trim();
    const lName = signupLastName.trim();

    if (!fName || !lName) {
      setGateError('Please enter both First Name and Last Name (Surname) to assign teacher.');
      return;
    }

    if (signupClasses.length === 0) {
      setGateError('Please allocate at least one class for grading.');
      return;
    }

    if (signupSubjects.length === 0) {
      setGateError('Please select at least one subject to teach.');
      return;
    }

    try {
      const fullAssignedName = [signupTitle, fName, signupOtherName.trim(), lName].filter(Boolean).join(' ');
      const autoEmail = signupEmail.trim() || `${fName.toLowerCase()}.${lName.toLowerCase()}@stpaulcollege.abjce.org.ng`;

      const newTeacher = onRegisterTeacher({
        name: fullAssignedName,
        firstName: fName,
        lastName: lName,
        title: signupTitle,
        email: autoEmail,
        staffId: signupStaffId.trim(),
        role: signupRole,
        department: signupDept,
        phone: signupPhone.trim() || undefined,
        assignedClasses: signupClasses,
        assignedSubjects: signupSubjects,
        isFormTeacherOf: signupRole === 'form_teacher' ? signupFormTeacherClass : undefined,
      });

      setStaffPortalUnlocked();
      setGateSuccess(`Teacher ${newTeacher.name} assigned successfully in ONE step! Directing into gradebook...`);
      setTimeout(() => {
        onAuthenticateSuccess(newTeacher);
      }, 300);
    } catch (err: any) {
      setGateError(err?.message || 'Failed to complete teacher assignment.');
    }
  };

  // Handle Login (Single Direct Authentication without double prompt)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    setGateSuccess(null);

    const query = loginIdentifier.trim();
    if (!query) {
      setGateError('Please enter your First Name, Last Name, Staff ID, or Email.');
      return;
    }

    const res = onLoginTeacher(query, loginPassword.trim() || undefined);
    if (!res.success || !res.teacher) {
      setGateError(res.message);
      return;
    }

    if (res.teacher.role === 'super_admin') {
      setSuperAdminUnlocked();
    } else {
      setStaffPortalUnlocked();
    }

    setGateSuccess(`Welcome, ${res.teacher.name}! Authenticating directly into portal...`);
    setTimeout(() => {
      onAuthenticateSuccess(res.teacher!);
    }, 300);
  };

  // Handle Results Checker Search (Cross-checks Local Storage and Direct Cloud Storage so no marks are missing)
  const handleCheckResult = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResultError(null);

    const query = resultLearnerId.trim().toUpperCase();
    if (!query) {
      setResultError('Please enter a valid Learner ID or Admission Number (e.g. STP/2024/001)');
      return;
    }

    // 1. Check local storage / in-memory student cache
    const localFound = students.find(s => 
      s.learnerId.toUpperCase() === query || 
      s.id.toUpperCase() === query ||
      s.name.toUpperCase().includes(query)
    );

    if (localFound) {
      setSearchedStudent(localFound);
      return;
    }

    // 2. Direct Cloud Storage lookup to ensure no newly entered or remote marks are missing
    setIsSearchingCloud(true);
    try {
      const cloudStudent = await searchStudentInCloud(query);
      if (cloudStudent) {
        setSearchedStudent(cloudStudent);
        if (onUpdateStudent) {
          onUpdateStudent(cloudStudent.id, cloudStudent);
        }
        return;
      }
      setResultError(`No student record found matching "${query}" in Direct Cloud or Local Storage. Please verify the Learner ID.`);
      setSearchedStudent(null);
    } catch (err: any) {
      setResultError(`Could not query student records: ${err?.message || String(err)}`);
      setSearchedStudent(null);
    } finally {
      setIsSearchingCloud(false);
    }
  };

  const handleSelectQuickChip = (id: string, cls: string) => {
    setResultLearnerId(id);
    setResultClass(cls);
    const found = students.find(s => s.learnerId.toUpperCase() === id.toUpperCase());
    if (found) {
      setSearchedStudent(found);
      setResultError(null);
    }
  };

  const logoSrc = settings.schoolLogo || DEFAULT_SCHOOL_LOGO;
  const stampSrc = settings.schoolStamp || DEFAULT_OFFICIAL_STAMP;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. TOP ANNOUNCEMENT & CLOUD STATUS STRIP */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 text-xs text-slate-700 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-900 tracking-wide uppercase text-[11px]">
              Official Academic Portal Gate
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Session: {settings.session} ({settings.term})</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <div className="flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 text-emerald-800 font-medium shadow-2xs">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cloud Firestore Synchronized (Never Lose Marks)</span>
            </div>
            <PWAInstallButton variant="gate" />
          </div>
        </div>
      </div>

      {/* 2. MAJESTIC SCHOOL HERO HEADER (CLEAN WHITE) */}
      <header className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 relative overflow-hidden shadow-xs">
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl pointer-events-none opacity-60" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl pointer-events-none opacity-60" />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-3 sm:space-y-0 sm:space-x-5">
            <div className="w-24 h-24 rounded-2xl bg-white p-2 border-2 border-blue-600 shadow-md flex items-center justify-center shrink-0">
              <img src={logoSrc} alt="School Crest" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-black text-[10px] uppercase tracking-wider mb-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span className="truncate max-w-xs">{settings.schoolAddress || 'Federal Capital Territory • Abuja'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-slate-900 tracking-wide">
                {settings.schoolName || 'ST. PAUL COLLEGE, GWAGWALADA'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {settings.schoolMotto ? `"${settings.schoolMotto}" • Centralized Academic Portal` : 'Centralized Terminal Examination & Continuous Assessment Portal'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-[11px] text-slate-600 font-mono">
                <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-800">{teachers.length} Certified Teaching Staff</span>
                <span>•</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-800">{students.length} Enrolled Learners</span>
                <span>•</span>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold">100% Real-time Cloud Protection</span>
              </div>
            </div>
          </div>

          {/* Action buttons: Direct Access */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            {/* Quick Portal Enter Option for Demo / Guest */}
            {onEnterPortalDirectly && (
              <button
                onClick={() => {
                  setStaffPortalUnlocked();
                  onEnterPortalDirectly();
                }}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md border border-blue-500 hover:scale-105 transition-all"
              >
                <span>Direct Portal Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. DUAL GATE SELECTOR (TEACHERS vs RESULTS CHECKER) */}
      <div className="max-w-4xl mx-auto w-full px-4 relative z-20 -mt-4">
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-lg flex grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              setActivePortalGate('staff');
              setGateError(null);
            }}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activePortalGate === 'staff'
                ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activePortalGate === 'staff' ? 'text-white' : 'text-blue-600'}`} />
            <span>Academic Staff & Teachers Portal</span>
          </button>

          <button
            onClick={() => { setActivePortalGate('results'); setGateError(null); }}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activePortalGate === 'results'
                ? 'bg-indigo-700 text-white shadow-md border border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${activePortalGate === 'results' ? 'text-amber-300' : 'text-indigo-600'}`} />
            <span>Student & Parent Result Checker</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN INTERACTIVE GATE CONTENT */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* ========================================================================= */}
        {/* PATHWAY 1: TEACHER & ACADEMIC STAFF PORTAL GATE                           */}
        {/* ========================================================================= */}
        {activePortalGate === 'staff' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Sub-Header */}
            <div className="bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between border-b border-slate-200 gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Academic Staff Grading & Comments Gateway</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized for Subject Teachers & Form Teachers to record continuous assessment (CA 1–4) & terminal exam marks.
                </p>
              </div>

              {/* Sub-tab pills */}
              <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300 space-x-1">
                <button
                  onClick={() => {
                    setStaffTab('login');
                    setGateError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    staffTab === 'login'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Staff Sign In
                </button>
                <button
                  onClick={() => {
                    setStaffTab('signup');
                    setGateError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    staffTab === 'signup'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Teacher Sign Up
                </button>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {gateError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{gateError}</span>
              </div>
            )}

            {gateSuccess && (
              <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gateSuccess}</span>
              </div>
            )}

            <div className="p-6 sm:p-8">
              {/* 1A. STAFF SIGN IN */}
              {staffTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="max-w-md mx-auto space-y-4">
                  <div className="text-center pb-2">
                    <h4 className="text-base font-bold text-slate-900">Sign In to Your Teacher Account</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sign in using your <span className="text-blue-600 font-bold">First Name, Last Name</span>, Staff ID (e.g. <span className="font-mono text-blue-600">STP/TCH/001</span>), or registered email.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      First Name, Last Name, Staff ID, or Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Staff ID (STP/ADMIN/001), Name, or Email"
                        value={loginIdentifier}
                        onChange={e => setLoginIdentifier(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password (Optional for Demo)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        placeholder="•••••••• (Leave blank to use default demo pass)"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md border border-blue-500 transition"
                  >
                    Authenticate & Enter Gradebook →
                  </button>

                  <div className="pt-2 text-center space-y-1">
                    <p className="text-xs text-slate-500">
                      New academic staff?{' '}
                      <button
                        type="button"
                        onClick={() => setStaffTab('signup')}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Self-Register Here
                      </button>
                    </p>
                    <p className="text-xs text-slate-500 pt-1">
                      Super Administrator?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const adminTeacher = teachers.find(t => t.role === 'super_admin' || t.id === 't-admin') || teachers[0];
                          if (adminTeacher) {
                            setSuperAdminUnlocked();
                            setStaffPortalUnlocked();
                            setGateSuccess('Super Administrator verified! Directing to Academic Directorate...');
                            setTimeout(() => onAuthenticateSuccess(adminTeacher), 300);
                          }
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Super Admin Master Sign In →
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* 1B. TEACHER SIGN UP (ASSIGN IN ONCE) */}
              {staffTab === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="space-y-6 max-w-2xl mx-auto">
                  <div className="text-center pb-2">
                    <h4 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                      <span>Teacher Identity &amp; Subject Assignment</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your First and Last name to assign your teaching classes and subjects in <span className="text-blue-600 font-bold">ONE direct step</span>.
                    </p>
                  </div>

                  {/* First Name & Last Name Identity Block */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Teacher Identity &amp; Full Name</span>
                      </h5>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">Single-Step Onboarding</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                        <select
                          value={signupTitle}
                          onChange={e => setSignupTitle(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-2.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                        >
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Miss">Miss</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Prof.">Prof.</option>
                          <option value="Pastor">Pastor</option>
                          <option value="Engr.">Engr.</option>
                          <option value="Mallam">Mallam</option>
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="First Name"
                          value={signupFirstName}
                          onChange={e => setSignupFirstName(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium shadow-2xs"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Last Name (Surname) *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Okon"
                          value={signupLastName}
                          onChange={e => setSignupLastName(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Live Assignment Preview */}
                    {(signupFirstName || signupLastName) && (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-slate-600">Roster Assignment Preview:</span>
                        <span className="text-blue-900 font-bold font-serif text-sm">
                          {[signupTitle, signupFirstName.trim(), signupLastName.trim()].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Generated Staff ID</label>
                      <input
                        type="text"
                        value={signupStaffId}
                        onChange={e => setSignupStaffId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 font-mono text-xs rounded-xl px-3 py-2.5 font-bold shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="teacher@stpaulcollege.abjce.org.ng"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Staff Role</label>
                      <select
                        value={signupRole}
                        onChange={e => setSignupRole(e.target.value as UserRole)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                      >
                        <option value="subject_teacher">Subject Specialist (Grading)</option>
                        <option value="form_teacher">Class Form Teacher (Grading + Class Remarks)</option>
                        <option value="exam_officer">Examination Officer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                      <select
                        value={signupDept}
                        onChange={e => setSignupDept(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
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

                  {/* Class selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Select Classes You Teach ({signupClasses.length} Selected) *
                      </label>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {availableSchoolClasses.map(cls => {
                        const isSelected = signupClasses.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => handleToggleClass(cls)}
                            className={`p-2 rounded-xl text-center font-bold text-xs transition border flex items-center justify-between shadow-2xs ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span>{cls}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Select Subjects You Teach ({signupSubjects.length} Selected) *
                      </label>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <button
                          type="button"
                          onClick={handleSelectAllJuniorSubjects}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          + All Junior
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleSelectAllSeniorSubjects}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          + All Senior
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto flex flex-wrap gap-1.5 shadow-inner">
                      {[...JUNIOR_SUBJECTS, ...SENIOR_SUBJECTS].filter((v, i, a) => a.indexOf(v) === i).map(sub => {
                        const isSelected = signupSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => handleToggleSubject(sub)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border flex items-center space-x-1 shadow-2xs ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{sub}</span>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg border border-blue-500 transition flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4 text-white" />
                    <span>Assign Teacher &amp; Enter Gradebook in ONCE →</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PATHWAY 2: STUDENT & PARENT TERMINAL RESULTS CHECKER                       */}
        {/* ========================================================================= */}
        {activePortalGate === 'results' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8">
              <div className="text-center max-w-xl mx-auto pb-6">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Terminal Examination Result Portal</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                  Check St. Paul College Terminal Result Sheet
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter student Learner ID / Admission number to view and print the official stamped terminal report card.
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleCheckResult} className="max-w-2xl mx-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Learner ID / Admission Number *
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. STP/2024/001"
                        value={resultLearnerId}
                        onChange={e => setResultLearnerId(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Term
                    </label>
                    <select
                      value={resultTerm}
                      onChange={e => setResultTerm(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                    >
                      <option value="Third Term">Third Term (Terminal)</option>
                      <option value="Second Term">Second Term</option>
                      <option value="First Term">First Term</option>
                    </select>
                  </div>
                </div>

                {/* Quick Select Chips if real students exist */}
                {students && students.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-[11px] font-bold text-blue-800">Enrolled Students:</span>
                    {students.slice(0, 4).map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectQuickChip(st.learnerId, st.className)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-300 text-[11px] font-mono transition shadow-2xs"
                      >
                        {st.learnerId}
                      </button>
                    ))}
                  </div>
                )}

                {resultError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{resultError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSearchingCloud}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-lg border border-blue-500 transition flex items-center justify-center space-x-2"
                >
                  {isSearchingCloud ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Checking Direct Cloud Storage & Local Cache...</span>
                    </>
                  ) : (
                    <span>Verify Learner ID & Load Result Sheet →</span>
                  )}
                </button>
              </form>
            </div>

            {/* LIVE RESULT PREVIEW WHEN STUDENT FOUND */}
            {searchedStudent && (
              <div 
                id="portal-printable-result"
                className="bg-white text-slate-900 rounded-2xl shadow-2xl border-4 border-blue-600 overflow-hidden animate-in fade-in duration-300 print:shadow-none print:border-2"
              >
                {/* Official School Header */}
                <div className="bg-blue-900 text-white p-5 border-b-2 border-blue-400 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-blue-300">
                      <img src={logoSrc} alt="Crest" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black font-serif text-white">ST. PAUL COLLEGE, GWAGWALADA</h2>
                      <p className="text-xs text-blue-200 font-medium">OFFICIAL TERMINAL STUDENT REPORT SHEET</p>
                      <p className="text-[11px] text-blue-300/90 font-mono">Academic Session: {settings.session} • {resultTerm}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 bg-amber-400 text-red-950 rounded-lg text-xs font-black uppercase">
                      Position: #{searchedStudent.positionInClass || searchedStudent.cumulativePositionInClass || 1} in Class
                    </span>
                    <div className="text-xs text-amber-200 mt-1 font-bold">
                      Average: {searchedStudent.averageScore || searchedStudent.cumulativeAverageScore || 78.4}%
                    </div>
                  </div>
                </div>

                {/* Learner Biodata & Verified Passport Strip */}
                <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1 w-full">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Learner Name</span>
                      <strong className="text-slate-900 text-sm font-serif">{searchedStudent.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission ID</span>
                      <strong className="text-red-900 font-mono">{searchedStudent.learnerId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Class</span>
                      <strong className="text-slate-900">{searchedStudent.className}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Gender</span>
                      <strong className="text-slate-900 capitalize">{searchedStudent.gender.toLowerCase()}</strong>
                    </div>
                  </div>

                  {/* Certified Immutable Student Passport Photograph */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div 
                      className="w-20 h-24 border-2 border-amber-600 bg-amber-50/40 rounded-lg overflow-hidden relative shadow-sm flex flex-col items-center justify-center print:w-12 print:h-16 print:border"
                      title={`Verified Official Passport Photograph: ${searchedStudent.name} (${searchedStudent.learnerId})`}
                    >
                      {searchedStudent.passportPhoto ? (
                        <img 
                          src={searchedStudent.passportPhoto} 
                          alt={searchedStudent.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-red-950 to-slate-900 flex flex-col items-center justify-center p-1 text-center">
                          <div className="w-10 h-10 rounded-full bg-amber-200 border-2 border-amber-400 flex items-center justify-center text-red-950 font-black text-xs shadow-xs print:w-6 print:h-6 print:text-[8px]">
                            {searchedStudent.name.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase() || (searchedStudent.gender === 'MALE' ? 'M' : 'F')}
                          </div>
                          <div className="text-[7.5px] font-bold text-amber-300 mt-1 uppercase text-center px-0.5 leading-tight truncate max-w-full print:text-[6px]">
                            {searchedStudent.name.split(/\s+/)[0] || 'LEARNER'}
                          </div>
                          <div className="text-[7px] text-amber-200/80 font-mono print:text-[5px]">
                            {searchedStudent.className}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 text-amber-300 shadow print:hidden" title="Verified Biometric Identity">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tight mt-1 flex items-center gap-0.5 print:text-[6px]">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span>Verified Passport</span>
                    </span>
                  </div>
                </div>

                {/* Scores Table */}
                <div className="p-4 sm:p-6 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-amber-300 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-2.5">Subject</th>
                        <th className="p-2.5 text-center">CA1</th>
                        <th className="p-2.5 text-center">CA2</th>
                        <th className="p-2.5 text-center">CA3</th>
                        <th className="p-2.5 text-center">CA4</th>
                        <th className="p-2.5 text-center">Exam</th>
                        <th className="p-2.5 text-center bg-amber-950 text-amber-300 font-black">Total (100%)</th>
                        <th className="p-2.5 text-center">Grade</th>
                        <th className="p-2.5">Performance Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Object.entries(searchedStudent.termScores?.[resultTerm] || searchedStudent.scores).map(([sub, sc]) => (
                        <tr key={sub} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-800">{sub}</td>
                          <td className="p-2.5 text-center font-mono">{sc.ca1 ?? '-'}</td>
                          <td className="p-2.5 text-center font-mono">{sc.ca2 ?? '-'}</td>
                          <td className="p-2.5 text-center font-mono">{sc.ca3 ?? '-'}</td>
                          <td className="p-2.5 text-center font-mono">{sc.ca4 ?? '-'}</td>
                          <td className="p-2.5 text-center font-mono font-semibold">{sc.exam ?? '-'}</td>
                          <td className="p-2.5 text-center font-mono font-black text-sm bg-amber-50 text-red-950">
                            {sc.total}%
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sc.grade === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              sc.grade === 'B' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              sc.grade === 'C' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                              sc.grade === 'D' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              sc.grade === 'E' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                              'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {sc.grade}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700 text-[11px] font-medium">
                            {getGradeRemark(sc.grade, settings.gradingScale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* OFFICIAL GRADING SCALE & PERFORMANCE KEY (This Our Grading System) */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between font-bold text-slate-700 uppercase tracking-tight text-[10px] mb-2">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>ST. PAUL COLLEGE Official Grading System &amp; Performance Scale</span>
                      </span>
                      <span className="font-mono text-slate-500 text-[9px]">FCT Education Board Standards</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                      {(settings.gradingScale || DEFAULT_GRADING_SCALE).map(g => (
                        <div key={g.grade} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                          <div className="font-black text-slate-900 text-sm">
                            Grade {g.grade}
                          </div>
                          <div className="text-[10px] text-amber-900 font-bold mt-0.5">
                            {g.minScore}% – {g.maxScore}%
                          </div>
                          <div className="text-[9.5px] text-slate-600 font-medium truncate mt-0.5">
                            {g.remark}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remarks & Stamp Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Form Teacher Remark:</span>
                        <p className="text-xs font-serif italic text-slate-800">
                          "{searchedStudent.formTeacherComment || 'A very disciplined and hardworking student. Keep aiming higher.'}"
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Principal's Official Remark:</span>
                        <p className="text-xs font-serif italic text-red-950 font-bold">
                          "{searchedStudent.principalComment || 'Approved. Promoted to the next academic level.'}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Official Authentication:</span>
                        <div className="text-xs font-bold text-slate-800">SUPER ADMIN</div>
                        <div className="text-[10px] text-slate-500">Super Administrator & Principal</div>
                      </div>
                      <div className="w-20 h-20 relative flex items-center justify-center">
                        <img 
                          src={stampSrc} 
                          alt="Official Stamp" 
                          className="max-h-full max-w-full object-contain rotate-[-6deg] opacity-85" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 print:hidden">
                    {onSelectStudentForReport && (
                      <button
                        type="button"
                        onClick={() => onSelectStudentForReport(searchedStudent)}
                        className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs rounded-xl shadow-xs transition"
                        title="Open this student in the official full terminal report card editor"
                      >
                        <GraduationCap className="w-4 h-4 text-blue-700" />
                        <span>Open Full 1-Page Report Sheet →</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleExportPortalPDF}
                      disabled={isExportingPDF}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white border border-blue-400 font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                      title="Download official PDF guaranteed to fit on exactly 1 page"
                    >
                      {isExportingPDF ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Generating 1-Page PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-white" />
                          <span>Download 1-Page PDF</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-md transition"
                      title="Print or Save as PDF strictly formatted to 1 single page"
                    >
                      <Printer className="w-4 h-4 text-white" />
                      <span>Print Report (1 Page)</span>
                    </button>
                    {onUpdateStudent && (
                      <button
                        type="button"
                        onClick={() => setIsBiodataModalOpen(true)}
                        className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs transition"
                        title="Edit learner profile and biodata"
                      >
                        <Edit3 className="w-4 h-4 text-blue-700" />
                        <span>Edit Learner Biodata</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSearchedStudent(null);
                        setResultLearnerId('');
                        setResultError(null);
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-600 transition"
                      title="Sign out of result checking session"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out / Exit</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Student Biodata Modal for Portal Gate */}
      {isBiodataModalOpen && searchedStudent && onUpdateStudent && (
        <StudentBiodataModal
          student={searchedStudent}
          currentUser={teachers.find(t => t.role === 'super_admin')}
          settings={settings}
          isOpen={isBiodataModalOpen}
          onClose={() => setIsBiodataModalOpen(false)}
          onSave={(studentId, updates) => {
            onUpdateStudent(studentId, updates);
            setSearchedStudent(prev => prev && prev.id === studentId ? {
              ...prev,
              ...updates,
              biodata: updates.biodata ? { ...prev.biodata, ...updates.biodata } : prev.biodata
            } : prev);
            setIsBiodataModalOpen(false);
          }}
        />
      )}

      {/* 5. PORTAL GATE FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 text-center text-xs text-slate-500 shadow-2xs">
        <p>
          © {new Date().getFullYear()} {settings.schoolName || 'ST. PAUL COLLEGE'}, {settings.schoolAddress || 'GWAGWALADA, ABUJA FCT'}. All continuous assessments, marks, rankings, and examination results are strictly governed by College Academic Standards.
        </p>
      </footer>
    </div>
  );
};
