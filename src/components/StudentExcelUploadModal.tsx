import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, StudentBiodata, Teacher, SchoolSettings } from '../types';
import { SCHOOL_CLASSES, normalizeClass, isJuniorClass } from '../data/mockData';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Check,
  RefreshCw,
  FileText,
  HelpCircle,
  ArrowRight,
  Database
} from 'lucide-react';

export interface EditableExcelStudent {
  tempId: string;
  name: string;
  className: string;
  gender: 'MALE' | 'FEMALE';
  learnerId: string;
  passportPhoto?: string;
  biodata: StudentBiodata;
  sourcePortal?: string;
  isExisting: boolean;
  validationErrors: string[];
}

interface StudentExcelUploadModalProps {
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
  ) => { imported: number; updated: number; total: number };
}

export const StudentExcelUploadModal: React.FC<StudentExcelUploadModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  students,
  onImportStudents,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'merge' | 'append'>('merge');
  const [sourceTag, setSourceTag] = useState<string>('Excel Registry Upload');
  const [parsedStudents, setParsedStudents] = useState<EditableExcelStudent[]>([]);
  const [selectedStudentIndices, setSelectedStudentIndices] = useState<Set<number>>(new Set());
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<{ imported: number; updated: number; total: number } | null>(null);

  // Modal for editing single student's deep biodata
  const [deepEditingStudentIndex, setDeepEditingStudentIndex] = useState<number | null>(null);

  // Bulk edit state
  const [bulkClassTarget, setBulkClassTarget] = useState<string>('JSS 1 A');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Existing learner IDs set for matching
  const existingLearnerIds = new Set(students.map(s => s.learnerId.trim().toUpperCase()));
  const existingNames = new Set(students.map(s => s.name.trim().toUpperCase()));

  const validateStudentRow = (student: EditableExcelStudent): string[] => {
    const errors: string[] = [];
    if (!student.name.trim()) {
      errors.push('Name is required');
    }
    if (!student.className) {
      errors.push('Class is required');
    }
    if (!student.learnerId.trim()) {
      errors.push('Learner ID is required');
    }
    return errors;
  };

  const generateAutoId = (index: number) => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `SPC/${year}/${rand}`;
  };

  // Process uploaded Excel / CSV file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setErrorBanner(null);
    setSuccessReport(null);
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIsProcessing(true);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Select the first sheet
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('The uploaded Excel spreadsheet contains no worksheets.');
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        throw new Error('No data found in worksheet. Please ensure the file has student rows below the header.');
      }

      // Map rows to EditableExcelStudent
      const parsed: EditableExcelStudent[] = rawRows.map((row, idx) => {
        // Find keys case-insensitively
        const getVal = (possibleKeys: string[]): string => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const target of possibleKeys) {
              const cleanTarget = target.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
              if (cleanKey === cleanTarget || cleanKey.includes(cleanTarget)) {
                return String(row[key]).trim();
              }
            }
          }
          return '';
        };

        const rawName = getVal(['fullname', 'studentname', 'learnername', 'name', 'surname']) ||
          `${getVal(['surname', 'lastname'])} ${getVal(['firstname'])} ${getVal(['othername', 'middlename'])}`.trim() ||
          `Learner ${idx + 1}`;

        const rawClass = getVal(['class', 'classname', 'level', 'arm', 'grade']) || 'JSS 1 A';
        const normalizedClassName = normalizeClass(rawClass);

        const rawGender = getVal(['gender', 'sex']).toUpperCase();
        const gender: 'MALE' | 'FEMALE' = rawGender.startsWith('F') ? 'FEMALE' : 'MALE';

        const rawLearnerId = getVal(['learnerid', 'admissionno', 'admissionnumber', 'regno', 'regnumber', 'id', 'studentno', 'matricno']) ||
          generateAutoId(idx);

        const dob = getVal(['dateofbirth', 'dob', 'birthdate', 'birth']) || '2011-06-15';
        const bloodGroup = getVal(['bloodgroup', 'blood']) || 'O+';
        const genotype = getVal(['genotype', 'geno']) || 'AA';
        const stateOfOrigin = getVal(['stateoforigin', 'state', 'origin']) || 'FCT Abuja';
        const lga = getVal(['lga', 'areacouncil', 'localgovernment']) || 'Gwagwalada';
        const nationality = getVal(['nationality', 'country']) || 'Nigerian';
        const address = getVal(['residentialaddress', 'address', 'homeaddress', 'residence']) || 'Gwagwalada, Abuja, FCT';
        const guardianName = getVal(['guardianname', 'parentname', 'guardian', 'parent', 'fathername', 'mothername']) || `Guardian of ${rawName}`;
        const guardianPhone = getVal(['guardianphone', 'parentphone', 'phone', 'phonenumber', 'tel', 'mobile', 'contactphone']) || '+234 803 000 0000';
        const guardianEmail = getVal(['guardianemail', 'parentemail', 'email', 'contactemail']) || '';
        const guardianRelationship = getVal(['guardianrelationship', 'relationship']) || 'Parent';
        const admissionDate = getVal(['admissiondate', 'dateadmitted', 'enrollmentdate']) || new Date().toISOString().split('T')[0];
        const previousSchool = getVal(['previousschool', 'priorschool', 'lastschool']) || '';
        const passportPhoto = getVal(['passportphoto', 'photo', 'passporturl', 'photourl', 'passport']) || undefined;

        const isExisting = existingLearnerIds.has(rawLearnerId.trim().toUpperCase()) ||
          existingNames.has(rawName.trim().toUpperCase());

        const studentObj: EditableExcelStudent = {
          tempId: `excel-row-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          name: rawName.toUpperCase(),
          className: normalizedClassName,
          gender,
          learnerId: rawLearnerId,
          passportPhoto,
          sourcePortal: sourceTag,
          biodata: {
            dateOfBirth: dob,
            bloodGroup,
            genotype,
            nationality,
            stateOfOrigin,
            lga,
            residentialAddress: address,
            guardianName,
            guardianPhone,
            guardianEmail,
            guardianRelationship,
            admissionDate,
            previousSchool,
          },
          isExisting,
          validationErrors: [],
        };

        studentObj.validationErrors = validateStudentRow(studentObj);
        return studentObj;
      });

      setParsedStudents(parsed);
      // Select all by default
      setSelectedStudentIndices(new Set(parsed.map((_, i) => i)));
    } catch (err: any) {
      console.error(err);
      setErrorBanner(err.message || 'Failed to parse Excel file. Please verify the file format.');
      setParsedStudents([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add a blank row to the table
  const handleAddBlankRow = () => {
    const year = new Date().getFullYear();
    const newStudent: EditableExcelStudent = {
      tempId: `manual-row-${Date.now()}`,
      name: '',
      className: filterClass !== 'ALL' ? filterClass : 'JSS 1 A',
      gender: 'MALE',
      learnerId: `SPC/${year}/${Math.floor(100000 + Math.random() * 900000)}`,
      sourcePortal: sourceTag,
      biodata: {
        dateOfBirth: '2011-06-15',
        bloodGroup: 'O+',
        genotype: 'AA',
        nationality: 'Nigerian',
        stateOfOrigin: 'FCT Abuja',
        lga: 'Gwagwalada',
        residentialAddress: 'Gwagwalada, Abuja, FCT',
        guardianName: '',
        guardianPhone: '+234 803 000 0000',
        guardianEmail: '',
        guardianRelationship: 'Parent',
        admissionDate: new Date().toISOString().split('T')[0],
      },
      isExisting: false,
      validationErrors: ['Name is required'],
    };

    setParsedStudents(prev => [newStudent, ...prev]);
    setSelectedStudentIndices(prev => {
      const next = new Set<number>();
      next.add(0);
      prev.forEach(i => next.add(i + 1));
      return next;
    });
  };

  // Update specific field in parsed student
  const handleUpdateField = (index: number, field: string, value: any) => {
    setParsedStudents(prev => {
      const next = [...prev];
      const target = { ...next[index] };

      if (field === 'className') {
        target.className = value;
      } else if (field === 'name') {
        target.name = String(value).toUpperCase();
      } else if (field === 'learnerId') {
        target.learnerId = value;
        target.isExisting = existingLearnerIds.has(String(value).trim().toUpperCase());
      } else if (field === 'gender') {
        target.gender = value;
      } else if (field.startsWith('biodata.')) {
        const bioKey = field.replace('biodata.', '') as keyof StudentBiodata;
        target.biodata = {
          ...target.biodata,
          [bioKey]: value,
        };
      }

      target.validationErrors = validateStudentRow(target);
      next[index] = target;
      return next;
    });
  };

  // Delete a row
  const handleDeleteRow = (index: number) => {
    setParsedStudents(prev => prev.filter((_, i) => i !== index));
    setSelectedStudentIndices(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  // Bulk Apply Class to selected students
  const handleBulkApplyClass = () => {
    if (selectedStudentIndices.size === 0) {
      alert('Please select at least one student using the checkboxes.');
      return;
    }
    setParsedStudents(prev => {
      return prev.map((s, idx) => {
        if (selectedStudentIndices.has(idx)) {
          const updated = { ...s, className: bulkClassTarget };
          updated.validationErrors = validateStudentRow(updated);
          return updated;
        }
        return s;
      });
    });
  };

  // Bulk Auto-Generate Missing IDs
  const handleBulkGenerateIds = () => {
    setParsedStudents(prev => {
      return prev.map((s, idx) => {
        if (!s.learnerId.trim() || s.learnerId.startsWith('SPC/EXT/')) {
          const year = new Date().getFullYear();
          const autoId = `SPC/${year}/${Math.floor(100000 + Math.random() * 900000)}`;
          const updated = { ...s, learnerId: autoId };
          updated.validationErrors = validateStudentRow(updated);
          return updated;
        }
        return s;
      });
    });
  };

  // Select / Deselect All
  const handleToggleSelectAll = () => {
    if (selectedStudentIndices.size === parsedStudents.length) {
      setSelectedStudentIndices(new Set());
    } else {
      setSelectedStudentIndices(new Set(parsedStudents.map((_, i) => i)));
    }
  };

  // Toggle single selection
  const handleToggleSelect = (index: number) => {
    setSelectedStudentIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Save / Commit registrations
  const handleCommitRegistrations = () => {
    const toImport = parsedStudents.filter((_, idx) => selectedStudentIndices.has(idx));

    if (toImport.length === 0) {
      setErrorBanner('Please select at least one student to register.');
      return;
    }

    // Check for validation errors
    const hasErrors = toImport.some(s => s.validationErrors.length > 0);
    if (hasErrors) {
      const confirmWithErrors = window.confirm(
        'Some selected student rows have missing names or class information. Would you like to proceed with valid records?'
      );
      if (!confirmWithErrors) return;
    }

    const validToImport = toImport.filter(s => s.name.trim() && s.className);

    if (validToImport.length === 0) {
      setErrorBanner('No valid student records found. Each student must have a Full Name and Class.');
      return;
    }

    const payload = validToImport.map(s => ({
      name: s.name.trim().toUpperCase(),
      className: s.className,
      gender: s.gender,
      learnerId: s.learnerId.trim(),
      passportPhoto: s.passportPhoto,
      biodata: s.biodata,
      sourcePortal: sourceTag,
    }));

    const result = onImportStudents(payload, importMode);
    setSuccessReport(result);
    setErrorBanner(null);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = (type: 'xlsx' | 'csv') => {
    const sampleData = [
      {
        'Full Name (Surname First)': 'ADEYEMI CHUKWUEMEKA BLESSING',
        'Class': 'JSS 1 A',
        'Learner / Admission ID': 'SPC/2026/0101',
        'Gender (MALE/FEMALE)': 'FEMALE',
        'Date of Birth (YYYY-MM-DD)': '2012-05-14',
        'Blood Group': 'O+',
        'Genotype': 'AA',
        'State of Origin': 'FCT Abuja',
        'LGA': 'Gwagwalada',
        'Residential Address': 'Behind St. Paul College, Gwagwalada, Abuja',
        'Guardian Full Name': 'Pastor Chukwuemeka Adeyemi',
        'Guardian Phone': '+234 803 111 2233',
        'Guardian Email': 'pastor.adeyemi@gmail.com',
        'Guardian Relationship': 'Father',
        'Admission Date': '2025-09-10',
        'Previous School': 'St. Jude Primary School, Gwagwalada',
      },
      {
        'Full Name (Surname First)': 'MOHAMMED BELLO IBRAHIM',
        'Class': 'JSS 1 B',
        'Learner / Admission ID': 'SPC/2026/0102',
        'Gender (MALE/FEMALE)': 'MALE',
        'Date of Birth (YYYY-MM-DD)': '2011-11-20',
        'Blood Group': 'B+',
        'Genotype': 'AA',
        'State of Origin': 'Niger State',
        'LGA': 'Suleja',
        'Residential Address': 'Plot 45 Secretariat Road, Gwagwalada',
        'Guardian Full Name': 'Alhaji Ibrahim Mohammed',
        'Guardian Phone': '+234 802 333 4455',
        'Guardian Email': 'bello.ibrahim@yahoo.com',
        'Guardian Relationship': 'Father',
        'Admission Date': '2025-09-10',
        'Previous School': 'Federal Government Model Primary School',
      },
      {
        'Full Name (Surname First)': 'OKONKWO PRAISE CHIDERA',
        'Class': 'SSS 1 A',
        'Learner / Admission ID': 'SPC/2026/0201',
        'Gender (MALE/FEMALE)': 'MALE',
        'Date of Birth (YYYY-MM-DD)': '2009-08-04',
        'Blood Group': 'A+',
        'Genotype': 'AS',
        'State of Origin': 'Anambra State',
        'LGA': 'Idemili North',
        'Residential Address': 'Phase 3 Layout, Gwagwalada, FCT',
        'Guardian Full Name': 'Mrs. Chidera Okonkwo',
        'Guardian Phone': '+234 809 555 7788',
        'Guardian Email': '',
        'Guardian Relationship': 'Mother',
        'Admission Date': '2025-09-10',
        'Previous School': 'Grace Foundation College, Abuja',
      },
      {
        'Full Name (Surname First)': 'YAKUBU FAITH ENE',
        'Class': 'SSS 1 B',
        'Learner / Admission ID': 'SPC/2026/0202',
        'Gender (MALE/FEMALE)': 'FEMALE',
        'Date of Birth (YYYY-MM-DD)': '2009-02-18',
        'Blood Group': 'O-',
        'Genotype': 'AA',
        'State of Origin': 'Benue State',
        'LGA': 'Otukpo',
        'Residential Address': 'Hospital Road, Gwagwalada',
        'Guardian Full Name': 'Dr. Ene Yakubu',
        'Guardian Phone': '+234 818 777 9900',
        'Guardian Email': 'yakubu.faith@gmail.com',
        'Guardian Relationship': 'Father',
        'Admission Date': '2025-09-10',
        'Previous School': 'Command Secondary School',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Auto-fit column widths
    const colWidths = [
      { wch: 32 }, // Name
      { wch: 12 }, // Class
      { wch: 22 }, // ID
      { wch: 12 }, // Gender
      { wch: 14 }, // DOB
      { wch: 10 }, // Blood
      { wch: 10 }, // Geno
      { wch: 16 }, // State
      { wch: 16 }, // LGA
      { wch: 35 }, // Address
      { wch: 28 }, // Guardian Name
      { wch: 18 }, // Guardian Phone
      { wch: 24 }, // Guardian Email
      { wch: 16 }, // Relationship
      { wch: 14 }, // Admission Date
      { wch: 30 }, // Previous School
    ];
    worksheet['!cols'] = colWidths;

    if (type === 'xlsx') {
      XLSX.writeFile(workbook, 'ST_PAUL_COLLEGE_STUDENT_REGISTRATION_TEMPLATE.xlsx');
    } else {
      XLSX.writeFile(workbook, 'ST_PAUL_COLLEGE_STUDENT_REGISTRATION_TEMPLATE.csv');
    }
  };

  // Filtered view in table
  const displayedStudents = parsedStudents.map((s, originalIndex) => ({ s, originalIndex })).filter(({ s }) => {
    if (filterClass !== 'ALL' && s.className !== filterClass) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchId = s.learnerId.toLowerCase().includes(q);
      const matchGuardian = s.biodata.guardianName?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchGuardian) return false;
    }
    return true;
  });

  const deepEditingStudent = deepEditingStudentIndex !== null ? parsedStudents[deepEditingStudentIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg font-black border border-emerald-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-emerald-300 font-serif">
                  Excel Student Registration Center
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400 text-red-950 font-black uppercase tracking-wider">
                  Bulk Class & Biodata Editor
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Upload existing students from Excel sheets (.xlsx, .xls, .csv), edit classes and full biodata, and complete instant registrations
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-lg border border-emerald-400/50 text-xs font-bold transition"
              title={`Download official ${settings.schoolName || 'School'} formatted registration template`}
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download Excel Template</span>
            </button>
            <button
              onClick={onClose}
              className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Success Report Alert */}
        {successReport && (
          <div className="bg-emerald-50 p-4 border-b border-emerald-300 flex items-start justify-between gap-3 text-emerald-900">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-emerald-950">
                  Student Registrations Successfully Completed!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Successfully processed <strong>{successReport.total}</strong> student records: 
                  {' '}<span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">{successReport.imported} Newly Enrolled</span>
                  {' '}and <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">{successReport.updated} Biodata Merged / Updated</span>.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSuccessReport(null);
                onClose();
              }}
              className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
            >
              Done & View Registry
            </button>
          </div>
        )}

        {/* Error Banner */}
        {errorBanner && (
          <div className="bg-red-50 p-3.5 border-b border-red-300 flex items-center justify-between text-red-900 text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button onClick={() => setErrorBanner(null)} className="text-red-700 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs bg-slate-50/50">
          {/* 1. File Upload Strip & Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md border border-emerald-400 transition"
              >
                <Upload className="w-4 h-4 text-amber-300" />
                <span>{file ? 'Upload Different Sheet' : 'Choose Excel / Spreadsheet File'}</span>
              </button>

              {fileName && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="truncate max-w-xs">{fileName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">
                    {parsedStudents.length} Students Detected
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddBlankRow}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 transition"
                title="Add an individual student row manually to edit"
              >
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>Add Row</span>
              </button>
            </div>

            {/* Registration Mode (Merge or Append) */}
            <div className="flex items-center space-x-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase ml-1">Existing Students:</span>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800" title="Updates class and biodata if Learner ID or Name matches">
                  Update Biodata & Class
                </span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800" title="Enrolls all rows as brand new student records">
                  Enroll as New Only
                </span>
              </label>
            </div>
          </div>

          {/* Quick instructions banner if no file uploaded yet */}
          {parsedStudents.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-emerald-300 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-800">
                  Upload Existing Student Excel Sheet
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload student rosters, existing admission registers, or spreadsheets from previous terms. You will be able to review and <strong>edit the class and full biodata</strong> for every student before saving!
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow border border-amber-400 flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>Select Excel / CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-xl border border-emerald-300 flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Download Blank Excel Template</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddBlankRow}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300"
                >
                  Enter Manually in Table
                </button>
              </div>

              {/* Supported Columns Guide */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-left max-w-2xl mx-auto mt-4 text-[11px] text-emerald-950 space-y-1.5">
                <div className="font-bold flex items-center space-x-1 text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Supported Column Headers (Automatic Mapping):</span>
                </div>
                <p className="text-slate-600">
                  <strong>Student Name / Full Name</strong>, <strong>Class</strong> (e.g. JSS 1 A, SSS 1 B), <strong>Learner ID / Admission No</strong>, <strong>Gender</strong>, <strong>Date of Birth</strong>, <strong>Blood Group</strong>, <strong>Genotype</strong>, <strong>State of Origin</strong>, <strong>LGA</strong>, <strong>Address</strong>, <strong>Guardian Name</strong>, <strong>Guardian Phone</strong>, <strong>Guardian Email</strong>, <strong>Relationship</strong>, <strong>Admission Date</strong>.
                </p>
              </div>
            </div>
          )}

          {/* 2. Interactive Editable Student Table with Bulk Actions */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3">
              {/* Batch Actions Toolbar */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                {/* Left: Bulk Class Assignment */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Bulk Class Assignment ({selectedStudentIndices.size} selected):
                  </span>
                  <select
                    value={bulkClassTarget}
                    onChange={e => setBulkClassTarget(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-600"
                  >
                    {SCHOOL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>
                        {cls} {isJuniorClass(cls) ? '(Junior)' : '(Senior)'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleBulkApplyClass}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-xs"
                    title="Change class of all currently checked students to the selected class"
                  >
                    Apply Class to Selected
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkGenerateIds}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs border border-slate-300"
                    title="Auto-generate SPC/2026/XXXXXX admission numbers for rows without an ID"
                  >
                    Auto-Fill Missing IDs
                  </button>
                </div>

                {/* Right: Search & Class Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-xs rounded-lg px-2.5 py-1.5"
                  >
                    <option value="ALL">Show All Classes ({parsedStudents.length})</option>
                    {SCHOOL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search name, ID or parent..."
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Table Body with In-Place Editing for Class and Biodata */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-emerald-200 text-[10px] uppercase font-bold tracking-wider border-b-2 border-emerald-500">
                      <th className="py-2.5 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStudentIndices.size === parsedStudents.length && parsedStudents.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="py-2.5 px-2 w-8 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Learner Full Name *</th>
                      <th className="py-2.5 px-2 min-w-[130px]">Class *</th>
                      <th className="py-2.5 px-2 min-w-[130px]">Admission ID *</th>
                      <th className="py-2.5 px-2 w-20">Gender</th>
                      <th className="py-2.5 px-2 w-28">Date of Birth</th>
                      <th className="py-2.5 px-2 w-20">Blood/Geno</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Parent / Guardian</th>
                      <th className="py-2.5 px-2 min-w-[120px]">Parent Phone</th>
                      <th className="py-2.5 px-2 min-w-[120px]">State of Origin</th>
                      <th className="py-2.5 px-3 text-center min-w-[130px]">Biodata & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedStudents.map(({ s: student, originalIndex }) => {
                      const isSelected = selectedStudentIndices.has(originalIndex);
                      const hasErrors = student.validationErrors.length > 0;

                      return (
                        <tr
                          key={student.tempId}
                          className={`hover:bg-emerald-50/40 transition-colors ${
                            isSelected ? 'bg-emerald-50/20' : ''
                          } ${hasErrors ? 'bg-red-50/30' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(originalIndex)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Index */}
                          <td className="py-2 px-2 text-center text-slate-400 font-mono text-[10px]">
                            {originalIndex + 1}
                          </td>

                          {/* Editable Full Name */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={student.name}
                              onChange={e => handleUpdateField(originalIndex, 'name', e.target.value)}
                              placeholder="Surname Firstname..."
                              className="w-full text-xs font-bold text-slate-900 px-2 py-1 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-emerald-600 uppercase"
                            />
                            {student.isExisting && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold inline-block mt-0.5">
                                Existing Student (Will {importMode === 'merge' ? 'Update' : 'Duplicate'})
                              </span>
                            )}
                          </td>

                          {/* Editable Class Dropdown */}
                          <td className="py-2 px-2">
                            <select
                              value={student.className}
                              onChange={e => handleUpdateField(originalIndex, 'className', e.target.value)}
                              className="w-full text-xs font-bold text-red-950 px-2 py-1 bg-red-50/50 border border-red-200 rounded focus:ring-2 focus:ring-red-600"
                            >
                              {SCHOOL_CLASSES.map(cls => (
                                <option key={cls} value={cls}>
                                  {cls}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Editable Learner ID */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={student.learnerId}
                              onChange={e => handleUpdateField(originalIndex, 'learnerId', e.target.value)}
                              placeholder="SPC/2026/..."
                              className="w-full text-xs font-mono font-semibold text-slate-800 px-2 py-1 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-emerald-600"
                            />
                          </td>

                          {/* Editable Gender */}
                          <td className="py-2 px-2">
                            <select
                              value={student.gender}
                              onChange={e => handleUpdateField(originalIndex, 'gender', e.target.value as any)}
                              className="w-full text-xs font-semibold text-slate-800 px-1 py-1 bg-white border border-slate-300 rounded"
                            >
                              <option value="MALE">MALE</option>
                              <option value="FEMALE">FEMALE</option>
                            </select>
                          </td>

                          {/* Editable Date of Birth */}
                          <td className="py-2 px-2">
                            <input
                              type="date"
                              value={student.biodata.dateOfBirth || '2011-06-15'}
                              onChange={e => handleUpdateField(originalIndex, 'biodata.dateOfBirth', e.target.value)}
                              className="w-full text-[11px] font-medium text-slate-800 px-1 py-1 bg-white border border-slate-300 rounded"
                            />
                          </td>

                          {/* Editable Blood Group & Genotype */}
                          <td className="py-2 px-2">
                            <div className="flex items-center space-x-1">
                              <select
                                value={student.biodata.bloodGroup || 'O+'}
                                onChange={e => handleUpdateField(originalIndex, 'biodata.bloodGroup', e.target.value)}
                                className="text-[10px] font-bold text-slate-700 px-1 py-1 bg-white border border-slate-200 rounded"
                              >
                                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                                  <option key={bg} value={bg}>{bg}</option>
                                ))}
                              </select>
                              <select
                                value={student.biodata.genotype || 'AA'}
                                onChange={e => handleUpdateField(originalIndex, 'biodata.genotype', e.target.value)}
                                className="text-[10px] font-bold text-slate-700 px-1 py-1 bg-white border border-slate-200 rounded"
                              >
                                {['AA', 'AS', 'SS', 'AC'].map(gt => (
                                  <option key={gt} value={gt}>{gt}</option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Editable Guardian Name */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={student.biodata.guardianName || ''}
                              onChange={e => handleUpdateField(originalIndex, 'biodata.guardianName', e.target.value)}
                              placeholder="Guardian Name"
                              className="w-full text-xs font-medium text-slate-800 px-2 py-1 bg-white border border-slate-300 rounded"
                            />
                          </td>

                          {/* Editable Guardian Phone */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={student.biodata.guardianPhone || ''}
                              onChange={e => handleUpdateField(originalIndex, 'biodata.guardianPhone', e.target.value)}
                              placeholder="+234..."
                              className="w-full text-[11px] font-mono text-slate-700 px-1.5 py-1 bg-white border border-slate-300 rounded"
                            />
                          </td>

                          {/* Editable State of Origin */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={student.biodata.stateOfOrigin || ''}
                              onChange={e => handleUpdateField(originalIndex, 'biodata.stateOfOrigin', e.target.value)}
                              placeholder="e.g. FCT Abuja"
                              className="w-full text-[11px] font-medium text-slate-800 px-1.5 py-1 bg-white border border-slate-300 rounded"
                            />
                          </td>

                          {/* Actions: Full Biodata Drawer & Delete */}
                          <td className="py-2 px-3 text-center space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setDeepEditingStudentIndex(originalIndex)}
                              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold rounded text-[11px] transition inline-flex items-center space-x-1"
                              title="Open complete Biodata editor (Address, LGA, Email, Relationship, Photos)"
                            >
                              <Edit3 className="w-3 h-3 text-emerald-800" />
                              <span>Full Biodata</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteRow(originalIndex)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                              title="Remove row from upload"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats Strip */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 px-2">
                <div>
                  Showing <strong>{displayedStudents.length}</strong> of <strong>{parsedStudents.length}</strong> students.
                  {' '}Selected for registration: <strong className="text-emerald-700">{selectedStudentIndices.size}</strong>.
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Valid & Ready</span>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 ml-2"></span>
                  <span>Existing Learner</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('csv')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template (CSV)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {parsedStudents.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all uploaded records and start over?')) {
                    setParsedStudents([]);
                    setFile(null);
                    setFileName('');
                  }
                }}
                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 font-semibold"
              >
                Clear All
              </button>
            )}

            <button
              type="button"
              disabled={parsedStudents.length === 0 || selectedStudentIndices.size === 0}
              onClick={handleCommitRegistrations}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md border transition ${
                parsedStudents.length > 0 && selectedStudentIndices.size > 0
                  ? 'bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 hover:from-emerald-600 hover:to-teal-700 text-white border-amber-400'
                  : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>
                Register Selected Students ({selectedStudentIndices.size})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. NESTED MODAL: DEEP BIODATA & CLASS EDITOR FOR SINGLE ROW   */}
      {/* ============================================================ */}
      {deepEditingStudent && deepEditingStudentIndex !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-amber-300" />
                <h4 className="font-bold text-sm text-emerald-200 font-serif">
                  Edit Learner Class & Detailed Biodata
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDeepEditingStudentIndex(null)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Deep Editor Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{deepEditingStudent.name || 'UNNAMED LEARNER'}</div>
                  <div className="text-[11px] font-mono text-emerald-800">{deepEditingStudent.learnerId}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px]">
                  {deepEditingStudent.className}
                </span>
              </div>

              {/* Academic Section */}
              <div className="space-y-2">
                <h5 className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider border-b pb-1">
                  1. Academic & Enrollment Details
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Learner Full Name *</label>
                    <input
                      type="text"
                      value={deepEditingStudent.name}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'name', e.target.value)}
                      className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Assigned Class *</label>
                    <select
                      value={deepEditingStudent.className}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'className', e.target.value)}
                      className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-emerald-950"
                    >
                      {SCHOOL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>
                          {cls} {isJuniorClass(cls) ? '(Junior)' : '(Senior)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Learner / Admission ID *</label>
                    <input
                      type="text"
                      value={deepEditingStudent.learnerId}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'learnerId', e.target.value)}
                      className="w-full text-xs font-mono font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Admission Date</label>
                    <input
                      type="date"
                      value={deepEditingStudent.biodata.admissionDate || '2025-09-10'}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.admissionDate', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Biodata */}
              <div className="space-y-2">
                <h5 className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider border-b pb-1">
                  2. Personal Biodata & Origin
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Gender</label>
                    <select
                      value={deepEditingStudent.gender}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'gender', e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Date of Birth</label>
                    <input
                      type="date"
                      value={deepEditingStudent.biodata.dateOfBirth || '2011-06-15'}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.dateOfBirth', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Blood Group</label>
                    <select
                      value={deepEditingStudent.biodata.bloodGroup || 'O+'}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.bloodGroup', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Genotype</label>
                    <select
                      value={deepEditingStudent.biodata.genotype || 'AA'}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.genotype', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    >
                      {['AA', 'AS', 'SS', 'AC'].map(gt => (
                        <option key={gt} value={gt}>{gt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">State of Origin</label>
                    <input
                      type="text"
                      value={deepEditingStudent.biodata.stateOfOrigin || ''}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.stateOfOrigin', e.target.value)}
                      placeholder="e.g. FCT Abuja"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">LGA / Area Council</label>
                    <input
                      type="text"
                      value={deepEditingStudent.biodata.lga || ''}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.lga', e.target.value)}
                      placeholder="e.g. Gwagwalada"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Residential Address</label>
                    <input
                      type="text"
                      value={deepEditingStudent.biodata.residentialAddress || ''}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.residentialAddress', e.target.value)}
                      placeholder="Street, Area, City"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Parent & Guardian */}
              <div className="space-y-2">
                <h5 className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider border-b pb-1">
                  3. Parent & Guardian Contact Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Guardian Full Name</label>
                    <input
                      type="text"
                      value={deepEditingStudent.biodata.guardianName || ''}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.guardianName', e.target.value)}
                      placeholder="Mr./Mrs. ..."
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Guardian Telephone</label>
                    <input
                      type="tel"
                      value={deepEditingStudent.biodata.guardianPhone || ''}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.guardianPhone', e.target.value)}
                      placeholder="+234..."
                      className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Guardian Email</label>
                    <input
                      type="email"
                      value={deepEditingStudent.biodata.guardianEmail || ''}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.guardianEmail', e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Relationship</label>
                    <select
                      value={deepEditingStudent.biodata.guardianRelationship || 'Father'}
                      onChange={e => handleUpdateField(deepEditingStudentIndex, 'biodata.guardianRelationship', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Legal Guardian</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDeepEditingStudentIndex(null)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
              >
                Save & Return to Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
