-- ✅ setup-db.sql
-- สร้างฐานข้อมูล (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS backoffice_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ใช้ฐานข้อมูล
USE backoffice_db;

-- สร้างตารางผู้เล่น
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    credit DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- เพิ่มข้อมูลตัวอย่าง (เหมือนภาพที่คุณให้มา)
INSERT INTO users (username, full_name, phone, credit, status) VALUES
('ufsb7320554', 'TOLA KEOALAIHAK MR', '024120001734575001', 0.46, 'APPROVED'),
('ufsb9126858', 'MANYSID PHONESALY MRS', '073120000955178001', 507.04, 'APPROVED'),
('ufsb9198399', 'CHANTHO XAYYATEM MS', '0301400410043669', 0.10, 'APPROVED'),
('ufsb8822111', 'SOMPHONG KEOBANDITH', '02012345678', 150.00, 'PENDING'),
('ufsb7766555', 'NAMPHET SISOMPHONE', '03098765432', 0.00, 'PENDING')
ON DUPLICATE KEY UPDATE id = id; -- ป้องกัน error ถ้ารันซ้ำ