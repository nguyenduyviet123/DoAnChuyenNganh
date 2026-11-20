/**
 * ============================================================
 *  BÁNH FG – CONTROLLER QUẢN LÝ GIỎ HÀNG
 *  Phụ trách: Nguyễn Thái Đạt (Module 2)
 *  File: controllers/cartController.js
 * ============================================================
 */
const { sql, getPool } = require('../config/database');

// Helper: Tìm hoặc tạo giỏ hàng cho khách hàng đã đăng nhập (Upsert)
async function getOrCreateCart(pool, maKhachHang) {
  let cartRes = await pool
    .request()
    .input('maKh', sql.Int, maKhachHang)
    .query(`SELECT MaGioHang, TrangThai FROM dbo.GIO_HANG WHERE MaKhachHang = @maKh`);

  if (cartRes.recordset.length > 0) {
    return cartRes.recordset[0].MaGioHang;
  }

  // Nếu chưa có giỏ, tạo mới
  const nextIdRes = await pool.query(`SELECT ISNULL(MAX(MaGioHang), 0) + 1 AS nextId FROM dbo.GIO_HANG`);
  const nextGioHangId = nextIdRes.recordset[0].nextId;

  await pool
    .request()
    .input('maGh', sql.Int, nextGioHangId)
    .input('maKh', sql.Int, maKhachHang)
    .input('trangThai', sql.NVarChar(50), 'Đang hoạt động')
    .query(`
      INSERT INTO dbo.GIO_HANG (MaGioHang, NgayTao, TrangThai, MaKhachHang)
      VALUES (@maGh, SYSDATETIME(), @trangThai, @maKh)
    `);

  return nextGioHangId;
}

// 1. XEM DANH SÁCH GIỎ HÀNG (GET /api/cart)
exports.getCart = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const pool = await getPool();

    const maGioHang = await getOrCreateCart(pool, maKhachHang);

    const itemsRes = await pool
      .request()
      .input('maGh', sql.Int, maGioHang)
      .query(`
        SELECT 
          spgh.MaSP,
          spgh.SoLuong,
          spgh.DonGia,
          (spgh.SoLuong * spgh.DonGia) AS ThanhTien,
          sp.TenSP,
          sp.DonViTinh,
          sp.KichThuoc,
          anh.DuongDan AS HinhAnh
        FROM dbo.SP_GH spgh
        INNER JOIN dbo.SAN_PHAM sp ON spgh.MaSP = sp.MaSP
        LEFT JOIN (
          SELECT MaSP, MIN(DuongDan) AS DuongDan 
          FROM dbo.ANH 
          WHERE MaSP IS NOT NULL 
          GROUP BY MaSP
        ) anh ON sp.MaSP = anh.MaSP
        WHERE spgh.MaGioHang = @maGh
      `);

    const items = itemsRes.recordset;
    const tongTien = items.reduce((sum, it) => sum + Number(it.ThanhTien || 0), 0);
    const tongSoLuong = items.reduce((sum, it) => sum + Number(it.SoLuong || 0), 0);

    return res.json({
      success: true,
      data: {
        maGioHang,
        items,
        tongSoLuong,
        tongTien,
      },
      message: 'Lấy giỏ hàng thành công',
    });
  } catch (err) {
    console.error('[cartController.getCart] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi máy chủ khi lấy giỏ hàng: ' + err.message,
    });
  }
};

// 2. THÊM SẢN PHẨM VÀO GIỎ HÀNG (POST /api/cart/items)
exports.addItem = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const { maSP, soLuong = 1 } = req.body;

    if (!maSP) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Thiếu mã sản phẩm (maSP)',
      });
    }

    const qty = Math.max(1, parseInt(soLuong, 10));
    const pool = await getPool();

    // Lấy thông tin giá sản phẩm hiện tại
    const spRes = await pool
      .request()
      .input('spId', sql.Int, parseInt(maSP, 10))
      .query(`SELECT MaSP, TenSP, DonGia FROM dbo.SAN_PHAM WHERE MaSP = @spId`);

    if (spRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Không tìm thấy sản phẩm trong hệ thống',
      });
    }

    const product = spRes.recordset[0];
    const maGioHang = await getOrCreateCart(pool, maKhachHang);

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existRes = await pool
      .request()
      .input('maGh', sql.Int, maGioHang)
      .input('spId', sql.Int, product.MaSP)
      .query(`SELECT SoLuong FROM dbo.SP_GH WHERE MaGioHang = @maGh AND MaSP = @spId`);

    if (existRes.recordset.length > 0) {
      // Cập nhật tăng số lượng
      const newQty = existRes.recordset[0].SoLuong + qty;
      await pool
        .request()
        .input('maGh', sql.Int, maGioHang)
        .input('spId', sql.Int, product.MaSP)
        .input('qty', sql.Int, newQty)
        .query(`UPDATE dbo.SP_GH SET SoLuong = @qty WHERE MaGioHang = @maGh AND MaSP = @spId`);
    } else {
      // Thêm mới vào SP_GH
      await pool
        .request()
        .input('maGh', sql.Int, maGioHang)
        .input('spId', sql.Int, product.MaSP)
        .input('qty', sql.Int, qty)
        .input('price', sql.Decimal(18, 2), product.DonGia)
        .query(`
          INSERT INTO dbo.SP_GH (MaSP, MaGioHang, SoLuong, DonGia)
          VALUES (@spId, @maGh, @qty, @price)
        `);
    }

    return res.json({
      success: true,
      data: {
        maSP: product.MaSP,
        tenSP: product.TenSP,
      },
      message: `Đã thêm "${product.TenSP}" vào giỏ hàng`,
    });
  } catch (err) {
    console.error('[cartController.addItem] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi thêm vào giỏ hàng: ' + err.message,
    });
  }
};

// 3. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM (PUT /api/cart/items/:spId)
exports.updateItem = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const spId = parseInt(req.params.spId, 10);
    const { soLuong } = req.body;

    const pool = await getPool();
    const maGioHang = await getOrCreateCart(pool, maKhachHang);

    const qty = parseInt(soLuong, 10);

    if (qty <= 0) {
      // Nếu số lượng <= 0 thì tự động xóa khỏi giỏ
      await pool
        .request()
        .input('maGh', sql.Int, maGioHang)
        .input('spId', sql.Int, spId)
        .query(`DELETE FROM dbo.SP_GH WHERE MaGioHang = @maGh AND MaSP = @spId`);

      return res.json({
        success: true,
        data: null,
        message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      });
    }

    await pool
      .request()
      .input('maGh', sql.Int, maGioHang)
      .input('spId', sql.Int, spId)
      .input('qty', sql.Int, qty)
      .query(`UPDATE dbo.SP_GH SET SoLuong = @qty WHERE MaGioHang = @maGh AND MaSP = @spId`);

    return res.json({
      success: true,
      data: { maSP: spId, soLuong: qty },
      message: 'Cập nhật số lượng sản phẩm thành công',
    });
  } catch (err) {
    console.error('[cartController.updateItem] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi cập nhật giỏ hàng: ' + err.message,
    });
  }
};

// 4. XÓA 1 SẢN PHẨM KHỎI GIỎ (DELETE /api/cart/items/:spId)
exports.removeItem = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const spId = parseInt(req.params.spId, 10);

    const pool = await getPool();
    const maGioHang = await getOrCreateCart(pool, maKhachHang);

    await pool
      .request()
      .input('maGh', sql.Int, maGioHang)
      .input('spId', sql.Int, spId)
      .query(`DELETE FROM dbo.SP_GH WHERE MaGioHang = @maGh AND MaSP = @spId`);

    return res.json({
      success: true,
      data: null,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
    });
  } catch (err) {
    console.error('[cartController.removeItem] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi xóa sản phẩm: ' + err.message,
    });
  }
};

// 5. GỘP GIỎ HÀNG KHÁCH VÃNG LAI SAU ĐĂNG NHẬP (POST /api/cart/merge)
exports.mergeCart = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const { items } = req.body; // Mảng [{ maSP: 1, soLuong: 2 }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Không có sản phẩm nào cần gộp',
      });
    }

    const pool = await getPool();
    const maGioHang = await getOrCreateCart(pool, maKhachHang);

    for (const it of items) {
      const spId = parseInt(it.maSP || it.id, 10);
      const qty = parseInt(it.soLuong || it.qty, 10) || 1;

      if (!spId) continue;

      // Tìm giá sản phẩm
      const spRes = await pool
        .request()
        .input('spId', sql.Int, spId)
        .query(`SELECT DonGia FROM dbo.SAN_PHAM WHERE MaSP = @spId`);

      if (spRes.recordset.length === 0) continue;
      const donGia = spRes.recordset[0].DonGia;

      // Kiểm tra có sẵn trong giỏ chưa
      const checkRes = await pool
        .request()
        .input('maGh', sql.Int, maGioHang)
        .input('spId', sql.Int, spId)
        .query(`SELECT SoLuong FROM dbo.SP_GH WHERE MaGioHang = @maGh AND MaSP = @spId`);

      if (checkRes.recordset.length > 0) {
        await pool
          .request()
          .input('maGh', sql.Int, maGioHang)
          .input('spId', sql.Int, spId)
          .input('qty', sql.Int, checkRes.recordset[0].SoLuong + qty)
          .query(`UPDATE dbo.SP_GH SET SoLuong = @qty WHERE MaGioHang = @maGh AND MaSP = @spId`);
      } else {
        await pool
          .request()
          .input('maGh', sql.Int, maGioHang)
          .input('spId', sql.Int, spId)
          .input('qty', sql.Int, qty)
          .input('price', sql.Decimal(18, 2), donGia)
          .query(`
            INSERT INTO dbo.SP_GH (MaSP, MaGioHang, SoLuong, DonGia)
            VALUES (@spId, @maGh, @qty, @price)
          `);
      }
    }

    return res.json({
      success: true,
      data: null,
      message: 'Đã gộp giỏ hàng tạm vào tài khoản thành công',
    });
  } catch (err) {
    console.error('[cartController.mergeCart] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi gộp giỏ hàng: ' + err.message,
    });
  }
};
