const { GoogleGenAI } = require('@google/genai');
const { getPool } = require('../config/database');

const HOTLINE = '1900 2075';
const AI_BUSY_REPLY = 'Trợ lý AI đang bận, vui lòng thử lại sau';
const AI_TIMEOUT_MS = 30000;
const AI_ATTEMPT_TIMEOUT_MS = 15000;
const FAST_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
let genAI = null;

function removeCustomerDetails(value) {
  return String(value || '')
    .replace(/[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email đã ẩn]')
    .replace(/(?:\+?84|0)(?:[ .-]?\d){8,10}/g, '[số điện thoại đã ẩn]')
    .replace(/(^|[^\p{L}\p{N}])(?:địa chỉ(?: giao hàng)?|địa điểm giao hàng|nhà tôi ở|tôi ở|mình ở|số nhà)\s*(?:[:：]|là)?\s*[^.!?\n,;]+/giu, '$1[địa chỉ đã ẩn]')
    .replace(/(^|[^\p{L}\p{N}])(?:đường|phường|quận|huyện)\s+[\p{L}\p{N}][^.!?\n,;]*/giu, '$1[địa chỉ đã ẩn]')
    .replace(/(^|[^\p{L}\p{N}])(?:(?:tôi|mình)\s+tên(?:\s+là)?\s+[\p{Lu}][\p{L}'’]*(?:\s+[\p{Lu}][\p{L}'’]*){0,3}|(?:tên tôi là|tên mình là|họ tên(?: khách hàng)?|tên khách hàng)\s*(?:[:：]|là)?\s*[^.!?\n,;]+|tên\s*[:：]\s*[^.!?\n,;]+)/gu, '$1[tên đã ẩn]')
    .replace(/(^|[^\p{L}\p{N}])(?:tôi là|mình là)\s+[\p{Lu}][\p{L}'’]*(?:\s+[\p{Lu}][\p{L}'’]*){0,3}/gu, '$1[tên đã ẩn]')
    .replace(/(^|[^\p{L}\p{N}])(?:mã đơn hàng|đơn hàng số|order id)\s*[:#-]?\s*[\w-]+/giu, '$1[mã đơn hàng đã ẩn]')
    .slice(0, 500);
}

let cachedProducts = null;
let lastCacheTime = 0;
const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút cache để giảm tải SQL Server

async function fetchProductsFromDb(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && now - lastCacheTime < PRODUCTS_CACHE_TTL_MS) {
    return cachedProducts;
  }
  const pool = await getPool();
  const result = await pool.query(`
    SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.DonViTinh, sp.KichThuoc,
           sp.MoTa, lc.TenLoai AS DanhMuc, lcha.TenLoaiCha AS NhomLon,
           ISNULL(stock.SoLuongCo,0) AS TonKho
    FROM dbo.SAN_PHAM sp
    LEFT JOIN dbo.LOAI_CON lc ON sp.MaLoai=lc.MaLoai
    LEFT JOIN dbo.LOAI_CHA lcha ON lc.MaLoaiCha=lcha.MaLoaiCha
    OUTER APPLY (SELECT SUM(SoLuongCo) AS SoLuongCo
                 FROM dbo.CUAHANG_SANPHAM WHERE MaSP=sp.MaSP) stock
    ORDER BY sp.MaSP ASC`);
  cachedProducts = result.recordset || [];
  lastCacheTime = now;
  return cachedProducts;
}

function normalizeProductText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd').toLocaleLowerCase('vi-VN').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
// Kiểm tra xem lỗi có phải là lỗi tạm thời do AI quá tải hay không?
function isTransientAiBusyError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return /(?:\b503\b|unavailable|high demand|\b504\b|deadline_exceeded|deadline expired|timed out|request timeout)/u.test(message);
}

function findProductsByCategory(question, products) {
  const query = normalizeProductText(question);
  const childNames = [...new Set(products.map((p) => normalizeProductText(p.DanhMuc)).filter(Boolean))]
    .filter((name) => query.includes(name)).sort((a, b) => b.length - a.length);
  if (childNames.length) return products.filter((p) => childNames.includes(normalizeProductText(p.DanhMuc)));
  const parentNames = [...new Set(products.map((p) => normalizeProductText(p.NhomLon)).filter(Boolean))]
    .filter((name) => query.includes(name)).sort((a, b) => b.length - a.length);
  if (parentNames.length) return products.filter((p) => parentNames.includes(normalizeProductText(p.NhomLon)));
  return null;
}

function findChildCategoryNames(question, products) {
  const query = normalizeProductText(question);
  const queryWords = new Set(query.split(' ').filter((word) => word.length > 2 && !['banh', 'loai', 'nao', 'co', 'cua', 'shop', 'thong', 'tin'].includes(word)));
  const parents = [...new Set(products.map((p) => String(p.NhomLon || '').trim()).filter(Boolean))];
  const matchingParents = parents.filter((parent) => {
    const normalizedParent = normalizeProductText(parent);
    if (query.includes(normalizedParent)) return true;
    const distinguishingWords = normalizedParent.split(' ').filter((word) => word.length > 2 && word !== 'banh');
    return distinguishingWords.some((word) => queryWords.has(word));
  });
  if (!matchingParents.length) return null;
  return [...new Set(products
    .filter((p) => matchingParents.includes(String(p.NhomLon || '').trim()))
    .map((p) => String(p.DanhMuc || '').trim())
    .filter(Boolean))];
}

async function getProductsContext(question, maxResults = 15, forceRefresh = false) {
  const products = await fetchProductsFromDb(forceRefresh);
  const stopWords = new Set(['banh', 'cho', 'toi', 'minh', 'la', 'co', 'khong', 'gi', 'nao', 'nay', 'do', 'cai', 'gia', 'bao', 'nhieu', 'voi', 'va', 'cua', 'hang', 'the', 'nao', 'duoc', 'xem', 'them']);
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi-VN');
  const normalizedQuestion = normalize(removeCustomerDetails(question));
  const words = [...new Set(normalizedQuestion.split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 2 && !stopWords.has(word)))];
  if (!normalizedQuestion.trim()) return products.slice(0, maxResults);
  if (!words.length) return [];

  const ranked = products.map((product) => {
    const name = normalize(product.TenSP);
    const category = normalize(`${product.NhomLon || ''} ${product.DanhMuc || ''}`);
    const description = normalize(product.MoTa || '');
    const score = words.reduce((total, word) => total + (
      name.includes(word) ? 5 : category.includes(word) ? 3 : description.includes(word) ? 1 : 0
    ), 0) + (name && normalizedQuestion.includes(name) ? 8 : 0);
    return { product, score };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.product);

  // Không tìm thấy sản phẩm liên quan thì không gửi danh mục ngẫu nhiên cho Gemini.
  return ranked;
}

function isStockQuestion(question) {
  return /(?:tồn\s*kho|còn\s*(?:bao\s*nhiêu|mấy|lại|hàng)|số\s*lượng\s*(?:hiện\s*(?:tại|có)|còn|tồn)|(?:hiện\s*có|đang\s*có)\s*(?:bao\s*nhiêu|mấy)|có\s*(?:còn|sẵn)\s*hàng|hết\s*hàng)/iu.test(question);
}

function findStockProduct(question, history, products) {
  const normalize = (value) => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi-VN');
  const generic = new Set(['banh', 'mi', 'kem', 'tuoi', 'con', 'bao', 'nhieu', 'cai', 'hang', 'ton', 'kho', 'hien', 'tai', 'co', 'san', 'so', 'luong', 'la', 'nao', 'do', 'cai']);
  const matchInText = (text) => {
    const context = normalize(text);
    const scored = products.map((product) => {
      const name = normalize(product.TenSP);
      if (!name) return { product, score: 0 };
      if (context.includes(name)) return { product, score: 1000 + name.length };
      const terms = [...new Set(name.split(/[^\p{L}\p{N}]+/u)
        .filter((term) => term.length > 2 && !generic.has(term)))];
      const matches = terms.filter((term) => context.includes(term));
      return { product, score: matches.length ? matches.reduce((score, term) => score + term.length, 0) : 0 };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    return !scored.length || (scored[1] && scored[1].score === scored[0].score) ? null : scored[0].product;
  };

  const currentMatch = matchInText(question);
  if (currentMatch) return currentMatch;
  for (const entry of [...history].reverse()) {
    if (entry.role !== 'Khách hàng') continue;
    const previousMatch = matchInText(entry.text);
    if (previousMatch) return previousMatch;
  }
  return null;
}

function sanitizeConversationHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-6).flatMap((entry) => {
    if (!entry || !['user', 'bot'].includes(entry.sender) || typeof entry.text !== 'string') return [];
    const text = removeCustomerDetails(entry.text).trim().slice(0, 400);
    return text ? [{ role: entry.sender === 'user' ? 'Khách hàng' : 'Trợ lý', text }] : [];
  });
}

async function generateSuggestedReply(faqId) {
  if (faqId === 'faq-menu') {
    const products = await getProductsContext('', 100);
    if (!products.length) return `Mình chưa có danh sách sản phẩm để tư vấn. Bạn vui lòng gọi hotline ${HOTLINE} nhé.`;
    const normalize = (value) => String(value || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi-VN');
    const representatives = new Map();
    for (const product of products) {
      const type = product.NhomLon || product.DanhMuc || '';
      if (!normalize(type).includes('banh')) continue;
      const key = normalize(type);
      if (!representatives.has(key)) representatives.set(key, { type, product });
    }
    if (!representatives.size) return `Mình chưa có danh sách các loại bánh trong dữ liệu hiện tại. Bạn vui lòng gọi hotline ${HOTLINE} nhé.`;
    const lines = [...representatives.values()].map(({ type, product }) =>
      `• ${type}: ${product.TenSP}${Number.isFinite(Number(product.DonGia)) ? ` – ${Number(product.DonGia).toLocaleString('vi-VN')}đ` : ''}`
    ).join('\n');
    return `Một số loại bánh Fresh Garden (mỗi loại một sản phẩm đại diện):\n${lines}\nBạn muốn xem thêm loại nào ạ?`;
  }
  if (faqId === 'faq-price') {
    const normalize = (value) => String(value || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi-VN');
    const products = await getProductsContext('', 100);
    const priced = products.filter((product) => {
      const category = normalize(`${product.NhomLon || ''} ${product.DanhMuc || ''}`);
      return category.includes('banh kem') && Number.isFinite(Number(product.DonGia));
    })
      .sort((a, b) => Number(a.DonGia) - Number(b.DonGia)).slice(0, 5);
    if (priced.length) {
      return `Một số mẫu bánh kem (danh mục bánh kem) và giá trong dữ liệu hiện tại:\n${priced.map((product) => `• ${product.TenSP}: ${Number(product.DonGia).toLocaleString('vi-VN')}đ`).join('\n')}\nBạn muốn xem mẫu nào ạ?`;
    }
    return `Mình chưa có giá sản phẩm trong danh mục bánh kem ở dữ liệu hiện tại. Bạn vui lòng gọi hotline ${HOTLINE} để được tư vấn nhé.`;
  }
  if (faqId === 'faq-promo') {
    return 'Hiện tại Fresh Garden đang có các ưu đãi cực hấp dẫn:\n\n' +
      '1. 🚚 **FREESHIP** toàn bộ đơn hàng từ **300.000đ** trong bán kính 7km.\n' +
      '2. 🎂 **Giảm 10%** cho bánh sinh nhật khi đặt trước ít nhất 24 giờ.\n' +
      '3. ☕ **Combo Giờ Vàng (14h - 17h):** Mua 1 bánh ngọt bất kỳ tặng 1 trà/cà phê thanh mát.\n' +
      '4. 🌟 **Ưu đãi thành viên:** Tích điểm hoàn tiền 5% cho mỗi đơn hàng.';
  }
  if (faqId === 'faq-delivery') {
    return 'Chính sách giao hàng của Fresh Garden:\n\n' +
      '• **Giao hỏa tốc nội thành:** 30 – 60 phút đối với các loại bánh ngọt, bánh mì sẵn có tại cửa hàng gần bạn nhất.\n' +
      '• **Bánh sinh nhật theo yêu cầu:** Quý khách nên đặt trước 2 – 4 tiếng hoặc hẹn giờ giao chính xác trong ngày.\n' +
      '• Bánh được bảo quản trong hộp giữ nhiệt chuyên dụng đảm bảo đến tay luôn nguyên vẹn và tươi ngon!';
  }
  if (faqId === 'faq-custom') {
    return 'Dạ **CÓ** ạ! Fresh Garden rất hân hạnh nhận làm bánh theo yêu cầu của bạn:\n\n' +
      '• Viết lời chúc, in ảnh ăn được (photo cake), tạo hình fondant, gắn phụ kiện sinh nhật.\n' +
      '• Tuỳ chọn độ ngọt, cốt bánh (vanilla, socola, trà xanh, bắp ngô).\n' +
      '• Đặt bánh tiệc cưới, hội nghị, sự kiện công ty với số lượng lớn có chiết khấu cao.\n\n' +
      `👉 Bạn vui lòng liên hệ Hotline **${HOTLINE}** hoặc nhắn tin Zalo để chuyên viên gửi mẫu thiết kế riêng nhé!`;
  }
  return `Thông tin này chưa có trong dữ liệu hiện tại. Bạn vui lòng liên hệ hotline ${HOTLINE} để được tư vấn nhé.`;
}

async function withTimeout(operation, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new Error('AI request timed out');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function truncateReply(text, maxLength = 1500) {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastBreak = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('\n')
  );
  return lastBreak > maxLength * 0.6 ? slice.slice(0, lastBreak + 1) : slice;
}

function getLocalFallbackReply(userText) {
  const text = String(userText || '').toLowerCase().trim();
  if (/(chào|hello|hi|alo|hé lô|hey|shop ơi|ad ơi)/.test(text)) {
    return 'Dạ Fresh Garden xin chào bạn! Mình là Trợ lý AI Fresh Garden. Mình có thể giúp bạn chọn bánh sinh nhật, xem menu bánh tươi hoặc kiểm tra khuyến mãi hôm nay ạ!';
  }
  if (/(sinh nhật|kem|sn|bánh kem|tiramisu|mousse|bắp|red velvet)/.test(text)) {
    return 'Dạ Fresh Garden có rất nhiều mẫu **Bánh sinh nhật & Bánh kem tươi** làm mới mỗi ngày (Mousse chanh leo, Tiramisu, Bánh bắp tươi, Red Velvet). Size 16cm từ 250.000đ, size 20cm từ 380.000đ. Đặt trước còn được giảm 10% nhé! 🎂';
  }
  if (/(giá|bao nhiêu|nhiêu tiền|bảng giá|bán sao)/.test(text)) {
    return 'Dạ giá bánh tại Fresh Garden rất đa dạng:\n• Bánh mì tươi & croissant: từ 18.000đ - 45.000đ\n• Bánh ngọt, tart lát: từ 32.000đ - 55.000đ\n• Bánh sinh nhật nguyên ổ: từ 220.000đ - 650.000đ.\nBạn đang tìm loại bánh nào để mình báo giá chi tiết nhé!';
  }
  if (/(khuyến mãi|sale|giảm giá|voucher|ưu đãi|freeship|miễn phí)/.test(text)) {
    return '🎁 Hôm nay Fresh Garden có ưu đãi:\n1. Freeship cho đơn từ 300.000đ trong bán kính 7km\n2. Giảm 10% khi đặt bánh sinh nhật trước 24h\n3. Tặng trọn bộ nến sinh nhật và phụ kiện tiệc!';
  }
  if (/(ship|giao hàng|vận chuyển|nơi giao|địa chỉ giao|mấy tiếng)/.test(text)) {
    return '🚚 Cửa hàng nhận giao hàng hỏa tốc nội thành trong 30-60 phút. Bánh kem được đóng thùng bảo ôn chuyên dụng đảm bảo tươi ngon và nguyên vẹn dáng bánh ạ!';
  }
  if (/(địa chỉ|ở đâu|cửa hàng|chi nhánh|quận|hà nội)/.test(text)) {
    return 'Fresh Garden có hệ thống hơn 60 cửa hàng tại Hà Nội và các thành phố lớn. Bạn có thể ghé cửa hàng gần nhất hoặc đặt trực tiếp trên website để được ship tận nơi nhé!';
  }
  if (/(giờ mở cửa|mở cửa|đóng cửa|mấy giờ)/.test(text)) {
    return 'Hệ thống Fresh Garden mở cửa từ **06:30 sáng đến 22:00 tối** tất cả các ngày trong tuần (kể cả Thứ Bảy, Chủ Nhật và ngày Lễ) bạn nhé!';
  }
  if (/(liên hệ|hotline|sđt|số điện thoại|tổng đài|gặp nhân viên|người thật)/.test(text)) {
    return `Dạ bạn có thể gọi ngay Hotline miễn cước: **${HOTLINE}** (8:00 - 21:30) để được nhân viên hỗ trợ trực tiếp ngay nhé!`;
  }
  return `Cảm ơn câu hỏi của bạn! Bạn có thể xem nhanh danh mục sản phẩm trên website hoặc gọi Hotline **${HOTLINE}** để chuyên viên tư vấn Fresh Garden hỗ trợ chi tiết nhất cho bạn nhé! ❤️`;
}

async function generateBotReply(userMessage, conversationHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const safeQuestion = removeCustomerDetails(userMessage);
  const safeHistory = sanitizeConversationHistory(conversationHistory);
  const historyContext = safeHistory.map((entry) => `${entry.role}: ${entry.text}`).join('\n');
  const normalizedQuestion = normalizeProductText(safeQuestion);
  const isContextOnlyFollowUp = /(?:cai do|loai do|loai vua noi|san pham do|no|loai nay|cai nay)/u.test(normalizedQuestion);
  const productSearchContext = isContextOnlyFollowUp
    ? [historyContext, `Khách hàng: ${safeQuestion}`].filter(Boolean).join('\n')
    : safeQuestion;
  const stockQuestion = isStockQuestion(safeQuestion);
  const allProducts = await fetchProductsFromDb(stockQuestion);
  //tìm min,max tồn kho trong danh sách sản phẩm 
  let stockExtremeResult = null;
  const asksStockExtreme = /(?:ton kho|so luong|con hang|hang)/u.test(normalizedQuestion) &&
    /(?:nhieu nhat|it nhat|cao nhat|thap nhat|lon nhat|nho nhat|be nhat)/u.test(normalizedQuestion);
  if (asksStockExtreme && allProducts.length) {
    const getStock = (product) => Math.max(0, Number(product.TonKho) || 0);
    const extreme = /(?:nhieu nhat|cao nhat|lon nhat)/u.test(normalizedQuestion)
      ? Math.max(...allProducts.map(getStock))
      : Math.min(...allProducts.map(getStock));
    const matches = allProducts.filter((product) => getStock(product) === extreme);
    
    const label = /(?:nhieu nhat|cao nhat|lon nhat)/u.test(normalizedQuestion)
      ? 'nhiều nhất'
      : /nho nhat/u.test(normalizedQuestion) ? 'nhỏ nhất' : 'ít nhất';
    stockExtremeResult = { label, extreme, products: matches };
  }
  const childCategoryNames = findChildCategoryNames(safeQuestion, allProducts);
  const isPriceOrStockQuestion = /(?:gia|bao nhieu|tien|ton kho|con hang|so luong|het hang)/u.test(normalizedQuestion);
  const namesSpecificProduct = allProducts.some((p) => {
    const name = normalizeProductText(p.TenSP);
    return name.length > 8 && normalizedQuestion.includes(name);
  });
  const namesChildCategory = allProducts.some((p) => {
    const name = normalizeProductText(p.DanhMuc);
    return name && normalizedQuestion.includes(name);
  });
  const categoryOverviewContext = !stockQuestion && !isPriceOrStockQuestion && !namesSpecificProduct && !namesChildCategory && childCategoryNames?.length
    ? childCategoryNames.map((name) => `- ${name}`).join('\n')
    : '';
  const categoryProducts = findProductsByCategory(safeQuestion, allProducts);
  const asksForCategoryProducts = /(?:loai|san pham|nao khac|co nhung|danh sach|liet ke)/u.test(normalizedQuestion);
  const products = stockExtremeResult
    ? stockExtremeResult.products
    : categoryProducts?.length && (asksForCategoryProducts || categoryOverviewContext)
    ? categoryProducts
    : await getProductsContext(productSearchContext, 15, stockQuestion);
  if (stockQuestion && !stockExtremeResult) {
    const matchedProduct = findStockProduct(safeQuestion, safeHistory, products);
    if (!matchedProduct) {
      return `Bạn cho mình tên sản phẩm cụ thể để kiểm tra tồn kho chính xác nhé. Nếu cần, bạn có thể gọi hotline ${HOTLINE} để được hỗ trợ.`;
    }
    const stock = Math.max(0, Number(matchedProduct.TonKho) || 0);
    const unit = matchedProduct.DonViTinh || 'cái';
    return stock > 0
      ? `Theo dữ liệu tồn kho hiện tại, **${matchedProduct.TenSP}** còn **${stock} ${unit}**.`
      : `Theo dữ liệu tồn kho hiện tại, **${matchedProduct.TenSP}** đã hết hàng (còn 0 ${unit}).`;
  }
  const menuOverview = products.map((p) => {
    const category = [p.NhomLon, p.DanhMuc].filter(Boolean).join(' > ') || 'Bánh tươi';
    const stock = Math.max(0, Number(p.TonKho) || 0);
    const stockLabel = stock > 0 ? `${stock} ${p.DonViTinh || 'cái'}` : 'hết hàng (0)';
    return `- ${p.TenSP}: ${Number(p.DonGia || 0).toLocaleString('vi-VN')}đ (${category}); tồn kho: ${stockLabel}${p.KichThuoc ? `; kích thước: ${p.KichThuoc}` : ''}${p.MoTa ? `; mô tả: ${p.MoTa}` : ''}`;
  }).join('\n');

  if (!genAI) genAI = new GoogleGenAI({ apiKey });
  const prompt = `Bạn là trợ lý AI tư vấn bán lẻ thân thiện của tiệm bánh Fresh Garden Bakery. Trả lời bằng tiếng Việt, giọng điệu niềm nở, chu đáo và ngắn gọn.
Dựa vào ngữ cảnh hội thoại gần nhất đã được lọc thông tin cá nhân, danh mục con và danh sách sản phẩm liên quan từ SQL dưới đây. Chỉ trả lời câu hỏi hiện tại; dùng lịch sử để hiểu đại từ như "cái đó" hoặc "loại vừa nói".
- Nếu có danh sách danh mục con từ SQL, hãy dựa vào đó để trả lời câu hỏi khái quát về danh mục cha. Không tự thêm danh mục khác hoặc chuyển sang nhóm sản phẩm khác.
- Khi khách hỏi về một danh mục cụ thể, chỉ tư vấn các sản phẩm có trong danh sách SQL thuộc danh mục đó; không đề xuất sản phẩm ở danh mục khác.
- Với câu hỏi sản phẩm có tồn kho nhiều/ít nhất, SQL đã xác định sẵn mức tồn kho cực trị. Hãy trả lời dựa trên các sản phẩm trong danh sách kết quả này và không tự tính lại hoặc đổi sang sản phẩm khác.
- Chỉ nêu sản phẩm, giá, kích thước và tồn kho nếu các dữ kiện đó có trong danh sách SQL. Không tự suy đoán hoặc bịa dữ liệu.
- Nếu tồn kho ghi "hết hàng (0)", nói rõ sản phẩm hiện hết hàng. Không khẳng định còn hàng nếu dữ liệu không thể hiện điều đó.
- Nếu không có sản phẩm liên quan trong danh sách hoặc thiếu thông tin để trả lời, hãy nói rõ và hướng dẫn khách liên hệ Hotline ${HOTLINE}.

Ngữ cảnh hội thoại gần nhất:
${historyContext || '(Chưa có lượt hội thoại trước)'}

Danh sách sản phẩm liên quan từ cơ sở dữ liệu Fresh Garden:
${menuOverview || '(Không tìm thấy sản phẩm phù hợp trong dữ liệu hiện có)'}

Kết quả so sánh tồn kho từ SQL:
${stockExtremeResult ? `Mức ${stockExtremeResult.label}: ${stockExtremeResult.extreme}. Chỉ các sản phẩm trong danh sách liên quan đạt mức này.` : '(Không áp dụng)'}

Danh sách danh mục con khớp với câu hỏi từ SQL:
${categoryOverviewContext || '(Không có yêu cầu liệt kê danh mục cha)'}

Câu hỏi của khách hàng:
${safeQuestion}`;

  // Thử các model phản hồi nhanh (gemini-3.5-flash-lite, fallback gemini-3.1-flash-lite)
  let allErrorsAreBusy = true;
  for (const modelName of FAST_MODELS) {
    try {
      const response = await withTimeout((signal) => genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          abortSignal: signal,
          httpOptions: {
            timeout: AI_ATTEMPT_TIMEOUT_MS,
            retryOptions: {
              attempts: 1, // Không retry dài để tránh lỗi 504 Deadline Exceeded
              initialDelay: 0.5,
              maxDelay: 1,
              expBase: 2,
              httpStatusCodes: [503, 504],
            },
          },
        },
      }), AI_TIMEOUT_MS);

      const reply = response.text?.trim();
      if (reply) {
        return truncateReply(reply, 1500);
      }
    } catch (err) {
      console.warn(`[aiService] Model ${modelName} gặp lỗi (${err.message}), thử model tiếp theo...`);
      if (!isTransientAiBusyError(err)) allErrorsAreBusy = false;
    }
  }

  if (allErrorsAreBusy) return AI_BUSY_REPLY;

  // Nếu tất cả model AI đều gặp sự cố, kích hoạt fallback thông minh thay vì báo lỗi
  console.warn('[aiService] Tất cả model AI đều quá tải, dùng local fallback.');
  return getLocalFallbackReply(userMessage);
}

module.exports = { generateBotReply, generateSuggestedReply, removeCustomerDetails, getLocalFallbackReply };
