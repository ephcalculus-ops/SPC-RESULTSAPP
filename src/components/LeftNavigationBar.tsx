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
    { id: 'teachers', label: teachers?.length > 1 ? `Teachers & RBAC (${teachers.length})` : 'Teachers & RBAC', shortLabel: 'Staff RBAC', icon: Users },
    { id: 'analytics', label: 'Academic Analytics', shortLabel: 'Analytics', icon: BarChart3 },
    { id: 'portal', label: 'Student / Parent Lookup', shortLabel: 'Lookup', icon: Search },
  ];

  const logoSrc = settings.schoolLogo || DEFAULT_SCHOOL_LOGO;

  return (
    <>
      {/* 1. SLIM TOP BAR FOR MOBILE & TABLET SCREENS (ROYAL BLUE) */}
      <div className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#1e40af] text-white border-b-2 border-blue-400 px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-lg bg-blue-950/80 text-blue-200 hover:bg-blue-900 border border-blue-400/50 transition"
            title="Open Left Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center border border-blue-400 overflow-hidden">
              <img src={logoSrc} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-black font-serif text-white leading-tight truncate max-w-[160px]">{settings.schoolName || 'ST PAUL COLLEGE'}</h2>
              <p className="text-[10px] text-blue-200 capitalize">{activeTab.replace('-', ' ')} • {activeTerm || settings.term}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {onOpenDirectScoreModal && (
            <button
              onClick={onOpenDirectScoreModal}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs shadow-xs border border-amber-200"
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
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-black text-xs shadow-xs"
              title="Teacher Sign Up"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign Up</span>
            </button>
          )}

          {onOpenTeacherProfile && (
            <button
              onClick={onOpenTeacherProfile}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-blue-200 font-bold text-xs border border-blue-400/40 shadow-xs"
              title="Edit Staff Profile & Biodata"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-blue-950 hover:bg-black text-rose-300 hover:text-white font-bold text-xs border border-rose-500/50 shadow-xs"
              title="Sign Out of College Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}

          {onOpenMissingMarksModal && (
            <button
              onClick={onOpenMissingMarksModal}
              className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs"
              title="Audit Missing Marks"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenSyncModal}
            className={`p-1.5 rounded-lg border text-xs ${
              accessToken ? 'bg-emerald-900 text-emerald-300 border-emerald-500' : 'bg-blue-950 text-blue-200 border-blue-400/50'
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

      {/* 3. MAIN LEFT NAVIGATION BAR (ROYAL BLUE) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:static lg:z-auto bg-gradient-to-b from-[#0a192f] via-[#1e3a8a] to-[#172554] text-white border-r-2 border-blue-400/80 shadow-2xl flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header: School Crest & College Title */}
        <div className="p-3.5 border-b border-blue-900/80 bg-blue-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div
              onClick={() => (currentUser.role === 'super_admin' || currentUser.role === 'admin') && onOpenLogoModal && onOpenLogoModal()}
              className={`w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg border-2 border-blue-400 shrink-0 overflow-hidden ${
                currentUser.role === 'super_admin' || currentUser.role === 'admin' ? 'cursor-pointer hover:scale-105' : ''
              }`}
              title={currentUser.role === 'super_admin' || currentUser.role === 'admin' ? 'Click to change School Logo' : `${settings.schoolName} Official Crest`}
            >
              <img src={logoSrc} alt="School Crest" className="max-h-full max-w-full object-contain" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-sm font-black font-serif text-white truncate tracking-wide" title={settings.schoolName}>
                    {settings.schoolName || 'ST PAUL COLLEGE'}
                  </h1>
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-400 text-blue-950 uppercase tracking-wider truncate max-w-[100px]">
                    {settings.schoolAddress ? settings.schoolAddress.split(',')[0] : 'CAMPUS'}
                  </span>
                  <span className="text-[10px] text-blue-200/80 font-mono truncate">{settings.session}</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Mobile Close Button */}
          <div className="flex items-center">
            {/* Mobile close */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-blue-200/80 hover:text-white hover:bg-blue-900/70 transition border border-blue-400/40"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4 text-blue-300" /> : <ChevronLeft className="w-4 h-4 text-blue-300" />}
            </button>
          </div>
        </div>

        {/* Main College Institution Badge */}
        {!isCollapsed && (
          <div className="px-2.5 py-1.5 border-b border-blue-900/60 bg-black/40">
            <div className="w-full flex items-center justify-between p-1.5 rounded-xl bg-blue-950/70 border border-blue-400/40 text-left">
              <div className="flex items-center space-x-2 min-w-0">
                <School className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-blue-100 truncate">
                    {settings.schoolName || 'ST PAUL COLLEGE'}
                  </div>
                  <div className="text-[9px] text-blue-300/80 font-mono truncate">
                    {settings.schoolMotto || 'Main College Campus • FCT Abuja'}
                  </div>
                </div>
              </div>
              {onOpenSchoolSettings && (
                <button
                  type="button"
                  onClick={onOpenSchoolSettings}
                  className="p-1 rounded text-blue-300 hover:text-white hover:bg-blue-900/80 transition"
                  title="College Settings Hub"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Portal Gate Quick Jump Button */}
        {onOpenPortalGate && (
          <div className="p-2 border-b border-blue-900/60 bg-black/30">
            <button
              onClick={() => {
                onOpenPortalGate();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md border border-blue-400 transition"
              title="Return to the St. Paul College Portal Gate"
            >
              <DoorOpen className="w-4 h-4 text-white shrink-0" />
              {!isCollapsed && <span>Return to Portal Gate</span>}
            </button>
          </div>
        )}

        {/* Cloud Firestore Synchronization Live Status Strip */}
        <div className="px-3 py-1.5 bg-blue-950/90 border-b border-blue-900/60 flex items-center justify-between text-[10px]">
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
              className="p-1 rounded text-blue-300 hover:text-white hover:bg-blue-900 transition"
              title="Force cloud synchronization now"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Current Staff / Role Profile Card */}
        <div className="p-3 border-b border-blue-900/60 bg-blue-950/40 relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-900/40 hover:bg-blue-900/70 border border-blue-400/50 transition text-left"
            title="Switch teacher account or view profile"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-blue-400 shadow-xs" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-400 text-blue-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  {currentUser.role === 'super_admin' ? 'SA' : currentUser.role === 'admin' ? 'PR' : currentUser.role === 'exam_officer' ? 'EX' : 'TC'}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-blue-200 capitalize font-medium flex items-center space-x-1">
                    <span>{currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="font-mono text-blue-300">{currentUser.staffId}</span>
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-blue-300 shrink-0" />}
          </button>

          {/* Quick Profile & Sign Out actions */}
          {!isCollapsed && (
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {onOpenTeacherProfile && (
                <button
                  type="button"
                  onClick={onOpenTeacherProfile}
                  className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] rounded-lg shadow-sm border border-blue-400 transition"
                  title="Edit your Staff Profile & Biodata"
                >
                  <Edit className="w-3 h-3 text-white shrink-0" />
                  <span className="truncate">Edit Profile</span>
                </button>
              )}

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-blue-950 hover:bg-slate-900 text-rose-300 hover:text-white font-bold text-[11px] rounded-lg shadow-sm border border-rose-500/50 transition"
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
            <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-blue-900/40">
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
                className="flex items-center justify-center space-x-1.5 py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg transition"
                title="Sign Up as New Teacher"
              >
                <UserPlus className="w-3 h-3 text-white" />
                <span>Register Staff</span>
              </button>
            </div>
          )}

          {/* Teacher Role Switcher Dropdown */}
          {showRoleDropdown && (
            <div 
              className="absolute left-3 right-3 top-full mt-1 bg-[#172554] border-2 border-blue-400 rounded-xl shadow-2xl py-2 z-50 max-h-80 overflow-y-auto"
              onClick={() => setShowRoleDropdown(false)}
            >
              <div className="px-3 py-1.5 border-b border-blue-800 text-[10px] font-bold text-blue-200 uppercase tracking-wider flex justify-between items-center">
                <span>Switch Teacher Account</span>
                <span className="text-blue-300 font-mono">{teachers.length} Staff</span>
              </div>

              {onOpenTeacherSignupModal && (
                <div className="p-2 border-b border-blue-800/60 bg-blue-950/50 grid grid-cols-2 gap-1.5">
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
                    className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Sign Up</span>
                  </button>
                </div>
              )}

              {onOpenTeacherProfile && (
                <div className="p-2 border-b border-blue-800 bg-blue-950/60">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenTeacherProfile();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-white" />
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
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-800/60 transition-colors ${
                        isSelected ? 'bg-blue-600 text-white font-bold' : 'text-blue-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white truncate max-w-[170px]">{teacher.name}</div>
                        <div className="text-[10px] text-blue-200/80 flex items-center gap-1">
                          <span className="font-mono text-blue-300">{teacher.staffId}</span>
                          <span>•</span>
                          <span className="capitalize">{teacher.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-[11px] text-blue-200 bg-blue-950/70 border-y border-blue-800/60 text-center space-y-1">
                  <p className="font-bold text-white">Current Staff: {currentUser.name}</p>
                  <p className="text-[10px] text-blue-300/70">Staff roster switching is restricted to the Super Admin to protect individual staff marks & gradebooks.</p>
                </div>
              )}

              {(onSignOut || onLogoutToGate) && (
                <div className="p-2 border-t border-blue-800 bg-blue-950/80">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      if (onSignOut) {
                        onSignOut();
                      } else if (onLogoutToGate) {
                        onLogoutToGate();
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-blue-100 hover:text-white text-xs font-bold transition shadow-xs"
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
          <div className="px-3 py-2.5 border-b border-blue-900/60 bg-black/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                Academic Term:
              </span>
              <span className="text-[10px] font-bold text-blue-200">
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
                        ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-300 font-black'
                        : 'bg-blue-950/60 text-blue-100 hover:bg-blue-900/80 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-2 border-b border-blue-900/60 flex justify-center">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-600 text-white" title={`Active: ${activeTerm || settings.term}`}>
              {(activeTerm || settings.term).slice(0, 3)}
            </span>
          </div>
        )}

        {/* Scrollable Center: Navigation Links, Teacher Assessment Tools, College Tools */}
        {/* Scrollable Center: Navigation Links, Teacher Assessment Tools, College Tools */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
          
          {/* 1. TEACHING STAFF CORE: MARKS & COMMENTS */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-black tracking-wider text-blue-300/80 uppercase mb-1 flex items-center justify-between">
                <span>Teacher Workspace</span>
                <span className="text-[9px] bg-blue-950 text-blue-200 px-1.5 py-0.2 rounded border border-blue-400/40">MARKS & COMMENTS</span>
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
                  ? 'bg-blue-600 text-white shadow-md border border-blue-400 font-black'
                  : 'text-blue-100/90 hover:text-white hover:bg-blue-900/50'
              }`}
              title="Continuous Assessment (CA 1–4) & Terminal Exams Gradebook"
            >
              <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'gradebook' ? 'text-white' : 'text-blue-300'}`} />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">Mark Entry (CA & Exams)</span>
                  <span className="text-[9px] font-bold bg-blue-950/60 text-blue-200 px-1.5 py-0.2 rounded">Marks</span>
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
                  ? 'bg-blue-600 text-white shadow-md border border-blue-400 font-black'
                  : 'text-blue-100/90 hover:text-white hover:bg-blue-900/50'
              }`}
              title="Student Remarks, Behavioral Traits & Psychomotor Domains"
            >
              <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'comments' ? 'text-white' : 'text-blue-300'}`} />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">Student Remarks & Comments</span>
                  <span className="text-[9px] font-bold bg-blue-950/60 text-blue-200 px-1.5 py-0.2 rounded">Comments</span>
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
                  ? 'bg-blue-600 text-white shadow-md border border-blue-400 font-black'
                  : 'text-blue-100/90 hover:text-white hover:bg-blue-900/50'
              }`}
              title="Inspect Pupil Terminal Report Sheets"
            >
              <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'report-sheet' ? 'text-white' : 'text-blue-300'}`} />
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
                  ? 'bg-blue-600 text-white shadow-md border border-blue-400 font-black'
                  : 'text-blue-100/90 hover:text-white hover:bg-blue-900/50'
              }`}
              title="Terminal Result Verification & Search"
            >
              <Search className={`w-4 h-4 shrink-0 ${activeTab === 'portal' ? 'text-white' : 'text-blue-300'}`} />
              {!isCollapsed && <span className="truncate">Results Checker</span>}
            </button>
          </div>

          {/* 2. TEACHER GRADING TOOLS */}
          <div className="space-y-1 pt-2 border-t border-blue-900/60">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-black tracking-wider text-blue-300/80 uppercase mb-1 flex items-center justify-between">
                <span>Teacher Tools</span>
                <span className="text-[9px] text-blue-300 font-bold px-1.5 py-0.2 bg-blue-950 rounded border border-blue-500/30">QUICK</span>
              </div>
            )}

            {/* Missing Marks Audit Button */}
            {onOpenMissingMarksModal && (
              <button
                onClick={() => {
                  onOpenMissingMarksModal();
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600/30 hover:bg-blue-600/40 text-blue-100 hover:text-white border border-blue-400/60 shadow-xs transition"
                title="Detect and audit missing student marks & unentered scores"
              >
                <ShieldAlert className="w-4 h-4 text-blue-300 shrink-0" />
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
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-blue-100 hover:text-white hover:bg-blue-900/50 transition"
                title="Every teacher can input marks directly"
              >
                <BookOpen className="w-4 h-4 text-blue-300 shrink-0" />
                {!isCollapsed && <span className="truncate">Direct Mark Entry</span>}
              </button>
            )}
          </div>

          {/* 3. ADMINISTRATIVE OFFICE (STRICTLY FOR PRINCIPAL / ADMIN) */}
          <div className="space-y-1 pt-2 border-t border-blue-900/60">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-black tracking-wider text-blue-300/80 uppercase mb-1 flex items-center justify-between">
                <span>Administrative Office</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer'
                    ? 'bg-blue-400 text-blue-950 font-black'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
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
                      ? 'bg-blue-600 text-white shadow-md border border-blue-400 font-black'
                      : 'text-blue-100/90 hover:text-white hover:bg-blue-900/50'
                  }`}
                  title="Master Broadsheet & Class Rankings"
                >
                  <Table className={`w-4 h-4 shrink-0 ${activeTab === 'broadsheet' ? 'text-white' : 'text-blue-300'}`} />
                  {!isCollapsed && <span className="truncate">Master Broadsheet</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('registration');
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'registration'
                      ? 'bg-blue-600 text-white shadow-md border border-blue-400 font-black'
                      : 'text-blue-100/90 hover:text-white hover:bg-blue-900/50'
                  }`}
                  title="Student Registration & Enrollment Center"
                >
                  <UserPlus className={`w-4 h-4 shrink-0 ${activeTab === 'registration' ? 'text-white' : 'text-blue-300'}`} />
                  {!isCollapsed && <span className="truncate">Student Registration</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('teachers');
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'teachers'
                      ? 'bg-blue-600 text-white shadow-md border border-blue-400 font-black'
                      : 'text-blue-100/90 hover:text-white hover:bg-blue-900/50'
                  }`}
                  title="Staff Directory & RBAC Allocations"
                >
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'teachers' ? 'text-white' : 'text-blue-300'}`} />
                  {!isCollapsed && <span className="truncate">Staff RBAC ({teachers.length} Teachers)</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-blue-600 text-white shadow-md border border-blue-400 font-black'
                      : 'text-blue-100/90 hover:text-white hover:bg-blue-900/50'
                  }`}
                  title="College Academic Analytics"
                >
                  <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'analytics' ? 'text-white' : 'text-blue-300'}`} />
                  {!isCollapsed && <span className="truncate">Academic Analytics</span>}
                </button>

                {/* School Settings Hub (All Parameters Adjustable) */}
                {onOpenSchoolSettings && (
                  <button
                    onClick={() => {
                      onOpenSchoolSettings();
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-blue-100 hover:text-white bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400 shadow-xs transition"
                    title="Customize School Profile, Identity, Theme, Classes, Subjects & Stamps"
                  >
                    <Settings className="w-4 h-4 text-blue-300 shrink-0" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="truncate">School Settings Hub</span>
                        <span className="text-[9px] bg-blue-900 text-blue-200 px-1.5 py-0.2 rounded font-bold shrink-0">ALL ADJUSTABLE</span>
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
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-blue-100 hover:text-white bg-blue-600/15 hover:bg-blue-600/25 border border-blue-400/60 shadow-xs transition"
                    title="Admin: Adjust CA 1-4 and Examination percentage weightings"
                  >
                    <Sliders className="w-4 h-4 text-blue-300 shrink-0" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="truncate">Adjust CA & Exams</span>
                        <span className="text-[9px] bg-blue-900 text-blue-200 px-1.5 py-0.2 rounded font-bold shrink-0">ADMIN</span>
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
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-blue-100 hover:text-white hover:bg-blue-900/50 transition"
                    title="Upload Official School Stamp from PC"
                  >
                    <Stamp className="w-4 h-4 text-blue-300 shrink-0" />
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
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-blue-100 hover:text-white hover:bg-blue-900/50 transition"
                    title="Upload / Change School Crest Logo"
                  >
                    <Upload className="w-4 h-4 text-blue-300 shrink-0" />
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
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-blue-100 hover:text-white hover:bg-blue-900/50 transition"
                    title="Import students from another portal"
                  >
                    <Database className="w-4 h-4 text-blue-300 shrink-0" />
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
                    title="Upload students via CSV file or Excel spreadsheet"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    {!isCollapsed && <span className="truncate">Upload CSV / Excel</span>}
                  </button>
                )}
              </>
            ) : (
              /* Non-admin Teacher View: Explicit Administrative Office Lock Notice */
              !isCollapsed && (
                <div className="p-3 bg-blue-950/70 border border-blue-400/30 rounded-xl space-y-1.5 text-left">
                  <div className="flex items-center space-x-1.5 text-blue-200 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Administrative Office (Principal Only)</span>
                  </div>
                  <p className="text-[10px] text-blue-100/70 leading-tight">
                    Student registration, staff allocation, and grading percentage adjustments are restricted to the Principal's Office.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const principal = teachers.find(t => t.role === 'admin');
                      if (principal) setCurrentUser(principal);
                    }}
                    className="w-full mt-1 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-xs transition"
                  >
                    Switch to Principal (Admin) →
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom Pin: Google Sheets Sync, PWA Install, Google Auth, Lock Gate */}
        <div className="p-3 border-t-2 border-blue-900/80 bg-blue-950/90 space-y-2">
          {/* Google Sheets Sync Quick Tile */}
          <button
            onClick={() => {
              onOpenSyncModal();
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              accessToken
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 hover:bg-emerald-900'
                : 'bg-blue-900/50 border-blue-400/50 text-blue-200 hover:bg-blue-900'
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
              className="py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] rounded-lg shadow-xs transition text-center truncate"
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
                className="py-1.5 px-2 bg-blue-900 hover:bg-blue-800 text-blue-200 hover:text-white font-bold text-[11px] rounded-lg border border-blue-400/60 shadow-xs transition flex items-center justify-center space-x-1"
                title="Sign in with teacher account"
              >
                <LogIn className="w-3 h-3 text-blue-300 shrink-0" />
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
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 hover:from-slate-900 hover:to-blue-900 text-rose-300 hover:text-white font-black text-xs rounded-xl border border-rose-500/50 shadow-md transition"
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
