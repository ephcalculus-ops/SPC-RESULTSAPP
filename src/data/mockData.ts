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

export const PRIMARY_CLASSES = [
  'NURSERY 1 A',
  'NURSERY 1 B',
  'NURSERY 2 A',
  'NURSERY 2 B',
  'PRIMARY 1 A',
  'PRIMARY 1 B',
  'PRIMARY 2 A',
  'PRIMARY 2 B',
  'PRIMARY 3 A',
  'PRIMARY 3 B',
  'PRIMARY 4 A',
  'PRIMARY 4 B',
  'PRIMARY 5 A',
  'PRIMARY 5 B',
  'PRIMARY 6 A',
  'PRIMARY 6 B',
] as const;

export const PRIMARY_SUBJECTS = [
  'MATHEMATICS',
  'ENGLISH STUDIES',
  'VERBAL REASONING',
  'QUANTITATIVE REASONING',
  'BASIC SCIENCE & TECHNOLOGY',
  'SOCIAL STUDIES',
  'CIVIC EDUCATION',
  'CHRISTIAN RELIGIOUS STUDIES',
  'AGRICULTURAL SCIENCE',
  'PHYSICAL & HEALTH EDUCATION',
  'COMPUTER STUDIES / ICT',
  'HANDWRITING',
  'FRENCH',
  'CREATIVE & CULTURAL ARTS',
  'MUSIC',
  'HOME ECONOMICS',
] as const;

// Union of all subjects across College & Primary
export const ALL_SUBJECTS = Array.from(new Set([...SENIOR_SUBJECTS, ...JUNIOR_SUBJECTS, ...PRIMARY_SUBJECTS]));
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
  // SS shorthand aliases
  'SS1': 'SSS 1 A',
  'SS 1': 'SSS 1 A',
  'SS1A': 'SSS 1 A',
  'SS 1 A': 'SSS 1 A',
  'SS1B': 'SSS 1 B',
  'SS 1 B': 'SSS 1 B',
  'SS2': 'SSS 2 A',
  'SS 2': 'SSS 2 A',
  'SS2A': 'SSS 2 A',
  'SS 2 A': 'SSS 2 A',
  'SS2B': 'SSS 2 B',
  'SS 2 B': 'SSS 2 B',
  'SS3': 'SSS 3',
  'SS 3': 'SSS 3',
  'SS3A': 'SSS 3',
  'SS 3 A': 'SSS 3',
  'SS3B': 'SSS 3',
  'SS 3 B': 'SSS 3',
  // Basic 7-9 aliases (UBE Junior Secondary)
  'BASIC7': 'JSS 1 A',
  'BASIC 7': 'JSS 1 A',
  'BASIC 7 A': 'JSS 1 A',
  'BASIC 7 B': 'JSS 1 B',
  'BASIC8': 'JSS 2 A',
  'BASIC 8': 'JSS 2 A',
  'BASIC 8 A': 'JSS 2 A',
  'BASIC 8 B': 'JSS 2 B',
  'BASIC9': 'JSS 3 A',
  'BASIC 9': 'JSS 3 A',
  'BASIC 9 A': 'JSS 3 A',
  'BASIC 9 B': 'JSS 3 B',
  // Grade 7-12 aliases
  'GRADE 7': 'JSS 1 A',
  'GRADE 8': 'JSS 2 A',
  'GRADE 9': 'JSS 3 A',
  'GRADE 10': 'SSS 1 A',
  'GRADE 11': 'SSS 2 A',
  'GRADE 12': 'SSS 3',
  // Primary & Nursery Aliases
  'CRECHE': 'NURSERY 1 A',
  'RECEPTION': 'NURSERY 1 A',
  'KINDERGARTEN': 'NURSERY 1 A',
  'KG': 'NURSERY 1 A',
  'KG1': 'NURSERY 1 A',
  'KG 1': 'NURSERY 1 A',
  'KG2': 'NURSERY 2 A',
  'KG 2': 'NURSERY 2 A',
  'NUR1': 'NURSERY 1 A',
  'NUR 1': 'NURSERY 1 A',
  'NURSERY1': 'NURSERY 1 A',
  'NURSERY 1': 'NURSERY 1 A',
  'NURSERY 1 A': 'NURSERY 1 A',
  'NURSERY 1 B': 'NURSERY 1 B',
  'NUR2': 'NURSERY 2 A',
  'NUR 2': 'NURSERY 2 A',
  'NURSERY2': 'NURSERY 2 A',
  'NURSERY 2': 'NURSERY 2 A',
  'NURSERY 2 A': 'NURSERY 2 A',
  'NURSERY 2 B': 'NURSERY 2 B',
  'PRI1': 'PRIMARY 1 A',
  'PRI 1': 'PRIMARY 1 A',
  'PRIMARY1': 'PRIMARY 1 A',
  'PRIMARY 1': 'PRIMARY 1 A',
  'PRIMARY 1 A': 'PRIMARY 1 A',
  'PRIMARY 1 B': 'PRIMARY 1 B',
  'BASIC 1': 'PRIMARY 1 A',
  'PRI2': 'PRIMARY 2 A',
  'PRI 2': 'PRIMARY 2 A',
  'PRIMARY2': 'PRIMARY 2 A',
  'PRIMARY 2': 'PRIMARY 2 A',
  'PRIMARY 2 A': 'PRIMARY 2 A',
  'PRIMARY 2 B': 'PRIMARY 2 B',
  'BASIC 2': 'PRIMARY 2 A',
  'PRI3': 'PRIMARY 3 A',
  'PRI 3': 'PRIMARY 3 A',
  'PRIMARY3': 'PRIMARY 3 A',
  'PRIMARY 3': 'PRIMARY 3 A',
  'PRIMARY 3 A': 'PRIMARY 3 A',
  'PRIMARY 3 B': 'PRIMARY 3 B',
  'BASIC 3': 'PRIMARY 3 A',
  'PRI4': 'PRIMARY 4 A',
  'PRI 4': 'PRIMARY 4 A',
  'PRIMARY4': 'PRIMARY 4 A',
  'PRIMARY 4': 'PRIMARY 4 A',
  'PRIMARY 4 A': 'PRIMARY 4 A',
  'PRIMARY 4 B': 'PRIMARY 4 B',
  'BASIC 4': 'PRIMARY 4 A',
  'PRI5': 'PRIMARY 5 A',
  'PRI 5': 'PRIMARY 5 A',
  'PRIMARY5': 'PRIMARY 5 A',
  'PRIMARY 5': 'PRIMARY 5 A',
  'PRIMARY 5 A': 'PRIMARY 5 A',
  'PRIMARY 5 B': 'PRIMARY 5 B',
  'BASIC 5': 'PRIMARY 5 A',
  'PRI6': 'PRIMARY 6 A',
  'PRI 6': 'PRIMARY 6 A',
  'PRIMARY6': 'PRIMARY 6 A',
  'PRIMARY 6': 'PRIMARY 6 A',
  'PRIMARY 6 A': 'PRIMARY 6 A',
  'PRIMARY 6 B': 'PRIMARY 6 B',
  'BASIC 6': 'PRIMARY 6 A',
};

export function normalizeClass(className: string): string {
  if (!className) return 'JSS 1 A';
  const clean = className.trim().toUpperCase();
  const noSpace = clean.replace(/\s+/g, '');
  if (CLASS_ALIASES[clean]) return CLASS_ALIASES[clean];
  if (CLASS_ALIASES[noSpace]) return CLASS_ALIASES[noSpace];

  // Pattern-based dynamic normalizers for all class variants
  // 1. JSS 1-3
  const jssMatch = clean.match(/^(?:JSS|JS)\s*([1-3])\s*([A-D])?$/i);
  if (jssMatch) {
    const num = jssMatch[1];
    const arm = (jssMatch[2] || 'A').toUpperCase();
    return `JSS ${num} ${arm}`;
  }

  // 2. SSS 1-3 / SS 1-3
  const sssMatch = clean.match(/^(?:SSS|SS)\s*([1-3])\s*([A-D])?$/i);
  if (sssMatch) {
    const num = sssMatch[1];
    if (num === '3') return 'SSS 3';
    const arm = (sssMatch[2] || 'A').toUpperCase();
    return `SSS ${num} ${arm}`;
  }

  // 3. Primary 1-6 / Basic 1-6 / Grade 1-6
  const priMatch = clean.match(/^(?:PRIMARY|PRI|BASIC|GRADE)\s*([1-6])\s*([A-D])?$/i);
  if (priMatch) {
    const num = priMatch[1];
    const arm = (priMatch[2] || 'A').toUpperCase();
    return `PRIMARY ${num} ${arm}`;
  }

  // 4. Nursery 1-2 / KG
  const nurMatch = clean.match(/^(?:NURSERY|NUR|KG)\s*([1-3])\s*([A-D])?$/i);
  if (nurMatch) {
    const num = nurMatch[1];
    const arm = (nurMatch[2] || 'A').toUpperCase();
    return `NURSERY ${num} ${arm}`;
  }

  return className.trim();
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

export function isPrimaryClass(className: string): boolean {
  if (!className) return false;
  const upper = className.trim().toUpperCase();
  return upper.startsWith('PRI') || upper.startsWith('NUR') || upper.includes('PRIMARY') || upper.includes('NURSERY') || upper.includes('BASIC');
}

export function isJuniorClass(className: string): boolean {
  if (!className) return false;
  return className.trim().toUpperCase().startsWith('JSS');
}

export function isSeniorClass(className: string): boolean {
  if (!className) return false;
  const upper = className.trim().toUpperCase();
  return upper.startsWith('SSS') || upper.startsWith('SS ') || upper === 'SSS 3';
}

export function getSectionForClass(className: string): SchoolSection {
  if (isPrimaryClass(className)) return 'PRIMARY';
  if (isJuniorClass(className)) return 'JUNIOR';
  return 'SENIOR';
}

export function getSubjectsForClass(className: string, settings?: SchoolSettings): readonly string[] {
  if (isPrimaryClass(className)) {
    return settings?.juniorSubjects && settings.juniorSubjects.length > 0 
      ? settings.juniorSubjects 
      : PRIMARY_SUBJECTS;
  }
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

export const DEFAULT_PRIMARY_CA_CONFIG: CAWeightConfig = {
  ca1Max: 15,
  ca2Max: 15,
  ca3Max: 10,
  ca4Max: 0,
  examMax: 60,
  totalMax: 100,
};

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
  if (isPrimaryClass(className)) {
    return settings?.juniorCAConfig || DEFAULT_PRIMARY_CA_CONFIG;
  }
  if (isJuniorClass(className)) {
    return settings?.juniorCAConfig || DEFAULT_JUNIOR_CA_CONFIG;
  }
  return settings?.seniorCAConfig || DEFAULT_SENIOR_CA_CONFIG;
}

export const DEFAULT_SCHOOL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FBBF24"/><stop offset="50%" stop-color="%23F59E0B"/><stop offset="100%" stop-color="%23B45309"/></linearGradient><linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23B91C1C"/><stop offset="100%" stop-color="%237F1D1D"/></linearGradient></defs><path d="M50 4 L88 20 C88 56 68 86 50 96 C32 86 12 56 12 20 Z" fill="url(%23redGrad)" stroke="url(%23goldGrad)" stroke-width="3.5"/><path d="M50 12 L80 25 C80 54 64 78 50 86 C36 78 20 54 20 25 Z" fill="none" stroke="url(%23goldGrad)" stroke-width="1.2" stroke-dasharray="2,2"/><polygon points="50,22 54,34 66,34 56,42 60,54 50,46 40,54 44,42 34,34 46,34" fill="url(%23goldGrad)"/><path d="M36 60 Q50 52 64 60 L62 66 Q50 58 38 66 Z" fill="url(%23goldGrad)"/><circle cx="50" cy="74" r="4.5" fill="url(%23goldGrad)"/><text x="50" y="81" font-size="5" font-family="serif" font-weight="bold" fill="%237F1D1D" text-anchor="middle">STP</text></svg>`;

export const DEFAULT_PRIMARY_SCHOOL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e3a8a"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FBBF24"/><stop offset="100%" stop-color="%23D97706"/></linearGradient></defs><path d="M50 4 L88 20 C88 56 68 86 50 96 C32 86 12 56 12 20 Z" fill="url(%23blueGrad)" stroke="url(%23goldGrad2)" stroke-width="3.5"/><path d="M50 12 L80 25 C80 54 64 78 50 86 C36 78 20 54 20 25 Z" fill="none" stroke="url(%23goldGrad2)" stroke-width="1.2" stroke-dasharray="2,2"/><polygon points="50,20 54,32 66,32 56,40 60,52 50,44 40,52 44,40 34,32 46,32" fill="url(%23goldGrad2)"/><path d="M35 58 Q50 50 65 58 L63 64 Q50 56 37 64 Z" fill="url(%23goldGrad2)"/><circle cx="50" cy="72" r="4.5" fill="url(%23goldGrad2)"/><text x="50" y="81" font-size="5" font-family="serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">STPS</text></svg>`;

export const DEFAULT_OFFICIAL_STAMP = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><path id="circlePathTop" d="M 28,100 A 72,72 0 0,1 172,100" fill="none" /><path id="circlePathBottom" d="M 172,100 A 72,72 0 0,1 28,100" fill="none" /></defs><circle cx="100" cy="100" r="94" fill="none" stroke="%232e1065" stroke-width="4.5"/><circle cx="100" cy="100" r="88" fill="none" stroke="%232e1065" stroke-width="1.6"/><circle cx="100" cy="100" r="64" fill="none" stroke="%232e1065" stroke-width="2.2"/><circle cx="100" cy="100" r="60" fill="none" stroke="%232e1065" stroke-width="1"/><text font-family="'Times New Roman',serif" font-weight="900" font-size="13" fill="%232e1065" letter-spacing="2"><textPath href="%23circlePathTop" startOffset="50%" text-anchor="middle">ST. PAUL COLLEGE</textPath></text><text font-family="'Times New Roman',serif" font-weight="800" font-size="9.5" fill="%232e1065" letter-spacing="1.5"><textPath href="%23circlePathBottom" startOffset="50%" text-anchor="middle">★ GWAGWALADA • FCT ABUJA ★</textPath></text><polygon points="100,68 102.5,74 109,74 104,78 106,84 100,80 94,84 96,78 91,74 97.5,74" fill="%232e1065"/><text x="100" y="96" font-family="'Times New Roman',serif" font-weight="900" font-size="11" fill="%232e1065" text-anchor="middle" letter-spacing="1">OFFICIAL</text><line x1="68" y1="100" x2="132" y2="100" stroke="%232e1065" stroke-width="1.5"/><text x="100" y="111" font-family="'Times New Roman',serif" font-weight="800" font-size="9" fill="%232e1065" text-anchor="middle">SEAL &amp; STAMP</text><line x1="72" y1="116" x2="128" y2="116" stroke="%232e1065" stroke-width="1"/><text x="100" y="126" font-family="monospace" font-weight="700" font-size="7.5" fill="%232e1065" text-anchor="middle">EXAMS / PRINCIPAL</text><text x="100" y="136" font-family="sans-serif" font-weight="700" font-size="6.5" fill="%234c1d95" text-anchor="middle">VERIFIED &amp; APPROVED</text></svg>`;

export const DEFAULT_PRIMARY_OFFICIAL_STAMP = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><path id="circlePathTopPri" d="M 28,100 A 72,72 0 0,1 172,100" fill="none" /><path id="circlePathBottomPri" d="M 172,100 A 72,72 0 0,1 28,100" fill="none" /></defs><circle cx="100" cy="100" r="94" fill="none" stroke="%230f172a" stroke-width="4.5"/><circle cx="100" cy="100" r="88" fill="none" stroke="%230f172a" stroke-width="1.6"/><circle cx="100" cy="100" r="64" fill="none" stroke="%230f172a" stroke-width="2.2"/><circle cx="100" cy="100" r="60" fill="none" stroke="%230f172a" stroke-width="1"/><text font-family="'Times New Roman',serif" font-weight="900" font-size="12" fill="%230f172a" letter-spacing="1.5"><textPath href="%23circlePathTopPri" startOffset="50%" text-anchor="middle">ST. PAUL'S PRIMARY SCHOOL</textPath></text><text font-family="'Times New Roman',serif" font-weight="800" font-size="9" fill="%230f172a" letter-spacing="1.5"><textPath href="%23circlePathBottomPri" startOffset="50%" text-anchor="middle">★ BASIC &amp; NURSERY • FCT ABUJA ★</textPath></text><polygon points="100,68 102.5,74 109,74 104,78 106,84 100,80 94,84 96,78 91,74 97.5,74" fill="%230f172a"/><text x="100" y="96" font-family="'Times New Roman',serif" font-weight="900" font-size="10.5" fill="%230f172a" text-anchor="middle" letter-spacing="1">OFFICIAL</text><line x1="68" y1="100" x2="132" y2="100" stroke="%230f172a" stroke-width="1.5"/><text x="100" y="111" font-family="'Times New Roman',serif" font-weight="800" font-size="8.5" fill="%230f172a" text-anchor="middle">SEAL &amp; STAMP</text><line x1="72" y1="116" x2="128" y2="116" stroke="%230f172a" stroke-width="1"/><text x="100" y="126" font-family="monospace" font-weight="700" font-size="7.5" fill="%230f172a" text-anchor="middle">HEADMISTRESS / EXAMS</text><text x="100" y="136" font-family="sans-serif" font-weight="700" font-size="6.5" fill="%231e3a8a" text-anchor="middle">CERTIFIED &amp; APPROVED</text></svg>`;

export const ACADEMIC_TERMS = ['First Term', 'Second Term', 'Third Term'] as const;

export function getNextClass(className: string): string {
  const norm = normalizeClass(className);
  switch (norm) {
    case 'NURSERY 1 A': return 'NURSERY 2 A';
    case 'NURSERY 1 B': return 'NURSERY 2 B';
    case 'NURSERY 2 A': return 'PRIMARY 1 A';
    case 'NURSERY 2 B': return 'PRIMARY 1 B';
    case 'PRIMARY 1 A': return 'PRIMARY 2 A';
    case 'PRIMARY 1 B': return 'PRIMARY 2 B';
    case 'PRIMARY 2 A': return 'PRIMARY 3 A';
    case 'PRIMARY 2 B': return 'PRIMARY 3 B';
    case 'PRIMARY 3 A': return 'PRIMARY 4 A';
    case 'PRIMARY 3 B': return 'PRIMARY 4 B';
    case 'PRIMARY 4 A': return 'PRIMARY 5 A';
    case 'PRIMARY 4 B': return 'PRIMARY 5 B';
    case 'PRIMARY 5 A': return 'PRIMARY 6 A';
    case 'PRIMARY 5 B': return 'PRIMARY 6 B';
    case 'PRIMARY 6 A': return 'GRADUATED';
    case 'PRIMARY 6 B': return 'GRADUATED';
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
    shortName: 'St Paul College (Secondary)',
    tagline: 'Junior & Senior Secondary (JSS 1 – SSS 3)',
    section: 'secondary',
    motto: 'PRO DEO ET PATRIA',
    address: 'JEREMIAH USENI ROAD, NEW KUTUNKU, GWAGWALADA, FCT ABUJA',
    email: 'stpaulcollege@abjce.org.ng',
    phone: '+234 803 123 4567',
    principalName: 'REV. FR. PRINCIPAL / SUPER ADMIN',
    examOfficerName: '',
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
  shortName: 'St Paul College (Secondary)',
  tagline: 'Junior & Senior Secondary (JSS 1 – SSS 3)',
  section: 'secondary',
  schoolMotto: 'PRO DEO ET PATRIA',
  schoolAddress: 'JEREMIAH USENI ROAD, NEW KUTUNKU, GWAGWALADA, FCT ABUJA',
  schoolEmail: 'stpaulcollege@abjce.org.ng',
  schoolPhone: '+234 803 123 4567',
  principalName: 'REV. FR. PRINCIPAL / SUPER ADMIN',
  examOfficerName: '',
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

export const INITIAL_PRIMARY_SCHOOL_SETTINGS: SchoolSettings = {
  schoolId: 'stpauls-primary',
  schoolName: "ST PAUL'S SCHOOL",
  shortName: "St Paul's School (Primary)",
  tagline: 'Nursery & Basic Primary (Nursery 1 – Primary 6)',
  section: 'primary',
  schoolMotto: 'EXCELLENCE IN FOUNDATION • PRO DEO ET PATRIA',
  schoolAddress: 'JEREMIAH USENI ROAD, NEW KUTUNKU, GWAGWALADA, FCT ABUJA',
  schoolEmail: 'stpaulsprimary@abjce.org.ng',
  schoolPhone: '+234 803 987 6543',
  principalName: 'REV. SR. HEADMISTRESS / SUPER ADMIN',
  examOfficerName: 'Mrs. Clara Nwosu',
  schoolLogo: DEFAULT_PRIMARY_SCHOOL_LOGO,
  schoolStamp: DEFAULT_PRIMARY_OFFICIAL_STAMP,
  schoolStampUploadedAt: new Date().toISOString(),
  schoolStampOpacity: 0.88,
  schoolStampRotation: -4,
  theme: 'navy-gold',
  term: 'Third Term',
  availableTerms: ['First Term', 'Second Term', 'Third Term'],
  session: '2025/2026',
  daysSchoolOpened: 114,
  nextTermResumption: '07/09/26',
  isTermLocked: false,
  allowAllTeachersScoreEntry: false,
  classes: [...PRIMARY_CLASSES],
  juniorSubjects: [...PRIMARY_SUBJECTS],
  seniorSubjects: [...PRIMARY_SUBJECTS],
  learnerIdPrefix: 'STP/PRI/',
  staffIdPrefix: 'STP/PRI/TCH/',
  juniorCAConfig: DEFAULT_PRIMARY_CA_CONFIG,
  seniorCAConfig: DEFAULT_PRIMARY_CA_CONFIG,
  gradingScale: [
    { grade: 'A', minScore: 80, maxScore: 100, remark: 'Distinction / Excellent', gpaPoints: 5.0, colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
    { grade: 'B', minScore: 70, maxScore: 79, remark: 'Very Good', gpaPoints: 4.0, colorClass: 'text-blue-700 bg-blue-50 border-blue-300' },
    { grade: 'C', minScore: 60, maxScore: 69, remark: 'Credit / Good', gpaPoints: 3.0, colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
    { grade: 'D', minScore: 50, maxScore: 59, remark: 'Pass', gpaPoints: 2.0, colorClass: 'text-amber-700 bg-amber-50 border-amber-300' },
    { grade: 'E', minScore: 40, maxScore: 49, remark: 'Fair Pass', gpaPoints: 1.0, colorClass: 'text-orange-700 bg-orange-50 border-orange-300' },
    { grade: 'F', minScore: 0, maxScore: 39, remark: 'Fail', gpaPoints: 0.0, colorClass: 'text-red-700 bg-red-50 border-red-300' },
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

// Fictional / demo staff IDs and names to permanently purge
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
  't-26', 't-27', 't-28', 't-29', 't-30',
  't-pri-adebayo',
  't-pri-okafor',
  't-pri-sani',
]);

export const WRONG_STAFF_NAMES = new Set([
  'Rev. Fr. Dr. Emmanuel Okoro',
  'Mr. Kenneth Adams',
  'Mr. Jude Chukwuka',
  'Mrs. Ngozi Eze',
  'Mr. Ibrahim Musa',
  'Mrs. Blessing Okonkwo',
  'Mr. Emmanuel Adeyemi',
  'Mrs. Fatima Mohammed',
  'Mr. Chinedu Obi',
  'Mrs. Amina Bello',
  'Mr. Paul Danladi',
  'Mrs. Folashade Adeyemi',
  'Dr. Chinedu Obi',
  'Mr. Samuel Aliyu',
  'Mrs. Blessing Ogar',
  'Mr. Joseph Agbo',
  'Mrs. Victoria Peters',
  'Mr. Stephen Bello',
  'Mr. Timothy Okon',
  'Mrs. Esther Idoko',
  'Mr. Gabriel Onah',
  'Mrs. Mary Ayuba',
  'Mr. Anthony Eze',
  'Mr. Christopher Nwachukwu',
  'Mrs. Joy Audu',
  'Mr. Daniel Yakubu',
  'Mrs. Rebecca Pam',
  'Mr. Patrick Okoye',
  'Mrs. Halima Garba',
  'Mrs. Mercy Garba',
  'Mr. Sunday Bako',
  'Mrs. Faith Ugwu',
  'Mrs. Esther Nwachukwu',
  'Mr. Francis Ogbu',
  'Mr. Felix Ogbu',
  'Mr. Usman Abubakar',
  'Mrs. Grace Adebayo',
  'Mr. David Okafor',
  'Mrs. Maryam Sani',
]);

export function isDemoTeacher(teacher?: { id?: string; staffId?: string; name?: string; registeredAt?: string }): boolean {
  if (!teacher) return false;
  if (teacher.id === 't-admin' || (teacher as any).role === 'super_admin' || teacher.staffId === 'STP/ADMIN/001' || teacher.id === 't-primary-admin' || teacher.staffId === 'STP/PRI/ADMIN/001') {
    return false;
  }
  if (teacher.id && DEMO_TEACHER_IDS.has(teacher.id)) return true;
  if (teacher.name && WRONG_STAFF_NAMES.has(teacher.name.trim())) return true;
  return false;
}

// Initial Teachers - Official Teaching Staff Roster from College Register
export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't-admin',
    name: 'SUPER ADMIN',
    title: 'Engr.',
    email: 'superadmin@stpaulcollege.abjce.org.ng',
    role: 'super_admin',
    staffId: 'STP/ADMIN/001',
    password: 'UPgrade2026',
    assignedClasses: [...SCHOOL_CLASSES],
    assignedSubjects: [...ALL_SUBJECTS],
    department: 'School Administration & Academic Directorate',
    phone: '+234 803 100 0001',
    registeredAt: '2024-09-01T08:00:00.000Z',
    gender: 'MALE',
    dor: '01/09/24',
  },
  {
    id: 'spc-staff-31',
    staffId: 'SPC/STAFF/31',
    dor: '06/12/25',
    name: 'ANN AMADI',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'ann.amadi@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 1 A', 'JSS 1 B'],
    assignedSubjects: ['ENGLISH LANGUAGE', 'LITERATURE IN ENGLISH'],
    department: 'Languages & Humanities',
    phone: '+234 803 310 0031',
    registeredAt: '2025-12-06T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-13',
    staffId: 'SPC/STAFF/13',
    dor: '21/11/24',
    name: 'BENJAMIN UKAEGBU',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'benjamin.ukaegbu@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 1 A', 'SSS 1 B', 'SSS 2 A'],
    assignedSubjects: ['MATHEMATICS', 'FURTHER MATHEMATICS'],
    department: 'Sciences & Mathematics',
    phone: '+234 803 130 0013',
    registeredAt: '2024-11-21T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-19',
    staffId: 'SPC/STAFF/19',
    dor: '26/11/24',
    name: 'CHIDINMA URUAKPA',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'chidinma.uruakpa@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 2 A', 'JSS 2 B'],
    assignedSubjects: ['BASIC SCIENCE', 'COMPUTER SCIENCE'],
    department: 'Basic Sciences & ICT',
    phone: '+234 803 190 0019',
    registeredAt: '2024-11-26T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-10',
    staffId: 'SPC/STAFF/10',
    dor: '21/11/24',
    name: 'COMFORT UKANWA',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'comfort.ukanwa@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 3 A', 'JSS 3 B'],
    assignedSubjects: ['CIVIC EDUCATION', 'SOCIAL STUDIES'],
    department: 'Social Sciences',
    phone: '+234 803 100 0010',
    registeredAt: '2024-11-21T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-24',
    staffId: 'SPC/STAFF/24',
    dor: '09/12/24',
    name: 'DAMARIS TIMOTHY',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'damaris.timothy24@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 2 A', 'SSS 2 B'],
    assignedSubjects: ['BIOLOGY', 'AGRICULTURAL SCIENCE'],
    department: 'Biological Sciences',
    phone: '+234 803 240 0024',
    registeredAt: '2024-12-09T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-16',
    staffId: 'SPC/STAFF/16',
    dor: '25/11/24',
    name: 'DEMARIS TIMOTHY',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'demaris.timothy16@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 1 A', 'JSS 1 B'],
    assignedSubjects: ['HOME ECONOMICS', 'CULTURAL & CREATIVE ARTS'],
    department: 'Vocational Arts',
    phone: '+234 803 160 0016',
    registeredAt: '2024-11-25T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-3',
    staffId: 'SPC/STAFF/3',
    dor: '20/11/24',
    name: 'EPHRAIM ALEBIOWU',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'ephraim.alebiowu@stpaulcollege.abjce.org.ng',
    role: 'admin',
    assignedClasses: [...SCHOOL_CLASSES],
    assignedSubjects: ['PHYSICS', 'MATHEMATICS'],
    department: 'Sciences & Academic Coordination',
    phone: '+234 803 030 0003',
    registeredAt: '2024-11-20T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-22',
    staffId: 'SPC/STAFF/22',
    dor: '09/12/24',
    name: 'DAVID ADEDOKUN',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'david.adedokun@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 1 A', 'SSS 1 B'],
    assignedSubjects: ['CHEMISTRY', 'BASIC SCIENCE'],
    department: 'Physical Sciences',
    phone: '+234 803 220 0022',
    registeredAt: '2024-12-09T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-23',
    staffId: 'SPC/STAFF/23',
    dor: '09/12/24',
    name: 'EPHRAIM ALEBIOOWU',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'ephraim.alebioowu23@stpaulcollege.abjce.org.ng',
    role: 'exam_officer',
    assignedClasses: [...SCHOOL_CLASSES],
    assignedSubjects: ['FURTHER MATHEMATICS', 'MATHEMATICS'],
    department: 'Examination Council & Sciences',
    phone: '+234 803 230 0023',
    registeredAt: '2024-12-09T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-8',
    staffId: 'SPC/STAFF/8',
    dor: '21/11/24',
    name: 'ESTHER EBHODAGHE',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'esther.ebhodaghe@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 2 A', 'JSS 2 B'],
    assignedSubjects: ['CHRISTIAN RELIGIOUS STUDIES', 'ENGLISH LANGUAGE'],
    department: 'Humanities & Religious Studies',
    phone: '+234 803 080 0008',
    registeredAt: '2024-11-21T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-28',
    staffId: 'SPC/STAFF/28',
    dor: '19/11/25',
    name: 'GLORY JAMES',
    gender: 'NA',
    mainClass: '',
    classArm: '',
    email: 'glory.james@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 2 A', 'SSS 2 B'],
    assignedSubjects: ['ECONOMICS', 'COMMERCE'],
    department: 'Commercial Studies',
    phone: '+234 803 280 0028',
    registeredAt: '2025-11-19T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-6',
    staffId: 'SPC/STAFF/6',
    dor: '21/11/24',
    name: 'GODWIN ORIAKU',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'godwin.oriaku@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 3', 'SSS 2 A'],
    assignedSubjects: ['GOVERNMENT', 'HISTORY'],
    department: 'Humanities & Social Sciences',
    phone: '+234 803 060 0006',
    registeredAt: '2024-11-21T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-15',
    staffId: 'SPC/STAFF/15',
    dor: '25/11/24',
    name: 'JOSHUA JOSEPH',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'joshua.joseph@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 1 A', 'JSS 2 A'],
    assignedSubjects: ['PHYSICAL AND HEALTH EDUCATION', 'BASIC TECHNOLOGY'],
    department: 'Technical & Physical Education',
    phone: '+234 803 150 0015',
    registeredAt: '2024-11-25T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-2',
    staffId: 'SPC/STAFF/2',
    dor: '14/11/24',
    name: 'JULIET EMMANUEL',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'juliet.emmanuel@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 3 A', 'JSS 3 B'],
    assignedSubjects: ['BUSINESS STUDIES', 'COMPUTER SCIENCE'],
    department: 'Commercial & ICT',
    phone: '+234 803 020 0002',
    registeredAt: '2024-11-14T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-29',
    staffId: 'SPC/STAFF/29',
    dor: '02/12/25',
    name: 'MAGNUS ANYANWU',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'magnus.anyanwu@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 1 A', 'SSS 2 A'],
    assignedSubjects: ['FINANCIAL ACCOUNTING', 'COMMERCE'],
    department: 'Commercial Studies',
    phone: '+234 803 290 0029',
    registeredAt: '2025-12-02T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-9',
    staffId: 'SPC/STAFF/9',
    dor: '21/11/24',
    name: 'MARIA AUGUSTINE',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'maria.augustine@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 1 A', 'JSS 2 A'],
    assignedSubjects: ['FRENCH', 'ENGLISH LANGUAGE'],
    department: 'Modern Languages',
    phone: '+234 803 090 0009',
    registeredAt: '2024-11-21T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-32',
    staffId: 'SPC/STAFF/32',
    dor: '18/03/26',
    name: 'MIRIAM OMACHI',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'miriam.omachi@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 1 B', 'SSS 2 B'],
    assignedSubjects: ['GEOGRAPHY', 'CIVIC EDUCATION'],
    department: 'Social Sciences',
    phone: '+234 803 320 0032',
    registeredAt: '2026-03-18T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-18',
    staffId: 'SPC/STAFF/18',
    dor: '25/11/24',
    name: 'OGECHI IKECHUKWU',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'ogechi.ikechukwu@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 3 A', 'SSS 1 A'],
    assignedSubjects: ['LITERATURE IN ENGLISH', 'ENGLISH LANGUAGE'],
    department: 'Languages & Arts',
    phone: '+234 803 180 0018',
    registeredAt: '2024-11-25T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-5',
    staffId: 'SPC/STAFF/5',
    dor: '21/11/24',
    name: 'PEACE NATHAN',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'peace.nathan@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 2 A', 'JSS 2 B'],
    assignedSubjects: ['AGRICULTURAL SCIENCE', 'BASIC SCIENCE'],
    department: 'Agricultural Sciences',
    phone: '+234 803 050 0005',
    registeredAt: '2024-11-21T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-26',
    staffId: 'SPC/STAFF/26',
    dor: '19/11/25',
    name: 'REUBEN AJODO',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'reuben.ajodo@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 2 A', 'SSS 3'],
    assignedSubjects: ['ANIMAL HUSBANDRY', 'BIOLOGY'],
    department: 'Agricultural & Life Sciences',
    phone: '+234 803 260 0026',
    registeredAt: '2025-11-19T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-27',
    staffId: 'SPC/STAFF/27',
    dor: '19/11/25',
    name: 'RITA NNAEBUO',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'rita.nnaebuo@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['JSS 1 B', 'JSS 2 B'],
    assignedSubjects: ['LOCAL LANGUAGE (YORUBA, IGBO & HAUSA)', 'CULTURAL & CREATIVE ARTS'],
    department: 'Indigenous Languages & Culture',
    phone: '+234 803 270 0027',
    registeredAt: '2025-11-19T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-30',
    staffId: 'SPC/STAFF/30',
    dor: '05/12/25',
    name: 'ROSELINE EJIKEME',
    gender: 'FEMALE',
    mainClass: '',
    classArm: '',
    email: 'roseline.ejikeme@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 1 A', 'SSS 1 B'],
    assignedSubjects: ['COMMERCE', 'ECONOMICS'],
    department: 'Commercial Studies',
    phone: '+234 803 300 0030',
    registeredAt: '2025-12-05T09:00:00.000Z',
    password: 'password123',
  },
  {
    id: 'spc-staff-33',
    staffId: 'SPC/STAFF/33',
    dor: '09/07/26',
    name: 'SAMUEL ENEJI',
    gender: 'MALE',
    mainClass: '',
    classArm: '',
    email: 'samuel.eneji@stpaulcollege.abjce.org.ng',
    role: 'subject_teacher',
    assignedClasses: ['SSS 2 A', 'SSS 2 B'],
    assignedSubjects: ['PHYSICS', 'CHEMISTRY'],
    department: 'Physical Sciences',
    phone: '+234 803 330 0033',
    registeredAt: '2026-07-09T09:00:00.000Z',
    password: 'password123',
  },
];

export const INITIAL_PRIMARY_TEACHERS: Teacher[] = [
  {
    id: 't-primary-admin',
    name: 'REV. SR. HEADMISTRESS / SUPER ADMIN',
    email: 'headmistress@stpaulsprimary.abjce.org.ng',
    role: 'super_admin',
    staffId: 'STP/PRI/ADMIN/001',
    password: 'UPgrade2026',
    assignedClasses: [...PRIMARY_CLASSES],
    assignedSubjects: [...PRIMARY_SUBJECTS],
    department: 'Primary School Directorate & Administration',
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

// Empty baseline for secondary students since demo students are removed
export const INITIAL_STUDENTS: Student[] = [];

// Primary baseline generator with registered primary pupils
export function generateInitialPrimaryStudents(): Student[] {
  const primaryPupils = [
    { name: 'CHIMAMANDA EZE', gender: 'FEMALE' as const, className: 'PRIMARY 1 A', role: 'Class Captain', id: 'std-pri-001', learnerId: 'STP/PRI/2026/001' },
    { name: 'KAMSIYOCHUKWU BELLO', gender: 'MALE' as const, className: 'PRIMARY 1 A', role: 'Regular Student', id: 'std-pri-002', learnerId: 'STP/PRI/2026/002' },
    { name: 'FATIMA ALIYU', gender: 'FEMALE' as const, className: 'PRIMARY 1 A', role: 'Regular Student', id: 'std-pri-003', learnerId: 'STP/PRI/2026/003' },
    { name: 'DAVID ADELEKE', gender: 'MALE' as const, className: 'PRIMARY 4 A', role: 'Health Prefect', id: 'std-pri-004', learnerId: 'STP/PRI/2026/014' },
    { name: 'PRAISE CHUKWU', gender: 'FEMALE' as const, className: 'PRIMARY 4 A', role: 'Class Captain', id: 'std-pri-005', learnerId: 'STP/PRI/2026/015' },
    { name: 'EMMANUEL OKON', gender: 'MALE' as const, className: 'PRIMARY 6 A', role: 'Head Boy', id: 'std-pri-006', learnerId: 'STP/PRI/2026/028' },
    { name: 'BLESSING OGBONNA', gender: 'FEMALE' as const, className: 'PRIMARY 6 A', role: 'Head Girl', id: 'std-pri-007', learnerId: 'STP/PRI/2026/029' },
  ];

  return primaryPupils.map((p, idx) => {
    const scores: Record<string, SubjectScore> = {};
    for (const subj of PRIMARY_SUBJECTS) {
      const ca1 = 12 + ((idx * 3) % 4);
      const ca2 = 13 + ((idx * 2) % 3);
      const ca3 = 8 + ((idx * 5) % 3);
      const exam = 45 + ((idx * 7) % 15);
      const total = ca1 + ca2 + ca3 + exam;
      scores[subj] = {
        ca1,
        ca2,
        ca3,
        ca4: 0,
        exam,
        total,
        grade: calculateGrade(total, INITIAL_PRIMARY_SCHOOL_SETTINGS.gradingScale),
        status: 'submitted',
      };
    }

    const termScores = {
      'First Term': { ...scores },
      'Second Term': { ...scores },
      'Third Term': { ...scores },
    };

    return {
      id: p.id,
      name: p.name,
      gender: p.gender,
      learnerId: p.learnerId,
      className: p.className,
      studentRole: p.role,
      enrolledSubjects: [...PRIMARY_SUBJECTS],
      daysPresent: 112,
      formTeacherComment: 'A very disciplined, attentive pupil with high academic promise and moral character.',
      principalComment: 'Promoted with commendable standing to the next basic level.',
      scores,
      termScores,
      affective: {
        punctuality: 5,
        honesty: 5,
        politeness: 5,
        neatness: 5,
        perseverance: 5,
        relationshipWithOthers: 5,
        diligence: 5,
        creativity: 4,
        classParticipation: 5,
      },
      psychomotor: {
        verbalFluency: 5,
        gamesSports: 4,
        musicalSkills: 4,
        drawingPainting: 4,
        handWriting: 5,
      },
      sourcePortal: "ST PAUL'S SCHOOL (PRIMARY) Registration Center",
    };
  });
}

export const INITIAL_PRIMARY_STUDENTS: Student[] = calculateAllRankings(generateInitialPrimaryStudents(), 'Third Term', INITIAL_PRIMARY_SCHOOL_SETTINGS.gradingScale);

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

  const id = data.id || `std-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;
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
