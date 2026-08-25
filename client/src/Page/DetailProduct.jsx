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
        <div className="min-h-screen bg-slate-50">
            <Header />

            <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
                <header className="mb-6 border-b border-gray-200 pb-4 md:mb-8 md:pb-5">
                    <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
                        {book?.title}
                    </h1>
                    <p className="mt-2 text-base text-slate-600 md:text-lg">{book?.author || 'Chưa cập nhật'}</p>
                </header>

                <div className="flex flex-col gap-8 md:flex-row md:gap-10">
                    <div className="order-2 w-full md:order-1 md:w-2/3">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full border-collapse text-left text-sm text-slate-700">
                                <tbody>
                                    {book?.isbn && (
                                        <tr className="even:bg-slate-50">
                                            <th className="w-1/3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                ISBN
                                            </th>
                                            <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">
                                                {book.isbn}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="even:bg-slate-50">
                                        <th className="w-1/3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Nhà xuất bản
                                        </th>
                                        <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">
                                            {book?.publisher || 'Chưa cập nhật'}
                                        </td>
                                    </tr>
                                    <tr className="even:bg-slate-50">
                                        <th className="w-1/3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Ngôn ngữ
                                        </th>
                                        <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">
                                            {book?.language || 'Tiếng Việt'}
                                        </td>
                                    </tr>
                                    <tr className="even:bg-slate-50">
                                        <th className="w-1/3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Vị trí
                                        </th>
                                        <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">
                                            {book?.location || 'Chưa cập nhật'}
                                        </td>
                                    </tr>
                                    <tr className="even:bg-slate-50">
                                        <th className="w-1/3 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Số lượng còn
                                        </th>
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {book?.availableCopies && book.availableCopies > 0 ? (
                                                <span className="text-green-600">{book.availableCopies} cuốn</span>
                                            ) : (
                                                <span className="text-red-600">Đã mượn hết</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <details
                            open
                            className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                        >
                            <summary className="flex cursor-pointer list-none items-center justify-between bg-slate-800 px-4 py-3 text-base font-semibold text-white outline-none md:px-5">
                                <span>Mô tả sách</span>
                                <span className="text-sm text-slate-200">−</span>
                            </summary>
                            <div className="bg-white p-4 text-sm leading-7 text-slate-700 md:p-5">
                                <p
                                    className="whitespace-pre-line"
                                    dangerouslySetInnerHTML={{ __html: book?.description || 'Không có mô tả' }}
                                />
                            </div>
                        </details>
                    </div>

                    <aside className="order-1 w-full md:order-2 md:w-1/3">
                        <div className="flex flex-col gap-5">
                            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
                                <div className="relative mx-auto max-w-[260px] overflow-hidden rounded-xl bg-slate-100 shadow-md">
                                    <div className="aspect-[3/4] w-full">
                                        <Carousel
                                            dots={false}
                                            afterChange={setCarouselIdx}
                                            ref={carouselRef}
                                            className="h-full w-full"
                                            effect="fade"
                                        >
                                            {book?.images &&
                                                book.images.map((src, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex h-full w-full items-center justify-center bg-slate-100"
                                                    >
                                                        <img
                                                            src={getImageSrc(idx)}
                                                            alt={`Ảnh sách ${book?.title} - ${idx + 1}`}
                                                            className="h-full w-full object-cover"
                                                            onError={() => handleImageError(idx)}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                ))}
                                        </Carousel>
                                    </div>
                                    <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                                        {carouselIdx + 1}/{book?.images?.length || 0}
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    {book?.images &&
                                        book.images.map((src, idx) => (
                                            <button
                                                key={idx}
                                                className={`h-16 w-14 overflow-hidden rounded-md border transition-all duration-200 ${
                                                    carouselIdx === idx
                                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                                        : 'border-slate-200 hover:border-blue-300'
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
                                                    className="h-full w-full object-cover"
                                                    onError={() => handleImageError(idx)}
                                                />
                                            </button>
                                        ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                                <div className="mb-5 flex items-end gap-2 border-b border-slate-200 pb-4">
                                    <span className="text-2xl font-extrabold text-red-500">
                                        {book?.dailyRentalFee?.toLocaleString() || '0'}₫
                                    </span>
                                    <span className="text-sm text-slate-500">/ ngày</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Số lượng</span>
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

                                    <div className="space-y-3 border-t border-slate-200 pt-4">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <CalendarOutlined className="text-blue-500" />
                                            Thời gian mượn
                                        </h4>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                                                    Ngày bắt đầu
                                                </label>
                                                <DatePicker
                                                    placeholder="Chọn ngày bắt đầu"
                                                    className="w-full"
                                                    format="DD/MM/YYYY"
                                                    value={startDate}
                                                    onChange={handleStartDateChange}
                                                    disabledDate={(current) =>
                                                        current && current < new Date().setHours(0, 0, 0, 0)
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                                                    Ngày kết thúc
                                                </label>
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
                                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700">
                                                    Thời gian mượn: {endDate.diff(startDate, 'days') + 1} ngày
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        icon={<ShoppingCartOutlined />}
                                        className="h-12 w-full min-h-[44px] rounded-lg border-2 border-blue-500 text-base font-semibold text-blue-500 transition-all duration-200 hover:border-blue-600 hover:bg-blue-50"
                                        size="large"
                                        block
                                        onClick={handleAddToCart}
                                        disabled={
                                            !startDate ||
                                            !endDate ||
                                            !book?.availableCopies ||
                                            book.availableCopies === 0
                                        }
                                    >
                                        {book?.availableCopies && book.availableCopies > 0
                                            ? 'Thêm vào giỏ mượn'
                                            : 'Đã mượn hết'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="mt-12">
                <Footer />
            </div>

            <Chatbot />
        </div>
    );
}

export default DetailProduct;
