// server.js — แบบเต็ม ใช้งานได้ทันที
const express = require('express');

// 1. สร้างแอป
const app = express();

// 2. Middleware พื้นฐาน
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Route ทดสอบ — ไม่ต้องเชื่อมต่อฐานข้อมูล
app.get('/', (req, res) => {
  res.send(`
    <h1>✅ ระบบออนไลน์</h1>
    <p>เซิร์ฟเวอร์รันอยู่บน Render.com</p>
    <p>เวลาปัจจุบัน: ${new Date().toISOString()}</p>
    <a href="/health">ทดสอบ health check</a>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'เซิร์ฟเวอร์รันปกติ'
  });
});

// 4. รับพอร์ตจาก Render.com
const port = process.env.PORT || 10000;

// 5. เริ่มเซิร์ฟเวอร์
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ เซิร์ฟเวอร์เริ่มแล้วที่ port ${port}`);
  console.log(`👉 เปิดได้ที่: http://localhost:${port}`);
});