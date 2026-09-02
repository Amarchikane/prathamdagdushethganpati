import { useState, useEffect } from 'react';
import { SEED_DONORS } from '../data/seedDonors';

const STORAGE_KEY = 'mandal_donors_v2';

export function useDonors() {
  const [donors, setDonors] = useState(() => {
    try {
      // Clear legacy cache if any
      localStorage.removeItem('mandal_donors_v1');
      
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure we load the full dataset of 450 records
        if (Array.isArray(parsed) && parsed.length >= SEED_DONORS.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading donors from localStorage", e);
    }
    return SEED_DONORS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
    } catch (e) {
      console.error("Error saving donors to localStorage", e);
    }
  }, [donors]);

  const resetToSeed = () => {
    setDonors(SEED_DONORS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DONORS));
  };

  return {
    donors,
    resetToSeed
  };
}
