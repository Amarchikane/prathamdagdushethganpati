import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Receipt, 
  TrendingUp, 
  Trash2, 
  UserPlus, 
  RefreshCw, 
  AlertTriangle, 
  Eye, 
  Check, 
  Clock, 
  Filter, 
  Search, 
  LogOut,
  X,
  AlertCircle,
  Pencil,
  Smartphone,
  Send,
  Lock,
  Unlock
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { ReceiptModal } from './ReceiptModal';

export function SuperAdminPage({ lang, user, isOnline, onLogout }) {
  const t = TRANSLATIONS[lang];

  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    stats: { total_receipts: 0, total_amount: 0, total_received: 0, total_pending: 0 },
    by_admin: [],
    daily_collections: [],
    users: []
  });

  const [allReceipts, setAllReceipts] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('admins'); // 'admins' | 'daily' | 'receipts' | 'handovers'
  const [selectedAdminFilter, setSelectedAdminFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(null);

  // Super Admin WhatsApp & Daily Handovers state
  const [superAdminWhatsapp, setSuperAdminWhatsapp] = useState('919822001122');
  const [phoneInput, setPhoneInput] = useState('919822001122');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [allHandovers, setAllHandovers] = useState([]);
  const [isLockoutEnabled, setIsLockoutEnabled] = useState(false);
  const [isTogglingLockout, setIsTogglingLockout] = useState(false);

  // Add Admin Modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    pin: '',
    name: '',
    role: 'karyakarta'
  });

  // Action status messages
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Fallback admins so the admin panel is NEVER blank even if DB is brand new
  const displayAdmins = statsData.by_admin && statsData.by_admin.length > 0
    ? statsData.by_admin
    : (statsData.users && statsData.users.length > 0
        ? statsData.users.map(u => ({
            username: u.username,
            name: u.name,
            role: u.role,
            receipt_count: 0,
            total_amount: 0,
            received_amount: 0,
            pending_amount: 0
          }))
        : [
            { username: 'superadmin', name: 'मुख्य प्रशासक (Super Admin)', role: 'superadmin', receipt_count: 0, total_amount: 0, received_amount: 0, pending_amount: 0 },
            { username: 'admin', name: 'मंडळ प्रशासक (Admin)', role: 'admin', receipt_count: 0, total_amount: 0, received_amount: 0, pending_amount: 0 },
            { username: 'karyakarta', name: 'मंडळ कार्यकर्ता (Karyakarta)', role: 'karyakarta', receipt_count: 0, total_amount: 0, received_amount: 0, pending_amount: 0 }
          ]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();

      // 1. Load Stats, Admin Breakdown, Daily with no-cache
      try {
        const resStats = await fetch(`/api/superadmin/stats?_t=${timestamp}`, { cache: 'no-store' });
        if (resStats.ok) {
          const dataStats = await resStats.json();
          if (dataStats && dataStats.success) {
            setStatsData(dataStats);
          }
        }
      } catch (err) {
        console.warn('Stats fetch warning:', err);
      }

      // 2. Load All Receipts directly from live Cloudflare D1
      let serverFetched = false;
      try {
        const resReceipts = await fetch(`/api/superadmin/all-receipts?_t=${timestamp}`, { cache: 'no-store' });
        if (resReceipts.ok) {
          const dataReceipts = await resReceipts.json();
          if (dataReceipts && dataReceipts.success && Array.isArray(dataReceipts.entries)) {
            serverFetched = true;
            // D1 Database is the SINGLE SOURCE OF TRUTH:
            setAllReceipts(dataReceipts.entries);

            // Automatically purge deleted receipts from this device's local storage:
            try {
              localStorage.setItem('mandal_session_pavthis', JSON.stringify(dataReceipts.entries));
              localStorage.setItem('mandal_recent_pavthis', JSON.stringify(dataReceipts.entries));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Receipts fetch warning:', err);
      }

      // 3. Load Settings (Super Admin WhatsApp & Lockout Toggle)
      try {
        const resSettings = await fetch(`/api/settings?_t=${timestamp}`, { cache: 'no-store' });
        if (resSettings.ok) {
          const dataSettings = await resSettings.json();
          if (dataSettings && dataSettings.settings) {
            if (dataSettings.settings.superadmin_whatsapp) {
              setSuperAdminWhatsapp(dataSettings.settings.superadmin_whatsapp);
              setPhoneInput(dataSettings.settings.superadmin_whatsapp);
            }
            setIsLockoutEnabled(dataSettings.settings.daily_handover_lockout_enabled === 'true');
          }
        }
      } catch (err) {
        console.warn('Settings fetch warning:', err);
      }

      // 4. Load All Daily Handovers
      try {
        const resHandovers = await fetch(`/api/daily-handover?all=true&_t=${timestamp}`, { cache: 'no-store' });
        if (resHandovers.ok) {
          const dataHandovers = await resHandovers.json();
          if (dataHandovers && dataHandovers.success && Array.isArray(dataHandovers.handovers)) {
            setAllHandovers(dataHandovers.handovers);
          }
        }
      } catch (err) {
        console.warn('Handovers fetch warning:', err);
      }
    } catch (err) {
      console.error('loadAllData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async (e) => {
    e?.preventDefault();
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('कृपया वैध १० अंकी मोबाईल नंबर टाका');
      return;
    }
    setIsSavingPhone(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ superadmin_whatsapp: cleanPhone })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuperAdminWhatsapp(cleanPhone);
        setMsg({ type: 'success', text: 'मुख्य प्रशासक WhatsApp नंबर यशस्वीरीत्या सेव्ह झाला!' });
      } else {
        setMsg({ type: 'error', text: 'नंबर सेव्ह करता आला नाही: ' + (data.error || '') });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'त्रुटी: ' + err.message });
    } finally {
      setIsSavingPhone(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 5000);
    }
  };

  const handleToggleLockout = async () => {
    const nextVal = !isLockoutEnabled;
    setIsTogglingLockout(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_handover_lockout_enabled: nextVal ? 'true' : 'false' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLockoutEnabled(nextVal);
        setMsg({
          type: 'success',
          text: nextVal 
            ? '✅ दैनिक हिशोब व पावती बंदी नियम (Lockout) सक्रिय केला गेला!'
            : 'ℹ️ दैनिक हिशोब पावती बंदी नियम (Lockout) अक्षम (Disabled) केला गेला.'
        });
      } else {
        setMsg({ type: 'error', text: 'सेटिंग सेव्ह करता आली नाही: ' + (data.error || '') });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'त्रुटी: ' + err.message });
    } finally {
      setIsTogglingLockout(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 5000);
    }
  };

  useEffect(() => {
    // Purge old local storage cache keys on Super Admin mount
    try {
      localStorage.removeItem('mandal_session_pavthis');
      localStorage.removeItem('mandal_recent_pavthis');
    } catch (e) {}
    loadAllData();
  }, []);

  // Delete All Receipts Handler (Wipes database clean)
  const handleDeleteAllReceipts = async () => {
    const confirmDel = window.confirm('⚠️ सावधान! आपण सर्व पावत्या कायमस्वरूपी हटवू इच्छिता का? हा संपूर्ण डेटा नष्ट होईल!');
    if (!confirmDel) return;

    setAllReceipts([]);
    try {
      localStorage.removeItem('mandal_session_pavthis');
      localStorage.removeItem('mandal_recent_pavthis');
      localStorage.removeItem('mandal_donors_v2');
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('mandal_receipt_deleted', { detail: { all: true } }));

    try {
      const res = await fetch('/api/superadmin/pavthi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_all: true })
      });
      const data = await res.json();
      if (data && data.success) {
        setMsg({ type: 'success', text: data.message });
      }
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatRupees = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Add New Admin Handler
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newUserData.username.trim() || !newUserData.pin.trim() || !newUserData.name.trim()) {
      alert('कृपया सर्व माहिती भरा');
      return;
    }

    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'वापरकर्ता जोडता आला नाही');
      }

      setMsg({ type: 'success', text: data.message || 'नवीन प्रशासक जोडला गेला!' });
      setIsAddUserModalOpen(false);
      setNewUserData({ username: '', pin: '', name: '', role: 'karyakarta' });
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Admin Handler
  const handleDeleteAdmin = async (adminUsername) => {
    if (adminUsername === 'superadmin') {
      alert('मुख्य सुपर ॲडमिनला हटवता येणार नाही!');
      return;
    }

    const confirmDel = window.confirm(`सावधान! आपण "${adminUsername}" या प्रशासकाला हटवू इच्छिता का?`);
    if (!confirmDel) return;

    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'हटवता आले नाही');
      }

      setMsg({ type: 'success', text: data.message });
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Single Receipt Handler
  const handleDeleteReceipt = async (receiptId, receiptNo) => {
    const confirmDel = window.confirm(`पावती क्र. "${receiptNo}" कायमस्वरूपी हटवायची आहे का?`);
    if (!confirmDel) return;

    // 1. Immediately remove from UI
    setAllReceipts(prev => prev.filter(r => r.id !== receiptId && r.receipt_no !== receiptNo));

    // 2. Immediately purge from localStorage across all keys
    try {
      const purgeList = (key) => {
        const saved = localStorage.getItem(key);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            const updated = list.filter(r => r && r.id !== receiptId && r.receipt_no !== receiptNo);
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      };
      purgeList('mandal_session_pavthis');
      purgeList('mandal_recent_pavthis');
      purgeList('mandal_donors_v2');
    } catch (e) {}

    // 3. Dispatch global deletion event for useDonors and search register
    window.dispatchEvent(new CustomEvent('mandal_receipt_deleted', { 
      detail: { id: receiptId, receipt_no: receiptNo } 
    }));

    // 4. Delete from Server
    try {
      const res = await fetch('/api/superadmin/pavthi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: receiptId })
      });
      const data = await res.json();
      if (data && data.success) {
        setMsg({ type: 'success', text: data.message || 'पावती यशस्वीरीत्या हटवली गेली.' });
      }
      loadAllData();
    } catch (err) {
      console.warn('Server delete error:', err);
      setMsg({ type: 'success', text: 'पावती स्थानिक मेमरीमधून हटवली गेली.' });
    }
  };

  // Delete All Receipts by an Admin Handler
  const handleDeleteAdminReceipts = async (adminUsername) => {
    const confirmDel = window.confirm(
      `⚠️ अतिमहत्त्वाची सूचना:\nआपण "${adminUsername}" या कार्यकर्त्याचा सर्व पावती डेटा हटवू इच्छिता का? ही क्रिया पूर्ववत करता येणार नाही!`
    );
    if (!confirmDel) return;

    const u = adminUsername.toLowerCase();

    // 1. Immediately remove from UI
    setAllReceipts(prev => prev.filter(r => (r.created_by_username || '').toLowerCase() !== u));

    // 2. Immediately purge from localStorage across all keys
    try {
      const purgeAdminList = (key) => {
        const saved = localStorage.getItem(key);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            const updated = list.filter(r => (r.created_by_username || '').toLowerCase() !== u);
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      };
      purgeAdminList('mandal_session_pavthis');
      purgeAdminList('mandal_recent_pavthis');
      purgeAdminList('mandal_donors_v2');
    } catch (e) {}

    // 3. Dispatch global deletion event
    window.dispatchEvent(new CustomEvent('mandal_receipt_deleted', { 
      detail: { username: adminUsername } 
    }));

    // 4. Delete from Server
    try {
      const res = await fetch('/api/superadmin/pavthi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_username: adminUsername })
      });
      const data = await res.json();
      if (data && data.success) {
        setMsg({ type: 'success', text: data.message });
      }
      loadAllData();
    } catch (err) {
      console.warn('Server delete error:', err);
      setMsg({ type: 'success', text: 'कार्यकर्त्याचा पावती डेटा हटवला गेला.' });
    }
  };

  // Update/Edit Receipt Handler
  const handleSaveEditReceipt = async (e) => {
    e.preventDefault();
    if (!editingReceipt || !editingReceipt.id) return;

    try {
      const res = await fetch('/api/superadmin/pavthi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReceipt)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'पावती अपडेट करता आली नाही');
      }

      setMsg({ type: 'success', text: data.message || 'पावती तपशील यशस्वीरीत्या अद्ययावत केले गेले.' });
      setEditingReceipt(null);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered Receipts List
  const filteredReceipts = (allReceipts || []).filter(r => {
    if (!r || typeof r !== 'object') return false;
    const matchesAdmin = selectedAdminFilter === 'ALL' || (r.created_by_username || '').toLowerCase() === selectedAdminFilter.toLowerCase();
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesQuery = !q || 
      (r.name_mr && String(r.name_mr).toLowerCase().includes(q)) ||
      (r.name_en && String(r.name_en).toLowerCase().includes(q)) ||
      (r.receipt_no && String(r.receipt_no).toLowerCase().includes(q)) ||
      (r.mobile && String(r.mobile).includes(q));
    return matchesAdmin && matchesQuery;
  });

  return (
    <div className="max-w-6xl mx-auto my-4 sm:my-6 px-3 sm:px-4 space-y-6 animate-fadeIn">
      
      {/* Top Super Admin Banner */}
      <div className="bg-gradient-to-r from-[#2A050B] via-[#4A000B] to-[#1C0D10] text-white border-2 border-[#D4AF37] rounded-3xl p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-[#D4AF37] flex items-center justify-center text-[#FDE68A] shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black bg-[#D4AF37] text-[#3B070E] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Super Admin
              </span>
              <span className="text-xs text-amber-200/80 font-bold">
                अकरा मारुती चौक मंडळ
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black font-serif text-[#FFFDF9] mt-0.5">
              मुख्य प्रशासक नियंत्रण कक्ष (Super Admin Portal)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold rounded-xl border border-white/20 transition cursor-pointer"
            title="रिफ्रेश करा"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FDE68A] ${loading ? 'animate-spin' : ''}`} />
            <span>रिफ्रेश</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 hover:text-white active:scale-95 text-xs font-bold rounded-xl border border-rose-500/40 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Offline Mode Disabled Warning for Admins */}
      {!isOnline && (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-xs sm:text-sm font-bold text-rose-800 flex items-center gap-3 shadow-md animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-black text-rose-950">⚠️ थेट ऑनलाइन सर्व्हर आवश्यक आहे (Offline Mode Disabled for Admins)</p>
            <p className="font-normal text-rose-800 mt-0.5">मुख्य प्रशासक नियंत्रण कक्ष, हिशोब तपासणी व अहवाल थेट सर्व्हर डेटाबेसशी जोडलेले आहेत. प्रशासकीय कामकाजासाठी कृपया इंटरनेट सुरू करा.</p>
          </div>
        </div>
      )}

      {/* Action Notification Alert */}
      {msg.text && (
        <div className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-sm animate-fadeIn ${
          msg.type === 'error' 
            ? 'bg-rose-50 border border-rose-300 text-rose-800' 
            : 'bg-emerald-50 border border-emerald-300 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> : <Check className="w-4 h-4 shrink-0 text-emerald-600" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==========================================================================
          OVERVIEW STATS CARDS (4 METRICS)
          ========================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Collection */}
        <div className="bg-white border-2 border-[#D4AF37]/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>एकूण वर्गणी रक्कम</span>
            <TrendingUp className="w-4 h-4 text-[#800020]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#4A000B] font-mono">
            {formatRupees(statsData.stats.total_amount)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            एकूण ठरलेली रक्कम
          </div>
        </div>

        {/* Received Collection */}
        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
            <span>जमा झालेली रक्कम</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono">
            {formatRupees(statsData.stats.total_received)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1">
            खजिन्यात रोख/UPI जमा
          </div>
        </div>

        {/* Pending Balance */}
        <div className="bg-white border-2 border-rose-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold mb-1">
            <span>बाकी शिल्लक रक्कम</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
            {formatRupees(statsData.stats.total_pending)}
          </div>
          <div className="text-[11px] font-semibold text-rose-600 mt-1">
            दात्यांकडून येणे बाकी
          </div>
        </div>

        {/* Total Receipts */}
        <div className="bg-white border-2 border-[#D4AF37]/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>एकूण पावत्या (Receipts)</span>
            <Receipt className="w-4 h-4 text-[#800020]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {statsData.stats.total_receipts}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            {displayAdmins.length} कार्यकर्त्यांची खाती
          </div>
        </div>
      </div>

      {/* Super Admin Control Settings Card */}
      <div className="bg-gradient-to-r from-[#200B0F] to-[#3B070E] border-2 border-[#D4AF37]/70 rounded-3xl p-4 sm:p-5 shadow-lg text-white space-y-4">
        {/* Row 1: WhatsApp Number */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-100 flex items-center gap-2">
                <span>मुख्य प्रशासक (Super Admin) WhatsApp नंबर</span>
                <span className="text-[10px] font-bold bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-2 py-0.5 rounded-full">
                  DB सक्रिय
                </span>
              </h3>
              <p className="text-xs text-amber-200/80 font-medium mt-0.5 leading-relaxed">
                कार्यकर्ते व ॲडमिन daily closing च्या वेळी या WhatsApp नंबरवर त्यांचा दैनिक जमा अहवाल सुपूर्द करतील.
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePhone} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-mono font-bold pointer-events-none">
                +91
              </span>
              <input
                type="tel"
                maxLength={13}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="९८२२००११२२"
                className="w-full pl-11 pr-3 py-2 bg-black/40 border border-white/20 focus:border-[#D4AF37] rounded-xl text-xs sm:text-sm font-mono font-bold text-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingPhone}
              className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B45309] hover:from-[#C59B27] hover:to-[#92400E] active:scale-95 text-[#3B070E] font-black text-xs rounded-xl shadow transition cursor-pointer shrink-0"
            >
              {isSavingPhone ? 'सेव्ह होत आहे...' : 'नंबर जतन करा'}
            </button>
          </form>
        </div>

        {/* Row 2: Daily Handover Lockout Rule Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isLockoutEnabled 
                ? 'bg-rose-500/20 border-rose-400 text-rose-300' 
                : 'bg-slate-700/40 border-slate-500 text-slate-400'
            }`}>
              {isLockoutEnabled ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-amber-100">
                  दैनिक हिशोब सुपूर्ती व पावती बंदी नियम (Daily Handover Lockout Rule)
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isLockoutEnabled
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                    : 'bg-slate-700/50 text-slate-300 border-slate-500'
                }`}>
                  {isLockoutEnabled ? 'सक्रिय (ENABLED)' : 'अक्षम (DISABLED)'}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-medium mt-0.5 leading-relaxed">
                {isLockoutEnabled
                  ? '⚠️ नियम सक्रिय आहे: ॲडमिनने मागील दिवसाचा हिशोब Super Admin ला WhatsApp वर सुपूर्द केल्याशिवाय नवीन पावती करता येणार नाही.'
                  : 'ℹ️ नियम बंद आहे: मागील दिवसाचा हिशोब बाकी असला तरीही ॲडमिन नवीन पावत्या करू शकतात.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleLockout}
            disabled={isTogglingLockout}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0 active:scale-95 ${
              isLockoutEnabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-400'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400'
            }`}
          >
            {isTogglingLockout ? (
              <span className="animate-pulse">बदल सेव्ह होत आहे...</span>
            ) : isLockoutEnabled ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>नियम बंद करा (Disable Lockout)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>नियम सक्रिय करा (Enable Lockout)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="bg-amber-100/60 p-1.5 rounded-2xl border border-[#D4AF37]/40 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('admins')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'admins'
              ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#4A000B] hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>कार्यकर्ते संकलन ({displayAdmins.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'daily'
              ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#4A000B] hover:bg-white/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>दैनिक जमा अहवाल (Daily)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('handovers')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'handovers'
              ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#4A000B] hover:bg-white/50'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>दैनिक हिशोब सुपूर्ती ({allHandovers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('receipts')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'receipts'
              ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#4A000B] hover:bg-white/50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>सर्व पावत्या व्यवस्थापन ({allReceipts.length})</span>
        </button>
      </div>

      {/* ==========================================================================
          SECTION 1: ADMINS & PER-ADMIN COLLECTION BREAKDOWN
          ========================================================================== */}
      {activeSubTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-black text-[#4A000B]">
                कार्यकर्तेनिहाय जमा अहवाल (Collection by Admin)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                कोणत्या ॲडमिनने किती पावत्या व किती रक्कम जमा केली याची थेट आकडेवारी
              </p>
            </div>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#4A000B] to-[#800020] hover:from-[#3B070E] hover:to-[#630D1A] text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#FDE68A]" />
              <span>+ नवीन ॲडमिन / कार्यकर्ता जोडा</span>
            </button>
          </div>

          <div className="bg-white border border-[#E8DEC8] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF6ED] text-[#4A000B] border-b border-[#D4AF37]/30 font-black">
                  <tr>
                    <th className="py-3 px-4">कार्यकर्ता / ॲडमिन नाव</th>
                    <th className="py-3 px-4">युझरनेम</th>
                    <th className="py-3 px-4 text-center">एकूण पावत्या</th>
                    <th className="py-3 px-4 text-right">जमा रक्कम (Received)</th>
                    <th className="py-3 px-4 text-right">बाकी रक्कम (Pending)</th>
                    <th className="py-3 px-4 text-center">कृती (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayAdmins.map((admin) => (
                    <tr key={admin.username} className="hover:bg-amber-50/50 transition">
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {admin.name}
                        {admin.username === 'superadmin' && (
                          <span className="ml-2 text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                            सुपर ॲडमिन
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        @{admin.username}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-[#800020]">
                        {admin.receipt_count} पावत्या
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                        {formatRupees(admin.received_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                        {formatRupees(admin.pending_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Filter receipts by this admin */}
                          <button
                            onClick={() => {
                              setSelectedAdminFilter(admin.username);
                              setActiveSubTab('receipts');
                            }}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-[#4A000B] font-bold text-xs rounded-lg transition cursor-pointer"
                            title="या कार्यकर्त्याच्या पावत्या पहा"
                          >
                            पावत्या पहा
                          </button>

                          {/* Delete this admin's receipts */}
                          {admin.receipt_count > 0 && (
                            <button
                              onClick={() => handleDeleteAdminReceipts(admin.username)}
                              className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="या कार्यकर्त्याचा सर्व पावती डेटा हटवा"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Admin Account (Not allowed for superadmin) */}
                          {admin.username !== 'superadmin' && (
                            <button
                              onClick={() => handleDeleteAdmin(admin.username)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-200 transition cursor-pointer"
                              title="ॲडमिन खाते हटवा"
                            >
                              खाते हटवा
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* List of Registered Accounts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              सर्व नोंदणीकृत वापरकर्ते व पासवर्ड व्यवस्थापन ({(statsData.users || []).length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(statsData.users || []).map((u) => (
                <div key={u.id || u.username} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-xs text-[#4A000B]">{u.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">@{u.username} • {u.role}</div>
                  </div>
                  {u.username !== 'superadmin' && (
                    <button
                      onClick={() => handleDeleteAdmin(u.username)}
                      className="text-rose-600 hover:text-rose-900 text-xs font-bold p-1 rounded hover:bg-rose-100 transition cursor-pointer"
                    >
                      हटवा
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          SECTION 2: DAILY COLLECTION BREAKDOWN
          ========================================================================== */}
      {activeSubTab === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h2 className="text-base font-black text-[#4A000B]">
              दैनिक जमा अहवाल (Daily Collection Breakdown)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              उत्सवादरम्यान दिवसानिहाय किती वर्गणी व रोख रक्कम जमा झाली याची दैनंदिनी
            </p>
          </div>

          <div className="bg-white border border-[#E8DEC8] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF6ED] text-[#4A000B] border-b border-[#D4AF37]/30 font-black">
                  <tr>
                    <th className="py-3 px-4">तारीख (Date)</th>
                    <th className="py-3 px-4 text-center">पावती संख्या</th>
                    <th className="py-3 px-4 text-right">एकूण वर्गणी रक्कम</th>
                    <th className="py-3 px-4 text-right">जमा रक्कम (Received)</th>
                    <th className="py-3 px-4 text-right">बाकी रक्कम (Pending)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(statsData.daily_collections || []).map((day) => (
                    <tr key={day.date} className="hover:bg-amber-50/50 transition">
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {day.date}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-[#800020]">
                        {day.receipt_count} पावत्या
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        {formatRupees(day.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                        {formatRupees(day.received_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                        {formatRupees(day.pending_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          SECTION: DAILY HANDOVERS AUDIT TABLE
          ========================================================================== */}
      {activeSubTab === 'handovers' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-black text-[#4A000B]">
                दैनिक हिशोब सुपूर्ती अहवाल (Daily Handover Audit)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                कोणत्या ॲडमिनने कोणत्या तारखेचा हिशोब मुख्य प्रशासक WhatsApp वर सुपूर्द केला याचा तपशील
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                एकूण सुपूर्ती नोंदी: <strong className="text-[#800020]">{allHandovers.length}</strong>
              </span>
              <button
                type="button"
                onClick={loadAllData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#4A000B] border border-[#D4AF37]/50 rounded-xl text-xs font-bold transition cursor-pointer"
                title="हिशोब रिफ्रेश करा"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>रिफ्रेश</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E8DEC8] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF6ED] text-[#4A000B] border-b border-[#D4AF37]/30 font-black">
                  <tr>
                    <th className="py-3 px-4">तारीख (Date)</th>
                    <th className="py-3 px-4">जमाकर्ता (Admin)</th>
                    <th className="py-3 px-4 text-center">एकूण पावत्या</th>
                    <th className="py-3 px-4 text-right">एकूण रक्कम</th>
                    <th className="py-3 px-4 text-right">रोख (Cash)</th>
                    <th className="py-3 px-4 text-right">UPI (Online)</th>
                    <th className="py-3 px-4 text-right">बाकी (Due)</th>
                    <th className="py-3 px-4 text-center">सुपूर्द वेळ</th>
                    <th className="py-3 px-4 text-center">स्थिती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allHandovers && allHandovers.length > 0 ? (
                    allHandovers.map((h) => (
                      <tr key={h.id || h.date + h.username} className="hover:bg-amber-50/40 transition">
                        <td className="py-3 px-4 font-extrabold text-slate-900">
                          {h.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-[#4A000B] block">{h.admin_name}</span>
                          <span className="text-[11px] font-mono text-slate-500">@{h.username}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-slate-900">{h.total_receipts}</span>
                          {h.first_receipt_no && (
                            <span className="block text-[10px] font-mono text-slate-400">
                              {h.first_receipt_no} - {h.last_receipt_no}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          {formatRupees(h.total_amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                          {formatRupees(h.cash_amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sky-800">
                          {formatRupees(h.upi_amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                          {formatRupees(h.pending_amount)}
                        </td>
                        <td className="py-3 px-4 text-center text-[11px] text-slate-500 font-medium">
                          {h.created_at ? new Date(h.created_at).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>सुपूर्द (OK)</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-bold italic">
                        कोणत्याही दैनिक हिशोब सुपूर्ती नोंदी अद्याप झालेल्या नाहीत.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          SECTION 3: ALL RECEIPTS MANAGEMENT & DELETION
          ========================================================================== */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#4A000B]">
                सर्व पावत्या व्यवस्थापन (Receipts Management)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                केवळ मुख्य सुपर ॲडमिन कोणतीही चुकीची किंवा डुप्लिकेट पावती हटवू शकतो
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="नाव, पावती क्र. किंवा मोबाईल शोधा..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 font-semibold focus:outline-none w-56"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={selectedAdminFilter}
                onChange={e => setSelectedAdminFilter(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 font-bold text-slate-700 focus:outline-none bg-white"
              >
                <option value="ALL">सर्व कार्यकर्ते (All Admins)</option>
                {(statsData.by_admin || []).map(a => (
                  <option key={a.username} value={a.username}>
                    {a.name} (@{a.username})
                  </option>
                ))}
              </select>

              {/* Refresh from D1 button */}
              <button
                type="button"
                onClick={loadAllData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#4A000B] border border-[#D4AF37]/50 rounded-xl text-xs font-bold transition cursor-pointer"
                title="डेटाबेसमधून ताजी माहिती आणा"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>रिफ्रेश</span>
              </button>

              {/* Delete All Receipts button */}
              {allReceipts.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllReceipts}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="सर्व पावत्या कायमस्वरूपी हटवा"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>सर्व हटवा</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E8DEC8] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF6ED] text-[#4A000B] border-b border-[#D4AF37]/30 font-black">
                  <tr>
                    <th className="py-3 px-4">पावती क्र.</th>
                    <th className="py-3 px-4">दिनांक</th>
                    <th className="py-3 px-4">दात्याचे नाव</th>
                    <th className="py-3 px-4">परिसर</th>
                    <th className="py-3 px-4">नोंदणीकर्ता ॲडमिन</th>
                    <th className="py-3 px-4 text-right">जमा रक्कम</th>
                    <th className="py-3 px-4 text-center">स्थिती</th>
                    <th className="py-3 px-4 text-center">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-amber-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#800020]">
                        {r.receipt_no}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">
                        {r.date}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {r.name_mr || r.name_en}
                        {r.mobile && (
                          <span className="block text-[11px] font-mono text-slate-400 font-normal">
                            {r.mobile}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {r.landmark_mr}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-amber-50 text-[#800020] border border-[#D4AF37]/40 px-2 py-0.5 rounded text-xs font-bold">
                          {r.created_by || r.created_by_username || 'कार्यकर्ता'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        ₹{r.received_amount !== undefined ? r.received_amount : r.amount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {Boolean(r.is_pending) ? (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                            बाकी: ₹{r.pending_amount}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                            पूर्ण जमा
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Pavthi */}
                          <button
                            onClick={() => setSelectedReceipt(r)}
                            className="p-1.5 text-amber-700 hover:text-[#4A000B] hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="पावती पहा / प्रिंट"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Pavthi */}
                          <button
                            onClick={() => setEditingReceipt({ ...r })}
                            className="p-1.5 text-sky-600 hover:text-sky-900 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                            title="पावती तपशील संपादित करा (Edit Details)"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete Pavthi */}
                          <button
                            onClick={() => handleDeleteReceipt(r.id, r.receipt_no)}
                            className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="पावती कायमस्वरूपी हटवा"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReceipts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-500 italic">
                        कोणतीही पावती आढळली नाही.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: ADD NEW ADMIN / KARYAKARTA
          ========================================================================== */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-[#D4AF37] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#4A000B] to-[#800020] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                <UserPlus className="w-5 h-5 text-[#FDE68A]" />
                <span>नवीन प्रशासक / कार्यकर्ता नोंदणी</span>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  कार्यकर्त्याचे पूर्ण नाव *
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="उदा. राहुल शांताराम पाटील"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#4A000B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  लॉगिन युझरनेम (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.username}
                  onChange={e => setNewUserData({ ...newUserData, username: e.target.value })}
                  placeholder="उदा. rahul किंवा patil11"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-[#4A000B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सुरक्षा पिन (४-अंकी PIN) *
                </label>
                <input
                  type="password"
                  required
                  value={newUserData.pin}
                  onChange={e => setNewUserData({ ...newUserData, pin: e.target.value })}
                  placeholder="उदा. 1234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-black focus:outline-none focus:border-[#4A000B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  भूमिका (Role)
                </label>
                <select
                  value={newUserData.role}
                  onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none bg-white"
                >
                  <option value="karyakarta">मंडळ कार्यकर्ता (Karyakarta)</option>
                  <option value="admin">मंडळ प्रशासक (Admin)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A000B] hover:bg-[#3B070E] text-white text-xs font-black rounded-xl shadow cursor-pointer"
                >
                  जोडा (Add Admin)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: EDIT RECEIPT DETAILS (पावती संपादन)
          ========================================================================== */}
      {editingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white border-2 border-[#D4AF37] rounded-3xl shadow-2xl max-w-lg w-full my-auto overflow-hidden">
            <div className="bg-gradient-to-r from-[#4A000B] to-[#800020] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                <Pencil className="w-5 h-5 text-[#FDE68A]" />
                <span>पावती तपशील संपादन ({editingReceipt.receipt_no})</span>
              </div>
              <button
                onClick={() => setEditingReceipt(null)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditReceipt} className="p-4 sm:p-5 space-y-3 max-h-[82vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  दात्याचे पूर्ण नाव (मराठीत) *
                </label>
                <input
                  type="text"
                  required
                  value={editingReceipt.name_mr || ''}
                  onChange={e => setEditingReceipt({ ...editingReceipt, name_mr: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:border-[#4A000B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  दात्याचे नाव (English)
                </label>
                <input
                  type="text"
                  value={editingReceipt.name_en || ''}
                  onChange={e => setEditingReceipt({ ...editingReceipt, name_en: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मोबाईल नंबर
                  </label>
                  <input
                    type="tel"
                    value={editingReceipt.mobile || ''}
                    onChange={e => setEditingReceipt({ ...editingReceipt, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    एकूण देणगी रक्कम (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingReceipt.amount || ''}
                    onChange={e => setEditingReceipt({ ...editingReceipt, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-black text-[#800020] focus:outline-none"
                  />
                </div>
              </div>

              {/* Pending check */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(editingReceipt.is_pending)}
                    onChange={e => setEditingReceipt({ ...editingReceipt, is_pending: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-[#800020] rounded"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    रक्कम बाकी आहे का? (Pending)
                  </span>
                </label>

                {Boolean(editingReceipt.is_pending) && (
                  <div>
                    <label className="block text-xs font-bold text-rose-800 mb-1">
                      बाकी शिल्लक रक्कम (₹) *
                    </label>
                    <input
                      type="number"
                      value={editingReceipt.pending_amount || ''}
                      onChange={e => setEditingReceipt({ ...editingReceipt, pending_amount: e.target.value })}
                      className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs sm:text-sm font-mono font-bold text-rose-700 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    परिसर / चौक
                  </label>
                  <input
                    type="text"
                    value={editingReceipt.landmark_mr || ''}
                    onChange={e => setEditingReceipt({ ...editingReceipt, landmark_mr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    देणगी पद्धत
                  </label>
                  <select
                    value={editingReceipt.payment_mode || 'रोख (Cash)'}
                    onChange={e => setEditingReceipt({ ...editingReceipt, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:outline-none bg-white"
                  >
                    <option value="रोख (Cash)">रोख (Cash)</option>
                    <option value="UPI / QR (Online)">UPI / QR (Online)</option>
                    <option value="चेक (Cheque)">चेक (Cheque)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  विशेष टीप / नोंद (Note)
                </label>
                <input
                  type="text"
                  value={editingReceipt.note_mr || ''}
                  onChange={e => setEditingReceipt({ ...editingReceipt, note_mr: e.target.value })}
                  placeholder="काही विशेष नोंद असल्यास..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingReceipt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#4A000B] to-[#800020] hover:from-[#3B070E] hover:to-[#630D1A] text-white text-xs font-black rounded-xl shadow cursor-pointer"
                >
                  बदल जतन करा (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Receipt View Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
          lang={lang}
        />
      )}
    </div>
  );
}
