const Policy = require('../models/policy.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class PolicyController {
    // [GET] /api/policy/get-policies - Public (chỉ lấy active)
    async getPolicies(req, res) {
        const policies = await Policy.find({ isActive: true }).sort({ order: 1, createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách policies thành công',
            metadata: policies,
        }).send(res);
    }

    // [GET] /api/policy/admin/get-all-policies - Admin
    async getAllPolicies(req, res) {
        const policies = await Policy.find({}).sort({ order: 1, createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách tất cả policies thành công',
            metadata: policies,
        }).send(res);
    }

    // [GET] /api/policy/admin/get-policy/:id - Admin
    async getPolicyById(req, res) {
        const { id } = req.params;

        const policy = await Policy.findById(id);
        if (!policy) {
            throw new NotFoundError('Không tìm thấy policy');
        }

        return new OK({
            message: 'Lấy thông tin policy thành công',
            metadata: policy,
        }).send(res);
    }

    // [POST] /api/policy/admin/create - Admin
    async createPolicy(req, res) {
        const { title, description, icon, link, order, iconColor } = req.body;

        if (!title || !description || !icon) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        const policy = await Policy.create({
            title,
            description,
            icon,
            link: link || '#',
            order: order || 0,
            iconColor: iconColor || '#ff6b6b',
            isActive: true,
        });

        return new Created({
            message: 'Tạo policy thành công',
            metadata: policy,
        }).send(res);
    }

    // [PUT] /api/policy/admin/update/:id - Admin
    async updatePolicy(req, res) {
        const { id } = req.params;
        const { title, description, icon, link, order, isActive, iconColor } = req.body;

        const policy = await Policy.findById(id);
        if (!policy) {
            throw new NotFoundError('Không tìm thấy policy');
        }

        if (title) policy.title = title;
        if (description) policy.description = description;
        if (icon) policy.icon = icon;
        if (link !== undefined) policy.link = link;
        if (order !== undefined) policy.order = order;
        if (isActive !== undefined) policy.isActive = isActive;
        if (iconColor) policy.iconColor = iconColor;

        await policy.save();

        return new OK({
            message: 'Cập nhật policy thành công',
            metadata: policy,
        }).send(res);
    }

    // [DELETE] /api/policy/admin/delete/:id - Admin
    async deletePolicy(req, res) {
        const { id } = req.params;

        const policy = await Policy.findByIdAndDelete(id);
        if (!policy) {
            throw new NotFoundError('Không tìm thấy policy');
        }

        return new OK({
            message: 'Xóa policy thành công',
            metadata: { id },
        }).send(res);
    }

    // [PATCH] /api/policy/admin/toggle-status/:id - Admin
    async togglePolicyStatus(req, res) {
        const { id } = req.params;

        const policy = await Policy.findById(id);
        if (!policy) {
            throw new NotFoundError('Không tìm thấy policy');
        }

        policy.isActive = !policy.isActive;
        await policy.save();

        return new OK({
            message: `${policy.isActive ? 'Bật' : 'Tắt'} policy thành công`,
            metadata: policy,
        }).send(res);
    }
}

module.exports = new PolicyController();
