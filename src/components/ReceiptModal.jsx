import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  MessageSquare, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  Eye,
  FileText,
  Loader2,
  Phone,
  Send,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { numberToMarathiWords, toMarathiDigits } from '../utils/numberToMarathiWords';

export function ReceiptModal({ isOpen, onClose, receipt, onResetNew, lang }) {
  const t = TRANSLATIONS[lang];
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [activeView, setActiveView] = useState('template'); // 'template' | 'details'
  const [isSharing, setIsSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState(null);
  const [recipientMobile, setRecipientMobile] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const templateImgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Sync recipient mobile when receipt changes
  useEffect(() => {
    if (receipt?.mobile) {
      setRecipientMobile(receipt.mobile);
    } else {
      setRecipientMobile('');
    }
    setPhoneError('');
  }, [receipt]);

  useEffect(() => {
    const img = new Image();
    img.src = '/receipt-template.jpg';
    img.onload = () => setTemplateLoaded(true);
  }, []);

  // Safe reference when receipt is null (during initial render or when closed)
  const r = receipt || {};

  // Extract clean receipt number (e.g. "101" from "AM-2024-0101" or raw receipt_no)
  const rawReceiptNo = r.receipt_no || '101';
  const shortNoMatch = rawReceiptNo.match(/\d+$/);
  const shortNo = shortNoMatch ? String(parseInt(shortNoMatch[0], 10)) : rawReceiptNo;
  const receiptNoMarathi = toMarathiDigits(shortNo);

  // Date in Marathi numerals
  const rawDate = r.date || new Date().toLocaleDateString('mr-IN');
  const dateMarathi = toMarathiDigits(rawDate);

  // Donor Name
  const donorName = (r.name_mr || r.name_en || '').trim();

  // Financials & Pending amounts
  const isPending = Boolean(r.is_pending) && Number(r.pending_amount) > 0;
  const totalAmount = Number(r.amount) || 0;
  const pendingAmount = isPending ? Number(r.pending_amount) : 0;
  const receivedAmount = isPending 
    ? (r.received_amount !== undefined ? Number(r.received_amount) : Math.max(0, totalAmount - pendingAmount))
    : totalAmount;

  // Amount in Marathi Words: e.g. "एक हजार एक रुपये मात्र"
  const amountWords = r.amount_words_mr || numberToMarathiWords(receivedAmount, 'रुपये मात्र');

  // Amount in Marathi digits: e.g. "१००१"
  const amountDigitsMarathi = toMarathiDigits(receivedAmount);
  const pendingDigitsMarathi = toMarathiDigits(pendingAmount);
  const totalDigitsMarathi = toMarathiDigits(totalAmount);

  // Helper to extract clean digits from phone number
  const cleanDigits = (recipientMobile || '').replace(/\D/g, '');

  // Formatted Indian WhatsApp number (91XXXXXXXXXX)
  let waPhone = '';
  if (cleanDigits) {
    let d = cleanDigits;
    if (d.length === 11 && d.startsWith('0')) {
      d = d.slice(1);
    }
    if (d.length === 10) {
      waPhone = `91${d}`;
    } else if (d.length === 12 && d.startsWith('91')) {
      waPhone = d;
    } else {
      waPhone = d;
    }
  }

  // Formatted Domestic SMS number (10 digits)
  let smsPhone = '';
  if (cleanDigits) {
    let d = cleanDigits;
    if (d.length === 12 && d.startsWith('91')) {
      smsPhone = d.slice(2);
    } else if (d.length === 11 && d.startsWith('0')) {
      smsPhone = d.slice(1);
    } else {
      smsPhone = d;
    }
  }

  // Digital receipt public link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const onlineReceiptUrl = currentOrigin ? `${currentOrigin}/?receipt=${encodeURIComponent(rawReceiptNo)}` : '';

  // Official Marathi formatted WhatsApp Message
  const shareText = `🚩 *अकरा मारुती चौक सार्वजनिक गणेशोत्सव मंडळ* 🚩
२४५, शुक्रवार पेठ, पुणे – ४११ ००२
•॥ प्रथम दगडूशेठ गणपती ॥•
(रजि. क्र. : एफ १२००४ / स्थापना : सन १९३२)
----------------------------------------
*अधिकृत वर्गणी / देणगी पावती*
*पावती क्र.:* ${receiptNoMarathi} (${rawReceiptNo})
*दि.:* ${dateMarathi}
*श्री./सौ.:* ${donorName}
*यांसकडून अक्षरी रुपये:* ${amountWords}
*रु. (रक्कम):* ${amountDigitsMarathi}/-
${isPending ? `*⚠️ बाकी शिल्लक रक्कम:* रु. ${pendingDigitsMarathi}/- (एकूण ठरलेली: रु. ${totalDigitsMarathi}/-)\n` : ''}*चौक / परिसर:* ${r.landmark_mr || 'शुक्रवार पेठ'}
*पद्धत:* ${r.payment_mode || 'रोख मिळाले'}
----------------------------------------
आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद!
बाप्पा आपल्या कुटुंबाला सुख, समृद्धी आणि उत्तम आरोग्य देवो!
🌺 *॥ गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! ॥* 🌺${onlineReceiptUrl ? `\n\n📄 *अधिकृत डिजिटल पावती पहा व डाऊनलोड करा:*\n${onlineReceiptUrl}` : ''}`;

  // ==========================================================================
  // MATHEMATICALLY PRECISE 1000x646 CANVAS IMAGE GENERATOR
  // (Calibrated to exact pixel lines of 113155.jpg)
  // ==========================================================================
  const drawReceiptOnCanvas = (canvas, img) => {
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const width = 1000;
    const height = 646;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw template image background
    ctx.drawImage(img, 0, 0, width, height);

    // 2. पावती क्र. (Receipt Number)
    // Label ends at x: 535, baseline: y = 358
    ctx.font = 'bold 20px "Mukta", sans-serif';
    ctx.fillStyle = '#4A000B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(receiptNoMarathi, 542, 358);

    // 3. दि. (Date)
    // Label ends at x: 854, baseline: y = 358
    ctx.font = 'bold 18px "Mukta", sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(dateMarathi, 862, 358);

    // 4. श्री./सौ. (Name of Donor) - Exactly matching reference image
    ctx.font = 'bold 21px "Mukta", sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(donorName, 545, 421);

    // 5. यांसकडून अक्षरी रुपये (Amount in Words) - Exactly matching reference image
    ctx.font = 'bold 19px "Mukta", sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(amountWords, 642, 461);

    // 6. Fourth line (Pending info or note) - Top line overlaps printed line at y=496
    if (isPending) {
      ctx.font = 'bold 16px "Mukta", sans-serif';
      ctx.fillStyle = '#9F1239';
      ctx.fillText(`⚠️ बाकी शिल्लक रक्कम: रु. ${pendingDigitsMarathi}/- (एकूण ठरलेली: रु. ${totalDigitsMarathi}/-)`, 465, 506);
    }

    // 7. रु. (Amount in Numbers inside the white rectangular box)
    // Box coordinates: x = 504 to 634, y = 551 to 584. Center = 569, 568
    ctx.font = '900 24px "Mukta", sans-serif';
    ctx.fillStyle = '#800020';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${amountDigitsMarathi}/-`, 569, 568);
  };

  const renderLiveReceipt = async () => {
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const domImg = templateImgRef.current;
    if (domImg && domImg.complete && domImg.naturalWidth > 0) {
      drawReceiptOnCanvas(canvas, domImg);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/receipt-template.jpg';
      img.onload = () => drawReceiptOnCanvas(canvas, img);
      img.onerror = () => {
        img.src = '/113155.jpg';
        img.onload = () => drawReceiptOnCanvas(canvas, img);
      };
    }
  };

  useEffect(() => {
    if (isOpen && receipt) {
      renderLiveReceipt();
    }
  }, [isOpen, receipt, templateLoaded, donorName, amountWords, receivedAmount]);

  const generateReceiptCanvas = async () => {
    if (previewCanvasRef.current) {
      return previewCanvasRef.current;
    }
    const canvas = document.createElement('canvas');
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }
    const domImg = templateImgRef.current;
    if (domImg && domImg.complete && domImg.naturalWidth > 0) {
      drawReceiptOnCanvas(canvas, domImg);
      return canvas;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/receipt-template.jpg';
      img.onload = () => {
        drawReceiptOnCanvas(canvas, img);
        resolve(canvas);
      };
      img.onerror = () => {
        img.src = '/113155.jpg';
        img.onload = () => {
          drawReceiptOnCanvas(canvas, img);
          resolve(canvas);
        };
        img.onerror = () => {
          drawReceiptOnCanvas(canvas, img);
          resolve(canvas);
        };
      };
    });
  };

  const getSafeFileName = () => {
    const safeName = (donorName || 'पावती').replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
    return `Pavthi_${shortNo}_${safeName}.png`;
  };

  const triggerImageDownload = (canvas) => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = getSafeFileName();
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // DIRECT WHATSAPP: Goes straight to the recipient's phone number without manual contact selection
  const handleWhatsAppDirect = () => {
    if (!waPhone || cleanDigits.length < 10) {
      setPhoneError(lang === 'mr' ? 'कृपया थेट WhatsApp पाठवण्यासाठी १० अंकी मोबाईल नंबर टाका.' : 'Please enter a 10-digit mobile number for direct WhatsApp.');
      return;
    }
    setPhoneError('');

    // Trigger canvas generation and image download in the background
    generateReceiptCanvas()
      .then((canvas) => {
        triggerImageDownload(canvas);
        if (navigator.clipboard && window.ClipboardItem) {
          canvas.toBlob((blob) => {
            if (blob) {
              navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
            }
          });
        }
      })
      .catch((err) => console.warn('Image generation warning:', err));

    const encoded = encodeURIComponent(shareText);
    const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encoded}`;

    // Direct redirection to WhatsApp 1-on-1 chat
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    setShareNotice(
      lang === 'mr'
        ? `+${waPhone} यांच्या WhatsApp वर थेट मेसेज उघडला आहे (पावती इमेज डाउनलोड झाली आहे).`
        : `WhatsApp chat directly opened for +${waPhone} (Receipt image downloaded).`
    );
    setTimeout(() => setShareNotice(null), 8000);
  };

  // DIRECT SMS: Pre-fills the donor's number in the To field without manual contact selection
  const handleSmsDirect = () => {
    if (!smsPhone || cleanDigits.length < 10) {
      setPhoneError(lang === 'mr' ? 'कृपया थेट SMS पाठवण्यासाठी १० अंकी मोबाईल नंबर टाका.' : 'Please enter a 10-digit mobile number for direct SMS.');
      return;
    }
    setPhoneError('');

    const encoded = encodeURIComponent(shareText);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // iOS requires '&body=', Android standard is '?body='
    const smsUrl = isIOS
      ? `sms:${smsPhone}&body=${encoded}`
      : `sms:${smsPhone}?body=${encoded}`;

    window.location.href = smsUrl;
  };

  // OPTIONAL SYSTEM SHARE SHEET: For sharing to WhatsApp Groups, Telegram, Drive, etc.
  const handleNativeShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setShareNotice(null);

    try {
      const canvas = await generateReceiptCanvas();
      const fileName = getSafeFileName();
      const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
      
      if (blob && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'image/png' });
        const shareData = {
          files: [file],
          title: `🚩 पावती क्र. ${receiptNoMarathi} - ${donorName}`,
          text: shareText
        };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // If cannot share files via Web Share, trigger image download
      triggerImageDownload(canvas);
      setShareNotice(lang === 'mr' ? 'पावती इमेज डाऊनलोड झाली आहे.' : 'Receipt image downloaded.');
      setTimeout(() => setShareNotice(null), 5000);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Native share warning:', e);
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Native Print Trigger
  const handlePrint = () => {
    window.print();
  };

  // Explicit Download Image Trigger
  const handleDownloadImage = async () => {
    try {
      const canvas = await generateReceiptCanvas();
      triggerImageDownload(canvas);
    } catch (e) {
      alert('पावती डाऊनलोड करताना त्रुटी आली: ' + e.message);
    }
  };

  // Early return if modal is closed or no receipt selected (Hooks have already executed)
  if (!isOpen || !receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white border-2 border-[#D4AF37] rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Header Bar (Hidden on print) */}
        <div className="no-print bg-gradient-to-r from-[#4A000B] via-[#630D1A] to-[#800020] px-4 py-3 text-white flex items-center justify-between border-b border-[#D4AF37]/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-sm sm:text-base">
              {lang === 'mr' ? 'अधिकृत श्री गणेश पावती' : 'Official Ganesh Donation Pavthi'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Toggle */}
            <div className="hidden sm:flex bg-black/25 rounded-lg p-0.5 border border-white/20 text-xs font-bold">
              <button
                onClick={() => setActiveView('template')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeView === 'template' ? 'bg-[#D4AF37] text-[#3B070E]' : 'text-white/80 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>मूळ पावती (Template)</span>
              </button>
              <button
                onClick={() => setActiveView('details')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeView === 'details' ? 'bg-[#D4AF37] text-[#3B070E]' : 'text-white/80 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>तपशील (Details)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-amber-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==========================================================================
            RECEIPT CANVAS / VISUAL CONTAINER
            ========================================================================== */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-100">
          
          {/* 1. OFFICIAL TEMPLATE VIEW - LIVE CANVAS (Guarantees zero text shift on any mobile screen) */}
          <div className="printable-receipt-container w-full max-w-[840px] shadow-xl rounded-xl overflow-hidden bg-white">
            <canvas
              ref={previewCanvasRef}
              width={1000}
              height={646}
              className="w-full h-auto block select-none bg-amber-50/50"
              style={{ aspectRatio: '1000 / 646' }}
            />
          </div>

          {/* Hidden Image to Preload Template for Canvas */}
          <img
            ref={templateImgRef}
            src="/receipt-template.jpg"
            alt=""
            className="hidden"
            onLoad={() => {
              setTemplateLoaded(true);
              renderLiveReceipt();
            }}
            onError={(e) => {
              if (e.target.src.indexOf('113155.jpg') === -1) {
                e.target.src = '/113155.jpg';
              }
            }}
          />

          {/* Quick Summary Pill below template */}
          <div className="no-print mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
            <span>पावती क्र: <strong className="text-[#800020]">{receiptNoMarathi}</strong></span>
            <span>•</span>
            <span>दिनांक: <strong>{dateMarathi}</strong></span>
            <span>•</span>
            <span>दाता: <strong>{donorName}</strong></span>
            <span>•</span>
            <span>जमा: <strong className="text-emerald-700">₹{receivedAmount}</strong></span>
            {isPending && (
              <>
                <span>•</span>
                <span className="text-rose-700">⚠️ बाकी: <strong>₹{pendingAmount}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* ==========================================================================
            DIRECT RECIPIENT PHONE & ACTION BUTTONS (DIRECT WHATSAPP & SMS)
            ========================================================================== */}
        <div className="no-print bg-white p-3 sm:p-4 border-t border-slate-200 space-y-3">
          
          {/* Direct Phone Number Input & Verification Bar */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-2.5 sm:p-3">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#800020]" />
                <span>{lang === 'mr' ? 'प्राप्तकर्त्याचा मोबाईल नंबर:' : 'Recipient Mobile Number:'}</span>
                {cleanDigits.length >= 10 && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.2 rounded-full">
                    {lang === 'mr' ? '✓ थेट नंबरवर जाईल' : '✓ Direct Send Ready'}
                  </span>
                )}
              </label>
              
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                {lang === 'mr' ? '(मॅन्युअली संपर्क निवडण्याची गरज नाही)' : '(No manual contact picking needed)'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-bold">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={13}
                  value={recipientMobile}
                  onChange={(e) => {
                    setRecipientMobile(e.target.value);
                    if (phoneError) setPhoneError('');
                  }}
                  placeholder="९८२२००११२२ (10-digit mobile number)"
                  className="w-full pl-11 pr-3 py-2 bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none transition"
                />
              </div>

              {/* Status Indicator */}
              {cleanDigits.length >= 10 ? (
                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 self-center px-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'mr' ? `WhatsApp: +${waPhone}` : `Direct to +${waPhone}`}</span>
                </div>
              ) : (
                <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 self-center px-1 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'mr' ? 'थेट पाठवण्यासाठी नंबर टाका' : 'Enter number for direct send'}</span>
                </div>
              )}
            </div>

            {phoneError && (
              <div className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{phoneError}</span>
              </div>
            )}
          </div>

          {shareNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shareNotice}</span>
            </div>
          )}

          {/* Primary Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Direct WhatsApp to given phone */}
            <button
              onClick={handleWhatsAppDirect}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
              title={lang === 'mr' ? 'दिलेल्या नंबरवर थेट WhatsApp उघडा (इमेज कॉपी होईल)' : 'Open WhatsApp directly to this number'}
            >
              <Send className="w-4 h-4 text-emerald-100" />
              <span>{lang === 'mr' ? '१. WhatsApp थेट नंबरवर (Direct Chat)' : '1. WhatsApp (Direct Chat)'}</span>
            </button>

            {/* Direct WhatsApp with Image File (Web Share) */}
            <button
              onClick={handleNativeShare}
              disabled={isSharing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
              title={lang === 'mr' ? 'पावतीची खरी इमेज फोटो फाईल WhatsApp द्वारे पाठवा' : 'Send receipt image file via WhatsApp'}
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 text-teal-100 animate-spin" />
                  <span>इमेज तयार होत आहे...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-teal-100" />
                  <span>{lang === 'mr' ? '२. WhatsApp वर इमेज फोटो पाठवा (File)' : '2. Send Image File on WhatsApp'}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Guidance Tip */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 text-[11px] text-slate-700 leading-relaxed">
            <div className="font-bold text-[#4A000B] flex items-center gap-1 mb-0.5">
              <span>💡 WhatsApp वर इमेज कशी पाठवावी?</span>
            </div>
            <p className="text-slate-600">
              • <strong>पर्याय १ (थेट नंबरवर):</strong> चॅट थेट नंबरवर उघडते. पावती इमेज गॅलरीत डाऊनलोड होते व क्लिपबोर्डवर कॉपी होते (चॅटमध्ये फक्त <strong>Paste / गॅलरीतून निवडा</strong>). मेसेजमध्ये डिजिटल पावतीची अधिकृत लिंकही असते.<br/>
              • <strong>पर्याय २ (इमेज फोटो):</strong> पावतीची मूळ रंगीत फोटो फाईल थेट WhatsApp द्वारे पाठवण्यासाठी हे वापरा.
            </p>
          </div>

          {/* Secondary Action Buttons Grid: SMS, Print, Download */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Direct SMS to given phone */}
            <button
              onClick={handleSmsDirect}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              title={lang === 'mr' ? 'दिलेल्या नंबरवर थेट SMS पाठवा' : 'Send SMS directly to this number'}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-100" />
              <span>{lang === 'mr' ? 'SMS (थेट नंबरवर)' : 'SMS (Direct)'}</span>
            </button>

            {/* Print Receipt */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-[#4A000B] hover:bg-[#3B070E] active:scale-95 text-[#FFFDF9] font-bold text-xs rounded-xl shadow-sm border border-[#D4AF37]/50 transition cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>{lang === 'mr' ? 'पावती प्रिंट' : 'Print'}</span>
            </button>

            {/* Download Image */}
            <button
              onClick={handleDownloadImage}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              title="Download filled image"
            >
              <Download className="w-3.5 h-3.5 text-amber-100" />
              <span>{lang === 'mr' ? 'इमेज डाउनलोड' : 'Download'}</span>
            </button>
          </div>

          {/* Secondary Action Row: Other Apps (System Share Sheet), Reset, Cancel */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                {t.cancel_btn}
              </button>

              {/* Optional: Share sheet for Telegram, Groups or other apps */}
              {typeof navigator !== 'undefined' && Boolean(navigator.canShare) && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={isSharing}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                  title="Share sheet for Telegram, Groups or other apps"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'mr' ? 'इतर ॲप्स (Share Sheet)' : 'Other Apps'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (onResetNew) onResetNew();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.new_entry_reset}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
