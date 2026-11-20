const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken, requireAdmin);
router.get('/summary', admin.getSummary);
router.get('/errors', admin.listErrors);
router.get('/products', admin.listProducts);
router.post('/products', admin.saveProduct);
router.put('/products/:id', admin.saveProduct);
router.delete('/products/:id', admin.deleteProduct);
router.get('/orders', admin.listOrders);
router.patch('/orders/:id/status', admin.updateOrderStatus);
router.patch('/orders/:id/payment', admin.updatePaymentStatus);
router.get('/customers', admin.listCustomers);
router.patch('/customers/:id/status', admin.updateCustomerStatus);
router.get('/coupons', admin.listCoupons);
router.post('/coupons', admin.saveCoupon);
router.put('/coupons/:id', admin.saveCoupon);
router.delete('/coupons/:id', admin.deleteCoupon);

module.exports = router;
