import React, { useState, useEffect, useRef } from 'react';
import { Input, Rate, message, Spin } from 'antd';
import { SendOutlined, CloseOutlined, CustomerServiceOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
    requestCreateChatRequest,
    requestGetActiveChat,
    requestSendChatMessage,
    requestCloseChat,
    requestRateChat,
} from '../../config/request';

const { TextArea } = Input;

function LiveChatModal({ visible, onClose }) {
    const [chat, setChat] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const messagesEndRef = useRef(null);
    const pollInterval = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages]);

    useEffect(() => {
        if (visible) {
            initChat();
            pollInterval.current = setInterval(() => {
                loadActiveChat();
            }, 2000);
        } else {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        }

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [visible]);

    const initChat = async () => {
        setLoading(true);
        try {
            const activeRes = await requestGetActiveChat();
            if (activeRes.metadata) {
                setChat(activeRes.metadata);
            } else {
                const createRes = await requestCreateChatRequest();
                setChat(createRes.metadata);
                message.success('Đã gửi yêu cầu chat. Vui lòng chờ thủ thư phản hồi...');
            }
        } catch (error) {
            message.error('Không thể kết nối với thủ thư');
        } finally {
            setLoading(false);
        }
    };

    const loadActiveChat = async () => {
        try {
            const res = await requestGetActiveChat();
            if (res.metadata) {
                setChat(res.metadata);
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !chat) return;

        setSending(true);
        try {
            const res = await requestSendChatMessage({
                chatId: chat._id,
                message: inputMessage.trim(),
            });
            setChat(res.metadata);
            setInputMessage('');
        } catch (error) {
            message.error('Không thể gửi tin nhắn');
        } finally {
            setSending(false);
        }
    };

    const handleCloseChat = async () => {
        if (!chat) return;

        if (window.confirm('Bạn có chắc muốn kết thúc cuộc trò chuyện với thủ thư?')) {
            try {
                await requestCloseChat({ chatId: chat._id });
                setShowRating(true);
            } catch (error) {
                message.error('Không thể kết thúc cuộc trò chuyện');
            }
        }
    };

    const handleSubmitRating = async () => {
        if (rating === 0) {
            message.warning('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            await requestRateChat({
                chatId: chat._id,
                rating,
                feedback,
            });
            message.success('Cảm ơn bạn đã đánh giá!');
            setShowRating(false);
            onClose();
        } catch (error) {
            message.error('Không thể gửi đánh giá');
        }
    };

    const renderStatus = () => {
        if (!chat) return null;

        switch (chat.status) {
            case 'waiting':
                return (
                    <div className="flex flex-col items-center justify-center py-6 px-4 bg-yellow-50 border-b border-yellow-200">
                        <Spin />
                        <p className="mt-3 text-yellow-800 font-medium text-center">Đang chờ thủ thư phản hồi...</p>
                        <p className="text-xs text-gray-600 text-center mt-1">Vui lòng đợi trong giây lát</p>
                    </div>
                );
            case 'active':
                return (
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                <CustomerServiceOutlined className="text-white text-lg" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">
                                    {chat.librarianId?.fullName || 'Thủ thư'}
                                </div>
                                <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                    Đang trực tuyến
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'closed':
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-green-600">
                        <CheckCircleOutlined className="text-5xl mb-3" />
                        <p className="font-semibold text-center">Cuộc trò chuyện đã kết thúc</p>
                    </div>
                );
            default:
                return null;
        }
    };

    // Rating Modal
    if (showRating) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-gray-800">Đánh giá cuộc trò chuyện</h3>
                        <p className="text-sm text-gray-600">Bạn hài lòng với dịch vụ hỗ trợ của chúng tôi?</p>
                    </div>

                    <div className="flex justify-center">
                        <Rate value={rating} onChange={setRating} className="text-3xl" />
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nhận xét của bạn (không bắt buộc)
                        </label>
                        <TextArea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => {
                                setShowRating(false);
                                onClose();
                            }}
                            className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Bỏ qua
                        </button>
                        <button
                            onClick={handleSubmitRating}
                            className="flex-1 px-4 py-2 text-white font-medium rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                        >
                            Gửi đánh giá
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Chat Modal
    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-96 sm:h-[500px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <CustomerServiceOutlined className="text-2xl" />
                        <span className="font-semibold text-lg">Chat với Thủ thư</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded p-2 transition-colors"
                    >
                        <CloseOutlined className="text-xl" />
                    </button>
                </div>

                {/* Status/Loading */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {renderStatus()}

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-gray-50">
                            {chat?.messages?.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                                            msg.senderRole === 'user'
                                                ? 'bg-blue-500 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                        }`}
                                    >
                                        <div className="break-words">{msg.message}</div>
                                        <div
                                            className={`text-xs mt-1 opacity-70 text-right ${
                                                msg.senderRole === 'user' ? 'text-blue-100' : 'text-gray-600'
                                            }`}
                                        >
                                            {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        {chat?.status === 'active' && (
                            <div className="border-t border-gray-200 px-4 sm:px-6 py-3 bg-white flex-shrink-0 space-y-2">
                                <div className="flex gap-2">
                                    <TextArea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onPressEnter={(e) => {
                                            if (!e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Nhập tin nhắn..."
                                        autoSize={{ minRows: 1, maxRows: 3 }}
                                        disabled={sending}
                                        className="!text-sm"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || sending}
                                        className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-all ${
                                            inputMessage.trim() && !sending
                                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <SendOutlined className="text-lg" />
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleCloseChat}
                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors font-medium flex items-center gap-2"
                                    >
                                        <CloseOutlined /> Kết thúc
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default LiveChatModal;
