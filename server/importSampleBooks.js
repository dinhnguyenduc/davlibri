// Script để import 10 quyển sách mẫu từ sampleBooks.json vào database
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Book = require('./src/models/books.model');
const Category = require('./src/models/category.model');

// Kết nối MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
        console.log('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Đọc dữ liệu từ file JSON
const sampleBooksPath = path.join(__dirname, 'sampleBooks.json');
const sampleBooks = JSON.parse(fs.readFileSync(sampleBooksPath, 'utf-8'));

// Danh sách các category cần tạo (nếu chưa có)
const categories = [
    { nameCategory: 'Quan hệ quốc tế', codeCategory: 'QHQT' },
    { nameCategory: 'Lịch sử ngoại giao', codeCategory: 'LSNG' },
    { nameCategory: 'Kinh tế quốc tế', codeCategory: 'KTQT' },
    { nameCategory: 'Luật quốc tế', codeCategory: 'LQQT' },
    { nameCategory: 'Chính trị học', codeCategory: 'CTH' },
    { nameCategory: 'Hợp tác quốc tế', codeCategory: 'HTQT' },
    { nameCategory: 'Địa chính trị', codeCategory: 'DCT' },
    { nameCategory: 'An ninh quốc tế', codeCategory: 'ANQT' },
    { nameCategory: 'Kỹ năng ngoại giao', codeCategory: 'KNNG' },
];

async function importBooks() {
    try {
        console.log('🚀 Bắt đầu import sách...\n');

        // Bước 1: Tạo categories nếu chưa có
        console.log('📁 Kiểm tra và tạo danh mục...');
        const categoryMap = {};

        for (const cat of categories) {
            let category = await Category.findOne({ nameCategory: cat.nameCategory });
            if (!category) {
                category = await Category.create(cat);
                console.log(`   ✅ Tạo mới danh mục: ${cat.nameCategory}`);
            } else {
                console.log(`   ℹ️  Danh mục đã tồn tại: ${cat.nameCategory}`);
            }
            categoryMap[cat.nameCategory] = category._id;
        }

        console.log('\n📚 Bắt đầu import sách...\n');

        let successCount = 0;
        let skipCount = 0;

        for (const bookData of sampleBooks) {
            try {
                // Kiểm tra sách đã tồn tại chưa (theo ISBN)
                const existingBook = await Book.findOne({ isbn: bookData.isbn });

                if (existingBook) {
                    console.log(`   ⚠️  Sách đã tồn tại: "${bookData.title}" (ISBN: ${bookData.isbn})`);
                    skipCount++;
                    continue;
                }

                // Lấy category ID từ map
                const categoryId = categoryMap[bookData.category];
                if (!categoryId) {
                    console.log(`   ❌ Không tìm thấy category: ${bookData.category}`);
                    continue;
                }

                // Chuyển đổi coverType từ tiếng Việt sang enum
                let coverType = 'paperback';
                if (bookData.coverType === 'Bìa cứng') {
                    coverType = 'hardcover';
                }

                // Tạo embedding giả (768 dimensions) - sẽ được AI tạo lại sau
                const dummyEmbedding = new Array(768).fill(0);

                // Tạo dữ liệu sách với cấu trúc phù hợp với model
                const newBook = {
                    title: bookData.title,
                    author: bookData.author,
                    isbn: bookData.isbn,
                    publisher: bookData.publisher, // Thêm trường publisher (bắt buộc)
                    publishingHouse: bookData.publisher, // Thêm trường publishingHouse (bắt buộc)
                    publicationYear: bookData.publicationYear,
                    category: categoryId,
                    description: bookData.description,
                    dailyRentalFee: bookData.dailyRentalFee,
                    securityDeposit: bookData.securityDeposit,
                    totalCopies: bookData.totalCopies,
                    availableCopies: bookData.availableCopies,
                    coverType: coverType, // Sử dụng enum: paperback hoặc hardcover
                    location: bookData.location,
                    keywords: bookData.keywords,
                    images: bookData.images,
                    viewCount: bookData.viewCount || 0,
                    borrowCount: bookData.borrowCount || 0,
                    isActive: true,
                    displayOrder: 0,
                    embedding: dummyEmbedding, // Embedding tạm thời (768 số 0)
                };

                // Tạo sách mới
                const createdBook = await Book.create(newBook);
                console.log(`   ✅ Import thành công: "${createdBook.title}"`);
                successCount++;
            } catch (error) {
                console.log(`   ❌ Lỗi khi import "${bookData.title}":`, error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 KẾT QUẢ IMPORT:');
        console.log(`   ✅ Thành công: ${successCount} sách`);
        console.log(`   ⚠️  Bỏ qua: ${skipCount} sách (đã tồn tại)`);
        console.log(`   ❌ Lỗi: ${sampleBooks.length - successCount - skipCount} sách`);
        console.log('='.repeat(60) + '\n');

        console.log('🎉 Hoàn thành import dữ liệu!');
        console.log('💡 Bây giờ bạn có thể truy cập trang chủ để xem sách mới.\n');
    } catch (error) {
        console.error('❌ Lỗi trong quá trình import:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Đã đóng kết nối MongoDB');
        process.exit(0);
    }
}

// Chạy import
importBooks();
