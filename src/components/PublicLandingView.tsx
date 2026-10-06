import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowLeft, Cloud, X } from 'lucide-react';

interface PublicLandingViewProps {
  onLoginSuccess: () => void;
  isCloudSynced: boolean;
}

const ADMIN_PASSWORD = '319491999Jk18';

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  onLoginSuccess,
  isCloudSynced,
}) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password === ADMIN_PASSWORD) {
      onLoginSuccess();
    } else {
      setError('סיסמה שגויה, אנא נסה שנית.');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-['Assistant',sans-serif]"
      dir="rtl"
    >
      {/* Top Navigation Bar with the Admin Login Tab as requested */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-blue-600 tracking-tight leading-none">
                  Digum
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  מערכת דיגום
                </span>
              </div>
            </div>
          </div>

          {/* Top Admin Login Tab (לשונית כניסת מנהל למעלה) */}
          <div className="flex items-center gap-3">
            {isCloudSynced && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>ענן מחובר</span>
              </div>
            )}

            <button
              onClick={() => {
                setIsLoginModalOpen(true);
                setError(null);
                setPassword('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-black rounded-2xl shadow-sm transition-all cursor-pointer border border-blue-500"
              title="כניסה למערכת ניהול כיתות ותלמידים"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>כניסת מנהל</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Empty / Clean Screen Body (מסך ריק ונקי עם הנחיה) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center">
        <div className="max-w-md w-full space-y-6 animate-in fade-in duration-300">
          {/* Minimalist Icon Badge */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shadow-xs">
            <Lock className="w-9 h-9 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              מערכת ניהול Digum
            </h2>
            <p className="text-slate-500 font-semibold text-sm leading-relaxed">
              הגישה לניהול הכיתות, רשימות התלמידים ומעקב הדיגום מוגנת ומיועדת למנהל המערכת בלבד.
            </p>
          </div>

          {/* Quick Access Card */}
          <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-4 text-center">
            <div className="text-xs font-bold text-slate-600">
              למעבר למסך הניהול לחצו על הלשונית למעלה או על הכפתור:
            </div>

            <button
              onClick={() => {
                setIsLoginModalOpen(true);
                setError(null);
                setPassword('');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>כניסת מנהל למערכת</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs font-bold text-slate-400">
        <span>Digum — ניהול כיתות, תלמידים והערות דיגום</span>
      </footer>

      {/* Admin Password Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
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
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
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
                  <span>כניסה</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
