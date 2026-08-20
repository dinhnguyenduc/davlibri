const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'test' })
  .then(async () => {
    console.log(' Kết nối MongoDB thành công!');
    
    const User = mongoose.model('users', new mongoose.Schema({
      fullName: String,
      email: String,
      password: String,
      phone: String,
      role: String,
      isActive: Boolean
    }, { timestamps: true }));

    await User.deleteMany({ email: { $in: ['nguyenvana@dav.edu.vn', 'dinhnguyenduc1985@dav.edu.vn'] } });
    
    const users = await User.insertMany([
      {
        fullName: 'Nguyen Van A',
        email: 'nguyenvana@dav.edu.vn',
        password: '$2b$10$FoZlbfU/fBGxwYORC9Z1eOwcVNxRON8t5OLVVOV9fgYAdAr3qVHsG',
        phone: '0901234567',
        role: 'user',
        isActive: true
      },
      {
        fullName: 'Đinh Nguyên Đức',
        email: 'dinhnguyenduc1985@dav.edu.vn',
        password: '$2b$10$00XEgbAdTdxNqtFnLvFH6eEv4oms8FWp8zNm5DhDDX1Chqy3QnJUW',
        phone: '0901234567',
        role: 'admin',
        isActive: true
      }
    ]);

    console.log(' Đã tạo thành công 2 users!');
    console.log('User 1:', users[0].email, '- Role:', users[0].role);
    console.log('User 2:', users[1].email, '- Role:', users[1].role);
    console.log('Password cho cả 2: 123456');
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error(' Lỗi:', err);
    process.exit(1);
  });

