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
import { TRANSLATIONS } from './i18n/translations';
import { SearchX, ChevronDown } from 'lucide-react';

const PAGE_SIZE = 30;

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState('mr');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const isOnline = useOnlineStatus();
  const { donors } = useDonors();

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

  // Reset pagination when search query or filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, selectedLandmark, sortBy]);

  const isFiltered = query.trim().length > 0 || selectedLandmark !== 'ALL';

  // Sliced records for smooth mobile performance
  const displayedResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} lang={lang} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6ED] selection:bg-amber-200 selection:text-[#4A000B]">
      {/* Top Mobile Main Header */}
      <Header
        lang={lang}
        setLang={setLang}
        isOnline={isOnline}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 px-3 sm:px-6 pb-8">
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
      </main>

      {/* Royal Maroon Mobile Footer with App Download / Install */}
      <AppDownloadFooter lang={lang} t={t} />

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
