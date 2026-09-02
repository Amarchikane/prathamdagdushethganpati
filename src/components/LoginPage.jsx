import React, { useState } from 'react';
import { Lock, User, KeyRound, Wifi, ShieldAlert, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { GanpatiLogo } from './GanpatiLogo';

export function LoginPage({ lang, onLoginSuccess, isOnline }) {
  const t = TRANSLATIONS[lang];
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Normalizes Marathi numerals to ASCII digits
  const normalizeDigits = (str) => {
    const mrDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(str || '').replace(/[०-९]/g, d => {
      const idx = mrDigits.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = username.trim();
    const cleanPin = normalizeDigits(pin.trim());

    if (!cleanUser || !cleanPin) {
      setErrorMsg(lang === 'mr' ? 'कृपया युझरनेम आणि पिन प्रविष्ट करा' : 'Please enter username and PIN');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, pin: cleanPin })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (lang === 'mr' ? 'अवैध वापरकर्ता नाव किंवा पिन (Super Admin: superadmin / 9999, Admin: admin / 1124)' : 'Invalid credentials'));
      }

      // Save user session
      sessionStorage.setItem('mandal_auth_user', JSON.stringify(data.user));
      if (data.token) {
        sessionStorage.setItem('mandal_auth_token', data.token);
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'लॉगिन करता आले नाही. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (u, p) => {
    setUsername(u);
    setPin(p);
    setErrorMsg('');
  };

  return (
    <div className="max-w-md mx-auto my-6 px-4 animate-fadeIn">
      <div className="bg-white border-2 border-[#D4AF37] rounded-3xl shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-[#3B070E] via-[#630D1A] to-[#800020] p-6 text-center text-white border-b-2 border-[#D4AF37]/50 relative">
          <GanpatiLogo className="w-16 h-16 mx-auto mb-2 drop-shadow-md" />
          <h2 className="text-lg sm:text-xl font-black font-serif text-[#FFFDF9]">
            {t.login_title}
          </h2>
          <p className="text-xs text-[#FDE68A] font-semibold mt-1">
            {t.login_subtitle}
          </p>

          {/* Connection badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/30 border border-[#D4AF37]/40">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300">Cloud D1 Portal Active</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick 1-Click Login Shortcuts */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              जलद लॉगिन (Quick 1-Click Login):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('superadmin', '9999')}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-amber-50 hover:bg-amber-100 border border-[#D4AF37]/60 rounded-xl text-xs font-black text-[#4A000B] transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>👑 सुपर ॲडमिन</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('admin', '1124')}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>🚩 कार्यकर्ता ॲडमिन</span>
              </button>
            </div>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-xs font-black text-[#4A000B] mb-1.5">
              {t.login_username} *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="उदा. superadmin किंवा admin"
                className="w-full pl-9 pr-3 py-2.5 bg-amber-50/40 border border-[#D4AF37]/60 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#4A000B]"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* PIN Field */}
          <div>
            <label className="block text-xs font-black text-[#4A000B] mb-1.5">
              {t.login_pin} *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="उदा. 9999 किंवा 1124"
                className="w-full pl-9 pr-3 py-2.5 bg-amber-50/40 border border-[#D4AF37]/60 rounded-xl text-xs sm:text-sm font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#4A000B]"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
              loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                : 'bg-gradient-to-r from-[#4A000B] to-[#800020] hover:from-[#3B070E] hover:to-[#630D1A] text-white active:scale-98 border border-[#D4AF37]/50'
            }`}
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳ तपासत आहे...</span>
            ) : (
              <>
                <Lock className="w-4 h-4 text-[#FDE68A]" />
                <span>{t.login_btn}</span>
                <ArrowRight className="w-4 h-4 text-[#FDE68A]" />
              </>
            )}
          </button>

          {/* Credentials Hint */}
          <div className="pt-1 text-center">
            <p className="text-[11px] font-semibold text-slate-600 bg-amber-50/80 border border-[#D4AF37]/30 py-2 px-3 rounded-lg">
              🔑 {t.login_demo_hint}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
