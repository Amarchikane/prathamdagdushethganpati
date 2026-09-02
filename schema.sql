-- D1 Database Schema for Akara Maruti Chowk Mandal Pavthi Records
-- Execute using: npx wrangler d1 execute mandal_db --file=./schema.sql

CREATE TABLE IF NOT EXISTS pavthi_entries (
  id TEXT PRIMARY KEY,
  receipt_no TEXT UNIQUE NOT NULL,
  access_token TEXT UNIQUE,
  date TEXT NOT NULL,
  name_mr TEXT NOT NULL,
  name_en TEXT,
  mobile TEXT,
  amount INTEGER NOT NULL,
  amount_words_mr TEXT,
  is_pending INTEGER DEFAULT 0,
  pending_amount INTEGER DEFAULT 0,
  received_amount INTEGER DEFAULT 0,
  donation_type TEXT DEFAULT 'वर्गणी (Contribution)',
  payment_mode TEXT DEFAULT 'रोख (Cash)',
  landmark_mr TEXT NOT NULL,
  landmark_en TEXT,
  book_ref TEXT,
  note_mr TEXT,
  created_by TEXT DEFAULT 'कार्यकर्ता (Karyakarta)',
  created_by_username TEXT DEFAULT 'karyakarta',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pavthi_receipt_no ON pavthi_entries(receipt_no);
CREATE INDEX IF NOT EXISTS idx_pavthi_created_at ON pavthi_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pavthi_creator ON pavthi_entries(created_by_username);
CREATE INDEX IF NOT EXISTS idx_pavthi_date ON pavthi_entries(date);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'karyakarta', -- 'superadmin', 'admin', 'karyakarta'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default mandal accounts
INSERT OR IGNORE INTO users (id, username, pin, name, role) 
VALUES 
  ('usr_super', 'superadmin', '9999', 'मुख्य प्रशासक (Super Admin)', 'superadmin'),
  ('usr_01', 'admin', '1124', 'मंडळ प्रशासक (Admin)', 'admin'),
  ('usr_02', 'karyakarta', '1124', 'मंडळ कार्यकर्ता (Karyakarta)', 'karyakarta');

-- Mandal Configuration Settings (e.g. Super Admin WhatsApp number)
CREATE TABLE IF NOT EXISTS mandal_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO mandal_settings (key, value) 
VALUES 
  ('superadmin_whatsapp', '919822001122'),
  ('daily_handover_lockout_enabled', 'false');

-- Daily Handover / Daily Closing Records
CREATE TABLE IF NOT EXISTS daily_handovers (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  username TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  total_receipts INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  cash_amount INTEGER NOT NULL,
  upi_amount INTEGER NOT NULL,
  pending_amount INTEGER NOT NULL,
  first_receipt_no TEXT,
  last_receipt_no TEXT,
  superadmin_phone TEXT NOT NULL,
  status TEXT DEFAULT 'submitted', -- 'submitted', 'verified'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, username)
);

CREATE INDEX IF NOT EXISTS idx_handovers_date ON daily_handovers(date);
CREATE INDEX IF NOT EXISTS idx_handovers_user ON daily_handovers(username);
