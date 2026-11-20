
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/database');

// ĐĂNG KÝ TÀI KHOẢN MỚI
exports.register = async (req, res) => {
  try {
    const { username, password, email, fullName, phone, gender, birthDate } = req.body;

    if (!username || !password || !email || !fullName) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (username, password, email, họ tên)',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    const pool = await getPool();

    // 1. Kiểm tra tài khoản hoặc email đã tồn tại chưa
    const checkExisted = await pool
      .request()
      .input('user', sql.NVarChar(100), username.trim())
      .input('gmail', sql.NVarChar(254), email.trim().toLowerCase())
      .query(`
        SELECT [User], Gmail FROM dbo.TAI_KHOAN 
        WHERE [User] = @user OR Gmail = @gmail
      `);

    if (checkExisted.recordset.length > 0) {
      const match = checkExisted.recordset[0];
      const field = match.User.toLowerCase() === username.trim().toLowerCase() ? 'Tên đăng nhập' : 'Email';
      return res.status(409).json({
        success: false,
        data: null,
        message: `${field} này đã được sử dụng. Vui lòng chọn thông tin khác!`,
      });
    }

    // 2. Bắt đầu Transaction để tạo KHACH_HANG + TAI_KHOAN + GIO_HANG
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Lấy ID tiếp theo cho KHACH_HANG
      const reqMaxKh = new sql.Request(transaction);
      const resMaxKh = await reqMaxKh.query(`SELECT ISNULL(MAX(MaKhachHang), 0) + 1 AS nextId FROM dbo.KHACH_HANG`);
      const nextKhachHangId = resMaxKh.recordset[0].nextId;

      // Insert KHACH_HANG
      const reqKh = new sql.Request(transaction);
      reqKh.input('maKh', sql.Int, nextKhachHangId);
      reqKh.input('tenKh', sql.NVarChar(150), fullName.trim());
      reqKh.input('gioiTinh', sql.NVarChar(20), gender || null);
      reqKh.input('ngaySinh', sql.Date, birthDate || null);
      reqKh.input('soDt', sql.VarChar(20), phone ? phone.trim() : null);
      reqKh.input('lichSu', sql.NVarChar(300), 'Tài khoản mới tạo');

      await reqKh.query(`
        INSERT INTO dbo.KHACH_HANG (MaKhachHang, TenKhachHang, GioiTinh, NgaySinh, SoDT, LichSuGD)
        VALUES (@maKh, @tenKh, @gioiTinh, @ngaySinh, @soDt, @lichSu)
      `);

      // Hash mật khẩu an toàn với bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert TAI_KHOAN
      const reqTk = new sql.Request(transaction);
      reqTk.input('user', sql.NVarChar(100), username.trim());
      reqTk.input('maKh', sql.Int, nextKhachHangId);
      reqTk.input('password', sql.NVarChar(255), hashedPassword);
      reqTk.input('gmail', sql.NVarChar(254), email.trim().toLowerCase());
      reqTk.input('trangThai', sql.NVarChar(50), 'Hoạt động');

      await reqTk.query(`
        INSERT INTO dbo.TAI_KHOAN ([User], MaKhachHang, [Password], Gmail, TrangThai)
        VALUES (@user, @maKh, @password, @gmail, @trangThai)
      `);

      // Tự động tạo 1 giỏ hàng mặc định cho khách hàng
      const reqMaxGh = new sql.Request(transaction);
      const resMaxGh = await reqMaxGh.query(`SELECT ISNULL(MAX(MaGioHang), 0) + 1 AS nextId FROM dbo.GIO_HANG`);
      const nextGioHangId = resMaxGh.recordset[0].nextId;

      const reqGh = new sql.Request(transaction);
      reqGh.input('maGh', sql.Int, nextGioHangId);
      reqGh.input('maKh', sql.Int, nextKhachHangId);
      reqGh.input('trangThai', sql.NVarChar(50), 'Đang hoạt động');

      await reqGh.query(`
        INSERT INTO dbo.GIO_HANG (MaGioHang, NgayTao, TrangThai, MaKhachHang)
        VALUES (@maGh, SYSDATETIME(), @trangThai, @maKh)
      `);

      // Hoàn tất Transaction
      await transaction.commit();

      // 3. Tạo JWT Token
      const tokenPayload = {
        maKhachHang: nextKhachHangId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: tokenPayload,
          maGioHang: nextGioHangId,
        },
        message: 'Đăng ký tài khoản Fresh Garden thành công!',
      });
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    console.error('[authController.register] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi máy chủ khi đăng ký tài khoản: ' + err.message,
    });
  }
};

// ĐĂNG NHẬP TÀI KHOẢN
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Vui lòng nhập tên đăng nhập (hoặc email) và mật khẩu',
      });
    }

    const pool = await getPool();

    // Tìm kiếm qua [User] hoặc Gmail
    const result = await pool
      .request()
      .input('account', sql.NVarChar(254), username.trim())
      .query(`
        SELECT 
          tk.[User], 
          tk.MaKhachHang, 
          tk.[Password], 
          tk.Gmail, 
          tk.TrangThai AS TrangThaiTaiKhoan,
          tk.VaiTro,
          kh.TenKhachHang,
          kh.SoDT,
          gh.MaGioHang
        FROM dbo.TAI_KHOAN tk
        INNER JOIN dbo.KHACH_HANG kh ON tk.MaKhachHang = kh.MaKhachHang
        LEFT JOIN dbo.GIO_HANG gh ON kh.MaKhachHang = gh.MaKhachHang
        WHERE tk.[User] = @account OR tk.Gmail = @account
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Tài khoản hoặc mật khẩu không chính xác',
      });
    }

    const user = result.recordset[0];

    if (user.TrangThaiTaiKhoan !== 'Hoạt động') {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt',
      });
    }

    // So khớp mật khẩu:
    // Hỗ trợ cả bcrypt hash lẫn demo placeholder
    let isMatch = false;
    if (user.Password.startsWith('$2a$') || user.Password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.Password);
    } else {
      // Hỗ trợ đúng mật khẩu legacy đã lưu; không có mật khẩu chủ/demo dùng chung.
      isMatch = user.Password === password;
      if (isMatch) {
        const upgradedHash = await bcrypt.hash(password, 10);
        await pool.request().input('account', sql.NVarChar(100), user.User).input('password', sql.NVarChar(255), upgradedHash)
          .query('UPDATE dbo.TAI_KHOAN SET [Password]=@password WHERE [User]=@account');
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Tài khoản hoặc mật khẩu không chính xác',
      });
    }

    const tokenPayload = {
      maKhachHang: user.MaKhachHang,
      username: user.User,
      email: user.Gmail,
      fullName: user.TenKhachHang,
      vaiTro: user.VaiTro || 'KhachHang',
    };

    const token = jwt.sign(
      tokenPayload,
        process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          maKhachHang: user.MaKhachHang,
          username: user.User,
          email: user.Gmail,
          fullName: user.TenKhachHang,
          phone: user.SoDT,
          maGioHang: user.MaGioHang,
          vaiTro: user.VaiTro || 'KhachHang',
        },
      },
      message: `Chào mừng ${user.TenKhachHang} quay trở lại!`,
    });
  } catch (err) {
    console.error('[authController.login] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi máy chủ khi đăng nhập: ' + err.message,
    });
  }
};

// LẤY THÔNG TIN TÀI KHOẢN HIỆN TẠI (GET /api/auth/me)
exports.getMe = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const pool = await getPool();

    const result = await pool
      .request()
      .input('maKh', sql.Int, maKhachHang)
      .query(`
        SELECT 
          tk.[User], 
          tk.Gmail, 
          tk.VaiTro,
          kh.MaKhachHang,
          kh.TenKhachHang,
          kh.GioiTinh,
          kh.NgaySinh,
          kh.SoDT,
          kh.LichSuGD,
          gh.MaGioHang
        FROM dbo.KHACH_HANG kh
        INNER JOIN dbo.TAI_KHOAN tk ON kh.MaKhachHang = tk.MaKhachHang
        LEFT JOIN dbo.GIO_HANG gh ON kh.MaKhachHang = gh.MaKhachHang
        WHERE kh.MaKhachHang = @maKh
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    const profile = result.recordset[0];
    return res.json({
      success: true,
      data: profile,
      message: 'Lấy thông tin tài khoản thành công',
    });
  } catch (err) {
    console.error('[authController.getMe] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy thông tin người dùng: ' + err.message,
    });
  }
};
