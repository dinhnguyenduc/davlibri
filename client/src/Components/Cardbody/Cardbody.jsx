import React from 'react';
import { Users, BookOpen } from 'lucide-react';
import { Tooltip, Tag } from 'antd';

function Cardbody({ product }) {
    const book = product; // Alias for clarity - this is actually a book
    const isAvailable = book.availableCopies > 0;

    return (
        <div className="w-full bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 group flex flex-col h-full">
            {/* Image Container - Fixed 3:4 Aspect Ratio */}
            <div className="relative overflow-hidden bg-gray-100 aspect-[3/4] flex-shrink-0">
                {book.images && book.images.length > 0 ? (
                    <img
                        src={book.images[0]}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                )}

                {/* Badge: Availability */}
                <div className="absolute top-2 left-2">
                    {isAvailable ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Còn {book.availableCopies}
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Đã mượn hết
                        </span>
                    )}
                </div>

                {/* Icon: Book */}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
            </div>

            {/* Content Container - Fixed Height */}
            <div className="p-3 flex flex-col gap-2 flex-1">
                {/* Author */}
                {book.author && (
                    <div className="flex-shrink-0">
                        <p className="text-xs text-gray-500 truncate">📚 {book.author}</p>
                    </div>
                )}

                {/* Title - Line Clamped */}
                <Tooltip title={book.title} placement="top">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-shrink-0">{book.title}</h3>
                </Tooltip>

                {/* Price - Pushed to Bottom */}
                <div className="mt-auto flex items-baseline gap-1">
                    <span className="text-base font-bold text-red-500">{book.dailyRentalFee?.toLocaleString()}đ</span>
                    <span className="text-xs text-gray-500">/ngày</span>
                </div>
            </div>
        </div>
    );
}

export default Cardbody;
