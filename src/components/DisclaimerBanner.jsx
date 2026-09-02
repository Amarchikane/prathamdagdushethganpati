import React from 'react';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export function DisclaimerBanner({ lang }) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white border border-[#D4AF37]/45 border-l-4 border-l-[#800020] p-3.5 sm:p-4 rounded-xl shadow-[0_2px_12px_rgba(74,0,11,0.04)] my-4 max-w-5xl mx-auto flex items-start gap-3">
      <div className="p-1.5 bg-[#800020] text-[#FDE68A] rounded-lg shrink-0 mt-0.5 shadow-2xs">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 font-black text-[#4A000B] text-xs sm:text-sm">
          <span>{lang === 'mr' ? 'महत्त्वाची सूचना (Verification Safeguard)' : 'Verification Disclaimer'}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-[#FAF6ED] text-[#4A000B] border border-[#D4AF37]/40 font-mono font-bold">
            <BookOpen className="w-3 h-3 text-[#B45309]" />
            Physical Register Sync
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 leading-relaxed">
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}
