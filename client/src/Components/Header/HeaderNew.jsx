import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, ChevronDown } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { requestLogout, requestSearchBook } from '../../config/request';
import useDeboune from '../../hooks/useDebounce';
import './HeaderNew.css';

function HeaderNew() {
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
            setIsSticky(window.scrollY > 61);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when chatbot opens
    useEffect(() => {
        if (chatbotOpen) {
            setIsUserMenuOpen(false);
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

    return (
        <header className="header-wrapper">
            {/* Top Bar */}
            <div className="top-info-bar">
                <div className="container-header">
                    <div className="top-info-content">
                        <div className="contact-details">
                            <span className="slogan">
                                <b>Read more, read better</b>
                            </span>
                            <a href="tel:+84964834431" className="phone">
                                <i className="icon-phone">☎</i>
                                +84964834431
                            </a>
                            <a href="mailto:davlibrireading.info@dav.edu.vn" className="email">
                                <i className="icon-mail">✉</i>
                                davlibrireading.info@dav.edu.vn
                            </a>
                        </div>
                        <nav className="top-menu">
                            <Link to="/faq">Thuê, đổi, trả sách</Link>
                            <Link to="/contact">Liên hệ</Link>
                            <Link to="/faq">FAQ</Link>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className={`main-header ${isSticky ? 'sticky' : ''}`}>
                <div className="container-header">
                    <div className="main-header-content">
                        {/* Left - Logo and Navigation */}
                        <div className="header-left">
                            <Link to="/" className="logo">
                                <div
                                    className="logo-main"
                                    style={{
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        color: '#1890ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <span style={{ fontSize: '28px' }}>📚</span>
                                    <span>DAVLibri</span>
                                </div>
                            </Link>

                            <nav className="main-nav">
                                <Link to="/about">Giới thiệu DAVLibri</Link>
                                <Link to="/packages">Gói nạp ngày thuê</Link>
                                <Link to="/products">Tủ sách</Link>
                                <Link to="/blog">Góc mọt sách</Link>
                                <Link to="/wishlist">Wishlist</Link>
                            </nav>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="mobile-menu-toggle"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>

                        {/* Right - Actions */}
                        <div className="header-right">
                            {/* Cart */}
                            <Link to="/cart" className="header-action cart-action">
                                <ShoppingCart size={20} />
                                <span className="cart-count">{dataCart?.length || 0}</span>
                            </Link>

                            {/* Search Button */}
                            <button
                                className="header-action search-action"
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                            >
                                <Search size={20} />
                            </button>

                            {/* User Account */}
                            <div className="user-menu-wrapper">
                                <button
                                    className="header-action user-action"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                >
                                    <User size={20} />
                                    <span>Tài khoản</span>
                                    <ChevronDown size={16} className={isUserMenuOpen ? 'rotate' : ''} />
                                </button>

                                {/* User Dropdown */}
                                {isUserMenuOpen && (
                                    <>
                                        <div className="user-dropdown">
                                            {dataUser?._id ? (
                                                <>
                                                    <div className="user-info">
                                                        <p className="user-greeting">Xin chào</p>
                                                        <p className="user-name">
                                                            {dataUser.fullName || dataUser.email}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        to="/info-user"
                                                        className="dropdown-item"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <User size={16} />
                                                        Hồ sơ cá nhân
                                                    </Link>
                                                    {(dataUser.role === 'admin' || dataUser.role === 'librarian') && (
                                                        <Link
                                                            to="/admin"
                                                            className="dropdown-item"
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                        >
                                                            <i className="icon">⚙️</i>
                                                            Trang quản trị
                                                        </Link>
                                                    )}
                                                    <hr />
                                                    <button className="dropdown-item logout" onClick={handleLogout}>
                                                        <i className="icon">🚪</i>
                                                        Đăng xuất
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        to="/login"
                                                        className="dropdown-item"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <i className="icon">🔐</i>
                                                        Đăng nhập
                                                    </Link>
                                                    <Link
                                                        to="/register"
                                                        className="dropdown-item"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <i className="icon">📝</i>
                                                        Đăng ký
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                        <div className="dropdown-overlay" onClick={() => setIsUserMenuOpen(false)} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Overlay */}
                {isSearchOpen && (
                    <div className="search-overlay">
                        <div className="search-container">
                            <div className="search-wrapper">
                                <Search className="search-icon" size={24} />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Nhập từ khoá..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    autoFocus
                                />
                                <button className="search-close" onClick={() => setIsSearchOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Search Results */}
                            {showSearchResults && searchResult.length > 0 && (
                                <div className="search-results">
                                    {searchResult.map((book) => (
                                        <div
                                            key={book._id}
                                            onClick={() => handleBookClick(book._id)}
                                            className="search-result-item"
                                        >
                                            <div className="result-image">
                                                {book.images && book.images.length > 0 && (
                                                    <img src={book.images[0]} alt={book.title} />
                                                )}
                                            </div>
                                            <div className="result-info">
                                                <p className="result-name">{book.title}</p>
                                                <p className="result-price">
                                                    {book.dailyRentalFee.toLocaleString()} đ/ngày
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu">
                        <nav className="mobile-nav">
                            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>
                                Giới thiệu DAVLibri
                            </Link>
                            <Link to="/packages" onClick={() => setIsMobileMenuOpen(false)}>
                                Gói nạp ngày thuê
                            </Link>
                            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)}>
                                Tủ sách
                            </Link>
                            <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)}>
                                Góc mọt sách
                            </Link>
                            <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
                                Wishlist
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}

export default HeaderNew;
