import { Carousel, Button, InputNumber, DatePicker, message } from 'antd';
import { ShoppingCartOutlined, CalendarOutlined, HeartOutlined } from '@ant-design/icons';
import Header from '../Components/Header/Header';
import { useState, useRef, useEffect } from 'react';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';
import { requestCreateCart, requestCreateViewBook, requestGetBookById } from '../config/request';
import { Link, useParams } from 'react-router-dom';
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

    // Scroll về đầu trang khi vào chi tiết sách hoặc đổi id
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [id]);

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
        <div className="min-h-screen bg-[#f5f5f5] text-slate-800">
            <Header />

            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Link to="/" className="font-medium text-slate-600 transition hover:text-orange-500">
                        Trang chủ
                    </Link>
                    <span>/</span>
                    <Link to="/" className="font-medium text-slate-600 transition hover:text-orange-500">
                        Sách
                    </Link>
                    <span>/</span>
                    <span className="truncate text-slate-700">{book?.title || 'Chi tiết sách'}</span>
                </div>

                <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                    <div className="w-full md:w-2/5">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
                            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                                                        className="h-full w-full object-cover md:object-contain"
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

                            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                                {book?.images &&
                                    book.images.map((src, idx) => (
                                        <button
                                            key={idx}
                                            className={`h-16 w-14 shrink-0 overflow-hidden rounded-md border bg-slate-100 transition-all duration-200 ${
                                                carouselIdx === idx
                                                    ? 'border-orange-500 ring-2 ring-orange-200'
                                                    : 'border-slate-200 hover:border-orange-300'
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

                            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                                <HeartOutlined className="text-base" />
                                Thêm vào yêu thích
                            </button>
                        </div>
                    </div>

                    <div className="w-full md:w-3/5">
                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
                            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">
                                {book?.title}
                            </h1>

                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 md:text-base">
                                <span className="font-medium text-slate-600">Tác giả:</span>
                                <span>{book?.author || 'Chưa cập nhật'}</span>
                            </div>

                            <div className="mt-5 flex items-end gap-2">
                                <span className="text-3xl font-extrabold text-red-500 md:text-4xl">
                                    {book?.dailyRentalFee?.toLocaleString() || '0'}₫
                                </span>
                                <span className="pb-1 text-sm text-slate-500 md:text-base">/ ngày</span>
                            </div>

                            <div className="mt-6 rounded-xl border border-slate-200 bg-gray-50 p-4 md:p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
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
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <CalendarOutlined className="text-orange-500" />
                                        Thời gian mượn
                                    </h3>

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
                                    className="mt-5 h-12 w-full min-h-[44px] rounded-lg border-0 bg-orange-500 text-base font-semibold text-white shadow-sm transition hover:bg-orange-600"
                                    size="large"
                                    block
                                    onClick={handleAddToCart}
                                    disabled={
                                        !startDate || !endDate || !book?.availableCopies || book.availableCopies === 0
                                    }
                                >
                                    {book?.availableCopies && book.availableCopies > 0
                                        ? 'Thêm vào giỏ mượn'
                                        : 'Đã mượn hết'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.8fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-slate-900">Mô tả sách</h2>
                        <div
                            className="text-sm leading-7 text-slate-700"
                            dangerouslySetInnerHTML={{ __html: book?.description || 'Không có mô tả' }}
                        />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                            Thông tin chi tiết
                        </div>
                        <table className="w-full border-collapse text-left text-sm text-slate-700">
                            <tbody>
                                {book?.author && (
                                    <tr className="even:bg-slate-50">
                                        <th className="w-1/3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Tác giả
                                        </th>
                                        <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">
                                            {book.author}
                                        </td>
                                    </tr>
                                )}
                                {book?.publisher && (
                                    <tr className="even:bg-slate-50">
                                        <th className="w-1/3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Nhà xuất bản
                                        </th>
                                        <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">
                                            {book.publisher}
                                        </td>
                                    </tr>
                                )}
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
                                        Số lượng còn
                                    </th>
                                    <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">
                                        {book?.availableCopies && book.availableCopies > 0 ? (
                                            <span className="text-green-600">{book.availableCopies} cuốn</span>
                                        ) : (
                                            <span className="text-red-600">Đã mượn hết</span>
                                        )}
                                    </td>
                                </tr>
                                <tr className="even:bg-slate-50">
                                    <th className="w-1/3 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Vị trí
                                    </th>
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                        {book?.location || 'Chưa cập nhật'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Sách cùng tác giả</h3>
                        <span className="text-sm font-medium text-orange-500">Xem thêm</span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="aspect-[3/4] rounded-lg bg-slate-200" />
                                <div className="mt-3 h-3 w-3/4 rounded bg-slate-200" />
                                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
                            </div>
                        ))}
                    </div>
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
