const modelCart = require('../models/cart.model');
const modelPayments = require('../models/payments.model');
const Book = require('../models/books.model');
const modelDepositConfig = require('../models/depositConfig.model');
const modelCategory = require('../models/category.model');
const modelCoupon = require('../models/coupon.model');

const { BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const crypto = require('crypto');
const axios = require('axios');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

require('dotenv').config();

const getVnPayConfig = () => ({
    tmnCode: process.env.VNPAY_TMN_CODE || 'IU72NP1F',
    secureSecret: process.env.VNPAY_HASH_SECRET || 'GHQWIXNOHTHSXWFKENMRTOWAMJXSBJVE',
    vnpayHost: process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
    enableLog: false,
    loggerFn: ignoreLogger,
});

const buildReturnUrl = (path) => {
    const backendBase = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${backendBase}${path}`;
};

const validateVnPayChecksum = (query, secretKey) => {
    const { vnp_SecureHash, vnp_SecureHashType, ...params } = query || {};
    if (!vnp_SecureHash || !secretKey) {
        return false;
    }

    const sortedParams = Object.keys(params)
        .sort()
        .reduce((result, key) => {
            const value = params[key];
            if (value !== undefined && value !== null && value !== '') {
                result[key] = String(value);
            }
            return result;
        }, {});

    const rawQueryString = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    const expectedHash = crypto
        .createHmac('sha512', secretKey)
        .update(Buffer.from(rawQueryString, 'utf-8'))
        .digest('hex');
    return expectedHash.toLowerCase() === String(vnp_SecureHash).toLowerCase();
};

class PaymentsController {
    async createPayment(req, res) {
        const { id } = req.user;
        const { typePayment, couponId, discountAmount } = req.body;
        const cart = await modelCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ hàng không tồn tại');
        }
        if (!cart.fullName || !cart.phone || !cart.address) {
            throw new BadRequestError('Vui lòng cập nhật thông tin thuê');
        }

        // Tính tổng tiền bao gồm cả tiền cọc
        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        let totalAmount = 0;
        for (const item of cart.product) {
            const product = await modelProduct.findById(item.productId);
            if (product) {
                // Tính số ngày thuê
                const startDate = new Date(item.startDate);
                const endDate = new Date(item.endDate);
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                // Xác định tiền cọc
                let depositAmount = 50000;
                if (depositConfig.useGlobalDeposit) {
                    depositAmount = depositConfig.globalDeposit;
                } else {
                    const category = await modelCategory.findById(product.category);
                    depositAmount = category?.deposit || product.deposit || 50000;
                }

                // Tính tổng = (giá thuê × số lượng × số ngày) + (tiền cọc × số lượng)
                const rentalPrice = product.price * item.quantity * days;
                const depositPrice = depositAmount * item.quantity;
                totalAmount += rentalPrice + depositPrice;
            }
        }

        // Trừ đi số tiền giảm giá nếu có
        const finalAmount = Math.max(0, totalAmount - (discountAmount || 0));
        if (finalAmount <= 0) {
            throw new BadRequestError('Tổng tiền thanh toán phải lớn hơn 0');
        }

        // Tăng số lần sử dụng coupon nếu có
        if (couponId) {
            const coupon = await modelCoupon.findById(couponId);
            if (coupon) {
                coupon.usedCount += 1;
                await coupon.save();
            }
        }

        if (typePayment === 'cod') {
            const payments = await modelPayments.create({
                userId: id,
                fullName: cart.fullName,
                phone: cart.phone,
                address: cart.address,
                product: cart.product,
                totalPrice: finalAmount,
                status: 'pending',
                paymentMethod: 'cod',
                couponId: couponId || null,
                discountAmount: discountAmount || 0,
            });
            await modelCart.deleteOne({ userId: id });
            return new Created({
                message: 'Tạo đơn hàng thành công',
                metadata: payments,
            }).send(res);
        } else if (typePayment === 'momo') {
            var partnerCode = 'MOMO';

            var accessKey = 'F8BBA842ECF85';
            var secretkey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = `thanh toan ${cart._id}`; // nội dung giao dịch thanh toán
            var redirectUrl = buildReturnUrl('/api/payments/check-payment-momo');
            var ipnUrl = buildReturnUrl('/api/payments/check-payment-momo');
            // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
            var amount = finalAmount;
            var requestType = 'captureWallet';
            var extraData = ''; //pass empty value if your merchant does not have stores

            var rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;
            //puts raw signature

            //signature
            var signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: 'en',
            });

            const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return new Created({ message: 'Thanh toán thành công', metadata: response.data.payUrl }).send(res);
        } else if (typePayment === 'vnpay') {
            const vnpay = new VNPay(getVnPayConfig());
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const resVnpay = vnpay.buildPaymentUrl({
                // The installed vnpay SDK multiplies VND amounts by 100 internally.
                vnp_Amount: Math.round(finalAmount),
                vnp_IpAddr: req.ip || '127.0.0.1',
                vnp_TxnRef: String(cart._id),
                vnp_OrderInfo: String(cart._id),
                vnp_OrderType: ProductCode.Other,
                vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || buildReturnUrl('/api/payments/check-payment-vnpay'),
                vnp_Locale: VnpLocale.VN,
                vnp_CreateDate: dateFormat(new Date()),
                vnp_ExpireDate: dateFormat(tomorrow),
            });

            return new Created({
                message: 'Tạo đơn hàng thành công',
                statusCode: 201,
                metadata: resVnpay,
            }).send(res);
        }
    }

    async checkPaymentMomo(req, res, next) {
        const { orderInfo, resultCode } = req.query;
        if (resultCode === '0') {
            const result = orderInfo.split(' ')[2];
            const findCart = await modelCart.findOne({ _id: result });

            // Tính tổng tiền bao gồm cả tiền cọc
            let depositConfig = await modelDepositConfig.findOne();
            if (!depositConfig) {
                depositConfig = {
                    globalDeposit: 50000,
                    useGlobalDeposit: true,
                };
            }

            let totalAmount = 0;
            for (const item of findCart.product) {
                const product = await modelProduct.findById(item.productId);
                if (product) {
                    const startDate = new Date(item.startDate);
                    const endDate = new Date(item.endDate);
                    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                    let depositAmount = 50000;
                    if (depositConfig.useGlobalDeposit) {
                        depositAmount = depositConfig.globalDeposit;
                    } else {
                        const category = await modelCategory.findById(product.category);
                        depositAmount = category?.deposit || product.deposit || 50000;
                    }

                    const rentalPrice = product.price * item.quantity * days;
                    const depositPrice = depositAmount * item.quantity;
                    totalAmount += rentalPrice + depositPrice;
                }
            }

            const newPayment = new modelPayments({
                fullName: findCart.fullName,
                phone: findCart.phone,
                address: findCart.address,
                product: findCart.product,
                totalPrice: totalAmount,
                paymentMethod: 'MOMO',
                userId: findCart.userId,
                status: 'pending',
            });

            await newPayment.save();
            await findCart.deleteOne();
            return res.redirect(`${process.env.DOMAIN_URL}/payments/${newPayment._id}`);
        }
    }

    async checkPaymentVnpay(req, res) {
        const { vnp_OrderInfo, vnp_ResponseCode } = req.query;

        try {
            const isValidChecksum = validateVnPayChecksum(
                req.query,
                process.env.VNPAY_HASH_SECRET || 'DEMO_SECRET_KEY',
            );
            if (!isValidChecksum) {
                return res.status(400).json({ message: 'Checksum VNPay không hợp lệ' });
            }

            if (vnp_ResponseCode !== '00') {
                const clientUrl = process.env.CLIENT_URL || process.env.DOMAIN_URL || 'http://localhost:5173';
                return res.redirect(`${clientUrl}/payments/failure?code=${vnp_ResponseCode || 'unknown'}`);
            }

            const findCart = await modelCart.findOne({ _id: vnp_OrderInfo });
            if (!findCart) {
                throw new BadRequestError('Giỏ hàng không tồn tại');
            }

            let depositConfig = await modelDepositConfig.findOne();
            if (!depositConfig) {
                depositConfig = {
                    globalDeposit: 50000,
                    useGlobalDeposit: true,
                };
            }

            let totalAmount = 0;
            for (const item of findCart.product) {
                const product = await Book.findById(item.productId);
                if (product) {
                    const startDate = new Date(item.startDate);
                    const endDate = new Date(item.endDate);
                    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                    let depositAmount = 50000;
                    if (depositConfig.useGlobalDeposit) {
                        depositAmount = depositConfig.globalDeposit;
                    } else {
                        const category = await modelCategory.findById(product.category);
                        depositAmount = category?.deposit || product.deposit || 50000;
                    }

                    const rentalPrice = product.price * item.quantity * days;
                    const depositPrice = depositAmount * item.quantity;
                    totalAmount += rentalPrice + depositPrice;
                }
            }

            const newPayment = new modelPayments({
                fullName: findCart.fullName,
                phone: findCart.phone,
                address: findCart.address,
                product: findCart.product,
                totalPrice: totalAmount,
                paymentMethod: 'VNPAY',
                userId: findCart.userId,
                status: 'pending',
            });
            await newPayment.save();
            await findCart.deleteOne();
            return res.redirect(`${process.env.DOMAIN_URL || 'http://localhost:5173'}/payments/${newPayment._id}`);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getPaymentById(req, res) {
        const { id } = req.query;

        const payment = await modelPayments.findById(id);
        if (!payment) {
            throw new BadRequestError('Đơn hàng không tồn tại');
        }

        // Lấy cấu hình deposit
        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        const detailedProducts = await Promise.all(
            payment.product.map(async (item) => {
                const product = await modelProduct.findById(item.productId).lean();

                // Tính số ngày thuê
                const startDate = new Date(item.startDate);
                const endDate = new Date(item.endDate);
                const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                // Xác định tiền cọc
                let depositAmount = 50000;
                if (depositConfig.useGlobalDeposit) {
                    depositAmount = depositConfig.globalDeposit;
                } else {
                    const category = await modelCategory.findById(product.category);
                    depositAmount = category?.deposit || product.deposit || 50000;
                }

                const rentalPrice = product.price * item.quantity * days;
                const depositPrice = depositAmount * item.quantity;

                return {
                    product,
                    quantity: item.quantity,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    days: days,
                    rentalPrice: rentalPrice,
                    depositPrice: depositPrice,
                    totalPrice: rentalPrice + depositPrice,
                };
            }),
        );

        return new OK({
            message: 'Lấy đơn hàng thành công',
            metadata: {
                _id: payment._id,
                userId: payment.userId,
                fullName: payment.fullName,
                phone: payment.phone,
                address: payment.address,
                products: detailedProducts,
                totalPrice: payment.totalPrice,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
            },
        }).send(res);
    }

    async getPaymentByUserId(req, res) {
        const { id } = req.user;

        const payments = await modelPayments.find({ userId: id }).sort({ createdAt: -1 }); // sắp xếp mới nhất

        // Lấy cấu hình deposit
        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        const data = await Promise.all(
            payments.map(async (payment) => {
                const detailedProducts = await Promise.all(
                    payment.product.map(async (item) => {
                        const product = await modelProduct.findById(item.productId).lean();

                        // Tính số ngày thuê
                        const startDate = new Date(item.startDate);
                        const endDate = new Date(item.endDate);
                        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                        // Xác định tiền cọc
                        let depositAmount = 50000;
                        if (depositConfig.useGlobalDeposit) {
                            depositAmount = depositConfig.globalDeposit;
                        } else {
                            const category = await modelCategory.findById(product.category);
                            depositAmount = category?.deposit || product.deposit || 50000;
                        }

                        const rentalPrice = product.price * item.quantity * days;
                        const depositPrice = depositAmount * item.quantity;

                        return {
                            product,
                            quantity: item.quantity,
                            startDate: item.startDate,
                            endDate: item.endDate,
                            days: days,
                            rentalPrice: rentalPrice,
                            depositPrice: depositPrice,
                            totalPrice: rentalPrice + depositPrice,
                        };
                    }),
                );

                return {
                    _id: payment._id,
                    fullName: payment.fullName,
                    phone: payment.phone,
                    address: payment.address,
                    products: detailedProducts,
                    totalPrice: payment.totalPrice,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                };
            }),
        );

        return new OK({
            message: 'Lấy đơn hàng thành công',
            metadata: data,
        }).send(res);
    }

    async cancelOrder(req, res) {
        const { id } = req.body;
        const payment = await modelPayments.findById(id);
        if (!payment) {
            throw new BadRequestError('Đơn hàng không tồn tại');
        }
        payment.status = 'cancelled';
        await payment.save();
        return new OK({
            message: 'Huỷ đơn hàng thành công',
        }).send(res);
    }

    async getPaymentsAdmin(req, res) {
        const payments = await modelPayments.find().sort({ createdAt: -1 });

        // Lấy cấu hình deposit
        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        const data = await Promise.all(
            payments.map(async (payment) => {
                const detailedProducts = await Promise.all(
                    payment.product.map(async (item) => {
                        const product = await modelProduct.findById(item.productId).lean();

                        // Tính số ngày thuê
                        const startDate = new Date(item.startDate);
                        const endDate = new Date(item.endDate);
                        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                        // Xác định tiền cọc
                        let depositAmount = 50000;
                        if (depositConfig.useGlobalDeposit) {
                            depositAmount = depositConfig.globalDeposit;
                        } else {
                            const category = await modelCategory.findById(product.category);
                            depositAmount = category?.deposit || product.deposit || 50000;
                        }

                        const rentalPrice = product.price * item.quantity * days;
                        const depositPrice = depositAmount * item.quantity;

                        return {
                            product,
                            quantity: item.quantity,
                            startDate: item.startDate,
                            endDate: item.endDate,
                            days: days,
                            rentalPrice: rentalPrice,
                            depositPrice: depositPrice,
                            totalPrice: rentalPrice + depositPrice,
                        };
                    }),
                );

                return {
                    _id: payment._id,
                    fullName: payment.fullName,
                    phone: payment.phone,
                    address: payment.address,
                    products: detailedProducts,
                    totalPrice: payment.totalPrice,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                };
            }),
        );
        return new OK({
            message: 'Lấy đơn hàng thành công',
            metadata: data,
        }).send(res);
    }

    async updateOrderStatus(req, res) {
        const { id, status } = req.body;
        const payment = await modelPayments.findById(id);
        if (!payment) {
            throw new BadRequestError('Đơn hàng không tồn tại');
        }
        payment.status = status;
        await payment.save();
        return new OK({
            message: 'Cập nhật trạng thái đơn hàng thành công',
        }).send(res);
    }

    async createOrderByAdmin(req, res) {
        const { fullName, phone, address, products, paymentMethod } = req.body;

        // Validate dữ liệu
        if (!fullName || !phone || !address || !products || products.length === 0) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin đơn hàng');
        }

        // Lấy cấu hình deposit
        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        // Tính tổng tiền
        let totalAmount = 0;
        const productList = [];

        for (const item of products) {
            const product = await modelProduct.findById(item.productId);
            if (!product) {
                throw new BadRequestError(`Sản phẩm ${item.productId} không tồn tại`);
            }

            // Tính số ngày thuê
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

            if (days < 1) {
                throw new BadRequestError('Ngày trả phải sau ngày thuê');
            }

            // Xác định tiền cọc
            let depositAmount = 50000;
            if (depositConfig.useGlobalDeposit) {
                depositAmount = depositConfig.globalDeposit;
            } else {
                const category = await modelCategory.findById(product.category);
                depositAmount = category?.deposit || product.deposit || 50000;
            }

            // Tính tổng = (giá thuê × số lượng × số ngày) + (tiền cọc × số lượng)
            const rentalPrice = product.price * item.quantity * days;
            const depositPrice = depositAmount * item.quantity;
            totalAmount += rentalPrice + depositPrice;

            productList.push({
                productId: item.productId,
                quantity: item.quantity,
                startDate: item.startDate,
                endDate: item.endDate,
            });
        }

        // Tạo đơn hàng
        const newPayment = await modelPayments.create({
            fullName,
            phone,
            address,
            product: productList,
            totalPrice: totalAmount,
            status: 'pending',
            paymentMethod: paymentMethod || 'cod',
        });

        return new Created({
            message: 'Tạo đơn hàng thành công',
            metadata: newPayment,
        }).send(res);
    }

    async deleteOrder(req, res) {
        const { orderId } = req.body;
        const payment = await modelPayments.findById(orderId);
        if (!payment) {
            throw new BadRequestError('Đơn hàng không tồn tại');
        }

        // Chỉ cho phép xóa đơn hàng ở trạng thái 'pending' hoặc 'cancelled'
        if (payment.status !== 'pending' && payment.status !== 'cancelled') {
            throw new BadRequestError('Chỉ có thể xóa đơn hàng đang chờ xử lý hoặc đã hủy');
        }

        await modelPayments.findByIdAndDelete(orderId);

        return new OK({
            message: 'Xóa đơn hàng thành công',
        }).send(res);
    }
}

module.exports = new PaymentsController();
