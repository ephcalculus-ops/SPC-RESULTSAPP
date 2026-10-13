import { Student, Teacher, SchoolSettings } from '../types';
import { OFFICIAL_SUBJECTS, calculateGrade, getSubjectsForClass, getCAConfig } from '../data/mockData';
import * as XLSX from 'xlsx';

export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  message: string;
  timestamp: string;
}

export class GoogleSheetsService {
  /**
   * Intelligently extract Google Spreadsheet ID from any URL or raw ID
   */
  static extractSpreadsheetId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();
    // Check if it's already an ID (alphanumeric, dashes, underscores, typically 40+ chars)
    if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
      return trimmed;
    }
    // Match /d/{id} in URL
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Match id= query param
    const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (queryMatch && queryMatch[1]) {
      return queryMatch[1];
    }
    return trimmed;
  }

  /**
   * Generate an XLSX Workbook formatted specifically for Google Sheets import
   * Teachers can import this into Google Drive / Sheets with 100% native compatibility
   */
  static generateGoogleSheetsWorkbook(
    students: Student[],
    teachers: Teacher[],
    settings: SchoolSettings
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. Overview Sheet
    const overviewRows: (string | number)[][] = [
      [settings.schoolName, '', '', '', '', ''],
      [settings.schoolAddress, '', '', '', '', ''],
      [`Email: ${settings.schoolEmail}`, '', '', '', '', ''],
      [`SESSION: ${settings.session} | TERM: ${settings.term} | TOTAL STUDENTS: ${students.length} | TOTAL TEACHERS: ${teachers.length}`],
      [],
      ['CLASS', 'TOTAL ENROLLED', 'MALES', 'FEMALES', 'CLASS AVERAGE (%)', 'SYNC STATUS'],
    ];

    const classes = Array.from(new Set(students.map(s => s.className))).sort();
    for (const cls of classes) {
      const classStudents = students.filter(s => s.className === cls);
      const males = classStudents.filter(s => s.gender === 'MALE').length;
      const females = classStudents.filter(s => s.gender === 'FEMALE').length;
      const avg = classStudents.length > 0 
        ? (classStudents.reduce((sum, s) => sum + (s.averageScore || 0), 0) / classStudents.length).toFixed(2)
        : '0.00';
      overviewRows.push([cls, classStudents.length, males, females, `${avg}%`, 'Active']);
    }

    const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'School Overview');

    // 2. Class Broadsheet Tabs
    for (const cls of classes) {
      const classStudents = students
        .filter(s => s.className === cls)
        .sort((a, b) => (a.positionInClass || 999) - (b.positionInClass || 999));

      const sheetRows: (string | number)[][] = [
        [`${settings.schoolName} - OFFICIAL TERMINAL BROADSHEET`],
        [`CLASS: ${cls} | SESSION: ${settings.session} | TERM: ${settings.term} | STUDENTS: ${classStudents.length}`],
        [],
      ];

      const classSubjs = getSubjectsForClass(cls);
      const caCfg = getCAConfig(cls, settings);
      const isCa4 = caCfg.ca4Max > 0;

      // Headers
      const h1: (string | number)[] = ['S/N', 'Learner ID', 'Student Full Name', 'Gender'];
      for (const subj of classSubjs) {
        h1.push(subj);
        const emptyCount = isCa4 ? 6 : 5;
        for (let k = 0; k < emptyCount; k++) h1.push('');
      }
      h1.push('Grand Total', 'Average (%)', 'Position', 'Form Teacher Remarks');

      const h2: (string | number)[] = ['', '', '', ''];
      for (let i = 0; i < classSubjs.length; i++) {
        h2.push(`CA1 (${caCfg.ca1Max})`, `CA2 (${caCfg.ca2Max})`, `CA3 (${caCfg.ca3Max})`);
        if (isCa4) {
          h2.push(`CA4 (${caCfg.ca4Max})`);
        }
        h2.push(`Exam (${caCfg.examMax})`, 'Total (100)', 'Grade');
      }
      h2.push('', '', '', '');

      sheetRows.push(h1);
      sheetRows.push(h2);

      // Student rows
      classStudents.forEach((st, idx) => {
        const row: (string | number)[] = [
          idx + 1,
          st.learnerId,
          st.name,
          st.gender,
        ];

        for (const subj of classSubjs) {
          const sc = st.scores[subj];
          if (sc) {
            row.push(
              sc.ca1 ?? 0,
              sc.ca2 ?? 0,
              sc.ca3 ?? 0,
            );
            if (isCa4) {
              row.push(sc.ca4 ?? 0);
            }
            row.push(
              sc.exam ?? 0,
              sc.total ?? 0,
              sc.grade || calculateGrade(sc.total ?? 0)
            );
          } else {
            if (isCa4) {
              row.push(0, 0, 0, 0, 0, 0, 'F');
            } else {
              row.push(0, 0, 0, 0, 0, 'F');
            }
          }
        }

        row.push(
          st.totalScore || 0,
          st.averageScore ? `${st.averageScore}%` : '0%',
          st.positionInClass || idx + 1,
          st.formTeacherComment || 'Good'
        );

        sheetRows.push(row);
      });

      const wsClass = XLSX.utils.aoa_to_sheet(sheetRows);
      // Clean sheet title (max 31 characters in Excel/Google Sheets)
      const tabTitle = `${cls.replace(/\s+/g, '_')}_Broadsheet`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, wsClass, tabTitle);
    }

    // 3. Staff Directory Tab
    const staffRows: (string | number)[][] = [
      [`${settings.schoolName} - ACADEMIC STAFF DIRECTORY`],
      ['S/N', 'Staff ID', 'Teacher Name', 'Email', 'Role', 'Form Class', 'Assigned Subjects', 'Assigned Classes'],
    ];

    teachers.forEach((t, i) => {
      staffRows.push([
        i + 1,
        t.staffId,
        t.name,
        t.email,
        t.role.replace('_', ' ').toUpperCase(),
        t.isFormTeacherOf || 'None',
        t.assignedSubjects.join(', '),
        t.assignedClasses.join(', '),
      ]);
    });

    const wsStaff = XLSX.utils.aoa_to_sheet(staffRows);
    XLSX.utils.book_append_sheet(wb, wsStaff, 'Staff Directory');

    // Trigger download of the workbook
    const fileName = `${settings.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_GoogleSheets_Master_${settings.session.replace('/', '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Sync directly via Google Apps Script Webhook URL (zero OAuth consent required)
   */
  static async syncViaWebhook(
    webhookUrl: string,
    students: Student[],
    teachers: Teacher[],
    settings: SchoolSettings
  ): Promise<SyncResult> {
    try {
      const payload = {
        schoolName: settings.schoolName,
        session: settings.session,
        term: settings.term,
        studentsCount: students.length,
        teachersCount: teachers.length,
        students: students.map(s => ({
          learnerId: s.learnerId,
          name: s.name,
          gender: s.gender,
          className: s.className,
          scores: s.scores,
          totalScore: s.totalScore,
          averageScore: s.averageScore,
          positionInClass: s.positionInClass,
          formTeacherComment: s.formTeacherComment,
        })),
        teachers: teachers.map(t => ({
          staffId: t.staffId,
          name: t.name,
          role: t.role,
          assignedClasses: t.assignedClasses,
          assignedSubjects: t.assignedSubjects,
        })),
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors', // Google Apps Script web apps often redirect with 302
      });

      return {
        success: true,
        message: `Successfully transmitted ${students.length} student scores to Google Sheets Webhook!`,
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Webhook sync failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Ready-to-use Google Apps Script Code snippet for teachers/schools
   */
  static getAppsScriptCode(): string {
    return `// ==========================================
// ST PAUL COLLEGE - GOOGLE SHEETS WEBHOOK
// Paste this in Extensions > Apps Script in Google Sheets
// Click Deploy > New Deployment > Web App > Access: Anyone
// ==========================================
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  sheet.appendRow(["SYNC RECORD", data.schoolName, data.session, data.term, new Date()]);
  sheet.appendRow(["Learner ID", "Student Name", "Class", "Total Score", "Average %", "Position"]);
  
  for (var i = 0; i < data.students.length; i++) {
    var s = data.students[i];
    sheet.appendRow([s.learnerId, s.name, s.className, s.totalScore, s.averageScore + "%", s.positionInClass]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.students.length }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
  }

  /**
   * Create a new Google Spreadsheet with structured tabs for ST PAUL COLLEGE
   */
  static async createMasterSpreadsheet(
    accessToken: string,
    settings: SchoolSettings,
    classes: string[]
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const title = `${settings.schoolName} - Master Examination Broadsheet (${settings.session})`;
    
    // Prepare sheets list
    const sheetTitles = ['Overview', ...classes.map(c => `${c} Broadsheet`), 'Staff Directory'];
    
    const requestBody = {
      properties: {
        title,
      },
      sheets: sheetTitles.map(sheetTitle => ({
        properties: {
          title: sheetTitle,
          gridProperties: {
            frozenRowCount: 4,
            frozenColumnCount: 3,
          },
        },
      })),
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create spreadsheet: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      spreadsheetId: data.spreadsheetId,
      spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    };
  }

  /**
   * Export all classes, students and teachers data into Google Sheets
   */
  static async syncAllToSpreadsheet(
    accessToken: string,
    spreadsheetId: string,
    students: Student[],
    teachers: Teacher[],
    settings: SchoolSettings
  ): Promise<SyncResult> {
    try {
      // 1. Overview Sheet Data
      const overviewRows: (string | number)[][] = [
        [settings.schoolName, '', '', '', ''],
        [settings.schoolAddress, '', '', '', ''],
        [`Email: ${settings.schoolEmail}`, '', '', '', ''],
        [`SESSION: ${settings.session} | TERM: ${settings.term} | TOTAL STUDENTS: ${students.length} | TOTAL TEACHERS: ${teachers.length}`],
        [],
        ['CLASS SUMMARY', 'ENROLMENT', 'MALE', 'FEMALE', 'CLASS AVERAGE (%)', 'STATUS'],
      ];

      // Group students by class
      const classes = Array.from(new Set(students.map(s => s.className))).sort();
      for (const cls of classes) {
        const classStudents = students.filter(s => s.className === cls);
        const males = classStudents.filter(s => s.gender === 'MALE').length;
        const females = classStudents.filter(s => s.gender === 'FEMALE').length;
        const avg = classStudents.length > 0 
          ? (classStudents.reduce((sum, s) => sum + (s.averageScore || 0), 0) / classStudents.length).toFixed(2)
          : '0.00';
        overviewRows.push([cls, classStudents.length, males, females, `${avg}%`, 'Synchronized']);
      }

      // 2. Prepare Broadsheet Data for each class
      const dataRanges: { range: string; values: (string | number)[][] }[] = [
        {
          range: `'Overview'!A1`,
          values: overviewRows,
        },
      ];

      for (const cls of classes) {
        const classStudents = students
          .filter(s => s.className === cls)
          .sort((a, b) => (a.positionInClass || 999) - (b.positionInClass || 999));

        const classRows: (string | number)[][] = [
          [`${settings.schoolName} - TERMINAL BROADSHEET`, '', '', ''],
          [`CLASS: ${cls} | SESSION: ${settings.session} | TERM: ${settings.term} | ENROLMENT: ${classStudents.length} | DAYS OPENED: ${settings.daysSchoolOpened}`],
          [],
        ];

        const classSubjs = getSubjectsForClass(cls);
        const caCfg = getCAConfig(cls, settings);
        const isCa4 = caCfg.ca4Max > 0;

        // Column headers
        const header1: (string | number)[] = ['S/N', 'Learner ID', 'Student Name', 'Gender'];
        for (const subj of classSubjs) {
          header1.push(subj);
          header1.push(''); // CA1
          header1.push(''); // CA2
          header1.push(''); // CA3
          if (isCa4) {
            header1.push(''); // CA4
          }
          header1.push(''); // EXAM
          header1.push(''); // GRADE
        }
        header1.push('GRAND TOTAL', 'AVERAGE (%)', 'CLASS RANK', 'REMARKS');

        const header2: (string | number)[] = ['', '', '', ''];
        for (let i = 0; i < classSubjs.length; i++) {
          header2.push(`CA1 (${caCfg.ca1Max})`, `CA2 (${caCfg.ca2Max})`, `CA3 (${caCfg.ca3Max})`);
          if (isCa4) {
            header2.push(`CA4 (${caCfg.ca4Max})`);
          }
          header2.push(`EXAM (${caCfg.examMax})`, 'TOTAL (100)', 'GRADE');
        }
        header2.push('', '', '', '');

        classRows.push(header1);
        classRows.push(header2);

        // Populate student rows
        classStudents.forEach((st, idx) => {
          const row: (string | number)[] = [
            idx + 1,
            st.learnerId,
            st.name,
            st.gender,
          ];

          for (const subj of classSubjs) {
            const sc = st.scores[subj];
            if (sc) {
              row.push(
                sc.ca1 ?? 0,
                sc.ca2 ?? 0,
                sc.ca3 ?? 0,
              );
              if (isCa4) {
                row.push(sc.ca4 ?? 0);
              }
              row.push(
                sc.exam ?? 0,
                sc.total ?? 0,
                sc.grade || calculateGrade(sc.total ?? 0)
              );
            } else {
              if (isCa4) {
                row.push(0, 0, 0, 0, 0, 0, 'F');
              } else {
                row.push(0, 0, 0, 0, 0, 'F');
              }
            }
          }

          row.push(
            st.totalScore || 0,
            st.averageScore ? `${st.averageScore}%` : '0%',
            st.positionInClass || idx + 1,
            st.formTeacherComment || 'Good'
          );

          classRows.push(row);
        });

        dataRanges.push({
          range: `'${cls} Broadsheet'!A1`,
          values: classRows,
        });
      }

      // 3. Teachers Roster Data
      const teacherRows: (string | number)[][] = [
        [`${settings.schoolName} - ACADEMIC STAFF DIRECTORY & ASSIGNMENTS`],
        [],
        ['S/N', 'Staff ID', 'Teacher Name', 'Email', 'Role', 'Form Class', 'Assigned Subjects', 'Assigned Classes'],
      ];

      teachers.forEach((t, i) => {
        teacherRows.push([
          i + 1,
          t.staffId,
          t.name,
          t.email,
          t.role.replace('_', ' ').toUpperCase(),
          t.isFormTeacherOf || 'None',
          t.assignedSubjects.join(', '),
          t.assignedClasses.join(', '),
        ]);
      });

      dataRanges.push({
        range: `'Staff Directory'!A1`,
        values: teacherRows,
      });

      // Execute batchUpdate values
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: dataRanges,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed to update spreadsheet: ${res.statusText}`);
      }

      return {
        success: true,
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
        message: `Successfully synchronized ${students.length} students and ${teachers.length} teachers to Google Sheets!`,
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      console.error('Google Sheets Sync error:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown synchronization error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Pull updated scores from a class sheet in Google Sheets back into the application
   */
  static async pullClassScores(
    accessToken: string,
    spreadsheetId: string,
    className: string
  ): Promise<any[]> {
    const range = `'${className} Broadsheet'!A5:Z200`;
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch class sheet: ${res.statusText}`);
    }

    const data = await res.json();
    return data.values || [];
  }
}

