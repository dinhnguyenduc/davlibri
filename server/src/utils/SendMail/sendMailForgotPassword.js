require('dotenv').config();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// OAuth2 credentials from environment variables
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REFRESH_TOKEN, USER_EMAIL } = process.env;

// Initialize OAuth2 client
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

/**
 * Gửi email chứa mã OTP đặt lại mật khẩu
 * @param {string} recipientEmail - Email người nhận
 * @param {string} otp - Mã OTP
 */
const sendMailForgotPassword = async (recipientEmail, otp) => {
    try {
        console.log('🔄 Bắt đầu gửi email OTP...');
        console.log('📧 Email người nhận:', recipientEmail);
        console.log('🔢 OTP:', otp);
        console.log('👤 Email người gửi:', USER_EMAIL);

        // Validate environment variables
        if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !USER_EMAIL) {
            throw new Error('Thiếu cấu hình OAuth2. Vui lòng kiểm tra file .env');
        }

        const accessToken = await oAuth2Client.getAccessToken();
        console.log('✅ Lấy access token thành công');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: USER_EMAIL,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        // Verify transporter
        await transporter.verify();
        console.log('✅ Kết nối email server thành công');

        const mailOptions = {
            from: `"Thư viện Học viện Ngoại giao" <${USER_EMAIL}>`,
            to: recipientEmail,
            subject: '🔐 Mã OTP đặt lại mật khẩu - Thư viện Học viện Ngoại giao',
            text: `Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 15 phút.`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1890ff; margin: 0;">📚 Thư viện Học viện Ngoại giao</h2>
                        <p style="color: #555; font-size: 14px; margin: 5px 0;">Yêu cầu đặt lại mật khẩu</p>
                    </div>
                    <p>Xin chào <strong>${recipientEmail}</strong>,</p>
                    <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p><strong style="color: #ff4d4f;">⚠️ Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này và đổi mật khẩu ngay.</strong></p>
                    
                    <div style="background: #e6f7ff; border: 2px solid #1890ff; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Mã OTP của bạn:</p>
                        <div style="font-size: 32px; font-weight: bold; color: #1890ff; letter-spacing: 8px; font-family: monospace;">
                            ${otp}
                        </div>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Mã có hiệu lực trong 15 phút</p>
                    </div>

                    <div style="background: #fffbe6; border-left: 4px solid #faad14; padding: 12px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px;"><strong>💡 Lưu ý bảo mật:</strong></p>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">
                            <li>Không chia sẻ mã OTP với bất kỳ ai</li>
                            <li>Nhân viên thư viện không bao giờ yêu cầu mã OTP qua điện thoại</li>
                            <li>Kiểm tra kỹ URL trước khi nhập mã: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">localhost:5173</code></li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 14px;">Nếu bạn gặp sự cố, vui lòng liên hệ:</p>
                    <ul style="font-size: 14px; padding-left: 20px;">
                        <li>📧 Email: <a href="mailto:${USER_EMAIL}" style="color: #1890ff; text-decoration: none;">${USER_EMAIL}</a></li>
                        <li>📞 Hotline: 024 3845 3736</li>
                        <li>🏢 Địa chỉ: Học viện Ngoại giao, Hà Nội</li>
                    </ul>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
                    <p style="text-align: center; font-size: 12px; color: #999;">
                        Email này được gửi tự động, vui lòng không trả lời.<br>
                        © 2026 Thư viện Học viện Ngoại giao
                    </p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email đã gửi thành công!');
        console.log('📬 Message ID:', info.messageId);
        console.log('📨 Accepted:', info.accepted);
        console.log('❌ Rejected:', info.rejected);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ LỖI KHI GỬI EMAIL:');
        console.error('   Loại lỗi:', error.name);
        console.error('   Chi tiết:', error.message);
        console.error('   Stack:', error.stack);

        // Log thêm thông tin để debug
        if (error.code) {
            console.error('   Error code:', error.code);
        }
        if (error.response) {
            console.error('   Response:', error.response);
        }

        throw new Error(`Không thể gửi email: ${error.message}`);
    }
};

module.exports = sendMailForgotPassword;
