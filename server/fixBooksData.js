const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const booksCollection = mongoose.connection.collection('books');
        const categoryCollection = mongoose.connection.collection('categories');

        // 1. Tìm category 'Luật quốc tế' hoặc tạo nếu chưa có
        let luatQuocTeCategory = await categoryCollection.findOne({ nameCategory: 'Luật quốc tế' });

        if (!luatQuocTeCategory) {
            // Tạo category mới
            const result = await categoryCollection.insertOne({
                nameCategory: 'Luật quốc tế',
                description: 'Sách về luật pháp quốc tế',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            luatQuocTeCategory = { _id: result.insertedId, nameCategory: 'Luật quốc tế' };
            console.log('✅ Tạo category mới:', luatQuocTeCategory._id);
        } else {
            console.log('✅ Tìm thấy category:', luatQuocTeCategory._id);
        }

        // 2. Xóa 4 quyển sách cũ (lỗi category string)
        const isbnList = ['978-604-2-30011-0', '978-604-2-30012-7', '978-604-2-30013-4', '978-604-2-30014-1'];
        const deleteResult = await booksCollection.deleteMany({ isbn: { $in: isbnList } });
        console.log('🗑️  Xóa', deleteResult.deletedCount, 'quyển sách cũ');

        // 3. Thêm lại 4 quyển sách với category ObjectId
        const newBooks = [
            {
                title: 'Giáo Trình Luật Quốc Tế',
                author: 'Đại học Luật Hà Nội',
                isbn: '978-604-2-30011-0',
                publisher: 'NXB Giáo dục Việt Nam',
                publishingHouse: 'NXB Giáo dục Việt Nam',
                publicationYear: 2023,
                category: luatQuocTeCategory._id.toString(),
                description:
                    'Tài liệu nền tảng nhất tại Việt Nam, cung cấp cái nhìn tổng quan về chủ thể, lãnh thổ, dân cư và cách thức giải quyết tranh chấp quốc tế.',
                dailyRentalFee: 12000,
                securityDeposit: 120000,
                totalCopies: 25,
                availableCopies: 18,
                coverType: 'hardcover',
                location: 'Kệ LP1 - Tầng 2',
                keywords: ['luật quốc tế', 'pháp lý', 'chủ quyền', 'tranh chấp quốc tế', 'lãnh thổ'],
                images: ['https://placeholder.com/luatquoctế.jpg'],
                viewCount: 0,
                borrowCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: 'Luật Điều Ước Quốc Tế',
                author: 'Tác giả múiple',
                isbn: '978-604-2-30012-7',
                publisher: 'NXB Chính trị Quốc gia Sự thật',
                publishingHouse: 'NXB Chính trị Quốc gia Sự thật',
                publicationYear: 2022,
                category: luatQuocTeCategory._id.toString(),
                description:
                    'Tập trung vào quy trình ký kết, gia nhập và thực thi các cam kết quốc tế, một phần không thể thiếu trong quản lý quan hệ đối ngoại.',
                dailyRentalFee: 10000,
                securityDeposit: 100000,
                totalCopies: 15,
                availableCopies: 11,
                coverType: 'paperback',
                location: 'Kệ LP2 - Tầng 2',
                keywords: ['điều ước quốc tế', 'ký kết', 'cam kết', 'quan hệ đối ngoại', 'pháp lý'],
                images: ['https://placeholder.com/dieuthucquoctế.jpg'],
                viewCount: 0,
                borrowCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: 'Công Ước Liên Hợp Quốc về Luật Biển 1982 và Luật Biển Việt Nam',
                author: 'Liên Hợp Quốc / Chính phủ Việt Nam',
                isbn: '978-604-2-30013-4',
                publisher: 'NXB Chính trị Quốc gia',
                publishingHouse: 'NXB Chính trị Quốc gia',
                publicationYear: 2023,
                category: luatQuocTeCategory._id.toString(),
                description:
                    'Cuốn sách giúp hệ thống hóa các quy định quốc tế và cách Việt Nam nội địa hóa chúng thông qua Luật Biển Việt Nam năm 2012.',
                dailyRentalFee: 12000,
                securityDeposit: 120000,
                totalCopies: 12,
                availableCopies: 8,
                coverType: 'hardcover',
                location: 'Kệ LB1 - Tầng 3',
                keywords: ['luật biển', 'UNCLOS', 'chủ quyền', 'vùng kinh tế', 'công ước quốc tế'],
                images: ['https://placeholder.com/luatbiên.jpg'],
                viewCount: 0,
                borrowCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: 'Tranh Chấp Biển Đông Dưới Ánh Sáng Luật Pháp Quốc Tế',
                author: 'Nhiều tác giả',
                isbn: '978-604-2-30014-1',
                publisher: 'NXB Tri thức',
                publishingHouse: 'NXB Tri thức',
                publicationYear: 2023,
                category: luatQuocTeCategory._id.toString(),
                description:
                    'Tập hợp các bài phân tích về khía cạnh pháp lý của các tuyên bố chủ quyền, vai trò của UNCLOS trong việc duy trì hòa bình.',
                dailyRentalFee: 11000,
                securityDeposit: 110000,
                totalCopies: 14,
                availableCopies: 10,
                coverType: 'paperback',
                location: 'Kệ LB2 - Tầng 3',
                keywords: ['tranh chấp biển', 'biển đông', 'luật pháp', 'chủ quyền', 'UNCLOS'],
                images: ['https://placeholder.com/biênđông.jpg'],
                viewCount: 0,
                borrowCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const insertResult = await booksCollection.insertMany(newBooks);
        console.log('✅ Thêm', insertResult.insertedCount, 'quyển sách mới (với category ObjectId đúng)');

        console.log('\n✨ Hoàn thành! Dữ liệu đã được sửa.');
        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Lỗi:', e.message);
        process.exit(1);
    }
})();
