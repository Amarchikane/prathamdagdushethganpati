import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useDonors } from './hooks/useDonors';
import { useFuseSearch } from './hooks/useFuseSearch';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { SearchBar } from './components/SearchBar';
import { DonorCard } from './components/DonorCard';
import { ExportModal } from './components/ExportModal';
import { AppDownloadFooter } from './components/AppDownloadFooter';
import { LoginPage } from './components/LoginPage';
import { PavthiPage } from './components/PavthiPage';
import { SuperAdminPage } from './components/SuperAdminPage';
import { PublicReceiptView } from './components/PublicReceiptView';
import { TRANSLATIONS } from './i18n/translations';
import { SearchX, ChevronDown, PlusCircle, ShieldCheck, ArrowLeft, KeyRound, User, Lock, RotateCcw, AlertTriangle } from 'lucide-react';
import { GanpatiLogo } from './components/GanpatiLogo';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-300 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                काहीतरी तांत्रिक त्रुटी आली (Render Error)
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                आपला डेटा सुरक्षित आहे. कृपया खालील बटण दाबून पान पुन्हा लोड करा.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left overflow-x-auto text-[11px] font-mono text-rose-700">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A000B] to-[#800020] text-white font-bold text-xs rounded-xl shadow-md hover:from-[#3B070E] transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>पान रिफ्रेश करा (Refresh Page)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PAGE_SIZE = 30;

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState('mr');
  
  // Initialize tab from URL hash if available (e.g. #superadmin)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#superadmin' || window.location.pathname === '/superadmin')) {
      return 'superadmin';
    }
    return 'register'; // 'register' | 'pavthi' | 'superadmin'
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Authentication state stored in session
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('mandal_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const isOnline = useOnlineStatus();
  const { donors, addDonor } = useDonors();

  const {
    query,
    setQuery,
    selectedLandmark,
    setSelectedLandmark,
    sortBy,
    setSortBy,
    landmarks,
    results
  } = useFuseSearch(donors);

  const t = TRANSLATIONS[lang];

  // Sync hash with activeTab
  useEffect(() => {
    if (activeTab === 'superadmin') {
      window.location.hash = 'superadmin';
    } else if (window.location.hash === '#superadmin') {
      history.replaceState(null, null, ' ');
    }
  }, [activeTab]);

  // Reset pagination when search query or filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, selectedLandmark, sortBy]);

  const handleLogout = () => {
    sessionStorage.removeItem('mandal_auth_user');
    sessionStorage.removeItem('mandal_auth_token');
    setUser(null);
    setActiveTab('register');
  };

  // Dedicated Secure Public Receipt View Check
  const [publicReceiptParams] = useState(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const receipt = params.get('receipt');
    const key = params.get('key');
    if (receipt && key) {
      return { receipt, key };
    }
    return null;
  });

  const isFiltered = query.trim().length > 0 || selectedLandmark !== 'ALL';
  const displayedResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} lang={lang} />;
  }

  // If visiting via a verified public receipt link, render ONLY the dedicated receipt viewer
  if (publicReceiptParams) {
    return (
      <ErrorBoundary>
        <PublicReceiptView 
          receiptNo={publicReceiptParams.receipt} 
          accessKey={publicReceiptParams.key} 
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${activeTab === 'superadmin' ? 'bg-[#150709] text-white' : 'bg-[#FAF6ED] text-[#1E293B]'} selection:bg-amber-200 selection:text-[#4A000B]`}>
      
      {/* Dynamic Header: Executive Header for Super Admin, Mandal Header for Register & Pavthi */}
      <Header
        lang={lang}
        setLang={setLang}
        isOnline={isOnline}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Body with ErrorBoundary Protection */}
      <ErrorBoundary>
        <main className="flex-1 px-3 sm:px-6 pb-8">
        
        {/* ==========================================================================
            SEPARATE STANDALONE PAGE: SUPER ADMIN EXECUTIVE PORTAL
            ========================================================================== */}
        {activeTab === 'superadmin' ? (
          !user || user.role !== 'superadmin' ? (
            // Dedicated Super Admin Login View
            <div className="max-w-md mx-auto my-8 px-4 animate-fadeIn">
              <div className="bg-[#1F0C10] border-2 border-[#D4AF37] rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 text-center text-white border-b border-white/10 relative">
                  <GanpatiLogo className="w-16 h-16 mx-auto mb-2 drop-shadow-md" />
                  <div className="inline-flex items-center gap-1 text-[11px] font-black bg-[#D4AF37] text-[#3B070E] px-3 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Super Admin Portal
                  </div>
                  <h2 className="text-lg sm:text-xl font-black font-serif text-[#FFFDF9]">
                    मुख्य प्रशासक व्यवस्थापन लॉगिन
                  </h2>
                  <p className="text-xs text-amber-200/80 font-medium mt-1">
                    हा कक्ष केवळ केंद्रीय व्यवस्थापनासाठी आहे. देणगी संकलनासाठी कार्यकर्ते मुख्य पोर्टल वापरू शकतात.
                  </p>
                </div>

                {/* Login Form */}
                <div className="p-6 bg-white rounded-b-3xl">
                  <LoginPage
                    lang={lang}
                    isOnline={isOnline}
                    onLoginSuccess={(loggedInUser) => {
                      setUser(loggedInUser);
                      if (loggedInUser.role === 'superadmin') {
                        setActiveTab('superadmin');
                      } else {
                        alert('सूचना: आपण सामान्य कार्यकर्ता म्हणून लॉगिन झाले आहात. देणगी नोंदणी पानावर पुनर्निर्देशित करत आहोत.');
                        setActiveTab('pavthi');
                      }
                    }}
                  />

                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setActiveTab('register')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#4A000B] transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>मुख्य पोर्टलवर परत जा (Back to Main App)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Dedicated Super Admin Management Dashboard (No collection forms, pure management)
            <SuperAdminPage
              lang={lang}
              user={user}
              onLogout={handleLogout}
            />
          )
        ) : activeTab === 'pavthi' ? (
          // ==========================================================================
          // SEPARATE PAGE: KARYAKARTA DONATION / PAVTHI COLLECTION
          // ==========================================================================
          !user ? (
            <LoginPage
              lang={lang}
              isOnline={isOnline}
              onLoginSuccess={(loggedInUser) => {
                setUser(loggedInUser);
                if (loggedInUser.role === 'superadmin') {
                  setActiveTab('superadmin');
                } else {
                  setActiveTab('pavthi');
                }
              }}
            />
          ) : (
            <PavthiPage
              lang={lang}
              isOnline={isOnline}
              user={user}
              onLogout={handleLogout}
              onDonorCreated={addDonor}
            />
          )
        ) : (
          // ==========================================================================
          // SEPARATE PAGE: PUBLIC DONOR REGISTER SEARCH
          // ==========================================================================
          <>
            {/* Quick Action Bar to New Pavthi or Super Admin Portal */}
            <div className="max-w-5xl mx-auto my-3 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setActiveTab('superadmin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100/90 hover:bg-amber-200 text-[#4A000B] text-xs font-black rounded-xl border border-[#D4AF37]/50 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#B45309]" />
                <span>{lang === 'mr' ? 'सुपर ॲडमिन पोर्टल' : 'Super Admin Portal'}</span>
              </button>

              <button
                onClick={() => setActiveTab('pavthi')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4A000B] to-[#800020] hover:from-[#3B070E] hover:to-[#630D1A] active:scale-95 text-[#FFFDF9] text-xs font-black rounded-xl shadow border border-[#D4AF37]/50 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#FDE68A]" />
                <span>{lang === 'mr' ? '+ नवीन पावती / देणगी नोंद (D1)' : '+ New Donation / Pavthi (D1)'}</span>
              </button>
            </div>

            {/* Cross-Script Fuzzy Search Bar & Mobile Filters */}
            <SearchBar
              lang={lang}
              query={query}
              setQuery={setQuery}
              selectedLandmark={selectedLandmark}
              setSelectedLandmark={setSelectedLandmark}
              sortBy={sortBy}
              setSortBy={setSortBy}
              landmarks={landmarks}
            />

            {/* Donors Cards Grid */}
            <div className="max-w-5xl mx-auto my-4 sm:my-6">
              {results.length > 0 ? (
                <>
                  {/* Counter info */}
                  <div className="flex justify-between items-center px-1 mb-3.5 text-xs font-bold text-slate-600">
                    <span className="font-extrabold text-[#4A000B]">
                      {t.showing_count
                        .replace('{shown}', Math.min(visibleCount, results.length))
                        .replace('{total}', results.length)}
                    </span>
                    {isFiltered && (
                      <span className="text-[#800020] bg-amber-100/90 border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-lg font-black text-[11px] shadow-2xs">
                        {lang === 'mr' ? 'फिल्टर लागू (Filtered)' : 'Filtered'}
                      </span>
                    )}
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                    {displayedResults.map((donor) => (
                      <DonorCard key={donor.id} donor={donor} lang={lang} />
                    ))}
                  </div>

                  {/* Load More Button for Mobile */}
                  {hasMore && (
                    <div className="text-center mt-7 mb-4">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4A000B] to-[#800020] hover:from-[#3B070E] hover:to-[#630D1A] active:scale-95 text-[#FFFDF9] text-sm font-extrabold rounded-xl shadow-md border border-[#D4AF37]/50 transition cursor-pointer"
                      >
                        <span>{t.show_more}</span>
                        <ChevronDown className="w-4 h-4 text-[#FDE68A]" />
                      </button>
                      <p className="text-[11px] font-bold text-slate-500 mt-2">
                        +{results.length - visibleCount} {lang === 'mr' ? 'आणखी नोंदी शिल्लक' : 'more records remaining'}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border-2 border-dashed border-[#D4AF37]/50 rounded-2xl p-6 sm:p-10 text-center max-w-lg mx-auto my-6 shadow-sm">
                  <div className="w-14 h-14 bg-amber-50 text-[#800020] border border-[#D4AF37]/40 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <SearchX className="w-7 h-7" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#4A000B] mb-1">
                    {t.no_results_title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5">
                    {t.no_results_desc}
                  </p>
                  <button
                    onClick={() => {
                      setQuery('');
                      setSelectedLandmark('ALL');
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-[#4A000B] to-[#800020] hover:from-[#3B070E] hover:to-[#630D1A] text-[#FFFDF9] font-bold text-xs rounded-xl shadow-sm border border-[#D4AF37]/40 transition cursor-pointer"
                  >
                    {t.reset_filters}
                  </button>
                </div>
              )}
            </div>

            {/* "महत्त्वाची सूचना" (Verification Safeguards Disclaimer Banner) at bottom */}
            <DisclaimerBanner lang={lang} />
          </>
        )}
      </main>
      </ErrorBoundary>

      {/* Show App Download Footer only on public register/karyakarta pages, not in Super Admin portal */}
      {activeTab !== 'superadmin' ? (
        <AppDownloadFooter lang={lang} t={t} />
      ) : (
        <footer className="py-4 text-center text-xs font-bold text-amber-200/60 border-t border-white/10 select-none">
          अकरा मारुती चौक सार्वजनिक गणेशोत्सव मंडळ • मुख्य प्रशासकीय नियंत्रण कक्ष (Super Admin Portal)
        </footer>
      )}

      {/* Export Data Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        donors={donors}
        lang={lang}
      />
    </div>
  );
}

export default App;
