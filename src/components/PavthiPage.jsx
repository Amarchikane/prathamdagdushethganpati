import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  Wifi, 
  WifiOff, 
  User, 
  LogOut, 
  Receipt, 
  Printer, 
  AlertTriangle, 
  Check, 
  RotateCcw,
  Clock,
  Languages,
  CheckSquare,
  Square,
  ArrowRightLeft,
  Lock,
  Send,
  Calendar
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { numberToMarathiWords } from '../utils/numberToMarathiWords';
import { 
  detectScript, 
  convertEnglishToMarathi, 
  convertMarathiToEnglish, 
  fetchOnlineMarathiTransliteration 
} from '../utils/transliterate';
import { ReceiptModal } from './ReceiptModal';
import { DailyHandoverModal } from './DailyHandoverModal';

const INITIAL_FORM = {
  mobile: '',
  amount: '',
  donation_type: 'वर्गणी (Contribution)',
  payment_mode: 'रोख (Cash)',
  landmark_mr: 'शुक्रवार पेठ',
  landmark_en: 'Shukrawar Peth',
  book_ref: '',
  note_mr: ''
};

export function PavthiPage({ lang, isOnline, user, onLogout }) {
  const t = TRANSLATIONS[lang];
  
  // Single Donor Name State with auto-conversion
  const [nameInput, setNameInput] = useState('');
  const [convertedName, setConvertedName] = useState('');
  const [detectedScript, setDetectedScript] = useState('empty');
  const [isEditingConverted, setIsEditingConverted] = useState(false);

  // Pending Amount Checkbox & State
  const [isPending, setIsPending] = useState(false);
  const [pendingAmount, setPendingAmount] = useState('');

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Daily Handover and Lockout State
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverData, setHandoverData] = useState({
    is_locked: false,
    pending_days: [],
    superadmin_whatsapp: '919822001122',
    handovers: []
  });

  const onlineTimerRef = useRef(null);

  const [recentEntries, setRecentEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('mandal_recent_pavthis');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mandal_recent_pavthis', JSON.stringify(recentEntries));
    } catch (e) {
      console.error('Error caching recent pavthis', e);
    }
  }, [recentEntries]);

  // Load existing pavthis from D1 on initial load if online
  useEffect(() => {
    if (!isOnline) return;

    fetch('/api/pavthi')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.entries) && data.entries.length > 0) {
          setRecentEntries(prev => {
            const map = new Map();
            data.entries.forEach(item => map.set(item.id, item));
            prev.forEach(item => map.set(item.id, item));
            return Array.from(map.values()).slice(0, 50);
          });
        }
      })
      .catch(() => {});
  }, [isOnline]);

  // Check Daily Handover Status & Past Day Lockout
  const fetchHandoverStatus = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/daily-handover?username=${encodeURIComponent(user.username)}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setHandoverData(data);
        }
      }
    } catch (err) {
      console.warn('Daily handover check warning:', err);
    }
  };

  useEffect(() => {
    fetchHandoverStatus();
  }, [user, isOnline]);

  // Handle donor name typing & auto-conversion
  const handleNameChange = (val) => {
    setNameInput(val);
    if (!val.trim()) {
      setConvertedName('');
      setDetectedScript('empty');
      setIsEditingConverted(false);
      return;
    }

    const script = detectScript(val);
    setDetectedScript(script);

    if (script === 'en') {
      const mr = convertEnglishToMarathi(val);
      setConvertedName(mr);

      // Try Google Input Tools API if online with quick debounce
      if (isOnline) {
        clearTimeout(onlineTimerRef.current);
        onlineTimerRef.current = setTimeout(async () => {
          const refined = await fetchOnlineMarathiTransliteration(val);
          if (refined && refined !== mr) {
            setConvertedName(refined);
          }
        }, 350);
      }
    } else if (script === 'mr') {
      const en = convertMarathiToEnglish(val);
      setConvertedName(en);
    }
  };

  const handleLandmarkChange = (e) => {
    const val = e.target.value;
    let en = 'Shukrawar Peth';
    if (val === 'अकरा मारुती चौक') en = 'Akara Maruti Chowk';
    if (val === 'शाहू चौक') en = 'Shahu Chowk';
    if (val === 'मंडई परिसर') en = 'Mandai Area';
    setFormData(prev => ({
      ...prev,
      landmark_mr: val,
      landmark_en: en
    }));
  };

  const handleResetForm = (keepMessages = false) => {
    setNameInput('');
    setConvertedName('');
    setDetectedScript('empty');
    setIsEditingConverted(false);
    setIsPending(false);
    setPendingAmount('');
    setFormData(INITIAL_FORM);
    if (!keepMessages) {
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // STRICT LOCKOUT CHECK: If past day daily handover is pending
    if (handoverData.is_locked) {
      alert('⚠️ मागील दिवसाचा दैनिक हिशोब मुख्य प्रशासकाकडे (Super Admin) जमा करणे बाकी आहे! जोपर्यंत हिशोब WhatsApp वर सुपूर्द केला जात नाही, तोपर्यंत नवीन पावती करता येणार नाही.');
      setIsHandoverModalOpen(true);
      return;
    }

    // STRICT ONLINE CHECK - user specified: "the user should be online for that"
    if (!isOnline) {
      setErrorMsg(t.online_req_warning);
      return;
    }

    if (!nameInput.trim()) {
      setErrorMsg(lang === 'mr' ? 'कृपया दात्याचे नाव प्रविष्ट करा' : 'Please enter donor name');
      return;
    }

    const totalAmount = Number(formData.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      setErrorMsg(lang === 'mr' ? 'कृपया एकूण देणगी रक्कम प्रविष्ट करा' : 'Please enter a valid total amount');
      return;
    }

    let pendingAmt = 0;
    if (isPending) {
      pendingAmt = Number(pendingAmount);
      if (isNaN(pendingAmt) || pendingAmt <= 0) {
        setErrorMsg(lang === 'mr' ? 'कृपया बाकी रक्कम प्रविष्ट करा' : 'Please enter the pending amount');
        return;
      }
      if (pendingAmt > totalAmount) {
        setErrorMsg(lang === 'mr' ? 'बाकी रक्कम एकूण रकमेपेक्षा जास्त असू शकत नाही' : 'Pending amount cannot exceed total amount');
        return;
      }
    }

    const receivedAmt = isPending ? Math.max(0, totalAmount - pendingAmt) : totalAmount;

    // Determine Marathi and English names
    let finalNameMr = '';
    let finalNameEn = '';

    if (detectedScript === 'en') {
      finalNameMr = convertedName.trim() || nameInput.trim();
      finalNameEn = nameInput.trim();
    } else {
      finalNameMr = nameInput.trim();
      finalNameEn = convertedName.trim() || nameInput.trim();
    }

    setLoading(true);

    const amountWords = numberToMarathiWords(receivedAmt);

    const payload = {
      ...formData,
      name_mr: finalNameMr,
      name_en: finalNameEn,
      amount: totalAmount,
      amount_words_mr: amountWords,
      is_pending: isPending ? 1 : 0,
      pending_amount: pendingAmt,
      received_amount: receivedAmt,
      created_by: user ? user.name : 'मंडळ कार्यकर्ता',
      created_by_username: (user ? user.username : 'karyakarta').toLowerCase()
    };

    try {
      const res = await fetch('/api/pavthi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success && data.entry) {
        const savedEntry = data.entry;
        setRecentEntries(prev => [savedEntry, ...prev]);
        setSuccessMsg(data.message || 'पावती D1 डेटाबेसमध्ये नोंद झाली!');
        setSelectedReceipt(savedEntry);
        handleResetForm(true);
      } else {
        // D1 database not bound on server -> fallback to local so donor still gets receipt immediately
        const fallbackEntry = {
          ...payload,
          id: 'LOCAL-' + Date.now().toString(36),
          receipt_no: `AM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
          date: new Date().toLocaleDateString('mr-IN'),
          created_at: new Date().toISOString(),
          is_local_only: true
        };
        setRecentEntries(prev => [fallbackEntry, ...prev]);
        setErrorMsg(`⚠️ D1 डेटाबेस जोडलेला नाही: ${data.error || 'D1 DB Binding Missing'}. पावती फक्त तात्पुरती स्थानिक पातळीवर सेव्ह झाली आहे.`);
        setSelectedReceipt(fallbackEntry);
        handleResetForm(true);
      }
    } catch (err) {
      const fallbackEntry = {
        ...payload,
        id: 'LOCAL-' + Date.now().toString(36),
        receipt_no: `AM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString('mr-IN'),
        created_at: new Date().toISOString(),
        is_local_only: true
      };
      setRecentEntries(prev => [fallbackEntry, ...prev]);
      setErrorMsg(`⚠️ नेटवर्क त्रुटी: ${err.message}. पावती स्थानिक मेमरीमध्ये जतन झाली आहे.`);
      setSelectedReceipt(fallbackEntry);
      handleResetForm(true);
    } finally {
      setLoading(false);
    }
  };

  const totalNumber = Number(formData.amount);
  const pendingNumber = Number(pendingAmount) || 0;
  const receivedNumber = isPending ? Math.max(0, totalNumber - pendingNumber) : totalNumber;
  const liveAmountWords = !isNaN(receivedNumber) && receivedNumber > 0 ? numberToMarathiWords(receivedNumber) : '';

  return (
    <div className="max-w-4xl mx-auto my-4 sm:my-6 px-3 sm:px-4 space-y-6">
      {/* Top Karyakarta Bar & Online Enforcement Alert */}
      <div className="bg-white border border-[#D4AF37]/50 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* User Info */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-[#D4AF37] flex items-center justify-center text-[#4A000B]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-[10px] sm:text-xs">
              {t.logged_in_as}
            </span>
            <span className="font-extrabold text-[#4A000B]">
              {user ? user.name : 'मंडळ कार्यकर्ता'}
            </span>
          </div>
        </div>

        {/* Live Online Badge, Daily Handover Button & Logout Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Daily Handover Button */}
          <button
            type="button"
            onClick={() => setIsHandoverModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs ${
              handoverData.is_locked
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white animate-pulse border border-rose-400'
                : 'bg-amber-100/90 hover:bg-amber-200 text-[#4A000B] border border-[#D4AF37]/60'
            }`}
            title="मुख्य प्रशासकाकडे दैनिक हिशोब सुपूर्द करा"
          >
            <Send className="w-3.5 h-3.5 text-[#B45309]" />
            <span>{lang === 'mr' ? 'दैनिक हिशोब जमा करा' : 'Daily Handover'}</span>
            {handoverData.is_locked && (
              <span className="text-[10px] bg-rose-950 text-white px-1.5 py-0.2 rounded-full font-bold">
                बाकी!
              </span>
            )}
          </button>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
              : 'bg-rose-50 text-rose-700 border border-rose-300'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>{t.online_status_ok}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>{t.offline_status_blocked}</span>
              </>
            )}
          </span>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full border border-slate-300 transition cursor-pointer"
            title={t.logout_btn}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout_btn}</span>
          </button>
        </div>
      </div>

      {/* LOCKOUT ALERT BANNER: Displayed when previous day daily handover is pending */}
      {handoverData.is_locked && (
        <div className="p-4 bg-gradient-to-r from-rose-900 via-rose-950 to-[#3B070E] border-2 border-rose-400 rounded-3xl shadow-xl text-white space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-800/80 border border-rose-300/50 flex items-center justify-center shrink-0 shadow-inner">
                <Lock className="w-5 h-5 text-rose-200" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-rose-100 flex items-center gap-2">
                  <span>⚠️ मागील दिवसाचा दैनिक हिशोब जमा करणे बाकी आहे! (पावती बंद)</span>
                </h4>
                <p className="text-xs text-rose-200/90 font-medium mt-1 leading-relaxed">
                  नियमानुसार, मागील दिवसाचा ({handoverData.pending_days.map(d => `दि. ${d.display_date || d.iso_date}`).join(', ')}) संकलन अहवाल मुख्य प्रशासक (Super Admin) यांच्याकडे WhatsApp वर सुपूर्द केल्याशिवाय नवीन पावती तयार करता येणार नाही.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHandoverModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-[#3B070E] text-xs font-black rounded-xl shadow-lg transition shrink-0 cursor-pointer text-center"
            >
              हिशोब सुपूर्द करा (Handover) →
            </button>
          </div>
        </div>
      )}

      {/* Strict Online Warning if offline */}
      {!isOnline && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-xs sm:text-sm font-bold text-rose-800 shadow-sm animate-fadeIn">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-black text-rose-900">
              ⚠️ {lang === 'mr' ? 'इंटरनेट कनेक्शन आवश्यक आहे' : 'Internet Connection Required'}
            </p>
            <p className="font-normal text-rose-700 mt-0.5 leading-relaxed">
              {t.online_req_warning}
            </p>
          </div>
        </div>
      )}

      {/* Main Entry Card */}
      <div className="bg-white border-2 border-[#D4AF37]/60 rounded-3xl shadow-lg overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-[#4A000B] via-[#630D1A] to-[#800020] p-4 sm:p-5 text-white border-b-2 border-[#D4AF37]/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#FDE68A]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-[#FFFDF9]">
                {t.pavthi_page_title}
              </h2>
              <p className="text-[11px] text-[#FDE68A]/80 font-medium">
                {t.pavthi_page_desc}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* ==========================================================================
              SINGLE DONOR NAME FIELD WITH AUTOMATIC MARATHI <-> ENGLISH TRANSLITERATION
              ========================================================================== */}
          <div className="bg-amber-50/60 border-2 border-[#D4AF37]/40 rounded-2xl p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-[#4A000B] flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-[#B45309]" />
                <span>{t.donor_name_single_label} *</span>
              </label>

              {detectedScript !== 'empty' && (
                <span className="text-[11px] font-bold text-[#800020] bg-white px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                  {detectedScript === 'en' ? 'इंग्रजीत टाईप केले (English)' : 'मराठीत टाईप केले (Marathi)'}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={nameInput}
                onChange={e => handleNameChange(e.target.value)}
                placeholder={t.donor_name_single_placeholder}
                className="w-full px-3.5 py-3 border border-[#D4AF37]/60 focus:border-[#4A000B] rounded-xl text-base font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#800020]/20 focus:outline-none transition"
              />
            </div>

            {/* Auto-Converted Counterpart Pill */}
            {nameInput.trim() && convertedName && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>{t.auto_converted_to}</span>
                  
                  {!isEditingConverted ? (
                    <span className="font-black text-[#800020] bg-white px-2.5 py-1 rounded-lg border border-amber-300 text-sm shadow-2xs">
                      {convertedName}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={convertedName}
                      onChange={e => setConvertedName(e.target.value)}
                      className="px-2 py-0.5 bg-white border border-[#4A000B] rounded-lg font-bold text-[#800020] text-sm focus:outline-none"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingConverted(!isEditingConverted)}
                  className="text-[11px] text-[#B45309] hover:text-[#4A000B] underline font-bold cursor-pointer"
                >
                  {isEditingConverted ? 'जतन करा' : 'बदल करा (Edit)'}
                </button>
              </div>
            )}
          </div>

          {/* Mobile & Landmark Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mobile Number for WhatsApp / SMS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.donor_mobile}
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="98XXXXXXXX (WhatsApp पावतीसाठी)"
                className="w-full px-3.5 py-2.5 border border-[#E8DEC8] focus:border-[#4A000B] rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#800020]/20 focus:outline-none transition"
              />
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.landmark}
              </label>
              <select
                value={formData.landmark_mr}
                onChange={handleLandmarkChange}
                className="w-full px-3 py-2.5 border border-[#E8DEC8] rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none bg-white"
              >
                <option value="शुक्रवार पेठ">शुक्रवार पेठ</option>
                <option value="अकरा मारुती चौक">अकरा मारुती चौक</option>
                <option value="शाहू चौक">शाहू चौक</option>
                <option value="मंडई परिसर">मंडई परिसर</option>
              </select>
            </div>
          </div>

          {/* ==========================================================================
              AMOUNT & PENDING AMOUNT CHECKBOX / INPUT
              ========================================================================== */}
          <div className="bg-[#FAF6ED] border border-[#D4AF37]/50 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Amount */}
              <div>
                <label className="block text-xs font-extrabold text-[#4A000B] mb-1">
                  {t.donation_amount} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="उदा. 1000, 5001"
                  className="w-full px-3.5 py-2.5 border-2 border-amber-400 focus:border-[#4A000B] rounded-xl text-lg font-black text-[#4A000B] bg-white focus:ring-2 focus:ring-[#800020]/20 focus:outline-none transition"
                />
              </div>

              {/* Pending Checkbox & Pending Amount Input */}
              <div className="flex flex-col justify-between">
                <div className="pt-2 sm:pt-6">
                  <label 
                    onClick={() => setIsPending(!isPending)}
                    className="flex items-center gap-2 cursor-pointer select-none bg-white p-2 rounded-xl border border-[#D4AF37]/50 hover:bg-amber-50/50 transition"
                  >
                    {isPending ? (
                      <CheckSquare className="w-5 h-5 text-[#800020] shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-black text-slate-800">
                      {t.is_pending_checkbox}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* If isPending is checked: Show Pending Amount Input */}
            {isPending && (
              <div className="p-3 bg-rose-50/90 border-2 border-rose-300 rounded-xl space-y-2 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-rose-900 mb-1">
                      ⚠️ {t.pending_amount_label} *
                    </label>
                    <input
                      type="number"
                      required={isPending}
                      min="1"
                      max={formData.amount ? Number(formData.amount) : undefined}
                      value={pendingAmount}
                      onChange={e => setPendingAmount(e.target.value)}
                      placeholder="उदा. 500"
                      className="w-full px-3 py-2 border-2 border-rose-400 rounded-xl text-base font-black text-rose-800 bg-white focus:outline-none"
                    />
                  </div>

                  {/* Calculated Received Amount */}
                  <div>
                    <label className="block text-xs font-black text-emerald-900 mb-1">
                      ✅ {t.received_amount_label}
                    </label>
                    <div className="w-full px-3 py-2 bg-emerald-100/80 border border-emerald-400 rounded-xl text-base font-black text-emerald-900">
                      ₹{receivedNumber > 0 ? receivedNumber : 0}
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown Alert */}
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 bg-white/80 p-2 rounded-lg border border-rose-200">
                  <span>एकूण: ₹{totalNumber || 0}</span>
                  <span className="text-emerald-700">जमा: ₹{receivedNumber}</span>
                  <span className="text-rose-700">⚠️ बाकी: ₹{pendingNumber}</span>
                </div>
              </div>
            )}

            {/* Live Marathi Currency Words Display for Received Amount */}
            {liveAmountWords && (
              <div className="p-2.5 bg-white border border-[#D4AF37]/50 rounded-xl text-xs font-black text-[#800020] animate-fadeIn">
                <span>जमा रक्कम अक्षरी: </span>
                <span className="text-[#4A000B]">{liveAmountWords}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Donation Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.donation_type_label}
              </label>
              <select
                value={formData.donation_type}
                onChange={e => setFormData({ ...formData, donation_type: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#E8DEC8] rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none bg-white"
              >
                <option value="वर्गणी (Contribution)">वर्गणी (Contribution)</option>
                <option value="ऐच्छिक देणगी (Donation)">ऐच्छिक देणगी (Donation)</option>
                <option value="महाआरती / पूजा (Pooja)">महाआरती / पूजा (Pooja)</option>
                <option value="विशेष सहकार्य (Special Sponsor)">विशेष सहकार्य (Special Sponsor)</option>
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.payment_mode_label}
              </label>
              <select
                value={formData.payment_mode}
                onChange={e => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#E8DEC8] rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none bg-white"
              >
                <option value="रोख (Cash)">रोख (Cash)</option>
                <option value="UPI / QR (Online)">UPI / QR (Online)</option>
                <option value="चेक (Cheque)">चेक (Cheque)</option>
                <option value="बँक ट्रान्सफर (NEFT)">बँक ट्रान्सफर (NEFT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Book Reference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.book_ref_label}
              </label>
              <input
                type="text"
                value={formData.book_ref}
                onChange={e => setFormData({ ...formData, book_ref: e.target.value })}
                placeholder="उदा. Book 1 / P.12"
                className="w-full px-3.5 py-2 border border-[#E8DEC8] rounded-xl text-sm font-medium text-slate-800 focus:outline-none"
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
                onChange={e => setFormData({ ...formData, note_mr: e.target.value })}
                placeholder="उदा. २-टप्प्यात जमा, उत्सव दिन विशेष"
                className="w-full px-3.5 py-2 border border-[#E8DEC8] rounded-xl text-sm font-medium text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.new_entry_reset}</span>
            </button>

            <button
              type="submit"
              disabled={loading || !isOnline || handoverData.is_locked}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm shadow-md transition cursor-pointer ${
                handoverData.is_locked
                  ? 'bg-rose-950 text-rose-200 cursor-not-allowed border border-rose-500 shadow-none'
                  : !isOnline
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#4A000B] to-[#800020] hover:from-[#3B070E] hover:to-[#630D1A] text-white active:scale-98 border border-[#D4AF37]/50'
              }`}
            >
              {loading ? (
                <span className="animate-spin">⏳ D1 मध्ये नोंद होत आहे...</span>
              ) : handoverData.is_locked ? (
                <>
                  <Lock className="w-4 h-4 text-rose-300" />
                  <span>🔒 पावती तयार करणे बंद (मागील दिवसाचा हिशोब जमा करा)</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-[#FDE68A]" />
                  <span>{t.submit_pavthi_btn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ==========================================================================
          TODAY'S ISSUED RECEIPTS (RECENT ENTRIES)
          ========================================================================== */}
      <div className="bg-white border border-[#E8DEC8] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#800020]" />
            <h3 className="font-extrabold text-xs sm:text-sm text-[#4A000B]">
              {t.recent_entries_title} ({recentEntries.length})
            </h3>
          </div>
        </div>

        {recentEntries.length > 0 ? (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentEntries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#800020] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                      {entry.receipt_no}
                    </span>
                    <span className="font-extrabold text-slate-900 truncate">
                      {entry.name_mr || entry.name_en}
                    </span>
                    {Boolean(entry.is_pending) && (
                      <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                        बाकी: ₹{entry.pending_amount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>{entry.date}</span>
                    <span>• {entry.landmark_mr}</span>
                    <span>• {entry.payment_mode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-[#4A000B] block">
                      ₹{entry.received_amount !== undefined ? entry.received_amount : entry.amount}
                    </span>
                    {Boolean(entry.is_pending) && (
                      <span className="text-[10px] font-bold text-slate-500">
                        एकूण: ₹{entry.amount}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedReceipt(entry)}
                    className="flex items-center gap-1 px-3 py-1 bg-[#FAF6ED] hover:bg-amber-100/90 text-[#800020] border border-[#D4AF37]/40 rounded-lg font-bold text-[11px] transition cursor-pointer"
                    title="पावती पहा / प्रिंट"
                  >
                    <Printer className="w-3 h-3 text-[#B45309]" />
                    <span>पावती</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2 text-center">
            {t.no_recent_entries}
          </p>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
        onResetNew={handleResetForm}
        lang={lang}
      />

      {/* Daily Handover Modal */}
      <DailyHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        user={user}
        handoverData={handoverData}
        recentEntries={recentEntries}
        onHandoverSuccess={fetchHandoverStatus}
        lang={lang}
      />
    </div>
  );
}
