import Fuse from 'fuse.js';
import { SEED_DONORS } from './src/data/seedDonors.js';
import { searchAndRankDonors } from './src/hooks/useFuseSearch.js';

console.log(`Loaded ${SEED_DONORS.length} real donor records from seedDonors.js`);

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

// 1. SPECIFIC USER REQUIREMENT TEST:
// When searching 'yash', the top matches must be the closest matches:
// REG-021 | यश मेडीकल (पायगुडे वाईन्स) | Page 1 | ₹501
// REG-358 | यश बाबुराव थोपटे | Page 7 | ₹251
// REG-062 | यश रेणुसे | Page 2 | ₹101
// followed by related matches (e.g. यशवंत, यशोधन)
console.log("\n--- RUNNING USER REQUIREMENT VERIFICATION: 'yash' prioritized ranking ---");
const yashResults = searchAndRankDonors(SEED_DONORS, 'yash', 'ALL', 'AMOUNT_DESC', fuse);
console.log(`Found ${yashResults.length} matches for 'yash':`);
yashResults.slice(0, 6).forEach((d, i) => {
  console.log(`  ${i + 1}. ${d.id} | ${d.name_mr} | ${d.book_ref} | ₹${d.amount}`);
});

const top3Ids = yashResults.slice(0, 3).map(d => d.id);
const expectedTop3 = ['REG-021', 'REG-358', 'REG-062'];
if (JSON.stringify(top3Ids) === JSON.stringify(expectedTop3)) {
  console.log("[PASS] User requirement verified: Closest 'yash' matches are in exact required order (REG-021, REG-358, REG-062)!");
} else {
  console.error(`[FAIL] Expected top 3 ${expectedTop3.join(', ')} but got ${top3Ids.join(', ')}`);
  process.exit(1);
}

// Check related matches follow
const next3Ids = yashResults.slice(3, 6).map(d => d.id);
const expectedRelated = ['REG-232', 'REG-022', 'REG-349'];
if (JSON.stringify(next3Ids) === JSON.stringify(expectedRelated)) {
  console.log("[PASS] Related matches (यशवंत, यशोधन) follow properly ranked by amount desc!");
} else {
  console.error(`[FAIL] Expected related 3 ${expectedRelated.join(', ')} but got ${next3Ids.join(', ')}`);
  process.exit(1);
}

// 2. Marathi query 'यश' test
console.log("\n--- RUNNING MARATHI QUERY VERIFICATION: 'यश' ---");
const mrYashResults = searchAndRankDonors(SEED_DONORS, 'यश', 'ALL', 'AMOUNT_DESC', fuse);
const mrTop3Ids = mrYashResults.slice(0, 3).map(d => d.id);
if (JSON.stringify(mrTop3Ids) === JSON.stringify(expectedTop3)) {
  console.log("[PASS] Marathi query 'यश' also returns exact top 3 closest matches!");
} else {
  console.error(`[FAIL] Expected mr top 3 ${expectedTop3.join(', ')} but got ${mrTop3Ids.join(', ')}`);
  process.exit(1);
}

// 3. CROSS-SCRIPT VERIFICATION TESTS
console.log("\n--- RUNNING REAL REGISTER CROSS-SCRIPT VERIFICATION TESTS ---");
const testCases = [
  { query: 'amar', expectedNameSnippet: 'अमर' },
  { query: 'salunke', expectedNameSnippet: 'साळुंके' },
  { query: 'अमर', expectedNameSnippet: 'अमर' },
  { query: 'atharv', expectedNameSnippet: 'अथर्व' },
  { query: 'pushkar', expectedNameSnippet: 'पुष्कर' },
  { query: 'ascent', expectedNameSnippet: 'असेंट' },
  { query: 'bilwa', expectedNameSnippet: 'बिल्व' },
  { query: 'dnyaneshwar', expectedNameSnippet: 'ज्ञानेश्वर' },
  { query: 'ganesh', expectedNameSnippet: 'गणेश' },
  { query: '11111', expectedCountAtLeast: 2 },
  { query: '15000', expectedCountAtLeast: 1 },
  { query: '501', expectedCountAtLeast: 25 }
];

let passed = 0;

testCases.forEach((tc, idx) => {
  const results = searchAndRankDonors(SEED_DONORS, tc.query, 'ALL', 'AMOUNT_DESC', fuse);
  if (tc.expectedNameSnippet) {
    const found = results.some(r => 
      r.name_mr.includes(tc.expectedNameSnippet) || 
      r.name_en.toLowerCase().includes(tc.query.toLowerCase())
    );
    if (found) {
      console.log(`[PASS] Test ${idx+1}: Query '${tc.query}' matched records with '${tc.expectedNameSnippet}' (${results.length} matches)`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${idx+1}: Query '${tc.query}' did NOT match '${tc.expectedNameSnippet}'`);
      console.log('Top 3 results:', results.slice(0, 3).map(r => r.name_mr));
    }
  } else if (tc.expectedCountAtLeast) {
    if (results.length >= tc.expectedCountAtLeast) {
      console.log(`[PASS] Test ${idx+1}: Query '${tc.query}' returned ${results.length} matches (>= ${tc.expectedCountAtLeast})`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${idx+1}: Query '${tc.query}' returned ${results.length} matches (expected >= ${tc.expectedCountAtLeast})`);
    }
  }
});

console.log(`\nResults: ${passed} / ${testCases.length} tests passed.`);
if (passed === testCases.length) {
  console.log("SUCCESS: All real register cross-script search & ranking requirements verified!");
} else {
  process.exit(1);
}

