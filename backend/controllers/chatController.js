const { sql, getPool } = require('../config/database');
const { generateBotReply, generateSuggestedReply, getLocalFallbackReply } = require('../services/aiService');

const HOTLINE = '1900 2075';
const AI_ERROR_REPLY = `Trợ lý AI đang bận. Bạn vui lòng liên hệ hotline ${HOTLINE} để được tư vấn nhé.`;
const MAX_MESSAGE_LENGTH = 500;
const SUGGESTED_QUESTIONS = {
  'faq-menu': 'Fresh Garden có những loại bánh nào?',
  'faq-price': 'Bánh sinh nhật có giá bao nhiêu?',
  'faq-promo': 'Cửa hàng có chương trình khuyến mãi nào?',
  'faq-delivery': 'Thời gian giao hàng bao lâu?',
  'faq-custom': 'Có hỗ trợ đặt bánh theo nhu cầu không?',
};
const VALID_FAQ_IDS = new Set(Object.keys(SUGGESTED_QUESTIONS));

function normalizeQuestion(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function findSuggestedQuestionId(message) {
  const normalizedMessage = normalizeQuestion(message);
  return Object.entries(SUGGESTED_QUESTIONS)
    .find(([, question]) => normalizeQuestion(question) === normalizedMessage)?.[0] || null;
}

function getMessage(req) {
  const message = req.body?.message;
  if (typeof message !== 'string') return null;
  const trimmed = message.trim();
  return trimmed && trimmed.length <= MAX_MESSAGE_LENGTH ? trimmed : null;
}

async function saveConversation(maKhachHang, userText, botReply) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

  try {
    const activeSession = await new sql.Request(transaction)
      .input('maKh', sql.Int, maKhachHang)
      .query(`SELECT TOP 1 MaPhien FROM dbo.PHIEN_CHAT WITH (UPDLOCK, HOLDLOCK)
              WHERE MaKhachHang=@maKh AND TrangThai=N'Đang hoạt động'
              ORDER BY ThoiGianBatDau DESC`);

    let maPhien = activeSession.recordset[0]?.MaPhien;
    if (!maPhien) {
      const nextSession = await new sql.Request(transaction).query(
        'SELECT ISNULL(MAX(MaPhien),0)+1 AS nextId FROM dbo.PHIEN_CHAT WITH (TABLOCKX, HOLDLOCK)'
      );
      maPhien = nextSession.recordset[0].nextId;
      await new sql.Request(transaction)
        .input('maPhien', sql.Int, maPhien)
        .input('maKh', sql.Int, maKhachHang)
        .query(`INSERT INTO dbo.PHIEN_CHAT(MaPhien,MaKhachHang,ThoiGianBatDau,TrangThai)
                VALUES(@maPhien,@maKh,SYSDATETIME(),N'Đang hoạt động')`);
    }

    const nextMessage = await new sql.Request(transaction).query(
      'SELECT ISNULL(MAX(MaTinNhan),0)+1 AS nextId FROM dbo.TIN_NHAN_CHAT WITH (TABLOCKX, HOLDLOCK)'
    );
    let maTinNhan = nextMessage.recordset[0].nextId;

    for (const [nguoiGui, noiDung] of [['Khách hàng', userText], ['Chatbot', botReply]]) {
      await new sql.Request(transaction)
        .input('maTinNhan', sql.Int, maTinNhan++)
        .input('maPhien', sql.Int, maPhien)
        .input('nguoiGui', sql.NVarChar(30), nguoiGui)
        // Chatbot replies can be much longer than user prompts. Match the
        // database's NVARCHAR(MAX) column so mssql does not bind a smaller size.
        .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
        .input('loai', sql.NVarChar(50), 'Văn bản')
        .query(`INSERT INTO dbo.TIN_NHAN_CHAT(MaTinNhan,MaPhien,NguoiGui,NoiDung,ThoiGianGui,LoaiTinNhan)
                VALUES(@maTinNhan,@maPhien,@nguoiGui,@noiDung,SYSDATETIME(),@loai)`);
    }

    await transaction.commit();
    return maPhien;
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    throw error;
  }
}

exports.sendMessage = async (req, res) => {
  if (req.authVerificationFailed) {
    return res.status(503).json({
      success: false,
      data: null,
      message: 'Không thể xác minh phiên đăng nhập. Bạn vui lòng thử lại sau.',
    });
  }

  let userText = getMessage(req);
  if (!userText) {
    return res.status(400).json({
      success: false,
      data: null,
      message: `Vui lòng nhập câu hỏi từ 1 đến ${MAX_MESSAGE_LENGTH} ký tự.`,
    });
  }

  let botReply;
  try {
    const requestedFaqId = (typeof req.body?.faqId === 'string' && VALID_FAQ_IDS.has(req.body.faqId))
      ? req.body.faqId
      : null;
    // Treat an exact FAQ question typed into the free-text box the same as
    // clicking its suggested-question button (ignoring case, accents, spacing,
    // and punctuation).
    const faqId = requestedFaqId || findSuggestedQuestionId(userText);
    if (faqId) {
      // Câu hỏi gợi ý trả lời từ dữ liệu/kịch bản backend, không cần gọi dịch vụ AI.
      userText = SUGGESTED_QUESTIONS[faqId];
      botReply = await generateSuggestedReply(faqId);
    } else {
      // Chỉ gửi câu hỏi đã lọc PII và dữ liệu sản phẩm SQL tới AI; không gửi hồ sơ/lịch sử khách.
      botReply = await generateBotReply(userText);
    }
  } catch (error) {
    console.warn('[chatController] AI gặp sự cố:', error.message);
    botReply = getLocalFallbackReply(userText) || AI_ERROR_REPLY;
  }

  const maKhachHang = req.user?.maKhachHang;
  if (!maKhachHang) {
    // Khách vãng lai không tạo phiên hay ghi tin nhắn vào bất kỳ bảng SQL nào.
    return res.json({
      success: true,
      data: { reply: botReply, isSaved: false },
      message: 'Đã xử lý câu hỏi trong phiên khách hiện tại.',
    });
  }

  try {
    const maPhien = await saveConversation(maKhachHang, userText, botReply);
    return res.json({
      success: true,
      data: { reply: botReply, isSaved: true, maPhien },
      message: 'Đã lưu câu hỏi và câu trả lời vào lịch sử chat.',
    });
  } catch (error) {
    console.error('[chatController] Không thể lưu hội thoại:', error.message);
    return res.status(503).json({
      success: false,
      data: { reply: AI_ERROR_REPLY, isSaved: false },
      message: AI_ERROR_REPLY,
    });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('maKh', sql.Int, req.user.maKhachHang)
      .query(`SELECT tn.MaTinNhan, tn.MaPhien, tn.NguoiGui, tn.NoiDung, tn.ThoiGianGui, tn.LoaiTinNhan
              FROM dbo.TIN_NHAN_CHAT tn
              INNER JOIN dbo.PHIEN_CHAT pc ON tn.MaPhien=pc.MaPhien
              WHERE pc.MaKhachHang=@maKh
              ORDER BY tn.ThoiGianGui ASC, tn.MaTinNhan ASC`);

    return res.json({ success: true, data: result.recordset, message: 'Đã tải lịch sử chat.' });
  } catch (error) {
    console.error('[chatController.getChatHistory] Lỗi:', error.message);
    return res.status(503).json({ success: false, data: null, message: 'Không thể tải lịch sử chat lúc này.' });
  }
};
