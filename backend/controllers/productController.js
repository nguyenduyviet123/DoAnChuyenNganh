/**
 * ============================================================
 *  BÁNH FG – CONTROLLER SẢN PHẨM & DANH MỤC
 *  Phụ trách: Nguyễn Văn Anh (Module 1)
 *  File: controllers/productController.js
 * ============================================================
 */
const { sql, getPool } = require('../config/database');

// 1. LẤY DANH SÁCH SẢN PHẨM (Có tìm kiếm, phân loại, sắp xếp)
exports.getAllProducts = async (req, res) => {
  try {
    const { q, loaiId, maLoai, maLoaiCha, sort, page = 1, limit = 12 } = req.query;
    const pool = await getPool();

    let queryStr = `
      SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.DonGia,
        sp.DonViTinh,
        sp.MoTa,
        sp.KhoiLuong,
        sp.KichThuoc,
        sp.MaLoai,
        lc.TenLoai AS TenLoaiCon,
        lc.MaLoaiCha,
        lcha.TenLoaiCha,
        anh.DuongDan AS HinhAnh,
        ISNULL((SELECT SUM(cs.SoLuongCo) FROM dbo.CUAHANG_SANPHAM cs WHERE cs.MaSP = sp.MaSP), 0) AS TongTon
      FROM dbo.SAN_PHAM sp
      LEFT JOIN dbo.LOAI_CON lc ON sp.MaLoai = lc.MaLoai
      LEFT JOIN dbo.LOAI_CHA lcha ON lc.MaLoaiCha = lcha.MaLoaiCha
      OUTER APPLY (
        SELECT TOP 1 DuongDan
        FROM dbo.ANH
        WHERE MaSP = sp.MaSP
        ORDER BY MaAnh ASC
      ) anh
      WHERE 1=1
    `;

    const request = pool.request();

    // Tìm theo tên, mô tả hoặc danh mục. Với nhiều từ, chỉ cần một từ khớp
    // để vẫn trả được các sản phẩm liên quan; cụm tên khớp chính xác được xếp trước.
    const searchText = String(q || '').trim().slice(0, 200);
    const searchTerms = [...new Set(searchText.split(/\s+/).filter(Boolean))].slice(0, 8);
    if (searchText) {
      request.input('keyword', sql.NVarChar(200), `%${searchText}%`);
      request.input('exactKeyword', sql.NVarChar(200), searchText);
      const termConditions = searchTerms.map((term, index) => {
        const name = `searchTerm${index}`;
        request.input(name, sql.NVarChar(200), `%${term}%`);
        return `(sp.TenSP LIKE @${name} OR sp.MoTa LIKE @${name} OR lc.TenLoai LIKE @${name} OR lcha.TenLoaiCha LIKE @${name})`;
      });
      queryStr += ` AND (
        sp.TenSP LIKE @keyword OR sp.MoTa LIKE @keyword OR lc.TenLoai LIKE @keyword OR lcha.TenLoaiCha LIKE @keyword
        OR ${termConditions.join(' OR ')}
      )`;
    }

    // Dùng tham số riêng để tránh trùng ID giữa LOAI_CHA và LOAI_CON.
    if (maLoai) {
      request.input('maLoai', sql.Int, parseInt(maLoai, 10));
      queryStr += ` AND sp.MaLoai = @maLoai`;
    } else if (maLoaiCha) {
      const rawParentIds = Array.isArray(maLoaiCha) ? maLoaiCha : String(maLoaiCha).split(',');
      const parentIds = [...new Set(rawParentIds.flatMap((value) => String(value).split(',')).map((value) => Number.parseInt(value, 10)).filter((value) => Number.isInteger(value) && value > 0))];
      if (parentIds.length === 1) {
        request.input('maLoaiCha', sql.Int, parentIds[0]);
        queryStr += ` AND lc.MaLoaiCha = @maLoaiCha`;
      } else if (parentIds.length > 1) {
        const parameters = parentIds.map((id, index) => {
          const name = `maLoaiCha${index}`;
          request.input(name, sql.Int, id);
          return `@${name}`;
        });
        queryStr += ` AND lc.MaLoaiCha IN (${parameters.join(', ')})`;
      }
    } else if (loaiId) {
      // Tương thích API cũ: loaiId là mã LOAI_CON.
      request.input('loaiId', sql.Int, parseInt(loaiId, 10));
      queryStr += ` AND sp.MaLoai = @loaiId`;
    }

    // Sắp xếp theo tiêu chí tìm kiếm và lựa chọn của người dùng
    if (sort === 'price_asc') {
      queryStr += ` ORDER BY sp.DonGia ASC`;
    } else if (sort === 'price_desc') {
      queryStr += ` ORDER BY sp.DonGia DESC`;
    } else if (sort === 'name_asc') {
      queryStr += ` ORDER BY sp.TenSP ASC`;
    } else if (sort === 'name_desc') {
      queryStr += ` ORDER BY sp.TenSP DESC`;
    } else if (sort === 'featured' || sort === 'default') {
      if (searchText) {
        queryStr += ` ORDER BY CASE WHEN sp.TenSP = @exactKeyword THEN 0 WHEN sp.TenSP LIKE @keyword THEN 1 ELSE 2 END, sp.MaSP DESC`;
      } else {
        queryStr += ` ORDER BY CASE WHEN ISNULL((SELECT SUM(cs.SoLuongCo) FROM dbo.CUAHANG_SANPHAM cs WHERE cs.MaSP = sp.MaSP), 0) > 0 THEN 0 ELSE 1 END, sp.MaSP DESC`;
      }
    } else if (searchText) {
      queryStr += ` ORDER BY CASE WHEN sp.TenSP = @exactKeyword THEN 0 WHEN sp.TenSP LIKE @keyword THEN 1 ELSE 2 END, sp.MaSP DESC`;
    } else {
      queryStr += ` ORDER BY sp.MaSP DESC`;
    }

    const result = await request.query(queryStr);
    const total = result.recordset.length;

    // Phân trang đơn giản ở bộ nhớ
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = result.recordset.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        products: paginatedItems,
      },
      message: 'Lấy danh sách sản phẩm thành công',
    });
  } catch (err) {
    console.error('[productController.getAllProducts] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi truy vấn sản phẩm: ' + err.message,
    });
  }
};

// 2. LẤY CHI TIẾT 1 SẢN PHẨM
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(String(id))) return res.status(400).json({ success: false, message: 'Mã sản phẩm không hợp lệ' });
    const pool = await getPool();

    const result = await pool
      .request()
      .input('id', sql.Int, parseInt(id, 10))
      .query(`
        SELECT 
          sp.MaSP,
          sp.TenSP,
          sp.DonGia,
          sp.DonViTinh,
          sp.MoTa,
          sp.KhoiLuong,
          sp.KichThuoc,
          sp.MaLoai,
          lc.TenLoai AS TenLoaiCon,
          lc.MaLoaiCha,
          lcha.TenLoaiCha,
          anh.DuongDan AS HinhAnh
        FROM dbo.SAN_PHAM sp
        LEFT JOIN dbo.LOAI_CON lc ON sp.MaLoai = lc.MaLoai
        LEFT JOIN dbo.LOAI_CHA lcha ON lc.MaLoaiCha = lcha.MaLoaiCha
        OUTER APPLY (
          SELECT TOP 1 DuongDan
          FROM dbo.ANH
          WHERE MaSP = sp.MaSP
          ORDER BY MaAnh ASC
        ) anh
        WHERE sp.MaSP = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Không tìm thấy sản phẩm yêu cầu',
      });
    }

    const product = result.recordset[0];

    // Lấy thêm tồn kho tại các cửa hàng
    const [storeStock, productImages, reviews] = await Promise.all([pool
      .request()
      .input('id', sql.Int, parseInt(id, 10))
      .query(`
        SELECT 
          ch.MaCuaHang, 
          ch.TenCuaHang, 
          ch.DiaChi, 
          csp.SoLuongCo
        FROM dbo.CUAHANG_SANPHAM csp
        INNER JOIN dbo.CUA_HANG ch ON csp.MaCuaHang = ch.MaCuaHang
        WHERE csp.MaSP = @id
      `), pool.request().input('id', sql.Int, parseInt(id, 10)).query(`
        SELECT MaAnh, DuongDan FROM dbo.ANH WHERE MaSP = @id ORDER BY MaAnh ASC
      `), pool.request().input('id', sql.Int, parseInt(id, 10)).query(`
        SELECT TOP 10 dg.MaDG, dg.SoSao, dg.NoiDung, dg.NgayDanhGia, kh.TenKhachHang
        FROM dbo.DANH_GIA dg
        INNER JOIN dbo.KHACH_HANG kh ON kh.MaKhachHang = dg.MaKhachHang
        WHERE dg.MaSP = @id AND dg.TrangThai = N'Đã duyệt'
        ORDER BY dg.NgayDanhGia DESC
      `)]);

    product.tonKhoCuaHang = storeStock.recordset;
    product.hinhAnh = productImages.recordset.map((image) => image.DuongDan);
    product.danhGia = reviews.recordset;
    product.diemDanhGia = reviews.recordset.length
      ? Number((reviews.recordset.reduce((sum, review) => sum + Number(review.SoSao), 0) / reviews.recordset.length).toFixed(1))
      : null;

    return res.json({
      success: true,
      data: product,
      message: 'Lấy chi tiết sản phẩm thành công',
    });
  } catch (err) {
    console.error('[productController.getProductById] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy chi tiết sản phẩm: ' + err.message,
    });
  }
};

// 3. LẤY CÂY DANH MỤC (LOẠI CHA VÀ LOẠI CON)
exports.getCategories = async (req, res) => {
  try {
    const pool = await getPool();

    const parentCats = await pool.query(`SELECT MaLoaiCha, TenLoaiCha FROM dbo.LOAI_CHA ORDER BY MaLoaiCha ASC`);
    const childCats = await pool.query(`SELECT MaLoai, MaLoaiCha, TenLoai FROM dbo.LOAI_CON ORDER BY MaLoai ASC`);

    const tree = parentCats.recordset.map((parent) => {
      return {
        ...parent,
        subCategories: childCats.recordset.filter((child) => child.MaLoaiCha === parent.MaLoaiCha),
      };
    });

    return res.json({
      success: true,
      data: tree,
      message: 'Lấy cây danh mục sản phẩm thành công',
    });
  } catch (err) {
    console.error('[productController.getCategories] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh mục: ' + err.message,
    });
  }
};

// 4. LẤY DANH SÁCH HỆ THỐNG CỬA HÀNG (GET /api/products/stores)
exports.getStores = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`SELECT * FROM dbo.CUA_HANG ORDER BY MaCuaHang ASC`);
    return res.json({
      success: true,
      data: result.recordset,
      message: 'Lấy danh sách cửa hàng thành công',
    });
  } catch (err) {
    console.error('[productController.getStores] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách cửa hàng: ' + err.message,
    });
  }
};

// 5. LẤY DANH SÁCH TIN TỨC & BÀI VIẾT (GET /api/products/news)
exports.getNews = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT 
        tt.MaTinTuc, 
        tt.TieuDe, 
        tt.NoiDung, 
        tt.NgayDang,
        anh.DuongDan AS HinhAnh
      FROM dbo.TIN_TUC tt
      LEFT JOIN dbo.ANH anh ON tt.MaTinTuc = anh.MaTinTuc
      ORDER BY tt.NgayDang DESC
    `);
    return res.json({
      success: true,
      data: result.recordset,
      message: 'Lấy danh sách tin tức thành công',
    });
  } catch (err) {
    console.error('[productController.getNews] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách tin tức: ' + err.message,
    });
  }
};

// 6. LẤY MÃ ƯU ĐÃI ĐANG ÁP DỤNG (GET /api/products/promotions)
exports.getPromotions = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT MaGiamGia, TenMaGG, MoTa, SoLuong, NgayBatDau, NgayKetThuc, TrangThai
      FROM dbo.GIAM_GIA
      WHERE TrangThai = N'Đang áp dụng'
        AND SoLuong > 0
        AND CONVERT(date, SYSDATETIME()) BETWEEN NgayBatDau AND NgayKetThuc
      ORDER BY NgayKetThuc ASC, MaGiamGia ASC
    `);
    return res.json({
      success: true,
      data: result.recordset,
      message: 'Lấy danh sách ưu đãi đang áp dụng thành công',
    });
  } catch (err) {
    console.error('[productController.getPromotions] Lỗi:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách ưu đãi: ' + err.message,
    });
  }
};
