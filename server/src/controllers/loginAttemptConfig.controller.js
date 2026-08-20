const LoginAttemptConfig = require('../models/loginAttemptConfig.model');
const User = require('../models/users.model');

const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class LoginAttemptConfigController {
    /**
     * Lấy cấu hình hiện tại
     */
    async getConfig(req, res) {
        let config = await LoginAttemptConfig.findOne();

        // Tạo config mặc định nếu chưa có
        if (!config) {
            config = await LoginAttemptConfig.create({
                enabled: true,
                maxAttempts: 5,
                lockDuration: 30,
                resetAfter: 60,
            });
        }

        return new OK({
            message: 'Lấy cấu hình thành công',
            metadata: config,
        }).send(res);
    }

    /**
     * Cập nhật cấu hình
     */
    async updateConfig(req, res) {
        const { enabled, maxAttempts, lockDuration, resetAfter, note } = req.body;

        // Validate
        if (maxAttempts && (maxAttempts < 1 || maxAttempts > 100)) {
            throw new BadRequestError('Số lần đăng nhập sai phải từ 1-100');
        }

        if (lockDuration && (lockDuration < 1 || lockDuration > 1440)) {
            throw new BadRequestError('Thời gian khóa phải từ 1-1440 phút');
        }

        if (resetAfter && (resetAfter < 1 || resetAfter > 1440)) {
            throw new BadRequestError('Thời gian reset phải từ 1-1440 phút');
        }

        let config = await LoginAttemptConfig.findOne();

        if (!config) {
            config = await LoginAttemptConfig.create({
                enabled,
                maxAttempts,
                lockDuration,
                resetAfter,
                note,
            });
        } else {
            config.enabled = enabled !== undefined ? enabled : config.enabled;
            config.maxAttempts = maxAttempts || config.maxAttempts;
            config.lockDuration = lockDuration || config.lockDuration;
            config.resetAfter = resetAfter || config.resetAfter;
            config.note = note !== undefined ? note : config.note;
            await config.save();
        }

        return new OK({
            message: 'Cập nhật cấu hình thành công',
            metadata: config,
        }).send(res);
    }

    /**
     * Reset số lần đăng nhập sai cho 1 user
     */
    async resetUserAttempts(req, res) {
        const { userId } = req.body;

        if (!userId) {
            throw new BadRequestError('Thiếu userId');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new BadRequestError('Không tìm thấy user');
        }

        user.loginAttempts = 0;
        user.lockedUntil = null;
        user.lastFailedLogin = null;
        await user.save();

        return new OK({
            message: `Đã reset số lần đăng nhập sai cho ${user.fullName}`,
            metadata: {
                userId: user._id,
                email: user.email,
                fullName: user.fullName,
            },
        }).send(res);
    }

    /**
     * Reset tất cả user bị khóa
     */
    async resetAllLocked(req, res) {
        const result = await User.updateMany(
            { lockedUntil: { $ne: null } },
            {
                $set: {
                    loginAttempts: 0,
                    lockedUntil: null,
                    lastFailedLogin: null,
                },
            },
        );

        return new OK({
            message: `Đã mở khóa ${result.modifiedCount} tài khoản`,
            metadata: {
                unlockedCount: result.modifiedCount,
            },
        }).send(res);
    }

    /**
     * Lấy danh sách user bị khóa
     */
    async getLockedUsers(req, res) {
        const lockedUsers = await User.find({
            lockedUntil: { $gt: new Date() },
        }).select('fullName email phone loginAttempts lockedUntil lastFailedLogin');

        return new OK({
            message: 'Lấy danh sách user bị khóa thành công',
            metadata: {
                count: lockedUsers.length,
                users: lockedUsers,
            },
        }).send(res);
    }

    /**
     * Lấy thống kê
     */
    async getStats(req, res) {
        const [totalUsers, lockedUsers, usersWithAttempts] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ lockedUntil: { $gt: new Date() } }),
            User.countDocuments({ loginAttempts: { $gt: 0 } }),
        ]);

        const config = await LoginAttemptConfig.findOne();

        return new OK({
            message: 'Lấy thống kê thành công',
            metadata: {
                totalUsers,
                lockedUsers,
                usersWithAttempts,
                config: config || null,
            },
        }).send(res);
    }
}

module.exports = new LoginAttemptConfigController();
