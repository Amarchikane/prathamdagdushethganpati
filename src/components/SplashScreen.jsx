import React, { useState, useEffect, useRef } from 'react';

export function SplashScreen({ onFinish, lang = 'mr' }) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Smooth progress counter from 0 to 100%
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 6;
      });
    }, 100);

    // 1. Start smooth dissolve exit after 2.2s
    const timer1 = setTimeout(() => {
      setIsFadingOut(true);
    }, 2200);

    // 2. Complete unmount after exit transition at 2.7s
    const timer2 = setTimeout(() => {
      if (onFinishRef.current) {
        onFinishRef.current();
      }
    }, 2700);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onFinishRef.current) {
        onFinishRef.current();
      }
    }, 350);
  };

  return (
    <div className={`loading-panel-overlay ${isFadingOut ? 'fade-exit-cinematic' : ''}`}>
      {/* Dynamic Ambient Glow & Sparkle Flares */}
      <div className="loading-bg-glow"></div>
      <div className="loading-particles-layer">
        <span className="particle p1"></span>
        <span className="particle p2"></span>
        <span className="particle p3"></span>
        <span className="particle p4"></span>
      </div>

      {/* Festive Corner Ornaments */}
      <div className="loading-ornament top-left">🌸</div>
      <div className="loading-ornament top-right">🌸</div>
      <div className="loading-ornament bottom-left">🪔</div>
      <div className="loading-ornament bottom-right">🪔</div>

      <div className="loading-panel-container">
        {/* Shloka in Gold */}
        <div className="shloka-text-small">|| श्री गणेशाय नमः ||</div>

        {/* Featured Ganpati Frame with Aura Glow & Ken Burns Zoom */}
        <div className="ganpati-frame-wrapper">
          <div className="gold-halo-glow"></div>
          <div className="ganpati-img-card">
            <img
              src="/ganpati-logo.jpg"
              alt="श्रीमंत दगडूशेठ हलवाई गणपती"
              className="ganpati-splash-img"
            />
          </div>
        </div>

        {/* Grand Title & Mandal Identification */}
        <div className="space-y-1.5 pt-1">
          <h1 className="text-lg sm:text-xl font-black text-amber-100 tracking-tight leading-snug drop-shadow-md">
            {lang === 'mr' ? '🌺 श्रीमंत दगडूशेठ हलवाई प्रथम गणपती 🌺' : '🌺 Shrimant Dagdusheth Halwai Pratham Ganpati 🌺'}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-amber-200/90 leading-snug max-w-sm px-2">
            अकरा मारुती चौक सार्वजनिक गणेश उत्सव मित्र मंडळ, शुक्रवार पेठ पुणे.
          </p>
        </div>

        {/* Loading Progress Bar & Counter */}
        <div className="mt-4 w-full max-w-[240px]">
          <div className="flex justify-between text-[11px] font-bold text-amber-200/80 mb-1 px-1">
            <span>{lang === 'mr' ? 'माहिती लोड होत आहे...' : 'Loading Records...'}</span>
            <span>{progress}%</span>
          </div>
          <div className="loading-progress-bar-wrap !mt-0">
            <div
              className="loading-progress-bar-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Skip / Enter Button */}
      <button className="skip-splash-btn" onClick={handleSkip} title="Skip Loading">
        <span>{lang === 'mr' ? 'पुढे जा ➔' : 'Enter ➔'}</span>
      </button>
    </div>
  );
}

