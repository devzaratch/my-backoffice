// config/db.js — สำหรับ PostgreSQL บน Render.com
const { Pool } = require('pg');

// 1. สร้างการเชื่อมต่อ
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // จำเป็นสำหรับ Render.com
  }
});

// 2. ทดสอบการเชื่อมต่อ
db.connect(err => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อ PostgreSQL:', err.message);
    console.error('💡 ตรวจสอบว่า:');
    console.error('   - DATABASE_URL ถูกตั้งค่าใน Environment Variables');
    console.error('   - Database ถูกสร้างและมีตาราง users');
    process.exit(1); // หยุดเซิร์ฟเวอร์ทันทีหากเชื่อมต่อไม่ได้
  }
  console.log('✅ เชื่อมต่อฐานข้อมูล PostgreSQL สำเร็จ');
});

// 3. ส่งออกออบเจ็กต์ db
module.exports = db;