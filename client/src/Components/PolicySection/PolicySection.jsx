import { Clock, BookMarked, Smartphone, RefreshCw, FileText, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const PolicySection = () => {
    const quickAccessItems = [
        {
            id: 1,
            title: 'Giờ mở cửa',
            description: 'Thứ 2 - CN: 7h30 - 21h',
            icon: Clock,
            link: '/hours',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            id: 2,
            title: 'Sách số',
            description: 'Truy cập tài liệu điện tử',
            icon: Smartphone,
            link: '/ebooks',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            id: 3,
            title: 'Gia hạn sách',
            description: 'Gia hạn trực tuyến dễ dàng',
            icon: RefreshCw,
            link: '/renew',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            id: 4,
            title: 'Tài liệu nội bộ',
            description: 'Luận án, báo cáo và hơn thế',
            icon: FileText,
            link: '/documents',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            id: 5,
            title: 'Sách nổi bật',
            description: 'Những cuốn sách được yêu thích',
            icon: BookMarked,
            link: '/featured',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            id: 6,
            title: 'Thành tựu',
            description: 'Giải thưởng và công trạng',
            icon: Award,
            link: '/achievements',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
    ];

    return (
        <section className="w-full bg-gray-50 py-8 sm:py-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Title */}
                <div className="mb-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Truy cập nhanh</h2>
                    <p className="text-gray-600 text-sm sm:text-base mt-2">Những dịch vụ nổi bật của thư viện</p>
                </div>

                {/* Quick Access Grid - 3 columns on mobile, 6 on desktop */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                    {quickAccessItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.id}
                                to={item.link}
                                className={`${item.bgColor} hover:shadow-lg transition-all duration-300 rounded-lg p-3 sm:p-4 flex flex-col items-center text-center group cursor-pointer`}
                            >
                                {/* Icon */}
                                <div
                                    className={`${item.color} mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}
                                >
                                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                                </div>

                                {/* Title */}
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
                                    {item.title}
                                </h3>

                                {/* Description - Hidden on mobile, visible on desktop */}
                                <p className="hidden md:block text-xs text-gray-600 mt-1 line-clamp-2">
                                    {item.description}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default PolicySection;
