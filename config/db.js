// config/db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Phonethep25599@', // ← แก้ตามรหัสผ่านของคุณ
  database: 'backoffice_db'
});

db.connect(err => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อ MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
});

module.exports = db;