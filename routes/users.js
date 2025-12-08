// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// API: ดึงข้อมูลผู้เล่น
router.get('/api/users', (req, res) => {
  const { search = '', status = '' } = req.query;

  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (username ILIKE $1 OR phone ILIKE $2 OR full_name ILIKE $3)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    sql += ' AND status = $' + (params.length + 1);
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('❌ ดึงข้อมูลล้มเหลว:', err);
      return res.status(500).json({ error: 'ดึงข้อมูลล้มเหลว' });
    }

    // ส่งแค่ rows กลับไป
    res.json(result.rows || []);
  });
});

// API: อัปเดตสถานะ
router.post('/api/update-status', (req, res) => {
  const { id, status, changed_by = 'admin' } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'ต้องระบุ id และ status' });
  }

  // ดึงสถานะเดิม
  db.query('SELECT status FROM users WHERE id = $1', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

    const old_status = result.rows[0].status;

    // บันทึกประวัติ
    const logSql = `
      INSERT INTO status_logs (user_id, old_status, new_status, changed_by)
      VALUES ($1, $2, $3, $4)
    `;
    db.query(logSql, [id, old_status, status, changed_by], (err) => {
      if (err) return res.status(500).json({ error: 'บันทึกประวัติล้มเหลว' });

      // อัปเดตสถานะ
      db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id], (err) => {
        if (err) return res.status(500).json({ error: 'อัปเดตสถานะล้มเหลว' });
        res.json({ success: true });
      });
    });
  });
});

// API: ส่งออก Excel
router.get('/export', async (req, res) => {
  const { search = '', status = '' } = req.query;

  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (username ILIKE $1 OR phone ILIKE $2 OR full_name ILIKE $3)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    sql += ' AND status = $' + (params.length + 1);
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  db.query(sql, params, async (err, result) => {
    if (err) {
      console.error('❌ ดึงข้อมูลล้มเหลว:', err);
      return res.status(500).send('ดึงข้อมูลล้มเหลว');
    }

    const users = result.rows || [];

    try {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('ผู้เล่น');

      worksheet.columns = [
        { header: 'ลำดับ', key: 'no', width: 8 },
        { header: 'ผู้เล่น', key: 'username', width: 15 },
        { header: 'ชื่อ-สกุล', key: 'full_name', width: 25 },
        { header: 'เบอร์โทร', key: 'phone', width: 20 },
        { header: 'เครดิต (LAK_THB)', key: 'credit', width: 15 },
        { header: 'สถานะ', key: 'status', width: 15 },
        { header: 'วันที่สมัคร', key: 'created_at', width: 20 }
      ];

      users.forEach((user, index) => {
        worksheet.addRow({
          no: index + 1,
          username: user.username,
          full_name: user.full_name || '-',
          phone: user.phone || '-',
          credit: parseFloat(user.credit).toFixed(2),
          status: user.status === 'APPROVED' ? 'อนุมัติแล้ว' : 
                  user.status === 'PENDING' ? 'รออนุมัติ' : 'ปฏิเสธ',
          created_at: new Date(user.created_at).toLocaleString('th-TH')
        });
      });

      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E7D32' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const safeFilename = `players_${dateStr}.xlsx`;
      const displayFilename = `ผู้เล่น_${dateStr}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(displayFilename)}`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('❌ สร้าง Excel ล้มเหลว:', err);
      res.status(500).send('สร้างไฟล์ Excel ล้มเหลว');
    }
  });
});

// API: Dashboard
router.get('/dashboard', (req, res) => {
  const queries = [
    'SELECT COUNT(*) AS total FROM users',
    `SELECT 
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
    FROM users`,
    'SELECT SUM(credit) AS total_credit FROM users',
    `SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM users 
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC`
  ];

  Promise.all(queries.map(q => new Promise((resolve, reject) => {
    db.query(q, (err, result) => {
      if (err) reject(err);
      else resolve(result.rows);
    });
  }))).then(([total, statusCount, credit, daily]) => {
    const today = new Date();
    const dates = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().slice(0,10);
      dates.push(dateStr);
      
      const found = daily.find(d => d.date === dateStr);
      counts.push(found ? parseInt(found.count) : 0);
    }

    res.json({
      summary: {
        total: parseInt(total[0].total),
        approved: parseInt(statusCount[0].approved),
        pending: parseInt(statusCount[0].pending),
        rejected: parseInt(statusCount[0].rejected),
        total_credit: parseFloat(credit[0].total_credit || 0).toFixed(2)
      },
      statusChart: {
        labels: ['อนุมัติแล้ว', 'รออนุมัติ', 'ปฏิเสธ'],
        datasets: [{
            data:[
                parseInt(statusCount[0].approved),
                parseInt(statusCount[0].pending),
                parseInt(statusCount[0].rejected)
            ]
        }]
      },
      dailyChart: {
        labels: dates.map(d => {
          const date = new Date(d);
          return `${date.getDate()}/${date.getMonth()+1}`;
        }),
         counts
      }
    });
  }).catch(err => {
    console.error('❌ ดึงข้อมูล Dashboard ล้มเหลว:', err);
    res.status(500).json({ error: 'ดึงข้อมูล Dashboard ล้มเหลว' });
  });
});

module.exports = router;