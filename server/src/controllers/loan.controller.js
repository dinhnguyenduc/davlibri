const BorrowingCart = require('../models/borrowingCart.model');
const Loan = require('../models/loan.model');
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

class LoanController {
    async createLoan(req, res) {
        const { id } = req.user;
        const { feePaymentMethod, couponId, discountAmount } = req.body;

        const cart = await BorrowingCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ mượn sách không tồn tại');
        }
        if (!cart.fullName || !cart.phone) {
            throw new BadRequestError('Vui lòng cập nhật họ tên và số điện thoại');
        }

        // Tính tổng tiền bao gồm cả tiền cọc
        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        let totalRentalFee = 0;
        let totalDeposit = 0;
        const loanBooks = [];

        for (const item of cart.books) {
            const book = await Book.findById(item.bookId);
            if (!book) {
                throw new BadRequestError(`Sách ${item.bookId} không tồn tại`);
            }

            // Check availability
            if (book.availableCopies < item.quantity) {
                throw new BadRequestError(`Sách "${book.title}" chỉ còn ${book.availableCopies} bản có sẵn`);
            }

            // Tính số ngày mượn
            const borrowDate = new Date(item.borrowDate);
            const dueDate = new Date(item.dueDate);
            const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

            // Xác định tiền cọc
            let depositAmount = 50000;
            if (depositConfig.useGlobalDeposit) {
                depositAmount = depositConfig.globalDeposit;
            } else {
                const category = await modelCategory.findById(book.category);
                depositAmount = category?.deposit || book.securityDeposit || 50000;
            }

            const rentalFee = book.dailyRentalFee * item.quantity * days;
            const depositFee = depositAmount * item.quantity;

            totalRentalFee += rentalFee;
            totalDeposit += depositFee;

            loanBooks.push({
                bookId: item.bookId,
                quantity: item.quantity,
                borrowDate: item.borrowDate,
                dueDate: item.dueDate,
                rentalFee: rentalFee,
                depositAmount: depositFee,
                itemStatus: 'active',
            });
        }

        const totalAmount = totalRentalFee + totalDeposit;

        // Trừ đi số tiền giảm giá nếu có
        const finalAmount = totalAmount - (discountAmount || 0);

        // Tăng số lần sử dụng coupon nếu có
        if (couponId) {
            const coupon = await modelCoupon.findById(couponId);
            if (coupon) {
                coupon.usedCount += 1;
                await coupon.save();
            }
        }

        if (feePaymentMethod === 'cod') {
            // Giảm số lượng sách có sẵn
            for (const item of cart.books) {
                const book = await Book.findById(item.bookId);
                await book.borrowBook(item.quantity);
            }

            const loan = await Loan.create({
                userId: id,
                fullName: cart.fullName,
                phone: cart.phone,
                studentClass: cart.studentClass,
                studentId: cart.studentId,
                books: loanBooks,
                totalRentalFee: totalRentalFee,
                totalDeposit: totalDeposit,
                totalAmount: finalAmount,
                status: 'requested', // Library context: requires librarian approval
                feePaymentMethod: 'cash',
                appliedBenefitId: couponId || null,
                discountAmount: discountAmount || 0,
            });

            await BorrowingCart.deleteOne({ userId: id });

            return new Created({
                message: 'Tạo yêu cầu mượn sách thành công. Vui lòng chờ thủ thư phê duyệt.',
                metadata: loan,
            }).send(res);
        } else if (feePaymentMethod === 'momo') {
            var partnerCode = 'MOMO';
            var accessKey = 'F8BBA842ECF85';
            var secretkey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = `thanh toan phi muon sach ${cart._id}`;
            var redirectUrl = buildReturnUrl('/api/loans/check-payment-momo');
            var ipnUrl = buildReturnUrl('/api/loans/check-payment-momo');
            var amount = finalAmount;
            var requestType = 'captureWallet';
            var extraData = '';

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

            var signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');

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
        } else if (feePaymentMethod === 'vnpay') {
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
                vnp_ReturnUrl: process.env.VNPAY_RETURN_URL_LOAN || buildReturnUrl('/api/loans/check-payment-vnpay'),
                vnp_Locale: VnpLocale.VN,
                vnp_CreateDate: dateFormat(new Date()),
                vnp_ExpireDate: dateFormat(tomorrow),
            });

            return new Created({
                message: 'Tạo yêu cầu mượn sách thành công',
                statusCode: 201,
                metadata: resVnpay,
            }).send(res);
        }
    }

    async checkPaymentMomo(req, res, next) {
        const { orderInfo, resultCode } = req.query;
        if (resultCode === '0') {
            const result = orderInfo.split(' ')[4];
            const findCart = await BorrowingCart.findOne({ _id: result });

            let depositConfig = await modelDepositConfig.findOne();
            if (!depositConfig) {
                depositConfig = {
                    globalDeposit: 50000,
                    useGlobalDeposit: true,
                };
            }

            let totalRentalFee = 0;
            let totalDeposit = 0;
            const loanBooks = [];

            for (const item of findCart.books) {
                const book = await Book.findById(item.bookId);
                if (book) {
                    const borrowDate = new Date(item.borrowDate);
                    const dueDate = new Date(item.dueDate);
                    const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

                    let depositAmount = 50000;
                    if (depositConfig.useGlobalDeposit) {
                        depositAmount = depositConfig.globalDeposit;
                    } else {
                        const category = await modelCategory.findById(book.category);
                        depositAmount = category?.deposit || book.securityDeposit || 50000;
                    }

                    const rentalFee = book.dailyRentalFee * item.quantity * days;
                    const depositFee = depositAmount * item.quantity;

                    totalRentalFee += rentalFee;
                    totalDeposit += depositFee;

                    // Decrease available copies
                    await book.borrowBook(item.quantity);

                    loanBooks.push({
                        bookId: item.bookId,
                        quantity: item.quantity,
                        borrowDate: item.borrowDate,
                        dueDate: item.dueDate,
                        rentalFee: rentalFee,
                        depositAmount: depositFee,
                        itemStatus: 'active',
                    });
                }
            }

            const newLoan = new Loan({
                fullName: findCart.fullName,
                phone: findCart.phone,
                studentClass: findCart.studentClass,
                studentId: findCart.studentId,
                books: loanBooks,
                totalRentalFee: totalRentalFee,
                totalDeposit: totalDeposit,
                totalAmount: totalRentalFee + totalDeposit,
                feePaymentMethod: 'momo',
                userId: findCart.userId,
                status: 'requested',
            });

            await newLoan.save();
            await findCart.deleteOne();
            return res.redirect(`${process.env.DOMAIN_URL}/loan/${newLoan._id}`);
        }
    }

    async checkPaymentVnpay(req, res) {
        const { vnp_OrderInfo, vnp_ResponseCode } = req.query;
        try {
            const isValidChecksum = validateVnPayChecksum(
                req.query,
                process.env.VNPAY_HASH_SECRET || 'GHQWIXNOHTHSXWFKENMRTOWAMJXSBJVE',
            );
            if (!isValidChecksum) {
                return res.status(400).json({ message: 'Checksum VNPay không hợp lệ' });
            }

            if (vnp_ResponseCode !== '00') {
                const clientUrl = process.env.CLIENT_URL || process.env.DOMAIN_URL || 'http://localhost:5173';
                return res.redirect(`${clientUrl}/payment-demo?status=failure&code=${vnp_ResponseCode || 'unknown'}`);
            }

            if (vnp_ResponseCode === '00') {
                const findCart = await BorrowingCart.findOne({ _id: vnp_OrderInfo });

                let depositConfig = await modelDepositConfig.findOne();
                if (!depositConfig) {
                    depositConfig = {
                        globalDeposit: 50000,
                        useGlobalDeposit: true,
                    };
                }

                let totalRentalFee = 0;
                let totalDeposit = 0;
                const loanBooks = [];

                for (const item of findCart.books) {
                    const book = await Book.findById(item.bookId);
                    if (book) {
                        const borrowDate = new Date(item.borrowDate);
                        const dueDate = new Date(item.dueDate);
                        const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

                        let depositAmount = 50000;
                        if (depositConfig.useGlobalDeposit) {
                            depositAmount = depositConfig.globalDeposit;
                        } else {
                            const category = await modelCategory.findById(book.category);
                            depositAmount = category?.deposit || book.securityDeposit || 50000;
                        }

                        const rentalFee = book.dailyRentalFee * item.quantity * days;
                        const depositFee = depositAmount * item.quantity;

                        totalRentalFee += rentalFee;
                        totalDeposit += depositFee;

                        // Decrease available copies
                        await book.borrowBook(item.quantity);

                        loanBooks.push({
                            bookId: item.bookId,
                            quantity: item.quantity,
                            borrowDate: item.borrowDate,
                            dueDate: item.dueDate,
                            rentalFee: rentalFee,
                            depositAmount: depositFee,
                            itemStatus: 'active',
                        });
                    }
                }

                const newLoan = new Loan({
                    fullName: findCart.fullName,
                    phone: findCart.phone,
                    studentClass: findCart.studentClass,
                    studentId: findCart.studentId,
                    books: loanBooks,
                    totalRentalFee: totalRentalFee,
                    totalDeposit: totalDeposit,
                    totalAmount: totalRentalFee + totalDeposit,
                    feePaymentMethod: 'vnpay',
                    userId: findCart.userId,
                    status: 'requested',
                });
                await newLoan.save();
                await findCart.deleteOne();
                return res.redirect(
                    `${process.env.CLIENT_URL || process.env.DOMAIN_URL || 'http://localhost:5173'}/loan/${newLoan._id}`,
                );
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getLoanById(req, res) {
        const { id } = req.query;

        const loan = await Loan.findById(id);
        if (!loan) {
            throw new BadRequestError('Giao dịch mượn sách không tồn tại');
        }

        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        const detailedBooks = await Promise.all(
            loan.books.map(async (item) => {
                const book = await Book.findById(item.bookId).lean();

                const borrowDate = new Date(item.borrowDate);
                const dueDate = new Date(item.dueDate);
                const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

                let depositAmount = 50000;
                if (depositConfig.useGlobalDeposit) {
                    depositAmount = depositConfig.globalDeposit;
                } else {
                    const category = await modelCategory.findById(book.category);
                    depositAmount = category?.deposit || book.securityDeposit || 50000;
                }

                const rentalFee = book.dailyRentalFee * item.quantity * days;
                const depositFee = depositAmount * item.quantity;

                return {
                    book,
                    quantity: item.quantity,
                    borrowDate: item.borrowDate,
                    dueDate: item.dueDate,
                    actualReturnDate: item.actualReturnDate,
                    days: days,
                    rentalFee: rentalFee,
                    depositFee: depositFee,
                    lateFee: item.lateFee || 0,
                    damageFee: item.damageFee || 0,
                    totalPrice: rentalFee + depositFee + (item.lateFee || 0) + (item.damageFee || 0),
                    itemStatus: item.itemStatus,
                };
            }),
        );

        return new OK({
            message: 'Lấy thông tin mượn sách thành công',
            metadata: {
                _id: loan._id,
                userId: loan.userId,
                fullName: loan.fullName,
                phone: loan.phone,
                studentClass: loan.studentClass,
                studentId: loan.studentId,
                books: detailedBooks,
                totalRentalFee: loan.totalRentalFee,
                totalDeposit: loan.totalDeposit,
                totalLateFee: loan.totalLateFee,
                totalDamageFee: loan.totalDamageFee,
                totalAmount: loan.totalAmount,
                status: loan.status,
                feePaymentMethod: loan.feePaymentMethod,
                createdAt: loan.createdAt,
                updatedAt: loan.updatedAt,
            },
        }).send(res);
    }

    async getLoanByUserId(req, res) {
        const { id } = req.user;

        const loans = await Loan.find({ userId: id }).sort({ createdAt: -1 });

        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        const data = await Promise.all(
            loans.map(async (loan) => {
                const detailedBooks = await Promise.all(
                    loan.books.map(async (item) => {
                        const book = await Book.findById(item.bookId).lean();

                        const borrowDate = new Date(item.borrowDate);
                        const dueDate = new Date(item.dueDate);
                        const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

                        let depositAmount = 50000;
                        if (depositConfig.useGlobalDeposit) {
                            depositAmount = depositConfig.globalDeposit;
                        } else {
                            const category = await modelCategory.findById(book.category);
                            depositAmount = category?.deposit || book.securityDeposit || 50000;
                        }

                        const rentalFee = book.dailyRentalFee * item.quantity * days;
                        const depositFee = depositAmount * item.quantity;

                        return {
                            book,
                            quantity: item.quantity,
                            borrowDate: item.borrowDate,
                            dueDate: item.dueDate,
                            actualReturnDate: item.actualReturnDate,
                            days: days,
                            rentalFee: rentalFee,
                            depositFee: depositFee,
                            lateFee: item.lateFee || 0,
                            damageFee: item.damageFee || 0,
                            totalPrice: rentalFee + depositFee + (item.lateFee || 0) + (item.damageFee || 0),
                            itemStatus: item.itemStatus,
                        };
                    }),
                );

                return {
                    _id: loan._id,
                    fullName: loan.fullName,
                    phone: loan.phone,
                    studentClass: loan.studentClass,
                    studentId: loan.studentId,
                    books: detailedBooks,
                    totalRentalFee: loan.totalRentalFee,
                    totalDeposit: loan.totalDeposit,
                    totalLateFee: loan.totalLateFee,
                    totalDamageFee: loan.totalDamageFee,
                    totalAmount: loan.totalAmount,
                    status: loan.status,
                    feePaymentMethod: loan.feePaymentMethod,
                    createdAt: loan.createdAt,
                    updatedAt: loan.updatedAt,
                };
            }),
        );

        return new OK({
            message: 'Lấy danh sách mượn sách thành công',
            metadata: data,
        }).send(res);
    }

    async cancelLoan(req, res) {
        const { id } = req.body;
        const loan = await Loan.findById(id);
        if (!loan) {
            throw new BadRequestError('Giao dịch mượn sách không tồn tại');
        }

        if (loan.status !== 'requested' && loan.status !== 'approved') {
            throw new BadRequestError('Chỉ có thể hủy yêu cầu mượn sách đang chờ xử lý hoặc đã phê duyệt');
        }

        // Return books to inventory if status is 'approved' or 'active'
        if (loan.status === 'approved' || loan.status === 'active') {
            for (const item of loan.books) {
                const book = await Book.findById(item.bookId);
                if (book) {
                    await book.returnBook(item.quantity);
                }
            }
        }

        loan.status = 'cancelled';
        await loan.save();

        return new OK({
            message: 'Hủy yêu cầu mượn sách thành công',
        }).send(res);
    }

    async getLoansAdmin(req, res) {
        const loans = await Loan.find().sort({ createdAt: -1 });

        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        const data = await Promise.all(
            loans.map(async (loan) => {
                const detailedBooks = await Promise.all(
                    loan.books.map(async (item) => {
                        const book = await Book.findById(item.bookId).lean();

                        const borrowDate = new Date(item.borrowDate);
                        const dueDate = new Date(item.dueDate);
                        const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

                        let depositAmount = 50000;
                        if (depositConfig.useGlobalDeposit) {
                            depositAmount = depositConfig.globalDeposit;
                        } else {
                            const category = await modelCategory.findById(book.category);
                            depositAmount = category?.deposit || book.securityDeposit || 50000;
                        }

                        const rentalFee = book.dailyRentalFee * item.quantity * days;
                        const depositFee = depositAmount * item.quantity;

                        return {
                            book,
                            quantity: item.quantity,
                            borrowDate: item.borrowDate,
                            dueDate: item.dueDate,
                            actualReturnDate: item.actualReturnDate,
                            days: days,
                            rentalFee: rentalFee,
                            depositFee: depositFee,
                            lateFee: item.lateFee || 0,
                            damageFee: item.damageFee || 0,
                            totalPrice: rentalFee + depositFee + (item.lateFee || 0) + (item.damageFee || 0),
                            itemStatus: item.itemStatus,
                        };
                    }),
                );

                return {
                    _id: loan._id,
                    fullName: loan.fullName,
                    phone: loan.phone,
                    studentClass: loan.studentClass,
                    studentId: loan.studentId,
                    books: detailedBooks,
                    totalRentalFee: loan.totalRentalFee,
                    totalDeposit: loan.totalDeposit,
                    totalLateFee: loan.totalLateFee,
                    totalDamageFee: loan.totalDamageFee,
                    totalAmount: loan.totalAmount,
                    status: loan.status,
                    feePaymentMethod: loan.feePaymentMethod,
                    createdAt: loan.createdAt,
                    updatedAt: loan.updatedAt,
                };
            }),
        );

        return new OK({
            message: 'Lấy danh sách mượn sách thành công',
            metadata: data,
        }).send(res);
    }

    async updateLoanStatus(req, res) {
        const { id, status } = req.body;
        const loan = await Loan.findById(id);
        if (!loan) {
            throw new BadRequestError('Giao dịch mượn sách không tồn tại');
        }

        // Validate status transition
        const validStatuses = ['requested', 'approved', 'active', 'returned', 'overdue', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestError('Trạng thái không hợp lệ');
        }

        loan.status = status;
        await loan.save();

        return new OK({
            message: 'Cập nhật trạng thái mượn sách thành công',
        }).send(res);
    }

    async createLoanByAdmin(req, res) {
        const { fullName, phone, studentClass, studentId, books, feePaymentMethod } = req.body;

        if (!fullName || !phone || !books || books.length === 0) {
            throw new BadRequestError('Vui lòng nhập họ tên, số điện thoại và ít nhất một sách');
        }

        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        let totalRentalFee = 0;
        let totalDeposit = 0;
        const loanBooks = [];

        for (const item of books) {
            const book = await Book.findById(item.bookId);
            if (!book) {
                throw new BadRequestError(`Sách ${item.bookId} không tồn tại`);
            }

            if (book.availableCopies < item.quantity) {
                throw new BadRequestError(`Sách "${book.title}" chỉ còn ${book.availableCopies} bản có sẵn`);
            }

            const borrowDate = new Date(item.borrowDate);
            const dueDate = new Date(item.dueDate);
            const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

            if (days < 1) {
                throw new BadRequestError('Ngày trả phải sau ngày mượn');
            }

            let depositAmount = 50000;
            if (depositConfig.useGlobalDeposit) {
                depositAmount = depositConfig.globalDeposit;
            } else {
                const category = await modelCategory.findById(book.category);
                depositAmount = category?.deposit || book.securityDeposit || 50000;
            }

            const rentalFee = book.dailyRentalFee * item.quantity * days;
            const depositFee = depositAmount * item.quantity;

            totalRentalFee += rentalFee;
            totalDeposit += depositFee;

            // Decrease available copies
            await book.borrowBook(item.quantity);

            loanBooks.push({
                bookId: item.bookId,
                quantity: item.quantity,
                borrowDate: item.borrowDate,
                dueDate: item.dueDate,
                rentalFee: rentalFee,
                depositAmount: depositFee,
                itemStatus: 'active',
            });
        }

        const newLoan = await Loan.create({
            fullName,
            phone,
            studentClass,
            studentId,
            books: loanBooks,
            totalRentalFee: totalRentalFee,
            totalDeposit: totalDeposit,
            totalAmount: totalRentalFee + totalDeposit,
            status: 'approved',
            feePaymentMethod: feePaymentMethod === 'cod' ? 'cash' : feePaymentMethod || 'cash',
        });

        return new Created({
            message: 'Tạo mượn sách thành công',
            metadata: newLoan,
        }).send(res);
    }

    async deleteLoan(req, res) {
        const { loanId } = req.body;
        const loan = await Loan.findById(loanId);
        if (!loan) {
            throw new BadRequestError('Giao dịch mượn sách không tồn tại');
        }

        if (loan.status !== 'requested' && loan.status !== 'cancelled') {
            throw new BadRequestError('Chỉ có thể xóa yêu cầu mượn đang chờ xử lý hoặc đã hủy');
        }

        await Loan.findByIdAndDelete(loanId);

        return new OK({
            message: 'Xóa yêu cầu mượn sách thành công',
        }).send(res);
    }

    async returnBook(req, res) {
        const { loanId, bookId, quantity, damageFee = 0 } = req.body;

        if (!loanId || !bookId || !quantity) {
            throw new BadRequestError('Vui lòng cung cấp đầy đủ thông tin');
        }

        const loan = await Loan.findById(loanId);
        if (!loan) {
            throw new BadRequestError('Giao dịch mượn sách không tồn tại');
        }

        // Find the book in loan
        const bookIndex = loan.books.findIndex((item) => item.bookId.toString() === bookId.toString());
        if (bookIndex === -1) {
            throw new BadRequestError('Sách không có trong giao dịch này');
        }

        const loanBook = loan.books[bookIndex];

        if (loanBook.quantity < quantity) {
            throw new BadRequestError('Số lượng trả vượt quá số lượng mượn');
        }

        // Update book inventory
        const book = await Book.findById(bookId);
        if (!book) {
            throw new BadRequestError('Sách không tồn tại');
        }

        await book.returnBook(quantity);

        // Calculate late fee
        const dueDate = new Date(loanBook.dueDate);
        const returnDate = new Date();
        const daysLate = Math.max(0, Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24)));
        const lateFee = daysLate * (book.dailyRentalFee * 0.5) * quantity; // 50% of daily fee as late fee

        // Update loan record
        loanBook.actualReturnDate = returnDate;
        loanBook.lateFee = (loanBook.lateFee || 0) + lateFee;
        loanBook.damageFee = (loanBook.damageFee || 0) + damageFee;
        loanBook.itemStatus = 'returned';

        // Update totals
        loan.totalLateFee = (loan.totalLateFee || 0) + lateFee;
        loan.totalDamageFee = (loan.totalDamageFee || 0) + damageFee;
        loan.totalAmount += lateFee + damageFee;

        // Check if all books are returned
        const allReturned = loan.books.every((item) => item.itemStatus === 'returned');
        if (allReturned) {
            loan.status = 'returned';
        }

        await loan.save();

        return new OK({
            message: 'Trả sách thành công',
            metadata: {
                loan,
                lateFee,
                damageFee,
                totalFees: lateFee + damageFee,
            },
        }).send(res);
    }

    async getOverdueLoans(req, res) {
        const overdueLoans = await Loan.findOverdue();

        return new OK({
            message: 'Lấy danh sách mượn sách quá hạn thành công',
            metadata: overdueLoans,
        }).send(res);
    }

    async getActiveLoans(req, res) {
        const activeLoans = await Loan.findActive();

        return new OK({
            message: 'Lấy danh sách mượn sách đang hoạt động thành công',
            metadata: activeLoans,
        }).send(res);
    }
}

module.exports = new LoanController();
