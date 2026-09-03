import React, { useState } from 'react';
import { MapPin, BookOpen, FileText, Copy, Check, Calendar } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export function DonorCard({ donor, lang = 'mr' }) {
  if (!donor || typeof donor !== 'object') return null;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr || {};
  const [copied, setCopied] = useState(false);

  const nameDisplay = (lang === 'mr' 
    ? (donor.name_mr || donor.name_en) 
    : (donor.name_en || donor.name_mr)) || 'देणगीदार';
  
  const secondaryName = lang === 'mr' ? donor.name_en : donor.name_mr;

  const landmarkDisplay = lang === 'mr'
    ? (donor.landmark_mr || donor.landmark_en)
    : (donor.landmark_en || donor.landmark_mr);

  const noteDisplay = lang === 'mr'
    ? (donor.note_mr || donor.note_en)
    : (donor.note_en || donor.note_mr);

  const formatRupees = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isPavthi = Boolean(donor.receipt_no || donor.is_new_entry);
  // Extract Year only (e.g. 2026, 2025, 2024)
  let displayYear = donor.year;
  if (!displayYear && donor.date) {
    const match = String(donor.date).match(/\b(20\d{2})\b/);
    if (match) {
      displayYear = match[1];
    }
  }
  if (!displayYear) {
    displayYear = '2024';
  }

  const handleCopyRef = () => {
    const textToCopy = `${donor.receipt_no || donor.id} | ${nameDisplay} | ${donor.book_ref} | ${formatRupees(donor.amount)}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#E8DEC8] hover:border-[#D4AF37] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(74,0,11,0.1)] transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      {/* Top Header & Main Info */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 border-b border-[#E8DEC8] pb-2">
          {/* Reg ID / Receipt No + Year */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-lg ${
              isPavthi 
                ? 'bg-rose-50 text-[#800020] border border-rose-300'
                : 'bg-[#FAF6ED] text-[#4A000B] border border-[#D4AF37]/45'
            }`}>
              {displayId}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-amber-50/70 border border-[#D4AF37]/40 px-2 py-0.5 rounded-md">
              <Calendar className="w-3 h-3 text-[#800020]" />
              <span>{lang === 'mr' ? `वर्ष ${displayYear}` : `Year ${displayYear}`}</span>
            </span>
            {Boolean(donor.is_pending) && (
              <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                बाकी: ₹{donor.pending_amount}
              </span>
            )}
          </div>

          {/* Quick Copy Button */}
          <button
            onClick={handleCopyRef}
            className="flex items-center gap-1 text-xs text-[#800020] hover:text-[#4A000B] font-bold px-2.5 py-1 rounded-lg bg-[#FAF6ED] hover:bg-amber-100/80 transition cursor-pointer border border-[#D4AF37]/30"
            title={t.copy_ref}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">{t.copied_toast}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.copy_ref}</span>
              </>
            )}
          </button>
        </div>

        {/* Primary Donor Name */}
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-snug group-hover:text-[#800020] transition-colors">
            {nameDisplay}
          </h2>
          {secondaryName && secondaryName !== nameDisplay && (
            <p className="text-xs sm:text-sm font-bold text-[#B45309]/80 mt-0.5">
              {secondaryName}
            </p>
          )}
        </div>

        {/* Verification Safeguards: Landmark, Mobile & Physical Register Reference */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium pt-1">
          {/* Chowk / Landmark Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF6ED] text-[#4A000B] font-bold border border-[#D4AF37]/35">
            <MapPin className="w-4 h-4 text-[#B45309] shrink-0" />
            <span>{landmarkDisplay}</span>
          </div>

          {/* Mobile if present */}
          {donor.mobile && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-mono font-bold border border-emerald-200">
              <span>📞 {donor.mobile}</span>
            </div>
          )}

          {/* Physical Book Reference Badge */}
          {donor.book_ref && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-950 font-bold border border-rose-200/80">
              <BookOpen className="w-4 h-4 text-[#800020] shrink-0" />
              <span>{donor.book_ref}</span>
            </div>
          )}

          {/* Note if present */}
          {noteDisplay && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 font-semibold border border-slate-200">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{noteDisplay}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Strip with Contribution Amount */}
      <div className="bg-gradient-to-r from-[#3B070E] via-[#630D1A] to-[#800020] p-3.5 sm:p-4 text-[#FFFDF9] flex items-center justify-between gap-2 border-t-2 border-[#D4AF37]/45">
        <div>
          <span className="text-[11px] sm:text-xs uppercase tracking-wider font-extrabold text-[#FDE68A] block">
            {isPavthi ? (lang === 'mr' ? 'नोंद झालेली देणगी / वर्गणी' : 'Donation / Pavthi Amount') : t.last_year_contribution}
          </span>
          <span className="text-xs text-[#FDE68A]/75 font-medium hidden sm:inline">
            {isPavthi ? (donor.payment_mode || 'रोख') : '(Last Year Amount)'}
          </span>
        </div>

        {/* Currency Display formatted in Indian system */}
        <div className="text-2xl sm:text-3xl font-black text-[#FFFDF9] tracking-tight drop-shadow-xs font-mono">
          {formatRupees(donor.amount)}
        </div>
      </div>
    </div>
  );
}

