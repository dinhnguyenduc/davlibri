import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
            <div className="w-full h-full bg-white relative z-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full w-full relative overflow-hidden flex items-center justify-center">
                    <p className="text-gray-600 text-lg">Đang tải banner...</p>
                </div>
            </div>
        );
    }

    if (slides.length === 0) {
        return null;
    }

    return (
        <div className="w-full h-full bg-white relative z-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full w-full relative overflow-hidden">
                {slides.map((slide, index) => {
                    // Tính toán background-position từ imageOffsetX và imageOffsetY (chính xác)
                    const getBackgroundPosition = () => {
                        if (!slide.image) return 'center';
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
                        <div
                            key={slide.id}
                            className={`absolute w-full h-full transition-opacity duration-1000 ${
                                index === currentSlide
                                    ? 'opacity-100 pointer-events-auto'
                                    : 'opacity-0 pointer-events-none'
                            }`}
                        >
                            <div
                                className="w-full h-full rounded-none p-10 shadow-lg overflow-hidden flex items-center justify-between gap-10 bg-gradient-to-br from-orange-100 to-orange-50"
                                style={{
                                    backgroundColor: slide.image ? slide.backgroundColor || '#f6ecdd' : undefined,
                                    backgroundImage: slide.image ? `url(${slide.image})` : 'none',
                                    backgroundPosition: getBackgroundPosition(),
                                    backgroundSize: getBackgroundSize(),
                                    backgroundRepeat: 'no-repeat',
                                    backgroundAttachment: 'scroll',
                                }}
                            >
                                <div className="max-w-7xl mx-auto w-full flex items-center justify-between h-full gap-10">
                                    {/* Left side - Books illustration (only if no image) */}
                                    {!slide.image && (
                                        <div className="flex-shrink-0 w-32 flex items-center justify-center">
                                            <div className="relative w-36 h-48">
                                                {/* Book 1 - Purple */}
                                                <div
                                                    className="absolute w-20 h-24 rounded shadow-lg"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #8b4c8f 0%, #7a3e7e 100%)',
                                                        transform: 'rotate(-15deg)',
                                                        left: '0px',
                                                        top: '50px',
                                                        zIndex: 3,
                                                    }}
                                                />
                                                {/* Book 2 - Red */}
                                                <div
                                                    className="absolute w-20 h-24 rounded shadow-lg"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #c44569 0%, #b23555 100%)',
                                                        transform: 'rotate(-5deg)',
                                                        left: '30px',
                                                        top: '40px',
                                                        zIndex: 2,
                                                    }}
                                                />
                                                {/* Book 3 - Yellow */}
                                                <div
                                                    className="absolute w-20 h-24 rounded shadow-lg"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #f9ca24 0%, #f0b922 100%)',
                                                        transform: 'rotate(5deg)',
                                                        left: '60px',
                                                        top: '30px',
                                                        zIndex: 1,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Center - Text content */}
                                    <div className="flex-1 flex flex-col justify-center px-10">
                                        <div className="max-w-2xl">
                                            {slide.showTitle && (
                                                <h1
                                                    className="text-4xl sm:text-5xl font-bold mb-8 leading-tight animate-fade-in-up"
                                                    style={{ color: slide.textColor }}
                                                >
                                                    {slide.title}
                                                </h1>
                                            )}
                                            {slide.subtitle && (
                                                <h2
                                                    className="text-xl sm:text-2xl font-semibold mb-6 animate-fade-in"
                                                    style={{ color: slide.textColor }}
                                                >
                                                    {slide.subtitle}
                                                </h2>
                                            )}

                                            {slide.features && slide.features.length > 0 && (
                                                <div className="space-y-3 mb-8">
                                                    {slide.features.map((feature, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-3 text-lg font-medium animate-fade-in-left"
                                                            style={{
                                                                color: slide.textColor,
                                                                animationDelay: `${idx * 0.1}s`,
                                                            }}
                                                        >
                                                            <span className="text-blue-600 text-xl">📖</span>
                                                            <span>{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right side - Reading person illustration (only if no image) */}
                                    {!slide.image && (
                                        <div className="flex-shrink-0 w-80 h-96 flex items-center justify-center">
                                            <div className="w-full h-full relative">
                                                {slide.illustration === 'slide1' && (
                                                    <div className="relative w-72 h-80">
                                                        {/* Person silhouette - simplified with Tailwind */}
                                                        <div className="absolute w-16 h-20 bg-gradient-to-b from-amber-800 to-amber-700 rounded-full top-2 left-24" />
                                                        <div className="absolute w-24 h-32 bg-gradient-to-b from-blue-400 to-blue-500 rounded-lg top-20 left-16" />
                                                        <div className="absolute w-20 h-24 bg-yellow-100 border-2 border-amber-900 rounded-lg top-24 left-28 transform -rotate-12" />
                                                    </div>
                                                )}
                                                {slide.illustration === 'slide2' && (
                                                    <div className="flex gap-4 h-full items-center justify-center">
                                                        <div className="w-12 h-16 bg-purple-500 rounded-full" />
                                                        <div className="w-12 h-16 bg-pink-500 rounded-full" />
                                                        <div className="w-12 h-16 bg-blue-500 rounded-full" />
                                                    </div>
                                                )}
                                                {slide.illustration === 'slide3' && (
                                                    <div className="relative w-40 h-56">
                                                        <div
                                                            className="absolute w-20 h-28 rounded shadow-lg"
                                                            style={{
                                                                background:
                                                                    'linear-gradient(135deg, #d4a574 0%, #a67c52 100%)',
                                                                transform: 'rotate(5deg)',
                                                                right: '0px',
                                                                top: '0px',
                                                                zIndex: 1,
                                                            }}
                                                        />
                                                        <div
                                                            className="absolute w-20 h-28 rounded shadow-lg"
                                                            style={{
                                                                background:
                                                                    'linear-gradient(135deg, #e8b4b8 0%, #d99ba3 100%)',
                                                                transform: 'rotate(-5deg)',
                                                                right: '20px',
                                                                top: '20px',
                                                                zIndex: 2,
                                                            }}
                                                        />
                                                        <div
                                                            className="absolute w-20 h-28 rounded shadow-lg"
                                                            style={{
                                                                background:
                                                                    'linear-gradient(135deg, #a8d8b8 0%, #7bc98f 100%)',
                                                                transform: 'rotate(0deg)',
                                                                right: '40px',
                                                                top: '40px',
                                                                zIndex: 3,
                                                            }}
                                                        />
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
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-50">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-3 rounded-full transition-all duration-300 ${
                                index === currentSlide
                                    ? 'bg-blue-600 w-8'
                                    : 'bg-white bg-opacity-60 w-3 hover:bg-opacity-100'
                            }`}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Banner;
