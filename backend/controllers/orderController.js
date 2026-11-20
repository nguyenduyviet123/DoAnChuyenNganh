/**
 * ============================================================
 *  BÁNH FG – CONTROLLER THANH TOÁN & ĐƠN HÀNG
 *  Phụ trách: Đàm Quang Trung (Module 3)
 *  File: controllers/orderController.js
 * ============================================================
 */
const { sql, getPool } = require('../config/database');

// 1. LẤY DANH SÁCH ĐỊA CHỈ GIAO HÀNG (GET /api/orders/addresses)
exports.getAddresses = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const pool = await getPool();

    const result = await pool
      .request()
      .input('maKh', sql.Int, maKhachHang)
      .query(`
        SELECT MaDiaChi, NguoiNhan, SoDT, DiaChi, MacDinh 
        FROM dbo.DIA_CHI 
        WHERE MaKhachHang = @maKh
        ORDER BY MacDinh DESC, MaDiaChi DESC
      `);

    return res.json({
      success: true,
      data: result.recordset,
      message: 'Lấy danh sách địa chỉ thành công',
    });
  } catch (err) {
    console.error('[orderController.getAddresses] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách địa chỉ: ' + err.message,
    });
  }
};

// 2. THÊM ĐỊA CHỈ MỚI (POST /api/orders/addresses)
exports.addAddress = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const { nguoiNhan, soDT, diaChi, macDinh = 0 } = req.body;

    if (!nguoiNhan || !soDT || !diaChi) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Vui lòng cung cấp đầy đủ: Tên người nhận, Số điện thoại và Địa chỉ',
      });
    }

    const pool = await getPool();

    // Nếu đặt là mặc định, reset các địa chỉ cũ
    if (macDinh) {
      await pool
        .request()
        .input('maKh', sql.Int, maKhachHang)
        .query(`UPDATE dbo.DIA_CHI SET MacDinh = 0 WHERE MaKhachHang = @maKh`);
    }

    const nextIdRes = await pool.query(`SELECT ISNULL(MAX(MaDiaChi), 0) + 1 AS nextId FROM dbo.DIA_CHI`);
    const nextDiaChiId = nextIdRes.recordset[0].nextId;

    await pool
      .request()
      .input('maDc', sql.Int, nextDiaChiId)
      .input('nguoiNhan', sql.NVarChar(150), nguoiNhan.trim())
      .input('soDT', sql.VarChar(20), soDT.trim())
      .input('diaChi', sql.NVarChar(300), diaChi.trim())
      .input('macDinh', sql.Bit, macDinh ? 1 : 0)
      .input('maKh', sql.Int, maKhachHang)
      .query(`
        INSERT INTO dbo.DIA_CHI (MaDiaChi, NguoiNhan, SoDT, DiaChi, MacDinh, MaKhachHang)
        VALUES (@maDc, @nguoiNhan, @soDT, @diaChi, @macDinh, @maKh)
      `);

    return res.status(201).json({
      success: true,
      data: { maDiaChi: nextDiaChiId },
      message: 'Thêm địa chỉ giao hàng thành công',
    });
  } catch (err) {
    console.error('[orderController.addAddress] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi thêm địa chỉ: ' + err.message,
    });
  }
};

// 3. KIỂM TRA MÃ GIẢM GIÁ (POST /api/orders/validate-discount)
exports.validateDiscount = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Vui lòng nhập mã giảm giá',
      });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('code', sql.NVarChar(100), code.trim().toUpperCase())
      .query(`
        SELECT 
          MaGiamGia, 
          TenMaGG, 
          MoTa, 
          SoLuong, 
          TrangThai, 
          NgayBatDau, 
          NgayKetThuc,
          LoaiGiam,
          GiaTriGiam,
          DonToiThieu,
          GiamToiDa
        FROM dbo.GIAM_GIA
        WHERE UPPER(TenMaGG) = @code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Mã giảm giá không tồn tại',
      });
    }

    const coupon = result.recordset[0];
    const today = new Date();

    if (coupon.TrangThai !== 'Đang áp dụng' || coupon.SoLuong <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Mã giảm giá đã hết lượt hoặc đã hết hiệu lực',
      });
    }

    const endOfExpiry = new Date(coupon.NgayKetThuc);
    endOfExpiry.setHours(23, 59, 59, 999);
    if (today < new Date(coupon.NgayBatDau) || today > endOfExpiry) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Mã giảm giá đã hết hạn sử dụng',
      });
    }

    const cart = await pool.request().input('maKh', sql.Int, req.user.maKhachHang).query(`
      SELECT SUM(sp.DonGia * sgh.SoLuong) AS TamTinh FROM dbo.GIO_HANG gh
      JOIN dbo.SP_GH sgh ON sgh.MaGioHang=gh.MaGioHang JOIN dbo.SAN_PHAM sp ON sp.MaSP=sgh.MaSP
      WHERE gh.MaKhachHang=@maKh
    `);
    const subtotal = Number(cart.recordset[0]?.TamTinh || 0);
    if (subtotal < Number(coupon.DonToiThieu || 0)) return res.status(400).json({ success: false, message: `Đơn hàng cần đạt ${Number(coupon.DonToiThieu).toLocaleString('vi-VN')}đ để dùng mã này.` });
    let discount = coupon.LoaiGiam === 'PHAN_TRAM' ? subtotal * Number(coupon.GiaTriGiam) / 100 : Number(coupon.GiaTriGiam);
    if (coupon.GiamToiDa) discount = Math.min(discount, Number(coupon.GiamToiDa));
    discount = Math.min(subtotal, Math.max(0, discount));
    return res.json({
      success: true,
      data: {
        maGiamGia: coupon.MaGiamGia,
        tenMaGG: coupon.TenMaGG,
        moTa: coupon.MoTa,
        giamGiaTien: Math.round(discount),
      },
      message: `Áp dụng thành công mã ưu đãi: ${coupon.TenMaGG}`,
    });
  } catch (err) {
    console.error('[orderController.validateDiscount] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi kiểm tra mã giảm giá: ' + err.message,
    });
  }
};

// 4. TIẾN HÀNH ĐẶT HÀNG & TẠO ĐƠN (POST /api/orders)
exports.createOrder = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const { maDiaChi, maGiamGia, phuongThucThanhToan, ghiChu, htVanChuyen = 'Giao hàng tiêu chuẩn' } = req.body;

    if (!maDiaChi) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Vui lòng chọn hoặc thêm địa chỉ nhận hàng',
      });
    }

    const pool = await getPool();

    // 1. Lấy giỏ hàng hiện tại
    const cartRes = await pool
      .request()
      .input('maKh', sql.Int, maKhachHang)
      .query(`SELECT MaGioHang FROM dbo.GIO_HANG WHERE MaKhachHang = @maKh`);

    if (cartRes.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Giỏ hàng của bạn đang trống',
      });
    }

    const maGioHang = cartRes.recordset[0].MaGioHang;

    const itemsRes = await pool
      .request()
      .input('maGh', sql.Int, maGioHang)
      .query(`SELECT sp.MaSP, sgh.SoLuong, sp.DonGia FROM dbo.SP_GH sgh JOIN dbo.SAN_PHAM sp ON sp.MaSP=sgh.MaSP WHERE sgh.MaGioHang = @maGh`);

    const items = itemsRes.recordset;
    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Giỏ hàng của bạn chưa có sản phẩm nào để đặt hàng',
      });
    }

    // 2. Tính tổng tiền
    let tongTien = items.reduce((sum, it) => sum + Number(it.DonGia) * it.SoLuong, 0);
    const tamTinh = tongTien;
    let tienGiam = 0;

    // 3. Thực thi Transaction tạo DON_HANG + DH_SP + THANH_TOAN + xóa SP_GH
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Địa chỉ phải thuộc khách đang đặt; tồn kho được khóa và trừ trong cùng giao dịch.
      const txAddress = await new sql.Request(transaction).input('addressId', sql.Int, Number(maDiaChi)).input('customerId', sql.Int, maKhachHang).query('SELECT MaDiaChi FROM dbo.DIA_CHI WHERE MaDiaChi=@addressId AND MaKhachHang=@customerId');
      if (!txAddress.recordset.length) { const error = new Error('Địa chỉ nhận hàng không hợp lệ.'); error.status = 400; throw error; }
      for (const item of items) {
        let remaining = Number(item.SoLuong);
        const stocks = await new sql.Request(transaction).input('productId', sql.Int, item.MaSP).query(`SELECT MaCuaHang,SoLuongCo FROM dbo.CUAHANG_SANPHAM WITH (UPDLOCK,HOLDLOCK) WHERE MaSP=@productId AND SoLuongCo>0 ORDER BY MaCuaHang`);
        for (const stock of stocks.recordset) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, Number(stock.SoLuongCo));
          await new sql.Request(transaction).input('productId', sql.Int, item.MaSP).input('storeId', sql.Int, stock.MaCuaHang).input('take', sql.Int, take).query('UPDATE dbo.CUAHANG_SANPHAM SET SoLuongCo=SoLuongCo-@take WHERE MaSP=@productId AND MaCuaHang=@storeId AND SoLuongCo>=@take');
          remaining -= take;
        }
        if (remaining > 0) { const error = new Error(`Sản phẩm #${item.MaSP} không đủ tồn kho để đặt số lượng này.`); error.status = 409; throw error; }
      }

      // Khóa lượt mã trong giao dịch để tránh hai đơn dùng mất cùng lượt cuối.
      if (maGiamGia) {
        const couponResult = await new sql.Request(transaction).input('couponId', sql.Int, Number(maGiamGia)).query(`SELECT MaGiamGia,SoLuong,TrangThai,NgayBatDau,NgayKetThuc,LoaiGiam,GiaTriGiam,DonToiThieu,GiamToiDa FROM dbo.GIAM_GIA WITH (UPDLOCK,HOLDLOCK) WHERE MaGiamGia=@couponId`);
        const coupon = couponResult.recordset[0];
        const now = new Date();
        if (!coupon || coupon.TrangThai !== 'Đang áp dụng' || Number(coupon.SoLuong) <= 0 || now < new Date(coupon.NgayBatDau) || now > new Date(new Date(coupon.NgayKetThuc).setHours(23,59,59,999))) { const error = new Error('Mã giảm giá không còn hiệu lực hoặc đã hết lượt.'); error.status = 400; throw error; }
        if (tamTinh < Number(coupon.DonToiThieu || 0)) { const error = new Error('Đơn hàng chưa đạt giá trị tối thiểu của mã giảm giá.'); error.status = 400; throw error; }
        tienGiam = coupon.LoaiGiam === 'PHAN_TRAM' ? tamTinh * Number(coupon.GiaTriGiam) / 100 : Number(coupon.GiaTriGiam);
        if (coupon.GiamToiDa) tienGiam = Math.min(tienGiam, Number(coupon.GiamToiDa));
        tienGiam = Math.min(tamTinh, Math.max(0, tienGiam));
        tongTien = Math.max(0, tamTinh - tienGiam);
        await new sql.Request(transaction).input('couponId', sql.Int, Number(maGiamGia)).query('UPDATE dbo.GIAM_GIA SET SoLuong=SoLuong-1 WHERE MaGiamGia=@couponId AND SoLuong>0');
      }
      // Mã đơn hàng tiếp theo
      const reqMaxDh = new sql.Request(transaction);
      const resMaxDh = await reqMaxDh.query(`SELECT ISNULL(MAX(MaDH), 0) + 1 AS nextId FROM dbo.DON_HANG`);
      const nextDhId = resMaxDh.recordset[0].nextId;

      const phuongThuc = phuongThucThanhToan === 'Chuyển khoản' ? 'Chuyển khoản' : 'COD';
      const bankConfigured = Boolean(process.env.BANK_NAME && process.env.BANK_ACCOUNT && process.env.BANK_HOLDER);

      // Insert DON_HANG
      const reqDh = new sql.Request(transaction);
      reqDh.input('maDh', sql.Int, nextDhId);
      reqDh.input('maDc', sql.Int, parseInt(maDiaChi, 10));
      reqDh.input('maGg', sql.Int, maGiamGia ? parseInt(maGiamGia, 10) : null);
      reqDh.input('maKh', sql.Int, maKhachHang);
      reqDh.input('ttGiao', sql.NVarChar(50), 'Đang xử lý');
      reqDh.input('tongTien', sql.Decimal(18, 2), tongTien);
      reqDh.input('htVc', sql.NVarChar(100), htVanChuyen);
      reqDh.input('htTt', sql.NVarChar(100), phuongThuc);
      reqDh.input('ghiChu', sql.NVarChar(300), ghiChu || 'Đặt qua website');

      await reqDh.query(`
        INSERT INTO dbo.DON_HANG (MaDH, MaDiaChi, MaGiamGia, MaKhachHang, TT_GiaoHang, TongTien, HT_VanChuyen, HT_ThanhToan, ThoiGianDat, GhiChu)
        VALUES (@maDh, @maDc, @maGg, @maKh, @ttGiao, @tongTien, @htVc, @htTt, SYSDATETIME(), @ghiChu)
      `);

      // Insert DH_SP (Chi tiết từng món trong đơn)
      for (const item of items) {
        const reqDhSp = new sql.Request(transaction);
        const thanhTien = Number(item.DonGia) * item.SoLuong;
        reqDhSp.input('maSp', sql.Int, item.MaSP);
        reqDhSp.input('maDh', sql.Int, nextDhId);
        reqDhSp.input('soLuong', sql.Int, item.SoLuong);
        reqDhSp.input('donGia', sql.Decimal(18, 2), item.DonGia);
        reqDhSp.input('thanhTien', sql.Decimal(18, 2), thanhTien);

        await reqDhSp.query(`
          INSERT INTO dbo.DH_SP (MaSP, MaDH, SoLuong, DonGia, ThanhTien)
          VALUES (@maSp, @maDh, @soLuong, @donGia, @thanhTien)
        `);
      }

      // Insert THANH_TOAN
      const reqMaxTt = new sql.Request(transaction);
      const resMaxTt = await reqMaxTt.query(`SELECT ISNULL(MAX(MaThanhToan), 0) + 1 AS nextId FROM dbo.THANH_TOAN`);
      const nextTtId = resMaxTt.recordset[0].nextId;

      const reqTt = new sql.Request(transaction);
      reqTt.input('maTt', sql.Int, nextTtId);
      reqTt.input('phuongThuc', sql.NVarChar(100), phuongThuc);
      reqTt.input('soTien', sql.Decimal(18, 2), tongTien);
      reqTt.input('trangThai', sql.NVarChar(50), phuongThuc === 'COD' ? 'Chờ thanh toán' : 'Chờ chuyển khoản');
      reqTt.input('maGd', sql.NVarChar(100), `FG-ORDER-${Date.now()}`);
      reqTt.input('maDh', sql.Int, nextDhId);

      await reqTt.query(`
        INSERT INTO dbo.THANH_TOAN (MaThanhToan, PhuongThuc, SoTien, ThoiGian, TrangThai, MaGiaoDich, MaDH)
        VALUES (@maTt, @phuongThuc, @soTien, SYSDATETIME(), @trangThai, @maGd, @maDh)
      `);

      // Xóa các mặt hàng trong giỏ sau khi đặt đơn thành công
      const reqClear = new sql.Request(transaction);
      reqClear.input('maGh', sql.Int, maGioHang);
      await reqClear.query(`DELETE FROM dbo.SP_GH WHERE MaGioHang = @maGh`);

      await transaction.commit();

      return res.status(201).json({
        success: true,
        data: {
          maDH: nextDhId,
          tongTien,
          phuongThuc,
          thongTinChuyenKhoan:
            phuongThuc === 'Chuyển khoản' && bankConfigured
              ? {
                  soTaiKhoan: process.env.BANK_ACCOUNT,
                  nganHang: process.env.BANK_NAME,
                  chuTaiKhoan: process.env.BANK_HOLDER,
                  soTien: tongTien,
                  noiDung: `FG ${nextDhId}`,
                }
              : null,
          ghiChuThanhToan: phuongThuc === 'Chuyển khoản' && !bankConfigured ? 'Đơn hàng đã được ghi nhận. Cửa hàng sẽ liên hệ để xác nhận thông tin chuyển khoản.' : null,
        },
        message: 'Đặt hàng thành công! Cảm ơn bạn đã lựa chọn Bánh Fresh Garden.',
      });
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    console.error('[orderController.createOrder] Lỗi:', err);
    return res.status(err.status || 500).json({
      success: false,
      data: null,
      message: 'Lỗi khi tạo đơn hàng: ' + err.message,
    });
  }
};

// 5. XEM LỊCH SỬ ĐƠN HÀNG CỦA TÔI (GET /api/orders)
exports.getMyOrders = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const pool = await getPool();

    const result = await pool
      .request()
      .input('maKh', sql.Int, maKhachHang)
      .query(`
        SELECT 
          dh.MaDH,
          dh.TongTien,
          dh.TT_GiaoHang,
          dh.HT_ThanhToan,
          dh.ThoiGianDat,
          dc.DiaChi,
          dc.NguoiNhan,
          dc.SoDT,
          COUNT(dhsp.MaSP) AS TongLoaiSanPham
        FROM dbo.DON_HANG dh
        INNER JOIN dbo.DIA_CHI dc ON dh.MaDiaChi = dc.MaDiaChi
        LEFT JOIN dbo.DH_SP dhsp ON dh.MaDH = dhsp.MaDH
        WHERE dh.MaKhachHang = @maKh
        GROUP BY 
          dh.MaDH, dh.TongTien, dh.TT_GiaoHang, dh.HT_ThanhToan, 
          dh.ThoiGianDat, dc.DiaChi, dc.NguoiNhan, dc.SoDT
        ORDER BY dh.ThoiGianDat DESC
      `);

    return res.json({
      success: true,
      data: result.recordset,
      message: 'Lấy lịch sử đơn hàng thành công',
    });
  } catch (err) {
    console.error('[orderController.getMyOrders] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách đơn hàng: ' + err.message,
    });
  }
};

// 6. XEM CHI TIẾT 1 ĐƠN HÀNG (GET /api/orders/:id)
exports.getOrderDetails = async (req, res) => {
  try {
    const maKhachHang = req.user.maKhachHang;
    const orderId = parseInt(req.params.id, 10);
    const pool = await getPool();

    const orderRes = await pool
      .request()
      .input('maDh', sql.Int, orderId)
      .input('maKh', sql.Int, maKhachHang)
      .query(`
        SELECT 
          dh.*,
          dc.NguoiNhan,
          dc.SoDT,
          dc.DiaChi,
          tt.TrangThai AS TrangThaiThanhToan,
          tt.MaGiaoDich
        FROM dbo.DON_HANG dh
        INNER JOIN dbo.DIA_CHI dc ON dh.MaDiaChi = dc.MaDiaChi
        LEFT JOIN dbo.THANH_TOAN tt ON dh.MaDH = tt.MaDH
        WHERE dh.MaDH = @maDh AND dh.MaKhachHang = @maKh
      `);

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Không tìm thấy đơn hàng này',
      });
    }

    const order = orderRes.recordset[0];

    // Lấy chi tiết các sản phẩm
    const itemsRes = await pool
      .request()
      .input('maDh', sql.Int, orderId)
      .query(`
        SELECT 
          dhsp.MaSP,
          dhsp.SoLuong,
          dhsp.DonGia,
          dhsp.ThanhTien,
          sp.TenSP,
          sp.DonViTinh,
          anh.DuongDan AS HinhAnh
        FROM dbo.DH_SP dhsp
        INNER JOIN dbo.SAN_PHAM sp ON dhsp.MaSP = sp.MaSP
        LEFT JOIN (
          SELECT MaSP, MIN(DuongDan) AS DuongDan 
          FROM dbo.ANH 
          WHERE MaSP IS NOT NULL 
          GROUP BY MaSP
        ) anh ON sp.MaSP = anh.MaSP
        WHERE dhsp.MaDH = @maDh
      `);

    order.sanPham = itemsRes.recordset;

    return res.json({
      success: true,
      data: order,
      message: 'Lấy chi tiết đơn hàng thành công',
    });
  } catch (err) {
    console.error('[orderController.getOrderDetails] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy chi tiết đơn hàng: ' + err.message,
    });
  }
};
