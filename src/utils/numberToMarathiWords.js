// Utility to convert numbers into Marathi currency words
const ONES = [
  '', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा',
  'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस'
];

const TENS = [
  '', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'
];

const SPECIAL_TENS = {
  21: 'एकवीस', 22: 'बावीस', 23: 'तेवीस', 24: 'चोवीस', 25: 'पंचवीस', 26: 'सव्वीस', 27: 'सत्तावीस', 28: 'अठ्ठावीस', 29: 'एकोणतीस',
  31: 'एकतीस', 32: 'बत्तीस', 33: 'तेहेतीस', 34: 'चौतीस', 35: 'पस्तीस', 36: 'छत्तीस', 37: 'सदतीस', 38: 'अडतीस', 39: 'एकेचाळीस',
  41: 'एक्केचाळीस', 42: 'बेचाळीस', 43: 'त्रेचाळीस', 44: 'चव्वेचाळीस', 45: 'पंचेचाळीस', 46: 'शेहेचाळीस', 47: 'सत्तेचाळीस', 48: 'अठ्ठेचाळीस', 49: 'एकोणपन्नास',
  51: 'एक्कावन्न', 52: 'बावन्न', 53: 'त्रेपन्न', 54: 'चौपन्न', 55: 'पंचावन्न', 56: 'छप्पन्न', 57: 'सत्तावन्न', 58: 'अठ्ठावन्न', 59: 'एकोणसाठ',
  61: 'एकसष्ठ', 62: 'बासष्ठ', 63: 'त्रेसष्ठ', 64: 'चौसष्ठ', 65: 'पासष्ठ', 66: 'सहासष्ठ', 67: 'सदुसष्ठ', 68: 'अडुसष्ठ', 69: 'एकोणसत्तर',
  71: 'एकाहत्तर', 72: 'बाहत्तर', 73: 'त्र्याहत्तर', 74: 'चौऱ्याहत्तर', 75: 'पंच्याहत्तर', 76: 'शहात्तर', 77: 'सत्त्याहत्तर', 78: 'अठ्ठ्याहत्तर', 79: 'एकोणऐंशी',
  81: 'ऐंशी-एक', 82: 'ब्यांशी', 83: 'त्र्यांशी', 84: 'चौऱ्यांशी', 85: 'पंच्यांशी', 86: 'शहांशी', 87: 'सत्त्यांशी', 88: 'अठ्ठ्यांशी', 89: 'एकोणनव्वद',
  91: 'एक्याण्णव', 92: 'ब्याण्णव', 93: 'त्र्याण्णव', 94: 'चौऱ्याण्णव', 95: 'पंच्याण्णव', 96: 'शहाण्णव', 97: 'सत्त्याण्णव', 98: 'अठ्ठ्याण्णव', 99: 'नव्व्याण्णव'
};

function twoDigitsToMarathi(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (SPECIAL_TENS[n]) return SPECIAL_TENS[n];
  const ten = Math.floor(n / 10);
  const rem = n % 10;
  return `${TENS[ten]} ${ONES[rem]}`.trim();
}

export function toMarathiDigits(str) {
  if (str === null || str === undefined) return '';
  const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(str).replace(/[0-9]/g, d => marathiDigits[Number(d)]);
}

export function numberToMarathiWords(amount, suffix = 'रुपये मात्र') {
  const num = parseInt(amount, 10);
  if (isNaN(num) || num <= 0) return '';
  if (num === 0) return `शून्य ${suffix}`;

  let remaining = num;
  const parts = [];

  // Crores (करोड)
  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    parts.push(`${twoDigitsToMarathi(crore)} कोटी`);
  }

  // Lakhs (लाख)
  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    remaining %= 100000;
    parts.push(`${twoDigitsToMarathi(lakh)} लाख`);
  }

  // Thousands (हजार)
  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    remaining %= 1000;
    parts.push(`${twoDigitsToMarathi(thousand)} हजार`);
  }

  // Hundreds (शे)
  if (remaining >= 100) {
    const hundred = Math.floor(remaining / 100);
    remaining %= 100;
    const hundredWord = hundred === 1 ? 'एकशे' : `${ONES[hundred]}शे`;
    parts.push(hundredWord);
  }

  // Remaining 1-99
  if (remaining > 0) {
    parts.push(twoDigitsToMarathi(remaining));
  }

  return `${parts.filter(Boolean).join(' ')} ${suffix}`;
}
