const modelUser = require('../models/users.model');
const modelApiKey = require('../models/apiKey.model');
const modelCategory = require('../models/category.model');
const modelOtp = require('../models/otp.model');
const Book = require('../models/books.model');
const Payment = require('../models/payments.model');
const ViewBook = require('../models/viewBook.model');
const LoginAttemptConfig = require('../models/loginAttemptConfig.model');

const { BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');

const cloudinary = require('../utils/configCloudDinary');

const { createToken, createRefreshToken, createApiKey, verifyToken } = require('../services/tokenServices');
const sendMailForgotPassword = require('../utils/SendMail/sendMailForgotPassword');
const sendMailForgotPasswordDAV = require('../utils/SendMail/sendMailForgotPasswordDAV');

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const fs = require('fs/promises');
const otpGenerator = require('otp-generator');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

function getPublicId(url) {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1) {
        throw new Error('Invalid Cloudinary URL');
    }

    const pathParts = parts.slice(uploadIndex + 1);
    const pathWithoutVersion = pathParts[0].startsWith('v') ? pathParts.slice(1) : pathParts;
    const publicIdWithExt = pathWithoutVersion.join('/');
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

    return publicId;
}

function generateTemporaryPassword(length = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const bytes = crypto.randomBytes(length);
    let password = '';

    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
    }

    return password;
}

const validateAccountEmail = (email, allowDigits = false) => {
    const normalizedEmail = String(email || '')
        .trim()
        .toLowerCase();
    const emailPattern = allowDigits
        ? /^[a-z][a-z0-9._-]*@[a-z0-9.-]+\.[a-z]{2,}$/
        : /^[a-z][a-z._-]*@[a-z.-]+\.[a-z]{2,}$/;

    if (!emailPattern.test(normalizedEmail)) {
        throw new BadRequestError(
            allowDigits
                ? 'Email tài khoản quản trị viên không hợp lệ'
                : 'Email tài khoản user/thủ thư chỉ dùng chữ không dấu và không được có số',
        );
    }

    return normalizedEmail;
};

class usersController {
    async register(req, res) {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password || !phone) {
            throw new BadRequestError('Vui lòng nhập đày đủ thông tin');
        }
        const normalizedEmail = validateAccountEmail(email);
        const user = await modelUser.findOne({ email: normalizedEmail });
        if (user) {
            throw new BadRequestError('Người dùng đã tồn tại');
        } else {
            const saltRounds = 10;
            const salt = bcrypt.genSaltSync(saltRounds);
            const passwordHash = bcrypt.hashSync(password, salt);
            const newUser = await modelUser.create({
                fullName,
                email: normalizedEmail,
                password: passwordHash,
                phone,
            });
            await newUser.save();
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });
            res.cookie('token', token, {
                httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: process.env.NODE_ENV === 'production', // Chỉ gửi trên HTTPS khi production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 15 * 60 * 1000, // 15 phút
            });

            res.cookie('logged', 1, {
                httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: process.env.NODE_ENV === 'production', // Chỉ gửi trên HTTPS khi production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });

            // Đặt cookie HTTP-Only cho refreshToken (tùy chọn)
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            new Created({ message: 'Đăng ký thành công', metadata: { token, refreshToken } }).send(res);
        }
    }

    async login(req, res) {
        const { email, password } = req.body;

        const findUser = await modelUser.findOne({ email });

        if (!findUser) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác !!!');
        }

        // Lấy cấu hình giới hạn đăng nhập
        const config = await LoginAttemptConfig.findOne();
        const isLoginAttemptLimitEnabled =
            config && config.enabled && process.env.DISABLE_LOGIN_ATTEMPT_LIMIT !== 'true';

        // Kiểm tra xem tài khoản có bị khóa không
        if (isLoginAttemptLimitEnabled && findUser.lockedUntil && findUser.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((findUser.lockedUntil - new Date()) / 1000 / 60);
            throw new BadRequestError(
                `Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`,
            );
        }

        // Kiểm tra mật khẩu
        const result = await bcrypt.compare(password, findUser.password);

        if (!result) {
            // Đăng nhập sai
            if (isLoginAttemptLimitEnabled) {
                findUser.loginAttempts = (findUser.loginAttempts || 0) + 1;
                findUser.lastFailedLogin = new Date();

                // Check nếu vượt quá số lần cho phép
                if (findUser.loginAttempts >= config.maxAttempts) {
                    findUser.lockedUntil = new Date(Date.now() + config.lockDuration * 60 * 1000);
                    await findUser.save();
                    throw new BadRequestError(
                        `Bạn đã đăng nhập sai ${config.maxAttempts} lần. Tài khoản bị khóa trong ${config.lockDuration} phút.`,
                    );
                }

                await findUser.save();
                const remainingAttempts = config.maxAttempts - findUser.loginAttempts;
                throw new BadRequestError(
                    `Tài khoản hoặc mật khẩu không chính xác !!! Còn ${remainingAttempts} lần thử.`,
                );
            }

            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác !!!');
        }

        // Đăng nhập thành công - Reset số lần đăng nhập sai
        if (findUser.loginAttempts > 0 || findUser.lockedUntil) {
            findUser.loginAttempts = 0;
            findUser.lockedUntil = null;
            findUser.lastFailedLogin = null;
            await findUser.save();
        }

        if (result) {
            await createApiKey(findUser._id);
            const token = await createToken({ id: findUser._id });
            const refreshToken = await createRefreshToken({ id: findUser._id });
            res.cookie('token', token, {
                httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: process.env.NODE_ENV === 'production', // Chỉ gửi trên HTTPS khi production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 15 * 60 * 1000, // 15 phút
            });

            res.cookie('logged', 1, {
                httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: process.env.NODE_ENV === 'production', // Chỉ gửi trên HTTPS khi production
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });

            // Đặt cookie HTTP-Only cho refreshToken (tùy chọn)
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            new OK({
                message: findUser.mustChangePassword
                    ? 'Đăng nhập thành công. Vui lòng đổi mật khẩu ở lần đăng nhập đầu tiên.'
                    : 'Đăng nhập thành công',
                metadata: {
                    token,
                    refreshToken,
                    mustChangePassword: !!findUser.mustChangePassword,
                },
            }).send(res);
        }
    }

    async authUser(req, res) {
        const user = req.user;
        const findUser = await modelUser.findOne({ _id: user.id });
        if (!findUser) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        const userString = JSON.stringify(findUser);
        const auth = CryptoJS.AES.encrypt(userString, process.env.SECRET_CRYPTO).toString();
        new OK({ message: 'success', metadata: { auth } }).send(res);
    }

    async refreshToken(req, res) {
        const refreshToken = req.cookies.refreshToken;
        const decoded = await verifyToken(refreshToken);
        const user = await modelUser.findById(decoded.id);
        const token = await createToken({ id: user._id });
        res.cookie('token', token, {
            httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
            secure: process.env.NODE_ENV === 'production', // Chỉ gửi trên HTTPS khi production
            sameSite: 'Strict', // Chống tấn công CSRF
            maxAge: 15 * 60 * 1000, // 15 phút
        });

        res.cookie('logged', 1, {
            httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict', // Chống tấn công CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        new OK({ message: 'Refresh token thành công', metadata: { token } }).send(res);
    }

    async logout(req, res) {
        const { id } = req.user;
        await modelApiKey.deleteOne({ userId: id });
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        res.clearCookie('logged');

        new OK({ message: 'Đăng xuất thành công' }).send(res);
    }

    async updateUser(req, res) {
        const { id } = req.user;
        const { fullName, phone, address } = req.body;
        const updateUser = await modelUser.findByIdAndUpdate(id, { fullName, phone, address }, { new: true });
        if (!updateUser) {
            throw new BadRequestError('Cập nhật thông tin thất bại');
        }
        new OK({ message: 'Cập nhật thông tin thành công' }).send(res);
    }

    async updatePassword(req, res) {
        const { id } = req.user;
        const { oldPassword, newPassword } = req.body;
        const findUser = await modelUser.findById(id);
        if (!findUser) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        const result = await bcrypt.compare(oldPassword, findUser.password);
        if (!result) {
            throw new BadRequestError('Mật khẩu cũ không chính xác');
        }
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        const updateUser = await modelUser.findByIdAndUpdate(
            id,
            { password: passwordHash, mustChangePassword: false },
            { new: true },
        );
        if (!updateUser) {
            throw new BadRequestError('Cập nhật mật khẩu thất bại');
        }
        new OK({ message: 'Cập nhật mật khẩu thành công' }).send(res);
    }

    async uploadAvatar(req, res, next) {
        const { id } = req.user;
        const file = req.file;
        if (!file) {
            throw new BadRequestError('Vui lòng chọn ảnh đại diện');
        }
        const findUser = await modelUser.findById(id);
        if (findUser.avatar === 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png') {
            const result = await cloudinary.uploader.upload(file.path);
            await fs.unlink(file.path);
            const updateUser = await modelUser.findByIdAndUpdate(id, { avatar: result.secure_url }, { new: true });
            if (!updateUser) {
                throw new BadRequestError('Cập nhật ảnh đại diện thất bại');
            }
            new OK({ message: 'Cập nhật ảnh đại diện thành công' }).send(res);
        } else {
            const publicId = getPublicId(findUser.avatar);
            await cloudinary.uploader.destroy(publicId);
            const result = await cloudinary.uploader.upload(file.path);
            await fs.unlink(file.path);
            const updateUser = await modelUser.findByIdAndUpdate(id, { avatar: result.secure_url }, { new: true });
            if (!updateUser) {
                throw new BadRequestError('Cập nhật ảnh đại diện thất bại');
            }
            new OK({ message: 'Cập nhật ảnh đại diện thành công' }).send(res);
        }
    }

    async getUsers(req, res) {
        const users = await modelUser.find();
        new OK({ message: 'Lấy danh sách người dùng thành công', metadata: users }).send(res);
    }

    async updateRoleUser(req, res) {
        const { userId, role, permissions } = req.body;

        const updateData = {};
        const currentUser = await modelUser.findById(userId).select('email');
        if (!currentUser) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        if (role !== '1') {
            validateAccountEmail(currentUser.email);
        }

        // Cập nhật role
        if (role === '1') {
            updateData.role = 'admin';
            updateData.permissions = []; // Admin không cần permissions riêng
        } else if (role === 'librarian') {
            updateData.role = 'librarian';
            // Cập nhật permissions nếu có
            if (permissions && Array.isArray(permissions)) {
                updateData.permissions = permissions;
            }
        } else {
            updateData.role = 'user';
            updateData.permissions = []; // User không có permissions
        }

        const updateUser = await modelUser.findByIdAndUpdate({ _id: userId }, updateData, { new: true });

        if (!updateUser) {
            throw new BadRequestError('Cập nhật vai trò người dùng thất bại');
        }

        new OK({ message: 'Cập nhật vai trò người dùng thành công' }).send(res);
    }

    async getDashboard(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Prepare date filters
            const dateFilter = {};
            if (startDate) {
                dateFilter.createdAt = { $gte: new Date(startDate) };
            }
            if (endDate) {
                dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate + 'T23:59:59.999Z') };
            }

            // 1. Get statistics
            const [totalUsers, totalProducts, totalRevenue, totalWatching] = await Promise.all([
                modelUser.countDocuments(),
                Book.countDocuments(),
                Payment.aggregate([
                    { $match: { status: { $in: ['completed', 'delivered'] }, ...dateFilter } },
                    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
                ]).then((result) => (result.length > 0 ? result[0].total : 0)),
                ViewBook.countDocuments(),
            ]);

            // 2. Get recent orders
            const recentOrders = await Payment.find(dateFilter)
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id userId fullName totalPrice status paymentMethod createdAt')
                .lean();

            // 3. Get top products
            const topProducts = await Payment.aggregate([
                { $match: { status: { $in: ['completed', 'delivered'] }, ...dateFilter } },
                { $unwind: '$product' },
                {
                    $group: {
                        _id: '$product.productId',
                        quantity: { $sum: '$product.quantity' },
                    },
                },
                { $sort: { quantity: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'books',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'productDetails',
                    },
                },
                { $unwind: '$productDetails' },
                {
                    $project: {
                        id: '$_id',
                        name: '$productDetails.nameProduct',
                        price: '$productDetails.price',
                        category: '$productDetails.category',
                        quantity: 1,
                        stock: '$productDetails.stock',
                    },
                },
            ]);

            // 4. Get order stats
            // Determine date range
            let startDateForStats = new Date();
            let endDateForStats = new Date();

            if (startDate && endDate) {
                // Use user-selected date range
                startDateForStats = new Date(startDate);
                endDateForStats = new Date(endDate);
            } else {
                // Default: last 7 days
                endDateForStats = new Date();
                startDateForStats = new Date(endDateForStats);
                startDateForStats.setDate(startDateForStats.getDate() - 6);
            }

            // Generate array of all dates in the range
            const dates = [];
            const currentDate = new Date(startDateForStats);

            // Calculate days difference
            const daysDifference = Math.ceil((endDateForStats - startDateForStats) / (1000 * 60 * 60 * 24)) + 1;

            // Generate all dates in range
            for (let i = 0; i < daysDifference; i++) {
                const date = new Date(currentDate);
                dates.push(date.toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const ordersByDate = await Payment.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startDateForStats,
                            $lte: new Date(endDateForStats.getTime() + 24 * 60 * 60 * 1000 - 1),
                        },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);

            // Fill in missing dates
            const orderStats = dates.map((date) => {
                const found = ordersByDate.find((item) => item._id === date);
                return { date, count: found ? found.count : 0 };
            });

            // 5. Get category stats
            const categoryStats = await Book.aggregate([
                {
                    $group: {
                        _id: '$category',
                        value: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        type: '$_id',
                        value: 1,
                        name: '$_id',
                        _id: 0,
                    },
                },
            ]);
            const categoryWithNames = await Promise.all(
                categoryStats.map(async (cat) => {
                    console.log(cat);

                    // Handle both ObjectId and string category names
                    let categoryName = cat.type;
                    try {
                        // Try to find by ID if it looks like an ObjectId
                        if (typeof cat.type === 'string' && /^[a-f\d]{24}$/i.test(cat.type)) {
                            const category = await modelCategory.findById(cat.type);
                            categoryName = category ? category.nameCategory : cat.type;
                        }
                    } catch (error) {
                        console.warn('Category lookup error for:', cat.type, error.message);
                        categoryName = cat.type;
                    }

                    return {
                        ...cat,
                        name: categoryName || 'Không xác định',
                    };
                }),
            );

            // 6. Get order status stats
            const orderStatusStats = await Payment.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$status',
                        value: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        status: '$_id',
                        value: 1,
                        name: '$_id',
                        _id: 0,
                    },
                },
            ]);

            // Format status names for better display
            const statusMapping = {
                pending: 'Đang chờ xử lý',
                completed: 'Hoàn thành',
                delivered: 'Đã giao',
                cancelled: 'Đã hủy',
            };

            const statusWithNames = orderStatusStats.map((stat) => ({
                ...stat,
                name: statusMapping[stat.status] || stat.status,
            }));

            return res.status(200).json({
                status: 'success',
                code: 200,
                metadata: {
                    statistics: {
                        totalUsers,
                        totalProducts,
                        totalRevenue,
                        totalWatching,
                    },
                    recentOrders: recentOrders.map((order) => ({
                        id: order._id,
                        idPayment: order._id,
                        fullName: order.fullName,
                        totalPrice: order.totalPrice,
                        status: order.status,
                        typePayment: order.paymentMethod,
                    })),
                    topProducts,
                    orderStats: orderStats,
                    categoryStats: categoryWithNames,
                    orderStatusStats: statusWithNames,
                },
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            return res.status(500).json({
                status: 'error',
                code: 500,
                message: 'Internal Server Error',
            });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            console.log('🔐 Yêu cầu quên mật khẩu từ:', email);

            if (!email) {
                throw new BadRequestError('Vui lòng nhập email');
            }

            const user = await modelUser.findOne({ email });
            if (!user) {
                console.log('❌ Email không tồn tại:', email);
                throw new BadRequestError('Email không tồn tại trong hệ thống');
            }

            console.log('✅ Tìm thấy user:', user.fullName, '-', user.email);

            // Xóa OTP cũ của email này (nếu có)
            await modelOtp.deleteMany({ email: user.email });
            console.log('🗑️ Đã xóa OTP cũ');

            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
            const otp = await otpGenerator.generate(6, {
                digits: true,
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false,
            });

            console.log('🔢 Đã tạo OTP:', otp);

            const saltRounds = 10;
            const hash = await bcrypt.hash(otp, saltRounds);

            await modelOtp.create({
                email: user.email,
                otp: hash,
            });
            console.log('💾 Đã lưu OTP vào database');

            // Gửi email - Ưu tiên dùng email @dav.edu.vn
            let emailResult;
            const isDavConfigured = process.env.DAV_SMTP_HOST && process.env.DAV_SMTP_USER && process.env.DAV_SMTP_PASS;

            if (isDavConfigured) {
                console.log('📧 Sử dụng email @dav.edu.vn');
                try {
                    emailResult = await sendMailForgotPasswordDAV(email, otp);
                } catch (davError) {
                    console.error('⚠️ Lỗi gửi email @dav.edu.vn, fallback sang Gmail');
                    emailResult = await sendMailForgotPassword(email, otp);
                }
            } else {
                console.log('📧 Sử dụng Gmail (chưa cấu hình @dav.edu.vn)');
                emailResult = await sendMailForgotPassword(email, otp);
            }

            if (!emailResult || !emailResult.success) {
                throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
            }

            console.log('✅ Gửi email thành công!');

            // Set cookie - remove Secure flag for development
            const isProduction = process.env.NODE_ENV === 'production';
            return res
                .setHeader('Set-Cookie', [
                    `tokenResetPassword=${token}; ${
                        isProduction ? 'Secure;' : ''
                    } Max-Age=900; Path=/; SameSite=Strict`,
                ])
                .status(200)
                .json({
                    message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).',
                    email: email,
                });
        } catch (error) {
            console.error('❌ Lỗi forgot password:', error);

            // Trả về lỗi chi tiết
            if (error instanceof BadRequestError) {
                return res.status(400).json({ message: error.message });
            }

            return res.status(500).json({
                message: 'Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
                error: error.message,
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const token = req.cookies.tokenResetPassword;
            const { otp, newPassword } = req.body;

            if (!token) {
                throw new BadRequestError('Vui lòng gửi yêu cầu quên mật khẩu');
            }

            const decode = jwt.verify(token, process.env.JWT_SECRET);
            if (!decode) {
                throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
            }

            const findOTP = await modelOtp.findOne({
                email: decode.email,
            });
            if (!findOTP) {
                throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
            }

            // So sánh OTP
            const isMatch = await bcrypt.compare(otp, findOTP.otp);
            if (!isMatch) {
                throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
            }

            // Hash mật khẩu mới
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Tìm người dùng
            const findUser = await modelUser.findOne({ email: decode.email });
            if (!findUser) {
                throw new BadRequestError('Người dùng không tồn tại');
            }

            // Cập nhật mật khẩu mới
            findUser.password = hashedPassword;
            findUser.mustChangePassword = false;
            await findUser.save();

            // Xóa OTP sau khi đặt lại mật khẩu thành công
            await modelOtp.deleteOne({ email: decode.email });
            res.clearCookie('tokenResetPassword');
            return res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng liên hệ ADMIN !!' });
        }
    }

    async createUserByAdmin(req, res) {
        const { fullName, email, password, phone, role, permissions } = req.body;

        if (!fullName || !email || !password || !phone) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        const normalizedEmail = validateAccountEmail(email, role === 'admin');
        const user = await modelUser.findOne({ email: normalizedEmail });
        if (user) {
            throw new BadRequestError('Email đã tồn tại');
        }

        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(password, salt);

        const userData = {
            fullName,
            email: normalizedEmail,
            password: passwordHash,
            phone,
            role: role || 'user',
        };

        // Chỉ thêm permissions nếu role là librarian
        if (role === 'librarian' && permissions && Array.isArray(permissions)) {
            userData.permissions = permissions;
        }

        const newUser = await modelUser.create(userData);
        await newUser.save();

        new Created({ message: 'Thêm người dùng thành công', metadata: newUser }).send(res);
    }

    async resetUserPasswordByAdmin(req, res) {
        const { userId, resetMode, newPassword, requirePasswordChange } = req.body;

        if (!userId) {
            throw new BadRequestError('Vui lòng cung cấp ID người dùng');
        }

        const user = await modelUser.findById(userId);
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        let plainPassword = '';
        if (resetMode === 'manual') {
            if (!newPassword || newPassword.length < 6) {
                throw new BadRequestError('Mật khẩu mới phải có ít nhất 6 ký tự');
            }
            plainPassword = newPassword;
        } else {
            plainPassword = generateTemporaryPassword(12);
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

        user.password = hashedPassword;
        user.mustChangePassword = !!requirePasswordChange;
        user.loginAttempts = 0;
        user.lockedUntil = null;
        user.lastFailedLogin = null;
        await user.save();

        new OK({
            message: 'Reset mật khẩu thành công',
            metadata: {
                userId: user._id,
                email: user.email,
                generatedPassword: plainPassword,
                mustChangePassword: user.mustChangePassword,
            },
        }).send(res);
    }

    async deleteUser(req, res) {
        const { userId } = req.body;

        if (!userId) {
            throw new BadRequestError('Vui lòng cung cấp ID người dùng');
        }

        const user = await modelUser.findById(userId);
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        // Không cho phép xóa chính mình
        if (userId === req.user.id) {
            throw new BadRequestError('Không thể xóa chính tài khoản của bạn');
        }

        // Xóa API key của user
        await modelApiKey.deleteMany({ userId });

        // Xóa user
        await modelUser.findByIdAndDelete(userId);

        new OK({ message: 'Xóa người dùng thành công' }).send(res);
    }
}

module.exports = new usersController();
