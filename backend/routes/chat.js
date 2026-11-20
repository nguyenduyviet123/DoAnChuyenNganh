/**
 * ============================================================
 *  BÁNH FG – ROUTES TƯ VẤN BẰNG CHATBOT AI
 *  Phụ trách: Nguyễn Duy Việt (Module 4)
 *  File: routes/chat.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalAuth, authenticateToken } = require('../middlewares/auth');

// Giới hạn tần suất gọi API Chat (Tối đa 20 request/phút trên mỗi IP để bảo vệ Gemini API)
const ipRequestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

function chatRateLimiter(req, res, next) {
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const clientData = ipRequestCounts.get(clientIp);

  if (!clientData || now - clientData.startTime > RATE_LIMIT_WINDOW_MS) {
    ipRequestCounts.set(clientIp, { count: 1, startTime: now });
    return next();
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      data: null,
      message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi 1 phút trước khi tiếp tục.',
    });
  }

  clientData.count++;
  return next();
}

// POST /api/chat hoặc /api/chat/message (Khách vãng lai lẫn đã đăng nhập đều dùng được)
router.post('/', chatRateLimiter, optionalAuth, chatController.sendMessage);
router.post('/message', chatRateLimiter, optionalAuth, chatController.sendMessage);

// GET /api/chat/history (Yêu cầu đăng nhập để xem lịch sử cá nhân)
router.get('/history', authenticateToken, chatController.getChatHistory);

module.exports = router;

