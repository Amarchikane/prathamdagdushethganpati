import React from 'react';
import { Search, X, MapPin, ArrowUpDown } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export function SearchBar({
  lang,
  query,
  setQuery,
  selectedLandmark,
  setSelectedLandmark,
  sortBy,
  setSortBy,
  landmarks
}) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white/95 border border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_rgba(74,0,11,0.05)] max-w-5xl mx-auto my-3.5 space-y-3">
      {/* Search Input Container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#800020]">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search_placeholder}
          className="w-full pl-10 pr-9 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-slate-900 bg-[#FAF6ED]/75 border border-[#D4AF37]/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-[#800020] focus:bg-white placeholder-slate-400 transition shadow-2xs"
        />

        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-800 cursor-pointer"
            title="Clear search"
          >
            <X className="w-5 h-5 bg-[#D4AF37]/25 text-[#4A000B] hover:bg-[#D4AF37]/40 rounded-full p-0.5 transition" />
          </button>
        )}
      </div>

      {/* Landmark Filter & Sort Controls Row */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E8DEC8]">
        {/* Horizontal Scrolling Landmark Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth max-w-full">
          <span className="text-[11px] font-black text-[#4A000B] flex items-center gap-1 shrink-0 mr-1">
            <MapPin className="w-3.5 h-3.5 text-[#B45309]" />
            <span>{t.landmark}:</span>
          </span>

          <button
            onClick={() => setSelectedLandmark('ALL')}
            className={`px-3 py-1 text-xs font-extrabold rounded-full shrink-0 transition cursor-pointer ${
              selectedLandmark === 'ALL'
                ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-[#FFFDF9] shadow-xs border border-[#D4AF37]/50'
                : 'bg-[#FAF6ED] text-[#4A000B] hover:bg-amber-100/70 border border-[#E5D5BA]'
            }`}
          >
            {t.all_landmarks}
          </button>

          {landmarks.map((lm, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedLandmark(lm)}
              className={`px-3 py-1 text-xs font-extrabold rounded-full shrink-0 transition cursor-pointer ${
                selectedLandmark === lm
                  ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-[#FFFDF9] shadow-xs border border-[#D4AF37]/50'
                  : 'bg-[#FAF6ED] text-[#4A000B] hover:bg-amber-100/70 border border-[#E5D5BA]'
              }`}
            >
              {lm}
            </button>
          ))}
        </div>

        {/* Sort Selector Dropdown */}
        <div className="flex items-center gap-1 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#800020]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[11px] sm:text-xs font-bold bg-[#FAF6ED] border border-[#D4AF37]/45 text-[#4A000B] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#800020] cursor-pointer shadow-2xs"
          >
            <option value="AMOUNT_DESC">{t.sort_amount_desc}</option>
            <option value="AMOUNT_ASC">{t.sort_amount_asc}</option>
            <option value="NAME">{t.sort_name}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

