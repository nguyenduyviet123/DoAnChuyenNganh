/**
 * ============================================================
 *  BÁNH FG – EXPRESS BACKEND SERVER
 *  File: server.js
 *  Nhóm 4 - Lớp IT6133 - Đại học Công nghiệp Hà Nội
 * ============================================================
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { getPool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET phải được cấu hình và có ít nhất 32 ký tự trong backend/.env');
}
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5000,http://localhost:5000')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

// 1. Middlewares
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Nguồn gọi API không được phép bởi CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files cho ảnh sản phẩm /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Phục vụ trực tiếp giao diện Frontend từ thư mục gốc
app.use(express.static(path.join(__dirname, '..')));

// 2. Health check & Root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      appName: 'Fresh Garden Bakery API',
      version: '1.0.0',
      routes: [
        '/api/health',
        '/api/auth/register',
        '/api/auth/login',
        '/api/auth/me',
        '/api/products',
        '/api/products/categories',
        '/api/products/:id',
        '/api/cart',
        '/api/orders',
        '/api/chat',
      ],
    },
    message: 'Chào mừng đến với Fresh Garden Backend API',
  });
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'Chưa kết nối';
  try {
    const pool = await getPool();
    if (pool.connected) {
      dbStatus = 'Kết nối SQL Server thành công (FreshGardenDB)';
    }
  } catch (err) {
    dbStatus = 'Lỗi kết nối SQL Server: ' + err.message;
  }

  res.json({
    success: true,
    data: {
      appName: 'Fresh Garden Bakery API',
      status: 'Online',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
    message: 'Backend API đang hoạt động bình thường',
  });
});

// 3. Mount Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// 4. Xử lý 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`,
  });
});

// 5. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    data: null,
    message: err.message || 'Lỗi máy chủ nội bộ',
  });
});

// 6. Khởi động Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Fresh Garden Backend API đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔍 Endpoint kiểm tra trạng thái: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
  
  // Thử kết nối DB khi khởi động
  try {
    await getPool();
  } catch (e) {
    console.warn(`⚠️ Lưu ý: Chưa kết nối được SQL Server ngay lúc này. Server vẫn lắng nghe request.`);
  }
});
