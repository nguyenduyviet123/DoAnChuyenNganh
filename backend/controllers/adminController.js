const { sql, getPool } = require('../config/database');

const nextId = async (pool, table, column) => {
  const result = await pool.query(`SELECT ISNULL(MAX(${column}), 0) + 1 AS nextId FROM dbo.${table}`);
  return result.recordset[0].nextId;
};
const fail = (res, error, label) => {
  console.error(`[admin.${label}]`, error);
  return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Thao tác quản trị thất bại.' });
};
const requiredText = (value, name, max) => {
  const text = String(value ?? '').trim();
  if (!text || text.length > max) { const error = new Error(`${name} không được để trống và tối đa ${max} ký tự.`); error.status = 400; throw error; }
  return text;
};
const positiveMoney = (value, name = 'Giá') => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) { const error = new Error(`${name} phải là số không âm.`); error.status = 400; throw error; }
  return number;
};

async function deductOrderStock(transaction, orderId) {
  const items = await new sql.Request(transaction)
    .input('id', sql.Int, orderId)
    .query('SELECT MaSP,SoLuong FROM dbo.DH_SP WHERE MaDH=@id');

  for (const item of items.recordset) {
    let remaining = Number(item.SoLuong);
    const stocks = await new sql.Request(transaction)
      .input('productId', sql.Int, item.MaSP)
      .query('SELECT MaCuaHang,SoLuongCo FROM dbo.CUAHANG_SANPHAM WITH (UPDLOCK,HOLDLOCK) WHERE MaSP=@productId AND SoLuongCo>0 ORDER BY MaCuaHang');

    for (const stock of stocks.recordset) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, Number(stock.SoLuongCo));
      await new sql.Request(transaction)
        .input('productId', sql.Int, item.MaSP)
        .input('storeId', sql.Int, stock.MaCuaHang)
        .input('take', sql.Int, take)
        .query('UPDATE dbo.CUAHANG_SANPHAM SET SoLuongCo=SoLuongCo-@take WHERE MaSP=@productId AND MaCuaHang=@storeId AND SoLuongCo>=@take');
      remaining -= take;
    }

    if (remaining > 0) {
      const error = new Error(`Sản phẩm #${item.MaSP} không đủ tồn kho để xác nhận thanh toán.`);
      error.status = 409;
      throw error;
    }
  }
}

exports.getSummary = async (req, res) => {
  try {
    const pool = await getPool();
    const [totals, daily] = await Promise.all([
      pool.query(`SELECT (SELECT COUNT(*) FROM dbo.SAN_PHAM) AS TongSanPham,(SELECT COUNT(*) FROM dbo.KHACH_HANG kh WHERE NOT EXISTS (SELECT 1 FROM dbo.TAI_KHOAN tk WHERE tk.MaKhachHang=kh.MaKhachHang AND tk.VaiTro=N'QuanTri')) AS TongKhachHang,(SELECT COUNT(*) FROM dbo.DON_HANG) AS TongDonHang,(SELECT COUNT(*) FROM dbo.DON_HANG WHERE TT_GiaoHang IN (N'Đang xử lý',N'Chờ xác nhận')) AS DonChoXuLy,(SELECT ISNULL(SUM(TongTien),0) FROM dbo.DON_HANG WHERE ThoiGianDat >= DATEADD(day,-30,SYSDATETIME()) AND TT_GiaoHang <> N'Đã hủy') AS DoanhThu30Ngay`),
      pool.query(`SELECT TOP 14 CONVERT(date,ThoiGianDat) AS Ngay, SUM(TongTien) AS DoanhThu FROM dbo.DON_HANG WHERE ThoiGianDat >= DATEADD(day,-13,CONVERT(date,SYSDATETIME())) AND TT_GiaoHang <> N'Đã hủy' GROUP BY CONVERT(date,ThoiGianDat) ORDER BY Ngay`),
    ]);
    res.json({ success: true, data: { ...totals.recordset[0], doanhThuTheoNgay: daily.recordset } });
  } catch (error) { fail(res, error, 'getSummary'); }
};
exports.listErrors = async (req, res) => {
  try { const pool = await getPool(); const result = await pool.query('SELECT TOP 100 MaLoi,ThoiGian,PhuongThuc,DuongDan,MaKhachHang,ThongBao FROM dbo.NHAT_KY_LOI ORDER BY ThoiGian DESC'); res.json({ success: true, data: result.recordset }); }
  catch (error) { fail(res, error, 'listErrors'); }
};

exports.listProducts = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input('q', sql.NVarChar(200), `%${String(req.query.q || '').trim()}%`).query(`
      SELECT sp.MaSP,sp.TenSP,sp.DonGia,sp.DonViTinh,sp.MoTa,sp.KhoiLuong,sp.KichThuoc,sp.MaLoai,lc.TenLoai,lc.MaLoaiCha,
       (SELECT TOP 1 DuongDan FROM dbo.ANH a WHERE a.MaSP=sp.MaSP ORDER BY MaAnh) AS HinhAnh,
       (SELECT ISNULL(SUM(SoLuongCo),0) FROM dbo.CUAHANG_SANPHAM cs WHERE cs.MaSP=sp.MaSP) AS TongTon
      FROM dbo.SAN_PHAM sp LEFT JOIN dbo.LOAI_CON lc ON lc.MaLoai=sp.MaLoai
      WHERE @q='%%' OR sp.TenSP LIKE @q ORDER BY sp.MaSP DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (error) { fail(res, error, 'listProducts'); }
};

exports.saveProduct = async (req, res) => {
  try {
    const id = req.params.id ? Number(req.params.id) : null;
    const { tenSP, maLoai, donGia, donViTinh, moTa, khoiLuong, kichThuoc, hinhAnh, tonKho } = req.body;
    const name = requiredText(tenSP, 'Tên sản phẩm', 200);
    const categoryId = Number(maLoai);
    if (!Number.isInteger(categoryId) || categoryId < 1) { const error = new Error('Vui lòng chọn danh mục hợp lệ.'); error.status = 400; throw error; }
    const price = positiveMoney(donGia);
    const hasStockInput = tonKho !== undefined && tonKho !== null && String(tonKho).trim() !== '';
    const stock = hasStockInput ? Math.max(0, Math.floor(Number(tonKho) || 0)) : (id ? null : 100);
    const image = String(hinhAnh || '').trim().slice(0, 500);
    const pool = await getPool();
    const category = await pool.request().input('id', sql.Int, categoryId).query('SELECT MaLoai FROM dbo.LOAI_CON WHERE MaLoai=@id');
    if (!category.recordset.length) { const error = new Error('Danh mục không tồn tại.'); error.status = 400; throw error; }
    const productId = id || await nextId(pool, 'SAN_PHAM', 'MaSP');
    await pool.request().input('id', sql.Int, productId).input('name', sql.NVarChar(200), name).input('category', sql.Int, categoryId)
      .input('price', sql.Decimal(18, 2), price).input('unit', sql.NVarChar(50), String(donViTinh || 'cái').slice(0, 50))
      .input('description', sql.NVarChar(500), String(moTa || '').slice(0, 500)).input('weight', sql.Decimal(10, 2), khoiLuong ? Number(khoiLuong) : null)
      .input('size', sql.NVarChar(100), String(kichThuoc || '').slice(0, 100)).query(id ? `
        UPDATE dbo.SAN_PHAM SET TenSP=@name,MaLoai=@category,DonGia=@price,DonViTinh=@unit,MoTa=@description,KhoiLuong=@weight,KichThuoc=@size WHERE MaSP=@id
      ` : `
        INSERT INTO dbo.SAN_PHAM(MaSP,MaLoai,TenSP,DonGia,DonViTinh,MoTa,KhoiLuong,KichThuoc) VALUES(@id,@category,@name,@price,@unit,@description,@weight,@size)
      `);
    if (image) {
      const imageId = await nextId(pool, 'ANH', 'MaAnh');
      await pool.request().input('imageId', sql.Int, imageId).input('id', sql.Int, productId).input('url', sql.NVarChar(500), image).query(`
        IF EXISTS(SELECT 1 FROM dbo.ANH WHERE MaSP=@id) UPDATE dbo.ANH SET DuongDan=@url WHERE MaAnh=(SELECT MIN(MaAnh) FROM dbo.ANH WHERE MaSP=@id)
        ELSE INSERT INTO dbo.ANH(MaAnh,MaSP,DuongDan) VALUES(@imageId,@id,@url)
      `);
    }
    // Form nhập tồn tổng; giữ phân bổ hiện tại giữa các chi nhánh và chỉ điều chỉnh phần chênh lệch.
    const stores = await pool.query('SELECT MaCuaHang FROM dbo.CUA_HANG ORDER BY MaCuaHang');
    if (stores.recordset.length && stock !== null) {
      const transaction = new sql.Transaction(pool); await transaction.begin();
      try {
        const currentResult = await new sql.Request(transaction).input('id',sql.Int,productId).query('SELECT MaCuaHang,SoLuongCo FROM dbo.CUAHANG_SANPHAM WITH (UPDLOCK,HOLDLOCK) WHERE MaSP=@id ORDER BY MaCuaHang');
        const current = currentResult.recordset;
        const currentTotal = current.reduce((sum,row)=>sum+Number(row.SoLuongCo),0);
        if (stock > currentTotal) {
          const storeId = stores.recordset[0].MaCuaHang; const increase = stock-currentTotal;
          await new sql.Request(transaction).input('store',sql.Int,storeId).input('id',sql.Int,productId).input('increase',sql.Int,increase).query(`
            IF EXISTS(SELECT 1 FROM dbo.CUAHANG_SANPHAM WHERE MaCuaHang=@store AND MaSP=@id) UPDATE dbo.CUAHANG_SANPHAM SET SoLuongCo=SoLuongCo+@increase WHERE MaCuaHang=@store AND MaSP=@id
            ELSE INSERT INTO dbo.CUAHANG_SANPHAM(MaCuaHang,MaSP,SoLuongCo) VALUES(@store,@id,@increase)
          `);
        } else if (stock < currentTotal) {
          let toRemove=currentTotal-stock;
          for (const row of current.slice().reverse()) {
            if (toRemove<=0) break;
            const take=Math.min(toRemove,Number(row.SoLuongCo));
            await new sql.Request(transaction).input('store',sql.Int,row.MaCuaHang).input('id',sql.Int,productId).input('stock',sql.Int,Number(row.SoLuongCo)-take).query('UPDATE dbo.CUAHANG_SANPHAM SET SoLuongCo=@stock WHERE MaCuaHang=@store AND MaSP=@id');
            toRemove-=take;
          }
        }
        await transaction.commit();
      } catch (error) { await transaction.rollback(); throw error; }
    }
    res.status(id ? 200 : 201).json({ success: true, data: { MaSP: productId }, message: id ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm.' });
  } catch (error) { fail(res, error, 'saveProduct'); }
};

exports.deleteProduct = async (req, res) => {
  try {
    const pool = await getPool(); const id = Number(req.params.id);
    const used = await pool.request().input('id', sql.Int, id).query('SELECT (SELECT COUNT(*) FROM dbo.DH_SP WHERE MaSP=@id) AS Orders,(SELECT COUNT(*) FROM dbo.SP_GH WHERE MaSP=@id) AS Carts,(SELECT COUNT(*) FROM dbo.DANH_GIA WHERE MaSP=@id) AS Reviews');
    if (used.recordset[0].Orders || used.recordset[0].Carts || used.recordset[0].Reviews) { const error = new Error('Sản phẩm đã có trong đơn hàng, giỏ hàng hoặc đánh giá nên không thể xóa.'); error.status = 409; throw error; }
    await pool.request().input('id', sql.Int, id).query('DELETE FROM dbo.CUAHANG_SANPHAM WHERE MaSP=@id; DELETE FROM dbo.ANH WHERE MaSP=@id; DELETE FROM dbo.SAN_PHAM WHERE MaSP=@id;');
    res.json({ success: true, message: 'Đã xóa sản phẩm.' });
  } catch (error) { fail(res, error, 'deleteProduct'); }
};

exports.listOrders = async (req, res) => {
  try { const pool = await getPool(); const result = await pool.query(`SELECT TOP 300 dh.MaDH,dh.TT_GiaoHang,dh.TongTien,dh.ThoiGianDat,dh.HT_ThanhToan,tt.MaThanhToan,tt.TrangThai AS TrangThaiThanhToan,kh.TenKhachHang,kh.SoDT,dc.NguoiNhan,dc.DiaChi FROM dbo.DON_HANG dh JOIN dbo.KHACH_HANG kh ON kh.MaKhachHang=dh.MaKhachHang JOIN dbo.DIA_CHI dc ON dc.MaDiaChi=dh.MaDiaChi LEFT JOIN dbo.THANH_TOAN tt ON tt.MaDH=dh.MaDH ORDER BY dh.ThoiGianDat DESC`); res.json({ success: true, data: result.recordset }); }
  catch (error) { fail(res, error, 'listOrders'); }
};
exports.updatePaymentStatus = async (req,res) => {
  try {
    const allowed=['Chờ thanh toán','Chờ chuyển khoản','Đã thanh toán','Thanh toán thất bại','Đã hoàn tiền'];
    if(!allowed.includes(req.body.status)){const error=new Error('Trạng thái thanh toán không hợp lệ.');error.status=400;throw error;}
    const pool=await getPool();
    const transaction=new sql.Transaction(pool);await transaction.begin();
    try {
      const paymentResult=await new sql.Request(transaction).input('id',sql.Int,Number(req.params.id)).query(`
        SELECT tt.MaThanhToan,tt.TrangThai,dh.MaDH,dh.TT_GiaoHang
        FROM dbo.THANH_TOAN tt WITH (UPDLOCK,HOLDLOCK)
        INNER JOIN dbo.DON_HANG dh WITH (UPDLOCK,HOLDLOCK) ON dh.MaDH=tt.MaDH
        WHERE dh.MaDH=@id
      `);
      const payment=paymentResult.recordset[0];
      if(!payment){const error=new Error('Không tìm thấy giao dịch của đơn hàng.');error.status=404;throw error;}
      if(payment.TrangThai==='Đã thanh toán'&&req.body.status!=='Đã thanh toán'&&req.body.status!=='Đã hoàn tiền'){
        const error=new Error('Giao dịch đã thanh toán; chỉ có thể chuyển sang trạng thái hoàn tiền.');error.status=409;throw error;
      }
      if(payment.TrangThai==='Đã hoàn tiền'&&req.body.status==='Đã thanh toán'){
        const error=new Error('Giao dịch đã hoàn tiền nên không thể đánh dấu thanh toán lần nữa.');error.status=409;throw error;
      }
      if(req.body.status==='Đã thanh toán'&&payment.TrangThai!=='Đã thanh toán'){
        if(payment.TT_GiaoHang==='Đã hủy'){const error=new Error('Đơn đã hủy nên không thể xác nhận thanh toán.');error.status=409;throw error;}
        await deductOrderStock(transaction, payment.MaDH);
      }
      await new sql.Request(transaction).input('id',sql.Int,payment.MaDH).input('status',sql.NVarChar(50),req.body.status).query('UPDATE dbo.THANH_TOAN SET TrangThai=@status WHERE MaDH=@id');
      await transaction.commit();
    } catch(error){await transaction.rollback();throw error;}
    res.json({success:true,message:'Đã cập nhật trạng thái thanh toán.'});
  }catch(error){fail(res,error,'updatePaymentStatus');}
};
exports.updateOrderStatus = async (req, res) => {
  try {
    const allowed = ['Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'];
    if (!allowed.includes(req.body.status)) { const error = new Error('Trạng thái đơn hàng không hợp lệ.'); error.status = 400; throw error; }
    const pool = await getPool(); const transaction = new sql.Transaction(pool); await transaction.begin();
    try {
      const orderResult = await new sql.Request(transaction).input('id', sql.Int, Number(req.params.id)).query('SELECT dh.MaDH,dh.TT_GiaoHang,dh.MaGiamGia,dh.HT_ThanhToan,tt.TrangThai AS TrangThaiThanhToan FROM dbo.DON_HANG dh WITH (UPDLOCK,HOLDLOCK) LEFT JOIN dbo.THANH_TOAN tt WITH (UPDLOCK,HOLDLOCK) ON tt.MaDH=dh.MaDH WHERE dh.MaDH=@id');
      const order = orderResult.recordset[0];
      if (!order) { const error = new Error('Không tìm thấy đơn hàng.'); error.status = 404; throw error; }
      if (['Đã giao','Đã hủy'].includes(order.TT_GiaoHang) && req.body.status !== order.TT_GiaoHang) { const error = new Error('Đơn đã hoàn tất hoặc đã hủy, không thể đổi trạng thái.'); error.status = 409; throw error; }
      if (req.body.status === 'Đã hủy' && order.TT_GiaoHang !== 'Đang xử lý') { const error = new Error('Chỉ có thể hủy đơn trước khi chuyển sang giao hàng.'); error.status = 409; throw error; }
      if (req.body.status === 'Đã hủy' && order.TT_GiaoHang !== 'Đã hủy') {
        if (['Đã thanh toán', 'Đã hoàn tiền'].includes(order.TrangThaiThanhToan)) {
          const items = await new sql.Request(transaction).input('id', sql.Int, order.MaDH).query('SELECT MaSP,SoLuong FROM dbo.DH_SP WHERE MaDH=@id');
          for (const item of items.recordset) {
            await new sql.Request(transaction).input('productId',sql.Int,item.MaSP).input('quantity',sql.Int,item.SoLuong).query(`
              DECLARE @store INT=(SELECT TOP 1 MaCuaHang FROM dbo.CUA_HANG ORDER BY MaCuaHang);
              IF @store IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.CUAHANG_SANPHAM WHERE MaCuaHang=@store AND MaSP=@productId)
                UPDATE dbo.CUAHANG_SANPHAM SET SoLuongCo=SoLuongCo+@quantity WHERE MaCuaHang=@store AND MaSP=@productId;
              ELSE IF @store IS NOT NULL INSERT INTO dbo.CUAHANG_SANPHAM(MaCuaHang,MaSP,SoLuongCo) VALUES(@store,@productId,@quantity);
            `);
          }
        }
        if (order.MaGiamGia) await new sql.Request(transaction).input('couponId',sql.Int,order.MaGiamGia).query('UPDATE dbo.GIAM_GIA SET SoLuong=SoLuong+1 WHERE MaGiamGia=@couponId');
      }
      // COD is paid at delivery. Confirm payment and deduct stock atomically
      // when the administrator marks a COD order as delivered.
      if (req.body.status === 'Đã giao' && order.HT_ThanhToan === 'COD' && order.TrangThaiThanhToan !== 'Đã thanh toán') {
        await deductOrderStock(transaction, order.MaDH);
        await new sql.Request(transaction)
          .input('id', sql.Int, order.MaDH)
          .input('status', sql.NVarChar(50), 'Đã thanh toán')
          .query('UPDATE dbo.THANH_TOAN SET TrangThai=@status WHERE MaDH=@id');
      }
      await new sql.Request(transaction).input('id',sql.Int,order.MaDH).input('status',sql.NVarChar(50),req.body.status).query('UPDATE dbo.DON_HANG SET TT_GiaoHang=@status WHERE MaDH=@id');
      await transaction.commit();
    } catch (error) { await transaction.rollback(); throw error; }
    res.json({ success: true, message: 'Đã cập nhật trạng thái đơn hàng.' });
  } catch (error) { fail(res, error, 'updateOrderStatus'); }
};

exports.listCustomers = async (req, res) => {
  try { const pool = await getPool(); const result = await pool.query(`SELECT TOP 500 kh.MaKhachHang,kh.TenKhachHang,kh.SoDT,tk.Gmail,tk.[User],tk.VaiTro,tk.TrangThai AS TrangThaiTaiKhoan,(SELECT COUNT(*) FROM dbo.DON_HANG dh WHERE dh.MaKhachHang=kh.MaKhachHang) AS SoDon,(SELECT ISNULL(SUM(TongTien),0) FROM dbo.DON_HANG dh WHERE dh.MaKhachHang=kh.MaKhachHang AND dh.TT_GiaoHang<>N'Đã hủy') AS TongChi FROM dbo.KHACH_HANG kh LEFT JOIN dbo.TAI_KHOAN tk ON tk.MaKhachHang=kh.MaKhachHang WHERE ISNULL(tk.VaiTro,N'KhachHang')<>N'QuanTri' ORDER BY kh.MaKhachHang DESC`); res.json({ success: true, data: result.recordset }); }
  catch (error) { fail(res, error, 'listCustomers'); }
};
exports.updateCustomerStatus = async (req, res) => {
  try {
    if (!['Hoạt động','Bị khóa'].includes(req.body.status)) { const error = new Error('Trạng thái tài khoản không hợp lệ.'); error.status = 400; throw error; }
    if (Number(req.params.id) === Number(req.user.maKhachHang)) { const error = new Error('Không thể khóa tài khoản quản trị đang sử dụng.'); error.status = 409; throw error; }
    const pool=await getPool(); const result=await pool.request().input('id',sql.Int,Number(req.params.id)).input('status',sql.NVarChar(50),req.body.status).query('UPDATE dbo.TAI_KHOAN SET TrangThai=@status WHERE MaKhachHang=@id AND VaiTro<>N\'QuanTri\'; SELECT @@ROWCOUNT AS updated');
    if (!result.recordset[0]?.updated) { const error=new Error('Không tìm thấy khách hàng hoặc tài khoản có quyền quản trị.'); error.status=404; throw error; }
    res.json({success:true,message:'Đã cập nhật trạng thái tài khoản.'});
  } catch(error) { fail(res,error,'updateCustomerStatus'); }
};

exports.listCoupons = async (req, res) => {
  try { const pool = await getPool(); const result = await pool.query('SELECT MaGiamGia,TenMaGG,MoTa,SoLuong,NgayBatDau,NgayKetThuc,TrangThai,LoaiGiam,GiaTriGiam,DonToiThieu,GiamToiDa FROM dbo.GIAM_GIA ORDER BY MaGiamGia DESC'); res.json({ success: true, data: result.recordset }); }
  catch (error) { fail(res, error, 'listCoupons'); }
};
exports.saveCoupon = async (req, res) => {
  try {
    const id = req.params.id ? Number(req.params.id) : null; const body = req.body;
    const code = requiredText(body.tenMaGG, 'Mã giảm giá', 100).toUpperCase();
    const quantity = Math.max(0, Math.floor(Number(body.soLuong) || 0)); const value = positiveMoney(body.giaTriGiam, 'Giá trị giảm');
    const type = body.loaiGiam === 'PHAN_TRAM' ? 'PHAN_TRAM' : 'TIEN';
    const start = String(body.ngayBatDau || '').slice(0, 10); const end = String(body.ngayKetThuc || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) { const error = new Error('Vui lòng chọn khoảng ngày hợp lệ.'); error.status = 400; throw error; }
    if (type === 'PHAN_TRAM' && value > 100) { const error = new Error('Mức giảm phần trăm tối đa là 100%.'); error.status = 400; throw error; }
    const pool = await getPool(); const couponId = id || await nextId(pool, 'GIAM_GIA', 'MaGiamGia');
    const status = body.trangThai === 'Tạm dừng' ? 'Tạm dừng' : 'Đang áp dụng';
    await pool.request().input('id', sql.Int, couponId).input('code', sql.NVarChar(100), code).input('description', sql.NVarChar(300), String(body.moTa || '').slice(0,300)).input('quantity', sql.Int, quantity).input('start', sql.Date, start).input('end', sql.Date, end).input('status', sql.NVarChar(50), status).input('type', sql.NVarChar(20), type).input('value', sql.Decimal(18,2), value).input('min', sql.Decimal(18,2), positiveMoney(body.donToiThieu || 0, 'Đơn tối thiểu')).input('max', sql.Decimal(18,2), body.giamToiDa ? positiveMoney(body.giamToiDa, 'Giảm tối đa') : null).query(id ? `UPDATE dbo.GIAM_GIA SET TenMaGG=@code,MoTa=@description,SoLuong=@quantity,NgayBatDau=@start,NgayKetThuc=@end,TrangThai=@status,LoaiGiam=@type,GiaTriGiam=@value,DonToiThieu=@min,GiamToiDa=@max WHERE MaGiamGia=@id` : `INSERT INTO dbo.GIAM_GIA(MaGiamGia,TenMaGG,MoTa,SoLuong,NgayBatDau,NgayKetThuc,TrangThai,LoaiGiam,GiaTriGiam,DonToiThieu,GiamToiDa) VALUES(@id,@code,@description,@quantity,@start,@end,@status,@type,@value,@min,@max)`);
    res.status(id ? 200 : 201).json({ success: true, message: id ? 'Đã cập nhật mã giảm giá.' : 'Đã tạo mã giảm giá.' });
  } catch (error) { fail(res, error, 'saveCoupon'); }
};
exports.deleteCoupon = async (req, res) => {
  try { const pool = await getPool(); const result = await pool.request().input('id', sql.Int, Number(req.params.id)).query(`IF EXISTS(SELECT 1 FROM dbo.DON_HANG WHERE MaGiamGia=@id) UPDATE dbo.GIAM_GIA SET TrangThai=N'Tạm dừng',SoLuong=0 WHERE MaGiamGia=@id ELSE DELETE dbo.GIAM_GIA WHERE MaGiamGia=@id; SELECT @@ROWCOUNT AS affected`); res.json({ success: true, message: 'Đã ngừng/xóa mã giảm giá.' }); }
  catch (error) { fail(res, error, 'deleteCoupon'); }
};
