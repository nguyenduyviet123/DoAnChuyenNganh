/**
 * ============================================================
 *  BÁNH FG – CHATBOT AI WIDGET
 *  File: chatbot.js
 *  Thiết kế UI & Kiến trúc sẵn sàng tích hợp API AI + Database SQL
 * ============================================================
 */

/* ============================================================
   1. CẤU HÌNH HỆ THỐNG & BACKEND API (DÀNH CHO LẬP TRÌNH VIÊN)
   ============================================================
   Backend truy vấn dữ liệu sản phẩm trong SQL và gọi dịch vụ AI.
   Frontend chỉ gửi nội dung câu hỏi; không gửi hồ sơ khách hàng hay lịch sử chat.
   Khách vãng lai không được lưu phiên vào SQL; tài khoản đã đăng nhập lưu ở backend.
   ============================================================ */
const CHATBOT_CONFIG = {
  // Đã bật Live API vì Backend Node.js & SQL Server đã chạy
  isLiveApi: true,

  // Endpoint API Backend (Node.js Express)
  apiUrl: '/api/chat',

  // Tên hiển thị của ChatBot
  botName: 'ChatBot AI - FreshGarden',

  // Độ trễ giả lập gõ chữ (ms) giúp tạo cảm giác tự nhiên khi ở chế độ Local Mock
  mockTypingDelay: 700,

};

function getChatbotMascotAvatar() {
  const sourceMascot = document.querySelector('#chatbot-toggle .chatbot-mascot');
  if (!sourceMascot) return '';

  const mascot = sourceMascot.cloneNode(true);
  mascot.classList.add('chatbot-avatar-mascot');
  mascot.setAttribute('aria-hidden', 'true');
  return mascot.outerHTML;
}

/* ============================================================
   2. DỮ LIỆU CÂU HỎI MẪU & CƠ SỞ TRI THỨC NỘI BỘ (FALLBACK KNOWLEDGE BASE)
   (Dùng khi chưa bật live API hoặc khi mất kết nối mạng)
   ============================================================ */
const FAQ_KNOWLEDGE_BASE = [
  {
    id: 'faq-menu',
    icon: '🍰',
    question: 'Fresh Garden có những loại bánh nào?',
    shortLabel: 'Các loại bánh',
    answer:
      'Fresh Garden hiện có đa dạng các dòng bánh tươi thơm ngon mỗi ngày:\n\n' +
      '• **Bánh sinh nhật & Bánh kem:** Mousse chanh leo, Tiramisu, Black Forest, Red Velvet, Bánh kem bắp, Bánh hoa quả tươi.\n' +
      '• **Bánh mì tươi:** Bánh mì gối ngũ cốc, Baguette Pháp, bánh mì hoa cúc, bánh mì bơ tỏi.\n' +
      '• **Bánh ngọt & Pastry:** Croissant bơ Pháp, Pain au Chocolat, bánh su kem, tart trứng.\n' +
      '• **Bánh khô & Cookies:** Cookies hạnh nhân, biscotti ăn kiêng, bánh quy bơ hạt.\n' +
      '• **Bánh Trung Thu 2026:** Các vị truyền thống và hiện đại thượng hạng.\n\n' +
      'Bạn có thể click nút **"Xem danh mục bánh"** bên dưới để khám phá chi tiết nhé! 🥐✨',
  },
  {
    id: 'faq-price',
    icon: '🎁',
    question: 'Bánh sinh nhật có giá bao nhiêu?',
    shortLabel: 'Giá bánh sinh nhật',
    answer:
      'Giá bánh sinh nhật tại Fresh Garden dao động tùy thuộc vào kích thước và loại cốt bánh:\n\n' +
      '• **Size nhỏ (14 - 16cm - 2-4 người):** 220.000đ – 320.000đ\n' +
      '• **Size vừa (18 - 20cm - 6-8 người):** 350.000đ – 450.000đ\n' +
      '• **Size lớn (22 - 26cm - 10-15 người):** 480.000đ – 680.000đ\n' +
      '• **Bánh thiết kế cao cấp theo yêu cầu:** từ 550.000đ\n\n' +
      '🎁 *Đặc biệt: Luôn tặng kèm bộ nến sinh nhật, dao cắt và đĩa thìa tiện lợi!*',
  },
  {
    id: 'faq-promo',
    icon: '🏷️',
    question: 'Cửa hàng có chương trình khuyến mãi nào?',
    shortLabel: 'Khuyến mãi hot',
    answer:
      'Hiện tại Fresh Garden đang có các ưu đãi cực hấp dẫn:\n\n' +
      '1. 🚚 **FREESHIP** toàn bộ đơn hàng từ **300.000đ** trong bán kính 7km.\n' +
      '2. 🎂 **Giảm 10%** cho bánh sinh nhật khi đặt trước ít nhất 24 giờ.\n' +
      '3. ☕ **Combo Giờ Vàng (14h - 17h):** Mua 1 bánh ngọt bất kỳ tặng 1 trà/cà phê thanh mát.\n' +
      '4. 🌟 **Ưu đãi thành viên:** Tích điểm hoàn tiền 5% cho mỗi đơn hàng.',
  },
  {
    id: 'faq-delivery',
    icon: '🚚',
    question: 'Thời gian giao hàng bao lâu?',
    shortLabel: 'Thời gian giao hàng',
    answer:
      'Chính sách giao hàng của Fresh Garden:\n\n' +
      '• **Giao hỏa tốc nội thành:** 30 – 60 phút đối với các loại bánh ngọt, bánh mì sẵn có tại cửa hàng gần bạn nhất.\n' +
      '• **Bánh sinh nhật theo yêu cầu:** Quý khách nên đặt trước 2 – 4 tiếng hoặc hẹn giờ giao chính xác trong ngày.\n' +
      '• Bánh được bảo quản trong hộp giữ nhiệt chuyên dụng đảm bảo đến tay luôn nguyên vẹn và tươi ngon!',
  },
  {
    id: 'faq-custom',
    icon: '⭐',
    question: 'Có hỗ trợ đặt bánh theo nhu cầu không?',
    shortLabel: 'Đặt bánh theo yêu cầu',
    answer:
      'Dạ **CÓ** ạ! Fresh Garden rất hân hạnh nhận làm bánh theo yêu cầu của bạn:\n\n' +
      '• Viết lời chúc, in ảnh ăn được (photo cake), tạo hình fondant, gắn phụ kiện sinh nhật.\n' +
      '• Tuỳ chọn độ ngọt, cốt bánh (vanilla, socola, trà xanh, bắp ngô).\n' +
      '• Đặt bánh tiệc cưới, hội nghị, sự kiện công ty với số lượng lớn có chiết khấu cao.\n\n' +
      '👉 Bạn vui lòng liên hệ Hotline **1900 2075** hoặc nhắn tin Zalo để chuyên viên gửi mẫu thiết kế riêng nhé!',
  },
];

/* ============================================================
   3. BỘ SUY LUẬN TỰ NHIÊN (LOCAL NLP ENGINE - MOCK AI)
   Xử lý khi khách tự gõ tin nhắn bất kỳ lúc chưa có Backend SQL
   ============================================================ */
function getLocalMockResponse(userText) {
  const text = userText.toLowerCase().trim();

  // Chào hỏi
  if (/(chào|hello|hi|alo|hé lô|hey|shop ơi|ad ơi)/.test(text)) {
    return 'Dạ Fresh Garden xin chào bạn! Mình là Trợ lý AI Fresh Garden. Mình có thể giúp bạn chọn bánh sinh nhật, xem menu bánh tươi hoặc kiểm tra khuyến mãi hôm nay ạ!';
  }

  // Bánh sinh nhật / kem
  if (/(sinh nhật|kem|sn|bánh kem|tiramisu|mousse|bắp|red velvet)/.test(text)) {
    return 'Dạ bên mình có rất nhiều mẫu **Bánh sinh nhật & Bánh kem tươi** được làm mới mỗi ngày (Mousse chanh leo, Tiramisu, Bánh bắp tươi thơm dịu, Red Velvet quyến rũ). Size 16cm từ 250.000đ, size 20cm từ 380.000đ. Bạn có muốn đặt trước để nhận ưu đãi giảm 10% không ạ? 🎂';
  }

  // Giá cả
  if (/(giá|bao nhiêu|nhiêu tiền|bảng giá|bán sao)/.test(text)) {
    return 'Dạ giá bánh tại Fresh Garden rất đa dạng và hợp lý ạ:\n• Bánh mì tươi & croissant: từ 18.000đ - 45.000đ\n• Bánh ngọt, tart, mousse lát: từ 32.000đ - 55.000đ\n• Bánh sinh nhật nguyên ổ: từ 220.000đ - 650.000đ.\nBạn đang quan tâm dòng bánh nào để mình báo giá chi tiết nhé!';
  }

  // Khuyến mãi / giảm giá / voucher
  if (/(khuyến mãi|sale|giảm giá|voucher|ưu đãi|freeship|miễn phí)/.test(text)) {
    return '🎁 Hôm nay Fresh Garden đang có ưu đãi:\n1. Freeship cho đơn từ 300.000đ\n2. Giảm 10% khi đặt bánh sinh nhật trước 24h\n3. Tặng nến thơm nghệ thuật & phụ kiện tiệc sinh nhật trọn bộ!';
  }

  // Giao hàng / ship
  if (/(ship|giao hàng|vận chuyển|nơi giao|địa chỉ giao|mấy tiếng)/.test(text)) {
    return '🚚 Cửa hàng nhận giao hàng tận nơi nội thành chỉ từ 30-60 phút. Bánh kem được đóng thùng xốp chuyên dụng đảm bảo lạnh và không bị xô lệch dáng bánh ạ!';
  }

  // Địa chỉ / cửa hàng
  if (/(địa chỉ|ở đâu|cửa hàng|chi nhánh|quận|hà nội)/.test(text)) {
    return 'Fresh Garden có hệ thống hơn 60 cửa hàng trải khắp các quận tại Hà Nội và các thành phố lớn. Bạn có thể ghé cửa hàng gần nhất hoặc đặt trực tiếp trên website để được ship tận nhà nhé!';
  }

  // Hotline / Liên hệ / người thật
  if (/(liên hệ|hotline|sđt|số điện thoại|tổng đài|gặp nhân viên|người thật)/.test(text)) {
    return 'Dạ bạn có thể gọi ngay Hotline miễn cước: **1900 2075** (8:00 - 21:30 hàng ngày), liên hệ bộ phận Doanh nghiệp qua **024 3856 3856** hoặc email: **cskh@freshgarden.vn** để được nhân viên hỗ trợ trực tiếp ngay nhé!';
  }

  // Teabreak / B2B / Sự kiện công ty
  if (/(teabreak|tiệc|hội nghị|hội thảo|doanh nghiệp|b2b|công ty|đặt số lượng lớn)/.test(text)) {
    return '☕ Fresh Garden cung cấp trọn gói **Dịch vụ tiệc Teabreak & Bánh sự kiện doanh nghiệp**:\n• Hơn 50 loại bánh ngọt & bánh mặn mini nướng mới mỗi sáng.\n• Đóng hộp set box sang trọng, giao bảo ôn tận nơi đúng giờ.\n• Chiết khấu hấp dẫn cho đơn hàng lớn và xuất hóa đơn VAT điện tử nhanh chóng.\n👉 Vui lòng liên hệ Hotline B2B: **024 3856 3856** hoặc gửi yêu cầu về **cskh@freshgarden.vn** để nhận báo giá chi tiết trong 30 phút ạ!';
  }

  // Viết chữ lên bánh / In ảnh / Phụ kiện
  if (/(viết chữ|lời chúc|ghi chữ|in ảnh|photo cake|nến|dao|phụ kiện)/.test(text)) {
    return '🎂 Dạ mọi đơn bánh kem tại Fresh Garden đều được **miễn phí viết lời chúc** lên mặt bánh hoặc bảng socola! Ngoài ra, cửa hàng luôn tặng kèm trọn bộ dao cắt bánh cao cấp, đĩa thìa giấy thân thiện môi trường và nến sinh nhật nghệ thuật ạ!';
  }

  // Giờ mở cửa
  if (/(giờ mở cửa|mở cửa|đóng cửa|mấy giờ)/.test(text)) {
    return 'Hệ thống Fresh Garden mở cửa đón khách từ **06:30 sáng đến 22:00 tối** tất cả các ngày trong tuần (kể cả Thứ Bảy, Chủ Nhật và ngày Lễ) bạn nhé!';
  }

  // Bánh Trung Thu
  if (/(trung thu|bánh dẻo|bánh nướng|hộp quà)/.test(text)) {
    return '🌕 Mùa Bánh Trung Thu 2026 đã sẵn sàng tại Fresh Garden với những vị nhân thượng hạng: Thập cẩm gà quay ngũ vị, Hạt sen trà xanh, Lava trứng chảy, Cốm non dừa tươi. Có xuất hóa đơn VAT và chiết khấu cao cho doanh nghiệp ạ!';
  }

  // Cảm ơn
  if (/(cảm ơn|thanks|thank you|ok|okie|tks)/.test(text)) {
    return 'Dạ không có chi ạ! Nếu cần thêm bất kỳ thông tin nào về các loại bánh ngon, bạn cứ nhắn mình nhé. Chúc bạn một ngày ngọt ngào và tràn đầy năng lượng! 🥐🍰';
  }

  // Mặc định
  return (
    'Cảm ơn câu hỏi của bạn! Với câu hỏi này, bạn có thể xem nhanh danh mục sản phẩm trên website hoặc để lại số điện thoại / gọi Hotline **1900 2075** để chuyên viên tư vấn hỗ trợ chi tiết nhất cho bạn nhé! ❤️'
  );
}

/* ============================================================
   4. CHATBOT UI & CONTROLLER LOGIC
   ============================================================ */
class FreshGardenChatbot {
  constructor() {
    this.history = [];
    this.isOpen = false;
    this.isBotTyping = false;
    this.sessionId = this.getOrCreateSessionId();
    this._isRestoringHistory = false;

    this.initElements();
    this.bindEvents();
    this.renderInitialUI();
    this.restoreServerHistory();
    window.addEventListener('fg-auth-change', () => {
      this.restoredToken = null;
      this.history = [];
      sessionStorage.removeItem('fg_chat_history');
      this.renderWelcomeScreen();
      if (localStorage.getItem('fg_token')) this.restoreServerHistory();
    });
  }

  getOrCreateSessionId() {
    let sid = sessionStorage.getItem('fg_chat_session_id');
    if (!sid) {
      sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      sessionStorage.setItem('fg_chat_session_id', sid);
    }
    return sid;
  }

  initElements() {
    this.toggleBtn = document.getElementById('chatbot-toggle');
    this.chatWindow = document.getElementById('chatbot-window');
    this.bodyEl = document.getElementById('chatbot-body');
    this.inputEl = document.getElementById('chatbot-input');
    this.sendBtn = document.getElementById('chatbot-send-btn');
    this.closeBtn = document.getElementById('chatbot-close-btn');
    this.minimizeBtn = document.getElementById('chatbot-minimize-btn');
    this.notifDot = document.getElementById('chatbot-notif-dot');
    this.statusBanner = document.getElementById('chatbot-status-banner');
    const headerAvatar = document.querySelector('.chatbot-avatar');
    if (headerAvatar) headerAvatar.innerHTML = getChatbotMascotAvatar();
  }

  bindEvents() {
    // Mở / Đóng khi bấm icon bong bóng
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleChat());
    }

    // Keep wheel scrolling inside the chat panel instead of chaining to the page.
    if (this.chatWindow) {
      this.chatWindow.addEventListener('wheel', (event) => {
        if (event.deltaY === 0) return;

        const scrollBody = event.target instanceof Element
          ? event.target.closest('.chatbot-body')
          : null;
        if (!scrollBody) {
          event.preventDefault();
          return;
        }

        const maxScroll = scrollBody.scrollHeight - scrollBody.clientHeight;
        const canScroll = event.deltaY < 0
          ? scrollBody.scrollTop > 0
          : scrollBody.scrollTop < maxScroll - 1;
        if (!canScroll) event.preventDefault();
      }, { passive: false });
    }

    // Đóng khi bấm nút X hoặc Minimize
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeChat());
    }
    if (this.minimizeBtn) {
      this.minimizeBtn.addEventListener('click', () => this.closeChat());
    }

    // Gửi tin nhắn
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleUserSubmit());
    }
    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserSubmit();
        }
      });
    }

    // Phím ESC đóng chat
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeChat();
      }
    });
  }

  renderInitialUI() {
    // Phiên của khách vãng lai không được trộn vào lịch sử tài khoản.
    if (localStorage.getItem('fg_token')) {
      this.history = [];
      sessionStorage.removeItem('fg_chat_history');
      this.renderWelcomeScreen();
      return;
    }

    // Đọc lịch sử nếu có trong phiên
    const saved = sessionStorage.getItem('fg_chat_history');
    if (saved) {
      try {
        this.history = JSON.parse(saved);
        this.renderHistory();
        return;
      } catch (e) {
        this.history = [];
      }
    }

    // Nếu chưa có tin nhắn, render màn hình chào mừng chuẩn như wireframe
    this.renderWelcomeScreen();
  }

  async restoreServerHistory() {
    const token = localStorage.getItem('fg_token');
    if (!token || token === this.restoredToken || this._isRestoringHistory) return;
    this._isRestoringHistory = true;
    try {
      const response = await fetch(CHATBOT_CONFIG.apiUrl.replace(/\/$/, '') + '/history', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const result = await response.json();
      const rows = result.data || [];
      this.restoredToken = token;
      if (!rows.length) return;
      this.history = rows.map((row) => ({
        sender: row.NguoiGui === 'Khách hàng' ? 'user' : 'bot',
        text: row.NoiDung,
        time: new Date(row.ThoiGianGui).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }));
      this.saveHistory();
      if (this.bodyEl) this.renderHistory();
    } catch (error) {
      console.warn('[chatbot] Không thể tải lịch sử chat đã lưu:', error.message);
    } finally {
      this._isRestoringHistory = false;
    }
  }

  renderWelcomeScreen() {
    const timeStr = this.getCurrentTime();

    // 1. Lời chào của Bot
    const welcomeHtml = `
      <div class="chatbot-msg bot" id="msg-welcome">
        <div class="chatbot-msg-avatar">
          ${getChatbotMascotAvatar()}
        </div>
        <div class="chatbot-msg-bubble">
          Xin chào 👋<br>Bạn cần hỗ trợ vấn đề gì?
          <span class="chatbot-msg-time">${timeStr}</span>
        </div>
      </div>
    `;

    // 2. Khung "Các câu hỏi thường gặp" theo đúng wireframe phác thảo
    let faqButtonsHtml = '';
    FAQ_KNOWLEDGE_BASE.forEach((faq) => {
      faqButtonsHtml += `
        <button class="chatbot-faq-btn" data-faq-id="${faq.id}">
          <span class="faq-text">${faq.question}</span>
          <span class="faq-arrow" aria-hidden="true">›</span>
        </button>
      `;
    });

    const faqBoxHtml = `
      <div class="chatbot-faq-box" id="chatbot-faq-box">
        <div class="chatbot-faq-title">CÁC CÂU HỎI THƯỜNG GẶP</div>
        ${faqButtonsHtml}
      </div>
    `;

    this.bodyEl.innerHTML = welcomeHtml + faqBoxHtml;

    // Gắn sự kiện click cho các nút FAQ
    this.bodyEl.querySelectorAll('.chatbot-faq-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const faqId = btn.getAttribute('data-faq-id');
        this.handleFaqClick(faqId);
      });
    });

    this.scrollToBottom();
  }

  toggleChat() {
    this.restoreServerHistory();
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    this.isOpen = true;
    this.chatWindow.classList.add('open');
    this.toggleBtn.classList.add('open');
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    if (this.notifDot) {
      this.notifDot.style.display = 'none';
    }
    setTimeout(() => {
      this.inputEl.focus();
      this.scrollToBottom();
    }, 200);
  }

  closeChat() {
    this.isOpen = false;
    this.chatWindow.classList.remove('open');
    this.toggleBtn.classList.remove('open');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
  }

  getCurrentTime() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatMarkdown(text) {
    if (!text) return '';
    // 1. Sanitize input tránh XSS trước khi format
    let safe = this.escapeHtml(text);
    // 2. Xử lý in đậm **text** (phải xử lý trước italic)
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // 3. Xử lý in nghiêng *text* (không match dấu * nằm trong tag <strong>)
    safe = safe.replace(/(?<!\w)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // 4. Xử lý xuống dòng
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  handleUserSubmitWithText(text) {
    if (this.inputEl) {
      this.inputEl.value = text;
      this.handleUserSubmit();
    }
  }

  scrollToBottom() {
    if (this.bodyEl) {
      this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
    }
  }

  /* ---- Xử lý khi click vào câu hỏi thường gặp ---- */
  handleFaqClick(faqId) {
    const item = FAQ_KNOWLEDGE_BASE.find((f) => f.id === faqId);
    if (!item) return;
    if (this.inputEl) this.inputEl.value = item.question;
    // Backend trả lời theo FAQ đã cấu hình và lưu cùng cách với câu trả lời AI.
    this.handleUserSubmit(item.id);
  }

  /* ---- Xử lý khi người dùng gõ tin nhắn tự do ---- */
  async handleUserSubmit(faqId = null) {
    const text = this.inputEl.value.trim();
    if (!text || this.isBotTyping) return;

    this.inputEl.value = '';
    this.inputEl.focus();

    // 1. Đưa tin nhắn User vào màn hình
    this.appendUserMessage(text);

    // 2. Hiện trạng thái đang gõ
    this.showTypingIndicator();

    try {
      let botResponse = '';

      if (CHATBOT_CONFIG.isLiveApi) {
        // GỌI API BACKEND THỰC TẾ (KẾT NỐI AI & SQL DATABASE)
        botResponse = await this.queryBackendApi(text, faqId);
      } else {
        botResponse = getLocalMockResponse(text);
      }

      this.hideTypingIndicator();
      const finalReply = (botResponse && typeof botResponse === 'string' && botResponse.trim())
        ? botResponse.trim()
        : 'Dạ mình đã nhận được thông tin. Bạn có câu hỏi nào khác về các loại bánh không ạ?';
      this.appendBotMessage(finalReply);
    } catch (err) {
      console.warn('Lỗi kết nối chatbot:', err);
      this.hideTypingIndicator();
      this.appendBotMessage('Trợ lý AI đang bận. Bạn vui lòng liên hệ hotline 1900 2075 để được tư vấn nhé.');
    }
  }

  /* ============================================================
     5. PHƯƠNG THỨC GỌI BACKEND API (AI & TRUY VẤN SQL)
     ============================================================ */
  async queryBackendApi(message, faqId = null) {
    const payload = {
      message: message,
    };
    if (faqId) payload.faqId = faqId;

    const headers = {
      'Content-Type': 'application/json',
    };

    // Nếu đã đăng nhập, gửi kèm JWT token để lưu lịch sử vào CSDL
    const token = localStorage.getItem('fg_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(CHATBOT_CONFIG.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Backend API trả mã lỗi: ${res.status}`);
    }

    const resData = await res.json();
    if (!resData.success && !resData.data?.reply) {
      throw new Error(resData.message || `Backend API trả mã lỗi: ${res.status}`);
    }
    return (
      (resData.data && resData.data.reply) ||
      resData.reply ||
      resData.message ||
      'Dạ tôi đã nhận được thông tin từ bạn!'
    );
  }

  appendUserMessage(text) {
    const timeStr = this.getCurrentTime();
    const msgObj = { sender: 'user', text: text, time: timeStr };
    this.history.push(msgObj);
    this.saveHistory();

    const msgHtml = `
      <div class="chatbot-msg user">
        <div class="chatbot-msg-avatar" style="background:#5fa01e">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="chatbot-msg-bubble">
          ${this.formatMarkdown(text)}
          <span class="chatbot-msg-time">${timeStr}</span>
        </div>
      </div>
    `;

    this.bodyEl.insertAdjacentHTML('beforeend', msgHtml);
    this.scrollToBottom();
  }

  appendBotMessage(text) {
    const timeStr = this.getCurrentTime();
    const msgObj = { sender: 'bot', text: text, time: timeStr };
    this.history.push(msgObj);
    this.saveHistory();

    const msgHtml = `
      <div class="chatbot-msg bot">
        <div class="chatbot-msg-avatar">
          ${getChatbotMascotAvatar()}
        </div>
        <div class="chatbot-msg-bubble">
          ${this.formatMarkdown(text)}
          <span class="chatbot-msg-time">${timeStr}</span>
        </div>
      </div>
    `;

    this.bodyEl.insertAdjacentHTML('beforeend', msgHtml);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    this.isBotTyping = true;
    this.sendBtn.disabled = true;

    const typingHtml = `
      <div class="chatbot-msg bot chatbot-typing" id="chatbot-typing-indicator">
        <div class="chatbot-msg-avatar">
          ${getChatbotMascotAvatar()}
        </div>
        <div class="chatbot-msg-bubble">
          <span class="chatbot-typing-dot"></span>
          <span class="chatbot-typing-dot"></span>
          <span class="chatbot-typing-dot"></span>
        </div>
      </div>
    `;
    this.bodyEl.insertAdjacentHTML('beforeend', typingHtml);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isBotTyping = false;
    this.sendBtn.disabled = false;
    const typing = document.getElementById('chatbot-typing-indicator');
    if (typing) typing.remove();
  }

  saveHistory() {
    sessionStorage.setItem('fg_chat_history', JSON.stringify(this.history));
  }

  renderHistory() {
    this.renderWelcomeScreen();
    // Render tiếp các tin nhắn tiếp theo trong lịch sử
    this.history.forEach((msg) => {
      if (msg.sender === 'user') {
        const msgHtml = `
          <div class="chatbot-msg user">
            <div class="chatbot-msg-avatar" style="background:#5fa01e">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="chatbot-msg-bubble">
              ${this.formatMarkdown(msg.text)}
              <span class="chatbot-msg-time">${msg.time}</span>
            </div>
          </div>
        `;
        this.bodyEl.insertAdjacentHTML('beforeend', msgHtml);
      } else {
        const msgHtml = `
          <div class="chatbot-msg bot">
            <div class="chatbot-msg-avatar">
              ${getChatbotMascotAvatar()}
            </div>
            <div class="chatbot-msg-bubble">
              ${this.formatMarkdown(msg.text)}
              <span class="chatbot-msg-time">${msg.time}</span>
            </div>
          </div>
        `;
        this.bodyEl.insertAdjacentHTML('beforeend', msgHtml);
      }
    });
    this.scrollToBottom();
  }
}

/* ============================================================
   6. KHỞI TẠO KHI TẢI TRANG & XỬ LÝ QUICK CHIPS
   ============================================================ */
let fgChatbotInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  fgChatbotInstance = new FreshGardenChatbot();

  // Xử lý các nút Quick Action Chips (bên dưới khung chat)
  const chipButtons = document.querySelectorAll('.chatbot-chip');
  chipButtons.forEach((chip) => {
    chip.addEventListener('click', () => {
      const action = chip.getAttribute('data-action');
      if (action === 'menu') {
        const target = document.getElementById('categories') || document.getElementById('featured');
        if (target) {
          fgChatbotInstance.closeChat();
          target.scrollIntoView({ behavior: 'smooth' });
        } else {
          fgChatbotInstance.handleUserSubmitWithText('Cho tôi xem danh mục bánh');
        }
      } else if (action === 'promo') {
        fgChatbotInstance.handleFaqClick('faq-promo');
      } else if (action === 'contact') {
        fgChatbotInstance.handleUserSubmitWithText('Tôi muốn liên hệ tư vấn');
      }
    });
  });

  // Nút emoji nhanh
  const emojiBtn = document.getElementById('chatbot-emoji-btn');
  if (emojiBtn) {
    emojiBtn.addEventListener('click', () => {
      const emojis = ['🎂', '🥐', '❤️', '🍰', '🧁', '✨', '👍'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      const input = document.getElementById('chatbot-input');
      input.value += randomEmoji;
      input.focus();
    });
  }
});
