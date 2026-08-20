const Banner = require('../models/banner.model');
const cloudinary = require('../utils/configCloudDinary');
const fs = require('fs/promises');

const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

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

class BannerController {
    // Lấy tất cả banners (cho user - chỉ lấy active)
    async getBanners(req, res) {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        return new OK({
            message: 'Lấy danh sách banner thành công',
            metadata: banners,
        }).send(res);
    }

    // Lấy tất cả banners (cho admin - lấy tất cả)
    async getAllBanners(req, res) {
        const banners = await Banner.find().sort({ order: 1 });
        return new OK({
            message: 'Lấy danh sách banner thành công',
            metadata: banners,
        }).send(res);
    }

    // Lấy banner theo ID
    async getBannerById(req, res) {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            throw new NotFoundError('Không tìm thấy banner');
        }

        return new OK({
            message: 'Lấy banner thành công',
            metadata: banner,
        }).send(res);
    }

    // Upload hình ảnh banner
    async uploadBannerImage(req, res) {
        try {
            if (!req.file) {
                throw new BadRequestError('Vui lòng chọn hình ảnh');
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'banners',
                resource_type: 'image',
            });

            await fs.unlink(req.file.path);

            return new OK({
                message: 'Upload ảnh banner thành công',
                metadata: {
                    url: result.secure_url,
                    publicId: result.public_id,
                },
            }).send(res);
        } catch (error) {
            console.error('Upload banner image error:', error);
            throw new BadRequestError('Lỗi khi upload ảnh banner');
        }
    }

    // Tạo banner mới
    async createBanner(req, res) {
        const { title, subtitle, description, image, link, buttonText, features, backgroundColor, textColor, order } =
            req.body;

        if (!title || !image) {
            throw new BadRequestError('Vui lòng nhập tiêu đề và hình ảnh');
        }

        // Nếu không có order, lấy order cao nhất + 1
        let bannerOrder = order;
        if (bannerOrder === undefined || bannerOrder === null) {
            const maxOrderBanner = await Banner.findOne().sort({ order: -1 });
            bannerOrder = maxOrderBanner ? maxOrderBanner.order + 1 : 0;
        }

        const banner = await Banner.create({
            title,
            subtitle,
            description,
            image,
            link: link || '#',
            buttonText: buttonText || 'Xem thêm',
            features: features || [],
            backgroundColor: backgroundColor || '#f8f9fa',
            textColor: textColor || '#333333',
            order: bannerOrder,
            isActive: true,
        });

        return new Created({
            message: 'Tạo banner thành công',
            metadata: banner,
        }).send(res);
    }

    // Cập nhật banner
    async updateBanner(req, res) {
        const { id } = req.params;
        const updateData = req.body;

        const banner = await Banner.findById(id);
        if (!banner) {
            throw new NotFoundError('Không tìm thấy banner');
        }

        // Nếu có hình ảnh mới và khác hình cũ, xóa hình cũ trên Cloudinary
        if (updateData.image && updateData.image !== banner.image) {
            try {
                const publicId = getPublicId(banner.image);
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                console.error('Error deleting old banner image:', error);
            }
        }

        const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        return new OK({
            message: 'Cập nhật banner thành công',
            metadata: updatedBanner,
        }).send(res);
    }

    // Xóa banner
    async deleteBanner(req, res) {
        const { id } = req.params;

        const banner = await Banner.findById(id);
        if (!banner) {
            throw new NotFoundError('Không tìm thấy banner');
        }

        // Xóa hình ảnh trên Cloudinary
        try {
            const publicId = getPublicId(banner.image);
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Error deleting banner image:', error);
        }

        await Banner.findByIdAndDelete(id);

        return new OK({
            message: 'Xóa banner thành công',
            metadata: { id },
        }).send(res);
    }

    // Toggle trạng thái active/inactive
    async toggleBannerStatus(req, res) {
        const { id } = req.params;

        const banner = await Banner.findById(id);
        if (!banner) {
            throw new NotFoundError('Không tìm thấy banner');
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        return new OK({
            message: `${banner.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} banner thành công`,
            metadata: banner,
        }).send(res);
    }

    // Cập nhật thứ tự banner
    async updateBannerOrder(req, res) {
        const { banners } = req.body; // Mảng [{ id, order }, { id, order }, ...]

        if (!Array.isArray(banners)) {
            throw new BadRequestError('Dữ liệu không hợp lệ');
        }

        // Cập nhật từng banner
        const updatePromises = banners.map((item) => Banner.findByIdAndUpdate(item.id, { order: item.order }));

        await Promise.all(updatePromises);

        const updatedBanners = await Banner.find().sort({ order: 1 });

        return new OK({
            message: 'Cập nhật thứ tự banner thành công',
            metadata: updatedBanners,
        }).send(res);
    }
}

module.exports = new BannerController();
