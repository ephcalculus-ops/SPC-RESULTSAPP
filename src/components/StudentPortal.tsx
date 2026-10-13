import React, { useState } from 'react';
import { Student, SchoolSettings } from '../types';
import { DEFAULT_OFFICIAL_STAMP, getGradeRemark } from '../data/mockData';
import { Search, GraduationCap, CheckCircle2, FileText, ArrowRight, Edit3, LogOut, Phone, MapPin, Droplet, Loader2 } from 'lucide-react';
import { StudentBiodataModal } from './StudentBiodataModal';
import { searchStudentInCloud } from '../services/firestoreSync';

interface StudentPortalProps {
  students: Student[];
  settings: SchoolSettings;
  onSelectStudentForReport: (student: Student) => void;
  onUpdateStudent?: (studentId: string, updates: Partial<Student>) => void;
  onSignOut?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  students,
  settings,
  onSelectStudentForReport,
  onUpdateStudent,
  onSignOut,
}) => {
  const [learnerIdInput, setLearnerIdInput] = useState('');
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isBiodataModalOpen, setIsBiodataModalOpen] = useState(false);

  const [isSearchingCloud, setIsSearchingCloud] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const cleanId = learnerIdInput.trim().toUpperCase();
    if (!cleanId) return;

    // 1. Check local in-memory student cache
    const match = students.find(s => s.learnerId.toUpperCase() === cleanId || s.name.toUpperCase().includes(cleanId) || s.id.toUpperCase() === cleanId);
    if (match) {
      setFoundStudent(match);
      return;
    }

    // 2. Direct Cloud Storage lookup
    setIsSearchingCloud(true);
    try {
      const cloudStudent = await searchStudentInCloud(cleanId);
      if (cloudStudent) {
        setFoundStudent(cloudStudent);
        if (onUpdateStudent) {
          onUpdateStudent(cloudStudent.id, cloudStudent);
        }
      } else {
        setFoundStudent(null);
      }
    } catch (_) {
      setFoundStudent(null);
    } finally {
      setIsSearchingCloud(false);
    }
  };

  const handleQuickLookup = async (learnerId: string) => {
    setLearnerIdInput(learnerId);
    setHasSearched(true);
    const match = students.find(s => s.learnerId.toUpperCase() === learnerId.toUpperCase());
    if (match) {
      setFoundStudent(match);
      return;
    }

    setIsSearchingCloud(true);
    try {
      const cloudStudent = await searchStudentInCloud(learnerId);
      if (cloudStudent) {
        setFoundStudent(cloudStudent);
        if (onUpdateStudent) {
          onUpdateStudent(cloudStudent.id, cloudStudent);
        }
      } else {
        setFoundStudent(null);
      }
    } catch (_) {
      setFoundStudent(null);
    } finally {
      setIsSearchingCloud(false);
    }
  };

  const handleClear = () => {
    setLearnerIdInput('');
    setFoundStudent(null);
    setHasSearched(false);
  };

  // Sync foundStudent with changes in students list
  const activeFoundStudent = foundStudent ? (students.find(s => s.id === foundStudent.id) || foundStudent) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header with Portal Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Student / Parent Portal Gateway
        </span>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-xl text-xs font-bold transition shadow-2xs"
            title="Sign Out and Return to Gate"
          >
            <LogOut className="w-3.5 h-3.5 text-red-700" />
            <span>Sign Out of Portal</span>
          </button>
        )}
      </div>

      {/* Welcome Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white mx-auto mb-3 shadow-md">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-slate-900">
          Learner &amp; Parent Result Checking Portal
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {settings.schoolName} • {settings.session} {settings.term}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Enter Learner's ID (e.g. A122/2023/616494)..."
              value={learnerIdInput}
              onChange={e => setLearnerIdInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingCloud}
            className="px-5 py-2.5 bg-[#102a43] hover:bg-slate-900 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition shrink-0 flex items-center justify-center space-x-1.5"
          >
            {isSearchingCloud && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />}
            <span>{isSearchingCloud ? 'Checking Cloud...' : 'Check Results'}</span>
          </button>
        </form>

        {/* Enrolled students quick select if available */}
        {students.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-center gap-2">
            <span>Enrolled Student IDs: </span>
            {students.slice(0, 4).map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleQuickLookup(st.learnerId)}
                className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded font-bold font-mono border border-blue-200 transition"
              >
                {st.learnerId} ({st.name.split(' ')[0]})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result Card if Found */}
      {activeFoundStudent && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-14 h-18 rounded-lg border-2 border-amber-400 bg-slate-100 overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
                {activeFoundStudent.passportPhoto ? (
                  <img src={activeFoundStudent.passportPhoto} alt={activeFoundStudent.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-200 text-red-950 font-bold flex items-center justify-center text-xs">
                    {activeFoundStudent.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Result Available
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {activeFoundStudent.name}
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {activeFoundStudent.learnerId} • Class: {activeFoundStudent.className}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">
                {activeFoundStudent.averageScore}%
              </div>
              <div className="text-xs font-bold text-slate-500">
                Class Rank: #{activeFoundStudent.positionInClass}
              </div>
            </div>
          </div>

          {/* Learner Biodata Summary Strip */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Blood Group &amp; Genotype</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Droplet className="w-3 h-3 text-red-600" />
                {activeFoundStudent.biodata?.bloodGroup || 'O+'} ({activeFoundStudent.biodata?.genotype || 'AA'})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">State of Origin</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {activeFoundStudent.biodata?.stateOfOrigin || 'FCT Abuja'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Parent Contact</span>
              <span className="font-bold text-slate-800 truncate flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" />
                {activeFoundStudent.biodata?.guardianPhone || 'N/A'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Total Score</span>
              <span className="font-bold text-slate-800 text-sm">{activeFoundStudent.totalScore} / 1800</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Overall Grade</span>
              <span className="font-bold text-slate-800 text-sm">{activeFoundStudent.overallGrade}</span>
              <span className="text-[9px] text-slate-500 font-medium block truncate">
                {getGradeRemark(activeFoundStudent.overallGrade || 'F', settings.gradingScale)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Attendance</span>
              <span className="font-bold text-slate-800 text-sm">{activeFoundStudent.daysPresent} / {settings.daysSchoolOpened} days</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            {/* Official Stamp Certified Indicator */}
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
                <img
                  src={settings.schoolStamp || DEFAULT_OFFICIAL_STAMP}
                  alt="Official Certified Seal"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `rotate(${settings.schoolStampRotation ?? -6}deg)`,
                    opacity: settings.schoolStampOpacity ?? 0.88,
                  }}
                />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Officially Certified &amp; Stamped</span>
                </div>
                <div className="text-[9px] text-slate-500 font-sans">
                  {settings.schoolName || 'ST PAUL COLLEGE'} Examination Board • {settings.session}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Edit Student Biodata Button */}
              {onUpdateStudent && (
                <button
                  type="button"
                  onClick={() => setIsBiodataModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-red-950 rounded-xl text-xs font-bold shadow-xs transition"
                  title="Edit Learner Profile & Biodata"
                >
                  <Edit3 className="w-3.5 h-3.5 text-red-950" />
                  <span>Edit Biodata</span>
                </button>
              )}

              {/* View Full Report Sheet */}
              <button
                onClick={() => onSelectStudentForReport(activeFoundStudent)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <FileText className="w-4 h-4" />
                <span>View 1-Page Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Clear / Sign Out from session */}
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                title="Clear and check another learner"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {hasSearched && !foundStudent && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center text-xs text-red-800 font-medium">
          No student found with Learner's ID "{learnerIdInput}". Please check the ID on your admission slip or contact the examination officer.
        </div>
      )}

      {/* Student Biodata Modal */}
      {isBiodataModalOpen && activeFoundStudent && onUpdateStudent && (
        <StudentBiodataModal
          student={activeFoundStudent}
          isOpen={isBiodataModalOpen}
          onClose={() => setIsBiodataModalOpen(false)}
          onSave={(studentId, updates) => {
            onUpdateStudent(studentId, updates);
            setIsBiodataModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
