import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Tag, Button } from 'antd';
import { BookOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import './BookReferences.css';

/**
 * Component hiển thị danh sách sách tham khảo (References)
 * từ câu trả lời của AI Chatbot
 */
const BookReferences = ({ books = [] }) => {
    if (!books || books.length === 0) {
        return null;
    }

    return (
        <div className="book-references">
            <div className="references-header">
                <BookOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                <span className="references-title">📚 Nguồn tham khảo ({books.length} cuốn)</span>
            </div>

            <div className="references-grid">
                {books.map((book) => (
                    <Link key={book._id} to={`/book/${book._id}`} className="book-reference-card">
                        <Card
                            hoverable
                            className="reference-card"
                            cover={
                                book.images && book.images[0] ? (
                                    <div className="reference-book-image">
                                        <img
                                            alt={book.title}
                                            src={book.images[0]}
                                            onError={(e) => {
                                                e.target.src =
                                                    'https://via.placeholder.com/120x160/f0f0f0/666?text=No+Image';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="reference-book-image no-image">
                                        <BookOutlined style={{ fontSize: '40px', color: '#bfbfbf' }} />
                                    </div>
                                )
                            }
                        >
                            <div className="reference-book-info">
                                <h4 className="reference-book-title">{book.title}</h4>
                                <p className="reference-book-author">{book.author || 'Tác giả không rõ'}</p>

                                <div className="reference-book-details">
                                    <div className="reference-price">
                                        <span className="price-label">Giá thuê:</span>
                                        <span className="price-value">
                                            {book.dailyRentalFee?.toLocaleString('vi-VN')}đ/ngày
                                        </span>
                                    </div>

                                    <div className="reference-stock">
                                        {book.availableCopies > 0 ? (
                                            <Tag color="success" className="stock-tag">
                                                Còn {book.availableCopies} cuốn
                                            </Tag>
                                        ) : (
                                            <Tag color="error" className="stock-tag">
                                                Hết sách
                                            </Tag>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<ShoppingCartOutlined />}
                                    className="reference-view-btn"
                                    block
                                >
                                    Xem chi tiết
                                </Button>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="references-footer">
                <p className="references-note">💡 Click vào sách để xem chi tiết và đặt thuê ngay</p>
            </div>
        </div>
    );
};

export default BookReferences;
