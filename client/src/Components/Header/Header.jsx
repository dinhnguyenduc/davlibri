import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, ChevronDown, Phone, Mail, BookOpen } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { requestLogout, requestSearchBook } from '../../config/request';
import useDeboune from '../../hooks/useDebounce';

function Header() {
    const [searchText, setSearchText] = useState('');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchResult, setSearchResult] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const debouncedSearch = useDeboune(searchText, 500);

    const navigate = useNavigate();
    const { dataUser, dataCart, chatbotOpen } = useStore();

    // Handle sticky header
    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when chatbot opens
    useEffect(() => {
        if (chatbotOpen) {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
        }
    }, [chatbotOpen]);

    const handleLogout = async () => {
        try {
            await requestLogout();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/');
        } catch (error) {
            console.log(error);
        }
    };

    const handleBookClick = (bookId) => {
        navigate(`/book/${bookId}`);
        setSearchText('');
        setShowSearchResults(false);
        setIsSearchOpen(false);
    };

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

    const navigationLinks = [
        { to: '/about', label: 'Giới thiệu DAVLibri' },
        { to: '/packages', label: 'Gói nạp ngày thuê' },
        { to: '/products', label: 'Tủ sách' },
        { to: '/blog', label: 'Góc mọt sách' },
        { to: '/wishlist', label: 'Wishlist' },
    ];

    const topMenuLinks = [
        { to: '/rental-guide', label: 'Thuê, đổi, trả sách' },
        { to: '/contact', label: 'Liên hệ' },
        { to: '/faq', label: 'FAQ' },
    ];

    return (
        <header className="w-full relative z-50">
            {/* TOP BAR - Hidden on Mobile, Visible on Tablet+ */}
            <div className="hidden md:block bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs sm:text-sm">
                        {/* Left - Slogan & Contact */}
                        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                            <span className="font-semibold text-gray-800">📖 Books: Food for the Brain</span>
                            <a
                                href="tel:+84964834431"
                                className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition"
                            >
                                <Phone size={14} />
                                +84964834431
                            </a>
                            <a
                                href="mailto:davlibrireading.info@dav.edu.vn"
                                className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition"
                            >
                                <Mail size={14} />
                                davlibrireading.info@dav.edu.vn
                            </a>
                        </div>
                        {/* Right - Quick Links */}
                        <nav className="flex gap-4 sm:gap-6">
                            {topMenuLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="text-gray-600 hover:text-blue-600 transition"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* MAIN HEADER */}
            <div
                className={`w-full bg-white border-b border-gray-200 transition-all duration-300 ${
                    isSticky ? 'fixed top-0 left-0 right-0 shadow-lg' : 'relative'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 py-2">
                    {/* Header Content Container */}
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        {/* LEFT: Logo */}
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition">
                            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                            <span className="text-lg sm:text-2xl font-bold text-gray-900 whitespace-nowrap">
                                DAVLibri
                            </span>
                        </Link>

                        {/* CENTER: Search Bar - Prominent on All Sizes */}
                        <div className="flex-1 max-w-md hidden sm:flex">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Tìm sách..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    onFocus={() => setIsSearchOpen(true)}
                                    className="w-full px-4 py-2.5 bg-gray-100 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                />
                                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* RIGHT: Action Buttons */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Mobile Search - Tap to expand */}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="sm:hidden p-2.5 hover:bg-gray-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label="Search"
                            >
                                <Search className="w-5 h-5 text-gray-700" />
                            </button>

                            {/* Cart */}
                            <Link
                                to="/cart"
                                className="relative p-2.5 hover:bg-gray-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                                <ShoppingCart className="w-5 h-5 text-gray-700" />
                                {dataCart?.length > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {dataCart.length}
                                    </span>
                                )}
                            </Link>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsUserMenuOpen(!isUserMenuOpen);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-gray-100 rounded-lg transition min-h-[44px]"
                                >
                                    <User className="w-5 h-5 text-gray-700" />
                                    <span className="hidden md:inline text-sm font-medium text-gray-700">
                                        Tài khoản
                                    </span>
                                    <ChevronDown
                                        className={`w-4 h-4 text-gray-600 transition-transform ${
                                            isUserMenuOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {/* User Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <>
                                        {/* Overlay to close menu */}
                                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />

                                        {/* Dropdown */}
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-50 overflow-hidden">
                                            {dataUser?._id ? (
                                                <>
                                                    {/* User Info */}
                                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-4 border-b border-blue-100">
                                                        <p className="text-xs text-gray-600">Xin chào</p>
                                                        <p className="text-sm font-bold text-gray-900 mt-1">
                                                            {dataUser.fullName || dataUser.email}
                                                        </p>
                                                    </div>

                                                    {/* Menu Items */}
                                                    <div className="py-2">
                                                        <Link
                                                            to="/info-user"
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center gap-3 px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition min-h-[44px]"
                                                        >
                                                            <User size={16} className="text-blue-600" />
                                                            <span className="text-sm font-medium">Hồ sơ cá nhân</span>
                                                        </Link>

                                                        {(dataUser.role === 'admin' ||
                                                            dataUser.role === 'librarian') && (
                                                            <Link
                                                                to="/admin"
                                                                onClick={() => setIsUserMenuOpen(false)}
                                                                className="flex items-center gap-3 px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition min-h-[44px]"
                                                            >
                                                                <span className="text-lg">⚙️</span>
                                                                <span className="text-sm font-medium">
                                                                    Trang quản trị
                                                                </span>
                                                            </Link>
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                handleLogout();
                                                                setIsUserMenuOpen(false);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-5 py-2.5 text-red-600 hover:bg-red-50 transition border-t border-gray-100 min-h-[44px]"
                                                        >
                                                            <span className="text-lg">🚪</span>
                                                            <span className="text-sm font-medium">Đăng xuất</span>
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="py-2">
                                                    <Link
                                                        to="/login"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition min-h-[44px]"
                                                    >
                                                        <span className="text-lg">🔐</span>
                                                        <span className="text-sm font-medium">Đăng nhập</span>
                                                    </Link>
                                                    <Link
                                                        to="/register"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition min-h-[44px]"
                                                    >
                                                        <span className="text-lg">📝</span>
                                                        <span className="text-sm font-medium">Đăng ký</span>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(!isMobileMenuOpen);
                                    setIsUserMenuOpen(false);
                                }}
                                className="md:hidden p-2.5 hover:bg-gray-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6 text-gray-700" />
                                ) : (
                                    <Menu className="w-6 h-6 text-gray-700" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Desktop Navigation - Hidden on Mobile */}
                    <nav className="hidden md:flex items-center gap-6 mt-3 pb-2 border-t border-gray-100">
                        {navigationLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition py-2"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* MOBILE SEARCH OVERLAY - Full Screen */}
            {isSearchOpen && !searchText && (
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSearchOpen(false)} />
            )}

            {/* MOBILE SEARCH - Full Screen Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
                    {/* Close button */}
                    <button
                        onClick={() => setIsSearchOpen(false)}
                        className="fixed top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition z-50"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
                        {/* Search Input */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm sách..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                autoFocus
                                className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            />
                        </div>

                        {/* Search Results */}
                        {showSearchResults && searchResult.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-400 mb-4">Tìm thấy {searchResult.length} kết quả</p>
                                {searchResult.map((book) => (
                                    <div
                                        key={book._id}
                                        onClick={() => handleBookClick(book._id)}
                                        className="flex gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition min-h-[80px]"
                                    >
                                        {/* Book Image */}
                                        <div className="flex-shrink-0 w-14 h-20 bg-gray-700 rounded">
                                            {book.images && book.images.length > 0 && (
                                                <img
                                                    src={book.images[0]}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            )}
                                        </div>

                                        {/* Book Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium line-clamp-2 text-sm">{book.title}</p>
                                            <p className="text-blue-400 font-semibold mt-1 text-sm">
                                                {book.dailyRentalFee?.toLocaleString()} đ/ngày
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {searchText && !showSearchResults && (
                            <div className="text-center py-12">
                                <p className="text-gray-400 text-lg">Không tìm thấy sách</p>
                            </div>
                        )}

                        {/* Search Tips */}
                        {!searchText && (
                            <div className="text-center py-8">
                                <p className="text-gray-400 text-lg">Nhập tên sách để tìm kiếm</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MOBILE NAVIGATION DRAWER - Hidden on Desktop */}
            {isMobileMenuOpen && (
                <>
                    {/* Overlay */}
                    <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setIsMobileMenuOpen(false)} />

                    {/* Drawer */}
                    <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-40 overflow-y-auto shadow-xl">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-4 border-b border-blue-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 hover:bg-white rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex flex-col gap-1 px-4 py-4">
                            {navigationLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-gray-700 font-medium hover:bg-blue-50 rounded-lg transition min-h-[44px] flex items-center"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Divider */}
                        <div className="border-t border-gray-200" />

                        {/* Top Menu Links */}
                        <nav className="flex flex-col gap-1 px-4 py-4">
                            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Thông tin
                            </p>
                            {topMenuLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-gray-700 font-medium hover:bg-blue-50 rounded-lg transition min-h-[44px] flex items-center"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </>
            )}
        </header>
    );
}

export default Header;
