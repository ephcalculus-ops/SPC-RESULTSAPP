/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from './services/store';
import { initAuth } from './services/firebaseAuth';
import { User as FirebaseUser } from 'firebase/auth';
import { LeftNavigationBar } from './components/LeftNavigationBar';
import { TeacherGradebook } from './components/TeacherGradebook';
import { ClassBroadsheet } from './components/ClassBroadsheet';
import { ReportCardView } from './components/ReportCardView';
import { TeacherManagement } from './components/TeacherManagement';
import { StudentPortal } from './components/StudentPortal';
import { AnalyticsView } from './components/AnalyticsView';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { ScorePercentageSettingsModal } from './components/ScorePercentageSettingsModal';
import { SchoolLogoUploadModal } from './components/SchoolLogoUploadModal';
import { StudentRegistrationCenter } from './components/StudentRegistrationCenter';
import { ExternalPortalImportModal } from './components/ExternalPortalImportModal';
import { TeacherSignupModal } from './components/TeacherSignupModal';
import { ClassCommentsModal } from './components/ClassCommentsModal';
import { StudentPassportUploadModal } from './components/StudentPassportUploadModal';
import { BulkPromotionModal } from './components/BulkPromotionModal';
import { SchoolStampUploadModal } from './components/SchoolStampUploadModal';
import { DirectScoreInputModal } from './components/DirectScoreInputModal';
import { StudentExcelUploadModal } from './components/StudentExcelUploadModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MissingMarksAuditModal } from './components/MissingMarksAuditModal';
import { PortalGate } from './components/PortalGate';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';
import { SchoolOnboardingModal } from './components/SchoolOnboardingModal';
import { StudentCommentsWorkspace } from './components/StudentCommentsWorkspace';
import { TeacherProfileModal } from './components/TeacherProfileModal';
import { StaffPasswordModal } from './components/StaffPasswordModal';
import { isStaffPortalUnlocked, clearStaffPortalUnlocked } from './config/portalSecurity';
import { logout } from './services/firebaseAuth';
import { Student, Teacher } from './types';
import { 
  Lock, 
  Unlock, 
  History, 
  RotateCcw, 
  Sheet, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  GraduationCap, 
  Stamp, 
  BookOpen, 
  FileSpreadsheet, 
  ArrowLeft,
  LogOut,
  UserCheck,
  Smartphone
} from 'lucide-react';

export default function App() {
  const store = useSchoolStore();
  const [activeTab, setActiveTab] = useState<string>('gradebook');
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(store.students[0]);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isPercentageModalOpen, setIsPercentageModalOpen] = useState<boolean>(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState<boolean>(false);
  const [isDirectScoreModalOpen, setIsDirectScoreModalOpen] = useState<boolean>(false);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState<boolean>(false);
  const [isExternalPortalModalOpen, setIsExternalPortalModalOpen] = useState<boolean>(false);
  const [isTeacherSignupModalOpen, setIsTeacherSignupModalOpen] = useState<boolean>(false);
  const [isClassCommentsModalOpen, setIsClassCommentsModalOpen] = useState<boolean>(false);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState<boolean>(false);
  const [isBulkPromotionModalOpen, setIsBulkPromotionModalOpen] = useState<boolean>(false);
  const [modalClass, setModalClass] = useState<string>('SSS 1 A');
  const [bulkPromotionClass, setBulkPromotionClass] = useState<string>('ALL');
  const [directScoreClass, setDirectScoreClass] = useState<string>('JSS 1 A');
  const [directScoreSubject, setDirectScoreSubject] = useState<string>('MATHEMATICS');
  const [isMissingMarksModalOpen, setIsMissingMarksModalOpen] = useState<boolean>(false);
  const [missingMarksClass, setMissingMarksClass] = useState<string>('ALL');
  const [missingMarksSubject, setMissingMarksSubject] = useState<string>('ALL');
  // Web app landing page is the Portal Gate where teachers can sign up & log in
  const [isPortalGateOpen, setIsPortalGateOpen] = useState<boolean>(true);
  const [isTeacherProfileModalOpen, setIsTeacherProfileModalOpen] = useState<boolean>(false);
  const [isSchoolSettingsModalOpen, setIsSchoolSettingsModalOpen] = useState<boolean>(false);
  const [isSchoolOnboardingModalOpen, setIsSchoolOnboardingModalOpen] = useState<boolean>(false);

  // Sign out function that clears local session, signs out Firebase if active, and returns to Portal Gate
  const handleSignOut = async () => {
    try {
      clearStaffPortalUnlocked();
      localStorage.removeItem('stpaul_auth_teacher_id');
      if (firebaseUser) {
        await logout();
      }
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setIsPortalGateOpen(true);
  };

  // Staff Password Gate Modal for app-level entry (e.g. from Navigation or Gradebook bar)
  const [isStaffPasswordModalOpen, setIsStaffPasswordModalOpen] = useState<boolean>(false);
  const [pendingAuthModalMode, setPendingAuthModalMode] = useState<'signup' | 'login'>('signup');

  // Teacher Authentication & Sign Up mode state
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'login'>('signup');

  const handleOpenTeacherSignupModal = (mode: 'signup' | 'login' = 'signup') => {
    if (isStaffPortalUnlocked()) {
      setAuthModalMode(mode);
      setIsTeacherSignupModalOpen(true);
    } else {
      setPendingAuthModalMode(mode);
      setIsStaffPasswordModalOpen(true);
    }
  };

  // Restore authenticated teacher from storage if valid
  useEffect(() => {
    try {
      const savedTeacherId = localStorage.getItem('stpaul_auth_teacher_id');
      if (savedTeacherId) {
        const match = store.teachers.find(t => t.id === savedTeacherId);
        if (match && store.currentUser.id !== match.id) {
          store.setCurrentUser(match);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [store.teachers]);

  // Open modals with pre-selected class if given
  const handleOpenClassCommentsModal = (cls?: string) => {
    if (cls) setModalClass(cls);
    setIsClassCommentsModalOpen(true);
  };

  const handleOpenPassportModal = (cls?: string) => {
    if (cls) setModalClass(cls);
    setIsPassportModalOpen(true);
  };

  const handleOpenBulkPromotionModal = (cls?: string) => {
    if (cls) setBulkPromotionClass(cls);
    setIsBulkPromotionModalOpen(true);
  };

  const handleOpenDirectScoreModal = (cls?: string, subj?: string) => {
    const defaultCls = cls || store.currentUser.assignedClasses[0] || 'JSS 1 A';
    const defaultSubj = subj || store.currentUser.assignedSubjects[0] || 'MATHEMATICS';
    setDirectScoreClass(defaultCls);
    setDirectScoreSubject(defaultSubj);
    setIsDirectScoreModalOpen(true);
  };

  const handleOpenMissingMarksModal = (cls?: string, subj?: string) => {
    if (cls) setMissingMarksClass(cls);
    if (subj) setMissingMarksSubject(subj);
    setIsMissingMarksModalOpen(true);
  };

  // Firebase authentication state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setFirebaseUser(user);
        setAccessToken(token);
      },
      () => {
        setFirebaseUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When student selected for report sheet
  const handleSelectStudentForReport = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab('report-sheet');
  };

  // Keep selectedStudent synced with latest updates and guard against null access
  const currentStudent = selectedStudent
    ? (store.students.find(s => s.id === selectedStudent.id) || store.students[0])
    : store.students[0];

  useEffect(() => {
    if (!selectedStudent && store.students.length > 0) {
      setSelectedStudent(store.students[0]);
    }
  }, [store.students, selectedStudent]);

  // Strict isolation: Reset student selection and class selectors whenever school changes
  useEffect(() => {
    setSelectedStudent(store.students[0]);
    const firstCls = store.settings.classes?.[0] || (store.settings.section === 'primary' ? 'PRIMARY 1 A' : 'JSS 1 A');
    setDirectScoreClass(firstCls);
    setModalClass(firstCls);
    setBulkPromotionClass('ALL');
  }, [store.activeSchoolId]);

  // ============================================================
  // MAJESTIC PORTAL GATE (Teachers & Academic Staff + Results Checker)
  // ============================================================
  if (isPortalGateOpen) {
    return (
      <>
        <PortalGate
          settings={store.settings}
          teachers={store.teachers}
          students={store.students}
          onRegisterTeacher={store.registerTeacher}
          onLoginTeacher={store.loginTeacher}
          onAuthenticateSuccess={(teacher) => {
            store.setCurrentUser(teacher);
            setIsPortalGateOpen(false);
            setActiveTab('gradebook');
          }}
          onEnterPortalDirectly={() => setIsPortalGateOpen(false)}
          onSelectStudentForReport={(student) => {
            handleSelectStudentForReport(student);
            setIsPortalGateOpen(false);
            setActiveTab('report-sheet');
          }}
          onUpdateStudent={store.updateStudent}
          schoolRegistry={store.schoolRegistry}
          activeSchoolId={store.activeSchoolId}
          onSwitchSchool={store.switchSchool}
          onOpenSchoolOnboarding={() => setIsSchoolOnboardingModalOpen(true)}
        />

        {/* Independent School Registration & Gmail Onboarding Wizard */}
        <SchoolOnboardingModal
          isOpen={isSchoolOnboardingModalOpen}
          onClose={() => setIsSchoolOnboardingModalOpen(false)}
          firebaseUser={firebaseUser}
          onCreateSchool={store.createIndependentSchool}
          onAuthenticateSuccess={(teacher) => {
            store.setCurrentUser(teacher);
            setIsPortalGateOpen(false);
            setIsSchoolOnboardingModalOpen(false);
            setActiveTab('gradebook');
          }}
        />
      </>
    );
  }

  // ============================================================
  // MAIN COLLEGE PORTAL (Direct Access with Sign In & Sign Up)
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Left Navigation Bar */}
      <LeftNavigationBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={store.currentUser}
        setCurrentUser={store.setCurrentUser}
        teachers={store.teachers}
        settings={store.settings}
        sheetsConfig={store.sheetsConfig}
        firebaseUser={firebaseUser}
        accessToken={accessToken}
        activeTerm={store.activeTerm}
        onSelectTerm={store.setActiveTerm}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenPercentageModal={() => setIsPercentageModalOpen(true)}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
        onOpenStampModal={() => setIsStampModalOpen(true)}
        onOpenDirectScoreModal={() => handleOpenDirectScoreModal()}
        onOpenExternalPortalModal={() => setIsExternalPortalModalOpen(true)}
        onOpenTeacherSignupModal={handleOpenTeacherSignupModal}
        onOpenExcelUploadModal={() => setIsExcelUploadModalOpen(true)}
        onOpenMissingMarksModal={() => handleOpenMissingMarksModal()}
        onOpenPortalGate={() => setIsPortalGateOpen(true)}
        onLogoutToGate={handleSignOut}
        onSignOut={handleSignOut}
        onOpenTeacherProfile={() => setIsTeacherProfileModalOpen(true)}
        cloudSyncStatus={store.cloudSyncInfo}
        onForceCloudSync={store.forceCloudSync}
        schoolRegistry={store.schoolRegistry}
        activeSchoolId={store.activeSchoolId}
        onSwitchSchool={store.switchSchool}
        onOpenSchoolSettings={() => setIsSchoolSettingsModalOpen(true)}
        onOpenSchoolOnboarding={() => setIsSchoolOnboardingModalOpen(true)}
      />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'registration' && (
          <StudentRegistrationCenter
            students={store.students}
            currentUser={store.currentUser}
            settings={store.settings}
            onRegisterStudent={store.registerStudent}
            onUpdateStudent={store.updateStudent}
            onDeleteStudent={store.deleteStudent}
            onImportExternalStudents={store.importExternalPortalStudents}
            onSelectStudentForReport={handleSelectStudentForReport}
            onOpenPassportModal={handleOpenPassportModal}
            onOpenClassCommentsModal={handleOpenClassCommentsModal}
            onOpenBulkPromotionModal={handleOpenBulkPromotionModal}
            onOpenExcelUploadModal={() => setIsExcelUploadModalOpen(true)}
          />
        )}

        {activeTab === 'gradebook' && (
          <TeacherGradebook
            students={store.students}
            currentUser={store.currentUser}
            settings={store.settings}
            activeTerm={store.activeTerm}
            onSelectTerm={store.setActiveTerm}
            canEditSubject={store.canEditSubject}
            updateStudentScore={store.updateStudentScore}
            batchUpdateSubjectScores={store.batchUpdateSubjectScores}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onOpenTeacherSignupModal={handleOpenTeacherSignupModal}
            onOpenClassCommentsModal={handleOpenClassCommentsModal}
            onOpenPassportModal={handleOpenPassportModal}
            onOpenDirectScoreModal={handleOpenDirectScoreModal}
            onOpenMissingMarksModal={handleOpenMissingMarksModal}
            onOpenPercentageModal={() => setIsPercentageModalOpen(true)}
            addLog={store.addLog}
          />
        )}

        {activeTab === 'comments' && (
          <StudentCommentsWorkspace
            students={store.students}
            currentUser={store.currentUser}
            settings={store.settings}
            activeTerm={store.activeTerm}
            onUpdateAssessments={store.updateStudentAssessments}
            onSelectStudentForReport={handleSelectStudentForReport}
            addLog={store.addLog}
          />
        )}

        {activeTab === 'broadsheet' && (
          <ClassBroadsheet
            students={store.students}
            settings={store.settings}
            currentUser={store.currentUser}
            activeTerm={store.activeTerm}
            onSelectTerm={store.setActiveTerm}
            onSelectStudentForReport={handleSelectStudentForReport}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onOpenBulkPromotionModal={handleOpenBulkPromotionModal}
            onOpenDirectScoreModal={handleOpenDirectScoreModal}
            onOpenMissingMarksModal={handleOpenMissingMarksModal}
            onOpenPercentageModal={() => setIsPercentageModalOpen(true)}
          />
        )}

        {activeTab === 'report-sheet' && (
          <ReportCardView
            students={store.students}
            selectedStudent={currentStudent}
            onSelectStudent={setSelectedStudent}
            currentUser={store.currentUser}
            settings={store.settings}
            activeTerm={store.activeTerm}
            onSelectTerm={store.setActiveTerm}
            canEditFormTeacherSection={store.canEditFormTeacherSection}
            canEditPrincipalSection={store.canEditPrincipalSection}
            canUpdatePassport={store.canUpdatePassport}
            updateStudentAssessments={store.updateStudentAssessments}
            updatePrincipalComment={store.updatePrincipalComment}
            onUpdateStudentPassport={store.updateStudentPassport}
            onUpdateStudent={store.updateStudent}
            onOpenClassCommentsModal={handleOpenClassCommentsModal}
            onOpenPassportModal={handleOpenPassportModal}
            onOpenStampModal={() => setIsStampModalOpen(true)}
          />
        )}

        {activeTab === 'teachers' && (
          <TeacherManagement
            teachers={store.teachers}
            currentUser={store.currentUser}
            updateTeacher={store.updateTeacher}
            batchUpdateTeachers={store.batchUpdateTeachers}
            registerTeacher={store.registerTeacher}
            setCurrentUser={store.setCurrentUser}
            onOpenTeacherSignupModal={() => setIsTeacherSignupModalOpen(true)}
            onNavigateToGradebook={() => setActiveTab('gradebook')}
            onOpenDirectScoreModal={handleOpenDirectScoreModal}
            onDeleteTeacher={store.deleteTeacher}
            onRestoreOfficialTeachers={store.restoreOfficialTeachers}
            onSyncTeachersNow={store.syncTeachersNow}
            cloudSyncStatus={store.cloudSyncInfo}
            onSignOut={handleSignOut}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            students={store.students}
            settings={store.settings}
            activeTerm={store.activeTerm}
            onSelectTerm={store.setActiveTerm}
            onSelectStudentForReport={handleSelectStudentForReport}
          />
        )}

        {activeTab === 'portal' && (
          <StudentPortal
            students={store.students}
            settings={store.settings}
            onSelectStudentForReport={handleSelectStudentForReport}
            onUpdateStudent={store.updateStudent}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {/* Floating Quick Action Footer Strip (Admin controls & Audit Log) */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 sm:px-8 print:hidden shadow-inner sticky bottom-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 text-slate-500">
            <span className="font-semibold text-slate-700">
              ST PAUL COLLEGE, GWAGWALADA
            </span>
            <span>•</span>
            <span>{store.students.length} Students Enrolled</span>
            <span>•</span>
            <span>{store.teachers.length} Academic Staff</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Super Admin Score Percentages Configuration */}
            {(store.currentUser.role === 'super_admin' || store.currentUser.role === 'admin') && (
              <button
                onClick={() => setIsPercentageModalOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg border border-amber-400 shadow-sm transition"
                title="Super Admin: Adjust Junior / Senior score percentages (Max 100%)"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Score Weights (Max 100%)</span>
              </button>
            )}

            {/* Term Lock Switch (Admin Only) */}
            {(store.currentUser.role === 'super_admin' || store.currentUser.role === 'admin') && (
              <button
                onClick={() => store.updateSettings({ isTermLocked: !store.settings.isTermLocked })}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                  store.settings.isTermLocked
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
                title={store.settings.isTermLocked ? 'Click to unlock term mark entry' : 'Click to lock term mark entry'}
              >
                {store.settings.isTermLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Term Marks Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Marks Entry Open</span>
                  </>
                )}
              </button>
            )}

            {/* Super Admin School Logo button */}
            {(store.currentUser.role === 'super_admin' || store.currentUser.role === 'admin') && (
              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-red-950 rounded-lg text-xs font-bold border border-amber-300 transition shadow-sm"
              >
                <span>Upload Logo</span>
              </button>
            )}

            {/* Super Admin School Stamp button */}
            {(store.currentUser.role === 'super_admin' || store.currentUser.role === 'admin') && (
              <button
                onClick={() => setIsStampModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-red-950 rounded-lg text-xs font-bold border border-amber-400 transition shadow-sm"
                title="Upload official school stamp from PC"
              >
                <Stamp className="w-3.5 h-3.5 text-red-950" />
                <span>Upload Stamp</span>
              </button>
            )}

            {/* Direct Score Entry for All Teachers */}
            <button
              onClick={() => handleOpenDirectScoreModal()}
              className="flex items-center space-x-1.5 px-3 py-1 bg-red-900 hover:bg-red-800 text-amber-200 hover:text-white rounded-lg text-xs font-bold border border-amber-400/80 transition shadow-sm"
              title="Input continuous assessment and exam marks directly"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct Mark Entry</span>
            </button>

            {/* Upload Existing Students via Excel */}
            <button
              onClick={() => setIsExcelUploadModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-lg text-xs font-bold border border-emerald-400/80 transition shadow-sm"
              title="Upload existing students in Excel sheet with full room to edit class and biodata"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>Upload Students (Excel)</span>
            </button>

            {/* Super Admin Import External Portal button */}
            {(store.currentUser.role === 'super_admin' || store.currentUser.role === 'admin') && (
              <button
                onClick={() => setIsExternalPortalModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-red-950 rounded-lg text-xs font-bold border border-amber-300 transition shadow-sm"
                title="Super Admin: Accept already registered students from another portal"
              >
                <span>Import External Portal</span>
              </button>
            )}

            {/* Super Admin Bulk Promotion button */}
            {(store.currentUser.role === 'super_admin' || store.currentUser.role === 'admin') && (
              <button
                onClick={() => handleOpenBulkPromotionModal('ALL')}
                className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-850 text-amber-300 rounded-lg text-xs font-bold border border-amber-400 transition shadow-sm"
                title="Super Admin: Bulk promote students to next class level based on terminal performance (compulsory Math & English pass)"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>Bulk Promotion</span>
              </button>
            )}

            {/* Audit Log button */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium border border-slate-300 transition"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail ({store.auditLogs.length})</span>
            </button>

            {/* Quick Staff Profile & Biodata Editor */}
            <button
              onClick={() => setIsTeacherProfileModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-red-950 rounded-lg font-bold text-xs border border-amber-500 transition shadow-xs"
              title="Edit logged-in teacher profile and biodata"
            >
              <UserCheck className="w-3.5 h-3.5 text-red-950" />
              <span>My Profile &amp; Biodata</span>
            </button>

            {/* Quick Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 px-3 py-1 bg-red-950 hover:bg-red-900 text-rose-200 hover:text-white rounded-lg font-bold text-xs border border-rose-500/50 transition shadow-xs"
              title="Sign out of teacher account and return to Portal Gate"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span>Sign Out</span>
            </button>

            {/* Reset to Seed button */}
            {(store.currentUser.role === 'super_admin' || store.currentUser.role === 'admin') && (
              <button
                onClick={() => {
                  if (window.confirm('Reset all 200 student records back to official default?')) {
                    store.resetToSeedData();
                  }
                }}
                className="flex items-center space-x-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 rounded text-xs transition"
                title="Reset to official seed data"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset Seed</span>
              </button>
            )}
          </div>
        </div>
      </footer>
      </div>

      {/* Floating Direct Mark Entry Action Button for Mobile Phones */}
      <div className="sm:hidden fixed bottom-16 right-4 z-40">
        <button
          onClick={() => handleOpenDirectScoreModal()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white font-black text-xs rounded-full shadow-2xl border-2 border-amber-300 active:scale-95 transition"
          title="Direct Mark Entering on Mobile Phone"
        >
          <Smartphone className="w-4 h-4 text-amber-300" />
          <span>Enter Marks</span>
        </button>
      </div>

      {/* Google Sheets Synchronization Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        students={store.students}
        teachers={store.teachers}
        settings={store.settings}
        sheetsConfig={store.sheetsConfig}
        setSheetsConfig={store.setSheetsConfig}
        firebaseUser={firebaseUser}
        accessToken={accessToken}
        addLog={store.addLog}
      />

      {/* Super Admin Score Percentage & Weights Modal */}
      <ScorePercentageSettingsModal
        isOpen={isPercentageModalOpen}
        onClose={() => setIsPercentageModalOpen(false)}
        settings={store.settings}
        currentUser={store.currentUser}
        onUpdateSectionCAConfig={store.updateSectionCAConfig}
        onUpdateGradingScale={store.updateGradingScale}
        addLog={store.addLog}
      />

      {/* Super Admin School Logo Upload Modal */}
      <SchoolLogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        settings={store.settings}
        currentUser={store.currentUser}
        onUpdateSchoolLogo={store.updateSchoolLogo}
      />

      {/* Super Admin External Portal Import Modal */}
      <ExternalPortalImportModal
        isOpen={isExternalPortalModalOpen}
        onClose={() => setIsExternalPortalModalOpen(false)}
        currentUser={store.currentUser}
        settings={store.settings}
        students={store.students}
        onImportStudents={store.importExternalPortalStudents}
      />

      {/* Teacher Sign Up / Portal Authentication Modal */}
      <TeacherSignupModal
        isOpen={isTeacherSignupModalOpen}
        onClose={() => setIsTeacherSignupModalOpen(false)}
        onRegisterTeacher={store.registerTeacher}
        onLoginTeacher={store.loginTeacher}
        teachers={store.teachers}
        currentUser={store.currentUser}
        setCurrentUser={store.setCurrentUser}
        settings={store.settings}
        initialMode={authModalMode}
        onAfterTeacherSignupOrLogin={(teacher, openScoreUpload) => {
          setActiveTab('gradebook');
        }}
      />

      {/* Class Remarks & Comments Management Modal */}
      <ClassCommentsModal
        isOpen={isClassCommentsModalOpen}
        onClose={() => setIsClassCommentsModalOpen(false)}
        students={store.students}
        currentUser={store.currentUser}
        settings={store.settings}
        initialClass={modalClass}
        activeTerm={store.activeTerm}
        onSaveComments={store.batchUpdateComments}
        addLog={store.addLog}
      />

      {/* Student Passport Upload Center Modal */}
      <StudentPassportUploadModal
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
        students={store.students}
        currentUser={store.currentUser}
        settings={store.settings}
        initialClass={modalClass}
        onUpdateStudentPassport={store.updateStudentPassport}
        onBatchUpdatePassports={store.batchUpdatePassports}
        addLog={store.addLog}
      />

      {/* Bulk Student Promotion Center Modal */}
      <BulkPromotionModal
        isOpen={isBulkPromotionModalOpen}
        onClose={() => setIsBulkPromotionModalOpen(false)}
        students={store.students}
        currentUser={store.currentUser}
        settings={store.settings}
        activeTerm={store.activeTerm}
        initialClass={bulkPromotionClass}
        previewBulkPromotion={store.previewBulkPromotion}
        bulkPromoteStudents={store.bulkPromoteStudents}
        addLog={store.addLog}
      />

      {/* School Stamp Upload from PC Modal */}
      <SchoolStampUploadModal
        isOpen={isStampModalOpen}
        onClose={() => setIsStampModalOpen(false)}
        settings={store.settings}
        currentUser={store.currentUser}
        onUpdateSchoolStamp={store.updateSchoolStamp}
        onRemoveSchoolStamp={store.removeSchoolStamp}
        onUpdateSettings={store.updateSettings}
      />

      {/* Direct Score Input for Every Teacher Modal */}
      <DirectScoreInputModal
        isOpen={isDirectScoreModalOpen}
        onClose={() => setIsDirectScoreModalOpen(false)}
        students={store.students}
        currentUser={store.currentUser}
        settings={store.settings}
        activeTerm={store.activeTerm}
        initialClass={directScoreClass}
        initialSubject={directScoreSubject}
        batchUpdateSubjectScores={store.batchUpdateSubjectScores}
        addLog={store.addLog}
      />

      {/* Excel Student Registration & Class/Biodata Editor Modal */}
      <StudentExcelUploadModal
        isOpen={isExcelUploadModalOpen}
        onClose={() => setIsExcelUploadModalOpen(false)}
        currentUser={store.currentUser}
        settings={store.settings}
        students={store.students}
        onImportStudents={store.importExternalPortalStudents}
      />

      {/* Teacher Missing Marks & Score Audit Engine Modal */}
      <MissingMarksAuditModal
        isOpen={isMissingMarksModalOpen}
        onClose={() => setIsMissingMarksModalOpen(false)}
        students={store.students}
        teachers={store.teachers}
        currentUser={store.currentUser}
        settings={store.settings}
        activeTerm={store.activeTerm}
        initialClass={missingMarksClass}
        initialSubject={missingMarksSubject}
        updateStudentScore={store.updateStudentScore}
        batchUpdateSubjectScores={store.batchUpdateSubjectScores}
        addLog={store.addLog}
      />

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300/40 w-full max-w-xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-5 py-4 bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white flex items-center justify-between border-b-2 border-amber-500">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm text-amber-300 font-serif">Security & Audit Trail</h3>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-amber-200 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-2 text-xs">
              {store.auditLogs.map(log => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="font-mono text-slate-400">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-600">{log.details}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    By: <strong className="text-slate-700">{log.teacherName}</strong> ({log.staffId})
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Profile & Biodata Editor Modal */}
      {isTeacherProfileModalOpen && (
        <TeacherProfileModal
          teacher={store.currentUser}
          currentUser={store.currentUser}
          isOpen={isTeacherProfileModalOpen}
          onClose={() => setIsTeacherProfileModalOpen(false)}
          onSave={(updated) => {
            store.updateTeacher(updated);
            setIsTeacherProfileModalOpen(false);
          }}
          onSignOut={handleSignOut}
        />
      )}

      {/* Staff Master Password Gate for Navigation / App-level entry */}
      <StaffPasswordModal
        isOpen={isStaffPasswordModalOpen}
        onClose={() => setIsStaffPasswordModalOpen(false)}
        onSuccess={() => {
          setIsStaffPasswordModalOpen(false);
          setAuthModalMode(pendingAuthModalMode);
          setIsTeacherSignupModalOpen(true);
        }}
        title={pendingAuthModalMode === 'login' ? 'Staff Sign In Gate' : 'New Teacher Sign Up Gate'}
        description="Please enter the master staff access password to proceed to staff authentication."
      />

      {/* Super Admin School Settings & Full Parameter Adjustment Modal */}
      <SchoolSettingsModal
        isOpen={isSchoolSettingsModalOpen}
        onClose={() => setIsSchoolSettingsModalOpen(false)}
        settings={store.settings}
        currentUser={store.currentUser}
        onUpdateSettings={store.updateSchoolSettings}
        onAddClass={store.addClass}
        onRemoveClass={store.removeClass}
        onAddSubject={store.addSubject}
        onRemoveSubject={store.removeSubject}
        onOpenPercentageModal={() => setIsPercentageModalOpen(true)}
      />

      {/* Independent School Registration & Gmail Onboarding Wizard */}
      <SchoolOnboardingModal
        isOpen={isSchoolOnboardingModalOpen}
        onClose={() => setIsSchoolOnboardingModalOpen(false)}
        firebaseUser={firebaseUser}
        onCreateSchool={store.createIndependentSchool}
        onAuthenticateSuccess={(teacher) => {
          store.setCurrentUser(teacher);
          setIsSchoolOnboardingModalOpen(false);
          setActiveTab('gradebook');
        }}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
