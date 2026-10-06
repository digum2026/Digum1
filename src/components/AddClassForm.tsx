import React, { useState } from 'react';
import { Plus, Check, AlertCircle, User, BookOpen, Layers, Ban, Shield } from 'lucide-react';
import { ClassNumber, Grade, SchoolClass, Track } from '../types';
import { CLASS_NUMBERS, GRADES, GRADE_CONFIGS, TRACKS } from '../constants/grades';

interface AddClassFormProps {
  existingClasses: SchoolClass[];
  onAddClass: (
    newClass: Omit<SchoolClass, 'id' | 'createdAt' | 'updatedAt' | 'students'>
  ) => { success: boolean; message?: string };
}

export const AddClassForm: React.FC<AddClassFormProps> = ({ existingClasses, onAddClass }) => {
  const [selectedGrade, setSelectedGrade] = useState<Grade>('י');
  const [selectedNumber, setSelectedNumber] = useState<ClassNumber>(6);
  const [teacherName, setTeacherName] = useState('');
  const [mks, setMks] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track>('כללי');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  // Full name strictly without apostrophes: e.g. "י6", "יא5", "ט6"
  const currentFullName = `${selectedGrade}${selectedNumber}`;
  const isDuplicate = existingClasses.some((c) => c.fullName === currentFullName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Strict duplication block as requested
    if (isDuplicate) {
      setErrorMessage(`הכיתה ${currentFullName} כבר קיימת במאגר! לא ניתן להוסיף את אותה הכיתה יותר מפעם אחת.`);
      return;
    }

    const result = onAddClass({
      grade: selectedGrade,
      number: selectedNumber,
      fullName: currentFullName,
      teacherName: teacherName.trim() || undefined,
      mks: mks.trim() || undefined,
      track: selectedTrack,
      notes: notes.trim() || undefined,
    });

    if (!result.success) {
      setErrorMessage(result.message || 'שגיאה בהוספת כיתה');
      return;
    }

    setSuccessAnimation(true);
    setTeacherName('');
    setMks('');
    setTimeout(() => setSuccessAnimation(false), 1500);

    // Find next available number in this grade
    const availableNum = CLASS_NUMBERS.find(
      (n) => !existingClasses.some((c) => c.grade === selectedGrade && c.number === n)
    );
    if (availableNum) {
      setSelectedNumber(availableNum);
    }
  };

  return (
    <div id="add-class-form" className="rounded-[2.5rem] bg-white border border-slate-200 shadow-sm p-6 md:p-8 transition-all">
      {/* Form Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
              +
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              הוספת כיתה חדשה
            </h2>
          </div>
          <p className="text-slate-500 font-semibold text-sm">
            בחרו שכבה ומספר כיתה (ללא כפילויות), הגדירו מחנך ומגמה, והכיתה תתווסף למאגר.
          </p>
        </div>

        {/* Live preview badge */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl self-start md:self-auto">
          <span className="text-xs font-bold text-slate-500">תצוגת הבלוק:</span>
          <div
            className={`px-5 py-2 rounded-2xl font-black text-2xl shadow-xs transition-all flex items-center gap-2 ${
              isDuplicate
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-blue-600 text-white shadow-blue-200'
            }`}
          >
            <span>{currentFullName}</span>
            {isDuplicate && (
              <span className="text-[10px] font-bold bg-red-200 text-red-950 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Ban className="w-3 h-3" />
                כבר קיימת במאגר
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Direct Grade & Number Selection (NO DROPDOWN - direct buttons) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                בחירת שכבה:
              </span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                שכבה {selectedGrade}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {GRADES.map((grade) => {
                const isSelected = selectedGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`py-3.5 px-2 rounded-2xl font-black text-lg text-center transition-all duration-150 cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-102 ring-2 ring-blue-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] font-bold text-slate-400">
              {GRADE_CONFIGS[selectedGrade].levelName}
            </div>
          </div>

          {/* Class Number Selector (1-8) - Disabling already existing numbers for this grade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 text-sm flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  #
                </span>
                בחירת מספר כיתה (1 עד 8):
              </span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                כיתה {selectedNumber}
              </span>
            </div>

            <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
              {CLASS_NUMBERS.map((num) => {
                const isSelected = selectedNumber === num;
                const exists = existingClasses.some(
                  (c) => c.grade === selectedGrade && c.number === num
                );

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedNumber(num)}
                    className={`py-3 px-1 rounded-2xl font-black text-lg text-center transition-all duration-150 cursor-pointer border relative ${
                      isSelected
                        ? exists
                          ? 'bg-red-500 text-white border-red-600 shadow-md ring-2 ring-red-300'
                          : 'bg-blue-600 text-white border-blue-600 shadow-md scale-105 ring-2 ring-blue-300'
                        : exists
                        ? 'bg-slate-100 text-slate-400 border-slate-300 line-through opacity-75'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                    title={exists ? `כיתה ${selectedGrade}${num} כבר קיימת במאגר` : `בחר כיתה ${num}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] font-bold text-slate-400">
              {isDuplicate
                ? `כיתה ${currentFullName} כבר תפוסה במאגר. אנא בחרו מספר כיתה אחר.`
                : `כיתה מקבילה ${selectedNumber}`}
            </div>
          </div>
        </div>

        {/* Row 2: Exposed Details (Directly visible, no dropdown for opening!) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="font-black text-slate-800 text-sm mb-3">
            פרטי הכיתה הנוספים:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Educator field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                מחנך:
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="הזן שם מחנך..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-base text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
              />
            </div>

            {/* MKS field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                מק״ס:
              </label>
              <input
                type="text"
                value={mks}
                onChange={(e) => setMks(e.target.value)}
                placeholder="הזן שם מק״ס..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-base text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
              />
            </div>

            {/* Track Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                מגמה:
              </label>
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value as Track)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-base text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-2xs"
              >
                {TRACKS.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isDuplicate && !errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-bold flex items-center gap-2">
            <Ban className="w-5 h-5 shrink-0 text-red-600" />
            <span>
              כיתה <strong>{currentFullName}</strong> כבר קיימת במאגר! לא ניתן להוסיף את אותה כיתה יותר מפעם אחת. אנא בחרו מספר או שכבה אחרת.
            </span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            לחיצה על בלוק הכיתה שתיווצר תפתח את מסך הפרופיל והתלמידים.
          </div>

          <button
            type="submit"
            disabled={isDuplicate}
            className={`w-full sm:w-auto px-8 py-3.5 text-white font-black text-lg rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
              isDuplicate
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : successAnimation
                ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-95'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer active:scale-95 hover:shadow-lg'
            }`}
          >
            {successAnimation ? (
              <>
                <Check className="w-6 h-6 stroke-[3]" />
                <span>כיתה {currentFullName} נוספה בהצלחה!</span>
              </>
            ) : isDuplicate ? (
              <>
                <Ban className="w-5 h-5" />
                <span>כיתה {currentFullName} כבר קיימת (חסום להוספה)</span>
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 stroke-[3]" />
                <span>הוסף כיתה {currentFullName} למאגר</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
