/**
 * ============================================================
 *  BÁNH FG – ROUTES THANH TOÁN & ĐƠN HÀNG
 *  Phụ trách: Đàm Quang Trung (Module 3)
 *  File: routes/orders.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/auth');

// Tất cả các hành động liên quan đến đơn hàng đều cần đăng nhập
router.use(authenticateToken);

// GET /api/orders/addresses (Danh sách địa chỉ)
router.get('/addresses', orderController.getAddresses);

// POST /api/orders/addresses (Thêm địa chỉ nhận hàng)
router.post('/addresses', orderController.addAddress);

// POST /api/orders/validate-discount (Kiểm tra mã giảm giá)
router.post('/validate-discount', orderController.validateDiscount);

// POST /api/orders (Tạo đơn hàng & thanh toán)
router.post('/', orderController.createOrder);

// GET /api/orders (Xem lịch sử các đơn hàng của mình)
router.get('/', orderController.getMyOrders);

// GET /api/orders/:id (Chi tiết 1 đơn hàng)
router.get('/:id', orderController.getOrderDetails);

module.exports = router;

