import React, { useState } from 'react';
import { X, PlusCircle, Save } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export function AddDonorModal({ isOpen, onClose, onAdd, lang }) {
  const t = TRANSLATIONS[lang];

  const [formData, setFormData] = useState({
    name_mr: '',
    name_en: '',
    phonetic_aliases: '',
    amount: '',
    landmark_mr: 'शुक्रवार पेठ',
    landmark_en: 'Shukrawar Peth',
    book_ref: 'Book 2 / P.03',
    note_mr: '',
    note_en: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name_mr && !formData.name_en) {
      alert(lang === 'mr' ? 'कृपया नाव प्रविष्ट करा' : 'Please enter donor name');
      return;
    }
    if (!formData.amount) {
      alert(lang === 'mr' ? 'कृपया रक्कम प्रविष्ट करा' : 'Please enter contribution amount');
      return;
    }

    onAdd({
      ...formData,
      name_mr: formData.name_mr || formData.name_en,
      name_en: formData.name_en || formData.name_mr,
      amount: Number(formData.amount)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-amber-400 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-saffron-gradient p-4 text-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
            <PlusCircle className="w-5 h-5" />
            <span>{t.add_modal_title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-amber-900/50 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Name Marathi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.name_mr_label} *
            </label>
            <input
              type="text"
              required
              value={formData.name_mr}
              onChange={e => setFormData({ ...formData, name_mr: e.target.value })}
              placeholder="उदा. अमित कदम"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none"
            />
          </div>

          {/* Name English */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.name_en_label}
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={e => setFormData({ ...formData, name_en: e.target.value })}
              placeholder="e.g. Amit Kadam"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.amount_label} *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              placeholder="5001"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none"
            />
          </div>

          {/* Landmark */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.landmark} (Marathi)
              </label>
              <select
                value={formData.landmark_mr}
                onChange={e => setFormData({ 
                  ...formData, 
                  landmark_mr: e.target.value,
                  landmark_en: e.target.value === 'अकरा मारुती चौक' ? 'Akara Maruti Chowk' : e.target.value === 'शाहू चौक' ? 'Shahu Chowk' : 'Shukrawar Peth'
                })}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none"
              >
                <option value="शुक्रवार पेठ">शुक्रवार पेठ</option>
                <option value="अकरा मारुती चौक">अकरा मारुती चौक</option>
                <option value="शाहू चौक">शाहू चौक</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.book_ref_label}
              </label>
              <input
                type="text"
                value={formData.book_ref}
                onChange={e => setFormData({ ...formData, book_ref: e.target.value })}
                placeholder="Book 2 / P.03"
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Aliases */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.phonetic_aliases_label}
            </label>
            <input
              type="text"
              value={formData.phonetic_aliases}
              onChange={e => setFormData({ ...formData, phonetic_aliases: e.target.value })}
              placeholder="amit, kadam, अमित, कदम"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.note_label}
            </label>
            <input
              type="text"
              value={formData.note_mr}
              onChange={e => setFormData({ ...formData, note_mr: e.target.value, note_en: e.target.value })}
              placeholder="हस्तलिखित / २-टप्प्यात जमा"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg cursor-pointer"
            >
              {t.cancel_btn}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.save_btn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
