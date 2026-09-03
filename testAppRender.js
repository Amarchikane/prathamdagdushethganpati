import React from 'react';
import { TRANSLATIONS } from './src/i18n/translations.js';
import { SEED_DONORS } from './src/data/seedDonors.js';
import { normalizeDonor, mergeDonorsList } from './src/hooks/useDonors.js';
import { searchAndRankDonors } from './src/hooks/useFuseSearch.js';
import Fuse from 'fuse.js';

console.log('Testing App hooks and components logic...');

// Test 1: Donors normalization
const normalizedSeed = SEED_DONORS.map(normalizeDonor).filter(Boolean);
console.log(`Normalized seed donors count: ${normalizedSeed.length}`);
if (normalizedSeed.length !== 450) {
  console.error('Mismatch in normalized seed count!');
  process.exit(1);
}

// Test 2: Fuse search
const fuse = new Fuse(normalizedSeed, {
  keys: [
    { name: 'name_mr', weight: 0.35 },
    { name: 'name_en', weight: 0.35 },
    { name: 'receipt_no', weight: 0.2 },
    { name: 'mobile', weight: 0.2 }
  ],
  threshold: 0.35
});

const res = searchAndRankDonors(normalizedSeed, '', 'ALL', 'AMOUNT_DESC', fuse);
console.log(`Empty query results count: ${res.length}`);
if (res.length !== 450) {
  console.error('Empty query failed to return all donors!');
  process.exit(1);
}

// Test 3: Translations completeness
const langs = ['mr', 'en'];
for (const lang of langs) {
  const t = TRANSLATIONS[lang];
  if (!t) {
    console.error(`Missing translation for ${lang}`);
    process.exit(1);
  }
  const requiredKeys = [
    'search_placeholder', 'landmark', 'all_landmarks', 'sort_amount_desc',
    'sort_amount_asc', 'sort_name', 'showing_count', 'no_results_title',
    'no_results_desc', 'reset_filters', 'disclaimer', 'copy_ref', 'copied_toast'
  ];
  for (const k of requiredKeys) {
    if (typeof t[k] !== 'string') {
      console.error(`Missing or non-string translation key "${k}" in "${lang}"`);
      process.exit(1);
    }
  }
}
console.log('All translation keys verified!');

console.log('All checks passed successfully!');
