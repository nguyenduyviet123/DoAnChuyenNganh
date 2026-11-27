const CART_API_BASE = '/api';
const CART_API_ORIGIN = window.location.origin;
const CART_STORAGE_KEY = 'banhfg_cart';
const CART_PREFERENCES_KEY = 'fg_cart_checkout_preferences';
const CART_FALLBACK_IMAGE = '../assets/banner_banh_kem.jpg';
const cartPageRoot = document.getElementById('cart-page-root');
const cartStockCache = new Map();
const cartStockCheckTimers = new Map();
let cartInventoryCheckSequence = 0;
let cartAccessoriesPromise = null;

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

async function getCartAccessories() {
  if (cartAccessoriesPromise) return cartAccessoriesPromise;
  cartAccessoriesPromise = fetch(`${CART_API_BASE}/products?maLoai=18&limit=20`)
    .then(async (response) => {
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Không tải được phụ kiện');
      return (json.data.products || []).filter((product) => Number(product.TongTon) > 0);
    })
    .catch((error) => {
      cartAccessoriesPromise = null;
      throw error;
    });
  return cartAccessoriesPromise;
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
          <span class="cart-stock-badge" hidden>Hết hàng</span>
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
          <input class="cart-quantity-input" type="number" min="1" step="1" value="${item.qty}" data-cart-quantity="${escapeCartHtml(item.id)}" aria-label="Số lượng ${escapeCartHtml(item.name)}">
          <button type="button" data-cart-step="1" data-cart-id="${escapeCartHtml(item.id)}" aria-label="Tăng số lượng">+</button>
        </div>
        <p class="cart-stock-error" role="status" aria-live="polite" hidden></p>
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
        <section class="cart-accessories" aria-labelledby="cart-accessories-heading">
          <h2 id="cart-accessories-heading">Phụ kiện gợi ý</h2>
          <div class="cart-accessories-list" id="cart-accessories-list"><p class="cart-accessories-loading">Đang tải phụ kiện…</p></div>
        </section>
        <p class="cart-inventory-status" id="cart-inventory-status" role="status" aria-live="polite">Đang kiểm tra tồn kho…</p>
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
        <button type="button" class="cart-checkout-button" data-cart-checkout disabled>Thanh toán</button>
        <p class="cart-checkout-help">Thông tin giao hàng và phương thức thanh toán sẽ được xác nhận ở bước tiếp theo.</p>
      </aside>
    </div>`;
  void refreshCartInventory();
  void hydrateCartAccessories();
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
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, message: result.message || 'Chưa đồng bộ được thay đổi giỏ hàng.' };
    return { ok: true };
  } catch (error) {
    console.warn('[cart] Chưa đồng bộ được thay đổi giỏ hàng:', error.message);
    return { ok: false, message: 'Chưa đồng bộ được thay đổi giỏ hàng. Vui lòng thử lại.' };
  }
}

async function syncCartAccessoryAdd(id, quantity) {
  const token = localStorage.getItem('fg_token');
  if (!token) return { ok: true };
  try {
    const response = await fetch(`${CART_API_BASE}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ maSP: id, soLuong: quantity }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      return { ok: false, message: result.message || 'Chưa thêm được phụ kiện vào giỏ.' };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message || 'Chưa thêm được phụ kiện vào giỏ.' };
  }
}

async function getCartProductStock(id, refresh = false) {
  const cached = cartStockCache.get(String(id));
  if (!refresh && cached && cached.expiresAt > Date.now()) return cached.promise;
  const promise = fetch(`${CART_API_BASE}/products/${encodeURIComponent(id)}`)
    .then(async (response) => {
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Không kiểm tra được tồn kho.');
      return (json.data.tonKhoCuaHang || []).reduce((sum, store) => sum + Math.max(0, Number(store.SoLuongCo) || 0), 0);
    });
  cartStockCache.set(String(id), { promise, expiresAt: Date.now() + 15000 });
  try { return await promise; }
  catch (error) { cartStockCache.delete(String(id)); throw error; }
}

async function refreshCartInventory() {
  const items = readCartItems();
  if (!items.length) return true;
  const sequence = ++cartInventoryCheckSequence;
  const button = cartPageRoot.querySelector('[data-cart-checkout]');
  const status = cartPageRoot.querySelector('#cart-inventory-status');
  if (button) { button.disabled = true; button.textContent = 'Đang kiểm tra kho…'; }
  if (status) { status.hidden = false; status.textContent = 'Đang kiểm tra tồn kho…'; status.classList.remove('has-error'); }
  try {
    const results = await Promise.all(items.map(async (item) => ({ item, stock: await getCartProductStock(item.id, true) })));
    if (sequence !== cartInventoryCheckSequence) return false;
    let soldOutCount = 0;
    let overStockCount = 0;
    for (const { item, stock } of results) {
      const row = [...cartPageRoot.querySelectorAll('[data-cart-line]')].find((element) => element.dataset.cartLine === String(item.id));
      if (!row) continue;
      const soldOut = stock <= 0;
      const overStock = !soldOut && Number(item.qty) > stock;
      const badge = row.querySelector('.cart-stock-badge');
      const message = row.querySelector('.cart-stock-error');
      row.classList.toggle('is-out-of-stock', soldOut);
      if (badge) badge.hidden = !soldOut;
      row.querySelectorAll('[data-cart-step], [data-cart-quantity]').forEach((control) => { control.disabled = soldOut; });
      if (message) {
        message.textContent = overStock ? `Bánh không đủ số lượng. Hiện còn ${stock} cái` : '';
        message.hidden = !overStock;
      }
      if (soldOut) soldOutCount += 1;
      if (overStock) overStockCount += 1;
    }
    const currentItems = readCartItems();
    const hasPendingQuantity = [...cartPageRoot.querySelectorAll('[data-cart-quantity]')].some((input) => {
      const item = currentItems.find((entry) => String(entry.id) === String(input.dataset.cartQuantity));
      return !item || Number(input.value) !== Number(item.qty);
    });
    const blocked = soldOutCount + overStockCount > 0 || hasPendingQuantity;
    if (button) { button.disabled = blocked; button.textContent = 'Thanh toán'; }
    if (status) {
      status.hidden = !blocked;
      if (soldOutCount) status.textContent = `${soldOutCount} sản phẩm hết hàng. Xóa sản phẩm hết hàng để tiếp tục thanh toán.`;
      else if (overStockCount) status.textContent = `${overStockCount} sản phẩm vượt tồn kho. Vui lòng giảm số lượng để tiếp tục.`;
      else if (hasPendingQuantity) status.textContent = 'Hoàn tất cập nhật số lượng trước khi thanh toán.';
    }
    return !blocked;
  } catch (error) {
    if (sequence !== cartInventoryCheckSequence) return false;
    if (button) { button.disabled = false; button.textContent = 'Thử lại kiểm tra kho'; }
    if (status) {
      status.hidden = false;
      status.classList.add('has-error');
      status.textContent = error.message || 'Không kiểm tra được tồn kho. Vui lòng thử lại.';
    }
    return false;
  }
}

function scheduleCartStockCheck(input) {
  const id = input.dataset.cartQuantity;
  const row = input.closest('.cart-item-row');
  const message = row?.querySelector('.cart-stock-error');
  clearTimeout(cartStockCheckTimers.get(String(id)));
  if (!input.value) {
    if (message) { message.hidden = true; message.textContent = ''; }
    return;
  }
  const timer = setTimeout(async () => {
    const requested = Number(input.value);
    const item = readCartItems().find((entry) => String(entry.id) === String(id));
    if (!item || !Number.isSafeInteger(requested) || requested < 1) return;
    try {
      const stock = await getCartProductStock(id);
      if (!input.isConnected || !message?.isConnected) return;
      const latestRequested = Number(input.value);
      if (Number.isSafeInteger(latestRequested) && latestRequested > stock && latestRequested >= item.qty) {
        message.textContent = `Bánh không đủ số lượng. Hiện còn ${stock} cái`;
        message.hidden = false;
      } else {
        message.textContent = '';
        message.hidden = true;
      }
    } catch (error) {
      if (input.isConnected && message) {
        message.textContent = error.message || 'Không kiểm tra được tồn kho. Vui lòng thử lại.';
        message.hidden = false;
      }
    }
  }, 180);
  cartStockCheckTimers.set(String(id), timer);
}

async function changeCartQuantity(id, quantity, control) {
  const row = control.closest('.cart-item-row');
  const message = row?.querySelector('.cart-stock-error');
  const items = readCartItems();
  const item = items.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  const requested = Number(quantity);
  if (!Number.isSafeInteger(requested) || requested < 1) {
    if (message) { message.textContent = 'Nhập số lượng là số nguyên từ 1 trở lên.'; message.hidden = false; }
    return;
  }
  row?.querySelectorAll('[data-cart-step], [data-cart-quantity]').forEach((element) => { element.disabled = true; });
  if (message) { message.hidden = true; message.textContent = ''; }
  try {
    const stock = await getCartProductStock(id, true);
    if (requested > stock && requested >= item.qty) {
      if (message) {
        message.textContent = `Bánh không đủ số lượng. Hiện còn ${stock} cái`;
        message.hidden = false;
      }
      return;
    }
    if (localStorage.getItem('fg_token')) {
      const sync = await syncCartQuantity(id, requested);
      if (!sync.ok) throw new Error(sync.message);
    }
    item.qty = requested;
    saveCartItems(items);
    renderCartPage();
  } catch (error) {
    if (message) {
      message.textContent = error.message || 'Không kiểm tra được tồn kho. Vui lòng thử lại.';
      message.hidden = false;
    }
  } finally {
    row?.querySelectorAll('[data-cart-step], [data-cart-quantity]').forEach((element) => { element.disabled = false; });
  }
}

async function hydrateCartAccessories() {
  const container = cartPageRoot?.querySelector('#cart-accessories-list');
  if (!container) return;
  try {
    const accessories = await getCartAccessories();
    if (!accessories.length) {
      container.innerHTML = '<p class="cart-accessories-empty">Chưa có phụ kiện đang còn hàng.</p>';
      return;
    }
    container.innerHTML = accessories.map((product) => {
      const id = Number(product.MaSP);
      const name = escapeCartHtml(product.TenSP);
      const image = escapeCartHtml(cartImageUrl(product.HinhAnh, id));
      const price = formatCartPrice(product.DonGia);
      return `
        <article class="cart-accessory-card">
          <a class="cart-accessory-image" href="product.html?id=${id}" aria-label="Xem ${name}">
            <img src="${image}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='../assets/banner_banh_kem.jpg'" />
          </a>
          <div class="cart-accessory-copy">
            <a class="cart-accessory-name" href="product.html?id=${id}">${name}</a>
            <strong class="cart-accessory-price">${price}</strong>
          </div>
          <button type="button" class="cart-accessory-add" data-cart-accessory-add="${id}" aria-label="Thêm ${name} vào giỏ">+</button>
        </article>`;
    }).join('');
  } catch (error) {
    container.innerHTML = `<p class="cart-accessories-empty">${escapeCartHtml(error.message || 'Không tải được phụ kiện.')}</p>`;
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

  cartPageRoot.addEventListener('click', async (event) => {
    const accessoryButton = event.target.closest('[data-cart-accessory-add]');
    if (accessoryButton) {
      const id = Number(accessoryButton.dataset.cartAccessoryAdd);
      const items = readCartItems();
      const existing = items.find((item) => Number(item.id) === id);
      const nextQty = existing ? existing.qty + 1 : 1;
      const stock = await getCartProductStock(id, true);
      if (nextQty > stock) {
        window.alert(`Phụ kiện này chỉ còn ${stock} cái.`);
        return;
      }
      let accessory = null;
      try {
        const accessories = await getCartAccessories();
        accessory = accessories.find((product) => Number(product.MaSP) === id);
      } catch {
        accessory = null;
      }
      if (!existing) {
        items.push({
          id,
          name: accessory?.TenSP || `Phụ kiện #${id}`,
          price: Number(accessory?.DonGia || 0),
          qty: 1,
          image: accessory?.HinhAnh || '',
          unit: accessory?.DonViTinh || 'cái',
        });
      } else {
        existing.qty = nextQty;
      }
      if (localStorage.getItem('fg_token')) {
        const sync = existing
          ? await syncCartQuantity(id, nextQty)
          : await syncCartAccessoryAdd(id, 1);
        if (!sync.ok) {
          window.alert(sync.message);
          return;
        }
      }
      saveCartItems(items);
      renderCartPage();
      void syncAccountCartFromServer();
      return;
    }

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
      const quantityInput = stepButton.closest('.cart-item-row')?.querySelector('[data-cart-quantity]');
      const currentValue = Number(quantityInput?.value || item.qty);
      void changeCartQuantity(id, Math.max(1, currentValue + delta), stepButton);
      return;
    }

    if (event.target.closest('[data-cart-checkout]')) {
      if (!localStorage.getItem('fg_token')) {
        window.alert('Vui lòng đăng nhập trước khi thanh toán');
        return;
      }
      saveCartPreferencesFromForm();
      if (readCartItems().length && await refreshCartInventory()) location.href = '../index.html?cart=1&checkout=1';
    }
  });

  cartPageRoot.addEventListener('input', (event) => {
    const quantityInput = event.target.closest('[data-cart-quantity]');
    if (quantityInput) scheduleCartStockCheck(quantityInput);
    saveCartPreferencesFromForm();
  });
  cartPageRoot.addEventListener('change', (event) => {
    const quantityInput = event.target.closest('[data-cart-quantity]');
    if (quantityInput) void changeCartQuantity(quantityInput.dataset.cartQuantity, quantityInput.value, quantityInput);
    saveCartPreferencesFromForm();
  });
  void hydrateLegacyCartImages();
  void syncAccountCartFromServer();
  window.addEventListener('focus', () => { void refreshCartInventory(); });
  window.setInterval(() => { if (!document.hidden) void refreshCartInventory(); }, 30000);
}
