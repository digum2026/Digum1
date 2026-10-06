import React, { useState, useMemo } from 'react';
import {
  SchoolClass,
  Student,
  Grade,
  DigumCategory,
  DigumNote,
  SgReport,
  SgReportEntry,
  SG_INFRACTIONS,
} from '../types';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Plus,
  FileText,
  ShieldAlert,
  Sparkles,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  Trash2,
  Calendar,
  User,
  Check,
  BarChart3,
  Filter,
} from 'lucide-react';
import { GRADES } from '../constants/grades';

interface PublicHomeScreenProps {
  classes: SchoolClass[];
  sgReports?: SgReport[];
  isCloudSynced: boolean;
  onAdminLoginSuccess: () => void;
  onAddDigumNote: (
    classId: string,
    studentId: string,
    note: Omit<DigumNote, 'id' | 'createdAt'>
  ) => void;
  onToggleDigumStatus: (classId: string, studentId: string, noteId: string) => void;
  onSaveSgReport: (report: SgReport) => Promise<void>;
  onSaveDigumResponse: (
    classId: string,
    studentId: string,
    noteId: string,
    responseText: string,
    responderName?: string
  ) => Promise<void>;
}

const ADMIN_PASSWORD = '319491999Jk18';

// Grade display helpers - strictly WITHOUT parentheses in י"ג and י"ד
const GRADE_DISPLAY: Record<Grade, { label: string; fullTitle: string }> = {
  ט: { label: 'ט׳', fullTitle: 'שכבת ט׳' },
  י: { label: 'י׳', fullTitle: 'שכבת י׳' },
  יא: { label: 'י״א', fullTitle: 'שכבת י״א' },
  יב: { label: 'י״ב', fullTitle: 'שכבת י״ב' },
  יג: { label: 'י״ג', fullTitle: 'שכבת י״ג' },
  יד: { label: 'י״ד', fullTitle: 'שכבת י״ד' },
};

export const PublicHomeScreen: React.FC<PublicHomeScreenProps> = ({
  classes,
  sgReports = [],
  isCloudSynced,
  onAdminLoginSuccess,
  onAddDigumNote,
  onToggleDigumStatus,
  onSaveSgReport,
  onSaveDigumResponse,
}) => {
  // Navigation inside public screen:
  // 'home' | 'create-sg-report' | 'class-view' | 'grade-summary' | 'history'
  const [currentView, setCurrentView] = useState<
    'home' | 'create-sg-report' | 'class-view' | 'grade-summary' | 'history'
  >('home');

  // Selected grade/class for viewing notes in Home
  const [expandedGrade, setExpandedGrade] = useState<Grade | null>('י');
  const [activeViewingClassId, setActiveViewingClassId] = useState<string | null>(null);
  const [activeGradeSummary, setActiveGradeSummary] = useState<Grade | null>('י');
  const [gradeSummaryFilterClass, setGradeSummaryFilterClass] = useState<string>('ALL');
  const [gradeSummarySearch, setGradeSummarySearch] = useState<string>('');

  // History drill-down states
  const [historySelectedDate, setHistorySelectedDate] = useState<string | null>(null);
  const [historySelectedReport, setHistorySelectedReport] = useState<SgReport | null>(null);

  // Admin login modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- CREATE SG REPORT STATES ---
  const [dutyOfficerName, setDutyOfficerName] = useState('');
  const [reportGrade, setReportGrade] = useState<Grade>('י');
  const [reportEntries, setReportEntries] = useState<SgReportEntry[]>([]);
  const [isAddingStudentModalOpen, setIsAddingStudentModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // In modal "הוסף תלמיד לדו״ח ש״ג":
  const [selectedStudentForEntry, setSelectedStudentForEntry] = useState<Student | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedInfractions, setSelectedInfractions] = useState<string[]>([]);
  const [customInfractionNote, setCustomInfractionNote] = useState('');

  // --- DIRECT DIGUM NOTE MODAL STATES ("הערת דיגום" כתומה - מכלל בית הספר) ---
  const [isDirectDigumModalOpen, setIsDirectDigumModalOpen] = useState(false);
  const [directReporterName, setDirectReporterName] = useState('');
  const [directStudentSearch, setDirectStudentSearch] = useState('');
  const [directStudent, setDirectStudent] = useState<{ student: Student; cls: SchoolClass } | null>(null);
  const [directSelectedInfractions, setDirectSelectedInfractions] = useState<string[]>([]);
  const [directCustomNote, setDirectCustomNote] = useState('');
  const [isSubmittingDirectNote, setIsSubmittingDirectNote] = useState(false);

  // --- RESPONSE / FEEDBACK STATES ---
  const [respondingNoteId, setRespondingNoteId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responderName, setResponderName] = useState('');
  const [isSavingResponse, setIsSavingResponse] = useState(false);

  // Pool of all students in the selected report grade
  const studentsInReportGrade = useMemo(() => {
    const list: { student: Student; cls: SchoolClass }[] = [];
    classes
      .filter((c) => c.grade === reportGrade)
      .forEach((cls) => {
        cls.students.forEach((st) => {
          list.push({ student: st, cls });
        });
      });
    return list;
  }, [classes, reportGrade]);

  // Pool of all students across the entire school
  const allSchoolStudents = useMemo(() => {
    const list: { student: Student; cls: SchoolClass }[] = [];
    classes.forEach((cls) => {
      cls.students.forEach((st) => {
        list.push({ student: st, cls });
      });
    });
    return list;
  }, [classes]);

  // Active viewing class object
  const activeViewingClass = classes.find((c) => c.id === activeViewingClassId);

  // History grouped by unique date
  const reportsByDate = useMemo(() => {
    const map: Record<string, SgReport[]> = {};
    sgReports.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return Object.entries(map).sort(([d1], [d2]) => d2.localeCompare(d1));
  }, [sgReports]);

  // Reports for the selected history date
  const reportsForSelectedDate = useMemo(() => {
    if (!historySelectedDate) return [];
    return sgReports.filter((r) => r.date === historySelectedDate);
  }, [sgReports, historySelectedDate]);

  // All students with notes in the active summary grade
  const gradeSummaryStudents = useMemo(() => {
    if (!activeGradeSummary) return [];
    const list: { student: Student; cls: SchoolClass }[] = [];
    classes
      .filter((c) => c.grade === activeGradeSummary)
      .forEach((cls) => {
        cls.students.forEach((st) => {
          if (st.digumNotes && st.digumNotes.length > 0) {
            list.push({ student: st, cls });
          }
        });
      });
    return list;
  }, [classes, activeGradeSummary]);

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password === ADMIN_PASSWORD) {
      onAdminLoginSuccess();
    } else {
      setError('סיסמה שגויה, אנא נסה שנית.');
    }
  };

  // Toggle selection of infraction in SG report draft
  const handleToggleInfraction = (infraction: string) => {
    setSelectedInfractions((prev) =>
      prev.includes(infraction) ? prev.filter((i) => i !== infraction) : [...prev, infraction]
    );
  };

  // Toggle selection of infraction in Direct note modal
  const handleToggleDirectInfraction = (infraction: string) => {
    setDirectSelectedInfractions((prev) =>
      prev.includes(infraction) ? prev.filter((i) => i !== infraction) : [...prev, infraction]
    );
  };

  // Add student to current SG report draft
  const handleAddStudentToDraft = () => {
    if (!selectedStudentForEntry) return;

    if (selectedInfractions.length === 0) {
      alert('נא לבחור לפחות הערה אחת עבור התלמיד מהמאגר.');
      return;
    }

    const foundClass = classes.find((c) =>
      c.students.some((s) => s.id === selectedStudentForEntry.id)
    );
    if (!foundClass) return;

    const newEntry: SgReportEntry = {
      studentId: selectedStudentForEntry.id,
      studentTz: selectedStudentForEntry.tz,
      studentName: selectedStudentForEntry.fullName,
      classId: foundClass.id,
      className: foundClass.fullName,
      grade: reportGrade,
      infractions: [...selectedInfractions],
      customNote: customInfractionNote.trim() || undefined,
    };

    setReportEntries((prev) => [...prev, newEntry]);

    // Reset entry modal states
    setSelectedStudentForEntry(null);
    setStudentSearchTerm('');
    setSelectedInfractions([]);
    setCustomInfractionNote('');
    setIsAddingStudentModalOpen(false);
  };

  // Final Save of SG Report
  const handleFinalSaveReport = async () => {
    if (!dutyOfficerName.trim()) {
      alert('לא ניתן לשמור בלי לרשום את שם התורן!');
      return;
    }

    if (reportEntries.length === 0) {
      alert('יש להוסיף לפחות תלמיד אחד לדו״ח כדי לשמור.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const report: SgReport = {
        id: `sg-rep-${Date.now()}`,
        dutyOfficerName: dutyOfficerName.trim(),
        grade: reportGrade,
        date: today,
        createdAt: Date.now(),
        entries: reportEntries,
      };

      await onSaveSgReport(report);

      // Reset report states & navigate to home
      setReportEntries([]);
      setCurrentView('home');
      setExpandedGrade(reportGrade);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Submit direct digum note ("הערת דיגום" כתומה מכלל בית הספר)
  const handleSubmitDirectDigumNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directReporterName.trim()) {
      alert('נא להזין שם מדווח.');
      return;
    }
    if (!directStudent) {
      alert('נא לבחור תלמיד מתוך מאגר בית הספר.');
      return;
    }
    if (directSelectedInfractions.length === 0) {
      alert('נא לבחור לפחות הערת דיגום אחת מהמאגר.');
      return;
    }

    setIsSubmittingDirectNote(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      onAddDigumNote(directStudent.cls.id, directStudent.student.id, {
        studentId: directStudent.student.id,
        category: directSelectedInfractions[0] || 'הערת דיגום',
        note: directCustomNote.trim() || '',
        infractions: directSelectedInfractions,
        reportedBy: directReporterName.trim(),
        status: 'פתוח',
        date: today,
        sourceType: 'DIRECT',
      });

      // Switch to the student's class view immediately as requested
      setActiveViewingClassId(directStudent.cls.id);
      setCurrentView('class-view');

      // Close modal & reset
      setIsDirectDigumModalOpen(false);
      setDirectStudent(null);
      setDirectReporterName('');
      setDirectStudentSearch('');
      setDirectSelectedInfractions([]);
      setDirectCustomNote('');
    } finally {
      setIsSubmittingDirectNote(false);
    }
  };

  // Save response to a note
  const handleSaveResponse = async (classId: string, studentId: string, noteId: string) => {
    if (!responseText.trim()) return;

    setIsSavingResponse(true);
    try {
      await onSaveDigumResponse(
        classId,
        studentId,
        noteId,
        responseText.trim(),
        responderName.trim() || 'מחנך/מפקד'
      );
      setRespondingNoteId(null);
      setResponseText('');
    } finally {
      setIsSavingResponse(false);
    }
  };

  // Helper to render digum note nicely without duplicate category/note strings
  const renderNoteInfractions = (note: DigumNote) => {
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
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {displayInfractions.map((inf, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-white text-slate-800 border border-slate-200 shadow-2xs"
            >
              {inf}
            </span>
          ))}
        </div>
        {extraText && (
          <p className="text-xs font-bold text-slate-800 mt-1 mr-0.5">{extraText}</p>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-['Assistant',sans-serif]"
      dir="rtl"
    >
      {/* Top Header - Bistbash Aesthetic with "דיגום" and green pulse indicator */}
      <header className="bg-blue-600 text-white shadow-md py-3.5 px-4 sm:px-8 sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Logo & Title */}
          <div
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-black text-2xl shadow-inner">
              D
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none flex items-center gap-2">
                <span>דיגום</span>
                <span
                  className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"
                  title="מערכת פעילה ומסונכרנת בענן"
                />
              </h1>
              <span className="text-[11px] opacity-85 font-bold mt-1">
                מערכת דיגום ונוכחות ש״ג
              </span>
            </div>
          </div>

          {/* Top Admin Tab ("למעלה יש לשונית של כניסת מנהל") */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsLoginModalOpen(true);
                setError(null);
                setPassword('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs sm:text-sm font-black rounded-2xl border border-white/25 shadow-2xs transition-all cursor-pointer"
              title="כניסה למסך ניהול המערכת (למנהלים בלבד)"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>כניסת מנהל</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* VIEW 1: HOME SCREEN (Blue Button at Top + Grades & Classes Summary Below) */}
        {currentView === 'home' && (
          <div className="space-y-10 animate-in fade-in duration-200">
            {/* Top Action Section: Prominent Blue Button "צור דו״ח ש״ג" */}
            <div className="text-center space-y-4 pt-2">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    setCurrentView('create-sg-report');
                    setReportEntries([]);
                  }}
                  className="w-full max-w-md py-5 px-8 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xl sm:text-2xl rounded-[2.5rem] shadow-xl shadow-blue-300/50 hover:shadow-2xl hover:shadow-blue-300 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <FileText className="w-7 h-7 stroke-[2.5] group-hover:scale-110 transition-transform" />
                  <span>צור דו״ח ש״ג</span>
                </button>
                <p className="text-slate-400 text-xs font-bold mt-2">
                  לחיצה לפתיחת דו״ח ש״ג חדש והזנת הערות דיגום לפי שכבה
                </p>
              </div>
            </div>

            {/* Section Below Button: Grades list & Classes with notes to respond to */}
            <div className="space-y-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    שכבות וכיתות — מעקב והזנת תגובות
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    ההערות שנרשמו בדו״ח הש״ג או בדיווח היזום מרוכזות כאן. לחצו על כיתה או על הדוח המסכם כדי להזין תגובה.
                  </p>
                </div>
              </div>

              {/* Grades Tabs / Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {GRADES.map((grade) => {
                  const gradeClasses = classes.filter((c) => c.grade === grade);
                  const openNotesInGrade = gradeClasses.reduce(
                    (sum, c) =>
                      sum +
                      c.students.reduce(
                        (acc, s) =>
                          acc + (s.digumNotes?.filter((n) => n.status === 'פתוח').length || 0),
                        0
                      ),
                    0
                  );

                  const isExpanded = expandedGrade === grade;

                  return (
                    <button
                      key={grade}
                      onClick={() => setExpandedGrade(isExpanded ? null : grade)}
                      className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer relative shadow-xs ${
                        isExpanded
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {openNotesInGrade > 0 && (
                        <span
                          className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isExpanded ? 'bg-amber-400 text-amber-950' : 'bg-amber-500 text-white'
                          }`}
                        >
                          {openNotesInGrade}
                        </span>
                      )}

                      <span className="text-3xl font-black tracking-tight">
                        {GRADE_DISPLAY[grade].label}
                      </span>
                      <span className="text-xs font-bold mt-1 opacity-90">
                        {GRADE_DISPLAY[grade].fullTitle}
                      </span>
                      <span className="text-[10px] opacity-75 mt-0.5">
                        {gradeClasses.length} כיתות
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Classes in Expanded Grade (including Summary Card for the Grade!) */}
              {expandedGrade && (
                <div className="p-6 rounded-[2.5rem] bg-white border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-black text-slate-800 text-base">
                      כיתות ודוח מסכם — {GRADE_DISPLAY[expandedGrade].fullTitle}:
                    </h4>
                    <span className="text-xs font-bold text-slate-400">
                      בחרו כיתה ספציפית או את הדוח המסכם לצפייה בכל התלמידים ומענה
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {/* משבצת סיכום שכבתי לכל שכבה */}
                    <button
                      onClick={() => {
                        setActiveGradeSummary(expandedGrade);
                        setGradeSummaryFilterClass('ALL');
                        setGradeSummarySearch('');
                        setCurrentView('grade-summary');
                      }}
                      className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 text-white border-2 border-indigo-400 hover:border-indigo-300 transition-all flex flex-col items-center justify-center cursor-pointer group shadow-sm active:scale-95 col-span-2 sm:col-span-1 relative overflow-hidden"
                    >
                      <BarChart3 className="w-6 h-6 mb-1 text-blue-200 group-hover:scale-110 transition-transform" />
                      <span className="text-base font-black tracking-tight text-center">
                        דוח מסכם
                      </span>
                      <span className="text-[11px] font-bold text-blue-100 mt-0.5 text-center">
                        כל כיתות {GRADE_DISPLAY[expandedGrade].label}
                      </span>
                      <span className="mt-1 px-2 py-0.2 bg-white/20 rounded text-[10px] font-mono font-bold">
                        צפייה מרוכזת ומענה
                      </span>
                    </button>

                    {/* Class Buttons */}
                    {classes
                      .filter((c) => c.grade === expandedGrade)
                      .sort((a, b) => a.number - b.number)
                      .map((cls) => {
                        const openNotes = cls.students.reduce(
                          (sum, s) =>
                            sum +
                            (s.digumNotes?.filter((n) => n.status === 'פתוח').length || 0),
                          0
                        );

                        return (
                          <button
                            key={cls.id}
                            onClick={() => {
                              setActiveViewingClassId(cls.id);
                              setCurrentView('class-view');
                            }}
                            className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border-2 border-slate-200 hover:border-blue-600 transition-all flex flex-col items-center justify-center cursor-pointer group relative shadow-2xs active:scale-95"
                          >
                            {openNotes > 0 && (
                              <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                {openNotes}
                              </span>
                            )}
                            <span className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                              {cls.fullName}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 mt-1">
                              {cls.students.length} תלמידים
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Buttons: היסטוריית דיווחים (צפייה בלבד) ומתחתיו "הערת דיגום" (כתומה) */}
            <div className="flex flex-col items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setHistorySelectedDate(null);
                  setHistorySelectedReport(null);
                  setCurrentView('history');
                }}
                className="w-full max-w-sm flex items-center justify-center gap-3 px-8 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95 cursor-pointer font-black text-sm sm:text-base"
              >
                <Clock className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                <span>היסטוריית דיווחים (צפייה בלבד)</span>
              </button>

              {/* כפתור כתום: הערת דיגום (פותח פופ-אפ עם בחירת תלמיד מכל בית הספר ומדווח) */}
              <button
                onClick={() => {
                  setIsDirectDigumModalOpen(true);
                  setDirectStudent(null);
                  setDirectReporterName('');
                  setDirectStudentSearch('');
                  setDirectSelectedInfractions([]);
                  setDirectCustomNote('');
                }}
                className="w-full max-w-sm flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-orange-200/80 hover:shadow-xl transition-all cursor-pointer"
              >
                <AlertTriangle className="w-5 h-5 text-white" />
                <span>הערת דיגום</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CREATE SG REPORT ("צור דו״ח ש״ג") */}
        {currentView === 'create-sg-report' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 transition-all active:scale-90 cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-black"
              >
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                <span>חזרה לדף הבית</span>
              </button>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <span>יצירת דו״ח ש״ג</span>
              </h2>
            </div>

            {/* Top Duty Officer Name (שם התורן - חובה!) */}
            <div className="p-6 rounded-[2rem] bg-white border-2 border-blue-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>שם התורן המדווח:</span>
                  <span className="text-red-500 text-xs font-black">* (חובה למילוי)</span>
                </label>
                {!dutyOfficerName.trim() && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                    לא ניתן לשמור דו״ח ללא שם תורן
                  </span>
                )}
              </div>
              <input
                type="text"
                value={dutyOfficerName}
                onChange={(e) => setDutyOfficerName(e.target.value)}
                placeholder="הזינו כאן את שם התורן המדווח בש״ג (לדוגמה: ישראל ישראלי)..."
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Select Grade for Report */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700">
                בחרו את השכבה שאתם בודקים:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {GRADES.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => {
                      setReportGrade(grade);
                      setSelectedStudentForEntry(null);
                    }}
                    className={`py-3 px-2 rounded-2xl font-black text-sm transition-all border cursor-pointer ${
                      reportGrade === grade
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{GRADE_DISPLAY[grade].label}</span>
                    <span className="block text-[10px] opacity-80">
                      {GRADE_DISPLAY[grade].fullTitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Student Section */}
            <div className="p-6 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    רשימת תלמידים בדו״ח הנוכחי ({reportEntries.length})
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    שכבה נבחרת: <strong>{GRADE_DISPLAY[reportGrade].fullTitle}</strong> ({studentsInReportGrade.length} תלמידים במאגר)
                  </p>
                </div>

                {/* The "הוסף" Button */}
                <button
                  type="button"
                  onClick={() => setIsAddingStudentModalOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>הוסף תלמיד לדו״ח</span>
                </button>
              </div>

              {/* Table / List of added students in current report */}
              {reportEntries.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                  {reportEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs font-bold"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[11px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-black text-slate-900 text-sm">
                            {entry.studentName}
                          </div>
                          <div className="text-slate-500 font-mono text-[11px]">
                            ת.ז: {entry.studentTz} | כיתה: {entry.className}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 max-w-md justify-end">
                        {entry.infractions.map((inf) => (
                          <span
                            key={inf}
                            className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg text-[11px] font-black"
                          >
                            {inf}
                          </span>
                        ))}
                        {entry.customNote && (
                          <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg text-[11px]">
                            {entry.customNote}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setReportEntries((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="הסר תלמיד מהדו״ח"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <p className="font-bold text-sm">
                    עדיין לא נוספו תלמידים לדו״ח ש״ג זה.
                  </p>
                  <p className="text-xs">
                    לחצו על כפתור <strong>"הוסף תלמיד לדו״ח"</strong> למעלה כדי לבחור תלמיד ולסמן לו הערות.
                  </p>
                </div>
              )}
            </div>

            {/* Final Save Button */}
            <div className="pt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleFinalSaveReport}
                disabled={isSubmittingReport || !dutyOfficerName.trim() || reportEntries.length === 0}
                className="w-full max-w-md py-4 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-black text-lg rounded-[2rem] shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {isSubmittingReport
                    ? 'שומר בענן...'
                    : `כפתור שמירה סופי (${reportEntries.length} תלמידים)`}
                </span>
              </button>

              {!dutyOfficerName.trim() && (
                <span className="text-xs font-bold text-red-600">
                  * יש להזין את שם התורן למעלה לפני ביצוע שמירה סופית
                </span>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: CLASS VIEW - REVIEWS & RESPONSES TO NOTES */}
        {currentView === 'class-view' && activeViewingClass && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('home')}
                  className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 transition-all active:scale-90 cursor-pointer shadow-2xs"
                >
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>הערות דיגום — כיתה {activeViewingClass.fullName}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {activeViewingClass.students.length} תלמידים
                    </span>
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    צפו בהערות שנרשמו בדו״ח הש״ג או בדיווח היזום, רשמו עליהן תגובת טיפול ושמרו בענן.
                  </p>
                </div>
              </div>
            </div>

            {/* Students with Notes */}
            {activeViewingClass.students.filter((s) => s.digumNotes && s.digumNotes.length > 0).length > 0 ? (
              <div className="space-y-4">
                {activeViewingClass.students
                  .filter((s) => s.digumNotes && s.digumNotes.length > 0)
                  .map((student) => {
                    const openCount = student.digumNotes.filter((n) => n.status === 'פתוח').length;

                    return (
                      <div
                        key={student.id}
                        className="p-5 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <h4 className="font-black text-base text-slate-900">
                              {student.displayFormat}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400">
                              ת.ז: {student.tz}
                            </span>
                          </div>
                          {/* Total Digum Notes Count for Student */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                openCount > 0
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}
                            >
                              סה״כ הערות: {student.digumNotes.length} ({openCount} פתוחות)
                            </span>
                          </div>
                        </div>

                        {/* Notes list */}
                        <div className="space-y-3">
                          {student.digumNotes.map((note) => {
                            const isResponding = respondingNoteId === note.id;
                            const isDirect = note.sourceType === 'DIRECT';

                            return (
                              <div
                                key={note.id}
                                className={`p-4 rounded-2xl border transition-all ${
                                  isDirect
                                    ? 'bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-white border-2 border-orange-300 ring-1 ring-orange-200/60 shadow-xs'
                                    : note.status === 'פתוח'
                                    ? 'bg-amber-50/50 border-amber-200'
                                    : 'bg-emerald-50/50 border-emerald-200'
                                } space-y-3`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Distinct Badge based on origin */}
                                      {isDirect ? (
                                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-orange-500 text-white shadow-2xs flex items-center gap-1">
                                          <AlertTriangle className="w-3.5 h-3.5 text-white" />
                                          <span>הערת דיגום יזומה</span>
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                                          דו״ח ש״ג
                                        </span>
                                      )}

                                      {note.reportedBy && (
                                        <span
                                          className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                                            isDirect
                                              ? 'text-orange-950 bg-white/90 border-orange-200'
                                              : 'text-slate-600 bg-white border-slate-200'
                                          }`}
                                        >
                                          {isDirect ? 'מדווח: ' : 'תורן מדווח: '}
                                          <strong>{note.reportedBy}</strong>
                                        </span>
                                      )}
                                      <span className="text-xs font-semibold text-slate-400">
                                        תאריך: {note.date}
                                      </span>
                                    </div>

                                    {/* Clean infractions rendering without duplicate text */}
                                    {renderNoteInfractions(note)}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleDigumStatus(activeViewingClass.id, student.id, note.id)
                                    }
                                    className={`text-[11px] font-black px-2.5 py-1 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                                      note.status === 'פתוח'
                                        ? 'bg-amber-200 text-amber-950 border-amber-300'
                                        : 'bg-emerald-200 text-emerald-950 border-emerald-300'
                                    }`}
                                    title="שנה סטטוס"
                                  >
                                    {note.status === 'פתוח' ? '⚠️ סטטוס: פתוח' : '✓ סטטוס: טופל'}
                                  </button>
                                </div>

                                {/* Response Area */}
                                {note.response ? (
                                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900 space-y-1">
                                    <div className="flex items-center justify-between text-[11px] text-emerald-700">
                                      <span>
                                        תגובת טיפול (נרשמה ע״י: {note.respondedBy || 'מחנך/מפקד'}):
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRespondingNoteId(note.id);
                                          setResponseText(note.response || '');
                                          setResponderName(note.respondedBy || '');
                                        }}
                                        className="text-blue-600 hover:underline cursor-pointer"
                                      >
                                        ערוך תגובה
                                      </button>
                                    </div>
                                    <p className="text-slate-900">{note.response}</p>
                                  </div>
                                ) : (
                                  !isResponding && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRespondingNoteId(note.id);
                                        setResponseText('');
                                        setResponderName('');
                                      }}
                                      className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>רשום תגובה להערה זו</span>
                                    </button>
                                  )
                                )}

                                {/* Response Input Box when active */}
                                {isResponding && (
                                  <div className="p-3 bg-white rounded-2xl border-2 border-blue-300 space-y-2 animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-black text-slate-800">
                                        רישום תגובה / טיפול בהערת הדיגום:
                                      </label>
                                      <input
                                        type="text"
                                        value={responderName}
                                        onChange={(e) => setResponderName(e.target.value)}
                                        placeholder="שם המגיב (מחנך/מפקד)..."
                                        className="text-xs px-2 py-1 border border-slate-200 rounded-lg outline-none"
                                      />
                                    </div>
                                    <textarea
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      placeholder="פרטו את תגובתכם והטיפול שבוצע (למשל: נשלח להסתפר, הנושא טופל מול החניך)..."
                                      rows={2}
                                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-600 bg-slate-50"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setRespondingNoteId(null)}
                                        className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                                      >
                                        ביטול
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSaveResponse(
                                            activeViewingClass.id,
                                            student.id,
                                            note.id
                                          )
                                        }
                                        disabled={isSavingResponse || !responseText.trim()}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                      >
                                        <Send className="w-3 h-3" />
                                        <span>שמור תגובה בענן</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-[2.5rem] border border-slate-200 space-y-2">
                <p className="text-slate-600 font-black text-base">
                  אין הערות דיגום רשומות לתלמידי כיתה {activeViewingClass.fullName}.
                </p>
                <p className="text-slate-400 text-xs">
                  הערות שיוזנו בדו״ח הש״ג או בדיווח היזום יופיעו כאן לצורך מענה וטיפול.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: GRADE SUMMARY REPORT */}
        {currentView === 'grade-summary' && activeGradeSummary && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('home')}
                  className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 transition-all active:scale-90 cursor-pointer shadow-2xs"
                >
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <span>דוח מסכם שכבתי — {GRADE_DISPLAY[activeGradeSummary].fullTitle}</span>
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    ריכוז כלל התלמידים עם הערות דיגום בכל כיתות השכבה, כולל אפשרות למענה ישיר ועדכון סטטוס.
                  </p>
                </div>
              </div>

              {/* Class Filter pills inside summary */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setGradeSummaryFilterClass('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    gradeSummaryFilterClass === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  כל הכיתות
                </button>
                {classes
                  .filter((c) => c.grade === activeGradeSummary)
                  .sort((a, b) => a.number - b.number)
                  .map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setGradeSummaryFilterClass(cls.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        gradeSummaryFilterClass === cls.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cls.fullName}
                    </button>
                  ))}
              </div>
            </div>

            {/* Search Bar for Summary View */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gradeSummarySearch}
                onChange={(e) => setGradeSummarySearch(e.target.value)}
                placeholder="חיפוש תלמיד לפי ת.ז, שם או כיתה בתוך הדוח המסכם..."
                className="w-full pr-11 pl-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            {/* List of All Students across classes in this grade */}
            {gradeSummaryStudents
              .filter(({ student, cls }) => {
                if (gradeSummaryFilterClass !== 'ALL' && cls.id !== gradeSummaryFilterClass) {
                  return false;
                }
                const q = gradeSummarySearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  student.fullName.toLowerCase().includes(q) ||
                  student.tz.includes(q) ||
                  cls.fullName.toLowerCase().includes(q)
                );
              }).length > 0 ? (
              <div className="space-y-4">
                {gradeSummaryStudents
                  .filter(({ student, cls }) => {
                    if (gradeSummaryFilterClass !== 'ALL' && cls.id !== gradeSummaryFilterClass) {
                      return false;
                    }
                    const q = gradeSummarySearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      student.fullName.toLowerCase().includes(q) ||
                      student.tz.includes(q) ||
                      cls.fullName.toLowerCase().includes(q)
                    );
                  })
                  .map(({ student, cls }) => {
                    const openCount = student.digumNotes.filter((n) => n.status === 'פתוח').length;

                    return (
                      <div
                        key={student.id}
                        className="p-5 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg font-black text-xs">
                              כיתה {cls.fullName}
                            </span>
                            <h4 className="font-black text-base text-slate-900">
                              {student.displayFormat}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400">
                              (ת.ז: {student.tz})
                            </span>
                          </div>

                          {/* Student Total Notes Badge */}
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-full ${
                              openCount > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            סה״כ הערות: {student.digumNotes.length} ({openCount} פתוחות)
                          </span>
                        </div>

                        {/* Notes with full response ability */}
                        <div className="space-y-3">
                          {student.digumNotes.map((note) => {
                            const isResponding = respondingNoteId === note.id;
                            const isDirect = note.sourceType === 'DIRECT';

                            return (
                              <div
                                key={note.id}
                                className={`p-4 rounded-2xl border transition-all ${
                                  isDirect
                                    ? 'bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-white border-2 border-orange-300 ring-1 ring-orange-200/60 shadow-xs'
                                    : note.status === 'פתוח'
                                    ? 'bg-amber-50/50 border-amber-200'
                                    : 'bg-emerald-50/50 border-emerald-200'
                                } space-y-3`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Distinct Badge based on origin */}
                                      {isDirect ? (
                                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-orange-500 text-white shadow-2xs flex items-center gap-1">
                                          <AlertTriangle className="w-3.5 h-3.5 text-white" />
                                          <span>הערת דיגום יזומה</span>
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                                          דו״ח ש״ג
                                        </span>
                                      )}

                                      {note.reportedBy && (
                                        <span
                                          className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                                            isDirect
                                              ? 'text-orange-950 bg-white/90 border-orange-200'
                                              : 'text-slate-600 bg-white border-slate-200'
                                          }`}
                                        >
                                          {isDirect ? 'מדווח: ' : 'תורן מדווח: '}
                                          <strong>{note.reportedBy}</strong>
                                        </span>
                                      )}
                                      <span className="text-xs font-semibold text-slate-400">
                                        תאריך: {note.date}
                                      </span>
                                    </div>

                                    {/* Clean infractions without duplicate */}
                                    {renderNoteInfractions(note)}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleDigumStatus(cls.id, student.id, note.id)
                                    }
                                    className={`text-[11px] font-black px-2.5 py-1 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                                      note.status === 'פתוח'
                                        ? 'bg-amber-200 text-amber-950 border-amber-300'
                                        : 'bg-emerald-200 text-emerald-950 border-emerald-300'
                                    }`}
                                  >
                                    {note.status === 'פתוח' ? '⚠️ סטטוס: פתוח' : '✓ סטטוס: טופל'}
                                  </button>
                                </div>

                                {/* Response Area */}
                                {note.response ? (
                                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900 space-y-1">
                                    <div className="flex items-center justify-between text-[11px] text-emerald-700">
                                      <span>
                                        תגובת טיפול (נרשמה ע״י: {note.respondedBy || 'מחנך/מפקד'}):
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRespondingNoteId(note.id);
                                          setResponseText(note.response || '');
                                          setResponderName(note.respondedBy || '');
                                        }}
                                        className="text-blue-600 hover:underline cursor-pointer"
                                      >
                                        ערוך תגובה
                                      </button>
                                    </div>
                                    <p className="text-slate-900">{note.response}</p>
                                  </div>
                                ) : (
                                  !isResponding && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRespondingNoteId(note.id);
                                        setResponseText('');
                                        setResponderName('');
                                      }}
                                      className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>רשום תגובה להערה זו</span>
                                    </button>
                                  )
                                )}

                                {/* Response Input Box when active */}
                                {isResponding && (
                                  <div className="p-3 bg-white rounded-2xl border-2 border-blue-300 space-y-2 animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-black text-slate-800">
                                        רישום תגובה / טיפול בהערת הדיגום:
                                      </label>
                                      <input
                                        type="text"
                                        value={responderName}
                                        onChange={(e) => setResponderName(e.target.value)}
                                        placeholder="שם המגיב (מחנך/מפקד)..."
                                        className="text-xs px-2 py-1 border border-slate-200 rounded-lg outline-none"
                                      />
                                    </div>
                                    <textarea
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      placeholder="פרטו את תגובתכם והטיפול שבוצע..."
                                      rows={2}
                                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-600 bg-slate-50"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setRespondingNoteId(null)}
                                        className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                                      >
                                        ביטול
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSaveResponse(
                                            cls.id,
                                            student.id,
                                            note.id
                                          )
                                        }
                                        disabled={isSavingResponse || !responseText.trim()}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                      >
                                        <Send className="w-3 h-3" />
                                        <span>שמור תגובה בענן</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-[2.5rem] border border-slate-200 space-y-2">
                <p className="text-slate-600 font-black text-base">
                  אין הערות דיגום לתלמידים בשכבת {GRADE_DISPLAY[activeGradeSummary].fullTitle}.
                </p>
                <p className="text-slate-400 text-xs">
                  הערות שיוזנו בדו״חות הש״ג או בדיווחים היזומים יופיעו כאן בצורה מרוכזת.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: REPORT HISTORY (Dates -> Reports -> Report Details with Responses) */}
        {currentView === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* LEVEL 1: List of Dates */}
            {historySelectedDate === null && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setCurrentView('home')}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 transition-colors active:scale-90 cursor-pointer"
                    title="חזרה לדף הבית"
                  >
                    <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>

                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                  היסטוריית דיווחים
                </h2>
                <p className="text-slate-500 font-bold mb-6">
                  בחר תאריך לצפייה בדיווחים שהיו באותו היום:
                </p>

                {reportsByDate.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reportsByDate.map(([date, reportsList]) => {
                      const totalStudentsInDate = reportsList.reduce(
                        (sum, r) => sum + r.entries.length,
                        0
                      );

                      return (
                        <button
                          key={date}
                          onClick={() => setHistorySelectedDate(date)}
                          className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 hover:border-blue-600 text-right transition-all shadow-sm active:scale-95 group cursor-pointer space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <span>תאריך: {date}</span>
                            </span>
                            <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                              {reportsList.length} דוחות ש״ג
                            </span>
                            <span>•</span>
                            <span>{totalStudentsInDate} תלמידים דווחו</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-2xs">
                      <p className="text-slate-400 font-black text-base">
                        אין היסטוריית דיווחים קיימת
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        דיווחים שיושלמו בש״ג יישמרו ויופיעו כאן לפי תאריך.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LEVEL 2: Reports list for the selected Date */}
            {historySelectedDate !== null && historySelectedReport === null && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setHistorySelectedDate(null)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 transition-colors active:scale-90 cursor-pointer flex items-center gap-2 text-xs font-black"
                  >
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    <span>חזרה לרשימת התאריכים</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    תאריך נבחר: {historySelectedDate}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                  דוחות ש״ג לתאריך {historySelectedDate}
                </h2>
                <p className="text-slate-500 font-bold text-xs sm:text-sm">
                  לחצו על דו״ח כדי לקבל פירוט מלא של ההערות והתגובות שנרשמו:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reportsForSelectedDate.map((rep) => (
                    <button
                      key={rep.id}
                      onClick={() => setHistorySelectedReport(rep)}
                      className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 hover:border-blue-600 text-right transition-all shadow-sm active:scale-95 group cursor-pointer space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900 group-hover:text-blue-600">
                            תורן: {rep.dutyOfficerName}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                          {GRADE_DISPLAY[rep.grade]?.fullTitle || `שכבת ${rep.grade}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1 border-t border-slate-100">
                        <span>{rep.entries.length} תלמידים בדו״ח</span>
                        <div className="flex items-center gap-1 text-blue-600 group-hover:underline">
                          <span>צפה בפירוט</span>
                          <ChevronLeft className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* LEVEL 3: Report Details with Infractions and Responses */}
            {historySelectedReport !== null && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <button
                    onClick={() => setHistorySelectedReport(null)}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 transition-all active:scale-90 cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-black"
                  >
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    <span>חזרה לדוחות של תאריך {historySelectedReport.date}</span>
                  </button>

                  <div className="text-left">
                    <span className="text-xs font-black text-slate-400 block">
                      תאריך דיווח: {historySelectedReport.date}
                    </span>
                  </div>
                </div>

                {/* Report Info Card */}
                <div className="p-6 rounded-[2.5rem] bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-2xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        דו״ח ש״ג — {GRADE_DISPLAY[historySelectedReport.grade]?.fullTitle || `שכבת ${historySelectedReport.grade}`}
                      </h3>
                      <p className="text-xs font-bold text-slate-600 mt-1">
                        תורן מדווח: <strong>{historySelectedReport.dutyOfficerName}</strong>
                      </p>
                    </div>

                    <div className="px-4 py-2 bg-white rounded-2xl border border-blue-200 shadow-2xs text-xs font-black text-blue-900">
                      {historySelectedReport.entries.length} תלמידים נכללו בדו״ח
                    </div>
                  </div>
                </div>

                {/* Detailed Entries List */}
                <div className="space-y-3">
                  <h4 className="font-black text-slate-800 text-sm">
                    פירוט התלמידים, ההערות והתגובות:
                  </h4>

                  {historySelectedReport.entries.map((entry, idx) => {
                    const targetClass = classes.find((c) => c.id === entry.classId);
                    const targetStudent = targetClass?.students.find((s) => s.id === entry.studentId);
                    const matchingNotes = targetStudent?.digumNotes?.filter(
                      (n) => n.reportedBy === historySelectedReport.dutyOfficerName || n.date === historySelectedReport.date
                    );

                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-xs">
                              כיתה {entry.className}
                            </span>
                            <span className="font-black text-base text-slate-900">
                              {entry.studentName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              (ת.ז: {entry.studentTz})
                            </span>
                          </div>

                          {targetStudent && (
                            <span className="text-xs font-bold text-slate-500">
                              סה״כ הערות במערכת: {targetStudent.digumNotes?.length || 0}
                            </span>
                          )}
                        </div>

                        {/* Infractions Badges without duplicates */}
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-slate-500">
                            הערות שסומנו בש״ג:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.infractions.map((inf, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300"
                              >
                                {inf}
                              </span>
                            ))}
                          </div>
                          {entry.customNote && (
                            <p className="text-xs font-bold text-slate-800 mt-1">
                              הערה נוספת: {entry.customNote}
                            </p>
                          )}
                        </div>

                        {/* Responses from teachers / commanders */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <div className="text-xs font-bold text-slate-500">
                            סטטוס ותגובות שנרשמו:
                          </div>

                          {matchingNotes && matchingNotes.length > 0 ? (
                            matchingNotes.map((note) => (
                              <div key={note.id} className="space-y-1">
                                {note.response ? (
                                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between text-[11px] text-emerald-700">
                                      <span>
                                        תגובה מאת: <strong>{note.respondedBy || 'מחנך/מפקד'}</strong>
                                      </span>
                                      <span className="text-emerald-600">✓ טופל</span>
                                    </div>
                                    <p className="text-slate-900 font-semibold">{note.response}</p>
                                  </div>
                                ) : (
                                  <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-between">
                                    <span>ממתין לתגובת טיפול של מחנך/מפקד הכיתה</span>
                                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black">
                                      סטטוס פתוח
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold">
                              טרם עודכנה תגובה במערכת.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: DIRECT DIGUM NOTE ("הערת דיגום" כתומה - מכלל בית הספר) */}
      {isDirectDigumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    רישום הערת דיגום
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    דיווח יזום עבור תלמיד מכלל בית הספר
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDirectDigumModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitDirectDigumNote} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              {/* 1. שם המדווח */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800">
                  שם המדווח: <span className="text-red-500">* (חובה)</span>
                </label>
                <input
                  type="text"
                  value={directReporterName}
                  onChange={(e) => setDirectReporterName(e.target.value)}
                  placeholder="הזינו את שמכם המלא (לדוגמה: רס״ר יוסף / מפקד תורן)..."
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* 2. בחירת תלמיד מכל רשימת התלמידים בבית הספר */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  בחירת תלמיד ממאגר בית הספר ({allSchoolStudents.length} תלמידים): <span className="text-red-500">* (חובה)</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={directStudentSearch}
                    onChange={(e) => setDirectStudentSearch(e.target.value)}
                    placeholder="חיפוש לפי שם, משפחה או ת.ז מכלל כיתות בית הספר..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-500"
                  />
                </div>

                {/* Results List */}
                <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-2xl border border-slate-200 scrollbar-thin">
                  {allSchoolStudents
                    .filter(({ student, cls }) => {
                      const q = directStudentSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        student.fullName.toLowerCase().includes(q) ||
                        student.tz.includes(q) ||
                        cls.fullName.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 25)
                    .map(({ student, cls }) => {
                      const isSelected = directStudent?.student.id === student.id;

                      return (
                        <div
                          key={student.id}
                          onClick={() => setDirectStudent({ student, cls })}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${
                            isSelected
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'bg-white hover:bg-orange-50/60 text-slate-800 border border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{student.fullName}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              ת.ז: {student.tz}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                              isSelected ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            כיתה {cls.fullName} ({GRADE_DISPLAY[cls.grade]?.label || cls.grade})
                          </span>
                        </div>
                      );
                    })}

                  {allSchoolStudents.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      אין תלמידים במאגר בית הספר.
                    </div>
                  )}
                </div>

                {directStudent && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>
                        נבחר: {directStudent.student.fullName} (כיתה {directStudent.cls.fullName})
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      ת.ז: {directStudent.student.tz}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. בחירת הערות דיגום מהמאגר */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800">
                    בחירת הערות דיגום: <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-orange-600">
                    {directSelectedInfractions.length} נבחרו
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SG_INFRACTIONS.map((infraction) => {
                    const isSelected = directSelectedInfractions.includes(infraction);

                    return (
                      <button
                        key={infraction}
                        type="button"
                        onClick={() => handleToggleDirectInfraction(infraction)}
                        className={`p-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{infraction}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Free Text Input if "אחר (טקסט חופשי)" is selected */}
                {directSelectedInfractions.includes('אחר (טקסט חופשי)') && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="block text-[11px] font-black text-slate-600 mb-1">
                      פרטו את ההערה הנוספת:
                    </label>
                    <input
                      type="text"
                      value={directCustomNote}
                      onChange={(e) => setDirectCustomNote(e.target.value)}
                      placeholder="פירוט הערת דיגום חופשית..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-orange-500 bg-slate-50"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDirectDigumModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-black cursor-pointer"
                >
                  ביטול
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmittingDirectNote ||
                    !directReporterName.trim() ||
                    !directStudent ||
                    directSelectedInfractions.length === 0
                  }
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingDirectNote ? 'שולח...' : 'שליחת הערת דיגום'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT INFRACTION IN SG REPORT */}
      {isAddingStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  הוספת תלמיד לדו״ח ש״ג — {GRADE_DISPLAY[reportGrade].fullTitle}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  בחרו תלמיד ממאגר השמות בשכבה וסמנו את הערות הדיגום הרלוונטיות
                </p>
              </div>
              <button
                onClick={() => setIsAddingStudentModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* 1. Select student from pool of names in grade */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700">
                  1. בחירת תלמיד ממאגר השמות בשכבת {GRADE_DISPLAY[reportGrade].label}:
                </label>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="הקלידו שם או ת.ז לחיפוש מהיר במאגר..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                  />
                </div>

                {/* Results List */}
                <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-2xl border border-slate-200 scrollbar-thin">
                  {studentsInReportGrade
                    .filter(({ student }) => {
                      const q = studentSearchTerm.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        student.fullName.toLowerCase().includes(q) ||
                        student.tz.includes(q)
                      );
                    })
                    .slice(0, 15)
                    .map(({ student, cls }) => {
                      const isSelected = selectedStudentForEntry?.id === student.id;

                      return (
                        <div
                          key={student.id}
                          onClick={() => setSelectedStudentForEntry(student)}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{student.fullName}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              ת.ז: {student.tz}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                              isSelected ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            כיתה {cls.fullName}
                          </span>
                        </div>
                      );
                    })}

                  {studentsInReportGrade.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      אין תלמידים רשומים בשכבה זו במאגר.
                    </div>
                  )}
                </div>

                {selectedStudentForEntry && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>
                      נבחר: {selectedStudentForEntry.fullName} (ת.ז: {selectedStudentForEntry.tz})
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Select Infractions from exact specified pool */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700">
                    2. בחירת הערות דיגום עבור התלמיד (ניתן לסמן מספר הערות):
                  </label>
                  <span className="text-[11px] font-bold text-blue-600">
                    {selectedInfractions.length} נבחרו
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SG_INFRACTIONS.map((infraction) => {
                    const isSelected = selectedInfractions.includes(infraction);

                    return (
                      <button
                        key={infraction}
                        type="button"
                        onClick={() => handleToggleInfraction(infraction)}
                        className={`p-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{infraction}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Free Text Input if "אחר (טקסט חופשי)" is selected */}
                {selectedInfractions.includes('אחר (טקסט חופשי)') && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="block text-[11px] font-black text-slate-600 mb-1">
                      פרטו את ההערה הנוספת:
                    </label>
                    <input
                      type="text"
                      value={customInfractionNote}
                      onChange={(e) => setCustomInfractionNote(e.target.value)}
                      placeholder="פירוט הערת דיגום חופשית..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-blue-600 bg-slate-50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsAddingStudentModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-black cursor-pointer"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={handleAddStudentToDraft}
                disabled={!selectedStudentForEntry || selectedInfractions.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>הוסף תלמיד זה לדו״ח</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">כניסת מנהל</h3>
                  <p className="text-[11px] font-bold text-slate-400">
                    הזינו סיסמת כניסה למסך הניהול
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Password Form */}
            <form onSubmit={handleAdminLoginSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  סיסמת מנהל:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    placeholder="הזינו סיסמה..."
                    className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 text-sm font-mono font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center animate-in shake">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-black transition-colors cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>כניסה למסך ניהול</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
