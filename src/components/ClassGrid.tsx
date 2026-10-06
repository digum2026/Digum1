import React, { useState, useMemo } from 'react';
import { SchoolClass, Grade } from '../types';
import { GRADES } from '../constants/grades';
import { ClassCard } from './ClassCard';
import { Search, Layers, PlusCircle, FileText, Users, AlertTriangle } from 'lucide-react';

interface ClassGridProps {
  classes: SchoolClass[];
  onOpenProfile: (schoolClass: SchoolClass) => void;
  onAddClick: () => void;
  onOpenDocumentUpload: () => void;
}

export const ClassGrid: React.FC<ClassGridProps> = ({
  classes,
  onOpenProfile,
  onAddClick,
  onOpenDocumentUpload,
}) => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<Grade | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'grade-num' | 'students' | 'digum'>('grade-num');

  // Grade ordering map
  const gradeOrder: Record<Grade, number> = {
    ט: 1,
    י: 2,
    יא: 3,
    יב: 4,
    יג: 5,
    יד: 6,
  };

  // Filtered and sorted classes
  const filteredClasses = useMemo(() => {
    return classes
      .filter((item) => {
        const matchesGrade = selectedGradeFilter === 'ALL' || item.grade === selectedGradeFilter;
        const searchLower = searchTerm.trim().toLowerCase();
        if (!searchLower) return matchesGrade;

        const matchesSearch =
          item.fullName.toLowerCase().includes(searchLower) ||
          item.grade.toLowerCase().includes(searchLower) ||
          item.number.toString().includes(searchLower) ||
          (item.teacherName && item.teacherName.toLowerCase().includes(searchLower)) ||
          (item.track && item.track.toLowerCase().includes(searchLower));

        return matchesGrade && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'students') {
          return b.students.length - a.students.length;
        }
        if (sortBy === 'digum') {
          const countA = a.students.reduce(
            (acc, s) => acc + (s.digumNotes?.filter((n) => n.status === 'פתוח').length || 0),
            0
          );
          const countB = b.students.reduce(
            (acc, s) => acc + (s.digumNotes?.filter((n) => n.status === 'פתוח').length || 0),
            0
          );
          return countB - countA;
        }
        // default: sort by grade then number
        const gradeDiff = gradeOrder[a.grade] - gradeOrder[b.grade];
        if (gradeDiff !== 0) return gradeDiff;
        return a.number - b.number;
      });
  }, [classes, selectedGradeFilter, searchTerm, sortBy]);

  const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);
  const totalOpenDigum = classes.reduce(
    (sum, c) =>
      sum +
      c.students.reduce(
        (acc, s) => acc + (s.digumNotes?.filter((n) => n.status === 'פתוח').length || 0),
        0
      ),
    0
  );

  return (
    <section className="rounded-[2.5rem] bg-white border border-slate-200 shadow-sm p-6 md:p-8 transition-all">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                בלוקי הכיתות הפעילות
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-1 rounded-xl">
                {filteredClasses.length} {filteredClasses.length === 1 ? 'כיתה' : 'כיתות'}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {totalStudents} תלמידים
              </span>
              {totalOpenDigum > 0 && (
                <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {totalOpenDigum} הערות דיגום
                </span>
              )}
            </div>
            <p className="text-slate-500 font-semibold text-sm">
              לחצו על בלוק כיתה כדי לפתוח את פרופיל הכיתה, רשימת התלמידים, עריכה וניהול הערות דיגום.
            </p>
          </div>
        </div>

        {/* Search input & Upload button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Upload PDF / Excel button */}
          <button
            onClick={onOpenDocumentUpload}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="ייבוא תלמידים מקובץ PDF או אקסל של משו״ב"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>טעינת תלמידים מ-PDF / אקסל</span>
          </button>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש כיתה או מחנך..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                נקה
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setSortBy('grade-num')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                sortBy === 'grade-num'
                  ? 'bg-white text-blue-700 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              לפי שכבה
            </button>
            <button
              onClick={() => setSortBy('digum')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                sortBy === 'digum'
                  ? 'bg-white text-amber-700 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              לפי הערות דיגום
            </button>
          </div>
        </div>
      </div>

      {/* Grade Filter Tabs (הכל, ט, י, יא, יב, יג, יד) */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-thin">
        <button
          onClick={() => setSelectedGradeFilter('ALL')}
          className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all border cursor-pointer ${
            selectedGradeFilter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-102'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          כל השכבות ({classes.length})
        </button>

        {GRADES.map((grade) => {
          const count = classes.filter((c) => c.grade === grade).length;
          const isSelected = selectedGradeFilter === grade;
          return (
            <button
              key={grade}
              onClick={() => setSelectedGradeFilter(grade)}
              className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all border flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-102'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span>{grade}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Class Blocks */}
      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">
          {filteredClasses.map((item) => (
            <ClassCard
              key={item.id}
              schoolClass={item}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 my-4 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">
            {classes.length === 0 ? 'אין כיתות במאגר עדיין' : 'לא נמצאו כיתות תואמות'}
          </h3>
          <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto mb-6">
            {classes.length === 0
              ? 'המאגר ריק כעת. הוסיפו כיתה ראשונה באמצעות הטופס שלמעלה.'
              : 'נסו לבחור שכבה אחרת או לנקות את מילות החיפוש.'}
          </p>
          <button
            onClick={onAddClick}
            className="px-6 py-3 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>הוסף כיתה ראשונה עכשיו</span>
          </button>
        </div>
      )}
    </section>
  );
};
