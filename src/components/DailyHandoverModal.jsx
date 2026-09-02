import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Calendar, 
  Receipt, 
  Wallet, 
  QrCode, 
  Clock,
  Loader2,
  Smartphone
} from 'lucide-react';
import { toMarathiDigits } from '../utils/numberToMarathiWords';

export function DailyHandoverModal({
  isOpen,
  onClose,
  user,
  handoverData,
  recentEntries = [],
  onHandoverSuccess,
  lang = 'mr'
}) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const pendingDays = handoverData?.pending_days || [];
  const superAdminPhone = handoverData?.superadmin_whatsapp || '919822001122';

  const todayStr = new Date().toLocaleDateString('mr-IN');

  // Set default selected date: earliest pending day if available, else today
  useEffect(() => {
    if (pendingDays.length > 0) {
      setSelectedDate(pendingDays[0].display_date || pendingDays[0].iso_date);
    } else {
      setSelectedDate(todayStr);
    }
  }, [handoverData]);

  if (!isOpen) return null;

  // Find summary for selected date
  let summary = null;
  const matchedPending = pendingDays.find(
    d => d.display_date === selectedDate || d.iso_date === selectedDate
  );

  if (matchedPending) {
    summary = {
      date: matchedPending.display_date || matchedPending.iso_date,
      count: Number(matchedPending.count) || 0,
      total_amt: Number(matchedPending.total_amt) || 0,
      cash_amt: Number(matchedPending.cash_amt) || 0,
      upi_amt: Number(matchedPending.upi_amt) || 0,
      pending_amt: Number(matchedPending.pending_amt) || 0,
      first_receipt: matchedPending.first_receipt || '',
      last_receipt: matchedPending.last_receipt || '',
      is_pending_day: true
    };
  } else {
    // Calculate from recentEntries for today
    const cleanUser = (user?.username || '').toLowerCase();
    const matching = recentEntries.filter(r => {
      const isUser = (r.created_by_username || '').toLowerCase() === cleanUser;
      const isDate = r.date === selectedDate || (r.created_at && new Date(r.created_at).toLocaleDateString('mr-IN') === selectedDate);
      return isUser && isDate;
    });

    let totalAmt = 0;
    let cashAmt = 0;
    let upiAmt = 0;
    let pendingAmt = 0;
    let firstReceipt = matching.length > 0 ? matching[matching.length - 1].receipt_no : '';
    let lastReceipt = matching.length > 0 ? matching[0].receipt_no : '';

    matching.forEach(r => {
      const amt = Number(r.amount) || 0;
      const rAmt = Number(r.received_amount) !== undefined ? Number(r.received_amount) : amt;
      const pAmt = Number(r.pending_amount) || 0;
      totalAmt += amt;
      pendingAmt += pAmt;

      const mode = String(r.payment_mode || '');
      if (mode.includes('रोख') || mode.includes('Cash')) {
        cashAmt += rAmt;
      } else {
        upiAmt += rAmt;
      }
    });

    summary = {
      date: selectedDate,
      count: matching.length,
      total_amt: totalAmt,
      cash_amt: cashAmt,
      upi_amt: upiAmt,
      pending_amt: pendingAmt,
      first_receipt: firstReceipt,
      last_receipt: lastReceipt,
      is_pending_day: false
    };
  }

  // Format Official Marathi Daily Handover WhatsApp Message
  const buildWhatsAppText = () => {
    const adminDisplayName = user?.name || user?.username || 'कार्यकर्ता';
    const dateMarathi = toMarathiDigits(summary.date);
    const totalCountMarathi = toMarathiDigits(summary.count);
    const totalAmtMarathi = toMarathiDigits(summary.total_amt);
    const cashAmtMarathi = toMarathiDigits(summary.cash_amt);
    const upiAmtMarathi = toMarathiDigits(summary.upi_amt);
    const pendingAmtMarathi = toMarathiDigits(summary.pending_amt);

    return `🚩 *अकरा मारुती चौक सार्वजनिक गणेशोत्सव मित्र मंडळ* 🚩
२४५, शुक्रवार पेठ, पुणे – ४११ ००२ • (रजि. क्र. : एफ १२००४)
•॥ दैनिक वर्गणी संकलन हिशोब अहवाल (Daily Handover) ॥•
------------------------------------------------
📅 *तारीख:* ${dateMarathi}
👤 *जमाकर्ता (Admin):* ${adminDisplayName} (${user?.username || ''})
------------------------------------------------
📊 *दैनिक जमा तपशील (Summary):*
• *एकूण पावत्या संख्या:* ${totalCountMarathi}
${summary.first_receipt ? `• *पावती क्रमांक:* ${summary.first_receipt} ते ${summary.last_receipt}\n` : ''}• *एकूण संकलित रक्कम:* रु. ${totalAmtMarathi}/-
💵 *रोख जमा (Cash):* रु. ${cashAmtMarathi}/-
📲 *UPI / ऑनलाइन:* रु. ${upiAmtMarathi}/-
${summary.pending_amt > 0 ? `⚠️ *बाकी शिल्लक (Pending):* रु. ${pendingAmtMarathi}/-\n` : ''}------------------------------------------------
हा अधिकृत दैनिक हिशोब अहवाल मुख्य प्रशासक (Super Admin) यांच्याकडे WhatsApp द्वारे यशस्वीरीत्या सुपूर्द केला आहे.
🌺 *॥ गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! ॥* 🌺`;
  };

  const handleSendHandover = async () => {
    if (summary.count === 0 && !summary.is_pending_day) {
      if (!confirm('या तारखेला कोणतीही पावती नोंदवलेली नाही. तरीही ० रकमेचा अहवाल सुपूर्द करायचा आहे का?')) {
        return;
      }
    }

    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const payload = {
        date: summary.date,
        username: (user?.username || '').toLowerCase(),
        admin_name: user?.name || user?.username || 'कार्यकर्ता',
        total_receipts: summary.count,
        total_amount: summary.total_amt,
        cash_amount: summary.cash_amt,
        upi_amount: summary.upi_amt,
        pending_amount: summary.pending_amt,
        first_receipt_no: summary.first_receipt,
        last_receipt_no: summary.last_receipt,
        superadmin_phone: superAdminPhone
      };

      // 1. Record handover in database
      const res = await fetch('/api/daily-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'हिशोब सेव्ह करता आला नाही');
      }

      // 2. Format and open WhatsApp directly to Super Admin's phone number
      const waText = buildWhatsAppText();
      const cleanPhone = String(superAdminPhone).replace(/\D/g, '');
      const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waText)}`;

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = waUrl;
      } else {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }

      setMsg({
        type: 'success',
        text: '✅ दैनिक हिशोब सुपूर्द झाला व मुख्य प्रशासक WhatsApp वर अहवाल पाठवला गेला आहे.'
      });

      if (onHandoverSuccess) {
        onHandoverSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (e) {
      setMsg({ type: 'error', text: 'त्रुटी: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white border-2 border-[#D4AF37] rounded-3xl shadow-2xl max-w-xl w-full my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#4A000B] via-[#630D1A] to-[#800020] px-5 py-4 text-white flex items-center justify-between border-b border-[#D4AF37]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#3B070E] flex items-center justify-center font-black">
              📊
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                दैनिक हिशोब सुपूर्ती (Daily Handover)
              </h3>
              <p className="text-[11px] text-amber-200/80 font-medium">
                मुख्य प्रशासक (Super Admin) यांच्याकडे दैनिक संकलन जमा अहवाल
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-amber-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto bg-slate-50">
          
          {/* Lockout Notification Banner only if lockout is enabled by Super Admin */}
          {pendingDays.length > 0 && handoverData?.is_locked ? (
            <div className="p-3 bg-rose-100 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-rose-900 animate-fadeIn">
              <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-black text-rose-950">
                  मागील दिवसाचा हिशोब प्रलंबित आहे (Lockout Active)
                </strong>
                मुख्य प्रशासकाने लागू केलेल्या नियमानुसार, जोपर्यंत मागील दिवसाचा अहवाल WhatsApp वर पाठवला जात नाही, तोपर्यंत नवीन पावत्या तयार करता येणार नाहीत.
              </div>
            </div>
          ) : pendingDays.length > 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-amber-900 animate-fadeIn">
              <Calendar className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-black text-amber-950">
                  मागील दिवसाचा हिशोब सुपूर्द करा
                </strong>
                आपण मागील दिवसाचा जमा अहवाल मुख्य प्रशासकाकडे WhatsApp वर पाठवून रेकॉर्ड पूर्ण करू शकता.
              </div>
            </div>
          ) : null}

          {/* Date Selector Pills */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#800020]" />
              <span>हिशोब सुपूर्तीची तारीख निवडा:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {pendingDays.map(p => {
                const pDate = p.display_date || p.iso_date;
                const isSelected = selectedDate === pDate;
                return (
                  <button
                    key={pDate}
                    type="button"
                    onClick={() => setSelectedDate(pDate)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-rose-700 text-white border-rose-800 shadow-sm'
                        : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    <span>⚠️ {pDate}</span>
                    <span className="text-[10px] bg-white/30 px-1 rounded">मागील बाकी</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
                  selectedDate === todayStr
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>📅 आजचा दिवस ({todayStr})</span>
              </button>
            </div>
          </div>

          {/* Super Admin WhatsApp Info Card */}
          <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-700 block text-[11px]">मुख्य प्रशासक WhatsApp नंबर (DB):</span>
                <span className="font-mono font-black text-emerald-900 text-sm">+{superAdminPhone}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
              थेट मेसेज जाईल
            </span>
          </div>

          {/* Detailed Summary Card */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500">निवडलेली तारीख:</span>
              <span className="text-sm font-black text-[#4A000B]">{summary.date}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold mb-1">
                  <Receipt className="w-3.5 h-3.5 text-[#800020]" />
                  <span>एकूण पावत्या संख्या</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {summary.count} <span className="text-xs font-medium text-slate-500">पावत्या</span>
                </div>
                {summary.first_receipt && (
                  <div className="text-[10px] font-mono font-semibold text-slate-500 mt-0.5 truncate">
                    {summary.first_receipt} ते {summary.last_receipt}
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold mb-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>एकूण संकलित रक्कम</span>
                </div>
                <div className="text-lg font-black text-emerald-800">
                  ₹{summary.total_amt}
                </div>
                <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                  एकूण ठरलेली रक्कम
                </div>
              </div>
            </div>

            {/* Payment Modes Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-600 block">💵 रोख (Cash)</span>
                <span className="text-sm font-black text-amber-900">₹{summary.cash_amt}</span>
              </div>

              <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-600 block">📲 UPI / Online</span>
                <span className="text-sm font-black text-sky-900">₹{summary.upi_amt}</span>
              </div>

              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-rose-700 block">⚠️ बाकी (Due)</span>
                <span className="text-sm font-black text-rose-900">₹{summary.pending_amt}</span>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {msg.text && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
              msg.type === 'error' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {msg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            बंद करा
          </button>

          <button
            type="button"
            onClick={handleSendHandover}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-70 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 text-emerald-100 animate-spin" />
                <span>हिशोब नोंदवत आहे...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-emerald-100" />
                <span>मुख्य प्रशासक WhatsApp वर हिशोब पाठवा</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
