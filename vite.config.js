import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In-memory dev mock for D1 APIs and Super Admin features during local Vite development
const devMandalApiPlugin = () => ({
  name: 'dev-mandal-api',
  configureServer(server) {
    let mockPavthiDb = [
      {
        id: 'PAV-101',
        receipt_no: 'AM-2024-0101',
        date: '०२/०९/२०२६',
        name_mr: 'अमर शांताराम चिकणे',
        name_en: 'Amar Shantaram Chikane',
        mobile: '9822001122',
        amount: 1001,
        amount_words_mr: 'एक हजार एक रुपये मात्र',
        is_pending: 0,
        pending_amount: 0,
        received_amount: 1001,
        donation_type: 'वर्गणी (Contribution)',
        payment_mode: 'रोख (Cash)',
        landmark_mr: 'शुक्रवार पेठ',
        landmark_en: 'Shukrawar Peth',
        book_ref: 'Book 1 / P.01',
        note_mr: '',
        created_by: 'मंडळ प्रशासक (Admin)',
        created_by_username: 'admin',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'PAV-102',
        receipt_no: 'AM-2024-0102',
        date: '०२/०९/२०२६',
        name_mr: 'सुरेश बापू कदम',
        name_en: 'Suresh Bapu Kadam',
        mobile: '9822334455',
        amount: 1500,
        amount_words_mr: 'एक हजार रुपये मात्र',
        is_pending: 1,
        pending_amount: 500,
        received_amount: 1000,
        donation_type: 'वर्गणी (Contribution)',
        payment_mode: 'UPI / QR (Online)',
        landmark_mr: 'अकरा मारुती चौक',
        landmark_en: 'Akara Maruti Chowk',
        book_ref: 'Book 1 / P.02',
        note_mr: 'बाकी ५०० रुपये उत्सवादरम्यान जमा',
        created_by: 'मंडळ कार्यकर्ता (Karyakarta)',
        created_by_username: 'karyakarta',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    let mockUsers = [
      { id: 'usr_super', username: 'superadmin', pin: '9999', name: 'मुख्य प्रशासक (Super Admin)', role: 'superadmin', created_at: new Date().toISOString() },
      { id: 'usr_01', username: 'admin', pin: '1124', name: 'मंडळ प्रशासक (Admin)', role: 'admin', created_at: new Date().toISOString() },
      { id: 'usr_02', username: 'karyakarta', pin: '1124', name: 'मंडळ कार्यकर्ता (Karyakarta)', role: 'karyakarta', created_at: new Date().toISOString() }
    ];

    server.middlewares.use((req, res, next) => {
      if (!req.url.startsWith('/api/')) return next();

      const parseJsonBody = () => new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });

      const sendJson = (data, status = 200) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      const urlObj = new URL(req.url, 'http://localhost:3000');
      const pathname = urlObj.pathname;

      // 1. Login
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        parseJsonBody().then(body => {
          const { username, pin } = body;
          const u = (username || '').trim().toLowerCase();
          const p = (pin || '').trim();

          const found = mockUsers.find(user => user.username.toLowerCase() === u && user.pin === p);
          if (found) {
            sendJson({
              success: true,
              token: `dev_token_${Date.now()}`,
              user: {
                id: found.id,
                username: found.username,
                name: found.name,
                role: found.role
              }
            });
          } else {
            sendJson({ error: 'अवैध नाव किंवा पिन (Super Admin: superadmin / 9999, Admin: admin / 1124)' }, 401);
          }
        });
        return;
      }

      // 2. Pavthi List
      if (pathname === '/api/pavthi' && req.method === 'GET') {
        sendJson({ success: true, entries: mockPavthiDb });
        return;
      }

      // 3. New Pavthi
      if (pathname === '/api/pavthi' && req.method === 'POST') {
        parseJsonBody().then(body => {
          const currentYear = new Date().getFullYear();
          const seq = (mockPavthiDb.length + 1).toString().padStart(4, '0');
          const totalAmt = Number(body.amount) || 0;
          const isPending = Boolean(body.is_pending);
          const pendingAmt = isPending ? Math.max(0, Number(body.pending_amount) || 0) : 0;
          const receivedAmt = isPending ? Math.max(0, totalAmt - pendingAmt) : totalAmt;

          const entry = {
            id: 'PAV-' + Date.now(),
            receipt_no: `AM-${currentYear}-${seq}`,
            date: new Date().toLocaleDateString('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            name_mr: body.name_mr || '',
            name_en: body.name_en || body.name_mr || '',
            mobile: body.mobile || '',
            amount: totalAmt,
            amount_words_mr: body.amount_words_mr || '',
            is_pending: isPending ? 1 : 0,
            pending_amount: pendingAmt,
            received_amount: receivedAmt,
            donation_type: body.donation_type || 'वर्गणी (Contribution)',
            payment_mode: body.payment_mode || 'रोख (Cash)',
            landmark_mr: body.landmark_mr || 'शुक्रवार पेठ',
            landmark_en: body.landmark_en || 'Shukrawar Peth',
            book_ref: body.book_ref || '',
            note_mr: body.note_mr || '',
            created_by: body.created_by || 'मंडळ कार्यकर्ता',
            created_by_username: (body.created_by_username || 'karyakarta').toLowerCase(),
            created_at: new Date().toISOString()
          };
          mockPavthiDb.unshift(entry);
          sendJson({ success: true, message: 'D1 डेटाबेस नोंद यशस्वी', entry });
        });
        return;
      }

      // 4. Super Admin Stats
      if (pathname === '/api/superadmin/stats' && req.method === 'GET') {
        const total_receipts = mockPavthiDb.length;
        const total_amount = mockPavthiDb.reduce((s, r) => s + (r.amount || 0), 0);
        const total_received = mockPavthiDb.reduce((s, r) => s + (r.received_amount !== undefined ? r.received_amount : r.amount), 0);
        const total_pending = mockPavthiDb.reduce((s, r) => s + (r.pending_amount || 0), 0);

        // Group by Admin
        const byAdminMap = new Map();
        mockPavthiDb.forEach(r => {
          const u = (r.created_by_username || 'karyakarta').toLowerCase();
          const cur = byAdminMap.get(u) || {
            username: u,
            name: r.created_by || u,
            receipt_count: 0,
            total_amount: 0,
            received_amount: 0,
            pending_amount: 0
          };
          cur.receipt_count += 1;
          cur.total_amount += (r.amount || 0);
          cur.received_amount += (r.received_amount !== undefined ? r.received_amount : r.amount);
          cur.pending_amount += (r.pending_amount || 0);
          byAdminMap.set(u, cur);
        });

        // Group by Day
        const dailyMap = new Map();
        mockPavthiDb.forEach(r => {
          const d = r.date || 'आज';
          const cur = dailyMap.get(d) || {
            date: d,
            receipt_count: 0,
            total_amount: 0,
            received_amount: 0,
            pending_amount: 0
          };
          cur.receipt_count += 1;
          cur.total_amount += (r.amount || 0);
          cur.received_amount += (r.received_amount !== undefined ? r.received_amount : r.amount);
          cur.pending_amount += (r.pending_amount || 0);
          dailyMap.set(d, cur);
        });

        sendJson({
          success: true,
          stats: { total_receipts, total_amount, total_received, total_pending },
          by_admin: Array.from(byAdminMap.values()),
          daily_collections: Array.from(dailyMap.values()),
          users: mockUsers.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role, created_at: u.created_at }))
        });
        return;
      }

      // 5. Super Admin All Receipts
      if (pathname === '/api/superadmin/all-receipts' && req.method === 'GET') {
        const adminFilter = urlObj.searchParams.get('admin');
        let filtered = mockPavthiDb;
        if (adminFilter) {
          filtered = filtered.filter(r => (r.created_by_username || '').toLowerCase() === adminFilter.toLowerCase());
        }
        sendJson({ success: true, entries: filtered });
        return;
      }

      // 6. Super Admin Add User
      if (pathname === '/api/superadmin/users' && req.method === 'POST') {
        parseJsonBody().then(body => {
          const { username, pin, name, role } = body;
          const cleanUser = (username || '').trim().toLowerCase();
          if (!cleanUser || !pin || !name) {
            return sendJson({ error: 'नाव, युझरनेम आणि पिन आवश्यक आहे' }, 400);
          }
          if (mockUsers.some(u => u.username.toLowerCase() === cleanUser)) {
            return sendJson({ error: 'हे वापरकर्ता नाव आधीच अस्तित्वात आहे' }, 400);
          }
          const newUser = {
            id: 'usr_' + Date.now(),
            username: cleanUser,
            pin: pin.trim(),
            name: name.trim(),
            role: role || 'karyakarta',
            created_at: new Date().toISOString()
          };
          mockUsers.push(newUser);
          sendJson({ success: true, message: 'नवीन प्रशासक यशस्वीरीत्या जोडला गेला', user: newUser });
        });
        return;
      }

      // 7. Super Admin Delete User
      if (pathname === '/api/superadmin/users' && req.method === 'DELETE') {
        parseJsonBody().then(body => {
          const { username } = body;
          const cleanUser = (username || '').trim().toLowerCase();
          if (cleanUser === 'superadmin') {
            return sendJson({ error: 'मुख्य सुपर ॲडमिनला हटवता येणार नाही' }, 403);
          }
          mockUsers = mockUsers.filter(u => u.username.toLowerCase() !== cleanUser);
          sendJson({ success: true, message: `प्रशासक (${username}) यशस्वीरीत्या हटवला गेला.` });
        });
        return;
      }

      // 8. Super Admin Delete Pavthi (Single or by Admin)
      if (pathname === '/api/superadmin/pavthi' && req.method === 'DELETE') {
        parseJsonBody().then(body => {
          const { id, admin_username } = body;
          if (id) {
            mockPavthiDb = mockPavthiDb.filter(r => r.id !== id);
            sendJson({ success: true, message: 'पावती यशस्वीरीत्या हटवली गेली.' });
          } else if (admin_username) {
            const beforeCount = mockPavthiDb.length;
            mockPavthiDb = mockPavthiDb.filter(r => (r.created_by_username || '').toLowerCase() !== admin_username.toLowerCase());
            const deletedCount = beforeCount - mockPavthiDb.length;
            sendJson({ success: true, message: `${admin_username} या कार्यकर्त्याचा सर्व पावती डेटा (${deletedCount} पावत्या) हटवला गेला.` });
          } else {
            sendJson({ error: 'पावती ID किंवा प्रशासक नाव आवश्यक आहे' }, 400);
          }
        });
        return;
      }

      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devMandalApiPlugin(),
  ],
  server: {
    port: 3000,
    host: true
  }
})
