import React, { useState, useMemo, useRef } from 'react';
import { Student, StudentBiodata, Teacher, SchoolSettings } from '../types';
import { 
  SCHOOL_CLASSES, 
  isJuniorClass, 
  DEFAULT_OFFICIAL_STAMP,
  ALL_SUBJECTS,
  getSubjectsForClass,
  JUNIOR_SUBJECTS,
  SENIOR_SUBJECTS
} from '../data/mockData';
import { ExternalPortalImportModal } from './ExternalPortalImportModal';
import { StudentExcelUploadModal } from './StudentExcelUploadModal';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Upload, 
  FileSpreadsheet,
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Edit3, 
  FileText, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Calendar, 
  Droplet, 
  HeartHandshake, 
  ExternalLink,
  Layers,
  Database,
  ArrowRight,
  FolderUp,
  MessageSquare,
  Award,
  BookOpen,
  Lock,
  Plus
} from 'lucide-react';
import { compressPassportImage, validateImageFile } from '../utils/imageCompressor';
import { STUDENT_ROLES_LIST } from './StudentBiodataModal';

interface StudentRegistrationCenterProps {
  students: Student[];
  currentUser: Teacher;
  settings: SchoolSettings;
  onRegisterStudent: (newStudent: Partial<Student> & { name: string; className: string }) => Student;
  onUpdateStudent: (studentId: string, updates: Partial<Student>) => void;
  onDeleteStudent: (studentId: string) => void;
  onImportExternalStudents: (
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
  onSelectStudentForReport: (student: Student) => void;
  onOpenPassportModal?: () => void;
  onOpenClassCommentsModal?: () => void;
  onOpenBulkPromotionModal?: () => void;
  onOpenExcelUploadModal?: () => void;
}

export const STUDENT_ROLES_PRESETS = [
  'Regular Student',
  'Head Boy / Senior Prefect (Boy)',
  'Head Girl / Senior Prefect (Girl)',
  'Assistant Head Boy',
  'Assistant Head Girl',
  'Class Captain / Monitor',
  'Assistant Class Captain',
  'Sanitary & Health Prefect',
  'Labor & Maintenance Prefect',
  'Sports & Games Prefect',
  'Assembly & Chapel Prefect',
  'Library & Academic Prefect',
  'Time Keeper',
  'Social & Cultural Prefect',
  'Dining & Welfare Prefect',
  'Special Duties Prefect',
];

export const StudentRegistrationCenter: React.FC<StudentRegistrationCenterProps> = ({
  students,
  currentUser,
  settings,
  onRegisterStudent,
  onUpdateStudent,
  onDeleteStudent,
  onImportExternalStudents,
  onSelectStudentForReport,
  onOpenPassportModal,
  onOpenClassCommentsModal,
  onOpenBulkPromotionModal,
  onOpenExcelUploadModal,
}) => {
  // Directory filters
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Direct card upload handler state
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const [targetStudentForCardUpload, setTargetStudentForCardUpload] = useState<Student | null>(null);

  const handleCardUploadTrigger = (student: Student) => {
    const isAuthorized = currentUser.role === 'super_admin' || currentUser.role === 'admin' || (currentUser.role === 'form_teacher' && currentUser.isFormTeacherOf === student.className);
    if (!isAuthorized) {
      alert('Access Restricted: Only Super Admin, Admin, or the Assigned Form Teacher can update student photographs.');
      return;
    }

    if (student.passportPhoto) {
      const confirmReplace = window.confirm(
        `Identity Protection Alert:\nLearner "${student.name}" (${student.learnerId}) already has an official verified passport photo.\n\nAre you sure you want to replace it? Ensure the new photo belongs strictly to this student to avoid manipulating results.`
      );
      if (!confirmReplace) return;
    }

    setTargetStudentForCardUpload(student);
    if (cardFileInputRef.current) {
      cardFileInputRef.current.value = '';
      cardFileInputRef.current.click();
    }
  };

  const handleCardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetStudentForCardUpload) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error || 'Invalid file format.');
      return;
    }
    try {
      const compressed = await compressPassportImage(file);
      onUpdateStudent(targetStudentForCardUpload.id, { passportPhoto: compressed });
    } catch (err) {
      console.error(err);
      alert('Failed to process image file.');
    } finally {
      setTargetStudentForCardUpload(null);
    }
  };

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [isExternalPortalModalOpen, setIsExternalPortalModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    className: 'JSS 1 A',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    learnerId: '',
    studentRole: 'Regular Student',
    customRole: '',
    enrolledSubjects: ['MATHEMATICS', 'ENGLISH STUDIES', 'BASIC SCIENCE', 'BASIC TECHNOLOGY', 'SOCIAL STUDIES', 'CIVIC EDUCATION', 'BUSINESS STUDIES', 'AGRICULTURAL SCIENCE', 'HOME ECONOMICS', 'CULTURAL & CREATIVE ARTS'] as string[],
    passportPhoto: '',
    dateOfBirth: '2011-06-15',
    bloodGroup: 'O+',
    genotype: 'AA',
    nationality: 'Nigerian',
    stateOfOrigin: 'FCT Abuja',
    lga: 'Gwagwalada',
    residentialAddress: 'Gwagwalada, Abuja, FCT',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelationship: 'Father',
    admissionDate: new Date().toISOString().split('T')[0],
    sourcePortal: 'ST PAUL College Registry',
  });

  const [regModalTab, setRegModalTab] = useState<'biodata' | 'subjects' | 'guardian' | 'passport'>('biodata');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedClassFilter !== 'ALL' && student.className !== selectedClassFilter) return false;
      if (genderFilter !== 'ALL' && student.gender !== genderFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesId = student.learnerId.toLowerCase().includes(q);
        const matchesGuardian = student.biodata?.guardianName?.toLowerCase().includes(q);
        const matchesPhone = student.biodata?.guardianPhone?.includes(q);
        const matchesRole = student.studentRole?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesGuardian && !matchesPhone && !matchesRole) return false;
      }
      return true;
    });
  }, [students, selectedClassFilter, genderFilter, searchQuery]);

  // Statistics
  const totalCount = students.length;
  const withPassportCount = students.filter(s => !!s.passportPhoto).length;
  const passportPercentage = totalCount > 0 ? Math.round((withPassportCount / totalCount) * 100) : 0;
  const externalPortalCount = students.filter(s => s.sourcePortal && !s.sourcePortal.includes('Internal')).length;

  const openNewRegistration = () => {
    setEditingStudent(null);
    const assignedCls = selectedClassFilter !== 'ALL' ? selectedClassFilter : 'JSS 1 A';
    setFormData({
      name: '',
      className: assignedCls,
      gender: 'MALE',
      learnerId: `SPC/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`,
      studentRole: 'Regular Student',
      customRole: '',
      enrolledSubjects: [...getSubjectsForClass(assignedCls)],
      passportPhoto: '',
      dateOfBirth: '2011-05-20',
      bloodGroup: 'O+',
      genotype: 'AA',
      nationality: 'Nigerian',
      stateOfOrigin: 'FCT Abuja',
      lga: 'Gwagwalada',
      residentialAddress: 'Gwagwalada, Abuja, FCT',
      guardianName: '',
      guardianPhone: '+234 803 000 0000',
      guardianEmail: '',
      guardianRelationship: 'Father',
      admissionDate: new Date().toISOString().split('T')[0],
      sourcePortal: 'ST PAUL College Registry',
    });
    setRegModalTab('biodata');
    setCustomSubjectInput('');
    setFormError(null);
    setIsRegisterModalOpen(true);
  };

  const openEditRegistration = (student: Student) => {
    setEditingStudent(student);
    const currentRole = student.studentRole || student.biodata?.studentRole || 'Regular Student';
    const isKnown = (STUDENT_ROLES_LIST as readonly string[]).includes(currentRole);
    const currentSubjs = (student.enrolledSubjects && student.enrolledSubjects.length > 0)
      ? [...student.enrolledSubjects]
      : [...getSubjectsForClass(student.className)];

    setFormData({
      name: student.name,
      className: student.className,
      gender: student.gender,
      learnerId: student.learnerId,
      studentRole: isKnown ? currentRole : 'Custom Role',
      customRole: isKnown ? '' : currentRole,
      enrolledSubjects: currentSubjs,
      passportPhoto: student.passportPhoto || '',
      dateOfBirth: student.biodata?.dateOfBirth || '2010-06-15',
      bloodGroup: student.biodata?.bloodGroup || 'O+',
      genotype: student.biodata?.genotype || 'AA',
      nationality: student.biodata?.nationality || 'Nigerian',
      stateOfOrigin: student.biodata?.stateOfOrigin || 'FCT Abuja',
      lga: student.biodata?.lga || 'Gwagwalada',
      residentialAddress: student.biodata?.residentialAddress || 'Gwagwalada, Abuja',
      guardianName: student.biodata?.guardianName || '',
      guardianPhone: student.biodata?.guardianPhone || '',
      guardianEmail: student.biodata?.guardianEmail || '',
      guardianRelationship: student.biodata?.guardianRelationship || 'Parent',
      admissionDate: student.biodata?.admissionDate || new Date().toISOString().split('T')[0],
      sourcePortal: student.sourcePortal || 'ST PAUL College Registry',
    });
    setRegModalTab('biodata');
    setCustomSubjectInput('');
    setFormError(null);
    setIsRegisterModalOpen(true);
  };

  const toggleFormSubject = (sub: string) => {
    setFormData(prev => {
      const exists = prev.enrolledSubjects.includes(sub);
      return {
        ...prev,
        enrolledSubjects: exists
          ? prev.enrolledSubjects.filter(s => s !== sub)
          : [...prev.enrolledSubjects, sub]
      };
    });
  };

  const handleApplyFormCurriculum = () => {
    setFormData(prev => ({
      ...prev,
      enrolledSubjects: [...getSubjectsForClass(prev.className)]
    }));
  };

  const handleApplyFormScience = () => {
    const science = ['MATHEMATICS', 'ENGLISH LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'FURTHER MATHEMATICS', 'CIVIC EDUCATION', 'DATA PROCESSING', 'AGRICULTURAL SCIENCE'];
    setFormData(prev => ({ ...prev, enrolledSubjects: Array.from(new Set(science)) }));
  };

  const handleApplyFormArts = () => {
    const arts = ['MATHEMATICS', 'ENGLISH LANGUAGE', 'LITERATURE IN ENGLISH', 'GOVERNMENT', 'CHRISTIAN RELIGIOUS STUDIES', 'ECONOMICS', 'CIVIC EDUCATION', 'HISTORY'];
    setFormData(prev => ({ ...prev, enrolledSubjects: Array.from(new Set(arts)) }));
  };

  const handleApplyFormCommercial = () => {
    const comm = ['MATHEMATICS', 'ENGLISH LANGUAGE', 'FINANCIAL ACCOUNTING', 'COMMERCE', 'ECONOMICS', 'CIVIC EDUCATION', 'DATA PROCESSING'];
    setFormData(prev => ({ ...prev, enrolledSubjects: Array.from(new Set(comm)) }));
  };

  const handleApplyFormJuniorCore = () => {
    setFormData(prev => ({ ...prev, enrolledSubjects: [...JUNIOR_SUBJECTS] }));
  };

  const handleAddFormCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSubjectInput.trim().toUpperCase();
    if (!trimmed) return;
    setFormData(prev => {
      if (prev.enrolledSubjects.includes(trimmed)) return prev;
      return { ...prev, enrolledSubjects: [...prev.enrolledSubjects, trimmed] };
    });
    setCustomSubjectInput('');
  };

  // Passport Photo Upload
  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setFormError('Passport image size must be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setFormData(prev => ({ ...prev, passportPhoto: dataUrl }));
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  // Generate Sample Uniform Avatar Passport
  const handleGenerateSamplePassport = (gender: 'MALE' | 'FEMALE', name: string) => {
    const initials = name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || (gender === 'MALE' ? 'SP' : 'SC');
    const bgGradient = gender === 'MALE' ? 'linear-gradient(135deg, #7a0c0c, #4a0505)' : 'linear-gradient(135deg, #991b1b, #6b0707)';
    
    // Create an elegant SVG Data URL with College Gold Trim & Uniform Crest
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="350" viewBox="0 0 300 350">
        <rect width="300" height="350" fill="#f8fafc" />
        <rect x="10" y="10" width="280" height="330" rx="12" fill="${gender === 'MALE' ? '#1e293b' : '#334155'}" />
        <circle cx="150" cy="120" r="65" fill="#fde047" stroke="#ca8a04" stroke-width="4" />
        <text x="150" y="132" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#7a0c0c" text-anchor="middle">${initials}</text>
        <!-- College Blazer & Tie -->
        <path d="M70,340 C70,220 110,190 150,220 C190,190 230,220 230,340 Z" fill="#7a0c0c" stroke="#f59e0b" stroke-width="4" />
        <polygon points="150,220 142,290 150,310 158,290" fill="#f59e0b" />
        <rect x="20" y="20" width="260" height="25" fill="#ca8a04" rx="4" />
        <text x="150" y="37" font-family="serif" font-size="10" font-weight="bold" fill="#450a0a" text-anchor="middle" letter-spacing="1">${(settings.schoolName || 'COLLEGE').toUpperCase().substring(0, 32)}</text>
      </svg>
    `.trim();

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setFormData(prev => ({ ...prev, passportPhoto: dataUrl }));
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Learner Full Name is required.');
      return;
    }
    if (!formData.className) {
      setFormError('Please assign a class.');
      return;
    }

    const finalRole = formData.studentRole === 'Custom Role'
      ? (formData.customRole.trim() || 'Regular Student')
      : formData.studentRole;

    const biodata: StudentBiodata = {
      dateOfBirth: formData.dateOfBirth,
      bloodGroup: formData.bloodGroup,
      genotype: formData.genotype,
      nationality: formData.nationality,
      stateOfOrigin: formData.stateOfOrigin,
      lga: formData.lga,
      residentialAddress: formData.residentialAddress,
      guardianName: formData.guardianName || `Guardian of ${formData.name}`,
      guardianPhone: formData.guardianPhone || '+234 803 000 0000',
      guardianEmail: formData.guardianEmail,
      guardianRelationship: formData.guardianRelationship,
      admissionDate: formData.admissionDate,
      studentRole: finalRole,
    };

    const finalSubjects = formData.enrolledSubjects.length > 0
      ? formData.enrolledSubjects
      : [...getSubjectsForClass(formData.className)];

    if (editingStudent) {
      onUpdateStudent(editingStudent.id, {
        name: formData.name.trim().toUpperCase(),
        className: formData.className,
        gender: formData.gender,
        learnerId: formData.learnerId.trim(),
        studentRole: finalRole,
        enrolledSubjects: finalSubjects,
        passportPhoto: formData.passportPhoto || undefined,
        sourcePortal: formData.sourcePortal,
        biodata,
      });
    } else {
      onRegisterStudent({
        name: formData.name.trim().toUpperCase(),
        className: formData.className,
        gender: formData.gender,
        learnerId: formData.learnerId.trim(),
        studentRole: finalRole,
        enrolledSubjects: finalSubjects,
        passportPhoto: formData.passportPhoto || undefined,
        sourcePortal: formData.sourcePortal,
        biodata,
      });
    }

    setIsRegisterModalOpen(false);
  };

  const handleDelete = (student: Student) => {
    if (window.confirm(`Are you sure you want to remove ${student.name} (${student.learnerId}) from the student registry? This will remove all their grades and report sheets.`)) {
      onDeleteStudent(student.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-950 p-5 text-white border-b-2 border-amber-500 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center shadow-lg font-black">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black font-serif text-amber-300 tracking-wide">
                  Student Registration Center
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-400 text-red-950 font-bold uppercase tracking-wider">
                  Biodata & Passport
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Official enrollment registry, student biodata profiles, passport photographs, and external portal sync
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dedicated Passport Upload Center Button */}
            {onOpenPassportModal && (
              <button
                type="button"
                onClick={onOpenPassportModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-red-950 text-xs font-black rounded-xl shadow-md border border-amber-300 transition transform hover:-translate-y-0.5"
                title="Open dedicated Passport Upload Center to upload, take webcam snapshots, or batch-match photos"
              >
                <Camera className="w-4 h-4 text-red-950" />
                <span>Passport Upload Center</span>
              </button>
            )}

            {/* Class Remarks Manager Button */}
            {onOpenClassCommentsModal && (
              <button
                type="button"
                onClick={onOpenClassCommentsModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-950/80 hover:bg-red-900 text-amber-200 hover:text-white text-xs font-bold rounded-xl border border-amber-400/60 shadow-md transition"
                title="Manage Form Teacher and Principal remarks for each class"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Class Remarks</span>
              </button>
            )}

            {/* Super Admin: Accept already registered students from another portal */}
            {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
              <button
                type="button"
                onClick={() => setIsExternalPortalModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 hover:text-white text-xs font-bold rounded-xl border border-amber-400/50 shadow-md transition"
                title="Super Admin: Bulk import learners already registered in another portal or state database"
              >
                <Database className="w-4 h-4 text-amber-300" />
                <span>Import Portal Records</span>
              </button>
            )}

            {/* Bulk Promotion Center Button (Super Admin / Exam Officer) */}
            {onOpenBulkPromotionModal && (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'exam_officer') && (
              <button
                type="button"
                onClick={onOpenBulkPromotionModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-850 text-amber-300 text-xs font-black rounded-xl shadow-md border border-amber-400 transition transform hover:-translate-y-0.5"
                title="Super Admin: Bulk promote students to the next class level based on terminal academic performance (compulsory Math & English pass)"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Bulk Promotion Center</span>
              </button>
            )}

            {/* Upload Existing Students via Excel Button */}
            <button
              type="button"
              onClick={() => setIsExcelUploadModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-700 hover:to-teal-700 text-emerald-100 hover:text-white text-xs font-bold rounded-xl shadow-md border border-emerald-400/80 transition transform hover:-translate-y-0.5"
              title="Upload existing students in Excel sheet (.xlsx, .xls, .csv) with full room to edit class and biodata"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>Upload Students (Excel)</span>
            </button>

            {/* Register New Student Button */}
            <button
              type="button"
              onClick={openNewRegistration}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-950 hover:bg-red-900 text-amber-300 text-xs font-bold rounded-xl shadow-md border border-amber-400/80 transition"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Register New Learner</span>
            </button>
          </div>
        </div>

        {/* 2. Statistical KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-amber-50/30 p-4 border-b border-slate-200">
          <div className="px-3 py-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
            <div className="text-xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
              <span>{totalCount} Learners</span>
            </div>
          </div>

          <div className="px-3 py-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Passports Captured</span>
            <div className="text-xl font-black text-emerald-700 mt-0.5 flex items-center gap-2">
              <span>{withPassportCount}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {passportPercentage}%
              </span>
            </div>
          </div>

          <div className="px-3 py-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Classes</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              <span>{SCHOOL_CLASSES.length} Classes</span>
            </div>
          </div>

          <div className="px-3 py-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">External Portal Records</span>
            <div className="text-xl font-black text-amber-700 mt-0.5 flex items-center gap-1.5">
              <span>{externalPortalCount} Synced</span>
            </div>
          </div>
        </div>

        {/* 3. Search and Filtering Bar */}
        <div className="p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Class Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Class:</span>
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">All Classes ({totalCount})</option>
                {SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Gender:</span>
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value as any)}
                className="bg-white border border-slate-300 text-slate-900 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by learner name, admission ID, parent name or phone..."
                className="w-full text-xs bg-white border border-slate-300 text-slate-900 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-200 p-0.5 rounded-lg border border-slate-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                viewMode === 'grid' ? 'bg-white text-red-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                viewMode === 'table' ? 'bg-white text-red-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Hidden local photo file input for 1-click card/table upload */}
      <input
        type="file"
        ref={cardFileInputRef}
        onChange={handleCardFileChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {/* 4. Student Directory Content (Grid / Table) */}
      {filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Learners Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No students match your filter criteria. Try adjusting your search query or class selector.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={openNewRegistration}
              className="px-4 py-2 bg-gradient-to-r from-red-800 to-red-900 text-white text-xs font-bold rounded-xl shadow border border-amber-400"
            >
              Register Learner Now
            </button>
            <button
              onClick={() => setIsExcelUploadModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-800 to-teal-900 text-emerald-100 hover:text-white text-xs font-bold rounded-xl shadow border border-emerald-400 flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>Upload Students via Excel</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => {
            const hasPassport = !!student.passportPhoto;
            return (
              <div 
                key={student.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Top Card Info */}
                <div className="p-4 flex items-start space-x-3.5 border-b border-slate-100">
                  {/* Passport Photo Frame (Click-to-Upload Local Photo) */}
                  <div 
                    onClick={() => handleCardUploadTrigger(student)}
                    className="w-16 h-20 rounded-xl border-2 border-amber-400 bg-slate-100 shrink-0 overflow-hidden shadow-sm relative flex flex-col items-center justify-center cursor-pointer group/photo transition hover:border-red-700"
                    title="Click to choose a local photo from your device and upload instantly"
                  >
                    {hasPassport ? (
                      <img 
                        src={student.passportPhoto} 
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-1 text-center bg-gradient-to-b from-amber-50 to-slate-100 w-full h-full">
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-red-950 flex items-center justify-center text-xs font-black mb-0.5">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase leading-none">UPLOAD</span>
                      </div>
                    )}

                    {/* Hover Camera Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-center p-0.5">
                      <Camera className="w-4 h-4 text-amber-300 mb-0.5" />
                      <span className="text-[7px] font-bold text-amber-200 uppercase leading-none">
                        {hasPassport ? 'Replace' : 'Upload'}
                      </span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 bg-red-950/80 text-[7px] text-amber-300 font-bold text-center py-0.5 uppercase pointer-events-none">
                      {student.gender}
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-200 font-mono">
                        {student.className}
                      </span>
                      {student.sourcePortal && student.sourcePortal.includes('Transfer') && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          External Transfer
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 truncate mt-1 leading-snug" title={student.name}>
                      {student.name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-500 font-semibold">
                      ID: {student.learnerId}
                    </div>

                    {/* Biodata & Role Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {student.studentRole && student.studentRole !== 'Regular Student' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-red-950 border border-amber-500 shadow-2xs">
                          <Award className="w-2.5 h-2.5 mr-0.5 text-red-900" />
                          <span>{student.studentRole}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                        <BookOpen className="w-2.5 h-2.5 mr-0.5 text-blue-600" />
                        <span>{(student.enrolledSubjects && student.enrolledSubjects.length > 0) ? student.enrolledSubjects.length : getSubjectsForClass(student.className).length} Subj</span>
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        <Droplet className="w-2.5 h-2.5 mr-0.5 text-red-600" />
                        {student.biodata?.bloodGroup || 'O+'} ({student.biodata?.genotype || 'AA'})
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 truncate max-w-[130px]">
                        <MapPin className="w-2.5 h-2.5 mr-0.5 text-slate-500" />
                        {student.biodata?.stateOfOrigin || 'FCT'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parent / Guardian Data */}
                <div className="px-4 py-2.5 bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="font-semibold text-slate-800">Guardian: </span>
                    <span>{student.biodata?.guardianName || 'Parent'}</span>
                  </div>
                  <div className="font-mono text-slate-500 shrink-0 flex items-center">
                    <Phone className="w-3 h-3 mr-1 text-slate-400" />
                    <span>{student.biodata?.guardianPhone || 'N/A'}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <button
                    onClick={() => openEditRegistration(student)}
                    className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition border border-slate-200"
                    title={currentUser.role === 'super_admin' ? "Super Admin: Edit Student Role, Subjects, Class & Biodata" : "Edit Learner Profile, Role, Subjects & Biodata"}
                  >
                    <Edit3 className="w-3 h-3 text-red-800" />
                    <span>{currentUser.role === 'super_admin' ? 'Edit (Role/Subj/Bio)' : 'Edit Biodata'}</span>
                  </button>

                  <button
                    onClick={() => setIdCardStudent(student)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-red-950 font-bold border border-amber-300 transition"
                    title="Generate Printable Student ID & Admission Card"
                  >
                    <Printer className="w-3 h-3 text-red-900" />
                    <span>ID Slip</span>
                  </button>

                  <button
                    onClick={() => onSelectStudentForReport(student)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-amber-300 font-bold transition"
                    title="Jump to Student's Official Terminal Report Sheet"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Report</span>
                  </button>

                  {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                    <button
                      onClick={() => handleDelete(student)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Remove Student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-amber-200 border-b-2 border-amber-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-3 w-16 text-center">Photo</th>
                <th className="py-3 px-3">Student Full Name</th>
                <th className="py-3 px-2">Learner ID</th>
                <th className="py-3 px-2">Class</th>
                <th className="py-3 px-2">Gender</th>
                <th className="py-3 px-2">Blood / Geno</th>
                <th className="py-3 px-3">Guardian & Phone</th>
                <th className="py-3 px-3">State / LGA</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2 px-3 text-center">
                    <div 
                      onClick={() => handleCardUploadTrigger(student)}
                      className="w-9 h-11 rounded border border-amber-400 overflow-hidden mx-auto bg-slate-100 flex items-center justify-center cursor-pointer group/tbl relative shadow-2xs"
                      title="Click to upload local passport photo"
                    >
                      {student.passportPhoto ? (
                        <img src={student.passportPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-4 h-4 text-slate-400 group-hover/tbl:text-red-900 transition" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/tbl:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{student.name}</span>
                      {student.studentRole && student.studentRole !== 'Regular Student' && (
                        <span className="text-[9px] font-black bg-amber-400 text-red-950 px-1.5 py-0.2 rounded border border-amber-500 shrink-0">
                          {student.studentRole}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal flex items-center gap-1">
                      <span>{student.sourcePortal || 'Registry'}</span>
                      <span>•</span>
                      <span className="font-semibold text-blue-700">{(student.enrolledSubjects && student.enrolledSubjects.length > 0) ? student.enrolledSubjects.length : getSubjectsForClass(student.className).length} Subjects</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 font-mono font-semibold text-slate-700">{student.learnerId}</td>
                  <td className="py-2.5 px-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-200">
                      {student.className}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 font-medium text-slate-600">{student.gender}</td>
                  <td className="py-2.5 px-2 font-medium text-slate-600">
                    {student.biodata?.bloodGroup || 'O+'} / {student.biodata?.genotype || 'AA'}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-800">{student.biodata?.guardianName || 'Parent'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{student.biodata?.guardianPhone || 'N/A'}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div>{student.biodata?.stateOfOrigin || 'FCT'}</div>
                    <div className="text-[10px] text-slate-400">{student.biodata?.lga || 'Gwagwalada'}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1">
                    <button
                      onClick={() => openEditRegistration(student)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setIdCardStudent(student)}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-red-950 font-bold rounded text-[11px]"
                    >
                      ID Card
                    </button>
                    <button
                      onClick={() => onSelectStudentForReport(student)}
                      className="px-2 py-1 bg-red-900 hover:bg-red-800 text-amber-300 font-bold rounded text-[11px]"
                    >
                      Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. STUDENT REGISTRATION & BIODATA FORM MODAL                  */}
      {/* ============================================================ */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white flex items-center justify-between border-b-2 border-amber-500">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-300 font-serif">
                    {editingStudent ? 'Edit Learner Profile & Biodata' : 'New Learner Registration'}
                  </h3>
                  <p className="text-xs text-amber-100/80 mt-0.5">
                    Official {settings.schoolName || 'COLLEGE'} learner record with passport photograph
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-red-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Excel Upload Callout if registering new learner */}
            {!editingStudent && (
              <div className="mx-6 mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 text-xs">Have existing students in an Excel sheet?</span>
                    <p className="text-[11px] text-emerald-800">
                      Upload an Excel (.xlsx / .xls) or CSV sheet to batch-register learners with full room to edit class and biodata.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setIsExcelUploadModalOpen(true);
                  }}
                  className="shrink-0 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs border border-emerald-500 flex items-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-300" />
                  <span>Upload Excel Sheet</span>
                </button>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSaveStudent} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Passport Photograph Section */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center gap-5">
                {/* Photo Preview Frame */}
                <div className="w-28 h-36 rounded-xl border-2 border-amber-500 bg-white p-1 shadow-md overflow-hidden shrink-0 relative flex flex-col items-center justify-center">
                  {formData.passportPhoto ? (
                    <img 
                      src={formData.passportPhoto} 
                      alt="Passport"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <ImageIcon className="w-8 h-8 text-amber-600/50 mb-1" />
                      <span className="text-[9px] font-bold uppercase text-slate-500">2x2 Passport Photo</span>
                    </div>
                  )}
                </div>

                {/* Upload & Preset Options */}
                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <div>
                    <h4 className="font-bold text-sm text-red-950">Learner Passport Photograph</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Upload a passport photo (JPG/PNG). This will be printed on the official Terminal Report Card, ID badge, and broadsheet.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePassportUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg shadow-sm border border-amber-400 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>Upload Passport Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateSamplePassport(formData.gender, formData.name || 'Learner')}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-red-950 font-bold rounded-lg border border-amber-300 transition"
                      title="Generate official college blazer uniform passport"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Use College Uniform Avatar</span>
                    </button>

                    {formData.passportPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, passportPhoto: '' }))}
                        className="px-2.5 py-1.5 text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Basic Bio Information */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-red-900 border-b border-red-200 pb-1 mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-red-800" />
                  <span>1. Academic & Personal Biodata</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Learner Full Name (Surname First) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. SANI EMMANUELLA OYIZA"
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  {/* Admission / Learner ID */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Learner / Admission ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.learnerId}
                      onChange={e => setFormData(prev => ({ ...prev, learnerId: e.target.value }))}
                      placeholder="e.g. SPC/2026/0129"
                      className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  {/* Class Assigned */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Class Enrolled *
                    </label>
                    <select
                      value={formData.className}
                      onChange={e => setFormData(prev => ({ ...prev, className: e.target.value }))}
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      {SCHOOL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>
                          {cls} {isJuniorClass(cls) ? '(Junior)' : '(Senior)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>

                  {/* Student Leadership Role / Position */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Student Role / Office</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Prefect / Post</span>
                    </label>
                    <select
                      value={formData.studentRole}
                      onChange={e => setFormData(prev => ({ ...prev, studentRole: e.target.value }))}
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      {STUDENT_ROLES_LIST.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Role Input if selected */}
                  {formData.studentRole === 'Custom Role' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Specify Custom Role Title
                      </label>
                      <input
                        type="text"
                        value={formData.customRole}
                        onChange={e => setFormData(prev => ({ ...prev, customRole: e.target.value }))}
                        placeholder="e.g. Debate Club President, Dining Hall Prefect"
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Blood Group
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={e => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Genotype */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Genotype
                    </label>
                    <select
                      value={formData.genotype}
                      onChange={e => setFormData(prev => ({ ...prev, genotype: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      <option value="AA">AA</option>
                      <option value="AS">AS</option>
                      <option value="SS">SS</option>
                      <option value="AC">AC</option>
                    </select>
                  </div>

                  {/* State of Origin */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      State of Origin
                    </label>
                    <input
                      type="text"
                      value={formData.stateOfOrigin}
                      onChange={e => setFormData(prev => ({ ...prev, stateOfOrigin: e.target.value }))}
                      placeholder="e.g. FCT Abuja, Kogi, Niger..."
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  {/* LGA */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      LGA / Area Council
                    </label>
                    <input
                      type="text"
                      value={formData.lga}
                      onChange={e => setFormData(prev => ({ ...prev, lga: e.target.value }))}
                      placeholder="e.g. Gwagwalada, Kuje, Abaji..."
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  {/* Residential Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      value={formData.residentialAddress}
                      onChange={e => setFormData(prev => ({ ...prev, residentialAddress: e.target.value }))}
                      placeholder="Street, Area, City"
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Enrolled Subjects & Curriculum Allocation */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-red-800" />
                      <span>2. Enrolled Subjects &amp; Curriculum Allocation</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Customize offered subjects for this learner (Science / Arts / Commercial / Electives)
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-200 border border-amber-400 rounded-lg text-red-950 font-black text-xs shrink-0">
                    {formData.enrolledSubjects.length} Subjects Enrolled
                  </span>
                </div>

                {/* Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={handleApplyFormCurriculum}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold border border-slate-300 transition"
                  >
                    Curriculum for {formData.className}
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFormScience}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-[10px] font-bold border border-blue-200 transition"
                  >
                    Senior Science Core
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFormArts}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-[10px] font-bold border border-purple-200 transition"
                  >
                    Senior Arts Core
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFormCommercial}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-[10px] font-bold border border-emerald-200 transition"
                  >
                    Senior Commercial Core
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFormJuniorCore}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[10px] font-bold border border-amber-200 transition"
                  >
                    Junior Core (10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, enrolledSubjects: [...ALL_SUBJECTS] }))}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold transition"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, enrolledSubjects: [] }))}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold border border-red-200 transition"
                  >
                    Clear All
                  </button>
                </div>

                {/* Subject Selection Grid */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_SUBJECTS.map(subj => {
                      const isEnrolled = formData.enrolledSubjects.includes(subj);
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => toggleFormSubject(subj)}
                          className={`p-2 rounded-xl text-left text-[11px] font-bold border transition flex items-center justify-between ${
                            isEnrolled
                              ? 'bg-amber-400 text-red-950 border-amber-500 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate pr-1">{subj}</span>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isEnrolled ? 'bg-red-950 text-amber-300' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isEnrolled ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Elective Subject */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={e => setCustomSubjectInput(e.target.value)}
                    placeholder="Add custom elective subject (e.g. FRENCH, MUSIC, ARABIC)..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleAddFormCustomSubject}
                    className="px-3.5 py-2 bg-red-950 hover:bg-red-900 text-amber-300 font-bold rounded-xl text-xs flex items-center space-x-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>
              </div>

              {/* 3. Parent / Guardian Information */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-red-900 border-b border-red-200 pb-1 mb-3 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-red-800" />
                  <span>3. Parent & Guardian Contact Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Guardian Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={e => setFormData(prev => ({ ...prev, guardianName: e.target.value }))}
                      placeholder="e.g. Mr. John Doe"
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Telephone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={e => setFormData(prev => ({ ...prev, guardianPhone: e.target.value }))}
                      placeholder="+234 803 000 0000"
                      className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Relationship
                    </label>
                    <select
                      value={formData.guardianRelationship}
                      onChange={e => setFormData(prev => ({ ...prev, guardianRelationship: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
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

              {/* 3. Enrollment Metadata & Source Portal */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-red-900 border-b border-red-200 pb-1 mb-3 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-red-800" />
                  <span>3. Enrollment Metadata & Registry Origin</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Admission Date
                    </label>
                    <input
                      type="date"
                      value={formData.admissionDate}
                      onChange={e => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Source Registration Portal
                    </label>
                    <input
                      type="text"
                      value={formData.sourcePortal}
                      onChange={e => setFormData(prev => ({ ...prev, sourcePortal: e.target.value }))}
                      placeholder="e.g. ST PAUL Internal Registry or FCT Board Transfer"
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-md border border-amber-400 transition"
                >
                  {editingStudent ? 'Save Biodata Changes' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. PRINTABLE STUDENT ADMISSION & ID BADGE MODAL               */}
      {/* ============================================================ */}
      {idCardStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-red-900 to-red-950 text-white flex items-center justify-between border-b-2 border-amber-500">
              <span className="font-serif font-bold text-amber-300">Official Student Admission Slip & ID</span>
              <button onClick={() => setIdCardStudent(null)} className="text-amber-200 hover:text-white">✕</button>
            </div>

            {/* Printable ID Slip Body */}
            <div className="p-6 bg-slate-50 text-slate-900" id="printable-id-card">
              <div className="bg-white border-2 border-amber-500 rounded-2xl p-5 shadow-sm text-center relative overflow-hidden">
                {/* Header Logo & College */}
                <div className="border-b-2 border-amber-500 pb-3 mb-3">
                  <div className="text-lg font-black font-serif text-[#8b1515] uppercase tracking-wide">
                    {settings.schoolName}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase">
                    {settings.schoolAddress}
                  </div>
                  <div className="text-[9px] font-black text-amber-800 uppercase tracking-widest mt-1 bg-amber-100 py-0.5 rounded">
                    OFFICIAL LEARNER IDENTIFICATION CARD
                  </div>
                </div>

                {/* Passport & Core Details */}
                <div className="flex items-center space-x-4 text-left mb-3">
                  <div className="w-20 h-24 rounded-lg border-2 border-amber-500 overflow-hidden bg-slate-100 shrink-0">
                    {idCardStudent.passportPhoto ? (
                      <img src={idCardStudent.passportPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                        PHOTO
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-black text-slate-900 leading-tight">
                      {idCardStudent.name}
                    </div>
                    <div className="text-xs font-mono font-bold text-red-900">
                      ID: {idCardStudent.learnerId}
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      Class: <span className="bg-red-100 text-red-900 px-1.5 py-0.5 rounded font-bold">{idCardStudent.className}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Gender: <strong className="text-slate-800">{idCardStudent.gender}</strong> • Blood: <strong>{idCardStudent.biodata?.bloodGroup || 'O+'}</strong>
                    </div>
                  </div>
                </div>

                {/* Guardian & Origin Strip */}
                <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 text-left text-[11px] space-y-0.5 mb-3">
                  <div><strong>Guardian:</strong> {idCardStudent.biodata?.guardianName || 'Parent'}</div>
                  <div><strong>Emergency Tel:</strong> {idCardStudent.biodata?.guardianPhone || 'N/A'}</div>
                  <div><strong>State of Origin:</strong> {idCardStudent.biodata?.stateOfOrigin || 'FCT'} ({idCardStudent.biodata?.lga || 'Gwagwalada'})</div>
                </div>

                {/* Footer Validation Signature & Official Stamp */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[9px] text-slate-500 relative">
                  <span>Issued: {idCardStudent.biodata?.admissionDate || '2025/2026 Session'}</span>
                  <div className="relative">
                    <span className="font-serif italic font-bold text-red-900 relative z-10">Signed: Principal</span>
                    <div 
                      className="absolute -right-2 -top-5 pointer-events-none z-0 select-none"
                      style={{
                        transform: `rotate(${settings.schoolStampRotation ?? -6}deg)`,
                        opacity: (settings.schoolStampOpacity ?? 0.88) * 0.9,
                      }}
                    >
                      <img
                        src={settings.schoolStamp || DEFAULT_OFFICIAL_STAMP}
                        alt="Official Stamp"
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Action */}
            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIdCardStudent(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. EXTERNAL PORTAL IMPORT MODAL                              */}
      {/* ============================================================ */}
      <ExternalPortalImportModal
        isOpen={isExternalPortalModalOpen}
        onClose={() => setIsExternalPortalModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        students={students}
        onImportStudents={onImportExternalStudents}
      />

      {/* ============================================================ */}
      {/* 8. EXCEL STUDENT REGISTRATION & BIODATA/CLASS EDIT MODAL     */}
      {/* ============================================================ */}
      <StudentExcelUploadModal
        isOpen={isExcelUploadModalOpen}
        onClose={() => setIsExcelUploadModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        students={students}
        onImportStudents={onImportExternalStudents}
      />
    </div>
  );
};
