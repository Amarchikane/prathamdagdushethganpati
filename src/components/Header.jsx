import React from 'react';
import { Globe } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { GanpatiLogo } from './GanpatiLogo';

export function Header({ lang, setLang, isOnline }) {
  const t = TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6ED]/95 backdrop-blur-md border-b-2 border-[#D4AF37]/45 shadow-[0_4px_20px_rgba(74,0,11,0.06)] transition-all">
      {/* Top Line: Online/Offline status & Language button */}
      <div className="bg-gradient-to-r from-[#3B070E] via-[#630D1A] to-[#3B070E] text-[#FFFDF9] py-1.5 px-3 sm:px-6 border-b border-[#D4AF37]/35 select-none">
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

      {/* Main Line: Ganpati Logo + Full Visible Title */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
        {/* Logo */}
        <GanpatiLogo className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" />

        {/* Full Title (unrestricted width, fully readable on all devices) */}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-tight text-[#4A000B] leading-snug font-serif whitespace-normal">
            {t.org_title}
          </h1>
        </div>
      </div>
    </header>
  );
}


