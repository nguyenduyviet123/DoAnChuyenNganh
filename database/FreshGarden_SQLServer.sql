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

CREATE TABLE dbo.SAN_PHAM (MaSP INT NOT NULL PRIMARY KEY, MaLoai INT NOT NULL, TenSP NVARCHAR(200) NOT NULL, DonGia DECIMAL(18,2) NOT NULL, DonViTinh NVARCHAR(50) NULL, MoTa NVARCHAR(MAX) NULL, KhoiLuong DECIMAL(10,2) NULL, KichThuoc NVARCHAR(100) NULL, CONSTRAINT FK_SAN_PHAM_LOAI_CON FOREIGN KEY(MaLoai) REFERENCES LOAI_CON(MaLoai));
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

CREATE TABLE dbo.TIN_NHAN_CHAT (MaTinNhan INT NOT NULL PRIMARY KEY, MaPhien INT NOT NULL, NguoiGui NVARCHAR(30) NOT NULL, NoiDung NVARCHAR(MAX) NOT NULL, ThoiGianGui DATETIME2 NOT NULL, LoaiTinNhan NVARCHAR(50) NOT NULL, CONSTRAINT FK_TIN_NHAN_CHAT_PHIEN_CHAT FOREIGN KEY(MaPhien) REFERENCES PHIEN_CHAT(MaPhien));
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
(1, 1, N'Bánh kem Mây ngọc', 450000, N'cái', N'Sự kết hợp tinh tế giữa cốt bánh chiffon vani mềm xốp, lớp kem tươi vị phô mai béo nhẹ cùng mứt trái cây mọng và hoa atiso chua ngọt, tạo nên hương vị hài hòa, tươi mới. Xen lẫn bên trong lớp kem mứt là thạch dừa dai giòn sần sật thú vị.
Bánh nổi bật với những đường kem trắng mềm mại, điểm xuyết sắc màu rực rỡ từ nho xanh, việt quất, sơ ri và các chi tiết trang trí ngọt ngào.', 100, N'Size 8 inch - 20cm'),
(2, 1, N'Bánh kem Cara cà phê', 380000, N'cái', N'Bánh kem Cara cà phê 8 mang lớp cốt chiffon đậm vị sô cô la mềm ẩm. Xen giữa các lớp bánh là nhân trân châu giòn vui miệng kết hợp cùng mứt dưa lưới đào ngọt thanh. Lớp kem caramel cà phê phủ bên ngoài mang hương thơm quyến rũ, làm nổi bật hương vị tổng thể của chiếc bánh. Tất cả tạo nên một trải nghiệm vị giác tinh tế, đậm thơm nhưng vẫn dễ thưởng thức.
Vị bánh: Đậm vị sô cô la, ngọt dịu, giòn nhẹ từ trân châu và hậu vị caramel cà phê thơm béo, cân bằng.', 100, N'Size 8 inch- 21cm'),
(3, 1, N'Bánh kem Mây trắng', 350000, N'cái', N'Bánh kem Mây trắng mang vẻ ngoài ngọt ngào, đáng yêu với lớp kem tươi mềm mịn, được trang trí bằng sô cô la hình thú, sô cô la hình bóng cùng những viên kẹo bi đường xinh xắn. Bên trong là 4 lớp chiffon vani mềm xốp, thơm dịu, xen giữa các lớp bánh là nhân kem tươi béo nhẹ, thạch dừa giòn mát và mứt lê táo quế thanh ngọt. Tổng thể hương vị hài hòa, dễ ăn, có chút tươi mát từ trái cây và điểm nhấn ấm nhẹ từ quế.
Vị bánh: Thơm dịu vị vani, mềm xốp, béo nhẹ từ kem tươi, giòn mát từ thạch dừa và thanh ngọt từ mứt lê táo quế.', 100, N'Size 6 inch - 16 cm'),
(4, 1, N'Bánh kem Sương mai', 350000, N'cái', N'Bánh kem Sương mai 6 mang vẻ ngoài nhẹ nhàng, thanh thoát với điểm nhấn trang trí từ dâu tây sô cô la và những viên bi bạc lấp lánh, tạo cảm giác tinh tế và ngọt ngào. Bên trong là cốt chiffon vani mềm xốp, thơm dịu, kết hợp cùng thạch dừa giòn nhẹ và mứt lê táo quế thanh ngọt, mang đến hương vị hài hòa, tươi mát nhưng vẫn có chiều sâu nhờ chút ấm áp từ quế.
Vị bánh: Thơm dịu vị vani, thanh mát từ thạch dừa, ngọt nhẹ từ mứt lê táo quế, tổng thể mềm xốp và dễ ăn.', 100, N'Size 6 inch - 16 cm'),
(5, 1, N'Bánh kem Hổ phách', 380000, N'cái', N'Cốt chiffon caramel mềm xốp kết hợp lớp trân châu đường nâu dẻo dai và mứt sơ ri hạt chia chua nhẹ. Hương caramel ấm áp hòa cùng vị trái cây tươi tạo nên tổng thể cân bằng, thú vị. Bánh phủ kem mịn và trang trí nổi bật.
Vị bánh: Thơm caramel, chua ngọt hài hòa.', 100, N'Size 8- 21cm'),
(6, 2, N'Bánh kem Mây vàng', 350000, N'cái', N'Lớp cốt chiffon vani mềm mịn hòa quyện cùng kem tươi vị phô mai béo thơm, mứt xoài và xoài tươi chua ngọt, mang đến hương vị nhiệt đới tươi mát, dễ thưởng thức. Sắc vàng óng ả của xoài phủ trên mặt bánh trắng kem tạo nên vẻ ngoài rực rỡ, điểm thêm những đường kem mềm mại đầy cuốn hút.
Tựa ánh nắng dịu dàng, Bánh kem mây vàng là lựa chọn ngọt ngào để tô điểm cho những bữa tiệc và ngày vui sum vầy.', 100, N'Size 6 inch- 16cm'),
(7, 2, N'Bánh kem Mây hồng', 350000, N'cái', N'Cốt chiffon vani mềm nhẹ kết hợp thạch dừa dai giòn và mứt lê táo quế ngọt dịu. Hương quế thoang thoảng hòa cùng vị trái cây tươi mát tạo nên tổng thể hương vị thanh nhẹ, tinh tế. Bánh phủ kem mịn, trang trí dễ thương với sắc hồng mộng mơ.
Vị bánh: Thơm quế nhẹ, ngọt thanh, tươi mát.', 100, N'Size 6 inch - 16 cm'),
(8, 2, N'Bánh kem Vàng anh', 380000, N'cái', N'Cốt chiffon vani mềm ẩm kết hợp thạch dừa dai giòn và lớp mứt lê táo quế ngọt dịu. Hương vị trái cây thanh nhẹ hòa cùng lớp kem mịn mang lại cảm giác hài hòa và dễ ăn. Mặt bánh phủ kem trắng, trang trí xoài tươi nổi bật.
Vị bánh: Thơm trái cây, ngọt dịu, béo nhẹ.', 100, N'Size 8 inch- 21cm'),
(9, 2, N'Bánh kem Mai mơ', 160000, N'cái', N'Cốt chiffon vani mềm nhẹ kết hợp thạch dừa dai giòn và mứt lê táo quế ngọt dịu. Hương trái cây thanh mát hòa quyện cùng lớp kem mịn tạo nên cảm giác nhẹ nhàng, tinh tế. Bánh trang trí mứt hắc mai biển, mơ và việt quất tươi nổi bật.
Vị bánh: Thơm trái cây, ngọt thanh, béo nhẹ.', 100, N'Size 4 inch- 11cm'),
(10, 2, N'Bánh kem Cara-men-say', 350000, N'cái', N'Cốt chiffon caramel mềm xốp kết hợp trân châu đường nâu dẻo dai và mứt sơ ri hạt chia chua nhẹ. Hương caramel thơm ấm hòa cùng vị trái cây tươi giúp cân bằng độ béo của kem, mang lại trải nghiệm vị giác thú vị. Mặt bánh phủ kem mịn và trang trí nổi bật với sắc caramel ấm áp.
Vị bánh: Thơm caramel, ngọt dịu hài hòa.', 100, N'Size 6- 16cm'),
(11, 3, N'Bánh kem Mây sữa', 160000, N'cái', N'Cốt chiffon sô cô la mềm xốp kết hợp cùng kem tươi béo nhẹ, mứt lê táo quế cùng nho xanh, tạo nên sự hòa quyện thú vị giữa vị ngọt dịu và hương trái cây thanh mát. Bánh mang vẻ đẹp tinh khôi với lớp kem trắng mịn, điểm xuyết những quả nho xanh, bông đường hình hoa và lá vàng trang trí đầy tinh tế.', 100, N'Size 4 inch - 10cm'),
(12, 3, N'Bánh kem Hương mật', 160000, N'cái', N'Sức hấp dẫn của chiếc bánh đến từ sự kết hợp giữa cốt bánh chocolate mềm mại, chuối tươi thanh ngọt cùng lớp sốt và kem caramen muối hồng đậm đà. Bánh được phủ sốt chocolate óng ả, trang trí bằng hạnh nhân giòn thơm và hoa đường tinh tế, mang lại một diện mạo vô cùng sang trọng và thanh lịch.', 100, N'Size 4 inch - 10 cm'),
(13, 3, N'Bánh kem Kỳ lân kỳ diệu', 350000, N'cái', N'Bánh kem Kỳ lân kỳ diệu với cốt bánh sô cô la mềm ẩm, thơm đậm vị và ngọt dịu vừa phải. Xen giữa các lớp bánh là nhân trân châu giòn nhẹ kết hợp cùng mứt dưa lưới đào thanh ngọt, tạo cảm giác vui miệng hài hòa. Bánh được phủ kem mịn, trang trí kem xoắn pastel nhiều màu cùng marshmallow mềm xinh xắn, mang vẻ ngoài ngọt ngào và đáng yêu.
Vị bánh: Đậm vị sô cô la, ngọt dịu, giòn nhẹ từ trân châu và mứt dưa lưới đào.', 100, N'Size 6 inch - 16 cm'),
(14, 3, N'Bánh kem Bông tuyết', 160000, N'cái', N'Bánh kem Bông tuyết mang lớp cốt chiffon đậm vị sô cô la, mềm ẩm và thơm nồng đầy cuốn hút. Xen giữa các lớp bánh là nhân trân châu giòn vui miệng kết hợp cùng mứt dưa lưới đào, tạo nên sự cân bằng hài hòa giữa vị ngọt và chút thanh tươi của trái cây. Tổng thể chiếc bánh gợi cảm giác ngọt ngào, nổi bật nhưng vẫn dễ thưởng thức, như một lớp “hoa tuyết” dịu dàng phủ lên vị giác.
Vị bánh: Đậm vị sô cô la, ngọt dịu vị dưa lưới đào và độ giòn thú vị từ trân châu.', 100, N'Size 4 inch- 11cm'),
(15, 3, N'Bánh kem Choco ngọc trai', 350000, N'cái', N'Cốt chiffon phô mai mềm mịn kết hợp lớp trân châu trắng dẻo dai và mứt vải nha đam thanh mát. Vị phô mai béo nhẹ hòa cùng vị trái cây dịu ngọt tạo nên tổng thể hài hòa và dễ thưởng thức. Mặt bánh phủ kem mịn, trang trí socola cùng bi vàng bạc lấp lánh nổi bật.
Vị bánh: Béo nhẹ, thơm phô mai, ngọt thanh.', 100, N'Size 6 inch- 16cm'),
(16, 4, N'Bánh mì kem choco', 25000, N'chiếc', N'Bánh mì kem choco thơm hương bột mì nướng quyện bơ, sữa và trứng gà, vị béo dịu, dễ ăn. Lớp bánh nướng chín vàng, mềm nhẹ, ôm trọn nhân kem sô cô la mịn và ngọt vừa. Sốt salad phủ trên mặt bánh tạo thêm độ béo ngậy, giúp hương vị hài hòa, tròn đầy và hấp dẫn ngay từ miếng đầu tiên.
Thành phần: Bột mì, sốt socola (17.5%), nước, kem sữa tươi (9%), đường kính, trứng gà, bơ, dầu thực vật, men làm bánh, sữa bột, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes).', 100, N'80g'),
(17, 4, N'Bánh mì kem trứng tan chảy', 20000, N'chiếc', N'Bánh mì kem trứng tan chảy thơm hương bột mì nướng quyện bơ, sữa và trứng gà, vị béo nhẹ, êm dịu. Lớp bánh nướng chín vàng, mềm xốp, bơm nhân trứng sữa mịn dọc theo bề mặt, tan nhẹ khi ăn. Phô mai mozzarella và sốt salad phủ trên mặt bánh tạo thêm độ béo ngậy, giúp tổng thể hương vị tròn vị, mềm mại và dễ thưởng thức.Thành phần: Bột mì hảo hạng, trứng gà, sữa, bơ, sốt trứng sữa, sốt salad, bột giòn', 100, N'75g'),
(18, 4, N'Bánh mì choco giòn', 25000, N'gói', N'Bánh choco giòn thơm hương bột mì lên men tự nhiên, vị béo thuần của bơ, sữa và trứng gà. Lớp vỏ nướng chín vàng, giòn mỏng, khép lại phần ruột mềm ẩm, nơi socola tan chậm hòa cùng socola chip giòn nhẹ tạo cảm giác khi ăn vô cùng thú vị.
Thành phần: Bột mì, sốt socola (19%), đường kính, bơ, nước, trứng gà, socola (1.5%), men làm bánh, sữa bột, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes).', 100, N'80g'),
(19, 4, N'Bánh mì sữa chua giòn bùi', 25000, N'gói', N'Bánh mì sữa chua giòn bùi thơm hương bột mì nướng quyện bơ, sữa và trứng gà, vị béo nhẹ, thanh dịu. Bánh được cuộn từng lớp, nướng chín vàng, bên ngoài giòn nhẹ, bên trong mềm ẩm, hòa cùng kem sữa chua mịn và sốt dừa béo thơm. Hạt óc chó điểm trên mặt bánh mang lại độ bùi và giòn nhẹ, giúp hương vị cân bằng và dễ ăn.
Thành phần: Bột mì, sốt sữa chua (19%), đường kính, trứng gà, hạt óc chó, nước, bơ, dầu thực vật, bột dừa, men làm bánh, sữa bột, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes).', 100, N'80g'),
(20, 4, N'Bánh scone', 30000, N'chiếc', N'Một phiên bản scone kiểu lạ miệng, nổi bật với mùi bơ thơm ngậy. Xen lẫn bên trong là nho khô đen dẻo ngọt hòa cùng hạt óc chó thơm bùi, tạo nên hương vị hài hòa, hấp dẫn và rất dễ ăn. Thành phần: bột mì, đường trắng, trứng gà, tinh bột, nho khô đen, bơ, hạt óc chó, chất làm dày (1442, 415), sữa bột tách kem, muối ăn, chất tạo xốp (450i, 341i, 500ii), chất xử lý bột (170i), chất ổn định (471), chất chống oxi hóa (322i), hương liệu vani tổng hợp.Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: năng lượng 371 Kcal, chất đạm: 10.1 g, carbohydrat: 45.9 g, đường tổng: 17.5 g, chất béo: 17.0 g, natri: 89 mg.', 100, N'80 g'),
(21, 5, N'Bánh mì thịt heo áp chảo', 35000, N'chiếc', N'Bánh mì thịt heo áp chảo gây ấn tượng với lớp vỏ bánh mềm xốp, thơm dịu, ôm trọn phần nhân thịt mọng nước, mềm thơm và đậm vị bên trong. Phía trên bánh được phủ phô mai béo ngậy rồi áp chảo vừa tới, tạo lớp mặt vàng xém hấp dẫn và dậy mùi thơm. Khi thưởng thức, bạn sẽ cảm nhận rõ sự hòa quyện giữa nhiều tầng hương vị cùng kết cấu thú vị: chút giòn nhẹ bên ngoài, mềm xốp của bánh và phần nhân thịt mọng mềm bên trong, tạo nên một món bánh vừa ngon miệng vừa đầy đặn cho mọi thời điểm trong ngày.', 100, N'Theo sản phẩm'),
(22, 5, N'Bánh burger thịt xá xíu', 25000, N'chiếc', N'Burger Thịt Xá Xíu là sự kết hợp hài hòa giữa thịt xá xíu hảo hạng, dưa chuột bao tử muối giòn và sốt đậm vị, mang đến trải nghiệm ẩm thực mới lạ. Bề mặt bánh được phủ phô mai và áp chảo tạo lớp vỏ vàng giòn thơm béo cùng tạo hình độc đáo, tăng thêm sức hấp dẫn ngay từ ánh nhìn đầu tiên. Sản phẩm được làm tươi mới mỗi ngày từ nguyên liệu tuyển chọn và quy trình sản xuất hiện đại, mang đến hương vị thơm ngon, chất lượng trong từng chiếc bánh.', 100, N'Theo sản phẩm'),
(23, 5, N'Bánh ruốc xoắn đậm đà', 25000, N'chiếc', N'Ruốc heo, vừng trắng và sốt lòng đỏ được cuộn khéo trong từng lớp bánh mềm xốp, tạo nên vị ngon đậm đà mà rất vào miệng. Bề mặt quét trứng, thêm sốt lòng đỏ và phô mai bào vàng óng, nhìn thôi đã thấy hấp dẫn, muốn thử ngay. Thành phần: Bột mỳ, bơ, trứng gà, đường, sốt lòng đỏ, ruốc heo, vừng trắng, phomai mozzarella, sữa bột, bột nở làm bánh, men, muối, nước.', 100, N'80g'),
(24, 5, N'Bánh nhân thịt đậm đà', 25000, N'chiếc', N'Bánh mềm thơm ôm trọn phần nhân thịt lợn xay đậm đà, hòa cùng hành củ, cà rốt và đậu Hà Lan để tạo nên một tổng thể vừa đầy đặn vừa dễ ăn. Thêm chút sốt lòng đỏ, phô mai mozzarella và tiêu thơm, chiếc bánh trở nên tròn vị theo đúng nghĩa: quen mắt, bon miệng và rất dễ nghiền. Thành phần: Bột mỳ, bơ, trứng gà, đường, thịt lơn xay, sốt lòng đỏ, phomai mozzarella, hành củ, cà rốt , đậu Hà Lan, ngô ngọt, dầu hào, sữa bột, bột nở làm bánh, men, muối, hạt tiêu, nước.', 100, N'90g'),
(25, 5, N'Bánh mì xúc xích đậm vị', 35000, N'chiếc', N'Bánh mì xúc xích đậm vị thơm hương bột mì nướng quyện bơ, sữa và trứng gà. Bánh nướng chín vàng, mềm xốp, trên mặt đặt thanh xúc xích kết hợp phô mai sợi và sốt salad tan nhẹ khi ăn. Vị mặn béo hài hòa, rõ ràng, để lại cảm giác đậm vừa và dễ thưởng thức.
Thành phần: Xúc xích (44%), bột mì, đường kính, salad nguyên vị, nước, bơ, phô mai, trứng gà, dầu thực vật, men làm bánh, hành lá, sữa bột, mật ong, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes).', 100, N'100g'),
(26, 6, N'Bánh mì gối', 25000, N'túi', N'Bánh mì gối có kết cấu mềm xốp, thơm nhẹ và dễ dàng kết hợp với nhiều món ăn khác nhau. Sản phẩm được làm từ nguyên liệu chọn lọc, đảm bảo độ tươi ngon và chất lượng trong từng lát bánh.
Thành phần: Bột mì, nước, đường, bơ, sữa bột, trứng gà, men, muối, chất ổn định (E516), chất nhũ hoá (E322i), chất xử lý bột (E300, E1100i).
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 264 Kcal Chất đạm: 7.8 g Carbohydrat: 45.2 g Chất béo: 4.3 g Natri: 226 mg Đường tổng: 10.2 g.
Hướng dẫn sử dụng: Sản phẩm dùng để ăn liền.
Thông tin cảnh báo: Không dùng cho người dị ứng với  các thành phần của sản phẩm.
Bảo quản: Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.
Ngày sản xuất (NSX): Trước hạn sử dụng 5 ngày. 
Hạn sử dụng (HSD): Xem trên bao bì.', 100, N'330 g'),
(27, 6, N'Bánh gối sữa dừa choco', 45000, N'túi', N'Mềm thơm, ngọt dịu và có chút choco vui miệng, bánh gối sữa dừa choco là lựa chọn gọn gàng cho bữa sáng hoặc bữa xế khi cần nạp nhanh năng lượng. Vị trứng sữa béo nhẹ hòa cùng dừa và sô cô la tạo nên tổng thể mới lạ nhưng vẫn dễ ăn, hợp cho cả nhà thưởng thức mỗi ngày.', 100, N'Theo sản phẩm'),
(28, 6, N'Bánh mì vương miện', 30000, N'cái', N'Bánh mì vương miện thơm hương bột mì nướng quyện bơ, sữa và trứng gà, vị béo mặn hài hòa. Bánh nướng chín vàng, mềm xốp, phủ xúc xích cắt nhỏ, ruốc heo tơi mịn, cùng sốt salad và phô mai mozzarella tan nhẹ trên mặt bánh.
Thành phần: Bột mì, xúc xích, salad nguyên vị, đường kính, nước, trứng gà, bơ, phô mai, ruốc heo, dầu thực vật, men làm bánh, hành lá, sữa bột, mật ong, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes).', 100, N'85g'),
(29, 6, N'Bánh mì giòn bơ tỏi', 29000, N'gói', N'Bánh mì giòn bơ tỏi chinh phục vị giác với kết cấu giòn tan rôm rốp, dậy hương vị bơ tỏi cực cuốn. Gói 120g gọn nhẹ, đậm vị, chuẩn gu "team" mê ăn vặt.
Thành phần: Bột mì, bơ (23.5%), đường kính, tỏi tươi (3%), sữa bột, trứng gà, nước, men làm bánh, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes), chất bảo quản (282), mùi tây.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 481 Kcal; Chất đạm: 10.5 g; Carbohydrat: 59.5 g; Chất béo: 21.6 g; Natri: 450 mg; Đường tổng: 13.0 g.', 120, N'120g'),
(30, 6, N'Bánh mì giòn caramel', 29000, N'gói', N'Giòn rụm, thơm bơ và phủ caramel ngọt vừa đủ, đây là món bánh ăn chơi vừa vui miệng, vừa tiện lợi để mang theo trong những lúc cần nạp nhanh năng lượng. Túi 120g nhỏ gọn, dễ ăn và rất hợp "up mood" cho những ngày bận rộn.
Thành phần: Bột mì, đường kính, bơ, sữa bột, nước, men làm bánh, trứng gà, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes), chất bảo quản (282), nước chanh tươi.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 480 Kcal; Chất đạm: 9.6 g; Carbohydrat: 65.5 g; Chất béo: 19.4 g; Natri: 337 mg; Đường tổng: 21.5 g.', 120, N'120g'),
(31, 7, N'Bánh sandwich bò phô mai', 49000, N'chiếc', N'Từng lát bánh mì nguyên cám mềm mại ôm trọn hai lớp nhân bò phô mai đầy đặn, thơm ngon. Thêm chút sốt mayonnaise béo mịn, giúp cân bằng hương vị, tạo nên trải nghiệm ẩm thực hấp dẫn ngay từ miếng đầu tiên.
Thành phần: Bột mì hảo hạng, thịt bò (13,6%), nước, phô mai lát (6%), sốt mayonaise, trứng gà, bơ, đường kính, xì dầu, hành lá, muối tinh, men, bột ngọt, bột nở làm bánh ibis, bảo quản thực phẩm INS 282, hạt tiêu, ngũ vị hương.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 251.4 Kcal, chất đạm: 13.3 g, carbohydrat: 18.5 g, chất béo: 13.8 g, natri: 614 mg, đường tổng: 11.2 g.', 100, N'130g'),
(32, 7, N'Bánh sandwich tôm thịt sốt phô mai', 40000, N'chiếc', N'Sandwich tôm thịt sốt phô mai – lớp bánh mềm thơm ôm trọn phần nhân đậm đà từ thịt heo, tôm tươi và trứng gà, hoà quyện cùng sốt phô mai béo mịn. Một chiếc bánh nhỏ gọn, ngon miệng, phù hợp khẩu vị của mọi lứa tuổi.
Thành phần: Bột mì, thịt heo (23%), trứng gà, phô mai lát, tôm (7,5%), nước, xốt kewpie bánh mì vị phô mai spread (4%), đường kính, bơ, sữa bột, sữa đặc, sốt ướp đồ nướng, mayonnaise, tương cà, tương ớt, men làm bánh, muối tinh, bột canh tôm, bột nở làm bánh (chất ổn định: calium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes), chất bảo quản (282), bột ngọt, hạt tiêu.
Thông tin dinh dưỡng trung bình trong 100g sản phẩm: : Năng lượng: 269 Kcal, chất đạm: 12.3 g, carbohydrat: 24.7 g, chất béo: 12.6 g, natri: 601 mg, đường tổng: 8.1 g.', 100, N'160g'),
(33, 7, N'Sandwich Yo-chi tan chảy', 30000, N'chiếc', N'Sandwich Yo-chi tan chảy thơm hương bột mì nướng quyện bơ, sữa và trứng gà. Lớp bánh nướng chín vàng, bề mặt chia chín ô vuông nhỏ, ôm trọn nhân sữa chua mịn, vị chua nhẹ cân bằng. Phô mai lát và lớp trứng nướng bao quanh tạo độ béo dịu, giúp tổng thể hương vị mềm mại, hài hòa và dễ thưởng thức.
Thành phần: Bột mì, sốt sữa chua, nước, bơ, đường kính, kem sữa tươi, phô mai lát, trứng gà, salad nguyên vị, sữa bột, men làm bánh, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes), chất bảo quản (282).', 100, N'95g'),
(34, 7, N'Sandwich Sa-chi tan chảy', 30000, N'chiếc', N'Sandwich Sa-chi tan chảy thơm hương bột mì nướng quyện bơ, sữa và trứng gà. Lớp bánh nướng chín vàng, bề mặt chia chín ô vuông nhỏ. Phô mai lát phủ mặt cùng lớp trứng nướng xung quanh tạo độ béo dịu, giúp hương vị hài hòa và dễ thưởng thức.
Thành phần: Bột mì, sốt trứng muối, nước, bơ, đường kính, kem sữa tươi, phô mai lát, trứng gà, salad nguyên vị, sữa bột, men làm bánh, muối tinh, bột nở làm bánh (chất ổn định: calcium sulphate, chất xử lý bột: ascorbic acid, chất nhũ hoá: lecithin, dầu thực vật, enzymes), chất bảo quản (282), vừng đen.', 100, N'95g'),
(35, 7, N'Bánh burger bò', 25000, N'chiếc', N'Sản phẩm Bánh burger bò chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(36, 8, N'Bánh opera', 36000, N'miếng', N'Bánh Opera tinh tế với từng lớp mỏng hoàn hảo, kết hợp giữa cốt bánh hạnh nhân mềm mịn, cà phê đậm đà và ganache sô cô la thơm ngậy.
Thành phần: Bột mỳ, đường, trứng, bơ, cà phê, bột hạnh nhân, rượu Kahlua, kem bơ cà phê, socola ganache, socola trang trí', 100, N'90g'),
(37, 8, N'Bánh chiffon trà bá tước', 35000, N'chiếc', N'Bánh chiffon trà bá tước với công thức độc quyền tạo nên kết cấu mềm xốp nhẹ như bông, hòa quyện cùng hương trà bá tước thơm quyến rũ. Vị ngọt nhẹ nhàng cân bằng hoàn hảo, mang đến trải nghiệm ẩm thực tinh tế và lôi cuốn từ miếng đầu tiên.
Thành phần: Bột mì, nước, đường kính, nho khô (4%), sữa bột béo (1,4%), bơ, shortening, men, muối, chất bảo quản (282), hương thực phẩm tổng hợp (hương sữa), chất nhũ hóa (471), chất chống oxi hóa (300), enzym: amylaza (1100i).
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 295.9 Kcal, chất đạm: 8.3 g, carbohydrat: 31.3 g, chất béo: 14.5 g, natri: 140 mg, đường tổng: 19.6 g.', 100, N'95g'),
(38, 8, N'Bánh madeleine sô cô la', 35000, N'gói', N'Bánh madeleine sô cô la mang đến sự kết hợp hoàn hảo giữa kết cấu bánh mềm nhẹ, ruột bánh bông mịn thơm ngậy vị bơ cùng hương vị sô cô la đậm đà, tạo nên một trải nghiệm ẩm thực ngon miệng kiểu Pháp.
Thành phần: Bột mỳ, bơ, đường, trứng gà, bột ca cao (2%), chất tạo xốp (E500ii).
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 355.6 Kcal, chất đạm: 6.6 g, carbohydrat: 40.2 g, chất béo: 17.1 g, natri: 178 mg, đường tổng: 31.7 g', 100, N'Túi 120g'),
(39, 8, N'Bánh chiffon sô cô la', 25000, N'chiếc', N'Bánh chiffon sô cô la mềm mịn, thơm đậm vị cacao hấp dẫn. Từng chiếc bánh được sản xuất từ nguồn nguyên liệu tuyển chọn, mang đến trải nghiệm thơm ngon cùng sự tin cậy từ thương hiệu được nhiều người yêu thích.
Thành phần: Trứng gà, bột mì, đường, dầu thực vật, bơ, tinh bột, sô cô la (2%), đường siro fructose, ca cao, mật ong, muối ăn, bột protein trứng gà, chất làm dày (1420, 466, 415), chất ổn định (471, 422, 1520, 420ii), chất nhũ hóa (475), rượu rum, chất điều chỉnh độ acid (330).
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 342 Kcal, chất đạm: 7.8 g, carbohydrat:  31.7 g, đường tổng:  19.3 g, chất béo:  19.8 g, natri:  291 mg.
Thông tin cảnh báo: không sử dụng bánh khi hết hạn và người dị ứng với thành phần của sản phẩm.
Hướng dẫn sử dụng: sản phẩm dùng để ăn liền.
Hướng dẫn bảo quản: bảo quản nhiệt độ 2°C-8°C, tránh ánh nắng trực tiếp.', 100, N'45 g'),
(40, 8, N'Bánh chiffon vani', 25000, N'chiếc', N'Bánh chiffon vani mềm xốp, ẩm mịn với hương vani dịu nhẹ, dễ thưởng thức. Được làm từ nguyên liệu chọn lọc theo quy trình sản xuất an toàn, sản phẩm mang đến hương vị thơm ngon và sự an tâm từ thương hiệu uy tín lâu năm.
Thành phần: Bột mì, trứng gà, đường kính, dầu thực vật, bơ, chất ổn định (471, 475, 420ii, 422,1520), siro fructose, hương liệu vani tổng hợp, bột nổi làm bánh (500ii,541i, 450i, 341i), mật ong, rượu rum, muối tinh.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: năng lượng: 345Kcal, chất đạm: 9g, carbohydrat: 40.1g, đường tổng: 20.7g, chất béo: 16.2g, natri: 136mg.
Thông tin cảnh báo: không sử dụng bánh khi hết hạn và người dị ứng với thành phần của sản phẩm.
Hướng dẫn sử dụng: sản phẩm dùng để ăn liền.
Hướng dẫn bảo quản: bảo quản nhiệt độ 2°C-8°C, tránh ánh nắng trực tiếp.', 100, N'45 g'),
(41, 9, N'Bánh mousse quả mọng', 450000, N'cốc', N'Cốt chiffon phô mai mềm ẩm kết hợp lớp mousse trái mọng chua ngọt đặc trưng từ các loại berry chín mọng. Hương vị trái cây tươi hòa cùng vị béo nhẹ của phô mai mang lại cảm giác thanh mát và tinh tế. Mặt bánh trang trí sốt berry ánh đỏ nổi bật.Vị bánh: Chua ngọt dịu, thơm trái mọng.', 100, N'Size 8 inch- 21cm'),
(42, 9, N'Bánh mousse Vải hoa hồng', 450000, N'cốc', N'Cốt chiffon phô mai mềm mịn kết hợp lớp mousse vải hoa hồng thơm dịu, mang đến hương vị thanh mát và đầy nữ tính. Vị vải ngọt nhẹ hòa cùng hương hoa hồng tinh tế tạo nên cảm giác nhẹ nhàng, dễ chịu. Bánh trang trí hoa xinh xắn.
Vị bánh: Thơm vải, thoảng hương hoa hồng, ngọt thanh.', 100, N'Size 8 inch- 21cm'),
(43, 9, N'Bánh mousse Dừa tuyết', 450000, N'cốc', N'Cốt chiffon caramel mềm mịn, hòa quyện cùng lớp mousse dừa béo nhẹ và thạch trân châu hương đường nâu dẻo dai. Hương dừa thanh dịu kết hợp vị caramel thơm ấm tạo nên tổng thể hài hòa, dễ ăn. Mặt bánh phủ kem trắng trang nhã, điểm xuyết trang trí tinh tế.
Vị bánh: Béo nhẹ, thơm dừa, ngọt dịu.', 100, N'Size 8 inch- 21cm'),
(44, 9, N'Bánh mousse chanh leo', 31000, N'cốc', N'Mousse chanh leo mềm mịn, nhẹ bẫng như mây, hòa quyện giữa vị chua thanh mát đặc trưng của chanh leo và độ ngọt dịu vừa phải. Từng miếng tan ngay trong miệng, mang đến cảm giác tươi mới, mát lạnh đầy sảng khoái.
Thành phần: Kem sữa, kem thực vật, đường, phô mai kem, nước, trứng gà, chanh leo (4,5%), chất tạo đông gelatine, bột mì.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 236 g, chất đạm: 4.9 g, carbohydrat: 23.5 g, chất béo: 13.4 g, natri: 45.9 mg, đường tổng: 22.7 g.', 100, N'85g'),
(45, 9, N'Kem caramel', 25000, N'cốc', N'Kem caramel mềm mượt, hòa quyện giữa vị béo ngậy của sữa và vị ngọt thanh của lớp caramel sóng sánh. Từng cốc caramel  được chế biến từ nguyên liệu chất lượng, đảm bảo vệ sinh an toàn thực phẩm và hương vị thơm ngon tự nhiên.
Thành phần: Nước, trứng gà, đường kính, sữa bột, kem sữa tươi, nước chanh tươi.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 162 Kcal, chất đạm: 5.2 g, carbohydrat: 19.7 g, chất béo: 6.2 g, natri: 61.2 mg, đường tổng: 17.4 g. 
Thông tin cảnh báo: Sản phẩm bảo quản lạnh nếu chưa sử dụng, không sử dụng sản phẩm hết hạn.
Hướng dẫn sử dụng: Sản phẩm dùng để ăn liền, ngon hơn khi ăn lạnh. 
Hướng dẫn bảo quản: Bảo quản nhiệt độ 2 - 8°C, tránh ánh nắng trực tiếp.', 100, N'75g'),
(46, 10, N'Bánh quy nướng hạnh nhân 150g', 39000, N'gói', N'Lớp vỏ giòn tan, bên trong xốp mềm, ngọt nhẹ, hòa quyện cùng hạnh nhân giòn bùi, tạo nên hương vị thơm ngon đầy cuốn hút. Món bánh lý tưởng để nhâm nhi cùng trà hoặc cà phê.
Thành phần: Bột mỳ, đường, hạt hạnh nhân (16%), trứng gà, bơ, chất tạo xốp (E500ii, E450i, E341i), muối.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 512 g, chất đạm: 11.8 g, carbohydrat: 60 g, chất béo: 23.8 g, natri: 307 mg, đường tổng: 26.1 g.', 150, N'150 g'),
(47, 10, N'Bánh quy dừa 150g', 39000, N'gói', N'Bánh quy dừa là sự hòa quyện tinh tế giữa vị ngọt nhẹ vừa phải và hương dừa thơm dịu đặc trưng, mang đến cảm giác thanh nhã và dễ chịu ngay từ lần thưởng thức đầu tiên. Từng chiếc bánh có độ giòn xốp nhẹ, không quá khô, để khi cắn vào có thể cảm nhận rõ nét vị béo thanh cùng hương dừa lan tỏa tự nhiên trong khoang miệng. Sự kết hợp hài hòa ấy tạo nên một hương vị mộc mạc nhưng đầy cuốn hút, khiến chiếc bánh trở thành lựa chọn vừa tinh tế, vừa dễ làm say lòng người thưởng thức.
Thành phần: Bột mì, trứng gà, bơ, đường, đường fructose, bột dừa (7%), hương vani tổng hợp.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 537 kcal, chất đạm: 9.1 g, carbohydrat: 56.8 g, chất béo: 28.9 g, natri: 53.6 mg, đường tổng: 35 g.', 150, N'150 g'),
(48, 10, N'Bánh quy bơ mứt dâu 150g', 39000, N'gói', N'Bánh quy bơ giòn xốp, thơm lừng, kết hợp cùng mứt dâu đỏ au ngọt dịu, tạo điểm nhấn bắt mắt và hương vị hài hòa. Một chiếc bánh nhỏ xinh nhưng đầy cuốn hút từ hình thức đến vị giác.
Thành phần: Bột mì, bơ (30,6%), đường, trứng, mứt dâu (5.1%).
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 468.0 g, chất đạm: 8.3 g, carbohydrat: 65.0 g, chất béo: 18.0 g, natri: 15 mg, đường tổng: 37.5 g.', 150, N'150 g'),
(49, 10, N'Bánh quy sô cô la chip 150g', 39000, N'gói', N'Bánh quy sô cô la chip chinh phục vị giác bằng sự kết hợp hài hòa giữa hương bơ thơm ngậy và những viên sô cô la chip đậm vị, ngọt dịu pha chút đăng đắng tinh tế. Lớp bánh giòn nhẹ ôm trọn phần sô cô la, tạo nên trải nghiệm thưởng thức phong phú và tròn vị trong từng miếng bánh. Không quá ngọt nhưng vẫn đủ đậm đà, sản phẩm mang đến cảm giác sang trọng, hấp dẫn và đặc biệt phù hợp với những ai yêu thích hương vị cổ điển được biến tấu theo cách tinh tế hơn.
Thành phần: Bột mì, đường, bơ, sô cô la chíp (12%), trứng gà, chất tạo xốp (E500ii), muối.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 476.4 Kcal, chất đạm: 7.0 g, carbohydrat: 65.9 g, chất béo: 19.3 g, natri: 197 mg, đường tổng: 49.7 g.', 150, N'150 g'),
(50, 10, N'Bánh quy hạnh nhân 150g', 39000, N'gói', N'Bánh quy giòn rụm, thơm bơ, ngọt nhẹ vừa phải, điểm xuyết hạnh nhân bùi béo. Mỗi chiếc bánh mang đến hương vị tinh tế, thích hợp để nhâm nhi cùng trà hoặc cà phê.
Thành phần: Bột mì, trứng gà, đường, hạnh nhân cắt lát (14%), bơ, sữa bột, chất tạo xốp (E500ii, E450i, E341i), muối, hương vani tổng hợp.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 477 kcal, chất đạm: 8.8 g, carbohydrat: 66.2 g, chất béo: 18.2 g, natri: 171 mg, đường tổng: 30.5 g.', 150, N'150 g'),
(51, 11, N'Mochi nướng vừng đen', 8000, N'gói', N'Bánh Mochi nướng vừng đen – nơi cái thơm bùi của mè rang quyện cùng hương vỏ bánh nướng giòn rụm, thêm kết cấu dai dai của bột mochi, tạo nên một tổng thể vừa mộc mạc, vừa cuốn hút đến lạ.
Thành phần: Bột làm bánh đặc biệt (chất ổn định (1440,1442), đường, tinh bột (khoai mì, lúa mì, bắp), bột mì, bột gạo, shortening thực vật, gluten lúa mì, bột sữa, chất béo thực vật, muối, chất nhũ hoá (471,473)), trứng gà, nước, bơ, vừng đen (4%), xì dầu.', 100, N'35g'),
(52, 11, N'Bánh mochi Hàn Quốc', 25000, N'gói', N'Bánh mochi Hàn Quốc có lớp vỏ mềm dẻo đặc trưng cùng hương vị thơm ngon hấp dẫn. Được sản xuất từ nguyên liệu chất lượng cao theo quy trình đảm bảo an toàn thực phẩm, sản phẩm phù hợp cho những bữa ăn nhẹ hiện đại. 
Thành phần: Bột trộn đặc biệt (chất ổn định (1440, 1442), đường, tinh bột (khoai mì, lúa mì, bắp), bột mì, bột gạo, shortening thực vật, gluten lúa mì, bột sữa, chất béo thực vật, muối, chất nhũ hóa (471, 473)), trứng gà, nước, bơ, hạt vừng, xì dầu
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: năng lượng: 383 Kcal, chất đạm: 7.3 g, carbohydrat: 46.7 g, đường tổng: 15.3 g, chất béo: 18 g, natri: 280 mg.
Thông tin cảnh báo: không sử dụng bánh khi hết hạn và người dị ứng với thành phần của sản phẩm.
Hướng dẫn sử dụng: sản phẩm dùng để ăn liền.
Hướng dẫn bảo quản: bảo quản nơi khô ráo thoáng mát, tránh ánh nắng trực tiếp.
Ngày sản xuất, Hạn sử dụng và Khối lượng tịnh: xem trên bao bì.', 100, N'40 g'),
(53, 11, N'Kẹo dẻo vui vẻ', 35000, N'gói', N'Kẹo dẻo thơm ngon với năm hương vị xá xị, lá dứa, bạc hà, sữa chua, chanh muối mới lạ độc đáo.
Thành phần: Đường (48%), mạch nha, phụ gia thực phẩm (chất nhũ hoá 440; chất điều chỉnh độ axit 331iii, 330; chất chống đông vón 551), hương liệu (chanh muối, bạc hà, sữa chua, lá dứa) tổng hợp, hương liệu xá xị giống tự nhiên, chất tạo màu tự nhiên gardenia blue, chất tạo màu tổng hợp (102, 133, 150d).
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 360 Kcal, carbohydrat: 89.3 g, natri: 52.9 mg, ường tổng: 79.5 g.', 100, N'85g'),
(54, 11, N'Kẹo dẻo hoa quả', 35000, N'gói', N'Chanh dây, cam, dâu, đào, dưa lưới - năm loại kẹo dẻo vị hoa quả thơm ngon bọc trong những viên đường óng ánh ngọt ngào.
Thành phần: Đường (48%), mạch nha, phụ gia thực phẩm (chất nhũ hoá 440; chất điều chỉnh độ axit 331iii, 330; chất chống đông vón 551), hương liệu (dâu, chanh dây, cam, đào, dưa lưới) tổng hợp, chất tạo màu tự nhiên (120, 164, gardenia blue), chất tạo màu tổng hợp 160i.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 344 Kcal, carbohydrat: 85.1 g, natri: 56.6 mg, ường tổng: 79.7 g.', 100, N'85g'),
(55, 11, N'Bánh phô mai que 70g', 60000, N'gói', N'Bánh phô mai que thơm vị bơ sữa, thêm phô mai béo nhẹ - phù hợp cho bé ăn chơi hằng ngày và giúp ba mẹ có thêm lựa chọn vào bữa xế thay cho snack, bim bim hay bánh kẹo ngọt thông thường.Thành phần: Bột trộn đặc biệt (bột mì, đường trắng, bột sữa nguyên kem, chất ổn định INS 1440, muối tinh, chất nhũ hoá INS 471), bơ, trứng gà, phô mai bột (4.5%), nước.Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 476 Kcal; Chất đạm: 6.6 g; Carbohydrat: 67.5 g; Chất béo: 19.9 g; Natri: 270 mg; Đường tổng: 16.5 g.', 70, N'70g'),
(56, 12, N'Bánh bao nhân thịt', 25000, N'túi', N'Bánh bao nhân thịt có lớp vỏ trắng mềm, xốp nhẹ cùng phần nhân đậm đà, thơm ngon. Sản phẩm được sản xuất từ nguyên liệu tuyển chọn, đáp ứng các tiêu chuẩn chất lượng và an toàn thực phẩm nghiêm ngặt.
Thành phần: Bột mì, bột khoai tây, thịt lợn (24%), sữa tươi, nước, đường, mộc nhĩ, bơ, miến, hành khô, hạt tiêu, muối, bột ngọt, men.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 264.7 Kcal, chất đạm: 6.5 g, carbohydrat: 38.9 g, chất béo: 7.5 g, natri: 362 mg, đường tổng: 5.9 g.
Lưu ý: Khi mua sản phẩm về cần bảo quản đúng điều kiện nhiệt độ để đảm bảo chất lượng sản phẩm. 
Hướng dẫn sử dụng: Rã đông bánh (với bánh cấp đông), bóc bánh khỏi túi nilon, cho bánh vào xửng hấp nóng trong thời gian từ 8 - 10 phút tính từ thời gian nước sôi.
Hướng dẫn bảo quản: Bảo quản nhiệt độ -18°C.
Ngày sản xuất (NSX): 20 ngày trước hạn sử dụng.
Hạn sử dụng (HSD): Xem trên bao bì.', 100, N'80 g'),
(57, 12, N'Bánh bao nhân trứng sữa', 25000, N'túi', N'Bánh bao nhân trứng sữa nổi bật với lớp vỏ mềm mịn và phần nhân béo thơm, ngọt dịu. Đây là lựa chọn phù hợp cho bữa sáng hoặc bữa phụ nhờ hương vị hấp dẫn và chất lượng đáng tin cậy.
Thành phần: Bột mì, sữa tươi (13%), trứng gà (11%), nước, đường, bơ, men, muối, màu thực phẩm: ribo avin tổng hợp.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 249 Kcal, chất đạm: 6.9 g, carbohydrat: 39.7 g, chất béo: 5.6 g, natri: 228 mg, đường tổng: 10.6 g.
Lưu ý: Khi mua sản phẩm về cần bảo quản đúng điều kiện nhiệt độ để đảm bảo chất lượng sản phẩm. 
Hướng dẫn sử dụng: Rã đông bánh (với bánh cấp đông), bóc bánh khỏi túi nilon, cho bánh vào xửng hấp nóng trong thời gian từ 8 - 10 phút kể từ khi nước sôi.
Hướng dẫn bảo quản: Bảo quản nhiệt độ -18°C.
Ngày sản xuất (NSX): 20 ngày trước hạn sử dụng.
Hạn sử dụng (HSD): Xem trên bao bì.', 100, N'80 g'),
(58, 12, N'Bánh bao nhân thịt xá xíu', 25000, N'túi', N'Bánh bao nhân thịt có lớp vỏ trắng mềm, xốp nhẹ cùng phần nhân đậm đà, thơm ngon. Sản phẩm được sản xuất từ nguyên liệu tuyển chọn, đáp ứng các tiêu chuẩn chất lượng và an toàn thực phẩm nghiêm ngặt.
Thành phần: Bột mì, bột khoai tây, thịt lợn (24%), sữa tươi, nước, đường, mộc nhĩ, bơ, miến, hành khô, hạt tiêu, muối, bột ngọt, men.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 264.7 Kcal, chất đạm: 6.5 g, carbohydrat: 38.9 g, chất béo: 7.5 g, natri: 362 mg, đường tổng: 5.9 g.
Lưu ý: Khi mua sản phẩm về cần bảo quản đúng điều kiện nhiệt độ để đảm bảo chất lượng sản phẩm. 
Hướng dẫn sử dụng: Rã đông bánh (với bánh cấp đông), bóc bánh khỏi túi nilon, cho bánh vào xửng hấp nóng trong thời gian từ 8 - 10 phút tính từ thời gian nước sôi.
Hướng dẫn bảo quản: Bảo quản nhiệt độ -18°C.
Ngày sản xuất (NSX): 20 ngày trước hạn sử dụng.
Hạn sử dụng (HSD): Xem trên bao bì.', 100, N'80 g'),
(59, 12, N'Bánh bao nhân đậu xanh', 30000, N'túi', N'Lớp vỏ bánh mềm mại, trắng mịn, điểm chút xanh tươi của lá dứa đầy hấp dẫn. Cắn vào bên trong, nhân đậu xanh ngọt nhẹ, thơm bùi lan tỏa, tạo nên trải nghiệm vị giác dịu dàng, thích hợp cho bữa sáng hay bữa xế nhẹ nhàng, thư thái.
Thành phần: Bột mì, đậu xanh (15%), sữa tươi, đường, nước, bột nếp, đường mạch nha, dầu thực vật, shortening, men, muối, chất tạo xốp (E500ii, E450i, E341i), hương sữa tổng hợp, bột trà xanh, hương đậu xanh tổng hợp.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 300 Kcal, chất đạm: 7.4 g, carbohydrat: 55.1 g, chất béo: 4.0 g, natri: 222 mg, đường tổng: 14.4 g.', 240, N'Túi 3 cái - 240g'),
(60, 12, N'Bánh bao chay sữa', 25000, N'túi', N'Bánh bao mềm xốp, thơm ngọt hương sữa, dễ ăn, phù hợp với mọi thành viên trong gia đình. Sản phẩm đông lạnh tiện lợi, chỉ cần hấp nóng là có ngay bữa ăn nhanh gọn, ngon miệng.
Thành phần: Bột mì, sữa tươi (16,5%), đường, nước, shortening, men, muối, chất tạo xốp (E500ii, E450i, E341i), hương sữa tổng hợp.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 274 Kcal, chất đạm: 8.0 g, carbohydrat: 49.6 g, chất béo: 3.7 g, natri: 239 mg, đường tổng: 6.7 g.', 220, N'Túi 4 cái - 220g'),
(61, 13, N'Pizza gà nướng kiểu Thái', 49000, N'cái', N'Pizza gà nướng kiểu Thái gây ấn tượng với tạo hình chữ nhật dài lạ mắt, hấp dẫn ngay từ ánh nhìn đầu tiên. Đế pizza mềm ẩm, phủ đầy gà nướng thơm đậm vị cùng rau củ giòn bùi. Sốt kiểu Thái cay ngọt lạ miệng, hòa quyện cùng các nguyên liệu tạo nên hương vị hài hòa, cuốn hút. Một lựa chọn mới mẻ cho những ai yêu thích pizza nhưng muốn khám phá trải nghiệm khác biệt.', 100, N'Theo sản phẩm'),
(62, 13, N'Bánh pizza xúc xích ngô', 25000, N'cái', N'Bánh pizza xúc xích ngô là sự hòa quyện giữa lớp bánh mềm, xúc xích thơm ngon và hạt ngô ngọt tự nhiên. Sản phẩm mang đến hương vị hấp dẫn cùng chất lượng ổn định từ thương hiệu uy tín lâu năm.', 100, N'Size 6 inch'),
(63, 13, N'Pizza hải sản', 70000, N'cái', N'Đế bánh vàng giòn, phủ sốt cà chua đậm đà, kết hợp tôm, mực tươi ngon cùng phô mai béo ngậy. Thêm ớt chuông và hành tây giòn ngọt, tạo nên hương vị cân bằng, hấp dẫn.
Thành phần: Bột mì, phomai, hải sản (tôm 12,5%, mực 12,5%), bơ, sốt cà chua, hành tây, ớt chuông, đường, men, muối, lá oregano.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 290.8 Kcal, chất đạm: 15.8 g, carbohydrat: 22.9 g, chất béo: 14.0 g, natri: 455.0 mg, đường tổng: 5.2 g.', 100, N'120g'),
(64, 13, N'Pizza dăm bông dứa', 120000, N'cái', N'Kết hợp hai hương vị hấp dẫn trong một chiếc pizza cỡ lớn, cho trải nghiệm trọn vẹn và đã miệng hơn. Vị dăm bông mặn mà hoà quyện dứa chua ngọt cùng hải sản tươi ngon, phô mai béo ngậy và sốt đậm đà. Lựa chọn hoàn hảo để chia sẻ cùng gia đình và bạn bè!
Pizza hải sản:
Thành phần: Bột mì, phomai, hải sản (tôm 12,5%, mực 12,5%), bơ, sốt cà chua, hành tây, ớt chuông, đường, men, muối, lá oregano.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 290.8 Kcal, chất đạm: 15.8 g, carbohydrat: 22.9 g, chất béo: 14.0 g, natri: 455.0 mg, đường tổng: 5.2 g.
Số tự công bố: 09/PHD/2022
Pizza dăm bông dứa
Thành phần: Bột mì, phô mai, dứa (20%), dăm bông (15%), bơ, sốt cà chua, hành tây, ớt chuông, đường, men, muối, lá oregano.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 271.7 Kcal, chất đạm: 13.1 g, carbohydrat: 26.5 g, chất béo: 11.3 g, natri: 381.0 mg, đường tổng: 5.7 g.', 100, N'240g'),
(65, 13, N'Pizza phô mai hảo hạng', 108000, N'cái', N'Chiếc bánh hoàn hảo cho tín đồ phô mai! Lớp phô mai dày dặn, kéo sợi béo ngậy, hòa quyện cùng đế bánh nướng vàng giòn và sốt đậm đà. Mỗi miếng cắn đều mang đến trải nghiệm ẩm thực thơm ngon, khó cưỡng!
Thành phần: Bột mì, phomai (40%), bơ, sốt cà chua, hành tây, ớt chuông, đường, men, muối, lá oregano.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: Năng lượng: 305.0 Kcal, chất đạm: 15.2 g, carbohydrat: 24.8 g, chất béo: 15.0 g, natri: 403.0 mg, đường tổng: 7.7 g.', 220, N'220g'),
(66, 14, N'Trà sữa Thái xanh 350ml', 25000, N'chai', N'Trà sữa Thái xanh là sự hòa quyện hoàn hảo giữa tinh chất trà Thái xanh thơm dịu và vị béo mịn của sữa, tạo nên màu xanh ngọc bắt mắt cùng hương vị tươi mát đầy lôi cuốn. Từng ngụm trà mang đến cảm giác thanh nhẹ, ngọt dịu, cân bằng giữa vị trà đặc trưng và sự béo ngậy vừa phải. Điểm nhấn của thức uống này chính là thạch rau câu dai giòn sần sật, khiến mỗi lần thưởng thức càng thêm thú vị. Ngon hơn khi uống lạnh.Thành phần: Nước tinh khiết, đường kính, bột kem (non dairy creamer), sữa lỏng evaporated filled milk (2,5%), tinh chiết trà Thái xanh (3g/l), bột rau câu.Thông tin dinh dưỡng trong 100 ml sản phẩm: Năng lượng: 45 Kcal, carbohydrat: 7.5 g, chất béo: 1.31 g, natri: 12.4 mg, đường tổng: 5.8 g.', 350, N'350 ml'),
(67, 14, N'Trà đào 350ml', 25000, N'chai', N'Vị đào ngâm chua ngọt hoà quyện cùng trà thanh mát, mang đến cảm giác sảng khoái tươi mới. Đặc biệt, những miếng đào ngâm cắt nhỏ giúp mỗi ngụm trà thêm phần thú vị, nhâm nhi mãi không chán!Thành phần: Nước, đào ngâm (6,4%), đường, axit citric, maltodextrin, chiết xuất trà đen (1,6%), bột thạch rau câu.Thông tin dinh dưỡng trong 100 g sản phẩm: Năng lượng: 47 Kcal, carbohydrat: 11.4 g, natri: 4.2 mg, đường tổng: 10.7 g.', 350, N'350 ml'),
(68, 14, N'Trà sữa 350ml', 25000, N'chai', N'Vị trà sữa thơm béo, ít ngọt, mát lạnh sảng khoái, hoà quyện cùng thạch giòn tươi sần sật, tạo nên trải nghiệm nhâm nhi đầy thú vị. Thức uống giải khát yêu thích cho mọi khoảnh khắc thư giãn!
Thành phần: Nước, đường, bột kem kem béo thực vật, kem lỏng nấu ăn (2,2%), trà đen tinh chiết (0,8%), bột thạch rau câu, hương cà phê tổng hợp.
Thông tin dinh dưỡng trung bình trong 100 g sản phẩm: năng lượng: 52 Kcal, carbohydrat: 9.5 g, chất béo: 1.4 g, natri: 11.9 mg, đường tổng: 6.1 g.', 350, N'350 ml'),
(69, 14, N'Kombucha chanh', 59000, N'lon', N'Kombucha Chanh với hương vị chua nhẹ nhàng từ những trái chanh vàng là thức uống được lòng hầu hết các thực khách. Thức uống thơm ngon này còn chứa nhiều chất dinh dưỡng, chất xơ, chống oxy hóa, pectin, kali, vitamin C... tốt cho sức khỏe.
Kombucha Chanh với hương vị chua nhẹ nhàng từ những trái chanh vàng là thức uống được lòng hầu hết các thực khách. Thức uống thơm ngon này còn chứa nhiều chất dinh dưỡng, chất xơ, chống oxy hóa, pectin, kali, vitamin C... tốt cho sức khỏe.
Tuy có tên gọi là “trà kombucha” nhưng thực chất đây là sản phẩm lên men từ nấm scoby trong môi trường trà xanh và đường, vì thế mà trà kombucha có vị chua kèm bọt gas. Đây là thức uống được nhiều người sử dụng thay thế các loại đồ uống giải khát có đường.
Hương vị: chua mát, thanh thanh - thơm hương chanh vàng.
Thành phần: nước tinh khiết, đường kính, trà xanh, men Scoby, nước cốt chanh vàng tự nhiên (4,5%).
Thông tin dinh dưỡng trung bình trong 100g sản phẩm: Năng lượng: 43.0 kcal; Đường tổng: 10.3 g; Carbohydrat: 10.4 g.', 100, N'200ml'),
(70, 14, N'Kombucha cà phê', 59000, N'lon', N'Ngày nay, nhiều người cho rằng việc uống trà không chỉ để mọi người thư giãn, nghỉ ngơi mà còn mang lại những lợi ích tốt cho sức khỏe. Kombucha Cà Phê là sự kết hợp giữa trà kombucha lên men tự nhiên cùng cà phê ủ lạnh. Sản phẩm có hương vị thanh mát, hơi ngọt, chứa nhiều dưỡng chất tốt cho sức khỏe.
Thức uống này có các vi khuẩn và men làm kích thích quá trình lên men khi kết hợp với đường. Sau khi lên men, kombucha chứa giấm, vitamin nhóm B, enzyme, probiotic (vi khuẩn và nấm men có tác dụng tích cực lên hệ tiêu hoá) và có hàm lượng cao axit (acetic, gluconic và lactic) với nhiều công dụng với sức khỏe.
Hương vị: chua dịu - thơm hương vị cà phê êm, nhẹ.
Thành phần: nước tinh khiết, chiết xuất cà phê (110 g/l), đường kính, men Scoby.
Thông tin dinh dưỡng trung bình trong 100g sản phẩm: Năng lượng: 71 kcal; Đường tổng: 16.9 g; Carbohydrat: 17.4 g.', 110, N'200ml'),
(71, 15, N'Cà phê muối', 75000, N'chai', N'Cà Phê Muối Fresh Garden có nguồn gốc xuất xứ từ Huế và là thức uống đặc sản của xứ Huế, đây là món đồ uống rất riêng, mang hương vị đặc trưng của mảnh đất cố đô Huế.
Cà Phê Muối được pha theo cách truyền thống bằng dụng cụ phin nên không chỉ giữ nguyên được hương vị mà còn mang hương vị mới lạ khi kết hợp chút béo nhẹ, chút mằn mặn của muối và kem trong ly cà phê truyền thống, vị cà phê hiện đại mang đến cảm xúc cho người thưởng thức.
Hương vị: Đậm cà phê, béo ngậy vị kem sữa, dễ uống.
Thành phần: nước tinh khiết, chiết xuất bột cà phê (125 g/l), kem tươi, sữa đặc, đường kính, muối tinh (0,36%).
Thông tin dinh dưỡng trung bình trong 100g sản phẩm: Năng lượng: 184 kcal; Chất đạm: 2.7 g; Carbohydrat: 11.8 g; Chất béo: 14.0 g; Natri: 204.4 mg; Đường tổng: 11.3 g.', 125, N'200ml'),
(72, 15, N'Cà phê đen', 45000, N'chai', N'Hương vị: Mạnh mẽ, đầy mê hoặc với hương thơm đặc trưng của Robusta kết hợp cùng những nốt hương phong phú, đa dạng như trái cây khô (dâu tây, nho khô, mận), chocolate đen, đường nâu, sấu, gia vị và rượu vang, tạo nên một bản hòa ca hương vị đầy ấn tượng.
Thông tin dinh dưỡng trung bình trong 100g sản phẩm: Năng lượng: 21 kcal; Chất đạm: 1.9 g; Carbohydrat: 2.8 g.', 100, N'100ml'),
(73, 15, N'Cà phê ủ lạnh', 65000, N'chai', N'Cà Phê Ủ Lạnh của Fresh Garden sử dụng hạt Arabica Cầu Đất, Lâm Đồng. Với phương pháp sơ chế ướt, hương vị cà phê có sự sự sạch, sáng, độ acid rõ nét. Hạt arabica Núi min được rang ở mức độ medium - giúp cho cà phê có độ chua nhẹ nhưng cấu trúc của thức uống tương ứng với độ đặc nhất định sẽ tăng đáng kể. Hương vị phong phú và sắc sảo, nguyên bản của hạt kết hợp với phương pháp ủ lạnh, mang lại cho bạn một ly cà phê ngập hương hoa vị chua hoa quả.
Cà phê ủ lạnh có lượng chất chống oxy hóa khá cao. Những nhóm chất này giúp cơ thể ngăn chặn lão hóa và giảm nguy cơ mắc nhiều bệnh. Theo nghiên cứu của bác sỹ Frank Hu từ Harvard thì cà phê ủ lạnh có nhiều lợi ích sức khỏe, bao gồm giảm nguy cơ mắc bệnh tiểu đường loại 2 và các bệnh về gan, tim và thần kinh. Nó cũng có thể có lợi cho sức khỏe tinh thần và giúp bạn sống lâu hơn.
Hương vị: dịu - êm đặc trưng của arabica, ngập hương hoa và vị chua hoa quả.
Thành phần: nước tinh khiết, chiết xuất bột cà phê (110 g/l).
Thông tin dinh dưỡng trung bình trong 100g sản phẩm: Năng lượng: 6.5 kcal; Carbohydrat: 1.8 g.', 110, N'200ml'),
(74, 15, N'Cà phê latte', 25000, N'cốc', N'Sản phẩm Cà phê latte chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(75, 15, N'Cà phê cappuccino', 25000, N'cốc', N'Sản phẩm Cà phê cappuccino chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(76, 16, N'Nước ion kiềm Mira pH9+ 360ml', 6000, N'chai', N'Nước uống ion kiềm Mira pH9+ 360ml là sự kết hợp hoàn hảo giữa tính tiện lợi và lợi ích sức khỏe.
 Với thiết kế nhỏ gọn, chai 550ml, 360ml dễ dàng mang theo, phù hợp cho mọi hoạt động hàng ngày từ công sở, học tập đến thể thao', 360, N'360ml'),
(77, 16, N'Nước ion kiềm Mira pH9+ 550ml', 8000, N'chai', N'Nước kiềm là nước có độ kiềm được đo bằng độ pH, có chỉ số pH &gt; 7. Nước ion kiềm được tạo ra từ quá trình điện phân nước. Giá trị của nước ion kiềm là ở khả năng khử oxy hóa nhờ có chỉ số ORP (khả năng khử các chất oxy hóa của một chất) âm tính. Về nguyên tắc, chỉ số ORP càng âm sâu thì khả năng khử oxy hóa càng mạnh nên sẽ có tác dụng đối với việc chống lại quá trình lão hóa của cơ thể.', 550, N'550ml'),
(78, 16, N'Relax hương chanh', 25000, N'chai', N'Thành phần: Vitamin C, ZinC, Magie Lợi ích: 
• Mang lại những giây phút bình tĩnh, thúc đẩy quá trình trao đổi chất, giảm bớt lo âu, giàu chất chống oxy hóa và có lợi ích cho sức khỏe tim mạch. • Vitamin C giúp hấp thu sắt, góp phần làm giảm mệt mỏi, bảo vệ hệ thống miễn dịch.
 • Magie và ZinC giúp giảm lo âu và cải thiện chất lượng giấc ngủ.', 100, N'500ml'),
(79, 16, N'Antiox hương đào', 25000, N'chai', N'Thành phần: Vitamin D3, Magie, SelenLợi ích:
•        Tốt cho xương, khớp, tăng cường miễn dịch.
•        Vitamin D3 và Magie cần thiết cho quá trình xây dựng các tế bào xương mới, tăng mật độ khoáng xương, giảm nguy cơ loãng xương.
•        Selen giúp bảo vệ và tăng cường hệ miễn dịch, chống lại các tác nhân nhiễm trùng và quá trình oxy hóa.', 100, N'500ml'),
(80, 16, N'Energy hương dâu', 25000, N'chai', N'Thành phần: Vitamin C, Axit Folic, Magie Lợi ích:
 • Bổ sung năng lượng tức thì, phù hợp khi cần tăng cường thêm các khoáng chất trong quá trình vận động hoặc bất kỳ thời điểm nào trong ngày.
 • Vitamin C giúp hấp thu sắt, cùng với vitamin B12 giúp cơ thể tạo ra năng lượng. 
• Axit Folic và ZinC tăng cường sự tổng hợp của DNA và bảo vệ tế bào. 
• Magie là khoáng chất thiết yếu cho sản xuất năng lượng, sự co cơ, chức năng thần kinh.', 100, N'500ml'),
(81, 17, N'Bánh trường học bông lan', 25000, N'chiếc', N'Sản phẩm Bánh trường học bông lan chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(82, 17, N'Bánh trường học sữa chua', 25000, N'chiếc', N'Sản phẩm Bánh trường học sữa chua chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(83, 17, N'Bánh trường học phô mai', 25000, N'chiếc', N'Sản phẩm Bánh trường học phô mai chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(84, 17, N'Bánh trường học ruốc', 25000, N'chiếc', N'Sản phẩm Bánh trường học ruốc chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(85, 17, N'Bánh trường học choco', 25000, N'chiếc', N'Sản phẩm Bánh trường học choco chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(86, 18, N'Nến số sinh nhật', 21000, N'cái', N'Thành phần: Sắp ong tinh khiết, bấc bông, nhựa PP thực phẩmCông dụng: Dùng trong các buổi tiệc sinh nhật, sự kiệnLưu ý sử dụng: Tránh gió mạnh, tránh vật dễ cháy, nổ kiểm soát trẻ nhỏ Loại trừ hoàn toàn độc hại với 100% sáp ong tinh khueets và bấc bôngCháy 10 phút/ cây tỏa sáng vàng lung linh tuyệt đẹpKhông chảy nhỏ giọt , không sử dụng hóa chất, nguyên liệu có hại cho con người và môi trường', 100, N'Theo sản phẩm'),
(87, 18, N'Bộ nến xoắn', 25000, N'hộp', N'Sản phẩm Bộ nến xoắn chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(88, 18, N'Dao cắt bánh', 25000, N'cái', N'Sản phẩm Dao cắt bánh chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(89, 18, N'Đĩa giấy sinh nhật', 25000, N'tập', N'Sản phẩm Đĩa giấy sinh nhật chính hãng Fresh Garden.', 100, N'Theo sản phẩm'),
(90, 18, N'Mũ sinh nhật', 6000, N'cái', N'Những chiếc mũ sinh nhật đáng yêu với nhiều lựa chọn như hình Elsa, nàng tiên cá, unicorn, giúp bé yêu thêm vui thích trong ngày đặc biệt. Thiết kế dễ thương, chất liệu an toàn, tạo điểm nhấn cho bữa tiệc sinh nhật tràn ngập niềm vui!', 100, N'Theo sản phẩm');
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
(1001, NULL, 1, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_ng_c_8_1_d416f27f01e041b3af4101b6d6218b34_master.png'),
(1002, NULL, 2, N'https://cdn.hstatic.net/products/200000411281/cara_c__ph__8.1_53725da3c07b4bfba489312a8f50f3fb_master.png'),
(1003, NULL, 3, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_tr_ng_1_4bb8f1f07de545d8b1545c326e475fb2_master.png'),
(1004, NULL, 4, N'https://cdn.hstatic.net/products/200000411281/1_3ede234aa96f42498e4c3760e2453a33_master.png'),
(1005, NULL, 5, N'https://cdn.hstatic.net/products/200000411281/1_b642216e09214b38a3cf4bc2d3474bee_master.png'),
(1006, NULL, 6, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_v_ng_6_1_a96cb688261b4de4890b553eb28dd141_master.png'),
(1007, NULL, 7, N'https://cdn.hstatic.net/products/200000411281/1_c545f7515ba44e8792beebaa2b730dc9_master.png'),
(1008, NULL, 8, N'https://cdn.hstatic.net/products/200000411281/1_c92e0fedc3f94923a92e1d02433506ce_master.png'),
(1009, NULL, 9, N'https://cdn.hstatic.net/products/200000411281/1_f805066be2d043c998a2ccfdcdc93bb5_master.png'),
(1010, NULL, 10, N'https://product.hstatic.net/200000411281/product/amber_spirit_6_1_4bde9c0073e746339af994c3ab0a5362_master.png'),
(1011, NULL, 11, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_s_a_4_1_5a191e0094b7410794b5a9565e6d3c02_master.png'),
(1012, NULL, 12, N'https://cdn.hstatic.net/products/200000411281/caramel_mu_i_h_ng_4.1_0a0acb8d50ff4cfb9a253a5164468872_master.png'),
(1013, NULL, 13, N'https://cdn.hstatic.net/products/200000411281/k__l_n_k__di_u_1_b101ec16b36c4f7a8e4ce4e2c05adf28_master.png'),
(1014, NULL, 14, N'https://cdn.hstatic.net/products/200000411281/b_ng_tuy_t_4.1_2401b79ab4ee40c4a1f982ca71cd725f_master.png'),
(1015, NULL, 15, N'https://cdn.hstatic.net/products/200000411281/1_d0a7e1ee2d70403684703e45d93788f0_master.png'),
(1016, NULL, 16, N'https://cdn.hstatic.net/products/200000411281/1_68100065b0834eeeb26d403cf062bc09_master.png'),
(1017, NULL, 17, N'https://cdn.hstatic.net/products/200000411281/1_75f90fde3c5b4a06a6f14cd0f80be809_master.png'),
(1018, NULL, 18, N'https://cdn.hstatic.net/products/200000411281/1_b74a7fd5534c4fc68f9c08f9ea61c17d_master.png'),
(1019, NULL, 19, N'https://cdn.hstatic.net/products/200000411281/1_f477bba31c434fa7b62ba1f1054f47b7_master.png'),
(1020, NULL, 20, N'https://cdn.hstatic.net/products/200000411281/b_nh_scone_2_ac0b5f0b682d4e39aac7e015a4b487a4_master.png'),
(1021, NULL, 21, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__th_t_heo__p_ch_o_1_09f060d1eef147e9884f631164ee13fe_master.png'),
(1022, NULL, 22, N'https://cdn.hstatic.net/products/200000411281/b_nh_burger_th_t_x__x_u_1_e7cd8ef9912e4a21a528d17965040447_master.png'),
(1023, NULL, 23, N'https://cdn.hstatic.net/products/200000411281/b_nh_ru_c_xo_n_d_m_d___1__cae264e4b1fc495a833c72361d00c7ee_master.png'),
(1024, NULL, 24, N'https://cdn.hstatic.net/products/200000411281/b_nh_th_t_t__i_tr_n_v__1_6b4dfd82552e44e09b3a311a55f3e823_master.png'),
(1025, NULL, 25, N'https://cdn.hstatic.net/products/200000411281/1_5ab8694a870e4bd3bd6f0687998d587d_master.png'),
(1026, NULL, 26, N'https://cdn.hstatic.net/products/200000411281/b_nh_g_i_tr_ng_1_348919480efe4047a0734977ad9fb935_master.png'),
(1027, NULL, 27, N'https://cdn.hstatic.net/products/200000411281/magnific_banh-mi-goi_79pamk1jal_97e3f811af474de5988e5f13f5d250e9_master.png'),
(1028, NULL, 28, N'https://cdn.hstatic.net/products/200000411281/banh_vuong_mien_xuc_xich_1_a4d398e7d38b477aa56bf82d24431ecc_master.png'),
(1029, NULL, 29, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__gi_n_b__t_i_nh__6901cd560b6d47cfb6d9cf122653638b_master.png'),
(1030, NULL, 30, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__gi_n_caramel_nh__6cf3abc2bd3c4b86a77ac9d42666fb1f_master.png'),
(1031, NULL, 31, N'https://cdn.hstatic.net/products/200000411281/sandwich_b__ph__mai_1_fa710acea2234f1b9899bbe98f88b948_master.png'),
(1032, NULL, 32, N'https://cdn.hstatic.net/products/200000411281/sandwich_t_m_1_597314f5b37349ca99b15afc14a7ed58_master.png'),
(1033, NULL, 33, N'https://cdn.hstatic.net/products/200000411281/1_8fb981a97f0147f8929b7928bd3ec329_master.png'),
(1034, NULL, 34, N'https://cdn.hstatic.net/products/200000411281/sachi_v_ng_b01d7847dd3846d6b29de11e80edb15b_master.png'),
(1035, NULL, 35, N'https://product.hstatic.net/200000411281/product/bo_go_full_v2_0f7965c196e3472e8369c1a4ff83f787_master.png'),
(1036, NULL, 36, N'https://product.hstatic.net/200000411281/product/b_nh_opera_1_7118f675a69e4a829e4483f845226b28_master.png'),
(1037, NULL, 37, N'https://product.hstatic.net/200000411281/product/banh_chiffon_tra_ba_tuoc_2_eccb2571ac36478ca65bea618a3432b4_master.png'),
(1038, NULL, 38, N'https://product.hstatic.net/200000411281/product/banh_madeleine_so_co_la_2_1fa8c60b27d74df88ffc5e07b90392eb_master.png'),
(1039, NULL, 39, N'https://cdn.hstatic.net/products/200000411281/banh_chiffon_so-co-la_1_261908b80bf545dea3e63d5dfe9fbf8e_master.png'),
(1040, NULL, 40, N'https://cdn.hstatic.net/products/200000411281/banh_chiffon_vani_1_096dc92c9f1e4dcca7afbfa18fdae5f6_master.png'),
(1041, NULL, 41, N'https://cdn.hstatic.net/products/200000411281/1_7312d04f2c2442b89cb23a45a9be8567_master.png'),
(1042, NULL, 42, N'https://cdn.hstatic.net/products/200000411281/1_f09ed2e485b843ac97767ddda06c6fcb_master.png'),
(1043, NULL, 43, N'https://cdn.hstatic.net/products/200000411281/mousse_d_a_1_a067deb3538445908ce1f93f4e90773a_master.png'),
(1044, NULL, 44, N'https://product.hstatic.net/200000411281/product/mousse_chanh_leo_1_b51b4a7ff17d4dc985e5e39e31355831_master.png'),
(1045, NULL, 45, N'https://product.hstatic.net/200000411281/product/caramen_1_31af7df7e27a420daaa588ba03284a26_master.png'),
(1046, NULL, 46, N'https://cdn.hstatic.net/products/200000411281/n__ng_h_nh_nh_n_tr__c_d445732c05bd4d78bf2fca252fb5270e_master.png'),
(1047, NULL, 47, N'https://cdn.hstatic.net/products/200000411281/d_a_tr__c_eb69615af40d4cadae0d184cdf2490d3_master.png'),
(1048, NULL, 48, N'https://cdn.hstatic.net/products/200000411281/b__m_t_d_u_tr__c_882274aadb724f60b2d1f65496e1eb64_master.png'),
(1049, NULL, 49, N'https://cdn.hstatic.net/products/200000411281/s__c__la_chip_tr__c_34e2d970ef1c468b816e6bcdb56282f7_master.png'),
(1050, NULL, 50, N'https://cdn.hstatic.net/products/200000411281/h_nh_nh_n_tr__c_8f01f94480514223bc4c58170f7679c0_master.png'),
(1051, NULL, 51, N'https://cdn.hstatic.net/products/200000411281/mochi_n__ng_v_ng_den_c727b309b4db413f995a9a1b043d69ca_master.png'),
(1052, NULL, 52, N'https://cdn.hstatic.net/products/200000411281/mochi_n__ng_v_ng_den_c727b309b4db413f995a9a1b043d69ca_master_766b06f9c81047589fd4f876bd67dbbf_master.png'),
(1053, NULL, 53, N'https://cdn.hstatic.net/products/200000411281/z7019750482871_290409540654dfca4a3feba6fa9c0c06_550af7827f9f45188cc03d94f0f5bf7e_master.jpg'),
(1054, NULL, 54, N'https://cdn.hstatic.net/products/200000411281/z7019750482957_dc842c6e01b5af8ae833febea908eef2_e9ee79d6425045a1ac773d15af9a1043_master.jpg'),
(1055, NULL, 55, N'https://cdn.hstatic.net/products/200000411281/1_4762ba554980435789327fda4f517d49_master.png'),
(1056, NULL, 56, N'https://cdn.hstatic.net/products/200000411281/b_nh_bao_th_t_4b320cd50bad48fabc796efb2687a0ba_master.jpg'),
(1057, NULL, 57, N'https://product.hstatic.net/200000411281/product/30_be5b91b72ab74936a8aaf2a38453c476_master.jpg'),
(1058, NULL, 58, N'https://product.hstatic.net/200000411281/product/17_db542133f54e4607b24bcddcdb027fc7_master.jpg'),
(1059, NULL, 59, N'https://product.hstatic.net/200000411281/product/29_6bfe07e6c917487a94dcb56abab30c69_master.jpg'),
(1060, NULL, 60, N'https://product.hstatic.net/200000411281/product/32_0ed082c5be9c417da1c9f8a050e643b8_master.jpg'),
(1061, NULL, 61, N'https://cdn.hstatic.net/products/200000411281/pizza_g__n__ng_ki_u_th_i_1_3a252cce10d244e397c206fe721ee15f_master.png'),
(1062, NULL, 62, N'https://cdn.hstatic.net/products/200000411281/pizza_1_f5c636d52cf04a30ad953d5eb35579ba_master.png'),
(1063, NULL, 63, N'https://product.hstatic.net/200000411281/product/hsan_b8fa334b64c8456c93495834959ed1ca_master.png'),
(1064, NULL, 64, N'https://product.hstatic.net/200000411281/product/dambong_e0ebcd1ee47a4294bc9ba67481d7b6ea_master.png'),
(1065, NULL, 65, N'https://product.hstatic.net/200000411281/product/hh_ea3d694c91094d0d8ac679694f4a96de_master.png'),
(1066, NULL, 66, N'https://cdn.hstatic.net/products/200000411281/th_i_xanh__2__0c9fa8ec6f3346eabc406815de012822_master.png'),
(1067, NULL, 67, N'https://cdn.hstatic.net/products/200000411281/tr__d_o_2_e864a4bf85b5499c9a580a280fcf5a8a_master.png'),
(1068, NULL, 68, N'https://cdn.hstatic.net/products/200000411281/tr__s_a__2__24dd28258ff1402da673153726452757_master.png'),
(1069, NULL, 69, N'https://product.hstatic.net/200000411281/product/kombucha_chanh_080a4099812d4785bb053532f6e61ea8_master.png'),
(1070, NULL, 70, N'https://product.hstatic.net/200000411281/product/kombucha_ca_phe_1_4b793cebdd6b4bf69ce723a407287f1e_master.png'),
(1071, NULL, 71, N'https://product.hstatic.net/200000411281/product/caa_phe_muoi_1_81d30e7f62784ccb8e270facbe129134_master.png'),
(1072, NULL, 72, N'https://product.hstatic.net/200000411281/product/cafe_den_1_0103753810be4a3591946642f7706aa7_master.png'),
(1073, NULL, 73, N'https://product.hstatic.net/200000411281/product/cafe_u_lanh_1_940ab45336fc4f0b90d0da9ff83fe420_master.png'),
(1074, NULL, 74, N'https://product.hstatic.net/200000411281/product/cafe_u_lanh_1_940ab45336fc4f0b90d0da9ff83fe420_master.png'),
(1075, NULL, 75, N'https://product.hstatic.net/200000411281/product/cafe_den_1_0103753810be4a3591946642f7706aa7_master.png'),
(1076, NULL, 76, N'https://product.hstatic.net/200000411281/product/ph_9__360_1_0fbbac9562f947b99a90eaf182f32eef_master.png'),
(1077, NULL, 77, N'https://product.hstatic.net/200000411281/product/ph_9__550_1_8d83da2e16d34e5e9c9098baa4519020_master.png'),
(1078, NULL, 78, N'https://product.hstatic.net/200000411281/product/vitamin_mira_chanh_1_2b2d933157424da8bcd1b9862bd54f8f_master.png'),
(1079, NULL, 79, N'https://product.hstatic.net/200000411281/product/vitamin_mira_dao_1_acd0389025144832b5a2b33f60c7bbad_master.png'),
(1080, NULL, 80, N'https://product.hstatic.net/200000411281/product/vitamin_mira_dau_1_56421107363343f3b7f1e41948918908_master.png'),
(1081, NULL, 81, N'https://product.hstatic.net/200000411281/product/bong_lan_cuon_ruoc_1_a2a8bd0b964845ab9571376d822d0619_master.jpg'),
(1082, NULL, 82, N'https://cdn.hstatic.net/products/200000411281/1_f477bba31c434fa7b62ba1f1054f47b7_master.png'),
(1083, NULL, 83, N'https://cdn.hstatic.net/products/200000411281/b_nh_t__i_ru_c_s_t_phomai_1_cfed638aa31749a3b70bac22861f6edc_master.png'),
(1084, NULL, 84, N'https://cdn.hstatic.net/products/200000411281/banh-mi-ruoc-to-50g-1_1eb04b9bd9624380a20fa2d15d3c894c_master.png'),
(1085, NULL, 85, N'https://cdn.hstatic.net/products/200000411281/1_b74a7fd5534c4fc68f9c08f9ea61c17d_master.png'),
(1086, NULL, 86, N'https://product.hstatic.net/200000411281/product/z3180684435428_3a4ce2edb81e0e90cdf2948313d147bc_09d4580e330240c386c4e23d8dd64b86_master.jpg'),
(1087, NULL, 87, N'https://product.hstatic.net/200000411281/product/z3180687197873_0222b2edecb38460cd6e398a9e17e458_af549051e48a463b9da3951a9a0bd021_master.jpg'),
(1088, NULL, 88, N'https://product.hstatic.net/200000411281/product/z3186933402260_039cb5d0c0c486e5b29b5babe57705a7_18ef7a34fa5143d3b03ef180fbed69ac_master.jpg'),
(1089, NULL, 89, N'https://product.hstatic.net/200000411281/product/z3186933416425_58f0d7321b592361fb7f3514de78a48b_33ec742aa0b84cd0922302152a55512a_master.jpg'),
(1090, NULL, 90, N'https://product.hstatic.net/200000411281/product/z3180697588588_82728ad8f57acc3f5975126872069a6e_f369defeaf444eb1abbb58aeaf0ae0fd_master.jpg'),
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

DECLARE @AnhBoSung TABLE
(
    MaSP INT PRIMARY KEY,
    Anh2 NVARCHAR(1000),
    Anh3 NVARCHAR(1000),
    Anh4 NVARCHAR(1000),
    Anh5 NVARCHAR(1000)
);

INSERT INTO @AnhBoSung (MaSP, Anh2, Anh3, Anh4, Anh5)
VALUES
(1,  N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_ng_c_8_2_fb59ff87ce0140c293cf236a2a6bca05_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_ng_c_8_3_38bc3ff62c2c47ef839f8ff7d9b09ddd_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_ng_c_8_4_dc78731358e9498eb7c5acc5834780d5_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_ng_c_8_5_0ec3fed85d8a4e5f9a9c89df5a847f89_master.png'),
(2,  N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-17_e510b2e4b0e9473ea69d942fb89a47d8_master.png', N'https://cdn.hstatic.net/products/200000411281/3_415ae31cf536481bafa94dd28d7eedf4_master.png', N'https://cdn.hstatic.net/products/200000411281/4_a287d15a924946d2b80698c8a50ead61_master.png', N'https://cdn.hstatic.net/products/200000411281/5_5fc3c89372504264b87885bfef150311_master.png'),
(3,  N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_tr_ng_2_6c7a0ef5d76d427d91be949d5e5db5ea_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_tr_ng_3_a586727c4fb740bd89328896b9be1513_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_tr_ng_4_21da22887a664b029e9ac2b3443c40a8_master.png', NULL),
(4,  N'https://cdn.hstatic.net/products/200000411281/2_fb8e547190b44819b5069908dddd06b3_master.png', N'https://cdn.hstatic.net/products/200000411281/3_79aa7761bf864d7499ea7bee174b0a87_master.jpeg', N'https://cdn.hstatic.net/products/200000411281/4_f46c9d645cc1421e975daf16a73da61a_master.jpeg', NULL),
(5,  N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-16_ab144bd5d498412b89f71fab1e1e173a_master.png', N'https://cdn.hstatic.net/products/200000411281/3_480753afc80846edaca2127fc92ec373_master.png', N'https://cdn.hstatic.net/products/200000411281/4_a6640558f27b4708b909c5723303e725_master.jpg', NULL),
(6,  N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_v_ng_6_2_afdb82d7ab714357b0dbcb26fa55430c_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_v_ng_6_3_4accb40625d44bb68b87ae43e8b5d0f0_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_v_ng_6_4_2dfc1bc7bfce470b834fc6dfd01c56f4_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_v_ng_6_5_a94be3f2c9164b69a3e43ca577cfb2fd_master.png'),
(7,  N'https://cdn.hstatic.net/products/200000411281/2_2691e73e71674d67b518bdd986f295e2_master.png', N'https://cdn.hstatic.net/products/200000411281/3_51b355e02a4d4bb9b48943952d912144_master.png', N'https://cdn.hstatic.net/products/200000411281/4_5b7a004778ef4ebb9dd99c0577cf3cd4_master.png', N'https://cdn.hstatic.net/products/200000411281/5_bfaa07aa3f0c4e4a984ee7be604d9996_master.png'),
(8,  N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-07_96adc8dd93194169873f3ae689612375_master.png', N'https://cdn.hstatic.net/products/200000411281/3_04546b3500114d6d904091aff2d89f8c_master.jpg', N'https://cdn.hstatic.net/products/200000411281/4_4907511ea3b6480c9b0d25318e64a395_master.jpg', N'https://cdn.hstatic.net/products/200000411281/5_0d363a2578e84ab7bfc8abb25e4734c6_master.jpg'),
(9,  N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-08_1b3e71e9317049cfb21092ba34ed8669_master.png', N'https://cdn.hstatic.net/products/200000411281/3_24584768a25d4d28aa790b55b9239d55_master.jpg', N'https://cdn.hstatic.net/products/200000411281/4_48fceb6ef20243e79383ec5edf0bbb14_master.jpg', NULL),
(10, N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-15_32445404d6fc4ce19b7cf0f35feefb0d_master.png', N'https://product.hstatic.net/200000411281/product/amber_spirit_6_3_13ae1699b3f64ae0bd1e83718197acc8_master.png', NULL, NULL),
(11, N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_s_a_4_2_f73fb2e3fddf4c1ea2cfe762b564ddd6_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_s_a_4_3_9ca75510f26f466ebc0c024792c20ae7_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_kem_m_y_s_a_4_4_da8d0d363afb4e6fb1ab441945f0baae_master.png', NULL),
(12, N'https://cdn.hstatic.net/products/200000411281/caramel_mu_i_h_ng_4.2_74ea37546dd54149abf1fbaca946b1cf_master.png', N'https://cdn.hstatic.net/products/200000411281/caramel_mu_i_h_ng_4.3_471f8cddaf804164b11592db7415ad02_master.png', N'https://cdn.hstatic.net/products/200000411281/caramel_mu_i_h_ng_4.4_b72ec88231844099b6bacc32b6d67798_master.png', NULL),
(13, N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh_f5b87cd82e444f3e8d222b4f813e4556_master.png', N'https://cdn.hstatic.net/products/200000411281/k__l_n_k__di_u_3_2af377c94eae40c786d2f24a11c6bcd1_master.png', N'https://cdn.hstatic.net/products/200000411281/k__l_n_k__di_u_4_19c1a14a688f4acfb5176931e0e2e49b_master.png', N'https://cdn.hstatic.net/products/200000411281/k__l_n_k__di_u_5_1b8eca14ad0446be8b84d809437ab201_master.png'),
(14, N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-18_74db3776f83a450b96891da2c69a4dde_master.png', N'https://cdn.hstatic.net/products/200000411281/b_ng_tuy_t_4.3_bfad496fec6a4537880b7af955c5f099_master.png', N'https://cdn.hstatic.net/products/200000411281/b_ng_tuy_t_4.4_900258367fea480ca487260b53f73e90_master.png', N'https://cdn.hstatic.net/products/200000411281/b_ng_tuy_t_4.5_6bb1e13a07f146c8babb76bab3c49788_master.png'),
(15, N'https://cdn.hstatic.net/products/200000411281/2_9a33cf0cae4548878644da8503a638fa_master.png', N'https://cdn.hstatic.net/products/200000411281/3_3a99c32a224f40ab8eca9ee42e0c8e3b_master.jpg', N'https://cdn.hstatic.net/products/200000411281/5_0bf1a2ab79e9498a8915c8c43cb98d51_master.jpg', N'https://cdn.hstatic.net/products/200000411281/4_22f259b6305e4839af6adb1dcd047e96_master.jpg'),
(16, N'https://cdn.hstatic.net/products/200000411281/2_592a69529b99431490e97cd0931dca21_master.png', N'https://cdn.hstatic.net/products/200000411281/3_61621fa81471435ea8edc317040e26eb_master.png', N'https://cdn.hstatic.net/products/200000411281/4_ddf94c83068242aa82ea724d5be7c0c6_master.png', NULL),
(17, N'https://cdn.hstatic.net/products/200000411281/2_d355feaaf06f4a809ea79757c93849b3_master.png', N'https://cdn.hstatic.net/products/200000411281/3_2dcdcdb622b44629a62e764043c8f23f_master.png', N'https://cdn.hstatic.net/products/200000411281/4_8fbb42fa7ba14288a12da264d8550bbc_master.png', N'https://cdn.hstatic.net/products/200000411281/5_8d63d2074cd34ee493012f6ad581095b_master.png'),
(18, N'https://cdn.hstatic.net/products/200000411281/2_27a35f99680940c2ac6d9521c9f676ae_master.png', N'https://cdn.hstatic.net/products/200000411281/3_33b0df897ec2487d8bc478914df5a90f_master.png', NULL, NULL),
(19, N'https://cdn.hstatic.net/products/200000411281/2_e5ec288a16d4418f9360c9d20079798a_master.png', N'https://cdn.hstatic.net/products/200000411281/3_a7f2b4d4d4584834a3c9bd75ed56b76c_master.png', N'https://cdn.hstatic.net/products/200000411281/4_838bbe1f5077443fb710d735fa4b1afa_master.png', NULL),
(20, N'https://cdn.hstatic.net/products/200000411281/b_nh_scone_1_6894a089167340318e1d38cb069faf0e_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_scone_3_a1630ec470ea49bfa3692569f977f993_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_scone_4_b2e33356d73d457f83fc9fb0e87eab4f_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_scone_5_a533501e8f6e4c2fb08b8acd0e5c7c35_master.png'),
(21, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__th_t_heo__p_ch_o_2_918f56fffe5b4b4099d7ccaea6bc398f_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_m__th_t_heo__p_ch_o_3_ed83d3cc7bb34ec4b928611966b290aa_master.png', NULL, NULL),
(22, N'https://cdn.hstatic.net/products/200000411281/n_n_x_m_2_4eb99b4abe954cb6a158e7e612fbe7a2_master.png', N'https://cdn.hstatic.net/products/200000411281/n_n_x_m_3_1dcfdc906ff04a3695cb596b5e120a12_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_burger_th_t_x__x_u_3_05a0d2d9a8b94166a46fb025c7905205_master.png', NULL),
(23, N'https://cdn.hstatic.net/products/200000411281/b_nh_ru_c_xo_n_d_m_d___2__19ce68b9504944c7801e7162bee74a3b_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_ru_c_xo_n_d_m_d___3__526b06a2e6d74714bdf0735a27fcf387_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_ru_c_xo_n_d_m_d___4__56d614bfde5a48af81ae5226b67f684f_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_ru_c_xo_n_d_m_d__e5fdafba8e5e4de8a08a4b8027b5dfb0_master.jpeg'),
(24, N'https://cdn.hstatic.net/products/200000411281/b_nh_th_t_t__i_tr_n_v__2_dbdaf680d97342a282da9cdf7a9825db_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_th_t_t__i_tr_n_v__3_e986ed77f1584a4bbcc251b840eafda7_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_th_t_t__i_tr_n_v__4_bbb5a4407767468899275613ab124728_master.png', NULL),
(25, N'https://cdn.hstatic.net/products/200000411281/2_789a1972f18643b5967c3ac0ac1a27f4_master.png', N'https://cdn.hstatic.net/products/200000411281/3_3da77b4222bb462d8811aeb8f55e63db_master.png', N'https://cdn.hstatic.net/products/200000411281/4_8cdd129db9c1412aaa7549bbc42176a3_master.png', NULL),
(26, N'https://cdn.hstatic.net/products/200000411281/b_nh_g_i_tr_ng_2_d26e62ff061a4f3c88698e6ff6d4358f_master.png', NULL, NULL, NULL),
(27, N'https://cdn.hstatic.net/products/200000411281/cat_choco_dua_c4cc82ec1f314c158842f2f3aec26228_master.png', N'https://cdn.hstatic.net/products/200000411281/magnific_banh-mi-goi_yineajnpw9_0862bf75f8b1496fbc273ea16d297d1d_master.png', N'https://cdn.hstatic.net/products/200000411281/magnific_banh-mi-goi-kem-bao-bi_go7tz7gsxo_e147d028d07746b7aadf70b2bbabd931_master.png', N'https://cdn.hstatic.net/products/200000411281/magnific_banh-mi-goi-kem-bao-bi_p36up7942c_71bb80063b014f85bd494b5d14bdd3f6_master.png'),
(28, N'https://cdn.hstatic.net/products/200000411281/banh_vuong_mien_xuc_xich_2_6eaf122dc2024c428b862ddaa7f15afb_master.png', N'https://cdn.hstatic.net/products/200000411281/banh_vuong_mien_xuc_xich_3_cacd17295a444f3c91105726b471af62_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_m__v__ng_mi_n_89650be378f4491085d9da8a9e0b4d72_master.png', NULL),
(29, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__gi_n_b__t_i_nh__2_b2334d34e3af42b0a1ffbcd74bfc25f7_master.png', N'https://cdn.hstatic.net/products/200000411281/6_128501eeeca842949bfd513d94741ba5_master.png', N'https://cdn.hstatic.net/products/200000411281/7_ec0dbfef7e01478fb9da774c86634f2d_master.png', NULL),
(30, N'https://cdn.hstatic.net/products/200000411281/b_nh_m__gi_n_caramel_nh__2_4d0a8b16111845b6b1df017ef5635567_master.png', N'https://cdn.hstatic.net/products/200000411281/4_5accbc95bb414d5cb5bfaf09562cd7ea_master.png', N'https://cdn.hstatic.net/products/200000411281/5_e129b08527cd47cea458a6040d04ea92_master.png', NULL),
(31, N'https://cdn.hstatic.net/products/200000411281/sandwich_b__ph__mai_2_c6cc0d6e54214a58b126dd1abf19fdf6_master.jpg', N'https://cdn.hstatic.net/products/200000411281/ch_p_c_a_h_ng_16.07_302_a5cef96aeb61440293ebceca5d0bb064_master.jpg', N'https://cdn.hstatic.net/products/200000411281/hnd_6882_8c1a747e3c28497bbafbf4f74b471f44_master.jpg', NULL),
(32, N'https://cdn.hstatic.net/products/200000411281/sandwich_t_m_2_43a516c70bf544949fd10351908249ca_master.png', N'https://cdn.hstatic.net/products/200000411281/sandwich_t_m_3_bd20d29e1abd480c87e4fedd1d82fa4f_master.png', NULL, NULL),
(33, N'https://cdn.hstatic.net/products/200000411281/2_3d5ae19339fe425988d891ef518f2a37_master.png', N'https://cdn.hstatic.net/products/200000411281/3_eccf376307a342449e06523e46df6ae5_master.png', N'https://cdn.hstatic.net/products/200000411281/4_cb51a220462e4467818c908babce9889_master.png', N'https://cdn.hstatic.net/products/200000411281/tan_ch_y_b1313d293299414da5ef93d9982ffb7c_master.png'),
(34, NULL, NULL, NULL, NULL),
(35, N'https://product.hstatic.net/200000411281/product/bo_go_cat_2_da8b92357f504a0eb95ae07f98527c35_master.png', N'https://product.hstatic.net/200000411281/product/burger_bo_6e68e7a179044b61ad98b44a003a4dbf_master.png', N'https://cdn.hstatic.net/products/200000411281/up_web_250326-02_5dbcf7d1b3594192874be053359fd0ec_master.png', N'https://cdn.hstatic.net/products/200000411281/hnd_6914_6448a8120b3a42e2842354187c5a4957_master.jpg'),
(36, N'https://product.hstatic.net/200000411281/product/b_nh_opera_g_c_ch_o_6316f5d99b9c42679bc8ba0c165d2bcb_master.png', N'https://product.hstatic.net/200000411281/product/b_nh_opera_topdown_9564a79133df41829fe69957910c1efe_master.png', NULL, NULL),
(37, N'https://product.hstatic.net/200000411281/product/banh_chiffon_tra_ba_tuoc_1_724b9f7bd3bb4805abd949a28da601f0_master.png', N'https://product.hstatic.net/200000411281/product/banh_chiffon_tra_ba_tuoc_3_e4a69a043366487488b5f031b7b0be9f_master.png', NULL, NULL),
(38, N'https://product.hstatic.net/200000411281/product/banh_madeleine_so_co_la_1_633d888cad414b4fb6765f83840aea1f_master.png', N'https://product.hstatic.net/200000411281/product/banh_madeleine_chung_1_9960b4bfdf2f4b1895b96c3e1eeefc5c_master.png', N'https://product.hstatic.net/200000411281/product/banh_madeleine_chung_2_a77c897db9ac4709b2a1fd978e251aff_master.png', N'https://product.hstatic.net/200000411281/product/banh_madeleine_chung_3_223aeac4d9f54255bfac94094314bd24_master.png'),
(39, N'https://cdn.hstatic.net/products/200000411281/banh_chiffon_so-co-la_3_6e58f23e0a284ecda4a1c7f7852862c6_master.png', N'https://cdn.hstatic.net/products/200000411281/banh_chiffon_so-co-la_4_440b855e1deb4386a9041f2c4f8ae4cc_master.png', N'https://cdn.hstatic.net/products/200000411281/banh_chiffon_so-co-la_3a5fe8a051214a22b2a85b5158df7f8a_master.png', NULL),
(40, N'https://cdn.hstatic.net/products/200000411281/banh_chiffon_vani_3_546227b87b3640a2b910f68904dc9a62_master.png', N'https://cdn.hstatic.net/products/200000411281/banh_chiffon_vani_4_42e36ccc39cf46eaa4c6fc1151c62243_master.png', N'https://cdn.hstatic.net/products/200000411281/banh_chiffon_vani_127e691530f24668a466a53c927d37c2_master.png', NULL),
(41, N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-21_961a36ced7644ddba6af2072cfda2650_master.png', N'https://cdn.hstatic.net/products/200000411281/3_e5b4acc9f23a4547855edf058ceab96d_master.png', N'https://cdn.hstatic.net/products/200000411281/4_1afff237782041e6bf661596a888c4b2_master.png', NULL),
(42, N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-22_4ec682ce62794f2396cbaea8e8c821de_master.png', N'https://cdn.hstatic.net/products/200000411281/3_b13f1b5d9f894107902720d24170718e_master.png', N'https://cdn.hstatic.net/products/200000411281/4_186a0b9f06704d719afaf6c540893af0_master.png', NULL),
(43, N'https://cdn.hstatic.net/products/200000411281/sticker_vi_banh-25_0eb940b5a74741efb379ff96e7e8b0ec_master.png', N'https://cdn.hstatic.net/products/200000411281/mousse_d_a_3_82f040065ea343b590c04c2c2a97c22f_master.png', N'https://cdn.hstatic.net/products/200000411281/sdvn_0406_3800_00004__280d5f594934476f93d89dd05fe18ed6_master.png', N'https://cdn.hstatic.net/products/200000411281/sdvn_0406_3800_00005__707dce9695c04a17a7b11ab6113c4a32_master.png'),
(44, N'https://product.hstatic.net/200000411281/product/mousse_chanh_leo_2_5bef63f33f274f1b96ac8b049d84a60a_master.png', N'https://product.hstatic.net/200000411281/product/mousse_chanh_leo_3_0375098b228e4f40a9edd6e592f492d5_master.png', N'https://product.hstatic.net/200000411281/product/mousse_chanh_leo_4_bccbd90b1b67415e8eb0fe0a7122f71b_master.png', NULL),
(45, N'https://product.hstatic.net/200000411281/product/caramen_2_b061fc1a258e49ad9383e981d0a01cac_master.png', N'https://product.hstatic.net/200000411281/product/caramen_3_777cdb46c649496e995190fd8605e5d0_master.png', N'https://product.hstatic.net/200000411281/product/caramen_4_bfcdbad68d234da997f7c50ba923d993_master.png', NULL),
(46, N'https://cdn.hstatic.net/products/200000411281/n__ng_h_nh_nh_n_sau_34069784f5cc442185ad8de3bb604120_master.png', NULL, NULL, NULL),
(47, N'https://cdn.hstatic.net/products/200000411281/d_a_sau_741777edf2ee4b5dac165cfddb085354_master.png', NULL, NULL, NULL),
(48, N'https://cdn.hstatic.net/products/200000411281/b__m_t_d_u_sau_a16a056f845b47be9b17b8c623dffe3a_master.png', NULL, NULL, NULL),
(49, N'https://cdn.hstatic.net/products/200000411281/s__c__la_chip_sau_0f2da7215f724e8bac416de51bb7cbf1_master.png', NULL, NULL, NULL),
(50, N'https://cdn.hstatic.net/products/200000411281/h_nh_nh_n_sau_ffaac904e50b490f957c44978c38b100_master.png', NULL, NULL, NULL),
(51, N'https://cdn.hstatic.net/products/200000411281/mochi_n__ng_v_ng_den_c_t_26a98194350e4857be4936d13e07ff70_master.png', N'https://cdn.hstatic.net/products/200000411281/mochi_n__ng_v_ng_den_3_e04c76c31ef34ad3b776c21b970224e9_master.png', NULL, NULL),
(52, N'https://cdn.hstatic.net/products/200000411281/mochi_n__ng_v_ng_den_c_t_26a98194350e4857be4936d13e07ff70_master__1__490bcc7d7d8647e3bc6211da38dcfe67_master.png', N'https://cdn.hstatic.net/products/200000411281/mochi_n__ng_v_ng_den_3_e04c76c31ef34ad3b776c21b970224e9_master_40ef1cce44634345911fb7d4e1c52540_master.png', NULL, NULL),
(53, N'https://cdn.hstatic.net/products/200000411281/k_o_d_o_vui_v__1_cb0ce96eaed24e7da048efda8c9acfd7_master.png', N'https://cdn.hstatic.net/products/200000411281/k_o_d_o_vui_v__4_e8fd7c4a7265430898c8915d00e40c70_master.png', N'https://cdn.hstatic.net/products/200000411281/k_o_d_o_vui_v__3_5c6ec78bec6349d48d76374c62dc05f0_master.png', N'https://cdn.hstatic.net/products/200000411281/k_o_d_o_vui_v__5_66ffd66f0bd6408f884a96477f11c134_master.png'),
(54, N'https://cdn.hstatic.net/products/200000411281/k_o_d_o_hoa_qu__1_f122b52c3e904a12801ad580c5ac6bd7_master.png', N'https://cdn.hstatic.net/products/200000411281/k_o_d_o_hoa_qu__4_bf1714313d6d48bb882deb5a62c4190f_master.png', N'https://cdn.hstatic.net/products/200000411281/k_o_d_o_hoa_qu__3_c4459fd1e9414cbab4acd79d9cb2402f_master.png', NULL),
(55, N'https://cdn.hstatic.net/products/200000411281/2_142b8d74ae3b4928816ac46ec46bfb42_master.png', N'https://cdn.hstatic.net/products/200000411281/3_668aa220b88d470789470a248671ba0f_master.png', N'https://cdn.hstatic.net/products/200000411281/4_159046249a3746198898c39cabf5e459_master.png', NULL),
(56, N'https://cdn.hstatic.net/products/200000411281/th_t_dc58f567ba8c4c5e809859029564ba31_master.jpg', NULL, NULL, NULL),
(57, N'https://product.hstatic.net/200000411281/product/31_3eb1a93e7b6145a4954095496e3f45fa_master.jpg', NULL, NULL, NULL),
(58, N'https://product.hstatic.net/200000411281/product/18_bede5e1bac0b47f69c0a78fede1d9401_master.jpg', NULL, NULL, NULL),
(59, N'https://product.hstatic.net/200000411281/product/29_603d5f5bd6344069b484024169cef793_master.jpg', NULL, NULL, NULL),
(60, N'https://product.hstatic.net/200000411281/product/33_a5de653bdce6418192a6377fd5a4e844_master.jpg', NULL, NULL, NULL),
(61, N'https://cdn.hstatic.net/products/200000411281/pizza_g__n__ng_ki_u_th_i_2_b405ee38678a48b5b1c46eb0d0361c8a_master.png', N'https://cdn.hstatic.net/products/200000411281/pizza_g__n__ng_ki_u_th_i_3_a2761b889586432f895e9680de60e964_master.png', N'https://cdn.hstatic.net/products/200000411281/pizza_g__n__ng_ki_u_th_i_4_1608e5ba62684ca28b17be8edd4d816c_master.png', NULL),
(62, N'https://cdn.hstatic.net/products/200000411281/pizza_2_44c6f3c1fd6448c69ee12606cd708a2c_master.png', N'https://cdn.hstatic.net/products/200000411281/pizza_3_03fe84ec20ac48f28b9d8d1e85886d31_master.png', NULL, NULL),
(63, N'https://product.hstatic.net/200000411281/product/custom_dimensions_1080x1080_px_46e84f27daaa46ac938959b55869fd4f_master.png', NULL, NULL, NULL),
(64, N'https://product.hstatic.net/200000411281/product/dam_bong_dua_4cee68c17ae54212ac6cb00afbc11ed3_master.png', NULL, NULL, NULL),
(65, N'https://product.hstatic.net/200000411281/product/z3557602231158_c10abcf211b0c0efe6d5475ceeb391d9_6868ef127f5447dea1d8ca954a2adfe3_master.jpg', N'https://product.hstatic.net/200000411281/product/z3557602183226_2f1d50194105bd68a55a33d6963594b5_c095eb512d2f4f0a9b55d4f9549edea1_master.jpg', NULL, NULL),
(66, N'https://cdn.hstatic.net/products/200000411281/th_i_xanh_1.1_a8eee500524345a5af5ac7bf86e94238_master.png', N'https://cdn.hstatic.net/products/200000411281/th_i_xanh_1_d18d0d973aa145a7a6de63203c67a585_master.png', N'https://cdn.hstatic.net/products/200000411281/th_i_xanh_1f7ff9a908734aafa5cd42a3fd4a2305_master.png', NULL),
(67, N'https://cdn.hstatic.net/products/200000411281/tr__d_o_1.1_593106a06a2d486db7e14c31f487d447_master.png', N'https://cdn.hstatic.net/products/200000411281/tr__d_o_1_9805e135817f421a90015a69c4bd1e9d_master.png', N'https://cdn.hstatic.net/products/200000411281/d_o_b877ab92a18941608e9a9a2bbf1d30cd_master.png', NULL),
(68, N'https://cdn.hstatic.net/products/200000411281/tr__s_a_1.1_61086b6039db41afa0e66b4e9b8e4eb5_master.png', N'https://cdn.hstatic.net/products/200000411281/tr__s_a_1_e7cc2cc56be64861b1cd477b7d15d2fd_master.png', N'https://cdn.hstatic.net/products/200000411281/tr__s_a_6c65f28dad6441618d654c7aa532aa52_master.png', NULL),
(69, N'https://product.hstatic.net/200000411281/product/kombucha_chanh_1_5494264a12b246ae8c85319d8dba1ccf_master.png', N'https://product.hstatic.net/200000411281/product/kombucha_3_a1301c3343c04184a543772e1d122513_master.png', NULL, NULL),
(70, N'https://product.hstatic.net/200000411281/product/kombucha_ca_phe_2_c4b221f1e4914edf989f43f00741acf9_master.png', N'https://product.hstatic.net/200000411281/product/kombucha_3_e443df4bfb764d739946664aa1647ee2_master.png', N'https://product.hstatic.net/200000411281/product/kombucha_4_8a3f5dd0115648268322bbd2886767cd_master.png', NULL),
(71, N'https://product.hstatic.net/200000411281/product/caa_phe_muoi_2_f3806eba0f7f4228b3f3c1343d92341b_master.png', N'https://product.hstatic.net/200000411281/product/ca_phe_5_loai_4_ab6d4519a5ef491da7aba0a7bfb0ab3e_master.png', N'https://cdn.hstatic.net/products/200000411281/up_web_250326-07_ec82ab189bed4b338e45e261d198c425_master.png', N'https://cdn.hstatic.net/products/200000411281/up_web_250326-08_aea8cc5e41094f05b95b89e511562449_master.png'),
(72, N'https://product.hstatic.net/200000411281/product/cafe_den_2_ddca29c1fa7a47f5a07155ab2b4004bf_master.png', N'https://product.hstatic.net/200000411281/product/cafe_den_3_4b436ec7ff4c4b68b731f78b89c2dc41_master.png', N'https://product.hstatic.net/200000411281/product/ca_phe_5_loai_4_39686fc627a44c6da1bc4e87e1333caf_master.png', N'https://cdn.hstatic.net/products/200000411281/up_web_250326-09_a0934c47ba634ee599d28cdc45999adc_master.png'),
(73, N'https://product.hstatic.net/200000411281/product/cafe_u_lanh_2_6ff46f07a2674a8f8f2fc861d5e770f1_master.png', N'https://product.hstatic.net/200000411281/product/ca_phe_5_loai_4_2e2719505c564be985f9cf01589fef7d_master.png', NULL, NULL),
(74, N'https://product.hstatic.net/200000411281/product/cafe_u_lanh_2_6ff46f07a2674a8f8f2fc861d5e770f1_master.png', N'https://product.hstatic.net/200000411281/product/ca_phe_5_loai_4_2e2719505c564be985f9cf01589fef7d_master.png', NULL, NULL),
(75, N'https://product.hstatic.net/200000411281/product/cafe_den_2_ddca29c1fa7a47f5a07155ab2b4004bf_master.png', N'https://product.hstatic.net/200000411281/product/cafe_den_3_4b436ec7ff4c4b68b731f78b89c2dc41_master.png', N'https://product.hstatic.net/200000411281/product/ca_phe_5_loai_4_39686fc627a44c6da1bc4e87e1333caf_master.png', N'https://cdn.hstatic.net/products/200000411281/up_web_250326-09_a0934c47ba634ee599d28cdc45999adc_master.png'),
(76, N'https://product.hstatic.net/200000411281/product/ph_9__360_2_82ac021176584e0ba483d9f4539f636b_master.png', N'https://product.hstatic.net/200000411281/product/kiem_chung_635046c5a97c495b9428cc0d5629bbc4_master.png', N'https://cdn.hstatic.net/products/200000411281/th_ng_ki_m_ph9__360ml_ad71349c164a4419870c170ae83610c3_master.png', NULL),
(77, N'https://product.hstatic.net/200000411281/product/ph_9__550_2_da652e6993934c89ab657e9cf3ebd390_master.png', N'https://product.hstatic.net/200000411281/product/kiem_chung_a0a006604b174b9fb2da047eed982546_master.png', N'https://cdn.hstatic.net/products/200000411281/th_ng_ki_m_ph9__2e3ff3d32a714524bccbd16745230d2e_master.png', NULL),
(78, N'https://product.hstatic.net/200000411281/product/vitamin_mira_chanh_2_298eb88a524646a4a9a72825fad4dac1_master.jpg', N'https://product.hstatic.net/200000411281/product/vitamin_mira_chung_3_c10bc9e62daf467eb7aa8acbb9879139_master.png', N'https://product.hstatic.net/200000411281/product/vitamin_mira_chung_4_1759d4dd075a4ee583897622d5c193ec_master.png', N'https://cdn.hstatic.net/products/200000411281/vitamin_mira_2985afe4e4984d619ce1e62ee978207e_master.png'),
(79, N'https://product.hstatic.net/200000411281/product/vitamin_mira_dao_2_7f7299901f2044599e4df3a55743a8e0_master.jpg', N'https://product.hstatic.net/200000411281/product/vitamin_mira_chung_3_392918478cfc476da10be05dcd719388_master.png', N'https://product.hstatic.net/200000411281/product/vitamin_mira_chung_4_1f290ff72ec14f409198af1d6f9a54ed_master.png', N'https://cdn.hstatic.net/products/200000411281/vitamin_mira_09761a2a27944d3d93dbd8576e542d44_master.png'),
(80, N'https://product.hstatic.net/200000411281/product/vitamin_mira_dau_2_09bfffe99c794c69a0d0180c806ca0f7_master.jpg', N'https://product.hstatic.net/200000411281/product/vitamin_mira_chung_3_ee0abd74c9dc413ca9c191e790a4d07a_master.png', N'https://product.hstatic.net/200000411281/product/vitamin_mira_chung_4_3574870d37c14a04928bf9febb2da43d_master.png', N'https://cdn.hstatic.net/products/200000411281/vitamin_mira_a7ef02f517364e75b3b5ffc816770a7f_master.png'),
(81, N'https://product.hstatic.net/200000411281/product/bong_lan_cuon_ruoc_2_90818cdf13a64f7d837eb42d9ef155e5_master.jpg', N'https://product.hstatic.net/200000411281/product/bong_lan_cuon_ruoc_3_79a516034dae4b06a3ab116f44629097_master.jpg', N'https://product.hstatic.net/200000411281/product/bong_lan_cuon_ruoc_4_5b44247cdb1d4a6ba99343a0f32e87ba_master.jpg', N'https://product.hstatic.net/200000411281/product/bong_lan_cuon_ruoc_5_13f1a2c6d98943bbbc1cc0732311b52a_master.jpg'),
(82, N'https://cdn.hstatic.net/products/200000411281/2_e5ec288a16d4418f9360c9d20079798a_master.png', N'https://cdn.hstatic.net/products/200000411281/3_a7f2b4d4d4584834a3c9bd75ed56b76c_master.png', N'https://cdn.hstatic.net/products/200000411281/4_838bbe1f5077443fb710d735fa4b1afa_master.png', NULL),
(83, N'https://cdn.hstatic.net/products/200000411281/b_nh_t__i_ru_c_s_t_phomai_2_b48502e6e2074252824285ba13010441_master.png', N'https://cdn.hstatic.net/products/200000411281/b_nh_t__i_ru_c_s_t_phomai_3_3fb41218ee164543be1d8554d9c9bdd3_master.png', N'https://cdn.hstatic.net/products/200000411281/social_3_b9a9faa5a1f94480983f435d8f57e9fd_master.png', NULL),
(84, N'https://cdn.hstatic.net/products/200000411281/banh-mi-ruoc-to-50g-2_550f39cf3d6f4cb7b711ed5594a7b3c5_master.png', NULL, NULL, NULL),
(85, N'https://cdn.hstatic.net/products/200000411281/2_27a35f99680940c2ac6d9521c9f676ae_master.png', N'https://cdn.hstatic.net/products/200000411281/3_33b0df897ec2487d8bc478914df5a90f_master.png', NULL, NULL),
(86, NULL, NULL, NULL, NULL),
(87, NULL, NULL, NULL, NULL),
(88, NULL, NULL, NULL, NULL),
(89, NULL, NULL, NULL, NULL),
(90, N'https://product.hstatic.net/200000411281/product/z3180698230065_5ad182b376943bd7fe41f67971b4f4e9_a9251b77637f4db4acb8101c6dde44b3_master.jpg', N'https://product.hstatic.net/200000411281/product/ai_ran_man_95fff755888a473c85f45840f197a2fc_master.jpg', NULL, NULL)

-- =============================================
-- CHUYEN URL THANH CAC DONG ANH
-- TU DONG TAO MaAnh TIEP THEO
-- =============================================

;WITH DanhSachAnh AS
(
    SELECT
        A.MaSP,
        V.ThuTu,
        V.DuongDan
    FROM @AnhBoSung A
    CROSS APPLY
    (
        VALUES
            (2, A.Anh2),
            (3, A.Anh3),
            (4, A.Anh4),
            (5, A.Anh5)
    ) V(ThuTu, DuongDan)
    WHERE NULLIF(LTRIM(RTRIM(V.DuongDan)), N'') IS NOT NULL
),
DanhSachMa AS
(
    SELECT
        MaSP,
        DuongDan,
        ROW_NUMBER() OVER (ORDER BY MaSP, ThuTu) AS STT
    FROM DanhSachAnh
)
INSERT INTO dbo.ANH (MaAnh, MaTinTuc, MaSP, DuongDan)
SELECT
    (SELECT ISNULL(MAX(MaAnh), 0) FROM dbo.ANH) + STT,
    NULL,
    MaSP,
    DuongDan
FROM DanhSachMa;
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
