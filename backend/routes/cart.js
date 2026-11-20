/**
 * ============================================================
 *  BÁNH FG – ROUTES QUẢN LÝ GIỎ HÀNG
 *  Phụ trách: Nguyễn Thái Đạt (Module 2)
 *  File: routes/cart.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middlewares/auth');

// Mọi thao tác giỏ hàng trên DB đều yêu cầu đăng nhập
router.use(authenticateToken);

// GET /api/cart
router.get('/', cartController.getCart);

// POST /api/cart/items (Thêm sản phẩm)
router.post('/items', cartController.addItem);

// PUT /api/cart/items/:spId (Cập nhật số lượng)
router.put('/items/:spId', cartController.updateItem);

// DELETE /api/cart/items/:spId (Xóa 1 sản phẩm)
router.delete('/items/:spId', cartController.removeItem);

// POST /api/cart/merge (Gộp giỏ hàng khách vãng lai khi đăng nhập)
router.post('/merge', cartController.mergeCart);

module.exports = router;

