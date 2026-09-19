import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Filter, SlidersHorizontal, X } from 'lucide-react';
import { BookOutlined } from '@ant-design/icons';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';
import Cardbody from '../Components/Cardbody/Cardbody';
import { useStore } from '../hooks/useStore';
import { requestGetBooks } from '../config/request';

const colorOptions = [
    {
        bgColor: 'bg-blue-50 hover:bg-blue-100',
        textColor: 'text-blue-600',
    },
    {
        bgColor: 'bg-green-50 hover:bg-green-100',
        textColor: 'text-green-600',
    },
    {
        bgColor: 'bg-orange-50 hover:bg-orange-100',
        textColor: 'text-orange-600',
    },
    {
        bgColor: 'bg-pink-50 hover:bg-pink-100',
        textColor: 'text-pink-600',
    },
    {
        bgColor: 'bg-indigo-50 hover:bg-indigo-100',
        textColor: 'text-indigo-600',
    },
    {
        bgColor: 'bg-gray-50 hover:bg-gray-100',
        textColor: 'text-gray-600',
    },
];

const normalizeText = (value) =>
    String(value || '')
        .trim()
        .replace(/-/g, ' ')
        .toLocaleLowerCase('vi-VN');

function Products() {
    const { category } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category') || '';
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [priceFilter, setPriceFilter] = useState({ min: 0, max: Infinity });
    const [sortOrder, setSortOrder] = useState('');
    const [displayedBooksCount, setDisplayedBooksCount] = useState(24);
    const [canLoadMore, setCanLoadMore] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const styledCategories = Array.isArray(category)
        ? category.map((cat, index) => ({
              ...cat,
              icon: <BookOutlined />,
              count: cat.products?.length || 0,
              ...colorOptions[index % colorOptions.length],
          }))
        : [];

    const selectedCategoryName = selectedCategory || 'Tất cả tài liệu';

    const getCategoryLabel = (value) =>
        styledCategories.find(
            (cat) =>
                normalizeText(cat._id) === normalizeText(value) ||
                normalizeText(cat.nameCategory) === normalizeText(value),
        )?.nameCategory || value;

    const getBookCategoryValue = (book) => {
        if (!book?.category) return '';

        if (typeof book.category === 'string') {
            return getCategoryLabel(book.category);
        }

        return book.category.nameCategory || book.category.name || book.category.title || book.category._id || '';
    };

    const categoryMatches = (book, categoryName) =>
        normalizeText(getBookCategoryValue(book)).includes(normalizeText(categoryName));

    const fetchBooks = async () => {
        const response = await requestGetBooks();
        const metadata = Array.isArray(response?.metadata) ? response.metadata : [];
        setBooks(metadata);
        setFilteredBooks(metadata);
    };

    useEffect(() => {
        const nextCategory = searchParams.get('category');
        setSelectedCategory(nextCategory ? decodeURIComponent(nextCategory) : null);
    }, [searchParams]);

    useEffect(() => {
        fetchBooks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedCategory && selectedCategory !== categoryFromUrl) {
            setSearchParams({ category: selectedCategory });
        } else if (!selectedCategory && categoryFromUrl) {
            setSearchParams({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);

    useEffect(() => {
        let result = [...books];

        if (selectedCategory) {
            result = result.filter((book) => categoryMatches(book, selectedCategory));
        }

        result = result.filter(
            (book) => book.dailyRentalFee >= priceFilter.min && book.dailyRentalFee <= priceFilter.max,
        );

        if (sortOrder === 'price-asc') {
            result.sort((a, b) => a.dailyRentalFee - b.dailyRentalFee);
        } else if (sortOrder === 'price-desc') {
            result.sort((a, b) => b.dailyRentalFee - a.dailyRentalFee);
        } else if (sortOrder === 'newest') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortOrder === 'bestseller') {
            result.sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0));
        } else {
            result.sort((a, b) => {
                const orderA = a.displayOrder || 999999;
                const orderB = b.displayOrder || 999999;
                if (orderA !== orderB) return orderA - orderB;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        setFilteredBooks(result);
        setCanLoadMore(result.length > displayedBooksCount);
    }, [books, selectedCategory, priceFilter, sortOrder, displayedBooksCount]);

    useEffect(() => {
        setDisplayedBooksCount(24);
    }, [selectedCategory, priceFilter, sortOrder]);

    const handlePriceFilterChange = (type, value) => {
        setPriceFilter((prev) => ({
            ...prev,
            [type]: value === '' ? (type === 'min' ? 0 : Infinity) : Number(value),
        }));
    };

    const handleLoadMore = () => {
        setDisplayedBooksCount((prev) => prev + 24);
    };

    const handleSelectCategory = (categoryId) => {
        const categoryName = styledCategories.find((cat) => cat._id === categoryId)?.nameCategory || categoryId;
        setSelectedCategory(normalizeText(selectedCategory) === normalizeText(categoryName) ? null : categoryName);
        setIsFilterDrawerOpen(false);
    };

    const renderCategoryList = () => (
        <div className="space-y-2">
            {styledCategories.map((cat) => (
                <button
                    key={cat._id}
                    onClick={() => handleSelectCategory(cat._id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        normalizeText(selectedCategory) === normalizeText(cat.nameCategory)
                            ? `${cat.bgColor} ${cat.textColor} border-l-4 border-blue-600 font-semibold`
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <span className="line-clamp-1">{cat.nameCategory}</span>
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{cat.count}</span>
                    </div>
                </button>
            ))}
        </div>
    );

    const renderPriceFilter = () => (
        <div className="space-y-3">
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Giá tối thiểu</label>
                <input
                    type="number"
                    min="0"
                    value={priceFilter.min === 0 ? '' : priceFilter.min}
                    onChange={(event) => handlePriceFilterChange('min', event.target.value)}
                    placeholder="0 đ"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Giá tối đa</label>
                <input
                    type="number"
                    min={priceFilter.min}
                    value={priceFilter.max === Infinity ? '' : priceFilter.max}
                    onChange={(event) => handlePriceFilterChange('max', event.target.value)}
                    placeholder="Không giới hạn"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <button
                onClick={() => setPriceFilter({ min: 0, max: Infinity })}
                className="w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
                Đặt lại
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-blue-50 text-gray-800">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                            Danh mục tài liệu
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">{selectedCategoryName}</h1>
                        <p className="mt-3 text-sm text-gray-600">
                            Hiển thị {Math.min(displayedBooksCount, filteredBooks.length)} trong số{' '}
                            {filteredBooks.length} tài liệu
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 md:hidden"
                        >
                            <Filter className="h-5 w-5" />
                            Lọc
                        </button>
                        <select
                            onChange={(event) => setSortOrder(event.target.value)}
                            value={sortOrder}
                            className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Sách nổi bật</option>
                            <option value="newest">Mới nhất</option>
                            <option value="price-asc">Giá thuê thấp đến cao</option>
                            <option value="price-desc">Giá thuê cao đến thấp</option>
                            <option value="bestseller">Mượn nhiều</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <aside className="hidden md:block md:col-span-1">
                        <div className="sticky top-28 space-y-6">
                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <div className="bg-blue-600 p-4 text-white">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        <div>
                                            <h2 className="font-bold">Danh mục sách</h2>
                                            <p className="text-xs text-blue-100">Tra cứu theo chủ đề</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto p-3">{renderCategoryList()}</div>
                            </section>

                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <div className="bg-slate-800 p-4 text-white">
                                    <h2 className="flex items-center gap-2 font-bold">
                                        <SlidersHorizontal className="h-5 w-5" />
                                        Bộ lọc giá
                                    </h2>
                                </div>
                                <div className="p-4">{renderPriceFilter()}</div>
                            </section>
                        </div>
                    </aside>

                    <section className="md:col-span-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                            {filteredBooks.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                                    {filteredBooks.slice(0, displayedBooksCount).map((book) => (
                                        <Link key={book._id} to={`/book/${book._id}`} className="group">
                                            <Cardbody product={book} />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50">
                                        <BookOpen className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <p className="mt-4 text-lg font-semibold text-gray-700">
                                        {selectedCategory
                                            ? `Hiện tại chưa có tài liệu nào thuộc chủ đề ${selectedCategory}.`
                                            : 'Không tìm thấy tài liệu phù hợp'}
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {selectedCategory
                                            ? 'Vui lòng quay lại sau hoặc thử chọn một danh mục khác.'
                                            : 'Hãy thử đổi danh mục hoặc bộ lọc giá.'}
                                    </p>
                                </div>
                            )}

                            {canLoadMore && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="min-h-[44px] rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        Xem thêm sách
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {isFilterDrawerOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-30 bg-black/50 md:hidden"
                            onClick={() => setIsFilterDrawerOpen(false)}
                        />
                        <div className="fixed bottom-0 right-0 top-0 z-40 w-full max-w-sm overflow-y-auto bg-white shadow-xl md:hidden">
                            <div className="sticky top-0 flex items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-4">
                                <h2 className="text-lg font-bold text-gray-900">Bộ lọc tài liệu</h2>
                                <button
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="rounded-lg p-2 transition hover:bg-white"
                                >
                                    <X className="h-5 w-5 text-gray-700" />
                                </button>
                            </div>
                            <div className="space-y-6 p-4">
                                <section>
                                    <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-800">
                                        <BookOutlined />
                                        Danh mục sách
                                    </h3>
                                    {renderCategoryList()}
                                </section>
                                <div className="border-t border-gray-200" />
                                <section>
                                    <h3 className="mb-3 text-lg font-bold text-gray-800">Lọc theo giá</h3>
                                    {renderPriceFilter()}
                                </section>
                            </div>
                        </div>
                    </>
                )}
            </main>

            <Footer />
            <Chatbot />
        </div>
    );
}

export default Products;
