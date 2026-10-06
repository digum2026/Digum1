import React from 'react';
import { Layers, Download, Upload, RotateCcw, Plus, FileText, ShieldAlert, Cloud, CloudCheck, Loader2, LogOut } from 'lucide-react';

interface HeaderProps {
  totalClasses: number;
  totalStudents: number;
  totalOpenDigumNotes: number;
  isCloudSynced: boolean;
  isSyncing?: boolean;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenDocumentUpload: () => void;
  onScrollToAdd: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalClasses,
  totalStudents,
  totalOpenDigumNotes,
  isCloudSynced,
  isSyncing,
  onReset,
  onExport,
  onImport,
  onOpenDocumentUpload,
  onScrollToAdd,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand & Logo: Digum */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
            D
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight leading-none">
              Digum
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              ניהול הערות דיגום בית ספרי
            </span>

            {/* Cloud Sync Status Badge */}
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border transition-all ${
                isSyncing
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isCloudSynced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="סנכרון ענן פעיל - הנתונים נשמרים בענן ונגישים מכל מכשיר"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  <span>מסנכרן בענן...</span>
                </>
              ) : isCloudSynced ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ענן מסונכרן</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>מתחבר לענן...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action badges and controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stats Badges */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded font-black">
                {totalClasses}
              </span>
              <span className="hidden md:inline">כיתות</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black">
                {totalStudents}
              </span>
              <span className="hidden md:inline">תלמידים</span>
            </span>

            {totalOpenDigumNotes > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-amber-700 font-black">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>{totalOpenDigumNotes}</span>
                  <span className="hidden lg:inline">הערות דיגום</span>
                </span>
              </>
            )}
          </div>

          {/* PDF upload button */}
          <button
            onClick={onOpenDocumentUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="טעינת תלמידים מקובץ PDF או אקסל (משו״ב)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">טעינת PDF / משו״ב</span>
          </button>

          {/* Quick Add Button */}
          <button
            onClick={onScrollToAdd}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="הוספת כיתה חדשה"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>כיתה חדשה</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="איפוס וריקון המאגר"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export / Import options */}
          <button
            onClick={onExport}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            title="גיבוי וייצוא כל הנתונים כ-JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onImport}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            title="שחזור נתונים מגיבוי JSON"
          >
            <Upload className="w-4 h-4" />
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-all cursor-pointer active:scale-95 ml-1"
              title="יציאה ממסך הניהול וחזרה למסך הראשי"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">יציאת מנהל</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
