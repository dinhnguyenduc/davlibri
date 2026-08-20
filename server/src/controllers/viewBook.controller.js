const modelViewBook = require('../models/viewBook.model');
const Book = require('../models/books.model');

const { OK, Created } = require('../core/success.response');

class ViewBookController {
    async createViewBook(req, res) {
        const { bookId } = req.body;
        const { id } = req.user;
        const checkViewBook = await modelViewBook.findOne({ userId: id, bookId });
        if (checkViewBook) {
            return new OK({
                message: 'Sách đã được xem',
            }).send(res);
        }
        const viewBook = await modelViewBook.create({ userId: id, bookId });
        return new Created({
            message: 'Tạo lượt xem sách thành công',
            metadata: viewBook,
        }).send(res);
    }

    async getViewBook(req, res) {
        const { id } = req.user;
        const viewBook = await modelViewBook.find({ userId: id });
        const data = await Promise.all(
            viewBook.map(async (item) => {
                const book = await Book.findById(item.bookId);
                return {
                    ...item._doc,
                    book,
                };
            }),
        );
        return new OK({
            message: 'Lấy lượt xem sách thành công',
            metadata: data,
        }).send(res);
    }
}

module.exports = new ViewBookController();
