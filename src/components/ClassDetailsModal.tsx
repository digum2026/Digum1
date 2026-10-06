import React, { useState, useEffect } from 'react';
import { SchoolClass, Grade, ClassNumber, Track } from '../types';
import { GRADES, CLASS_NUMBERS, TRACKS } from '../constants/grades';
import { X, Save, Trash2, BookOpen, Hash, User, AlertCircle, Shield } from 'lucide-react';

interface ClassDetailsModalProps {
  schoolClass: SchoolClass | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: SchoolClass) => void;
  onDelete: (id: string) => void;
  existingClasses: SchoolClass[];
}

export const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({
  schoolClass,
  isOpen,
  onClose,
  onSave,
  onDelete,
  existingClasses,
}) => {
  const [grade, setGrade] = useState<Grade>('י');
  const [number, setNumber] = useState<ClassNumber>(6);
  const [teacherName, setTeacherName] = useState('');
  const [mks, setMks] = useState('');
  const [track, setTrack] = useState<Track>('כללי');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (schoolClass) {
      setGrade(schoolClass.grade);
      setNumber(schoolClass.number);
      setTeacherName(schoolClass.teacherName || '');
      setMks(schoolClass.mks || '');
      setTrack((schoolClass.track as Track) || 'כללי');
      setNotes(schoolClass.notes || '');
      setError(null);
    }
  }, [schoolClass]);

  if (!isOpen || !schoolClass) return null;

  const fullName = `${grade}${number}`;

  // Check duplicate (if changed to another class that already exists)
  const isAnotherClassWithSameName =
    fullName !== schoolClass.fullName &&
    existingClasses.some((c) => c.fullName === fullName && c.id !== schoolClass.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnotherClassWithSameName) {
      setError(`כיתה ${fullName} כבר קיימת במאגר! לא ניתן לשנות לכיתה קיימת.`);
      return;
    }

    onSave({
      ...schoolClass,
      grade,
      number,
      fullName,
      teacherName: teacherName.trim() || undefined,
      mks: mks.trim() || undefined,
      track,
      notes: notes.trim() || undefined,
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-2xl">
              {fullName}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                עריכת פרטי כיתה {schoolClass.fullName}
              </h3>
              <p className="text-xs font-bold text-slate-400">
                עדכון פרטי מחנך ומגמה
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Grade */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                שכבה:
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as Grade)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-black text-base text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    שכבה {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Number */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                מספר כיתה:
              </label>
              <select
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value, 10) as ClassNumber)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-black text-base text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                {CLASS_NUMBERS.map((n) => (
                  <option key={n} value={n}>
                    כיתה {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Educator & MKS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                מחנך:
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="הזן שם מחנך..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                מק״ס:
              </label>
              <input
                type="text"
                value={mks}
                onChange={(e) => setMks(e.target.value)}
                placeholder="הזן שם מק״ס..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Track */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              מגמה:
            </label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value as Track)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              {TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-300 p-2 rounded-xl">
                <span className="text-xs font-black text-red-900">למחוק לצמיתות?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(schoolClass.id);
                    onClose();
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg shadow-xs cursor-pointer"
                >
                  כן, מחק
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>מחק כיתה</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-black transition-colors cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isAnotherClassWithSameName}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-black shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>שמור שינויים</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
