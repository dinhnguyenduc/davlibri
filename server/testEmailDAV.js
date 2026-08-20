/**
 * TEST GỬI EMAIL BẰNG SMTP SERVER HỌC VIỆN NGOẠI GIAO
 * Email @dav.edu.vn - Không cần OAuth2
 */

require('dotenv').config();
const sendMailForgotPasswordDAV = require('./src/utils/SendMail/sendMailForgotPasswordDAV');

console.log('\n🧪 BẮT ĐẦU TEST GỬI EMAIL OTP (SMTP @DAV.EDU.VN)\n');
console.log('='.repeat(70));

// Kiểm tra cấu hình
console.log('\n📋 Kiểm tra cấu hình SMTP:');
console.log('   SMTP Host:', process.env.DAV_SMTP_HOST || '❌ Thiếu');
console.log('   SMTP Port:', process.env.DAV_SMTP_PORT || '❌ Thiếu');
console.log('   SMTP User:', process.env.DAV_SMTP_USER || '❌ Thiếu');
console.log('   SMTP Pass:', process.env.DAV_SMTP_PASS ? '✅ Đã có' : '❌ Thiếu');
console.log('   Email From:', process.env.DAV_EMAIL_FROM || '❌ Thiếu');

console.log('\n' + '='.repeat(70));

async function testEmailDAV() {
    try {
        const testEmail = process.env.DAV_EMAIL_FROM || 'library@dav.edu.vn';
        const testOTP = '123456';

        console.log('\n📧 Gửi email test đến:', testEmail);

        const result = await sendMailForgotPasswordDAV(testEmail, testOTP);

        console.log('\n' + '='.repeat(70));
        console.log('\n✅ TEST THÀNH CÔNG!');
        console.log('   Message ID:', result.messageId);
        console.log('\n💡 Vui lòng kiểm tra email (kể cả thư mục Spam/Junk)');
        console.log('\n' + '='.repeat(70) + '\n');

        process.exit(0);
    } catch (error) {
        console.log('\n' + '='.repeat(70));
        console.log('\n❌ TEST THẤT BẠI!');
        console.log('   Lỗi:', error.message);

        console.log('\n💡 Các nguyên nhân có thể:');
        console.log('   1. Thông tin SMTP server chưa đúng');
        console.log('   2. Username/Password sai');
        console.log('   3. SMTP server yêu cầu kích hoạt tính năng gửi mail');
        console.log('   4. Firewall/Network blocking port SMTP');

        console.log('\n📖 Hướng dẫn cấu hình:');
        console.log('   Thêm vào file .env:');
        console.log('   DAV_SMTP_HOST="mail.dav.edu.vn"        # SMTP server của trường');
        console.log('   DAV_SMTP_PORT="587"                     # Port 587 (TLS) hoặc 465 (SSL)');
        console.log('   DAV_SMTP_USER="library@dav.edu.vn"     # Email đăng nhập');
        console.log('   DAV_SMTP_PASS="mật_khẩu_email"         # Mật khẩu email');
        console.log('   DAV_EMAIL_FROM="library@dav.edu.vn"    # Email người gửi');

        console.log('\n💡 Lưu ý:');
        console.log('   - Port 587: STARTTLS (phổ biến nhất)');
        console.log('   - Port 465: SSL/TLS');
        console.log('   - Port 25: Không mã hóa (không khuyến nghị)');
        console.log('   - Liên hệ IT của trường để lấy thông tin chính xác');

        console.log('\n' + '='.repeat(70) + '\n');

        process.exit(1);
    }
}

// Kiểm tra config trước khi chạy
if (!process.env.DAV_SMTP_HOST || !process.env.DAV_SMTP_USER || !process.env.DAV_SMTP_PASS) {
    console.log('\n⚠️  CHƯA CẤU HÌNH SMTP SERVER!\n');
    console.log('Vui lòng thêm vào file .env:');
    console.log('   DAV_SMTP_HOST="mail.dav.edu.vn"');
    console.log('   DAV_SMTP_PORT="587"');
    console.log('   DAV_SMTP_USER="library@dav.edu.vn"');
    console.log('   DAV_SMTP_PASS="mật_khẩu_email"');
    console.log('   DAV_EMAIL_FROM="library@dav.edu.vn"');
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
}

testEmailDAV();
