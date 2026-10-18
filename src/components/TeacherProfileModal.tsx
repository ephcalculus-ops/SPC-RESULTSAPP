import React, { useState, useRef } from 'react';
import { Teacher, UserRole } from '../types';
import { ALL_SUBJECTS, SCHOOL_CLASSES, JUNIOR_SUBJECTS, SENIOR_SUBJECTS } from '../data/mockData';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  ShieldCheck, 
  Camera, 
  Save, 
  X, 
  CheckCircle2, 
  HeartHandshake, 
  FileText,
  BookOpen,
  LogOut,
  Sparkles,
  Layers,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { compressPassportImage, validateImageFile } from '../utils/imageCompressor';

interface TeacherProfileModalProps {
  teacher: Teacher;
  currentUser: Teacher;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTeacher: Teacher) => void;
  onSignOut?: () => void;
  onDeleteTeacher?: (teacherId: string) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  teacher,
  currentUser,
  isOpen,
  onClose,
  onSave,
  onSignOut,
  onDeleteTeacher,
}) => {
  if (!isOpen) return null;

  const isAdminOrSuper = currentUser.role === 'super_admin' || currentUser.role === 'admin';
  const isEditingSelf = teacher.id === currentUser.id;

  // Form states
  const [name, setName] = useState(teacher.name || '');
  const [email, setEmail] = useState(teacher.email || '');
  const [phone, setPhone] = useState(teacher.phone || '');
  const [staffId, setStaffId] = useState(teacher.staffId || '');
  const [department, setDepartment] = useState(teacher.department || 'Sciences & Mathematics');
  const [qualification, setQualification] = useState(teacher.qualification || 'B.Sc (Ed)');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NA'>(teacher.gender || 'FEMALE');
  const [mainClass, setMainClass] = useState(teacher.mainClass || '');
  const [classArm, setClassArm] = useState(teacher.classArm || '');
  const [dor, setDor] = useState(teacher.dor || '');
  const [dateOfBirth, setDateOfBirth] = useState(teacher.dateOfBirth || '1985-05-12');
  const [stateOfOrigin, setStateOfOrigin] = useState(teacher.stateOfOrigin || 'FCT Abuja');
  const [address, setAddress] = useState(teacher.address || 'Gwagwalada, Abuja, FCT');
  const [emergencyContact, setEmergencyContact] = useState(teacher.emergencyContact || '');
  const [bio, setBio] = useState(teacher.bio || '');
  const [avatar, setAvatar] = useState(teacher.avatar || '');
  const [role, setRole] = useState<UserRole>(teacher.role || 'subject_teacher');
  const [assignedClasses, setAssignedClasses] = useState<string[]>(teacher.assignedClasses || ['JSS 1 A']);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>(teacher.assignedSubjects || ['MATHEMATICS']);
  const [isFormTeacherOf, setIsFormTeacherOf] = useState<string>(teacher.isFormTeacherOf || '');
  const [password, setPassword] = useState<string>(
    teacher.password || (teacher.role === 'super_admin' ? 'UPgrade2026' : '')
  );
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState<'biodata' | 'academic' | 'allocation'>('biodata');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.');
      return;
    }

    try {
      const compressed = await compressPassportImage(file);
      setAvatar(compressed);
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to compress avatar image.');
    }
  };

  // Generate Sample Uniform Staff Badge
  const handleGenerateStaffBadge = () => {
    const initials = name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'SP';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="#7a0c0c" rx="16" />
        <circle cx="150" cy="120" r="60" fill="#fde047" stroke="#ca8a04" stroke-width="4" />
        <text x="150" y="132" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#7a0c0c" text-anchor="middle">${initials}</text>
        <rect x="25" y="210" width="250" height="60" rx="8" fill="#1e293b" />
        <text x="150" y="235" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#fde047" text-anchor="middle">ACADEMIC FACULTY</text>
        <text x="150" y="255" font-family="monospace" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${staffId}</text>
      </svg>
    `.trim();
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setAvatar(dataUrl);
  };

  // Toggle class selection
  const toggleClass = (cls: string) => {
    setAssignedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // Toggle subject selection
  const toggleSubject = (subj: string) => {
    setAssignedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!staffId.trim()) {
      setErrorMessage('Staff ID is required.');
      return;
    }

    const updatedTeacher: Teacher = {
      ...teacher,
      name: name.trim().toUpperCase(),
      email: email.trim(),
      phone: phone.trim(),
      staffId: staffId.trim(),
      department,
      qualification,
      gender,
      mainClass: mainClass.trim() || undefined,
      classArm: classArm.trim() || undefined,
      dor: dor.trim() || undefined,
      dateOfBirth,
      stateOfOrigin,
      address,
      emergencyContact,
      bio,
      avatar: avatar || undefined,
      // Only admins can change roles & assignments; self-editing keeps existing unless admin
      role: isAdminOrSuper ? role : teacher.role,
      assignedClasses: isAdminOrSuper ? assignedClasses : teacher.assignedClasses,
      assignedSubjects: isAdminOrSuper ? assignedSubjects : teacher.assignedSubjects,
      isFormTeacherOf: isAdminOrSuper ? (isFormTeacherOf || undefined) : teacher.isFormTeacherOf,
      password: (role === 'super_admin' || teacher.role === 'super_admin') 
        ? (password.trim() || 'UPgrade2026') 
        : (password.trim() || undefined),
    };

    onSave(updatedTeacher);
    setSuccessMessage('Staff profile & biodata updated successfully!');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header (ROYAL BLUE) */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#1e40af] text-white flex items-center justify-between border-b-2 border-blue-400">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-blue-900 flex items-center justify-center font-black shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white font-serif">
                  Staff Profile &amp; Biodata Editor
                </h3>
                <span className="text-[10px] bg-blue-950 border border-blue-300/50 text-blue-100 px-2 py-0.5 rounded-full font-bold uppercase">
                  {teacher.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-blue-100/90">
                {isEditingSelf ? 'Edit your personal biodata, contact details, and faculty qualifications' : `Update official profile for ${teacher.name} (${teacher.staffId})`}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-blue-800/80 transition"
            title="Close Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 border-b border-slate-200 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('biodata')}
            className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'biodata'
                ? 'border-red-900 text-red-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Personal Biodata</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'academic'
                ? 'border-red-900 text-red-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>2. Academic &amp; Faculty Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('allocation')}
            className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'allocation'
                ? 'border-red-900 text-red-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>3. Teaching Allocations ({assignedClasses.length} Cls / {assignedSubjects.length} Subj)</span>
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
          
          {/* TAB 1: PERSONAL BIODATA */}
          {activeTab === 'biodata' && (
            <div className="space-y-4">
              {/* Profile Photo / Avatar Strip */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-20 h-24 rounded-xl border-2 border-amber-500 bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0 relative group">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-red-900 to-red-950 flex flex-col items-center justify-center text-white">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-red-950 font-black text-sm flex items-center justify-center">
                        {name.charAt(0) || 'T'}
                      </div>
                      <span className="text-[8px] font-bold text-amber-200 mt-1 uppercase">FACULTY</span>
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
                  <div className="font-bold text-slate-900 text-sm">{name || 'Teacher Profile'}</div>
                  <div className="text-[11px] text-slate-500">
                    Upload official staff passport photo from device or generate an official faculty badge.
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
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
                      onClick={handleGenerateStaffBadge}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-red-950 rounded-lg font-bold shadow-xs flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-red-950" />
                      <span>Generate Badge</span>
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Biodata Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name (with Title) *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. MR. JOHN OKONKWO"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as 'MALE' | 'FEMALE' | 'NA')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="FEMALE">FEMALE</option>
                    <option value="MALE">MALE</option>
                    <option value="NA">NA / OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">State of Origin</label>
                  <input
                    type="text"
                    value={stateOfOrigin}
                    onChange={e => setStateOfOrigin(e.target.value)}
                    placeholder="e.g. FCT Abuja, Kogi, Kaduna, Enugu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Official / Personal Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="teacher@stpaulcollege.edu.ng"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Residential Address</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="House No, Street, Town/District, Abuja"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Emergency Contact / Next of Kin</label>
                  <div className="relative">
                    <HeartHandshake className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={e => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Mrs. Mary Okonkwo (Wife) - +234 802 111 2222"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC & FACULTY DETAILS */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Staff Identification Number (Staff ID) *</label>
                  <input
                    type="text"
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    disabled={!isAdminOrSuper}
                    placeholder="e.g. STP/TCH/001"
                    className={`w-full border rounded-xl px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                      isAdminOrSuper ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                    required
                  />
                  {!isAdminOrSuper && (
                    <span className="text-[10px] text-slate-400">Staff ID is managed by the Principal's Office</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Academic Department / Faculty</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Sciences & Mathematics">Sciences &amp; Mathematics</option>
                    <option value="Arts & Humanities">Arts &amp; Humanities</option>
                    <option value="Commercial & Business Studies">Commercial &amp; Business Studies</option>
                    <option value="Languages & General Studies">Languages &amp; General Studies</option>
                    <option value="Vocational & Technical Education">Vocational &amp; Technical Education</option>
                    <option value="Junior Secondary Studies">Junior Secondary Studies</option>
                    <option value="School Administration">School Administration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Highest Academic Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={e => setQualification(e.target.value)}
                    placeholder="e.g. B.Sc (Ed) Mathematics, M.Ed, NCE, PGDE, Ph.D"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Portal System Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    disabled={!isAdminOrSuper}
                    className={`w-full border rounded-xl px-3 py-2 font-bold capitalize focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                      isAdminOrSuper ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <option value="super_admin">Super Administrator</option>
                    <option value="admin">Principal / Administrator</option>
                    <option value="exam_officer">Examination Officer</option>
                    <option value="form_teacher">Form Teacher</option>
                    <option value="subject_teacher">Subject Teacher</option>
                  </select>
                  {!isAdminOrSuper && (
                    <span className="text-[10px] text-slate-400">Role level is assigned by Administration</span>
                  )}
                </div>

                {/* Password / Access PIN Field */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>Account Password / PIN</span>
                    {(role === 'super_admin' || teacher.role === 'super_admin') && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-black">
                        Master: UPgrade2026
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={!isAdminOrSuper && !isEditingSelf}
                      placeholder={(role === 'super_admin' || teacher.role === 'super_admin') ? 'UPgrade2026' : 'Enter account password/PIN'}
                      className={`w-full border rounded-xl px-3 py-2 pr-10 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                        isAdminOrSuper || isEditingSelf ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {(role === 'super_admin' || teacher.role === 'super_admin')
                      ? 'Super Admin master password is UPgrade2026 (strictly distinct from staff password StPaul2026!).'
                      : 'Staff can log in with this individual password or the general staff password.'}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Faculty Bio / Specialization Summary</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Briefly state your teaching philosophy, areas of specialization, or academic background..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-normal focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEACHING ALLOCATIONS */}
          {activeTab === 'allocation' && (
            <div className="space-y-4">
              {/* Form Teacher Assignment */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                <label className="block text-blue-950 font-bold mb-1 flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-700" />
                  <span>Class Form Teacher Allocation</span>
                </label>
                <p className="text-[11px] text-blue-800 mb-2">
                  Form Teachers enter behavioral traits, psychomotor skills, and termly remarks for their assigned arm.
                </p>
                <select
                  value={isFormTeacherOf}
                  onChange={e => setIsFormTeacherOf(e.target.value)}
                  disabled={!isAdminOrSuper}
                  className={`w-full border rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                    isAdminOrSuper ? 'bg-white border-blue-300 text-blue-950' : 'bg-blue-100/50 border-blue-200 text-blue-800 cursor-not-allowed'
                  }`}
                >
                  <option value="">None (Subject Specialist Only)</option>
                  {SCHOOL_CLASSES.map(cls => (
                    <option key={cls} value={cls}>Form Teacher of {cls}</option>
                  ))}
                </select>
              </div>

              {/* Assigned Subjects */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                  <label className="text-slate-800 font-bold text-xs">
                    Assigned Teaching Subjects ({assignedSubjects.length} of {ALL_SUBJECTS.length})
                  </label>
                  {isAdminOrSuper && (
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAssignedSubjects([...ALL_SUBJECTS])}
                        className="text-[10px] bg-amber-100 text-red-950 hover:bg-amber-200 px-2 py-0.5 rounded font-bold"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignedSubjects([...JUNIOR_SUBJECTS])}
                        className="text-[10px] bg-slate-100 text-slate-800 hover:bg-slate-200 px-2 py-0.5 rounded font-semibold"
                      >
                        Junior Core (10)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignedSubjects([...SENIOR_SUBJECTS])}
                        className="text-[10px] bg-slate-100 text-slate-800 hover:bg-slate-200 px-2 py-0.5 rounded font-semibold"
                      >
                        Senior Core (14)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignedSubjects([])}
                        className="text-[10px] bg-red-50 text-red-700 hover:bg-red-100 px-2 py-0.5 rounded font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto flex flex-wrap gap-1.5">
                  {ALL_SUBJECTS.map(subj => {
                    const isAssigned = assignedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        disabled={!isAdminOrSuper}
                        onClick={() => toggleSubject(subj)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          isAssigned
                            ? 'bg-amber-400 text-red-950 border-amber-500 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        } ${!isAdminOrSuper ? 'cursor-default' : ''}`}
                      >
                        {subj} {isAssigned ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Classes */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                  <label className="text-slate-800 font-bold text-xs">
                    Assigned Class Arms ({assignedClasses.length} of {SCHOOL_CLASSES.length})
                  </label>
                  {isAdminOrSuper && (
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAssignedClasses([...SCHOOL_CLASSES])}
                        className="text-[10px] bg-amber-100 text-red-950 hover:bg-amber-200 px-2 py-0.5 rounded font-bold"
                      >
                        Select All (11)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignedClasses(SCHOOL_CLASSES.filter(c => c.startsWith('JSS')))}
                        className="text-[10px] bg-slate-100 text-slate-800 hover:bg-slate-200 px-2 py-0.5 rounded font-semibold"
                      >
                        Junior (JSS 1-3)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignedClasses(SCHOOL_CLASSES.filter(c => c.startsWith('SSS')))}
                        className="text-[10px] bg-slate-100 text-slate-800 hover:bg-slate-200 px-2 py-0.5 rounded font-semibold"
                      >
                        Senior (SSS 1-3)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignedClasses([])}
                        className="text-[10px] bg-red-50 text-red-700 hover:bg-red-100 px-2 py-0.5 rounded font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5">
                  {SCHOOL_CLASSES.map(cls => {
                    const isAssigned = assignedClasses.includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        disabled={!isAdminOrSuper}
                        onClick={() => toggleClass(cls)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          isAssigned
                            ? 'bg-red-900 text-amber-300 border-amber-400 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        } ${!isAdminOrSuper ? 'cursor-default' : ''}`}
                      >
                        {cls} {isAssigned ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {/* Sign Out Option from inside modal */}
            {isEditingSelf && onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-xl font-bold transition shadow-xs"
                title="Sign out of teacher account"
              >
                <LogOut className="w-3.5 h-3.5 text-red-700" />
                <span>Sign Out of Account</span>
              </button>
            )}

            {/* Delete Teacher for Super Admin / Admin */}
            {onDeleteTeacher && isAdminOrSuper && teacher.role !== 'super_admin' && teacher.id !== 't-admin' && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to remove ${teacher.name} (${teacher.staffId}) from the school roster?`)) {
                    onDeleteTeacher(teacher.id);
                    onClose();
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold transition shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete Staff</span>
              </button>
            )}

            <div className="flex items-center space-x-2 ml-auto">
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
                <span>Save Profile &amp; Biodata</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
