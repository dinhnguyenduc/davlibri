/**
 * SCRIPT MIGRATION: Chuyển dữ liệu từ database cũ sang library_db
 *
 * Hướng dẫn sử dụng:
 * 1. Đảm bảo file .env có MONGO_URI trỏ đến database CŨ (không có tên database)
 * 2. Chạy: node migrateToLibraryDB.js
 * 3. Script sẽ:
 *    - Kết nối đến database mặc định (database cũ)
 *    - Copy toàn bộ collections sang library_db
 *    - Giữ nguyên tất cả dữ liệu bao gồm đường dẫn hình ảnh
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Lấy URI từ .env (database cũ - không có tên database)
const sourceURI = process.env.MONGO_URI;

// Tạo URI cho database mới library_db
const targetURI = sourceURI.replace('mongodb.net/', 'mongodb.net/library_db');

console.log('🔄 BẮT ĐẦU MIGRATION');
console.log('📦 Source (DB cũ):', sourceURI.replace(/:[^:@]+@/, ':****@'));
console.log('🎯 Target (library_db):', targetURI.replace(/:[^:@]+@/, ':****@'));
console.log('');

// Collections cần migrate
const collectionsToMigrate = [
    'users',
    'products',
    'categories',
    'banners',
    'carts',
    'orders',
    'payments',
    'faqs',
    'chatbotconfigs',
    'apikeyconfigs',
];

async function migrateData() {
    let sourceConn, targetConn;

    try {
        // Kết nối đến database nguồn (cũ)
        console.log('🔌 Đang kết nối đến database cũ...');
        sourceConn = await mongoose.createConnection(sourceURI).asPromise();
        console.log('✅ Đã kết nối database cũ');

        // Lấy tên database thực tế
        const sourceDBName = sourceConn.db.databaseName;
        console.log(`📚 Database cũ: ${sourceDBName}`);
        console.log('');

        // Kết nối đến database đích (library_db)
        console.log('🔌 Đang kết nối đến library_db...');
        targetConn = await mongoose.createConnection(targetURI).asPromise();
        console.log('✅ Đã kết nối library_db');
        console.log('');

        // Migrate từng collection
        for (const collectionName of collectionsToMigrate) {
            try {
                console.log(`📋 Đang xử lý collection: ${collectionName}`);

                // Kiểm tra collection có tồn tại không
                const collections = await sourceConn.db.listCollections({ name: collectionName }).toArray();

                if (collections.length === 0) {
                    console.log(`   ⚠️  Collection "${collectionName}" không tồn tại trong DB cũ, bỏ qua...`);
                    continue;
                }

                // Lấy dữ liệu từ source
                const sourceCollection = sourceConn.db.collection(collectionName);
                const documents = await sourceCollection.find({}).toArray();

                if (documents.length === 0) {
                    console.log(`   ℹ️  Collection "${collectionName}" rỗng, bỏ qua...`);
                    continue;
                }

                // Xóa dữ liệu cũ trong target (nếu có)
                const targetCollection = targetConn.db.collection(collectionName);
                await targetCollection.deleteMany({});

                // Insert dữ liệu mới
                await targetCollection.insertMany(documents);

                console.log(`   ✅ Đã copy ${documents.length} documents từ "${collectionName}"`);
            } catch (err) {
                console.error(`   ❌ Lỗi khi migrate "${collectionName}":`, err.message);
            }
        }

        console.log('');
        console.log('🎉 HOÀN THÀNH MIGRATION!');
        console.log('');
        console.log('📝 BƯỚC TIẾP THEO:');
        console.log('1. Cập nhật file .env:');
        console.log('   MONGO_URI="...mongodb.net/library_db?appName=Cluster0"');
        console.log('');
        console.log('2. Khởi động lại server:');
        console.log('   npm start');
        console.log('');
        console.log('3. Kiểm tra hình ảnh hiển thị bình thường');
        console.log('');
    } catch (error) {
        console.error('❌ LỖI MIGRATION:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        // Đóng kết nối
        if (sourceConn) await sourceConn.close();
        if (targetConn) await targetConn.close();
        console.log('🔌 Đã đóng tất cả kết nối');
        process.exit(0);
    }
}

// Chạy migration
migrateData();
