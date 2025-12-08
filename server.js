// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 10000; // ใช้ PORT จาก Render.com

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'backoffice-secret-key-123',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Routes
const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

// Route: หน้าล็อกอิน
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Route: ตรวจสอบการล็อกอิน
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '1234') {
    req.session.user = { id: 1, username: 'admin', role: 'admin' };
    return res.redirect('/');
  }
  res.send(`
    <script>
      alert('❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      window.location.href='/login';
    </script>
  `);
});

// Route: ออกจากระบบ
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Route: หน้าหลัก
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route: Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, '0.0.0.0', () => { // สำคัญมาก: 0.0.0.0
  console.log(`🚀 Backoffice พร้อมใช้งานที่ http://localhost:${port}`);
});