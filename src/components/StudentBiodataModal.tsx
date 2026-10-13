import React, { useState, useRef } from 'react';
import { Student, StudentBiodata, Teacher, SchoolSettings } from '../types';
import { SCHOOL_CLASSES, ALL_SUBJECTS, JUNIOR_SUBJECTS, SENIOR_SUBJECTS, getSubjectsForClass } from '../data/mockData';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Droplet, 
  HeartHandshake, 
  Camera, 
  Save, 
  X, 
  CheckCircle2, 
  Sparkles,
  School,
  Mail,
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { compressPassportImage, validateImageFile } from '../utils/imageCompressor';

export const STUDENT_ROLES_LIST = [
  'Regular Student',
  'Head Boy',
  'Head Girl',
  'Senior Prefect',
  'Assistant Senior Prefect',
  'Class Captain',
  'Assistant Class Captain',
  'Health & Sanitary Prefect',
  'Labor / Work Prefect',
  'Sports Prefect',
  'Library Prefect',
  'Assembly / Devotion Prefect',
  'Hostel Captain',
  'Time Keeper Prefect',
  'Social / Cultural Prefect',
  'Custom Role'
] as const;

interface StudentBiodataModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentId: string, updates: Partial<Student>) => void;
  currentUser?: Teacher;
  settings?: SchoolSettings;
}

export const StudentBiodataModal: React.FC<StudentBiodataModalProps> = ({
  student,
  isOpen,
  onClose,
  onSave,
  currentUser,
  settings,
}) => {
  if (!isOpen || !student) return null;

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Form states initialized with student data
  const [name, setName] = useState(student.name || '');
  const [className, setClassName] = useState(student.className || 'JSS 1 A');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(student.gender || 'MALE');
  const [learnerId, setLearnerId] = useState(student.learnerId || '');
  const [passportPhoto, setPassportPhoto] = useState(student.passportPhoto || '');

  // Student Role & Leadership
  const initialRole = student.studentRole || student.biodata?.studentRole || 'Regular Student';
  const isKnownRole = STUDENT_ROLES_LIST.includes(initialRole as any);
  const [roleSelect, setRoleSelect] = useState<string>(isKnownRole ? initialRole : 'Custom Role');
  const [customRoleText, setCustomRoleText] = useState<string>(isKnownRole ? '' : initialRole);

  // Student Enrolled Subjects
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>(() => {
    if (student.enrolledSubjects && student.enrolledSubjects.length > 0) {
      return [...student.enrolledSubjects];
    }
    return [...getSubjectsForClass(student.className)];
  });
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Biodata states
  const [dateOfBirth, setDateOfBirth] = useState(student.biodata?.dateOfBirth || '2011-06-15');
  const [bloodGroup, setBloodGroup] = useState(student.biodata?.bloodGroup || 'O+');
  const [genotype, setGenotype] = useState(student.biodata?.genotype || 'AA');
  const [nationality, setNationality] = useState(student.biodata?.nationality || 'Nigerian');
  const [stateOfOrigin, setStateOfOrigin] = useState(student.biodata?.stateOfOrigin || 'FCT Abuja');
  const [lga, setLga] = useState(student.biodata?.lga || 'Gwagwalada');
  const [residentialAddress, setResidentialAddress] = useState(student.biodata?.residentialAddress || 'Gwagwalada, Abuja, FCT');
  const [guardianName, setGuardianName] = useState(student.biodata?.guardianName || '');
  const [guardianPhone, setGuardianPhone] = useState(student.biodata?.guardianPhone || '+234 803 000 0000');
  const [guardianEmail, setGuardianEmail] = useState(student.biodata?.guardianEmail || '');
  const [guardianRelationship, setGuardianRelationship] = useState(student.biodata?.guardianRelationship || 'Parent');
  const [admissionDate, setAdmissionDate] = useState(student.biodata?.admissionDate || '2023-09-11');
  const [previousSchool, setPreviousSchool] = useState(student.biodata?.previousSchool || '');

  const [activeTab, setActiveTab] = useState<'personal' | 'subjects' | 'medical' | 'guardian'>('personal');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file format.');
      return;
    }

    try {
      const compressed = await compressPassportImage(file);
      setPassportPhoto(compressed);
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to process image file.');
    }
  };

  // Generate Sample Uniform Avatar Passport
  const handleGenerateSamplePassport = () => {
    const initials = name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || (gender === 'MALE' ? 'SP' : 'SC');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="350" viewBox="0 0 300 350">
        <rect width="300" height="350" fill="#f8fafc" />
        <rect x="10" y="10" width="280" height="330" rx="12" fill="${gender === 'MALE' ? '#1e293b' : '#334155'}" />
        <circle cx="150" cy="120" r="65" fill="#fde047" stroke="#ca8a04" stroke-width="4" />
        <text x="150" y="132" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#7a0c0c" text-anchor="middle">${initials}</text>
        <path d="M70,340 C70,220 110,190 150,220 C190,190 230,220 230,340 Z" fill="#7a0c0c" stroke="#f59e0b" stroke-width="4" />
        <polygon points="150,220 142,290 150,310 158,290" fill="#f59e0b" />
        <rect x="20" y="20" width="260" height="25" fill="#ca8a04" rx="4" />
        <text x="150" y="37" font-family="serif" font-size="10" font-weight="bold" fill="#450a0a" text-anchor="middle" letter-spacing="1">${(settings?.schoolName || 'COLLEGE').toUpperCase().substring(0, 32)}</text>
      </svg>
    `.trim();
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setPassportPhoto(dataUrl);
  };

  // Subject toggles & presets
  const toggleSubject = (sub: string) => {
    setEnrolledSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const handleApplyClassCurriculum = () => {
    setEnrolledSubjects([...getSubjectsForClass(className)]);
  };

  const handleApplySeniorScience = () => {
    const science = ['MATHEMATICS', 'ENGLISH LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'FURTHER MATHEMATICS', 'CIVIC EDUCATION', 'DATA PROCESSING', 'AGRICULTURAL SCIENCE'];
    setEnrolledSubjects(Array.from(new Set([...science])));
  };

  const handleApplySeniorArts = () => {
    const arts = ['MATHEMATICS', 'ENGLISH LANGUAGE', 'LITERATURE IN ENGLISH', 'GOVERNMENT', 'CHRISTIAN RELIGIOUS STUDIES', 'ECONOMICS', 'CIVIC EDUCATION', 'HISTORY'];
    setEnrolledSubjects(Array.from(new Set([...arts])));
  };

  const handleApplySeniorCommercial = () => {
    const comm = ['MATHEMATICS', 'ENGLISH LANGUAGE', 'FINANCIAL ACCOUNTING', 'COMMERCE', 'ECONOMICS', 'COMMERCE', 'CIVIC EDUCATION', 'DATA PROCESSING'];
    setEnrolledSubjects(Array.from(new Set([...comm])));
  };

  const handleApplyJuniorCore = () => {
    setEnrolledSubjects([...JUNIOR_SUBJECTS]);
  };

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubjectInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!enrolledSubjects.includes(trimmed)) {
      setEnrolledSubjects(prev => [...prev, trimmed]);
    }
    setCustomSubjectInput('');
  };

  // Handle Class Change with optional subject refresh
  const handleClassChange = (newCls: string) => {
    setClassName(newCls);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Student full name is required.');
      return;
    }
    if (!learnerId.trim()) {
      setErrorMessage('Learner Identification Number is required.');
      return;
    }

    const finalRole = roleSelect === 'Custom Role' 
      ? (customRoleText.trim() || 'Regular Student') 
      : roleSelect;

    const updatedBiodata: StudentBiodata = {
      ...(student.biodata || {}),
      dateOfBirth,
      bloodGroup,
      genotype,
      nationality,
      stateOfOrigin,
      lga,
      residentialAddress,
      guardianName: guardianName || `Parent of ${name}`,
      guardianPhone,
      guardianEmail,
      guardianRelationship,
      admissionDate,
      previousSchool,
      studentRole: finalRole,
    };

    onSave(student.id, {
      name: name.trim().toUpperCase(),
      className,
      gender,
      learnerId: learnerId.trim().toUpperCase(),
      studentRole: finalRole,
      enrolledSubjects: enrolledSubjects.length > 0 ? enrolledSubjects : [...getSubjectsForClass(className)],
      passportPhoto: passportPhoto || undefined,
      biodata: updatedBiodata,
    });

    setSuccessMessage(`Learner records (Role, Subjects, Class & Biodata) for ${name} saved successfully!`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950 via-[#7a0c0c] to-red-950 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center font-black shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-amber-200 font-serif">
                  Learner Profile, Role, Class &amp; Biodata Editor
                </h3>
                <span className="text-[10px] bg-red-900 border border-amber-400/50 text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase">
                  {className}
                </span>
                {isSuperAdmin && (
                  <span className="text-[10px] bg-amber-400 text-red-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Super Admin Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-100/80">
                Super Admin &amp; Academic Authority: Edit Student Roles, Enrolled Subjects, Class Arm, Passport Photo, and Comprehensive Biodata
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1.5 rounded-lg hover:bg-black/30 transition"
            title="Close Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 border-b border-slate-200 px-6 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-red-900 text-red-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Identity, Role &amp; Class</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'border-red-900 text-red-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Enrolled Subjects ({enrolledSubjects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'medical'
                ? 'border-red-900 text-red-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>3. Medical &amp; Origin Biodata</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guardian')}
            className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'guardian'
                ? 'border-red-900 text-red-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>4. Parent &amp; Guardian Info</span>
          </button>
        </div>

        {/* Success / Error Alerts */}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <X className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* TAB 1: PERSONAL IDENTITY, ROLE & CLASS */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              {/* Passport Photo Frame & Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-20 h-24 rounded-xl border-2 border-amber-500 bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0 relative group">
                  {passportPhoto ? (
                    <img src={passportPhoto} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-amber-50 to-slate-100 flex flex-col items-center justify-center p-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-red-950 font-black text-sm flex items-center justify-center mb-1">
                        {name.charAt(0) || 'S'}
                      </div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">NO PHOTO</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition text-[9px] font-bold text-center"
                  >
                    <Camera className="w-4 h-4 text-amber-300 mb-0.5" />
                    <span>Upload</span>
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2 justify-center sm:justify-start">
                    <span>{name || 'Student Profile'}</span>
                    <span className="text-[10px] bg-red-100 text-red-900 border border-red-300 px-2 py-0.5 rounded font-black">
                      {roleSelect === 'Custom Role' ? (customRoleText || 'Custom Role') : roleSelect}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Upload official student passport photograph or generate a uniform college avatar.
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg font-bold shadow-xs flex items-center space-x-1"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateSamplePassport}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-red-950 rounded-lg font-bold shadow-xs flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-red-950" />
                      <span>Generate Uniform Avatar</span>
                    </button>
                    {passportPhoto && (
                      <button
                        type="button"
                        onClick={() => setPassportPhoto('')}
                        className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Learner Full Name (SURNAME First) *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. OKONKWO CHINEDU EMMANUEL"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Learner ID / Admission Number *</label>
                  <input
                    type="text"
                    value={learnerId}
                    onChange={e => setLearnerId(e.target.value)}
                    placeholder="e.g. SPC/2024/001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Assigned Class */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>Assigned Class *</span>
                    <span className="text-[10px] text-amber-700 font-bold">11 Class Arms Available</span>
                  </label>
                  <select
                    value={className}
                    onChange={e => handleClassChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {SCHOOL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as 'MALE' | 'FEMALE')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>

                {/* Student Leadership Role / Position */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Student Role &amp; Leadership Position</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Prefect / Official Role</span>
                  </label>
                  <select
                    value={roleSelect}
                    onChange={e => setRoleSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {STUDENT_ROLES_LIST.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Role Input if selected */}
                {roleSelect === 'Custom Role' ? (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Specify Custom Role Title</label>
                    <input
                      type="text"
                      value={customRoleText}
                      onChange={e => setCustomRoleText(e.target.value)}
                      placeholder="e.g. Debate Club President, Dining Hall Prefect"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={e => setDateOfBirth(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {roleSelect === 'Custom Role' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={e => setDateOfBirth(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Admission Date</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={admissionDate}
                      onChange={e => setAdmissionDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENROLLED SUBJECTS & CURRICULUM */}
          {activeTab === 'subjects' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>Curriculum &amp; Enrolled Subjects Allocation</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80">
                    Customize which subjects this student offers. Useful for Senior Science, Arts, Commercial combinations, and elective subjects.
                  </p>
                </div>
                <div className="px-3 py-1 bg-amber-200 border border-amber-400 rounded-lg text-red-950 font-black text-xs shrink-0">
                  {enrolledSubjects.length} Subjects Enrolled
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={handleApplyClassCurriculum}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold transition border border-slate-300"
                >
                  Standard {className} Curriculum
                </button>
                <button
                  type="button"
                  onClick={handleApplySeniorScience}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-[10px] font-bold transition border border-blue-200"
                >
                  Senior Science Core
                </button>
                <button
                  type="button"
                  onClick={handleApplySeniorArts}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-[10px] font-bold transition border border-purple-200"
                >
                  Senior Arts Core
                </button>
                <button
                  type="button"
                  onClick={handleApplySeniorCommercial}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-[10px] font-bold transition border border-emerald-200"
                >
                  Senior Commercial
                </button>
                <button
                  type="button"
                  onClick={handleApplyJuniorCore}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[10px] font-bold transition border border-amber-200"
                >
                  Junior Core (10)
                </button>
                <button
                  type="button"
                  onClick={() => setEnrolledSubjects([...ALL_SUBJECTS])}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setEnrolledSubjects([])}
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold transition border border-red-200"
                >
                  Clear All
                </button>
              </div>

              {/* Interactive Subject Grid */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_SUBJECTS.map(subj => {
                    const isEnrolled = enrolledSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleSubject(subj)}
                        className={`p-2 rounded-xl text-left text-[11px] font-bold border transition flex items-center justify-between ${
                          isEnrolled
                            ? 'bg-amber-400 text-red-950 border-amber-500 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate pr-1">{subj}</span>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isEnrolled ? 'bg-red-950 text-amber-300' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isEnrolled ? '✓' : '+'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Subject */}
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
                  onClick={handleAddCustomSubject}
                  className="px-3.5 py-2 bg-red-950 hover:bg-red-900 text-amber-300 font-bold rounded-xl text-xs flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICAL & ORIGIN BIODATA */}
          {activeTab === 'medical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Genotype</label>
                  <select
                    value={genotype}
                    onChange={e => setGenotype(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {['AA', 'AS', 'SS', 'AC', 'SC'].map(gt => (
                      <option key={gt} value={gt}>{gt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nationality</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={e => setNationality(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">State of Origin</label>
                  <input
                    type="text"
                    value={stateOfOrigin}
                    onChange={e => setStateOfOrigin(e.target.value)}
                    placeholder="e.g. FCT Abuja, Benue, Kogi, Kaduna"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Local Government Area (LGA)</label>
                  <input
                    type="text"
                    value={lga}
                    onChange={e => setLga(e.target.value)}
                    placeholder="e.g. Gwagwalada, AMAC, Kuje"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Previous School Attended</label>
                  <input
                    type="text"
                    value={previousSchool}
                    onChange={e => setPreviousSchool(e.target.value)}
                    placeholder="e.g. St. Peter Primary School, Gwagwalada"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Residential Address</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={residentialAddress}
                      onChange={e => setResidentialAddress(e.target.value)}
                      placeholder="e.g. Plot 14, Phase 3, Gwagwalada, Abuja FCT"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARENT & GUARDIAN DETAILS */}
          {activeTab === 'guardian' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent / Guardian Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={guardianName}
                      onChange={e => setGuardianName(e.target.value)}
                      placeholder="e.g. Chief &amp; Mrs. E. Okonkwo"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Relationship to Learner</label>
                  <select
                    value={guardianRelationship}
                    onChange={e => setGuardianRelationship(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Legal Guardian</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Sibling">Elder Sibling</option>
                    <option value="Sponsor">Educational Sponsor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Guardian Phone Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={guardianPhone}
                      onChange={e => setGuardianPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Guardian Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={guardianEmail}
                      onChange={e => setGuardianEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {isSuperAdmin ? '⚡ Super Admin Authority Active' : 'Official Academic Registry'}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-red-900 via-red-800 to-red-950 hover:from-red-800 hover:to-red-900 text-amber-300 font-black rounded-xl border border-amber-400 shadow-md transition hover:scale-105"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>Save Learner Record</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
