import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    MessageOutlined,
    SendOutlined,
    RobotOutlined,
    UserOutlined,
    QuestionCircleOutlined,
    CustomerServiceOutlined,
} from '@ant-design/icons';
import { requestAskChatbot, requestGetPublicFAQs } from '../config/request';
import { useStore } from '../hooks/useStore';
import BookReferences from '../Components/Chatbot/BookReferences';

const { TextArea } = Input;

function AIChatPage() {
    const navigate = useNavigate();
    const { dataUser } = useStore();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const [faqExpanded, setFaqExpanded] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    type: 'bot',
                    text: 'Xin chào anh/chị 👋\nCảm ơn anh/chị đã quan tâm đến thư viện DAVLibri!\nEm có thể hỗ trợ anh/chị nội dung gì ạ?',
                    timestamp: new Date(),
                },
            ]);
        }

        if (suggestedQuestions.length === 0) {
            loadSuggestedQuestions();
        }
    }, [messages.length, suggestedQuestions.length]);

    const loadSuggestedQuestions = async () => {
        try {
            const response = await requestGetPublicFAQs('all');
            if (response?.metadata) {
                setSuggestedQuestions(response.metadata.slice(0, 8));
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
                bookIds: response.metadata.bookIds || [],
                calculation: response.metadata.calculation || null,
                directAnswer: response.metadata.directAnswer || false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
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

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-700">
            <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-3 py-4 sm:px-5 lg:px-7">
                <header className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_14px_32px_rgba(15,23,42,0.08)] sm:px-4">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                    >
                        <ArrowLeftOutlined />
                        <span>Về trang chính</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-[0_8px_20px_rgba(15,23,42,0.22)]">
                            <MessageOutlined className="text-lg" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-800 sm:text-lg">Không gian AI Chat riêng</h1>
                            <p className="text-[11px] text-slate-500 sm:text-xs">
                                Giao tiếp trực tiếp với trợ lý thư viện
                            </p>
                        </div>
                    </div>
                </header>

                <main className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between bg-[#0f172a] px-4 py-3 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                                <MessageOutlined />
                            </div>
                            <div>
                                <div className="text-sm font-semibold">DAVLibri AI</div>
                                <div className="text-[11px] text-blue-100">Trợ lý thư viện</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#f6f7fb] px-3 py-4 sm:px-5">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-4 flex gap-2 sm:gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.type === 'bot' && (
                                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <RobotOutlined className="text-sm" />
                                    </div>
                                )}

                                <div className={`max-w-[85%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-2xl px-3 py-2.5 text-sm leading-6 shadow-sm sm:px-4 ${
                                            msg.type === 'user'
                                                ? 'bg-blue-500 text-white rounded-br-md'
                                                : 'border border-slate-200 bg-white text-slate-700 rounded-bl-md'
                                        }`}
                                    >
                                        <p className="whitespace-pre-line">{msg.text}</p>

                                        {msg.calculation && (
                                            <div className="mt-3 space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs sm:text-sm">
                                                <div className="font-semibold text-blue-700">💰 Chi phí chi tiết</div>
                                                <div className="space-y-1 text-slate-700">
                                                    <div>
                                                        • Giá thuê:{' '}
                                                        {msg.calculation.pricePerDay.toLocaleString('vi-VN')}đ/ngày
                                                    </div>
                                                    <div>• Thời gian: {msg.calculation.durationText}</div>
                                                    <div>• Tính toán: {msg.calculation.breakdown.formula}</div>
                                                    <div className="border-t border-blue-200 pt-2 font-bold text-red-500">
                                                        → Tổng tiền: {msg.calculation.breakdown.result}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                                            <div className="mt-3 border-t border-slate-200 pt-3">
                                                <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    <QuestionCircleOutlined className="text-[12px]" />
                                                    Câu hỏi liên quan
                                                </div>
                                                <div className="space-y-1.5">
                                                    {msg.relatedQuestions.map((q, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleQuestionClick(q.question)}
                                                            className="block w-full text-left text-xs text-blue-600 transition hover:text-blue-700 hover:underline"
                                                        >
                                                            • {q.question}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {msg.relatedBooks && msg.relatedBooks.length > 0 && (
                                            <div className="mt-3">
                                                <BookReferences books={msg.relatedBooks} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="mt-1 block px-1 text-[10px] text-slate-400">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                </div>

                                {msg.type === 'user' && (
                                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <UserOutlined className="text-sm" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="mb-4 flex gap-2 sm:gap-3 justify-start">
                                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    <RobotOutlined className="text-sm" />
                                </div>
                                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Spin size="small" />
                                        <span>Đang suy nghĩ...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {suggestedQuestions.length > 0 && (
                        <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-4">
                            <button
                                type="button"
                                onClick={() => setFaqExpanded((prev) => !prev)}
                                className="mb-2 flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left transition hover:bg-slate-100"
                            >
                                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                    <QuestionCircleOutlined className="text-[12px]" />
                                    Câu hỏi thường gặp
                                </span>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                    {faqExpanded ? '▴' : '▾'}
                                </span>
                            </button>

                            {faqExpanded && (
                                <div className="space-y-2">
                                    {suggestedQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuestionClick(q.question)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                        >
                                            {q.question}
                                        </button>
                                    ))}
                                    {dataUser && dataUser.role === 'user' && (
                                        <button
                                            onClick={() => {}}
                                            className="w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-left text-sm font-medium text-green-700 transition hover:border-green-300 hover:bg-green-100"
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

                    <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
                        <div className="flex items-end gap-2 rounded-xl bg-white transition duration-200 focus-within:bg-slate-50">
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
                                type="button"
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || loading}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-all duration-200 sm:h-10 sm:w-10 ${
                                    inputValue.trim() && !loading
                                        ? 'bg-[#0ea5e9] text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] hover:bg-[#0284c7]'
                                        : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                }`}
                                aria-label="Gửi tin nhắn"
                            >
                                <SendOutlined className="text-[14px]" />
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AIChatPage;
