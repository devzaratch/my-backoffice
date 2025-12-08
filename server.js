const port = process.env.PORT || 10000;

// เพิ่ม: ทดสอบว่าเซิร์ฟเวอร์รันจริงไหม
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// route หลัก — ให้ตอบกลับทันที ไม่เชื่อมต่อ DB ก่อน
app.get('/', (req, res) => {
  res.send('<h1>✅ ระบบออนไลน์</h1><p>ตอนนี้รันอยู่บน port ' + port + '</p>');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ เซิร์ฟเวอร์เริ่มแล้วที่ port ${port}`);
});