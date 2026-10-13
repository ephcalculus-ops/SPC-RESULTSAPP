import React, { useState, useMemo, useEffect } from 'react';
import { Student, SchoolSettings } from '../types';
import { OFFICIAL_SUBJECTS, SCHOOL_CLASSES } from '../data/mockData';
import { BarChart3, TrendingUp, Users, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AnalyticsViewProps {
  students: Student[];
  settings: SchoolSettings;
  activeTerm?: string;
  onSelectTerm?: (term: string) => void;
  onSelectStudentForReport: (student: Student) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  settings,
  activeTerm,
  onSelectTerm,
  onSelectStudentForReport,
}) => {
  const [analyticsTerm, setAnalyticsTerm] = useState<string>(activeTerm || 'Third Term');

  useEffect(() => {
    if (activeTerm) {
      setAnalyticsTerm(activeTerm);
    }
  }, [activeTerm]);

  const isCumulative = analyticsTerm === 'Cumulative';

  const getStudentAvg = (s: Student): number => {
    if (isCumulative) return s.cumulativeAverageScore ?? s.averageScore ?? 0;
    return s.termTotals?.[analyticsTerm]?.averageScore ?? s.averageScore ?? 0;
  };

  const getStudentGrade = (s: Student): string => {
    if (isCumulative) return s.cumulativeOverallGrade ?? s.overallGrade ?? 'F';
    return s.termTotals?.[analyticsTerm]?.overallGrade ?? s.overallGrade ?? 'F';
  };

  // Class comparisons
  const classBreakdowns = useMemo(() => {
    return SCHOOL_CLASSES.map(cls => {
      const clsStudents = students.filter(s => s.className === cls);
      const count = clsStudents.length;
      if (count === 0) return { cls, count: 0, avg: 0, passRate: 0, topStudent: null };

      const avgs = clsStudents.map(s => getStudentAvg(s));
      const totalAvg = Number((avgs.reduce((a, b) => a + b, 0) / count).toFixed(2));
      const passCount = clsStudents.filter(s => getStudentAvg(s) >= 50).length;
      const passRate = Number(((passCount / count) * 100).toFixed(1));
      
      const sorted = [...clsStudents].sort((a, b) => getStudentAvg(b) - getStudentAvg(a));
      const topStudent = sorted[0];

      return {
        cls,
        count,
        avg: totalAvg,
        passRate,
        topStudent,
      };
    });
  }, [students, analyticsTerm, isCumulative]);

  // Overall grade distribution
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    students.forEach(s => {
      const g = getStudentGrade(s);
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [students, analyticsTerm, isCumulative]);

  // Subject difficulty ranking
  const subjectAverages = useMemo(() => {
    return OFFICIAL_SUBJECTS.map(subj => {
      let sum = 0;
      let count = 0;
      students.forEach(s => {
        let scoreTotal = 0;
        if (isCumulative) {
          scoreTotal = s.cumulativeScores?.[subj]?.cumulativeAverage ?? s.scores[subj]?.total ?? 0;
        } else {
          scoreTotal = s.termScores?.[analyticsTerm]?.[subj]?.total ?? s.scores[subj]?.total ?? 0;
        }
        if (scoreTotal > 0) {
          sum += scoreTotal;
          count++;
        }
      });
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;
      return { subj, avg };
    }).sort((a, b) => b.avg - a.avg);
  }, [students, analyticsTerm, isCumulative]);

  const schoolAverage = useMemo(() => {
    const total = students.reduce((sum, s) => sum + getStudentAvg(s), 0);
    return students.length > 0 ? (total / students.length).toFixed(2) : '0';
  }, [students, analyticsTerm, isCumulative]);

  return (
    <div className="space-y-6">
      {/* Term Selector Header Strip */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-serif">Academic Performance Analytics</h2>
          <p className="text-xs text-slate-500">
            Performance metrics and grade breakdowns for {settings.session} • {analyticsTerm}
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300">
          {[
            { id: 'First Term', label: '1st Term' },
            { id: 'Second Term', label: '2nd Term' },
            { id: 'Third Term', label: '3rd Term' },
            { id: 'Cumulative', label: 'Cumulative (Annual)' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                setAnalyticsTerm(id);
                if (onSelectTerm) onSelectTerm(id);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                analyticsTerm === id
                  ? 'bg-[#8b1515] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Students</span>
            <span className="text-2xl font-bold text-slate-900">{students.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across 6 Class Arms</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">School Average</span>
            <span className="text-2xl font-bold text-slate-900">{schoolAverage}%</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Satisfactory</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Grade A Distinctions</span>
            <span className="text-2xl font-bold text-slate-900">{gradeDistribution['A'] || 0}</span>
            <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">80% and above</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Curriculum Subjects</span>
            <span className="text-2xl font-bold text-slate-900">{OFFICIAL_SUBJECTS.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Terminal Assessments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Class Comparisons Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            Class Performance Breakdown ({settings.session} • {settings.term})
          </h3>
          <span className="text-xs text-slate-500">6 Synchronized Classes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Class Arm</th>
                <th className="p-3 text-center">Enrolment</th>
                <th className="p-3 text-center">Class Average</th>
                <th className="p-3 text-center">Pass Rate (≥50%)</th>
                <th className="p-3">Valedictorian / Top Student</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classBreakdowns.map(row => (
                <tr key={row.cls} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{row.cls}</td>
                  <td className="p-3 text-center font-mono">{row.count} Students</td>
                  <td className="p-3 text-center font-mono font-bold text-blue-900">{row.avg}%</td>
                  <td className="p-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {row.passRate}%
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-800">
                    {row.topStudent ? (
                      <div>
                        <span>{row.topStudent.name}</span>
                        <span className="text-xs text-slate-400 ml-1">({row.topStudent.averageScore}%)</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {row.topStudent && (
                      <button
                        onClick={() => onSelectStudentForReport(row.topStudent)}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        View Report
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Distribution & Subject Averages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Grade Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-800">
            Overall Grade Distribution ({students.length} Students)
          </h3>
          <div className="space-y-2.5">
            {['A', 'B', 'C', 'D', 'E', 'F'].map(grade => {
              const count = gradeDistribution[grade] || 0;
              const percent = students.length > 0 ? Number(((count / students.length) * 100).toFixed(1)) : 0;
              return (
                <div key={grade} className="flex items-center space-x-3 text-xs">
                  <span className="w-8 font-bold text-slate-700">Grade {grade}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        grade === 'A' ? 'bg-emerald-500' :
                        grade === 'B' ? 'bg-blue-500' :
                        grade === 'C' ? 'bg-cyan-500' :
                        grade === 'D' ? 'bg-amber-500' :
                        grade === 'E' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-slate-600 font-semibold">
                    {count} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top & Bottom Subjects */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-800">
            Curriculum Subject Performance (18 Subjects)
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {subjectAverages.map(({ subj, avg }, idx) => (
              <div key={subj} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="font-medium text-slate-800 truncate mr-2">
                  {idx + 1}. {subj}
                </span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                  avg >= 70 ? 'bg-emerald-50 text-emerald-700' :
                  avg >= 60 ? 'bg-blue-50 text-blue-700' :
                  avg >= 50 ? 'bg-slate-100 text-slate-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {avg}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
