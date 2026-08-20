const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const booksCollection = mongoose.connection.collection('books');
        const categoryCollection = mongoose.connection.collection('categories');

        // Find or create "Luật Quốc Tế" category
        let luatQuocTeCategory = await categoryCollection.findOne({ nameCategory: 'Luật quốc tế' });

        if (!luatQuocTeCategory) {
            const result = await categoryCollection.insertOne({
                nameCategory: 'Luật quốc tế',
                description: 'Sách về luật pháp quốc tế',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            luatQuocTeCategory = { _id: result.insertedId };
            console.log('✅ Created category:', luatQuocTeCategory._id);
        } else {
            console.log('✅ Found category:', luatQuocTeCategory._id);
        }

        // Check if UNCLOS book already exists
        const existingBook = await booksCollection.findOne({ isbn: '978-604-2-30015-8' });
        if (existingBook) {
            console.log('⚠️  UNCLOS book already exists, updating...');
            await booksCollection.deleteOne({ isbn: '978-604-2-30015-8' });
        }

        // Add UNCLOS book with rich content for RAG demo
        const unclosBook = {
            title: 'Công ước Liên Hợp Quốc về Luật Biển 1982 (UNCLOS)',
            author: 'Liên Hợp Quốc - Ban Biên Dịch Bộ Ngoại Giao Việt Nam',
            isbn: '978-604-2-30015-8',
            publisher: 'NXB Chính trị Quốc gia',
            publishingHouse: 'NXB Chính trị Quốc gia',
            publicationYear: 1982,
            category: luatQuocTeCategory._id.toString(),
            description: `📘 VĂN BẢN PHÁP QUY QUỐC TẾ - Công ước Liên Hợp Quốc về Luật Biển 1982 (UNCLOS - United Nations Convention on the Law of the Sea)

🌊 QUY ĐỊNH VỀ VÙNG ĐẶC QUYỀN KINH TẾ:
**Điều 57 - Chiều rộng của vùng đặc quyền kinh tế:**
"Vùng đặc quyền kinh tế (EEZ) không được mở rộng ra quá 200 hải lý tính từ đường cơ sở dùng để tính chiều rộng lãnh hải."

Trong vùng này, quốc gia ven biển có quyền chủ quyền nhằm mục đích thăm dò, khai thác, bảo tồn và quản lý tài nguyên thiên nhiên (cả sinh vật và phi sinh vật) của vùng nước bên trên đáy biển, của đáy biển và lòng đất dưới đáy biển, cũng như các hoạt động khác nhằm thăm dò và khai thác vùng này về mặt kinh tế.

🏝️ QUY ĐỊNH VỀ THỀM LỤC ĐỊA:
**Điều 76 - Định nghĩa thềm lục địa:**
"Thềm lục địa của một quốc gia ven biển bao gồm đáy biển và lòng đất dưới đáy biển bên ngoài lãnh hải của quốc gia đó, trên toàn bộ phần kéo dài tự nhiên của lãnh thổ đất liền của quốc gia đó cho đến bờ ngoài của rìa lục địa, hoặc đến khoảng cách 200 hải lý tính từ đường cơ sở dùng để tính chiều rộng của lãnh hải trong trường hợp bờ ngoài của rìa lục địa không chạy xa đến khoảng cách đó."

Quốc gia ven biển có quyền chủ quyền đối với thềm lục địa nhằm mục đích thăm dó và khai thác tài nguyên thiên nhiên của thềm lục địa.

📚 TÍNH CHẤT VĂN BẢN:
UNCLOS được coi là "Hiến pháp về biển và đại dương", đặt nền móng pháp lý cho mọi hoạt động hàng hải quốc tế, xác định quyền và nghĩa vụ của các quốc gia trong việc sử dụng biển, đại dương và tài nguyên biển.`,
            dailyRentalFee: 15000,
            securityDeposit: 150000,
            totalCopies: 8,
            availableCopies: 5,
            coverType: 'hardcover',
            location: 'Kệ 341.45 - Phòng đọc Luật',
            keywords: [
                'UNCLOS',
                'Công ước Luật Biển',
                'Luật Biển 1982',
                'thềm lục địa',
                'continental shelf',
                'vùng đặc quyền kinh tế',
                'EEZ',
                'lãnh hải',
                'Điều 57',
                'Điều 76',
                'chủ quyền biển',
                'tranh chấp biển đảo',
                'quy định về thềm lục địa',
                'tài liệu luật biển',
                'luật pháp quốc tế',
                'quyền chủ quyền',
                'khai thác tài nguyên biển',
            ],
            images: ['https://salt.tikicdn.com/cache/750x750/ts/product/unclos1982.jpg'],
            viewCount: 0,
            borrowCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await booksCollection.insertOne(unclosBook);
        console.log('✅ Added UNCLOS 1982 book successfully!');
        console.log('📚 Title:', unclosBook.title);
        console.log('📍 Location:', unclosBook.location);
        console.log('🔖 ISBN:', unclosBook.isbn);

        // Add Vietnam Maritime Law 2012
        const existingVNLaw = await booksCollection.findOne({ isbn: '978-604-2-30016-5' });
        if (existingVNLaw) {
            console.log('\n⚠️  Vietnam Maritime Law already exists, updating...');
            await booksCollection.deleteOne({ isbn: '978-604-2-30016-5' });
        }

        const vnMaritimeLaw = {
            title: 'Luật Biển Việt Nam',
            author: 'Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam',
            isbn: '978-604-2-30016-5',
            publisher: 'NXB Chính trị Quốc gia',
            publishingHouse: 'NXB Chính trị Quốc gia',
            publicationYear: 2012,
            category: luatQuocTeCategory._id.toString(),
            description: `📘 VĂN BẢN LUẬT VIỆT NAM - Luật Biển Việt Nam số 18/2012/QH13

Được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 21 tháng 6 năm 2012, có hiệu lực thi hành từ ngày 01 tháng 01 năm 2013.

🌊 QUY ĐỊNH VỀ VÙNG ĐẶC QUYỀN KINH TẾ:
**Điều 15 - Vùng đặc quyền kinh tế:**
"Vùng đặc quyền kinh tế là vùng biển tiếp liền và nằm ngoài lãnh hải Việt Nam, hợp với lãnh hải thành một vùng biển có chiều rộng 200 hải lý tính từ đường cơ sở."

Trong vùng đặc quyền kinh tế, Việt Nam có quyền chủ quyền, quyền tài phán và các quyền, nghĩa vụ khác theo quy định của Luật này, pháp luật Việt Nam và điều ước quốc tế mà Việt Nam là thành viên.

🏝️ QUY ĐỊNH VỀ THỀM LỤC ĐỊA:
**Điều 17 - Thềm lục địa:**
"Thềm lục địa Việt Nam là đáy biển và lòng đất dưới đáy biển, tiếp liền và nằm ngoài lãnh hải Việt Nam, trên toàn bộ phần kéo dài tự nhiên của lãnh thổ đất liền, kể cả rìa lục địa ngoài của Việt Nam đến khoảng cách 200 hải lý tính từ đường cơ sở, hoặc xa hơn theo quy định của Công ước Liên Hợp Quốc về Luật Biển năm 1982 và pháp luật Việt Nam."

Việt Nam có quyền chủ quyền đối với thềm lục địa nhằm mục đích thăm dò và khai thác tài nguyên thiên nhiên.

📚 Ý NGHĨA:
Luật Biển Việt Nam cụ thể hóa các quy định của UNCLOS 1982 vào pháp luật quốc gia, xác định rõ chủ quyền và quyền tài phán của Việt Nam trên các vùng biển.`,
            dailyRentalFee: 15000,
            securityDeposit: 150000,
            totalCopies: 6,
            availableCopies: 4,
            coverType: 'hardcover',
            location: 'Thư viện Luật - Kệ 348.597',
            keywords: [
                'Luật Biển Việt Nam',
                'Luật 18/2012/QH13',
                'vùng đặc quyền kinh tế Việt Nam',
                'EEZ Việt Nam',
                'Điều 15',
                'thềm lục địa Việt Nam',
                'Điều 17',
                'chủ quyền biển Việt Nam',
                'luật biển 2012',
                'đường cơ sở Việt Nam',
                '200 hải lý',
                'so sánh với UNCLOS',
                'luật pháp Việt Nam',
            ],
            images: ['https://salt.tikicdn.com/cache/750x750/ts/product/vn-maritime-law.jpg'],
            viewCount: 0,
            borrowCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await booksCollection.insertOne(vnMaritimeLaw);
        console.log('\n✅ Added Vietnam Maritime Law 2012 successfully!');
        console.log('📚 Title:', vnMaritimeLaw.title);
        console.log('📍 Location:', vnMaritimeLaw.location);
        console.log('🔖 ISBN:', vnMaritimeLaw.isbn);

        console.log('\n✨ Both books are ready for RAG comparison demo!');
        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
