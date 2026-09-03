import { SEED_DONORS } from './src/data/seedDonors.js';
import { convertEnglishToMarathi, convertMarathiToEnglish, detectScript } from './src/utils/transliterate.js';
import { numberToMarathiWords, toMarathiDigits } from './src/utils/numberToMarathiWords.js';
import fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

console.log('=====================================================');
console.log('  MANDAL PORTAL: COMPREHENSIVE CLIENT READINESS TEST  ');
console.log('=====================================================\n');

// 1. DATASET INTEGRITY
console.log('--- 1. SEED REGISTER & DATASET INTEGRITY ---');
assert(Array.isArray(SEED_DONORS) && SEED_DONORS.length === 450, `Seed donor records count is exactly 450 (Found: ${SEED_DONORS.length})`);
const sampleDonor = SEED_DONORS[0];
assert(sampleDonor.id && sampleDonor.name_mr && sampleDonor.amount > 0, `Donor schema valid (ID: ${sampleDonor.id}, Name: ${sampleDonor.name_mr}, Amount: ${sampleDonor.amount})`);

// 2. TRANSLITERATION & SCRIPT DETECTION
console.log('\n--- 2. TRANSLITERATION & SCRIPT CONVERSION ---');
assert(detectScript('suresh') === 'en', 'Detect English script for "suresh"');
assert(detectScript('सुरेश') === 'mr', 'Detect Marathi script for "सुरेश"');
assert(detectScript('12345') === 'other', 'Detect non-alphabet script for "12345"');

const tr1 = convertEnglishToMarathi('suresh');
assert(tr1.includes('सुरेश'), `Transliterate "suresh" -> "${tr1}"`);

const tr2 = convertEnglishToMarathi('yash');
assert(tr2.startsWith('यश'), `Transliterate "yash" -> "${tr2}"`);

const tr3 = convertEnglishToMarathi('salunke');
assert(tr3.includes('साळुंके') || tr3.includes('सालुंके') || tr3.includes('साळुंखे'), `Transliterate "salunke" -> "${tr3}"`);

const tr4 = convertEnglishToMarathi('amar');
assert(tr4.startsWith('अमर'), `Transliterate "amar" -> "${tr4}"`);

// 3. MARATHI NUMBER WORDS & DIGITS
console.log('\n--- 3. MARATHI NUMERALS & NUMBER TO WORDS ---');
assert(toMarathiDigits(501) === '५०१', 'Convert 501 -> ५०१');
assert(toMarathiDigits('03/09/2026') === '०३/०९/२०२६', 'Convert date "03/09/2026" -> ०३/०९/२०२६');
assert(toMarathiDigits('AM-2026-0042') === 'AM-२०२६-००४२', 'Convert receipt number AM-2026-0042 -> AM-२०२६-००४२');

const words501 = numberToMarathiWords(501);
assert(words501.includes('पाचशे एक'), `501 in words: "${words501}"`);

const words11111 = numberToMarathiWords(11111);
assert(words11111.includes('अकरा हजार एकशे अकरा'), `11111 in words: "${words11111}"`);

const words15000 = numberToMarathiWords(15000);
assert(words15000.includes('पंधरा हजार'), `15000 in words: "${words15000}"`);

const words100 = numberToMarathiWords(100);
assert(words100.includes('एकशे') || words100.includes('शंभर'), `100 in words: "${words100}"`);

// 4. SEARCH & RANKING ALGORITHM
console.log('\n--- 4. SEARCH & RANKING ALGORITHM ---');

import Fuse from 'fuse.js';
import { searchAndRankDonors } from './src/hooks/useFuseSearch.js';

const fuse = new Fuse(SEED_DONORS, {
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

const yashMatches = searchAndRankDonors(SEED_DONORS, 'yash', 'ALL', 'AMOUNT_DESC', fuse);
assert(yashMatches.length > 0, `Search "yash" returned ${yashMatches.length} results`);
assert(yashMatches[0].id === 'REG-021', `Top result for "yash" is REG-021 (Found: ${yashMatches[0]?.name_mr})`);
assert(yashMatches[1].id === 'REG-358', `Second result for "yash" is REG-358 (Found: ${yashMatches[1]?.name_mr})`);
assert(yashMatches[2].id === 'REG-062', `Third result for "yash" is REG-062 (Found: ${yashMatches[2]?.name_mr})`);

const amarMatches = searchAndRankDonors(SEED_DONORS, 'amar', 'ALL', 'AMOUNT_DESC', fuse);
assert(amarMatches.length >= 1 && amarMatches.some(m => m.name_mr.includes('अमर')), `Search "amar" matched Marathi records with "अमर"`);

const salunkeMatches = searchAndRankDonors(SEED_DONORS, 'salunke', 'ALL', 'AMOUNT_DESC', fuse);
assert(salunkeMatches.length >= 1 && salunkeMatches.some(m => m.name_mr.includes('साळुंके')), `Search "salunke" matched Marathi records with "साळुंके"`);

const amtMatches = searchAndRankDonors(SEED_DONORS, '15000', 'ALL', 'AMOUNT_DESC', fuse);
assert(amtMatches.length === 1 && amtMatches[0].amount === 15000, `Search "15000" matched highest donor (Found: ${amtMatches[0]?.name_mr} ₹${amtMatches[0]?.amount})`);

// 5. NEW PAVTHI ENTRY & SEARCH MERGE VERIFICATION
console.log('\n--- 5. NEW PAVTHI ENTRY SEARCH MERGING ---');
const newPavthi = {
  id: 'PAV-test-01',
  receipt_no: 'AM-2026-0042',
  name_mr: 'अजित पवार',
  name_en: 'Ajit Pawar',
  phonetic_aliases: ['ajit', 'pawar', 'AM-2026-0042', '9822114477'],
  mobile: '9822114477',
  amount: 25000,
  received_amount: 20000,
  is_pending: true,
  pending_amount: 5000,
  date: '03/09/2026',
  year: 2026
};

const combinedList = [newPavthi, ...SEED_DONORS];
const combinedFuse = new Fuse(combinedList, {
  keys: [
    { name: 'name_mr', weight: 0.4 },
    { name: 'name_en', weight: 0.4 },
    { name: 'receipt_no', weight: 0.3 },
    { name: 'mobile', weight: 0.3 },
    { name: 'phonetic_aliases', weight: 0.2 },
    { name: 'amount', weight: 0.1 }
  ],
  threshold: 0.35,
  includeScore: true
});

const searchNewNameEn = searchAndRankDonors(combinedList, 'ajit', 'ALL', 'AMOUNT_DESC', combinedFuse);
assert(searchNewNameEn[0].id === 'PAV-test-01', `Search "ajit" finds newly added pavthi at top (Found: ${searchNewNameEn[0]?.name_mr})`);

const searchNewNameMr = searchAndRankDonors(combinedList, 'अजित', 'ALL', 'AMOUNT_DESC', combinedFuse);
assert(searchNewNameMr[0].id === 'PAV-test-01', `Search "अजित" finds newly added pavthi at top (Found: ${searchNewNameMr[0]?.name_mr})`);

const searchNewRec = searchAndRankDonors(combinedList, 'AM-2026-0042', 'ALL', 'AMOUNT_DESC', combinedFuse);
assert(searchNewRec.length >= 1 && searchNewRec[0].id === 'PAV-test-01', `Search receipt number "AM-2026-0042" found exact new pavthi`);

const searchNewMob = searchAndRankDonors(combinedList, '9822114477', 'ALL', 'AMOUNT_DESC', combinedFuse);
assert(searchNewMob.length >= 1 && searchNewMob[0].id === 'PAV-test-01', `Search mobile "9822114477" found exact new pavthi`);

// 6. UI CLEANLINESS & SECURITY
console.log('\n--- 6. UI CLEANLINESS & SECURITY AUDIT ---');
const loginPageCode = fs.readFileSync('./src/components/LoginPage.jsx', 'utf8');
assert(!loginPageCode.includes('fillQuickCredentials'), 'No fillQuickCredentials function in LoginPage');
assert(!loginPageCode.includes('superadmin / 9999'), 'No credential hints (superadmin / 9999) in LoginPage');
assert(!loginPageCode.includes('admin / 1124'), 'No credential hints (admin / 1124) in LoginPage');
assert(!loginPageCode.includes('login_demo_hint'), 'No demo hint element rendered in LoginPage');

const pavthiPageCode = fs.readFileSync('./src/components/PavthiPage.jsx', 'utf8');
assert(!pavthiPageCode.includes('D1 मध्ये'), 'No "D1 मध्ये" text in PavthiPage');
assert(!pavthiPageCode.includes('Cloudflare D1'), 'No "Cloudflare D1" text in PavthiPage');
assert(pavthiPageCode.includes('syncPendingReceipts'), 'Background auto-sync engine active in PavthiPage');
assert(pavthiPageCode.includes('isAdmin'), 'Admin strict online check active in PavthiPage');

const translationsCode = fs.readFileSync('./src/i18n/translations.js', 'utf8');
assert(!translationsCode.includes('login_demo_hint'), 'No login_demo_hint key in translations.js');
assert(!translationsCode.includes('D1'), 'No D1 mentions in translations.js');

console.log('\n=====================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
if (failed === 0) {
  console.log('🎉 ALL CLIENT READINESS & FUNCTIONALITY TESTS PASSED!');
} else {
  console.error(`⚠️ ${failed} tests failed. Needs attention.`);
  process.exit(1);
}
console.log('=====================================================\n');
