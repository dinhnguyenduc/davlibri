import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BookOutlined } from '@ant-design/icons';
import { X, Filter, Sparkles, BookOpen as BookIcon } from 'lucide-react';
import useDeboune from '../../hooks/useDebounce';
import Banner from '../Banner/Banner';
import Cardbody from '../Cardbody/Cardbody';
import PolicySection from '../PolicySection/PolicySection';
import BookSection from '../BookSection/BookSection';
import { useStore } from '../../hooks/useStore';
import { requestGetCategoryById, requestGetBooks, requestSearchBook } from '../../config/request';

// Mảng màu ngẫu nhiên để gán cho category
const colorOptions = [
    {
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-50 hover:bg-purple-100',
        textColor: 'text-purple-600',
    },
    {
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50 hover:bg-blue-100',
        textColor: 'text-blue-600',
    },
    {
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50 hover:bg-green-100',
        textColor: 'text-green-600',
    },
    {
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-50 hover:bg-orange-100',
        textColor: 'text-orange-600',
    },
    {
        color: 'from-pink-500 to-rose-500',
        bgColor: 'bg-pink-50 hover:bg-pink-100',
        textColor: 'text-pink-600',
    },
    {
        color: 'from-indigo-500 to-purple-500',
        bgColor: 'bg-indigo-50 hover:bg-indigo-100',
        textColor: 'text-indigo-600',
    },
    {
        color: 'from-gray-500 to-slate-500',
        bgColor: 'bg-gray-50 hover:bg-gray-100',
        textColor: 'text-gray-600',
    },
];

function HomePage() {
    const { category } = useStore(); // Dữ liệu từ API
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const debouncedSearch = useDeboune(searchText, 500);
    const [styledCategories, setStyledCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [priceFilter, setPriceFilter] = useState({ min: 0, max: Infinity });
    const [sortOrder, setSortOrder] = useState('');
    const [displayedBooksCount, setDisplayedBooksCount] = useState(24);
    const [canLoadMore, setCanLoadMore] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Search effect
    useEffect(() => {
        const fetchSearchResult = async () => {
            if (debouncedSearch.trim()) {
                const res = await requestSearchBook({ title: debouncedSearch });
                setSearchResult(res.metadata);
                setShowSearchResults(true);
            } else {
                setSearchResult([]);
                setShowSearchResults(false);
            }
        };
        fetchSearchResult();
    }, [debouncedSearch]);

    const handleBookClick = (bookId) => {
        navigate(`/book/${bookId}`);
        setSearchText('');
        setShowSearchResults(false);
    };
    useEffect(() => {
        if (category.length > 0) {
            const styled = category.map((cat) => {
                const randomStyle = colorOptions[Math.floor(Math.random() * colorOptions.length)];
                return {
                    ...cat,
                    icon: <BookOutlined />,
                    count: cat.products.length || Math.floor(Math.random() * 1000 + 100), // fallback nếu không có count
                    ...randomStyle,
                };
            });
            setStyledCategories(styled);
        }
    }, [category]);

    const fetchBooks = async () => {
        const books = await requestGetBooks();
        console.log('📚 Fetched books:', books); // Debug log
        console.log('📊 Books metadata:', books.metadata); // Debug log
        setBooks(books.metadata);
        setFilteredBooks(books.metadata);
    };

    const fetchCategoryById = async (id) => {
        const category = await requestGetCategoryById(id);
        setBooks(category.metadata.products);
        setFilteredBooks(category.metadata.products);
    };

    // Khôi phục danh mục từ URL khi component mount
    useEffect(() => {
        const categoryFromUrl = searchParams.get('category');
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
            fetchCategoryById(categoryFromUrl);
        } else {
            fetchBooks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Xử lý khi selectedCategory thay đổi (không phải từ URL)
    useEffect(() => {
        const categoryFromUrl = searchParams.get('category');
        // Chỉ fetch khi selectedCategory thay đổi và khác với URL hiện tại
        if (selectedCategory && selectedCategory !== categoryFromUrl) {
            fetchCategoryById(selectedCategory);
            setSearchParams({ category: selectedCategory });
        } else if (!selectedCategory && categoryFromUrl) {
            // Xóa query param khi bỏ chọn danh mục
            fetchBooks();
            setSearchParams({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);

    // Lọc sách theo giá và sắp xếp
    useEffect(() => {
        let result = [...books];

        // Lọc theo khoảng giá thuê
        result = result.filter(
            (book) => book.dailyRentalFee >= priceFilter.min && book.dailyRentalFee <= priceFilter.max,
        );

        // Sắp xếp theo option đã chọn
        if (sortOrder === 'price-asc') {
            result.sort((a, b) => a.dailyRentalFee - b.dailyRentalFee);
        } else if (sortOrder === 'price-desc') {
            result.sort((a, b) => b.dailyRentalFee - a.dailyRentalFee);
        } else if (sortOrder === 'newest') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortOrder === 'bestseller') {
            result.sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0));
        } else {
            // Mặc định sắp xếp theo thứ tự hiển thị, sau đó theo ngày tạo mới nhất
            result.sort((a, b) => {
                const orderA = a.displayOrder || 999999;
                const orderB = b.displayOrder || 999999;
                if (orderA !== orderB) {
                    return orderA - orderB; // Thứ tự hiển thị ưu tiên
                }
                return new Date(b.createdAt) - new Date(a.createdAt); // Mới nhất second
            });
        }

        setFilteredBooks(result);
        setCanLoadMore(result.length > displayedBooksCount);
    }, [books, priceFilter, sortOrder, displayedBooksCount]);

    // Xử lý khi thay đổi bộ lọc giá
    const handlePriceFilterChange = (type, value) => {
        setPriceFilter((prev) => ({
            ...prev,
            [type]: value === '' ? (type === 'min' ? 0 : Infinity) : Number(value),
        }));
    };

    // Xử lý thay đổi sắp xếp
    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
    };

    // Xử lý load thêm sách
    const handleLoadMore = () => {
        setDisplayedBooksCount((prev) => prev + 24);
    };

    // Reset số sách hiển thị khi thay đổi bộ lọc
    useEffect(() => {
        setDisplayedBooksCount(24);
    }, [selectedCategory, priceFilter, sortOrder]);

    return (
        <div className="w-full">
            {/* BANNER SECTION with Aspect Ratio (Chống xén ảnh) */}
            <div className="w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] overflow-hidden bg-gray-200">
                <Banner />
            </div>

            <PolicySection />

            {/* FILTER DRAWER - Mobile Only */}
            {isFilterDrawerOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        onClick={() => setIsFilterDrawerOpen(false)}
                    />

                    {/* Drawer Panel */}
                    <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-40 overflow-y-auto shadow-xl md:hidden">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-4 text-white flex items-center justify-between">
                            <h2 className="text-lg font-bold">Bộ lọc & Danh mục</h2>
                            <button
                                onClick={() => setIsFilterDrawerOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="p-4 space-y-6">
                            {/* Danh Mục */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <BookOutlined />
                                    Danh mục sách
                                </h3>
                                <div className="space-y-2">
                                    {styledCategories.map((cat) => (
                                        <button
                                            key={cat._id}
                                            onClick={() => {
                                                setSelectedCategory(selectedCategory === cat._id ? null : cat._id);
                                                setIsFilterDrawerOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 rounded-lg transition ${
                                                selectedCategory === cat._id
                                                    ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{cat.nameCategory}</span>
                                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                                    {cat.products.length}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200" />

                            {/* Lọc Giá */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">Lọc theo giá</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giá tối thiểu
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={priceFilter.min === 0 ? '' : priceFilter.min}
                                            onChange={(e) => handlePriceFilterChange('min', e.target.value)}
                                            placeholder="0 đ"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giá tối đa
                                        </label>
                                        <input
                                            type="number"
                                            min={priceFilter.min}
                                            value={priceFilter.max === Infinity ? '' : priceFilter.max}
                                            onChange={(e) => handlePriceFilterChange('max', e.target.value)}
                                            placeholder="Không giới hạn"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setPriceFilter({ min: 0, max: Infinity })}
                                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium text-sm"
                                    >
                                        Đặt lại
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header with Filter Button */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {selectedCategory
                                ? styledCategories.find((c) => c._id === selectedCategory)?.nameCategory ||
                                  'Sách nổi bật'
                                : 'Tất cả sách'}
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Hiển thị {Math.min(displayedBooksCount, filteredBooks.length)} trong số{' '}
                            {filteredBooks.length} cuốn sách
                        </p>
                    </div>

                    {/* Filter Button - Mobile Only */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium min-h-[44px]"
                    >
                        <Filter className="w-5 h-5" />
                        <span>Lọc</span>
                    </button>

                    {/* Sort Dropdown - Desktop */}
                    <select
                        onChange={handleSortChange}
                        value={sortOrder}
                        className="hidden sm:block px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    >
                        <option value="">Sách nổi bật</option>
                        <option value="newest">Mới nhất</option>
                        <option value="price-asc">Giá thuê thấp đến cao</option>
                        <option value="price-desc">Giá thuê cao đến thấp</option>
                        <option value="bestseller">Mượn nhiều</option>
                    </select>
                </div>

                {/* DESKTOP LAYOUT - Two Column */}
                <div className="hidden md:grid md:grid-cols-4 gap-6">
                    {/* LEFT SIDEBAR - Desktop Only */}
                    <div className="md:col-span-1">
                        <div className="sticky top-6 space-y-6">
                            {/* Categories Card */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                                    <div className="flex items-center gap-2">
                                        <BookOutlined className="text-lg" />
                                        <div>
                                            <h3 className="font-bold">Danh mục sách</h3>
                                            <p className="text-blue-100 text-xs">Khám phá tri thức</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                                    {styledCategories.map((cat) => (
                                        <button
                                            key={cat._id}
                                            onClick={() =>
                                                setSelectedCategory(selectedCategory === cat._id ? null : cat._id)
                                            }
                                            className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                                                selectedCategory === cat._id
                                                    ? `${cat.bgColor} ${cat.textColor} font-semibold border-l-4`
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{cat.nameCategory}</span>
                                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                                                    {cat.products.length}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Filter Card */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
                                    <h3 className="font-bold">Lọc theo giá</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giá tối thiểu
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={priceFilter.min === 0 ? '' : priceFilter.min}
                                            onChange={(e) => handlePriceFilterChange('min', e.target.value)}
                                            placeholder="0 đ"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giá tối đa
                                        </label>
                                        <input
                                            type="number"
                                            min={priceFilter.min}
                                            value={priceFilter.max === Infinity ? '' : priceFilter.max}
                                            onChange={(e) => handlePriceFilterChange('max', e.target.value)}
                                            placeholder="Không giới hạn"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setPriceFilter({ min: 0, max: Infinity })}
                                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                                    >
                                        Đặt lại
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT - Desktop */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            {/* Books Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredBooks.length > 0 ? (
                                    filteredBooks.slice(0, displayedBooksCount).map((book) => (
                                        <Link key={book._id} to={`/book/${book._id}`} className="group">
                                            <Cardbody product={book} />
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 text-center">
                                        <p className="text-gray-500 text-lg">Không tìm thấy sách phù hợp</p>
                                    </div>
                                )}
                            </div>

                            {/* Load More Button */}
                            {canLoadMore && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-md hover:shadow-lg min-h-[44px]"
                                    >
                                        Xem thêm sách
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MOBILE LAYOUT - Full Width Grid */}
                <div className="md:hidden">
                    {/* Sort Dropdown - Mobile */}
                    <div className="mb-4">
                        <select
                            onChange={handleSortChange}
                            value={sortOrder}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-sm"
                        >
                            <option value="">Sách nổi bật</option>
                            <option value="newest">Mới nhất</option>
                            <option value="price-asc">Giá thuê thấp đến cao</option>
                            <option value="price-desc">Giá thuê cao đến thấp</option>
                            <option value="bestseller">Mượn nhiều</option>
                        </select>
                    </div>

                    {/* Books Grid - 2 columns on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                        {filteredBooks.length > 0 ? (
                            filteredBooks.slice(0, displayedBooksCount).map((book) => (
                                <Link key={book._id} to={`/book/${book._id}`} className="group">
                                    <Cardbody product={book} />
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-gray-500">Không tìm thấy sách phù hợp</p>
                            </div>
                        )}
                    </div>

                    {/* Load More Button - Mobile */}
                    {canLoadMore && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={handleLoadMore}
                                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition min-h-[44px]"
                            >
                                Xem thêm sách
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Featured Sections with Academic Styling */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 space-y-12">
                    {/* New Books Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-1 w-1 bg-blue-400 rounded-full" />
                            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-yellow-400" />
                                Sách mới nhất
                            </h2>
                        </div>
                        <p className="text-blue-200 text-sm mb-6">
                            Những tác phẩm mới được bổ sung vào tủ sách của thư viện
                        </p>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <BookSection
                                title=""
                                products={books.slice(0, 12)}
                                viewAllLink="/books?sort=newest"
                                sectionId="books-new"
                            />
                        </div>
                    </div>

                    {/* Most Borrowed Books Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-1 w-1 bg-blue-400 rounded-full" />
                            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                                <BookIcon className="w-6 h-6 text-yellow-400" />
                                Sách được yêu thích
                            </h2>
                        </div>
                        <p className="text-blue-200 text-sm mb-6">
                            Những cuốn sách được độc giả yêu thích và mượn nhiều nhất
                        </p>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <BookSection
                                title=""
                                products={books.filter((b) => b.borrowCount && b.borrowCount > 0).slice(0, 12)}
                                viewAllLink="/books?sort=bestseller"
                                sectionId="books-popular"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
