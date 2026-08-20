const modelCategory = require('../models/category.model');

const { BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const Book = require('../models/books.model');
const modelDepositConfig = require('../models/depositConfig.model');

class categoryController {
    async createCategory(req, res) {
        const { name } = req.body;
        if (!name) {
            throw new BadRequestError('Vui lòng nhập tên danh mục');
        }
        const category = await modelCategory.create({ nameCategory: name });
        return new Created({
            message: 'Tạo danh mục thành công',
            metadata: category,
        }).send(res);
    }

    async getCategory(req, res) {
        const categories = await modelCategory.find();
        const data = await Promise.all(
            categories.map(async (category) => {
                const products = await Book.find({ category: category._id });
                return { ...category._doc, products };
            }),
        );
        return new OK({
            message: 'Lấy danh mục thành công',
            metadata: data,
        }).send(res);
    }

    async deleteCategory(req, res) {
        const { id } = req.body;
        const category = await modelCategory.findByIdAndDelete(id);
        if (!category) {
            throw new NotFoundError('Danh mục không tồn tại');
        }
        return new OK({
            message: 'Xóa danh mục thành công',
            metadata: category,
        }).send(res);
    }

    async updateCategory(req, res) {
        const { id, nameCategory } = req.body;
        const category = await modelCategory.findByIdAndUpdate(id, { nameCategory });
        if (!category) {
            throw new NotFoundError('Danh mục không tồn tại');
        }
        return new OK({
            message: 'Cập nhật danh mục thành công',
            metadata: category,
        }).send(res);
    }

    async getCategoryById(req, res) {
        const { id } = req.query;
        const category = await modelCategory.findById(id);
        const products = await Book.find({ category: category._id });
        return new OK({
            message: 'Lấy danh mục thành công',
            metadata: { ...category._doc, products },
        }).send(res);
    }

    async updateCategoryDeposit(req, res) {
        const { categoryId, deposit } = req.body;
        if (!categoryId || deposit === undefined) {
            throw new BadRequestError('Thiếu thông tin categoryId hoặc deposit');
        }
        const category = await modelCategory.findByIdAndUpdate(categoryId, { deposit }, { new: true });
        if (!category) {
            throw new BadRequestError('Danh mục không tồn tại');
        }
        return new OK({
            message: 'Cập nhật tiền cọc thành công',
            metadata: category,
        }).send(res);
    }

    async getGlobalDeposit(req, res) {
        let config = await modelDepositConfig.findOne();
        if (!config) {
            config = await modelDepositConfig.create({
                globalDeposit: 50000,
                useGlobalDeposit: true,
            });
        }
        return new OK({
            message: 'Lấy cấu hình tiền cọc chung thành công',
            metadata: config,
        }).send(res);
    }

    async updateGlobalDeposit(req, res) {
        const { globalDeposit, useGlobalDeposit } = req.body;
        let config = await modelDepositConfig.findOne();
        if (!config) {
            config = await modelDepositConfig.create({
                globalDeposit: globalDeposit || 50000,
                useGlobalDeposit: useGlobalDeposit !== false,
            });
        } else {
            config.globalDeposit = globalDeposit || config.globalDeposit;
            config.useGlobalDeposit = useGlobalDeposit !== undefined ? useGlobalDeposit : config.useGlobalDeposit;
            await config.save();
        }
        return new OK({
            message: 'Cập nhật cấu hình tiền cọc chung thành công',
            metadata: config,
        }).send(res);
    }
}

module.exports = new categoryController();
