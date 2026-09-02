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
  Loader2
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { numberToMarathiWords, toMarathiDigits } from '../utils/numberToMarathiWords';

export function ReceiptModal({ isOpen, onClose, receipt, onResetNew, lang }) {
  const t = TRANSLATIONS[lang];
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [activeView, setActiveView] = useState('template'); // 'template' | 'details'
  const [isSharing, setIsSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState(null);
  const templateImgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/receipt-template.jpg';
    img.onload = () => setTemplateLoaded(true);
  }, []);

  if (!isOpen || !receipt) return null;

  // Extract clean receipt number (e.g. "101" from "AM-2024-0101" or raw receipt_no)
  const rawReceiptNo = receipt.receipt_no || '101';
  const shortNoMatch = rawReceiptNo.match(/\d+$/);
  const shortNo = shortNoMatch ? String(parseInt(shortNoMatch[0], 10)) : rawReceiptNo;
  const receiptNoMarathi = toMarathiDigits(shortNo);

  // Date in Marathi numerals
  const rawDate = receipt.date || new Date().toLocaleDateString('mr-IN');
  const dateMarathi = toMarathiDigits(rawDate);

  // Donor Name
  const donorName = (receipt.name_mr || receipt.name_en || '').trim();

  // Financials & Pending amounts
  const isPending = Boolean(receipt.is_pending) && Number(receipt.pending_amount) > 0;
  const totalAmount = Number(receipt.amount) || 0;
  const pendingAmount = isPending ? Number(receipt.pending_amount) : 0;
  const receivedAmount = isPending 
    ? (receipt.received_amount !== undefined ? Number(receipt.received_amount) : Math.max(0, totalAmount - pendingAmount))
    : totalAmount;

  // Amount in Marathi Words: e.g. "एक हजार एक रुपये मात्र"
  const amountWords = receipt.amount_words_mr || numberToMarathiWords(receivedAmount, 'रुपये मात्र');

  // Amount in Marathi digits: e.g. "१००१"
  const amountDigitsMarathi = toMarathiDigits(receivedAmount);
  const pendingDigitsMarathi = toMarathiDigits(pendingAmount);
  const totalDigitsMarathi = toMarathiDigits(totalAmount);

  // Format recipient mobile number for WhatsApp & SMS
  const cleanMobile = (receipt.mobile || '').replace(/\D/g, '');
  const waPhone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

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
${isPending ? `*⚠️ बाकी शिल्लक रक्कम:* रु. ${pendingDigitsMarathi}/- (एकूण ठरलेली: रु. ${totalDigitsMarathi}/-)\n` : ''}*चौक / परिसर:* ${receipt.landmark_mr || 'शुक्रवार पेठ'}
*पद्धत:* ${receipt.payment_mode || 'रोख मिळाले'}
----------------------------------------
आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद!
बाप्पा आपल्या कुटुंबाला सुख, समृद्धी आणि उत्तम आरोग्य देवो!
🌺 *॥ गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! ॥* 🌺`;

  // ==========================================================================
  // MATHEMATICALLY PRECISE 1000x646 CANVAS IMAGE GENERATOR
  // (Calibrated to exact pixel lines of 113155.jpg)
  // ==========================================================================
  const generateReceiptCanvas = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 1000;
    const height = 646;
    canvas.width = width;
    canvas.height = height;

    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }

    const drawOnCanvas = (img) => {
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

      // 4. श्री./सौ. (Name of Donor) - BELOW THE LINE at y=412
      ctx.font = 'bold 21px "Mukta", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(donorName, 545, 434);

      // 5. यांसकडून अक्षरी रुपये (Amount in Words) - BELOW THE LINE at y=452
      ctx.font = 'bold 19px "Mukta", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(amountWords, 642, 474);

      // 6. Fourth line (Pending info or note) - BELOW line at y=496
      if (isPending) {
        ctx.font = 'bold 16px "Mukta", sans-serif';
        ctx.fillStyle = '#9F1239';
        ctx.fillText(`⚠️ बाकी शिल्लक रक्कम: रु. ${pendingDigitsMarathi}/- (एकूण ठरलेली: रु. ${totalDigitsMarathi}/-)`, 465, 518);
      }

      // 7. रु. (Amount in Numbers inside the white rectangular box)
      // Box coordinates: x = 504 to 634, y = 551 to 584. Center = 569, 568
      ctx.font = '900 24px "Mukta", sans-serif';
      ctx.fillStyle = '#800020';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${amountDigitsMarathi}/-`, 569, 568);
    };

    const domImg = templateImgRef.current;
    if (domImg && domImg.complete && domImg.naturalWidth > 0) {
      drawOnCanvas(domImg);
      return canvas;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/receipt-template.jpg';
      img.onload = () => {
        drawOnCanvas(img);
        resolve(canvas);
      };
      img.onerror = () => {
        img.src = '/113155.jpg';
        img.onload = () => {
          drawOnCanvas(img);
          resolve(canvas);
        };
        img.onerror = () => {
          ctx.fillStyle = '#FFF8E7';
          ctx.fillRect(0, 0, width, height);
          drawOnCanvas(img);
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

  // WhatsApp Share with Receipt Image & Formatted Text
  const handleWhatsAppShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setShareNotice(null);

    try {
      const canvas = await generateReceiptCanvas();
      const fileName = getSafeFileName();

      // Convert canvas to Blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (!blob) {
        throw new Error('इमेज तयार करणे अयशस्वी झाले');
      }

      let file = null;
      try {
        file = new File([blob], fileName, { type: 'image/png' });
      } catch (fileErr) {
        console.warn('File constructor error:', fileErr);
      }

      // Check for Web Share API Level 2 (native file sharing on mobile / Android PWA / iOS)
      let sharedSuccessfully = false;
      if (file && navigator.canShare && typeof navigator.canShare === 'function') {
        let shareData = {
          files: [file],
          title: `🚩 पावती क्र. ${receiptNoMarathi} - ${donorName}`,
          text: shareText,
        };

        if (!navigator.canShare(shareData)) {
          shareData = { files: [file] };
        }

        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            sharedSuccessfully = true;
          } catch (shareErr) {
            if (shareErr.name === 'AbortError') {
              // User cancelled native share sheet
              setIsSharing(false);
              return;
            }
            console.warn('Native share failed, falling back:', shareErr);
          }
        }
      }

      // Fallback for Desktop browsers or environments where file sharing via Web Share isn't supported:
      // Desktop WhatsApp Web cannot accept file uploads directly via wa.me URL parameters.
      // So we:
      // 1. Copy the receipt image to clipboard (user can simply press Ctrl+V in WhatsApp chat)
      // 2. Download the receipt PNG to computer
      // 3. Open WhatsApp chat with pre-filled message text
      if (!sharedSuccessfully) {
        let copied = false;
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            copied = true;
          } catch (clipErr) {
            console.warn('Clipboard write failed:', clipErr);
          }
        }

        triggerImageDownload(canvas);

        const encoded = encodeURIComponent(shareText);
        const waUrl = waPhone 
          ? `https://api.whatsapp.com/send?phone=${waPhone}&text=${encoded}`
          : `https://api.whatsapp.com/send?text=${encoded}`;
        window.open(waUrl, '_blank');

        setShareNotice(
          copied
            ? 'पावती इमेज डाऊनलोड झाली व क्लिपबोर्डवर कॉपी केली आहे. WhatsApp वर Paste (Ctrl+V) करा!'
            : 'पावती इमेज डाऊनलोड झाली आहे. WhatsApp वर इमेज जोडून पाठवा.'
        );
        setTimeout(() => setShareNotice(null), 8000);
      }
    } catch (e) {
      console.error('WhatsApp share error:', e);
      // Fallback to text link if canvas generation has errors
      const encoded = encodeURIComponent(shareText);
      const waUrl = waPhone 
        ? `https://api.whatsapp.com/send?phone=${waPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;
      window.open(waUrl, '_blank');
    } finally {
      setIsSharing(false);
    }
  };

  // SMS Share Trigger
  const handleSmsShare = () => {
    const encoded = encodeURIComponent(shareText);
    const smsUrl = cleanMobile 
      ? `sms:${cleanMobile}?body=${encoded}`
      : `sms:?body=${encoded}`;
    window.location.href = smsUrl;
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
          
          {/* 1. OFFICIAL TEMPLATE VIEW (113155.jpg with dynamic text overlay) */}
          <div className="printable-receipt-container w-full max-w-[840px] shadow-xl rounded-xl overflow-hidden bg-white">
            <div className="relative w-full aspect-[1000/646] select-none">
              {/* Background Original Template Image */}
              <img
                ref={templateImgRef}
                src="/receipt-template.jpg"
                alt="अकरा मारुती चौक पावती"
                className="w-full h-full object-cover block"
                onError={(e) => {
                  if (e.target.src.indexOf('113155.jpg') === -1) {
                    e.target.src = '/113155.jpg';
                  }
                }}
              />

              {/* OVERLAY FIELD 1: पावती क्र. (Receipt Number) */}
              <div 
                style={{ left: '54.2%', top: '50.8%' }}
                className="absolute font-bold text-[#4A000B] text-[13px] sm:text-[18px] md:text-[21px] tracking-tight whitespace-nowrap"
              >
                {receiptNoMarathi}
              </div>

              {/* OVERLAY FIELD 2: दि. (Date) */}
              <div 
                style={{ left: '86.2%', top: '50.8%' }}
                className="absolute font-bold text-slate-800 text-[12px] sm:text-[16px] md:text-[19px] whitespace-nowrap"
              >
                {dateMarathi}
              </div>

              {/* OVERLAY FIELD 3: श्री./सौ. (Name of Donor) - BELOW THE LINE */}
              <div 
                style={{ left: '54.5%', top: '64.5%' }}
                className="absolute font-black text-slate-900 text-[14px] sm:text-[19px] md:text-[22px] whitespace-nowrap truncate max-w-[42%]"
                title={donorName}
              >
                {donorName}
              </div>

              {/* OVERLAY FIELD 4: यांसकडून अक्षरी रुपये (Amount in Words) - BELOW THE LINE */}
              <div 
                style={{ left: '64.2%', top: '70.8%' }}
                className="absolute font-bold text-slate-900 text-[12px] sm:text-[16px] md:text-[19px] whitespace-nowrap truncate max-w-[33%]"
                title={amountWords}
              >
                {amountWords}
              </div>

              {/* OVERLAY FIELD 5: Fourth Line (Pending Info) - BELOW LINE */}
              {isPending && (
                <div 
                  style={{ left: '46.5%', top: '77.2%' }}
                  className="absolute font-black text-rose-800 text-[11px] sm:text-[14px] md:text-[16px] whitespace-nowrap"
                >
                  ⚠️ बाकी: रु. {pendingDigitsMarathi}/- (एकूण: रु. {totalDigitsMarathi}/-)
                </div>
              )}

              {/* OVERLAY FIELD 6: रु. (Amount in Numbers) - EXACTLY inside the white rectangular box */}
              <div 
                style={{ 
                  left: '50.4%', 
                  top: '85.3%', 
                  width: '13.0%', 
                  height: '5.2%' 
                }}
                className="absolute flex items-center justify-center font-black text-[#800020] text-[14px] sm:text-[20px] md:text-[24px] font-mono leading-none"
              >
                {amountDigitsMarathi}/-
              </div>
            </div>
          </div>

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
            ACTION BUTTONS (WHATSAPP, SMS, PRINT, DOWNLOAD, RESET)
            ========================================================================== */}
        <div className="no-print bg-white p-3 sm:p-4 border-t border-slate-200 space-y-2.5">
          {shareNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shareNotice}</span>
            </div>
          )}

          {/* Sharing Buttons Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* WhatsApp Message */}
            <button
              onClick={handleWhatsAppShare}
              disabled={isSharing}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-75 disabled:cursor-wait text-white font-bold text-xs sm:text-sm rounded-xl shadow transition cursor-pointer"
              title="WhatsApp वर इमेज व मेसेज पाठवा"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-100 animate-spin" />
                  <span>तयार होत आहे...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-emerald-100" />
                  <span>WhatsApp वर पाठवा</span>
                </>
              )}
            </button>

            {/* SMS Message */}
            <button
              onClick={handleSmsShare}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition cursor-pointer"
              title="Send via SMS"
            >
              <MessageSquare className="w-4 h-4 text-sky-100" />
              <span>SMS मेसेज पाठवा</span>
            </button>

            {/* Print Receipt */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#4A000B] hover:bg-[#3B070E] active:scale-95 text-[#FFFDF9] font-bold text-xs sm:text-sm rounded-xl shadow border border-[#D4AF37]/50 transition cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4 text-[#FDE68A]" />
              <span>पावती प्रिंट (Print)</span>
            </button>

            {/* Download Image */}
            <button
              onClick={handleDownloadImage}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition cursor-pointer"
              title="Download filled image"
            >
              <Download className="w-4 h-4 text-amber-100" />
              <span>पावती इमेज डाउनलोड</span>
            </button>
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              {t.cancel_btn}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onResetNew) onResetNew();
                onClose();
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.new_entry_reset}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
