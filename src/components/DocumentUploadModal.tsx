import React, { useState, useRef } from 'react';
import { SchoolClass, Student } from '../types';
import {
  extractTextFromPdf,
  parsePdfText,
  parseExcelBuffer,
  ParsedStudentRow,
} from '../utils/documentParser';
import { PDF_SAMPLE_STUDENTS } from '../constants/grades';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ClipboardPaste,
  PlusCircle,
  FolderPlus,
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingClasses: SchoolClass[];
  onApplyStudents: (classUpdates: { className: string; newStudents: Student[] }[]) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  existingClasses,
  onApplyStudents,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [pastedText, setPastedText] = useState<string>('');
  const [autoCreateMissingClasses, setAutoCreateMissingClasses] = useState<boolean>(true);
  const [fallbackClass, setFallbackClass] = useState<string>(
    existingClasses.length > 0 ? existingClasses[0].fullName : 'י6'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Set of existing class names in database
  const existingClassNames = new Set(existingClasses.map((c) => c.fullName));

  // Determine which rows to include based on autoCreate toggle
  const eligibleRows = autoCreateMissingClasses
    ? parsedRows
    : parsedRows.filter((r) => existingClassNames.has(r.targetClassName));

  // Group all parsed rows by their detected target class
  const groupedAll: Record<string, ParsedStudentRow[]> = {};
  parsedRows.forEach((row) => {
    const cName = row.targetClassName || fallbackClass;
    if (!groupedAll[cName]) {
      groupedAll[cName] = [];
    }
    groupedAll[cName].push(row);
  });

  const distinctClassNames = Object.keys(groupedAll);
  const existingClassesCount = distinctClassNames.filter((c) => existingClassNames.has(c)).length;
  const newClassesToCreate = distinctClassNames.filter((c) => !existingClassNames.has(c));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      let rows: ParsedStudentRow[] = [];

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const text = await extractTextFromPdf(buffer);
        rows = parsePdfText(text, fallbackClass);
      } else {
        rows = parseExcelBuffer(buffer, fallbackClass);
      }

      if (rows.length === 0) {
        setErrorMessage('לא זוהו שורות תלמידים עם מספרי ת.ז בקובץ זה. נסו להדביק את הטקסט בלשונית הדבקת רשימה.');
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'שגיאה בעיבוד הקובץ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setErrorMessage(null);
    const rows = parsePdfText(pastedText, fallbackClass);
    if (rows.length === 0) {
      setErrorMessage('לא זוהו תלמידים עם מספרי ת.ז בטקסט שהודבק. וודאו שהטקסט מכיל מספרי ת.ז (8-9 ספרות).');
    } else {
      setFileName('רשימת_תלמידים_שהודבקה.txt');
      setParsedRows(rows);
    }
  };

  // Quick Demo with Sample PDF
  const handleLoadPdfSample = () => {
    setFileName('משו״ב_כיתה_י6_מתוך_PDF.pdf');
    setErrorMessage(null);
    const rows: ParsedStudentRow[] = PDF_SAMPLE_STUDENTS.map((s) => ({
      tz: s.tz,
      lastName: s.lastName,
      firstName: s.firstName,
      targetClassName: 'י6',
      gender: s.gender,
    }));
    setParsedRows(rows);
  };

  // Change class for all students in a group
  const handleChangeGroupClass = (oldClass: string, newClass: string) => {
    if (!newClass.trim()) return;
    setParsedRows((prev) =>
      prev.map((r) => (r.targetClassName === oldClass ? { ...r, targetClassName: newClass.trim() } : r))
    );
  };

  const handleApply = () => {
    if (eligibleRows.length === 0) return;

    const byClass: Record<string, Student[]> = {};

    eligibleRows.forEach((row, idx) => {
      const className = row.targetClassName || fallbackClass;
      if (!byClass[className]) {
        byClass[className] = [];
      }

      const fullName = `${row.lastName} ${row.firstName}`.trim();
      const student: Student = {
        id: `s-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        tz: row.tz,
        lastName: row.lastName,
        firstName: row.firstName,
        fullName,
        displayFormat: `${row.tz} - ${fullName}`,
        gender: row.gender,
        digumNotes: [],
        addedAt: Date.now(),
      };

      byClass[className].push(student);
    });

    const updates = Object.entries(byClass).map(([className, newStudents]) => ({
      className,
      newStudents,
    }));

    onApplyStudents(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <ClipboardPaste className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                טעינה והוספת תלמידים לפי כיתות
              </h3>
              <p className="text-xs font-bold text-slate-400">
                זיהוי אוטומטי של הכיתה לכל תלמיד (למשל: י6, יא2, ט4), והוספה ישירה למאגר
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Tabs: Paste Text / Upload File */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>הדבקת רשימת טקסט (מומלץ)</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>העלאת קובץ PDF / אקסל</span>
            </button>
          </div>

          {activeTab === 'paste' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-700">
                  הדביקו כאן את רשימת התלמידים (מ-PDF, אקסל, משו״ב או הודעה):
                </label>
                <span className="text-[11px] font-bold text-slate-400">
                  המערכת תזהה אוטומטית כיתות כמו: י6, יא2, ט4 וכו׳
                </span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`דוגמאות לפורמטים נתמכים:\n220007579 אלגריססי נדב י6\n35 220007017 אלייב סלין י 6 ז\n219430378 ביטון הודיה י"א 5\nהעתקה של שורות וטבלאות מאקסל / משו״ב...`}
                className="w-full h-36 p-3 rounded-2xl border border-slate-200 text-xs font-mono font-bold outline-none focus:border-blue-500 bg-slate-50/50"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  פענח וזהה כיתות ותלמידים
                </button>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>כיתת ברירת מחדל (לשורות ללא כיתה):</span>
                  <input
                    type="text"
                    value={fallbackClass}
                    onChange={(e) => setFallbackClass(e.target.value)}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-center"
                    placeholder="י6"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.xlsx,.xls,.csv"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-blue-600">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">
                    {fileName ? fileName : 'לחצו לבחירת קובץ PDF או אקסל'}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    תמיכה בקובצי PDF של משו״ב, אקסל (XLSX, XLS) ו-CSV
                  </p>
                </div>
                {isProcessing && (
                  <div className="text-xs font-black text-blue-600 mt-2 animate-pulse">
                    מפענח את הקובץ, אנא המתינו...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Demo Button with sample data */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-600">
              רוצים לבדוק מיד עם נתוני דוגמה?
            </div>
            <button
              type="button"
              onClick={handleLoadPdfSample}
              className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>טען את 35 התלמידים מ-PDF (כיתה י6)</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Summary Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="text-xs font-bold text-blue-700">סה״כ תלמידים שזוהו</div>
                  <div className="text-2xl font-black text-blue-900 mt-0.5">
                    {parsedRows.length}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-700">כיתות קיימות במאגר</div>
                  <div className="text-2xl font-black text-emerald-900 mt-0.5">
                    {existingClassesCount} כיתות
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <div className="text-xs font-bold text-indigo-700">כיתות חדשות שיפתחו</div>
                  <div className="text-2xl font-black text-indigo-900 mt-0.5">
                    {newClassesToCreate.length} כיתות
                  </div>
                </div>
              </div>

              {/* Setting: Auto Create Missing Classes */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-black text-indigo-900">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCreateMissingClasses}
                    onChange={(e) => setAutoCreateMissingClasses(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>
                    צור אוטומטית במאגר כל כיתה שאינה קיימת עדיין ושייך אליה את התלמידים
                  </span>
                </label>
                <span className="text-[11px] bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-indigo-700 font-bold">
                  {autoCreateMissingClasses ? 'מופעל (מומלץ)' : 'רק כיתות קיימות'}
                </span>
              </div>

              {/* Grouped Breakdown by Class */}
              <div className="space-y-3">
                <div className="text-xs font-black text-slate-800">
                  חלוקה לפי כיתות שזוהו ברשימה:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(groupedAll).map(([className, rows]) => {
                    const isExisting = existingClassNames.has(className);
                    return (
                      <div
                        key={className}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs font-bold ${
                          isExisting
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : autoCreateMissingClasses
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                            : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                              isExisting ? 'bg-emerald-600' : 'bg-indigo-600'
                            }`}
                          >
                            {className}
                          </span>
                          <div>
                            <div className="font-black">כיתה {className}</div>
                            <div className="text-[11px] font-semibold text-slate-500">
                              {isExisting ? (
                                <span className="text-emerald-700">כיתה קיימת במאגר</span>
                              ) : autoCreateMissingClasses ? (
                                <span className="text-indigo-700">תיווצר אוטומטית בענן</span>
                              ) : (
                                <span className="text-red-600">לא תתווסף (לא קיימת)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="bg-white px-2.5 py-1 rounded-xl border border-slate-200 font-black text-xs">
                          {rows.length} תלמידים
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview of Students */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-black text-slate-800 text-xs">
                  <span>דוגמית תלמידים (ת.ז - שם משפחה + שם פרטי):</span>
                  <span>מציג {Math.min(parsedRows.length, 8)} מתוך {parsedRows.length}</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 scrollbar-thin">
                  {parsedRows.slice(0, 10).map((row, idx) => {
                    const isExisting = existingClassNames.has(row.targetClassName);
                    const formatted = `${row.tz} - ${row.lastName} ${row.firstName}`;
                    return (
                      <div
                        key={idx}
                        className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-slate-400 font-mono text-[10px]">
                            {idx + 1}.
                          </span>
                          <span className="text-slate-900 font-mono">{formatted}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 ${
                            isExisting
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          כיתה {row.targetClassName} {isExisting ? '✓ קיימת' : '✨ חדשה'}
                        </span>
                      </div>
                    );
                  })}
                  {parsedRows.length > 10 && (
                    <div className="text-center text-[11px] font-bold text-slate-400 py-1">
                      ועוד {parsedRows.length - 10} תלמידים...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-black transition-colors cursor-pointer"
          >
            ביטול
          </button>

          <button
            type="button"
            disabled={eligibleRows.length === 0}
            onClick={handleApply}
            className="px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>
              {eligibleRows.length > 0
                ? `אישור והוספת ${eligibleRows.length} תלמידים ל-${Object.keys(groupedAll).length} כיתות`
                : 'הדביקו או טענו רשימת תלמידים'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
