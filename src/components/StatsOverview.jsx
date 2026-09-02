import React from 'react';
import { Users, IndianRupee, Filter } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export function StatsOverview({ lang, totalCount, totalAmount, filteredCount, filteredAmount, isFiltered }) {
  const t = TRANSLATIONS[lang];

  const formatRupees = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-5xl mx-auto my-4 px-2 sm:px-0">
      {/* Card 1: Total Donors */}
      <div className="bg-white border border-amber-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
          <Users className="w-4 h-4 text-amber-700" />
          <span>{t.total_records}</span>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
          {totalCount}
        </div>
      </div>

      {/* Card 2: Total Collection */}
      <div className="bg-white border border-amber-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
          <IndianRupee className="w-4 h-4 text-emerald-700" />
          <span>{t.total_amount}</span>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1">
          {formatRupees(totalAmount)}
        </div>
      </div>

      {/* Card 3: Filtered Count */}
      <div className={`border rounded-xl p-3 sm:p-4 shadow-sm transition ${isFiltered ? 'bg-amber-100/60 border-amber-400' : 'bg-white border-amber-200'}`}>
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
          <Filter className="w-4 h-4 text-amber-700" />
          <span>{t.filtered_results}</span>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-1">
          {filteredCount}
        </div>
      </div>

      {/* Card 4: Filtered Sum */}
      <div className={`border rounded-xl p-3 sm:p-4 shadow-sm transition ${isFiltered ? 'bg-amber-100/60 border-amber-400' : 'bg-white border-amber-200'}`}>
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
          <IndianRupee className="w-4 h-4 text-amber-700" />
          <span>{t.filtered_sum}</span>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-1">
          {formatRupees(filteredAmount)}
        </div>
      </div>
    </div>
  );
}
