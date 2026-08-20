const modelCart = require('../models/cart.model');
const Book = require('../models/books.model');
const modelDepositConfig = require('../models/depositConfig.model');
const modelCategory = require('../models/category.model');

const { BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

class CartController {
    async createCart(req, res) {
        const { id } = req.user;
        const { product, startDate, endDate, quantity } = req.body;

        // Validate dữ liệu
        if (!product || !quantity || quantity <= 0) {
            throw new BadRequestError('Thiếu hoặc sai thông tin sản phẩm hoặc số lượng');
        }

        if (!startDate || !endDate) {
            throw new BadRequestError('Vui lòng chọn ngày thuê và ngày trả');
        }

        const findProduct = await modelProduct.findById(product);
        if (!findProduct) {
            throw new BadRequestError('Sản phẩm không tồn tại');
        }

        // Tính số ngày thuê
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // +1 để tính cả ngày cuối

        if (days < 1) {
            throw new BadRequestError('Ngày trả phải sau ngày thuê');
        }

        // Tính giá = giá/ngày × số lượng × số ngày
        const itemTotalPrice = findProduct.price * quantity * days;

        let cart = await modelCart.findOne({ userId: id });

        if (cart) {
            const productIndex = cart.product.findIndex((item) => item.productId.toString() === product.toString());

            if (productIndex !== -1) {
                // Sản phẩm đã có trong giỏ, cộng thêm số lượng
                cart.product[productIndex].quantity += quantity;
            } else {
                // Thêm sản phẩm mới vào giỏ
                cart.product.push({
                    productId: product,
                    quantity,
                    startDate,
                    endDate,
                });
            }

            cart.totalPrice += itemTotalPrice;
            await cart.save();

            return new OK({
                message: 'Cập nhật giỏ hàng thành công',
                metadata: cart,
            }).send(res);
        } else {
            // Tạo giỏ hàng mới
            const newCart = await modelCart.create({
                userId: id,
                product: [
                    {
                        productId: product,
                        quantity,
                        startDate,
                        endDate,
                    },
                ],
                totalPrice: itemTotalPrice,
                // Thêm các trường thông tin người dùng nếu cần
                fullName: req.user.fullName || '',
                phone: req.user.phone || '',
                address: req.user.address || '',
            });

            return new OK({
                message: 'Tạo giỏ hàng thành công',
                metadata: newCart,
            }).send(res);
        }
    }

    async getCart(req, res) {
        const { id } = req.user;
        const cart = await modelCart.findOne({ userId: id });

        // Lấy cấu hình deposit
        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        const data = await Promise.all(
            cart.product.map(async (item) => {
                const product = await modelProduct.findById(item.productId);

                // Tính số ngày thuê
                const startDate = new Date(item.startDate);
                const endDate = new Date(item.endDate);
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 để tính cả ngày cuối

                // Xác định tiền cọc
                let depositAmount = 50000; // Mặc định
                if (depositConfig.useGlobalDeposit) {
                    // Sử dụng tiền cọc chung
                    depositAmount = depositConfig.globalDeposit;
                } else {
                    // Sử dụng tiền cọc theo danh mục
                    const category = await modelCategory.findById(product.category);
                    depositAmount = category?.deposit || product.deposit || 50000;
                }

                // Tính tổng giá = (giá/ngày × số lượng × số ngày) + (tiền cọc × số lượng)
                const rentalPrice = product.price * item.quantity * days;
                const depositPrice = depositAmount * item.quantity;
                const totalPrice = rentalPrice + depositPrice;

                return {
                    ...item._doc,
                    product: product,
                    days: days, // Trả về số ngày để hiển thị
                    rentalPrice: rentalPrice, // Giá thuê
                    depositPrice: depositPrice, // Tiền cọc
                    totalPrice: totalPrice, // Tổng = giá thuê + tiền cọc
                };
            }),
        );
        return new OK({
            message: 'Lấy giỏ hàng thành công',
            metadata: data,
        }).send(res);
    }

    async updateQuantity(req, res) {
        const { id } = req.user;
        const { productId, quantity } = req.body;

        // Validate
        if (!productId || !quantity || quantity <= 0) {
            throw new BadRequestError('Thông tin sản phẩm hoặc số lượng không hợp lệ');
        }

        const cart = await modelCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ hàng không tồn tại');
        }

        const productIndex = cart.product.findIndex((item) => item.productId.toString() === productId.toString());

        if (productIndex === -1) {
            throw new BadRequestError('Sản phẩm không có trong giỏ hàng');
        }

        // Cập nhật số lượng
        cart.product[productIndex].quantity = quantity;

        // Cập nhật lại tổng giá
        const productData = await modelProduct.findById(productId);
        if (!productData) {
            throw new BadRequestError('Sản phẩm không tồn tại trong hệ thống');
        }

        // Tính lại toàn bộ totalPrice từ giỏ hàng (tính cả số ngày thuê)
        let newTotal = 0;
        for (const item of cart.product) {
            const productInfo = await modelProduct.findById(item.productId);
            if (productInfo) {
                // Tính số ngày thuê
                const startDate = new Date(item.startDate);
                const endDate = new Date(item.endDate);
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                // Tính giá = giá/ngày × số lượng × số ngày
                newTotal += productInfo.price * item.quantity * days;
            }
        }
        cart.totalPrice = newTotal;

        await cart.save();

        return new OK({
            message: 'Cập nhật số lượng thành công',
            metadata: cart,
        }).send(res);
    }

    async deleteItem(req, res) {
        const { id } = req.user;
        const { productId } = req.body;

        const cart = await modelCart.findOne({ userId: id });

        if (!cart) {
            throw new BadRequestError('Giỏ hàng không tồn tại');
        }

        const productIndex = cart.product.findIndex((item) => item.productId.toString() === productId.toString());

        if (productIndex === -1) {
            throw new BadRequestError('Sản phẩm không có trong giỏ hàng');
        }

        cart.product.splice(productIndex, 1);
        await cart.save();

        return new OK({
            message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
            metadata: cart,
        }).send(res);
    }

    async updateInfoCart(req, res) {
        const { fullName, phone, address } = req.body;
        const { id } = req.user;
        if (!fullName || !phone || !address) {
            throw new BadRequestError('Vui lòng nhập thông tin thuê');
        }
        const cart = await modelCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ hàng không tồn tại');
        }
        cart.fullName = fullName;
        cart.phone = phone;
        cart.address = address;
        await cart.save();
        return new OK({
            message: 'Cập nhật thông tin giỏ hàng thành công',
            metadata: cart,
        }).send(res);
    }

    async updateRentalDates(req, res) {
        const { id } = req.user;
        const { productId, startDate, endDate } = req.body;

        // Validate
        if (!productId || !startDate || !endDate) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin ngày thuê và ngày trả');
        }

        // Kiểm tra ngày trả phải sau ngày thuê
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (days < 1) {
            throw new BadRequestError('Ngày trả phải sau ngày thuê');
        }

        const cart = await modelCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ hàng không tồn tại');
        }

        const productIndex = cart.product.findIndex((item) => item.productId.toString() === productId.toString());

        if (productIndex === -1) {
            throw new BadRequestError('Sản phẩm không có trong giỏ hàng');
        }

        // Cập nhật ngày thuê và ngày trả
        cart.product[productIndex].startDate = startDate;
        cart.product[productIndex].endDate = endDate;

        // Tính lại tổng giá cho toàn bộ giỏ hàng
        let newTotal = 0;
        for (const item of cart.product) {
            const productInfo = await modelProduct.findById(item.productId);
            if (productInfo) {
                const itemStart = new Date(item.startDate);
                const itemEnd = new Date(item.endDate);
                const itemDays = Math.ceil((itemEnd - itemStart) / (1000 * 60 * 60 * 24)) + 1;

                newTotal += productInfo.price * item.quantity * itemDays;
            }
        }
        cart.totalPrice = newTotal;

        await cart.save();

        return new OK({
            message: 'Cập nhật ngày thuê trả thành công',
            metadata: cart,
        }).send(res);
    }
}

module.exports = new CartController();
