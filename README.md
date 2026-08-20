# ðŸ“š Há»‡ Thá»‘ng Quáº£n LÃ½ ThÆ° Viá»‡n

## ðŸ“‹ Tá»•ng quan dá»± Ã¡n

Há»‡ thá»‘ng quáº£n lÃ½ thÆ° viá»‡n hiá»‡n Ä‘áº¡i vá»›i AI Chatbot, cho phÃ©p quáº£n lÃ½ sÃ¡ch, ngÆ°á»i dÃ¹ng, Ä‘Æ¡n hÃ ng vÃ  cung cáº¥p há»— trá»£ tá»± Ä‘á»™ng thÃ´ng minh.

### CÃ´ng nghá»‡ sá»­ dá»¥ng

#### Frontend

- **Framework**: React 18.3 + Vite
- **UI Library**: Ant Design 5.26
- **Styling**: Tailwind CSS 4.1 + SASS
- **State Management**: Context API
- **Router**: React Router DOM 7.6
- **Icons**: Lucide React, React Icons

#### Backend

- **Framework**: Node.js + Express 5.1
- **Database**: MongoDB + Mongoose 8.16
- **Authentication**: JWT + Cookie-based
- **AI**: Google Gemini API (RAG implementation)
- **File Storage**: Cloudinary
- **Payment**: VNPay integration

### Kiáº¿n trÃºc há»‡ thá»‘ng

```
â”œâ”€â”€ client/                 # React frontend
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ Components/     # UI components
â”‚   â”‚   â”œâ”€â”€ Page/          # Pages & routes
â”‚   â”‚   â”œâ”€â”€ store/         # Context API
â”‚   â”‚   â””â”€â”€ utils/         # Helper functions
â”‚   â””â”€â”€ public/            # Static assets
â”‚
â””â”€â”€ server/                # Node.js backend
    â”œâ”€â”€ src/
    â”‚   â”œâ”€â”€ controllers/   # Business logic
    â”‚   â”œâ”€â”€ models/        # MongoDB schemas
    â”‚   â”œâ”€â”€ routes/        # API endpoints
    â”‚   â”œâ”€â”€ services/      # Services layer
    â”‚   â”œâ”€â”€ auth/          # Authentication
    â”‚   â””â”€â”€ utils/         # Utilities & AI
    â””â”€â”€ uploads/           # File uploads
```

---

## ðŸš€ CÃ i Ä‘áº·t vÃ  khá»Ÿi cháº¡y

### YÃªu cáº§u há»‡ thá»‘ng

- Node.js >= 18.x
- MongoDB >= 6.x
- npm hoáº·c yarn

### 1. Clone vÃ  cÃ i Ä‘áº·t dependencies

```bash
# Clone repository
cd "d:\LAP TRINH\Do an thac si\QLTV\Quáº£n lÃ½ thÆ° viá»‡n"

# CÃ i Ä‘áº·t server
cd server
npm install

# CÃ i Ä‘áº·t client
cd ../client
npm install
```

### 2. Cáº¥u hÃ¬nh mÃ´i trÆ°á»ng

Táº¡o file `.env` trong thÆ° má»¥c `server/`:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# VNPay
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret

# Email (Nodemailer)
EMAIL_USER=your_email@dav.edu.vn
EMAIL_PASS=your_app_password

# Server
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Setup Database Indexes (quan trá»ng!)

```bash
cd server

# Táº¡o text indexes cho tÃ¬m kiáº¿m
npm run setup:indexes

# Validate cáº¥u hÃ¬nh
npm run validate:setup
```

### 4. Khá»Ÿi cháº¡y á»©ng dá»¥ng

#### Development mode:

```bash
# Terminal 1 - Server (port 5000)
cd server
npm.cmd run dev

# Terminal 2 - Client (port 5173)
cd client
npm.cmd run dev
```

> Náº¿u dÃ¹ng PowerShell trÃªn Windows vÃ  gáº·p lá»—i `npm.ps1 cannot be loaded because running scripts is disabled`, hÃ£y dÃ¹ng `npm.cmd run dev` nhÆ° trÃªn. CÃ¡ch khÃ¡c lÃ  má»Ÿ Command Prompt thay vÃ¬ PowerShell.

#### Production build:

```bash
# Build client
cd client
npm run build

# Start server
cd ../server
node src/server.js
```

Truy cáº­p: http://localhost:5173

---

## âœ¨ TÃ­nh nÄƒng chÃ­nh

### ðŸ” Quáº£n lÃ½ ngÆ°á»i dÃ¹ng & phÃ¢n quyá»n

- **3 vai trÃ²**: Admin, Librarian (Thá»§ thÆ°), User
- ÄÄƒng kÃ½, Ä‘Äƒng nháº­p, quÃªn máº­t kháº©u (OTP qua email)
- Admin: toÃ n quyá»n quáº£n lÃ½
- Librarian: quáº£n lÃ½ module Ä‘Æ°á»£c chá»‰ Ä‘á»‹nh (categories, products, orders, coupons, deposits)
- User: sá»­ dá»¥ng dá»‹ch vá»¥ cÆ¡ báº£n

### ðŸ“š Quáº£n lÃ½ sÃ¡ch

- CRUD sÃ¡ch vá»›i upload áº£nh (Cloudinary)
- PhÃ¢n loáº¡i theo danh má»¥c
- TÃ¬m kiáº¿m nÃ¢ng cao (text search + filters)
- Quáº£n lÃ½ tá»“n kho vÃ  giÃ¡ thuÃª

### ðŸ›’ Giá» hÃ ng & ÄÆ¡n hÃ ng

- ThÃªm sÃ¡ch vÃ o giá»
- TÃ­nh toÃ¡n tá»± Ä‘á»™ng phÃ­ thuÃª theo ngÃ y
- Äáº·t cá»c vÃ  thanh toÃ¡n (VNPay)
- Theo dÃµi tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng

### ðŸ’¬ AI Chatbot vá»›i RAG (Retrieval-Augmented Generation)

- **TÃ­ch há»£p Google Gemini Flash (free tier)**
- Tráº£ lá»i cÃ¢u há»i vá» sÃ¡ch, giÃ¡, quy Ä‘á»‹nh
- **TÃ­nh nÄƒng thÃ´ng minh:**
    - TÃ­nh toÃ¡n chi phÃ­ thuÃª tá»± Ä‘á»™ng ("thuÃª 5 ngÃ y bao nhiÃªu?")
    - TÃ¬m kiáº¿m sÃ¡ch theo danh má»¥c
    - Liá»‡t kÃª danh má»¥c sÃ¡ch
    - Vector search trÃªn FAQ database
- **Tá»‘i Æ°u hÃ³a:**
    - Response caching (80% hit rate)
    - BM25 text indexing
    - -60% latency, -40% token usage
    - 100% miá»…n phÃ­ vá»›i free tier

### ðŸ’¬ Live Chat Support

- Há»— trá»£ trá»±c tuyáº¿n vá»›i thá»§ thÆ°
- Real-time chat (polling mechanism)
- Auto-assign librarian (first-come-first-serve)
- ÄÃ¡nh giÃ¡ cuá»™c trÃ² chuyá»‡n

### ðŸŽ« MÃ£ giáº£m giÃ¡

- Táº¡o vÃ  quáº£n lÃ½ coupon
- Giá»›i háº¡n sá»‘ láº§n sá»­ dá»¥ng
- TÃ­nh toÃ¡n giáº£m giÃ¡ tá»± Ä‘á»™ng

### ðŸ’° Quáº£n lÃ½ Ä‘áº·t cá»c

- Theo dÃµi Ä‘áº·t cá»c cá»§a ngÆ°á»i dÃ¹ng
- HoÃ n cá»c khi tráº£ sÃ¡ch

### â“ FAQ Management

- Quáº£n lÃ½ cÃ¢u há»i thÆ°á»ng gáº·p
- Import hÃ ng loáº¡t tá»« CSV/Excel
- TÃ¬m kiáº¿m vÃ  filter
- Chá»n nhiá»u & xÃ³a hÃ ng loáº¡t
- Infinite scroll

### ðŸ“Š Export dá»¯ liá»‡u

- Xuáº¥t Excel (XLSX, CSV, XLS)
- Export FAQ, Products, Orders, Users
- Filter trÆ°á»›c khi export

---

## ðŸ“– TÃ i liá»‡u chi tiáº¿t

Táº¥t cáº£ tÃ i liá»‡u Ä‘Ã£ Ä‘Æ°á»£c tá»• chá»©c trong thÆ° má»¥c `/docs`:

### ðŸ“ Features

- [Librarian Role Guide](docs/features/LIBRARIAN_ROLE_GUIDE.md) - HÆ°á»›ng dáº«n phÃ¢n quyá»n thá»§ thÆ°
- [Calculation Feature](docs/features/CALCULATION_FEATURE.md) - TÃ­nh toÃ¡n chi phÃ­ thuÃª
- [Category Features](docs/features/CATEGORY_FEATURES.md) - TÃ¬m kiáº¿m & liá»‡t kÃª danh má»¥c
- [FAQ Management](docs/features/FAQ_MANAGEMENT.md) - Quáº£n lÃ½ FAQ vá»›i import/export
- [Export Features](docs/features/EXPORT_GUIDE.md) - Xuáº¥t dá»¯ liá»‡u ra Excel

### ðŸš€ Optimization

- [Quick Start](docs/optimization/QUICK_START.md) - Setup nhanh trong 5 phÃºt
- [Optimization Guide](docs/optimization/OPTIMIZATION_GUIDE.md) - Tá»‘i Æ°u toÃ n diá»‡n
- [Performance Comparison](docs/optimization/COMPARISON.md) - So sÃ¡nh hiá»‡u suáº¥t

### ðŸ”§ Development

- [Software Analysis](docs/PHAN_TICH_PHAN_MEM.md) - PhÃ¢n tÃ­ch chi tiáº¿t há»‡ thá»‘ng
- [Test Guide](docs/TEST_GUIDE.md) - HÆ°á»›ng dáº«n test

---

## ðŸ§ª Testing & Validation

### Kiá»ƒm tra performance:

```bash
cd server

# Benchmark chatbot
npm run benchmark

# Test RAG
npm run test:rag

# Test calculation
npm run test:calculation
```

### Validation scripts:

```bash
# Kiá»ƒm tra indexes
node checkIndexes.js

# Validate setup
npm run validate:setup
```

---

## ðŸ“Š Performance Metrics

### Chatbot Optimization Results

| Metric              | Before | After   | Improvement  |
| ------------------- | ------ | ------- | ------------ |
| **Avg Latency**     | 2000ms | 800ms   | **-60%** âš¡  |
| **Cache Hit Rate**  | 0%     | 80%     | **+80%** ðŸŽ¯  |
| **Token Usage**     | 1500   | 900     | **-40%** ðŸ’°  |
| **Search Accuracy** | 60%    | 85%     | **+42%** âœ¨  |
| **Throughput**      | 30/min | 120/min | **+300%** ðŸš€ |

### Cost Analysis (30K requests/month)

- **Before**: 45M tokens â†’ Cáº§n paid plan âŒ
- **After**: 5.4M tokens â†’ Váº«n free tier âœ…
- **Savings**: 88% giáº£m â†’ **$0/month**

---

## ðŸŽ¯ TÃ i khoáº£n máº·c Ä‘á»‹nh

### ÄÄƒng nháº­p Admin táº¡i trang Login

- URL: http://localhost:5173/login
- Email: admin@dav.edu.vn
- Máº­t kháº©u: admin123

```javascript
// Admin account
email: 'admin@dav.edu.vn';
password: 'admin123';

// Librarian account (cÃ³ thá»ƒ táº¡o qua admin panel)
// Cáº¥p quyá»n: manage_categories, manage_products, etc.

// User account
// ÄÄƒng kÃ½ tá»± do qua trang Register
```

---

## ðŸ“ Scripts há»¯u Ã­ch

```bash
# Server scripts
npm run dev              # Start development server
npm run setup:indexes    # Create database indexes
npm run validate:setup   # Validate configuration
npm run benchmark        # Benchmark chatbot
npm run optimize         # Run full optimization

# Client scripts
npm run dev              # Start development
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

---

## ðŸ› ï¸ Troubleshooting

### Lá»—i: "text index not found"

```bash
cd server
npm run setup:indexes
```

### Lá»—i: Gemini API "503 overloaded"

- Sá»­ dá»¥ng response caching (Ä‘Ã£ tÃ­ch há»£p)
- Kiá»ƒm tra API key
- Xem: [docs/optimization/FIX_503_OVERLOADED.md](docs/optimization/FIX_503_OVERLOADED.md)

### MongoDB connection failed

- Kiá»ƒm tra `MONGO_URI` trong `.env`
- Äáº£m báº£o MongoDB Ä‘ang cháº¡y
- Whitelist IP trong MongoDB Atlas

### Port Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Hoáº·c Ä‘á»•i port trong .env
PORT=5001
```

---

## ðŸ”„ Cáº­p nháº­t & Báº£o trÃ¬

### Database migration

```bash
# Migrate user permissions
node server/migrateUserPermissions.js

# Create sample users
node server/createUsers.js

# Seed FAQ data
node server/seedFAQ.js
```

### Backup

- Export MongoDB: `mongodump --uri="your_connection_string"`
- Backup `.env` files
- Backup `uploads/` folder

---

## ðŸ“„ License

MIT License - Dá»± Ã¡n Tháº¡c sÄ©

---

## ðŸ‘¨â€ðŸ’» TÃ¡c giáº£

Dá»± Ã¡n Tháº¡c sÄ© - Há»‡ thá»‘ng Quáº£n lÃ½ ThÆ° viá»‡n

---

## ðŸ™ Credits

- **AI**: Google Gemini Flash
- **UI**: Ant Design
- **Icons**: Lucide React, React Icons
- **Database**: MongoDB
- **Deployment**: TBD

---

**ðŸŽ“ Dá»± Ã¡n Tháº¡c sÄ© - 2025**

