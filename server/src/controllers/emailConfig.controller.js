const { OK } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');
const sendMailForgotPasswordDAV = require('../utils/SendMail/sendMailForgotPasswordDAV');
const sendMailForgotPassword = require('../utils/SendMail/sendMailForgotPassword');
const fs = require('fs');
const path = require('path');

const ENV_FILE_PATH = path.resolve(__dirname, '../../.env');
const ALLOWED_ENV_KEYS = [
    'DAV_SMTP_HOST',
    'DAV_SMTP_PORT',
    'DAV_SMTP_USER',
    'DAV_SMTP_PASS',
    'DAV_EMAIL_FROM',
    'USER_EMAIL',
    'CLIENT_ID',
    'CLIENT_SECRET',
    'REDIRECT_URI',
    'REFRESH_TOKEN',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeEnvValue = (value) => String(value).replace(/\r?\n/g, ' ').trim();

const toEnvLine = (key, value) => `${key}="${value.replace(/"/g, '\\"')}"`;

const applyEnvUpdates = (updates) => {
    let envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');

    for (const [key, rawValue] of Object.entries(updates)) {
        if (!ALLOWED_ENV_KEYS.includes(key)) continue;

        const cleanValue = sanitizeEnvValue(rawValue);
        const line = toEnvLine(key, cleanValue);
        const keyRegex = new RegExp(`^${key}=.*$`, 'm');

        if (keyRegex.test(envContent)) {
            envContent = envContent.replace(keyRegex, line);
        } else {
            if (!envContent.endsWith('\n')) envContent += '\n';
            envContent += `${line}\n`;
        }

        process.env[key] = cleanValue;
    }

    fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf8');
};

class EmailConfigController {
    /**
     * Láº¥y thÃ´ng tin cáº¥u hÃ¬nh email hiá»‡n táº¡i
     */
    async getConfig(req, res) {
        try {
            const config = {
                davEmail: {
                    configured: !!(process.env.DAV_SMTP_HOST && process.env.DAV_SMTP_USER && process.env.DAV_SMTP_PASS),
                    host: process.env.DAV_SMTP_HOST || '',
                    port: process.env.DAV_SMTP_PORT || '587',
                    user: process.env.DAV_SMTP_USER || '',
                    emailFrom: process.env.DAV_EMAIL_FROM || '',
                    // KhÃ´ng tráº£ vá» password vÃ¬ lÃ½ do báº£o máº­t
                },
                gmail: {
                    configured: !!(
                        process.env.USER_EMAIL &&
                        process.env.CLIENT_ID &&
                        process.env.CLIENT_SECRET &&
                        process.env.REFRESH_TOKEN
                    ),
                    email: process.env.USER_EMAIL || '',
                    // KhÃ´ng tráº£ vá» cÃ¡c thÃ´ng tin nháº¡y cáº£m
                },
                activeMethod:
                    process.env.DAV_SMTP_HOST && process.env.DAV_SMTP_USER && process.env.DAV_SMTP_PASS
                        ? 'dav'
                        : 'gmail',
            };

            return res.status(200).json({
                message: 'Láº¥y cáº¥u hÃ¬nh email thÃ nh cÃ´ng',
                data: config,
            });
        } catch (error) {
            console.error('Lá»—i láº¥y config email:', error);
            throw new BadRequestError('KhÃ´ng thá»ƒ láº¥y cáº¥u hÃ¬nh email');
        }
    }

    /**
     * Cập nhật cấu hình email an toàn qua admin
     */
    async updateConfig(req, res) {
        try {
            const { davEmail = {}, gmail = {} } = req.body || {};
            const updates = {};

            if (typeof davEmail !== 'object' || typeof gmail !== 'object') {
                throw new BadRequestError('Dữ liệu cấu hình không hợp lệ');
            }

            if (davEmail.host !== undefined && davEmail.host !== '') {
                updates.DAV_SMTP_HOST = sanitizeEnvValue(davEmail.host);
            }

            if (davEmail.port !== undefined && davEmail.port !== '') {
                const port = Number(davEmail.port);
                if (!Number.isInteger(port) || port < 1 || port > 65535) {
                    throw new BadRequestError('Port SMTP không hợp lệ');
                }
                updates.DAV_SMTP_PORT = String(port);
            }

            if (davEmail.user !== undefined && davEmail.user !== '') {
                const user = sanitizeEnvValue(davEmail.user);
                if (!EMAIL_REGEX.test(user)) {
                    throw new BadRequestError('Email SMTP user không hợp lệ');
                }
                updates.DAV_SMTP_USER = user;
            }

            // Không cho phép clear secret bằng chuỗi rỗng để tránh mất cấu hình ngoài ý muốn
            if (davEmail.password !== undefined && davEmail.password !== '') {
                updates.DAV_SMTP_PASS = sanitizeEnvValue(davEmail.password);
            }

            if (davEmail.emailFrom !== undefined && davEmail.emailFrom !== '') {
                updates.DAV_EMAIL_FROM = sanitizeEnvValue(davEmail.emailFrom);
            }

            if (gmail.email !== undefined && gmail.email !== '') {
                const email = sanitizeEnvValue(gmail.email);
                if (!EMAIL_REGEX.test(email)) {
                    throw new BadRequestError('Email Gmail không hợp lệ');
                }
                updates.USER_EMAIL = email;
            }

            if (gmail.clientId !== undefined && gmail.clientId !== '') {
                updates.CLIENT_ID = sanitizeEnvValue(gmail.clientId);
            }

            if (gmail.clientSecret !== undefined && gmail.clientSecret !== '') {
                updates.CLIENT_SECRET = sanitizeEnvValue(gmail.clientSecret);
            }

            if (gmail.redirectUri !== undefined && gmail.redirectUri !== '') {
                updates.REDIRECT_URI = sanitizeEnvValue(gmail.redirectUri);
            }

            if (gmail.refreshToken !== undefined && gmail.refreshToken !== '') {
                updates.REFRESH_TOKEN = sanitizeEnvValue(gmail.refreshToken);
            }

            if (Object.keys(updates).length === 0) {
                throw new BadRequestError('Không có dữ liệu nào để cập nhật');
            }

            applyEnvUpdates(updates);

            return res.status(200).json({
                message: 'Cập nhật cấu hình email thành công',
                data: {
                    updatedKeys: Object.keys(updates),
                    secretsUpdated: {
                        davPassword: !!updates.DAV_SMTP_PASS,
                        gmailClientSecret: !!updates.CLIENT_SECRET,
                        gmailRefreshToken: !!updates.REFRESH_TOKEN,
                    },
                },
            });
        } catch (error) {
            console.error('Lỗi cập nhật config email:', error);
            return res.status(400).json({
                message: error.message || 'Không thể cập nhật cấu hình email',
                error: error.message,
            });
        }
    }

    /**
     * Test gá»­i email qua @dav.edu.vn
     */
    async testDavEmail(req, res) {
        try {
            const { testEmail } = req.body;

            if (!testEmail) {
                throw new BadRequestError('Vui lÃ²ng nháº­p email Ä‘á»ƒ test');
            }

            // Kiá»ƒm tra cáº¥u hÃ¬nh
            if (!process.env.DAV_SMTP_HOST || !process.env.DAV_SMTP_USER || !process.env.DAV_SMTP_PASS) {
                throw new BadRequestError('ChÆ°a cáº¥u hÃ¬nh email @dav.edu.vn trong file .env');
            }

            console.log('ðŸ§ª Test gá»­i email @dav.edu.vn Ä‘áº¿n:', testEmail);

            const testOTP = '123456';
            const result = await sendMailForgotPasswordDAV(testEmail, testOTP);

            if (result && result.success) {
                return res.status(200).json({
                    message: 'Gá»­i email test thÃ nh cÃ´ng! Vui lÃ²ng kiá»ƒm tra há»™p thÆ°.',
                    data: {
                        messageId: result.messageId,
                        from: process.env.DAV_EMAIL_FROM || process.env.DAV_SMTP_USER,
                        to: testEmail,
                    },
                });
            } else {
                throw new Error('KhÃ´ng thá»ƒ gá»­i email');
            }
        } catch (error) {
            console.error('âŒ Lá»—i test email @dav.edu.vn:', error);
            return res.status(400).json({
                message: 'Test email tháº¥t báº¡i: ' + error.message,
                error: error.message,
            });
        }
    }

    /**
     * Test gá»­i email qua Gmail
     */
    async testGmailEmail(req, res) {
        try {
            const { testEmail } = req.body;

            if (!testEmail) {
                throw new BadRequestError('Vui lÃ²ng nháº­p email Ä‘á»ƒ test');
            }

            // Kiá»ƒm tra cáº¥u hÃ¬nh
            if (
                !process.env.USER_EMAIL ||
                !process.env.CLIENT_ID ||
                !process.env.CLIENT_SECRET ||
                !process.env.REFRESH_TOKEN
            ) {
                throw new BadRequestError('ChÆ°a cáº¥u hÃ¬nh Gmail trong file .env');
            }

            console.log('ðŸ§ª Test gá»­i email Gmail Ä‘áº¿n:', testEmail);

            const testOTP = '123456';
            const result = await sendMailForgotPassword(testEmail, testOTP);

            if (result && result.success) {
                return res.status(200).json({
                    message: 'Gá»­i email test thÃ nh cÃ´ng! Vui lÃ²ng kiá»ƒm tra há»™p thÆ°.',
                    data: {
                        messageId: result.messageId,
                        from: process.env.USER_EMAIL,
                        to: testEmail,
                    },
                });
            } else {
                throw new Error('KhÃ´ng thá»ƒ gá»­i email');
            }
        } catch (error) {
            console.error('âŒ Lá»—i test email Gmail:', error);
            return res.status(400).json({
                message: 'Test email tháº¥t báº¡i: ' + error.message,
                error: error.message,
            });
        }
    }

    /**
     * Láº¥y thá»‘ng kÃª há»‡ thá»‘ng email
     */
    async getStats(req, res) {
        try {
            const isDavConfigured = !!(
                process.env.DAV_SMTP_HOST &&
                process.env.DAV_SMTP_USER &&
                process.env.DAV_SMTP_PASS
            );

            const isGmailConfigured = !!(
                process.env.USER_EMAIL &&
                process.env.CLIENT_ID &&
                process.env.CLIENT_SECRET &&
                process.env.REFRESH_TOKEN
            );

            const stats = {
                davEmail: {
                    status: isDavConfigured ? 'active' : 'inactive',
                    host: process.env.DAV_SMTP_HOST || 'ChÆ°a cáº¥u hÃ¬nh',
                    user: process.env.DAV_SMTP_USER || 'ChÆ°a cáº¥u hÃ¬nh',
                    recommendation: 'Khuyáº¿n nghá»‹ sá»­ dá»¥ng cho mÃ´i trÆ°á»ng production',
                },
                gmail: {
                    status: isGmailConfigured ? 'active' : 'inactive',
                    email: process.env.USER_EMAIL || 'ChÆ°a cáº¥u hÃ¬nh',
                    recommendation: 'Chá»‰ dÃ¹ng lÃ m backup hoáº·c development',
                },
                priority: isDavConfigured ? 'dav' : isGmailConfigured ? 'gmail' : 'none',
            };

            return res.status(200).json({
                message: 'Láº¥y thá»‘ng kÃª thÃ nh cÃ´ng',
                data: stats,
            });
        } catch (error) {
            console.error('Lá»—i láº¥y stats email:', error);
            throw new BadRequestError('KhÃ´ng thá»ƒ láº¥y thá»‘ng kÃª email');
        }
    }

    /**
     * HÆ°á»›ng dáº«n cáº¥u hÃ¬nh
     */
    async getGuide(req, res) {
        try {
            const guide = {
                davEmail: {
                    title: 'Cáº¥u hÃ¬nh Email @dav.edu.vn (Khuyáº¿n nghá»‹)',
                    steps: [
                        'LiÃªn há»‡ phÃ²ng IT Há»c viá»‡n: 024 3845 3736',
                        'YÃªu cáº§u thÃ´ng tin SMTP server',
                        'ThÃªm vÃ o file .env:',
                        'DAV_SMTP_HOST="mail.dav.edu.vn"',
                        'DAV_SMTP_PORT="587"',
                        'DAV_SMTP_USER="your-email@dav.edu.vn"',
                        'DAV_SMTP_PASS="your-password"',
                        'Restart server vÃ  test',
                    ],
                    advantages: [
                        'Email chÃ­nh thá»©c tá»« trÆ°á»ng',
                        'KhÃ´ng háº¿t háº¡n nhÆ° OAuth2',
                        'KhÃ´ng giá»›i háº¡n gá»­i email',
                        'ChuyÃªn nghiá»‡p vÃ  Ä‘Ã¡ng tin cáº­y',
                    ],
                },
                gmail: {
                    title: 'Cáº¥u hÃ¬nh Gmail OAuth2 (Backup)',
                    steps: [
                        'Truy cáº­p Google Cloud Console',
                        'Táº¡o OAuth2 Client ID',
                        'Enable Gmail API',
                        'Láº¥y Refresh Token tá»« OAuth Playground',
                        'ThÃªm vÃ o file .env',
                        'Restart server',
                    ],
                    limitations: [
                        'Refresh token háº¿t háº¡n thÆ°á»ng xuyÃªn',
                        'Giá»›i háº¡n 500 email/ngÃ y',
                        'Email tá»« @dav.edu.vn khÃ´ng chuyÃªn nghiá»‡p',
                    ],
                },
            };

            return res.status(200).json({
                message: 'HÆ°á»›ng dáº«n cáº¥u hÃ¬nh email',
                data: guide,
            });
        } catch (error) {
            console.error('Lá»—i láº¥y guide:', error);
            throw new BadRequestError('KhÃ´ng thá»ƒ láº¥y hÆ°á»›ng dáº«n');
        }
    }
}

module.exports = new EmailConfigController();
