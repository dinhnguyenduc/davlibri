import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Banner.css';
import { requestGetBanners } from '../../config/request';

const Banner = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch banners từ API
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await requestGetBanners();
                const bannerData = response.metadata;

                if (bannerData && bannerData.length > 0) {
                    // Chuyển đổi dữ liệu từ API thành format phù hợp
                    const formattedSlides = bannerData.map((banner) => ({
                        id: banner._id,
                        title: banner.title,
                        subtitle: banner.subtitle,
                        features: banner.features || [],
                        buttonText: banner.buttonText || 'Xem thêm',
                        buttonLink: banner.link || '#',
                        image: banner.image,
                        backgroundColor: banner.backgroundColor || '#f6ecdd',
                        textColor: banner.textColor || '#333333',
                        description: banner.description,
                        imagePositionX: banner.imagePositionX || 'center',
                        imagePositionY: banner.imagePositionY || 'center',
                        imageSize: banner.imageSize || '100% 100%',
                        imageOffsetX: banner.imageOffsetX !== undefined ? banner.imageOffsetX : 50,
                        imageOffsetY: banner.imageOffsetY !== undefined ? banner.imageOffsetY : 50,
                        showTitle: banner.showTitle !== undefined ? banner.showTitle : false,
                    }));

                    setSlides(formattedSlides);
                } else {
                    // Nếu không có banner từ API, dùng fallback
                    setSlides([
                        {
                            id: 1,
                            title: 'Thuê sách không giới hạn',
                            features: [
                                'Thuê sách không giới hạn ngày trả',
                                'Tặng 60 ngày thuê cho thành viên mới',
                                'Bảo lưu vĩnh viễn khi không thuê sách',
                                'Không phát sinh phụ phí',
                            ],
                            buttonText: 'Tham gia ngay',
                            buttonLink: '/register',
                            illustration: 'slide1',
                        },
                    ]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching banners:', error);
                // Fallback về banner mặc định nếu có lỗi
                setSlides([
                    {
                        id: 1,
                        title: 'Thuê sách không giới hạn',
                        features: [
                            'Thuê sách không giới hạn ngày trả',
                            'Tặng 60 ngày thuê cho thành viên mới',
                            'Bảo lưu vĩnh viễn khi không thuê sách',
                            'Không phát sinh phụ phí',
                        ],
                        buttonText: 'Tham gia ngay',
                        buttonLink: '/register',
                        illustration: 'slide1',
                    },
                ]);
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (slides.length === 0) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    if (loading) {
        return (
            <div className="banner-container">
                <div
                    className="banner-wrapper"
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                    <p>Đang tải banner...</p>
                </div>
            </div>
        );
    }

    if (slides.length === 0) {
        return null;
    }

    return (
        <div className="banner-container">
            <div className="banner-wrapper">
                {slides.map((slide, index) => {
                    // Tính toán background-position từ imageOffsetX và imageOffsetY (chính xác)
                    const getBackgroundPosition = () => {
                        if (!slide.image) return 'center';
                        // Ưu tiên dùng imageOffsetX/Y (chính xác theo %), nếu không có thì dùng imagePositionX/Y
                        if (slide.imageOffsetX !== undefined && slide.imageOffsetY !== undefined) {
                            return `${slide.imageOffsetX}% ${slide.imageOffsetY}%`;
                        }
                        const x = slide.imagePositionX || 'center';
                        const y = slide.imagePositionY || 'center';
                        return `${x} ${y}`;
                    };

                    const getBackgroundSize = () => {
                        if (!slide.image) return 'cover';
                        return slide.imageSize || '100% 100%';
                    };

                    return (
                        <div key={slide.id} className={`banner-slide ${index === currentSlide ? 'active' : ''}`}>
                            <div
                                className="banner-background"
                                style={{
                                    background: slide.image
                                        ? slide.backgroundColor || '#f6ecdd'
                                        : slide.backgroundColor || 'linear-gradient(135deg, #f6ecdd 0%, #e8d5c4 100%)',
                                    backgroundImage: slide.image ? `url(${slide.image})` : 'none',
                                    backgroundPosition: getBackgroundPosition(),
                                    backgroundSize: getBackgroundSize(),
                                    backgroundRepeat: 'no-repeat',
                                }}
                            >
                                <div className="banner-content">
                                    {/* Left side - Books illustration (chỉ hiện nếu không có ảnh) */}
                                    {!slide.image && (
                                        <div className="banner-left">
                                            <div className="books-stack">
                                                <div className="book book-1"></div>
                                                <div className="book book-2"></div>
                                                <div className="book book-3"></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Center - Text content */}
                                    <div className="banner-center">
                                        <div className="banner-text-content">
                                            {slide.showTitle && (
                                                <h1 className="banner-title" style={{ color: slide.textColor }}>
                                                    {slide.title}
                                                </h1>
                                            )}
                                            {slide.subtitle && (
                                                <h2 className="banner-subtitle" style={{ color: slide.textColor }}>
                                                    {slide.subtitle}
                                                </h2>
                                            )}

                                            {slide.features && slide.features.length > 0 && (
                                                <div className="banner-features">
                                                    {slide.features.map((feature, idx) => (
                                                        <div key={idx} className="feature-item">
                                                            <i className="fa fa-book feature-icon"></i>
                                                            <span style={{ color: slide.textColor }}>{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right side - Reading person illustration (chỉ hiện nếu không có ảnh) */}
                                    {!slide.image && (
                                        <div className="banner-right">
                                            <div className={`illustration illustration-${slide.illustration}`}>
                                                {slide.illustration === 'slide1' && (
                                                    <div className="reading-person">
                                                        <div className="person-cap"></div>
                                                        <div className="person-body"></div>
                                                        <div className="person-book"></div>
                                                    </div>
                                                )}
                                                {slide.illustration === 'slide2' && (
                                                    <div className="family-reading">
                                                        <div className="family-group"></div>
                                                    </div>
                                                )}
                                                {slide.illustration === 'slide3' && (
                                                    <div className="books-stack-right">
                                                        <div className="book-right book-r1"></div>
                                                        <div className="book-right book-r2"></div>
                                                        <div className="book-right book-r3"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Dots Navigation */}
                <div className="banner-dots">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Banner;
