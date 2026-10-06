import React, { useState } from 'react';
import { SchoolClass, Student, DigumCategory, DigumNote } from '../types';
import { GRADE_CONFIGS, DIGUM_CATEGORIES } from '../constants/grades';
import {
  ArrowRight,
  User,
  BookOpen,
  Users,
  Edit3,
  Trash2,
  Plus,
  Search,
  Check,
  Copy,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Calendar,
  X,
  ShieldAlert,
} from 'lucide-react';

interface ClassProfileViewProps {
  schoolClass: SchoolClass;
  onBack: () => void;
  onEditClass: (schoolClass: SchoolClass) => void;
  onDeleteClass: (classId: string) => void;
  onAddStudent: (classId: string, student: Omit<Student, 'id' | 'addedAt' | 'digumNotes'>) => void;
  onRemoveStudent: (classId: string, studentId: string) => void;
  onAddDigumNote?: (
    classId: string,
    studentId: string,
    note: Omit<DigumNote, 'id' | 'createdAt'>
  ) => void;
  onToggleDigumStatus: (classId: string, studentId: string, noteId: string) => void;
  onDeleteDigumNote: (classId: string, studentId: string, noteId: string) => void;
}

export const ClassProfileView: React.FC<ClassProfileViewProps> = ({
  schoolClass,
  onBack,
  onEditClass,
  onDeleteClass,
  onAddStudent,
  onRemoveStudent,
  onToggleDigumStatus,
  onDeleteDigumNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter for Digum status
  const [digumFilter, setDigumFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  // Form states for manual student addition
  const [newTz, setNewTz] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');

  const gradeConfig = GRADE_CONFIGS[schoolClass.grade] || GRADE_CONFIGS['ט'];

  // Calculate statistics
  const totalStudents = schoolClass.students.length;
  const allDigumNotes = schoolClass.students.flatMap((s) => s.digumNotes || []);
  const openNotesCount = allDigumNotes.filter((n) => n.status === 'פתוח').length;
  const resolvedNotesCount = allDigumNotes.filter((n) => n.status === 'טופל').length;

  const handleCopyList = () => {
    const text = schoolClass.students.map((s) => s.displayFormat).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTz.trim() || !newLastName.trim() || !newFirstName.trim()) return;

    const fullName = `${newLastName.trim()} ${newFirstName.trim()}`;
    onAddStudent(schoolClass.id, {
      tz: newTz.trim(),
      lastName: newLastName.trim(),
      firstName: newFirstName.trim(),
      fullName,
      displayFormat: `${newTz.trim()} - ${fullName}`,
    });

    setNewTz('');
    setNewLastName('');
    setNewFirstName('');
    setShowAddStudentModal(false);
  };

  // Filter students based on search and Digum filter
  const filteredStudents = schoolClass.students.filter((s) => {
    const matchesSearch =
      !searchTerm.trim() ||
      s.displayFormat.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      s.tz.includes(searchTerm.trim()) ||
      s.fullName.includes(searchTerm.trim());

    if (!matchesSearch) return false;

    const studentOpenNotes = (s.digumNotes || []).filter((n) => n.status === 'פתוח');
    if (digumFilter === 'OPEN') return studentOpenNotes.length > 0;
    if (digumFilter === 'RESOLVED') return (s.digumNotes || []).length > 0 && studentOpenNotes.length === 0;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Profile Header */}
      <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden">
        {/* Top color bar */}
        <div
          className="absolute top-0 left-0 right-0 h-3"
          style={{ backgroundColor: gradeConfig.color.accent }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title="חזרה לרשימת הכיתות"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              {/* Class block display */}
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-3xl sm:text-4xl font-black shadow-xs">
                {schoolClass.fullName}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    פרופיל כיתה {schoolClass.fullName}
                  </h2>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black ${gradeConfig.color.badge}`}
                  >
                    שכבה {schoolClass.grade}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                  <span>כיתה מקבילה {schoolClass.number}</span>
                  {schoolClass.teacherName && (
                    <>
                      <span>•</span>
                      <span>מחנך: {schoolClass.teacherName}</span>
                    </>
                  )}
                  {schoolClass.mks && (
                    <>
                      <span>•</span>
                      <span>מק״ס: {schoolClass.mks}</span>
                    </>
                  )}
                  {schoolClass.track && (
                    <>
                      <span>•</span>
                      <span>מגמה: {schoolClass.track}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action: Delete Class (Direct in-UI confirmation without window.confirm) */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-300 p-2 rounded-2xl animate-in fade-in">
                <span className="text-xs font-black text-red-900">
                  למחוק את כיתה {schoolClass.fullName} לצמיתות?
                </span>
                <button
                  onClick={() => {
                    onDeleteClass(schoolClass.id);
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  כן, מחק
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="מחיקת כיתה מהמאגר"
              >
                <Trash2 className="w-4 h-4" />
                <span>מחיקת כיתה</span>
              </button>
            )}
          </div>
        </div>

        {/* Class summary & Edit Class block placed right above summary cards */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-slate-900">
              סיכום כיתתי
            </h3>
          </div>

          <button
            onClick={() => onEditClass(schoolClass)}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span>עריכת כיתה</span>
          </button>
        </div>

        {/* Stats Cards Row (4 cards: Total students, Total notes, Unresponded notes in RED, Resolved notes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* 1. סה"כ תלמידים בכיתה */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-700">סה״כ תלמידים בכיתה</div>
              <div className="text-2xl font-black text-blue-900 mt-0.5">{totalStudents}</div>
            </div>
            <Users className="w-8 h-8 text-blue-500 opacity-60" />
          </div>

          {/* 2. סה"כ הערות דיגום */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-600">סה״כ הערות דיגום</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{allDigumNotes.length}</div>
            </div>
            <ClipboardList className="w-8 h-8 text-slate-400 opacity-60" />
          </div>

          {/* 3. הערות דיגום ללא תגובה (IN RED) */}
          <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200 text-red-900 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-red-700">הערות דיגום ללא תגובה</div>
              <div className="text-2xl font-black text-red-900 mt-0.5">{openNotesCount}</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500 opacity-80" />
          </div>

          {/* 4. הערות שטופלו */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-700">הערות שטופלו</div>
              <div className="text-2xl font-black text-emerald-900 mt-0.5">{resolvedNotesCount}</div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
          </div>
        </div>
      </div>

      {/* Students & Digum Section */}
      <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <span>רשימת תלמידים והערות דיגום ({filteredStudents.length})</span>
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              פורמט תצוגה: <strong>ת.ז - שם משפחה + שם פרטי</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חיפוש לפי ת.ז או שם..."
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Filter Digum Status */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setDigumFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  digumFilter === 'ALL' ? 'bg-white shadow-2xs text-blue-700 font-black' : 'text-slate-500'
                }`}
              >
                הכל
              </button>
              <button
                onClick={() => setDigumFilter('OPEN')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  digumFilter === 'OPEN' ? 'bg-amber-100 text-amber-900 font-black' : 'text-slate-500'
                }`}
              >
                הערות פתוחות ({openNotesCount})
              </button>
            </div>

            {/* Copy list */}
            <button
              onClick={handleCopyList}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="העתק רשימת תלמידים"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Add student */}
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף תלמיד</span>
            </button>
          </div>
        </div>

        {/* Student Rows List */}
        {filteredStudents.length > 0 ? (
          <div className="space-y-3">
            {filteredStudents.map((student, index) => {
              const notes = student.digumNotes || [];
              const openNotes = notes.filter((n) => n.status === 'פתוח');
              const resolvedNotes = notes.filter((n) => n.status === 'טופל');

              return (
                <div
                  key={student.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    openNotes.length > 0
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-xs font-bold text-slate-400 font-mono">
                        {index + 1}.
                      </span>

                      {/* Required exact format: ת.ז - שם משפחה + שם פרטי */}
                      <div className="font-mono text-base font-black text-slate-900 tracking-wide">
                        {student.displayFormat}
                      </div>

                      {/* Display total notes count for student */}
                      <div className="flex items-center gap-1.5">
                        {notes.length > 0 ? (
                          <span
                            className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              openNotes.length > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>
                              {notes.length} הערות דיגום {openNotes.length > 0 ? `(${openNotes.length} פתוחות)` : '(טופלו)'}
                            </span>
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ללא הערות דיגום
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Student Row Actions - Only remove student (no adding digum in class management) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => onRemoveStudent(schoolClass.id, student.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="מחק תלמיד מהכיתה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes Sub-List for this student if any exist */}
                  {notes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400">
                        סיכום הערות דיגום לתלמיד ({notes.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {notes.map((note) => {
                          const isOpen = note.status === 'פתוח';
                          const displayInfractions =
                            note.infractions && note.infractions.length > 0
                              ? note.infractions
                              : [note.category];
                          const extraText =
                            note.note &&
                            !displayInfractions.includes(note.note) &&
                            note.note !== note.category
                              ? note.note
                              : null;

                          return (
                            <div
                              key={note.id}
                              className={`p-2.5 rounded-xl border text-xs flex flex-wrap items-center gap-2 transition-all ${
                                isOpen
                                  ? 'bg-white border-amber-300 text-amber-950 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                {displayInfractions.map((inf, i) => (
                                  <span
                                    key={i}
                                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                      isOpen ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {inf}
                                  </span>
                                ))}
                              </div>

                              {extraText && <span className="font-bold">{extraText}</span>}

                              {note.reportedBy && (
                                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                                  תורן: {note.reportedBy}
                                </span>
                              )}

                              <span className="text-[10px] text-slate-400 font-mono">
                                ({note.date})
                              </span>

                              {/* Toggle resolved button */}
                              <button
                                onClick={() =>
                                  onToggleDigumStatus(schoolClass.id, student.id, note.id)
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-black transition-colors cursor-pointer ${
                                  isOpen
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                              >
                                {isOpen ? 'סמן שטופל ✓' : 'פתח מחדש ↺'}
                              </button>

                              {/* Delete note */}
                              <button
                                onClick={() =>
                                  onDeleteDigumNote(schoolClass.id, student.id, note.id)
                                }
                                className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                                title="מחק הערה"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 p-8">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <h4 className="text-lg font-black text-slate-800 mb-1">
              {searchTerm ? 'לא נמצאו תלמידים התואמים לחיפוש' : 'אין תלמידים רשומים כרגע בכיתה זו'}
            </h4>
            <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto mb-4">
              תוכלו לייבא תלמידים ישירות מקובץ PDF/אקסל של המשו״ב במסך הראשי, או להוסיף תלמיד ידנית.
            </p>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>הוספת תלמיד ידנית</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add Student Manually */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-lg font-black text-slate-900">הוספת תלמיד לכיתה {schoolClass.fullName}</h4>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">תעודת זהות:</label>
                <input
                  type="text"
                  value={newTz}
                  onChange={(e) => setNewTz(e.target.value)}
                  placeholder="לדוגמה 220007579"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">שם משפחה:</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="שם משפחה"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">שם פרטי:</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="שם פרטי"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-black"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs"
                >
                  הוסף תלמיד
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
