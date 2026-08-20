import React from 'react';
import { Users, BookOpen } from 'lucide-react';
import { Tooltip, Tag } from 'antd';

function Cardbody({ product }) {
    const book = product; // Alias for clarity - this is actually a book
    const isAvailable = book.availableCopies > 0;

    return (
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 group flex flex-col h-[420px]">
            {/* Image Container - Fixed Height */}
            <div className="relative overflow-hidden h-[280px] flex-shrink-0 bg-gray-50">
                <img
                    src={book.images[0]}
                    alt={book.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                {/* Availability Badge */}
                <div className="absolute top-3 left-3">
                    {isAvailable ? (
                        <Tag color="success">Còn {book.availableCopies} cuốn</Tag>
                    ) : (
                        <Tag color="error">Đã mượn hết</Tag>
                    )}
                </div>
            </div>

            {/* Content - Fixed Height */}
            <div className="p-4 flex flex-col gap-2 flex-1">
                {/* Author */}
                {book.author && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-600 font-medium truncate">📚 {book.author}</span>
                    </div>
                )}

                {/* Title - Fixed Height (2 lines max) */}
                <Tooltip title={book.title} placement="top">
                    <div
                        className="flex-shrink-0 cursor-pointer"
                        style={{
                            height: '3rem',
                            overflow: 'hidden',
                        }}
                    >
                        <h1
                            className="text-lg text-gray-900 font-semibold hover:text-blue-600 transition-colors"
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: '1.5rem',
                                maxHeight: '3rem',
                            }}
                        >
                            {book.title}
                        </h1>
                    </div>
                </Tooltip>

                {/* Rental Fee - Sát gần với tiêu đề */}
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-red-500">{book.dailyRentalFee.toLocaleString()}đ</span>
                    <span className="text-sm text-gray-500">/ ngày thuê</span>
                </div>
            </div>
        </div>
    );
}

export default Cardbody;
