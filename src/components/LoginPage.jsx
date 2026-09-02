import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldAlert, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { GanpatiLogo } from './GanpatiLogo';
import { TRANSLATIONS } from '../i18n/translations';

export function LoginPage({ lang, isOnline, onLoginSuccess }) {
  const t = TRANSLATIONS[lang];
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !pin.trim()) {
      setErrorMsg(lang === 'mr' ? 'कृपया नाव आणि पिन प्रविष्ट करा' : 'Please enter username and PIN');
      return;
    }

    if (!isOnline) {
      setErrorMsg(t.online_req_warning);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), pin: pin.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (lang === 'mr' ? 'अवैध वापरकर्ता किंवा पिन' : 'Invalid credentials'));
      }

      // Save user session
      sessionStorage.setItem('mandal_auth_user', JSON.stringify(data.user));
      if (data.token) {
        sessionStorage.setItem('mandal_auth_token', data.token);
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'लॉगिन करता आले नाही');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 px-4">
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

          {/* Online status indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/30 border border-[#D4AF37]/40">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-300">{t.online_status_ok}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300">{t.offline_status_blocked}</span>
              </>
            )}
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

          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.login_username} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin किंवा karyakarta"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E8DEC8] focus:border-[#4A000B] rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#800020]/20 focus:outline-none transition"
              />
            </div>
          </div>

          {/* PIN Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.login_pin} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1124"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E8DEC8] focus:border-[#4A000B] rounded-xl text-sm font-bold text-slate-900 tracking-wider focus:ring-2 focus:ring-[#800020]/20 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isOnline}
            className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
              !isOnline
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                : 'bg-gradient-to-r from-[#4A000B] to-[#800020] hover:from-[#3B070E] hover:to-[#630D1A] text-white active:scale-98 border border-[#D4AF37]/50'
            }`}
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <Lock className="w-4 h-4 text-[#FDE68A]" />
                <span>{t.login_btn}</span>
                <ArrowRight className="w-4 h-4 text-[#FDE68A]" />
              </>
            )}
          </button>

          {/* Hint for Mandal Members */}
          <div className="pt-2 text-center">
            <p className="text-[11px] font-semibold text-slate-500 bg-amber-50/80 border border-[#D4AF37]/30 py-2 px-3 rounded-lg">
              🔑 {t.login_demo_hint}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
