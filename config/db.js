// config/db.js
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect(err => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อ PostgreSQL:', err.message);
    process.exit(1);
  }
  console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
});

module.exports = db;