import React, { useState } from 'react';
import { 
  School, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Upload, 
  ShieldCheck, 
  Palette, 
  BookOpen, 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  ArrowRight, 
  ArrowLeft,
  Stamp,
  Layers,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { SchoolProfile, SchoolThemeId, SchoolSettings, Teacher } from '../types';
import { SCHOOL_THEMES, getThemeConfig } from '../utils/theme';
import { 
  SCHOOL_CLASSES, 
  JUNIOR_SUBJECTS, 
  SENIOR_SUBJECTS, 
  generateSchoolCrestSvg, 
  generateSchoolStampSvg 
} from '../data/mockData';
import { googleSignIn } from '../services/firebaseAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface SchoolOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: FirebaseUser | null;
  onCreateSchool: (
    profileData: Partial<SchoolProfile> & { name: string; email: string },
    adminTeacherData?: Partial<Teacher>,
    initialOption?: 'clean' | 'sample'
  ) => SchoolProfile;
  onAuthenticateSuccess: (teacher: Teacher) => void;
}

export const SchoolOnboardingModal: React.FC<SchoolOnboardingModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  onCreateSchool,
  onAuthenticateSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  // Form State
  const [schoolName, setSchoolName] = useState('');
  const [motto, setMotto] = useState('EXCELLENCE, KNOWLEDGE & INTEGRITY');
  const [address, setAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState(firebaseUser?.email || '');
  const [adminFullName, setAdminFullName] = useState(firebaseUser?.displayName || '');
  const [adminTitle, setAdminTitle] = useState('Dr.');
  const [phone, setPhone] = useState('+234 803 000 0000');
  const [principalName, setPrincipalName] = useState('');
  const [examOfficerName, setExamOfficerName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<SchoolThemeId>('navy-gold');

  // Custom logo or generated
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [stampBase64, setStampBase64] = useState<string>('');
  const [initialOption, setInitialOption] = useState<'clean' | 'sample'>('sample');

  // Prefix defaults
  const [learnerPrefix, setLearnerPrefix] = useState('');
  const [staffPrefix, setStaffPrefix] = useState('');

  // Update prefixes when school name changes
  const handleSchoolNameChange = (name: string) => {
    setSchoolName(name);
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      const initials = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
      if (!learnerPrefix || learnerPrefix.length <= 5) {
        setLearnerPrefix(`${initials}/`);
      }
      if (!staffPrefix || staffPrefix.length <= 9) {
        setStaffPrefix(`${initials}/TCH/`);
      }
      if (!principalName) {
        setPrincipalName(`REV. PRINCIPAL / SUPER ADMIN`);
      }
      if (!examOfficerName) {
        setExamOfficerName(`DIRECTOR OF EXAMINATIONS`);
      }
    }
  };

  // Google Sign In handler
  const handleGoogleSignInClick = async () => {
    setGoogleAuthError(null);
    try {
      setIsSigningInGoogle(true);
      const res = await googleSignIn();
      if (res?.user) {
        setAdminEmail(res.user.email || '');
        if (res.user.displayName) {
          setAdminFullName(res.user.displayName);
        }
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setGoogleAuthError(err?.message || 'Could not complete Google sign-in. You may enter your Gmail manually below.');
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Stamp Upload
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setStampBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Final submit
  const handleCompleteSetup = () => {
    const cleanName = schoolName.trim();
    const cleanEmail = adminEmail.trim();

    if (!cleanName) {
      alert('Please enter a valid School Name.');
      setStep(1);
      return;
    }

    if (!cleanEmail) {
      alert('Please provide your School Administrator Gmail.');
      setStep(1);
      return;
    }

    const themeCfg = getThemeConfig(selectedTheme);
    const finalLogo = logoBase64 || generateSchoolCrestSvg(cleanName, themeCfg.primaryColor, themeCfg.accentColor);
    const finalStamp = stampBase64 || generateSchoolStampSvg(cleanName, address || 'CAMPUS', motto);

    const nameParts = (adminFullName.trim() || 'SUPER ADMIN').split(/\s+/);
    const fName = nameParts[0] || 'SUPER';
    const lName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'ADMIN';

    const created = onCreateSchool({
      name: cleanName,
      motto: motto.trim(),
      address: address.trim() || 'CENTRAL CAMPUS',
      email: cleanEmail,
      phone: phone.trim(),
      principalName: principalName.trim() || 'SUPER ADMIN / PRINCIPAL',
      examOfficerName: examOfficerName.trim() || 'EXAMINATION OFFICER',
      theme: selectedTheme,
      logo: finalLogo,
      stamp: finalStamp,
      adminEmail: cleanEmail,
      adminName: adminFullName.trim() || 'Super Admin',
      learnerIdPrefix: learnerPrefix || `${cleanName.substring(0, 3).toUpperCase()}/`,
      staffIdPrefix: staffPrefix || `${cleanName.substring(0, 3).toUpperCase()}/TCH/`,
    }, {
      firstName: fName,
      lastName: lName,
      title: adminTitle,
      email: cleanEmail,
      name: `${adminTitle} ${adminFullName.trim() || 'Super Admin'}`.trim(),
    }, initialOption);

    // Auto login
    const adminTeacher: Teacher = {
      id: `admin-${created.id}`,
      name: `${adminTitle} ${adminFullName.trim() || 'Super Admin'}`.trim(),
      email: cleanEmail,
      role: 'super_admin',
      staffId: `${created.staffIdPrefix || 'STAFF/'}001`,
      assignedClasses: [...(created.classes || SCHOOL_CLASSES)],
      assignedSubjects: Array.from(new Set([...(created.juniorSubjects || JUNIOR_SUBJECTS), ...(created.seniorSubjects || SENIOR_SUBJECTS)])),
    };

    onAuthenticateSuccess(adminTeacher);
    onClose();
  };

  if (!isOpen) return null;

  const currentThemeConfig = getThemeConfig(selectedTheme);
  const previewLogo = logoBase64 || generateSchoolCrestSvg(schoolName || 'ACADEMY', currentThemeConfig.primaryColor, currentThemeConfig.accentColor);
  const previewStamp = stampBase64 || generateSchoolStampSvg(schoolName || 'ACADEMY', address || 'NIGERIA', motto);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-400 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6 text-slate-100 max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-red-950 via-[#7a0c0c] to-red-950 border-b border-amber-500/50 p-4 sm:p-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center shadow-lg font-black shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-red-950 uppercase tracking-wider">
                  Independent School Portal Setup
                </span>
                <span className="text-xs text-amber-300 font-mono">Gmail Powered</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-serif text-amber-200 mt-0.5">
                Create Independent School Application
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-300 hover:text-white hover:bg-red-900/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 1 ? 'bg-amber-400 text-red-950 ring-2 ring-amber-300' : 'bg-emerald-500 text-slate-950'
            }`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span className={step === 1 ? 'text-amber-300' : 'text-slate-400'}>
              Gmail &amp; School Identity
            </span>
          </div>

          <div className="w-8 sm:w-16 h-0.5 bg-slate-800" />

          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 2 ? 'bg-amber-400 text-red-950 ring-2 ring-amber-300' : step > 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span className={step === 2 ? 'text-amber-300' : 'text-slate-400'}>
              Theme &amp; Crest Branding
            </span>
          </div>

          <div className="w-8 sm:w-16 h-0.5 bg-slate-800" />

          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 3 ? 'bg-amber-400 text-red-950 ring-2 ring-amber-300' : 'bg-slate-800 text-slate-400'
            }`}>
              3
            </span>
            <span className={step === 3 ? 'text-amber-300' : 'text-slate-400'}>
              Academics &amp; Launch
            </span>
          </div>
        </div>

        {/* Step Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ============================================================ */}
          {/* STEP 1: GMAIL AUTHENTICATION & SCHOOL IDENTITY               */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Google Sign-in Card */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center space-x-3 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 shadow-md">
                    <svg className="w-7 h-7" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {adminEmail ? `Signed in as ${adminEmail}` : 'Sign Up School with Google / Gmail'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {adminEmail 
                        ? 'Google account connected! This Gmail has full Super Administrator control.' 
                        : 'Connect your Gmail for instant single-click sign-in and cloud database provisioning.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isSigningInGoogle}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md border border-slate-300 flex items-center space-x-2 shrink-0 transition"
                >
                  <Mail className="w-4 h-4 text-red-600" />
                  <span>{isSigningInGoogle ? 'Connecting...' : adminEmail ? 'Switch Gmail Account' : 'Sign in with Google'}</span>
                </button>
              </div>

              {googleAuthError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-xs text-red-200">
                  {googleAuthError}
                </div>
              )}

              {/* School Basic Identity Form */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <School className="w-4 h-4 text-amber-400" />
                  <span>School Institution Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      School Official Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GRACE INTERNATIONAL COLLEGE, ABUJA"
                      value={schoolName}
                      onChange={e => handleSchoolNameChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This official name will be stamped on all Terminal Report Sheets, Class Broadsheets, and official transcripts.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      School Motto / Slogan
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KNOWLEDGE IS LIGHT"
                      value={motto}
                      onChange={e => setMotto(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Campus Physical Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PLOT 14, GARKI II, ABUJA FCT"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Administrator Contact Gmail *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. principal.gracecollege@gmail.com"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Official Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+234 803 123 4567"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* School Executive Officers Form */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Administrative Leadership (Signed on Report Cards)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-amber-200 mb-1">Title</label>
                    <select
                      value={adminTitle}
                      onChange={e => setAdminTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Rev. Fr.">Rev. Fr.</option>
                      <option value="Pastor">Pastor</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Alhaji">Alhaji</option>
                    </select>
                  </div>

                  <div className="sm:col-span-9">
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Super Administrator Full Name (Your Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Okafor"
                      value={adminFullName}
                      onChange={e => setAdminFullName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Principal / Head of School Title &amp; Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. REV. PRINCIPAL / SUPER ADMIN"
                      value={principalName}
                      onChange={e => setPrincipalName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Examination Officer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Examination Officer Name"
                      value={examOfficerName}
                      onChange={e => setExamOfficerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: THEME & VISUAL BRANDING (CREST & RUBBER STAMP)        */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Theme Selector */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Choose Institutional Color Scheme &amp; Theme</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Select your school&apos;s signature colors. The portal navigation, banners, result sheet headers, and auto-generated badges will instantly adopt this palette.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(SCHOOL_THEMES) as SchoolThemeId[]).map(themeKey => {
                    const t = SCHOOL_THEMES[themeKey];
                    const isSelected = selectedTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setSelectedTheme(themeKey)}
                        className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/50 shadow-lg' 
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span 
                              className="w-4 h-4 rounded-full border border-white/40 shrink-0" 
                              style={{ backgroundColor: t.primaryColor }} 
                            />
                            <span 
                              className="w-4 h-4 rounded-full border border-white/40 shrink-0" 
                              style={{ backgroundColor: t.accentColor }} 
                            />
                            <span className="font-bold text-xs text-white truncate">{t.name}</span>
                          </div>
                          <div className={`mt-2 h-2 rounded-full bg-gradient-to-r ${t.headerStrip}`} />
                        </div>
                        {isSelected && (
                          <div className="mt-2 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active Theme</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Crest Logo & Stamp Live Previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Logo & Crest Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Official School Logo / Heraldic Crest</span>
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Auto-generated with your school name initials and theme colors, or upload your official crest file.
                    </p>

                    <div className="mt-4 flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-2xl bg-white p-2 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-lg">
                        <img src={previewLogo} alt="School Crest Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Custom Logo</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        {logoBase64 && (
                          <button
                            type="button"
                            onClick={() => setLogoBase64('')}
                            className="block text-[11px] text-red-400 hover:underline"
                          >
                            Revert to Vector Crest
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Stamp & Seal Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Stamp className="w-4 h-4 text-amber-400" />
                      <span>Official School Stamp &amp; Security Seal</span>
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Rubber stamp applied across all Learner Report Cards &amp; Broadsheets.
                    </p>

                    <div className="mt-4 flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-2xl bg-white p-2 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-lg">
                        <img src={previewStamp} alt="School Stamp Preview" className="max-h-full max-w-full object-contain -rotate-6" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Rubber Stamp</span>
                          <input type="file" accept="image/*" onChange={handleStampUpload} className="hidden" />
                        </label>
                        {stampBase64 && (
                          <button
                            type="button"
                            onClick={() => setStampBase64('')}
                            className="block text-[11px] text-red-400 hover:underline"
                          >
                            Revert to Vector Stamp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: ACADEMIC CURRICULUM & FINAL CONFIRMATION             */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="space-y-6">
              {/* ID Prefix Config */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Institutional Identification Prefixes</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Student Learner ID Prefix
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GIC/"
                      value={learnerPrefix}
                      onChange={e => setLearnerPrefix(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Example student ID: <span className="font-mono text-amber-300">{learnerPrefix || 'SCH/'}2026/001</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-200 mb-1">
                      Teaching Staff ID Prefix
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GIC/TCH/"
                      value={staffPrefix}
                      onChange={e => setStaffPrefix(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Example staff ID: <span className="font-mono text-amber-300">{staffPrefix || 'SCH/TCH/'}001</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Starter Dataset Option */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Initial Student Roster Setup</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInitialOption('sample')}
                    className={`p-4 rounded-xl border text-left transition ${
                      initialOption === 'sample'
                        ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-amber-300">
                        ⚡ Quick Starter (12 Enrolled Learners)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      Pre-populates 12 sample students across JSS &amp; SSS classes with realistic academic records so you can immediately preview broadsheets, analytics, and printable terminal reports.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInitialOption('clean')}
                    className={`p-4 rounded-xl border text-left transition ${
                      initialOption === 'clean'
                        ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-amber-300">
                        ✨ Pristine Clean Registry (0 Students)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      Start with a completely empty learner roster, ready for bulk Excel upload, single registrations, or external portal imports.
                    </p>
                  </button>
                </div>
              </div>

              {/* Final Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900 to-red-950/90 border-2 border-amber-400/60 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center shrink-0 font-black">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-200">
                    Ready to Launch {schoolName.toUpperCase() || 'YOUR INDEPENDENT SCHOOL'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Your independent school workspace will have its own isolated student records, staff roster, continuous assessment configurations, grading scale, and real-time Cloud Firestore synchronization.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Navigation */}
        <div className="bg-slate-950 px-5 sm:px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !schoolName.trim()) {
                    alert('Please enter your School Name before proceeding.');
                    return;
                  }
                  if (step === 1 && !adminEmail.trim()) {
                    alert('Please provide your School Gmail before proceeding.');
                    return;
                  }
                  setStep((step + 1) as any);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-black text-xs shadow-lg border border-amber-300 flex items-center space-x-2 transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteSetup}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-xl border border-emerald-300 flex items-center space-x-2 transition hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch School Portal Now →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
