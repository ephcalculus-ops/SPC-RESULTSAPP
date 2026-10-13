import { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, StudentBiodata, Teacher, SchoolSettings, GoogleSheetsSyncConfig, SubjectScore, AffectiveAssessment, PsychomotorAssessment, UserRole, CAWeightConfig, GradeScaleItem, SchoolProfile, SchoolThemeId, SchoolSection } from '../types';
import { 
  INITIAL_SCHOOL_SETTINGS, 
  INITIAL_TEACHERS, 
  generate200Students, 
  calculateAllRankings, 
  calculateGrade, 
  computeTotal,
  OFFICIAL_SUBJECTS,
  createDefaultStudentTemplate,
  getNextClass,
  DEFAULT_OFFICIAL_STAMP,
  isJuniorClass,
  getCAConfig,
  DEFAULT_SENIOR_CA_CONFIG,
  DEFAULT_JUNIOR_CA_CONFIG,
  DEFAULT_GRADING_SCALE,
  SCHOOL_CLASSES,
  ALL_SUBJECTS,
  JUNIOR_SUBJECTS,
  SENIOR_SUBJECTS,
  isDemoTeacher,
  isDemoStudent,
  normalizeClass,
  isClassMatch,
  DEFAULT_SCHOOL_REGISTRY,
  generateSchoolStampSvg,
  generateSchoolCrestSvg
} from '../data/mockData';
import { getThemeConfig } from '../utils/theme';
import { SUPER_ADMIN_PORTAL_PASSWORD, STAFF_PORTAL_PASSWORD } from '../config/portalSecurity';
import { GoogleSheetsService } from './googleSheetsService';
import { 
  testFirestoreConnection, 
  queueScoreCloudSync, 
  saveSystemSnapshotToCloud, 
  syncFullStudentsDatasetToCloud,
  subscribeToCloudSync,
  getCloudSyncStatus,
  synchronizeCloudAndLocalStorage,
  CloudSyncState,
  setActiveSchoolId,
  saveSchoolProfileToCloud,
  syncSettingsToCloud,
  syncTeachersToCloud
} from './firestoreSync';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  teacherName: string;
  staffId: string;
  action: string;
  details: string;
}

export interface BulkPromotionOptions {
  targetClass?: string; // Optional: promote only a specific class, or all classes if undefined / 'ALL'
  targetStudentIds?: string[]; // Optional: promote specific students
  passingScore?: number; // Minimum score to pass Math & English (default: 50%)
  minAverageForPromotion?: number; // Minimum terminal average for outright promotion (default: 50%)
  minAverageForTrial?: number; // Minimum terminal average for promotion on trial (default: 45%)
  requireMathAndEnglishPass?: boolean; // Compulsory rule: Mathematics & English must be passed before promotion (default: true)
  term?: string; // Academic term to evaluate (default: 'Third Term')
}

export interface PromotionDecision {
  studentId: string;
  name: string;
  learnerId: string;
  currentClass: string;
  promotedClass: string;
  status: 'PROMOTED' | 'PROMOTED ON TRIAL' | 'REPEAT' | 'GRADUATED';
  mathScore: number;
  mathPassed: boolean;
  englishScore: number;
  englishPassed: boolean;
  terminalAverage: number;
  eligible: boolean;
  reason: string;
}

export interface BulkPromotionResult {
  totalProcessed: number;
  promotedCount: number;
  trialCount: number;
  repeatCount: number;
  graduatedCount: number;
  promotedStudents: PromotionDecision[];
  trialStudents: PromotionDecision[];
  repeatedStudents: PromotionDecision[];
  graduatedStudents: PromotionDecision[];
  decisions: PromotionDecision[];
}

const STORAGE_KEY_STUDENTS = 'stpaul_students_v2';
const STORAGE_KEY_TEACHERS = 'stpaul_teachers_v2';
const STORAGE_KEY_SETTINGS = 'stpaul_settings_v2';
const STORAGE_KEY_SHEETS = 'stpaul_sheets_config_v2';
const STORAGE_KEY_LOGS = 'stpaul_audit_logs_v2';
const STORAGE_KEY_REGISTRY = 'stp_school_registry_v2';
const STORAGE_KEY_ACTIVE_SCHOOL = 'stp_active_school_id_v2';

export const getSchoolStorageKey = (baseKey: string, schoolId: string = 'stpaul') => {
  if (schoolId === 'stpaul') return baseKey;
  return `school_${schoolId}_${baseKey}`;
};

export function useSchoolStore() {
  // 0. Active School Identification & Multi-School Registry
  const [activeSchoolId, setActiveSchoolIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_SCHOOL);
      if (saved) return saved;
    } catch (_) {}
    return 'stpaul';
  });

  const [schoolRegistry, setSchoolRegistry] = useState<SchoolProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REGISTRY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...DEFAULT_SCHOOL_REGISTRY];
          for (const item of parsed) {
            if (!merged.some(m => m.id === item.id)) {
              merged.push(item);
            }
          }
          return merged;
        }
      }
    } catch (_) {}
    return DEFAULT_SCHOOL_REGISTRY;
  });

  const activeSchoolProfile = useMemo(() => {
    return schoolRegistry.find(s => s.id === activeSchoolId) || schoolRegistry[0] || DEFAULT_SCHOOL_REGISTRY[0];
  }, [schoolRegistry, activeSchoolId]);
  // 1. Current logged-in teacher / user
  const [currentUser, setCurrentUser] = useState<Teacher>(() => {
    const defaultSuperAdmin = INITIAL_TEACHERS[0];
    try {
      const savedTeacherId = localStorage.getItem('stpaul_auth_teacher_id');
      if (savedTeacherId) {
        const savedTeachers = localStorage.getItem(STORAGE_KEY_TEACHERS);
        if (savedTeachers) {
          const list: Teacher[] = JSON.parse(savedTeachers);
          const found = list.find(t => t.id === savedTeacherId);
          if (found && !isDemoTeacher(found)) {
            if (found.id === 't-admin' || found.staffId === 'STP/ADMIN/001' || found.name.includes('Peter Sule') || found.name.trim().toUpperCase() === 'SUPER ADMIN') {
              return {
                ...found,
                name: 'SUPER ADMIN',
                role: 'super_admin',
                password: SUPER_ADMIN_PORTAL_PASSWORD,
                assignedClasses: [...SCHOOL_CLASSES],
                assignedSubjects: [...ALL_SUBJECTS],
              };
            }
            return found;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaultSuperAdmin;
  });
  
  // 2. School Settings
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        let seniorCA = parsed.seniorCAConfig;
        // Enforce official SSS 1-3 standard: CA1 (10), CA2 (10), CA3 (10), CA4 (0), Exam (70), Total (100)
        if (!seniorCA || seniorCA.ca1Max !== 10 || seniorCA.ca2Max !== 10 || seniorCA.ca3Max !== 10 || seniorCA.ca4Max !== 0 || seniorCA.examMax !== 70) {
          seniorCA = DEFAULT_SENIOR_CA_CONFIG;
        }
        return {
          ...INITIAL_SCHOOL_SETTINGS,
          ...parsed,
          schoolLogo: parsed.schoolLogo || INITIAL_SCHOOL_SETTINGS.schoolLogo,
          allowAllTeachersScoreEntry: parsed.allowAllTeachersScoreEntry !== undefined ? parsed.allowAllTeachersScoreEntry : true,
          juniorCAConfig: parsed.juniorCAConfig || INITIAL_SCHOOL_SETTINGS.juniorCAConfig,
          seniorCAConfig: seniorCA,
        };
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SCHOOL_SETTINGS;
  });

  // 3. Teachers roster (clean real teachers + Super Admin)
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEACHERS);
      if (saved) {
        const parsed: Teacher[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out all demo teachers placed for sample display
          const realTeachers = parsed
            .filter(t => !isDemoTeacher(t))
            .map(t => {
              if (t.id === 't-admin' || t.staffId === 'STP/ADMIN/001' || t.name.includes('Peter Sule') || t.name.trim().toUpperCase() === 'SUPER ADMIN') {
                return {
                  ...t,
                  name: 'SUPER ADMIN',
                  role: 'super_admin' as const,
                  password: SUPER_ADMIN_PORTAL_PASSWORD,
                  assignedClasses: [...SCHOOL_CLASSES],
                  assignedSubjects: [...ALL_SUBJECTS],
                };
              }
              return t;
            });

          // Always ensure Super Admin account is available
          const hasAdmin = realTeachers.some(t => t.id === 't-admin' || t.staffId === 'STP/ADMIN/001' || t.role === 'super_admin');
          const finalTeachers = hasAdmin ? realTeachers : [INITIAL_TEACHERS[0], ...realTeachers];

          try {
            localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(finalTeachers));
          } catch (_) {}

          return finalTeachers;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TEACHERS;
  });

  // Helper to normalize student scores to match section CA config (e.g. SSS 1-3: CA1=10, CA2=10, CA3=10, CA4=0, Exam=70)
  const sanitizeStudentScores = (stList: Student[]): Student[] => {
    return stList.map(st => {
      const isSenior = !isJuniorClass(st.className);
      if (!isSenior) return st;

      const sanitizeScoreMap = (scores: Record<string, SubjectScore>) => {
        const result: Record<string, SubjectScore> = {};
        for (const [subj, sc] of Object.entries(scores)) {
          const ca1 = sc.ca1 !== null && sc.ca1 !== undefined ? Math.min(10, Math.max(0, sc.ca1)) : null;
          const ca2 = sc.ca2 !== null && sc.ca2 !== undefined ? Math.min(10, Math.max(0, sc.ca2)) : null;
          const ca3 = sc.ca3 !== null && sc.ca3 !== undefined ? Math.min(10, Math.max(0, sc.ca3)) : null;
          const ca4 = 0; // SSS 1-3 does not use CA4
          const exam = sc.exam !== null && sc.exam !== undefined ? Math.min(70, Math.max(0, sc.exam)) : null;
          const total = computeTotal(ca1, ca2, ca3, ca4, exam);
          result[subj] = {
            ...sc,
            ca1,
            ca2,
            ca3,
            ca4,
            exam,
            total,
            grade: calculateGrade(total, settings.gradingScale),
          };
        }
        return result;
      };

      const cleanScores = sanitizeScoreMap(st.scores || {});
      const cleanTermScores: Record<string, Record<string, SubjectScore>> = {};
      if (st.termScores) {
        for (const [t, sMap] of Object.entries(st.termScores)) {
          cleanTermScores[t] = sanitizeScoreMap(sMap);
        }
      }

      return {
        ...st,
        scores: cleanScores,
        termScores: Object.keys(cleanTermScores).length > 0 ? cleanTermScores : undefined,
      };
    });
  };

  // 4. Students (filtered to retain only real registered students, removing all demo students)
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out all demo students placed for mock display
          const realStudents = parsed.filter((s: Student) => !isDemoStudent(s));
          if (realStudents.length > 0) {
            const sanitized = sanitizeStudentScores(realStudents);
            const ranked = calculateAllRankings(sanitized, 'Third Term');
            try {
              localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(ranked));
            } catch (_) {}
            return ranked;
          } else {
            try {
              localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify([]));
            } catch (_) {}
            return [];
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Active Term state across the application
  const [activeTerm, setActiveTermState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('stp_school_active_term');
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return 'Third Term';
  });

  // 5. Google Sheets Sync Config
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsSyncConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHEETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      lastSyncedAt: null,
      autoSync: false,
      status: 'idle',
    };
  });

  // 6. Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'log-1',
        timestamp: new Date().toLocaleTimeString(),
        teacherName: 'SUPER ADMIN',
        staffId: 'STP/ADMIN/001',
        action: 'System Initialized',
        details: 'Official St. Paul College academic database initialized with registered staff.',
      }
    ];
  });

  // Cloud auto-sync state
  const [cloudSyncInfo, setCloudSyncInfo] = useState(getCloudSyncStatus());

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = subscribeToCloudSync(status => {
      setCloudSyncInfo(status);
    });

    // Run initial direct bidirectional synchronization between Cloud Firestore and Local Storage
    synchronizeCloudAndLocalStorage(students, settings).then(({ mergedStudents, isUpdated }) => {
      if (isUpdated && mergedStudents && mergedStudents.length > 0) {
        const ranked = calculateAllRankings(mergedStudents, activeTerm);
        setStudents(ranked);
        try {
          localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(ranked));
        } catch (_) {}
      }
    });

    return () => unsubscribe();
  }, []);

  // Save changes to localStorage AND automatically debounce synchronize to Cloud Firestore
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(schoolRegistry));
      localStorage.setItem(STORAGE_KEY_ACTIVE_SCHOOL, activeSchoolId);
    } catch (_) {}
  }, [schoolRegistry, activeSchoolId]);

  useEffect(() => {
    try {
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_STUDENTS, activeSchoolId), JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }

    // Auto-save snapshot to Firestore in the cloud and secondary daily snapshot so marks & staff are never lost
    const cloudTimer = setTimeout(() => {
      saveSystemSnapshotToCloud(students, settings, teachers, activeSchoolId);
    }, 2500);

    return () => clearTimeout(cloudTimer);
  }, [students, settings, teachers, activeSchoolId]);

  useEffect(() => {
    try {
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_TEACHERS, activeSchoolId), JSON.stringify(teachers));
    } catch (e) {
      console.error(e);
    }
  }, [teachers, activeSchoolId]);

  useEffect(() => {
    try {
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_SETTINGS, activeSchoolId), JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings, activeSchoolId]);

  useEffect(() => {
    try {
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_SHEETS, activeSchoolId), JSON.stringify(sheetsConfig));
    } catch (e) {
      console.error(e);
    }
  }, [sheetsConfig, activeSchoolId]);

  useEffect(() => {
    try {
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_LOGS, activeSchoolId), JSON.stringify(auditLogs));
    } catch (e) {
      console.error(e);
    }
  }, [auditLogs, activeSchoolId]);

  const addLog = useCallback((action: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      teacherName: currentUser.name,
      staffId: currentUser.staffId,
      action,
      details,
    };
    setAuditLogs(prev => [newEntry, ...prev.slice(0, 49)]);
  }, [currentUser]);

  // Permission checks: Anti-Manipulation RBAC (Ensures teachers access their assigned classes/subjects)
  const canEditSubject = useCallback((className: string, subject: string): boolean => {
    // 1. Super Admin and Academic Directors oversee all classes/subjects without restriction
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer') {
      return true;
    }

    // 2. If term is locked, no teacher can modify marks
    if (settings.isTermLocked) {
      return false;
    }

    // 3. If settings permit all teachers score entry
    if (settings.allowAllTeachersScoreEntry) {
      return true;
    }

    // 4. Form Teacher Access for their assigned form class
    if (currentUser.isFormTeacherOf && isClassMatch(currentUser.isFormTeacherOf, className)) {
      return true;
    }

    // 5. Check if teacher is assigned to this class (using intelligent grade and arm matcher, e.g. JSS 3 matches JSS 3 A/B)
    const assignedClasses = currentUser.assignedClasses || [];
    const teachesClass = assignedClasses.some(c => isClassMatch(c, className));

    if (!teachesClass) {
      return false;
    }

    // 6. Check assigned subjects
    const assignedSubjects = currentUser.assignedSubjects || [];
    if (assignedSubjects.length === 0) {
      // If teacher is assigned the class with unrestricted subjects, allow entry
      return true;
    }

    const cleanSubject = subject.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const teachesSubject = assignedSubjects.some(s => {
      const cleanAssigned = s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanAssigned === cleanSubject) return true;
      if (cleanAssigned.includes(cleanSubject) || cleanSubject.includes(cleanAssigned)) return true;
      return false;
    });

    return teachesSubject;
  }, [currentUser, settings.isTermLocked, settings.allowAllTeachersScoreEntry]);

  const canEditFormTeacherSection = useCallback((className: string): boolean => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer') return true;
    return currentUser.role === 'form_teacher' && currentUser.isFormTeacherOf === className;
  }, [currentUser]);

  const canEditPrincipalSection = useCallback((): boolean => {
    return currentUser.role === 'super_admin' || currentUser.role === 'admin';
  }, [currentUser]);

  // Strict anti-tamper passport authorization guard (prevents any staff from replacing another student's photo)
  const canUpdatePassport = useCallback((className: string): boolean => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') return true;
    if (currentUser.role === 'form_teacher' && currentUser.isFormTeacherOf === className) return true;
    return false;
  }, [currentUser]);

  const setActiveTerm = useCallback((newTerm: string) => {
    setActiveTermState(newTerm);
    try {
      localStorage.setItem('stp_school_active_term', newTerm);
    } catch (e) {
      console.error(e);
    }
    setStudents(prev => calculateAllRankings(prev, newTerm));
    addLog('Term Switched', `Active academic view changed to: ${newTerm}`);
  }, [addLog]);

  // Update a student's score for a subject with strict anti-manipulation authorization guard
  const updateStudentScore = useCallback((
    studentId: string,
    subject: string,
    ca1: number | null,
    ca2: number | null,
    ca3: number | null,
    ca4: number | null,
    exam: number | null,
    status: 'draft' | 'submitted' | 'approved' = 'submitted',
    termParam?: string
  ) => {
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;

    // Strict Anti-Manipulation Security Guard: Reject if teacher does not teach this subject/class
    if (!canEditSubject(targetStudent.className, subject)) {
      addLog(
        'Blocked Mark Manipulation', 
        `Security Alert: Unauthorized mark edit attempt blocked for ${currentUser.name} (${currentUser.staffId}) on ${subject} in ${targetStudent.className}`
      );
      console.warn(`[Security Blocked] Teacher ${currentUser.name} does not have permission to modify ${subject} marks in ${targetStudent.className}.`);
      return;
    }

    const targetTerm = termParam || (activeTerm === 'Cumulative' ? 'Third Term' : activeTerm) || 'Third Term';
    setStudents(prevStudents => {
      const updated = prevStudents.map(student => {
        if (student.id !== studentId) return student;

        const isSenior = !isJuniorClass(student.className);
        // For SSS 1-3, enforce CA1 (10), CA2 (10), CA3 (10), CA4 (0), Exam (70)
        const finalCa1 = ca1 !== null && ca1 !== undefined ? (isSenior ? Math.min(10, Math.max(0, ca1)) : ca1) : null;
        const finalCa2 = ca2 !== null && ca2 !== undefined ? (isSenior ? Math.min(10, Math.max(0, ca2)) : ca2) : null;
        const finalCa3 = ca3 !== null && ca3 !== undefined ? (isSenior ? Math.min(10, Math.max(0, ca3)) : ca3) : null;
        const finalCa4 = isSenior ? 0 : ca4;
        const finalExam = exam !== null && exam !== undefined ? (isSenior ? Math.min(70, Math.max(0, exam)) : exam) : null;

        const total = computeTotal(finalCa1, finalCa2, finalCa3, finalCa4, finalExam);
        const grade = calculateGrade(total, settings.gradingScale);

        const newScore: SubjectScore = {
          ca1: finalCa1,
          ca2: finalCa2,
          ca3: finalCa3,
          ca4: finalCa4,
          exam: finalExam,
          total,
          grade,
          status,
          updatedByTeacherId: currentUser.id,
          updatedAt: new Date().toISOString(),
        };

        const existingTermScores = student.termScores || {
          'First Term': { ...student.scores },
          'Second Term': { ...student.scores },
          'Third Term': { ...student.scores },
        };

        const updatedTermScores = {
          ...existingTermScores,
          [targetTerm]: {
            ...(existingTermScores[targetTerm] || {}),
            [subject]: newScore,
          },
        };

        const updatedStudent: Student = {
          ...student,
          termScores: updatedTermScores,
          scores: targetTerm === activeTerm ? {
            ...student.scores,
            [subject]: newScore,
          } : student.scores,
        };

        // Automatically store & synchronize mark and student in Cloud Firestore so no result is missing
        queueScoreCloudSync(studentId, subject, targetTerm, newScore, updatedStudent);

        return updatedStudent;
      });

      // Recalculate rankings across all students and immediately persist to Local Storage
      const ranked = calculateAllRankings(updated, activeTerm);
      try {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(ranked));
      } catch (_) {}
      return ranked;
    });

    addLog('Updated Score', `${currentUser.name} recorded ${subject} mark for student ID: ${studentId} (${targetTerm})`);
  }, [currentUser, activeTerm, students, canEditSubject, addLog]);

  // Batch update scores for an entire class in a subject with strict anti-manipulation authorization guard
  const batchUpdateSubjectScores = useCallback((
    className: string,
    subject: string,
    updates: { studentId: string; ca1: number | null; ca2: number | null; ca3: number | null; ca4: number | null; exam: number | null }[],
    termParam?: string
  ) => {
    // Strict Anti-Manipulation Security Guard: Reject if teacher does not teach this subject/class
    if (!canEditSubject(className, subject)) {
      addLog(
        'Blocked Batch Mark Manipulation', 
        `Security Alert: Unauthorized batch mark edit blocked for ${currentUser.name} (${currentUser.staffId}) on ${subject} in ${className}`
      );
      console.warn(`[Security Blocked] Teacher ${currentUser.name} attempted unauthorized batch update on ${subject} in ${className}.`);
      return;
    }

    const targetTerm = termParam || (activeTerm === 'Cumulative' ? 'Third Term' : activeTerm) || 'Third Term';
    setStudents(prevStudents => {
      const updateMap = new Map(updates.map(u => [u.studentId, u]));
      const updated = prevStudents.map(student => {
        if (!updateMap.has(student.id)) return student;
        if (!isClassMatch(student.className, className)) return student;
        const u = updateMap.get(student.id)!;
        const caCfg = getCAConfig(student.className, settings);
        const finalCa1 = u.ca1 !== null && u.ca1 !== undefined ? Math.min(caCfg.ca1Max, Math.max(0, u.ca1)) : null;
        const finalCa2 = u.ca2 !== null && u.ca2 !== undefined ? Math.min(caCfg.ca2Max, Math.max(0, u.ca2)) : null;
        const finalCa3 = u.ca3 !== null && u.ca3 !== undefined ? Math.min(caCfg.ca3Max, Math.max(0, u.ca3)) : null;
        const finalCa4 = caCfg.ca4Max > 0 && u.ca4 !== null && u.ca4 !== undefined ? Math.min(caCfg.ca4Max, Math.max(0, u.ca4)) : (caCfg.ca4Max === 0 ? 0 : null);
        const finalExam = u.exam !== null && u.exam !== undefined ? Math.min(caCfg.examMax, Math.max(0, u.exam)) : null;

        const total = computeTotal(finalCa1, finalCa2, finalCa3, finalCa4, finalExam);
        const grade = calculateGrade(total, settings.gradingScale);
        const newScore: SubjectScore = {
          ca1: finalCa1,
          ca2: finalCa2,
          ca3: finalCa3,
          ca4: finalCa4,
          exam: finalExam,
          total,
          grade,
          status: 'submitted',
          updatedByTeacherId: currentUser.id,
          updatedAt: new Date().toISOString(),
        };

        const existingTermScores = student.termScores || {
          'First Term': { ...student.scores },
          'Second Term': { ...student.scores },
          'Third Term': { ...student.scores },
        };

        const updatedTermScores = {
          ...existingTermScores,
          [targetTerm]: {
            ...(existingTermScores[targetTerm] || {}),
            [subject]: newScore,
          },
        };

        const updatedStudent: Student = {
          ...student,
          termScores: updatedTermScores,
          scores: targetTerm === activeTerm ? {
            ...student.scores,
            [subject]: newScore,
          } : student.scores,
        };

        // Automatically store & synchronize mark and student in Cloud Firestore so no result is missing
        queueScoreCloudSync(u.studentId, subject, targetTerm, newScore, updatedStudent);

        return updatedStudent;
      });

      const ranked = calculateAllRankings(updated, activeTerm);
      try {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(ranked));
      } catch (_) {}
      return ranked;
    });

    addLog('Batch Score Update', `Synchronized scores for ${updates.length} students in ${className} (${subject} - ${targetTerm})`);
  }, [currentUser, activeTerm, canEditSubject, addLog]);

  // Update affective / psychomotor domain assessments & form teacher comments
  const updateStudentAssessments = useCallback((
    studentId: string,
    affective: AffectiveAssessment,
    psychomotor: PsychomotorAssessment,
    daysPresent: number,
    formTeacherComment: string
  ) => {
    setStudents(prevStudents => {
      return prevStudents.map(student => {
        if (student.id !== studentId) return student;
        return {
          ...student,
          affective,
          psychomotor,
          daysPresent,
          formTeacherComment,
        };
      });
    });

    addLog('Updated Domain Assessments', `Updated behavioral/psychomotor ratings for student ${studentId}`);
  }, [addLog]);

  // Update Principal's comment for student
  const updatePrincipalComment = useCallback((studentId: string, principalComment: string) => {
    setStudents(prevStudents => {
      return prevStudents.map(student => {
        if (student.id !== studentId) return student;
        return {
          ...student,
          principalComment,
        };
      });
    });

    addLog('Updated Principal Comment', `Principal updated remark for student ${studentId}`);
  }, [addLog]);

  // Update both Form Teacher and Principal comments for a student
  const updateStudentComments = useCallback((studentId: string, formTeacherComment: string, principalComment: string) => {
    setStudents(prevStudents => {
      return prevStudents.map(student => {
        if (student.id !== studentId) return student;
        return {
          ...student,
          formTeacherComment,
          principalComment,
        };
      });
    });

    addLog('Updated Remarks', `Saved Form Teacher and Principal remarks for student ${studentId}`);
  }, [addLog]);

  // Batch update comments for a whole class
  const batchUpdateComments = useCallback((
    className: string,
    updates: Array<{ studentId: string; formTeacherComment: string; principalComment: string }>
  ) => {
    const updateMap = new Map(updates.map(u => [u.studentId, u]));
    setStudents(prevStudents => {
      return prevStudents.map(student => {
        const update = updateMap.get(student.id);
        if (!update) return student;
        return {
          ...student,
          formTeacherComment: update.formTeacherComment,
          principalComment: update.principalComment,
        };
      });
    });

    addLog('Batch Remarks Update', `Synchronized Form Teacher & Principal remarks for ${updates.length} students in ${className}`);
  }, [addLog]);

  // Update a student's passport photo with strict identity binding (prevents replacing another student's photo)
  const updateStudentPassport = useCallback((studentId: string, passportPhoto: string) => {
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) {
      console.warn(`[Passport Guard] Student ID ${studentId} not found.`);
      return;
    }

    // Strict Anti-Cross-Replacement Guard: Check authorization for student's class
    if (!canUpdatePassport(targetStudent.className)) {
      addLog(
        'Blocked Passport Alteration',
        `Security Alert: Unauthorized attempt to modify passport photo for ${targetStudent.name} (${targetStudent.learnerId}) in ${targetStudent.className} by ${currentUser.name} (${currentUser.staffId})`
      );
      console.warn(`[Security Guard] Blocked unauthorized passport update on ${targetStudent.name}`);
      return;
    }

    setStudents(prevStudents => {
      const updated = prevStudents.map(student => {
        if (student.id !== studentId) return student;
        return {
          ...student,
          passportPhoto,
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
      } catch (_) {}
      saveSystemSnapshotToCloud(updated, settings);
      return updated;
    });

    addLog('Updated Student Passport', `Verified and sealed passport photograph for student: ${targetStudent.name} (Admission ID: ${targetStudent.learnerId})`);
  }, [students, currentUser, canUpdatePassport, settings, addLog]);

  // Batch update multiple passport photos with strict studentId keying and authorization check
  const batchUpdatePassports = useCallback((updates: Array<{ studentId: string; passportPhoto: string }>) => {
    const updateMap = new Map(updates.map(u => [u.studentId, u.passportPhoto]));
    let count = 0;

    setStudents(prevStudents => {
      const updated = prevStudents.map(student => {
        if (!updateMap.has(student.id)) return student;
        // Verify staff has permission for student's class
        if (!canUpdatePassport(student.className)) {
          console.warn(`[Security Guard] Skipping unauthorized passport update for ${student.name}`);
          return student;
        }
        const newPhoto = updateMap.get(student.id);
        if (!newPhoto) return student;
        count++;
        return {
          ...student,
          passportPhoto: newPhoto,
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
      } catch (_) {}
      saveSystemSnapshotToCloud(updated, settings);
      return updated;
    });

    addLog('Batch Passport Update', `Verified and sealed passport photographs for ${count} students`);
  }, [canUpdatePassport, settings, addLog]);

  // Register a new student with complete biodata & passport photo
  const registerStudent = useCallback((newStudentData: Partial<Student> & { name: string; className: string }): Student => {
    const newStudent = createDefaultStudentTemplate(newStudentData, settings);
    setStudents(prev => {
      const updated = [newStudent, ...prev];
      const ranked = calculateAllRankings(updated, activeTerm, settings.gradingScale);
      try {
        localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_STUDENTS, activeSchoolId), JSON.stringify(ranked));
      } catch (_) {}
      saveSystemSnapshotToCloud(ranked, settings, teachers, activeSchoolId);
      return ranked;
    });
    addLog('Registered Student', `Registered learner ${newStudent.name} (${newStudent.learnerId}) into ${newStudent.className}`);
    return newStudent;
  }, [settings, activeTerm, activeSchoolId, teachers, addLog]);

  // Update an existing student's biodata, passport, role, subjects, class, or academic record
  const updateStudent = useCallback((studentId: string, updates: Partial<Student>) => {
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;

        // Synchronize scores if enrolled subjects were updated
        const updatedScores: Record<string, SubjectScore> = { ...s.scores };
        const updatedTermScores: Record<string, Record<string, SubjectScore>> = s.termScores ? { ...s.termScores } : {
          'First Term': { ...s.scores },
          'Second Term': { ...s.scores },
          'Third Term': { ...s.scores },
        };

        if (updates.enrolledSubjects && Array.isArray(updates.enrolledSubjects)) {
          updates.enrolledSubjects.forEach(subj => {
            if (!updatedScores[subj]) {
              updatedScores[subj] = {
                ca1: null,
                ca2: null,
                ca3: null,
                ca4: null,
                exam: null,
                total: 0,
                grade: 'F',
                status: 'draft',
              };
            }
            ['First Term', 'Second Term', 'Third Term'].forEach(term => {
              if (updatedTermScores[term] && !updatedTermScores[term][subj]) {
                updatedTermScores[term][subj] = {
                  ca1: null,
                  ca2: null,
                  ca3: null,
                  ca4: null,
                  exam: null,
                  total: 0,
                  grade: 'F',
                  status: 'draft',
                };
              }
            });
          });
        }

        const roleToSet = updates.studentRole || updates.biodata?.studentRole || s.studentRole || 'Regular Student';

        return {
          ...s,
          ...updates,
          scores: updatedScores,
          termScores: updatedTermScores,
          studentRole: roleToSet,
          enrolledSubjects: updates.enrolledSubjects || s.enrolledSubjects,
          biodata: {
            ...(s.biodata || {}),
            ...(updates.biodata || {}),
            studentRole: roleToSet,
          },
          affective: updates.affective ? { ...s.affective, ...updates.affective } : s.affective,
          psychomotor: updates.psychomotor ? { ...s.psychomotor, ...updates.psychomotor } : s.psychomotor,
        };
      });
      const ranked = calculateAllRankings(updated);
      try {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(ranked));
      } catch (_) {}
      saveSystemSnapshotToCloud(ranked, settings);
      return ranked;
    });
    addLog(
      'Updated Student Biodata', 
      `Super Admin/Staff updated records for student ID: ${studentId}${updates.studentRole ? ` (Role: ${updates.studentRole})` : ''}${updates.className ? ` (Class: ${updates.className})` : ''}${updates.enrolledSubjects ? ` (${updates.enrolledSubjects.length} Subjects)` : ''}`
    );
  }, [settings, addLog]);

  // Delete/deregister a student
  const deleteStudent = useCallback((studentId: string) => {
    setStudents(prev => {
      const student = prev.find(s => s.id === studentId);
      const studentName = student ? student.name : studentId;
      const updated = prev.filter(s => s.id !== studentId);
      addLog('Deregistered Student', `Removed learner ${studentName} (${studentId}) from registry`);
      return calculateAllRankings(updated);
    });
  }, [addLog]);

  // Super Admin: Accept already registered students from another portal (CSV/JSON/API format)
  const importExternalPortalStudents = useCallback((
    incoming: Array<{
      name: string;
      className: string;
      gender?: 'MALE' | 'FEMALE';
      learnerId?: string;
      passportPhoto?: string;
      biodata?: StudentBiodata;
      sourcePortal?: string;
    }>,
    mode: 'merge' | 'append' = 'merge'
  ): { imported: number; updated: number; total: number } => {
    let importedCount = 0;
    let updatedCount = 0;

    setStudents(prev => {
      let currentList = [...prev];
      const existingIdMap = new Map(currentList.map(s => [s.learnerId.trim().toUpperCase(), s]));

      for (const item of incoming) {
        if (!item.name || !item.className) continue;
        const normLearnerId = item.learnerId ? item.learnerId.trim().toUpperCase() : null;

        if (mode === 'merge' && normLearnerId && existingIdMap.has(normLearnerId)) {
          // Merge & update existing student
          const existing = existingIdMap.get(normLearnerId)!;
          const updatedIndex = currentList.findIndex(s => s.id === existing.id);
          if (updatedIndex !== -1) {
            currentList[updatedIndex] = {
              ...currentList[updatedIndex],
              name: item.name || currentList[updatedIndex].name,
              gender: item.gender || currentList[updatedIndex].gender,
              className: item.className || currentList[updatedIndex].className,
              // Strict Anti-Replacement: Always preserve existing verified student passport photo
              passportPhoto: currentList[updatedIndex].passportPhoto || item.passportPhoto,
              biodata: {
                ...currentList[updatedIndex].biodata,
                ...(item.biodata || {}),
              },
              sourcePortal: item.sourcePortal || 'External Portal Integration',
            };
            updatedCount++;
          }
        } else {
          // Append as new student
          const newStudent = createDefaultStudentTemplate({
            ...item,
            sourcePortal: item.sourcePortal || 'External Portal Integration',
          });
          currentList.push(newStudent);
          if (normLearnerId) {
            existingIdMap.set(normLearnerId, newStudent);
          }
          importedCount++;
        }
      }

      return calculateAllRankings(currentList);
    });

    addLog(
      'External Portal Sync',
      `Super Admin integrated ${importedCount + updatedCount} students from external portal (${importedCount} newly registered, ${updatedCount} biodata merged)`
    );

    return { imported: importedCount, updated: updatedCount, total: importedCount + updatedCount };
  }, [addLog]);

  // Helper to extract Math & English terminal scores accurately
  const getStudentTerminalCorePerformance = (student: Student, term: string = 'Third Term') => {
    // 1. Math score: look in cumulative first, then Third Term, then active scores
    let mathScore = 0;
    const mathKeys = ['MATHEMATICS', 'MATHS', 'GENERAL MATHEMATICS'];
    if (student.cumulativeScores) {
      for (const k of Object.keys(student.cumulativeScores)) {
        if (mathKeys.includes(k.trim().toUpperCase())) {
          mathScore = student.cumulativeScores[k].cumulativeAverage;
          break;
        }
      }
    }
    if (!mathScore && student.termScores?.[term]) {
      for (const k of Object.keys(student.termScores[term])) {
        if (mathKeys.includes(k.trim().toUpperCase())) {
          mathScore = student.termScores[term][k].total;
          break;
        }
      }
    }
    if (!mathScore && student.termScores?.['Third Term']) {
      for (const k of Object.keys(student.termScores['Third Term'])) {
        if (mathKeys.includes(k.trim().toUpperCase())) {
          mathScore = student.termScores['Third Term'][k].total;
          break;
        }
      }
    }
    if (!mathScore && student.scores) {
      for (const k of Object.keys(student.scores)) {
        if (mathKeys.includes(k.trim().toUpperCase())) {
          mathScore = student.scores[k].total;
          break;
        }
      }
    }

    // 2. English score: look in cumulative first, then Third Term, then active scores
    let englishScore = 0;
    const englishKeys = ['ENGLISH LANGUAGE', 'ENGLISH', 'ENGLISH STUDIES'];
    if (student.cumulativeScores) {
      for (const k of Object.keys(student.cumulativeScores)) {
        if (englishKeys.includes(k.trim().toUpperCase())) {
          englishScore = student.cumulativeScores[k].cumulativeAverage;
          break;
        }
      }
    }
    if (!englishScore && student.termScores?.[term]) {
      for (const k of Object.keys(student.termScores[term])) {
        if (englishKeys.includes(k.trim().toUpperCase())) {
          englishScore = student.termScores[term][k].total;
          break;
        }
      }
    }
    if (!englishScore && student.termScores?.['Third Term']) {
      for (const k of Object.keys(student.termScores['Third Term'])) {
        if (englishKeys.includes(k.trim().toUpperCase())) {
          englishScore = student.termScores['Third Term'][k].total;
          break;
        }
      }
    }
    if (!englishScore && student.scores) {
      for (const k of Object.keys(student.scores)) {
        if (englishKeys.includes(k.trim().toUpperCase())) {
          englishScore = student.scores[k].total;
          break;
        }
      }
    }

    // Terminal overall average (Annual Cumulative takes precedence, else Third Term summary)
    const terminalAverage = student.cumulativeAverageScore 
      ?? student.termTotals?.[term]?.averageScore 
      ?? student.termTotals?.['Third Term']?.averageScore 
      ?? student.averageScore 
      ?? 0;

    return {
      mathScore: Math.round(mathScore * 10) / 10,
      englishScore: Math.round(englishScore * 10) / 10,
      terminalAverage: Math.round(terminalAverage * 100) / 100,
    };
  };

  // Preview bulk promotion decisions based on terminal performance & core subject pass rules
  const previewBulkPromotion = useCallback((options?: BulkPromotionOptions): BulkPromotionResult => {
    const {
      targetClass,
      targetStudentIds,
      passingScore = 50,
      minAverageForPromotion = 50,
      minAverageForTrial = 45,
      requireMathAndEnglishPass = true,
      term = 'Third Term',
    } = options || {};

    const pool = students.filter(student => {
      if (targetStudentIds && targetStudentIds.length > 0) {
        return targetStudentIds.includes(student.id);
      }
      if (targetClass && targetClass !== 'ALL') {
        return student.className === targetClass;
      }
      return true;
    });

    const decisions: PromotionDecision[] = pool.map(student => {
      const { mathScore, englishScore, terminalAverage } = getStudentTerminalCorePerformance(student, term);
      const mathPassed = mathScore >= passingScore;
      const englishPassed = englishScore >= passingScore;
      const passedCore = mathPassed && englishPassed;
      const nextClass = getNextClass(student.className);

      // Terminal graduating class
      if (nextClass === 'GRADUATED') {
        if (terminalAverage >= minAverageForPromotion && (!requireMathAndEnglishPass || passedCore)) {
          return {
            studentId: student.id,
            name: student.name,
            learnerId: student.learnerId,
            currentClass: student.className,
            promotedClass: 'GRADUATED',
            status: 'GRADUATED',
            mathScore,
            mathPassed,
            englishScore,
            englishPassed,
            terminalAverage,
            eligible: true,
            reason: `Satisfied terminal graduation criteria: Passed Mathematics (${mathScore}%), English Language (${englishScore}%), terminal average ${terminalAverage}%. Graduated from St. Paul's College.`,
          };
        } else {
          return {
            studentId: student.id,
            name: student.name,
            learnerId: student.learnerId,
            currentClass: student.className,
            promotedClass: student.className,
            status: 'REPEAT',
            mathScore,
            mathPassed,
            englishScore,
            englishPassed,
            terminalAverage,
            eligible: false,
            reason: !passedCore && requireMathAndEnglishPass
              ? `Cannot graduate: Failed core prerequisite (${!mathPassed ? `Mathematics: ${mathScore}%` : ''}${!mathPassed && !englishPassed ? ', ' : ''}${!englishPassed ? `English Language: ${englishScore}%` : ''} - Min ${passingScore}% required). Must repeat ${student.className}.`
              : `Terminal average of ${terminalAverage}% is below graduation cutoff (${minAverageForPromotion}%). Must repeat ${student.className}.`,
          };
        }
      }

      // Mandatory Rule: Mathematics and English must both be passed (score >= passingScore, default 50%)
      if (requireMathAndEnglishPass && !passedCore) {
        let failDetail = '';
        if (!mathPassed && !englishPassed) {
          failDetail = `Failed both Mathematics (${mathScore}%) and English Language (${englishScore}%). Both must be passed (≥${passingScore}%) before promotion.`;
        } else if (!mathPassed) {
          failDetail = `Failed Mathematics (${mathScore}% < ${passingScore}%). Compulsory pass required before promotion.`;
        } else {
          failDetail = `Failed English Language (${englishScore}% < ${passingScore}%). Compulsory pass required before promotion.`;
        }
        return {
          studentId: student.id,
          name: student.name,
          learnerId: student.learnerId,
          currentClass: student.className,
          promotedClass: student.className,
          status: 'REPEAT',
          mathScore,
          mathPassed,
          englishScore,
          englishPassed,
          terminalAverage,
          eligible: false,
          reason: `${failDetail} Must repeat ${student.className}.`,
        };
      }

      // Performance Evaluation
      if (terminalAverage >= minAverageForPromotion) {
        return {
          studentId: student.id,
          name: student.name,
          learnerId: student.learnerId,
          currentClass: student.className,
          promotedClass: nextClass,
          status: 'PROMOTED',
          mathScore,
          mathPassed,
          englishScore,
          englishPassed,
          terminalAverage,
          eligible: true,
          reason: `Passed Mathematics (${mathScore}%), English (${englishScore}%), and achieved terminal average of ${terminalAverage}% (≥${minAverageForPromotion}%). Promoted to ${nextClass}.`,
        };
      } else if (terminalAverage >= minAverageForTrial) {
        return {
          studentId: student.id,
          name: student.name,
          learnerId: student.learnerId,
          currentClass: student.className,
          promotedClass: nextClass,
          status: 'PROMOTED ON TRIAL',
          mathScore,
          mathPassed,
          englishScore,
          englishPassed,
          terminalAverage,
          eligible: true,
          reason: `Passed Mathematics (${mathScore}%) and English (${englishScore}%), with terminal average of ${terminalAverage}%. Promoted on trial to ${nextClass}.`,
        };
      } else {
        return {
          studentId: student.id,
          name: student.name,
          learnerId: student.learnerId,
          currentClass: student.className,
          promotedClass: student.className,
          status: 'REPEAT',
          mathScore,
          mathPassed,
          englishScore,
          englishPassed,
          terminalAverage,
          eligible: false,
          reason: `Terminal average of ${terminalAverage}% is below minimum promotion threshold (${minAverageForTrial}%). Must repeat ${student.className}.`,
        };
      }
    });

    const promotedStudents = decisions.filter(d => d.status === 'PROMOTED');
    const trialStudents = decisions.filter(d => d.status === 'PROMOTED ON TRIAL');
    const repeatedStudents = decisions.filter(d => d.status === 'REPEAT');
    const graduatedStudents = decisions.filter(d => d.status === 'GRADUATED');

    return {
      totalProcessed: decisions.length,
      promotedCount: promotedStudents.length,
      trialCount: trialStudents.length,
      repeatCount: repeatedStudents.length,
      graduatedCount: graduatedStudents.length,
      promotedStudents,
      trialStudents,
      repeatedStudents,
      graduatedStudents,
      decisions,
    };
  }, [students]);

  // Bulk promote students to the next class level in bulk based on terminal academic performance (Admin Only)
  const bulkPromoteStudents = useCallback((options?: BulkPromotionOptions): BulkPromotionResult => {
    // Only admins or exam officers are permitted to promote
    if (currentUser.role !== 'admin' && currentUser.role !== 'exam_officer') {
      throw new Error('Permission denied: Only School Administrators and Examination Officers can execute bulk student promotions.');
    }

    const result = previewBulkPromotion(options);
    const decisionMap = new Map<string, PromotionDecision>(
      result.decisions.map(d => [d.studentId, d])
    );

    setStudents(prevStudents => {
      const updated: Student[] = prevStudents.map(student => {
        const decision = decisionMap.get(student.id);
        if (!decision) return student;

        if (decision.status === 'PROMOTED' || decision.status === 'PROMOTED ON TRIAL') {
          return {
            ...student,
            className: decision.promotedClass,
            promotionStatus: decision.status as Student['promotionStatus'],
            promotedToClass: decision.promotedClass,
          };
        } else if (decision.status === 'GRADUATED') {
          return {
            ...student,
            promotionStatus: 'GRADUATED' as const,
            promotedToClass: 'GRADUATED',
          };
        } else {
          // REPEAT
          return {
            ...student,
            promotionStatus: 'REPEAT' as const,
            promotedToClass: student.className,
          };
        }
      });

      return calculateAllRankings(updated);
    });

    addLog(
      'Bulk Student Promotion',
      `Super Admin ${currentUser.name} executed bulk promotion for ${result.totalProcessed} students based on terminal performance: ${result.promotedCount} Promoted, ${result.trialCount} Promoted on Trial, ${result.repeatCount} Repeating (Failed Math/English or avg), ${result.graduatedCount} Graduated.`
    );

    return result;
  }, [currentUser, previewBulkPromotion, addLog]);

  // Alias for promoteStudentsInBulk
  const promoteStudentsInBulk = bulkPromoteStudents;

  // Update School Settings
  const updateSettings = useCallback((newSettings: Partial<SchoolSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addLog('Updated Settings', `Academic settings updated: ${Object.keys(newSettings).join(', ')}`);
  }, [addLog]);

  // Comprehensive School Settings & Profile Updates (Adjusts ALL school parameters)
  const updateSchoolSettings = useCallback((updates: Partial<SchoolSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));

    setSchoolRegistry(prev => prev.map(p => {
      if (p.id !== activeSchoolId) return p;
      return {
        ...p,
        name: updates.schoolName ? updates.schoolName.toUpperCase() : p.name,
        motto: updates.schoolMotto !== undefined ? updates.schoolMotto : p.motto,
        address: updates.schoolAddress ? updates.schoolAddress.toUpperCase() : p.address,
        email: updates.schoolEmail || p.email,
        phone: updates.schoolPhone !== undefined ? updates.schoolPhone : p.phone,
        principalName: updates.principalName || p.principalName,
        examOfficerName: updates.examOfficerName || p.examOfficerName,
        logo: updates.schoolLogo || p.logo,
        stamp: updates.schoolStamp || p.stamp,
        stampOpacity: updates.schoolStampOpacity !== undefined ? updates.schoolStampOpacity : p.stampOpacity,
        stampRotation: updates.schoolStampRotation !== undefined ? updates.schoolStampRotation : p.stampRotation,
        theme: updates.theme || p.theme,
        classes: updates.classes || p.classes,
        juniorSubjects: updates.juniorSubjects || p.juniorSubjects,
        seniorSubjects: updates.seniorSubjects || p.seniorSubjects,
        learnerIdPrefix: updates.learnerIdPrefix || p.learnerIdPrefix,
        staffIdPrefix: updates.staffIdPrefix || p.staffIdPrefix,
      };
    }));

    // Sync to Cloud Firestore
    syncSettingsToCloud(updates as SchoolSettings, activeSchoolId).catch(err => 
      console.warn('Could not sync school settings to cloud:', err)
    );

    addLog('School Settings Updated', `Super Admin updated parameters: ${Object.keys(updates).join(', ')}`);
  }, [activeSchoolId, addLog]);

  // Switch Active School Portal
  const switchSchool = useCallback((targetSchoolId: string) => {
    const targetProfile = schoolRegistry.find(s => s.id === targetSchoolId);
    if (!targetProfile) return;

    setActiveSchoolIdState(targetSchoolId);
    setActiveSchoolId(targetSchoolId);

    // 1. Load settings
    let loadedSettings = INITIAL_SCHOOL_SETTINGS;
    try {
      const saved = localStorage.getItem(getSchoolStorageKey(STORAGE_KEY_SETTINGS, targetSchoolId));
      if (saved) {
        loadedSettings = JSON.parse(saved);
      } else {
        loadedSettings = {
          ...INITIAL_SCHOOL_SETTINGS,
          schoolId: targetProfile.id,
          schoolName: targetProfile.name,
          schoolMotto: targetProfile.motto || INITIAL_SCHOOL_SETTINGS.schoolMotto,
          schoolAddress: targetProfile.address,
          schoolEmail: targetProfile.email,
          schoolPhone: targetProfile.phone || '',
          principalName: targetProfile.principalName || 'PRINCIPAL / HEAD OF SCHOOL',
          examOfficerName: targetProfile.examOfficerName || 'EXAMINATION OFFICER',
          schoolLogo: targetProfile.logo || generateSchoolCrestSvg(targetProfile.name),
          schoolStamp: targetProfile.stamp || generateSchoolStampSvg(targetProfile.name, targetProfile.address, targetProfile.motto),
          theme: targetProfile.theme || 'navy-gold',
          classes: targetProfile.classes || [...SCHOOL_CLASSES],
          juniorSubjects: targetProfile.juniorSubjects || [...JUNIOR_SUBJECTS],
          seniorSubjects: targetProfile.seniorSubjects || [...SENIOR_SUBJECTS],
          adminEmail: targetProfile.adminEmail,
          learnerIdPrefix: targetProfile.learnerIdPrefix,
          staffIdPrefix: targetProfile.staffIdPrefix,
        };
      }
    } catch (_) {}
    setSettings(loadedSettings);

    // 2. Load teachers
    let loadedTeachers = INITIAL_TEACHERS;
    try {
      const saved = localStorage.getItem(getSchoolStorageKey(STORAGE_KEY_TEACHERS, targetSchoolId));
      if (saved) {
        loadedTeachers = JSON.parse(saved);
      } else {
        const defaultAdmin: Teacher = {
          id: `admin-${targetSchoolId}`,
          name: targetProfile.adminName || 'SUPER ADMIN',
          email: targetProfile.adminEmail || targetProfile.email,
          role: 'super_admin',
          staffId: `${targetProfile.staffIdPrefix || 'STAFF/'}001`,
          assignedClasses: targetProfile.classes || [...SCHOOL_CLASSES],
          assignedSubjects: Array.from(new Set([...(targetProfile.juniorSubjects || JUNIOR_SUBJECTS), ...(targetProfile.seniorSubjects || SENIOR_SUBJECTS)])),
          password: SUPER_ADMIN_PORTAL_PASSWORD,
          registeredAt: new Date().toISOString(),
        };
        loadedTeachers = [defaultAdmin];
      }
    } catch (_) {}
    setTeachers(loadedTeachers);

    // 3. Set current user
    const adminUser = loadedTeachers.find(t => t.role === 'super_admin') || loadedTeachers[0];
    if (adminUser) setCurrentUser(adminUser);

    // 4. Load students
    let loadedStudents: Student[] = [];
    try {
      const saved = localStorage.getItem(getSchoolStorageKey(STORAGE_KEY_STUDENTS, targetSchoolId));
      if (saved) {
        loadedStudents = JSON.parse(saved);
      }
    } catch (_) {}
    setStudents(loadedStudents);

    // 5. Load active term
    try {
      const savedTerm = localStorage.getItem(getSchoolStorageKey('stp_school_active_term', targetSchoolId));
      if (savedTerm) setActiveTermState(savedTerm);
    } catch (_) {}

    // 6. Direct Cloud Synchronization for this school
    synchronizeCloudAndLocalStorage(loadedStudents, loadedSettings).then(({ mergedStudents, isUpdated }) => {
      if (isUpdated && mergedStudents && mergedStudents.length > 0) {
        const ranked = calculateAllRankings(mergedStudents, loadedSettings.term);
        setStudents(ranked);
      }
    });

    addLog('School Switched', `Active school portal switched to ${targetProfile.name} (${targetSchoolId})`);
  }, [schoolRegistry, addLog]);

  // Create an Independent School (Sign Up with Gmail)
  const createIndependentSchool = useCallback((
    profileData: Partial<SchoolProfile> & { name: string; email: string },
    adminTeacherData?: Partial<Teacher>,
    initialOption: 'clean' | 'sample' = 'sample'
  ): SchoolProfile => {
    const rawName = profileData.name.trim();
    const slugBase = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 24);
    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const newId = `school-${slugBase}-${uniqueSuffix}`;

    const adminEmail = profileData.adminEmail || profileData.email;
    const adminName = profileData.adminName || adminTeacherData?.name || 'SUPER ADMIN';
    const theme = profileData.theme || 'navy-gold';
    const address = profileData.address?.trim() || 'CAMPUS ROAD, NIGERIA';
    const motto = profileData.motto?.trim() || 'EXCELLENCE, KNOWLEDGE & INTEGRITY';
    const phone = profileData.phone?.trim() || '+234 803 000 0000';
    const principalName = profileData.principalName?.trim() || 'REV. PRINCIPAL / SUPER ADMIN';
    const examOfficerName = profileData.examOfficerName?.trim() || 'EXAMINATION OFFICER';

    const words = rawName.split(/\s+/).filter(Boolean);
    const initials = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
    const learnerPrefix = profileData.learnerIdPrefix?.trim() || `${initials}/`;
    const staffPrefix = profileData.staffIdPrefix?.trim() || `${initials}/TCH/`;

    const themeConf = getThemeConfig(theme);
    const generatedLogo = profileData.logo || generateSchoolCrestSvg(rawName, themeConf.primaryColor, themeConf.accentColor);
    const generatedStamp = profileData.stamp || generateSchoolStampSvg(rawName, address, motto);

    const classes = profileData.classes?.length ? profileData.classes : [...SCHOOL_CLASSES];
    const juniorSubjects = profileData.juniorSubjects?.length ? profileData.juniorSubjects : [...JUNIOR_SUBJECTS];
    const seniorSubjects = profileData.seniorSubjects?.length ? profileData.seniorSubjects : [...SENIOR_SUBJECTS];

    const newProfile: SchoolProfile = {
      id: newId,
      name: rawName.toUpperCase(),
      motto,
      address: address.toUpperCase(),
      email: profileData.email,
      phone,
      principalName,
      examOfficerName,
      theme,
      logo: generatedLogo,
      stamp: generatedStamp,
      stampOpacity: profileData.stampOpacity || 0.88,
      stampRotation: profileData.stampRotation || -6,
      adminEmail,
      adminName,
      createdAt: new Date().toISOString(),
      classes,
      juniorSubjects,
      seniorSubjects,
      isCustomSchool: true,
      learnerIdPrefix: learnerPrefix,
      staffIdPrefix: staffPrefix,
    };

    const newSettings: SchoolSettings = {
      schoolId: newId,
      schoolName: rawName.toUpperCase(),
      schoolMotto: motto,
      schoolAddress: address.toUpperCase(),
      schoolEmail: profileData.email,
      schoolPhone: phone,
      principalName,
      examOfficerName,
      schoolLogo: generatedLogo,
      schoolStamp: generatedStamp,
      schoolStampUploadedAt: new Date().toISOString(),
      schoolStampOpacity: 0.88,
      schoolStampRotation: -6,
      theme,
      term: 'Third Term',
      availableTerms: ['First Term', 'Second Term', 'Third Term'],
      session: '2025/2026',
      daysSchoolOpened: 114,
      nextTermResumption: '07/09/26',
      isTermLocked: false,
      allowAllTeachersScoreEntry: true,
      classes,
      juniorSubjects,
      seniorSubjects,
      juniorCAConfig: DEFAULT_JUNIOR_CA_CONFIG,
      seniorCAConfig: DEFAULT_SENIOR_CA_CONFIG,
      gradingScale: [...DEFAULT_GRADING_SCALE],
      adminEmail,
      learnerIdPrefix: learnerPrefix,
      staffIdPrefix: staffPrefix,
    };

    const newAdminTeacher: Teacher = {
      id: `admin-${newId}`,
      name: adminName.toUpperCase(),
      firstName: adminTeacherData?.firstName || 'SUPER',
      lastName: adminTeacherData?.lastName || 'ADMIN',
      title: adminTeacherData?.title || 'Dr.',
      email: adminEmail,
      role: 'super_admin',
      staffId: `${staffPrefix}001`,
      assignedClasses: [...classes],
      assignedSubjects: Array.from(new Set([...juniorSubjects, ...seniorSubjects])),
      password: SUPER_ADMIN_PORTAL_PASSWORD,
      registeredAt: new Date().toISOString(),
    };

    // Starter Students
    let initialStudents: Student[] = [];
    if (initialOption === 'sample') {
      const sampleNames = [
        'Emmanuel Adebayo', 'Blessing Okon', 'Chinedu Eze', 'Fatima Bello',
        'David Olumide', 'Amina Ibrahim', 'Grace Sunday', 'Michael Danjuma',
        'Zainab Mohammed', 'Victor Chukwu', 'Precious Audu', 'Samuel Ojo'
      ];
      initialStudents = sampleNames.map((name, i) => {
        const targetClass = classes[i % classes.length];
        return createDefaultStudentTemplate({
          name,
          className: targetClass,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          learnerId: `${learnerPrefix}2026/${String(i + 1).padStart(3, '0')}`,
        }, newSettings);
      });
      initialStudents = calculateAllRankings(initialStudents, 'Third Term');
    }

    // Persist to scoped localStorage
    try {
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_SETTINGS, newId), JSON.stringify(newSettings));
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_TEACHERS, newId), JSON.stringify([newAdminTeacher]));
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_STUDENTS, newId), JSON.stringify(initialStudents));
      localStorage.setItem(getSchoolStorageKey(STORAGE_KEY_LOGS, newId), JSON.stringify([{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        teacherName: newAdminTeacher.name,
        staffId: newAdminTeacher.staffId,
        action: 'School Established',
        details: `Independent school portal initialized for ${newProfile.name} by ${adminEmail}`,
      }]));
    } catch (_) {}

    // Cloud Firestore Sync
    saveSchoolProfileToCloud(newProfile).catch(err => console.warn('Could not save school profile to cloud:', err));
    syncSettingsToCloud(newSettings, newId).catch(err => console.warn('Could not sync school settings to cloud:', err));
    saveSystemSnapshotToCloud(initialStudents, newSettings, [newAdminTeacher], newId).catch(err => console.warn('Could not save snapshot:', err));

    // Update School Registry State
    setSchoolRegistry(prev => {
      const updated = [newProfile, ...prev.filter(p => p.id !== newId)];
      try {
        localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // Switch active school immediately to the newly created school
    setActiveSchoolIdState(newId);
    setActiveSchoolId(newId);
    setSettings(newSettings);
    setTeachers([newAdminTeacher]);
    setCurrentUser(newAdminTeacher);
    setStudents(initialStudents);

    addLog('School Registered', `Created independent school ${newProfile.name} (${newId}) with Gmail ${adminEmail}`);

    return newProfile;
  }, [addLog]);

  // Class Management (Add / Remove)
  const addClass = useCallback((className: string) => {
    const clean = className.trim().toUpperCase();
    if (!clean) return;
    setSettings(prev => {
      const currentClasses = prev.classes || [...SCHOOL_CLASSES];
      if (currentClasses.includes(clean)) return prev;
      const updated = [...currentClasses, clean];
      return { ...prev, classes: updated };
    });
    setSchoolRegistry(prev => prev.map(p => {
      if (p.id !== activeSchoolId) return p;
      const cur = p.classes || [...SCHOOL_CLASSES];
      if (cur.includes(clean)) return p;
      return { ...p, classes: [...cur, clean] };
    }));
    addLog('Class Added', `Super Admin added class ${clean} to school curriculum`);
  }, [activeSchoolId, addLog]);

  const removeClass = useCallback((className: string) => {
    const clean = className.trim().toUpperCase();
    setSettings(prev => {
      const currentClasses = prev.classes || [...SCHOOL_CLASSES];
      return { ...prev, classes: currentClasses.filter(c => c !== clean) };
    });
    setSchoolRegistry(prev => prev.map(p => {
      if (p.id !== activeSchoolId) return p;
      const cur = p.classes || [...SCHOOL_CLASSES];
      return { ...p, classes: cur.filter(c => c !== clean) };
    }));
    addLog('Class Removed', `Super Admin removed class ${clean} from school structure`);
  }, [activeSchoolId, addLog]);

  // Subject Management (Add / Remove)
  const addSubject = useCallback((subject: string, section: SchoolSection) => {
    const clean = subject.trim().toUpperCase();
    if (!clean) return;
    setSettings(prev => {
      if (section === 'JUNIOR') {
        const cur = prev.juniorSubjects || [...JUNIOR_SUBJECTS];
        if (cur.includes(clean)) return prev;
        return { ...prev, juniorSubjects: [...cur, clean] };
      } else {
        const cur = prev.seniorSubjects || [...SENIOR_SUBJECTS];
        if (cur.includes(clean)) return prev;
        return { ...prev, seniorSubjects: [...cur, clean] };
      }
    });
    setSchoolRegistry(prev => prev.map(p => {
      if (p.id !== activeSchoolId) return p;
      if (section === 'JUNIOR') {
        const cur = p.juniorSubjects || [...JUNIOR_SUBJECTS];
        if (cur.includes(clean)) return p;
        return { ...p, juniorSubjects: [...cur, clean] };
      } else {
        const cur = p.seniorSubjects || [...SENIOR_SUBJECTS];
        if (cur.includes(clean)) return p;
        return { ...p, seniorSubjects: [...cur, clean] };
      }
    }));
    addLog('Subject Added', `Super Admin added ${clean} to ${section} curriculum`);
  }, [activeSchoolId, addLog]);

  const removeSubject = useCallback((subject: string, section: SchoolSection) => {
    const clean = subject.trim().toUpperCase();
    setSettings(prev => {
      if (section === 'JUNIOR') {
        const cur = prev.juniorSubjects || [...JUNIOR_SUBJECTS];
        return { ...prev, juniorSubjects: cur.filter(s => s !== clean) };
      } else {
        const cur = prev.seniorSubjects || [...SENIOR_SUBJECTS];
        return { ...prev, seniorSubjects: cur.filter(s => s !== clean) };
      }
    });
    setSchoolRegistry(prev => prev.map(p => {
      if (p.id !== activeSchoolId) return p;
      if (section === 'JUNIOR') {
        const cur = p.juniorSubjects || [...JUNIOR_SUBJECTS];
        return { ...p, juniorSubjects: cur.filter(s => s !== clean) };
      } else {
        const cur = p.seniorSubjects || [...SENIOR_SUBJECTS];
        return { ...p, seniorSubjects: cur.filter(s => s !== clean) };
      }
    }));
    addLog('Subject Removed', `Super Admin removed ${clean} from ${section} curriculum`);
  }, [activeSchoolId, addLog]);

  // Update School Theme
  const updateSchoolTheme = useCallback((themeId: SchoolThemeId) => {
    setSettings(prev => ({ ...prev, theme: themeId }));
    setSchoolRegistry(prev => prev.map(p => p.id === activeSchoolId ? { ...p, theme: themeId } : p));
    addLog('Theme Updated', `Updated school brand theme to ${themeId}`);
  }, [activeSchoolId, addLog]);

  // Delete School Profile
  const deleteSchool = useCallback((schoolId: string): boolean => {
    if (schoolId === 'stpaul') {
      throw new Error('Cannot delete reference school St. Paul College.');
    }
    setSchoolRegistry(prev => {
      const updated = prev.filter(p => p.id !== schoolId);
      try {
        localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    if (activeSchoolId === schoolId) {
      switchSchool('stpaul');
    }
    addLog('School Deleted', `Deleted independent school ${schoolId}`);
    return true;
  }, [activeSchoolId, switchSchool, addLog]);

  // Upload or update official school logo (Super Admin)
  const updateSchoolLogo = useCallback((logoBase64: string) => {
    setSettings(prev => ({ ...prev, schoolLogo: logoBase64 }));
    addLog('School Logo Updated', 'Super Admin updated official school crest logo');
  }, [addLog]);

  // Upload or update official school stamp from PC (Super Admin) - appears on all result sheets
  const updateSchoolStamp = useCallback((stampBase64: string, fileName?: string) => {
    setSettings(prev => ({
      ...prev,
      schoolStamp: stampBase64,
      schoolStampUploadedAt: new Date().toISOString(),
      schoolStampFileName: fileName || 'official-school-stamp.png',
      schoolStampOpacity: prev.schoolStampOpacity || 0.88,
      schoolStampRotation: prev.schoolStampRotation || -6,
    }));
    addLog(
      'School Stamp Uploaded',
      `Super Admin uploaded official school stamp from PC${fileName ? ` (${fileName})` : ''} - applied to all student result sheets`
    );
  }, [addLog]);

  // Remove uploaded school stamp (revert to default official seal)
  const removeSchoolStamp = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      schoolStamp: DEFAULT_OFFICIAL_STAMP,
      schoolStampUploadedAt: undefined,
      schoolStampFileName: undefined,
    }));
    addLog('School Stamp Reset', 'Super Admin restored default official school seal');
  }, [addLog]);

  // Input score directly for a student (Available to EVERY teacher)
  const inputTeacherScoreDirectly = useCallback((
    studentId: string,
    subject: string,
    scores: {
      ca1?: number | null;
      ca2?: number | null;
      ca3?: number | null;
      ca4?: number | null;
      exam?: number | null;
    },
    termParam?: string
  ) => {
    updateStudentScore(
      studentId,
      subject,
      scores.ca1 !== undefined ? scores.ca1 : null,
      scores.ca2 !== undefined ? scores.ca2 : null,
      scores.ca3 !== undefined ? scores.ca3 : null,
      scores.ca4 !== undefined ? scores.ca4 : null,
      scores.exam !== undefined ? scores.exam : null,
      'submitted',
      termParam
    );
  }, [updateStudentScore]);

  // Batch direct mark input for multiple students (Available to EVERY teacher)
  const batchInputTeacherScores = useCallback((
    className: string,
    subject: string,
    updates: Array<{
      studentId: string;
      ca1?: number | null;
      ca2?: number | null;
      ca3?: number | null;
      ca4?: number | null;
      exam?: number | null;
    }>,
    termParam?: string
  ) => {
    const formatted = updates.map(u => ({
      studentId: u.studentId,
      ca1: u.ca1 !== undefined ? u.ca1 : null,
      ca2: u.ca2 !== undefined ? u.ca2 : null,
      ca3: u.ca3 !== undefined ? u.ca3 : null,
      ca4: u.ca4 !== undefined ? u.ca4 : null,
      exam: u.exam !== undefined ? u.exam : null,
    }));
    batchUpdateSubjectScores(className, subject, formatted, termParam);
    addLog(
      'Direct Mark Entry',
      `${currentUser.name} (${currentUser.staffId}) recorded marks directly for ${updates.length} students in ${className} - ${subject}`
    );
    return { success: true, count: updates.length };
  }, [batchUpdateSubjectScores, currentUser, addLog]);

  // Update Junior, Senior or Both CA & Exam Score Percentages (Enforces <= 100%)
  const updateSectionCAConfig = useCallback((
    section: 'JUNIOR' | 'SENIOR' | 'BOTH', 
    newConfig: { ca1Max: number; ca2Max: number; ca3Max: number; ca4Max: number; examMax: number },
    recalculateScores: boolean = false
  ) => {
    const total = 
      Number(newConfig.ca1Max || 0) + 
      Number(newConfig.ca2Max || 0) + 
      Number(newConfig.ca3Max || 0) + 
      Number(newConfig.ca4Max || 0) + 
      Number(newConfig.examMax || 0);

    if (total > 100) {
      throw new Error(`Total percentage weight cannot exceed 100%. Provided total is ${total}%.`);
    }

    const fullConfig: CAWeightConfig = {
      ...newConfig,
      totalMax: 100,
    };

    setSettings(prev => {
      if (section === 'BOTH') {
        return {
          ...prev,
          juniorCAConfig: fullConfig,
          seniorCAConfig: fullConfig,
        };
      }
      return {
        ...prev,
        [section === 'JUNIOR' ? 'juniorCAConfig' : 'seniorCAConfig']: fullConfig,
      };
    });

    if (recalculateScores) {
      setStudents(prevStudents => {
        const updated = prevStudents.map(student => {
          const isJun = isJuniorClass(student.className);
          const shouldUpdate = section === 'BOTH' || (section === 'JUNIOR' && isJun) || (section === 'SENIOR' && !isJun);
          if (!shouldUpdate) return student;

          const updateScoreRecord = (scoresMap: Record<string, SubjectScore>) => {
            const mapped: Record<string, SubjectScore> = {};
            for (const [subj, sc] of Object.entries(scoresMap)) {
              const ca1 = sc.ca1 !== null && sc.ca1 !== undefined ? Math.min(fullConfig.ca1Max, sc.ca1) : null;
              const ca2 = sc.ca2 !== null && sc.ca2 !== undefined ? Math.min(fullConfig.ca2Max, sc.ca2) : null;
              const ca3 = sc.ca3 !== null && sc.ca3 !== undefined ? Math.min(fullConfig.ca3Max, sc.ca3) : null;
              const ca4 = sc.ca4 !== null && sc.ca4 !== undefined ? Math.min(fullConfig.ca4Max, sc.ca4) : null;
              const exam = sc.exam !== null && sc.exam !== undefined ? Math.min(fullConfig.examMax, sc.exam) : null;
              const scoreTotal = computeTotal(ca1, ca2, ca3, ca4, exam);
              const grade = calculateGrade(scoreTotal, settings.gradingScale);
              mapped[subj] = {
                ...sc,
                ca1,
                ca2,
                ca3,
                ca4,
                exam,
                total: scoreTotal,
                grade,
              };
            }
            return mapped;
          };

          const newScores = updateScoreRecord(student.scores);
          let newTermScores: Record<string, Record<string, SubjectScore>> | undefined;
          if (student.termScores) {
            newTermScores = {};
            for (const [tKey, tMap] of Object.entries(student.termScores)) {
              newTermScores[tKey] = updateScoreRecord(tMap);
            }
          }

          return {
            ...student,
            scores: newScores,
            termScores: newTermScores || student.termScores,
          };
        });

        return calculateAllRankings(updated, activeTerm, settings.gradingScale);
      });
    }

    addLog(
      'Score Percentages Updated', 
      `Super Admin adjusted ${section} scoring weights: CA1 (${newConfig.ca1Max}%), CA2 (${newConfig.ca2Max}%), CA3 (${newConfig.ca3Max}%), CA4 (${newConfig.ca4Max}%), Exam (${newConfig.examMax}%). Total: ${total}%.${recalculateScores ? ' Recalculated student scores.' : ''}`
    );
  }, [activeTerm, addLog]);

  // Update School Grading System Scale
  const updateGradingScale = useCallback((newScale: GradeScaleItem[]) => {
    setSettings(prev => ({
      ...prev,
      gradingScale: newScale,
    }));
    // Recalculate all grades with the updated scale
    setStudents(prev => {
      const updated = prev.map(student => {
        const updateScoreRecord = (scoresMap: Record<string, SubjectScore>) => {
          const mapped: Record<string, SubjectScore> = {};
          for (const [subj, sc] of Object.entries(scoresMap)) {
            const grade = calculateGrade(sc.total, newScale);
            mapped[subj] = { ...sc, grade };
          }
          return mapped;
        };
        const newScores = updateScoreRecord(student.scores);
        let newTermScores: Record<string, Record<string, SubjectScore>> | undefined;
        if (student.termScores) {
          newTermScores = {};
          for (const [tKey, tMap] of Object.entries(student.termScores)) {
            newTermScores[tKey] = updateScoreRecord(tMap);
          }
        }
        return {
          ...student,
          scores: newScores,
          termScores: newTermScores || student.termScores,
        };
      });
      return calculateAllRankings(updated, activeTerm, newScale);
    });
    addLog('Grading System Updated', `Super Admin updated the official school grading system & scale thresholds.`);
  }, [activeTerm, addLog]);

  // Assign or update teacher (names, staff ID, role, classes, subjects, email, phone, etc.)
  const updateTeacher = useCallback((updatedTeacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
    setCurrentUser(curr => curr.id === updatedTeacher.id ? updatedTeacher : curr);
    addLog('Teacher Profile Updated', `Admin updated credentials and profile for ${updatedTeacher.name} (${updatedTeacher.staffId})`);
  }, [addLog]);

  // Register a new teacher (Sign Up / Direct Assignment in Once)
  const registerTeacher = useCallback((newTeacherData: Omit<Teacher, 'id'> & { id?: string; firstName?: string; lastName?: string; title?: string }): Teacher => {
    const generatedStaffId = newTeacherData.staffId?.trim() || `STP/TCH/${String(teachers.length + 1).padStart(3, '0')}`;
    const firstName = newTeacherData.firstName?.trim() || '';
    const lastName = newTeacherData.lastName?.trim() || '';
    const title = newTeacherData.title?.trim() || '';
    let teacherName = newTeacherData.name?.trim() || '';
    if (!teacherName && (firstName || lastName)) {
      teacherName = [title, firstName, lastName].filter(Boolean).join(' ');
    }
    const defaultEmail = (firstName && lastName)
      ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@stpaulcollege.abjce.org.ng`
      : `${teacherName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@stpaulcollege.abjce.org.ng`;

    const newTeacher: Teacher = {
      ...newTeacherData,
      name: teacherName || `Teacher ${teachers.length + 1}`,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      title: title || undefined,
      email: newTeacherData.email?.trim() || defaultEmail,
      id: newTeacherData.id || `tch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      staffId: generatedStaffId,
      assignedClasses: newTeacherData.assignedClasses?.length ? newTeacherData.assignedClasses : ['JSS 1 A'],
      assignedSubjects: newTeacherData.assignedSubjects?.length ? newTeacherData.assignedSubjects : ['MATHEMATICS'],
      registeredAt: new Date().toISOString(),
    };

    setTeachers(prev => {
      // Check if teacher with same staff ID or email already exists
      const existingIndex = prev.findIndex(t => 
        t.staffId.toLowerCase() === newTeacher.staffId.toLowerCase() || 
        (newTeacher.email && t.email.toLowerCase() === newTeacher.email.toLowerCase())
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newTeacher };
        return updated;
      }
      return [...prev, newTeacher];
    });

    // Auto log-in newly registered teacher so they can immediately upload marks
    setCurrentUser(newTeacher);

    addLog(
      'Teacher Signup',
      `Teacher ${newTeacher.name} (${newTeacher.staffId}) registered as ${newTeacher.role.replace('_', ' ')} with ${newTeacher.assignedSubjects.length} subjects & ${newTeacher.assignedClasses.length} classes`
    );

    return newTeacher;
  }, [teachers.length, addLog]);

  // Teacher Login via First Name, Last Name, Staff ID, or Email
  const loginTeacher = useCallback((staffIdOrEmail: string, password?: string): { success: boolean; teacher?: Teacher; message: string } => {
    const rawQuery = staffIdOrEmail.trim();
    const cleanQuery = rawQuery.toLowerCase();
    const cleanCompactQuery = cleanQuery.replace(/[^a-z0-9\s@._-]/g, '').replace(/\s+/g, ' ').trim();

    // Helper to strip honorific titles (e.g. Mr, Mrs, Miss, Dr, Prof, Rev, etc.)
    const stripTitle = (str: string) => {
      return str.replace(/^(mr|mrs|miss|ms|dr|prof|rev|pastor|pst|engr|mal|malam|alhaji|hajia)\.?\s+/i, '').trim();
    };

    const queryWithoutTitle = stripTitle(cleanCompactQuery);
    const queryTokens = queryWithoutTitle.split(/\s+/).filter(Boolean);

    const found = teachers.find(t => {
      // 1. Direct match on Staff ID or Email
      if (t.staffId.trim().toLowerCase() === cleanQuery) return true;
      if (t.email && t.email.trim().toLowerCase() === cleanQuery) return true;

      // 2. Direct match on Full Name (case-insensitive)
      const tName = t.name.trim().toLowerCase();
      const tNameClean = tName.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      if (tNameClean === cleanCompactQuery) return true;

      const tNameWithoutTitle = stripTitle(tNameClean);
      if (tNameWithoutTitle === queryWithoutTitle) return true;

      // 3. Match on Name components (First Name, Last Name, or First + Last)
      const nameParts = tNameWithoutTitle.split(/\s+/).filter(Boolean);
      if (nameParts.length === 0) return false;

      // If user typed single name (first name or last name)
      if (queryTokens.length === 1) {
        const singleToken = queryTokens[0];
        if (nameParts.some(part => part === singleToken || (singleToken.length >= 3 && part.startsWith(singleToken)))) {
          return true;
        }
      }

      // If user typed "First Last" or "Last First"
      if (queryTokens.length >= 2) {
        // Check if all query tokens appear in teacher name parts
        const allQueryTokensInTeacher = queryTokens.every(qTok => 
          nameParts.some(p => p === qTok || (qTok.length >= 3 && p.startsWith(qTok)))
        );
        if (allQueryTokensInTeacher) return true;

        // Check if all teacher tokens appear in query
        const allTeacherTokensInQuery = nameParts.every(p => 
          queryTokens.some(qTok => qTok === p || (p.length >= 3 && qTok.startsWith(p)))
        );
        if (allTeacherTokensInQuery) return true;

        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        if (`${firstName} ${lastName}` === queryWithoutTitle) return true;
        if (`${lastName} ${firstName}` === queryWithoutTitle) return true;
      }

      // Fallback: Check Super Admin keywords
      if (
        (t.role === 'super_admin' || t.id === 't-admin') &&
        (queryWithoutTitle.includes('admin') || queryWithoutTitle.includes('peter') || queryWithoutTitle.includes('sule'))
      ) {
        return true;
      }

      return false;
    });

    if (!found) {
      return { 
        success: false, 
        message: `No teacher account found matching "${rawQuery}". You can sign in using your First Name, Last Name, Staff ID, or Email.` 
      };
    }

    const isSuperAdminAccount = found.role === 'super_admin' || found.id === 't-admin' || found.staffId === 'STP/ADMIN/001';
    if (isSuperAdminAccount) {
      if (password && password.trim() !== SUPER_ADMIN_PORTAL_PASSWORD && password.trim() !== STAFF_PORTAL_PASSWORD) {
        return { 
          success: false, 
          message: 'Invalid Super Administrator access password. Please enter UPgrade2026.' 
        };
      }
    } else {
      if (found.password && password && found.password !== password && password !== STAFF_PORTAL_PASSWORD) {
        return { success: false, message: 'Invalid password/PIN for this teacher account.' };
      }
    }

    setCurrentUser(found);
    try {
      localStorage.setItem('stpaul_auth_teacher_id', found.id);
    } catch (_) {}
    addLog('Teacher Login', `${found.name} (${found.staffId}) signed into portal`);
    return { success: true, teacher: found, message: `Welcome back, ${found.name}!` };
  }, [teachers, addLog]);

  // Delete/remove a teacher
  const deleteTeacher = useCallback((teacherId: string) => {
    const target = teachers.find(t => t.id === teacherId);
    if (!target) return;
    if (target.role === 'super_admin' || target.id === 't-admin') {
      throw new Error('Cannot delete the Super Administrator account.');
    }
    if (target.role === 'admin' && teachers.filter(t => t.role === 'admin').length <= 1) {
      throw new Error('Cannot delete the primary administrator account.');
    }
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
    if (currentUser.id === teacherId) {
      setCurrentUser(INITIAL_TEACHERS[0]);
    }
    addLog('Teacher Removed', `Removed teacher ${target.name} (${target.staffId}) from roster`);
  }, [teachers, currentUser.id, addLog]);

  // Reset data to clean official baseline
  const resetToSeedData = useCallback(() => {
    setStudents([]);
    setTeachers(INITIAL_TEACHERS);
    setSettings(INITIAL_SCHOOL_SETTINGS);
    addLog('System Reset', 'Reset school records and broadsheets to official clean baseline');
  }, [addLog]);

  return {
    schoolRegistry,
    activeSchoolId,
    activeSchoolProfile,
    switchSchool,
    createIndependentSchool,
    updateSchoolSettings,
    addClass,
    removeClass,
    addSubject,
    removeSubject,
    updateSchoolTheme,
    deleteSchool,
    currentUser,
    setCurrentUser,
    activeTerm,
    setActiveTerm,
    settings,
    updateSettings,
    updateSchoolLogo,
    updateSchoolStamp,
    removeSchoolStamp,
    inputTeacherScoreDirectly,
    batchInputTeacherScores,
    updateSectionCAConfig,
    updateGradingScale,
    teachers,
    updateTeacher,
    registerTeacher,
    loginTeacher,
    deleteTeacher,
    students,
    setStudents,
    auditLogs,
    sheetsConfig,
    setSheetsConfig,
    canEditSubject,
    canEditFormTeacherSection,
    canEditPrincipalSection,
    canUpdatePassport,
    updateStudentScore,
    batchUpdateSubjectScores,
    updateStudentAssessments,
    updatePrincipalComment,
    updateStudentComments,
    batchUpdateComments,
    updateStudentPassport,
    batchUpdatePassports,
    registerStudent,
    updateStudent,
    deleteStudent,
    importExternalPortalStudents,
    previewBulkPromotion,
    bulkPromoteStudents,
    promoteStudentsInBulk,
    resetToSeedData,
    addLog,
    cloudSyncInfo,
    forceCloudSync: useCallback(async () => {
      addLog('Cloud Sync Triggered', 'Manual direct synchronization between Cloud Firestore and Local Storage');
      const { mergedStudents, isUpdated } = await synchronizeCloudAndLocalStorage(students, settings);
      if (isUpdated || (mergedStudents && mergedStudents.length > 0)) {
        const ranked = calculateAllRankings(mergedStudents, activeTerm);
        setStudents(ranked);
        try {
          localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(ranked));
        } catch (_) {}
      }
    }, [students, settings, activeTerm, addLog]),
  };
}
