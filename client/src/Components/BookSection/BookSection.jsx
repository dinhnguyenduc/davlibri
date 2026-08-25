import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingCart, Eye } from 'lucide-react';

const BookSection = ({ title, products, viewAllLink, sectionId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(6);
    const carouselRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setItemsPerView(2);
            } else if (window.innerWidth < 1024) {
                setItemsPerView(3);
            } else if (window.innerWidth < 1280) {
                setItemsPerView(4);
            } else if (window.innerWidth < 1536) {
                setItemsPerView(5);
            } else {
                setItemsPerView(6);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const maxIndex = Math.max(0, products.length - itemsPerView);

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    const calculateDiscount = (price, oldPrice) => {
        if (!oldPrice || oldPrice === price) return null;
        const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
        return discount;
    };

    return (
        <section className={`w-full ${sectionId}`}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    <Link to={viewAllLink} className="hover:text-blue-600 transition">
                        {title}
                    </Link>
                </h2>
                <Link
                    to={viewAllLink}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition flex items-center gap-1"
                >
                    Xem tất cả
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Navigation Buttons - Hidden on Mobile */}
                {products.length > itemsPerView && (
                    <>
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="hidden md:flex absolute left-0 top-1/3 -translate-y-1/2 -translate-x-12 z-10 items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex >= maxIndex}
                            className="hidden md:flex absolute right-0 top-1/3 -translate-y-1/2 translate-x-12 z-10 items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-700" />
                        </button>
                    </>
                )}

                {/* Carousel Wrapper */}
                <div className="overflow-hidden" ref={carouselRef}>
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                        }}
                    >
                        {products.map((product) => {
                            const discount = calculateDiscount(product.price, product.oldPrice);
                            const isAvailable = product.availableCopies > 0;

                            return (
                                <div
                                    key={product._id}
                                    style={{
                                        flex: `0 0 ${100 / itemsPerView}%`,
                                    }}
                                    className="px-2 sm:px-3"
                                >
                                    {/* Book Card */}
                                    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 group flex flex-col h-full">
                                        {/* Image Container - 3:4 Aspect Ratio */}
                                        <div className="relative overflow-hidden bg-gray-100 aspect-[3/4]">
                                            <Link to={`/book/${product._id}`}>
                                                <img
                                                    src={product.images?.[0] || '/placeholder-book.png'}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                            </Link>

                                            {/* Stock Status Badge */}
                                            {!isAvailable && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-semibold text-sm">
                                                        Hết sách
                                                    </span>
                                                </div>
                                            )}

                                            {/* Discount Badge */}
                                            {discount && (
                                                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                                    -{discount}%
                                                </div>
                                            )}

                                            {/* Hover Actions - Mobile and Desktop */}
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                                                <Link
                                                    to={`/book/${product._id}`}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-blue-50 transition"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span className="text-sm">Xem</span>
                                                </Link>
                                                {isAvailable && (
                                                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                                                        <ShoppingCart className="w-4 h-4" />
                                                        <span className="text-sm">Giỏ</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-3 flex flex-col gap-2 flex-1">
                                            {/* Title */}
                                            <Link
                                                to={`/book/${product._id}`}
                                                className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition"
                                                title={product.title}
                                            >
                                                {product.title}
                                            </Link>

                                            {/* Price */}
                                            <div className="mt-auto">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-base font-bold text-red-500">
                                                        {product.dailyRentalFee?.toLocaleString()}đ
                                                    </span>
                                                    <span className="text-xs text-gray-500">/ngày</span>
                                                </div>
                                                {product.oldPrice && product.oldPrice > product.dailyRentalFee && (
                                                    <del className="text-xs text-gray-400">
                                                        {product.oldPrice?.toLocaleString()}đ
                                                    </del>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pagination Dots - Desktop Only */}
                {products.length > itemsPerView && (
                    <div className="hidden md:flex justify-center gap-2 mt-6">
                        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition ${
                                    currentIndex === index ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Mobile Navigation Buttons */}
                {products.length > itemsPerView && (
                    <div className="flex md:hidden justify-between items-center mt-4">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <span className="text-sm text-gray-600 font-medium">
                            {currentIndex + 1} / {maxIndex + 1}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex >= maxIndex}
                            className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default BookSection;
