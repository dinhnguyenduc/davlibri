/**
 * TEST EMAIL SENDING
 * Chạy: node testEmailOTP.js
 */

require('dotenv').config();
const sendMailForgotPassword = require('./src/utils/SendMail/sendMailForgotPassword');

const testEmail = async () => {
    console.log('\n🧪 BẮT ĐẦU TEST GỬI EMAIL OTP\n');
    console.log('='.repeat(60));

    // Kiểm tra biến môi trường
    console.log('\n📋 Kiểm tra cấu hình:');
    console.log('   USER_EMAIL:', process.env.USER_EMAIL);
    console.log('   CLIENT_ID:', process.env.CLIENT_ID ? '✅ Đã có' : '❌ Thiếu');
    console.log('   CLIENT_SECRET:', process.env.CLIENT_SECRET ? '✅ Đã có' : '❌ Thiếu');
    console.log('   REFRESH_TOKEN:', process.env.REFRESH_TOKEN ? '✅ Đã có' : '❌ Thiếu');

    if (!process.env.USER_EMAIL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REFRESH_TOKEN) {
        console.error('\n❌ THIẾU CÁC BIẾN MÔI TRƯỜNG QUAN TRỌNG!');
        console.error('   Vui lòng kiểm tra file .env');
        process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📧 Gửi email test đến:', process.env.USER_EMAIL);

    try {
        const testOTP = '123456';
        const result = await sendMailForgotPassword(process.env.USER_EMAIL, testOTP);

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ TEST THÀNH CÔNG!');
        console.log('   Message ID:', result.messageId);
        console.log('\n💡 Vui lòng kiểm tra email (kể cả thư mục Spam/Junk)');
        console.log('   Email nhận: ' + process.env.USER_EMAIL);
        console.log('   OTP test: ' + testOTP);
        console.log('\n' + '='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.error('\n❌ TEST THẤT BẠI!');
        console.error('   Lỗi:', error.message);
        console.error('\n💡 Các nguyên nhân có thể:');
        console.error('   1. OAuth2 Refresh Token hết hạn');
        console.error('   2. Gmail API chưa được bật');
        console.error('   3. Cấu hình OAuth2 không đúng');
        console.error('   4. Mạng không ổn định');
        console.error('\n📖 Hướng dẫn khắc phục:');
        console.error('   - Kiểm tra: https://console.cloud.google.com/');
        console.error('   - Tạo lại Refresh Token tại: https://developers.google.com/oauthplayground');
        console.error('   - Đảm bảo Gmail API đã được bật');
        console.log('\n' + '='.repeat(60));

        process.exit(1);
    }
};

// Chạy test
testEmail();
