export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface GradeScaleItem {
  grade: Grade;
  minScore: number;
  maxScore: number;
  remark: string;
  gpaPoints?: number;
  colorClass?: string;
}

export type SchoolSection = 'PRIMARY' | 'JUNIOR' | 'SENIOR';

export type AcademicTerm = 'First Term' | 'Second Term' | 'Third Term';

export interface CAWeightConfig {
  ca1Max: number;
  ca2Max: number;
  ca3Max: number;
  ca4Max: number;
  examMax: number;
  totalMax: number;
}

export type UserRole = 'super_admin' | 'admin' | 'exam_officer' | 'form_teacher' | 'subject_teacher' | 'student';

export interface Teacher {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  title?: string; // e.g. "Mr.", "Mrs.", "Dr.", "Miss"
  email: string;
  role: UserRole;
  staffId: string;
  assignedClasses: string[]; // e.g. ['SSS 1 A', 'SSS 1 B']
  assignedSubjects: string[]; // e.g. ['PHYSICS', 'MATHEMATICS']
  isFormTeacherOf?: string; // e.g. 'SSS 1 A'
  phone?: string;
  department?: string;
  password?: string;
  qualification?: string;
  registeredAt?: string;
  // Enhanced Teacher Biodata & School Register fields
  gender?: 'MALE' | 'FEMALE' | 'NA';
  dateOfBirth?: string;
  stateOfOrigin?: string;
  address?: string;
  emergencyContact?: string;
  avatar?: string;
  bio?: string;
  mainClass?: string;
  classArm?: string;
  dor?: string;
}

export interface SubjectScore {
  ca1: number | null; // CA1 (Max 10 marks for SSS 1-3 & JSS)
  ca2: number | null; // CA2 (Max 10 marks for SSS 1-3 & JSS)
  ca3: number | null; // CA3 (Max 10 marks for SSS 1-3 & JSS)
  ca4: number | null; // CA4 (0 marks for SSS 1-3; 10 marks for JSS)
  exam: number | null; // Exam (Max 70 marks for SSS 1-3; 60 marks for JSS)
  total: number;      // Max 100%
  grade: Grade;
  position?: number;  // Rank in class for this subject
  teacherComment?: string;
  updatedByTeacherId?: string;
  updatedAt?: string;
  status?: 'draft' | 'submitted' | 'approved';
}

export interface CumulativeSubjectScore {
  term1Total: number | null;
  term2Total: number | null;
  term3Total: number | null;
  cumulativeTotal: number;
  cumulativeAverage: number;
  cumulativeGrade: Grade;
  cumulativePosition?: number;
}

export interface TermSummary {
  totalScore: number;
  averageScore: number;
  positionInClass: number;
  overallGrade: Grade;
}

export interface AffectiveAssessment {
  punctuality: number; // 1-5
  honesty: number;
  politeness: number;
  neatness: number;
  perseverance: number;
  relationshipWithOthers: number;
  diligence: number;
  creativity: number;
  classParticipation: number;
}

export interface PsychomotorAssessment {
  verbalFluency: number; // 1-5
  gamesSports: number;
  musicalSkills: number;
  drawingPainting: number;
  handWriting: number;
}

export interface StudentBiodata {
  dateOfBirth?: string;
  bloodGroup?: string; // e.g. "O+", "A+", "B+", "AB+"
  genotype?: string;   // e.g. "AA", "AS", "SS"
  stateOfOrigin?: string;
  lga?: string;
  nationality?: string;
  residentialAddress?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  admissionDate?: string;
  previousSchool?: string;
  studentRole?: string; // e.g. "Regular Student", "Head Boy", "Head Girl", "Senior Prefect", "Class Captain", etc.
}

export interface Student {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  learnerId: string; // e.g. "A122/2023/616494"
  className: string; // e.g. "SSS 1 A"
  studentRole?: string; // e.g. "Head Boy", "Senior Prefect", "Class Captain", "Regular Student"
  enrolledSubjects?: string[]; // Custom subjects offered by this student (defaults to class curriculum)
  scores: Record<string, SubjectScore>; // key: subject name e.g. "PHYSICS" (active term)
  termScores?: Record<string, Record<string, SubjectScore>>; // 'First Term' | 'Second Term' | 'Third Term' -> subject -> SubjectScore
  cumulativeScores?: Record<string, CumulativeSubjectScore>; // subject -> cumulative stats across 3 terms
  termTotals?: Record<string, TermSummary>; // term -> summary totals
  cumulativeTotalScore?: number;
  cumulativeAverageScore?: number;
  cumulativePositionInClass?: number;
  cumulativeOverallGrade?: Grade;
  promotionStatus?: 'PROMOTED' | 'PROMOTED ON TRIAL' | 'REPEAT' | 'GRADUATED';
  promotedToClass?: string;
  affective: AffectiveAssessment;
  psychomotor: PsychomotorAssessment;
  daysPresent: number;
  formTeacherComment: string;
  principalComment: string;
  passportPhoto?: string;
  biodata?: StudentBiodata;
  sourcePortal?: string; // e.g. "ST PAUL College Registry", "FCT Education Board Portal", "NEMIS", "External Excel Import"
  totalScore?: number;
  averageScore?: number;
  positionInClass?: number;
  overallGrade?: Grade;
}

export type SchoolThemeId = 
  | 'crimson-gold'
  | 'navy-gold'
  | 'royal-silver'
  | 'emerald-gold'
  | 'purple-gold'
  | 'maroon-bronze'
  | 'slate-coral';

export interface SchoolProfile {
  id: string; // unique slug e.g. 'stpaul', 'school-grace-high-0a1b'
  name: string;
  motto?: string;
  address: string;
  email: string;
  phone?: string;
  principalName?: string;
  examOfficerName?: string;
  logo?: string;
  stamp?: string;
  stampOpacity?: number;
  stampRotation?: number;
  theme?: SchoolThemeId;
  adminEmail?: string; // The Gmail used to sign up
  adminName?: string;
  createdAt?: string;
  classes?: string[]; // e.g. ['JSS 1 A', 'JSS 1 B', ...]
  juniorSubjects?: string[];
  seniorSubjects?: string[];
  isCustomSchool?: boolean;
  learnerIdPrefix?: string; // e.g. "STP/" or "GHA/"
  staffIdPrefix?: string;   // e.g. "STP/TCH/" or "GHA/TCH/"
  primaryColor?: string;
  accentColor?: string;
  section?: 'secondary' | 'primary' | 'all';
  shortName?: string;
  tagline?: string;
}

export interface SchoolSettings {
  schoolId?: string;
  schoolName: string;
  shortName?: string;
  tagline?: string;
  section?: 'secondary' | 'primary' | 'all';
  schoolMotto?: string;
  schoolAddress: string;
  schoolEmail: string;
  schoolPhone?: string;
  principalName?: string;
  examOfficerName?: string;
  schoolLogo?: string; // base64 data url or image link
  schoolStamp?: string; // base64 data url or image link for uploaded official school stamp
  schoolStampUploadedAt?: string;
  schoolStampFileName?: string;
  schoolStampOpacity?: number; // 0.1 to 1.0 (defaults to 0.85)
  schoolStampRotation?: number; // rotation in degrees e.g. -6
  theme?: SchoolThemeId;
  term: string; // e.g. "Third Term"
  availableTerms?: string[];
  session: string; // e.g. "2025/2026"
  daysSchoolOpened: number; // e.g. 114
  nextTermResumption: string; // e.g. "07/09/26"
  isTermLocked: boolean; // when locked, subject teachers cannot edit
  allowAllTeachersScoreEntry?: boolean; // when true, every teacher can upload/record scores
  juniorCAConfig: CAWeightConfig;
  seniorCAConfig: CAWeightConfig;
  gradingScale?: GradeScaleItem[];
  classes?: string[];
  juniorSubjects?: string[];
  seniorSubjects?: string[];
  adminEmail?: string;
  learnerIdPrefix?: string;
  staffIdPrefix?: string;
}

export interface GoogleSheetsSyncConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  autoSync: boolean;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}
