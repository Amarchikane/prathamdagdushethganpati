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
  AlertCircle
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { ReceiptModal } from './ReceiptModal';

export function SuperAdminPage({ lang, user, onLogout }) {
  const t = TRANSLATIONS[lang];

  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    stats: { total_receipts: 0, total_amount: 0, total_received: 0, total_pending: 0 },
    by_admin: [],
    daily_collections: [],
    users: []
  });

  const [allReceipts, setAllReceipts] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('admins'); // 'admins' | 'daily' | 'receipts'
  const [selectedAdminFilter, setSelectedAdminFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

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
    setMsg({ type: '', text: '' });
    try {
      // 1. Load Stats, Admin Breakdown, Daily
      const resStats = await fetch('/api/superadmin/stats');
      const dataStats = await resStats.json();
      if (dataStats.success) {
        setStatsData(dataStats);
      }

      // 2. Load All Receipts
      const resReceipts = await fetch('/api/superadmin/all-receipts');
      const dataReceipts = await resReceipts.json();
      if (dataReceipts.success) {
        setAllReceipts(dataReceipts.entries || []);
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'माहिती आणता आली नाही: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

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

    try {
      const res = await fetch('/api/superadmin/pavthi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: receiptId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'पावती हटवता आली नाही');
      }

      setMsg({ type: 'success', text: data.message });
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete All Receipts by an Admin Handler
  const handleDeleteAdminReceipts = async (adminUsername) => {
    const confirmDel = window.confirm(
      `⚠️ अतिमहत्त्वाची सूचना:\nआपण "${adminUsername}" या कार्यकर्त्याचा सर्व पावती डेटा हटवू इच्छिता का? ही क्रिया पूर्ववत करता येणार नाही!`
    );
    if (!confirmDel) return;

    try {
      const res = await fetch('/api/superadmin/pavthi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_username: adminUsername })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'डेटा हटवता आला नाही');
      }

      setMsg({ type: 'success', text: data.message });
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered Receipts List
  const filteredReceipts = allReceipts.filter(r => {
    const matchesAdmin = selectedAdminFilter === 'ALL' || (r.created_by_username || '').toLowerCase() === selectedAdminFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = !q || 
      (r.name_mr && r.name_mr.toLowerCase().includes(q)) ||
      (r.name_en && r.name_en.toLowerCase().includes(q)) ||
      (r.receipt_no && r.receipt_no.toLowerCase().includes(q)) ||
      (r.mobile && r.mobile.includes(q));
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

      {/* Sub-Tab Navigation */}
      <div className="bg-amber-100/60 p-1.5 rounded-2xl border border-[#D4AF37]/40 flex gap-2">
        <button
          onClick={() => setActiveSubTab('admins')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'admins'
              ? 'bg-gradient-to-r from-[#4A000B] to-[#800020] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#4A000B] hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>कार्यकर्ते / ॲडमिन संकलन ({displayAdmins.length})</span>
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
              सर्व नोंदणीकृत वापरकर्ते व पासवर्ड व्यवस्थापन ({statsData.users.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {statsData.users.map((u) => (
                <div key={u.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
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
                  {statsData.daily_collections.map((day) => (
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
                {statsData.by_admin.map(a => (
                  <option key={a.username} value={a.username}>
                    {a.name} (@{a.username})
                  </option>
                ))}
              </select>
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
