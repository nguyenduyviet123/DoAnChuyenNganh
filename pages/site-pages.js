const API_BASE = '/api';
const API_ORIGIN = window.location.origin;
const $ = (selector, root = document) => root.querySelector(selector);
const fmtMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[char]));

function isStoredAdmin() {
  if (!localStorage.getItem('fg_token')) return false;
  try { return JSON.parse(localStorage.getItem('fg_user') || 'null')?.vaiTro === 'QuanTri'; }
  catch { return false; }
}

function renderSiteChrome() {
  const page = document.body.dataset.page;
  const searchQuery = page === 'products' ? new URLSearchParams(location.search).get('q') || '' : '';
  const adminEntry = isStoredAdmin() ? '<a class="admin-entry-link" href="admin.html">Quản trị</a>' : '';
  $('#site-header').innerHTML = `
    <header class="header site-page-header" id="site-page-header">
      <div class="header-inner container">
        <a href="../index.html" class="logo" aria-label="Fresh Garden - Trang chủ">
          <img class="logo-image" src="../assets/fresh-garden-logo.png" alt="" width="150" height="100" fetchpriority="high" />
          <div class="logo-crest" aria-hidden="true"><svg width="42" height="42" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="21" r="20" stroke="#C5A059" stroke-width="1.2" fill="#153928"/><circle cx="21" cy="21" r="18" stroke="#DFBA73" stroke-width=".8" stroke-dasharray="2 3"/><path d="M21 9C21 16 14 18 14 26a7 7 0 0 0 14 0c0-8-7-10-7-17Z" stroke="#DFBA73" stroke-width="1.3"/><path d="M21 12v18m-4-11q4 2.5 8 0m-9 5q5 2.5 10 0" stroke="#DFBA73" stroke-width="1.1"/></svg></div>
          <span class="logo-text"><span class="logo-brand">FRESH GARDEN</span><span class="logo-tagline">BOULANGERIE &amp; PÂTISSERIE • 2009</span></span>
        </a>
        <nav class="nav" aria-label="Điều hướng chính"><ul class="nav-list">
          <li><a class="nav-link ${page === 'about' ? 'active' : ''}" href="about.html">Giới thiệu</a></li>
          <li class="nav-has-dropdown"><a href="products.html" class="nav-link ${['products','product-detail'].includes(page) ? 'active' : ''}">Sản phẩm</a><button type="button" class="nav-dropdown-trigger" id="page-products-toggle" aria-label="Mở danh mục sản phẩm" aria-expanded="false" aria-controls="page-products-menu"><svg class="chevron" width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="m2 4 4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg></button>
            <div class="nav-dropdown" id="page-products-menu"><div class="mega-menu-head"><div><span>FRESH GARDEN CATALOGUE</span><strong>Khám phá theo danh mục</strong></div><a class="mega-all-link" href="products.html">Xem tất cả sản phẩm <span aria-hidden="true">→</span></a></div><div class="mega-menu-grid" id="page-mega-grid"></div></div>
          </li>
          <li><a class="nav-link ${page === 'contact' ? 'active' : ''}" href="contact.html">Danh sách cửa hàng</a></li>
          <li class="nav-news-menu"><a class="nav-link ${['news','promotions'].includes(page) ? 'active' : ''}" href="news.html">Tin tức</a><button type="button" class="nav-dropdown-trigger nav-news-toggle" id="page-news-toggle" aria-label="Mở mục tin tức" aria-expanded="false" aria-controls="page-news-dropdown"><svg class="chevron" width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg></button><div class="nav-news-dropdown" id="page-news-dropdown"><a href="news.html">Tin tức</a><a href="promotions.html">Tin khuyến mãi</a></div></li>
        </ul></nav>
        <div class="page-header-actions">
          ${adminEntry}
          <button type="button" class="btn-icon" id="page-search-toggle" aria-label="Tìm kiếm sản phẩm" aria-expanded="false" aria-controls="page-search-panel"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.4-4.4"/></svg></button>
          <a class="page-account-link" href="login.html" aria-label="Đăng nhập">Tài khoản</a>
          <a class="page-cart-link" href="cart.html" aria-label="Giỏ hàng"><span aria-hidden="true">▢</span><span class="page-cart-label">Giỏ hàng</span><span id="page-cart-count" class="page-cart-count">0</span></a>
          <button type="button" class="hamburger" id="page-hamburger" aria-label="Mở menu" aria-expanded="false" aria-controls="page-mobile-drawer"><span></span><span></span><span></span></button>
        </div>
      </div>
      <div class="page-search-panel" id="page-search-panel"><form id="page-search-form" role="search"><button type="button" class="page-search-close" id="page-search-close" aria-label="Đóng tìm kiếm"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m18 6-12 12M6 6l12 12"/></svg></button><input type="search" id="page-search-input" aria-label="Tìm bánh theo tên hoặc hương vị" placeholder="Tìm bánh theo tên hoặc hương vị…" value="${esc(searchQuery)}"/><button type="submit" class="page-search-submit" aria-label="Tìm kiếm"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7.5"/><path d="m20 20-4-4"/></svg></button></form></div>
    </header>
    <div class="mobile-drawer" id="page-mobile-drawer" aria-hidden="true" inert>
      <div class="drawer-header"><img class="logo-image drawer-logo-image" src="../assets/fresh-garden-logo.png" alt="Fresh Garden — Bánh ngọt, trao yêu thương" width="120" height="80"/><div class="logo-text"><span class="logo-brand">FRESH GARDEN</span><span class="logo-tagline">BOULANGERIE &amp; PÂTISSERIE</span></div><button type="button" class="drawer-close" id="page-drawer-close" aria-label="Đóng menu">✕</button></div>
      <nav class="drawer-nav"><a class="${page === 'about' ? 'drawer-highlight' : ''}" href="about.html">Giới thiệu</a><a href="products.html">Sản phẩm</a><button class="drawer-menu-toggle" type="button" id="page-mobile-products-toggle" aria-expanded="false" aria-controls="page-mobile-categories"><span>Danh mục bánh</span><span aria-hidden="true">⌄</span></button><div class="drawer-subnav" id="page-mobile-categories"><a href="products.html">Tất cả sản phẩm</a><div class="drawer-category-groups" id="page-mobile-category-groups"></div></div><a class="${page === 'contact' ? 'drawer-highlight' : ''}" href="contact.html">Danh sách cửa hàng</a><a href="news.html">Tin tức</a><a class="${page === 'promotions' ? 'drawer-highlight' : ''}" href="promotions.html">Tin khuyến mãi</a><a href="register.html">Đăng ký thành viên</a><a href="login.html">Tài khoản / Đăng nhập</a><a href="cart.html">Giỏ hàng</a>${adminEntry}</nav>
    </div><div class="drawer-overlay" id="page-drawer-overlay"></div>`;

  $('#site-footer').innerHTML = `
    <footer class="footer" id="footer">
      <div class="footer-top container">
        <!-- Col 1: Brand Info -->
        <div class="footer-col brand-col">
          <div class="footer-brand-title">FRESH GARDEN</div>
          <p class="footer-brand-desc">
            Boulangerie &amp; Pâtisserie Pháp truyền thống từ năm 2009. Nơi mỗi chiếc bánh là một tác phẩm được ủ men và nướng thủ công với sự tôn trọng tuyệt đối dành cho sức khỏe người thưởng thức.
          </p>
          <div class="footer-hotline-box">
            <span class="hotline-title">Tổng đài đặt bánh &amp; CSKH:</span>
            <a href="tel:19002075" class="hotline-number">1900 2075</a>
            <span class="footer-contact-item">☎ Hợp tác Doanh nghiệp / Teabreak: <a href="tel:02438563856"><strong>024 3856 3856</strong></a></span>
            <span class="footer-contact-item">✉ Email CSKH: <a href="mailto:cskh@freshgarden.vn"><strong>cskh@freshgarden.vn</strong></a></span>
            <span class="footer-contact-item">📍 Trụ sở chính: Số 46 phố An Dương, P. Yên Phụ, Q. Tây Hồ, Hà Nội</span>
          </div>
        </div>

        <!-- Col 2: Policies -->
        <div class="footer-col" id="footer-chinh-sach">
          <h4 class="footer-heading">CHÍNH SÁCH</h4>
          <div class="footer-divider-gold"></div>
          <ul class="footer-links">
            <li><a href="#">Chính sách mua hàng &amp; Vận chuyển</a></li>
            <li><a href="#">Chính sách đổi trả &amp; Hoàn tiền</a></li>
            <li><a href="#">Quy chuẩn an toàn vệ sinh thực phẩm</a></li>
            <li><a href="#">Chính sách bảo mật thông tin</a></li>
            <li><a href="#">Chương trình Khách hàng thân thiết</a></li>
          </ul>
        </div>

        <!-- Col 3: Information -->
        <div class="footer-col" id="footer-thong-tin">
          <h4 class="footer-heading">THÔNG TIN</h4>
          <div class="footer-divider-gold"></div>
          <ul class="footer-links">
            <li><a href="about.html">Về thương hiệu Fresh Garden</a></li>
            <li><a href="../index.html#seasonal">Bánh Trung Thu Hoàng Kim 2026</a></li>
            <li><a href="contact.html">Danh sách cửa hàng</a></li>
            <li><a href="news.html">Tin tức</a></li>
            <li><a href="promotions.html">Tin khuyến mãi</a></li>
            <li><a href="#">Cơ hội hợp tác &amp; Tuyển dụng</a></li>
          </ul>
        </div>

        <!-- Col 4: Newsletter -->
        <div class="footer-col" id="footer-newsletter">
          <h4 class="footer-heading">ĐĂNG KÝ NHẬN BẢN TIN</h4>
          <div class="footer-divider-gold"></div>
          <p class="newsletter-sub">Nhận ngay ưu đãi 10% cho đơn hàng đầu tiên và thông tin bộ sưu tập bánh theo mùa.</p>
          <div class="newsletter-form">
            <input type="email" id="page-newsletter-email" placeholder="Địa chỉ email của bạn..." class="newsletter-input" />
            <button class="btn-newsletter" type="button" id="page-newsletter-btn" onclick="showPageToast('Cảm ơn bạn đã đăng ký nhận bản tin Fresh Garden!')">Đăng ký</button>
          </div>
          <div class="footer-social">
            <a href="#" class="social-link" id="social-facebook" aria-label="Fresh Garden Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="#" class="social-link" id="social-instagram" aria-label="Fresh Garden Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p>© 2009 – 2026 Fresh Garden Bakery. Công ty TNHH PHD • Giấy phép ĐKKD số: 0103833363 do Sở KH&amp;ĐT Hà Nội cấp.</p>
          <div class="footer-cert-note">Đã đăng ký thông báo với Bộ Công Thương</div>
        </div>
      </div>
    </footer>`;
}

function showPageToast(message) {
  const toast = $('#page-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showPageToast.timer);
  showPageToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.message || 'Không thể tải dữ liệu.');
  return json.data;
}

let pageCategoryData = [];

function categoryLink(label, filter, kind, className = '') {
  const link = document.createElement('a');
  link.href = `products.html?${kind === 'child' ? 'maLoai' : 'maLoaiCha'}=${encodeURIComponent(filter)}`;
  link.className = className;
  link.textContent = label;
  return link;
}

async function loadPageCategories() {
  try {
    const categories = await apiGet('/products/categories');
    pageCategoryData = categories;
    const desktop = $('#page-mega-grid');
    const mobile = $('#page-mobile-category-groups');
    const tree = $('#product-category-tree');
    desktop?.replaceChildren();
    mobile?.replaceChildren();
    tree?.replaceChildren();
    const makeGroup = (category, className, titleClass, childClass, includeChildren = true, selected = false) => {
        const group = document.createElement('section');
        group.className = className;
        const parentLink = categoryLink(category.TenLoaiCha, category.MaLoaiCha, 'parent', titleClass);
        if (selected) parentLink.classList.add('is-selected');
        group.appendChild(parentLink);
        if (includeChildren) (category.subCategories || []).forEach((child) => group.appendChild(categoryLink(child.TenLoai, child.MaLoai, 'child', childClass)));
        return group;
    };
    categories.forEach((category) => {
      desktop?.appendChild(makeGroup(category, 'mega-category', 'mega-category-title', 'mega-category-link'));
      mobile?.appendChild(makeGroup(category, 'drawer-category-group', 'drawer-category-title', 'drawer-category-link'));
    });

    const selectedParents = new Set(productPageState.filter.getAll('maLoaiCha').flatMap((value) => value.split(',')).map(Number).filter(Number.isFinite));
    const selectedChildId = Number(productPageState.filter.get('maLoai'));
    const selectedChild = categories.flatMap((category) => category.subCategories || []).find((child) => Number(child.MaLoai) === selectedChildId);
    if (!selectedParents.size && selectedChild) selectedParents.add(Number(selectedChild.MaLoaiCha));
    categories.forEach((category) => {
      const label = document.createElement('label');
      label.className = 'category-filter-option';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = String(category.MaLoaiCha);
      checkbox.dataset.filterParent = 'true';
      checkbox.checked = selectedParents.has(Number(category.MaLoaiCha));
      const name = document.createElement('span');
      name.textContent = category.TenLoaiCha;
      label.append(checkbox, name);
      tree?.appendChild(label);
    });

    tree?.addEventListener('change', (event) => {
      if (!event.target.matches('[data-filter-parent]')) return;
      const selectedIds = [...tree.querySelectorAll('[data-filter-parent]:checked')].map((input) => input.value);
      productPageState.filter.delete('maLoai');
      productPageState.filter.delete('maLoaiCha');
      selectedIds.forEach((id) => productPageState.filter.append('maLoaiCha', id));
      const nextUrl = new URL(location.href);
      nextUrl.search = productPageState.filter.toString();
      history.pushState({}, '', nextUrl);
      productPageState.limit = 12;
      loadPageProducts();
    });
  } catch (error) {
    const tree = $('#product-category-tree');
    if (tree) tree.innerHTML = `<p class="page-empty">${esc(error.message)}</p>`;
    showPageToast(error.message);
  }
}

function syncProductCategoryFilters() {
  const selectedParents = new Set(productPageState.filter.getAll('maLoaiCha').flatMap((value) => value.split(',')).map(Number).filter(Number.isFinite));
  const childId = Number(productPageState.filter.get('maLoai'));
  const child = pageCategoryData.flatMap((category) => category.subCategories || []).find((item) => Number(item.MaLoai) === childId);
  if (!selectedParents.size && child) selectedParents.add(Number(child.MaLoaiCha));
  document.querySelectorAll('#product-category-tree [data-filter-parent]').forEach((input) => {
    input.checked = selectedParents.has(Number(input.value));
  });
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=700&h=700&fit=crop',
  'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=700&h=700&fit=crop',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=700&h=700&fit=crop',
  'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=700&h=700&fit=crop',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&h=700&fit=crop',
];

function imageUrl(path, index = 0) {
  if (!path || path.startsWith('/images/demo/')) return fallbackImages[index % fallbackImages.length];
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`;
}

function getPageCart() {
  const storageKey = getPageCartStorageKey();
  try {
    const cart = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(cart) ? cart : [];
  }
  catch { return []; }
}

function getPageCartStorageKey() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('fg_user') || 'null'); }
  catch { user = null; }
  const customerId = localStorage.getItem('fg_token') ? user?.maKhachHang : null;
  return customerId == null ? 'banhfg_cart_guest' : `banhfg_cart_user_${customerId}`;
}

function updatePageCartCount() {
  const count = getPageCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const badge = $('#page-cart-count');
  if (badge) badge.textContent = String(count);
}

async function addPageCartItem(product, quantity = 1, { feedback = true } = {}) {
  const amount = Math.min(99, Math.max(1, Math.floor(Number(quantity) || 1)));
  const cart = getPageCart();
  const found = cart.find((item) => String(item.id) === String(product.MaSP));
  const productImage = imageUrl(product.HinhAnh || product.hinhAnh?.[0], Number(product.MaSP) || 0);
  if (found) {
    found.qty += amount;
    found.image ||= productImage;
    found.weight ||= product.KhoiLuong;
    found.unit ||= product.DonViTinh;
  } else {
    cart.push({ id: product.MaSP, name: product.TenSP, price: Number(product.DonGia), qty: amount, image: productImage, weight: product.KhoiLuong, unit: product.DonViTinh });
  }
  localStorage.setItem(getPageCartStorageKey(), JSON.stringify(cart));
  localStorage.removeItem('banhfg_cart');
  updatePageCartCount();
  const token = localStorage.getItem('fg_token');
  if (token) {
    try {
      await fetch(`${API_BASE}/cart/items`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ maSP: product.MaSP, soLuong: amount }) });
    } catch { if (feedback) showPageToast('Đã lưu vào giỏ tạm; chưa đồng bộ được máy chủ.'); }
  }
  if (feedback) showPageToast(`Đã thêm ${amount} “${product.TenSP}” vào giỏ hàng.`);
  return { amount, image: productImage };
}

function showProductCartDialog(product, quantity, image) {
  document.getElementById('cart-added-overlay')?.remove();
  const overlay = document.createElement('div');
  const previousOverflow = document.body.style.overflow;
  const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  overlay.className = 'cart-added-overlay';
  overlay.id = 'cart-added-overlay';
  overlay.setAttribute('role', 'presentation');
  overlay.innerHTML = `
    <section class="cart-added-dialog" role="dialog" aria-modal="true" aria-labelledby="cart-added-title">
      <button type="button" class="cart-added-close" data-close-cart-added aria-label="Đóng">×</button>
      <h2 id="cart-added-title">Thêm vào giỏ hàng</h2>
      <div class="cart-added-product">
        <img src="${esc(image)}" alt="${esc(product.TenSP)}" onerror="this.onerror=null;this.src='../assets/banner_banh_kem.jpg'" />
        <div class="cart-added-copy">
          <a href="product.html?id=${Number(product.MaSP)}">${esc(product.TenSP)}</a>
          <small>Mã SP: ${Number(product.MaSP)}<br>Số lượng: ${Number(quantity)}</small>
          <strong>${fmtMoney(Number(product.DonGia) * Number(quantity))}</strong>
        </div>
      </div>
      <div class="cart-added-actions">
        <button type="button" class="cart-added-continue" data-close-cart-added>Mua thêm</button>
        <a class="cart-added-view" href="cart.html">Xem giỏ hàng</a>
      </div>
    </section>`;

  const close = () => {
    document.body.style.overflow = previousOverflow;
    overlay.remove();
    document.removeEventListener('keydown', onKeydown);
    returnFocus?.focus();
  };
  const onKeydown = (event) => { if (event.key === 'Escape') close(); };
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-close-cart-added]')) close();
  });
  document.addEventListener('keydown', onKeydown);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  overlay.querySelector('.cart-added-view')?.focus();
}

let productPageState = { filter: new URLSearchParams(location.search), limit: 12 };
let productRequestSequence = 0;
async function loadPageProducts() {
  const grid = $('#product-grid');
  if (!grid) return;
  const requestId = ++productRequestSequence;
  grid.setAttribute('aria-busy', 'true');
  if (!grid.querySelector('.page-product-card')) {
    grid.innerHTML = '<div class="page-loading">Đang tải bánh tươi từ FreshGardenDB…</div>';
  }
  const query = new URLSearchParams({ limit: String(productPageState.limit), sort: $('#product-sort')?.value || 'default' });
  ['maLoai', 'q'].forEach((key) => {
    const value = productPageState.filter.get(key);
    if (value) query.set(key, value);
  });
  const selectedParentIds = productPageState.filter.getAll('maLoaiCha').flatMap((value) => value.split(',')).filter(Boolean);
  if (selectedParentIds.length) query.set('maLoaiCha', [...new Set(selectedParentIds)].join(','));
  try {
    const result = await apiGet(`/products?${query}`);
    if (requestId !== productRequestSequence) return;
    const products = result.products || [];
    $('#catalog-count').textContent = `${Number(result.total || 0).toLocaleString('vi-VN')} sản phẩm`;
    const selectedCategory = productPageState.filter.get('maLoai') || productPageState.filter.get('maLoaiCha');
    const selectedLink = selectedCategory ? document.querySelector(`.category-tree a[href*="=${encodeURIComponent(selectedCategory)}"]`) : null;
    $('#catalog-title').textContent = selectedLink?.textContent || (productPageState.filter.get('q') ? `Kết quả cho “${productPageState.filter.get('q')}”` : 'Tất cả bánh tươi');
    const childId = Number(productPageState.filter.get('maLoai'));
    const selectedChild = pageCategoryData.flatMap((category) => category.subCategories || []).find((child) => Number(child.MaLoai) === childId);
    const selectedParentIds = new Set(productPageState.filter.getAll('maLoaiCha').flatMap((value) => value.split(',')).map(Number).filter(Number.isFinite));
    if (!selectedParentIds.size && selectedChild) selectedParentIds.add(Number(selectedChild.MaLoaiCha));
    const selectedParents = pageCategoryData.filter((category) => selectedParentIds.has(Number(category.MaLoaiCha)));
    const queryText = productPageState.filter.get('q');
    const pageTitle = selectedChild?.TenLoai || (selectedParents.length === 1 ? selectedParents[0].TenLoaiCha : selectedParents.length > 1 ? 'Danh mục đã chọn' : queryText ? `Kết quả cho “${queryText}”` : 'Tất cả sản phẩm');
    $('#catalog-title').textContent = pageTitle;
    $('#catalog-breadcrumb-current').textContent = pageTitle;
    document.title = `${pageTitle} | Fresh Garden`;
    const activeParent = selectedChild
      ? pageCategoryData.find((category) => Number(category.MaLoaiCha) === Number(selectedChild.MaLoaiCha))
      : selectedParents.length === 1 ? selectedParents[0] : null;
    const categoryHero = $('#catalog-category-hero');
    const categoryHeroImage = $('#catalog-category-hero-image');
    if (categoryHero && categoryHeroImage) {
      if (activeParent) {
        const categoryId = Number(activeParent.MaLoaiCha);
        const fallbackImage = categoryId === 1 || [3, 4, 11, 12, 13].includes(categoryId)
          ? '../assets/banner_banh_kem.jpg'
          : '../assets/hero_banner.jpg';
        const productCover = products.find((product) => product.HinhAnh);
        categoryHeroImage.alt = `Sản phẩm thuộc danh mục ${pageTitle}`;
        categoryHeroImage.onerror = () => {
          categoryHeroImage.onerror = null;
          categoryHeroImage.src = fallbackImage;
        };
        categoryHeroImage.src = productCover ? imageUrl(productCover.HinhAnh) : fallbackImage;
        categoryHero.hidden = false;
      } else {
        categoryHero.hidden = true;
        categoryHeroImage.removeAttribute('src');
      }
    }
    if (!products.length) {
      grid.innerHTML = '<div class="page-empty">Chưa tìm thấy sản phẩm phù hợp.</div>';
    } else {
      grid.innerHTML = products.map((product, index) => {
        const soldOut = Number(product.TongTon || 0) < 1;
        const isHot = index % 3 === 1 || index === 1;
        const isNew = index === 0;
        const badgeLabel = soldOut ? 'HẾT HÀNG' : (isHot ? 'HOT' : (isNew ? 'MỚI' : (product.TenLoaiCon || 'Bánh tươi')));
        const badgeClass = soldOut ? 'sold-out' : (isHot ? 'hot' : (isNew ? 'new' : ''));

        return `
        <article class="page-product-card">
          <div class="page-product-image-wrap">
            <a href="product.html?id=${Number(product.MaSP)}" aria-label="Xem ${esc(product.TenSP)}">
              <img class="page-product-image" src="${esc(imageUrl(product.HinhAnh, index))}" alt="${esc(product.TenSP)}" loading="lazy" decoding="async" width="500" height="500">
            </a>
            <span class="page-product-tag ${badgeClass}">${esc(badgeLabel)}</span>
            <div class="page-product-overlay">
              <button type="button" class="btn-add-cart page-add-cart" data-add-product="${Number(product.MaSP)}" ${soldOut ? 'disabled aria-disabled="true"' : ''}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <span>${soldOut ? 'Tạm hết hàng' : 'Thêm vào giỏ'}</span>
              </button>
            </div>
          </div>
          <div class="page-product-info">
            <h3 class="page-product-name"><a href="product.html?id=${Number(product.MaSP)}">${esc(product.TenSP)}</a></h3>
            <div class="page-product-bottom">
              <span class="page-product-price">${fmtMoney(product.DonGia)}</span>
            </div>
          </div>
        </article>`;
      }).join('');
    }
    const more = $('#load-more-products');
    if (more) more.hidden = Number(result.total || 0) <= products.length;
    grid.setAttribute('aria-busy', 'false');
  } catch (error) {
    if (requestId !== productRequestSequence) return;
    grid.innerHTML = `<div class="page-empty">${esc(error.message)}</div>`;
    $('#catalog-count').textContent = 'Không tải được dữ liệu';
    grid.setAttribute('aria-busy', 'false');
  }
}

async function loadPromotions() {
  const grid = $('#promotion-grid');
  if (!grid) return;
  try {
    const rows = await apiGet('/products/promotions');
    if (!rows.length) { grid.innerHTML = '<div class="page-empty">Hiện chưa có mã ưu đãi đang áp dụng.</div>'; return; }
    grid.innerHTML = rows.map((row) => `<article class="promotion-card"><div><span class="promotion-status">Đang áp dụng · Còn ${Number(row.SoLuong)} lượt</span><h3 class="promotion-title">Ưu đãi Fresh Garden</h3><p class="promotion-description">${esc(row.MoTa || 'Ưu đãi dành cho đơn hàng Fresh Garden.')}</p></div><div class="promotion-bottom"><span class="promotion-expiry">Đến ${new Date(row.NgayKetThuc).toLocaleDateString('vi-VN')}</span><button class="promotion-code" type="button" data-copy-code="${esc(row.TenMaGG)}">${esc(row.TenMaGG)} · Sao chép</button></div></article>`).join('');
  } catch (error) { grid.innerHTML = `<div class="page-empty">${esc(error.message)}</div>`; }
}

async function loadNewsPage() {
  const grid = $('#news-page-grid');
  if (!grid) return;
  try {
    const rows = await apiGet('/products/news');
    if (!rows.length) { grid.innerHTML = '<div class="page-empty">Chưa có bài viết mới.</div>'; return; }
    grid.innerHTML = rows.map((row, index) => `<article class="page-news-card"><img class="page-news-image" src="${esc(imageUrl(row.HinhAnh, index + 1))}" alt="${esc(row.TieuDe)}" loading="lazy" width="700" height="460"><div class="page-news-body"><time class="page-news-date">${row.NgayDang ? new Date(row.NgayDang).toLocaleDateString('vi-VN') : 'Fresh Garden'}</time><h2 class="page-news-title">${esc(row.TieuDe)}</h2><p class="page-news-text">${esc(row.NoiDung || 'Câu chuyện mới từ Fresh Garden.')}</p></div></article>`).join('');
  } catch (error) { grid.innerHTML = `<div class="page-empty">${esc(error.message)}</div>`; }
}

async function loadStoresPage() {
  const grid = $('#store-page-grid');
  if (!grid) return;
  const count = $('#store-page-count');
  const districtFilter = $('#store-district-filter');
  const searchInput = $('#store-page-search');
  const knownDistricts = ['Ba Đình', 'Bắc Từ Liêm', 'Cầu Giấy', 'Đống Đa', 'Gia Lâm', 'Hà Đông', 'Hai Bà Trưng', 'Hoài Đức', 'Hoàng Mai', 'Hoàn Kiếm', 'Long Biên', 'Nam Từ Liêm', 'Sân bay Nội Bài', 'Tây Hồ', 'Thanh Xuân'];
  const districtOf = (address) => {
    const parts = String(address || '').split(',').map((part) => part.trim());
    return knownDistricts.find((district) => parts.includes(district)) || 'Khu vực khác';
  };
  let rows = [];
  let activeStoreId = null;

  const updateMap = (store) => {
    if (!store) return;
    activeStoreId = String(store.MaCuaHang);
    const title = $('#store-map-title');
    const address = $('#store-map-address');
    const frame = $('#store-map-frame');
    const directions = $('#store-directions-link');
    const query = store.DiaChi || store.TenCuaHang || 'Fresh Garden Hà Nội';
    if (title) title.textContent = store.TenCuaHang || 'Fresh Garden';
    if (address) address.textContent = query;
    if (frame) frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    if (directions) directions.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  };

  try {
    rows = await apiGet('/products/stores');
    const districts = [...new Set(rows.map((store) => districtOf(store.DiaChi)))].sort((a, b) => a.localeCompare(b, 'vi'));
    districts.forEach((district) => {
      const option = document.createElement('option');
      option.value = district;
      option.textContent = district;
      districtFilter?.appendChild(option);
    });

    const render = () => {
      const term = (searchInput?.value || '').trim().toLocaleLowerCase('vi-VN');
      const district = districtFilter?.value || 'all';
      const stores = rows.filter((store) => {
        const text = `${store.TenCuaHang} ${store.DiaChi} ${store.MoTa || ''}`.toLocaleLowerCase('vi-VN');
        return (!term || text.includes(term)) && (district === 'all' || districtOf(store.DiaChi) === district);
      });
      if (count) count.textContent = `${stores.length} chi nhánh`;
      grid.innerHTML = stores.length ? stores.map((store) => {
        const selected = String(store.MaCuaHang) === activeStoreId;
        const phone = store.SoDT ? `<span class="store-list-phone">☎ ${esc(store.SoDT)}${store.MoTa ? ` · ${esc(store.MoTa)}` : ''}</span>` : '';
        return `<button type="button" class="page-store-card${selected ? ' is-selected' : ''}" data-store-id="${Number(store.MaCuaHang)}" aria-pressed="${selected}">
          <span class="store-card-title-row"><span class="store-pin" aria-hidden="true">⌖</span><span class="page-store-number">CHI NHÁNH ${String(store.MaCuaHang).padStart(2, '0')}</span></span>
          <span class="page-store-name">${esc(store.TenCuaHang)}</span>
          <span class="page-store-region">${esc(districtOf(store.DiaChi))}</span>
          <span class="page-store-address">${esc(store.DiaChi)}</span>
          ${phone}
          <span class="page-store-map">Xem trên bản đồ <span aria-hidden="true">→</span></span>
        </button>`;
      }).join('') : '<div class="page-empty">Không tìm thấy cửa hàng phù hợp.</div>';

      const selectedStore = stores.find((store) => String(store.MaCuaHang) === activeStoreId) || stores[0];
      if (selectedStore) updateMap(selectedStore);
    };

    grid.addEventListener('click', (event) => {
      const card = event.target.closest('[data-store-id]');
      if (!card) return;
      activeStoreId = card.dataset.storeId;
      render();
    });
    searchInput?.addEventListener('input', render);
    districtFilter?.addEventListener('change', render);
    render();
  } catch (error) {
    if (count) count.textContent = 'Không tải được';
    grid.innerHTML = `<div class="page-empty">${esc(error.message)}</div>`;
  }
}

async function loadProductDetailPage() {
  const root = $('#product-detail-root');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!id || !/^\d+$/.test(id)) { root.innerHTML = '<div class="page-empty">Sản phẩm không hợp lệ. <a href="products.html">Quay lại danh mục</a></div>'; return; }
  root.setAttribute('aria-busy', 'true');
  try {
    const product = await apiGet(`/products/${encodeURIComponent(id)}`);
    const images = [...new Set([...(product.hinhAnh || []), product.HinhAnh].filter(Boolean))];
    const galleryImages = images.length ? [...images] : [null];
    while (galleryImages.length < 4) galleryImages.push(null);
    const cover = imageUrl(galleryImages[0], Number(id));
    const stock = product.tonKhoCuaHang || [];
    const totalStock = stock.reduce((sum, item) => sum + Math.max(0, Number(item.SoLuongCo) || 0), 0);
    const soldOut = totalStock < 1;
    const rating = product.diemDanhGia ? `${product.diemDanhGia} / 5 · ${product.danhGia.length} đánh giá` : 'Chưa có đánh giá';
    $('#product-detail-breadcrumb') && ($('#product-detail-breadcrumb').textContent = product.TenSP);
    document.title = `${product.TenSP} | Fresh Garden`;
    root.innerHTML = `
      <div class="product-detail-layout">
        <div class="product-gallery">
          <div class="product-gallery-thumbs-wrap">
            <button type="button" class="product-gallery-arrow" data-gallery-step="-1" aria-label="Ảnh trước">⌃</button>
            <div class="product-gallery-thumbs" aria-label="Ảnh sản phẩm">${galleryImages.map((src, index) => `<button type="button" class="product-gallery-thumb${index === 0 ? ' is-active' : ''}" data-gallery-index="${index}" data-gallery-image="${esc(imageUrl(src, Number(id) + index))}" aria-label="Xem ảnh ${index + 1}"><img src="${esc(imageUrl(src, Number(id) + index))}" alt="" loading="lazy"></button>`).join('')}</div>
            <button type="button" class="product-gallery-arrow" data-gallery-step="1" aria-label="Ảnh tiếp theo">⌄</button>
          </div>
          <div class="product-gallery-main"><img id="product-gallery-main" src="${esc(cover)}" alt="${esc(product.TenSP)}" fetchpriority="high"></div>
        </div>
        <section class="product-detail-info" aria-labelledby="product-detail-title">
          <div class="product-detail-kicker">${esc(product.TenLoaiCha || 'Bánh kem')} <span>|</span> Mã SP: ${esc(product.MaSP)}</div>
          <h1 id="product-detail-title">${esc(product.TenSP)}</h1>
          <p class="product-detail-price">${fmtMoney(product.DonGia)} <small>/${esc(product.DonViTinh || 'cái')}</small></p>
          <dl class="product-detail-specs">
            ${product.KichThuoc ? `<div><dt>Kích thước</dt><dd class="product-size-value">${esc(product.KichThuoc)}</dd></div>` : ''}
            ${product.KhoiLuong ? `<div><dt>Khối lượng</dt><dd>${esc(product.KhoiLuong)} g</dd></div>` : ''}
            ${product.DonViTinh ? `<div><dt>Đơn vị</dt><dd>${esc(product.DonViTinh)}</dd></div>` : ''}
          </dl>
          <div class="product-detail-buy"><label for="product-detail-quantity">Số lượng:</label><div class="product-quantity"><button type="button" data-quantity-step="-1" aria-label="Giảm số lượng">−</button><input id="product-detail-quantity" type="number" min="1" max="99" value="1" inputmode="numeric"><button type="button" data-quantity-step="1" aria-label="Tăng số lượng">+</button></div><button type="button" class="product-detail-add" id="product-detail-add" data-product-id="${Number(product.MaSP)}" ${soldOut?'disabled':''}>${soldOut?'Tạm hết hàng':'Thêm vào giỏ'}</button><button type="button" class="product-detail-buy-now" id="product-detail-buy-now" ${soldOut?'disabled':''}>Mua ngay</button></div>
          <div class="product-delivery-note"><span class="delivery-icon" aria-hidden="true"><svg viewBox="0 0 42 36" fill="none"><path d="M3 13 21 3l18 10v19H3V13Z" stroke="currentColor" stroke-width="1.7"/><path d="M3 13h36M21 3v29M14 13v19M28 13v19" stroke="currentColor" stroke-width="1.2"/><path d="M13 25h16" stroke="currentColor" stroke-width="1.2"/></svg></span><span><strong>Miễn phí giao hàng</strong><small>Miễn phí giao hàng cho đơn hàng từ 400k khi đặt qua fanpage.</small></span></div>
          <section class="product-detail-overview"><h2>Thông tin sản phẩm</h2><p>${esc(product.MoTa || 'Sản phẩm Fresh Garden được làm mới mỗi ngày từ nguyên liệu được tuyển chọn.')}</p></section>
        </section>
      </div>
      <section class="product-related" id="product-related" aria-labelledby="product-related-title">
        <h2 id="product-related-title">Sản phẩm liên quan</h2>
        <div class="product-related-grid" id="product-related-grid" aria-live="polite" aria-busy="true"><div class="product-related-loading">Đang tìm sản phẩm phù hợp…</div></div>
      </section>`;

    const relatedGrid = $('#product-related-grid');
    if (relatedGrid) {
      try {
        const sameChild = product.MaLoai ? await apiGet(`/products?maLoai=${encodeURIComponent(product.MaLoai)}&limit=8`) : { products: [] };
        let relatedProducts = (sameChild.products || []).filter((item) => Number(item.MaSP) !== Number(product.MaSP));
        if (!relatedProducts.length && product.MaLoaiCha) {
          const sameParent = await apiGet(`/products?maLoaiCha=${encodeURIComponent(product.MaLoaiCha)}&limit=8`);
          relatedProducts = (sameParent.products || []).filter((item) => Number(item.MaSP) !== Number(product.MaSP));
        }
        relatedGrid.innerHTML = relatedProducts.length
          ? relatedProducts.slice(0, 4).map((item) => `
            <article class="product-related-card">
              <a class="product-related-image-link" href="product.html?id=${Number(item.MaSP)}" aria-label="Xem ${esc(item.TenSP)}">
                <img src="${esc(imageUrl(item.HinhAnh, Number(item.MaSP)))}" alt="${esc(item.TenSP)}" loading="lazy" width="260" height="220">
              </a>
              <div class="product-related-card-body">
                <span>${esc(item.TenLoaiCon || product.TenLoaiCon || 'Bánh tươi')}</span>
                <h3><a href="product.html?id=${Number(item.MaSP)}">${esc(item.TenSP)}</a></h3>
                <strong>${fmtMoney(item.DonGia)}</strong>
              </div>
            </article>`).join('')
          : '<p class="product-related-empty">Không có sản phẩm nào cùng loại</p>';
        relatedGrid.setAttribute('aria-busy', 'false');
      } catch (relatedError) {
        relatedGrid.innerHTML = `<p class="product-related-empty">${esc(relatedError.message)}</p>`;
        relatedGrid.setAttribute('aria-busy', 'false');
      }
    }

    root.querySelector('.product-gallery-thumbs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-gallery-image]'); if (!button) return;
      $('#product-gallery-main').src = button.dataset.galleryImage;
      root.querySelectorAll('.product-gallery-thumb').forEach((thumb) => thumb.classList.toggle('is-active', thumb === button));
    });
    root.querySelectorAll('[data-gallery-step]').forEach((button) => button.addEventListener('click', () => {
      const thumbs = [...root.querySelectorAll('.product-gallery-thumb')];
      const current = thumbs.findIndex((thumb) => thumb.classList.contains('is-active'));
      const next = (current + Number(button.dataset.galleryStep) + thumbs.length) % thumbs.length;
      const direction = Number(button.dataset.galleryStep);
      root.querySelector('.product-gallery-thumbs')?.scrollBy({ top: direction * 150, behavior: 'smooth' });
      thumbs[next]?.click();
    }));
    root.querySelectorAll('[data-quantity-step]').forEach((button) => button.addEventListener('click', () => {
      const input = $('#product-detail-quantity'); input.value = Math.min(99, Math.max(1, Number(input.value || 1) + Number(button.dataset.quantityStep)));
    }));
    $('#product-detail-quantity')?.addEventListener('change', (event) => { event.target.value = Math.min(99, Math.max(1, Number(event.target.value || 1))); });
    const addProductToCart = async (button) => {
      if (soldOut) return;
      button.disabled = true; button.textContent = 'Đang thêm…';
      try {
        const result = await addPageCartItem(product, $('#product-detail-quantity').value, { feedback: false });
        showProductCartDialog(product, result?.amount || Number($('#product-detail-quantity').value) || 1, cover);
      }
      catch (error) { showPageToast(error.message); }
      finally { button.disabled = false; button.textContent = 'Thêm vào giỏ hàng'; updatePageCartCount(); }
    };
    $('#product-detail-add')?.addEventListener('click', (event) => addProductToCart(event.currentTarget));
    $('#product-detail-buy-now')?.addEventListener('click', async (event) => {
      const button=event.currentTarget; button.disabled=true; button.textContent='Đang chuyển…';
      try { await addPageCartItem(product, $('#product-detail-quantity').value, { feedback: false }); location.href='cart.html'; }
      catch (error) { showPageToast(error.message); button.disabled=false; button.textContent='Mua ngay'; }
    });
  } catch (error) {
    root.innerHTML = `<div class="page-empty">${esc(error.message || 'Không tải được sản phẩm.')} <a href="products.html">Quay lại danh mục</a></div>`;
  } finally { root.setAttribute('aria-busy', 'false'); }
}
function bindPageHeader() {
  const newsToggle = $('#page-news-toggle');
  const newsMenu = $('#page-news-toggle')?.closest('.nav-news-menu');
  let newsCloseTimer;
  const setNewsOpen = (open) => { clearTimeout(newsCloseTimer); newsMenu?.classList.toggle('is-open', open); newsToggle?.setAttribute('aria-expanded', String(open)); };
  newsMenu?.addEventListener('pointerenter', () => setNewsOpen(true));
  newsMenu?.addEventListener('pointerleave', () => { newsCloseTimer = setTimeout(() => setNewsOpen(false), 220); });
  newsToggle?.addEventListener('click', () => setNewsOpen(newsToggle.getAttribute('aria-expanded') !== 'true'));

  const toggle = $('#page-products-toggle');
  const drop = $('#page-products-toggle')?.closest('.nav-has-dropdown');
  const productMenu = $('#page-products-menu');
  let closeTimer;
  const setOpen = (open) => {
    clearTimeout(closeTimer);
    if (open) drop?.classList.remove('is-dismissed');
    drop?.classList.toggle('is-open', open);
    if (productMenu) productMenu.hidden = !open;
    toggle?.setAttribute('aria-expanded', String(open));
  };
  drop?.addEventListener('pointerenter', () => setOpen(true));
  drop?.addEventListener('pointerover', (event) => {
    if (drop.classList.contains('is-dismissed') && event.target.closest('.nav-link, .nav-dropdown-trigger')) setOpen(true);
  });
  drop?.addEventListener('pointerleave', () => {
    drop.classList.remove('is-dismissed');
    closeTimer = setTimeout(() => setOpen(false), 220);
  });
  toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('click', (event) => { if (drop && !drop.contains(event.target)) setOpen(false); if (newsMenu && !newsMenu.contains(event.target)) setNewsOpen(false); });

  const drawer = $('#page-mobile-drawer');
  const overlay = $('#page-drawer-overlay');
  const hamburger = $('#page-hamburger');
  const closeDrawer = (restore = false) => {
    drawer?.classList.remove('open');
    if (drawer) { drawer.inert = true; drawer.setAttribute('aria-hidden', 'true'); }
    overlay?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (restore) hamburger?.focus();
  };
  hamburger?.addEventListener('click', () => { drawer.inert = false; drawer.setAttribute('aria-hidden', 'false'); drawer.classList.add('open'); overlay.classList.add('open'); hamburger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; });
  $('#page-drawer-close')?.addEventListener('click', () => closeDrawer(true));
  overlay?.addEventListener('click', () => closeDrawer(true));
  drawer?.addEventListener('click', (event) => { if (event.target.closest('a')) closeDrawer(); });

  const navigateProductLink = (event, link) => {
    if (document.body.dataset.page !== 'products') return;
    event.preventDefault();
    const destination = new URL(link.href, location.href);
    productPageState.filter = new URLSearchParams(destination.search);
    productPageState.limit = 12;
    history.pushState({}, '', `${destination.pathname}${destination.search}${destination.hash}`);
    syncProductCategoryFilters();
    setOpen(false);
    if (drop?.contains(link)) drop.classList.add('is-dismissed');
    if (drawer?.contains(link)) closeDrawer();
    loadPageProducts();
  };
  $('#page-products-menu')?.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (link) navigateProductLink(event, link);
  });
  drop?.querySelector('.nav-link')?.addEventListener('click', (event) => {
    navigateProductLink(event, event.currentTarget);
  });
  $('#page-mobile-categories')?.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (link) navigateProductLink(event, link);
  });
  drawer?.querySelector('.drawer-nav > a[href="products.html"]')?.addEventListener('click', (event) => {
    navigateProductLink(event, event.currentTarget);
  });

  $('#page-mobile-products-toggle')?.addEventListener('click', (event) => { const button = event.currentTarget; const open = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(open)); $('#page-mobile-categories')?.classList.toggle('is-open', open); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { setOpen(false); setNewsOpen(false); closeDrawer(drawer?.classList.contains('open')); $('#page-search-panel')?.classList.remove('open'); $('#page-search-toggle')?.setAttribute('aria-expanded', 'false'); } });

  $('#page-search-toggle')?.addEventListener('click', () => { const panel = $('#page-search-panel'); const open = !panel?.classList.contains('open'); panel?.classList.toggle('open', open); $('#page-search-toggle')?.setAttribute('aria-expanded', String(open)); if (open) $('#page-search-input')?.focus(); });
  $('#page-search-form')?.addEventListener('submit', (event) => { event.preventDefault(); const q = $('#page-search-input').value.trim(); location.href = `products.html${q ? `?q=${encodeURIComponent(q)}` : ''}`; });
  $('#page-search-close')?.addEventListener('click', () => { $('#page-search-panel')?.classList.remove('open'); $('#page-search-toggle')?.setAttribute('aria-expanded', 'false'); $('#page-search-toggle')?.focus(); });
  updatePageCartCount();
}

document.addEventListener('DOMContentLoaded', async () => {
  renderSiteChrome();
  bindPageHeader();
  await loadPageCategories();
  window.addEventListener('popstate', () => {
    productPageState.filter = new URLSearchParams(location.search);
    syncProductCategoryFilters();
    productPageState.limit = 12;
    loadPageProducts();
  });
  $('#product-sort')?.addEventListener('change', () => { productPageState.limit = 12; loadPageProducts(); });
  $('#load-more-products')?.addEventListener('click', () => { productPageState.limit = 100; loadPageProducts(); });
  $('#product-grid')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-product]');
    if (!button) return;
    const card = button.closest('.page-product-card');
    const productId = Number(button.dataset.addProduct);
    apiGet(`/products/${productId}`).then((product) => addPageCartItem(product)).catch((error) => showPageToast(error.message));
    button.disabled = true;
    const textSpan = button.querySelector('span');
    if (textSpan) textSpan.textContent = 'Đang thêm…';
    else button.textContent = 'Đang thêm…';
    setTimeout(() => {
      button.disabled = false;
      if (textSpan) textSpan.textContent = 'Thêm vào giỏ';
      else button.textContent = 'Thêm vào giỏ';
    }, 800);
  });
  $('#product-grid') && await loadPageProducts();
  $('#product-detail-root') && await loadProductDetailPage();
  $('#promotion-grid') && loadPromotions();
  $('#news-page-grid') && loadNewsPage();
  $('#store-page-grid') && loadStoresPage();
  $('#promotion-grid')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-code]');
    if (!button) return;
    const code = button.dataset.copyCode;
    localStorage.setItem('fg_pending_coupon', code);
    try { await navigator.clipboard.writeText(code); showPageToast(`Đã sao chép mã ${code}. Nhập mã tại bước thanh toán.`); }
    catch { showPageToast(`Mã ưu đãi: ${code}. Nhập mã tại bước thanh toán.`); }
  });
});
