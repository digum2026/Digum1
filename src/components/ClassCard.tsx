import React from 'react';
import { SchoolClass } from '../types';
import { GRADE_CONFIGS } from '../constants/grades';
import {
  User,
  BookOpen,
  Users,
  ArrowLeft,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

interface ClassCardProps {
  schoolClass: SchoolClass;
  onOpenProfile: (schoolClass: SchoolClass) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  schoolClass,
  onOpenProfile,
}) => {
  const gradeConfig = GRADE_CONFIGS[schoolClass.grade] || GRADE_CONFIGS['ט'];

  // Count open digum notes in this class
  const openDigumNotesCount = schoolClass.students.reduce(
    (acc, s) => acc + (s.digumNotes ? s.digumNotes.filter((n) => n.status === 'פתוח').length : 0),
    0
  );

  return (
    <div
      onClick={() => onOpenProfile(schoolClass)}
      className="group relative rounded-[2.2rem] bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between p-6 cursor-pointer hover:-translate-y-1 hover:border-blue-400"
    >
      {/* Top accent color bar */}
      <div
        className="absolute top-0 left-0 right-0 h-2.5 transition-all group-hover:h-3"
        style={{ backgroundColor: gradeConfig.color.accent }}
      />

      <div>
        {/* Header row: Grade badge & Digum status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black ${gradeConfig.color.badge}`}
          >
            {gradeConfig.label}
          </span>

          {openDigumNotesCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{openDigumNotesCount} הערות דיגום</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-400">
              ללא הערות פתוחות
            </span>
          )}
        </div>

        {/* Central Prominent Block (No apostrophes: e.g. י6, יא5, יג2, ט6) */}
        <div className="py-4 text-center my-2 bg-slate-50/80 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 transition-colors">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1 group-hover:scale-105 transition-transform">
            <span className="text-blue-600">{schoolClass.grade}</span>
            <span className="text-slate-900">{schoolClass.number}</span>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-1">
            שכבה {schoolClass.grade} • כיתה מקבילה {schoolClass.number}
          </p>
        </div>

        {/* Key Info: Educator, MKS & Track */}
        <div className="space-y-2 mt-4 text-xs font-bold">
          {schoolClass.teacherName && (
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-slate-500 font-bold">מחנך:</span>
              <span className="truncate font-black">{schoolClass.teacherName}</span>
            </div>
          )}

          {schoolClass.mks && (
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <span className="w-4 h-4 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">
                מ
              </span>
              <span className="text-slate-500 font-bold">מק״ס:</span>
              <span className="truncate font-black">{schoolClass.mks}</span>
            </div>
          )}

          {schoolClass.track && (
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-500 font-bold">מגמה:</span>
              <span className="truncate font-black text-emerald-800">{schoolClass.track}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Entry CTA */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-600">
          <Users className="w-4 h-4 text-blue-600" />
          <span>{schoolClass.students.length} תלמידים</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-black text-blue-600 group-hover:text-blue-700">
          <span>פרופיל כיתה</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
