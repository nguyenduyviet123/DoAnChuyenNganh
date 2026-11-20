const { GoogleGenAI } = require('@google/genai');
const { getPool } = require('../config/database');

const HOTLINE = '1900 2075';
const AI_TIMEOUT_MS = 30000;
const AI_ATTEMPT_TIMEOUT_MS = 15000;
const FAST_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
let genAI = null;

function removeCustomerDetails(value) {
  return String(value || '')
    .replace(/[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email đã ẩn]')
    .replace(/(?:\+?84|0)(?:[ .-]?\d){8,10}/g, '[số điện thoại đã ẩn]')
    .replace(/\b(?:địa chỉ|địa điểm|nhà tôi ở|tôi ở|mình ở|số nhà|đường|phường|quận|huyện)\s*[: là-]?\s*[^.!?\n]+/gi, '[địa chỉ đã ẩn]')
    .replace(/\b(?:tôi tên là|tên tôi là|mình tên là|tên mình là|họ tên|tên khách hàng|tên)\s*[: là-]?\s*[^.!?\n,;]+/gi, '[tên đã ẩn]')
    .replace(/\b(?:tôi là|mình là)\s+[\p{Lu}][\p{L}'’]*(?:\s+[\p{Lu}][\p{L}'’]*){0,3}/gu, '[tên đã ẩn]')
    .replace(/\b(?:mã đơn hàng|đơn hàng số|order id)\s*[:#-]?\s*[\w-]+/gi, '[mã đơn hàng đã ẩn]')
    .slice(0, 500);
}

let cachedProducts = null;
let lastCacheTime = 0;
const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút cache để giảm tải SQL Server

async function fetchProductsFromDb() {
  const now = Date.now();
  if (cachedProducts && now - lastCacheTime < PRODUCTS_CACHE_TTL_MS) {
    return cachedProducts;
  }
  const pool = await getPool();
  const result = await pool.query(`
    SELECT TOP 100 sp.MaSP, sp.TenSP, sp.DonGia, sp.DonViTinh, sp.KichThuoc,
           sp.MoTa, lc.TenLoai AS DanhMuc,
           ISNULL(stock.SoLuongCo,0) AS TonKho
    FROM dbo.SAN_PHAM sp
    LEFT JOIN dbo.LOAI_CON lc ON sp.MaLoai=lc.MaLoai
    OUTER APPLY (SELECT SUM(SoLuongCo) AS SoLuongCo
                 FROM dbo.CUAHANG_SANPHAM WHERE MaSP=sp.MaSP) stock
    ORDER BY sp.MaSP ASC`);
  cachedProducts = result.recordset || [];
  lastCacheTime = now;
  return cachedProducts;
}

async function getProductsContext(question, maxResults = 15) {
  const products = await fetchProductsFromDb();
  const words = removeCustomerDetails(question).toLocaleLowerCase('vi-VN')
    .split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 2);
  if (!words.length) return products.slice(0, maxResults);

  const ranked = products.map((product) => {
    const searchable = `${product.TenSP} ${product.DanhMuc || ''} ${product.MoTa || ''}`.toLocaleLowerCase('vi-VN');
    const score = words.reduce((total, word) => total + (searchable.includes(word) ? 1 : 0), 0);
    return { product, score };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.product);

  // Khi không có kết quả liên quan, chỉ gửi một mẫu nhỏ để AI có thể nêu rõ thiếu dữ liệu.
  return ranked.length ? ranked : products.slice(0, Math.min(5, maxResults));
}

async function generateSuggestedReply(faqId) {
  if (faqId === 'faq-menu') {
    const products = await getProductsContext('', 100);
    if (!products.length) return `Mình chưa có danh sách sản phẩm để tư vấn. Bạn vui lòng gọi hotline ${HOTLINE} nhé.`;
    const lines = products.slice(0, 12).map((product) => `• ${product.TenSP}`).join('\n');
    return `Một số sản phẩm Fresh Garden hiện có trong dữ liệu:\n${lines}\nBạn muốn xem thêm thông tin sản phẩm nào ạ?`;
  }
  if (faqId === 'faq-price') {
    const products = await getProductsContext('', 100);
    const priced = products.filter((product) => Number.isFinite(Number(product.DonGia)))
      .sort((a, b) => Number(a.DonGia) - Number(b.DonGia)).slice(0, 5);
    if (priced.length) {
      return `Một số sản phẩm có giá thấp trong dữ liệu hiện tại:\n${priced.map((product) => `• ${product.TenSP}: ${Number(product.DonGia).toLocaleString('vi-VN')}đ`).join('\n')}\nBạn cần tư vấn loại bánh nào ạ?`;
    }
  }
  // CSDL hiện chưa cung cấp dữ liệu khuyến mãi/giao hàng/thiết kế theo yêu cầu.
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

async function generateBotReply(userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const safeQuestion = removeCustomerDetails(userMessage);
  const products = await fetchProductsFromDb();
  const menuOverview = products.map((p) => `- ${p.TenSP}: ${Number(p.DonGia || 0).toLocaleString('vi-VN')}đ (${p.DanhMuc || 'Bánh tươi'})${p.MoTa ? ' [' + p.MoTa + ']' : ''}`).join('\n');

  if (!genAI) genAI = new GoogleGenAI({ apiKey });
  const prompt = `Bạn là trợ lý AI tư vấn bán lẻ thân thiện của tiệm bánh Fresh Garden Bakery. Trả lời bằng tiếng Việt, giọng điệu niềm nở, chu đáo và ngắn gọn.
Dựa vào toàn bộ danh sách sản phẩm và giá từ cơ sở dữ liệu Fresh Garden dưới đây để trả lời câu hỏi của khách hàng (ví dụ: tìm bánh theo tầm giá, loại bánh, hương vị, kích cỡ).
- Nếu khách hỏi bánh theo giá (ví dụ: dưới 39.000đ, từ bao nhiêu đến bao nhiêu), hãy tra cứu và liệt kê chính xác các bánh thỏa mãn điều kiện kèm giá tiền.
- Nếu không có sản phẩm nào thỏa mãn hoặc câu hỏi ngoài phạm vi, hãy giải thích nhẹ nhàng và hướng dẫn khách liên hệ Hotline ${HOTLINE}.

Danh sách sản phẩm từ cơ sở dữ liệu Fresh Garden:
${menuOverview}

Câu hỏi của khách hàng:
${safeQuestion}`;

  // Thử các model phản hồi nhanh (gemini-3.5-flash-lite, fallback gemini-3.1-flash-lite)
  let lastError = null;
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
      lastError = err;
    }
  }

  // Nếu tất cả model AI đều gặp sự cố, kích hoạt fallback thông minh thay vì báo lỗi
  console.warn('[aiService] Tất cả model AI đều quá tải, dùng local fallback.');
  return getLocalFallbackReply(userMessage);
}

module.exports = { generateBotReply, generateSuggestedReply, removeCustomerDetails, getLocalFallbackReply };
