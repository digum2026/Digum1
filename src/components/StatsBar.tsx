import React from 'react';
import { SchoolClass, Grade } from '../types';
import { GRADES, GRADE_CONFIGS } from '../constants/grades';
import { Users } from 'lucide-react';

interface StatsBarProps {
  classes: SchoolClass[];
  onSelectGrade: (grade: Grade) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ classes, onSelectGrade }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {GRADES.map((grade) => {
        const config = GRADE_CONFIGS[grade];
        const gradeClasses = classes.filter((c) => c.grade === grade);
        const count = gradeClasses.length;
        const studentsCount = gradeClasses.reduce(
          (sum, c) => sum + (c.students ? c.students.length : 0),
          0
        );

        return (
          <button
            key={grade}
            onClick={() => onSelectGrade(grade)}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all text-right group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: config.color.accent }}
              />
              <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                שכבה {grade}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-800">
                {count}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {count === 1 ? 'כיתה' : 'כיתות'}
              </span>
            </div>

            {/* Students count chip & mini class names */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-slate-600">
                <Users className="w-3 h-3 text-blue-500" />
                <span>{studentsCount}</span>
              </span>
              <div className="flex items-center gap-1 overflow-hidden">
                {gradeClasses.slice(0, 3).map((c) => (
                  <span
                    key={c.id}
                    className="font-black px-1 rounded bg-slate-100 text-slate-700"
                  >
                    {c.fullName}
                  </span>
                ))}
                {gradeClasses.length > 3 && (
                  <span className="text-slate-400">+{gradeClasses.length - 3}</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
