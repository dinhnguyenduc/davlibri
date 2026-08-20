const AnimatedHeadline = require('../models/animatedHeadline.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class AnimatedHeadlineController {
    // [GET] /api/headline/get-headlines - Public (chỉ lấy active headlines)
    async getHeadlines(req, res) {
        const headlines = await AnimatedHeadline.find({ isActive: true }).sort({ order: 1, createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách headlines thành công',
            metadata: headlines,
        }).send(res);
    }

    // [GET] /api/headline/admin/get-all-headlines - Admin (lấy tất cả)
    async getAllHeadlines(req, res) {
        const headlines = await AnimatedHeadline.find({}).sort({ order: 1, createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách tất cả headlines thành công',
            metadata: headlines,
        }).send(res);
    }

    // [GET] /api/headline/admin/get-headline/:id - Admin
    async getHeadlineById(req, res) {
        const { id } = req.params;

        const headline = await AnimatedHeadline.findById(id);
        if (!headline) {
            throw new NotFoundError('Không tìm thấy headline');
        }

        return new OK({
            message: 'Lấy thông tin headline thành công',
            metadata: headline,
        }).send(res);
    }

    // [POST] /api/headline/admin/create - Admin
    async createHeadline(req, res) {
        const { plainText, dynamicText, textColor, highlightColor, order } = req.body;

        if (!plainText || !dynamicText) {
            throw new BadRequestError('Vui lòng nhập đầy đủ nội dung text');
        }

        const headline = await AnimatedHeadline.create({
            plainText,
            dynamicText,
            textColor: textColor || '#333333',
            highlightColor: highlightColor || '#ff6b6b',
            order: order || 0,
            isActive: true,
        });

        return new Created({
            message: 'Tạo headline thành công',
            metadata: headline,
        }).send(res);
    }

    // [PUT] /api/headline/admin/update/:id - Admin
    async updateHeadline(req, res) {
        const { id } = req.params;
        const { plainText, dynamicText, textColor, highlightColor, order, isActive } = req.body;

        const headline = await AnimatedHeadline.findById(id);
        if (!headline) {
            throw new NotFoundError('Không tìm thấy headline');
        }

        if (plainText) headline.plainText = plainText;
        if (dynamicText) headline.dynamicText = dynamicText;
        if (textColor) headline.textColor = textColor;
        if (highlightColor) headline.highlightColor = highlightColor;
        if (order !== undefined) headline.order = order;
        if (isActive !== undefined) headline.isActive = isActive;

        await headline.save();

        return new OK({
            message: 'Cập nhật headline thành công',
            metadata: headline,
        }).send(res);
    }

    // [DELETE] /api/headline/admin/delete/:id - Admin
    async deleteHeadline(req, res) {
        const { id } = req.params;

        const headline = await AnimatedHeadline.findByIdAndDelete(id);
        if (!headline) {
            throw new NotFoundError('Không tìm thấy headline');
        }

        return new OK({
            message: 'Xóa headline thành công',
            metadata: { id },
        }).send(res);
    }

    // [PATCH] /api/headline/admin/toggle-status/:id - Admin
    async toggleHeadlineStatus(req, res) {
        const { id } = req.params;

        const headline = await AnimatedHeadline.findById(id);
        if (!headline) {
            throw new NotFoundError('Không tìm thấy headline');
        }

        headline.isActive = !headline.isActive;
        await headline.save();

        return new OK({
            message: `${headline.isActive ? 'Bật' : 'Tắt'} headline thành công`,
            metadata: headline,
        }).send(res);
    }
}

module.exports = new AnimatedHeadlineController();
