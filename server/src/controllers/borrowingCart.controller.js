const BorrowingCart = require('../models/borrowingCart.model');
const Book = require('../models/books.model');
const modelDepositConfig = require('../models/depositConfig.model');
const modelCategory = require('../models/category.model');

const { BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

class BorrowingCartController {
    async createCart(req, res) {
        const { id } = req.user;
        const { bookId, borrowDate, dueDate, quantity } = req.body;

        // Validate dữ liệu
        if (!bookId || !quantity || quantity <= 0) {
            throw new BadRequestError('Thiếu hoặc sai thông tin sách hoặc số lượng');
        }

        if (!borrowDate || !dueDate) {
            throw new BadRequestError('Vui lòng chọn ngày mượn và ngày trả');
        }

        const findBook = await Book.findById(bookId);
        if (!findBook) {
            throw new BadRequestError('Sách không tồn tại');
        }

        // Check availability
        if (findBook.availableCopies < quantity) {
            throw new BadRequestError(`Chỉ còn ${findBook.availableCopies} bản sách có sẵn`);
        }

        // Tính số ngày mượn
        const borrow = new Date(borrowDate);
        const due = new Date(dueDate);
        const days = Math.ceil((due - borrow) / (1000 * 60 * 60 * 24)) + 1; // +1 để tính cả ngày cuối

        if (days < 1) {
            throw new BadRequestError('Ngày trả phải sau ngày mượn');
        }

        // Tính phí thuê = dailyRentalFee × số lượng × số ngày
        const itemRentalFee = findBook.dailyRentalFee * quantity * days;

        let cart = await BorrowingCart.findOne({ userId: id });

        if (cart) {
            const bookIndex = cart.books.findIndex((item) => item.bookId.toString() === bookId.toString());

            if (bookIndex !== -1) {
                // Sách đã có trong giỏ, cộng thêm số lượng
                cart.books[bookIndex].quantity += quantity;
            } else {
                // Thêm sách mới vào giỏ
                cart.books.push({
                    bookId: bookId,
                    quantity,
                    borrowDate,
                    dueDate,
                });
            }

            cart.totalRentalFee += itemRentalFee;
            await cart.save();

            return new OK({
                message: 'Cập nhật giỏ mượn sách thành công',
                metadata: cart,
            }).send(res);
        } else {
            // Tạo giỏ mượn mới
            const newCart = await BorrowingCart.create({
                userId: id,
                books: [
                    {
                        bookId: bookId,
                        quantity,
                        borrowDate,
                        dueDate,
                    },
                ],
                totalRentalFee: itemRentalFee,
                // Thông tin người dùng
                fullName: req.user.fullName || '',
                phone: req.user.phone || '',
                studentClass: req.user.studentClass || '',
                studentId: req.user.studentId || '',
            });

            return new OK({
                message: 'Tạo giỏ mượn sách thành công',
                metadata: newCart,
            }).send(res);
        }
    }

    async getCart(req, res) {
        const { id } = req.user;
        const cart = await BorrowingCart.findOne({ userId: id });

        if (!cart) {
            return new OK({
                message: 'Giỏ mượn sách trống',
                metadata: { books: [], totalRentalFee: 0, totalDeposit: 0, totalAmount: 0 },
            }).send(res);
        }

        // Lấy cấu hình deposit
        let depositConfig = await modelDepositConfig.findOne();
        if (!depositConfig) {
            depositConfig = {
                globalDeposit: 50000,
                useGlobalDeposit: true,
            };
        }

        const data = await Promise.all(
            cart.books.map(async (item) => {
                const book = await Book.findById(item.bookId);

                if (!book) {
                    return null;
                }

                // Tính số ngày mượn
                const borrowDate = new Date(item.borrowDate);
                const dueDate = new Date(item.dueDate);
                const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

                // Xác định tiền cọc
                let depositAmount = 50000; // Mặc định
                if (depositConfig.useGlobalDeposit) {
                    depositAmount = depositConfig.globalDeposit;
                } else {
                    const category = await modelCategory.findById(book.category);
                    depositAmount = category?.deposit || book.securityDeposit || 50000;
                }

                // Tính phí thuê và tiền cọc
                const rentalFee = book.dailyRentalFee * item.quantity * days;
                const depositFee = depositAmount * item.quantity;
                const totalPrice = rentalFee + depositFee;

                return {
                    ...item._doc,
                    book: book,
                    days: days,
                    rentalFee: rentalFee,
                    depositFee: depositFee,
                    totalPrice: totalPrice,
                };
            }),
        );

        // Filter out null entries (deleted books)
        const validData = data.filter((item) => item !== null);

        return new OK({
            message: 'Lấy giỏ mượn sách thành công',
            metadata: validData,
        }).send(res);
    }

    async updateQuantity(req, res) {
        const { id } = req.user;
        const { bookId, quantity } = req.body;

        // Validate
        if (!bookId || !quantity || quantity <= 0) {
            throw new BadRequestError('Thông tin sách hoặc số lượng không hợp lệ');
        }

        const cart = await BorrowingCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ mượn sách không tồn tại');
        }

        const bookIndex = cart.books.findIndex((item) => item.bookId.toString() === bookId.toString());

        if (bookIndex === -1) {
            throw new BadRequestError('Sách không có trong giỏ mượn');
        }

        // Check availability
        const book = await Book.findById(bookId);
        if (!book) {
            throw new BadRequestError('Sách không tồn tại trong hệ thống');
        }

        if (book.availableCopies < quantity) {
            throw new BadRequestError(`Chỉ còn ${book.availableCopies} bản sách có sẵn`);
        }

        // Cập nhật số lượng
        cart.books[bookIndex].quantity = quantity;

        // Tính lại toàn bộ totalRentalFee
        let newTotalRental = 0;
        for (const item of cart.books) {
            const bookInfo = await Book.findById(item.bookId);
            if (bookInfo) {
                const borrowDate = new Date(item.borrowDate);
                const dueDate = new Date(item.dueDate);
                const days = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24)) + 1;

                newTotalRental += bookInfo.dailyRentalFee * item.quantity * days;
            }
        }
        cart.totalRentalFee = newTotalRental;

        await cart.save();

        return new OK({
            message: 'Cập nhật số lượng thành công',
            metadata: cart,
        }).send(res);
    }

    async deleteItem(req, res) {
        const { id } = req.user;
        const { bookId } = req.body;

        const cart = await BorrowingCart.findOne({ userId: id });

        if (!cart) {
            throw new BadRequestError('Giỏ mượn sách không tồn tại');
        }

        const bookIndex = cart.books.findIndex((item) => item.bookId.toString() === bookId.toString());

        if (bookIndex === -1) {
            throw new BadRequestError('Sách không có trong giỏ mượn');
        }

        cart.books.splice(bookIndex, 1);
        await cart.save();

        return new OK({
            message: 'Xóa sách khỏi giỏ mượn thành công',
            metadata: cart,
        }).send(res);
    }

    async updateInfoCart(req, res) {
        const { fullName, phone, studentClass, studentId } = req.body;
        const { id } = req.user;

        if (!fullName || !phone) {
            throw new BadRequestError('Vui lòng nhập họ tên và số điện thoại');
        }

        const cart = await BorrowingCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ mượn sách không tồn tại');
        }

        cart.fullName = fullName;
        cart.phone = phone;
        cart.studentClass = studentClass;
        cart.studentId = studentId || '';

        await cart.save();

        return new OK({
            message: 'Cập nhật thông tin sinh viên thành công',
            metadata: cart,
        }).send(res);
    }

    async updateBorrowingDates(req, res) {
        const { id } = req.user;
        const { bookId, borrowDate, dueDate } = req.body;

        // Validate
        if (!bookId || !borrowDate || !dueDate) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin ngày mượn và ngày trả');
        }

        // Kiểm tra ngày trả phải sau ngày mượn
        const borrow = new Date(borrowDate);
        const due = new Date(dueDate);
        const days = Math.ceil((due - borrow) / (1000 * 60 * 60 * 24)) + 1;

        if (days < 1) {
            throw new BadRequestError('Ngày trả phải sau ngày mượn');
        }

        const cart = await BorrowingCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ mượn sách không tồn tại');
        }

        const bookIndex = cart.books.findIndex((item) => item.bookId.toString() === bookId.toString());

        if (bookIndex === -1) {
            throw new BadRequestError('Sách không có trong giỏ mượn');
        }

        // Cập nhật ngày mượn và ngày trả
        cart.books[bookIndex].borrowDate = borrowDate;
        cart.books[bookIndex].dueDate = dueDate;

        // Tính lại tổng phí thuê cho toàn bộ giỏ
        let newTotalRental = 0;
        for (const item of cart.books) {
            const bookInfo = await Book.findById(item.bookId);
            if (bookInfo) {
                const itemBorrow = new Date(item.borrowDate);
                const itemDue = new Date(item.dueDate);
                const itemDays = Math.ceil((itemDue - itemBorrow) / (1000 * 60 * 60 * 24)) + 1;

                newTotalRental += bookInfo.dailyRentalFee * item.quantity * itemDays;
            }
        }
        cart.totalRentalFee = newTotalRental;

        await cart.save();

        return new OK({
            message: 'Cập nhật ngày mượn trả thành công',
            metadata: cart,
        }).send(res);
    }

    async placeBorrowingRequest(req, res) {
        const { id } = req.user;
        const { appliedBenefitId, discountAmount } = req.body;

        const cart = await BorrowingCart.findOne({ userId: id });

        if (!cart) {
            throw new BadRequestError('Giỏ mượn sách không tồn tại');
        }

        if (!cart.fullName || !cart.phone || !cart.studentClass) {
            throw new BadRequestError('Vui lòng cập nhật thông tin sinh viên');
        }

        if (!cart.books || cart.books.length === 0) {
            throw new BadRequestError('Giỏ mượn sách trống');
        }

        // Validate availability for all books
        for (const item of cart.books) {
            const book = await Book.findById(item.bookId);
            if (!book) {
                throw new BadRequestError(`Sách ${item.bookId} không tồn tại`);
            }
            if (book.availableCopies < item.quantity) {
                throw new BadRequestError(`Sách "${book.title}" chỉ còn ${book.availableCopies} bản có sẵn`);
            }
        }

        // Calculate totals
        await cart.calculateTotals();

        // Apply discount if any
        if (appliedBenefitId) {
            cart.appliedBenefitId = appliedBenefitId;
        }
        if (discountAmount) {
            cart.discountAmount = discountAmount;
        }

        await cart.save();

        return new OK({
            message: 'Đã tạo yêu cầu mượn sách. Vui lòng chờ thủ thư xử lý.',
            metadata: cart,
        }).send(res);
    }
}

module.exports = new BorrowingCartController();
