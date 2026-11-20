/*
 Fresh Garden SQL Server - file khoi tao database day du
 - Tao schema theo dung quan he trong so do entity hien co.
 - Moi loai con co dung 5 san pham va moi san pham co mot anh.
 - Cac anh san pham khong trung URL; URL thuoc CDN Fresh Garden.
 - Ton kho duoc quan ly rieng theo tung san pham tai tung cua hang.
 - File nay DROP va tao lai FreshGardenDB. File phan quyen
   Migration_Admin_Commerce.sql duoc giu rieng.
*/

GO
IF DB_ID(N'FreshGardenDB') IS NOT NULL
BEGIN
  ALTER DATABASE FreshGardenDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE FreshGardenDB;
END;
GO
CREATE DATABASE FreshGardenDB;
GO
USE FreshGardenDB;
GO

CREATE TABLE dbo.LOAI_CHA (MaLoaiCha INT NOT NULL PRIMARY KEY, TenLoaiCha NVARCHAR(150) NOT NULL);
GO

CREATE TABLE dbo.LOAI_CON (MaLoai INT NOT NULL PRIMARY KEY, MaLoaiCha INT NOT NULL, TenLoai NVARCHAR(150) NOT NULL, CONSTRAINT FK_LOAI_CON_LOAI_CHA FOREIGN KEY(MaLoaiCha) REFERENCES LOAI_CHA(MaLoaiCha));
GO

CREATE TABLE dbo.SAN_PHAM (MaSP INT NOT NULL PRIMARY KEY, MaLoai INT NOT NULL, TenSP NVARCHAR(200) NOT NULL, DonGia DECIMAL(18,2) NOT NULL, DonViTinh NVARCHAR(50) NULL, MoTa NVARCHAR(500) NULL, KhoiLuong DECIMAL(10,2) NULL, KichThuoc NVARCHAR(100) NULL, CONSTRAINT FK_SAN_PHAM_LOAI_CON FOREIGN KEY(MaLoai) REFERENCES LOAI_CON(MaLoai));
GO

CREATE TABLE dbo.TIN_TUC (MaTinTuc INT NOT NULL PRIMARY KEY, TieuDe NVARCHAR(250) NOT NULL, NoiDung NVARCHAR(1000) NULL, NgayDang DATETIME2 NOT NULL);
GO

CREATE TABLE dbo.GIAM_GIA (MaGiamGia INT NOT NULL PRIMARY KEY, NgayBatDau DATE NOT NULL, NgayKetThuc DATE NOT NULL, SoLuong INT NOT NULL, TenMaGG NVARCHAR(100) NOT NULL, MoTa NVARCHAR(300) NULL, TrangThai NVARCHAR(50) NOT NULL);
GO

CREATE TABLE dbo.KHACH_HANG (MaKhachHang INT NOT NULL PRIMARY KEY, TenKhachHang NVARCHAR(150) NOT NULL, GioiTinh NVARCHAR(20) NULL, NgaySinh DATE NULL, SoDT VARCHAR(20) NULL, LichSuGD NVARCHAR(300) NULL);
GO

CREATE TABLE dbo.TAI_KHOAN ([User] NVARCHAR(100) NOT NULL PRIMARY KEY, MaKhachHang INT NOT NULL UNIQUE, [Password] NVARCHAR(255) NOT NULL, Gmail NVARCHAR(254) NOT NULL UNIQUE, TrangThai NVARCHAR(50) NOT NULL, VaiTro NVARCHAR(30) NOT NULL CONSTRAINT DF_TAI_KHOAN_VaiTro DEFAULT N'KhachHang', CONSTRAINT FK_TAI_KHOAN_KHACH_HANG FOREIGN KEY(MaKhachHang) REFERENCES KHACH_HANG(MaKhachHang));
GO

CREATE TABLE dbo.DIA_CHI (MaDiaChi INT NOT NULL PRIMARY KEY, NguoiNhan NVARCHAR(150) NOT NULL, SoDT VARCHAR(20) NOT NULL, DiaChi NVARCHAR(300) NOT NULL, MacDinh BIT NOT NULL, MaKhachHang INT NOT NULL, CONSTRAINT FK_DIA_CHI_KHACH_HANG FOREIGN KEY(MaKhachHang) REFERENCES KHACH_HANG(MaKhachHang));
GO

CREATE TABLE dbo.GIO_HANG (MaGioHang INT NOT NULL PRIMARY KEY, NgayTao DATETIME2 NOT NULL, TrangThai NVARCHAR(50) NOT NULL, MaKhachHang INT NOT NULL UNIQUE, CONSTRAINT FK_GIO_HANG_KHACH_HANG FOREIGN KEY(MaKhachHang) REFERENCES KHACH_HANG(MaKhachHang));
GO

CREATE TABLE dbo.CUA_HANG (MaCuaHang INT NOT NULL PRIMARY KEY, TenCuaHang NVARCHAR(200) NOT NULL, SoDT VARCHAR(20) NULL, Email NVARCHAR(254) NULL, MoTa NVARCHAR(300) NULL, DiaChi NVARCHAR(300) NOT NULL);
GO

CREATE TABLE dbo.CUAHANG_SANPHAM (MaCuaHang INT NOT NULL, MaSP INT NOT NULL, SoLuongCo INT NOT NULL, CONSTRAINT PK_CUAHANG_SANPHAM PRIMARY KEY(MaCuaHang,MaSP), CONSTRAINT CK_CUAHANG_SANPHAM_SoLuongCo_NonNegative CHECK(SoLuongCo >= 0), CONSTRAINT FK_CSP_CUA_HANG FOREIGN KEY(MaCuaHang) REFERENCES CUA_HANG(MaCuaHang), CONSTRAINT FK_CSP_SAN_PHAM FOREIGN KEY(MaSP) REFERENCES SAN_PHAM(MaSP));
GO

CREATE TABLE dbo.ANH (MaAnh INT NOT NULL PRIMARY KEY, MaTinTuc INT NULL, MaSP INT NULL, DuongDan NVARCHAR(500) NOT NULL, CONSTRAINT FK_ANH_TIN_TUC FOREIGN KEY(MaTinTuc) REFERENCES TIN_TUC(MaTinTuc), CONSTRAINT FK_ANH_SAN_PHAM FOREIGN KEY(MaSP) REFERENCES SAN_PHAM(MaSP), CONSTRAINT CK_ANH_DoiTuong CHECK(MaTinTuc IS NOT NULL OR MaSP IS NOT NULL));
GO

CREATE TABLE dbo.SP_GH (MaSP INT NOT NULL, MaGioHang INT NOT NULL, SoLuong INT NOT NULL, DonGia DECIMAL(18,2) NOT NULL, CONSTRAINT PK_SP_GH PRIMARY KEY(MaSP,MaGioHang), CONSTRAINT FK_SP_GH_SAN_PHAM FOREIGN KEY(MaSP) REFERENCES SAN_PHAM(MaSP), CONSTRAINT FK_SP_GH_GIO_HANG FOREIGN KEY(MaGioHang) REFERENCES GIO_HANG(MaGioHang));
GO

CREATE TABLE dbo.DON_HANG (MaDH INT NOT NULL PRIMARY KEY, MaDiaChi INT NOT NULL, MaGiamGia INT NULL, MaKhachHang INT NOT NULL, TT_GiaoHang NVARCHAR(50) NOT NULL, TongTien DECIMAL(18,2) NOT NULL, HT_VanChuyen NVARCHAR(100) NULL, HT_ThanhToan NVARCHAR(100) NULL, ThoiGianDat DATETIME2 NOT NULL, GhiChu NVARCHAR(300) NULL, CONSTRAINT FK_DON_HANG_DIA_CHI FOREIGN KEY(MaDiaChi) REFERENCES DIA_CHI(MaDiaChi), CONSTRAINT FK_DON_HANG_GIAM_GIA FOREIGN KEY(MaGiamGia) REFERENCES GIAM_GIA(MaGiamGia), CONSTRAINT FK_DON_HANG_KHACH_HANG FOREIGN KEY(MaKhachHang) REFERENCES KHACH_HANG(MaKhachHang));
GO

CREATE TABLE dbo.DH_SP (MaSP INT NOT NULL, MaDH INT NOT NULL, SoLuong INT NOT NULL, DonGia DECIMAL(18,2) NOT NULL, ThanhTien DECIMAL(18,2) NOT NULL, CONSTRAINT PK_DH_SP PRIMARY KEY(MaSP,MaDH), CONSTRAINT FK_DH_SP_SAN_PHAM FOREIGN KEY(MaSP) REFERENCES SAN_PHAM(MaSP), CONSTRAINT FK_DH_SP_DON_HANG FOREIGN KEY(MaDH) REFERENCES DON_HANG(MaDH));
GO

CREATE TABLE dbo.THANH_TOAN (MaThanhToan INT NOT NULL PRIMARY KEY, PhuongThuc NVARCHAR(100) NOT NULL, SoTien DECIMAL(18,2) NOT NULL, ThoiGian DATETIME2 NOT NULL, TrangThai NVARCHAR(50) NOT NULL, MaGiaoDich NVARCHAR(100) NULL, MaDH INT NOT NULL, CONSTRAINT FK_THANH_TOAN_DON_HANG FOREIGN KEY(MaDH) REFERENCES DON_HANG(MaDH));
GO

CREATE TABLE dbo.DANH_GIA (MaDG INT NOT NULL PRIMARY KEY, SoSao TINYINT NOT NULL, NoiDung NVARCHAR(500) NULL, NgayDanhGia DATETIME2 NOT NULL, TrangThai NVARCHAR(50) NOT NULL, MaKhachHang INT NOT NULL, MaSP INT NOT NULL, MaDH INT NOT NULL, CONSTRAINT CK_DANH_GIA_SoSao CHECK(SoSao BETWEEN 1 AND 5), CONSTRAINT FK_DANH_GIA_KHACH_HANG FOREIGN KEY(MaKhachHang) REFERENCES KHACH_HANG(MaKhachHang), CONSTRAINT FK_DANH_GIA_SAN_PHAM FOREIGN KEY(MaSP) REFERENCES SAN_PHAM(MaSP), CONSTRAINT FK_DANH_GIA_DON_HANG FOREIGN KEY(MaDH) REFERENCES DON_HANG(MaDH));
GO

CREATE TABLE dbo.PHIEN_CHAT (MaPhien INT NOT NULL PRIMARY KEY, MaKhachHang INT NOT NULL, ThoiGianBatDau DATETIME2 NOT NULL, ThoiGianKetThuc DATETIME2 NULL, TrangThai NVARCHAR(50) NOT NULL, CONSTRAINT FK_PHIEN_CHAT_KHACH_HANG FOREIGN KEY(MaKhachHang) REFERENCES KHACH_HANG(MaKhachHang));
GO

CREATE TABLE dbo.TIN_NHAN_CHAT (MaTinNhan INT NOT NULL PRIMARY KEY, MaPhien INT NOT NULL, NguoiGui NVARCHAR(30) NOT NULL, NoiDung NVARCHAR(500) NOT NULL, ThoiGianGui DATETIME2 NOT NULL, LoaiTinNhan NVARCHAR(50) NOT NULL, CONSTRAINT FK_TIN_NHAN_CHAT_PHIEN_CHAT FOREIGN KEY(MaPhien) REFERENCES PHIEN_CHAT(MaPhien));
GO

CREATE TABLE dbo.NHAT_KY_LOI (MaLoi BIGINT IDENTITY(1,1) PRIMARY KEY, ThoiGian DATETIME2 NOT NULL CONSTRAINT DF_NHAT_KY_LOI_ThoiGian DEFAULT SYSDATETIME(), PhuongThuc NVARCHAR(10) NULL, DuongDan NVARCHAR(500) NULL, MaKhachHang INT NULL, ThongBao NVARCHAR(2000) NOT NULL);
GO

INSERT INTO dbo.LOAI_CHA (MaLoaiCha,TenLoaiCha) VALUES
(1, N'Bánh kem'),
(2, N'Bánh tươi'),
(3, N'Bánh mì'),
(4, N'Bánh ngọt & tráng miệng'),
(5, N'Bánh khô & kẹo'),
(6, N'Bánh đông lạnh'),
(7, N'Đồ uống'),
(8, N'Dịch vụ');
GO

INSERT INTO dbo.LOAI_CON (MaLoai,MaLoaiCha,TenLoai) VALUES
(1, 1, N'Bánh kem 8 inch (20cm)'),
(2, 1, N'Bánh kem 6 inch (15cm)'),
(3, 1, N'Bánh kem 4 inch (10cm)'),
(4, 2, N'Bánh tươi ngọt'),
(5, 2, N'Bánh tươi mặn'),
(6, 3, N'Bánh mì gối'),
(7, 3, N'Bánh mì kẹp'),
(8, 4, N'Bánh ngọt'),
(9, 4, N'Tráng miệng'),
(10, 5, N'Bánh khô'),
(11, 5, N'Macchi by Fresh Garden'),
(12, 6, N'Bánh bao'),
(13, 6, N'Bánh pizza'),
(14, 7, N'Trà'),
(15, 7, N'Cà phê'),
(16, 7, N'Nước uống đóng chai'),
(17, 8, N'Bánh trường học'),
(18, 8, N'Phụ kiện sinh nhật');
GO

INSERT INTO dbo.SAN_PHAM (MaSP,MaLoai,TenSP,DonGia,DonViTinh,MoTa,KhoiLuong,KichThuoc) VALUES
(1, 1, N'Bánh kem Mây ngọc', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 8 inch (20cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(2, 1, N'Bánh kem Cara cà phê', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 8 inch (20cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(3, 1, N'Bánh kem Mây trắng', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 8 inch (20cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(4, 1, N'Bánh kem Sương mai', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 8 inch (20cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(5, 1, N'Bánh kem Hổ phách', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 8 inch (20cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(6, 2, N'Bánh kem Mây vàng', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 6 inch (15cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(7, 2, N'Bánh kem Mây hồng', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 6 inch (15cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(8, 2, N'Bánh kem Vàng anh', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 6 inch (15cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(9, 2, N'Bánh kem Mai mơ', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 6 inch (15cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(10, 2, N'Bánh kem Cara-men-say', 350000, N'cái', N'Sản phẩm thuộc Bánh kem 6 inch (15cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(11, 3, N'Bánh kem Mây sữa', 160000, N'cái', N'Sản phẩm thuộc Bánh kem 4 inch (10cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(12, 3, N'Bánh kem Hương mật', 160000, N'cái', N'Sản phẩm thuộc Bánh kem 4 inch (10cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(13, 3, N'Bánh kem Kỳ lân kỳ diệu', 160000, N'cái', N'Sản phẩm thuộc Bánh kem 4 inch (10cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(14, 3, N'Bánh kem Bông tuyết', 160000, N'cái', N'Sản phẩm thuộc Bánh kem 4 inch (10cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(15, 3, N'Bánh kem Choco ngọc trai', 160000, N'cái', N'Sản phẩm thuộc Bánh kem 4 inch (10cm); ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(16, 4, N'Bánh mì kem choco', 25000, N'cái', N'Sản phẩm thuộc Bánh tươi ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(17, 4, N'Bánh mì kem trứng tan chảy', 25000, N'cái', N'Sản phẩm thuộc Bánh tươi ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(18, 4, N'Bánh mì choco giòn', 25000, N'cái', N'Sản phẩm thuộc Bánh tươi ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(19, 4, N'Bánh mì sữa chua giòn bùi', 25000, N'cái', N'Sản phẩm thuộc Bánh tươi ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(20, 4, N'Bánh scone', 25000, N'cái', N'Sản phẩm thuộc Bánh tươi ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(21, 5, N'Bánh mì thịt heo áp chảo', 35000, N'cái', N'Sản phẩm thuộc Bánh tươi mặn; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(22, 5, N'Bánh burger thịt xá xíu', 35000, N'cái', N'Sản phẩm thuộc Bánh tươi mặn; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(23, 5, N'Bánh ruốc xoắn đậm đà', 35000, N'cái', N'Sản phẩm thuộc Bánh tươi mặn; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(24, 5, N'Bánh nhân thịt đậm đà', 35000, N'cái', N'Sản phẩm thuộc Bánh tươi mặn; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(25, 5, N'Bánh mì xúc xích đậm vị', 35000, N'cái', N'Sản phẩm thuộc Bánh tươi mặn; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(26, 6, N'Bánh mì gối', 30000, N'cái', N'Sản phẩm thuộc Bánh mì gối; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(27, 6, N'Bánh gối sữa dừa choco', 30000, N'cái', N'Sản phẩm thuộc Bánh mì gối; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(28, 6, N'Bánh mì vương miện', 30000, N'cái', N'Sản phẩm thuộc Bánh mì gối; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(29, 6, N'Bánh mì giòn bơ tỏi', 30000, N'cái', N'Sản phẩm thuộc Bánh mì gối; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(30, 6, N'Bánh mì giòn caramel', 30000, N'cái', N'Sản phẩm thuộc Bánh mì gối; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(31, 7, N'Bánh sandwich bò phô mai', 35000, N'cái', N'Sản phẩm thuộc Bánh mì kẹp; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(32, 7, N'Bánh sandwich tôm thịt sốt phô mai', 35000, N'cái', N'Sản phẩm thuộc Bánh mì kẹp; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(33, 7, N'Sandwich Yo-chi tan chảy', 35000, N'cái', N'Sản phẩm thuộc Bánh mì kẹp; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(34, 7, N'Sandwich Sa-chi tan chảy', 35000, N'cái', N'Sản phẩm thuộc Bánh mì kẹp; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(35, 7, N'Bánh burger bò', 35000, N'cái', N'Sản phẩm thuộc Bánh mì kẹp; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(36, 8, N'Bánh opera', 36000, N'cái', N'Sản phẩm thuộc Bánh ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(37, 8, N'Bánh chiffon trà bá tước', 36000, N'cái', N'Sản phẩm thuộc Bánh ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(38, 8, N'Bánh madeleine sô cô la', 36000, N'cái', N'Sản phẩm thuộc Bánh ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(39, 8, N'Bánh chiffon sô cô la', 36000, N'cái', N'Sản phẩm thuộc Bánh ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(40, 8, N'Bánh chiffon vani', 36000, N'cái', N'Sản phẩm thuộc Bánh ngọt; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(41, 9, N'Bánh mousse quả mọng', 39000, N'cái', N'Sản phẩm thuộc Tráng miệng; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(42, 9, N'Bánh mousse Vải hoa hồng', 39000, N'cái', N'Sản phẩm thuộc Tráng miệng; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(43, 9, N'Bánh mousse Dừa tuyết', 39000, N'cái', N'Sản phẩm thuộc Tráng miệng; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(44, 9, N'Bánh mousse chanh leo', 39000, N'cái', N'Sản phẩm thuộc Tráng miệng; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(45, 9, N'Kem caramel', 39000, N'cái', N'Sản phẩm thuộc Tráng miệng; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(46, 10, N'Bánh quy nướng hạnh nhân 150g', 39000, N'cái', N'Sản phẩm thuộc Bánh khô; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(47, 10, N'Bánh quy dừa 150g', 39000, N'cái', N'Sản phẩm thuộc Bánh khô; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(48, 10, N'Bánh quy bơ mứt dâu 150g', 39000, N'cái', N'Sản phẩm thuộc Bánh khô; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(49, 10, N'Bánh quy sô cô la chip 150g', 39000, N'cái', N'Sản phẩm thuộc Bánh khô; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(50, 10, N'Bánh quy hạnh nhân 150g', 39000, N'cái', N'Sản phẩm thuộc Bánh khô; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(51, 11, N'Mochi nướng vừng đen', 30000, N'cái', N'Sản phẩm thuộc Macchi by Fresh Garden; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(52, 11, N'Bánh mochi Hàn Quốc', 30000, N'cái', N'Sản phẩm thuộc Macchi by Fresh Garden; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(53, 11, N'Kẹo dẻo vui vẻ', 30000, N'cái', N'Sản phẩm thuộc Macchi by Fresh Garden; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(54, 11, N'Kẹo dẻo hoa quả', 30000, N'cái', N'Sản phẩm thuộc Macchi by Fresh Garden; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(55, 11, N'Bánh phô mai que 70g', 30000, N'cái', N'Sản phẩm thuộc Macchi by Fresh Garden; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(56, 12, N'Bánh bao nhân thịt', 30000, N'cái', N'Sản phẩm thuộc Bánh bao; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(57, 12, N'Bánh bao nhân trứng sữa', 30000, N'cái', N'Sản phẩm thuộc Bánh bao; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(58, 12, N'Bánh bao nhân thịt xá xíu', 30000, N'cái', N'Sản phẩm thuộc Bánh bao; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(59, 12, N'Bánh bao nhân đậu xanh', 30000, N'cái', N'Sản phẩm thuộc Bánh bao; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(60, 12, N'Bánh bao chay sữa', 30000, N'cái', N'Sản phẩm thuộc Bánh bao; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(61, 13, N'Pizza gà nướng kiểu Thái', 49000, N'cái', N'Sản phẩm thuộc Bánh pizza; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(62, 13, N'Bánh pizza xúc xích ngô', 49000, N'cái', N'Sản phẩm thuộc Bánh pizza; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(63, 13, N'Pizza hải sản', 49000, N'cái', N'Sản phẩm thuộc Bánh pizza; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(64, 13, N'Pizza dăm bông dứa', 49000, N'cái', N'Sản phẩm thuộc Bánh pizza; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(65, 13, N'Pizza phô mai hảo hạng', 49000, N'cái', N'Sản phẩm thuộc Bánh pizza; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(66, 14, N'Trà sữa Thái xanh 350ml', 25000, N'cái', N'Sản phẩm thuộc Trà; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(67, 14, N'Trà đào 350ml', 25000, N'cái', N'Sản phẩm thuộc Trà; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(68, 14, N'Trà sữa 350ml', 25000, N'cái', N'Sản phẩm thuộc Trà; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(69, 14, N'Kombucha chanh', 25000, N'cái', N'Sản phẩm thuộc Trà; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(70, 14, N'Kombucha cà phê', 25000, N'cái', N'Sản phẩm thuộc Trà; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(71, 15, N'Cà phê muối', 30000, N'cái', N'Sản phẩm thuộc Cà phê; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(72, 15, N'Cà phê đen', 30000, N'cái', N'Sản phẩm thuộc Cà phê; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(73, 15, N'Cà phê ủ lạnh', 30000, N'cái', N'Sản phẩm thuộc Cà phê; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(74, 15, N'Cà phê latte', 30000, N'cái', N'Sản phẩm thuộc Cà phê; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(75, 15, N'Cà phê cappuccino', 30000, N'cái', N'Sản phẩm thuộc Cà phê; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(76, 16, N'Nước ion kiềm Mira pH9+ 360ml', 15000, N'cái', N'Sản phẩm thuộc Nước uống đóng chai; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(77, 16, N'Nước ion kiềm Mira pH9+ 550ml', 15000, N'cái', N'Sản phẩm thuộc Nước uống đóng chai; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(78, 16, N'Relax hương chanh', 15000, N'cái', N'Sản phẩm thuộc Nước uống đóng chai; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(79, 16, N'Antiox hương đào', 15000, N'cái', N'Sản phẩm thuộc Nước uống đóng chai; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(80, 16, N'Energy hương dâu', 15000, N'cái', N'Sản phẩm thuộc Nước uống đóng chai; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(81, 17, N'Bánh trường học bông lan', 25000, N'cái', N'Sản phẩm thuộc Bánh trường học; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(82, 17, N'Bánh trường học sữa chua', 25000, N'cái', N'Sản phẩm thuộc Bánh trường học; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(83, 17, N'Bánh trường học phô mai', 25000, N'cái', N'Sản phẩm thuộc Bánh trường học; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(84, 17, N'Bánh trường học ruốc', 25000, N'cái', N'Sản phẩm thuộc Bánh trường học; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(85, 17, N'Bánh trường học choco', 25000, N'cái', N'Sản phẩm thuộc Bánh trường học; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(86, 18, N'Nến số sinh nhật', 10000, N'cái', N'Sản phẩm thuộc Phụ kiện sinh nhật; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(87, 18, N'Bộ nến xoắn', 10000, N'cái', N'Sản phẩm thuộc Phụ kiện sinh nhật; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(88, 18, N'Dao cắt bánh', 10000, N'cái', N'Sản phẩm thuộc Phụ kiện sinh nhật; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(89, 18, N'Đĩa giấy sinh nhật', 10000, N'cái', N'Sản phẩm thuộc Phụ kiện sinh nhật; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm'),
(90, 18, N'Mũ sinh nhật', 10000, N'cái', N'Sản phẩm thuộc Phụ kiện sinh nhật; ảnh từ Fresh Garden.', 100, N'Theo sản phẩm');
GO

INSERT INTO dbo.TIN_TUC (MaTinTuc,TieuDe,NoiDung,NgayDang) VALUES
(1, N'Chúc mừng Ngày Phụ nữ Việt Nam 20/10', N'Gợi ý bánh và quà tặng dành cho người phụ nữ bạn yêu quý.', N'2026-02-02T09:00:00'),
(2, N'Tưng bừng khai trương cửa hàng mới', N'Thông tin khai trương cửa hàng Fresh Garden.', N'2026-03-03T09:00:00'),
(3, N'Bánh kem Caramel muối hồng – thêm vị mới', N'Giới thiệu hương vị bánh kem mới.', N'2026-04-04T09:00:00'),
(4, N'Ngọt ngào gửi trao – bánh kem cho ngày đặc biệt', N'Gợi ý chọn bánh kem cho những dịp đáng nhớ.', N'2026-05-05T09:00:00'),
(5, N'Mua 1 tặng 1 bánh Trung thu', N'Chương trình ưu đãi theo thời gian áp dụng.', N'2026-06-06T09:00:00'),
(6, N'Bánh Trung thu Fresh Garden 2026', N'Khám phá các hương vị bánh mùa trăng.', N'2026-07-07T09:00:00'),
(7, N'Bánh tươi mỗi ngày', N'Chia sẻ về các dòng bánh tươi.', N'2026-08-08T09:00:00'),
(8, N'Bí quyết chọn bánh sinh nhật', N'Một số lưu ý khi chọn kích thước và hương vị.', N'2026-09-09T09:00:00'),
(9, N'Gợi ý bánh cho buổi trà chiều', N'Các loại bánh ngọt dùng cùng trà.', N'2026-01-10T09:00:00'),
(10, N'Bánh mì tiện lợi cho bữa sáng', N'Gợi ý lựa chọn bánh mì nhanh gọn.', N'2026-02-11T09:00:00'),
(11, N'Khám phá dòng bánh mousse', N'Bánh mousse với kết cấu mềm mịn.', N'2026-03-12T09:00:00'),
(12, N'Set bánh dành tặng đồng nghiệp', N'Gợi ý hộp bánh để chia sẻ tại văn phòng.', N'2026-04-13T09:00:00'),
(13, N'Cách bảo quản bánh đúng cách', N'Lưu ý bảo quản theo từng loại bánh.', N'2026-05-14T09:00:00'),
(14, N'Thông tin đặt bánh trước', N'Khuyến nghị đặt bánh kem trước dịp lễ.', N'2026-06-15T09:00:00'),
(15, N'Bánh theo mùa tại Fresh Garden', N'Các sản phẩm theo mùa có thể thay đổi.', N'2026-07-16T09:00:00'),
(16, N'Gợi ý bánh cho tiệc gia đình', N'Chọn nhiều loại bánh cho buổi gặp mặt.', N'2026-08-17T09:00:00'),
(17, N'Bánh ngọt và tráng miệng', N'Tổng hợp các loại bánh ngọt.', N'2026-09-18T09:00:00'),
(18, N'Chọn bánh cho ngày sinh nhật trẻ em', N'Gợi ý mẫu bánh phù hợp cho trẻ.', N'2026-01-19T09:00:00'),
(19, N'Ưu đãi dành cho khách hàng', N'Thông tin chương trình khuyến mại.', N'2026-02-20T09:00:00'),
(20, N'Fresh Garden – bánh tươi mỗi ngày', N'Thông tin giới thiệu thương hiệu.', N'2026-03-21T09:00:00');
GO

INSERT INTO dbo.GIAM_GIA (MaGiamGia, NgayBatDau, NgayKetThuc, SoLuong, TenMaGG, MoTa, TrangThai) VALUES
(1, N'2026-02-01', N'2027-02-28', 55, N'FRESH01', N'Giảm 10% cho đơn hàng bánh ngọt từ 150.000 VNĐ', N'Đang áp dụng'),
(2, N'2026-03-01', N'2027-03-28', 60, N'FRESH02', N'Giảm 15.000 VNĐ cho đơn hàng từ 100.000 VNĐ', N'Đang áp dụng'),
(3, N'2026-04-01', N'2027-04-28', 65, N'FRESH03', N'Giảm 20% khi mua các loại bánh kem sinh nhật', N'Đang áp dụng'),
(4, N'2026-05-01', N'2027-05-28', 70, N'FRESH04', N'Giảm 10% cho khách hàng đặt bánh trực tuyến', N'Đang áp dụng'),
(5, N'2026-06-01', N'2027-06-28', 75, N'FRESH05', N'Giảm 25.000 VNĐ cho đơn hàng từ 200.000 VNĐ', N'Đang áp dụng'),
(6, N'2026-07-01', N'2027-07-28', 80, N'FRESH06', N'Ưu đãi giảm 15% khi mua bánh mì và bánh ngọt', N'Đang áp dụng'),
(7, N'2026-08-01', N'2027-08-28', 85, N'FRESH07', N'Giảm 30.000 VNĐ cho đơn hàng bánh từ 250.000 VNĐ', N'Đang áp dụng'),
(8, N'2026-09-01', N'2027-09-28', 90, N'FRESH08', N'Giảm 10% cho đơn hàng đầu tiên tại Fresh Garden', N'Đang áp dụng'),
(9, N'2026-01-01', N'2027-01-28', 95, N'FRESH09', N'Giảm 20.000 VNĐ khi mua bánh ngọt từ 120.000 VNĐ', N'Đang áp dụng'),
(10, N'2026-02-01', N'2027-02-28', 100, N'FRESH10', N'Giảm 15% cho đơn hàng bánh kem từ 300.000 VNĐ', N'Đang áp dụng'),
(11, N'2026-03-01', N'2027-03-28', 105, N'FRESH11', N'Ưu đãi giảm 10% khi mua từ 3 sản phẩm bánh trở lên', N'Đang áp dụng'),
(12, N'2026-04-01', N'2027-04-28', 110, N'FRESH12', N'Giảm 40.000 VNĐ cho đơn hàng từ 350.000 VNĐ', N'Đang áp dụng'),
(13, N'2026-05-01', N'2027-05-28', 115, N'FRESH13', N'Giảm 12% cho các sản phẩm bánh mì tươi', N'Đang áp dụng'),
(14, N'2026-06-01', N'2027-06-28', 120, N'FRESH14', N'Giảm 15% khi đặt bánh kem cho dịp sinh nhật', N'Đang áp dụng'),
(15, N'2026-07-01', N'2027-07-28', 125, N'FRESH15', N'Giảm 25.000 VNĐ cho đơn hàng từ 180.000 VNĐ', N'Đang áp dụng'),
(16, N'2026-08-01', N'2027-08-28', 130, N'FRESH16', N'Ưu đãi giảm 10% cho khách hàng thân thiết', N'Đang áp dụng'),
(17, N'2026-09-01', N'2027-09-28', 135, N'FRESH17', N'Giảm 20% khi mua các sản phẩm bánh ngọt được chọn', N'Đang áp dụng'),
(18, N'2026-01-01', N'2027-01-28', 140, N'FRESH18', N'Giảm 50.000 VNĐ cho đơn hàng từ 400.000 VNĐ', N'Đang áp dụng'),
(19, N'2026-02-01', N'2027-02-28', 145, N'FRESH19', N'Giảm 10% cho đơn hàng đặt bánh trực tuyến từ 150.000 VNĐ', N'Đang áp dụng'),
(20, N'2026-03-01', N'2027-03-28', 150, N'FRESH20', N'Giảm 15% cho đơn hàng bánh ngọt và bánh kem từ 250.000 VNĐ', N'Đang áp dụng');

GO

INSERT INTO dbo.KHACH_HANG(MaKhachHang, TenKhachHang, GioiTinh, NgaySinh, SoDT, LichSuGD) VALUES
(1, N'Nguyễn Minh Anh', N'Nữ', '1991-02-02', N'0900000001', N'Đã mua bánh sinh nhật kem tươi ngày 02/10/2026, tổng giá trị 160.000 VNĐ'),
(2, N'Trần Quốc Bảo', N'Nam', '1992-03-03', N'0900000002', N'Đã mua bánh mousse và bánh ngọt ngày 03/10/2026, tổng giá trị 350.000 VNĐ'),
(3, N'Lê Thu Hà', N'Nữ', '1993-04-04', N'0900000003', N'Đã đặt bánh kem và bánh mì ngọt ngày 04/10/2026, tổng giá trị 450.000 VNĐ'),
(4, N'Phạm Đức Long', N'Nam', '1994-05-05', N'0900000004', N'Đã mua bánh mì tươi ngày 05/10/2026, tổng giá trị 35.000 VNĐ'),
(5, N'Hoàng Ngọc Mai', N'Nữ', '1995-06-06', N'0900000005', N'Đã mua bánh ngọt ngày 06/10/2026, tổng giá trị 35.000 VNĐ'),
(6, N'Vũ Thành Nam', N'Nam', '1996-07-07', N'0900000006', N'Đã mua bánh su kem ngày 07/10/2026, tổng giá trị 69.000 VNĐ'),
(7, N'Đặng Phương Linh', N'Nữ', '1997-08-08', N'0900000007', N'Đã mua bánh ngọt ngày 08/10/2026, tổng giá trị 35.000 VNĐ'),
(8, N'Bùi Gia Huy', N'Nam', '1998-09-09', N'0900000008', N'Đã mua bánh mì tươi ngày 09/10/2026, tổng giá trị 35.000 VNĐ'),
(9, N'Đỗ Khánh Vy', N'Nữ', '1999-10-10', N'0900000009', N'Đã đặt bánh ngọt ngày 10/10/2026, tổng giá trị 35.000 VNĐ'),
(10, N'Ngô Tuấn Kiệt', N'Nam', '1990-11-11', N'0900000010', N'Đã mua bánh mì ngày 11/10/2026, tổng giá trị 15.000 VNĐ'),
(11, N'Dương Hải Yến', N'Nữ', '1991-12-12', N'0900000011', N'Đã mua bánh kem ngày 12/10/2026, tổng giá trị 36.000 VNĐ'),
(12, N'Phan Minh Đức', N'Nam', '1992-01-13', N'0900000012', N'Đã mua bánh ngọt ngày 13/10/2026, tổng giá trị 36.000 VNĐ'),
(13, N'Mai Thanh Tâm', N'Nữ', '1993-02-14', N'0900000013', N'Đã mua bánh mì ngày 14/10/2026, tổng giá trị 11.000 VNĐ'),
(14, N'Đinh Quang Hưng', N'Nam', '1994-03-15', N'0900000014', N'Đã đặt bánh ngọt ngày 15/10/2026, tổng giá trị 40.000 VNĐ'),
(15, N'Lý Bảo Ngọc', N'Nữ', '1995-04-16', N'0900000015', N'Đã mua bánh kem ngày 16/10/2026, tổng giá trị 34.000 VNĐ'),
(16, N'Cao Nhật Minh', N'Nam', '1996-05-17', N'0900000016', N'Đã mua bánh ngọt ngày 17/10/2026, tổng giá trị 34.000 VNĐ'),
(17, N'Tạ Thu Trang', N'Nữ', '1997-06-18', N'0900000017', N'Đã mua bánh mì ngày 18/10/2026, tổng giá trị 34.000 VNĐ'),
(18, N'Hồ Anh Tuấn', N'Nam', '1998-07-19', N'0900000018', N'Đã mua bánh ngọt ngày 19/10/2026, tổng giá trị 34.000 VNĐ'),
(19, N'Trương Mỹ Duyên', N'Nữ', '1999-08-20', N'0900000019', N'Đã mua bánh kem ngày 20/10/2026, tổng giá trị 30.000 VNĐ'),
(20, N'Đào Quốc Việt', N'Nam', '1990-09-21', N'0900000020', N'Đã mua bánh ngọt ngày 21/10/2026, tổng giá trị 25.000 VNĐ'),
(21, N'Nguyễn Duy Việt', N'Nam', '2005-03-01', N'0328513665', N'Tài khoản quản trị viên, quản lý sản phẩm, đơn hàng, khách hàng và hoạt động hệ thống');

GO



INSERT INTO dbo.TAI_KHOAN([User], MaKhachHang, [Password], Gmail, TrangThai,VaiTro) VALUES
(N'nma123', 1, N'nma123', N'nguyenminhanh@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'tqb123', 2, N'tqb123', N'tranquocbao@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'lth123', 3, N'lth123', N'lethuha@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'pdl123', 4, N'pdl123', N'phamduclong@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'hnm123', 5, N'hnm123', N'hoangngocmai@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'vtn123', 6, N'vtn123', N'vuthanhnam@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'dpl123', 7, N'dpl123', N'dangphuonglinh@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'bgh123', 8, N'bgh123', N'buigiahuy@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'dkv123', 9, N'dkv123', N'dokhanhvy@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'ntk123', 10, N'ntk123', N'ngotankiet@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'dhy123', 11, N'dhy123', N'duonghaiyen@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'pmd123', 12, N'pmd123', N'phanminhduc@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'mtt123', 13, N'mtt123', N'maithanhtam@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'dqh123', 14, N'dqh123', N'dinhquanghung@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'lbn123', 15, N'lbn123', N'lybaongoc@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'cnm123', 16, N'cnm123', N'conhatminh@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'ttt123', 17, N'ttt123', N'tathutrang@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'hat123', 18, N'hat123', N'hoanhtuan@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'tmd123', 19, N'tmd123', N'truongmyduyen@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'dqv123', 20, N'dqv123', N'daoquocviet@gmail.com', N'Hoạt động',N'Khách hàng'),
(N'ndv123', 21, N'ndv123', N'nguyenduyviet@gmail.com', N'Hoạt động',N'QuanTri');
GO



INSERT INTO dbo.DIA_CHI (MaDiaChi, NguoiNhan, SoDT, DiaChi, MacDinh, MaKhachHang) VALUES
(1, N'Nguyễn Minh Anh', N'0980000001', N'Số 15 ngõ 100 Nguyễn Trãi, Thanh Xuân, Hà Nội', 1, 1),
(2, N'Trần Quốc Bảo', N'0980000002', N'Số 28 Hồ Tùng Mậu, Cầu Giấy, Hà Nội', 1, 2),
(3, N'Lê Thu Hà', N'0980000003', N'Số 42 ngõ 68 Cầu Giấy, Cầu Giấy, Hà Nội', 1, 3),
(4, N'Phạm Đức Long', N'0980000004', N'Số 10 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội', 1, 4),
(5, N'Hoàng Ngọc Mai', N'0980000005', N'Số 35 Chùa Láng, Đống Đa, Hà Nội', 1, 5),
(6, N'Vũ Thành Nam', N'0980000006', N'Số 18 Nguyễn Khánh Toàn, Cầu Giấy, Hà Nội', 1, 6),
(7, N'Đặng Phương Linh', N'0980000007', N'Số 56 Kim Mã, Ba Đình, Hà Nội', 1, 7),
(8, N'Bùi Gia Huy', N'0980000008', N'Số 21 Bạch Mai, Hai Bà Trưng, Hà Nội', 1, 8),
(9, N'Đỗ Khánh Vy', N'0980000009', N'Số 67 Láng Hạ, Đống Đa, Hà Nội', 1, 9),
(10, N'Ngô Tuấn Kiệt', N'0980000010', N'Số 12 Trần Duy Hưng, Cầu Giấy, Hà Nội', 1, 10),
(11, N'Dương Hải Yến', N'0980000011', N'Số 45 Xuân Thủy, Cầu Giấy, Hà Nội', 1, 11),
(12, N'Phan Minh Đức', N'0980000012', N'Số 30 Nguyễn Lương Bằng, Đống Đa, Hà Nội', 1, 12),
(13, N'Mai Thanh Tâm', N'0980000013', N'Số 16 Tây Sơn, Đống Đa, Hà Nội', 1, 13),
(14, N'Đinh Quang Hưng', N'0980000014', N'Số 88 Minh Khai, Hai Bà Trưng, Hà Nội', 1, 14),
(15, N'Lý Bảo Ngọc', N'0980000015', N'Số 25 Nguyễn Văn Cừ, Long Biên, Hà Nội', 1, 15),
(16, N'Cao Nhật Minh', N'0980000016', N'Số 40 Hoàng Quốc Việt, Cầu Giấy, Hà Nội', 1, 16),
(17, N'Tạ Thu Trang', N'0980000017', N'Số 19 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội', 1, 17),
(18, N'Hồ Anh Tuấn', N'0980000018', N'Số 52 Giải Phóng, Hoàng Mai, Hà Nội', 1, 18),
(19, N'Trương Mỹ Duyên', N'0980000019', N'Số 33 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội', 1, 19),
(20, N'Đào Quốc Việt', N'0980000020', N'Số 72 Đại La, Hai Bà Trưng, Hà Nội', 1, 20);
GO

INSERT INTO dbo.GIO_HANG (MaGioHang,NgayTao,TrangThai,MaKhachHang) VALUES
(1, N'2026-10-02T10:00:00', N'Đang hoạt động', 1),
(2, N'2026-10-03T10:00:00', N'Đang hoạt động', 2),
(3, N'2026-10-04T10:00:00', N'Đang hoạt động', 3),
(4, N'2026-10-05T10:00:00', N'Đang hoạt động', 4),
(5, N'2026-10-06T10:00:00', N'Đang hoạt động', 5),
(6, N'2026-10-07T10:00:00', N'Đang hoạt động', 6),
(7, N'2026-10-08T10:00:00', N'Đang hoạt động', 7),
(8, N'2026-10-09T10:00:00', N'Đang hoạt động', 8),
(9, N'2026-10-10T10:00:00', N'Đang hoạt động', 9),
(10, N'2026-10-11T10:00:00', N'Đang hoạt động', 10),
(11, N'2026-10-12T10:00:00', N'Đang hoạt động', 11),
(12, N'2026-10-13T10:00:00', N'Đang hoạt động', 12),
(13, N'2026-10-14T10:00:00', N'Đang hoạt động', 13),
(14, N'2026-10-15T10:00:00', N'Đang hoạt động', 14),
(15, N'2026-10-16T10:00:00', N'Đang hoạt động', 15),
(16, N'2026-10-17T10:00:00', N'Đang hoạt động', 16),
(17, N'2026-10-18T10:00:00', N'Đang hoạt động', 17),
(18, N'2026-10-19T10:00:00', N'Đang hoạt động', 18),
(19, N'2026-10-20T10:00:00', N'Đang hoạt động', 19),
(20, N'2026-10-21T10:00:00', N'Đang hoạt động', 20);
GO

INSERT INTO dbo.CUA_HANG(MaCuaHang, TenCuaHang, SoDT, Email, MoTa, DiaChi) VALUES
(1, N'Cửa hàng 111 Núi Trúc', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden tại khu vực Ba Đình', N'Số 111 Núi Trúc, Ba Đình, Hà Nội'),

(2, N'Cửa hàng 106 H4 Thành Công', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden tại khu Thành Công', N'Số 106 Thành Công, Ba Đình, Hà Nội'),

(3, N'Cửa hàng Vinschool Metropolis Liễu Giai', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden tại khu đô thị Metropolis', N'Số 29 Liễu Giai, Ba Đình, Hà Nội'),

(4, N'Cửa hàng 16 Hàng Cót', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden tại khu phố cổ', N'Số 16 Hàng Cót, Hoàn Kiếm, Hà Nội'),

(5, N'Cửa hàng 42W Lý Thường Kiệt', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden tại khu vực trung tâm Hà Nội', N'Số 42W Lý Thường Kiệt, Hoàn Kiếm, Hà Nội'),

(6, N'Cửa hàng 58 Tràng Thi', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden tại phố Tràng Thi', N'Số 58 Tràng Thi, Hoàn Kiếm, Hà Nội'),

(7, N'Cửa hàng 112 C2 Phạm Ngọc Thạch', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden tại khu vực Phạm Ngọc Thạch', N'Số 112 C2 Phạm Ngọc Thạch, Đống Đa, Hà Nội'),

(8, N'Cửa hàng 34 Hoàng Cầu', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden tại khu vực Hoàng Cầu', N'Số 34 Hoàng Cầu, Đống Đa, Hà Nội'),

(9, N'Cửa hàng 20 Láng Hạ', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden trên tuyến phố Láng Hạ', N'Số 20 Láng Hạ, Đống Đa, Hà Nội'),

(10, N'Cửa hàng 112B4 Tôn Thất Tùng', N'024385638567', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden tại khu vực Tôn Thất Tùng', N'Số 112 B4 Tôn Thất Tùng, Đống Đa, Hà Nội'),

(11, N'Cửa hàng 247 Xã Đàn', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden trên phố Xã Đàn', N'Số 247 Xã Đàn, Đống Đa, Hà Nội'),

(12, N'Cửa hàng 110 Thái Thịnh', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden tại khu vực Thái Thịnh', N'Số 110 Thái Thịnh, Đống Đa, Hà Nội'),

(13, N'Cửa hàng 106 Chùa Láng', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden tại phố Chùa Láng', N'Số 106 Chùa Láng, Đống Đa, Hà Nội'),

(14, N'Cửa hàng Vinmec Times City', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden tại Bệnh viện Vinmec Times City', N'Tầng 1 Bệnh viện Vinmec Times City, số 458 Minh Khai, Hai Bà Trưng, Hà Nội'),

(15, N'Cửa hàng T6 Times City', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden tại khu đô thị Times City', N'Tòa nhà T6 Times City, số 458 Minh Khai, Hai Bà Trưng, Hà Nội'),

(16, N'Cửa hàng 360 Bạch Mai', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden trên phố Bạch Mai', N'Số 360 Bạch Mai, Hai Bà Trưng, Hà Nội'),

(17, N'Cửa hàng 78 Kim Ngưu', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden tại khu vực Kim Ngưu', N'Số 78 Kim Ngưu, Hai Bà Trưng, Hà Nội'),

(18, N'Cửa hàng 47 Lò Đúc', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden trên phố Lò Đúc', N'Số 47 Lò Đúc, Hai Bà Trưng, Hà Nội'),

(19, N'Cửa hàng 22A Trần Duy Hưng', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng Fresh Garden tại khu vực Trần Duy Hưng', N'Số 20C Trần Duy Hưng, Cầu Giấy, Hà Nội'),

(20, N'Cửa hàng 44 Nguyễn Khánh Toàn', N'02438563856', N'cskh@freshgarden.vn', N'Cửa hàng bánh Fresh Garden trên phố Nguyễn Khánh Toàn', N'Số 44 Nguyễn Khánh Toàn, Cầu Giấy, Hà Nội');
GO


-- Khoi tao ton kho: moi san pham co 10 don vi tai moi cua hang.
INSERT INTO dbo.CUAHANG_SANPHAM (MaCuaHang, MaSP, SoLuongCo)
SELECT ch.MaCuaHang, sp.MaSP, 10
FROM dbo.CUA_HANG AS ch
CROSS JOIN dbo.SAN_PHAM AS sp;
GO

-- Tu dong tao ban ghi ton kho 10 don vi tai moi cua hang khi them san pham moi.
CREATE TRIGGER dbo.TR_SAN_PHAM_TAO_TON_KHO
ON dbo.SAN_PHAM
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.CUAHANG_SANPHAM (MaCuaHang, MaSP, SoLuongCo)
    SELECT ch.MaCuaHang, i.MaSP, 10
    FROM inserted AS i
    CROSS JOIN dbo.CUA_HANG AS ch
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.CUAHANG_SANPHAM AS cs
        WHERE cs.MaCuaHang = ch.MaCuaHang
          AND cs.MaSP = i.MaSP
    );
END;
GO

-- Tu dong tao ban ghi ton kho 10 don vi cho moi san pham khi them cua hang moi.
CREATE TRIGGER dbo.TR_CUA_HANG_TAO_TON_KHO
ON dbo.CUA_HANG
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.CUAHANG_SANPHAM (MaCuaHang, MaSP, SoLuongCo)
    SELECT i.MaCuaHang, sp.MaSP, 10
    FROM inserted AS i
    CROSS JOIN dbo.SAN_PHAM AS sp
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.CUAHANG_SANPHAM AS cs
        WHERE cs.MaCuaHang = i.MaCuaHang
          AND cs.MaSP = sp.MaSP
    );
END;
GO

INSERT INTO dbo.ANH (MaAnh,MaTinTuc,MaSP,DuongDan) VALUES
-- Anh san pham Fresh Garden: 90 URL khac nhau.
(1001, NULL, 1, N'https://cdn.hstatic.net/products/200000411281/1_3ede234aa96f42498e4c3760e2453a33_grande.png'),
(1002, NULL, 2, N'https://cdn.hstatic.net/products/200000411281/1_4762ba554980435789327fda4f517d49_grande.png'),
(1003, NULL, 3, N'https://cdn.hstatic.net/products/200000411281/1_5ab8694a870e4bd3bd6f0687998d587d_grande.png'),
(1004, NULL, 4, N'https://cdn.hstatic.net/products/200000411281/1_68100065b0834eeeb26d403cf062bc09_grande.png'),
(1005, NULL, 5, N'https://cdn.hstatic.net/products/200000411281/1_7312d04f2c2442b89cb23a45a9be8567_grande.png'),
(1006, NULL, 6, N'https://cdn.hstatic.net/products/200000411281/1_75f90fde3c5b4a06a6f14cd0f80be809_grande.png'),
(1007, NULL, 7, N'https://cdn.hstatic.net/products/200000411281/1_800ff80f791e4d4dabce830c94a825cc_grande.png'),
(1008, NULL, 8, N'https://cdn.hstatic.net/products/200000411281/1_8fb981a97f0147f8929b7928bd3ec329_grande.png'),
(1009, NULL, 9, N'https://cdn.hstatic.net/products/200000411281/1_997c25b021a549158288099428a42db5_grande.png'),
(1010, NULL, 10, N'https://cdn.hstatic.net/products/200000411281/1_9d12e483f8d844e981e59d7678b5554e_grande.png'),
(1011, NULL, 11, N'https://cdn.hstatic.net/products/200000411281/1_b642216e09214b38a3cf4bc2d3474bee_grande.png'),
(1012, NULL, 12, N'https://cdn.hstatic.net/products/200000411281/1_b74a7fd5534c4fc68f9c08f9ea61c17d_grande.png'),
(1013, NULL, 13, N'https://cdn.hstatic.net/products/200000411281/1_c545f7515ba44e8792beebaa2b730dc9_grande.png'),
(1014, NULL, 14, N'https://cdn.hstatic.net/products/200000411281/1_c92e0fedc3f94923a92e1d02433506ce_grande.png'),
(1015, NULL, 15, N'https://cdn.hstatic.net/products/200000411281/1_d0a7e1ee2d70403684703e45d93788f0_grande.png'),
(1016, NULL, 16, N'https://cdn.hstatic.net/products/200000411281/1_f09ed2e485b843ac97767ddda06c6fcb_grande.png'),
(1017, NULL, 17, N'https://cdn.hstatic.net/products/200000411281/1_f477bba31c434fa7b62ba1f1054f47b7_grande.png'),
(1018, NULL, 18, N'https://cdn.hstatic.net/products/200000411281/1_f805066be2d043c998a2ccfdcdc93bb5_grande.png'),
(1019, NULL, 19, N'https://cdn.hstatic.net/products/200000411281/b__m_t_d_u_tr__c_882274aadb724f60b2d1f65496e1eb64_grande.png'),
(1020, NULL, 20, N'https://cdn.hstatic.net/products/200000411281/b__ph_p_1_9b5fa59765a54f3cbc2f047449197d36_grande.png'),
(1021, NULL, 21, N'https://cdn.hstatic.net/products/200000411281/b_ng_tuy_t_4.1_2401b79ab4ee40c4a1f982ca71cd725f_grande.png'),
(1022, NULL, 22, N'https://cdn.hstatic.net/products/200000411281/b_nh_bao_nh_n_tr_ng_s_a_954ad0203b664fc5b444db63384d04df_grande.jpg'),
(1023, NULL, 23, N'https://cdn.hstatic.net/products/200000411281/b_nh_bao_th_t_4b320cd50bad48fabc796efb2687a0ba_grande.jpg'),
(1024, NULL, 24, N'https://cdn.hstatic.net/products/200000411281/b_nh_burger_th_t_x__x_u_1_e7cd8ef9912e4a21a528d17965040447_grande.png'),
(1025, NULL, 25, N'https://cdn.hstatic.net/products/200000411281/b_nh_g_i_tr_ng_1_348919480efe4047a0734977ad9fb935_grande.png'),
(1026, NULL, 26, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_ng_c_8_1_d416f27f01e041b3af4101b6d6218b34_grande.png'),
(1027, NULL, 27, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_s_a_4_1_5a191e0094b7410794b5a9565e6d3c02_grande.png'),
(1028, NULL, 28, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_tr_ng_1_4bb8f1f07de545d8b1545c326e475fb2_grande.png'),
(1029, NULL, 29, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_v_ng_6_1_a96cb688261b4de4890b553eb28dd141_grande.png'),
(1030, NULL, 30, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__gi_n_b__t_i_nh__6901cd560b6d47cfb6d9cf122653638b_grande.png'),
(1031, NULL, 31, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__gi_n_caramel_nh__6cf3abc2bd3c4b86a77ac9d42666fb1f_grande.png'),
(1032, NULL, 32, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__gi_n_v__t_m_h_m_nh__2_5d483d8f243d4c8babd72797f52532a7_grande.png'),
(1033, NULL, 33, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__th_t_heo__p_ch_o_1_09f060d1eef147e9884f631164ee13fe_grande.png'),
(1034, NULL, 34, N'https://cdn.hstatic.net/products/200000411281/b_nh_ru_c_xo_n_d_m_d___1__cae264e4b1fc495a833c72361d00c7ee_grande.png'),
(1035, NULL, 35, N'https://cdn.hstatic.net/products/200000411281/b_nh_scone_2_ac0b5f0b682d4e39aac7e015a4b487a4_grande.png'),
(1036, NULL, 36, N'https://cdn.hstatic.net/products/200000411281/b_nh_su_kem_2_7e200df34c0e42e098f60d380ecee04c_grande.png'),
(1037, NULL, 37, N'https://cdn.hstatic.net/products/200000411281/b_nh_t__i_ru_c_s_t_phomai_1_cfed638aa31749a3b70bac22861f6edc_grande.png'),
(1038, NULL, 38, N'https://cdn.hstatic.net/products/200000411281/b_nh_th_t_t__i_tr_n_v__1_6b4dfd82552e44e09b3a311a55f3e823_grande.png'),
(1039, NULL, 39, N'https://cdn.hstatic.net/products/200000411281/b_nh_x_c_x_ch_d_i_1_d9a835d8aca64424b76216ae4100b556_grande.png'),
(1040, NULL, 40, N'https://cdn.hstatic.net/products/200000411281/banh_vuong_mien_xuc_xich_1_a4d398e7d38b477aa56bf82d24431ecc_grande.png'),
(1041, NULL, 41, N'https://cdn.hstatic.net/products/200000411281/banh-chifon-socola-45_60_a8dbb7f8d26540d5b4b61bac90d536ce_grande.png'),
(1042, NULL, 42, N'https://cdn.hstatic.net/products/200000411281/banh-chifon-vani-45_60_566c13c5ddcd42c3a3a612858bd202e4_grande.png'),
(1043, NULL, 43, N'https://cdn.hstatic.net/products/200000411281/banh-chifon-vi_cam-45_60_53918478b40a4c0cb8bc894fd1cabb61_grande.png'),
(1044, NULL, 44, N'https://cdn.hstatic.net/products/200000411281/banh-mi-ruoc-to-50g-1_1eb04b9bd9624380a20fa2d15d3c894c_grande.png'),
(1045, NULL, 45, N'https://cdn.hstatic.net/products/200000411281/banh-mi-vi-cac-loai_1_6ced5353d7dd400f870b98dab40360a2_grande.png'),
(1046, NULL, 46, N'https://cdn.hstatic.net/products/200000411281/banh-mi-vi-cac-loai_1_7ea55b124a8b41698d0faa38def98593_grande.png'),
(1047, NULL, 47, N'https://cdn.hstatic.net/products/200000411281/banh-mi-vi-cac-loai_1_a2e6757fcfa44ab395e843911f2e6323_grande.png'),
(1048, NULL, 48, N'https://cdn.hstatic.net/products/200000411281/banh-mi-vi-cac-loai_1_d23bb80ebf7a4fcaa1d4c249f17a69df_grande.png'),
(1049, NULL, 49, N'https://cdn.hstatic.net/products/200000411281/banh-mi-vi-socola-50g_1_ad4e7cfe1f3d4882a39580da95168f1c_grande.png'),
(1050, NULL, 50, N'https://cdn.hstatic.net/products/200000411281/cara_c__ph__8.1_53725da3c07b4bfba489312a8f50f3fb_grande.png'),
(1051, NULL, 51, N'https://cdn.hstatic.net/products/200000411281/caramel_1_32f711becf7e4629a58babdebe8c4ef6_grande.png'),
(1052, NULL, 52, N'https://cdn.hstatic.net/products/200000411281/caramel_mu_i_h_ng_4.1_0a0acb8d50ff4cfb9a253a5164468872_grande.png'),
(1053, NULL, 53, N'https://cdn.hstatic.net/products/200000411281/d_a_1_449850db1db2450ba5aa5f0d61734d01_grande.png'),
(1054, NULL, 54, N'https://cdn.hstatic.net/products/200000411281/d_a_tr__c_eb69615af40d4cadae0d184cdf2490d3_grande.png'),
(1055, NULL, 55, N'https://cdn.hstatic.net/products/200000411281/d_m_s_u_1_410c12e46cd4423db5139ee55a714b8f_grande.png'),
(1056, NULL, 56, N'https://cdn.hstatic.net/products/200000411281/h_nh_nh_n_tr__c_8f01f94480514223bc4c58170f7679c0_grande.png'),
(1057, NULL, 57, N'https://cdn.hstatic.net/products/200000411281/h_t_d__c__i_1_2561a1f7a5ed4c85b37b0a0fa94de12e_grande.png'),
(1058, NULL, 58, N'https://cdn.hstatic.net/products/200000411281/k__l_n_k__di_u_1_b101ec16b36c4f7a8e4ce4e2c05adf28_grande.png'),
(1059, NULL, 59, N'https://cdn.hstatic.net/products/200000411281/magnific_banh-mi-goi_79pamk1jal_97e3f811af474de5988e5f13f5d250e9_grande.png'),
(1060, NULL, 60, N'https://cdn.hstatic.net/products/200000411281/mochi_n__ng_v_ng_den_c727b309b4db413f995a9a1b043d69ca_grande.png'),
(1061, NULL, 61, N'https://cdn.hstatic.net/products/200000411281/mochi_n__ng_v_ng_den_c727b309b4db413f995a9a1b043d69ca_master_766b06f9c81047589fd4f876bd67dbbf_grande.png'),
(1062, NULL, 62, N'https://cdn.hstatic.net/products/200000411281/mousse_d_a_1_a067deb3538445908ce1f93f4e90773a_grande.png'),
(1063, NULL, 63, N'https://cdn.hstatic.net/products/200000411281/n__ng_h_nh_nh_n_tr__c_d445732c05bd4d78bf2fca252fb5270e_grande.png'),
(1064, NULL, 64, N'https://cdn.hstatic.net/products/200000411281/nam_vi_t_qu_t_1_7f670e9e9fb540989ece808a5c64510f_grande.png'),
(1065, NULL, 65, N'https://cdn.hstatic.net/products/200000411281/phoi-burger-55g_1_60a54ad56b464f55a5e5f38fd77a45f7_grande.png'),
(1066, NULL, 66, N'https://cdn.hstatic.net/products/200000411281/pizza_1_f5c636d52cf04a30ad953d5eb35579ba_grande.png'),
(1067, NULL, 67, N'https://cdn.hstatic.net/products/200000411281/pizza_g__n__ng_ki_u_th_i_1_3a252cce10d244e397c206fe721ee15f_grande.png'),
(1068, NULL, 68, N'https://cdn.hstatic.net/products/200000411281/s__c__la_chip_1_90276819750340c29f0158b6bd086bc5_grande.png'),
(1069, NULL, 69, N'https://cdn.hstatic.net/products/200000411281/s__c__la_chip_tr__c_34e2d970ef1c468b816e6bcdb56282f7_grande.png'),
(1070, NULL, 70, N'https://cdn.hstatic.net/products/200000411281/sachi_v_ng_b01d7847dd3846d6b29de11e80edb15b_grande.png'),
(1071, NULL, 71, N'https://cdn.hstatic.net/products/200000411281/sandwich_b__ph__mai_1_fa710acea2234f1b9899bbe98f88b948_grande.png'),
(1072, NULL, 72, N'https://cdn.hstatic.net/products/200000411281/sandwich_t_m_1_597314f5b37349ca99b15afc14a7ed58_grande.png'),
(1073, NULL, 73, N'https://cdn.hstatic.net/products/200000411281/th_i_xanh__2__0c9fa8ec6f3346eabc406815de012822_grande.png'),
(1074, NULL, 74, N'https://cdn.hstatic.net/products/200000411281/tr__d_o_2_e864a4bf85b5499c9a580a280fcf5a8a_grande.png'),
(1075, NULL, 75, N'https://cdn.hstatic.net/products/200000411281/tr__s_a__2__24dd28258ff1402da673153726452757_grande.png'),
(1076, NULL, 76, N'https://cdn.hstatic.net/products/200000411281/x_c_x_ch_th__1_daeab8db6f6b41c499d4b9c643fe41f1_grande.png'),
(1077, NULL, 77, N'https://cdn.hstatic.net/products/200000411281/z7019750482871_290409540654dfca4a3feba6fa9c0c06_550af7827f9f45188cc03d94f0f5bf7e_grande.jpg'),
(1078, NULL, 78, N'https://cdn.hstatic.net/products/200000411281/z7019750482957_dc842c6e01b5af8ae833febea908eef2_e9ee79d6425045a1ac773d15af9a1043_grande.jpg'),
(1079, NULL, 79, N'https://product.hstatic.net/200000411281/product/amber_spirit_6_1_4bde9c0073e746339af994c3ab0a5362_grande.png'),
(1080, NULL, 80, N'https://product.hstatic.net/200000411281/product/banh_chiffon_tra_ba_tuoc_2_eccb2571ac36478ca65bea618a3432b4_grande.png'),
(1081, NULL, 81, N'https://product.hstatic.net/200000411281/product/banh_chuoi_hat_oc_cho_2_ea410f024cd7472eab9b744a070a3378_grande.png'),
(1082, NULL, 82, N'https://product.hstatic.net/200000411281/product/banh_madeleine_so_co_la_2_1fa8c60b27d74df88ffc5e07b90392eb_grande.png'),
(1083, NULL, 83, N'https://product.hstatic.net/200000411281/product/banh_quy_kieu_my_2_41bb894138a545698447d46ea3f4fcbd_grande.png'),
(1084, NULL, 84, N'https://product.hstatic.net/200000411281/product/banh_tai_voi_2_eccfa9bf67bc47f2a444986e77a8cea0_grande.png'),
(1085, NULL, 85, N'https://product.hstatic.net/200000411281/product/bo_go_full_v2_0f7965c196e3472e8369c1a4ff83f787_grande.png'),
(1086, NULL, 86, N'https://product.hstatic.net/200000411281/product/caa_phe_muoi_1_81d30e7f62784ccb8e270facbe129134_grande.png'),
(1087, NULL, 87, N'https://product.hstatic.net/200000411281/product/cafe_den_1_0103753810be4a3591946642f7706aa7_grande.png'),
(1088, NULL, 88, N'https://product.hstatic.net/200000411281/product/cafe_u_lanh_1_940ab45336fc4f0b90d0da9ff83fe420_grande.png'),
(1089, NULL, 89, N'https://product.hstatic.net/200000411281/product/kombucha_ca_phe_1_4b793cebdd6b4bf69ce723a407287f1e_grande.png'),
(1090, NULL, 90, N'https://product.hstatic.net/200000411281/product/kombucha_chanh_080a4099812d4785bb053532f6e61ea8_grande.png'),
-- Anh tin tuc: giu nguyen 10 ban ghi va duong dan nhu file goc.
(2, 2, NULL, N'/images/demo/freshgarden-02.jpg'),
(4, 4, NULL, N'/images/demo/freshgarden-04.jpg'),
(6, 6, NULL, N'/images/demo/freshgarden-06.jpg'),
(8, 8, NULL, N'/images/demo/freshgarden-08.jpg'),
(10, 10, NULL, N'/images/demo/freshgarden-10.jpg'),
(12, 12, NULL, N'/images/demo/freshgarden-12.jpg'),
(14, 14, NULL, N'/images/demo/freshgarden-14.jpg'),
(16, 16, NULL, N'/images/demo/freshgarden-16.jpg'),
(18, 18, NULL, N'/images/demo/freshgarden-18.jpg'),
(20, 20, NULL, N'/images/demo/freshgarden-20.jpg');
GO

INSERT INTO dbo.SP_GH (MaSP,MaGioHang,SoLuong,DonGia) VALUES
(1, 1, 2, 160000),
(2, 2, 3, 350000),
(3, 3, 1, 450000),
(4, 4, 2, 35000),
(5, 5, 3, 35000),
(6, 6, 1, 69000),
(7, 7, 2, 35000),
(8, 8, 3, 35000),
(9, 9, 1, 35000),
(10, 10, 2, 15000),
(11, 11, 3, 36000),
(12, 12, 1, 36000),
(13, 13, 2, 11000),
(14, 14, 3, 40000),
(15, 15, 1, 34000),
(16, 16, 2, 34000),
(17, 17, 3, 34000),
(18, 18, 1, 34000),
(19, 19, 2, 30000),
(20, 20, 3, 25000);
GO

INSERT INTO dbo.DON_HANG (MaDH,MaDiaChi,MaGiamGia,MaKhachHang,TT_GiaoHang,TongTien,HT_VanChuyen,HT_ThanhToan,ThoiGianDat,GhiChu) VALUES
(1, 1, 1, 1, N'Đang xử lý', 160000, N'Giao tiêu chuẩn', N'COD', N'2026-10-02T11:00:00', N'Vui lòng giao bánh trong giờ hành chính'),
(2, 2, 2, 2, N'Đang giao', 350000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-03T11:00:00', N'Gọi điện trước khi giao hàng'),
(3, 3, 3, 3, N'Đã xác nhận', 450000, N'Giao tiêu chuẩn', N'COD', N'2026-10-04T11:00:00', N'Bánh dùng cho buổi tiệc sinh nhật'),
(4, 4, 4, 4, N'Đã giao', 35000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-05T11:00:00', N'Vui lòng đóng gói cẩn thận'),
(5, 5, 5, 5, N'Đang xử lý', 35000, N'Giao tiêu chuẩn', N'COD', N'2026-10-06T11:00:00', N'Giao hàng vào buổi chiều'),
(6, 6, 6, 6, N'Đang giao', 69000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-07T11:00:00', N'Vui lòng giữ bánh nguyên vẹn khi vận chuyển'),
(7, 7, 7, 7, N'Đã xác nhận', 35000, N'Giao tiêu chuẩn', N'COD', N'2026-10-08T11:00:00', N'Giao đúng địa chỉ đã cung cấp'),
(8, 8, 8, 8, N'Đã giao', 35000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-09T11:00:00', N'Nhờ cửa hàng kiểm tra sản phẩm trước khi giao'),
(9, 9, 9, 9, N'Đang xử lý', 35000, N'Giao tiêu chuẩn', N'COD', N'2026-10-10T11:00:00', N'Không giao hàng quá muộn'),
(10, 10, 10, 10, N'Đang giao', 15000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-11T11:00:00', N'Vui lòng liên hệ khi shipper đến nơi'),
(11, 11, 11, 11, N'Đã xác nhận', 36000, N'Giao tiêu chuẩn', N'COD', N'2026-10-12T11:00:00', N'Bánh mua để dùng trong gia đình'),
(12, 12, 12, 12, N'Đã giao', 36000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-13T11:00:00', N'Nhờ giao hàng nhẹ nhàng để tránh làm hỏng bánh'),
(13, 13, 13, 13, N'Đang xử lý', 11000, N'Giao tiêu chuẩn', N'COD', N'2026-10-14T11:00:00', N'Giao hàng càng sớm càng tốt'),
(14, 14, 14, 14, N'Đang giao', 40000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-15T11:00:00', N'Vui lòng gọi trước khoảng 10 phút'),
(15, 15, 15, 15, N'Đã xác nhận', 34000, N'Giao tiêu chuẩn', N'COD', N'2026-10-16T11:00:00', N'Đóng gói riêng từng loại bánh nếu có thể'),
(16, 16, 16, 16, N'Đã giao', 34000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-17T11:00:00', N'Giao đúng số lượng sản phẩm đã đặt'),
(17, 17, 17, 17, N'Đang xử lý', 34000, N'Giao tiêu chuẩn', N'COD', N'2026-10-18T11:00:00', N'Vui lòng kiểm tra hạn sử dụng của bánh'),
(18, 18, 18, 18, N'Đang giao', 34000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-19T11:00:00', N'Giao hàng tại quầy lễ tân của tòa nhà'),
(19, 19, 19, 19, N'Đã xác nhận', 30000, N'Giao tiêu chuẩn', N'COD', N'2026-10-20T11:00:00', N'Đây là đơn hàng mua mang về cho gia đình'),
(20, 20, 20, 20, N'Đã giao', 25000, N'Giao tiêu chuẩn', N'Chuyển khoản', N'2026-10-21T11:00:00', N'Vui lòng bảo quản bánh cẩn thận khi giao');

GO
GO

INSERT INTO dbo.DH_SP (MaSP,MaDH,SoLuong,DonGia,ThanhTien) VALUES
(1, 1, 1, 160000, 160000),
(2, 2, 1, 350000, 350000),
(3, 3, 1, 450000, 450000),
(4, 4, 1, 35000, 35000),
(5, 5, 1, 35000, 35000),
(6, 6, 1, 69000, 69000),
(7, 7, 1, 35000, 35000),
(8, 8, 1, 35000, 35000),
(9, 9, 1, 35000, 35000),
(10, 10, 1, 15000, 15000),
(11, 11, 1, 36000, 36000),
(12, 12, 1, 36000, 36000),
(13, 13, 1, 11000, 11000),
(14, 14, 1, 40000, 40000),
(15, 15, 1, 34000, 34000),
(16, 16, 1, 34000, 34000),
(17, 17, 1, 34000, 34000),
(18, 18, 1, 34000, 34000),
(19, 19, 1, 30000, 30000),
(20, 20, 1, 25000, 25000);
GO

INSERT INTO dbo.THANH_TOAN (MaThanhToan,PhuongThuc,SoTien,ThoiGian,TrangThai,MaGiaoDich,MaDH) VALUES
(1, N'COD', 160000, N'2026-10-02T12:00:00', N'Thành công', N'FG-0001', 1),
(2, N'Chuyển khoản', 350000, N'2026-10-03T12:00:00', N'Thành công', N'FG-0002', 2),
(3, N'COD', 450000, N'2026-10-04T12:00:00', N'Chờ xác nhận', N'FG-0003', 3),
(4, N'Chuyển khoản', 35000, N'2026-10-05T12:00:00', N'Thành công', N'FG-0004', 4),
(5, N'COD', 35000, N'2026-10-06T12:00:00', N'Thành công', N'FG-0005', 5),
(6, N'Chuyển khoản', 69000, N'2026-10-07T12:00:00', N'Chờ xác nhận', N'FG-0006', 6),
(7, N'COD', 35000, N'2026-10-08T12:00:00', N'Thành công', N'FG-0007', 7),
(8, N'Chuyển khoản', 35000, N'2026-10-09T12:00:00', N'Thành công', N'FG-0008', 8),
(9, N'COD', 35000, N'2026-10-10T12:00:00', N'Chờ xác nhận', N'FG-0009', 9),
(10, N'Chuyển khoản', 15000, N'2026-10-11T12:00:00', N'Thành công', N'FG-0010', 10),
(11, N'COD', 36000, N'2026-10-12T12:00:00', N'Thành công', N'FG-0011', 11),
(12, N'Chuyển khoản', 36000, N'2026-10-13T12:00:00', N'Chờ xác nhận', N'FG-0012', 12),
(13, N'COD', 11000, N'2026-10-14T12:00:00', N'Thành công', N'FG-0013', 13),
(14, N'Chuyển khoản', 40000, N'2026-10-15T12:00:00', N'Thành công', N'FG-0014', 14),
(15, N'COD', 34000, N'2026-10-16T12:00:00', N'Chờ xác nhận', N'FG-0015', 15),
(16, N'Chuyển khoản', 34000, N'2026-10-17T12:00:00', N'Thành công', N'FG-0016', 16),
(17, N'COD', 34000, N'2026-10-18T12:00:00', N'Thành công', N'FG-0017', 17),
(18, N'Chuyển khoản', 34000, N'2026-10-19T12:00:00', N'Chờ xác nhận', N'FG-0018', 18),
(19, N'COD', 30000, N'2026-10-20T12:00:00', N'Thành công', N'FG-0019', 19),
(20, N'Chuyển khoản', 25000, N'2026-10-21T12:00:00', N'Thành công', N'FG-0020', 20);
GO
INSERT INTO dbo.DANH_GIA (MaDG,SoSao,NoiDung,NgayDanhGia,TrangThai,MaKhachHang,MaSP,MaDH) VALUES
(1, 2, N'Bánh có vị hơi ngọt so với khẩu vị của mình. Phần kem chưa được mềm mịn như mong đợi.', N'2026-10-02T15:00:00', N'Đã duyệt', 1, 1, 1),
(2, 3, N'Bánh có hình thức đẹp, hương vị ở mức khá. Tuy nhiên phần nhân hơi ít.', N'2026-10-03T15:00:00', N'Đã duyệt', 2, 2, 2),
(3, 4, N'Bánh mềm, thơm và có vị ngọt vừa phải. Đóng gói cẩn thận, giao hàng đúng hẹn.', N'2026-10-04T15:00:00', N'Đã duyệt', 3, 3, 3),
(4, 5, N'Bánh rất ngon, cốt bánh mềm xốp, kem béo nhẹ không bị ngấy. Mình sẽ tiếp tục ủng hộ.', N'2026-10-05T15:00:00', N'Đã duyệt', 4, 4, 4),
(5, 1, N'Bánh nhận được không giống hình ảnh mong đợi, phần trang trí bị lệch và hộp bánh hơi móp.', N'2026-10-06T15:00:00', N'Đã duyệt', 5, 5, 5),
(6, 2, N'Bánh hơi khô, hương vị chưa thực sự nổi bật. Mong cửa hàng cải thiện chất lượng sản phẩm.', N'2026-10-07T15:00:00', N'Đã duyệt', 6, 6, 6),
(7, 3, N'Bánh có mùi thơm dễ chịu, kích thước đúng như mô tả. Chất lượng khá ổn so với giá tiền.', N'2026-10-08T15:00:00', N'Đã duyệt', 7, 7, 7),
(8, 4, N'Bánh tươi, phần nhân khá ngon và không quá ngọt. Giao hàng nhanh, nhân viên hỗ trợ nhiệt tình.', N'2026-10-09T15:00:00', N'Đã duyệt', 8, 8, 8),
(9, 5, N'Rất hài lòng với sản phẩm. Bánh đẹp, thơm ngon và được đóng hộp chắc chắn.', N'2026-10-10T15:00:00', N'Đã duyệt', 9, 9, 9),
(10, 1, N'Bánh giao đến bị xô lệch phần trang trí, hình thức không còn đẹp như ban đầu.', N'2026-10-11T15:00:00', N'Đã duyệt', 10, 10, 10),
(11, 2, N'Phần bánh hơi cứng và nhân chưa được đậm vị. Chất lượng chưa tương xứng với kỳ vọng.', N'2026-10-12T15:00:00', N'Đã duyệt', 11, 11, 11),
(12, 3, N'Bánh có hương vị dễ ăn, độ ngọt vừa phải. Nhìn chung sản phẩm đáp ứng được nhu cầu.', N'2026-10-13T15:00:00', N'Đã duyệt', 12, 12, 12),
(13, 4, N'Bánh mì thơm, ruột mềm và vỏ bánh khá ngon. Sẽ đặt mua lại khi có dịp.', N'2026-10-14T15:00:00', N'Đã duyệt', 13, 13, 13),
(14, 5, N'Bánh kem rất đẹp, trang trí tỉ mỉ và cốt bánh mềm. Cả gia đình đều yêu thích.', N'2026-10-15T15:00:00', N'Đã duyệt', 14, 14, 14),
(15, 1, N'Sản phẩm giao đến không còn được tươi như mong đợi. Mong cửa hàng kiểm tra kỹ hơn trước khi giao.', N'2026-10-16T15:00:00', N'Đã duyệt', 15, 15, 15),
(16, 2, N'Bánh có phần kem hơi ngấy, hương vị chưa phù hợp với khẩu vị của mình.', N'2026-10-17T15:00:00', N'Đã duyệt', 16, 16, 16),
(17, 3, N'Bánh có hình thức bắt mắt, đóng gói sạch sẽ. Hương vị ổn nhưng chưa có gì quá đặc biệt.', N'2026-10-18T15:00:00', N'Đã duyệt', 17, 17, 17),
(18, 4, N'Bánh mềm, thơm và có nhân khá hấp dẫn. Sản phẩm được giao đúng thời gian dự kiến.', N'2026-10-19T15:00:00', N'Đã duyệt', 18, 18, 18),
(19, 5, N'Chất lượng bánh rất tốt, nguyên liệu có vị thơm ngon và hình thức đẹp. Rất đáng để mua.', N'2026-10-20T15:00:00', N'Đã duyệt', 19, 19, 19),
(20, 1, N'Mình chưa hài lòng vì bánh bị móp khi nhận hàng và phần trang trí không còn nguyên vẹn.', N'2026-10-21T15:00:00', N'Đã duyệt', 20, 20, 20);
GO
INSERT INTO dbo.PHIEN_CHAT (MaPhien,MaKhachHang,ThoiGianBatDau,ThoiGianKetThuc,TrangThai) VALUES
(1, 1, N'2026-10-02T09:00:00', N'2026-10-02T09:10:00', N'Đã kết thúc'),
(2, 2, N'2026-10-03T09:00:00', N'2026-10-03T09:10:00', N'Đã kết thúc'),
(3, 3, N'2026-10-04T09:00:00', N'2026-10-04T09:10:00', N'Đã kết thúc'),
(4, 4, N'2026-10-05T09:00:00', N'2026-10-05T09:10:00', N'Đã kết thúc'),
(5, 5, N'2026-10-06T09:00:00', N'2026-10-06T09:10:00', N'Đã kết thúc'),
(6, 6, N'2026-10-07T09:00:00', N'2026-10-07T09:10:00', N'Đã kết thúc'),
(7, 7, N'2026-10-08T09:00:00', N'2026-10-08T09:10:00', N'Đã kết thúc'),
(8, 8, N'2026-10-09T09:00:00', N'2026-10-09T09:10:00', N'Đã kết thúc'),
(9, 9, N'2026-10-10T09:00:00', N'2026-10-10T09:10:00', N'Đã kết thúc'),
(10, 10, N'2026-10-11T09:00:00', N'2026-10-11T09:10:00', N'Đã kết thúc'),
(11, 11, N'2026-10-12T09:00:00', N'2026-10-12T09:10:00', N'Đã kết thúc'),
(12, 12, N'2026-10-13T09:00:00', N'2026-10-13T09:10:00', N'Đã kết thúc'),
(13, 13, N'2026-10-14T09:00:00', N'2026-10-14T09:10:00', N'Đã kết thúc'),
(14, 14, N'2026-10-15T09:00:00', N'2026-10-15T09:10:00', N'Đã kết thúc'),
(15, 15, N'2026-10-16T09:00:00', N'2026-10-16T09:10:00', N'Đã kết thúc'),
(16, 16, N'2026-10-17T09:00:00', N'2026-10-17T09:10:00', N'Đã kết thúc'),
(17, 17, N'2026-10-18T09:00:00', N'2026-10-18T09:10:00', N'Đã kết thúc'),
(18, 18, N'2026-10-19T09:00:00', N'2026-10-19T09:10:00', N'Đã kết thúc'),
(19, 19, N'2026-10-20T09:00:00', N'2026-10-20T09:10:00', N'Đã kết thúc'),
(20, 20, N'2026-10-21T09:00:00', N'2026-10-21T09:10:00', N'Đã kết thúc');
GO

INSERT INTO dbo.TIN_NHAN_CHAT (MaTinNhan,MaPhien,NguoiGui,NoiDung,ThoiGianGui,LoaiTinNhan) VALUES
(1, 1, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-02T09:01:00', N'Văn bản'),
(2, 2, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-03T09:02:00', N'Văn bản'),
(3, 3, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-04T09:03:00', N'Văn bản'),
(4, 4, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-05T09:04:00', N'Văn bản'),
(5, 5, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-06T09:05:00', N'Văn bản'),
(6, 6, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-07T09:06:00', N'Văn bản'),
(7, 7, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-08T09:07:00', N'Văn bản'),
(8, 8, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-09T09:08:00', N'Văn bản'),
(9, 9, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-10T09:09:00', N'Văn bản'),
(10, 10, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-11T09:10:00', N'Văn bản'),
(11, 11, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-12T09:11:00', N'Văn bản'),
(12, 12, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-13T09:12:00', N'Văn bản'),
(13, 13, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-14T09:13:00', N'Văn bản'),
(14, 14, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-15T09:14:00', N'Văn bản'),
(15, 15, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-16T09:15:00', N'Văn bản'),
(16, 16, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-17T09:16:00', N'Văn bản'),
(17, 17, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-18T09:17:00', N'Văn bản'),
(18, 18, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-19T09:18:00', N'Văn bản'),
(19, 19, N'Khách hàng', N'Tôi muốn tìm bánh kem', N'2026-10-20T09:19:00', N'Văn bản'),
(20, 20, N'Chatbot', N'Bạn có thể tham khảo các mẫu bánh kem Fresh Garden.', N'2026-10-21T09:20:00', N'Văn bản');
GO

-- Kiem tra nhanh so luong ban ghi sau khi khoi tao.
SELECT 'LOAI_CHA' AS TenBang, COUNT(*) AS SoBanGhi FROM dbo.LOAI_CHA
UNION ALL SELECT 'LOAI_CON', COUNT(*) FROM dbo.LOAI_CON
UNION ALL SELECT 'SAN_PHAM', COUNT(*) FROM dbo.SAN_PHAM
UNION ALL SELECT 'TIN_TUC', COUNT(*) FROM dbo.TIN_TUC
UNION ALL SELECT 'GIAM_GIA', COUNT(*) FROM dbo.GIAM_GIA
UNION ALL SELECT 'KHACH_HANG', COUNT(*) FROM dbo.KHACH_HANG
UNION ALL SELECT 'TAI_KHOAN', COUNT(*) FROM dbo.TAI_KHOAN
UNION ALL SELECT 'DIA_CHI', COUNT(*) FROM dbo.DIA_CHI
UNION ALL SELECT 'GIO_HANG', COUNT(*) FROM dbo.GIO_HANG
UNION ALL SELECT 'SP_GH', COUNT(*) FROM dbo.SP_GH
UNION ALL SELECT 'CUA_HANG', COUNT(*) FROM dbo.CUA_HANG
UNION ALL SELECT 'CUAHANG_SANPHAM', COUNT(*) FROM dbo.CUAHANG_SANPHAM
UNION ALL SELECT 'ANH', COUNT(*) FROM dbo.ANH
UNION ALL SELECT 'DON_HANG', COUNT(*) FROM dbo.DON_HANG
UNION ALL SELECT 'DH_SP', COUNT(*) FROM dbo.DH_SP
UNION ALL SELECT 'THANH_TOAN', COUNT(*) FROM dbo.THANH_TOAN
UNION ALL SELECT 'DANH_GIA', COUNT(*) FROM dbo.DANH_GIA
UNION ALL SELECT 'PHIEN_CHAT', COUNT(*) FROM dbo.PHIEN_CHAT
UNION ALL SELECT 'TIN_NHAN_CHAT', COUNT(*) FROM dbo.TIN_NHAN_CHAT;
GO


GO

SELECT * FROM dbo.LOAI_CHA;
SELECT * FROM dbo.LOAI_CON;
SELECT * FROM dbo.SAN_PHAM;
SELECT * FROM dbo.TIN_TUC;
SELECT * FROM dbo.GIAM_GIA;
SELECT * FROM dbo.KHACH_HANG;
SELECT * FROM dbo.TAI_KHOAN;
SELECT * FROM dbo.DIA_CHI;
SELECT * FROM dbo.GIO_HANG;
SELECT * FROM dbo.CUA_HANG;
SELECT * FROM dbo.CUAHANG_SANPHAM;
SELECT * FROM dbo.ANH;
SELECT * FROM dbo.SP_GH;
SELECT * FROM dbo.DON_HANG;
SELECT * FROM dbo.DH_SP;
SELECT * FROM dbo.THANH_TOAN;
SELECT * FROM dbo.DANH_GIA;
SELECT * FROM dbo.PHIEN_CHAT;
SELECT * FROM dbo.TIN_NHAN_CHAT;
SELECT * FROM dbo.NHAT_KY_LOI;
	
