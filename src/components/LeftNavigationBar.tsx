import React, { useState } from 'react';
import { Teacher, SchoolSettings, GoogleSheetsSyncConfig, SchoolProfile } from '../types';
import { DEFAULT_SCHOOL_LOGO } from '../data/mockData';
import { getThemeConfig } from '../utils/theme';
import { 
  BookOpen, 
  Table, 
  FileText, 
  Users, 
  BarChart3, 
  Search, 
  Sheet, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Sliders, 
  Upload, 
  UserPlus, 
  LogIn,
  Database, 
  Stamp, 
  FileSpreadsheet, 
  ShieldAlert,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Layers,
  MessageSquare,
  DoorOpen,
  Cloud,
  RefreshCw,
  LogOut,
  Edit,
  School,
  Settings,
  Plus
} from 'lucide-react';
import { googleSignIn, logout } from '../services/firebaseAuth';
import { User as FirebaseUser } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';

export interface LeftNavigationBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Teacher;
  setCurrentUser: (teacher: Teacher) => void;
  teachers: Teacher[];
  settings: SchoolSettings;
  sheetsConfig: GoogleSheetsSyncConfig;
  firebaseUser: FirebaseUser | null;
  accessToken: string | null;
  activeTerm?: string;
  onSelectTerm?: (term: string) => void;
  onOpenSyncModal: () => void;
  onOpenPercentageModal?: () => void;
  onOpenLogoModal?: () => void;
  onOpenStampModal?: () => void;
  onOpenDirectScoreModal?: () => void;
  onOpenExternalPortalModal?: () => void;
  onOpenTeacherSignupModal?: (mode?: 'signup' | 'login') => void;
  onOpenExcelUploadModal?: () => void;
  onOpenMissingMarksModal?: () => void;
  onLogoutToGate?: () => void;
  onOpenPortalGate?: () => void;
  cloudSyncStatus?: { state: string; message: string; lastSyncedAt: Date | null; pendingCount: number };
  onForceCloudSync?: () => void;
  onSignOut?: () => void;
  onOpenTeacherProfile?: () => void;
  schoolRegistry?: SchoolProfile[];
  activeSchoolId?: string;
  onSwitchSchool?: (schoolId: string) => void;
  onOpenSchoolSettings?: () => void;
  onOpenSchoolOnboarding?: () => void;
}

export const LeftNavigationBar: React.FC<LeftNavigationBarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  teachers,
  settings,
  sheetsConfig,
  firebaseUser,
  accessToken,
  activeTerm,
  onSelectTerm,
  onOpenSyncModal,
  onOpenPercentageModal,
  onOpenLogoModal,
  onOpenStampModal,
  onOpenDirectScoreModal,
  onOpenExternalPortalModal,
  onOpenTeacherSignupModal,
  onOpenExcelUploadModal,
  onOpenMissingMarksModal,
  onLogoutToGate,
  onOpenPortalGate,
  cloudSyncStatus,
  onForceCloudSync,
  onSignOut,
  onOpenTeacherProfile,
  schoolRegistry = [],
  activeSchoolId = 'stpaul',
  onSwitchSchool,
  onOpenSchoolSettings,
  onOpenSchoolOnboarding,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleAuth = async () => {
    if (firebaseUser) {
      await logout();
    } else {
      try {
        setIsSigningIn(true);
        await googleSignIn();
      } catch (err) {
        console.error('Sign-in failed', err);
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  const navItems = [
    { id: 'gradebook', label: 'Mark Entry (Gradebook)', shortLabel: 'Marks', icon: BookOpen },
    { id: 'broadsheet', label: 'Master Broadsheet', shortLabel: 'Broadsheet', icon: Table },
    { id: 'report-sheet', label: "Learner's Report Sheet", shortLabel: 'Report Sheet', icon: FileText },
    { id: 'registration', label: 'Student Registration', shortLabel: 'Students', icon: UserPlus },
    { id: 'teachers', label: 'Teachers & RBAC (30)', shortLabel: 'Staff RBAC', icon: Users },
    { id: 'analytics', label: 'Academic Analytics', shortLabel: 'Analytics', icon: BarChart3 },
    { id: 'portal', label: 'Student / Parent Lookup', shortLabel: 'Lookup', icon: Search },
  ];

  const logoSrc = settings.schoolLogo || DEFAULT_SCHOOL_LOGO;

  return (
    <>
      {/* 1. SLIM TOP BAR FOR MOBILE & TABLET SCREENS */}
      <div className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-[#7a0c0c] via-[#8f1212] to-[#690707] text-white border-b-2 border-amber-400 px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-lg bg-red-950/80 text-amber-300 hover:bg-red-900 border border-amber-400/50 transition"
            title="Open Left Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center border border-amber-400 overflow-hidden">
              <img src={logoSrc} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-black font-serif text-amber-300 leading-tight truncate max-w-[160px]">{settings.schoolName || 'ST PAUL COLLEGE'}</h2>
              <p className="text-[10px] text-amber-100/80 capitalize">{activeTab.replace('-', ' ')} • {activeTerm || settings.term}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {onOpenDirectScoreModal && (
            <button
              onClick={onOpenDirectScoreModal}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-red-950 font-black text-xs shadow-xs border border-amber-200"
              title="Open Mobile Direct Mark Entry"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Marks</span>
            </button>
          )}

          {onOpenTeacherSignupModal && (
            <button
              onClick={() => onOpenTeacherSignupModal('login')}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
              title="Staff Sign In"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign In</span>
            </button>
          )}

          {onOpenTeacherSignupModal && (
            <button
              onClick={() => onOpenTeacherSignupModal('signup')}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-red-950 font-black text-xs shadow-xs"
              title="Teacher Sign Up"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign Up</span>
            </button>
          )}

          {onOpenTeacherProfile && (
            <button
              onClick={onOpenTeacherProfile}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-red-900/80 hover:bg-red-800 text-amber-300 font-bold text-xs border border-amber-400/40 shadow-xs"
              title="Edit Staff Profile & Biodata"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-red-950 hover:bg-black text-rose-300 hover:text-white font-bold text-xs border border-rose-500/50 shadow-xs"
              title="Sign Out of College Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}

          {onOpenMissingMarksModal && (
            <button
              onClick={onOpenMissingMarksModal}
              className="p-1.5 rounded-lg bg-amber-400 text-red-950 font-bold text-xs"
              title="Audit Missing Marks"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenSyncModal}
            className={`p-1.5 rounded-lg border text-xs ${
              accessToken ? 'bg-emerald-900 text-emerald-300 border-emerald-500' : 'bg-red-950 text-amber-200 border-amber-400/50'
            }`}
            title="Google Sheets Sync"
          >
            <Sheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 3. MAIN LEFT NAVIGATION BAR (DESKTOP PINNED + MOBILE DRAWER) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:static lg:z-auto bg-gradient-to-b from-[#690707] via-[#540808] to-[#3a0303] text-white border-r-2 border-amber-400/80 shadow-2xl flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header: School Crest & College Title */}
        {/* Sidebar Header: School Crest & College Title */}
        <div className="p-3.5 border-b border-red-900/80 bg-red-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div
              onClick={() => (currentUser.role === 'super_admin' || currentUser.role === 'admin') && onOpenLogoModal && onOpenLogoModal()}
              className={`w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg border-2 border-amber-400 shrink-0 overflow-hidden ${
                currentUser.role === 'super_admin' || currentUser.role === 'admin' ? 'cursor-pointer hover:scale-105' : ''
              }`}
              title={currentUser.role === 'super_admin' || currentUser.role === 'admin' ? 'Click to change School Logo' : `${settings.schoolName} Official Crest`}
            >
              <img src={logoSrc} alt="School Crest" className="max-h-full max-w-full object-contain" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-sm font-black font-serif text-amber-300 truncate tracking-wide" title={settings.schoolName}>
                    {settings.schoolName || 'ST PAUL COLLEGE'}
                  </h1>
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-red-950 uppercase tracking-wider truncate max-w-[100px]">
                    {settings.schoolAddress ? settings.schoolAddress.split(',')[0] : 'CAMPUS'}
                  </span>
                  <span className="text-[10px] text-amber-100/70 font-mono truncate">{settings.session}</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Mobile Close Button */}
          <div className="flex items-center">
            {/* Mobile close */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-red-900"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-amber-200/80 hover:text-white hover:bg-red-900/70 transition border border-amber-400/40"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4 text-amber-300" /> : <ChevronLeft className="w-4 h-4 text-amber-300" />}
            </button>
          </div>
        </div>

        {/* Multi-School Switcher Bar */}
        {!isCollapsed && (
          <div className="px-2.5 py-1.5 border-b border-red-900/60 bg-black/40 relative">
            <button
              onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
              className="w-full flex items-center justify-between p-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-amber-400/40 text-left transition"
              title="Switch School Portal or Register with Gmail"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-amber-200 truncate">
                    {settings.schoolName}
                  </div>
                  <div className="text-[9px] text-amber-400/80 font-mono truncate">
                    {schoolRegistry.length > 1 ? `${schoolRegistry.length} Schools • Click to Switch` : 'Independent Portal'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-amber-300 shrink-0 transition-transform ${showSchoolDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* School Switcher Dropdown */}
            {showSchoolDropdown && (
              <div className="absolute left-2.5 right-2.5 top-full mt-1 z-50 bg-slate-900 border-2 border-amber-400/90 rounded-xl shadow-2xl p-2 space-y-2 text-xs">
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider px-2 py-1 border-b border-slate-800 flex justify-between items-center">
                  <span>Registered Schools</span>
                  <span className="text-slate-400 font-mono">{schoolRegistry.length}</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {schoolRegistry.map(sch => {
                    const isCurrent = sch.id === (activeSchoolId || 'stpaul');
                    return (
                      <button
                        key={sch.id}
                        onClick={() => {
                          if (onSwitchSchool) onSwitchSchool(sch.id);
                          setShowSchoolDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                          isCurrent
                            ? 'bg-amber-400 text-red-950 font-black'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate font-bold text-xs">{sch.name}</div>
                          <div className={`text-[9px] truncate ${isCurrent ? 'text-red-900 font-semibold' : 'text-slate-400'}`}>
                            {sch.motto || sch.address || 'Independent School'}
                          </div>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-red-950" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  {onOpenSchoolSettings && (
                    <button
                      onClick={() => {
                        setShowSchoolDropdown(false);
                        onOpenSchoolSettings();
                      }}
                      className="w-full flex items-center space-x-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] transition"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>School Settings Hub ⚙️</span>
                    </button>
                  )}

                  {onOpenSchoolOnboarding && (
                    <button
                      onClick={() => {
                        setShowSchoolDropdown(false);
                        onOpenSchoolOnboarding();
                      }}
                      className="w-full flex items-center space-x-2 p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-black text-[11px] shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register School (Gmail) 🚀</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portal Gate Quick Jump Button */}
        {onOpenPortalGate && (
          <div className="p-2 border-b border-red-900/60 bg-black/30">
            <button
              onClick={() => {
                onOpenPortalGate();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-black text-xs shadow-md border border-amber-300 transition"
              title="Return to the Majestic St. Paul College Portal Gate"
            >
              <DoorOpen className="w-4 h-4 text-red-950 shrink-0" />
              {!isCollapsed && <span>Return to Portal Gate</span>}
            </button>
          </div>
        )}

        {/* Cloud Firestore Synchronization Live Status Strip */}
        <div className="px-3 py-1.5 bg-red-950/90 border-b border-red-900/60 flex items-center justify-between text-[10px]">
          <div className="flex items-center space-x-1.5 text-emerald-300 truncate">
            <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
            {!isCollapsed && (
              <span className="truncate font-semibold">
                {cloudSyncStatus?.message || 'Cloud Firestore Protected'}
              </span>
            )}
          </div>
          {onForceCloudSync && !isCollapsed && (
            <button
              onClick={onForceCloudSync}
              className="p-1 rounded text-amber-300 hover:text-white hover:bg-red-900 transition"
              title="Force cloud synchronization now"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Current Staff / Role Profile Card */}
        <div className="p-3 border-b border-red-900/60 bg-red-950/40 relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-red-900/40 hover:bg-red-900/70 border border-amber-400/50 transition text-left"
            title="Switch teacher account or view profile"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-amber-400 shadow-xs" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-red-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  {currentUser.role === 'super_admin' ? 'SA' : currentUser.role === 'admin' ? 'PR' : currentUser.role === 'exam_officer' ? 'EX' : 'TC'}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="font-bold text-xs text-amber-100 truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-amber-300/80 capitalize font-medium flex items-center space-x-1">
                    <span>{currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="font-mono text-amber-200">{currentUser.staffId}</span>
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
          </button>

          {/* Quick Profile & Sign Out actions */}
          {!isCollapsed && (
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {onOpenTeacherProfile && (
                <button
                  type="button"
                  onClick={onOpenTeacherProfile}
                  className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-bold text-[11px] rounded-lg shadow-sm border border-amber-300 transition"
                  title="Edit your Staff Profile & Biodata"
                >
                  <Edit className="w-3 h-3 text-red-950 shrink-0" />
                  <span className="truncate">Edit Profile</span>
                </button>
              )}

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-red-900 hover:bg-red-850 text-rose-200 hover:text-white font-bold text-[11px] rounded-lg shadow-sm border border-rose-500/50 transition"
                  title="Sign Out of College Portal"
                >
                  <LogOut className="w-3 h-3 text-rose-300 shrink-0" />
                  <span className="truncate">Sign Out</span>
                </button>
              )}
            </div>
          )}

          {/* Dedicated Sign In and Sign Up buttons if uncollapsed */}
          {!isCollapsed && onOpenTeacherSignupModal && (
            <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-red-900/40">
              <button
                type="button"
                onClick={() => {
                  onOpenTeacherSignupModal('login');
                  setIsMobileOpen(false);
                }}
                className="flex items-center justify-center space-x-1.5 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] rounded-lg transition"
                title="Staff Sign In with Staff ID / Email"
              >
                <LogIn className="w-3 h-3 text-slate-300" />
                <span>Switch / Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenTeacherSignupModal('signup');
                  setIsMobileOpen(false);
                }}
                className="flex items-center justify-center space-x-1.5 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] rounded-lg transition"
                title="Sign Up as New Teacher"
              >
                <UserPlus className="w-3 h-3 text-amber-400" />
                <span>Register Staff</span>
              </button>
            </div>
          )}

          {/* Teacher Role Switcher Dropdown */}
          {showRoleDropdown && (
            <div 
              className="absolute left-3 right-3 top-full mt-1 bg-[#540808] border-2 border-amber-400 rounded-xl shadow-2xl py-2 z-50 max-h-80 overflow-y-auto"
              onClick={() => setShowRoleDropdown(false)}
            >
              <div className="px-3 py-1.5 border-b border-red-900 text-[10px] font-bold text-amber-300 uppercase tracking-wider flex justify-between items-center">
                <span>Switch Teacher Account</span>
                <span className="text-amber-400 font-mono">{teachers.length} Staff</span>
              </div>

              {onOpenTeacherSignupModal && (
                <div className="p-2 border-b border-red-900/60 bg-red-950/50 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenTeacherSignupModal('login');
                    }}
                    className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenTeacherSignupModal('signup');
                    }}
                    className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-bold shadow-xs transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Sign Up</span>
                  </button>
                </div>
              )}

              {onOpenTeacherProfile && (
                <div className="p-2 border-b border-red-900 bg-red-950/60">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenTeacherProfile();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-bold transition shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-red-950" />
                    <span>Edit My Profile &amp; Biodata</span>
                  </button>
                </div>
              )}

              {currentUser.role === 'super_admin' ? (
                teachers.map(teacher => {
                  const isSelected = teacher.id === currentUser.id;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() => setCurrentUser(teacher)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-red-900/60 transition-colors ${
                        isSelected ? 'bg-amber-400 text-red-950 font-bold' : 'text-amber-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white truncate max-w-[170px]">{teacher.name}</div>
                        <div className="text-[10px] text-amber-200/80 flex items-center gap-1">
                          <span className="font-mono text-amber-300">{teacher.staffId}</span>
                          <span>•</span>
                          <span className="capitalize">{teacher.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-red-950 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-[11px] text-amber-200/90 bg-red-950/70 border-y border-red-900/60 text-center space-y-1">
                  <p className="font-bold text-white">Current Staff: {currentUser.name}</p>
                  <p className="text-[10px] text-amber-300/70">Staff roster switching is restricted to the Super Admin to protect individual staff marks & gradebooks.</p>
                </div>
              )}

              {(onSignOut || onLogoutToGate) && (
                <div className="p-2 border-t border-red-900 bg-red-950/80">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      if (onSignOut) {
                        onSignOut();
                      } else if (onLogoutToGate) {
                        onLogoutToGate();
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-amber-200 hover:text-white text-xs font-bold transition shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-300" />
                    <span>Sign Out &amp; Return to Portal Gate</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Academic Term Switcher */}
        {!isCollapsed ? (
          <div className="px-3 py-2.5 border-b border-red-900/60 bg-black/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                Academic Term:
              </span>
              <span className="text-[10px] font-bold text-amber-200/80">
                {activeTerm || settings.term}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'First Term', label: '1st Term' },
                { id: 'Second Term', label: '2nd Term' },
                { id: 'Third Term', label: '3rd Term' },
                { id: 'Cumulative', label: 'Cumulative' },
              ].map(({ id, label }) => {
                const isSelected = (activeTerm || settings.term) === id;
                return (
                  <button
                    key={id}
                    onClick={() => onSelectTerm && onSelectTerm(id)}
                    className={`py-1 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'bg-amber-400 text-red-950 shadow-md ring-1 ring-amber-300 font-black'
                        : 'bg-red-950/60 text-amber-100 hover:bg-red-900/80 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-2 border-b border-red-900/60 flex justify-center">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-red-950" title={`Active: ${activeTerm || settings.term}`}>
              {(activeTerm || settings.term).slice(0, 3)}
            </span>
          </div>
        )}

        {/* Scrollable Center: Navigation Links, Teacher Assessment Tools, College Tools */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
          
          {/* 1. TEACHING STAFF CORE: MARKS & COMMENTS */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-black tracking-wider text-amber-300/80 uppercase mb-1 flex items-center justify-between">
                <span>Teacher Workspace</span>
                <span className="text-[9px] bg-red-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/40">MARKS & COMMENTS</span>
              </div>
            )}

            {/* A. Continuous Assessment & Exams (Marks) */}
            <button
              onClick={() => {
                setActiveTab('gradebook');
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gradebook'
                  ? 'bg-amber-400 text-red-950 shadow-md border border-amber-300 font-black'
                  : 'text-amber-100/90 hover:text-white hover:bg-red-900/50'
              }`}
              title="Continuous Assessment (CA 1–4) & Terminal Exams Gradebook"
            >
              <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'gradebook' ? 'text-red-950' : 'text-amber-400'}`} />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">Mark Entry (CA & Exams)</span>
                  <span className="text-[9px] font-bold bg-red-950/60 text-amber-300 px-1.5 py-0.2 rounded">Marks</span>
                </div>
              )}
            </button>

            {/* B. Student & Class Comments */}
            <button
              onClick={() => {
                setActiveTab('comments');
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'comments'
                  ? 'bg-amber-400 text-red-950 shadow-md border border-amber-300 font-black'
                  : 'text-amber-100/90 hover:text-white hover:bg-red-900/50'
              }`}
              title="Student Remarks, Behavioral Traits & Psychomotor Domains"
            >
              <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'comments' ? 'text-red-950' : 'text-amber-400'}`} />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">Student Remarks & Comments</span>
                  <span className="text-[9px] font-bold bg-red-950/60 text-amber-300 px-1.5 py-0.2 rounded">Comments</span>
                </div>
              )}
            </button>

            {/* C. Learner's Report Sheet */}
            <button
              onClick={() => {
                setActiveTab('report-sheet');
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'report-sheet'
                  ? 'bg-amber-400 text-red-950 shadow-md border border-amber-300 font-black'
                  : 'text-amber-100/90 hover:text-white hover:bg-red-900/50'
              }`}
              title="Inspect Pupil Terminal Report Sheets"
            >
              <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'report-sheet' ? 'text-red-950' : 'text-amber-400'}`} />
              {!isCollapsed && <span className="truncate">Learner's Report Sheet</span>}
            </button>

            {/* D. Results Checker Gateway */}
            <button
              onClick={() => {
                setActiveTab('portal');
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'portal'
                  ? 'bg-amber-400 text-red-950 shadow-md border border-amber-300 font-black'
                  : 'text-amber-100/90 hover:text-white hover:bg-red-900/50'
              }`}
              title="Terminal Result Verification & Search"
            >
              <Search className={`w-4 h-4 shrink-0 ${activeTab === 'portal' ? 'text-red-950' : 'text-amber-400'}`} />
              {!isCollapsed && <span className="truncate">Results Checker</span>}
            </button>
          </div>

          {/* 2. TEACHER GRADING TOOLS */}
          <div className="space-y-1 pt-2 border-t border-red-900/60">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-black tracking-wider text-amber-300/80 uppercase mb-1 flex items-center justify-between">
                <span>Teacher Tools</span>
                <span className="text-[9px] text-amber-400 font-bold px-1.5 py-0.2 bg-red-950 rounded">QUICK</span>
              </div>
            )}

            {/* Missing Marks Audit Button */}
            {onOpenMissingMarksModal && (
              <button
                onClick={() => {
                  onOpenMissingMarksModal();
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-400/60 shadow-xs transition"
                title="Detect and audit missing student marks & unentered scores"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                {!isCollapsed && <span className="truncate font-black">Missing Marks Audit</span>}
              </button>
            )}

            {/* Direct Mark Entry */}
            {onOpenDirectScoreModal && (
              <button
                onClick={() => {
                  onOpenDirectScoreModal();
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-100 hover:text-white hover:bg-red-900/50 transition"
                title="Every teacher can input marks directly"
              >
                <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
                {!isCollapsed && <span className="truncate">Direct Mark Entry</span>}
              </button>
            )}
          </div>

          {/* 3. ADMINISTRATIVE OFFICE (STRICTLY FOR PRINCIPAL / ADMIN) */}
          <div className="space-y-1 pt-2 border-t border-red-900/60">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-black tracking-wider text-amber-300/80 uppercase mb-1 flex items-center justify-between">
                <span>Administrative Office</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer'
                    ? 'bg-amber-400 text-red-950 font-black'
                    : 'bg-red-950 text-slate-400 border border-red-800'
                }`}>
                  {currentUser.role === 'super_admin' ? 'SUPER ADMIN' : currentUser.role === 'admin' || currentUser.role === 'exam_officer' ? 'ADMIN' : 'RESTRICTED'}
                </span>
              </div>
            )}

            {/* If Super Admin / Admin: show full administrative suite */}
            {(currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer') ? (
              <>
                <button
                  onClick={() => {
                    setActiveTab('broadsheet');
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'broadsheet'
                      ? 'bg-amber-400 text-red-950 shadow-md border border-amber-300 font-black'
                      : 'text-amber-100/90 hover:text-white hover:bg-red-900/50'
                  }`}
                  title="Master Broadsheet & Class Rankings"
                >
                  <Table className={`w-4 h-4 shrink-0 ${activeTab === 'broadsheet' ? 'text-red-950' : 'text-amber-400'}`} />
                  {!isCollapsed && <span className="truncate">Master Broadsheet</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('registration');
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'registration'
                      ? 'bg-amber-400 text-red-950 shadow-md border border-amber-300 font-black'
                      : 'text-amber-100/90 hover:text-white hover:bg-red-900/50'
                  }`}
                  title="Student Registration & Enrollment Center"
                >
                  <UserPlus className={`w-4 h-4 shrink-0 ${activeTab === 'registration' ? 'text-red-950' : 'text-amber-400'}`} />
                  {!isCollapsed && <span className="truncate">Student Registration</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('teachers');
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'teachers'
                      ? 'bg-amber-400 text-red-950 shadow-md border border-amber-300 font-black'
                      : 'text-amber-100/90 hover:text-white hover:bg-red-900/50'
                  }`}
                  title="Staff Directory & RBAC Allocations"
                >
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'teachers' ? 'text-red-950' : 'text-amber-400'}`} />
                  {!isCollapsed && <span className="truncate">Staff RBAC ({teachers.length} Teachers)</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-amber-400 text-red-950 shadow-md border border-amber-300 font-black'
                      : 'text-amber-100/90 hover:text-white hover:bg-red-900/50'
                  }`}
                  title="College Academic Analytics"
                >
                  <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'analytics' ? 'text-red-950' : 'text-amber-400'}`} />
                  {!isCollapsed && <span className="truncate">Academic Analytics</span>}
                </button>

                {/* School Settings Hub (All Parameters Adjustable) */}
                {onOpenSchoolSettings && (
                  <button
                    onClick={() => {
                      onOpenSchoolSettings();
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 shadow-xs transition"
                    title="Customize School Profile, Identity, Theme, Classes, Subjects & Stamps"
                  >
                    <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="truncate">School Settings Hub</span>
                        <span className="text-[9px] bg-red-900 text-amber-300 px-1.5 py-0.2 rounded font-bold shrink-0">ALL ADJUSTABLE</span>
                      </div>
                    )}
                  </button>
                )}

                {/* Create Independent School with Gmail */}
                {onOpenSchoolOnboarding && (
                  <button
                    onClick={() => {
                      onOpenSchoolOnboarding();
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-emerald-200 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-400/50 shadow-xs transition"
                    title="Sign up an independent school using Gmail"
                  >
                    <School className="w-4 h-4 text-emerald-400 shrink-0" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="truncate">Register School (Gmail)</span>
                        <span className="text-[9px] bg-emerald-900 text-emerald-300 px-1.5 py-0.2 rounded font-bold shrink-0">NEW</span>
                      </div>
                    )}
                  </button>
                )}

                {/* Adjustable CA & Exams Studio (Admin) */}
                {onOpenPercentageModal && (
                  <button
                    onClick={() => {
                      onOpenPercentageModal();
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/60 shadow-xs transition"
                    title="Admin: Adjust CA 1-4 and Examination percentage weightings"
                  >
                    <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="truncate">Adjust CA & Exams</span>
                        <span className="text-[9px] bg-red-900 text-amber-300 px-1.5 py-0.2 rounded font-bold shrink-0">ADMIN</span>
                      </div>
                    )}
                  </button>
                )}

                {/* School Stamp */}
                {onOpenStampModal && (
                  <button
                    onClick={() => {
                      onOpenStampModal();
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-100 hover:text-white hover:bg-red-900/50 transition"
                    title="Upload Official School Stamp from PC"
                  >
                    <Stamp className="w-4 h-4 text-amber-400 shrink-0" />
                    {!isCollapsed && <span className="truncate">School Stamp</span>}
                  </button>
                )}

                {/* School Logo */}
                {onOpenLogoModal && (
                  <button
                    onClick={() => {
                      onOpenLogoModal();
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-100 hover:text-white hover:bg-red-900/50 transition"
                    title="Upload / Change School Crest Logo"
                  >
                    <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                    {!isCollapsed && <span className="truncate">School Logo</span>}
                  </button>
                )}

                {/* External Portal Import */}
                {onOpenExternalPortalModal && (
                  <button
                    onClick={() => {
                      onOpenExternalPortalModal();
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-100 hover:text-white hover:bg-red-900/50 transition"
                    title="Import students from another portal"
                  >
                    <Database className="w-4 h-4 text-amber-400 shrink-0" />
                    {!isCollapsed && <span className="truncate">Import External Portal</span>}
                  </button>
                )}

                {/* Excel Registration */}
                {onOpenExcelUploadModal && (
                  <button
                    onClick={() => {
                      onOpenExcelUploadModal();
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-emerald-200 hover:text-white hover:bg-emerald-950/60 transition"
                    title="Upload students via Excel spreadsheet"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    {!isCollapsed && <span className="truncate">Excel Registration</span>}
                  </button>
                )}
              </>
            ) : (
              /* Non-admin Teacher View: Explicit Administrative Office Lock Notice */
              !isCollapsed && (
                <div className="p-3 bg-red-950/70 border border-amber-400/30 rounded-xl space-y-1.5 text-left">
                  <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Administrative Office (Principal Only)</span>
                  </div>
                  <p className="text-[10px] text-amber-100/70 leading-tight">
                    Student registration, staff allocation, and grading percentage adjustments are restricted to the Principal's Office.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const principal = teachers.find(t => t.role === 'admin');
                      if (principal) setCurrentUser(principal);
                    }}
                    className="w-full mt-1 py-1 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-red-950 text-[10px] font-bold shadow-xs transition"
                  >
                    Switch to Principal (Admin) →
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom Pin: Google Sheets Sync, PWA Install, Google Auth, Lock Gate */}
        <div className="p-3 border-t-2 border-red-900/80 bg-red-950/90 space-y-2">
          {/* Google Sheets Sync Quick Tile */}
          <button
            onClick={() => {
              onOpenSyncModal();
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              accessToken
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 hover:bg-emerald-900'
                : 'bg-red-900/50 border-amber-400/50 text-amber-200 hover:bg-red-900'
            }`}
            title="Google Sheets Synchronization Hub"
          >
            <div className="flex items-center space-x-2 truncate">
              <Sheet className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <span className="truncate">
                  {accessToken ? 'Sheets Connected' : 'Google Sheets Sync'}
                </span>
              )}
            </div>
            {accessToken && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            )}
          </button>

          {/* PWA Install Button */}
          <div className="w-full flex justify-center">
            <PWAInstallButton variant="navbar" className="w-full justify-center" />
          </div>

          {/* Google Sign In / Sign Out & Lock Gate */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={handleGoogleAuth}
              disabled={isSigningIn}
              className="py-1.5 px-2 bg-amber-400 hover:bg-amber-300 text-red-950 font-black text-[11px] rounded-lg shadow-xs transition text-center truncate"
              title={firebaseUser ? `Signed in as ${firebaseUser.email}` : 'Sign in with Google Account'}
            >
              {firebaseUser ? 'Sign Out' : 'Google Sign In'}
            </button>

            {onOpenTeacherSignupModal && (
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  onOpenTeacherSignupModal('login');
                }}
                className="py-1.5 px-2 bg-black hover:bg-red-950 text-amber-300 hover:text-white font-bold text-[11px] rounded-lg border border-amber-400/60 shadow-xs transition flex items-center justify-center space-x-1"
                title="Sign in with teacher account"
              >
                <LogIn className="w-3 h-3 text-amber-400 shrink-0" />
                {!isCollapsed && <span>Sign In</span>}
              </button>
            )}
          </div>

          {/* Dedicated Full-Width Sign Out Action */}
          {onSignOut && (
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-red-950 via-[#7a0c0c] to-red-950 hover:from-red-900 hover:to-red-850 text-rose-200 hover:text-white font-black text-xs rounded-xl border border-rose-500/50 shadow-md transition"
              title="Sign Out of College Portal and Return to Gate"
            >
              <LogOut className="w-4 h-4 text-rose-300 shrink-0" />
              {!isCollapsed && <span>Sign Out of College Portal</span>}
            </button>
          )}
        </div>

      </aside>
    </>
  );
};
