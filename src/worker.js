/**
 * Cloudflare Worker for Akara Maruti Chowk Mandal
 * Serves static assets & handles D1 database APIs for Pavthi records, karyakarta & superadmin management
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate'
    }
  });
}

async function ensureDbTables(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pavthi_entries (
        id TEXT PRIMARY KEY,
        receipt_no TEXT UNIQUE NOT NULL,
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
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        pin TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'karyakarta',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO users (id, username, pin, name, role) VALUES 
        ('usr_super', 'superadmin', '9999', 'मुख्य प्रशासक (Super Admin)', 'superadmin'),
        ('usr_01', 'admin', '1124', 'मंडळ प्रशासक (Admin)', 'admin'),
        ('usr_02', 'karyakarta', '1124', 'मंडळ कार्यकर्ता (Karyakarta)', 'karyakarta')
    `).run();
  } catch (e) {
    console.error('ensureDbTables initialization error:', e);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Automatically ensure D1 database tables exist on any API call
    if (url.pathname.startsWith('/api/') && env && env.DB) {
      await ensureDbTables(env.DB);
    }

    // Handle preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // --- API ROUTES ---
    if (url.pathname.startsWith('/api/')) {
      
      // 1. Login Endpoint (Supports Karyakarta, Admin & Super Admin)
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { username, pin } = body;

          if (!username || !pin) {
            return jsonResponse({ error: 'वापरकर्ता नाव आणि पिन आवश्यक आहे' }, 400);
          }

          // Normalize Marathi numerals in pin: e.g. ९९९९ -> 9999, ११२४ -> 1124
          const mrDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
          const cleanPin = String(pin || '').trim().replace(/[०-९]/g, d => {
            const idx = mrDigits.indexOf(d);
            return idx !== -1 ? String(idx) : d;
          });

          // Normalize username
          const rawUser = String(username || '').trim();
          let normalizedUser = rawUser.toLowerCase().replace(/[\s_-]+/g, '');
          if (normalizedUser.includes('super') || rawUser.includes('सुपर')) {
            normalizedUser = 'superadmin';
          } else if (normalizedUser.includes('admin') || rawUser.includes('प्रशासक') || rawUser.includes('ॲडमिन') || rawUser.includes('अ‍ॅडमिन')) {
            normalizedUser = 'admin';
          } else if (normalizedUser.includes('karyakarta') || rawUser.includes('कार्यकर्ता')) {
            normalizedUser = 'karyakarta';
          }

          let user = null;
          if (env && env.DB) {
            try {
              const res = await env.DB.prepare(
                'SELECT id, username, name, role FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(username) = LOWER(?)) AND (pin = ? OR pin = ?)'
              ).bind(rawUser, normalizedUser, cleanPin, String(pin).trim()).first();
              user = res;
            } catch (dbErr) {
              console.error('D1 user lookup error:', dbErr);
            }
          }

          // Fallback accounts if D1 table is not yet seeded or user query didn't match
          if (!user) {
            if (normalizedUser === 'superadmin' && (cleanPin === '9999' || cleanPin === '1124')) {
              user = {
                id: 'usr_super',
                username: 'superadmin',
                name: 'मुख्य प्रशासक (Super Admin)',
                role: 'superadmin'
              };
            } else if (normalizedUser === 'admin' && (cleanPin === '1124' || cleanPin === '9999')) {
              user = {
                id: 'usr_01',
                username: 'admin',
                name: 'मंडळ प्रशासक (Admin)',
                role: 'admin'
              };
            } else if (normalizedUser === 'karyakarta' && (cleanPin === '1124' || cleanPin === '9999')) {
              user = {
                id: 'usr_02',
                username: 'karyakarta',
                name: 'मंडळ कार्यकर्ता (Karyakarta)',
                role: 'karyakarta'
              };
            }
          }

          if (!user) {
            return jsonResponse({ error: 'अवैध नाव किंवा पिन (Super Admin: superadmin / 9999, Admin: admin / 1124)' }, 401);
          }

          const token = `mandal_${user.id}_${Date.now()}`;
          return jsonResponse({
            success: true,
            token,
            user: {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role
            }
          });
        } catch (e) {
          return jsonResponse({ error: 'लॉगिन प्रक्रिया अयशस्वी: ' + e.message }, 500);
        }
      }

      // 2. Pavthi List Endpoint
      if (url.pathname === '/api/pavthi' && request.method === 'GET') {
        try {
          if (!env || !env.DB) {
            return jsonResponse({ 
              success: false, 
              entries: [], 
              error: 'Cloudflare D1 डेटाबेस जोडलेला नाही (D1 DB binding missing in wrangler.jsonc or Cloudflare Dashboard)' 
            }, 503);
          }

          await ensureDbTables(env.DB);

          const { results } = await env.DB.prepare(
            'SELECT * FROM pavthi_entries ORDER BY created_at DESC LIMIT 200'
          ).all();

          return jsonResponse({ success: true, entries: results || [] });
        } catch (e) {
          return jsonResponse({ error: 'नोंदी आणता आल्या नाहीत: ' + e.message }, 500);
        }
      }

      // 3. New Pavthi Entry Endpoint (Saves into Cloudflare D1)
      if (url.pathname === '/api/pavthi' && request.method === 'POST') {
        try {
          if (!env || !env.DB) {
            return jsonResponse({
              success: false,
              error: 'Cloudflare D1 डेटाबेस जोडलेला नाही (D1 DB binding missing in wrangler.jsonc or Cloudflare Dashboard). कृपया D1 जोडणी तपासा.'
            }, 503);
          }

          await ensureDbTables(env.DB);

          const body = await request.json();
          const {
            name_mr,
            name_en,
            mobile,
            amount,
            amount_words_mr,
            is_pending,
            pending_amount,
            donation_type,
            payment_mode,
            landmark_mr,
            landmark_en,
            book_ref,
            note_mr,
            created_by,
            created_by_username
          } = body;

          if (!name_mr || !amount || !landmark_mr) {
            return jsonResponse({ error: 'नाव, रक्कम आणि परिसर आवश्यक आहेत' }, 400);
          }

          const totalAmt = Number(amount);
          const isPending = Boolean(is_pending);
          const pendingAmt = isPending ? Math.max(0, Number(pending_amount) || 0) : 0;
          const receivedAmt = isPending ? Math.max(0, totalAmt - pendingAmt) : totalAmt;

          const currentYear = new Date().getFullYear();
          const id = 'PAV-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

          let receiptNumber = '';
          try {
            const countRes = await env.DB.prepare(
              'SELECT COUNT(*) as total FROM pavthi_entries'
            ).first();
            const nextSeq = ((countRes?.total || 0) + 1).toString().padStart(4, '0');
            receiptNumber = `AM-${currentYear}-${nextSeq}`;
          } catch (err) {
            receiptNumber = `AM-${currentYear}-${Date.now().toString().slice(-4)}`;
          }

          const entryDate = new Date().toLocaleDateString('mr-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const newEntry = {
            id,
            receipt_no: receiptNumber,
            date: entryDate,
            name_mr: name_mr.trim(),
            name_en: (name_en || name_mr).trim(),
            mobile: (mobile || '').trim(),
            amount: totalAmt,
            amount_words_mr: amount_words_mr || '',
            is_pending: isPending ? 1 : 0,
            pending_amount: pendingAmt,
            received_amount: receivedAmt,
            donation_type: donation_type || 'वर्गणी (Contribution)',
            payment_mode: payment_mode || 'रोख (Cash)',
            landmark_mr: landmark_mr.trim(),
            landmark_en: landmark_en || '',
            book_ref: book_ref || '',
            note_mr: note_mr || '',
            created_by: created_by || 'कार्यकर्ता',
            created_by_username: (created_by_username || 'karyakarta').toLowerCase(),
            created_at: new Date().toISOString()
          };

          await env.DB.prepare(`
            INSERT INTO pavthi_entries (
              id, receipt_no, date, name_mr, name_en, mobile, amount, 
              amount_words_mr, is_pending, pending_amount, received_amount,
              donation_type, payment_mode, landmark_mr, 
              landmark_en, book_ref, note_mr, created_by, created_by_username, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            newEntry.id,
            newEntry.receipt_no,
            newEntry.date,
            newEntry.name_mr,
            newEntry.name_en,
            newEntry.mobile,
            newEntry.amount,
            newEntry.amount_words_mr,
            newEntry.is_pending,
            newEntry.pending_amount,
            newEntry.received_amount,
            newEntry.donation_type,
            newEntry.payment_mode,
            newEntry.landmark_mr,
            newEntry.landmark_en,
            newEntry.book_ref,
            newEntry.note_mr,
            newEntry.created_by,
            newEntry.created_by_username,
            newEntry.created_at
          ).run();

          return jsonResponse({
            success: true,
            message: 'पावती यशस्वीरीत्या जतन झाली (Saved to D1 Database)',
            entry: newEntry
          });
        } catch (e) {
          console.error('Save pavthi error:', e);
          return jsonResponse({ error: 'डेटाबेसमध्ये नोंद जतन करता आली नाही: ' + e.message }, 500);
        }
      }

      // ==========================================================================
      // SUPER ADMIN API ENDPOINTS
      // ==========================================================================

      // 4. Super Admin Stats (Overview, By Admin, Daily Collection)
      if (url.pathname === '/api/superadmin/stats' && request.method === 'GET') {
        try {
          const defaultAdmins = [
            { id: 'usr_super', username: 'superadmin', name: 'मुख्य प्रशासक (Super Admin)', role: 'superadmin', created_at: new Date().toISOString() },
            { id: 'usr_01', username: 'admin', name: 'मंडळ प्रशासक (Admin)', role: 'admin', created_at: new Date().toISOString() },
            { id: 'usr_02', username: 'karyakarta', name: 'मंडळ कार्यकर्ता (Karyakarta)', role: 'karyakarta', created_at: new Date().toISOString() }
          ];

          if (!env || !env.DB) {
            const fallbackByAdmin = defaultAdmins.map(u => ({
              username: u.username,
              name: u.name,
              role: u.role,
              receipt_count: 0,
              total_amount: 0,
              received_amount: 0,
              pending_amount: 0
            }));

            return jsonResponse({
              success: true,
              stats: {
                total_receipts: 0,
                total_amount: 0,
                total_received: 0,
                total_pending: 0
              },
              by_admin: fallbackByAdmin,
              daily_collections: [],
              users: defaultAdmins
            });
          }

          // Fetch all registered users
          let usersList = [];
          try {
            const { results } = await env.DB.prepare(
              'SELECT id, username, name, role, created_at FROM users ORDER BY created_at ASC'
            ).all();
            usersList = results || [];
          } catch (uErr) {
            console.error('Users fetch error:', uErr);
          }

          if (usersList.length === 0) {
            usersList = defaultAdmins;
          }

          // Initialize byAdmin map for every user so all admins are always visible
          const adminMap = new Map();
          usersList.forEach(u => {
            adminMap.set(u.username.toLowerCase(), {
              username: u.username,
              name: u.name,
              role: u.role || 'karyakarta',
              receipt_count: 0,
              total_amount: 0,
              received_amount: 0,
              pending_amount: 0
            });
          });

          // Overall totals
          let totals = { total_receipts: 0, total_amount: 0, total_received: 0, total_pending: 0 };
          try {
            const res = await env.DB.prepare(`
              SELECT 
                COUNT(*) as total_receipts,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(SUM(received_amount), 0) as total_received,
                COALESCE(SUM(pending_amount), 0) as total_pending
              FROM pavthi_entries
            `).first();
            if (res) totals = res;
          } catch (tErr) {
            console.error('Totals error:', tErr);
          }

          // Aggregate per-admin from pavthi_entries
          try {
            const { results: agg } = await env.DB.prepare(`
              SELECT 
                LOWER(COALESCE(created_by_username, 'karyakarta')) as username,
                COALESCE(created_by, 'कार्यकर्ता') as name,
                COUNT(*) as receipt_count,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(SUM(received_amount), 0) as received_amount,
                COALESCE(SUM(pending_amount), 0) as pending_amount
              FROM pavthi_entries
              GROUP BY LOWER(COALESCE(created_by_username, 'karyakarta'))
            `).all();

            if (agg) {
              agg.forEach(a => {
                const u = a.username.toLowerCase();
                const existing = adminMap.get(u) || {
                  username: u,
                  name: a.name || u,
                  role: 'karyakarta',
                  receipt_count: 0,
                  total_amount: 0,
                  received_amount: 0,
                  pending_amount: 0
                };
                existing.receipt_count = a.receipt_count || 0;
                existing.total_amount = a.total_amount || 0;
                existing.received_amount = a.received_amount || 0;
                existing.pending_amount = a.pending_amount || 0;
                adminMap.set(u, existing);
              });
            }
          } catch (aErr) {
            console.error('Admin agg error:', aErr);
          }

          // Daily collection totals
          let daily = [];
          try {
            const { results: dailyRes } = await env.DB.prepare(`
              SELECT 
                date,
                COUNT(*) as receipt_count,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(SUM(received_amount), 0) as received_amount,
                COALESCE(SUM(pending_amount), 0) as pending_amount
              FROM pavthi_entries
              GROUP BY date
              ORDER BY created_at DESC
              LIMIT 30
            `).all();
            daily = dailyRes || [];
          } catch (dErr) {
            console.error('Daily agg error:', dErr);
          }

          return jsonResponse({
            success: true,
            stats: totals || {},
            by_admin: Array.from(adminMap.values()),
            daily_collections: daily || [],
            users: usersList || []
          });
        } catch (e) {
          console.error('Superadmin stats error:', e);
          return jsonResponse({ error: 'आकडेवारी आणता आली नाही: ' + e.message }, 500);
        }
      }

      // 5. Super Admin All Receipts (With optional admin filter)
      if (url.pathname === '/api/superadmin/all-receipts' && request.method === 'GET') {
        try {
          if (!env || !env.DB) {
            return jsonResponse({ success: true, entries: [] });
          }

          const adminFilter = url.searchParams.get('admin');
          let query = 'SELECT * FROM pavthi_entries';
          const params = [];

          if (adminFilter) {
            query += ' WHERE LOWER(created_by_username) = LOWER(?)';
            params.push(adminFilter);
          }

          query += ' ORDER BY created_at DESC LIMIT 300';

          const stmt = env.DB.prepare(query);
          const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

          return jsonResponse({ success: true, entries: results || [] });
        } catch (e) {
          return jsonResponse({ error: 'सर्व पावत्या आणता आल्या नाहीत: ' + e.message }, 500);
        }
      }

      // 6. Super Admin Add User
      if (url.pathname === '/api/superadmin/users' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { username, pin, name, role } = body;

          if (!username || !pin || !name) {
            return jsonResponse({ error: 'वापरकर्ता नाव, पिन आणि नाव आवश्यक आहे' }, 400);
          }

          const cleanUser = username.trim().toLowerCase();
          const id = 'usr_' + Date.now().toString(36);

          if (env && env.DB) {
            // Check existing
            const existing = await env.DB.prepare('SELECT id FROM users WHERE LOWER(username) = ?').bind(cleanUser).first();
            if (existing) {
              return jsonResponse({ error: 'हे वापरकर्ता नाव आधीच अस्तित्वात आहे' }, 400);
            }

            await env.DB.prepare(
              'INSERT INTO users (id, username, pin, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(id, cleanUser, pin.trim(), name.trim(), role || 'karyakarta', new Date().toISOString()).run();
          }

          return jsonResponse({
            success: true,
            message: 'नवीन प्रशासक/कार्यकर्ता यशस्वीरित्या जोडला गेला',
            user: { id, username: cleanUser, name: name.trim(), role: role || 'karyakarta' }
          });
        } catch (e) {
          return jsonResponse({ error: 'वापरकर्ता जोडता आला नाही: ' + e.message }, 500);
        }
      }

      // 7. Super Admin Delete User
      if (url.pathname === '/api/superadmin/users' && request.method === 'DELETE') {
        try {
          const body = await request.json();
          const { username } = body;

          if (!username) {
            return jsonResponse({ error: 'वापरकर्ता नाव आवश्यक आहे' }, 400);
          }

          const cleanUser = username.trim().toLowerCase();
          if (cleanUser === 'superadmin') {
            return jsonResponse({ error: 'मुख्य सुपर ॲडमिनला हटवता येणार नाही' }, 403);
          }

          if (env && env.DB) {
            await env.DB.prepare('DELETE FROM users WHERE LOWER(username) = ?').bind(cleanUser).run();
          }

          return jsonResponse({ success: true, message: `वापरकर्ता (${username}) हटवला गेला.` });
        } catch (e) {
          return jsonResponse({ error: 'वापरकर्ता हटवता आला नाही: ' + e.message }, 500);
        }
      }

      // 8. Super Admin Delete Pavthi (Single Receipt, Bulk by Admin, or Delete All)
      if (url.pathname === '/api/superadmin/pavthi' && request.method === 'DELETE') {
        try {
          const body = await request.json();
          const { id, receipt_no, admin_username, delete_all } = body;

          if (!id && !receipt_no && !admin_username && !delete_all) {
            return jsonResponse({ error: 'पावती ID, पावती क्र. किंवा प्रशासक नाव आवश्यक आहे' }, 400);
          }

          if (env && env.DB) {
            if (delete_all) {
              await env.DB.prepare('DELETE FROM pavthi_entries').run();
            } else if (id || receipt_no) {
              const target = id || receipt_no;
              await env.DB.prepare('DELETE FROM pavthi_entries WHERE id = ? OR receipt_no = ?').bind(target, target).run();
            } else if (admin_username) {
              await env.DB.prepare('DELETE FROM pavthi_entries WHERE LOWER(created_by_username) = LOWER(?)')
                .bind(admin_username.trim())
                .run();
            }
          }

          return jsonResponse({
            success: true,
            message: delete_all ? 'सर्व पावत्या यशस्वीरीत्या हटवल्या गेल्या.' : (id || receipt_no ? 'पावती यशस्वीरीत्या हटवली गेली.' : `${admin_username} या कार्यकर्त्याचा सर्व पावती डेटा हटवला गेला.`)
          });
        } catch (e) {
          return jsonResponse({ error: 'पावती हटवता आली नाही: ' + e.message }, 500);
        }
      }

      // 9. Super Admin Edit / Update Pavthi
      if (url.pathname === '/api/superadmin/pavthi' && (request.method === 'PUT' || request.method === 'PATCH')) {
        try {
          const body = await request.json();
          const { id, name_mr, name_en, mobile, amount, is_pending, pending_amount, landmark_mr, payment_mode, note_mr } = body;

          if (!id || !name_mr || !amount) {
            return jsonResponse({ error: 'पावती ID, दात्याचे नाव आणि रक्कम आवश्यक आहेत' }, 400);
          }

          const totalAmt = Number(amount);
          const isPending = Boolean(is_pending);
          const pendingAmt = isPending ? Math.max(0, Number(pending_amount) || 0) : 0;
          const receivedAmt = isPending ? Math.max(0, totalAmt - pendingAmt) : totalAmt;

          if (env && env.DB) {
            await env.DB.prepare(`
              UPDATE pavthi_entries SET
                name_mr = ?,
                name_en = ?,
                mobile = ?,
                amount = ?,
                is_pending = ?,
                pending_amount = ?,
                received_amount = ?,
                landmark_mr = ?,
                payment_mode = ?,
                note_mr = ?
              WHERE id = ?
            `).bind(
              name_mr.trim(),
              (name_en || name_mr).trim(),
              (mobile || '').trim(),
              totalAmt,
              isPending ? 1 : 0,
              pendingAmt,
              receivedAmt,
              (landmark_mr || 'शुक्रवार पेठ').trim(),
              payment_mode || 'रोख (Cash)',
              note_mr || '',
              id
            ).run();
          }

          return jsonResponse({
            success: true,
            message: 'पावती तपशील यशस्वीरीत्या अद्ययावत (Updated) केले गेले.'
          });
        } catch (e) {
          return jsonResponse({ error: 'पावती अपडेट करता आली नाही: ' + e.message }, 500);
        }
      }

      return jsonResponse({ error: 'Route not found' }, 404);
    }

    // --- STATIC ASSETS (Cloudflare Workers Assets) ---
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Mandal Portal Live', { status: 200 });
  }
};
