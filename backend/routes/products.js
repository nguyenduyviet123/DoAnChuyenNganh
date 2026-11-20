/**
 * ============================================================
 *  BÁNH FG – ROUTES SẢN PHẨM & DANH MỤC
 *  Phụ trách: Nguyễn Văn Anh (Module 1)
 *  File: routes/products.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products (Lấy danh sách + tìm kiếm + phân loại)
router.get('/', productController.getAllProducts);

// GET /api/products/categories (Cây danh mục bánh)
router.get('/categories', productController.getCategories);

// GET /api/products/stores (Hệ thống cửa hàng)
router.get('/stores', productController.getStores);

// GET /api/products/news (Tin tức bài viết)
router.get('/news', productController.getNews);

// GET /api/products/promotions (Mã giảm giá còn hiệu lực)
router.get('/promotions', productController.getPromotions);

// GET /api/products/:id (Chi tiết 1 sản phẩm)
router.get('/:id', productController.getProductById);

module.exports = router;

