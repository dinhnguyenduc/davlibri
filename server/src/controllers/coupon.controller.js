const modelCoupon = require('../models/coupon.model');
const Book = require('../models/books.model');
const modelCategory = require('../models/category.model');

const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

class CouponController {
    // Tạo mã giảm giá mới
    async createCoupon(req, res) {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            startDate,
            endDate,
            usageLimit,
            applicableProducts,
            applicableCategories,
            applyToAll,
        } = req.body;

        // Validate
        if (!code || !description || !discountType || !discountValue || !startDate || !endDate) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin bắt buộc');
        }

        // Kiểm tra mã đã tồn tại
        const existingCoupon = await modelCoupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            throw new BadRequestError('Mã giảm giá đã tồn tại');
        }

        // Validate discount value
        if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
            throw new BadRequestError('Giá trị giảm giá phần trăm phải từ 0-100');
        }

        if (discountValue <= 0) {
            throw new BadRequestError('Giá trị giảm giá phải lớn hơn 0');
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            throw new BadRequestError('Ngày kết thúc phải sau ngày bắt đầu');
        }

        // Tạo coupon
        const coupon = await modelCoupon.create({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            minOrderValue: minOrderValue || 0,
            maxDiscount: maxDiscount || null,
            startDate,
            endDate,
            usageLimit: usageLimit || null,
            applicableProducts: applicableProducts || [],
            applicableCategories: applicableCategories || [],
            applyToAll: applyToAll || false,
            isActive: true,
            usedCount: 0,
        });

        return new Created({
            message: 'Tạo mã giảm giá thành công',
            metadata: coupon,
        }).send(res);
    }

    // Lấy tất cả mã giảm giá
    async getAllCoupons(req, res) {
        const coupons = await modelCoupon
            .find()
            .populate('applicableProducts', 'nameProduct price images')
            .populate('applicableCategories', 'nameCategory')
            .sort({ createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách mã giảm giá thành công',
            metadata: coupons,
        }).send(res);
    }

    // Lấy mã giảm giá theo ID
    async getCouponById(req, res) {
        const { id } = req.query;
        const coupon = await modelCoupon
            .findById(id)
            .populate('applicableProducts', 'nameProduct price images')
            .populate('applicableCategories', 'nameCategory');

        if (!coupon) {
            throw new NotFoundError('Mã giảm giá không tồn tại');
        }

        return new OK({
            message: 'Lấy thông tin mã giảm giá thành công',
            metadata: coupon,
        }).send(res);
    }

    // Cập nhật mã giảm giá
    async updateCoupon(req, res) {
        const { id, ...updateData } = req.body;

        if (!id) {
            throw new BadRequestError('Thiếu ID mã giảm giá');
        }

        const coupon = await modelCoupon.findById(id);
        if (!coupon) {
            throw new NotFoundError('Mã giảm giá không tồn tại');
        }

        // Validate nếu cập nhật discount value
        if (updateData.discountType === 'percentage' && updateData.discountValue) {
            if (updateData.discountValue < 0 || updateData.discountValue > 100) {
                throw new BadRequestError('Giá trị giảm giá phần trăm phải từ 0-100');
            }
        }

        // Validate dates nếu cập nhật
        if (updateData.startDate && updateData.endDate) {
            const start = new Date(updateData.startDate);
            const end = new Date(updateData.endDate);
            if (start >= end) {
                throw new BadRequestError('Ngày kết thúc phải sau ngày bắt đầu');
            }
        }

        // Cập nhật
        Object.keys(updateData).forEach((key) => {
            if (key !== 'code') {
                // Không cho phép đổi mã code
                coupon[key] = updateData[key];
            }
        });

        await coupon.save();

        return new OK({
            message: 'Cập nhật mã giảm giá thành công',
            metadata: coupon,
        }).send(res);
    }

    // Xóa mã giảm giá
    async deleteCoupon(req, res) {
        const { id } = req.body;

        const coupon = await modelCoupon.findByIdAndDelete(id);
        if (!coupon) {
            throw new NotFoundError('Mã giảm giá không tồn tại');
        }

        return new OK({
            message: 'Xóa mã giảm giá thành công',
        }).send(res);
    }

    // Áp dụng mã giảm giá (cho user khi checkout)
    async applyCoupon(req, res) {
        const { code, orderTotal, products } = req.body;

        if (!code || !orderTotal || !products) {
            throw new BadRequestError('Thiếu thông tin để áp dụng mã giảm giá');
        }

        const coupon = await modelCoupon
            .findOne({ code: code.toUpperCase() })
            .populate('applicableProducts')
            .populate('applicableCategories');

        if (!coupon) {
            throw new NotFoundError('Mã giảm giá không tồn tại');
        }

        // Kiểm tra coupon có active không
        if (!coupon.isActive) {
            throw new BadRequestError('Mã giảm giá đã bị vô hiệu hóa');
        }

        // Kiểm tra thời gian
        const now = new Date();
        if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
            throw new BadRequestError('Mã giảm giá chưa có hiệu lực hoặc đã hết hạn');
        }

        // Kiểm tra số lần sử dụng
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new BadRequestError('Mã giảm giá đã hết lượt sử dụng');
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        if (orderTotal < coupon.minOrderValue) {
            throw new BadRequestError(
                `Đơn hàng phải có giá trị tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ`,
            );
        }

        // Kiểm tra áp dụng cho sản phẩm/danh mục
        let isApplicable = coupon.applyToAll;

        if (!isApplicable && (coupon.applicableProducts.length > 0 || coupon.applicableCategories.length > 0)) {
            for (const productItem of products) {
                const product = await modelProduct.findById(productItem.productId);
                if (!product) continue;

                // Kiểm tra sản phẩm có trong danh sách áp dụng
                if (coupon.applicableProducts.some((p) => p._id.toString() === product._id.toString())) {
                    isApplicable = true;
                    break;
                }

                // Kiểm tra danh mục có trong danh sách áp dụng
                if (coupon.applicableCategories.some((c) => c._id.toString() === product.category.toString())) {
                    isApplicable = true;
                    break;
                }
            }
        }

        if (!isApplicable) {
            throw new BadRequestError('Mã giảm giá không áp dụng cho sản phẩm trong đơn hàng này');
        }

        // Tính toán giảm giá
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (orderTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        // Không cho giảm quá tổng tiền
        if (discountAmount > orderTotal) {
            discountAmount = orderTotal;
        }

        const finalTotal = orderTotal - discountAmount;

        return new OK({
            message: 'Áp dụng mã giảm giá thành công',
            metadata: {
                couponCode: coupon.code,
                discountAmount: discountAmount,
                originalTotal: orderTotal,
                finalTotal: finalTotal,
                couponId: coupon._id,
            },
        }).send(res);
    }

    // Tăng số lần sử dụng coupon (gọi sau khi order thành công)
    async incrementUsage(req, res) {
        const { couponId } = req.body;

        const coupon = await modelCoupon.findById(couponId);
        if (!coupon) {
            throw new NotFoundError('Mã giảm giá không tồn tại');
        }

        coupon.usedCount += 1;
        await coupon.save();

        return new OK({
            message: 'Cập nhật số lần sử dụng thành công',
        }).send(res);
    }

    // Toggle trạng thái active/inactive
    async toggleStatus(req, res) {
        const { id } = req.body;

        const coupon = await modelCoupon.findById(id);
        if (!coupon) {
            throw new NotFoundError('Mã giảm giá không tồn tại');
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        return new OK({
            message: `${coupon.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} mã giảm giá thành công`,
            metadata: coupon,
        }).send(res);
    }
}

module.exports = new CouponController();
