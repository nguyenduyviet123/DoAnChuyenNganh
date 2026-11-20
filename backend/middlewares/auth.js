/**
 * ============================================================
 *  BÁNH FG – MIDDLEWARE XÁC THỰC JWT
 *  File: middlewares/auth.js
 * ============================================================
 */
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/database');

async function accountIsActive(user) {
  const pool = await getPool();
  const result = await pool.request().input('maKh', sql.Int, user.maKhachHang).query('SELECT TOP 1 TrangThai FROM dbo.TAI_KHOAN WHERE MaKhachHang=@maKh');
  return result.recordset[0]?.TrangThai === 'Hoạt động';
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Định dạng: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Vui lòng đăng nhập để tiếp tục (Thiếu Access Token)',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      });
    }
    try {
      if (!(await accountIsActive(user))) return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa hoặc không còn hoạt động.' });
      req.user = user;
      return next();
    } catch (dbError) {
      console.error('[auth.authenticateToken] Không thể xác minh trạng thái tài khoản:', dbError.message);
      return res.status(503).json({ success: false, message: 'Không thể xác minh tài khoản lúc này. Vui lòng thử lại.' });
    }
  });
}

async function requireAdmin(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().input('maKh', sql.Int, req.user.maKhachHang).query(`
      SELECT TOP 1 VaiTro, TrangThai FROM dbo.TAI_KHOAN WHERE MaKhachHang = @maKh
    `);
    const account = result.recordset[0];
    if (!account || account.TrangThai !== 'Hoạt động' || account.VaiTro !== 'QuanTri') {
      return res.status(403).json({ success: false, message: 'Tài khoản không có quyền quản trị.' });
    }
    next();
  } catch (error) {
    console.error('[auth.requireAdmin]', error);
    res.status(500).json({ success: false, message: 'Không thể xác minh quyền quản trị.' });
  }
}

// Middleware tùy chọn (Guest hoặc User đã đăng nhập)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) { req.user = null; return next(); }
    try { req.user = await accountIsActive(user) ? user : null; }
    catch {
      req.user = null;
      req.authVerificationFailed = true;
    }
    return next();
  });
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
};

