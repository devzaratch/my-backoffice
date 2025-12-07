// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ดึงข้อมูลผู้เล่น (ใช้ในหน้า index.html)
router.get('/api/users', (req, res) => {
  const { search = '', status = '' } = req.query;

  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (username LIKE ? OR phone LIKE ? OR full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// อัปเดตสถานะ + บันทึกประวัติ
router.post('/api/update-status', (req, res) => {
  const { id, status, changed_by = 'admin' } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'ต้องระบุ id และ status' });
  }

  // ดึงสถานะเดิม
  db.query('SELECT status FROM users WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

    const old_status = rows[0].status;

    // บันทึกประวัติ
    const logSql = `
      INSERT INTO status_logs (user_id, old_status, new_status, changed_by)
      VALUES (?, ?, ?, ?)
    `;
    db.query(logSql, [id, old_status, status, changed_by], (err) => {
      if (err) return res.status(500).json({ error: 'บันทึกประวัติล้มเหลว' });

      // อัปเดตสถานะ
      db.query('UPDATE users SET status = ? WHERE id = ?', [status, id], (err) => {
        if (err) return res.status(500).json({ error: 'อัปเดตสถานะล้มเหลว' });
        res.json({ success: true, message: 'อัปเดตสำเร็จ' });
      });
    });
  });
});

module.exports = router;
// API: ดึงข้อมูลสำหรับ Dashboard
router.get('/dashboard', (req, res) => {
  // 1. นับจำนวนผู้เล่นทั้งหมด
  const countAll = 'SELECT COUNT(*) AS total FROM users';
  
  // 2. นับตามสถานะ
  const countByStatus = `
    SELECT 
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
    FROM users
  `;
  
  // 3. ยอดเครดิตรวม
  const totalCredit = 'SELECT SUM(credit) AS total_credit FROM users';
  
  // 4. ข้อมูลรายวัน (7 วันย้อนหลัง)
  const dailyData = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM users 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  // รันคำสั่งทั้งหมดพร้อมกัน
  db.query(countAll, (err1, result1) => {
    if (err1) return res.status(500).json({ error: 'ดึงข้อมูลล้มเหลว' });
    
    db.query(countByStatus, (err2, result2) => {
      if (err2) return res.status(500).json({ error: 'ดึงข้อมูลล้มเหลว' });
      
      db.query(totalCredit, (err3, result3) => {
        if (err3) return res.status(500).json({ error: 'ดึงข้อมูลล้มเหลว' });
        
        db.query(dailyData, (err4, result4) => {
          if (err4) return res.status(500).json({ error: 'ดึงข้อมูลล้มเหลว' });

          // สร้างข้อมูลรายวันแบบเต็ม (7 วัน)
          const today = new Date();
          const dates = [];
          const counts = [];
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().slice(0,10);
            dates.push(dateStr);
            
            const found = result4.find(d => d.date === dateStr);
            counts.push(found ? found.count : 0);
          }

          res.json({
            summary: {
              total: result1[0].total,
              approved: result2[0].approved,
              pending: result2[0].pending,
              rejected: result2[0].rejected,
              total_credit: parseFloat(result3[0].total_credit || 0).toFixed(2)
            },
            statusChart: {
              labels: ['อนุมัติแล้ว', 'รออนุมัติ', 'ปฏิเสธ'],
              data: [
                result2[0].approved,
                result2[0].pending,
                result2[0].rejected
              ]
            },
            dailyChart: {
              labels: dates.map(d => {
                const date = new Date(d);
                return `${date.getDate()}/${date.getMonth()+1}`;
              }),
              data: counts
            }
          });
        });
      });
    });
  });
});

// เพิ่ม API: ส่งออกเป็น Excel
router.get('/export', async (req, res) => {
  const { search = '', status = '' } = req.query;

  // ดึงข้อมูลผู้เล่น
  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (username LIKE ? OR phone LIKE ? OR full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  db.query(sql, params, async (err, results) => {
    if (err) {
      console.error('❌ ดึงข้อมูลล้มเหลว:', err);
      return res.status(500).send('ดึงข้อมูลล้มเหลว');
    }

    try {
      // สร้างไฟล์ Excel
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('ผู้เล่น');

      // กำหนดหัวตาราง
      worksheet.columns = [
        { header: 'ลำดับ', key: 'no', width: 8 },
        { header: 'ผู้เล่น', key: 'username', width: 15 },
        { header: 'ชื่อ-สกุล', key: 'full_name', width: 25 },
        { header: 'เบอร์โทร', key: 'phone', width: 20 },
        { header: 'เครดิต (LAK_THB)', key: 'credit', width: 15 },
        { header: 'สถานะ', key: 'status', width: 15 },
        { header: 'วันที่สมัคร', key: 'created_at', width: 20 }
      ];

      // เพิ่มข้อมูล
      results.forEach((user, index) => {
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

      // จัดรูปแบบหัวตาราง
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E7D32' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // ตั้งชื่อไฟล์
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const safeFilename = `players_${dateStr}.xlsx`;
      const displayFilename = `ผู้เล่น_${dateStr}.xlsx`;

      // ตั้ง Header สำหรับดาวน์โหลด
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(displayFilename)}`
      );

      // เขียนไฟล์และส่งให้ผู้ใช้
      await workbook.xlsx.write(res);
      res.end(); // จบการตอบกลับ

    } catch (err) {
      console.error('❌ สร้าง Excel ล้มเหลว:', err);
      res.status(500).send('สร้างไฟล์ Excel ล้มเหลว');
    }
  });
});