# 🧪 Test & Validation Scripts

Folder này chứa các script test, benchmark và validation cho hệ thống.

## 📁 Nội dung

### Chatbot & RAG Tests

- **benchmarkChatbot.js** - Benchmark hiệu suất chatbot
- **testGeminiRAG.js** - Test Gemini API với RAG

### Database Index Tests

- **checkIndexes.js** - Kiểm tra MongoDB indexes
- **checkTextIndexDetail.js** - Chi tiết text indexes
- **createTextIndexes.js** - Tạo text indexes

### Feature Tests

- **testCalculation.js** - Test tính toán phí thuê sách
- **testE2ECalculation.js** - Test end-to-end calculation
- **testCategoryList.js** - Test danh sách danh mục
- **testCategorySearch.js** - Test tìm kiếm theo danh mục

### Validation

- **validateSetup.js** - Validate cấu hình hệ thống

## 🚀 Cách chạy

```bash
# Từ thư mục server/
cd tests

# Chạy một test cụ thể
node testCalculation.js
node benchmarkChatbot.js

# Validate setup
node validateSetup.js
```

## 📝 Lưu ý

- Tất cả test cần file `.env` ở thư mục `server/`
- Một số test cần MongoDB connection
- Test files có thể import models từ `../src/models/`
