const modelLiveChat = require('../models/liveChat.model');
const modelUser = require('../models/users.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

class LiveChatController {
    /**
     * User tạo yêu cầu chat với thủ thư
     */
    async createChatRequest(req, res) {
        const { id: userId } = req.user;

        // Kiểm tra xem user đã có chat đang chờ hoặc đang active chưa
        const existingChat = await modelLiveChat.findOne({
            userId,
            status: { $in: ['waiting', 'active'] },
        });

        if (existingChat) {
            return new OK({
                message: 'Bạn đã có phiên chat đang hoạt động',
                metadata: existingChat,
            }).send(res);
        }

        // Tạo yêu cầu chat mới
        const newChat = await modelLiveChat.create({
            userId,
            status: 'waiting',
        });

        new Created({
            message: 'Yêu cầu chat đã được tạo. Vui lòng chờ thủ thư phản hồi...',
            metadata: newChat,
        }).send(res);
    }

    /**
     * Lấy danh sách chat đang chờ (cho thủ thư)
     */
    async getWaitingChats(req, res) {
        const waitingChats = await modelLiveChat
            .find({ status: 'waiting' })
            .populate('userId', 'fullName email avatar')
            .sort({ startedAt: 1 }) // First come first serve
            .limit(20);

        new OK({
            message: 'Lấy danh sách chat đang chờ thành công',
            metadata: waitingChats,
        }).send(res);
    }

    /**
     * Thủ thư nhận chat (assign)
     */
    async acceptChat(req, res) {
        const { chatId } = req.body;
        const { id: librarianId } = req.user;

        // Kiểm tra chat tồn tại
        const chat = await modelLiveChat.findById(chatId);
        if (!chat) {
            throw new NotFoundError('Không tìm thấy phiên chat');
        }

        // Kiểm tra chat đang waiting
        if (chat.status !== 'waiting') {
            throw new BadRequestError('Phiên chat này đã được xử lý');
        }

        // Assign thủ thư và chuyển sang active
        chat.librarianId = librarianId;
        chat.status = 'active';
        chat.assignedAt = new Date();
        await chat.save();

        const populatedChat = await modelLiveChat
            .findById(chatId)
            .populate('userId', 'fullName email avatar')
            .populate('librarianId', 'fullName email avatar');

        new OK({
            message: 'Đã nhận phiên chat',
            metadata: populatedChat,
        }).send(res);
    }

    /**
     * Gửi tin nhắn
     */
    async sendMessage(req, res) {
        const { chatId, message } = req.body;
        const { id: senderId, role } = req.user;

        if (!message || !message.trim()) {
            throw new BadRequestError('Tin nhắn không được để trống');
        }

        const chat = await modelLiveChat.findById(chatId);
        if (!chat) {
            throw new NotFoundError('Không tìm thấy phiên chat');
        }

        // Kiểm tra quyền gửi tin nhắn
        const senderRole = role === 'librarian' || role === 'admin' ? 'librarian' : 'user';

        if (senderRole === 'user' && chat.userId.toString() !== senderId) {
            throw new BadRequestError('Bạn không có quyền gửi tin nhắn trong phiên chat này');
        }

        if (senderRole === 'librarian' && chat.librarianId && chat.librarianId.toString() !== senderId) {
            throw new BadRequestError('Phiên chat này đã được thủ thư khác xử lý');
        }

        // Thêm tin nhắn
        chat.messages.push({
            senderId,
            senderRole,
            message: message.trim(),
            timestamp: new Date(),
            read: false,
        });

        await chat.save();

        const populatedChat = await modelLiveChat
            .findById(chatId)
            .populate('userId', 'fullName email avatar')
            .populate('librarianId', 'fullName email avatar')
            .populate('messages.senderId', 'fullName avatar');

        new OK({
            message: 'Gửi tin nhắn thành công',
            metadata: populatedChat,
        }).send(res);
    }

    /**
     * Lấy lịch sử chat
     */
    async getChatHistory(req, res) {
        const { chatId } = req.params;
        const { id: userId, role } = req.user;

        const chat = await modelLiveChat
            .findById(chatId)
            .populate('userId', 'fullName email avatar')
            .populate('librarianId', 'fullName email avatar')
            .populate('messages.senderId', 'fullName avatar');

        if (!chat) {
            throw new NotFoundError('Không tìm thấy phiên chat');
        }

        // Kiểm tra quyền xem
        const isUser = chat.userId.toString() === userId;
        const isLibrarian = chat.librarianId && chat.librarianId.toString() === userId;
        const isAdmin = role === 'admin';

        if (!isUser && !isLibrarian && !isAdmin) {
            throw new BadRequestError('Bạn không có quyền xem phiên chat này');
        }

        new OK({
            message: 'Lấy lịch sử chat thành công',
            metadata: chat,
        }).send(res);
    }

    /**
     * Lấy chat đang active của user
     */
    async getActiveChat(req, res) {
        const { id: userId } = req.user;

        const activeChat = await modelLiveChat
            .findOne({
                userId,
                status: { $in: ['waiting', 'active'] },
            })
            .populate('userId', 'fullName email avatar')
            .populate('librarianId', 'fullName email avatar')
            .populate('messages.senderId', 'fullName avatar');

        new OK({
            message: activeChat ? 'Có phiên chat đang hoạt động' : 'Không có phiên chat nào',
            metadata: activeChat,
        }).send(res);
    }

    /**
     * Lấy danh sách chat của thủ thư
     */
    async getLibrarianChats(req, res) {
        const { id: librarianId } = req.user;

        const chats = await modelLiveChat
            .find({
                librarianId,
                status: 'active',
            })
            .populate('userId', 'fullName email avatar')
            .sort({ 'messages.timestamp': -1 });

        new OK({
            message: 'Lấy danh sách chat thành công',
            metadata: chats,
        }).send(res);
    }

    /**
     * Đóng phiên chat
     */
    async closeChat(req, res) {
        const { chatId } = req.body;
        const { id: userId, role } = req.user;

        const chat = await modelLiveChat.findById(chatId);
        if (!chat) {
            throw new NotFoundError('Không tìm thấy phiên chat');
        }

        // Kiểm tra quyền đóng chat
        const isUser = chat.userId.toString() === userId;
        const isLibrarian = chat.librarianId && chat.librarianId.toString() === userId;
        const isAdmin = role === 'admin';

        if (!isUser && !isLibrarian && !isAdmin) {
            throw new BadRequestError('Bạn không có quyền đóng phiên chat này');
        }

        chat.status = 'closed';
        chat.closedAt = new Date();
        await chat.save();

        new OK({
            message: 'Đã đóng phiên chat',
            metadata: chat,
        }).send(res);
    }

    /**
     * Đánh giá phiên chat
     */
    async rateChat(req, res) {
        const { chatId, rating, feedback } = req.body;
        const { id: userId } = req.user;

        if (!rating || rating < 1 || rating > 5) {
            throw new BadRequestError('Đánh giá phải từ 1 đến 5 sao');
        }

        const chat = await modelLiveChat.findById(chatId);
        if (!chat) {
            throw new NotFoundError('Không tìm thấy phiên chat');
        }

        if (chat.userId.toString() !== userId) {
            throw new BadRequestError('Bạn không có quyền đánh giá phiên chat này');
        }

        if (chat.status !== 'closed') {
            throw new BadRequestError('Chỉ có thể đánh giá phiên chat đã kết thúc');
        }

        chat.rating = rating;
        chat.feedback = feedback || '';
        await chat.save();

        new OK({
            message: 'Cảm ơn bạn đã đánh giá',
            metadata: chat,
        }).send(res);
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    async markAsRead(req, res) {
        const { chatId } = req.body;
        const { id: userId } = req.user;

        const chat = await modelLiveChat.findById(chatId);
        if (!chat) {
            throw new NotFoundError('Không tìm thấy phiên chat');
        }

        // Đánh dấu tất cả tin nhắn của người khác là đã đọc
        chat.messages.forEach((msg) => {
            if (msg.senderId.toString() !== userId && !msg.read) {
                msg.read = true;
            }
        });

        await chat.save();

        new OK({
            message: 'Đã đánh dấu tin nhắn đã đọc',
        }).send(res);
    }
}

module.exports = new LiveChatController();
