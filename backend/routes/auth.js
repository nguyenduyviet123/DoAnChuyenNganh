/**
 * ============================================================
 *  BÁNH FG – ROUTES XÁC THỰC (MODULE 0 - NGUYỄN DUY VIỆT)
 *  File: routes/auth.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me (Yêu cầu JWT token)
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

