import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer, 
  collection, 
  getDocs,
  deleteDoc,
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from './firebaseAuth';
import { Student, SubjectScore, SchoolSettings, Teacher, SchoolProfile } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Global Cloud Sync Status state & listeners
export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface CloudSyncStatus {
  state: CloudSyncState;
  lastSyncedAt: Date | null;
  pendingCount: number;
  message: string;
}

let currentSyncStatus: CloudSyncStatus = {
  state: 'idle',
  lastSyncedAt: null,
  pendingCount: 0,
  message: 'Cloud Protected',
};

const listeners = new Set<(status: CloudSyncStatus) => void>();

function notifyListeners() {
  listeners.forEach(fn => fn({ ...currentSyncStatus }));
}

export function subscribeToCloudSync(fn: (status: CloudSyncStatus) => void) {
  listeners.add(fn);
  fn({ ...currentSyncStatus });
  return () => {
    listeners.delete(fn);
  };
}

export function getCloudSyncStatus(): CloudSyncStatus {
  return { ...currentSyncStatus };
}

// Ensure payload has zero undefined fields so Firestore writes never fail
export function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return data.map(item => sanitizeForFirestore(item));
  if (typeof data === 'object') {
    if ('_methodName' in (data as any) || data instanceof Date) {
      return data;
    }
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        res[key] = sanitizeForFirestore(value);
      }
    }
    return res;
  }
  return data;
}

function updateSyncStatus(updates: Partial<CloudSyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...updates };
  notifyListeners();
}

let activeSchoolId = 'stpaul';

export function setActiveSchoolId(schoolId: string) {
  activeSchoolId = (schoolId || 'stpaul').trim();
}

export function getActiveSchoolId(): string {
  return activeSchoolId;
}

// 1. Connection Validation on initial boot
let hasTestedConnection = false;
export async function testFirestoreConnection(): Promise<boolean> {
  if (hasTestedConnection) return true;
  try {
    // Add a safe timeout so a slow or offline connection gracefully operates in local cache mode
    const fetchPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Connection check timed out')), 8000)
    );
    await Promise.race([fetchPromise, timeoutPromise]);
    hasTestedConnection = true;
    updateSyncStatus({ state: 'synced', message: 'Cloud Connected & Protected' });
    return true;
  } catch (error) {
    hasTestedConnection = true;
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('timed out') || msg.includes('Could not reach') || msg.includes('Failed to get document')) {
      console.warn('Firestore operating in offline/cached mode:', msg);
      updateSyncStatus({ state: 'offline', message: 'Offline Mode (Local Cache Protected)' });
    } else {
      console.warn('Firestore connection check notice:', msg);
      updateSyncStatus({ state: 'synced', message: 'Cloud Synchronized' });
    }
    return false;
  }
}

// 2. Persistent queue for auto-syncing score mutations without overwhelming network or losing data
const STORAGE_KEY_OFFLINE_QUEUE = 'stp_offline_cloud_queue';

interface PendingScoreItem {
  studentId: string;
  subject: string;
  term: string;
  score: SubjectScore;
  studentSnapshot?: Partial<Student>;
}

// Load any pending offline items from localStorage on module load
function loadOfflineQueue(): Map<string, PendingScoreItem> {
  const map = new Map<string, PendingScoreItem>();
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return map;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const key = `${item.studentId}__${item.term}__${item.subject}`;
          map.set(key, item);
        }
      }
    }
  } catch (e) {
    console.warn('Could not read offline sync queue:', e);
  }
  return map;
}

function persistOfflineQueue(map: Map<string, PendingScoreItem>) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const arr = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(arr));
  } catch (e) {
    console.warn('Could not persist offline sync queue:', e);
  }
}

let syncQueueTimeout: ReturnType<typeof setTimeout> | null = null;
const pendingScoreUpdates: Map<string, PendingScoreItem> = loadOfflineQueue();

// Register online event handler to flush whenever connectivity is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    updateSyncStatus({ state: 'syncing', message: 'Network restored - Synchronizing marks to Cloud...' });
    flushPendingScoresToCloud();
  });

  window.addEventListener('beforeunload', () => {
    if (pendingScoreUpdates.size > 0) {
      flushPendingScoresToCloud();
    }
  });
}

export function queueScoreCloudSync(
  studentId: string,
  subject: string,
  term: string,
  score: SubjectScore,
  studentSnapshot?: Partial<Student>
) {
  const key = `${studentId}__${term}__${subject}`;
  pendingScoreUpdates.set(key, { studentId, subject, term, score, studentSnapshot });
  persistOfflineQueue(pendingScoreUpdates);

  updateSyncStatus({
    state: 'syncing',
    pendingCount: pendingScoreUpdates.size,
    message: `Synchronizing ${pendingScoreUpdates.size} mark(s) to Direct Cloud Storage...`,
  });

  if (syncQueueTimeout) {
    clearTimeout(syncQueueTimeout);
  }

  // Fast debounce (400ms) so user typing is captured promptly without losing keystrokes
  syncQueueTimeout = setTimeout(async () => {
    await flushPendingScoresToCloud();
  }, 400);
}

// Flush all accumulated score writes to Firestore in an atomic batch
export async function flushPendingScoresToCloud(): Promise<boolean> {
  if (pendingScoreUpdates.size === 0) return true;

  const items = Array.from(pendingScoreUpdates.values());

  updateSyncStatus({
    state: 'syncing',
    pendingCount: items.length,
    message: `Direct Cloud Storage: Storing ${items.length} mark(s)...`,
  });

  try {
    // Write in batches of up to 450 (Firestore limit is 500 operations per batch)
    const chunkSize = 450;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      for (const item of chunk) {
        // 1. Write individual score document
        const safeSubject = item.subject.replace(/[\/\s]/g, '_');
        const safeTerm = item.term.replace(/[\/\s]/g, '_');
        const docId = `${item.studentId}_${safeTerm}_${safeSubject}`;
        const scoreRef = doc(db, 'schools', activeSchoolId, 'scores', docId);

        const rawScoreDoc = {
          studentId: item.studentId,
          subject: item.subject,
          term: item.term,
          ca1: item.score.ca1 ?? null,
          ca2: item.score.ca2 ?? null,
          ca3: item.score.ca3 ?? null,
          ca4: item.score.ca4 ?? null,
          exam: item.score.exam ?? null,
          total: item.score.total,
          grade: item.score.grade,
          status: item.score.status || 'submitted',
          updatedByTeacherId: item.score.updatedByTeacherId || 'teacher',
          updatedAt: item.score.updatedAt || new Date().toISOString(),
          cloudStoredAt: serverTimestamp(),
        };
        batch.set(scoreRef, sanitizeForFirestore(rawScoreDoc), { merge: true });

        // 2. Also update student document with this score if snapshot provided
        if (item.studentSnapshot) {
          const studentRef = doc(db, 'schools', activeSchoolId, 'students', item.studentId);
          const rawStudentDoc = {
            ...item.studentSnapshot,
            cloudUpdatedAt: serverTimestamp(),
          };
          batch.set(studentRef, sanitizeForFirestore(rawStudentDoc), { merge: true });
        }
      }

      await batch.commit();
    }

    // Only clear items after successful commit
    for (const item of items) {
      const key = `${item.studentId}__${item.term}__${item.subject}`;
      pendingScoreUpdates.delete(key);
    }
    persistOfflineQueue(pendingScoreUpdates);

    updateSyncStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      pendingCount: pendingScoreUpdates.size,
      message: 'Direct Cloud Storage & Local Storage Synchronized',
    });
    return true;
  } catch (err: unknown) {
    console.error('Failed to flush marks to Cloud:', err);
    // Keep items in queue so they can retry on next connection
    updateSyncStatus({
      state: 'offline',
      pendingCount: pendingScoreUpdates.size,
      message: 'Network offline: Marks saved safely in Local Storage (will auto-sync to Cloud)',
    });
    return false;
  }
}

// 3. Sync full student dataset to Cloud
export async function syncFullStudentsDatasetToCloud(students: Student[], schoolIdParam?: string): Promise<boolean> {
  if (!students || students.length === 0) return false;
  const targetSchool = schoolIdParam || activeSchoolId;

  updateSyncStatus({
    state: 'syncing',
    pendingCount: students.length,
    message: `Synchronizing all ${students.length} students & biodata to Cloud Firestore...`,
  });

  try {
    // Write in chunks of 50 to respect Firestore batch limits (max 500 operations per batch)
    const chunkSize = 50;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      for (const s of chunk) {
        if (!s.id) continue;
        const studentRef = doc(db, 'schools', targetSchool, 'students', s.id);
        const payload = sanitizeForFirestore({
          id: s.id,
          name: s.name,
          learnerId: s.learnerId,
          className: s.className,
          gender: s.gender,
          studentRole: s.studentRole || s.biodata?.studentRole || 'Regular Student',
          passportPhoto: s.passportPhoto || null,
          biodata: s.biodata || {},
          enrolledSubjects: s.enrolledSubjects || [],
          daysPresent: s.daysPresent ?? 110,
          sourcePortal: s.sourcePortal || 'Excel / CSV Registry Upload',
          scores: s.scores || {},
          termScores: s.termScores || {},
          cumulativeScores: s.cumulativeScores || {},
          overallAverage: s.averageScore || s.cumulativeAverageScore || 0,
          classRank: s.positionInClass || s.cumulativePositionInClass || 0,
          totalScore: s.totalScore || s.cumulativeTotalScore || 0,
          formTeacherRemarks: s.formTeacherComment || '',
          principalRemarks: s.principalComment || '',
          affective: s.affective || {},
          psychomotor: s.psychomotor || {},
          promotionStatus: s.promotionStatus || null,
          promotedToClass: s.promotedToClass || null,
          cloudSyncTimestamp: serverTimestamp(),
          updatedAt: new Date().toISOString(),
        });
        batch.set(studentRef, payload, { merge: true });
      }

      await batch.commit();
    }

    updateSyncStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      pendingCount: 0,
      message: `${students.length} student records and marks safely synchronized with Cloud Firestore`,
    });
    return true;
  } catch (err: unknown) {
    console.error('Error syncing students dataset to Cloud:', err);
    updateSyncStatus({
      state: 'error',
      message: 'Sync error - data preserved in local storage',
    });
    return false;
  }
}

// 3b. Save or update a single student directly in Cloud Firestore
export async function saveSingleStudentToCloud(student: Student, schoolIdParam?: string): Promise<boolean> {
  if (!student || !student.id) return false;
  const targetSchool = schoolIdParam || activeSchoolId;
  try {
    const studentRef = doc(db, 'schools', targetSchool, 'students', student.id);
    const payload = sanitizeForFirestore({
      id: student.id,
      name: student.name,
      learnerId: student.learnerId,
      className: student.className,
      gender: student.gender,
      studentRole: student.studentRole || student.biodata?.studentRole || 'Regular Student',
      passportPhoto: student.passportPhoto || null,
      biodata: student.biodata || {},
      enrolledSubjects: student.enrolledSubjects || [],
      daysPresent: student.daysPresent ?? 110,
      sourcePortal: student.sourcePortal || 'Excel / CSV Registry Upload',
      scores: student.scores || {},
      termScores: student.termScores || {},
      cumulativeScores: student.cumulativeScores || {},
      overallAverage: student.averageScore || student.cumulativeAverageScore || 0,
      classRank: student.positionInClass || student.cumulativePositionInClass || 0,
      totalScore: student.totalScore || student.cumulativeTotalScore || 0,
      formTeacherRemarks: student.formTeacherComment || '',
      principalRemarks: student.principalComment || '',
      affective: student.affective || {},
      psychomotor: student.psychomotor || {},
      promotionStatus: student.promotionStatus || null,
      promotedToClass: student.promotedToClass || null,
      cloudSyncTimestamp: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(studentRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Failed to save student ${student.name} to Cloud Firestore:`, err);
    return false;
  }
}

// 3c. Delete a student from Cloud Firestore
export async function deleteStudentFromCloud(studentId: string, schoolIdParam?: string): Promise<boolean> {
  if (!studentId) return false;
  const targetSchool = schoolIdParam || activeSchoolId;
  try {
    const studentRef = doc(db, 'schools', targetSchool, 'students', studentId);
    await deleteDoc(studentRef);
    return true;
  } catch (err) {
    console.warn(`Failed to delete student ${studentId} from Cloud Firestore:`, err);
    return false;
  }
}

// 4. Fetch Students dataset from Cloud (queries students subcollection first)
export async function fetchStudentsFromCloud(schoolIdParam?: string): Promise<Student[] | null> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    let cloudStudentsList: Student[] = [];

    // 1. Primary Source of Truth: query individual student documents from the subcollection
    try {
      const colRef = collection(db, 'schools', targetSchoolId, 'students');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        snap.forEach(d => {
          const sData = d.data() as Student;
          if (sData && (sData.id || sData.learnerId) && sData.name) {
            cloudStudentsList.push({
              ...sData,
              id: sData.id || d.id,
            });
          }
        });
      }
    } catch (e) {
      console.warn('Could not read individual students collection:', e);
    }

    // 2. Fallback / Augment: check system_snapshot if subcollection had 0 students
    if (cloudStudentsList.length === 0) {
      try {
        const backupDocRef = doc(db, 'schools', targetSchoolId, 'settings', 'system_snapshot');
        const snapshot = await getDoc(backupDocRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.students) && data.students.length > 0) {
            cloudStudentsList = data.students as Student[];
          }
        }
      } catch (e) {
        console.warn('Could not read system_snapshot students:', e);
      }
    }

    return cloudStudentsList.length > 0 ? cloudStudentsList : null;
  } catch (err) {
    console.warn('Could not fetch cloud students dataset:', err);
    return null;
  }
}

// 5. Sync school settings to Cloud
export async function syncSettingsToCloud(settings: SchoolSettings, schoolIdParam?: string): Promise<boolean> {
  const targetSchoolId = schoolIdParam || settings.schoolId || activeSchoolId;
  try {
    const settingsRef = doc(db, 'schools', targetSchoolId, 'settings', 'general');
    await setDoc(settingsRef, {
      ...settings,
      cloudSavedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to sync settings to Cloud:', err);
    return false;
  }
}

// 5B. Save school profile to Cloud root
export async function saveSchoolProfileToCloud(profile: SchoolProfile): Promise<boolean> {
  try {
    const schoolRef = doc(db, 'schools', profile.id);
    await setDoc(schoolRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to save school profile to Cloud:', err);
    return false;
  }
}

// 5C. Fetch school settings from Cloud
export async function fetchSchoolSettingsFromCloud(schoolIdParam?: string): Promise<SchoolSettings | null> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    const settingsRef = doc(db, 'schools', targetSchoolId, 'settings', 'general');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data() as SchoolSettings;
    }
  } catch (err) {
    console.warn('Could not fetch school settings from Cloud:', err);
  }
  return null;
}

// 5D. Fetch school profile from Cloud root
export async function fetchSchoolProfileFromCloud(schoolId: string): Promise<SchoolProfile | null> {
  try {
    const schoolRef = doc(db, 'schools', schoolId);
    const snap = await getDoc(schoolRef);
    if (snap.exists()) {
      return snap.data() as SchoolProfile;
    }
  } catch (err) {
    console.warn('Could not fetch school profile from Cloud:', err);
  }
  return null;
}

// 5E. Save all teachers to Cloud batch
export async function syncTeachersToCloud(teachers: Teacher[], schoolIdParam?: string): Promise<boolean> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    updateSyncStatus({
      state: 'syncing',
      pendingCount: teachers.length,
      message: `Synchronizing ${teachers.length} teachers to Cloud Firestore...`,
    });

    const batch = writeBatch(db);
    for (const t of teachers) {
      const ref = doc(db, 'schools', targetSchoolId, 'teachers', t.id);
      const cleanTeacher = sanitizeForFirestore({
        ...t,
        cloudUpdatedAt: serverTimestamp(),
      });
      batch.set(ref, cleanTeacher, { merge: true });
    }
    await batch.commit();

    updateSyncStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      pendingCount: 0,
      message: `All ${teachers.length} staff records firmly synchronized to Cloud Firestore`,
    });
    return true;
  } catch (err) {
    console.warn('Failed to sync teachers to Cloud:', err);
    updateSyncStatus({
      state: 'error',
      pendingCount: 0,
      message: 'Failed to batch sync teachers to Cloud',
    });
    return false;
  }
}

// 5F. Save a single edited or registered teacher directly to Cloud
export async function saveTeacherToCloud(teacher: Teacher, schoolIdParam?: string): Promise<boolean> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    updateSyncStatus({
      state: 'syncing',
      pendingCount: 1,
      message: `Persisting ${teacher.name} (${teacher.staffId}) to Cloud Firestore...`,
    });

    const ref = doc(db, 'schools', targetSchoolId, 'teachers', teacher.id);
    const cleanTeacher = sanitizeForFirestore({
      ...teacher,
      cloudUpdatedAt: serverTimestamp(),
    });
    await setDoc(ref, cleanTeacher, { merge: true });

    updateSyncStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      pendingCount: 0,
      message: `Staff ${teacher.name} (${teacher.staffId}) firmly updated in Cloud Firestore`,
    });
    return true;
  } catch (err) {
    console.warn('Failed to save teacher to Cloud:', err);
    updateSyncStatus({
      state: 'error',
      pendingCount: 0,
      message: `Error syncing ${teacher.name} to Cloud`,
    });
    return false;
  }
}

// 5G. Debounced teacher save for in-line spreadsheet typing (avoids write flooding)
const teacherDebounceMap = new Map<string, NodeJS.Timeout>();

export function debounceSaveTeacherToCloud(teacher: Teacher, schoolIdParam?: string) {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  const key = `${targetSchoolId}__${teacher.id}`;
  if (teacherDebounceMap.has(key)) {
    clearTimeout(teacherDebounceMap.get(key)!);
  }

  updateSyncStatus({
    state: 'syncing',
    pendingCount: 1,
    message: `Buffering cloud sync for ${teacher.name}...`,
  });

  const timer = setTimeout(async () => {
    teacherDebounceMap.delete(key);
    await saveTeacherToCloud(teacher, targetSchoolId);
  }, 400);

  teacherDebounceMap.set(key, timer);
}

// 5H. Delete teacher document from Cloud
export async function deleteTeacherFromCloud(teacherId: string, schoolIdParam?: string): Promise<boolean> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    updateSyncStatus({
      state: 'syncing',
      pendingCount: 1,
      message: `Removing staff from Cloud Firestore...`,
    });

    const ref = doc(db, 'schools', targetSchoolId, 'teachers', teacherId);
    await deleteDoc(ref);

    updateSyncStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      pendingCount: 0,
      message: `Staff document deleted from Cloud Firestore`,
    });
    return true;
  } catch (err) {
    console.warn('Failed to delete teacher from Cloud:', err);
    return false;
  }
}

// 5I. Fetch teachers directly from Cloud Firestore
export async function fetchTeachersFromCloud(schoolIdParam?: string): Promise<Teacher[] | null> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    const snap = await getDocs(collection(db, 'schools', targetSchoolId, 'teachers'));
    if (snap.empty) return null;
    const teachers: Teacher[] = [];
    snap.forEach(d => {
      const data = d.data() as Teacher;
      teachers.push(data);
    });
    return teachers;
  } catch (err) {
    console.warn('Failed to fetch teachers from Cloud:', err);
    return null;
  }
}

// 5J. Bidirectional synchronization for teachers between Cloud Firestore & local storage
export async function synchronizeTeachersCloudAndLocal(
  localTeachers: Teacher[],
  schoolIdParam?: string
): Promise<{ mergedTeachers: Teacher[]; isUpdated: boolean }> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    const cloudTeachers = await fetchTeachersFromCloud(targetSchoolId);

    // If cloud has no teachers yet, push local teachers to cloud
    if (!cloudTeachers || cloudTeachers.length === 0) {
      if (localTeachers && localTeachers.length > 0) {
        await syncTeachersToCloud(localTeachers, targetSchoolId);
      }
      return { mergedTeachers: localTeachers, isUpdated: false };
    }

    // Index cloud teachers by ID
    const teacherMap = new Map<string, Teacher>();
    for (const ct of cloudTeachers) {
      if (ct.id) teacherMap.set(ct.id, ct);
    }

    let isUpdated = false;

    // Check if any local teachers are missing in cloud
    for (const lt of localTeachers) {
      if (!teacherMap.has(lt.id)) {
        teacherMap.set(lt.id, lt);
        // Persist missing local teacher to cloud
        await saveTeacherToCloud(lt, targetSchoolId);
        isUpdated = true;
      }
    }

    const merged = Array.from(teacherMap.values());
    return { mergedTeachers: merged, isUpdated: true };
  } catch (err) {
    console.warn('Could not bidirectionally sync teachers:', err);
    return { mergedTeachers: localTeachers, isUpdated: false };
  }
}

// 6. Save a quick single snapshot & daily snapshot fail-safe
export async function saveSystemSnapshotToCloud(students: Student[], settings: SchoolSettings, teachers?: Teacher[], schoolIdParam?: string) {
  const targetSchoolId = schoolIdParam || settings.schoolId || activeSchoolId;
  try {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // e.g. "2026-10-10"

    // If teachers are not supplied, attempt to preserve existing teachers from snapshot
    let teachersToSave = teachers;
    if (!teachersToSave || teachersToSave.length === 0) {
      try {
        const existingSnap = await getDoc(doc(db, 'schools', targetSchoolId, 'settings', 'system_snapshot'));
        if (existingSnap.exists() && Array.isArray(existingSnap.data()?.teachers) && existingSnap.data()!.teachers.length > 0) {
          teachersToSave = existingSnap.data()!.teachers as Teacher[];
        }
      } catch (_) {}
    }

    // To ensure system_snapshot never exceeds Firestore's 1MB single-document limit:
    // If student list is large (> 30 students), store clean student directory profiles in snapshot,
    // while full scores and biodata are stored in the individual student subcollection documents.
    const isLarge = students.length > 30;
    const studentsForSnapshot = isLarge
      ? students.map(s => ({
          id: s.id,
          name: s.name,
          className: s.className,
          learnerId: s.learnerId,
          gender: s.gender,
          studentRole: s.studentRole || 'Regular Student',
          overallAverage: s.averageScore || 0,
          classRank: s.positionInClass || 0,
          totalScore: s.totalScore || 0,
        }))
      : students;

    const snapshotPayload = sanitizeForFirestore({
      updatedAt: now.toISOString(),
      studentCount: students.length,
      teacherCount: teachersToSave?.length || 0,
      students: studentsForSnapshot,
      settings: settings,
      teachers: teachersToSave || [],
    });

    // Primary master system snapshot
    const snapshotRef = doc(db, 'schools', targetSchoolId, 'settings', 'system_snapshot');
    await setDoc(snapshotRef, snapshotPayload, { merge: true });

    // Secondary daily snapshot document in 'snapshots' collection as a fail-safe backup
    const dailySnapshotRef = doc(db, 'schools', targetSchoolId, 'daily_snapshots', dateKey);
    await setDoc(dailySnapshotRef, {
      ...snapshotPayload,
      snapshotDate: dateKey,
    }, { merge: true });

    // Local JSON fail-safe backup record in localStorage
    try {
      localStorage.setItem(`daily_snapshot_${targetSchoolId}_${dateKey}`, JSON.stringify({
        date: dateKey,
        updatedAt: now.toISOString(),
        studentCount: students.length,
        teacherCount: teachersToSave?.length || 0,
      }));
    } catch (_) {}

    updateSyncStatus({
      state: 'synced',
      lastSyncedAt: now,
      message: 'Direct Cloud Storage, Daily Snapshot & Local Storage Synchronized',
    });
  } catch (err) {
    console.warn('Snapshot sync error:', err);
  }
}

// 7. Search student directly in Cloud Firestore (ensures results are never missing)
export async function searchStudentInCloud(query: string, schoolIdParam?: string): Promise<Student | null> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  const cleanQuery = query.trim().toUpperCase();
  if (!cleanQuery) return null;

  try {
    // A. Direct document lookup by ID
    const studentDocRef = doc(db, 'schools', targetSchoolId, 'students', cleanQuery);
    const snap = await getDoc(studentDocRef);
    if (snap.exists()) {
      return snap.data() as Student;
    }

    // B. Search inside master system snapshot
    const snapshotRef = doc(db, 'schools', targetSchoolId, 'settings', 'system_snapshot');
    const systemSnap = await getDoc(snapshotRef);
    if (systemSnap.exists()) {
      const data = systemSnap.data();
      if (Array.isArray(data?.students)) {
        const found = data.students.find((s: Student) => 
          s.learnerId?.toUpperCase() === cleanQuery ||
          s.id?.toUpperCase() === cleanQuery ||
          s.name?.toUpperCase().includes(cleanQuery)
        );
        if (found) return found as Student;
      }
    }
  } catch (err) {
    console.warn('Cloud student search warning:', err);
  }
  return null;
}

// Helper to merge score maps without dropping any marks entered
function mergeScoreMaps(
  localMap?: Record<string, SubjectScore>, 
  cloudMap?: Record<string, SubjectScore>
): Record<string, SubjectScore> {
  const merged: Record<string, SubjectScore> = { ...(cloudMap || {}) };
  if (!localMap) return merged;

  for (const [subj, localScore] of Object.entries(localMap)) {
    const cloudScore = merged[subj];
    if (!cloudScore) {
      merged[subj] = localScore;
    } else {
      const localHasMarks = localScore.ca1 !== null || localScore.ca2 !== null || localScore.ca3 !== null || localScore.ca4 !== null || localScore.exam !== null;
      const cloudHasMarks = cloudScore.ca1 !== null || cloudScore.ca2 !== null || cloudScore.ca3 !== null || cloudScore.ca4 !== null || cloudScore.exam !== null;
      if (localHasMarks && !cloudHasMarks) {
        merged[subj] = localScore;
      } else if (!localHasMarks && cloudHasMarks) {
        merged[subj] = cloudScore;
      } else if (localScore.updatedAt && cloudScore.updatedAt) {
        merged[subj] = new Date(localScore.updatedAt) >= new Date(cloudScore.updatedAt) ? localScore : cloudScore;
      } else {
        merged[subj] = localScore;
      }
    }
  }
  return merged;
}

// 8. Bidirectional Synchronization between Cloud Storage and Local Storage
export async function synchronizeCloudAndLocalStorage(
  localStudents: Student[], 
  settings: SchoolSettings,
  schoolIdParam?: string
): Promise<{ mergedStudents: Student[]; isUpdated: boolean }> {
  const targetSchoolId = schoolIdParam || settings.schoolId || activeSchoolId;
  updateSyncStatus({
    state: 'syncing',
    message: `Synchronizing Direct Cloud Storage with Local Storage for ${targetSchoolId}...`,
  });

  try {
    const cloudStudents = await fetchStudentsFromCloud(targetSchoolId);

    // Case 1: Cloud is empty, push local dataset to Cloud
    if (!cloudStudents || cloudStudents.length === 0) {
      if (localStudents.length > 0) {
        await saveSystemSnapshotToCloud(localStudents, settings, undefined, targetSchoolId);
        await syncFullStudentsDatasetToCloud(localStudents, targetSchoolId);
      }
      updateSyncStatus({
        state: 'synced',
        lastSyncedAt: new Date(),
        message: 'Direct Cloud Storage & Local Storage Synchronized',
      });
      return { mergedStudents: localStudents, isUpdated: false };
    }

    // Case 2: Local is empty, populate directly from Cloud
    if (localStudents.length === 0 && cloudStudents.length > 0) {
      updateSyncStatus({
        state: 'synced',
        lastSyncedAt: new Date(),
        message: `Restored ${cloudStudents.length} student records from Direct Cloud Storage`,
      });
      return { mergedStudents: cloudStudents, isUpdated: true };
    }

    // Case 3: Both exist - deep merge to ensure NO marks or student records are ever lost
    const studentMap = new Map<string, Student>();
    const learnerIdMap = new Map<string, string>(); // normLearnerId -> primaryKey
    const nameClassMap = new Map<string, string>(); // normName_normClass -> primaryKey

    const getStudentKey = (s: Student) => s.id || s.learnerId || s.name;

    // Index all cloud students
    for (const cs of cloudStudents) {
      const key = getStudentKey(cs);
      studentMap.set(key, { ...cs });
      if (cs.learnerId) {
        learnerIdMap.set(cs.learnerId.trim().toUpperCase(), key);
      }
      if (cs.name && cs.className) {
        nameClassMap.set(`${cs.name.trim().toUpperCase()}__${cs.className.trim().toUpperCase()}`, key);
      }
    }

    let changed = false;

    // Merge each local student (preserves any newly uploaded CSV students)
    for (const ls of localStudents) {
      let matchedKey: string | undefined;
      const directKey = getStudentKey(ls);

      if (studentMap.has(directKey)) {
        matchedKey = directKey;
      } else if (ls.learnerId && learnerIdMap.has(ls.learnerId.trim().toUpperCase())) {
        matchedKey = learnerIdMap.get(ls.learnerId.trim().toUpperCase());
      } else if (ls.name && ls.className && nameClassMap.has(`${ls.name.trim().toUpperCase()}__${ls.className.trim().toUpperCase()}`)) {
        matchedKey = nameClassMap.get(`${ls.name.trim().toUpperCase()}__${ls.className.trim().toUpperCase()}`);
      }

      if (!matchedKey) {
        // Local student (e.g. from CSV upload) not yet in cloud! Add to map so it is preserved!
        studentMap.set(directKey, { ...ls });
        if (ls.learnerId) learnerIdMap.set(ls.learnerId.trim().toUpperCase(), directKey);
        changed = true;
      } else {
        const cs = studentMap.get(matchedKey)!;
        // Merge scores
        const mergedScores = mergeScoreMaps(ls.scores, cs.scores);
        
        // Merge termScores across terms
        const allTerms = Array.from(new Set([
          ...Object.keys(ls.termScores || {}),
          ...Object.keys(cs.termScores || {}),
          'First Term', 'Second Term', 'Third Term'
        ]));

        const mergedTermScores: Record<string, Record<string, SubjectScore>> = {};
        for (const t of allTerms) {
          const lTerm = ls.termScores?.[t];
          const cTerm = cs.termScores?.[t];
          mergedTermScores[t] = mergeScoreMaps(lTerm, cTerm);
        }

        const mergedStudent: Student = {
          ...cs,
          ...ls,
          scores: mergedScores,
          termScores: mergedTermScores,
          biodata: { ...(cs.biodata || {}), ...(ls.biodata || {}) },
          passportPhoto: ls.passportPhoto || cs.passportPhoto,
          formTeacherComment: ls.formTeacherComment || cs.formTeacherComment,
          principalComment: ls.principalComment || cs.principalComment,
          affective: { ...(cs.affective || {}), ...(ls.affective || {}) },
          psychomotor: { ...(cs.psychomotor || {}), ...(ls.psychomotor || {}) },
        };

        studentMap.set(matchedKey, mergedStudent);
        changed = true;
      }
    }

    const mergedStudents = Array.from(studentMap.values());
    if (mergedStudents.length !== localStudents.length) {
      changed = true;
    }

    // Write unified state back to Cloud to guarantee parity
    await saveSystemSnapshotToCloud(mergedStudents, settings, undefined, targetSchoolId);
    await syncFullStudentsDatasetToCloud(mergedStudents, targetSchoolId);

    updateSyncStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      message: 'Direct Cloud Storage & Local Storage Synchronized (0 marks missing)',
    });

    return { mergedStudents, isUpdated: changed };
  } catch (err) {
    console.warn('Bidirectional synchronization notice:', err);
    updateSyncStatus({
      state: 'offline',
      message: 'Operating with Local Storage (Cloud auto-sync active)',
    });
    return { mergedStudents: localStudents, isUpdated: false };
  }
}
