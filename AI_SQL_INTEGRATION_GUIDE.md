# HƯỚNG DẪN KẾT NỐI CHATBOT AI VỚI BACKEND API & SQL DATABASE

Tài liệu này cung cấp sơ đồ kiến trúc, luồng xử lý và code mẫu để bạn dễ dàng nâng cấp từ UI ChatBot hiện tại sang hệ thống ChatBot AI thực tế có truy vấn cơ sở dữ liệu SQL của website Fresh Garden.

---

## 1. Sơ đồ Kiến trúc Hệ thống (Architecture Diagram)

```
[ Người dùng chat trên Web (chatbot.js) ]
                   │
                   ▼ (HTTP POST /api/chat với JSON { message, history, sessionId })
      [ Web Server / AI Backend API ]
        (Node.js / Python FastAPI / PHP)
        ┌──────────┴──────────┐
        ▼                     ▼
 [ Database SQL ]      [ AI Model LLM ]
 (MySQL / PostgreSQL) (OpenAI / Gemini / DeepSeek)
   • Bảng Products       • Phân tích câu hỏi khách hàng
   • Bảng Categories     • Sinh câu trả lời tự nhiên
   • Bảng Orders         • Dùng dữ liệu SQL làm ngữ cảnh (RAG)
        │                     │
        └──────────┬──────────┘
                   ▼
  [ JSON Response { reply: "..." } gửi về chatbot.js ]
```

---

## 2. Các bước cấu hình trong `chatbot.js`

Trong file [chatbot.js](file:///c:/Users/AD/Downloads/WEB%20B%C3%A1nh%20FG/chatbot.js), bạn chỉ cần điều chỉnh cấu hình tại dòng **20 - 32**:

```javascript
const CHATBOT_CONFIG = {
  // 1. Chuyển thành true khi Backend của bạn đã sẵn sàng
  isLiveApi: true,

  // 2. Điền endpoint API Backend của bạn
  apiUrl: 'http://localhost:5000/api/chat', // hoặc 'https://yourdomain.com/api/chat'

  botName: 'ChatBot AI - FreshGarden',
  mockTypingDelay: 700,
  maxHistoryContext: 10,
};
```

---

## 3. Cấu trúc Payload gửi lên Backend

Khi người dùng nhắn tin, `chatbot.js` sẽ tự động gửi request HTTP POST tới `apiUrl`:

```json
{
  "message": "Cửa hàng còn bánh Mousse chanh leo không và giá bao nhiêu?",
  "history": [
    { "sender": "user", "text": "Xin chào", "time": "14:00" },
    { "sender": "bot", "text": "Chào bạn! Tôi có thể giúp gì cho bạn?", "time": "14:00" }
  ],
  "sessionId": "session_1792766840_abc123",
  "timestamp": "2026-10-23T14:45:00.000Z"
}
```

---

## 4. Code Mẫu Backend (Node.js Express + MySQL + OpenAI/Gemini)

Dưới đây là một server mẫu hoàn chỉnh viết bằng **Node.js (Express)**:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Hoặc OpenAI SDK

const app = express();
app.use(cors());
app.use(express.json());

// 1. Kết nối CSDL SQL của website
const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'freshgarden_db'
});

// 2. Khởi tạo AI (ví dụ Gemini / OpenAI)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// 3. API Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Bước 1: Trích xuất từ khóa hoặc truy vấn Database SQL
    // Ví dụ truy vấn bảng sản phẩm bánh theo tên hoặc danh mục
    const [products] = await dbPool.query(
      `SELECT name, price, description, stock 
       FROM products 
       WHERE is_active = 1 
       LIMIT 30`
    );

    // Bước 2: Chuẩn bị Prompt kèm dữ liệu SQL thực tế (RAG - Retrieval Augmented Generation)
    const systemPrompt = `
      Bạn là Trợ lý tư vấn bán hàng của tiệm Bánh Fresh Garden.
      Dưới đây là danh sách sản phẩm và giá mới nhất từ cơ sở dữ liệu:
      ${JSON.stringify(products)}

      Chính sách:
      - Đơn từ 300.000đ được miễn phí vận chuyển nội thành.
      - Hotline đặt bánh: 1900 2075.

      Hãy trả lời câu hỏi của khách hàng một cách thân thiện, chính xác theo dữ liệu trên.
      Nếu khách hỏi sản phẩm không có trong danh sách, hãy báo lịch sự và gợi ý sản phẩm tương tự.
    `;

    // Bước 3: Gửi ngữ cảnh và câu hỏi của khách lên AI
    const result = await model.generateContent([
      systemPrompt,
      `Khách hàng hỏi: "${message}"`
    ]);

    const reply = result.response.text();

    // Bước 4: Trả lời về cho chatbot.js
    res.json({ reply: reply });

  } catch (error) {
    console.error('Lỗi xử lý chatbot:', error);
    res.status(500).json({ 
      reply: 'Dạ hiện tại hệ thống đang bận một chút, bạn có thể gọi hotline 1900 2075 để được hỗ trợ ngay nhé!' 
    });
  }
});

app.listen(5000, () => {
  console.log('Chatbot Backend API đang chạy tại http://localhost:5000');
});
```

---

## 5. Các bảng SQL gợi ý cho hệ thống ChatBot

Để AI trả lời chính xác nhất về cửa hàng bánh, CSDL nên có các bảng:

1. **`products`**: `id`, `name`, `category_id`, `price`, `discount_price`, `size`, `description`, `stock_status`
2. **`categories`**: `id`, `name` (Bánh mì, Bánh kem, Bánh ngọt, Bánh sinh nhật, Bánh khô...)
3. **`stores`**: `id`, `address`, `district`, `city`, `phone`, `opening_hours`
4. **`promotions`**: `id`, `code`, `discount_percent`, `min_order_value`, `start_date`, `end_date`
