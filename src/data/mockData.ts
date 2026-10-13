import { Grade, Student, Teacher, SchoolSettings, AffectiveAssessment, PsychomotorAssessment, SubjectScore, CAWeightConfig, SchoolSection, GradeScaleItem, SchoolProfile } from '../types';

export const SENIOR_SUBJECTS = [
  'COMMERCE',
  'COMPUTER SCIENCE',
  'FINANCIAL ACCOUNTING',
  'FURTHER MATHEMATICS',
  'MATHEMATICS',
  'CHRISTIAN RELIGIOUS STUDIES',
  'ANIMAL HUSBANDRY',
  'BIOLOGY',
  'GOVERNMENT',
  'AGRICULTURAL SCIENCE',
  'ECONOMICS',
  'CIVIC EDUCATION',
  'PHYSICS',
  'ENGLISH LANGUAGE',
  'LITERATURE IN ENGLISH',
  'GEOGRAPHY',
  'HISTORY',
  'CHEMISTRY',
] as const;

export const JUNIOR_SUBJECTS = [
  'AGRICULTURAL SCIENCE',
  'CIVIC EDUCATION',
  'CHRISTIAN RELIGIOUS STUDIES',
  'SOCIAL STUDIES',
  'PHYSICAL AND HEALTH EDUCATION',
  'BUSINESS STUDIES',
  'COMPUTER SCIENCE',
  'FRENCH',
  'LOCAL LANGUAGE (YORUBA, IGBO & HAUSA)',
  'MATHEMATICS',
  'ENGLISH LANGUAGE',
  'BASIC SCIENCE',
  'HISTORY',
  'CULTURAL & CREATIVE ARTS',
  'HOME ECONOMICS',
  'BASIC TECHNOLOGY',
] as const;

// Union of all subjects
export const ALL_SUBJECTS = Array.from(new Set([...SENIOR_SUBJECTS, ...JUNIOR_SUBJECTS]));
export const OFFICIAL_SUBJECTS = SENIOR_SUBJECTS; // for backward compatibility

export const SCHOOL_CLASSES = [
  'JSS 1 A',
  'JSS 1 B',
  'JSS 2 A',
  'JSS 2 B',
  'JSS 3 A',
  'JSS 3 B',
  'SSS 1 A',
  'SSS 1 B',
  'SSS 2 A',
  'SSS 2 B',
  'SSS 3',
] as const;

export const CLASS_ALIASES: Record<string, string> = {
  'JSS1': 'JSS 1 A',
  'JSS 1': 'JSS 1 A',
  'JSS1A': 'JSS 1 A',
  'JSS 1 A': 'JSS 1 A',
  'JSSB': 'JSS 1 B',
  'JSS1B': 'JSS 1 B',
  'JSS 1 B': 'JSS 1 B',
  'JSS2': 'JSS 2 A',
  'JSS 2': 'JSS 2 A',
  'JSS2A': 'JSS 2 A',
  'JSS 2 A': 'JSS 2 A',
  'JSS2B': 'JSS 2 B',
  'JSS 2 B': 'JSS 2 B',
  'JSS3': 'JSS 3 A',
  'JSS 3': 'JSS 3 A',
  'JSS3A': 'JSS 3 A',
  'JSS 3 A': 'JSS 3 A',
  'JSS3B': 'JSS 3 B',
  'JSS 3 B': 'JSS 3 B',
  'SSS1': 'SSS 1 A',
  'SSS 1': 'SSS 1 A',
  'SSS1A': 'SSS 1 A',
  'SSS 1 A': 'SSS 1 A',
  'SSS1B': 'SSS 1 B',
  'SSS 1 B': 'SSS 1 B',
  'SSS2': 'SSS 2 A',
  'SSS 2': 'SSS 2 A',
  'SSS2A': 'SSS 2 A',
  'SSS 2 A': 'SSS 2 A',
  'SSS2B': 'SSS 2 B',
  'SSS 2 B': 'SSS 2 B',
  'SSS3': 'SSS 3',
  'SSS 3': 'SSS 3',
  'SSS3A': 'SSS 3',
  'SSS 3 A': 'SSS 3',
  'SSS3B': 'SSS 3',
  'SSS 3 B': 'SSS 3',
};

export function normalizeClass(className: string): string {
  if (!className) return 'JSS 1 A';
  const clean = className.trim().toUpperCase();
  const noSpace = clean.replace(/\s+/g, '');
  return CLASS_ALIASES[clean] || CLASS_ALIASES[noSpace] || className.trim();
}

/**
 * Checks if two class names refer to the same class or grade (e.g. "JSS 3" matches "JSS 3 A" and "JSS 3 B")
 */
export function isClassMatch(classA: string, classB: string): boolean {
  if (!classA || !classB) return false;
  const aNorm = normalizeClass(classA).trim().toUpperCase();
  const bNorm = normalizeClass(classB).trim().toUpperCase();
  if (aNorm === bNorm) return true;

  const aClean = aNorm.replace(/\s+/g, '');
  const bClean = bNorm.replace(/\s+/g, '');
  if (aClean === bClean) return true;

  // Grade-level prefix matching (e.g. "JSS3" matches "JSS3A" or vice versa)
  if (aClean.startsWith(bClean) || bClean.startsWith(aClean)) return true;

  // Compare base grade (e.g. "JSS 3" from "JSS 3 A")
  const aBase = aClean.replace(/[AB]$/, '');
  const bBase = bClean.replace(/[AB]$/, '');
  if (aBase === bBase) return true;

  return false;
}

export function isJuniorClass(className: string): boolean {
  return className.trim().toUpperCase().startsWith('JSS');
}

export function getSectionForClass(className: string): SchoolSection {
  return isJuniorClass(className) ? 'JUNIOR' : 'SENIOR';
}

export function getSubjectsForClass(className: string, settings?: SchoolSettings): readonly string[] {
  if (isJuniorClass(className)) {
    return settings?.juniorSubjects && settings.juniorSubjects.length > 0 
      ? settings.juniorSubjects 
      : JUNIOR_SUBJECTS;
  }
  return settings?.seniorSubjects && settings.seniorSubjects.length > 0 
    ? settings.seniorSubjects 
    : SENIOR_SUBJECTS;
}

export function getSchoolClasses(settings?: SchoolSettings): readonly string[] {
  if (settings?.classes && settings.classes.length > 0) {
    return settings.classes;
  }
  return SCHOOL_CLASSES;
}

export const DEFAULT_JUNIOR_CA_CONFIG: CAWeightConfig = {
  ca1Max: 10,
  ca2Max: 10,
  ca3Max: 10,
  ca4Max: 10,
  examMax: 60,
  totalMax: 100,
};

export const DEFAULT_SENIOR_CA_CONFIG: CAWeightConfig = {
  ca1Max: 10,
  ca2Max: 10,
  ca3Max: 10,
  ca4Max: 0,
  examMax: 70,
  totalMax: 100,
};

export function getCAConfig(className: string, settings?: SchoolSettings): CAWeightConfig {
  if (isJuniorClass(className)) {
    return settings?.juniorCAConfig || DEFAULT_JUNIOR_CA_CONFIG;
  }
  return settings?.seniorCAConfig || DEFAULT_SENIOR_CA_CONFIG;
}

export const DEFAULT_SCHOOL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FBBF24"/><stop offset="50%" stop-color="%23F59E0B"/><stop offset="100%" stop-color="%23B45309"/></linearGradient><linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23B91C1C"/><stop offset="100%" stop-color="%237F1D1D"/></linearGradient></defs><path d="M50 4 L88 20 C88 56 68 86 50 96 C32 86 12 56 12 20 Z" fill="url(%23redGrad)" stroke="url(%23goldGrad)" stroke-width="3.5"/><path d="M50 12 L80 25 C80 54 64 78 50 86 C36 78 20 54 20 25 Z" fill="none" stroke="url(%23goldGrad)" stroke-width="1.2" stroke-dasharray="2,2"/><polygon points="50,22 54,34 66,34 56,42 60,54 50,46 40,54 44,42 34,34 46,34" fill="url(%23goldGrad)"/><path d="M36 60 Q50 52 64 60 L62 66 Q50 58 38 66 Z" fill="url(%23goldGrad)"/><circle cx="50" cy="74" r="4.5" fill="url(%23goldGrad)"/><text x="50" y="81" font-size="5" font-family="serif" font-weight="bold" fill="%237F1D1D" text-anchor="middle">STP</text></svg>`;

export const DEFAULT_OFFICIAL_STAMP = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><path id="circlePathTop" d="M 28,100 A 72,72 0 0,1 172,100" fill="none" /><path id="circlePathBottom" d="M 172,100 A 72,72 0 0,1 28,100" fill="none" /></defs><circle cx="100" cy="100" r="94" fill="none" stroke="%232e1065" stroke-width="4.5"/><circle cx="100" cy="100" r="88" fill="none" stroke="%232e1065" stroke-width="1.6"/><circle cx="100" cy="100" r="64" fill="none" stroke="%232e1065" stroke-width="2.2"/><circle cx="100" cy="100" r="60" fill="none" stroke="%232e1065" stroke-width="1"/><text font-family="'Times New Roman',serif" font-weight="900" font-size="13" fill="%232e1065" letter-spacing="2"><textPath href="%23circlePathTop" startOffset="50%" text-anchor="middle">ST. PAUL COLLEGE</textPath></text><text font-family="'Times New Roman',serif" font-weight="800" font-size="9.5" fill="%232e1065" letter-spacing="1.5"><textPath href="%23circlePathBottom" startOffset="50%" text-anchor="middle">★ GWAGWALADA • FCT ABUJA ★</textPath></text><polygon points="100,68 102.5,74 109,74 104,78 106,84 100,80 94,84 96,78 91,74 97.5,74" fill="%232e1065"/><text x="100" y="96" font-family="'Times New Roman',serif" font-weight="900" font-size="11" fill="%232e1065" text-anchor="middle" letter-spacing="1">OFFICIAL</text><line x1="68" y1="100" x2="132" y2="100" stroke="%232e1065" stroke-width="1.5"/><text x="100" y="111" font-family="'Times New Roman',serif" font-weight="800" font-size="9" fill="%232e1065" text-anchor="middle">SEAL &amp; STAMP</text><line x1="72" y1="116" x2="128" y2="116" stroke="%232e1065" stroke-width="1"/><text x="100" y="126" font-family="monospace" font-weight="700" font-size="7.5" fill="%232e1065" text-anchor="middle">EXAMS / PRINCIPAL</text><text x="100" y="136" font-family="sans-serif" font-weight="700" font-size="6.5" fill="%234c1d95" text-anchor="middle">VERIFIED &amp; APPROVED</text></svg>`;

export const ACADEMIC_TERMS = ['First Term', 'Second Term', 'Third Term'] as const;

export function getNextClass(className: string): string {
  const norm = normalizeClass(className);
  switch (norm) {
    case 'JSS 1 A': return 'JSS 2 A';
    case 'JSS 1 B': return 'JSS 2 B';
    case 'JSS 2 A': return 'JSS 3 A';
    case 'JSS 2 B': return 'JSS 3 B';
    case 'JSS 3 A': return 'SSS 1 A';
    case 'JSS 3 B': return 'SSS 1 B';
    case 'SSS 1 A': return 'SSS 2 A';
    case 'SSS 1 B': return 'SSS 2 B';
    case 'SSS 2 A': return 'SSS 3';
    case 'SSS 2 B': return 'SSS 3';
    case 'SSS 3': return 'GRADUATED';
    default: return 'GRADUATED';
  }
}

export function generateSchoolStampSvg(
  schoolName: string, 
  location: string = 'FCT ABUJA', 
  motto: string = 'EXCELLENCE & INTEGRITY',
  officialTitle: string = 'PRINCIPAL / EXAMS BOARD'
): string {
  const safeName = (schoolName || 'ACADEMY').toUpperCase().replace(/&/g, '&amp;');
  const safeLoc = (location || 'NIGERIA').toUpperCase().replace(/&/g, '&amp;');
  const safeTitle = (officialTitle || 'VERIFIED & APPROVED').toUpperCase().replace(/&/g, '&amp;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><path id="stampTop" d="M 28,100 A 72,72 0 0,1 172,100" fill="none" /><path id="stampBottom" d="M 172,100 A 72,72 0 0,1 28,100" fill="none" /></defs><circle cx="100" cy="100" r="94" fill="none" stroke="%231e1b4b" stroke-width="4.5"/><circle cx="100" cy="100" r="88" fill="none" stroke="%231e1b4b" stroke-width="1.6"/><circle cx="100" cy="100" r="64" fill="none" stroke="%231e1b4b" stroke-width="2.2"/><circle cx="100" cy="100" r="60" fill="none" stroke="%231e1b4b" stroke-width="1"/><text font-family="'Times New Roman',serif" font-weight="900" font-size="11.5" fill="%231e1b4b" letter-spacing="1.5"><textPath href="%23stampTop" startOffset="50%" text-anchor="middle">${safeName}</textPath></text><text font-family="'Times New Roman',serif" font-weight="800" font-size="8.5" fill="%231e1b4b" letter-spacing="1.2"><textPath href="%23stampBottom" startOffset="50%" text-anchor="middle">★ ${safeLoc} ★</textPath></text><polygon points="100,68 102.5,74 109,74 104,78 106,84 100,80 94,84 96,78 91,74 97.5,74" fill="%231e1b4b"/><text x="100" y="96" font-family="'Times New Roman',serif" font-weight="900" font-size="10.5" fill="%231e1b4b" text-anchor="middle" letter-spacing="1">OFFICIAL</text><line x1="68" y1="100" x2="132" y2="100" stroke="%231e1b4b" stroke-width="1.5"/><text x="100" y="111" font-family="'Times New Roman',serif" font-weight="800" font-size="8.5" fill="%231e1b4b" text-anchor="middle">SEAL &amp; STAMP</text><line x1="72" y1="116" x2="128" y2="116" stroke="%231e1b4b" stroke-width="1"/><text x="100" y="126" font-family="monospace" font-weight="700" font-size="7" fill="%231e1b4b" text-anchor="middle">${safeTitle}</text><text x="100" y="136" font-family="sans-serif" font-weight="700" font-size="6" fill="%23312e81" text-anchor="middle">ACCREDITED &amp; CERTIFIED</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

export function generateSchoolCrestSvg(
  schoolName: string, 
  primaryColor: string = '#7f1d1d', 
  accentColor: string = '#f59e0b'
): string {
  const words = (schoolName || 'SCHOOL').trim().split(/\s+/);
  const initials = words.length > 1 
    ? (words[0][0] + words[1][0] + (words[2] ? words[2][0] : '')).toUpperCase() 
    : schoolName.substring(0, 3).toUpperCase();
  const safePColor = encodeURIComponent(primaryColor);
  const safeAColor = encodeURIComponent(accentColor);

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="crestG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${safePColor}"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><path d="M50 4 L88 20 C88 56 68 86 50 96 C32 86 12 56 12 20 Z" fill="url(%23crestG)" stroke="${safeAColor}" stroke-width="3.5"/><path d="M50 12 L80 25 C80 54 64 78 50 86 C36 78 20 54 20 25 Z" fill="none" stroke="${safeAColor}" stroke-width="1.2" stroke-dasharray="2,2"/><polygon points="50,22 54,34 66,34 56,42 60,54 50,46 40,54 44,42 34,34 46,34" fill="${safeAColor}"/><path d="M36 60 Q50 52 64 60 L62 66 Q50 58 38 66 Z" fill="${safeAColor}"/><circle cx="50" cy="74" r="4.5" fill="${safeAColor}"/><text x="50" y="81" font-size="5" font-family="serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">${initials}</text></svg>`;
}

export const DEFAULT_SCHOOL_REGISTRY: SchoolProfile[] = [
  {
    id: 'stpaul',
    name: 'ST PAUL COLLEGE',
    motto: 'PRO DEO ET PATRIA',
    address: 'JEREMIAH USENI ROAD, NEW KUTUNKU, GWAGWALADA, FCT ABUJA',
    email: 'stpaulcollege@abjce.org.ng',
    phone: '+234 803 123 4567',
    principalName: 'REV. FR. PRINCIPAL / SUPER ADMIN',
    examOfficerName: 'Mr. Kenneth Adams',
    theme: 'crimson-gold',
    logo: DEFAULT_SCHOOL_LOGO,
    stamp: DEFAULT_OFFICIAL_STAMP,
    stampOpacity: 0.88,
    stampRotation: -6,
    adminEmail: 'ephcalculus@gmail.com',
    adminName: 'Super Admin',
    createdAt: '2025-09-01T00:00:00.000Z',
    classes: [...SCHOOL_CLASSES],
    juniorSubjects: [...JUNIOR_SUBJECTS],
    seniorSubjects: [...SENIOR_SUBJECTS],
    isCustomSchool: false,
    learnerIdPrefix: 'STP/',
    staffIdPrefix: 'STP/TCH/',
  }
];

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  schoolId: 'stpaul',
  schoolName: 'ST PAUL COLLEGE',
  schoolMotto: 'PRO DEO ET PATRIA',
  schoolAddress: 'JEREMIAH USENI ROAD, NEW KUTUNKU, GWAGWALADA, FCT ABUJA',
  schoolEmail: 'stpaulcollege@abjce.org.ng',
  schoolPhone: '+234 803 123 4567',
  principalName: 'REV. FR. PRINCIPAL / SUPER ADMIN',
  examOfficerName: 'Mr. Kenneth Adams',
  schoolLogo: DEFAULT_SCHOOL_LOGO,
  schoolStamp: DEFAULT_OFFICIAL_STAMP,
  schoolStampUploadedAt: new Date().toISOString(),
  schoolStampOpacity: 0.88,
  schoolStampRotation: -6,
  theme: 'crimson-gold',
  term: 'Third Term',
  availableTerms: ['First Term', 'Second Term', 'Third Term'],
  session: '2025/2026',
  daysSchoolOpened: 114,
  nextTermResumption: '07/09/26',
  isTermLocked: false,
  allowAllTeachersScoreEntry: false,
  classes: [...SCHOOL_CLASSES],
  juniorSubjects: [...JUNIOR_SUBJECTS],
  seniorSubjects: [...SENIOR_SUBJECTS],
  learnerIdPrefix: 'STP/',
  staffIdPrefix: 'STP/TCH/',
  juniorCAConfig: DEFAULT_JUNIOR_CA_CONFIG,
  seniorCAConfig: DEFAULT_SENIOR_CA_CONFIG,
  gradingScale: [
    { grade: 'A', minScore: 80, maxScore: 100, remark: 'Distinction / Excellent', gpaPoints: 5.0, colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
    { grade: 'B', minScore: 70, maxScore: 79, remark: 'Very Good', gpaPoints: 4.0, colorClass: 'text-blue-700 bg-blue-50 border-blue-300' },
    { grade: 'C', minScore: 60, maxScore: 69, remark: 'Credit / Good', gpaPoints: 3.0, colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
    { grade: 'D', minScore: 56, maxScore: 59, remark: 'Pass', gpaPoints: 2.0, colorClass: 'text-amber-700 bg-amber-50 border-amber-300' },
    { grade: 'E', minScore: 50, maxScore: 55, remark: 'Fair / Weak Pass', gpaPoints: 1.0, colorClass: 'text-orange-700 bg-orange-50 border-orange-300' },
    { grade: 'F', minScore: 0, maxScore: 49, remark: 'Fail', gpaPoints: 0.0, colorClass: 'text-red-700 bg-red-50 border-red-300' },
  ],
};

export const DEFAULT_GRADING_SCALE = INITIAL_SCHOOL_SETTINGS.gradingScale!;

export function calculateGrade(total: number, scale?: typeof DEFAULT_GRADING_SCALE): Grade {
  const activeScale = scale && scale.length > 0 ? scale : DEFAULT_GRADING_SCALE;
  const rounded = Math.round(total * 10) / 10;
  for (const item of activeScale) {
    if (rounded >= item.minScore) {
      return item.grade;
    }
  }
  return 'F';
}

export function getGradeRemark(grade: Grade, scale?: typeof DEFAULT_GRADING_SCALE): string {
  const activeScale = scale && scale.length > 0 ? scale : DEFAULT_GRADING_SCALE;
  const match = activeScale.find(s => s.grade === grade);
  return match?.remark || (grade === 'A' ? 'Excellent' : grade === 'B' ? 'Very Good' : grade === 'C' ? 'Credit' : grade === 'D' ? 'Pass' : grade === 'E' ? 'Fair Pass' : 'Fail');
}

export function computeTotal(ca1: number | null, ca2: number | null, ca3: number | null, ca4: number | null, exam: number | null): number {
  return (ca1 || 0) + (ca2 || 0) + (ca3 || 0) + (ca4 || 0) + (exam || 0);
}

// Demo teacher IDs that were placed for mock/sample display
export const DEMO_TEACHER_IDS = new Set([
  't-exam',
  't-principal',
  't-form-jss2b',
  't-form-sss1a',
  't-form-sss1b',
  't-01', 't-02', 't-03', 't-04', 't-05',
  't-06', 't-07', 't-08', 't-09', 't-10',
  't-11', 't-12', 't-13', 't-14', 't-15',
  't-16', 't-17', 't-18', 't-19', 't-20',
  't-21', 't-22', 't-23', 't-24', 't-25',
  't-26', 't-27', 't-28', 't-29', 't-30'
]);

export function isDemoTeacher(teacher?: { id?: string; staffId?: string; name?: string; registeredAt?: string }): boolean {
  if (!teacher) return false;
  // Super Admin is never a demo teacher - keep it as official admin account
  if (teacher.id === 't-admin' || teacher.staffId === 'STP/ADMIN/001') return false;
  if (teacher.name?.trim().toUpperCase() === 'SUPER ADMIN') return false;

  // Check demo IDs
  if (teacher.id && DEMO_TEACHER_IDS.has(teacher.id)) return true;
  if (teacher.id && /^t-(0?[1-9]|[12][0-9]|30)$/.test(teacher.id)) return true;
  if (teacher.id && (teacher.id.startsWith('t-form') || teacher.id.startsWith('t-demo-') || teacher.id === 't-exam' || teacher.id === 't-principal')) return true;

  // Check staffId for demo patterns
  if (teacher.staffId?.startsWith('STP/FORM/') || teacher.staffId === 'STP/EXAM/001') return true;

  // Any legacy teacher placed with id starting with 't-' without registeredAt is demo
  if (teacher.id?.startsWith('t-') && !teacher.registeredAt) return true;

  return false;
}

// Initial Teachers list containing only the Super Administrator
export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't-admin',
    name: 'SUPER ADMIN',
    email: 'superadmin@stpaulcollege.abjce.org.ng',
    role: 'super_admin',
    staffId: 'STP/ADMIN/001',
    password: 'UPgrade2026',
    assignedClasses: [...SCHOOL_CLASSES],
    assignedSubjects: [...ALL_SUBJECTS],
    department: 'School Administration & Academic Directorate',
  },
];

// Helper to create subject score
export function createSubjectScore(ca1: number, ca2: number, ca3: number, ca4: number, exam: number): SubjectScore {
  const total = ca1 + ca2 + ca3 + ca4 + exam;
  return {
    ca1,
    ca2,
    ca3,
    ca4,
    exam,
    total,
    grade: calculateGrade(total),
    status: 'submitted',
  };
}

// Helper to identify demo/sample students
export function isDemoStudent(student?: { id?: string; learnerId?: string }): boolean {
  if (!student) return false;
  if ((student as any).isDemo === true) return true;
  if (student.id === 'std-sani-emmanuella' || student.id === 'std-lazarus') return true;
  if (student.id && /^std-\d+$/.test(student.id)) return true;
  if (student.id && student.id.startsWith('std-demo-')) return true;
  if (student.learnerId === 'SPC/2024/1/74' || student.learnerId === 'A122/2023/616494') return true;
  if (student.learnerId && /^STP\/2024\/\d{3}$/.test(student.learnerId)) return true;
  return false;
}

// Empty baseline for students since demo students are removed
export const INITIAL_STUDENTS: Student[] = [];

// Clean generator returning empty list
export function generate200Students(): Student[] {
  return [];
}

// Calculate subject positions within each class and overall class position across terms and cumulative
export function calculateAllRankings(students: Student[], activeTerm: string = 'Third Term', gradingScale?: GradeScaleItem[]): Student[] {
  const updatedStudents = [...students];

  // Group by class
  const classMap = new Map<string, Student[]>();
  for (const s of updatedStudents) {
    if (!classMap.has(s.className)) {
      classMap.set(s.className, []);
    }
    classMap.get(s.className)!.push(s);
  }

  const termsList = ['First Term', 'Second Term', 'Third Term'];

  for (const [className, classList] of classMap.entries()) {
    const subjects = getSubjectsForClass(className);

    // 1. Ensure all students have valid termScores initialized
    for (const student of classList) {
      if (!student.termScores) {
        student.termScores = {
          'First Term': { ...student.scores },
          'Second Term': { ...student.scores },
          'Third Term': { ...student.scores },
        };
      }
      for (const t of termsList) {
        if (!student.termScores[t]) {
          student.termScores[t] = { ...student.scores };
        }
      }
      if (!student.termTotals) {
        student.termTotals = {};
      }
    }

    // 2. Calculate rankings and totals for EACH of the three terms independently
    for (const term of termsList) {
      // 2a. Subject positions for this term
      for (const subj of subjects) {
        const sortedBySubject = [...classList].sort((a, b) => {
          const scoreA = a.termScores?.[term]?.[subj]?.total || 0;
          const scoreB = b.termScores?.[term]?.[subj]?.total || 0;
          return scoreB - scoreA;
        });

        sortedBySubject.forEach((student, rankIndex) => {
          if (student.termScores?.[term]?.[subj]) {
            student.termScores[term][subj].position = rankIndex + 1;
          }
        });
      }

      // 2b. Grand total & average for this term
      for (const student of classList) {
        let termGrandTotal = 0;
        let count = 0;
        for (const subj of subjects) {
          const sc = student.termScores?.[term]?.[subj];
          if (sc) {
            termGrandTotal += sc.total;
            count++;
          }
        }
        const termAvg = count > 0 ? Number((termGrandTotal / count).toFixed(2)) : 0;
        student.termTotals![term] = {
          totalScore: termGrandTotal,
          averageScore: termAvg,
          positionInClass: 0,
          overallGrade: calculateGrade(termAvg, gradingScale),
        };
      }

      // 2c. Class position for this term
      const sortedByTermAvg = [...classList].sort(
        (a, b) => (b.termTotals?.[term]?.averageScore || 0) - (a.termTotals?.[term]?.averageScore || 0)
      );
      sortedByTermAvg.forEach((student, rankIndex) => {
        if (student.termTotals?.[term]) {
          student.termTotals[term].positionInClass = rankIndex + 1;
        }
      });
    }

    // 3. Calculate Cumulative Annual Statistics (Term 1 + Term 2 + Term 3)
    for (const student of classList) {
      student.cumulativeScores = {};
      let sumOfCumAvgs = 0;
      let countedSubjs = 0;

      for (const subj of subjects) {
        const t1Total = student.termScores?.['First Term']?.[subj]?.total ?? null;
        const t2Total = student.termScores?.['Second Term']?.[subj]?.total ?? null;
        const t3Total = student.termScores?.['Third Term']?.[subj]?.total ?? null;

        const termsPresent = [t1Total, t2Total, t3Total].filter(t => t !== null && t !== undefined) as number[];
        const cumTotal = termsPresent.reduce((a, b) => a + b, 0);
        const cumAvg = termsPresent.length > 0 ? Number((cumTotal / termsPresent.length).toFixed(1)) : 0;
        const cumGrade = calculateGrade(cumAvg, gradingScale);

        student.cumulativeScores[subj] = {
          term1Total: t1Total,
          term2Total: t2Total,
          term3Total: t3Total,
          cumulativeTotal: cumTotal,
          cumulativeAverage: cumAvg,
          cumulativeGrade: cumGrade,
        };

        if (termsPresent.length > 0) {
          sumOfCumAvgs += cumAvg;
          countedSubjs++;
        }
      }

      const annualAverage = countedSubjs > 0 ? Number((sumOfCumAvgs / countedSubjs).toFixed(2)) : 0;
      student.cumulativeTotalScore = Number(sumOfCumAvgs.toFixed(1));
      student.cumulativeAverageScore = annualAverage;
      student.cumulativeOverallGrade = calculateGrade(annualAverage, gradingScale);

      // Promotion Recommendation (Terminal Academic Performance: Math & English must be passed before promotion)
      const mathScore = student.cumulativeScores?.['MATHEMATICS']?.cumulativeAverage 
        ?? student.termScores?.['Third Term']?.['MATHEMATICS']?.total 
        ?? student.scores?.['MATHEMATICS']?.total 
        ?? 0;
      const englishScore = student.cumulativeScores?.['ENGLISH LANGUAGE']?.cumulativeAverage 
        ?? student.termScores?.['Third Term']?.['ENGLISH LANGUAGE']?.total 
        ?? student.scores?.['ENGLISH LANGUAGE']?.total 
        ?? 0;
      const passedMathAndEnglish = mathScore >= 50 && englishScore >= 50;

      const nextClass = getNextClass(className);
      if (nextClass === 'GRADUATED') {
        if (annualAverage >= 50 && passedMathAndEnglish) {
          student.promotionStatus = 'GRADUATED';
          student.promotedToClass = 'GRADUATED';
        } else {
          student.promotionStatus = 'REPEAT';
          student.promotedToClass = className;
        }
      } else if (annualAverage >= 50 && passedMathAndEnglish) {
        student.promotionStatus = 'PROMOTED';
        student.promotedToClass = nextClass;
      } else if (annualAverage >= 45 && passedMathAndEnglish) {
        student.promotionStatus = 'PROMOTED ON TRIAL';
        student.promotedToClass = nextClass;
      } else {
        student.promotionStatus = 'REPEAT';
        student.promotedToClass = className;
      }
    }

    // 3b. Subject cumulative positions
    for (const subj of subjects) {
      const sortedByCumSubj = [...classList].sort((a, b) => {
        const aAvg = a.cumulativeScores?.[subj]?.cumulativeAverage || 0;
        const bAvg = b.cumulativeScores?.[subj]?.cumulativeAverage || 0;
        return bAvg - aAvg;
      });
      sortedByCumSubj.forEach((student, rankIndex) => {
        if (student.cumulativeScores?.[subj]) {
          student.cumulativeScores[subj].cumulativePosition = rankIndex + 1;
        }
      });
    }

    // 3c. Class cumulative position
    const sortedByAnnualAvg = [...classList].sort(
      (a, b) => (b.cumulativeAverageScore || 0) - (a.cumulativeAverageScore || 0)
    );
    sortedByAnnualAvg.forEach((student, rankIndex) => {
      student.cumulativePositionInClass = rankIndex + 1;
    });

    // 4. Synchronize active term properties on each student
    const termToSync = activeTerm === 'Cumulative' ? 'Third Term' : activeTerm;
    for (const student of classList) {
      student.scores = student.termScores?.[termToSync] || student.termScores?.['Third Term'] || student.scores;
      const summary = student.termTotals?.[termToSync];
      if (summary) {
        student.totalScore = summary.totalScore;
        student.averageScore = summary.averageScore;
        student.positionInClass = summary.positionInClass;
        student.overallGrade = summary.overallGrade;
      }
    }
  }

  return updatedStudents;
}

export function createDefaultStudentTemplate(
  data: Partial<Student> & { name: string; className: string },
  settings?: SchoolSettings
): Student {
  const subjects = (data.enrolledSubjects && data.enrolledSubjects.length > 0)
    ? data.enrolledSubjects
    : getSubjectsForClass(data.className, settings);
  const scores: Record<string, SubjectScore> = {};

  for (const subj of subjects) {
    if (data.scores && data.scores[subj]) {
      scores[subj] = data.scores[subj];
    } else {
      scores[subj] = {
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
  }

  const termScores: Record<string, Record<string, SubjectScore>> = data.termScores || {
    'First Term': { ...scores },
    'Second Term': { ...scores },
    'Third Term': { ...scores },
  };

  const defaultAffective: AffectiveAssessment = {
    punctuality: 4,
    honesty: 4,
    politeness: 4,
    neatness: 4,
    perseverance: 4,
    relationshipWithOthers: 4,
    diligence: 4,
    creativity: 3,
    classParticipation: 4,
    ...(data.affective || {}),
  };

  const defaultPsychomotor: PsychomotorAssessment = {
    verbalFluency: 4,
    gamesSports: 4,
    musicalSkills: 3,
    drawingPainting: 3,
    handWriting: 4,
    ...(data.psychomotor || {}),
  };

  const id = data.id || `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const prefix = settings?.learnerIdPrefix?.trim() || 'SPC/';
  const cleanPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const learnerId = data.learnerId || `${cleanPrefix}${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;
  const gender = data.gender || 'MALE';
  const studentRole = data.studentRole || data.biodata?.studentRole || 'Regular Student';

  return {
    id,
    name: data.name.trim(),
    gender,
    learnerId,
    className: data.className,
    studentRole,
    enrolledSubjects: [...subjects],
    daysPresent: data.daysPresent !== undefined ? data.daysPresent : 110,
    formTeacherComment: data.formTeacherComment || 'Good effort and attendance this term.',
    principalComment: data.principalComment || 'Promoted with commendable standing.',
    passportPhoto: data.passportPhoto,
    biodata: {
      dateOfBirth: '2010-05-15',
      nationality: 'Nigerian',
      stateOfOrigin: 'Abuja (FCT)',
      bloodGroup: 'O+',
      genotype: 'AA',
      residentialAddress: 'Gwagwalada, Abuja, FCT',
      guardianName: `Parent of ${data.name}`,
      guardianPhone: '+234 803 000 0000',
      guardianRelationship: 'Father',
      studentRole,
      ...(data.biodata || {}),
    },
    sourcePortal: data.sourcePortal || 'ST PAUL Registration Center',
    scores,
    termScores,
    affective: defaultAffective,
    psychomotor: defaultPsychomotor,
  };
}
