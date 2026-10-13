import { Student } from '../types';

export interface CommentCategory {
  label: string;
  comments: string[];
}

export const FORM_TEACHER_COMMENT_BANK: Record<string, string[]> = {
  Distinction: [
    'An outstanding performance! A diligent, disciplined, and focused learner. Keep it up.',
    'Brilliant result! She/He demonstrates excellent academic potential and good conduct.',
    'Exemplary performance! A role model in diligence, attendance, and moral character.',
    'Consistently tops the class with superior intellectual curiosity. Keep the flag flying high!',
    'A marvelous result reflecting rigorous study habits and attentive participation in class.'
  ],
  VeryGood: [
    'A very commendable result. Strive for higher distinction in the next academic term.',
    'Good intellectual commitment shown throughout the session. Well done.',
    'Consistently hard-working and well-behaved. Capable of even greater heights.',
    'Demonstrates sound understanding of core subjects. Continue working hard.',
    'A disciplined and focused student whose efforts are yielding impressive dividends.'
  ],
  Good: [
    'A satisfactory performance. Put more effort into weaker subjects for a better aggregate.',
    'Shows steady academic progress. With more concentration, top grades are within reach.',
    'Active in class and well-mannered. Needs to improve on test preparation and revision.',
    'A good effort. More consistency in homework and assignments will produce better outcomes.',
    'Has potential for excellence. Encourage him/her to avoid trivial distractions.'
  ],
  Average: [
    'An average performance. Must double efforts and read consistently to improve.',
    'Fair attempt. Needs extra attention in mathematics, sciences, and comprehension skills.',
    'Shows promise but lacks consistency in personal study hours. Work harder next term.',
    'Passable performance. Can achieve much better grades with disciplined time management.',
    'Has the capability to do well if greater concentration is given during lessons.'
  ],
  NeedsImprovement: [
    'Performance is below expectation. Must seek remedial guidance and avoid complacency.',
    'Weak academic result. Parents are advised to closely monitor daily study routines at home.',
    'Lacks adequate preparation for examinations. Needs serious commitment to studies.',
    'Urgent improvement needed in foundational subjects. Pay more attention in class.',
    'Needs drastic change in attitude towards school work and regular attendance.'
  ],
  Promotion: [
    'Promoted to the next class with flying colors. Congratulations!',
    'Promoted on merit. Maintain your academic dedication in the senior section.',
    'Promoted on trial. Must work diligently to clear weak subject areas.',
    'Advised to repeat the class to build stronger academic fundamentals.'
  ]
};

export const PRINCIPAL_COMMENT_BANK: Record<string, string[]> = {
  Distinction: [
    'A brilliant result. Maintain this high standard of excellence and moral discipline.',
    'Superb academic achievement! The College is proud of your intellectual prowess.',
    'An exceptional learner. Continue to strive for excellence in faith, character, and learning.',
    'Outstanding terminal report. You have set a commendable benchmark for your peers.',
    'Magnificent performance. May your light continue to shine brightly in all endeavors.'
  ],
  VeryGood: [
    'A very good result. Keep striving towards top distinction in your studies.',
    'Commendable effort shown throughout the academic term. Continue the good work.',
    'Good academic progress coupled with praiseworthy deportment. Well done.',
    'A solid academic foundation. Strive for greater scholastic laurels next session.',
    'Very impressive work. Do not rest on your laurels; reach for greater heights.'
  ],
  Good: [
    'A good performance. With greater determination, higher heights are attainable.',
    'Satisfactory work. I urge you to devote more time to extensive reading and revision.',
    'Fairly good result. Pay serious attention to teachers’ corrections and guidelines.',
    'Promising result. Work harder to achieve a well-deserved position at the top.',
    'Good conduct and steady progress. Maintain your focus on academic goals.'
  ],
  Average: [
    'Average result. Work harder next session to achieve your true potential.',
    'Can do much better than this. Cultivate regular study habits and seek teacher help.',
    'Fair result, but there is room for substantial improvement. Remain focused.',
    'Do not be discouraged; redouble your efforts in the coming term for better grades.',
    'Moderate performance. Greater discipline and devotion to studies are required.'
  ],
  NeedsImprovement: [
    'Disappointing result. Urgent intervention and serious dedication required.',
    'Must sit up and take studies seriously to avoid academic setbacks. Caution advised.',
    'Work harder next term. Academic slackness will not be tolerated in the college.',
    'Poor result. Learner must attend extra lesson clinics and revise consistently.',
    'Below the college benchmark. Parents/Guardians should liaise with the Principal.'
  ],
  Promotion: [
    'Approved for promotion to the next academic level. Congratulations!',
    'Promoted on merit to the next class. We expect continued excellence.',
    'Promoted on trial. A marked improvement is expected in the incoming term.',
    'Retained in class to consolidate fundamentals. Courage and determination needed.'
  ]
};

/**
 * Automatically suggests a tailored Form Teacher comment based on student's average score and rank
 */
export function getSuggestedFormTeacherComment(student: Student, term = 'Third Term'): string {
  const avg = student.averageScore ?? 0;
  const isAnnual = term === 'Cumulative' || term === 'Third Term';

  if (avg >= 80) {
    const list = FORM_TEACHER_COMMENT_BANK.Distinction;
    const comment = list[student.name.length % list.length];
    return isAnnual && avg >= 85 ? `${comment} Promoted to next class with distinction.` : comment;
  }
  if (avg >= 70) {
    const list = FORM_TEACHER_COMMENT_BANK.VeryGood;
    const comment = list[student.name.length % list.length];
    return isAnnual ? `${comment} Promoted to next class.` : comment;
  }
  if (avg >= 60) {
    const list = FORM_TEACHER_COMMENT_BANK.Good;
    const comment = list[student.name.length % list.length];
    return isAnnual ? `${comment} Promoted to next class.` : comment;
  }
  if (avg >= 50) {
    const list = FORM_TEACHER_COMMENT_BANK.Average;
    const comment = list[student.name.length % list.length];
    return isAnnual ? `${comment} Promoted on trial.` : comment;
  }
  const list = FORM_TEACHER_COMMENT_BANK.NeedsImprovement;
  const comment = list[student.name.length % list.length];
  return isAnnual ? `${comment} Advised to repeat.` : comment;
}

/**
 * Automatically suggests a tailored Principal comment based on student's average score and rank
 */
export function getSuggestedPrincipalComment(student: Student, term = 'Third Term'): string {
  const avg = student.averageScore ?? 0;
  const isAnnual = term === 'Cumulative' || term === 'Third Term';

  if (avg >= 80) {
    const list = PRINCIPAL_COMMENT_BANK.Distinction;
    const comment = list[(student.name.length + 1) % list.length];
    return isAnnual ? `${comment} Approved for promotion with honors.` : comment;
  }
  if (avg >= 70) {
    const list = PRINCIPAL_COMMENT_BANK.VeryGood;
    const comment = list[(student.name.length + 1) % list.length];
    return isAnnual ? `${comment} Approved for promotion to the next class.` : comment;
  }
  if (avg >= 60) {
    const list = PRINCIPAL_COMMENT_BANK.Good;
    const comment = list[(student.name.length + 1) % list.length];
    return isAnnual ? `${comment} Promoted to next class.` : comment;
  }
  if (avg >= 50) {
    const list = PRINCIPAL_COMMENT_BANK.Average;
    const comment = list[(student.name.length + 1) % list.length];
    return isAnnual ? `${comment} Promoted on trial. Work harder next session.` : comment;
  }
  const list = PRINCIPAL_COMMENT_BANK.NeedsImprovement;
  const comment = list[(student.name.length + 1) % list.length];
  return isAnnual ? `${comment} Retained in class.` : comment;
}
