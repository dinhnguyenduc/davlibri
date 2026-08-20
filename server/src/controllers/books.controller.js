const Book = require('../models/books.model');
const Category = require('../models/category.model');
const mongoose = require('mongoose');
const cloudinary = require('../utils/configCloudDinary');

const { BadRequestError } = require('../core/error.response');
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

const fs = require('fs/promises');

class BooksController {
    async addBook(req, res) {
        const {
            title,
            author,
            isbn,
            images,
            dailyRentalFee,
            description,
            category,
            availableCopies,
            totalCopies,
            publisher,
            publishingHouse,
            publicationYear,
            coverType,
            securityDeposit,
            displayOrder,
        } = req.body;

        // Validate required fields for library
        if (
            !title ||
            !author ||
            !dailyRentalFee ||
            !description ||
            !category ||
            availableCopies === undefined ||
            totalCopies === undefined ||
            !publisher ||
            !publishingHouse ||
            !coverType ||
            !images
        ) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin sách');
        }

        // Validate business rules
        if (totalCopies < availableCopies) {
            throw new BadRequestError('Số bản sao khả dụng không thể lớn hơn tổng số bản sao');
        }

        if (dailyRentalFee < 0 || availableCopies < 0 || totalCopies < 0) {
            throw new BadRequestError('Giá thuê và số lượng phải là số dương');
        }

        const book = await Book.create({
            title,
            author,
            isbn,
            dailyRentalFee,
            description,
            category,
            availableCopies,
            totalCopies,
            images,
            publisher,
            publishingHouse,
            publicationYear,
            coverType,
            securityDeposit,
            displayOrder: displayOrder && displayOrder > 0 ? displayOrder : 999999,
        });

        return new Created({
            message: 'Thêm sách thành công',
            metadata: book,
        }).send(res);
    }

    async uploadImages(req, res) {
        try {
            const files = req.files;

            const dataFile = await Promise.all(
                files.map(async (item) => {
                    const result = await cloudinary.uploader.upload(item.path, {
                        folder: 'books',
                        resource_type: 'image',
                    });
                    await fs.unlink(item.path);
                    return result.secure_url;
                }),
            );

            return new OK({
                message: 'Upload ảnh thành công',
                metadata: dataFile,
            }).send(res);
        } catch (error) {
            console.error(error);
            return new BadRequestError('Lỗi khi upload ảnh').send(res);
        }
    }

    async deleteImage(req, res) {
        const { id, image } = req.body;
        const book = await Book.findById(id);
        const publicId = getPublicId(image);
        await cloudinary.uploader.destroy(publicId);
        book.images = book.images.filter((img) => img !== image);
        await book.save();
        return new OK({
            message: 'Xóa ảnh thành công',
            metadata: book,
        }).send(res);
    }

    async getAllBooks(req, res) {
        const books = await Book.find().populate('category').sort({ createdAt: -1 });
        console.log('📚 Found books count:', books.length); // Debug log
        return new OK({
            message: 'Lấy danh sách sách thành công',
            metadata: books,
        }).send(res);
    }

    async updateBook(req, res) {
        try {
            console.log('📝 Update book request body:', JSON.stringify(req.body, null, 2));

            const {
                id,
                title,
                author,
                isbn,
                images,
                dailyRentalFee,
                description,
                category,
                availableCopies,
                totalCopies,
                publisher,
                publishingHouse,
                publicationYear,
                coverType,
                securityDeposit,
                displayOrder,
            } = req.body;

            // Get current book to validate against existing values
            const currentBook = await Book.findById(id);
            if (!currentBook) {
                throw new BadRequestError('Không tìm thấy sách');
            }

            // Use provided values or fall back to current values for validation
            const newTotalCopies = totalCopies !== undefined ? totalCopies : currentBook.totalCopies;
            const newAvailableCopies = availableCopies !== undefined ? availableCopies : currentBook.availableCopies;

            // Validate business rules
            if (newTotalCopies < newAvailableCopies) {
                throw new BadRequestError('Số bản có sẵn không thể lớn hơn tổng số bản');
            }

            const book = await Book.findByIdAndUpdate(
                id,
                {
                    title,
                    author,
                    isbn,
                    dailyRentalFee,
                    description,
                    category,
                    availableCopies,
                    totalCopies,
                    publisher,
                    publishingHouse,
                    publicationYear,
                    images,
                    coverType,
                    securityDeposit,
                    displayOrder: displayOrder && displayOrder > 0 ? displayOrder : 999999,
                },
                { new: true, runValidators: true },
            );

            return new OK({
                message: 'Cập nhật thông tin sách thành công',
                metadata: book,
            }).send(res);
        } catch (error) {
            console.error('❌ Update book error:', error);
            throw error;
        }
    }

    async deleteBook(req, res) {
        try {
            const { id } = req.body;
            const book = await Book.findByIdAndDelete(id);

            if (!book) {
                throw new BadRequestError('Không tìm thấy sách');
            }

            // Delete images from Cloudinary - only if they are Cloudinary URLs
            if (book.images && book.images.length > 0) {
                for (const image of book.images) {
                    try {
                        // Only delete if it's a Cloudinary URL
                        if (image && image.includes('cloudinary.com')) {
                            const publicId = getPublicId(image);
                            await cloudinary.uploader.destroy(publicId);
                            console.log(`✅ Deleted image: ${publicId}`);
                        } else {
                            console.log(`⏭️  Skipped non-Cloudinary image: ${image}`);
                        }
                    } catch (imageError) {
                        // Log but don't crash if image deletion fails
                        console.error(`⚠️  Failed to delete image: ${image}`, imageError.message);
                    }
                }
            }

            return new OK({
                message: 'Xóa sách thành công',
                metadata: book,
            }).send(res);
        } catch (error) {
            console.error('❌ Delete book error:', error);
            throw error;
        }
    }

    async getBookById(req, res) {
        const { id } = req.query;
        const book = await Book.findById(id);

        if (!book) {
            throw new BadRequestError('Không tìm thấy sách');
        }

        return new OK({
            message: 'Lấy thông tin sách thành công',
            metadata: book,
        }).send(res);
    }

    async searchBooks(req, res) {
        const { title, author, isbn, genre } = req.query;

        // Build search query for library context
        let searchQuery = {};

        // Search by title
        if (title && title.trim() !== '' && title !== 'undefined') {
            searchQuery.title = { $regex: title, $options: 'i' };
        }

        // Search by author
        if (author && author.trim() !== '' && author !== 'undefined') {
            searchQuery.author = { $regex: author, $options: 'i' };
        }

        // Search by ISBN (exact match)
        if (isbn && isbn.trim() !== '' && isbn !== 'undefined') {
            searchQuery.isbn = isbn;
        }

        // Search by genre/category
        if (genre && genre.trim() !== '' && genre !== 'undefined') {
            searchQuery.category = genre;
        }

        // If no search criteria provided, return empty
        if (Object.keys(searchQuery).length === 0) {
            return new OK({ message: 'Không có tiêu chí tìm kiếm', metadata: [] }).send(res);
        }

        const books = await Book.find(searchQuery);

        if (!books || books.length === 0) {
            return new OK({ message: 'Không tìm thấy sách', metadata: [] }).send(res);
        }

        const validBooks = books.filter((book) => mongoose.Types.ObjectId.isValid(book._id));

        if (validBooks.length === 0) {
            return new OK({ message: 'Không tìm thấy sách', metadata: [] }).send(res);
        }

        return new OK({ message: 'Tìm kiếm sách thành công', metadata: validBooks }).send(res);
    }

    async filterBooks(req, res) {
        const { category, minPrice, maxPrice, author, publisher, availableOnly, sortBy, order } = req.query;

        let filterQuery = {};

        // Filter by category
        if (category && category !== 'undefined') {
            filterQuery.category = category;
        }

        // Filter by daily rental fee range
        if (minPrice || maxPrice) {
            filterQuery.dailyRentalFee = {};
            if (minPrice && minPrice !== 'undefined') {
                filterQuery.dailyRentalFee.$gte = Number(minPrice);
            }
            if (maxPrice && maxPrice !== 'undefined') {
                filterQuery.dailyRentalFee.$lte = Number(maxPrice);
            }
        }

        // Filter by author
        if (author && author !== 'undefined') {
            filterQuery.author = { $regex: author, $options: 'i' };
        }

        // Filter by publisher
        if (publisher && publisher !== 'undefined') {
            filterQuery.publisher = { $regex: publisher, $options: 'i' };
        }

        // Filter available books only
        if (availableOnly === 'true') {
            filterQuery.availableCopies = { $gt: 0 };
        }

        // Build sort options
        let sortOptions = {};
        if (sortBy) {
            const sortOrder = order === 'desc' ? -1 : 1;

            switch (sortBy) {
                case 'borrowCount':
                    sortOptions.borrowCount = sortOrder;
                    break;
                case 'dailyRentalFee':
                    sortOptions.dailyRentalFee = sortOrder;
                    break;
                case 'title':
                    sortOptions.title = sortOrder;
                    break;
                case 'createdAt':
                    sortOptions.createdAt = sortOrder;
                    break;
                default:
                    sortOptions.createdAt = -1;
            }
        } else {
            sortOptions.createdAt = -1;
        }

        const books = await Book.find(filterQuery).sort(sortOptions);

        return new OK({
            message: 'Lọc sách thành công',
            metadata: {
                total: books.length,
                books: books,
            },
        }).send(res);
    }

    async getAvailableBooks(req, res) {
        const books = await Book.findAvailable();
        return new OK({
            message: 'Lấy danh sách sách có sẵn thành công',
            metadata: books,
        }).send(res);
    }

    async getPopularBooks(req, res) {
        const { limit = 10 } = req.query;
        const books = await Book.findPopular(Number(limit));
        return new OK({
            message: 'Lấy danh sách sách phổ biến thành công',
            metadata: books,
        }).send(res);
    }

    async getFeaturedBooks(req, res) {
        const books = await Book.findFeatured();
        return new OK({
            message: 'Lấy danh sách sách nổi bật thành công',
            metadata: books,
        }).send(res);
    }

    async incrementViewCount(req, res) {
        const { id } = req.body;
        const book = await Book.findById(id);

        if (!book) {
            throw new BadRequestError('Không tìm thấy sách');
        }

        await book.incrementView();

        return new OK({
            message: 'Tăng lượt xem thành công',
            metadata: book,
        }).send(res);
    }
}

module.exports = new BooksController();
