const API = '/api';
const $ = (selector, root = document) => root.querySelector(selector);
const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
function productImageUrl(value) {
  const source = String(value ?? '').split('|')[0].trim();
  if (!source) return '';
  if (/^https?:\/\//i.test(source)) return source;
  const origin = API.replace(/\/api\/?$/i, '');
  try { return new URL(source.replace(/^\/+/, ''), `${origin}/`).href; }
  catch { return ''; }
}
function productImageMarkup(value, alt, variant = 'thumb') {
  const source = productImageUrl(value);
  return `<div class="admin-image-widget admin-image-${variant}">${source ? `<img src="${esc(source)}" alt="${esc(alt || 'Ảnh sản phẩm')}" loading="lazy" data-admin-product-image>` : ''}<span class="admin-image-fallback" ${source ? 'hidden' : ''}>${source ? 'Không tải được ảnh' : 'Chưa có ảnh'}</span></div>`;
}
function bindProductImageFallbacks(root) {
  root.querySelectorAll('[data-admin-product-image]').forEach((img) => img.addEventListener('error', () => {
    img.hidden = true;
    const fallback = img.parentElement.querySelector('.admin-image-fallback');
    if (fallback) fallback.hidden = false;
  }, { once: true }));
}
let activeView = 'overview';
let cachedCategories = [];
let toastTimer;

function token() { return localStorage.getItem('fg_token') || ''; }
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token()}`, ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.message || 'Không thể tải dữ liệu.');
  return body.data;
}
function toast(message) { const node = $('#admin-toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2600); }
function setAuthState(isAdmin, name = '') {
  $('#admin-login').hidden = isAdmin;
  $('#admin-shell').hidden = !isAdmin;
  if (name) $('#admin-user-name').textContent = name;
}
function fmtDate(value) { return value ? new Date(value).toLocaleDateString('vi-VN') : '—'; }
function statusClass(status) { return status === 'Đã hủy' ? 'cancel' : ['Đang xử lý','Chờ xác nhận'].includes(status) ? 'pending' : ''; }
function table(headers, rows, empty = 'Chưa có dữ liệu.') { return `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`; }
function openModal(title, content) {
  let modal = $('#admin-modal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'admin-modal'; modal.className = 'admin-modal'; modal.hidden = true; document.body.append(modal); }
  modal.innerHTML = `<section class="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title"><div class="admin-modal-head"><h2 id="admin-modal-title">${title}</h2><button type="button" data-close-modal aria-label="Đóng">×</button></div>${content}</section>`;
  modal.hidden = false;
  modal.onclick = (event) => { if (event.target === modal || event.target.closest('[data-close-modal]')) modal.hidden = true; };
  modal.querySelector('input')?.focus();
  return modal;
}
function setView(view) {
  activeView = view;
  const names = { overview:'Tổng quan',products:'Sản phẩm',orders:'Đơn hàng',customers:'Khách hàng',coupons:'Mã giảm giá',errors:'Nhật ký lỗi' };
  $('#admin-title').textContent = names[view] || names.overview;
  $('#admin-nav').querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
  loadView(view);
}
async function renderOverview() {
  const data = await api('/admin/summary');
  const labels = data.doanhThuTheoNgay || [];
  const max = Math.max(1, ...labels.map((x) => Number(x.DoanhThu)));
  const bars = labels.map((x) => `<div class="chart-day" title="${fmtDate(x.Ngay)} · ${money(x.DoanhThu)}"><i style="height:${Math.max(4, Number(x.DoanhThu) / max * 100)}%"></i><small>${new Date(x.Ngay).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}</small></div>`).join('');
  const orders = await api('/admin/orders');
  const recent = orders.slice(0, 6).map((order) => `<tr><td><b>#${order.MaDH}</b><small>${fmtDate(order.ThoiGianDat)}</small></td><td>${esc(order.TenKhachHang)}</td><td>${money(order.TongTien)}</td><td><span class="status-pill ${statusClass(order.TT_GiaoHang)}">${esc(order.TT_GiaoHang)}</span></td></tr>`).join('');
  $('#admin-content').innerHTML = `<div class="stats-grid"><article class="stat-card"><span>Doanh thu · 30 ngày</span><strong>${money(data.DoanhThu30Ngay)}</strong><small>Không tính đơn đã hủy</small></article><article class="stat-card"><span>Đơn hàng</span><strong>${Number(data.TongDonHang).toLocaleString('vi-VN')}</strong><small>${Number(data.DonChoXuLy).toLocaleString('vi-VN')} đơn cần xử lý</small></article><article class="stat-card"><span>Sản phẩm</span><strong>${Number(data.TongSanPham).toLocaleString('vi-VN')}</strong><small>Trong danh mục cửa hàng</small></article><article class="stat-card"><span>Khách hàng</span><strong>${Number(data.TongKhachHang).toLocaleString('vi-VN')}</strong><small>Tài khoản khách đã đăng ký</small></article></div><div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Doanh thu 14 ngày</h2><p>Giá trị đơn hàng theo ngày</p></div></div><div class="chart-bars">${bars || '<div class="empty">Chưa có dữ liệu doanh thu.</div>'}</div></section><section class="panel"><div class="panel-head"><div><h2>Đơn mới nhất</h2><p>Cập nhật trực tiếp từ hệ thống</p></div><button class="button" data-go="orders">Xem đơn hàng</button></div>${table(['Mã đơn','Khách hàng','Tổng tiền','Trạng thái'],recent)}</section></div>`;
}
async function getCategories() { if (!cachedCategories.length) cachedCategories = await api('/products/categories'); return cachedCategories; }
async function renderProducts(query = '') {
  const [rows, categories] = await Promise.all([api(`/admin/products?q=${encodeURIComponent(query)}`), getCategories()]);
  const lines = rows.map((p) => `<tr><td><b>${esc(p.TenSP)}</b><small>#${p.MaSP} · ${esc(p.TenLoai || '')}</small></td><td>${money(p.DonGia)}</td><td>${Number(p.TongTon)}</td><td>${productImageMarkup(p.HinhAnh, p.TenSP, 'thumb')}</td><td><div class="admin-row-actions"><button class="button" data-edit-product="${p.MaSP}">Sửa</button><button class="button button-danger" data-delete-product="${p.MaSP}">Xóa</button></div></td></tr>`).join('');
  $('#admin-content').innerHTML = `<div class="toolbar"><input id="admin-product-search" type="search" placeholder="Tìm theo tên sản phẩm…" value="${esc(query)}"><div class="toolbar-actions"><button class="button button-primary" id="add-product">＋ Thêm sản phẩm</button></div></div>${table(['Sản phẩm','Giá bán','Tồn kho','Ảnh đại diện','Thao tác'],lines,'Chưa có sản phẩm.')}`;
  bindProductImageFallbacks($('#admin-content'));
  $('#admin-product-search').oninput = (event) => { clearTimeout(window.adminSearchTimer); window.adminSearchTimer = setTimeout(() => renderProducts(event.target.value.trim()).catch((e) => toast(e.message)), 250); };
  $('#add-product').onclick = () => editProduct(null, categories);
  $('#admin-content').querySelectorAll('[data-edit-product]').forEach((button) => button.onclick = () => editProduct(rows.find((item) => Number(item.MaSP) === Number(button.dataset.editProduct)), categories));
  $('#admin-content').querySelectorAll('[data-delete-product]').forEach((button) => button.onclick = async () => { if (!confirm('Xóa sản phẩm này? Sản phẩm đã có trong đơn hoặc giỏ hàng không thể xóa.')) return; try { await api(`/admin/products/${button.dataset.deleteProduct}`,{method:'DELETE'}); toast('Đã xóa sản phẩm.'); renderProducts($('#admin-product-search')?.value || ''); } catch (e) { toast(e.message); } });
}
function editProduct(product, categories) {
  const categoryOptions = categories.flatMap((parent) => (parent.subCategories || []).map((child) => `<option value="${child.MaLoai}" ${Number(product?.MaLoai) === Number(child.MaLoai) ? 'selected' : ''}>${esc(parent.TenLoaiCha)} · ${esc(child.TenLoai)}</option>`)).join('');
  const modal = openModal(product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm', `<form id="product-admin-form" class="admin-form"><label class="wide">Tên sản phẩm<input name="tenSP" maxlength="200" value="${esc(product?.TenSP || '')}" required></label><label>Danh mục<select name="maLoai" required><option value="">Chọn danh mục</option>${categoryOptions}</select></label><label>Giá bán (₫)<input name="donGia" type="number" min="0" step="1000" value="${Number(product?.DonGia || 0)}" required></label><label>Đơn vị<input name="donViTinh" maxlength="50" value="${esc(product?.DonViTinh || 'cái')}"></label><label>Tồn kho tổng<input name="tonKho" type="number" min="0" step="1" value="${Number(product?.TongTon ?? 100)}"><small class="admin-field-hint">Sản phẩm mới mặc định có 100 cái, được phân vào cửa hàng mã nhỏ nhất.</small></label><div class="wide product-image-field"><label for="product-image-url">Ảnh sản phẩm</label><input id="product-image-url" name="hinhAnh" maxlength="500" placeholder="https://… hoặc đường dẫn tương đối" value="${esc((product?.HinhAnh || '').split('|')[0] || '')}"><span class="admin-field-hint">Dán đường dẫn ảnh để xem trước. Định dạng ảnh hiện tại vẫn được lưu như trước.</span><div class="product-image-preview" id="product-image-preview" aria-live="polite">${productImageMarkup(product?.HinhAnh, product?.TenSP || 'Ảnh xem trước', 'preview')}</div></div><label>Mô tả<textarea name="moTa" maxlength="500">${esc(product?.MoTa || '')}</textarea></label><div><label>Khối lượng (g)<input name="khoiLuong" type="number" min="0" step="1" value="${Number(product?.KhoiLuong || '')}"></label><label style="margin-top:12px">Kích thước<input name="kichThuoc" maxlength="100" value="${esc(product?.KichThuoc || '')}"></label></div><div class="form-error wide" id="product-form-error"></div><div class="admin-form-footer"><button class="button" type="button" data-close-modal>Hủy</button><button class="button button-primary" type="submit">Lưu sản phẩm</button></div></form>`);
  const imageInput = modal.querySelector('[name="hinhAnh"]');
  const imagePreview = modal.querySelector('#product-image-preview');
  imageInput.addEventListener('input', () => {
    imagePreview.innerHTML = productImageMarkup(imageInput.value, 'Ảnh xem trước sản phẩm', 'preview');
    bindProductImageFallbacks(imagePreview);
  });
  bindProductImageFallbacks(imagePreview);
  modal.querySelector('#product-admin-form').onsubmit = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const body = Object.fromEntries(form.entries()); try { await api(product ? `/admin/products/${product.MaSP}` : '/admin/products',{method:product?'PUT':'POST',body:JSON.stringify(body)}); modal.hidden=true; toast('Đã lưu sản phẩm.'); renderProducts(); } catch(error) { $('#product-form-error',modal).textContent=error.message; } };
}
async function renderOrders() {
  const orders = await api('/admin/orders');
  const lines = orders.map((o) => `<tr><td><b>#${o.MaDH}</b><small>${fmtDate(o.ThoiGianDat)}</small></td><td><b>${esc(o.TenKhachHang)}</b><small>${esc(o.NguoiNhan || '')} · ${esc(o.SoDT || '')}</small></td><td>${esc(o.DiaChi || '')}</td><td>${money(o.TongTien)}</td><td><select class="inline-select" data-order-status="${o.MaDH}" data-previous="${esc(o.TT_GiaoHang)}" ${['Đã giao','Đã hủy'].includes(o.TT_GiaoHang)?'disabled':''}>${['Đang xử lý','Đang giao','Đã giao','Đã hủy'].map((s)=>`<option ${s===o.TT_GiaoHang?'selected':''}>${s}</option>`).join('')}</select></td><td><select class="inline-select" data-payment-status="${o.MaDH}" data-previous="${esc(o.TrangThaiThanhToan || '')}" ${!o.MaThanhToan?'disabled':''}>${['Chờ thanh toán','Chờ chuyển khoản','Đã thanh toán','Thanh toán thất bại','Đã hoàn tiền'].map((s)=>`<option ${s===o.TrangThaiThanhToan?'selected':''}>${s}</option>`).join('')}</select><small>${esc(o.HT_ThanhToan || '')}</small></td></tr>`).join('');
  $('#admin-content').innerHTML = `<div class="toolbar"><span>${orders.length} đơn hàng gần nhất</span><button class="button" id="orders-refresh">Tải lại</button></div>${table(['Đơn hàng','Người nhận','Địa chỉ giao','Tổng tiền','Giao hàng','Thanh toán'],lines,'Chưa có đơn hàng.')}`;
  $('#orders-refresh').onclick = renderOrders;
  $('#admin-content').querySelectorAll('[data-order-status]').forEach((select) => select.onchange = async () => { const previous = select.dataset.previous || 'Đang xử lý'; try { await api(`/admin/orders/${select.dataset.orderStatus}/status`,{method:'PATCH',body:JSON.stringify({status:select.value})}); select.dataset.previous=select.value; toast('Đã cập nhật trạng thái đơn.'); } catch(e) { select.value=previous; toast(e.message); } });
  $('#admin-content').querySelectorAll('[data-payment-status]').forEach((select)=>select.onchange=async()=>{const previous=select.dataset.previous;try{await api(`/admin/orders/${select.dataset.paymentStatus}/payment`,{method:'PATCH',body:JSON.stringify({status:select.value})});select.dataset.previous=select.value;toast('Đã cập nhật thanh toán.')}catch(error){select.value=previous;toast(error.message)}});
}
async function renderCustomers() {
  const customers = await api('/admin/customers');
  $('#admin-content').innerHTML = `<div class="toolbar"><span>${customers.length} khách hàng</span></div>${table(['Khách hàng','Liên hệ','Tên đăng nhập','Đơn hàng','Tổng chi','Tài khoản'],customers.map((c)=>`<tr><td><b>${esc(c.TenKhachHang)}</b><small>#${c.MaKhachHang}</small></td><td>${esc(c.Gmail || '—')}<small>${esc(c.SoDT || 'Chưa có số điện thoại')}</small></td><td>${esc(c.User || '—')}</td><td>${Number(c.SoDon)}</td><td>${money(c.TongChi)}</td><td>${c.User&&c.VaiTro!=='QuanTri'?`<button class="button ${c.TrangThaiTaiKhoan==='Hoạt động'?'button-danger':''}" data-customer-id="${c.MaKhachHang}" data-next-status="${c.TrangThaiTaiKhoan==='Hoạt động'?'Bị khóa':'Hoạt động'}">${c.TrangThaiTaiKhoan==='Hoạt động'?'Khóa':'Mở khóa'}</button>`:c.VaiTro==='QuanTri'?'Quản trị':'—'}</td></tr>`).join(''),'Chưa có khách hàng.')}`;
  $('#admin-content').querySelectorAll('[data-customer-id]').forEach((button)=>button.onclick=async()=>{const action=button.dataset.nextStatus;if(!confirm(`${action} tài khoản khách hàng này?`))return;try{await api(`/admin/customers/${button.dataset.customerId}/status`,{method:'PATCH',body:JSON.stringify({status:action})});toast('Đã cập nhật trạng thái khách hàng.');renderCustomers()}catch(error){toast(error.message)}});
}
async function renderErrors() {
  const rows=await api('/admin/errors');
  $('#admin-content').innerHTML=`<div class="toolbar"><span>${rows.length} lỗi gần nhất đã ghi nhận</span></div>${table(['Thời gian','API','Mã khách','Thông tin lỗi'],rows.map((e)=>`<tr><td>${new Date(e.ThoiGian).toLocaleString('vi-VN')}</td><td><b>${esc(e.PhuongThuc)} ${esc(e.DuongDan)}</b></td><td>${e.MaKhachHang||'—'}</td><td>${esc(e.ThongBao)}</td></tr>`).join(''),'Chưa ghi nhận lỗi nào.')}`;
}
async function renderCoupons() {
  const rows = await api('/admin/coupons');
  const lines = rows.map((c)=>`<tr><td><b>${esc(c.TenMaGG)}</b><small>${esc(c.MoTa || '')}</small></td><td>${c.LoaiGiam==='PHAN_TRAM'?`${Number(c.GiaTriGiam)}%`:money(c.GiaTriGiam)}</td><td>${Number(c.SoLuong)}</td><td>${fmtDate(c.NgayBatDau)} – ${fmtDate(c.NgayKetThuc)}</td><td><span class="status-pill ${c.TrangThai==='Đang áp dụng'?'':'pending'}">${esc(c.TrangThai)}</span></td><td><button class="button" data-edit-coupon="${c.MaGiamGia}">Sửa</button> <button class="button button-danger" data-delete-coupon="${c.MaGiamGia}">Ngừng</button></td></tr>`).join('');
  $('#admin-content').innerHTML = `<div class="toolbar"><span>Mã khuyến mãi và điều kiện áp dụng</span><button class="button button-primary" id="add-coupon">＋ Tạo mã</button></div>${table(['Mã ưu đãi','Mức giảm','Lượt còn','Thời hạn','Trạng thái','Thao tác'],lines,'Chưa có mã giảm giá.')}`;
  $('#add-coupon').onclick=()=>editCoupon(null);
  $('#admin-content').querySelectorAll('[data-edit-coupon]').forEach((b)=>b.onclick=()=>editCoupon(rows.find((x)=>Number(x.MaGiamGia)===Number(b.dataset.editCoupon))));
  $('#admin-content').querySelectorAll('[data-delete-coupon]').forEach((b)=>b.onclick=async()=>{if(!confirm('Ngừng hoặc xóa mã này?'))return;try{await api(`/admin/coupons/${b.dataset.deleteCoupon}`,{method:'DELETE'});toast('Đã ngừng mã giảm giá.');renderCoupons()}catch(e){toast(e.message)}});
}
function editCoupon(coupon) {
  const date = (v) => v ? new Date(v).toISOString().slice(0,10) : '';
  const modal=openModal(coupon?'Cập nhật mã giảm giá':'Tạo mã giảm giá',`<form id="coupon-form" class="admin-form"><label>Mã ưu đãi<input name="tenMaGG" maxlength="100" value="${esc(coupon?.TenMaGG||'')}" required></label><label>Kiểu giảm<select name="loaiGiam"><option value="TIEN" ${coupon?.LoaiGiam!=='PHAN_TRAM'?'selected':''}>Số tiền (₫)</option><option value="PHAN_TRAM" ${coupon?.LoaiGiam==='PHAN_TRAM'?'selected':''}>Phần trăm (%)</option></select></label><label>Mức giảm<input name="giaTriGiam" type="number" min="0" step="1" value="${Number(coupon?.GiaTriGiam||30000)}" required></label><label>Số lượt sử dụng<input name="soLuong" type="number" min="0" value="${Number(coupon?.SoLuong||0)}" required></label><label>Ngày bắt đầu<input name="ngayBatDau" type="date" value="${date(coupon?.NgayBatDau)}" required></label><label>Ngày kết thúc<input name="ngayKetThuc" type="date" value="${date(coupon?.NgayKetThuc)}" required></label><label>Đơn tối thiểu (₫)<input name="donToiThieu" type="number" min="0" value="${Number(coupon?.DonToiThieu||0)}"></label><label>Giảm tối đa (₫, tùy chọn)<input name="giamToiDa" type="number" min="0" value="${coupon?.GiamToiDa||''}"></label><label>Trạng thái<select name="trangThai"><option ${coupon?.TrangThai!=='Tạm dừng'?'selected':''}>Đang áp dụng</option><option ${coupon?.TrangThai==='Tạm dừng'?'selected':''}>Tạm dừng</option></select></label><label class="wide">Mô tả<textarea name="moTa" maxlength="300">${esc(coupon?.MoTa||'')}</textarea></label><div class="form-error wide" id="coupon-form-error"></div><div class="admin-form-footer"><button class="button" type="button" data-close-modal>Hủy</button><button class="button button-primary" type="submit">Lưu mã</button></div></form>`);
  modal.querySelector('#coupon-form').onsubmit=async(event)=>{event.preventDefault();const body=Object.fromEntries(new FormData(event.currentTarget).entries());try{await api(coupon?`/admin/coupons/${coupon.MaGiamGia}`:'/admin/coupons',{method:coupon?'PUT':'POST',body:JSON.stringify(body)});modal.hidden=true;toast('Đã lưu mã giảm giá.');renderCoupons()}catch(e){$('#coupon-form-error',modal).textContent=e.message}};
}
async function loadView(view) {
  $('#admin-content').innerHTML='<div class="loading">Đang tải dữ liệu…</div>';
  try { if(view==='overview') await renderOverview(); else if(view==='products') await renderProducts(); else if(view==='orders') await renderOrders(); else if(view==='customers') await renderCustomers(); else if(view==='coupons') await renderCoupons(); else if(view==='errors') await renderErrors(); }
  catch(error) { $('#admin-content').innerHTML=`<div class="panel empty">${esc(error.message)}<br><button class="button" id="retry-view" style="margin-top:14px">Thử lại</button></div>`; $('#retry-view').onclick=()=>loadView(view); }
}
async function checkAdmin() {
  if (!token()) { setAuthState(false); return; }
  try { const profile = await api('/auth/me'); await api('/admin/summary'); setAuthState(true, profile.TenKhachHang || profile.User); setView(activeView); }
  catch { setAuthState(false); }
}
$('#admin-login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget); const error = $('#admin-login-error'); error.textContent='';
  try { const response=await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.get('username'),password:form.get('password')})});const body=await response.json();if(!response.ok||!body.success)throw new Error(body.message||'Không đăng nhập được.');localStorage.setItem('fg_token',body.data.token);localStorage.setItem('fg_user',JSON.stringify(body.data.user));await checkAdmin();if($('#admin-shell').hidden)throw new Error('Tài khoản chưa được cấp quyền quản trị viên.'); }
  catch(e){error.textContent=e.message;}
});
$('#admin-nav').addEventListener('click',(event)=>{const button=event.target.closest('[data-view]');if(button)setView(button.dataset.view)});
$('#admin-content').addEventListener('click',(event)=>{const button=event.target.closest('[data-go]');if(button)setView(button.dataset.go)});
$('#admin-refresh').addEventListener('click',()=>loadView(activeView));
$('#admin-logout').addEventListener('click',()=>{localStorage.removeItem('fg_token');localStorage.removeItem('fg_user');setAuthState(false)});
checkAdmin();
