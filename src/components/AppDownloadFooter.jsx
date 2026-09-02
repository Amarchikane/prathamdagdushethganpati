import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, Sparkles, Share, PlusSquare, X } from 'lucide-react';

export function AppDownloadFooter({ lang, t }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      <footer className="bg-gradient-to-b from-[#1C0D10] to-[#120709] text-[#FDE68A]/90 pt-8 pb-6 border-t-2 border-[#D4AF37]/50 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Download / Install App Card */}
          <div className="bg-[#2B0E14]/90 border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-6 mb-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/20 text-[#FDE68A] border border-[#D4AF37]/40">
                <Sparkles className="w-3 h-3 text-[#FDE68A]" />
                {t.download_app_badge || 'मोफत • ऑफलाइन कार्यक्षम'}
              </span>
              <span className="text-[11px] text-amber-200/80 font-medium bg-black/30 px-2 py-0.5 rounded-full">
                Android (APK) & iOS
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#FFFDF9] mb-1.5 flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5 text-[#FDE68A]" />
              {lang === 'mr' ? 'मोबाईल ॲप इन्स्टॉल करा' : 'Install Mobile App'}
            </h3>

            <p className="text-xs text-amber-100/75 max-w-md mx-auto mb-4 leading-relaxed">
              {lang === 'mr' 
                ? 'हे ॲप आपल्या मोबाईलवर इन्स्टॉल करा आणि इंटरनेट नसतानाही सर्व वर्गणी नोंदी झटपट शोधा.'
                : 'Install this app on your phone for instant, offline access to all contribution records.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
              {/* Direct Android APK Download Button */}
              <a
                href="/11Maruti.apk"
                download="अकरा-मारुती-11Maruti.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-black text-sm bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#1C0D10] shadow-lg shadow-black/40 active:scale-95 transition-all border-2 border-[#FDE68A]"
              >
                <Download className="w-5 h-5 text-[#1C0D10] shrink-0 stroke-[2.5] animate-bounce" />
                <span className="font-extrabold tracking-wide text-slate-950">
                  {lang === 'mr' ? 'Android ॲप डाउनलोड करा (APK)' : 'Download Android App (APK)'}
                </span>
              </a>

              {/* iPhone / iOS Guide Button */}
              <button
                type="button"
                onClick={() => setShowIosModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-[#3B070E] hover:bg-[#520A14] text-[#FDE68A] border-2 border-[#D4AF37]/80 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Share className="w-4 h-4 text-[#FDE68A] shrink-0" />
                <span>{lang === 'mr' ? 'iPhone (आयफोन) इन्स्टॉल सूचना' : 'iPhone / iOS Instructions'}</span>
              </button>

              {/* PWA Direct Install Button (Chrome desktop/mobile) */}
              {deferredPrompt && !isInstalled && (
                <button
                  type="button"
                  onClick={handlePwaInstall}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#4A000B] hover:bg-[#630D1A] text-amber-200 border border-amber-500/40 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{t.install_app_btn || 'थेट इन्स्टॉल करा'}</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-amber-200/60 mt-3">
              💡 {lang === 'mr' 
                ? "अँड्रॉइड वापरकर्त्यांनी APK डाउनलोड करून इन्स्टॉल करावे, तर आयफोनवर Safari मधील 'Add to Home Screen' वापरावे."
                : "Android users download APK directly. iPhone users use 'Add to Home Screen' in Safari."}
            </p>
          </div>

          {/* Mandal Trademark & Location Footer */}
          <div className="font-medium text-[11px] sm:text-xs text-amber-100/70 tracking-wide border-t border-[#D4AF37]/20 pt-4">
            अकरा मारुती चौक सार्वजनिक गणेश उत्सव मित्र मंडळ, शुक्रवार पेठ पुणे.
          </div>
        </div>
      </footer>

      {/* iOS / iPhone Step-by-Step Installation Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF6ED] border-2 border-[#D4AF37] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-slate-900">
            {/* Close Button */}
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#3B070E] text-[#FDE68A] flex items-center justify-center mx-auto mb-2.5 shadow-md border border-[#D4AF37]/50">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#4A000B]">
                {lang === 'mr' ? 'आयफोनवर (iPhone) ॲप कसे जोडावे?' : 'How to install on iPhone / iPad?'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {lang === 'mr' 
                  ? 'अ‍ॅपल स्टोअर किंवा डेव्हलपर खात्याची गरज नाही — १००% मोफत व सोपे!'
                  : 'No App Store account needed — 100% Free & Easy!'}
              </p>
            </div>

            {/* Step-by-Step Guide */}
            <div className="space-y-3.5 text-xs text-slate-800">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/70">
                <span className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center font-black shrink-0 text-[11px]">
                  १
                </span>
                <div>
                  <div className="font-bold text-slate-900">
                    {lang === 'mr' ? 'सफारी (Safari) ब्राऊझर वापरा' : 'Open in Safari browser'}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {lang === 'mr' 
                      ? 'हे संकेतस्थळ आयफोनमधील अधिकृत Safari ब्राऊझरमध्ये उघडा.'
                      : 'Make sure this site is open in Apple’s official Safari browser.'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/70">
                <span className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center font-black shrink-0 text-[11px]">
                  २
                </span>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{lang === 'mr' ? 'शेअर आयकॉन दाबा' : 'Tap Share button'}</span>
                    <Share className="w-3.5 h-3.5 text-[#800020] inline" />
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {lang === 'mr' 
                      ? 'सफारीच्या तळाशी असणाऱ्या चौकोनी शेअर आयकॉनवर (Square with Arrow ⬆️) टॅप करा.'
                      : 'Tap the Share icon (square with upward arrow ⬆️) at the bottom bar of Safari.'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/70">
                <span className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center font-black shrink-0 text-[11px]">
                  ३
                </span>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{lang === 'mr' ? "'Add to Home Screen' निवडा" : "Select 'Add to Home Screen'"}</span>
                    <PlusSquare className="w-3.5 h-3.5 text-[#800020] inline" />
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {lang === 'mr' 
                      ? "खाली स्क्रोल करून 'Add to Home Screen' (होम स्क्रीनवर जोडा) वर टॅप करा आणि वर उजवीकडे 'Add' दाबा."
                      : "Scroll down, select 'Add to Home Screen', and tap 'Add' in the top right corner."}
                  </div>
                </div>
              </div>
            </div>

            {/* Success Box */}
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-300/80 text-emerald-950 flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-[11px] leading-tight">
                {lang === 'mr' 
                  ? 'अभिनंदन! आता तुमच्या आयफोनच्या होम स्क्रीनवर गणपती बाप्पाच्या लोगोचे ॲप तयार झाले असून ते पूर्ण स्क्रीन व ऑफलाइन चालेल.'
                  : 'Done! The app with the Ganpati logo will now be on your iPhone screen and works offline full-screen.'}
              </div>
            </div>

            {/* Got It Button */}
            <button
              onClick={() => setShowIosModal(false)}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-[#4A000B] to-[#800020] text-white font-bold text-xs rounded-xl shadow-md border border-[#D4AF37]/50 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              {lang === 'mr' ? 'समजले (Close)' : 'Got it (Close)'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

