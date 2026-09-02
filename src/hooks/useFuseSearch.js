import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';

// Helper to extract searchable word tokens from a donor record
function getDonorTokens(donor) {
  const nameEn = (donor.name_en || '').toLowerCase();
  const nameMr = (donor.name_mr || '').toLowerCase();
  const aliases = (donor.phonetic_aliases || []).map(a => String(a).toLowerCase());

  const tokensMr = nameMr.split(/[^a-z0-9\u0900-\u097F]+/).filter(Boolean);
  const tokensEn = nameEn.split(/[^a-z0-9\u0900-\u097F]+/).filter(Boolean);

  return Array.from(new Set([...tokensMr, ...tokensEn, ...aliases]));
}

// Calculate match closeness tier (lower number = closer match)
function calculateSearchRank(donor, rawQuery, fuseScore = null) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 999;

  const id = (donor.id || '').toLowerCase();
  const nameEn = (donor.name_en || '').toLowerCase();
  const nameMr = (donor.name_mr || '').toLowerCase();
  const bookRef = (donor.book_ref || '').toLowerCase();
  const amountStr = String(donor.amount || '');
  const landmarkMr = (donor.landmark_mr || '').toLowerCase();
  const landmarkEn = (donor.landmark_en || '').toLowerCase();
  const tokens = getDonorTokens(donor);

  const isNumeric = /^\d+$/.test(q);

  // 1. Exact ID match (e.g. 'REG-021' or '021' or 'reg-21')
  if (id === q || id.replace('reg-', '') === q.replace('reg-', '').padStart(3, '0')) {
    return 10;
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

export function searchAndRankDonors(donors, query = '', selectedLandmark = 'ALL', sortBy = 'AMOUNT_DESC', fuse = null) {
  const cleanQuery = query.trim();

  // 1. If query is empty, apply landmark filter and simple sort
  if (!cleanQuery) {
    let list = [...donors];

    if (selectedLandmark && selectedLandmark !== 'ALL') {
      list = list.filter(item => 
        item.landmark_mr === selectedLandmark || item.landmark_en === selectedLandmark
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'AMOUNT_DESC') return b.amount - a.amount;
      if (sortBy === 'AMOUNT_ASC') return a.amount - b.amount;
      if (sortBy === 'NAME') return a.name_mr.localeCompare(b.name_mr, 'mr');
      return 0;
    });

    return list;
  }

  // 2. Query is active: Run Fuse search for fuzzy scores and compute closeness tiers
  const fuseScoreMap = new Map();
  if (fuse) {
    const fuseResults = fuse.search(cleanQuery);
    fuseResults.forEach(r => {
      fuseScoreMap.set(r.item.id, r.score);
    });
  }

  const candidates = [];
  for (const donor of donors) {
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
  // Primarily by closeness rank tier (e.g. closest exact match first)
  // Within the same closeness tier, apply the user's chosen sort order
  candidates.sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    if (sortBy === 'AMOUNT_DESC') {
      return b.donor.amount - a.donor.amount;
    }
    if (sortBy === 'AMOUNT_ASC') {
      return a.donor.amount - b.donor.amount;
    }
    if (sortBy === 'NAME') {
      return a.donor.name_mr.localeCompare(b.donor.name_mr, 'mr');
    }
    return (a.score || 0) - (b.score || 0);
  });

  return candidates.map(c => c.donor);
}

export function useFuseSearch(donors) {
  const [query, setQuery] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState('ALL');
  const [sortBy, setSortBy] = useState('AMOUNT_DESC'); // AMOUNT_DESC, AMOUNT_ASC, NAME

  const fuse = useMemo(() => {
    return new Fuse(donors, {
      keys: [
        { name: 'name_mr', weight: 0.4 },
        { name: 'name_en', weight: 0.4 },
        { name: 'phonetic_aliases', weight: 0.2 },
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
  }, [donors]);

  // Extract unique landmarks for filter chips
  const landmarks = useMemo(() => {
    const set = new Set();
    donors.forEach(d => {
      if (d.landmark_mr) set.add(d.landmark_mr);
      if (d.landmark_en) set.add(d.landmark_en);
    });
    return Array.from(set);
  }, [donors]);

  const filteredAndSortedDonors = useMemo(() => {
    return searchAndRankDonors(donors, query, selectedLandmark, sortBy, fuse);
  }, [donors, fuse, query, selectedLandmark, sortBy]);

  return {
    query,
    setQuery,
    selectedLandmark,
    setSelectedLandmark,
    sortBy,
    setSortBy,
    landmarks,
    results: filteredAndSortedDonors,
    totalCount: donors.length,
    filteredCount: filteredAndSortedDonors.length
  };
}

