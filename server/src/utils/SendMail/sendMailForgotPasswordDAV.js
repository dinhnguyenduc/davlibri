require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * GỬI EMAIL BẰNG SMTP SERVER HỌC VIỆN NGOẠI GIAO
 * Sử dụng email @dav.edu.vn - Đơn giản, ổn định, không cần OAuth2
 */

// Cấu hình SMTP từ environment
const { DAV_SMTP_HOST, DAV_SMTP_PORT, DAV_SMTP_USER, DAV_SMTP_PASS, DAV_EMAIL_FROM } = process.env;

/**
 * Gửi email chứa mã OTP đặt lại mật khẩu
 * @param {string} recipientEmail - Email người nhận
 * @param {string} otp - Mã OTP
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
const sendMailForgotPasswordDAV = async (recipientEmail, otp) => {
    try {
        console.log('\n🔄 [DAV EMAIL] Bắt đầu gửi email OTP...');
        console.log('📧 Email người nhận:', recipientEmail);
        console.log('🔢 OTP:', otp);
        console.log('👤 Email người gửi:', DAV_EMAIL_FROM);

        // Validate environment variables
        if (!DAV_SMTP_HOST || !DAV_SMTP_PORT || !DAV_SMTP_USER || !DAV_SMTP_PASS || !DAV_EMAIL_FROM) {
            throw new Error('⚠️ Thiếu cấu hình SMTP. Vui lòng kiểm tra file .env (DAV_SMTP_*)');
        }

        console.log('📡 SMTP Server:', DAV_SMTP_HOST + ':' + DAV_SMTP_PORT);

        // Tạo transporter với SMTP server của trường
        const transporter = nodemailer.createTransport({
            host: DAV_SMTP_HOST,
            port: parseInt(DAV_SMTP_PORT),
            secure: parseInt(DAV_SMTP_PORT) === 465, // true for port 465, false for 587
            auth: {
                user: DAV_SMTP_USER,
                pass: DAV_SMTP_PASS,
            },
            tls: {
                // Không verify certificate nếu là self-signed
                rejectUnauthorized: false,
            },
        });

        console.log('🔌 Kiểm tra kết nối SMTP server...');

        // Verify SMTP connection
        await transporter.verify();
        console.log('✅ Kết nối SMTP server thành công!');

        // Email template
        const mailOptions = {
            from: DAV_EMAIL_FROM, // Office 365 yêu cầu from phải là email chính xác
            to: recipientEmail,
            subject: '🔐 Mã OTP đặt lại mật khẩu - Thư viện Học viện Ngoại giao',
            html: `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt lại mật khẩu</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">🏛️ Học viện Ngoại giao</h1>
                            <p style="color: #e0e7ff; margin: 5px 0 0 0; font-size: 14px;">Diplomatic Academy of Vietnam</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1e3a8a; margin-top: 0;">Đặt lại mật khẩu</h2>
                            <p style="color: #555; line-height: 1.6; font-size: 15px;">
                                Xin chào,<br><br>
                                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản thư viện của mình. 
                                Vui lòng sử dụng mã OTP dưới đây để tiếp tục:
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #3b82f6; padding: 25px; margin: 30px 0; text-align: center; border-radius: 8px;">
                                <p style="color: #1e3a8a; margin: 0 0 10px 0; font-size: 14px; font-weight: 600; letter-spacing: 1px;">MÃ OTP CỦA BẠN</p>
                                <p style="font-size: 36px; font-weight: bold; color: #1e3a8a; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                                <p style="color: #64748b; margin: 10px 0 0 0; font-size: 13px;">Mã có hiệu lực trong <strong>15 phút</strong></p>
                            </div>
                            
                            <!-- Warning -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                                    <strong>⚠️ Lưu ý bảo mật:</strong><br>
                                    • Không chia sẻ mã OTP với bất kỳ ai<br>
                                    • Kiểm tra kỹ địa chỉ website trước khi nhập<br>
                                    • Học viện Ngoại giao không bao giờ yêu cầu mật khẩu qua email
                                </p>
                            </div>
                            
                            <p style="color: #555; line-height: 1.6; font-size: 14px; margin-top: 20px;">
                                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 25px 30px; border-radius: 0 0 10px 10px; border-top: 1px solid #e2e8f0;">
                            <p style="color: #1e3a8a; margin: 0 0 10px 0; font-weight: 600; font-size: 14px;">📞 Liên hệ hỗ trợ:</p>
                            <p style="color: #64748b; margin: 5px 0; font-size: 13px;">
                                📧 Email: ${DAV_EMAIL_FROM}<br>
                                ☎️ Hotline: 024 3845 3736<br>
                                📍 Địa chỉ: 69 Chùa Láng, Đống Đa, Hà Nội
                            </p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                            <p style="color: #94a3b8; margin: 0; font-size: 12px; text-align: center;">
                                © 2026 Học viện Ngoại giao Việt Nam. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        };

        console.log('📨 Đang gửi email...');

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email đã gửi thành công!');
        console.log('📬 Message ID:', info.messageId);
        console.log('📨 Accepted:', info.accepted);
        console.log('❌ Rejected:', info.rejected);
        console.log('📊 Response:', info.response);

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error('\n❌ LỖI KHI GỬI EMAIL (DAV):');
        console.error('   Loại lỗi:', error.name);
        console.error('   Chi tiết:', error.message);
        console.error('   Stack:', error.stack);

        if (error.code) {
            console.error('   Error code:', error.code);
        }
        if (error.response) {
            console.error('   SMTP Response:', error.response);
        }
        if (error.command) {
            console.error('   SMTP Command:', error.command);
        }

        throw error;
    }
};

module.exports = sendMailForgotPasswordDAV;
