import { Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';

const categoryStyles = [
    {
        icon: 'cart',
        accent: '#16a34a',
    },
    {
        icon: 'search',
        accent: '#16a34a',
    },
    {
        icon: 'shelf',
        accent: '#16a34a',
    },
    {
        icon: 'stack',
        accent: '#16a34a',
    },
    {
        icon: 'reader',
        accent: '#16a34a',
    },
    {
        icon: 'apple',
        accent: '#16a34a',
    },
];

const renderIllustration = (icon, accent) => {
    const common = {
        fill: 'none',
        stroke: '#111827',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    };

    const accentProps = {
        ...common,
        stroke: accent,
    };

    switch (icon) {
        case 'cart':
            return (
                <svg viewBox="0 0 120 96" className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true">
                    <g>
                        <path {...common} d="M10 18h14l8 38h48l10-28H34" />
                        <circle {...common} cx="38" cy="70" r="7" />
                        <circle {...common} cx="70" cy="70" r="7" />
                        <path {...accentProps} d="M22 30h56" />
                        <path {...accentProps} d="M34 18l10 12h26" />
                    </g>
                </svg>
            );
        case 'search':
            return (
                <svg viewBox="0 0 120 96" className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true">
                    <g>
                        <rect x="18" y="20" width="52" height="42" rx="3" {...common} />
                        <path {...accentProps} d="M34 36h20" />
                        <path {...accentProps} d="M34 45h16" />
                        <circle cx="70" cy="52" r="18" {...common} />
                        <path d="M82 64l18 16" {...common} />
                    </g>
                </svg>
            );
        case 'shelf':
            return (
                <svg viewBox="0 0 120 96" className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true">
                    <g>
                        <path {...common} d="M18 28h72" />
                        <path {...common} d="M18 48h72" />
                        <path {...common} d="M22 20v54" />
                        <path {...common} d="M82 20v54" />
                        <path {...common} d="M36 20v54" />
                        <path {...common} d="M52 20v54" />
                        <path {...common} d="M68 20v54" />
                        <path {...accentProps} d="M14 66h80" />
                        <path {...accentProps} d="M38 18v-8" />
                        <path {...accentProps} d="M58 18v-8" />
                    </g>
                </svg>
            );
        case 'stack':
            return (
                <svg viewBox="0 0 120 96" className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true">
                    <g>
                        <path {...common} d="M18 30l42-18 42 18-42 18-42-18Z" />
                        <path {...common} d="M18 46l42 18 42-18" />
                        <path {...common} d="M18 60l42 18 42-18" />
                        <path {...accentProps} d="M36 32l18 8 18-8" />
                    </g>
                </svg>
            );
        case 'reader':
            return (
                <svg viewBox="0 0 120 96" className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true">
                    <g>
                        <path {...common} d="M22 22h50v52H22z" />
                        <path {...common} d="M78 22h20v52H78" />
                        <path {...common} d="M72 22v52" />
                        <path {...accentProps} d="M32 36h30" />
                        <path {...accentProps} d="M32 48h26" />
                        <path {...accentProps} d="M86 40h8v18h-8" />
                    </g>
                </svg>
            );
        case 'apple':
            return (
                <svg viewBox="0 0 120 96" className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true">
                    <g>
                        <path
                            {...common}
                            d="M52 18c12 0 18 10 18 18v30c0 12-10 22-22 22S26 78 26 66V36c0-8 6-18 18-18h8Z"
                        />
                        <path {...common} d="M52 18v12m-8-8c4-8 16-10 24-4" />
                        <path {...accentProps} d="M78 20l18 18" />
                        <path {...accentProps} d="M96 20l-18 18" />
                    </g>
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 120 96" className="h-20 w-20 md:h-24 md:w-24" aria-hidden="true">
                    <g>
                        <rect x="22" y="18" width="54" height="52" rx="3" {...common} />
                        <path {...accentProps} d="M32 36h34" />
                        <path {...accentProps} d="M32 48h26" />
                    </g>
                </svg>
            );
    }
};

const PolicySection = () => {
    const { category } = useStore();

    const displayCategories = Array.isArray(category) ? category.slice(0, 6) : [];

    return (
        <section className="w-full bg-[#f5f5f5] py-8 md:py-10">
            <div className="mx-auto max-w-7xl px-4">
                <div className="mb-7 text-center">
                    <h2 className="text-[26px] font-bold leading-tight text-gray-900 md:text-[32px]">
                        Có thể bạn đang tìm kiếm
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
                    {displayCategories.length > 0
                        ? displayCategories.map((item, index) => {
                              const style = categoryStyles[index % categoryStyles.length];
                              const title = item?.nameCategory || 'Danh mục';

                              return (
                                  <Link
                                      key={item?._id || index}
                                      to={item?._id ? `/?category=${item._id}` : '/'}
                                      className="group flex flex-col items-center text-center"
                                  >
                                      <div className="flex h-28 w-28 items-center justify-center rounded-[18px] border-[2.5px] border-[#111827] bg-[#f8fafc] transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)] md:h-32 md:w-32">
                                          {renderIllustration(style.icon, style.accent)}
                                      </div>
                                      <p className="mt-3 text-base font-semibold leading-6 text-gray-900 md:text-lg">
                                          {title}
                                      </p>
                                  </Link>
                              );
                          })
                        : [1, 2, 3, 4, 5, 6].map((item) => (
                              <div key={item} className="flex flex-col items-center text-center">
                                  <div className="flex h-28 w-28 items-center justify-center rounded-[18px] border-[2.5px] border-[#111827] bg-[#f8fafc] md:h-32 md:w-32">
                                      {renderIllustration(
                                          categoryStyles[(item - 1) % categoryStyles.length].icon,
                                          '#16a34a',
                                      )}
                                  </div>
                                  <p className="mt-3 text-base font-semibold text-gray-900 md:text-lg">
                                      {
                                          [
                                              'Sách bán chạy',
                                              'Sách mới xuất bản',
                                              'Sách sắp xuất bản',
                                              'Sách hưu cầu',
                                              'Sách phi hư cấu',
                                              'Sách nghiên cứu',
                                          ][item - 1]
                                      }
                                  </p>
                              </div>
                          ))}
                </div>
            </div>
        </section>
    );
};

export default PolicySection;
