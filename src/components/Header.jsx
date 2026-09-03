import React from 'react';
import { Globe, BookOpen, Receipt, UserCheck, ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { GanpatiLogo } from './GanpatiLogo';

export function Header({ lang, setLang, isOnline, activeTab, setActiveTab, user, onLogout }) {
  const t = TRANSLATIONS[lang];

  // If in Super Admin Portal: Show dedicated Executive Header
  if (activeTab === 'superadmin') {
    return (
      <header className="sticky top-0 z-40 bg-[#1C0D10] text-white border-b-2 border-[#D4AF37] shadow-xl transition-all select-none">
        {/* Top Info Strip */}
        <div className="bg-black/40 py-1.5 px-3 sm:px-6 border-b border-white/10 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-[#FDE68A] border border-[#D4AF37]/50">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>मुख्य प्रशासक कक्ष (Super Admin Portal)</span>
            </span>
            <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{isOnline ? 'Live Online' : 'Offline'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
              className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FFFDF9] text-xs font-bold border border-white/20 transition cursor-pointer"
            >
              <Globe className="w-3 h-3 inline mr-1 text-[#FDE68A]" />
              <span>{lang === 'mr' ? 'English' : 'मराठी'}</span>
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className="flex items-center gap-1 px-3 py-0.5 bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 text-xs font-black rounded-full border border-amber-400/40 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>मुख्य पोर्टल (Back)</span>
            </button>
          </div>
        </div>

        {/* Main Executive Banner */}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GanpatiLogo className="w-11 h-11 sm:w-12 sm:h-12 shrink-0" />
            <div>
              <div className="text-[11px] text-[#D4AF37] font-extrabold uppercase tracking-wider">
                अकरा मारुती चौक सार्वजनिक गणेशोत्सव मंडळ
              </div>
              <h1 className="text-sm sm:text-lg font-black text-white font-serif">
                केंद्रीय व्यवस्थापन व प्रशासकीय नियंत्रण कक्ष
              </h1>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-white/10 px-3 py-1 rounded-xl border border-white/15">
                <span>👤 {user.name}</span>
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लॉगआउट</span>
              </button>
            </div>
          )}
        </div>
      </header>
    );
  }

  // Regular Page Header (Register & Karyakarta Pavthi Collection)
  return (
    <header className="sticky top-0 z-40 bg-[#FAF6ED]/95 backdrop-blur-md border-b-2 border-[#D4AF37]/45 shadow-[0_4px_20px_rgba(74,0,11,0.06)] transition-all select-none">
      {/* Top Line: Online/Offline status, Language button & Super Admin link */}
      <div className="bg-gradient-to-r from-[#3B070E] via-[#630D1A] to-[#3B070E] text-[#FFFDF9] py-1.5 px-3 sm:px-6 border-b border-[#D4AF37]/35">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Online / Offline Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            isOnline 
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40' 
              : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isOnline ? t.online_status : t.offline_status}</span>
          </span>

          {/* Right side: Super Admin Portal link, Karyakarta indicator & Language */}
          <div className="flex items-center gap-2">
            {/* Super Admin Direct Gateway */}
            <button
              onClick={() => setActiveTab('superadmin')}
              className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 text-[11px] font-extrabold border border-[#D4AF37]/50 transition active:scale-95 cursor-pointer"
              title="मुख्य प्रशासक नियंत्रण कक्ष (Super Admin Portal)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>सुपर ॲडमिन</span>
            </button>

            {user && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#FDE68A] bg-black/20 px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>{user.name || user.username}</span>
              </span>
            )}

            {/* Language Switcher Button */}
            <button
              onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
              className="flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 text-[#FFFDF9] text-xs font-bold border border-[#D4AF37]/60 transition active:scale-95 cursor-pointer shadow-xs"
              title="Toggle Language / भाषा बदला"
            >
              <Globe className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>{lang === 'mr' ? 'English' : 'मराठी'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Line: Ganpati Logo + Full Visible Title */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center gap-3">
        {/* Logo */}
        <GanpatiLogo className="w-11 h-11 sm:w-13 sm:h-13 shrink-0" />

        {/* Full Title (centered) */}
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-center text-sm sm:text-base md:text-lg font-black tracking-tight text-[#4A000B] leading-snug font-serif whitespace-pre-line">
            {t.org_title}
          </h1>
        </div>
      </div>

      {/* Navigation Switcher Tabs (Only Register & Karyakarta Pavthi Collection) */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-2">
        <div className="flex bg-amber-100/70 p-1 rounded-xl border border-[#D4AF37]/40 shadow-inner">
          {/* Tab 1: Register Search */}
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-[#FFFDF9] shadow-sm border border-[#D4AF37]/50'
                : 'text-slate-700 hover:text-[#4A000B] hover:bg-white/50'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'register' ? 'text-[#FDE68A]' : 'text-slate-600'}`} />
            <span>{t.nav_register}</span>
          </button>

          {/* Tab 2: New Pavthi Entry (For donation collection) */}
          <button
            onClick={() => setActiveTab('pavthi')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'pavthi'
                ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-[#FFFDF9] shadow-sm border border-[#D4AF37]/50'
                : 'text-slate-700 hover:text-[#4A000B] hover:bg-white/50'
            }`}
          >
            <Receipt className={`w-4 h-4 ${activeTab === 'pavthi' ? 'text-[#FDE68A]' : 'text-[#800020]'}`} />
            <span>{t.nav_pavthi}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
