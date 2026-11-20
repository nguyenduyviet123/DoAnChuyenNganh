/**
 * ============================================================
 *  BÁNH FG – FRONTEND JAVASCRIPT CHÍNH
 *  Tích hợp API Backend Node.js & CSDL SQL Server (FreshGardenDB)
 *  Tuân thủ chuẩn Frontend Developer (UI/UX, Performance, WCAG 2.2)
 * ============================================================
 */

// ---- Cấu hình API Backend ----
const API_BASE = '/api';

// ---- Bộ ảnh chất lượng cao tương ứng với 20 sản phẩm thực tế trong SQL Server ----
const PRODUCT_IMAGE_MAP = {
  1: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500&h=500&fit=crop', // Bánh kem Mây sữa
  2: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=500&h=500&fit=crop', // Bánh kem Mây vàng
  3: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&h=500&fit=crop', // Bánh kem Mây ngọc
  4: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=500&fit=crop', // Bánh madeleine socola
  5: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&h=500&fit=crop', // Bánh cuộn đào
  6: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500&h=500&fit=crop', // Bánh chuối óc chó
  7: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop', // Bánh chiffon
  8: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&h=500&fit=crop', // Bánh cuộn vani
  9: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=500&h=500&fit=crop', // Bánh cuộn trà xanh
  10: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&h=500&fit=crop', // Donut socola
  11: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&h=500&fit=crop', // Bánh opera
  12: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&h=500&fit=crop', // Tiramisu
  13: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&h=500&fit=crop', // Trứng vàng baby
  14: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop', // Socola sữa
  15: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop', // Burger bò
  16: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=500&h=500&fit=crop', // Hotdog
  17: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&h=500&fit=crop', // Croissant
  18: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&h=500&fit=crop', // Sandwich bò phô mai
  19: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop', // Pizza giăm bông
  20: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&h=500&fit=crop', // Bánh mì bò tiêu đen
};

function getProductImage(sp) {
  if (sp.HinhAnh && !sp.HinhAnh.startsWith('/images/demo/')) {
    return sp.HinhAnh;
  }
  if (PRODUCT_IMAGE_MAP[sp.MaSP]) {
    return PRODUCT_IMAGE_MAP[sp.MaSP];
  }
  return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=500&fit=crop';
}

// ---- Utility: Format giá tiền VNĐ ----
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

// ---- Toast Notification ----
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (toast && toastMsg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

function showLoginRequiredNotice() {
  document.getElementById('login-required-dialog')?.remove();
  const dialog = document.createElement('div');
  dialog.id = 'login-required-dialog';
  dialog.className = 'login-required-backdrop';
  dialog.innerHTML = `
    <section class="login-required-box" role="alertdialog" aria-modal="true" aria-labelledby="login-required-title" aria-describedby="login-required-message" tabindex="-1">
      <h2 id="login-required-title">Cần đăng nhập</h2>
      <p id="login-required-message">Vui lòng đăng nhập trước khi thanh toán.</p>
      <a class="login-required-ok" href="pages/login.html">OK</a>
    </section>
  `;
  document.body.appendChild(dialog);
  dialog.querySelector('.login-required-box').focus();
}

/* ============================================================
   1. QUẢN LÝ XÁC THỰC TÀI KHOẢN (MODULE 0 - NGUYỄN DUY VIỆT)
   ============================================================ */
const Auth = {
  getToken() {
    return localStorage.getItem('fg_token');
  },
  getUser() {
    const u = localStorage.getItem('fg_user');
    return u ? JSON.parse(u) : null;
  },
  setAuth(token, user) {
    localStorage.setItem('fg_token', token);
    localStorage.setItem('fg_user', JSON.stringify(user));
    this.updateUI();
    window.dispatchEvent(new Event('fg-auth-change'));
  },
  logout() {
    localStorage.removeItem('fg_token');
    localStorage.removeItem('fg_user');
    Cart.loadCurrentCart();
    this.updateUI();
    window.dispatchEvent(new Event('fg-auth-change'));
    window.location.href = 'pages/login.html';
  },
  updateUI() {
    const user = this.getUser();
    const hasAdminAccess = Boolean(this.getToken() && user?.vaiTro === 'QuanTri');
    document.querySelectorAll('.admin-entry-link').forEach((link) => { link.hidden = !hasAdminAccess; });
    const userGreeting = document.getElementById('user-greeting');
    const userDropdown = document.getElementById('user-dropdown');

    if (!userGreeting || !userDropdown) return;

    if (user) {
      userGreeting.textContent = user.fullName || user.username;
      userDropdown.innerHTML = `
        <div style="padding:10px 16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:700;font-size:14px;color:var(--dark);">${user.fullName || user.username}</div>
          <div style="font-size:12px;color:var(--gray);">${user.email || ''}</div>
        </div>
        <button class="user-dropdown-item" id="btn-my-orders">
          <span>📦</span> Đơn hàng của tôi
        </button>
        <button class="user-dropdown-item danger" id="btn-logout">
          <span>🚪</span> Đăng xuất
        </button>
      `;

      document.getElementById('btn-logout')?.addEventListener('click', () => {
        this.logout();
        userDropdown.classList.remove('show');
      });

      document.getElementById('btn-my-orders')?.addEventListener('click', () => {
        userDropdown.classList.remove('show');
        Orders.showMyOrdersModal();
      });
    } else {
      userGreeting.textContent = 'Đăng nhập';
      userDropdown.innerHTML = `
        <button class="user-dropdown-item" id="btn-open-login">
          <span>🔑</span> Đăng nhập
        </button>
        <button class="user-dropdown-item" id="btn-open-register">
          <span>📝</span> Đăng ký tài khoản
        </button>
      `;

      document.getElementById('btn-open-login')?.addEventListener('click', () => {
        userDropdown.classList.remove('show');
        window.location.href = 'pages/login.html';
      });

      document.getElementById('btn-open-register')?.addEventListener('click', () => {
        userDropdown.classList.remove('show');
        AuthModal.open('register');
      });
    }
  },
};

// ---- Modal Đăng nhập / Đăng ký ----
const AuthModal = {
  init() {
    this.modal = document.getElementById('auth-modal');
    this.closeBtn = document.getElementById('auth-close-btn');
    this.tabLoginBtn = document.getElementById('tab-login-btn');
    this.tabRegisterBtn = document.getElementById('tab-register-btn');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');

    this.closeBtn?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.tabLoginBtn?.addEventListener('click', () => {
      window.location.href = 'pages/login.html';
    });
    this.tabRegisterBtn?.addEventListener('click', () => {
      window.location.href = 'pages/register.html';
    });
    document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'pages/register.html';
    });
    document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'pages/login.html';
    });

    // Submit Đăng nhập
    this.loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const json = await res.json();

        if (json.success) {
          Auth.setAuth(json.data.token, json.data.user);
          Cart.loadCurrentCart();
          this.close();
          showToast(`Đăng nhập thành công! Chào ${json.data.user.fullName}`);
          Cart.syncGuestCartToDB();
        } else {
          showToast(json.message || 'Đăng nhập thất bại');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ');
      }
    });

    // Submit Đăng ký
    this.registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-fullname').value.trim();
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, username, email, phone, password }),
        });
        const json = await res.json();

        if (json.success) {
          Auth.setAuth(json.data.token, json.data.user);
          Cart.loadCurrentCart();
          this.close();
          showToast('Đăng ký tài khoản Fresh Garden thành công!');
          Cart.syncGuestCartToDB();
        } else {
          showToast(json.message || 'Đăng ký thất bại');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ');
      }
    });

    // Toggle dropdown khi bấm vào nút user trên header
    document.getElementById('user-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const dd = document.getElementById('user-dropdown');
      dd?.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      document.getElementById('user-dropdown')?.classList.remove('show');
    });
  },
  open(tab = 'login') {
    this.switchTab(tab);
    this.modal?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  close() {
    this.modal?.classList.remove('open');
    document.body.style.overflow = '';
  },
  switchTab(tab) {
    if (tab === 'login') {
      this.tabLoginBtn?.classList.add('active');
      this.tabRegisterBtn?.classList.remove('active');
      if (this.loginForm) this.loginForm.style.display = 'block';
      if (this.registerForm) this.registerForm.style.display = 'none';
    } else {
      this.tabRegisterBtn?.classList.add('active');
      this.tabLoginBtn?.classList.remove('active');
      if (this.loginForm) this.loginForm.style.display = 'none';
      if (this.registerForm) this.registerForm.style.display = 'block';
    }
  },
};

/* ============================================================
   2. QUẢN LÝ SẢN PHẨM & TÌM KIẾM TỪ SQL SERVER (MODULE 1 - NGUYỄN VĂN ANH)
   ============================================================ */
const Products = {
  currentFilter: { id: 'all', kind: 'all' },
  featuredRequestId: 0,
  homeCollectionRequestId: 0,

  init() {
    this.bindCategoryChips();
    this.bindCategoryIcons();
    this.bindMenuFilters();
    this.bindLiveSearch();
    this.bindCatalogSort();
    this.bindHomeCollectionTabs();
    this.loadCategories();
    this.loadNews();
    this.loadFeaturedProducts('1', 4, 'parent');
    this.loadHomeCollection(4);
  },

  // Skeleton loader tạo trải nghiệm mượt mà, chống giật layout (CLS < 0.1)
  renderSkeletons(container, count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      `;
    }
    container.innerHTML = html;
  },

  // Tải sản phẩm từ SQL Server API (/api/products)
  async loadFeaturedProducts(filterId = 'all', limit = 4, filterKind = 'all') {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    const requestId = ++this.featuredRequestId;
    this.currentFilter = { id: String(filterId), kind: filterKind };

    if (grid.querySelector('.product-card')) grid.classList.add('is-loading');
    else this.renderSkeletons(grid, 4);

    try {
      const sort = document.getElementById('catalog-sort')?.value || 'default';
      let url = `${API_BASE}/products?limit=${limit}`;
      if (filterId !== 'all') {
        const parameter = filterKind === 'child' ? 'maLoai' : filterKind === 'parent' ? 'maLoaiCha' : 'loaiId';
        url += `&${parameter}=${encodeURIComponent(filterId)}`;
      }
      if (sort !== 'default') url += `&sort=${sort}`;

      const res = await fetch(url);
      const json = await res.json();
      if (requestId !== this.featuredRequestId) return;

      if (json.success && json.data.products.length > 0) {
        this.renderProductCards(grid, json.data.products);
        const resultCount = document.getElementById('catalog-result-count');
        if (resultCount) resultCount.textContent = `${json.data.total} sản phẩm`;
        const moreButton = document.getElementById('view-more-featured');
        if (moreButton) {
          moreButton.hidden = json.data.total <= json.data.products.length;
          moreButton.onclick = () => this.loadFeaturedProducts(filterId, json.data.total, filterKind);
        }
      } else {
        grid.innerHTML = '<div class="data-empty">Không có sản phẩm nào trong danh mục này.</div>';
        const resultCount = document.getElementById('catalog-result-count');
        if (resultCount) resultCount.textContent = '0 sản phẩm';
      }
    } catch (err) {
      if (requestId !== this.featuredRequestId) return;
      console.error('[Products.loadFeaturedProducts] Lỗi:', err);
      grid.innerHTML = '<div class="data-empty" role="alert">Không thể tải thực đơn từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.</div>';
    } finally {
      if (requestId === this.featuredRequestId) grid.classList.remove('is-loading');
    }
  },

  async loadHomeCollection(parentId) {
    const grid = document.getElementById('home-collection-grid');
    if (!grid) return;
    const requestId = ++this.homeCollectionRequestId;
    grid.setAttribute('aria-busy', 'true');
    if (grid.querySelector('.product-card')) grid.classList.add('is-loading');
    else this.renderSkeletons(grid, 4);

    try {
      const response = await fetch(`${API_BASE}/products?maLoaiCha=${encodeURIComponent(parentId)}&limit=4`);
      const json = await response.json();
      if (requestId !== this.homeCollectionRequestId) return;
      if (!response.ok || !json.success) throw new Error(json.message || 'Không thể tải bộ sưu tập.');
      const products = json.data?.products || [];
      if (products.length) this.renderProductCards(grid, products);
      else grid.innerHTML = '<div class="data-empty">Hiện chưa có sản phẩm trong bộ sưu tập này.</div>';
    } catch (error) {
      if (requestId !== this.homeCollectionRequestId) return;
      console.error('[Products.loadHomeCollection] Lỗi:', error);
      grid.innerHTML = '<div class="data-empty" role="alert">Không thể tải sản phẩm lúc này. Vui lòng thử lại sau.</div>';
    } finally {
      if (requestId === this.homeCollectionRequestId) {
        grid.setAttribute('aria-busy', 'false');
        grid.classList.remove('is-loading');
      }
    }
  },

  bindHomeCollectionTabs() {
    const tabs = document.querySelector('.home-collection-tabs');
    const allLink = document.getElementById('home-collection-link');
    if (!tabs) return;

    tabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-home-category]');
      if (!button) return;

      tabs.querySelectorAll('[data-home-category]').forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
      });
      document.getElementById('home-collection-grid')?.setAttribute('aria-labelledby', button.id);

      const parentId = button.dataset.homeCategory;
      const categoryName = button.textContent.trim();
      if (allLink) {
        allLink.href = `pages/products.html?maLoaiCha=${encodeURIComponent(parentId)}`;
        allLink.textContent = `Xem toàn bộ ${categoryName.toLocaleLowerCase('vi-VN')}`;
      }
      this.loadHomeCollection(parentId);
    });
  },

  async loadCategories() {
    const filterWrap = document.getElementById('filter-chips-wrap');
    const loading = document.getElementById('catalog-filter-loading');

    try {
      const res = await fetch(`${API_BASE}/products/categories`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Không thể tải danh mục');
      const categories = Array.isArray(json.data) ? json.data : [];
      if (loading) loading.remove();
      const makeCategoryLink = (label, loaiId, parentId, filterKind, className = '') => {
        const link = document.createElement('a');
        const queryKey = filterKind === 'child' ? 'maLoai' : 'maLoaiCha';
        link.href = `pages/products.html?${queryKey}=${encodeURIComponent(loaiId)}`;
        link.dataset.filter = String(loaiId);
        link.dataset.filterKind = filterKind;
        if (parentId) link.dataset.parentFilter = String(parentId);
        link.className = className;
        link.textContent = label;
        return link;
      };
      const megaGrid = document.getElementById('mega-menu-grid');
      const drawerGroups = document.getElementById('drawer-category-groups');
      if (megaGrid) megaGrid.replaceChildren();
      if (drawerGroups) drawerGroups.replaceChildren();
      categories.forEach((category) => {
        const megaCategory = document.createElement('section');
        megaCategory.className = 'mega-category';
        megaCategory.appendChild(makeCategoryLink(category.TenLoaiCha, category.MaLoaiCha, category.MaLoaiCha, 'parent', 'mega-category-title'));
        (category.subCategories || []).forEach((child) => {
          megaCategory.appendChild(makeCategoryLink(child.TenLoai, child.MaLoai, category.MaLoaiCha, 'child', 'mega-category-link'));
        });
        megaGrid?.appendChild(megaCategory);

        const drawerCategory = document.createElement('section');
        drawerCategory.className = 'drawer-category-group';
        drawerCategory.appendChild(makeCategoryLink(category.TenLoaiCha, category.MaLoaiCha, category.MaLoaiCha, 'parent', 'drawer-category-title'));
        (category.subCategories || []).forEach((child) => {
          drawerCategory.appendChild(makeCategoryLink(child.TenLoai, child.MaLoai, category.MaLoaiCha, 'child', 'drawer-category-link'));
        });
        drawerGroups?.appendChild(drawerCategory);
      });
      if (filterWrap) {
        categories.forEach((category) => {
          const button = document.createElement('button');
          button.className = 'filter-chip';
          button.dataset.loai = category.MaLoaiCha;
          button.textContent = category.TenLoaiCha;
          filterWrap.appendChild(button);
        });
      }
    } catch (err) {
      console.error('[Products.loadCategories] Lỗi:', err);
      loading?.replaceWith(Object.assign(document.createElement('span'), {
        className: 'catalog-filter-error',
        textContent: 'Không thể tải danh mục từ máy chủ',
      }));
    }
  },

  bindCatalogSort() {
    document.getElementById('catalog-sort')?.addEventListener('change', () => {
      this.loadFeaturedProducts(this.currentFilter.id, 12, this.currentFilter.kind);
    });
  },

  async loadStores() {
    const grid = document.getElementById('stores-grid');
    const countEl = document.getElementById('stores-count-info');
    if (!grid) return;

    grid.innerHTML = '<div class="data-loading" role="status">Đang tải hệ thống cửa hàng...</div>';

    try {
      const res = await fetch(`${API_BASE}/products/stores`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Không thể tải cửa hàng');

      const stores = Array.isArray(json.data) ? json.data : [];
      grid.dataset.stores = JSON.stringify(stores);
      this.renderStores(stores);

      const searchInput = document.getElementById('store-search-input');
      const districtFilter = document.getElementById('store-district-filter');
      const filterStores = () => {
        const query = searchInput?.value.trim().toLocaleLowerCase('vi-VN') || '';
        const district = districtFilter?.value || 'all';
        const filtered = stores.filter((store) => {
          const haystack = `${store.TenCuaHang} ${store.DiaChi} ${store.MoTa || ''}`.toLocaleLowerCase('vi-VN');
          return (!query || haystack.includes(query)) && (district === 'all' || haystack.includes(district.toLocaleLowerCase('vi-VN')));
        });
        this.renderStores(filtered);
      };

      searchInput?.addEventListener('input', filterStores);
      districtFilter?.addEventListener('change', filterStores);
    } catch (err) {
      console.error('[Products.loadStores] Lỗi:', err);
      grid.innerHTML = '<div class="data-empty" role="alert">Không thể tải danh sách cửa hàng. Vui lòng thử lại sau.</div>';
      if (countEl) countEl.textContent = 'Chưa có dữ liệu';
    }
  },

  renderStores(stores) {
    const grid = document.getElementById('stores-grid');
    const countEl = document.getElementById('stores-count-info');
    if (!grid) return;

    if (countEl) countEl.textContent = `${stores.length} cửa hàng phù hợp`;
    if (!stores.length) {
      grid.innerHTML = '<div class="data-empty">Không tìm thấy cửa hàng phù hợp với tiêu chí của bạn.</div>';
      return;
    }

    grid.innerHTML = stores.map((store) => {
      const name = escapeHTML(store.TenCuaHang || 'Fresh Garden');
      const address = escapeHTML(store.DiaChi || 'Đang cập nhật địa chỉ');
      const phone = escapeHTML(store.SoDT || '1900 2075');
      const email = escapeHTML(store.Email || '');
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.DiaChi || '')}`;

      return `
        <article class="store-card">
          <div class="store-card-header">
            <h3 class="store-card-name">${name}</h3>
            <span class="store-badge-num">FG ${String(store.MaCuaHang).padStart(2, '0')}</span>
          </div>
          <p class="store-card-address">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <span>${address}</span>
          </p>
          <div class="store-card-meta">
            <span class="store-meta-row">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.07 9.81 19.8 19.8 0 0 1 1.1 3.18 2 2 0 0 1 3.1 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.08 8.63a16 16 0 0 0 8.29 8.29l.99-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 17.9Z"/></svg>
              <a href="tel:${phone.replace(/[^0-9+]/g, '')}">${phone}</a>
            </span>
            ${email ? `<span class="store-meta-row"><span aria-hidden="true">✉</span><span>${email}</span></span>` : ''}
          </div>
          <div class="store-card-actions">
            <a class="btn-store-call" href="tel:${phone.replace(/[^0-9+]/g, '')}">Gọi cửa hàng</a>
            <a class="btn-store-map" href="${mapUrl}" target="_blank" rel="noopener noreferrer">Chỉ đường</a>
          </div>
        </article>
      `;
    }).join('');
  },

  async loadNews() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="data-loading" role="status">Đang cập nhật tin tức...</div>';
    try {
      const res = await fetch(`${API_BASE}/products/news`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Không thể tải tin tức');
      const news = Array.isArray(json.data) ? json.data : [];
      this.renderNews(news.slice(0, 3));

      const moreButton = document.getElementById('view-all-news');
      moreButton?.addEventListener('click', () => this.renderNews(news));
      if (moreButton) moreButton.hidden = news.length <= 3;
    } catch (err) {
      console.error('[Products.loadNews] Lỗi:', err);
      grid.innerHTML = '<div class="data-empty" role="alert">Không thể tải tin tức. Vui lòng thử lại sau.</div>';
    }
  },

  renderNews(news) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    if (!news.length) {
      grid.innerHTML = '<div class="data-empty">Chưa có bài viết mới.</div>';
      return;
    }

    grid.innerHTML = news.map((item, index) => {
      const title = escapeHTML(item.TieuDe || 'Tin tức Fresh Garden');
      const excerpt = escapeHTML(item.NoiDung || 'Khám phá thêm những câu chuyện mới tại Fresh Garden.');
      const date = item.NgayDang
        ? new Date(item.NgayDang).toLocaleDateString('vi-VN')
        : 'Fresh Garden';
      const image = item.HinhAnh && !item.HinhAnh.startsWith('/images/demo/')
        ? item.HinhAnh
        : `https://images.unsplash.com/photo-${['1555507036-ab1f4038808a', '1509440159596-0249088772ff', '1578985545062-69928b1d9587'][index % 3]}?w=700&h=440&fit=crop`;

      return `
        <article class="news-card">
          <div class="news-img-wrap">
            <img src="${image}" alt="${title}" class="news-img" loading="lazy" width="700" height="440" />
          </div>
          <div class="news-body">
            <div class="news-meta-row">
              <span class="news-tag">Fresh Garden journal</span>
              <time class="news-date" datetime="${item.NgayDang || ''}">${date}</time>
            </div>
            <h3 class="news-title">${title}</h3>
            <p class="news-excerpt">${excerpt}</p>
            <button class="news-readmore" type="button" data-news-title="${title}">Đọc câu chuyện <span aria-hidden="true">→</span></button>
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('.news-readmore').forEach((button) => {
      button.addEventListener('click', () => showToast(`Bài viết “${button.dataset.newsTitle}” sẽ sớm được cập nhật đầy đủ.`));
    });
  },

  renderProductCards(container, products) {
    const html = products.map((sp, idx) => {
      const imgUrl = getProductImage(sp);
      const safeName = escapeHTML(sp.TenSP);
      const safeImage = escapeHTML(imgUrl);
      const productId = Number(sp.MaSP);
      const price = Number(sp.DonGia) || 0;
      const badge = idx === 0 ? '<div class="product-badge new">Mới</div>' : (idx === 1 ? '<div class="product-badge hot">Hot</div>' : '');

      return `
        <div class="product-card" data-id="${productId}">
          <div class="product-img-wrap" onclick="Products.openQuickView(${productId})">
            <img src="${safeImage}" alt="${safeName}" class="product-img" loading="lazy" decoding="async" width="400" height="400" />
            ${badge}
            <div class="product-overlay">
              <button class="btn-add-cart" data-id="${productId}" data-name="${safeName}" data-price="${price}" onclick="event.stopPropagation();">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                Thêm vào giỏ
              </button>
            </div>
          </div>
          <div class="product-info" onclick="Products.openQuickView(${productId})" style="cursor:pointer">
            <h3 class="product-name">${safeName}</h3>
            <p class="product-price">${fmt(price)} <span style="font-size:12px;color:var(--gray);font-weight:400">/${escapeHTML(sp.DonViTinh || 'cái')}</span></p>
          </div>
        </div>
      `;
    }).join('');
    container.innerHTML = html;
  },

  // Xem chi tiết nhanh (Quick View Modal)
  openQuickView(spId) {
    window.location.href = `pages/product.html?id=${encodeURIComponent(spId)}`;
  },

  // Gắn sự kiện chuyển danh mục lọc
  bindCategoryChips() {
    document.getElementById('filter-chips-wrap')?.addEventListener('click', (event) => {
      const chip = event.target.closest('.filter-chip');
      if (!chip) return;
      document.querySelectorAll('.filter-chip').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      const id = chip.dataset.loai || 'all';
      this.loadFeaturedProducts(id, 12, id === 'all' ? 'all' : 'parent');
    });
  },

  bindCategoryIcons() {
    document.querySelectorAll('.cat-item[data-loai]').forEach((el) => {
      const filterKey = el.dataset.filterKind === 'child' ? 'maLoai' : 'maLoaiCha';
      el.href = `pages/products.html?${filterKey}=${encodeURIComponent(el.dataset.loai)}`;
    });
  },

  bindMenuFilters() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-filter]');
      if (!link || !link.getAttribute('href')?.startsWith('#')) return;
      event.preventDefault();
      const loaiId = link.dataset.filter || 'all';
      const chipId = link.dataset.parentFilter || loaiId;
      const filterKind = link.dataset.filterKind || (loaiId === 'all' ? 'all' : 'parent');
      document.querySelectorAll('.filter-chip').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.loai === chipId);
      });
      this.loadFeaturedProducts(loaiId, 12, filterKind);
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('menu-products-toggle')?.setAttribute('aria-expanded', 'false');
      document.querySelector('.nav-has-dropdown')?.classList.remove('is-open');
    });
  },

  // Tìm kiếm trực tiếp từ SQL Server (Live Search)
  bindLiveSearch() {
    const input = document.getElementById('search-input');
    const form = document.getElementById('search-form');
    const resultsBox = document.getElementById('search-results-box');
    const resultsInner = document.getElementById('search-results-inner');
    let timer = null;

    if (!input || !resultsBox || !resultsInner) return;

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = input.value.trim();
      const destination = q
        ? `pages/products.html?q=${encodeURIComponent(q)}`
        : 'pages/products.html';
      window.location.href = destination;
    });

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();

      if (q.length < 2) {
        resultsBox.classList.remove('show');
        resultsInner.innerHTML = '';
        return;
      }

      timer = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE}/products?q=${encodeURIComponent(q)}&limit=6`);
          const json = await res.json();

          if (json.success && json.data.products.length > 0) {
            let html = '';
            json.data.products.forEach(sp => {
              const img = getProductImage(sp);
              const safeName = escapeHTML(sp.TenSP);
              const safeImg = escapeHTML(img);
              const productId = Number(sp.MaSP);
              const price = Number(sp.DonGia) || 0;
              html += `
                <div class="search-item" onclick="Products.openQuickView(${productId})">
                  <img src="${safeImg}" alt="${safeName}" class="search-item-thumb" />
                  <div class="search-item-info">
                    <div class="search-item-name">${safeName}</div>
                    <div class="search-item-price">${fmt(price)}</div>
                  </div>
                  <button class="btn-add-cart" data-id="${productId}" data-name="${safeName}" data-price="${price}" onclick="event.stopPropagation();">
                    + Thêm
                  </button>
                </div>
              `;
            });
            resultsInner.innerHTML = html;
            resultsBox.classList.add('show');
          } else {
            resultsInner.innerHTML = `<div style="padding:14px;color:var(--gray);text-align:center;">Không tìm thấy bánh phù hợp với từ khóa "${escapeHTML(q)}"</div>`;
            resultsBox.classList.add('show');
          }
        } catch (e) {}
      }, 300);
    });
  },
};

/* ============================================================
   3. QUẢN LÝ GIỎ HÀNG (MODULE 2 - NGUYỄN THÁI ĐẠT)
   ============================================================ */
const CART_STORAGE_KEY = 'banhfg_cart';

function getCartStorageKey() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('fg_user') || 'null'); }
  catch { user = null; }
  const customerId = localStorage.getItem('fg_token') ? user?.maKhachHang : null;
  return customerId == null ? `${CART_STORAGE_KEY}_guest` : `${CART_STORAGE_KEY}_user_${customerId}`;
}

function readStoredCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(getCartStorageKey()) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

let cart = readStoredCart();

function saveCart() {
  localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
  localStorage.removeItem(CART_STORAGE_KEY);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

const Cart = {
  loadCurrentCart() {
    cart = readStoredCart();
    this.updateUI();
  },

  updateUI() {
    const count = getCartCount();
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total-price');
    const itemsEl = document.getElementById('cart-items');
    const emptyEl = document.getElementById('cart-empty');
    const footerEl = document.getElementById('cart-footer');

    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = fmt(getCartTotal());

    if (!itemsEl) return;

    if (cart.length === 0) {
      if (emptyEl) emptyEl.style.display = 'flex';
      if (footerEl) footerEl.style.display = 'none';
      itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      if (footerEl) footerEl.style.display = 'block';

      itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
      cart.forEach(item => {
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.dataset.id = item.id;
        el.innerHTML = `
          <div class="cart-item-img"><img src="${escapeHTML(item.image || 'assets/banner_banh_kem.jpg')}" alt="${escapeHTML(item.name)}" onerror="this.onerror=null;this.src='assets/banner_banh_kem.jpg'" /></div>
          <div class="cart-item-info">
          <div class="cart-item-name">${escapeHTML(item.name)}</div>
            <div class="cart-item-price">${fmt(item.price)}</div>
            <div class="cart-item-qty">
              <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
            </div>
          </div>
          <button class="cart-item-del" data-id="${item.id}" title="Xóa">✕</button>
        `;
        itemsEl.insertBefore(el, emptyEl);
      });

      itemsEl.querySelectorAll('.qty-plus').forEach(btn => btn.addEventListener('click', () => this.changeQty(btn.dataset.id, 1)));
      itemsEl.querySelectorAll('.qty-minus').forEach(btn => btn.addEventListener('click', () => this.changeQty(btn.dataset.id, -1)));
      itemsEl.querySelectorAll('.cart-item-del').forEach(btn => btn.addEventListener('click', () => this.removeFromCart(btn.dataset.id)));
    }
  },

  changeQty(id, delta) {
    const item = cart.find(i => String(i.id) === String(id));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) this.removeFromCart(id);
    else {
      saveCart();
      this.updateUI();
      const token = Auth.getToken();
      if (token) fetch(`${API_BASE}/cart/items/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ soLuong: item.qty }),
      }).catch(() => showToast('Chưa đồng bộ được số lượng với máy chủ'));
    }
  },

  removeFromCart(id) {
    cart = cart.filter(i => String(i.id) !== String(id));
    saveCart();
    this.updateUI();
    const token = Auth.getToken();
    if (token) fetch(`${API_BASE}/cart/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => showToast('Chưa đồng bộ được giỏ hàng với máy chủ'));
  },

  add(id, name, price, image = '') {
    const existing = cart.find(i => String(i.id) === String(id));
    if (existing) {
      existing.qty++;
      existing.image ||= image;
    } else cart.push({ id, name, price: +price, qty: 1, image });
    saveCart();
    this.updateUI();
    showToast(`Đã thêm 1 “${name}” vào giỏ hàng.`);

    // Nếu đã đăng nhập, gửi lên DB
    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ maSP: id, soLuong: 1 }),
      }).catch(() => {});
    }
  },

  // Tải giỏ hàng riêng của tài khoản hiện đang đăng nhập.
  async syncGuestCartToDB(mergeGuestItems = true) {
    const token = Auth.getToken();
    if (!token) return;
    const customerId = Auth.getUser()?.maKhachHang;
    const guestCartKey = `${CART_STORAGE_KEY}_guest`;

    try {
      let guestCart = [];
      try { guestCart = JSON.parse(localStorage.getItem(guestCartKey) || '[]'); } catch { guestCart = []; }
      if (mergeGuestItems && Array.isArray(guestCart) && guestCart.length) {
        const items = guestCart.map(i => ({ maSP: i.id, soLuong: i.qty }));
        const mergeResponse = await fetch(`${API_BASE}/cart/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ items }),
        }, true);
        const mergeJson = await mergeResponse.json();
        if (!mergeResponse.ok || !mergeJson.success) throw new Error(mergeJson.message || 'Không gộp được giỏ hàng');
        localStorage.removeItem(guestCartKey);
      }
      const response = await fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Không tải được giỏ hàng');
      if (Auth.getToken() !== token || Auth.getUser()?.maKhachHang !== customerId) return;
      cart = (json.data.items || []).map((item) => ({
        id: item.MaSP,
        name: item.TenSP,
        price: Number(item.DonGia),
        qty: Number(item.SoLuong),
        image: item.HinhAnh || '',
      }));
      saveCart();
      this.updateUI();
    } catch (error) {
      showToast(error.message || 'Không tải được giỏ hàng của tài khoản');
    }
  },

  openSidebar() {
    document.getElementById('cart-sidebar')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.remove('route-pending');
  },

  closeSidebar() {
    document.getElementById('cart-sidebar')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  },
};

/* ============================================================
   4. QUẢN LÝ THANH TOÁN & ĐƠN HÀNG (MODULE 3 - ĐÀM QUANG TRUNG)
   ============================================================ */
const Orders = {
  currentDiscount: 0,
  currentCouponId: null,
  savedAddresses: [],
  isSubmitting: false,
  addressDataPromise: null,
  activeTransferOrder: null,

  init() {
    document.getElementById('co-saved-address')?.addEventListener('change', (event) => {
      const address = this.savedAddresses.find((item) => String(item.MaDiaChi) === event.target.value);
      this.setSavedAddressFields(address);
    });
    document.getElementById('co-province')?.addEventListener('change', (event) => {
      const province = this.getAddressLocations().find((item) => String(item.code) === event.target.value);
      this.setAddressSelectOptions('co-district', province?.districts || [], 'Chọn quận / huyện');
      this.setAddressSelectOptions('co-ward', [], 'Chọn phường / xã');
    });
    document.getElementById('co-district')?.addEventListener('change', (event) => {
      const provinceCode = document.getElementById('co-province')?.value;
      const province = this.getAddressLocations().find((item) => String(item.code) === provinceCode);
      const district = province?.districts.find((item) => String(item.code) === event.target.value);
      this.setAddressSelectOptions('co-ward', district?.wards || [], 'Chọn phường / xã');
    });
    document.getElementById('my-orders-close-btn')?.addEventListener('click', () => {
      document.getElementById('my-orders-modal')?.classList.remove('open');
      document.body.style.overflow = '';
    });
    document.getElementById('my-orders-modal')?.addEventListener('click', (event) => {
      if (event.target.id === 'my-orders-modal') {
        event.currentTarget.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
    document.getElementById('my-orders-list')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-order-id]');
      if (button) this.showOrderDetails(button.dataset.orderId);
    });
    // Nút checkout trong sidebar giỏ hàng
    document.getElementById('btn-checkout')?.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Giỏ hàng của bạn đang trống!');
        return;
      }

      // Kiểm tra đăng nhập
      const user = Auth.getUser();
      if (!user) {
        showLoginRequiredNotice();
        return;
      }

      Cart.closeSidebar();
      this.openCheckoutModal(user);
    });

    // Nút đóng modal checkout
    document.getElementById('checkout-close-btn')?.addEventListener('click', () => {
      document.getElementById('checkout-modal')?.classList.remove('open');
      document.body.style.overflow = '';
    });
    document.getElementById('checkout-modal')?.addEventListener('click', (event) => {
      if (!event.target.closest('[data-checkout-return-cart]')) return;
      document.getElementById('checkout-modal')?.classList.remove('open');
      document.body.style.overflow = '';
      window.location.href = 'pages/cart.html';
    });

    // Nút áp dụng mã giảm giá
    document.getElementById('btn-apply-discount')?.addEventListener('click', () => this.applyCoupon());

    document.getElementById('btn-checkout-continue')?.addEventListener('click', () => {
      const emailInput = document.getElementById('co-email');
      if (emailInput.value && !emailInput.checkValidity()) {
        showToast('Vui lòng nhập email đúng định dạng');
        emailInput.focus();
        return;
      }

      const missingField = this.getMissingCheckoutField();
      if (missingField) {
        showToast(`Vui lòng nhập ${missingField.labels[0]?.textContent.replace('*', '').trim().toLowerCase() || 'đầy đủ thông tin giao hàng'}`);
        missingField.focus();
        return;
      }
      document.getElementById('co-address').value = this.getCheckoutAddress();
      this.setCheckoutStep(2);
      document.getElementById('checkout-title')?.focus();
    });
    document.getElementById('btn-checkout-back')?.addEventListener('click', () => this.setCheckoutStep(1));

    document.querySelectorAll('input[name="payment-method"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        const submitButton = document.getElementById('btn-confirm-order');
        if (submitButton) {
          submitButton.textContent = input.value === 'Chuyển khoản'
            ? 'Chuyển đến thanh toán'
            : 'Hoàn tất đơn hàng';
        }
      });
    });

    // Nút xác nhận đặt hàng
    document.getElementById('btn-confirm-order')?.addEventListener('click', () => this.submitOrder());

    // Đóng popup thành công
    document.getElementById('btn-success-close')?.addEventListener('click', () => {
      const successModal = document.getElementById('success-modal');
      successModal?.classList.remove('open', 'has-payment-qr', 'is-payment-pending');
      this.activeTransferOrder = null;
      document.body.style.overflow = '';
    });
    document.getElementById('success-order-box')?.addEventListener('click', async (event) => {
      const action = event.target.closest('[data-payment-action]');
      if (action) {
        if (action.dataset.paymentAction === 'check') await this.checkTransferPayment();
        if (action.dataset.paymentAction === 'transfer') this.setTransferPaymentStage('transfer');
        if (action.dataset.paymentAction === 'close') {
          document.getElementById('success-modal')?.classList.remove('open', 'has-payment-qr', 'is-payment-pending');
          this.activeTransferOrder = null;
          document.body.style.overflow = '';
        }
        if (action.dataset.paymentAction === 'orders') {
          document.getElementById('success-modal')?.classList.remove('open', 'has-payment-qr', 'is-payment-pending');
          this.activeTransferOrder = null;
          document.body.style.overflow = '';
          await this.showMyOrdersModal();
        }
        return;
      }

      const button = event.target.closest('[data-copy-payment]');
      if (!button) return;
      try {
        await navigator.clipboard.writeText(button.dataset.copyPayment || '');
        showToast('Đã sao chép nội dung chuyển khoản.');
      } catch {
        showToast(`Nội dung chuyển khoản: ${button.dataset.copyPayment || ''}`);
      }
    });
  },

  async openCheckoutModal(user) {
    const modal = document.getElementById('checkout-modal');
    if (!modal) {
      document.documentElement.classList.remove('route-pending');
      return;
    }
    if (!await this.ensureAddressData()) {
      document.documentElement.classList.remove('route-pending');
      return;
    }
    this.setCheckoutStep(1);

    // Điền sẵn thông tin khách hàng
    const recInput = document.getElementById('co-receiver');
    const phoneInput = document.getElementById('co-phone');
    if (recInput) recInput.value = user.fullName || user.username || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    const emailInput = document.getElementById('co-email');
    if (emailInput) emailInput.value = user.email || '';
    this.setSavedAddressFields(null);

    const addressGroup = document.getElementById('saved-address-group');
    const addressSelect = document.getElementById('co-saved-address');
    this.savedAddresses = [];
    if (addressSelect) addressSelect.innerHTML = '<option value="new">＋ Nhập địa chỉ giao hàng mới</option>';
    try {
      const response = await fetch(`${API_BASE}/orders/addresses`, {
        headers: { Authorization: `Bearer ${Auth.getToken()}` },
      });
      const json = await response.json();
      if (json.success && Array.isArray(json.data) && json.data.length) {
        this.savedAddresses = json.data;
        addressGroup.hidden = false;
        addressSelect.innerHTML += json.data.map((item) =>
          `<option value="${item.MaDiaChi}">${escapeHTML(item.NguoiNhan)} · ${escapeHTML(item.DiaChi)}${item.MacDinh ? ' (Mặc định)' : ''}</option>`
        ).join('');
        const preferred = json.data.find((item) => item.MacDinh) || json.data[0];
        addressSelect.value = String(preferred.MaDiaChi);
        addressSelect.dispatchEvent(new Event('change'));
      } else {
        addressGroup.hidden = true;
        ['co-receiver', 'co-phone', 'co-address'].forEach((id) => {
          const field = document.getElementById(id);
          if (field) field.readOnly = false;
        });
      }
    } catch (error) {
      addressGroup.hidden = true;
      ['co-receiver', 'co-phone', 'co-address'].forEach((id) => {
        const field = document.getElementById(id);
        if (field) field.readOnly = false;
      });
    }

    let cartPreferences = {};
    try { cartPreferences = JSON.parse(localStorage.getItem('fg_cart_checkout_preferences') || '{}'); } catch {}
    const noteInput = document.getElementById('co-note');
    if (noteInput) {
      const notes = [];
      if (cartPreferences.deliveryDate) {
        const receiveDate = new Date(`${cartPreferences.deliveryDate}T00:00:00`).toLocaleDateString('vi-VN');
        notes.push(`Ngày nhận hàng: ${receiveDate}`);
      }
      if (cartPreferences.deliverySlot && cartPreferences.deliverySlot !== 'Càng sớm càng tốt') notes.push(`Thời gian nhận: ${cartPreferences.deliverySlot}`);
      if (cartPreferences.invoice) {
        const invoiceDetails = [cartPreferences.companyName, cartPreferences.taxCode].filter(Boolean).join(' · ');
        notes.push(`Xuất hóa đơn công ty${invoiceDetails ? `: ${invoiceDetails}` : ''}`);
      }
      if (cartPreferences.notes) notes.push(cartPreferences.notes);
      noteInput.value = notes.join('\n');
    }

    // Render danh sách sản phẩm tóm tắt
    const listEl = document.getElementById('co-items-list');
    if (listEl) {
      listEl.innerHTML = cart.map(i => `
        <div class="co-item-row">
          <div class="co-item-image">
            <img src="${escapeHTML(i.image || getProductImage({ MaSP: Number(i.id), HinhAnh: '' }))}" alt="${escapeHTML(i.name)}" />
            <span aria-label="Số lượng ${Number(i.qty)}">${Number(i.qty)}</span>
          </div>
          <div class="co-item-copy">
            <span>${escapeHTML(i.name)}</span>
            <small>Số lượng: ${Number(i.qty)}</small>
          </div>
          <strong>${fmt(i.price * i.qty)}</strong>
        </div>
      `).join('');
    }

    this.currentDiscount = 0;
    this.currentCouponId = null;
    const pendingCoupon = localStorage.getItem('fg_pending_coupon') || '';
    const couponInput = document.getElementById('co-discount-code');
    if (couponInput) couponInput.value = pendingCoupon;
    document.getElementById('discount-msg').textContent = '';
    this.recalcTotals();

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.remove('route-pending');
    if (pendingCoupon) this.applyCoupon();
  },

  setSavedAddressFields(address) {
    const user = Auth.getUser() || {};
    const isSavedAddress = Boolean(address);
    const manualAddressFields = ['co-address-line', 'co-province', 'co-district', 'co-ward'];

    document.getElementById('co-receiver').value = address?.NguoiNhan || user.fullName || user.username || '';
    document.getElementById('co-phone').value = address?.SoDT || user.phone || '';
    document.getElementById('co-address').value = address?.DiaChi || '';
    manualAddressFields.forEach((id) => {
      const field = document.getElementById(id);
      field.value = '';
      field.disabled = isSavedAddress;
    });
    this.initAddressSelectors();

    const manualAddress = document.getElementById('checkout-manual-address');
    const savedAddress = document.getElementById('checkout-saved-address');
    const savedAddressValue = document.getElementById('co-saved-address-value');
    if (manualAddress) manualAddress.hidden = isSavedAddress;
    if (savedAddress) savedAddress.hidden = !isSavedAddress;
    if (savedAddressValue) savedAddressValue.value = address?.DiaChi || '';
  },

  getAddressLocations() {
    return Array.isArray(window.FG_VIETNAM_LOCATIONS) ? window.FG_VIETNAM_LOCATIONS : [];
  },

  async ensureAddressData() {
    if (this.getAddressLocations().length) return true;
    if (!this.addressDataPromise) {
      this.addressDataPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/vietnam-addresses.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Không tải được dữ liệu địa chỉ Việt Nam.'));
        document.head.append(script);
      }).then(() => {
        if (!this.getAddressLocations().length) {
          throw new Error('Dữ liệu địa chỉ Việt Nam không hợp lệ.');
        }
        this.initAddressSelectors();
        return true;
      }).catch((error) => {
        this.addressDataPromise = null;
        console.error('Không thể khởi tạo danh sách địa chỉ checkout.', error);
        showToast('Không tải được dữ liệu địa chỉ. Vui lòng tải lại trang và thử lại.');
        return false;
      });
    }
    return this.addressDataPromise;
  },

  setAddressSelectOptions(id, locations, placeholder) {
    const select = document.getElementById(id);
    if (!select) return;

    select.replaceChildren(new Option(placeholder, '', true, true));
    locations.forEach((location) => {
      const name = location.name.replace(/^(?:Tỉnh|Thành phố)\s+/, '');
      select.add(new Option(name, String(location.code)));
    });
  },

  initAddressSelectors() {
    const provinceSelect = document.getElementById('co-province');
    if (!provinceSelect) return;

    const locations = this.getAddressLocations();
    if (!locations.length) {
      console.error('Không tải được dữ liệu tỉnh/thành cho biểu mẫu đặt hàng.');
      return;
    }

    const priority = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'];
    const collator = new Intl.Collator('vi');
    const provinces = [...locations].sort((a, b) => {
      const labelA = a.name.replace(/^(?:Tỉnh|Thành phố)\s+/, '');
      const labelB = b.name.replace(/^(?:Tỉnh|Thành phố)\s+/, '');
      const indexA = priority.indexOf(labelA);
      const indexB = priority.indexOf(labelB);
      if (indexA !== -1 || indexB !== -1) {
        return (indexA === -1 ? priority.length : indexA) - (indexB === -1 ? priority.length : indexB);
      }
      return collator.compare(labelA, labelB);
    });

    this.setAddressSelectOptions('co-province', provinces, 'Chọn tỉnh / thành');
    this.setAddressSelectOptions('co-district', [], 'Chọn quận / huyện');
    this.setAddressSelectOptions('co-ward', [], 'Chọn phường / xã');
  },

  getCheckoutAddress() {
    const selectedAddress = document.getElementById('co-saved-address')?.value;
    if (selectedAddress && selectedAddress !== 'new') {
      const savedAddress = this.savedAddresses.find((item) => String(item.MaDiaChi) === selectedAddress);
      if (savedAddress?.DiaChi) return savedAddress.DiaChi.trim();
    }

    const address = [
      document.getElementById('co-address-line')?.value,
      document.getElementById('co-ward')?.selectedOptions[0]?.textContent,
      document.getElementById('co-district')?.selectedOptions[0]?.textContent,
      document.getElementById('co-province')?.selectedOptions[0]?.textContent,
    ].map((part) => part?.trim()).filter(Boolean).join(', ');
    document.getElementById('co-address').value = address;
    return address;
  },

  getMissingCheckoutField() {
    const selectedAddress = document.getElementById('co-saved-address')?.value;
    const hasSavedAddress = selectedAddress && selectedAddress !== 'new'
      && this.savedAddresses.some((item) => String(item.MaDiaChi) === selectedAddress);
    const fieldIds = ['co-receiver', 'co-phone'];
    if (!hasSavedAddress) fieldIds.push('co-address-line', 'co-province', 'co-district', 'co-ward');
    return fieldIds.map((id) => document.getElementById(id)).find((field) => !field.value.trim());
  },

  setCheckoutStep(step) {
    const checkoutModal = document.getElementById('checkout-modal');
    if (!checkoutModal) return;

    const currentStep = step === 2 ? 2 : 1;
    checkoutModal.dataset.step = String(currentStep);
    checkoutModal.querySelectorAll('[data-checkout-stage]').forEach((stage) => {
      stage.hidden = Number(stage.dataset.checkoutStage) !== currentStep;
    });
    checkoutModal.querySelectorAll('[data-checkout-step-label]').forEach((label) => {
      if (Number(label.dataset.checkoutStepLabel) === currentStep) label.setAttribute('aria-current', 'step');
      else label.removeAttribute('aria-current');
    });

    const title = document.getElementById('checkout-title');
    const subtitle = document.getElementById('checkout-subtitle');
    const shippingFee = document.getElementById('co-shipping-fee');
    if (title) title.textContent = currentStep === 1 ? 'Thông tin giao hàng' : 'Phương thức vận chuyển';
    if (subtitle) subtitle.hidden = currentStep !== 1;
    if (shippingFee) shippingFee.textContent = currentStep === 1 ? '—' : 'Miễn phí giao hàng';
  },

  recalcTotals() {
    const subtotal = getCartTotal();
    const finalTotal = Math.max(0, subtotal - this.currentDiscount);

    document.getElementById('co-subtotal').textContent = fmt(subtotal);
    document.getElementById('co-discount-val').textContent = `-${fmt(this.currentDiscount)}`;
    document.getElementById('co-final-total').textContent = fmt(finalTotal);
  },

  async applyCoupon() {
    const code = document.getElementById('co-discount-code').value.trim();
    const msgEl = document.getElementById('discount-msg');
    if (!code) {
      msgEl.textContent = 'Vui lòng nhập mã giảm giá';
      msgEl.style.color = 'var(--red-price)';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders/validate-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Auth.getToken()}` },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();

      if (json.success) {
        this.currentDiscount = Number(json.data.giamGiaTien ?? 0);
        this.currentCouponId = json.data.maGiamGia;
        localStorage.removeItem('fg_pending_coupon');
        msgEl.textContent = `✓ ${json.message}`;
        msgEl.style.color = 'var(--green-dark)';
        this.recalcTotals();
      } else {
        this.currentDiscount = 0;
        this.currentCouponId = null;
        msgEl.textContent = json.message || 'Mã ưu đãi không hợp lệ';
        msgEl.style.color = 'var(--red-price)';
        this.recalcTotals();
      }
    } catch (e) {
      msgEl.textContent = 'Lỗi kiểm tra mã giảm giá';
    }
  },

  async submitOrder() {
    if (this.isSubmitting) return;

    if (window.location.protocol === 'file:') {
      showToast('Không thể đặt hàng khi mở file trực tiếp. Hãy mở http://localhost:5000, đăng nhập rồi thử lại.');
      return;
    }

    const token = Auth.getToken();
    if (!token) {
      showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi đặt hàng.');
      return;
    }

    const receiver = document.getElementById('co-receiver').value.trim();
    const phone = document.getElementById('co-phone').value.trim();
    const address = this.getCheckoutAddress();
    const note = document.getElementById('co-note').value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'COD';

    const missingField = this.getMissingCheckoutField();
    if (missingField || !address) {
      showToast('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng');
      this.setCheckoutStep(1);
      (missingField || document.getElementById('co-address-line'))?.focus();
      return;
    }

    this.isSubmitting = true;
    const submitButton = document.getElementById('btn-confirm-order');
    const originalButtonText = submitButton?.textContent;
    const paymentInputs = [...document.querySelectorAll('input[name="payment-method"]')];
    const originalPaymentDisabledStates = paymentInputs.map((input) => input.disabled);
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = paymentMethod === 'Chuyển khoản'
        ? 'Đang chuyển đến thanh toán...'
        : 'Đang xử lý đơn hàng...';
      submitButton.setAttribute('aria-busy', 'true');
    }
    paymentInputs.forEach((input) => { input.disabled = true; });

    try {
      // Chọn DIA_CHI đã lưu hoặc tạo mới theo đúng MaDiaChi.
      const selectedAddress = document.getElementById('co-saved-address')?.value;
      let maDiaChi = selectedAddress && selectedAddress !== 'new' ? Number(selectedAddress) : null;
      if (!maDiaChi) {
        const addrRes = await fetch(`${API_BASE}/orders/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ nguoiNhan: receiver, soDT: phone, diaChi: address, macDinh: this.savedAddresses.length ? 0 : 1 }),
        });
        const addrJson = await addrRes.json();
        if (!addrRes.ok || !addrJson.success) throw new Error(addrJson.message || 'Không lưu được địa chỉ giao hàng');
        maDiaChi = addrJson.data.maDiaChi;
      }

      // 2. Tạo đơn hàng vào SQL Server
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          maDiaChi,
          maGiamGia: this.currentCouponId,
          phuongThucThanhToan: paymentMethod,
          ghiChu: note,
        }),
      });
      const orderJson = await orderRes.json();

      if (orderJson.success) {
        const successItemsList = document.getElementById('success-items-list');
        const successTotal = document.getElementById('success-total');
        if (successItemsList) successItemsList.innerHTML = document.getElementById('co-items-list')?.innerHTML || '';
        if (successTotal) successTotal.textContent = fmt(orderJson.data.tongTien);

        // Đặt hàng thành công
        document.getElementById('checkout-modal')?.classList.remove('open');
        cart = [];
        saveCart();
        Cart.updateUI();
        localStorage.removeItem('fg_cart_checkout_preferences');

        // Mở trang thanh toán hoặc biên lai cho đơn hàng vừa tạo
        const succBox = document.getElementById('success-order-box');
        const successModal = document.getElementById('success-modal');
        const isTransferOrder = orderJson.data.phuongThuc === 'Chuyển khoản';
        successModal?.classList.toggle('has-payment-qr', isTransferOrder);
        successModal?.classList.remove('is-payment-pending');
        document.getElementById('btn-success-close').hidden = false;
        document.getElementById('btn-success-close').textContent = 'Tiếp tục mua sắm';

        if (isTransferOrder) {
          const ck = orderJson.data.thongTinChuyenKhoan || {};
          this.activeTransferOrder = {
            id: orderJson.data.maDH,
            amount: Number(ck.soTien ?? orderJson.data.tongTien) || 0,
            bankName: ck.nganHang || 'Techcombank',
            accountNumber: ck.soTaiKhoan || '',
            accountHolder: ck.chuTaiKhoan || '',
            reference: ck.noiDung || `FG ${orderJson.data.maDH}`,
            paymentNote: orderJson.data.ghiChuThanhToan || '',
          };
          this.setTransferPaymentStage('transfer');
        } else {
          this.activeTransferOrder = null;
          succBox.innerHTML = `
            <h4>Thông tin đơn hàng</h4>
            <p class="success-detail-label">Thông tin giao hàng</p>
            <p>${escapeHTML(receiver)}<br>${escapeHTML(phone)}<br>${escapeHTML(address)}</p>
            <p class="success-order-meta">Mã đơn hàng: <strong>#DH-${escapeHTML(orderJson.data.maDH)}</strong></p>
            <p class="success-order-meta">Phương thức thanh toán: <strong>${escapeHTML(orderJson.data.phuongThuc)}</strong></p>
            <p class="success-order-meta">Tổng thanh toán: <strong>${fmt(orderJson.data.tongTien)}</strong></p>
            ${orderJson.data.ghiChuThanhToan ? `<div class="success-payment-note">${escapeHTML(orderJson.data.ghiChuThanhToan)}</div>` : ''}
          `;
          document.getElementById('success-title').textContent = 'Đặt hàng thành công';
          document.getElementById('success-msg').textContent = 'Cảm ơn bạn đã mua hàng! Đơn hàng đã được xác nhận.';
        }

        successModal?.classList.add('open');
      } else {
        showToast(orderJson.message || 'Lỗi khi tạo đơn hàng');
      }
    } catch (err) {
      showToast('Lỗi máy chủ khi đặt hàng: ' + err.message);
    } finally {
      this.isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        submitButton.removeAttribute('aria-busy');
      }
      paymentInputs.forEach((input, index) => {
        input.disabled = originalPaymentDisabledStates[index];
      });
    }
  },

  getTransferOrderCode() {
    const id = String(this.activeTransferOrder?.id ?? '');
    return id.startsWith('DH') ? id : `DH${id.padStart(4, '0')}`;
  },

  setTransferPaymentStage(stage) {
    const order = this.activeTransferOrder;
    const modal = document.getElementById('success-modal');
    const orderBox = document.getElementById('success-order-box');
    const closeButton = document.getElementById('btn-success-close');
    if (!order || !modal || !orderBox) return;

    modal.dataset.paymentStage = stage;
    modal.classList.toggle('is-payment-pending', stage === 'pending');
    const icon = document.querySelector('#success-modal .success-icon-wrap');
    const title = document.getElementById('success-title');
    const message = document.getElementById('success-msg');
    const orderCode = this.getTransferOrderCode();
    const amount = fmt(order.amount);
    const bank = escapeHTML(order.bankName);
    const accountNumber = escapeHTML(order.accountNumber || 'Xem thông tin trên mã QR');
    const accountHolder = escapeHTML(order.accountHolder || 'Xem thông tin trên mã QR');
    const reference = escapeHTML(order.reference);

    if (stage === 'transfer') {
      if (icon) icon.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
      if (title) title.textContent = 'Thanh toán đơn hàng';
      if (message) message.textContent = `Mã đơn hàng: ${orderCode}`;
      orderBox.innerHTML = `
        <div class="payment-page-heading"><h4>Quét mã QR để chuyển khoản</h4><p>Mở ứng dụng ngân hàng và quét mã bên dưới.</p></div>
        <section class="payment-qr-card" aria-label="Thông tin thanh toán bằng mã QR">
          <div class="payment-transfer-layout">
            <div class="payment-qr-art"><img src="assets/techcombank-vietqr.png" alt="Mã QR thanh toán qua Techcombank" onerror="this.hidden=true;this.nextElementSibling.hidden=false" /><p class="payment-qr-missing" hidden>Chưa tìm thấy ảnh QR.<br>Đặt file tại <code>assets/techcombank-vietqr.png</code>.</p><span>VietQR · Napas 247</span></div>
            <div class="payment-transfer-fields" aria-label="Thông tin chuyển khoản">
              <div><span>Ngân hàng</span><strong>${bank}</strong></div>
              <div><span>Chủ tài khoản</span><strong>${accountHolder}</strong></div>
              <div><span>Số tài khoản</span><strong>${accountNumber}</strong></div>
              <div><span>Số tiền cần trả</span><strong>${amount}</strong></div>
              <div class="payment-transfer-reference"><span>Nội dung chuyển khoản</span><strong>${reference}</strong><button type="button" class="payment-copy-button" data-copy-payment="${reference}" aria-label="Sao chép nội dung chuyển khoản">Sao chép</button></div>
            </div>
          </div>
          ${order.paymentNote ? `<p class="payment-qr-warning">${escapeHTML(order.paymentNote)}</p>` : ''}
          <p class="payment-qr-footnote">Vui lòng kiểm tra đúng người nhận, số tiền và nội dung chuyển khoản trước khi xác nhận giao dịch.</p>
        </section>
      `;
    } else if (stage === 'pending') {
      if (icon) icon.innerHTML = '<span class="payment-result-mark" aria-hidden="true">!</span>';
      if (title) title.textContent = 'Chưa xác nhận được thanh toán';
      if (message) message.textContent = `Chưa tìm thấy giao dịch khớp với đơn hàng ${orderCode}.`;
      orderBox.innerHTML = `
        <section class="payment-pending-panel" aria-live="polite">
          <p>Nếu bạn đã chuyển khoản, hãy kiểm tra lại:</p>
          <dl>
            <div><dt>Số tiền</dt><dd>${amount}</dd></div>
            <div><dt>Nội dung chuyển khoản</dt><dd>${reference}</dd></div>
          </dl>
          <p>Sau đó thử kiểm tra lại hoặc liên hệ Fresh Garden để được hỗ trợ.</p>
        </section>
        <div class="payment-flow-actions">
          <button type="button" class="payment-action-primary" data-payment-action="transfer">Trở lại thanh toán</button>
          <a class="payment-action-secondary" href="tel:19002075">Liên hệ hỗ trợ</a>
        </div>
        <p class="payment-order-status">Trạng thái đơn: <strong>Chờ xác nhận thanh toán</strong></p>
      `;
    } else if (stage === 'paid') {
      if (icon) icon.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>';
      if (title) title.textContent = 'Thanh toán thành công!';
      if (message) message.textContent = 'Fresh Garden đã nhận được khoản thanh toán của bạn.';
      orderBox.innerHTML = `
        <section class="payment-receipt" aria-label="Biên lai thanh toán">
          <h4>Biên lai thanh toán</h4>
          <dl>
            <div><dt>Mã đơn hàng</dt><dd>${orderCode}</dd></div>
            <div><dt>Số tiền đã thanh toán</dt><dd>${amount}</dd></div>
            <div><dt>Phương thức</dt><dd>Chuyển khoản ngân hàng</dd></div>
            <div><dt>Trạng thái thanh toán</dt><dd class="payment-receipt-paid">Đã thanh toán</dd></div>
          </dl>
          <p>Đơn hàng của bạn đang được xử lý.</p>
          <div class="payment-receipt-actions">
            <button type="button" class="payment-action-primary" data-payment-action="orders">Xem đơn hàng</button>
            <button type="button" class="payment-action-secondary" data-payment-action="close">Tiếp tục mua sắm</button>
          </div>
        </section>
      `;
    }

    if (closeButton) {
      closeButton.hidden = true;
    }
    title?.focus();
    const dialog = modal.querySelector('.success-dialog');
    if (dialog) dialog.scrollTop = 0;
  },

  async checkTransferPayment() {
    const order = this.activeTransferOrder;
    if (!order) return;

    const actionButton = document.querySelector('#success-order-box [data-payment-action="check"]');
    const originalText = actionButton?.textContent;
    if (actionButton) {
      actionButton.disabled = true;
      actionButton.textContent = 'Đang kiểm tra...';
    }

    try {
      const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(order.id)}`, {
        headers: { Authorization: `Bearer ${Auth.getToken()}` },
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Không kiểm tra được trạng thái thanh toán.');

      this.setTransferPaymentStage(json.data.TrangThaiThanhToan === 'Đã thanh toán' ? 'paid' : 'pending');
    } catch (error) {
      showToast(error.message || 'Lỗi kiểm tra trạng thái thanh toán.');
    } finally {
      if (actionButton?.isConnected) {
        actionButton.disabled = false;
        actionButton.textContent = originalText;
      }
    }
  },

  async showMyOrdersModal() {
    const token = Auth.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        const orders = json.data;
        if (orders.length === 0) {
          showToast('Bạn chưa có đơn hàng nào');
          return;
        }

        document.getElementById('my-orders-list').innerHTML = orders.map((order) => `
          <article class="order-receipt-card" data-order-card="${order.MaDH}">
            <div class="order-card-top"><span class="order-id">Đơn #DH-${order.MaDH}</span><span class="order-status-badge ${order.TT_GiaoHang === 'Đã giao' ? 'status-completed' : 'status-pending'}">${escapeHTML(order.TT_GiaoHang)}</span></div>
            <div class="order-meta-info">${new Date(order.ThoiGianDat).toLocaleDateString('vi-VN')} · ${Number(order.TongLoaiSanPham)} loại bánh · ${escapeHTML(order.HT_ThanhToan || '')}</div>
            <div class="order-card-bottom"><strong class="order-total-price">${fmt(order.TongTien)}</strong><button type="button" class="btn-order-details" data-order-id="${order.MaDH}">Xem chi tiết</button></div>
          </article>`).join('');
        document.getElementById('my-orders-modal')?.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    } catch (e) {
      showToast('Lỗi tải lịch sử đơn hàng');
    }
  },

  async showOrderDetails(orderId) {
    try {
      const card = document.querySelector(`[data-order-card="${CSS.escape(String(orderId))}"]`);
      const existing = card?.querySelector('.order-detail-panel');
      if (existing) {
        existing.remove();
        return;
      }
      const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${Auth.getToken()}` },
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Không tải được chi tiết đơn hàng');
      const order = json.data;
      const panel = document.createElement('div');
      panel.className = 'order-detail-panel';
      panel.innerHTML = `
        <p><strong>Người nhận:</strong> ${escapeHTML(order.NguoiNhan)} · ${escapeHTML(order.SoDT)}</p>
        <p><strong>Giao đến:</strong> ${escapeHTML(order.DiaChi)}</p>
        <ul>${(order.sanPham || []).map((item) => `<li>${escapeHTML(item.TenSP)} × ${Number(item.SoLuong)} <strong>${fmt(item.ThanhTien)}</strong></li>`).join('')}</ul>
        <p><strong>Thanh toán:</strong> ${escapeHTML(order.TrangThaiThanhToan || order.HT_ThanhToan || 'Đang cập nhật')}</p>`;
      card?.appendChild(panel);
    } catch (error) {
      showToast(error.message || 'Lỗi tải chi tiết đơn hàng');
    }
  },
};

/* ============================================================
   5. CÁC HIỆU ỨNG GIAO DIỆN KHÁC (SLIDER, DRAWER, HEADER)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const pageParams = new URLSearchParams(window.location.search);
  // Khởi tạo các module
  Auth.updateUI();
  AuthModal.init();
  Products.init();
  Orders.init();
  Cart.updateUI();
  const cartSync = Auth.getToken() ? Cart.syncGuestCartToDB(true) : Promise.resolve();

  // ---- Header Scroll Shadow ----
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 40);
    const fabTop = document.getElementById('fab-top');
    if (fabTop) fabTop.style.opacity = window.scrollY > 300 ? '1' : '0';
  });

  // ---- Search Overlay Toggle ----
  const searchBtn = document.getElementById('search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchClose = document.getElementById('search-close');
  const searchInput = document.getElementById('search-input');

  searchBtn?.addEventListener('click', () => {
    const open = !searchOverlay?.classList.contains('open');
    searchOverlay?.classList.toggle('open', open);
    searchBtn?.setAttribute('aria-expanded', String(open));
    if (open) searchInput?.focus();
  });
  searchClose?.addEventListener('click', () => {
    searchOverlay?.classList.remove('open');
    searchBtn?.setAttribute('aria-expanded', 'false');
    document.getElementById('search-results-box')?.classList.remove('show');
    searchBtn?.focus();
  });

  // ---- Mobile Drawer ----
  const hamburger = document.getElementById('hamburger');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerClose = document.getElementById('drawer-close');
  const drawerProductsToggle = document.getElementById('drawer-products-toggle');
  const drawerProductsSubnav = document.getElementById('drawer-products-subnav');
  const desktopProductsMenu = document.querySelector('.nav-has-dropdown');
  const desktopProductsLink = document.getElementById('menu-products-link');
  const desktopProductsToggle = document.getElementById('menu-products-toggle');
  const newsMenu = document.querySelector('.nav-news-menu');
  const newsToggle = document.getElementById('menu-news-toggle');

  function openDrawer() {
    mobileDrawer?.classList.add('open');
    if (mobileDrawer) {
      mobileDrawer.inert = false;
      mobileDrawer.setAttribute('aria-hidden', 'false');
    }
    drawerOverlay?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    hamburger?.setAttribute('aria-label', 'Đóng menu di động');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(restoreFocus = false) {
    mobileDrawer?.classList.remove('open');
    if (mobileDrawer) {
      mobileDrawer.inert = true;
      mobileDrawer.setAttribute('aria-hidden', 'true');
    }
    drawerOverlay?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    hamburger?.setAttribute('aria-label', 'Mở menu di động');
    document.body.style.overflow = '';
    if (restoreFocus) hamburger?.focus();
  }

  hamburger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', () => closeDrawer(true));
  drawerOverlay?.addEventListener('click', () => closeDrawer(true));
  drawerProductsToggle?.addEventListener('click', () => {
    const expanded = drawerProductsToggle.getAttribute('aria-expanded') === 'true';
    drawerProductsToggle.setAttribute('aria-expanded', String(!expanded));
    drawerProductsSubnav?.classList.toggle('is-open', !expanded);
  });
  mobileDrawer?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeDrawer();
  });

  function setDesktopMenuOpen(isOpen) {
    clearTimeout(desktopMenuCloseTimer);
    desktopProductsMenu?.classList.toggle('is-open', isOpen);
    desktopProductsToggle?.setAttribute('aria-expanded', String(isOpen));
  }
  let desktopMenuCloseTimer;
  desktopProductsMenu?.addEventListener('pointerenter', () => setDesktopMenuOpen(true));
  desktopProductsMenu?.addEventListener('pointerleave', () => {
    desktopMenuCloseTimer = setTimeout(() => setDesktopMenuOpen(false), 240);
  });
  desktopProductsToggle?.addEventListener('click', () => {
    setDesktopMenuOpen(desktopProductsToggle.getAttribute('aria-expanded') !== 'true');
  });
  desktopProductsToggle?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setDesktopMenuOpen(true);
      desktopProductsMenu?.querySelector('a')?.focus();
    }
  });
  let newsMenuCloseTimer;
  function setNewsMenuOpen(isOpen) {
    clearTimeout(newsMenuCloseTimer);
    newsMenu?.classList.toggle('is-open', isOpen);
    newsToggle?.setAttribute('aria-expanded', String(isOpen));
  }
  newsMenu?.addEventListener('pointerenter', () => setNewsMenuOpen(true));
  newsMenu?.addEventListener('pointerleave', () => {
    newsMenuCloseTimer = setTimeout(() => setNewsMenuOpen(false), 180);
  });
  newsToggle?.addEventListener('click', () => {
    setNewsMenuOpen(newsToggle.getAttribute('aria-expanded') !== 'true');
  });
  newsToggle?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setNewsMenuOpen(true);
      newsMenu?.querySelector('.nav-news-dropdown a')?.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (desktopProductsMenu && !desktopProductsMenu.contains(event.target)) {
      setDesktopMenuOpen(false);
    }
    if (newsMenu && !newsMenu.contains(event.target)) setNewsMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const wasOpen = desktopProductsToggle?.getAttribute('aria-expanded') === 'true';
      const newsWasOpen = newsToggle?.getAttribute('aria-expanded') === 'true';
      const drawerWasOpen = mobileDrawer?.classList.contains('open');
      setDesktopMenuOpen(false);
      setNewsMenuOpen(false);
      if (wasOpen) desktopProductsToggle?.focus();
      else if (newsWasOpen) newsToggle?.focus();
      closeDrawer(Boolean(drawerWasOpen));
      searchOverlay?.classList.remove('open');
      searchBtn?.setAttribute('aria-expanded', 'false');
      document.getElementById('search-results-box')?.classList.remove('show');
    }
  });

  const trackedSections = ['about', 'hero', 'products', 'seasonal', 'stores', 'news', 'footer']
    .map((id) => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window && trackedSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeId = entry.target.id;
        document.querySelectorAll('.nav-link[href^="#"], .drawer-nav > a[href^="#"]').forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
        });
        desktopProductsLink?.classList.toggle('active', activeId === 'products');
        document.querySelector('.nav-news-menu .nav-link')?.classList.toggle('active', activeId === 'news');
        document.querySelector('.nav-list > li > a[href="pages/contact.html"]')?.classList.toggle('active', activeId === 'stores');
      });
    }, { rootMargin: '-24% 0px -66% 0px', threshold: 0 });
    trackedSections.forEach((section) => sectionObserver.observe(section));
  }

  // ---- Hero Slider ----
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  let sliderTimer;

  function goToSlide(idx) {
    if (!slides.length) return;
    slides[currentSlide].classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (idx + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide]?.classList.add('active');
  }

  function changeSlide(dir) {
    goToSlide(currentSlide + dir);
    resetTimer();
  }

  function resetTimer() {
    clearInterval(sliderTimer);
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    sliderTimer = setInterval(() => changeSlide(1), 5000);
  }

  document.addEventListener('visibilitychange', resetTimer);

  document.getElementById('slide-prev')?.addEventListener('click', () => changeSlide(-1));
  document.getElementById('slide-next')?.addEventListener('click', () => changeSlide(1));
  dots.forEach(dot => dot.addEventListener('click', () => { goToSlide(+dot.dataset.idx); resetTimer(); }));
  resetTimer();

  // ---- Scroll-to-top FAB ----
  const fabTop = document.getElementById('fab-top');
  if (fabTop) {
    fabTop.style.opacity = '0';
    fabTop.style.transition = 'opacity .3s';
    fabTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ---- Cart Sidebar Toggle ----
  document.getElementById('cart-btn')?.addEventListener('click', () => { window.location.href = 'pages/cart.html'; });
  document.getElementById('cart-close')?.addEventListener('click', () => Cart.closeSidebar());
  document.getElementById('cart-overlay')?.addEventListener('click', () => Cart.closeSidebar());

  // ---- Add to Cart Global Event Delegation ----
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-cart');
    if (btn) {
      const { id, name, price } = btn.dataset;
      const card = btn.closest('.product-card, .category-product-card, .category-product');
      const image = card?.querySelector('img')?.src || btn.parentElement?.querySelector('img')?.src || '';
      Cart.add(id, name, price, image);
    }
  }, true);

  // ---- Newsletter Form ----
  document.getElementById('newsletter-btn')?.addEventListener('click', () => {
    const email = document.getElementById('newsletter-email')?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Vui lòng nhập email hợp lệ!');
      return;
    }
    showToast('Đăng ký thành công! Cảm ơn bạn 💚');
    document.getElementById('newsletter-email').value = '';
  });

  if (pageParams.get('auth') === 'login') {
    window.location.replace('pages/login.html');
    return;
  }
  if (pageParams.get('auth') === 'register') {
    window.location.replace('pages/register.html');
    return;
  }
  if (pageParams.get('cart') === '1') {
    cartSync.finally(() => {
      if (pageParams.get('checkout') === '1' && cart.length) {
        const user = Auth.getUser();
        if (user) Orders.openCheckoutModal(user);
        else {
          showLoginRequiredNotice();
          Cart.openSidebar();
        }
        return;
      }
      Cart.openSidebar();
    });
  }
});
