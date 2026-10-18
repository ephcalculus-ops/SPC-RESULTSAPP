import React, { useState, useRef } from 'react';
import { Student, StudentBiodata, Teacher, SchoolSettings } from '../types';
import { SCHOOL_CLASSES } from '../data/mockData';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Sparkles, 
  UserCheck, 
  ExternalLink,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';

interface ExternalPortalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Teacher;
  settings: SchoolSettings;
  students: Student[];
  onImportStudents: (
    incoming: Array<{
      name: string;
      className: string;
      gender?: 'MALE' | 'FEMALE';
      learnerId?: string;
      passportPhoto?: string;
      biodata?: StudentBiodata;
      sourcePortal?: string;
    }>,
    mode: 'merge' | 'append'
  ) => Promise<{ imported: number; updated: number; total: number }> | { imported: number; updated: number; total: number };
}

interface ParsedImportStudent {
  name: string;
  className: string;
  gender: 'MALE' | 'FEMALE';
  learnerId: string;
  passportPhoto?: string;
  biodata: StudentBiodata;
  sourcePortal: string;
  isExisting: boolean;
}

export const ExternalPortalImportModal: React.FC<ExternalPortalImportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  students,
  onImportStudents,
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'append'>('merge');
  const [sourcePortalName, setSourcePortalName] = useState<string>('FCT Secondary Education Board Portal');
  const [inputFormat, setInputFormat] = useState<'csv' | 'json'>('csv');
  const [rawText, setRawText] = useState<string>('');
  const [parsedStudents, setParsedStudents] = useState<ParsedImportStudent[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<{ imported: number; updated: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Existing learner IDs set for matching
  const existingLearnerIds = new Set(students.map(s => s.learnerId.trim().toUpperCase()));

  const handleParseData = (text: string, format: 'csv' | 'json') => {
    setParseError(null);
    setSuccessReport(null);

    if (!text.trim()) {
      setParsedStudents([]);
      return;
    }

    try {
      if (format === 'json') {
        const json = JSON.parse(text);
        const list = Array.isArray(json) ? json : json.students || [];
        if (!Array.isArray(list) || list.length === 0) {
          throw new Error('JSON must be an array of student objects.');
        }

        const parsed: ParsedImportStudent[] = list.map((item: any, idx: number) => {
          const name = item.name || item.fullName || `${item.surname || ''} ${item.firstName || ''}`.trim() || `Learner ${idx + 1}`;
          const className = item.className || item.class || 'JSS 1 A';
          const gender = String(item.gender || item.sex || 'MALE').toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE';
          const learnerId = item.learnerId || item.admissionNumber || item.regNo || `SPC/EXT/${Math.floor(100000 + Math.random() * 900000)}`;
          
          return {
            name,
            className,
            gender,
            learnerId,
            passportPhoto: item.passportPhoto || item.photo || item.passportUrl,
            sourcePortal: item.sourcePortal || sourcePortalName,
            biodata: {
              dateOfBirth: item.dateOfBirth || item.dob || '2010-06-12',
              bloodGroup: item.bloodGroup || 'O+',
              genotype: item.genotype || 'AA',
              nationality: item.nationality || 'Nigerian',
              stateOfOrigin: item.stateOfOrigin || item.state || 'FCT Abuja',
              lga: item.lga || 'Gwagwalada',
              residentialAddress: item.residentialAddress || item.address || 'Gwagwalada, Abuja',
              guardianName: item.guardianName || item.parentName || `Guardian of ${name}`,
              guardianPhone: item.guardianPhone || item.parentPhone || '+234 803 000 0000',
              guardianEmail: item.guardianEmail || item.parentEmail,
              guardianRelationship: item.guardianRelationship || 'Parent',
              admissionDate: item.admissionDate || '2025-09-10',
            },
            isExisting: existingLearnerIds.has(learnerId.trim().toUpperCase()),
          };
        });

        setParsedStudents(parsed);
      } else {
        // Parse CSV format
        const cleanText = text.replace(/^\uFEFF/, '').trim();
        const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least one student data row.');
        }

        const firstLine = lines[0];
        const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

        const parseCsvRowWithDelimiter = (lineText: string): string[] => {
          const result: string[] = [];
          let insideQuotes = false;
          let field = '';

          for (let i = 0; i < lineText.length; i++) {
            const char = lineText[i];
            if (char === '"' || char === "'") {
              insideQuotes = !insideQuotes;
            } else if (char === delimiter && !insideQuotes) {
              result.push(field.trim().replace(/^["']|["']$/g, ''));
              field = '';
            } else {
              field += char;
            }
          }
          result.push(field.trim().replace(/^["']|["']$/g, ''));
          return result;
        };

        const headers = parseCsvRowWithDelimiter(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        // Find header column indices prioritizing clean student names over guardian/parent names
        let nameIdx = headers.findIndex(h => h === 'fullname' || h === 'studentname' || h === 'learnername' || h === 'pupilname' || h === 'name');
        if (nameIdx === -1) {
          nameIdx = headers.findIndex(h => h.includes('name') && !h.includes('guardian') && !h.includes('parent') && !h.includes('father') && !h.includes('mother'));
        }

        const classIdx = headers.findIndex(h => h.includes('class') || h.includes('grade') || h.includes('level') || h.includes('arm'));
        const idIdx = headers.findIndex(h => h.includes('learner') || h.includes('admission') || h.includes('reg') || h === 'id' || h.includes('matric'));
        const genderIdx = headers.findIndex(h => h.includes('gender') || h.includes('sex'));
        const dobIdx = headers.findIndex(h => h.includes('dob') || h.includes('birth'));
        const bloodIdx = headers.findIndex(h => h.includes('blood'));
        const genoIdx = headers.findIndex(h => h.includes('geno'));
        const guardianNameIdx = headers.findIndex(h => h.includes('guardian') || h.includes('parent') || h.includes('father') || h.includes('mother'));
        const guardianPhoneIdx = headers.findIndex(h => (h.includes('phone') || h.includes('mobile') || h.includes('tel')) && !h.includes('student'));
        const stateIdx = headers.findIndex(h => h.includes('state') || h.includes('origin'));
        const addressIdx = headers.findIndex(h => h.includes('address') || h.includes('residence'));
        const photoIdx = headers.findIndex(h => h.includes('photo') || h.includes('passport'));

        if (nameIdx === -1 && classIdx === -1) {
          throw new Error('CSV must include "Name" and "Class" columns.');
        }

        const parsed: ParsedImportStudent[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = parseCsvRowWithDelimiter(lines[i]);
          if (row.length === 0 || !row[nameIdx >= 0 ? nameIdx : 0]) continue;

          const name = row[nameIdx >= 0 ? nameIdx : 0]?.trim() || `Student ${i}`;
          const rawClass = row[classIdx >= 0 ? classIdx : 1]?.trim() || 'JSS 1 A';
          const className = SCHOOL_CLASSES.find(c => c.toLowerCase() === rawClass.toLowerCase()) || rawClass;
          const rawGender = row[genderIdx >= 0 ? genderIdx : 2]?.trim().toUpperCase();
          const gender: 'MALE' | 'FEMALE' = rawGender && (rawGender.startsWith('F') || rawGender === 'GIRL') ? 'FEMALE' : 'MALE';
          const learnerId = row[idIdx >= 0 ? idIdx : 3]?.trim() || `SPC/EXT/${Math.floor(100000 + Math.random() * 900000)}`;

          parsed.push({
            name,
            className,
            gender,
            learnerId,
            passportPhoto: photoIdx >= 0 ? row[photoIdx]?.trim() : undefined,
            sourcePortal: sourcePortalName,
            biodata: {
              dateOfBirth: dobIdx >= 0 ? row[dobIdx]?.trim() : '2010-06-15',
              bloodGroup: bloodIdx >= 0 ? row[bloodIdx]?.trim() : 'O+',
              genotype: genoIdx >= 0 ? row[genoIdx]?.trim() : 'AA',
              nationality: 'Nigerian',
              stateOfOrigin: stateIdx >= 0 ? row[stateIdx]?.trim() : 'FCT Abuja',
              lga: 'Gwagwalada',
              residentialAddress: addressIdx >= 0 ? row[addressIdx]?.trim() : 'Gwagwalada, Abuja, FCT',
              guardianName: guardianNameIdx >= 0 ? row[guardianNameIdx]?.trim() : `Parent of ${name}`,
              guardianPhone: guardianPhoneIdx >= 0 ? row[guardianPhoneIdx]?.trim() : '+234 803 000 0000',
              guardianRelationship: 'Parent',
            },
            isExisting: existingLearnerIds.has(learnerId.trim().toUpperCase()),
          });
        }

        setParsedStudents(parsed);
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse student data. Please check formatting.');
      setParsedStudents([]);
    }
  };

  const parseCsvRow = (text: string): string[] => {
    const delimiter = (text.match(/;/g) || []).length > (text.match(/,/g) || []).length ? ';' : ',';
    const result: string[] = [];
    let insideQuotes = false;
    let field = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        result.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    result.push(field.trim());
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setRawText(content);
      const isJson = file.name.endsWith('.json');
      setInputFormat(isJson ? 'json' : 'csv');
      handleParseData(content, isJson ? 'json' : 'csv');
    };
    reader.readAsText(file);
  };

  // Sample Demo External Students from State/National Portal
  const loadDemoExternalPortalBatch = () => {
    const demoData = [
      {
        learnerId: 'FCT/2026/08819',
        name: 'CHIDIEBERE VICTORIA OKAFOR',
        className: 'SSS 1 A',
        gender: 'FEMALE',
        dateOfBirth: '2010-03-24',
        bloodGroup: 'B+',
        genotype: 'AA',
        stateOfOrigin: 'Anambra',
        lga: 'Aguata',
        guardianName: 'Chief Emeka Okafor',
        guardianPhone: '+234 802 334 5599',
        residentialAddress: 'Phase 3, Gwagwalada Layout, Abuja',
        sourcePortal: 'FCT Secondary Education Board Portal (Transfer)',
      },
      {
        learnerId: 'FCT/2026/08820',
        name: 'MOHAMMED BELLO ABDULLAHI',
        className: 'SSS 1 B',
        gender: 'MALE',
        dateOfBirth: '2009-11-12',
        bloodGroup: 'O+',
        genotype: 'AS',
        stateOfOrigin: 'Niger',
        lga: 'Bida',
        guardianName: 'Alhaji Bello Abdullahi',
        guardianPhone: '+234 803 778 1234',
        residentialAddress: 'Kwali Road, Gwagwalada, Abuja',
        sourcePortal: 'FCT Secondary Education Board Portal (Transfer)',
      },
      {
        learnerId: 'FCT/2026/08821',
        name: 'FAVOUR CHIDERA ADELAKUN',
        className: 'JSS 2 A',
        gender: 'FEMALE',
        dateOfBirth: '2011-08-19',
        bloodGroup: 'A+',
        genotype: 'AA',
        stateOfOrigin: 'Oyo',
        lga: 'Ibadan North',
        guardianName: 'Dr. Timothy Adelakun',
        guardianPhone: '+234 814 556 7890',
        residentialAddress: 'Staff Quarters, UniAbuja Road, Gwagwalada',
        sourcePortal: 'Federal Ministry of Education NEMIS Portal',
      },
      {
        learnerId: 'FCT/2026/08822',
        name: 'EMMANUEL OLUWASEUN BABATUNDE',
        className: 'JSS 2 B',
        gender: 'MALE',
        dateOfBirth: '2011-04-05',
        bloodGroup: 'O+',
        genotype: 'AA',
        stateOfOrigin: 'Kogi',
        lga: 'Kabba/Bunu',
        guardianName: 'Engr. J. Babatunde',
        guardianPhone: '+234 805 112 3344',
        residentialAddress: 'Dagiri Extension, Gwagwalada',
        sourcePortal: 'Federal Ministry of Education NEMIS Portal',
      },
      {
        learnerId: 'FCT/2026/08823',
        name: 'PRECIOUS HALIMA YAKUBU',
        className: 'JSS 3 A',
        gender: 'FEMALE',
        dateOfBirth: '2010-09-30',
        bloodGroup: 'AB+',
        genotype: 'AS',
        stateOfOrigin: 'Kaduna',
        lga: 'Zaria',
        guardianName: 'Mrs. Mary Yakubu',
        guardianPhone: '+234 809 667 8899',
        residentialAddress: 'Angwan Dodo, Gwagwalada',
        sourcePortal: 'FCT Secondary Education Board Portal (Transfer)',
      },
      {
        learnerId: 'FCT/2026/08824',
        name: 'JOSHUA CHUKWUNONSO EBERE',
        className: 'SSS 2 A',
        gender: 'MALE',
        dateOfBirth: '2008-12-14',
        bloodGroup: 'O+',
        genotype: 'AA',
        stateOfOrigin: 'Imo',
        lga: 'Owerri West',
        guardianName: 'Pastor David Ebere',
        guardianPhone: '+234 818 223 4455',
        residentialAddress: 'Secretariat Road, Gwagwalada',
        sourcePortal: 'Catholic Education Board Registry',
      },
      {
        learnerId: 'FCT/2026/08825',
        name: 'ZAINAB ABUBAKAR DANLADI',
        className: 'SSS 2 B',
        gender: 'FEMALE',
        dateOfBirth: '2009-02-18',
        bloodGroup: 'B+',
        genotype: 'AA',
        stateOfOrigin: 'Kano',
        lga: 'Nassarawa',
        guardianName: 'Mallam Abubakar Danladi',
        guardianPhone: '+234 803 998 7766',
        residentialAddress: 'Kutunku Village, Gwagwalada',
        sourcePortal: 'Catholic Education Board Registry',
      },
      {
        learnerId: 'FCT/2026/08826',
        name: 'DANIEL TERWASE GBAOR',
        className: 'SSS 3 A',
        gender: 'MALE',
        dateOfBirth: '2007-07-22',
        bloodGroup: 'O-',
        genotype: 'AA',
        stateOfOrigin: 'Benue',
        lga: 'Gboko',
        guardianName: 'Mr. Terwase Gbaor',
        guardianPhone: '+234 813 445 6677',
        residentialAddress: 'Old Kutunku, Gwagwalada',
        sourcePortal: 'FCT Secondary Education Board Portal (Transfer)',
      },
    ];

    const csvContent = 
`learnerId,name,className,gender,dateOfBirth,bloodGroup,genotype,stateOfOrigin,guardianName,guardianPhone,residentialAddress,sourcePortal
${demoData.map(d => `${d.learnerId},"${d.name}","${d.className}","${d.gender}","${d.dateOfBirth}","${d.bloodGroup}","${d.genotype}","${d.stateOfOrigin}","${d.guardianName}","${d.guardianPhone}","${d.residentialAddress}","${d.sourcePortal}"`).join('\n')}`;

    setRawText(csvContent);
    setInputFormat('csv');
    handleParseData(csvContent, 'csv');
  };

  const handleDownloadTemplate = () => {
    const sampleCsv = 
`learnerId,name,className,gender,dateOfBirth,bloodGroup,genotype,stateOfOrigin,guardianName,guardianPhone,residentialAddress
FCT/2026/9001,"ADEKUNLE SAMUEL TUNDE","SSS 1 A","MALE","2010-04-12","O+","AA","Ogun","Mr. Tunde Adekunle","+234 803 111 2233","Phase 1 Gwagwalada"
FCT/2026/9002,"BLESSING CHINAZA OKORIE","JSS 2 B","FEMALE","2011-09-08","B+","AA","Enugu","Mrs. Joy Okorie","+234 802 444 5566","Dagiri Gwagwalada"
FCT/2026/9003,"IBRAHIM HASSAN SULEIMAN","JSS 1 A","MALE","2012-01-20","A+","AS","Kaduna","Alhaji Suleiman Hassan","+234 814 777 8899","Kutunku Layout"`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'st_paul_external_portal_student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommitImport = async () => {
    if (parsedStudents.length === 0) return;

    try {
      const result = await onImportStudents(
        parsedStudents.map(p => ({
          name: p.name,
          className: p.className,
          gender: p.gender,
          learnerId: p.learnerId,
          passportPhoto: p.passportPhoto,
          biodata: p.biodata,
          sourcePortal: p.sourcePortal,
        })),
        importMode
      );

      setSuccessReport(result);
      setParsedStudents([]);
      setRawText('');
    } catch (err: any) {
      console.error('Import error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-amber-300 font-serif">
                  Import Students From External Portal
                </h3>
                <span className="bg-amber-400 text-red-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Super Admin Integration
                </span>
              </div>
              <p className="text-xs text-amber-100/80 mt-0.5">
                Bulk register learners already registered in another portal or state database into {settings.schoolName || 'ST PAUL COLLEGE'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-red-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success Banner */}
          {successReport && (
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex items-start justify-between shadow-sm animate-in fade-in">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">External Integration Successful!</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Successfully integrated <strong>{successReport.total} learners</strong> into {settings.schoolName || 'ST PAUL COLLEGE'} active registry.
                  </p>
                  <div className="flex gap-4 mt-2 text-xs font-semibold">
                    <span className="bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-900">
                      ✓ {successReport.imported} newly registered learners
                    </span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded text-blue-900">
                      ↻ {successReport.updated} existing learner records updated
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSuccessReport(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Configuration Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            {/* Originating Portal Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Source Portal Name
              </label>
              <input
                type="text"
                value={sourcePortalName}
                onChange={e => setSourcePortalName(e.target.value)}
                placeholder="e.g. FCT Secondary Education Board Portal"
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Integration Strategy */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sync Strategy
              </label>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="text-red-800 focus:ring-amber-500"
                  />
                  <span>Merge by Learner ID</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs font-medium cursor-pointer ml-3">
                  <input
                    type="radio"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-red-800 focus:ring-amber-500"
                  />
                  <span>Append as New</span>
                </label>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {importMode === 'merge' 
                  ? 'Updates biodata for existing IDs without touching their marks' 
                  : 'Always adds incoming entries as new students'}
              </p>
            </div>

            {/* Quick Demo & Template Actions */}
            <div className="flex flex-col justify-end gap-1.5">
              <button
                type="button"
                onClick={loadDemoExternalPortalBatch}
                className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white text-xs font-bold rounded-lg shadow-sm border border-amber-400 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Load 8 Demo Students (FCT Board)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center space-x-1 text-[11px] font-semibold text-slate-700 hover:text-red-900 underline"
              >
                <Download className="w-3 h-3" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>
          </div>

          {/* Input Method Tabs & Paste Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputFormat('csv');
                    handleParseData(rawText, 'csv');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                    inputFormat === 'csv'
                      ? 'bg-amber-400 text-red-950 border-amber-400 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  CSV Format
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputFormat('json');
                    handleParseData(rawText, 'json');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                    inputFormat === 'json'
                      ? 'bg-amber-400 text-red-950 border-amber-400 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  JSON Format
                </button>
              </div>

              {/* Upload File Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg shadow-sm transition"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                  <span>Choose File (.csv / .json)</span>
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              value={rawText}
              onChange={e => {
                setRawText(e.target.value);
                handleParseData(e.target.value, inputFormat);
              }}
              placeholder={
                inputFormat === 'csv'
                  ? 'Paste CSV text exported from another portal (e.g. learnerId, name, className, gender, dateOfBirth, guardianPhone, residentialAddress...)'
                  : 'Paste JSON array of students exported from another portal [ { "name": "...", "className": "...", "learnerId": "..." }, ... ]'
              }
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Validation Error Message */}
          {parseError && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Live Preview Table */}
          {parsedStudents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>{parsedStudents.length} Students Detected from External Export</span>
                </span>
                <span className="text-slate-500 text-[11px]">
                  {parsedStudents.filter(p => p.isExisting).length} matching existing records • {parsedStudents.filter(p => !p.isExisting).length} new admissions
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Student Full Name</th>
                      <th className="py-2 px-2">Class</th>
                      <th className="py-2 px-2">Learner ID</th>
                      <th className="py-2 px-2">Gender</th>
                      <th className="py-2 px-3">Guardian / Phone</th>
                      <th className="py-2 px-3">Origin / State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedStudents.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3">
                          {st.isExisting ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Matches Existing
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              New Learner
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-red-900 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {st.name.charAt(0)}
                          </div>
                          <span>{st.name}</span>
                        </td>
                        <td className="py-2 px-2 font-semibold text-slate-700">{st.className}</td>
                        <td className="py-2 px-2 font-mono text-[11px] text-slate-600">{st.learnerId}</td>
                        <td className="py-2 px-2 font-medium text-slate-600">{st.gender}</td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">
                          <div>{st.biodata.guardianName}</div>
                          <div className="text-[10px] text-slate-400">{st.biodata.guardianPhone}</div>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">
                          {st.biodata.stateOfOrigin || 'FCT'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommitImport}
            disabled={parsedStudents.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md border border-amber-400 transition"
          >
            <UserCheck className="w-4 h-4 text-amber-300" />
            <span>
              Integrate {parsedStudents.length} Students into Registry
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
