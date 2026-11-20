const CART_API_BASE = '/api';
const CART_API_ORIGIN = window.location.origin;
const CART_STORAGE_KEY = 'banhfg_cart';
const CART_PREFERENCES_KEY = 'fg_cart_checkout_preferences';
const CART_FALLBACK_IMAGE = '../assets/banner_banh_kem.jpg';
const cartPageRoot = document.getElementById('cart-page-root');

function escapeCartHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
}

function getCartStorageKey() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('fg_user') || 'null'); }
  catch { user = null; }
  const customerId = localStorage.getItem('fg_token') ? user?.maKhachHang : null;
  return customerId == null ? `${CART_STORAGE_KEY}_guest` : `${CART_STORAGE_KEY}_user_${customerId}`;
}

function readCartItems() {
  try {
    const rows = JSON.parse(localStorage.getItem(getCartStorageKey()) || '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter((item) => item && typeof item === 'object').map((item) => ({
      ...item,
      id: item.id ?? item.MaSP,
      name: item.name || item.TenSP || 'Bánh Fresh Garden',
      price: Number(item.price ?? item.DonGia) || 0,
      qty: Math.max(0, Math.floor(Number(item.qty ?? item.SoLuong) || 0)),
    })).filter((item) => item.id != null && item.qty > 0);
  } catch {
    return [];
  }
}

function saveCartItems(items) {
  localStorage.setItem(getCartStorageKey(), JSON.stringify(items));
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartBadge(items);
}

function updateCartBadge(items = readCartItems()) {
  const badge = document.getElementById('page-cart-count');
  if (badge) badge.textContent = String(items.reduce((sum, item) => sum + item.qty, 0));
}

function readCartPreferences() {
  try { return JSON.parse(localStorage.getItem(CART_PREFERENCES_KEY) || '{}'); }
  catch { return {}; }
}

function localDateValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function cartImageUrl(value, index = 0) {
  const path = String(value || '').trim();
  if (!path || path.startsWith('/images/demo/')) return CART_FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(path)) return path;
  if (/^(\.\.\/)?assets\//i.test(path)) return path.startsWith('../') ? path : `../${path}`;
  if (path.startsWith('/')) return `${CART_API_ORIGIN}${path}`;
  return `${CART_API_ORIGIN}/${path.replace(/^\/+/, '')}`;
}

function formatCartPrice(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}₫`;
}

async function syncAccountCartFromServer() {
  const token = localStorage.getItem('fg_token');
  if (!token) return;
  const storageKey = getCartStorageKey();

  try {
    const response = await fetch(`${CART_API_BASE}/cart`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'Không tải được giỏ hàng');
    if (localStorage.getItem('fg_token') !== token || getCartStorageKey() !== storageKey) return;

    const items = (json.data.items || []).map((item) => ({
      id: item.MaSP,
      name: item.TenSP,
      price: Number(item.DonGia),
      qty: Number(item.SoLuong),
      image: item.HinhAnh || '',
      weight: item.KichThuoc || '',
      unit: item.DonViTinh || '',
    }));
    saveCartItems(items);
    renderCartPage();
  } catch (error) {
    console.warn('[cart] Không tải được giỏ hàng của tài khoản:', error.message);
  }
}

function renderCartPage() {
  if (!cartPageRoot) return;
  const items = readCartItems();
  const prefs = readCartPreferences();
  updateCartBadge(items);
  cartPageRoot.setAttribute('aria-busy', 'false');

  if (!items.length) {
    localStorage.removeItem(CART_PREFERENCES_KEY);
    cartPageRoot.innerHTML = `
      <section class="cart-empty-card" aria-labelledby="cart-empty-title">
        <h1 id="cart-empty-title">Giỏ hàng của bạn đang trống</h1>
        <a class="cart-continue-primary" href="products.html">Tiếp tục mua hàng</a>
      </section>`;
    return;
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const today = localDateValue();
  const deliveryDate = prefs.deliveryDate && prefs.deliveryDate >= today ? prefs.deliveryDate : today;
  const deliverySlot = prefs.deliverySlot || 'Càng sớm càng tốt';
  const itemMarkup = items.map((item) => {
    const productHref = `product.html?id=${encodeURIComponent(item.id)}`;
    const image = escapeCartHtml(cartImageUrl(item.image, Number(item.id) || 0));
    const weight = item.weight || item.KhoiLuong;
    const unit = item.unit || item.DonViTinh;
    return `
      <article class="cart-item-row" data-cart-line="${escapeCartHtml(item.id)}">
        <button type="button" class="cart-item-remove" data-cart-remove="${escapeCartHtml(item.id)}" aria-label="Xóa ${escapeCartHtml(item.name)} khỏi giỏ">×</button>
        <a class="cart-product-image" href="${productHref}" aria-label="Xem ${escapeCartHtml(item.name)}">
          <img src="${image}" alt="${escapeCartHtml(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='../assets/banner_banh_kem.jpg'" />
        </a>
        <div class="cart-product-copy">
          <a class="cart-product-name" href="${productHref}">${escapeCartHtml(item.name)}</a>
          <div class="cart-product-meta">
            <span>Mã SP: ${escapeCartHtml(item.id)}</span>
            <span>${weight ? `Nhóm: ${escapeCartHtml(weight)}${unit === 'g' ? 'g' : ''}` : (unit ? `Đơn vị: ${escapeCartHtml(unit)}` : 'Bánh tươi mỗi ngày')}</span>
          </div>
        </div>
        <span class="cart-unit-price"><span class="cart-mobile-label">Đơn giá&nbsp;</span>${formatCartPrice(item.price)}</span>
        <div class="cart-quantity" aria-label="Số lượng ${escapeCartHtml(item.name)}">
          <button type="button" data-cart-step="-1" data-cart-id="${escapeCartHtml(item.id)}" aria-label="Giảm số lượng">−</button>
          <output>${item.qty}</output>
          <button type="button" data-cart-step="1" data-cart-id="${escapeCartHtml(item.id)}" aria-label="Tăng số lượng">+</button>
        </div>
        <strong class="cart-line-total"><span class="cart-mobile-label">Thành tiền&nbsp;</span>${formatCartPrice(item.price * item.qty)}</strong>
      </article>`;
  }).join('');

  cartPageRoot.innerHTML = `
    <div class="cart-page-layout">
      <section class="cart-items-panel" aria-label="Sản phẩm trong giỏ hàng">
        <div class="cart-table-head" aria-hidden="true">
          <span class="cart-head-product">Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Thành tiền</span>
        </div>
        <div class="cart-item-list">${itemMarkup}</div>
        <div class="cart-continue-row"><a class="cart-continue-link" href="products.html">Tiếp tục mua sắm</a></div>
        <label class="cart-order-note" for="cart-order-note-input">
          <span>Ghi chú đơn hàng</span>
          <textarea id="cart-order-note-input" maxlength="500" placeholder="Ghi chú thêm cho đơn hàng…">${escapeCartHtml(prefs.notes || '')}</textarea>
        </label>
      </section>

      <aside class="cart-summary-panel" aria-labelledby="cart-summary-heading">
        <h2 class="cart-summary-title" id="cart-summary-heading">Hẹn giờ nhận hàng</h2>
        <label class="cart-summary-field" for="cart-delivery-date">
          <span>Ngày nhận hàng</span>
          <input id="cart-delivery-date" type="date" min="${today}" value="${escapeCartHtml(deliveryDate)}" />
        </label>
        <label class="cart-summary-field" for="cart-delivery-slot">
          <span>Thời gian nhận hàng</span>
          <select id="cart-delivery-slot">
            ${['Càng sớm càng tốt', '08:00 – 10:00', '10:00 – 12:00', '12:00 – 14:00', '14:00 – 17:00', '17:00 – 20:00'].map((slot) => `<option value="${slot}" ${deliverySlot === slot ? 'selected' : ''}>${slot}</option>`).join('')}
          </select>
        </label>
        <label class="cart-invoice-toggle" for="cart-invoice-check">
          <input id="cart-invoice-check" type="checkbox" ${prefs.invoice ? 'checked' : ''} />
          <span>Xuất hóa đơn công ty</span>
        </label>
        <div class="cart-invoice-fields" id="cart-invoice-fields" ${prefs.invoice ? '' : 'hidden'}>
          <input id="cart-invoice-name" type="text" maxlength="120" placeholder="Tên công ty" value="${escapeCartHtml(prefs.companyName || '')}" />
          <input id="cart-invoice-tax" type="text" maxlength="30" placeholder="Mã số thuế" value="${escapeCartHtml(prefs.taxCode || '')}" />
        </div>
        <div class="cart-summary-total"><span>Thành tiền</span><strong>${formatCartPrice(subtotal)}</strong></div>
        <p class="cart-vat-note">(Đã bao gồm VAT nếu có)</p>
        <button type="button" class="cart-checkout-button" data-cart-checkout>Thanh toán</button>
        <p class="cart-checkout-help">Thông tin giao hàng và phương thức thanh toán sẽ được xác nhận ở bước tiếp theo.</p>
      </aside>
    </div>`;
}

function saveCartPreferencesFromForm() {
  if (!cartPageRoot) return;
  const previous = readCartPreferences();
  const next = {
    ...previous,
    deliveryDate: cartPageRoot.querySelector('#cart-delivery-date')?.value || localDateValue(),
    deliverySlot: cartPageRoot.querySelector('#cart-delivery-slot')?.value || 'Càng sớm càng tốt',
    invoice: Boolean(cartPageRoot.querySelector('#cart-invoice-check')?.checked),
    companyName: cartPageRoot.querySelector('#cart-invoice-name')?.value.trim() || '',
    taxCode: cartPageRoot.querySelector('#cart-invoice-tax')?.value.trim() || '',
    notes: cartPageRoot.querySelector('#cart-order-note-input')?.value.trim() || '',
  };
  localStorage.setItem(CART_PREFERENCES_KEY, JSON.stringify(next));
  cartPageRoot.querySelector('#cart-invoice-fields')?.toggleAttribute('hidden', !next.invoice);
}

async function syncCartQuantity(id, quantity) {
  const token = localStorage.getItem('fg_token');
  if (!token) return;
  const remove = quantity <= 0;
  try {
    const response = await fetch(`${CART_API_BASE}/cart/items/${encodeURIComponent(id)}`, {
      method: remove ? 'DELETE' : 'PUT',
      headers: {
        ...(remove ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
      },
      ...(remove ? {} : { body: JSON.stringify({ soLuong: quantity }) }),
    });
    if (!response.ok) console.warn('[cart] Chưa đồng bộ được thay đổi giỏ hàng.');
  } catch (error) {
    console.warn('[cart] Chưa đồng bộ được thay đổi giỏ hàng:', error.message);
  }
}

async function hydrateLegacyCartImages() {
  const initialItems = readCartItems().filter((item) => !item.image);
  if (!initialItems.length) return;

  await Promise.all(initialItems.map(async (item) => {
    try {
      const response = await fetch(`${CART_API_BASE}/products/${encodeURIComponent(item.id)}`);
      const json = await response.json();
      const product = json.success ? json.data : null;
      const source = product?.HinhAnh || product?.hinhAnh?.[0];
      if (!source) return;
      const current = readCartItems();
      const target = current.find((row) => String(row.id) === String(item.id));
      if (!target || target.image) return;
      target.image = cartImageUrl(source, Number(item.id) || 0);
      target.weight = product.KhoiLuong || target.weight;
      target.unit = product.DonViTinh || target.unit;
      saveCartItems(current);
    } catch { /* The local cart remains usable when the API is unavailable. */ }
  }));

  renderCartPage();
}

if (cartPageRoot) {
  renderCartPage();

  cartPageRoot.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-cart-remove]');
    if (removeButton) {
      const id = removeButton.dataset.cartRemove;
      const next = readCartItems().filter((item) => String(item.id) !== String(id));
      saveCartItems(next);
      renderCartPage();
      void syncCartQuantity(id, 0);
      return;
    }

    const stepButton = event.target.closest('[data-cart-step]');
    if (stepButton) {
      const id = stepButton.dataset.cartId;
      const delta = Number(stepButton.dataset.cartStep) || 0;
      const items = readCartItems();
      const item = items.find((row) => String(row.id) === String(id));
      if (!item || !delta) return;
      item.qty = Math.max(0, Math.min(99, item.qty + delta));
      const quantity = item.qty;
      const next = items.filter((row) => row.qty > 0);
      saveCartItems(next);
      renderCartPage();
      void syncCartQuantity(id, quantity);
      return;
    }

    if (event.target.closest('[data-cart-checkout]')) {
      saveCartPreferencesFromForm();
      if (readCartItems().length) location.href = '../index.html?cart=1&checkout=1';
    }
  });

  cartPageRoot.addEventListener('input', saveCartPreferencesFromForm);
  cartPageRoot.addEventListener('change', saveCartPreferencesFromForm);
  void hydrateLegacyCartImages();
  void syncAccountCartFromServer();
}
