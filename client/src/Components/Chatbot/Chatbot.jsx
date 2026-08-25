import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Tooltip, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    MessageOutlined,
    SendOutlined,
    CloseOutlined,
    RobotOutlined,
    UserOutlined,
    QuestionCircleOutlined,
    CustomerServiceOutlined,
    FullscreenOutlined,
    UpOutlined,
    DownOutlined,
} from '@ant-design/icons';
import { requestAskChatbot, requestGetPublicFAQs } from '../../config/request';
import { useStore } from '../../hooks/useStore';
import LiveChatModal from './LiveChatModal';
import BookReferences from './BookReferences';

const { TextArea } = Input;

function Chatbot() {
    const navigate = useNavigate();
    const { dataUser, chatbotOpen, setChatbotOpen } = useStore();
    const [liveChatOpen, setLiveChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const [faqExpanded, setFaqExpanded] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Lấy câu hỏi gợi ý và gửi tin nhắn chào mừng khi mở chatbot
    useEffect(() => {
        if (!chatbotOpen) return;

        if (suggestedQuestions.length === 0) {
            loadSuggestedQuestions();
        }

        if (messages.length === 0) {
            const welcomeMessage = {
                type: 'bot',
                text: 'Xin chào anh/chị 👋\nCảm ơn anh/chị đã quan tâm đến thư viện DAVLibri!\nEm có thể hỗ trợ anh/chị nội dung gì ạ?',
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
        }
    }, [chatbotOpen, messages.length, suggestedQuestions.length]);

    const loadSuggestedQuestions = async () => {
        try {
            const response = await requestGetPublicFAQs('all');
            if (response.metadata) {
                setSuggestedQuestions(response.metadata.slice(0, 5));
            }
        } catch (error) {
            console.error('Lỗi khi tải câu hỏi gợi ý:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            type: 'user',
            text: inputValue,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        try {
            const response = await requestAskChatbot({ question: inputValue });

            const botMessage = {
                type: 'bot',
                text: response.metadata.answer,
                relatedQuestions: response.metadata.relatedQuestions || [],
                relatedBooks: response.metadata.relatedBooks || [],
                bookIds: response.metadata.bookIds || [], // IDs sách để hiển thị references
                calculation: response.metadata.calculation || null,
                directAnswer: response.metadata.directAnswer || false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch {
            const errorMessage = {
                type: 'bot',
                text: 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionClick = (question) => {
        setInputValue(question);
    };

    const toggleChat = () => {
        setChatbotOpen(!chatbotOpen);
    };

    const openFullChatPage = () => {
        navigate('/ai-chat');
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            {/* Floating Button - Fixed Position, Not Covering Other Elements */}
            <Tooltip title="Trợ lý ảo" placement="left">
                <button
                    onClick={toggleChat}
                    className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-semibold transition-all duration-300 z-50 ${
                        chatbotOpen
                            ? 'bg-red-500 hover:bg-red-600 shadow-lg'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-xl hover:shadow-2xl hover:scale-110'
                    }`}
                    aria-label={chatbotOpen ? 'Đóng' : 'Mở trợ lý ảo'}
                >
                    {chatbotOpen ? (
                        <CloseOutlined className="text-white text-xl md:text-2xl" />
                    ) : (
                        <MessageOutlined className="text-white text-xl md:text-2xl" />
                    )}
                </button>
            </Tooltip>

            {/* Chat Window - Full Screen Modal on Mobile, Fixed Window on Desktop */}
            {chatbotOpen && (
                <>
                    {/* Mobile Overlay */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={() => setChatbotOpen(false)}
                    />

                    {/* Chat Container */}
                    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:inset-auto md:bottom-24 md:right-8 md:h-[600px] md:max-h-[85vh] md:w-[360px] md:rounded-[22px]">
                        {/* Header */}
                        <div className="flex flex-shrink-0 items-center justify-between bg-[#0f172a] px-4 py-3 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)] sm:px-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                                    <RobotOutlined className="text-lg text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold sm:text-base">Sapo AI</h3>
                                    <p className="text-[10px] text-slate-300">DAVLibri Support</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tooltip title="Mở chat riêng full màn hình" placement="top">
                                    <button
                                        onClick={openFullChatPage}
                                        className="rounded p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        <FullscreenOutlined />
                                    </button>
                                </Tooltip>
                                <button
                                    onClick={() => setChatbotOpen(false)}
                                    className="rounded p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <CloseOutlined />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 px-3 sm:px-4 py-4 space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-2 sm:gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div
                                        className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                                            msg.type === 'bot' ? 'bg-blue-100' : 'bg-green-100'
                                        }`}
                                    >
                                        {msg.type === 'bot' ? (
                                            <RobotOutlined className="text-blue-600 text-sm" />
                                        ) : (
                                            <UserOutlined className="text-green-600 text-sm" />
                                        )}
                                    </div>

                                    {/* Message Content */}
                                    <div
                                        className={`flex flex-col gap-1 max-w-xs ${
                                            msg.type === 'user' ? 'items-end' : 'items-start'
                                        }`}
                                    >
                                        {/* Bubble */}
                                        <div
                                            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-sm sm:text-base break-words ${
                                                msg.type === 'user'
                                                    ? 'bg-blue-500 text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                            }`}
                                        >
                                            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                                            {/* 💰 Calculation Result */}
                                            {msg.calculation && (
                                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-opacity-20 border-gray-400 space-y-2">
                                                    <div className="font-semibold text-xs sm:text-sm text-blue-600">
                                                        💰 Chi phí chi tiết
                                                    </div>
                                                    <div className="text-xs space-y-1 leading-relaxed">
                                                        <div>
                                                            • Giá: {msg.calculation.pricePerDay.toLocaleString('vi-VN')}
                                                            ₫/ngày
                                                        </div>
                                                        <div>• Thời gian: {msg.calculation.durationText}</div>
                                                        <div>• Công thức: {msg.calculation.breakdown.formula}</div>
                                                        <div className="font-bold text-red-500 pt-1 border-t border-opacity-20 border-gray-400">
                                                            → Tổng: {msg.calculation.breakdown.result}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 📚 Categories List */}
                                            {msg.categories && msg.categories.length > 0 && (
                                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-opacity-20 border-gray-400 space-y-2">
                                                    <div className="font-semibold text-xs sm:text-sm text-green-600">
                                                        📚 Danh sách danh mục
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {msg.categories.map((cat, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-white bg-opacity-50 p-2 rounded border border-green-200 text-xs"
                                                            >
                                                                <div className="font-semibold text-green-700">
                                                                    {cat.nameCategory}
                                                                </div>
                                                                <div className="text-gray-600">
                                                                    {cat.bookCount} cuốn
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Related Questions */}
                                            {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-opacity-20 border-gray-400 space-y-2">
                                                    <div className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                                                        <QuestionCircleOutlined /> Câu hỏi liên quan
                                                    </div>
                                                    <div className="space-y-1">
                                                        {msg.relatedQuestions.map((q, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleQuestionClick(q.question)}
                                                                className="block text-xs text-blue-600 hover:underline text-left w-full truncate"
                                                            >
                                                                • {q.question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Book References */}
                                            {msg.relatedBooks && msg.relatedBooks.length > 0 && (
                                                <div className="mt-2 sm:mt-3">
                                                    <BookReferences books={msg.relatedBooks} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Time */}
                                        <span className="text-xs text-gray-500 px-1">{formatTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            ))}

                            {/* Loading Indicator */}
                            {loading && (
                                <div className="flex gap-3 items-start">
                                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <RobotOutlined className="text-blue-600 text-sm" />
                                    </div>
                                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-none flex items-center gap-2">
                                        <Spin size="small" />
                                        <span className="text-sm text-gray-600">Đang suy nghĩ...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* FAQ Section - Accordion */}
                        {suggestedQuestions.length > 0 && (
                            <div className="border-t border-slate-200 bg-white px-3 py-2.5 sm:px-4 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setFaqExpanded((prev) => !prev)}
                                    className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left"
                                >
                                    <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                        <QuestionCircleOutlined className="text-[12px]" />
                                        Câu hỏi thường gặp
                                    </span>
                                    <span className="text-slate-500">
                                        {faqExpanded ? <UpOutlined /> : <DownOutlined />}
                                    </span>
                                </button>

                                {faqExpanded && (
                                    <div className="mt-2 space-y-2">
                                        {suggestedQuestions.map((q, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuestionClick(q.question)}
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                                            >
                                                {q.question}
                                            </button>
                                        ))}

                                        {dataUser && dataUser.role === 'user' && (
                                            <button
                                                onClick={() => setLiveChatOpen(true)}
                                                className="w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-left text-sm font-medium text-green-700 transition hover:bg-green-100"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <CustomerServiceOutlined className="text-sm" />
                                                    Chat với thủ thư
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Input Area - Flat design */}
                        <div className="border-t border-slate-200 bg-white px-3 py-2.5 sm:px-4 flex-shrink-0">
                            <div className="flex items-end gap-2 bg-white">
                                <TextArea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onPressEnter={(e) => {
                                        if (!e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Nhập tin nhắn..."
                                    autoSize={{ minRows: 1, maxRows: 3 }}
                                    disabled={loading}
                                    className="!border-0 !shadow-none !bg-transparent !rounded-none !p-0 !text-sm !text-slate-700 placeholder:!text-slate-400 focus:!border-0 focus:!shadow-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || loading}
                                    className={`flex h-9 w-9 items-center justify-center rounded-md text-sm transition sm:h-10 sm:w-10 ${
                                        inputValue.trim() && !loading
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                    }`}
                                    title="Gửi tin nhắn"
                                >
                                    <SendOutlined />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Live Chat Modal */}
            <LiveChatModal visible={liveChatOpen} onClose={() => setLiveChatOpen(false)} />
        </>
    );
}

export default Chatbot;
