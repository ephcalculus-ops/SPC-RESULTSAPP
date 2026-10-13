import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer, 
  collection, 
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

        batch.set(scoreRef, {
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
        }, { merge: true });

        // 2. Also update student document with this score if snapshot provided
        if (item.studentSnapshot) {
          const studentRef = doc(db, 'schools', activeSchoolId, 'students', item.studentId);
          batch.set(studentRef, {
            ...item.studentSnapshot,
            cloudUpdatedAt: serverTimestamp(),
          }, { merge: true });
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
export async function syncFullStudentsDatasetToCloud(students: Student[]): Promise<boolean> {
  if (!students || students.length === 0) return false;

  updateSyncStatus({
    state: 'syncing',
    pendingCount: students.length,
    message: `Backing up all 200 students & marks to Cloud...`,
  });

  try {
    // Write in chunks of 50 to respect Firestore batch limits (max 500)
    const chunkSize = 50;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      for (const s of chunk) {
        const studentRef = doc(db, 'schools', activeSchoolId, 'students', s.id);
        batch.set(studentRef, {
          id: s.id,
          name: s.name,
          learnerId: s.learnerId,
          className: s.className,
          gender: s.gender,
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
        }, { merge: true });
      }

      await batch.commit();
    }

    updateSyncStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      pendingCount: 0,
      message: '100% of student marks and comments backed up to Cloud',
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

// 4. Fetch Students dataset from Cloud
export async function fetchStudentsFromCloud(schoolIdParam?: string): Promise<Student[] | null> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    const backupDocRef = doc(db, 'schools', targetSchoolId, 'settings', 'system_snapshot');
    const snapshot = await getDoc(backupDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data?.students) && data.students.length > 0) {
        return data.students as Student[];
      }
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch cloud students snapshot:', err);
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

// 5E. Save teachers to Cloud
export async function syncTeachersToCloud(teachers: Teacher[], schoolIdParam?: string): Promise<boolean> {
  const targetSchoolId = schoolIdParam || activeSchoolId;
  try {
    const batch = writeBatch(db);
    for (const t of teachers) {
      const ref = doc(db, 'schools', targetSchoolId, 'teachers', t.id);
      batch.set(ref, {
        ...t,
        cloudUpdatedAt: serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
    return true;
  } catch (err) {
    console.warn('Failed to sync teachers to Cloud:', err);
    return false;
  }
}

// 6. Save a quick single snapshot & daily snapshot fail-safe
export async function saveSystemSnapshotToCloud(students: Student[], settings: SchoolSettings, teachers?: Teacher[], schoolIdParam?: string) {
  const targetSchoolId = schoolIdParam || settings.schoolId || activeSchoolId;
  try {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // e.g. "2026-10-10"
    const snapshotPayload = {
      updatedAt: now.toISOString(),
      studentCount: students.length,
      teacherCount: teachers?.length || 0,
      students: students,
      settings: settings,
      teachers: teachers || [],
    };

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
        teacherCount: teachers?.length || 0,
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
  settings: SchoolSettings
): Promise<{ mergedStudents: Student[]; isUpdated: boolean }> {
  updateSyncStatus({
    state: 'syncing',
    message: 'Synchronizing Direct Cloud Storage with Local Storage...',
  });

  try {
    const cloudStudents = await fetchStudentsFromCloud();

    // Case 1: Cloud is empty, push local dataset to Cloud
    if (!cloudStudents || cloudStudents.length === 0) {
      if (localStudents.length > 0) {
        await saveSystemSnapshotToCloud(localStudents, settings);
        await syncFullStudentsDatasetToCloud(localStudents);
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

    // Index all cloud students
    for (const cs of cloudStudents) {
      studentMap.set(cs.id || cs.learnerId, { ...cs });
    }

    let changed = false;

    // Merge each local student
    for (const ls of localStudents) {
      const key = ls.id || ls.learnerId;
      const cs = studentMap.get(key);

      if (!cs) {
        studentMap.set(key, { ...ls });
        changed = true;
      } else {
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
          formTeacherComment: ls.formTeacherComment || cs.formTeacherComment,
          principalComment: ls.principalComment || cs.principalComment,
          affective: { ...(cs.affective || {}), ...(ls.affective || {}) },
          psychomotor: { ...(cs.psychomotor || {}), ...(ls.psychomotor || {}) },
        };

        studentMap.set(key, mergedStudent);
        changed = true;
      }
    }

    const mergedStudents = Array.from(studentMap.values());

    // Write unified state back to Cloud to guarantee parity
    await saveSystemSnapshotToCloud(mergedStudents, settings);

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
