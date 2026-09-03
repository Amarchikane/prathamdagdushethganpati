import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';

// Helper to extract searchable word tokens from a donor record
function getDonorTokens(donor) {
  if (!donor || typeof donor !== 'object') return [];
  const nameEn = (donor.name_en || '').toLowerCase();
  const nameMr = (donor.name_mr || '').toLowerCase();
  const mobile = (donor.mobile || '').toLowerCase();
  const receiptNo = (donor.receipt_no || '').toLowerCase();
  const aliases = Array.isArray(donor.phonetic_aliases)
    ? donor.phonetic_aliases.map(a => String(a || '').toLowerCase())
    : [];

  const tokensMr = nameMr.split(/[^a-z0-9\u0900-\u097F]+/).filter(Boolean);
  const tokensEn = nameEn.split(/[^a-z0-9\u0900-\u097F]+/).filter(Boolean);

  return Array.from(new Set([...tokensMr, ...tokensEn, ...aliases, mobile, receiptNo].filter(Boolean)));
}

// Calculate match closeness tier (lower number = closer match)
function calculateSearchRank(donor, rawQuery, fuseScore = null) {
  if (!donor || typeof donor !== 'object') return 999;
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) return 999;

  const id = (donor.id || '').toLowerCase();
  const receiptNo = (donor.receipt_no || '').toLowerCase();
  const mobile = (donor.mobile || '').toLowerCase();
  const nameEn = (donor.name_en || '').toLowerCase();
  const nameMr = (donor.name_mr || '').toLowerCase();
  const bookRef = (donor.book_ref || '').toLowerCase();
  const amountStr = String(donor.amount || '');
  const landmarkMr = (donor.landmark_mr || '').toLowerCase();
  const landmarkEn = (donor.landmark_en || '').toLowerCase();
  const tokens = getDonorTokens(donor);

  const isNumeric = /^\d+$/.test(q);

  // 1. Exact ID or Receipt No match (e.g. 'REG-021', 'AM-2024-0101', '0101', '101')
  if (
    id === q || 
    id.replace('reg-', '') === q.replace('reg-', '').padStart(3, '0') ||
    receiptNo === q ||
    (receiptNo && receiptNo.endsWith(q))
  ) {
    return 10;
  }

  // 1.5 Exact mobile number match or partial mobile match
  if (mobile && (mobile === q || mobile.includes(q))) {
    return 15;
  }

  // 2. Exact full name match
  if (nameMr === q || nameEn === q) {
    return 20;
  }

  // 3. Exact amount match if query is purely numeric
  if (isNumeric && amountStr === q) {
    return 25;
  }

  // 4. Name starts with query as a standalone word (e.g. "Yash Medical", "यश मेडीकल")
  if (
    nameEn.startsWith(q + ' ') || 
    nameMr.startsWith(q + ' ') ||
    nameEn === q ||
    nameMr === q
  ) {
    return 30;
  }

  // 5. Exact word token match anywhere (e.g. surname or alias token matches query exactly)
  if (tokens.some(t => t === q)) {
    return 40;
  }

  // 6. Multi-word match: all query words match donor tokens
  const qWords = q.split(/\s+/).filter(Boolean);
  if (qWords.length > 1 && qWords.every(qw => tokens.some(t => t === qw || t.startsWith(qw)))) {
    return 50;
  }

  // 7. Name starts with query prefix (e.g. "Yashwant" starts with "yash", "यशवंत" starts with "यश")
  if (nameEn.startsWith(q) || nameMr.startsWith(q)) {
    return 60;
  }

  // 8. Any word token starts with query prefix (e.g. middle name or surname starts with query)
  if (tokens.some(t => t.startsWith(q))) {
    return 70;
  }

  // 9. Book reference match (e.g. "Page 1")
  if (bookRef.includes(q)) {
    return 80;
  }

  // 10. Landmark match
  if (landmarkEn.includes(q) || landmarkMr.includes(q)) {
    return 90;
  }

  // 11. Substring in word tokens (only for queries with >= 4 characters to avoid false syllable matches)
  if (q.length >= 4 && tokens.some(t => t.includes(q))) {
    return 100;
  }

  // 12. Fuse fuzzy match fallback for typos (with score < 0.45)
  if (fuseScore !== null && fuseScore < 0.45) {
    return 110 + Math.round(fuseScore * 50);
  }

  return 999;
}

export function searchAndRankDonors(donors = [], query = '', selectedLandmark = 'ALL', sortBy = 'AMOUNT_DESC', fuse = null) {
  if (!Array.isArray(donors)) return [];
  const validDonors = donors.filter(d => Boolean(d && d.id));
  const cleanQuery = (query || '').trim();

  // 1. If query is empty, apply landmark filter and simple sort
  if (!cleanQuery) {
    let list = [...validDonors];

    if (selectedLandmark && selectedLandmark !== 'ALL') {
      list = list.filter(item => 
        item && (item.landmark_mr === selectedLandmark || item.landmark_en === selectedLandmark)
      );
    }

    list.sort((a, b) => {
      if (!a || !b) return 0;
      if (sortBy === 'AMOUNT_DESC') return (b.amount || 0) - (a.amount || 0);
      if (sortBy === 'AMOUNT_ASC') return (a.amount || 0) - (b.amount || 0);
      if (sortBy === 'NAME') return (a.name_mr || '').localeCompare(b.name_mr || '', 'mr');
      return 0;
    });

    return list.filter(Boolean);
  }

  // 2. Query is active: Run Fuse search for fuzzy scores and compute closeness tiers
  const fuseScoreMap = new Map();
  if (fuse) {
    try {
      const fuseResults = fuse.search(cleanQuery);
      fuseResults.forEach(r => {
        if (r && r.item && r.item.id) {
          fuseScoreMap.set(r.item.id, r.score);
        }
      });
    } catch (_) {}
  }

  const candidates = [];
  for (const donor of validDonors) {
    if (!donor) continue;
    // Apply Landmark Filter early
    if (selectedLandmark && selectedLandmark !== 'ALL') {
      if (donor.landmark_mr !== selectedLandmark && donor.landmark_en !== selectedLandmark) {
        continue;
      }
    }

    const fScore = fuseScoreMap.has(donor.id) ? fuseScoreMap.get(donor.id) : null;
    const rank = calculateSearchRank(donor, cleanQuery, fScore);

    if (rank < 200) {
      candidates.push({ donor, rank, score: fScore ?? 1 });
    }
  }

  // 3. Sort candidates:
  candidates.sort((a, b) => {
    if (!a.donor || !b.donor) return 0;
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    if (sortBy === 'AMOUNT_DESC') {
      return (b.donor.amount || 0) - (a.donor.amount || 0);
    }
    if (sortBy === 'AMOUNT_ASC') {
      return (a.donor.amount || 0) - (b.donor.amount || 0);
    }
    if (sortBy === 'NAME') {
      return (a.donor.name_mr || '').localeCompare(b.donor.name_mr || '', 'mr');
    }
    return (a.score || 0) - (b.score || 0);
  });

  return candidates.map(c => c.donor).filter(Boolean);
}

export function useFuseSearch(donors = []) {
  const [query, setQuery] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState('ALL');
  const [sortBy, setSortBy] = useState('AMOUNT_DESC'); // AMOUNT_DESC, AMOUNT_ASC, NAME

  const validDonors = useMemo(() => {
    return Array.isArray(donors) ? donors.filter(d => Boolean(d && d.id)) : [];
  }, [donors]);

  const fuse = useMemo(() => {
    try {
      return new Fuse(validDonors, {
        keys: [
          { name: 'name_mr', weight: 0.35 },
          { name: 'name_en', weight: 0.35 },
          { name: 'receipt_no', weight: 0.2 },
          { name: 'mobile', weight: 0.2 },
          { name: 'phonetic_aliases', weight: 0.15 },
          { name: 'landmark_mr', weight: 0.1 },
          { name: 'landmark_en', weight: 0.1 },
          { name: 'book_ref', weight: 0.1 },
          { name: 'amount', weight: 0.1 }
        ],
        threshold: 0.35,
        ignoreLocation: true,
        useExtendedSearch: true,
        includeScore: true,
        minMatchCharLength: 1
      });
    } catch (_) {
      return null;
    }
  }, [validDonors]);

  // Extract unique landmarks for filter chips
  const landmarks = useMemo(() => {
    const set = new Set();
    validDonors.forEach(d => {
      if (d && d.landmark_mr) set.add(d.landmark_mr);
      if (d && d.landmark_en) set.add(d.landmark_en);
    });
    return Array.from(set);
  }, [validDonors]);

  const filteredAndSortedDonors = useMemo(() => {
    return searchAndRankDonors(validDonors, query, selectedLandmark, sortBy, fuse);
  }, [validDonors, fuse, query, selectedLandmark, sortBy]);

  return {
    query,
    setQuery,
    selectedLandmark,
    setSelectedLandmark,
    sortBy,
    setSortBy,
    landmarks,
    results: filteredAndSortedDonors,
    totalCount: validDonors.length,
    filteredCount: filteredAndSortedDonors.length
  };
}
