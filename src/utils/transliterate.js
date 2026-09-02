import { SEED_DONORS } from '../data/seedDonors.js';

// Build a fast bidirectional dictionary from the 450+ seed donor names
const EN_TO_MR_DICT = new Map();
const MR_TO_EN_DICT = new Map();

// Common Marathi names & surnames dictionary
const COMMON_PAIRS = [
  ['amar', 'अमर'], ['chikane', 'चिकणे'], ['suresh', 'सुरेश'], ['ramesh', 'रमेश'],
  ['mahesh', 'महेश'], ['ganesh', 'गणेश'], ['dinesh', 'दिनेश'], ['rajesh', 'राजेश'],
  ['santosh', 'संतोष'], ['sachin', 'सचिन'], ['rahul', 'राहुल'], ['vijay', 'विजय'],
  ['ajay', 'अजय'], ['anil', 'अनिल'], ['sunil', 'सुनील'], ['prashant', 'प्रशांत'],
  ['pravin', 'प्रवीण'], ['pramod', 'प्रमोद'], ['nitin', 'नितीन'], ['sandip', 'संदीप'],
  ['sandeep', 'संदीप'], ['amit', 'अमित'], ['sumit', 'सुमित'], ['anand', 'आनंद'],
  ['dattatray', 'दत्तात्रय'], ['datta', 'दत्ता'], ['maruti', 'मारुती'], ['akara', 'अकरा'],
  ['kadam', 'कदम'], ['patil', 'पाटील'], ['pawar', 'पवार'], ['shinde', 'शिंदे'],
  ['jadhav', 'जाधव'], ['salunke', 'साळुंके'], ['salunkhe', 'साळुंखे'], ['more', 'मोरे'],
  ['chavan', 'चव्हाण'], ['bhosale', 'भोसले'], ['deshmukh', 'देशमुख'], ['joshi', 'जोशी'],
  ['gaikwad', 'गायकवाड'], ['kulkarni', 'कुलकर्णी'], ['kamble', 'कांबळे'], ['sawant', 'सावंत'],
  ['sharma', 'शर्मा'], ['gupta', 'गुप्ता'], ['nanaware', 'ननावरे'], ['baban', 'बबन'],
  ['gangawane', 'गंगावणे'], ['gitanjali', 'गीतांजली'], ['hotel', 'हॉटेल'], ['medical', 'मेडीकल'],
  ['stores', 'स्टोअर्स'], ['centre', 'सेंटर'], ['center', 'सेंटर'], ['chowk', 'चौक'],
  ['peth', 'पेठ'], ['shukrawar', 'शुक्रवार'], ['shahu', 'शाहू'], ['mandai', 'मंडई']
];

COMMON_PAIRS.forEach(([en, mr]) => {
  EN_TO_MR_DICT.set(en.toLowerCase(), mr);
  MR_TO_EN_DICT.set(mr, en.charAt(0).toUpperCase() + en.slice(1));
});

// Populate from seed donors
try {
  SEED_DONORS.forEach(donor => {
    if (donor.name_mr && donor.name_en) {
      const mrWords = donor.name_mr.replace(/[^\u0900-\u097F\s]/g, '').trim().split(/\s+/);
      const enWords = donor.name_en.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);

      if (mrWords.length === enWords.length) {
        for (let i = 0; i < mrWords.length; i++) {
          const mr = mrWords[i].trim();
          const en = enWords[i].trim().toLowerCase();
          if (mr && en && mr.length > 1 && en.length > 1) {
            if (!EN_TO_MR_DICT.has(en)) {
              EN_TO_MR_DICT.set(en, mr);
            }
            if (!MR_TO_EN_DICT.has(mr)) {
              const capEn = en.charAt(0).toUpperCase() + en.slice(1);
              MR_TO_EN_DICT.set(mr, capEn);
            }
          }
        }
      }
    }
  });
} catch (e) {
  console.warn('Could not populate seed donors transliteration dict', e);
}

// Phonetic mappings for English to Marathi
const PHONETIC_CONSONANTS = [
  ['ksh', 'क्ष'], ['dny', 'ज्ञ'], ['chh', 'छ'], ['shh', 'ष'],
  ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'],
  ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'],
  ['sh', 'श'], ['rh', 'ऱ्ह'],
  ['k', 'क'], ['g', 'ग'], ['c', 'क'], ['j', 'ज'],
  ['t', 'त'], ['d', 'द'], ['n', 'न'], ['p', 'प'],
  ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'],
  ['l', 'ल'], ['v', 'व'], ['w', 'व'], ['s', 'स'],
  ['h', 'ह'], ['z', 'झ'], ['f', 'फ'], ['x', 'क्स']
];

const PHONETIC_VOWELS = [
  ['aa', 'ा'], ['ee', 'ी'], ['oo', 'ू'], ['ai', 'ै'],
  ['au', 'ौ'], ['ou', 'ौ'], ['ea', 'ी'],
  ['a', 'ा'], ['i', 'ि'], ['u', 'ु'], ['e', 'े'], ['o', 'ो']
];

const INITIAL_VOWELS = {
  'aa': 'आ', 'a': 'अ', 'ee': 'ई', 'i': 'इ',
  'oo': 'ऊ', 'u': 'उ', 'e': 'ए', 'ai': 'ऐ',
  'o': 'ओ', 'au': 'औ', 'am': 'अं', 'an': 'अं'
};

export function detectScript(text) {
  if (!text || !text.trim()) return 'empty';
  if (/[\u0900-\u097F]/.test(text)) return 'mr';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return 'other';
}

function transliterateEnglishWord(word) {
  const lower = word.toLowerCase();
  if (EN_TO_MR_DICT.has(lower)) {
    return EN_TO_MR_DICT.get(lower);
  }

  // Pure phonetic conversion
  let res = '';
  let i = 0;

  // Check initial vowel
  for (const [v, dev] of Object.entries(INITIAL_VOWELS)) {
    if (lower.startsWith(v)) {
      res += dev;
      i += v.length;
      break;
    }
  }

  while (i < lower.length) {
    let matchedConsonant = false;
    for (const [pattern, dev] of PHONETIC_CONSONANTS) {
      if (lower.startsWith(pattern, i)) {
        res += dev;
        i += pattern.length;
        matchedConsonant = true;

        // Check following vowel
        let matchedVowel = false;
        for (const [vPattern, matra] of PHONETIC_VOWELS) {
          if (lower.startsWith(vPattern, i)) {
            // If vowel is 'a' at the very end of word, keep matra or omit for halant
            if (vPattern === 'a' && i + 1 === lower.length) {
              res += matra;
            } else if (vPattern !== 'a') {
              res += matra;
            }
            i += vPattern.length;
            matchedVowel = true;
            break;
          }
        }
        break;
      }
    }

    if (!matchedConsonant) {
      // Check single character
      const ch = lower[i];
      if (ch === 'a') {
        if (res.length > 0) res += 'ा';
        else res += 'अ';
      } else if (ch === 'i') {
        if (res.length > 0) res += 'ि';
        else res += 'इ';
      } else if (ch === 'u') {
        if (res.length > 0) res += 'ु';
        else res += 'उ';
      } else if (ch === 'e') {
        if (res.length > 0) res += 'े';
        else res += 'ए';
      } else if (ch === 'o') {
        if (res.length > 0) res += 'ो';
        else res += 'ओ';
      } else {
        res += ch;
      }
      i++;
    }
  }

  return res;
}

const DEVANAGARI_TO_ROMAN = {
  'अ': 'A', 'आ': 'Aa', 'इ': 'I', 'ई': 'Ee', 'उ': 'U', 'ऊ': 'Oo', 'ए': 'E', 'ऐ': 'Ai', 'ओ': 'O', 'औ': 'Au', 'अं': 'Am',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l', 'क्ष': 'ksh', 'ज्ञ': 'dny',
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', '्': ''
};

function transliterateMarathiWord(word) {
  if (MR_TO_EN_DICT.has(word)) {
    return MR_TO_EN_DICT.get(word);
  }

  let out = '';
  const len = word.length;

  for (let i = 0; i < len; i++) {
    const ch = word[i];
    const next = i + 1 < len ? word[i + 1] : '';

    if (DEVANAGARI_TO_ROMAN[ch] !== undefined) {
      let roman = DEVANAGARI_TO_ROMAN[ch];
      
      // If consonant without explicit virama and followed by another consonant or end of non-final word
      const isConsonant = /[\u0915-\u0939\u0958-\u095F\u0979-\u097F]/.test(ch);
      const nextIsMatra = /[\u093E-\u094C\u094D\u0902]/.test(next);

      if (isConsonant && !nextIsMatra) {
        // Schwa 'a' addition if not the very last character
        if (i < len - 1) {
          roman += 'a';
        }
      }
      out += roman;
    } else {
      out += ch;
    }
  }

  if (out.length > 0) {
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

export function convertEnglishToMarathi(text) {
  if (!text) return '';
  const words = text.split(/(\s+)/);
  return words.map(w => {
    if (/^\s+$/.test(w)) return w;
    return transliterateEnglishWord(w);
  }).join('');
}

export function convertMarathiToEnglish(text) {
  if (!text) return '';
  const words = text.split(/(\s+)/);
  return words.map(w => {
    if (/^\s+$/.test(w)) return w;
    return transliterateMarathiWord(w);
  }).join('');
}

/**
 * Fetch online transliteration from Google Input Tools API if available
 */
export async function fetchOnlineMarathiTransliteration(word) {
  if (!word || !word.trim()) return '';
  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word.trim())}&itc=mr-t-i0-und&num=1`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const json = await res.json();
    if (json && json[0] === 'SUCCESS' && json[1] && json[1][0] && json[1][0][1] && json[1][0][1][0]) {
      return json[1][0][1][0];
    }
  } catch {
    // Network or CORS fallback
  }
  return '';
}
