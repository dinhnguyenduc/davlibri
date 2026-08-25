import { Carousel, Button, InputNumber, DatePicker, message } from 'antd';
import { ShoppingCartOutlined, CalendarOutlined } from '@ant-design/icons';
import Header from '../Components/Header/Header';
import { useState, useRef, useEffect } from 'react';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';
import { requestCreateCart, requestCreateViewBook, requestGetBookById } from '../config/request';
import { useParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

const fallbackImage = 'https://via.placeholder.com/400x500/f0f0f0/666666?text=No+Image';

function DetailProduct() {
    const [quantity, setQuantity] = useState(1);
    const [carouselIdx, setCarouselIdx] = useState(0);
    const [imageErrors, setImageErrors] = useState({});
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const carouselRef = useRef();
    const [book, setBook] = useState(null);

    const { fetchCart, dataUser } = useStore();
    const { id } = useParams();

    // Xử lý lỗi ảnh
    const handleImageError = (index) => {
        setImageErrors((prev) => ({
            ...prev,
            [index]: true,
        }));
    };

    // Lấy src ảnh với fallback
    const getImageSrc = (index) => {
        return imageErrors[index] ? fallbackImage : book?.images[index];
    };

    // Xử lý thay đổi ngày bắt đầu
    const handleStartDateChange = (date) => {
        setStartDate(date);
        if (endDate && date && endDate.isBefore(date)) {
            setEndDate(date);
        }
    };

    // Xử lý thay đổi ngày kết thúc
    const handleEndDateChange = (date) => {
        setEndDate(date);
    };

    // Kiểm tra ngày kết thúc hợp lệ
    const disabledEndDate = (current) => {
        return startDate ? current && current < startDate : false;
    };

    // Fetch book data
    useEffect(() => {
        const fetchBookById = async () => {
            const book = await requestGetBookById(id);
            setBook(book.metadata);
            if (!dataUser._id) return;
            await requestCreateViewBook({ bookId: book.metadata._id });
        };
        fetchBookById();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Xử lý thêm vào giỏ mượn
    const handleAddToCart = async () => {
        if (!book?._id || !startDate || !endDate) {
            message.warning('Vui lòng chọn sách và thời gian mượn');
            return;
        }

        const data = {
            bookId: book._id,
            quantity: quantity,
            borrowDate: startDate.format('YYYY-MM-DD'),
            dueDate: endDate.format('YYYY-MM-DD'),
        };
        try {
            const res = await requestCreateCart(data);
            message.success(res.message);
            fetchCart();
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể thêm sách vào giỏ mượn');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <Header />

            <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 px-3 sm:px-4">
                {/* Mobile: vertical layout (flex-col), Desktop: 2-column (md:flex-row) */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Left Column - Image Section (Mobile: full width, Desktop: ~40%) */}
                    <div className="w-full md:w-2/5 flex flex-col items-center">
                        {/* Book Image Carousel */}
                        <div className="w-full bg-white rounded-xl shadow-lg mb-4 overflow-hidden relative aspect-[3/4]">
                            <Carousel
                                dots={false}
                                afterChange={setCarouselIdx}
                                ref={carouselRef}
                                className="w-full h-full"
                                effect="fade"
                            >
                                {book?.images &&
                                    book.images.map((src, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-center h-full bg-gray-100 w-full"
                                        >
                                            <img
                                                src={getImageSrc(idx)}
                                                alt={`Ảnh sách ${book?.title} - ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                onError={() => handleImageError(idx)}
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
                            </Carousel>
                            <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-medium text-gray-600">
                                {carouselIdx + 1}/{book?.images?.length || 0}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-2 mt-4 flex-wrap justify-center w-full">
                            {book?.images &&
                                book.images.map((src, idx) => (
                                    <button
                                        key={idx}
                                        className={`border-2 rounded-lg w-16 h-20 flex items-center justify-center overflow-hidden transition-all duration-200 shadow-sm bg-gray-100 ${
                                            carouselIdx === idx
                                                ? 'border-blue-500 ring-2 ring-blue-300 scale-105'
                                                : 'border-gray-200 hover:border-blue-400 hover:scale-105'
                                        }`}
                                        onClick={() => {
                                            setCarouselIdx(idx);
                                            carouselRef.current?.goTo(idx);
                                        }}
                                        aria-label={`Xem ảnh ${idx + 1}`}
                                    >
                                        <img
                                            src={getImageSrc(idx)}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="object-cover h-full w-full rounded"
                                            onError={() => handleImageError(idx)}
                                        />
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Right Column - Info Section (Mobile: full width, Desktop: ~60%) */}
                    <div className="w-full md:w-3/5 flex flex-col gap-6">
                        {/* Thông tin cơ bản - Title, Author, Price */}
                        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 leading-snug text-gray-800">
                                {book?.title}
                            </h1>

                            {/* Tác giả */}
                            <div className="mb-6 pb-6 border-b">
                                <span className="text-sm text-gray-600 font-medium">Tác giả:</span>
                                <p className="text-gray-700 font-semibold mt-1">{book?.author || 'Chưa cập nhật'}</p>
                            </div>

                            {/* Giá thuê */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-2xl sm:text-3xl font-extrabold text-red-500">
                                    {book?.dailyRentalFee?.toLocaleString() || '0'}₫
                                </span>
                                <span className="text-gray-500 text-sm">/ ngày thuê</span>
                            </div>
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                            <h3 className="font-semibold mb-4 text-gray-800 text-base">Thông tin chi tiết</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {book?.isbn && (
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                                            ISBN
                                        </span>
                                        <span className="text-gray-700 font-semibold">{book.isbn}</span>
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                                        Nhà xuất bản
                                    </span>
                                    <span className="text-gray-700 font-semibold">
                                        {book?.publisher || 'Chưa cập nhật'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                                        Ngôn ngữ
                                    </span>
                                    <span className="text-gray-700 font-semibold">
                                        {book?.language || 'Tiếng Việt'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                                        Vị trí
                                    </span>
                                    <span className="text-gray-700 font-semibold">
                                        {book?.location || 'Chưa cập nhật'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                                        Số lượng còn lại
                                    </span>
                                    {book?.availableCopies && book.availableCopies > 0 ? (
                                        <span className="text-green-600 font-semibold">
                                            {book.availableCopies} cuốn
                                        </span>
                                    ) : (
                                        <span className="text-red-600 font-semibold">Đã mượn hết</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mô tả sách */}
                        <div className="bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-100">
                            <h3 className="font-semibold mb-3 text-blue-800 text-base">Mô tả sách</h3>
                            <p
                                className="text-gray-700 whitespace-pre-line text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: book?.description || 'Không có mô tả' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Mượn sách Section - Full width below on mobile, Sticky on desktop right */}
                <div className="w-full md:w-2/5 md:ml-auto mt-8 md:mt-0 bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100 md:sticky md:top-24 md:h-fit">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Chọn thời gian mượn</h3>

                    {/* Giá hiển thị */}
                    <div className="flex items-end mb-6 pb-6 border-b">
                        <div className="text-2xl sm:text-3xl font-extrabold text-red-500">
                            {book?.dailyRentalFee?.toLocaleString() || '0'}₫
                        </div>
                        <span className="text-gray-500 text-sm ml-2">/ ngày</span>
                    </div>

                    {/* Số lượng mượn */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b">
                        <span className="text-gray-600 font-medium">Số lượng</span>
                        <InputNumber
                            min={1}
                            max={book?.availableCopies || 1}
                            value={quantity}
                            onChange={(value) => setQuantity(value || 1)}
                            className="!w-24"
                            size="large"
                            disabled={!book?.availableCopies || book.availableCopies === 0}
                        />
                    </div>

                    {/* Chọn ngày mượn */}
                    <div className="space-y-3 mb-6 pb-6 border-b">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <CalendarOutlined className="text-blue-500" />
                            Thời gian mượn
                        </h4>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2 font-medium">Ngày bắt đầu</label>
                                <DatePicker
                                    placeholder="Chọn ngày bắt đầu"
                                    className="w-full"
                                    format="DD/MM/YYYY"
                                    value={startDate}
                                    onChange={handleStartDateChange}
                                    disabledDate={(current) => current && current < new Date().setHours(0, 0, 0, 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-2 font-medium">Ngày kết thúc</label>
                                <DatePicker
                                    placeholder="Chọn ngày kết thúc"
                                    className="w-full"
                                    format="DD/MM/YYYY"
                                    value={endDate}
                                    onChange={handleEndDateChange}
                                    disabledDate={disabledEndDate}
                                />
                            </div>

                            {startDate && endDate && (
                                <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 font-medium border border-blue-200">
                                    Thời gian mượn: {endDate.diff(startDate, 'days') + 1} ngày
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nút Thêm vào giỏ mượn */}
                    <div className="mb-6">
                        <Button
                            icon={<ShoppingCartOutlined />}
                            className="border-2 border-blue-500 text-blue-500 font-semibold h-12 sm:h-14 rounded-lg text-base hover:bg-blue-50 hover:border-blue-600 transition-all duration-200 w-full min-h-[44px]"
                            size="large"
                            block
                            onClick={handleAddToCart}
                            disabled={!startDate || !endDate || !book?.availableCopies || book.availableCopies === 0}
                        >
                            {book?.availableCopies && book.availableCopies > 0 ? 'Thêm vào giỏ mượn' : 'Đã mượn hết'}
                        </Button>
                    </div>

                    {/* Thông tin bổ sung */}
                    <div className="pt-4 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                            <span>Gia hạn trực tuyến dễ dàng</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></span>
                            <span>Hỗ trợ khách hàng 24/7</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Thủ tục mượn nhanh chóng</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12">
                <Footer />
            </div>

            {/* Chatbot floating button */}
            <Chatbot />
        </div>
    );
}

export default DetailProduct;
