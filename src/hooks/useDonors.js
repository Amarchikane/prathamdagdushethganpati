import { useState, useEffect, useCallback } from 'react';
import { SEED_DONORS } from '../data/seedDonors';

const STORAGE_KEY = 'mandal_donors_v2';
const RECENT_KEY = 'mandal_recent_pavthis';

// Helper to normalize any pavthi/donor record into a unified donor format
function normalizeDonor(entry) {
  if (!entry) return null;
  const nameMr = (entry.name_mr || entry.name_en || '').trim();
  const nameEn = (entry.name_en || entry.name_mr || '').trim();
  const rawId = entry.id || (entry.receipt_no ? `PAV-${entry.receipt_no}` : `DON-${Date.now()}`);
  const receiptNo = entry.receipt_no || '';
  const mobile = entry.mobile ? String(entry.mobile).trim() : '';

  // Generate phonetic / search aliases
  const aliases = Array.isArray(entry.phonetic_aliases)
    ? [...entry.phonetic_aliases]
    : typeof entry.phonetic_aliases === 'string'
    ? entry.phonetic_aliases.split(/,\s*/).filter(Boolean)
    : [];

  if (mobile && !aliases.includes(mobile)) aliases.push(mobile);
  if (receiptNo && !aliases.includes(receiptNo)) aliases.push(receiptNo);

  const rawYear = entry.year || (entry.date ? parseInt(entry.date.slice(-4), 10) : new Date().getFullYear());

  return {
    id: rawId,
    receipt_no: receiptNo,
    name_mr: nameMr,
    name_en: nameEn,
    phonetic_aliases: aliases,
    mobile: mobile,
    amount: Number(entry.amount) || 0,
    received_amount: entry.received_amount !== undefined ? Number(entry.received_amount) : Number(entry.amount) || 0,
    is_pending: Boolean(entry.is_pending),
    pending_amount: Number(entry.pending_amount) || 0,
    donation_type: entry.donation_type || 'वर्गणी (Contribution)',
    payment_mode: entry.payment_mode || 'रोख (Cash)',
    landmark_mr: entry.landmark_mr || 'शुक्रवार पेठ',
    landmark_en: entry.landmark_en || 'Shukrawar Peth',
    book_ref: entry.book_ref || (receiptNo ? `पावती क्र. ${receiptNo}` : 'नवीन पावती'),
    note_mr: entry.note_mr || '',
    date: entry.date || new Date().toLocaleDateString('mr-IN'),
    year: isNaN(rawYear) ? new Date().getFullYear() : rawYear,
    is_new_entry: Boolean(entry.receipt_no || entry.is_new_entry)
  };
}

// Merge unique donor records preserving custom/recent ones at the top
function mergeDonorsList(primaryList = [], secondaryList = []) {
  const map = new Map();
  // 1. Add primary/custom records first (these appear at the top)
  primaryList.forEach(item => {
    if (!item) return;
    const normalized = normalizeDonor(item);
    if (normalized && normalized.id) {
      map.set(normalized.id, normalized);
      if (normalized.receipt_no) {
        map.set(normalized.receipt_no, normalized);
      }
    }
  });

  // 2. Add secondary/seed records
  secondaryList.forEach(item => {
    if (!item) return;
    const normalized = normalizeDonor(item);
    if (normalized && normalized.id && !map.has(normalized.id)) {
      map.set(normalized.id, normalized);
      if (normalized.receipt_no) {
        map.set(normalized.receipt_no, normalized);
      }
    }
  });

  // Deduplicate items
  const uniqueItems = new Set();
  const result = [];
  for (const item of map.values()) {
    if (!uniqueItems.has(item.id)) {
      uniqueItems.add(item.id);
      result.push(item);
    }
  }

  return result;
}

export function useDonors() {
  const [donors, setDonors] = useState(() => {
    try {
      localStorage.removeItem('mandal_donors_v1');

      let initialCustom = [];
      const savedRecent = localStorage.getItem(RECENT_KEY);
      if (savedRecent) {
        try {
          const parsedRecent = JSON.parse(savedRecent);
          if (Array.isArray(parsedRecent)) initialCustom = parsedRecent;
        } catch (_) {}
      }

      const savedDonors = localStorage.getItem(STORAGE_KEY);
      if (savedDonors) {
        try {
          const parsed = JSON.parse(savedDonors);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return mergeDonorsList([...initialCustom, ...parsed], SEED_DONORS);
          }
        } catch (_) {}
      }

      return mergeDonorsList(initialCustom, SEED_DONORS);
    } catch (e) {
      console.error('Error reading donors from localStorage', e);
      return SEED_DONORS.map(normalizeDonor);
    }
  });

  // Fetch online entries from database on mount & periodically to keep search 100% updated across all users
  useEffect(() => {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;

    const fetchLatestPavthis = () => {
      if (!navigator.onLine) return;
      fetch('/api/pavthi')
        .then(res => res.json())
        .then(data => {
          if (data && data.success && Array.isArray(data.entries)) {
            let localOnly = [];
            try {
              const savedRecent = localStorage.getItem(RECENT_KEY);
              if (savedRecent) {
                const parsed = JSON.parse(savedRecent);
                if (Array.isArray(parsed)) {
                  localOnly = parsed.filter(item => item && item.is_local_only);
                }
              }
            } catch (_) {}

            const activeList = [...localOnly, ...data.entries];
            setDonors(mergeDonorsList(activeList, SEED_DONORS));
          }
        })
        .catch(() => {});
    };

    fetchLatestPavthis();

    const interval = setInterval(fetchLatestPavthis, 15000);
    window.addEventListener('online', fetchLatestPavthis);
    window.addEventListener('focus', fetchLatestPavthis);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', fetchLatestPavthis);
      window.removeEventListener('focus', fetchLatestPavthis);
    };
  }, []);

  // Sync to localStorage whenever donors list updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
    } catch (e) {
      console.error('Error saving donors to localStorage', e);
    }
  }, [donors]);

  // Method to immediately add a newly created pavthi entry to the searchable donor register
  const addDonor = useCallback((newEntry) => {
    if (!newEntry) return;
    const normalized = normalizeDonor(newEntry);
    if (!normalized) return;

    setDonors(prev => {
      const updated = [normalized, ...prev.filter(d => d.id !== normalized.id && d.receipt_no !== normalized.receipt_no)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  // Method to immediately remove a deleted pavthi from the searchable register
  const removeDonor = useCallback((idOrReceiptNo) => {
    if (!idOrReceiptNo) return;
    const target = String(idOrReceiptNo).toLowerCase();
    setDonors(prev => {
      const updated = prev.filter(d => 
        (d.id || '').toLowerCase() !== target && 
        (d.receipt_no || '').toLowerCase() !== target
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  // Global listener for receipt deletion events
  useEffect(() => {
    const handleDeleteEvent = (e) => {
      const { id, receipt_no, all, username } = e.detail || {};
      if (all) {
        setDonors(SEED_DONORS.map(normalizeDonor));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DONORS.map(normalizeDonor)));
        } catch (_) {}
        return;
      }
      if (username) {
        const u = username.toLowerCase();
        setDonors(prev => {
          const updated = prev.filter(d => (d.created_by_username || '').toLowerCase() !== u);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });
        return;
      }
      if (id || receipt_no) {
        if (id) removeDonor(id);
        if (receipt_no) removeDonor(receipt_no);
      }
    };

    window.addEventListener('mandal_receipt_deleted', handleDeleteEvent);
    return () => window.removeEventListener('mandal_receipt_deleted', handleDeleteEvent);
  }, [removeDonor]);

  const resetToSeed = useCallback(() => {
    const seed = SEED_DONORS.map(normalizeDonor);
    setDonors(seed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch (_) {}
  }, []);

  return {
    donors,
    addDonor,
    removeDonor,
    resetToSeed
  };
}
