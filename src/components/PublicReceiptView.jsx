import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  Calendar, 
  User, 
  CreditCard, 
  MapPin, 
  Lock
} from 'lucide-react';
import { GanpatiLogo } from './GanpatiLogo';
import { numberToMarathiWords, toMarathiDigits } from '../utils/numberToMarathiWords';

export function PublicReceiptView({ receiptNo, accessKey }) {
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const previewCanvasRef = useRef(null);
  const templateImgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/receipt-template.jpg';
    img.onload = () => setTemplateLoaded(true);
    img.onerror = () => {
      img.src = '/113155.jpg';
      img.onload = () => setTemplateLoaded(true);
    };
  }, []);

  useEffect(() => {
    if (!receiptNo || !accessKey) {
      setError('पावती क्रमांक किंवा सुरक्षितता की अपूर्ण आहे. कृपया अधिकृत WhatsApp मेसेजमधील पूर्ण लिंक वापरा.');
      setLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/public-receipt?receipt=${encodeURIComponent(receiptNo)}&key=${encodeURIComponent(accessKey)}`);
        const data = await res.json();

        if (res.ok && data.success && data.receipt) {
          setReceipt(data.receipt);
        } else {
          setError(data.error || 'अवैध किंवा अनधिकृत पावती लिंक. सुरक्षेच्या कारणास्तव ही पावती उपलब्ध नाही.');
        }
      } catch (err) {
        setError('पावती लोड करताना नेटवर्क त्रुटी आली. कृपया इंटरनेट तपासून पुन्हा प्रयत्न करा.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptNo, accessKey]);

  // Financial calculations
  const r = receipt || {};
  const rawReceiptNo = r.receipt_no || receiptNo || '';
  const shortNoMatch = rawReceiptNo.match(/\d+$/);
  const shortNo = shortNoMatch ? String(parseInt(shortNoMatch[0], 10)) : rawReceiptNo;
  const receiptNoMarathi = toMarathiDigits(shortNo);

  const rawDate = r.date || '';
  const dateMarathi = toMarathiDigits(rawDate);

  const donorName = (r.name_mr || r.name_en || '').trim();
  const isPending = Boolean(r.is_pending) && Number(r.pending_amount) > 0;
  const totalAmount = Number(r.amount) || 0;
  const pendingAmount = isPending ? Number(r.pending_amount) : 0;
  const receivedAmount = isPending 
    ? (r.received_amount !== undefined ? Number(r.received_amount) : Math.max(0, totalAmount - pendingAmount))
    : totalAmount;

  const amountWords = r.amount_words_mr || numberToMarathiWords(receivedAmount, 'रुपये मात्र');
  const amountDigitsMarathi = toMarathiDigits(receivedAmount);
  const pendingDigitsMarathi = toMarathiDigits(pendingAmount);
  const totalDigitsMarathi = toMarathiDigits(totalAmount);

  // Canvas drawing
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
    ctx.font = 'bold 20px "Mukta", sans-serif';
    ctx.fillStyle = '#4A000B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(receiptNoMarathi, 542, 365);

    // 3. दि. (Date)
    ctx.font = 'bold 18px "Mukta", sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(dateMarathi, 862, 365);

    // 4. श्री./सौ. (Name of Donor)
    ctx.font = 'bold 21px "Mukta", sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(donorName, 545, 427);

    // 5. यांसकडून अक्षरी रुपये (Amount in Words)
    ctx.font = 'bold 19px "Mukta", sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(amountWords, 642, 467);

    // 6. Fourth line (Pending info or note)
    if (isPending) {
      ctx.font = 'bold 16px "Mukta", sans-serif';
      ctx.fillStyle = '#9F1239';
      ctx.fillText(`⚠️ बाकी शिल्लक रक्कम: रु. ${pendingDigitsMarathi}/- (एकूण ठरलेली: रु. ${totalDigitsMarathi}/-)`, 465, 512);
    }

    // 7. रु. (Amount in Numbers inside the white rectangular box)
    ctx.font = '900 24px "Mukta", sans-serif';
    ctx.fillStyle = '#800020';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${amountDigitsMarathi}/-`, 569, 573);
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
    if (receipt) {
      renderLiveReceipt();
    }
  }, [receipt, templateLoaded, donorName, amountWords, receivedAmount]);

  const handleDownload = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    setIsDownloading(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = (donorName || 'पावती').replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
      link.download = `Pavthi_${shortNo}_${safeName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('पावती डाऊनलोड करताना त्रुटी आली: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6ED] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#D4AF37] rounded-3xl p-8 max-w-sm w-full text-center shadow-xl space-y-4 animate-fadeIn">
          <GanpatiLogo className="w-16 h-16 mx-auto animate-pulse" />
          <div>
            <h3 className="font-serif font-black text-lg text-[#4A000B]">
              ॥ श्री गणेशाय नमः ॥
            </h3>
            <p className="text-xs text-slate-600 font-bold mt-1">
              अधिकृत डिजिटल पावती पडताळणी होत आहे...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800">
            <Loader2 className="w-4 h-4 animate-spin text-[#B45309]" />
            <span>कृपया काही सेकंद थांबा</span>
          </div>
        </div>
      </div>
    );
  }

  // Error / Security Rejection State
  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-[#FAF6ED] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-rose-300 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto text-rose-600">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-black px-2.5 py-0.5 rounded-full mb-1">
              सुरक्षा पडताळणी अयशस्वी
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              अवैध किंवा अनधिकृत पावती लिंक
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
              {error || 'सुरक्षेच्या कारणास्तव ही पावती उपलब्ध नाही. इतर कोणत्याही व्यक्तीची पावती परवानगीशिवाय उघडता किंवा पाहता येत नाही.'}
            </p>
          </div>
          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            अकरा मारुती चौक सार्वजनिक गणेशोत्सव मंडळ, शुक्रवार पेठ, पुणे
          </div>
        </div>
      </div>
    );
  }

  // Valid Single Donor Receipt View
  return (
    <div className="min-h-screen bg-[#FAF6ED] text-[#1E293B] flex flex-col justify-between p-3 sm:p-6 selection:bg-amber-200">
      
      {/* Top Header Card */}
      <header className="max-w-3xl mx-auto w-full bg-gradient-to-r from-[#4A000B] via-[#630D1A] to-[#800020] border-2 border-[#D4AF37] rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <GanpatiLogo className="w-12 h-12 shrink-0 drop-shadow-md hidden sm:block" />
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-black mb-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>अधिकृत डिजिटल पावती (Verified Official Receipt)</span>
            </div>
            <h1 className="font-serif font-black text-sm sm:text-base text-amber-100 leading-tight">
              अकरा मारुती चौक सार्वजनिक गणेशोत्सव मंडळ
            </h1>
            <p className="text-[11px] text-amber-200/80 font-medium">
              २४५, शुक्रवार पेठ, पुणे – ४११ ००२ • ॥ प्रथम दगडूशेठ गणपती ॥
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B45309] hover:from-[#C59B27] hover:to-[#92400E] active:scale-95 text-[#3B070E] font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'डाऊनलोड होत आहे...' : 'पावती डाऊनलोड करा'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition cursor-pointer hidden sm:block"
            title="प्रिंट करा"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Receipt Content */}
      <main className="max-w-3xl mx-auto w-full my-4 sm:my-6 space-y-4">
        
        {/* Printable Visual Receipt Canvas (Fully Scrollable) */}
        <div className="bg-white border-2 border-[#D4AF37]/60 rounded-3xl shadow-xl p-3 sm:p-5 overflow-hidden flex flex-col items-center">
          
          {/* Scroll Guidance Indicator */}
          <div className="text-[11px] font-bold text-[#800020] bg-amber-100/95 border border-[#D4AF37]/60 px-3.5 py-1 rounded-full flex items-center justify-between gap-2 shadow-2xs select-none w-full max-w-[820px] mb-2">
            <span className="flex items-center gap-1">
              <span>↕️ ↔️ संपूर्ण पावती पाहण्यासाठी वर-खाली व डावीकडे-उजवीकडे स्क्रोल करा</span>
            </span>
            <span className="text-[10px] bg-[#800020] text-white px-2 py-0.5 rounded-full font-bold shrink-0">
              स्क्रोल करा
            </span>
          </div>

          <div className="w-full max-w-[820px] overflow-auto max-h-[54vh] sm:max-h-[60vh] rounded-2xl border-2 border-slate-300 bg-slate-200/50 p-2 shadow-inner">
            <div className="printable-receipt-container min-w-[620px] sm:min-w-0 w-full max-w-[800px] mx-auto shadow-md rounded-xl overflow-hidden bg-white border border-slate-200">
              <canvas
                ref={previewCanvasRef}
                width={1000}
                height={646}
                className="w-full h-auto block select-none bg-amber-50/50"
                style={{ aspectRatio: '1000 / 646' }}
              />
            </div>
          </div>

          {/* Preload Template Image */}
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

          {/* Action Row below Canvas */}
          <div className="no-print mt-4 flex flex-wrap items-center justify-center gap-3 w-full">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B45309] hover:from-[#C59B27] hover:to-[#92400E] active:scale-95 text-[#3B070E] font-black text-sm rounded-2xl shadow-lg transition cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>{isDownloading ? 'डाऊनलोड होत आहे...' : 'पावती फोटो डाऊनलोड करा (Download Image)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#4A000B] hover:bg-[#3B070E] active:scale-95 text-[#FFFDF9] font-black text-sm rounded-2xl shadow-md border border-[#D4AF37]/50 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#FDE68A]" />
              <span>पावती प्रिंट करा (Print)</span>
            </button>
          </div>
        </div>

        {/* Receipt Verification Summary Details */}
        <div className="bg-white border border-[#E8DEC8] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-black text-[#4A000B]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>अधिकृत डिजिटल नोंदणी तपशील</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
              <span className="text-[10px] text-slate-500 font-bold block">पावती क्रमांक</span>
              <strong className="text-sm font-mono font-black text-[#800020]">{receipt.receipt_no}</strong>
            </div>

            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
              <span className="text-[10px] text-slate-500 font-bold block">दिनांक</span>
              <strong className="text-sm font-bold text-slate-900">{receipt.date}</strong>
            </div>

            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
              <span className="text-[10px] text-slate-500 font-bold block">जमा रक्कम</span>
              <strong className="text-sm font-black text-emerald-700">₹{receivedAmount}/-</strong>
            </div>

            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
              <span className="text-[10px] text-slate-500 font-bold block">जमा पद्धत</span>
              <strong className="text-sm font-bold text-slate-800">{receipt.payment_mode || 'रोख'}</strong>
            </div>
          </div>

          <div className="pt-2 text-center text-xs font-medium text-slate-600 leading-relaxed">
            🚩 आपल्या मोलाच्या योगदानाबद्दल अकरा मारुती चौक सार्वजनिक गणेशोत्सव मंडळाकडून मनःपूर्वक धन्यवाद!<br/>
            🌺 <strong className="text-[#800020] font-serif">॥ गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! ॥</strong> 🌺
          </div>
        </div>
      </main>

      {/* Verified Security Notice Footer */}
      <footer className="max-w-3xl mx-auto w-full text-center py-3 text-[11px] font-bold text-slate-500 border-t border-slate-200/80 select-none">
        🔒 ही पावती सुरक्षित असून मंडळाच्या केंद्रीय सर्व्हरद्वारे डिजिटल पडताळलेली आहे.
      </footer>
    </div>
  );
}
