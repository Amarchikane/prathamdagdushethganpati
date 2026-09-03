import Fuse from 'fuse.js';
import { searchAndRankDonors } from './src/hooks/useFuseSearch.js';
import { SEED_DONORS } from './src/data/seedDonors.js';

console.log('Testing newly created entries in search...');

const newEntry = {
  id: 'PAV-1709400000',
  receipt_no: 'AM-2026-0099',
  name_mr: 'नितीन गडकरी',
  name_en: 'Nitin Gadkari',
  mobile: '9822998877',
  amount: 11000,
  landmark_mr: 'शुक्रवार पेठ',
  landmark_en: 'Shukrawar Peth',
  book_ref: 'पावती क्र. AM-2026-0099',
  date: '05/09/2026',
  is_new_entry: true
};

const combined = [newEntry, ...SEED_DONORS];

const fuse = new Fuse(combined, {
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

// Test 1: Search by English name
const resEn = searchAndRankDonors(combined, 'nitin', 'ALL', 'AMOUNT_DESC', fuse);
console.log('1. Search "nitin":', resEn.map(d => `${d.name_mr} (${d.id || d.receipt_no})`));
if (!resEn.some(d => d.receipt_no === 'AM-2026-0099')) {
  console.error('FAIL: Could not find new entry by "nitin"');
  process.exit(1);
}

// Test 2: Search by Marathi name
const resMr = searchAndRankDonors(combined, 'नितीन', 'ALL', 'AMOUNT_DESC', fuse);
console.log('2. Search "नितीन":', resMr.map(d => `${d.name_mr} (${d.id || d.receipt_no})`));
if (!resMr.some(d => d.receipt_no === 'AM-2026-0099')) {
  console.error('FAIL: Could not find new entry by "नितीन"');
  process.exit(1);
}

// Test 3: Search by Receipt Number
const resReceipt = searchAndRankDonors(combined, 'AM-2026-0099', 'ALL', 'AMOUNT_DESC', fuse);
console.log('3. Search "AM-2026-0099":', resReceipt.map(d => `${d.name_mr} (${d.id || d.receipt_no})`));
if (!resReceipt.some(d => d.receipt_no === 'AM-2026-0099')) {
  console.error('FAIL: Could not find new entry by receipt number');
  process.exit(1);
}

// Test 4: Search by Mobile Number
const resPhone = searchAndRankDonors(combined, '9822998877', 'ALL', 'AMOUNT_DESC', fuse);
console.log('4. Search "9822998877":', resPhone.map(d => `${d.name_mr} (${d.id || d.receipt_no})`));
if (!resPhone.some(d => d.receipt_no === 'AM-2026-0099')) {
  console.error('FAIL: Could not find new entry by mobile number');
  process.exit(1);
}

console.log('\n✅ ALL NEW ENTRY SEARCH TESTS PASSED SUCCESSFULLY!');
