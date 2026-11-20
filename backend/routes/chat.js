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

// POST /api/chat hoặc /api/chat/message (Khách vãng lai lẫn đã đăng nhập đều dùng được)
router.post('/', optionalAuth, chatController.sendMessage);
router.post('/message', optionalAuth, chatController.sendMessage);

// GET /api/chat/history (Yêu cầu đăng nhập để xem lịch sử cá nhân)
router.get('/history', authenticateToken, chatController.getChatHistory);

module.exports = router;

