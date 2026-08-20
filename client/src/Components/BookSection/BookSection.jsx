import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingCart, Eye } from 'lucide-react';
import './BookSection.css';

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
        <div className={`product-section-wrapper ${sectionId}`}>
            <div className="product-section-container">
                <div className="section-header">
                    <h3 className="section-title">
                        <Link to={viewAllLink}>{title}</Link>
                    </h3>
                    <Link to={viewAllLink} className="view-all-link">
                        Xem tất cả »
                    </Link>
                </div>

                <div className="product-carousel-wrapper">
                    {/* Navigation Buttons */}
                    {products.length > itemsPerView && (
                        <>
                            <button
                                className="carousel-nav-btn carousel-prev"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                className="carousel-nav-btn carousel-next"
                                onClick={handleNext}
                                disabled={currentIndex >= maxIndex}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    {/* Products Carousel */}
                    <div className="product-carousel" ref={carouselRef}>
                        <div
                            className="product-carousel-track"
                            style={{
                                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                            }}
                        >
                            {products.map((product) => {
                                const discount = calculateDiscount(product.price, product.oldPrice);
                                return (
                                    <div key={product._id} className="product-item">
                                        <div className="product-card">
                                            {/* Product Image */}
                                            <div className="product-image-wrapper">
                                                <Link to={`/book/${product._id}`}>
                                                    <img
                                                        src={product.images?.[0] || '/placeholder-book.png'}
                                                        alt={product.title}
                                                        className="product-image"
                                                        loading="lazy"
                                                    />
                                                </Link>

                                                {/* Stock Status */}
                                                {product.availableCopies === 0 && (
                                                    <span className="out-of-stock-badge">Hết sách</span>
                                                )}

                                                {/* Hover Actions */}
                                                <div className="product-actions">
                                                    <Link to={`/book/${product._id}`} className="action-btn btn-view">
                                                        <Eye size={18} />
                                                        <span>Xem chi tiết</span>
                                                    </Link>
                                                    {product.availableCopies > 0 && (
                                                        <button className="action-btn btn-add-cart">
                                                            <ShoppingCart size={18} />
                                                            <span>Cho vào giỏ</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="product-info">
                                                <Link
                                                    to={`/book/${product._id}`}
                                                    className="product-name"
                                                    title={product.title}
                                                >
                                                    {product.title}
                                                    {discount && <span className="discount-badge">-{discount}%</span>}
                                                </Link>

                                                <div className="product-price">
                                                    <span className="current-price">
                                                        {product.dailyRentalFee.toLocaleString()}VNĐ/ngày
                                                    </span>
                                                    {product.oldPrice && product.oldPrice > product.price && (
                                                        <del className="old-price">
                                                            {product.oldPrice.toLocaleString()}VNĐ
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

                    {/* Pagination Dots */}
                    {products.length > itemsPerView && (
                        <div className="carousel-pagination">
                            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                                <button
                                    key={index}
                                    className={`pagination-dot ${currentIndex === index ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(index)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookSection;
