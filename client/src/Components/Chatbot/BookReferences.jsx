import React from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'antd';
import { BookOutlined, ShoppingCartOutlined } from '@ant-design/icons';

/**
 * Component hiển thị danh sách sách tham khảo (References)
 * từ câu trả lời của AI Chatbot
 */
const BookReferences = ({ books = [] }) => {
    if (!books || books.length === 0) {
        return null;
    }

    return (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-opacity-20 border-gray-400 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
                <BookOutlined className="text-blue-600 text-sm" />
                <span className="font-semibold text-xs sm:text-sm text-blue-600">
                    📚 Nguồn tham khảo ({books.length} cuốn)
                </span>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {books.map((book) => (
                    <Link key={book._id} to={`/book/${book._id}`} className="block group no-underline">
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-200 h-full flex flex-col">
                            {/* Book Cover */}
                            <div className="w-full h-32 sm:h-40 bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {book.images && book.images[0] ? (
                                    <img
                                        alt={book.title}
                                        src={book.images[0]}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            e.target.src =
                                                'https://via.placeholder.com/120x160/f0f0f0/666?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <BookOutlined className="text-3xl text-gray-400" />
                                        <span className="text-xs text-gray-400">Không có ảnh</span>
                                    </div>
                                )}
                            </div>

                            {/* Book Info */}
                            <div className="px-2 py-2 sm:px-3 sm:py-3 flex flex-col flex-1 gap-2">
                                {/* Title */}
                                <h4 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                                    {book.title}
                                </h4>

                                {/* Author */}
                                <p className="text-xs text-gray-600 line-clamp-1">
                                    {book.author || 'Tác giả không rõ'}
                                </p>

                                {/* Price */}
                                <div className="text-xs font-bold text-red-500">
                                    {book.dailyRentalFee?.toLocaleString('vi-VN') || '0'}₫/ngày
                                </div>

                                {/* Stock Status */}
                                <div className="flex-shrink-0">
                                    {book.availableCopies > 0 ? (
                                        <Tag color="green" className="text-xs">
                                            Còn {book.availableCopies}
                                        </Tag>
                                    ) : (
                                        <Tag color="red" className="text-xs">
                                            Hết sách
                                        </Tag>
                                    )}
                                </div>

                                {/* View Button */}
                                <button className="w-full flex items-center justify-center gap-1 px-2 py-1 sm:px-3 sm:py-2 mt-auto text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium rounded transition-colors">
                                    <ShoppingCartOutlined className="text-sm" /> Xem chi tiết
                                </button>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer Note */}
            <div className="text-center py-1 text-xs text-gray-600">💡 Click vào sách để xem chi tiết và đặt thuê</div>
        </div>
    );
};

export default BookReferences;
