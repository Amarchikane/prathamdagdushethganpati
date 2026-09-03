import { numberToMarathiWords, toMarathiDigits } from './src/utils/numberToMarathiWords.js';

console.log('=====================================================');
console.log('      PAVTHI DATABASE CREATION FLOW TEST SUITE       ');
console.log('=====================================================\n');

// 1. Simulating Form Submit Payload
const nameInput = 'सुरेश कदम';
const totalAmount = 1001;
const isPending = true;
const pendingAmt = 201;
const receivedAmt = totalAmount - pendingAmt; // 800
const selectedYear = 2026;
const formattedDate = `03/09/${selectedYear}`;
const wordsMr = numberToMarathiWords(receivedAmt);

const payload = {
  year: selectedYear,
  date: formattedDate,
  name_mr: nameInput,
  name_en: 'Suresh Kadam',
  mobile: '9876543210',
  amount: totalAmount,
  amount_words_mr: wordsMr,
  is_pending: 1,
  pending_amount: pendingAmt,
  received_amount: receivedAmt,
  donation_type: 'वर्गणी (Contribution)',
  payment_mode: 'रोख (Cash)',
  landmark_mr: 'शुक्रवार पेठ',
  landmark_en: 'Shukrawar Peth',
  created_by: 'मंडळ कार्यकर्ता (Karyakarta)',
  created_by_username: 'karyakarta'
};

console.log('1. Generated Payload:');
console.log(JSON.stringify(payload, null, 2));

if (payload.amount_words_mr.includes('आठशे')) {
  console.log('✅ [PASS] Amount in words accurately calculated for ₹800:', payload.amount_words_mr);
} else {
  console.error('❌ [FAIL] Words calculation incorrect:', payload.amount_words_mr);
  process.exit(1);
}

// 2. Simulating Cloudflare Worker Insertion & Next Sequence Logic
const mockExistingDb = [
  { receipt_no: 'AM-2026-0001', amount: 500 },
  { receipt_no: 'AM-2026-0002', amount: 1000 }
];

let nextSeqNum = 1;
const existingForYear = mockExistingDb.filter(r => r.receipt_no.startsWith(`AM-${selectedYear}-`));
if (existingForYear.length > 0) {
  const maxSeq = Math.max(...existingForYear.map(r => parseInt(r.receipt_no.split('-')[2], 10)));
  nextSeqNum = maxSeq + 1;
}
const generatedReceiptNo = `AM-${selectedYear}-${nextSeqNum.toString().padStart(4, '0')}`;

const savedDbEntry = {
  id: 'PAV-' + Date.now().toString(36),
  receipt_no: generatedReceiptNo,
  access_token: 'sec_' + Math.random().toString(36).substring(2, 10),
  ...payload,
  created_at: new Date().toISOString()
};

console.log('\n2. Database Stored Entry:');
console.log(JSON.stringify(savedDbEntry, null, 2));

if (savedDbEntry.receipt_no === 'AM-2026-0003') {
  console.log('✅ [PASS] Receipt sequence correctly incremented to AM-2026-0003');
} else {
  console.error('❌ [FAIL] Incorrect receipt number:', savedDbEntry.receipt_no);
  process.exit(1);
}

// 3. Canvas digits format
const marathiReceiptNo = toMarathiDigits(savedDbEntry.receipt_no);
const marathiDate = toMarathiDigits(savedDbEntry.date);
const marathiAmt = toMarathiDigits(savedDbEntry.received_amount);

console.log('\n3. Canvas Format for Receipt Image:');
console.log(`  पावती क्र.: ${marathiReceiptNo} (Expected: AM-२०२६-०००३)`);
console.log(`  दिनांक: ${marathiDate} (Expected: ०३/०९/२०२६)`);
console.log(`  रक्कम: ₹${marathiAmt}/- (Expected: ₹८००/-)`);

if (marathiReceiptNo === 'AM-२०२६-०००३' && marathiDate === '०३/०९/२०२६' && marathiAmt === '८००') {
  console.log('✅ [PASS] All Canvas rendered Marathi numerals are 100% accurate');
} else {
  console.error('❌ [FAIL] Numeral conversion mismatch');
  process.exit(1);
}

console.log('\n🎉 ALL NEW ENTRY DATABASE FLOW TESTS PASSED 100%!\n');
