import React from 'react';
import { X, Download, FileSpreadsheet, FileCode } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export function ExportModal({ isOpen, onClose, donors, lang }) {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(donors, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mandal_donors_2024_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadCSV = () => {
    const headers = ["ID", "Name (Marathi)", "Name (English)", "Amount (INR)", "Landmark", "Book Reference", "Notes"];
    const rows = donors.map(d => [
      `"${d.id || ''}"`,
      `"${d.name_mr || ''}"`,
      `"${d.name_en || ''}"`,
      d.amount || 0,
      `"${d.landmark_mr || ''}"`,
      `"${d.book_ref || ''}"`,
      `"${d.note_mr || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `11Maruti_Donors_Register_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-[#D4AF37]/60 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#3B070E] via-[#630D1A] to-[#800020] p-4 text-[#FFFDF9] flex items-center justify-between border-b-2 border-[#D4AF37]/45">
          <div className="flex items-center gap-2 font-black text-base sm:text-lg">
            <Download className="w-5 h-5 text-[#FDE68A]" />
            <span>{t.export_modal_title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-white/15 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Export options */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {lang === 'mr' 
              ? 'मंडळाच्या नोंदी इतर उपकरणांवर बॅकअप घेण्यासाठी किंवा एक्सेलमध्ये पाहण्यासाठी खालील पर्याय वापरा:'
              : 'Export mandal donor records for offline backup or viewing in Excel:'}
          </p>

          <div className="space-y-3">
            <button
              onClick={downloadCSV}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                <div className="text-left">
                  <div className="text-sm">{t.export_csv}</div>
                  <div className="text-[11px] text-emerald-700 font-normal">Suitable for MS Excel & Google Sheets</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-700" />
            </button>

            <button
              onClick={downloadJSON}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileCode className="w-6 h-6 text-amber-700" />
                <div className="text-left">
                  <div className="text-sm">{t.export_json}</div>
                  <div className="text-[11px] text-amber-700 font-normal">Raw JSON format for PWA sync</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg cursor-pointer"
          >
            {t.cancel_btn}
          </button>
        </div>
      </div>
    </div>
  );
}
