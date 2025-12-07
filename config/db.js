// config/db.js - สำหรับ PostgreSQL
const { Pool } = require('pg');

// สร้างการเชื่อมต่อ
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // จำเป็นสำหรับ Render.com
  }
});

// ทดสอบการเชื่อมต่อ
db.connect(err => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อ PostgreSQL:', err.message);
    process.exit(1);
  }
  console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
});

module.exports = db;