# 📚 Hệ Thống Quản Lý Thư Viện

## 📋 Tổng quan dự án

Hệ thống quản lý thư viện hiện đại tích hợp AI Chatbot, cho phép quản lý sách, người dùng, đơn mượn và hỗ trợ tra cứu thông minh.

### Công nghệ sử dụng

#### Frontend

- **Framework**: React 18 + Vite
- **UI Library**: Ant Design
- **Styling**: Tailwind CSS + SASS
- **State Management**: Context API
- **Router**: React Router DOM

#### Backend

- **Framework**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + Cookie-based
- **AI**: Google Gemini API (RAG)
- **File Storage**: Cloudinary
- **Payment**: VNPay

## Kiến trúc hệ thống

- `client/`: ứng dụng React frontend
- `server/`: API Node.js/Express
- `docs/`: tài liệu kỹ thuật và hướng dẫn

## 🚀 Cài đặt và chạy local

### Yêu cầu

- Node.js >= 18
- MongoDB hoặc MongoDB Atlas
- npm

### 1. Cài dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` trong `server/` dựa trên `server/.env.example` và điền đầy đủ giá trị thật.

### 3. Chạy development

```bash
# Terminal 1
cd server
npm.cmd run dev

# Terminal 2
cd client
npm.cmd run dev
```

Mặc định frontend chạy ở `http://localhost:5173`.

## 🐳 Deploy bằng Docker

Dự án đã có sẵn:

- `docker-compose.yml`
- `server/Dockerfile`
- `client/Dockerfile`
- `client/nginx.conf`

### Chạy nhanh

```bash
docker compose build
docker compose up -d
```

## 🔐 Bảo mật

- Không commit file `.env`.
- Không lưu thông tin tài khoản/mật khẩu thật trong tài liệu.
- Thay toàn bộ mật khẩu mặc định trước khi đưa lên internet.

## 📁 Tài liệu

Xem thêm trong thư mục `docs/` và các tài liệu hướng dẫn ở thư mục gốc.

## 🛠 Scripts chính

### Server

```bash
npm run dev
npm run setup:indexes
npm run validate:setup
npm run benchmark
```

### Client

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## 📄 License

MIT License

---

**Dự án Thạc sĩ - Hệ thống Quản lý Thư viện**
