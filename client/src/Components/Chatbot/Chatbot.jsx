import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Card, Tooltip, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    MessageOutlined,
    SendOutlined,
    CloseOutlined,
    RobotOutlined,
    UserOutlined,
    QuestionCircleOutlined,
    CustomerServiceOutlined,
    UpOutlined,
    DownOutlined,
    FullscreenOutlined,
} from '@ant-design/icons';
import { requestAskChatbot, requestGetPublicFAQs } from '../../config/request';
import { useStore } from '../../hooks/useStore';
import LiveChatModal from './LiveChatModal';
import BookReferences from './BookReferences';
import './Chatbot.css';

const { TextArea } = Input;

function Chatbot() {
    const navigate = useNavigate();
    const { dataUser, chatbotOpen, setChatbotOpen } = useStore();
    const [liveChatOpen, setLiveChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: 'Xin chào! Tôi là trợ lý ảo của thư viện. Tôi có thể giúp gì cho bạn?',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const [faqExpanded, setFaqExpanded] = useState(true);
    const messagesEndRef = useRef(null);

    // Scroll to bottom khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Lấy câu hỏi gợi ý khi mở chatbot
    useEffect(() => {
        if (chatbotOpen && suggestedQuestions.length === 0) {
            loadSuggestedQuestions();
        }
    }, [chatbotOpen]);

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
            {/* Floating Button */}
            <Tooltip title="Trợ lý ảo" placement="left">
                <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={chatbotOpen ? <CloseOutlined /> : <MessageOutlined />}
                    onClick={toggleChat}
                    className="chatbot-float-button"
                    style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: '30px',
                        width: '60px',
                        height: '60px',
                        fontSize: '24px',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                />
            </Tooltip>

            {/* Chat Window */}
            {chatbotOpen && (
                <div className="chatbot-window">
                    <Card
                        className="chatbot-card"
                        bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        {/* Header */}
                        <div className="chatbot-header">
                            <div className="flex items-center gap-3">
                                <div className="chatbot-avatar">
                                    <RobotOutlined style={{ fontSize: '20px', color: '#fff' }} />
                                </div>
                                <div>
                                    <h3 className="chatbot-title">Trợ lý ảo</h3>
                                </div>
                            </div>
                            <div className="chatbot-header-actions">
                                <Tooltip title="Mở chat riêng full màn hình" placement="top">
                                    <Button
                                        type="text"
                                        icon={<FullscreenOutlined />}
                                        onClick={openFullChatPage}
                                        className="chatbot-expand-btn"
                                    />
                                </Tooltip>
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    onClick={toggleChat}
                                    className="chatbot-close-btn"
                                />
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="chatbot-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message-wrapper ${msg.type}`}>
                                    <div className="message-avatar">
                                        {msg.type === 'bot' ? (
                                            <RobotOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                                        ) : (
                                            <UserOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                                        )}
                                    </div>
                                    <div className="message-content">
                                        <div className={`message-bubble ${msg.type}`}>
                                            <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>

                                            {/* 💰 Show calculation result (NEW) */}
                                            {msg.calculation && (
                                                <div
                                                    style={{
                                                        marginTop: '12px',
                                                        padding: '12px',
                                                        background: '#f0f9ff',
                                                        borderRadius: '8px',
                                                        border: '1px solid #91d5ff',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 'bold',
                                                            marginBottom: '8px',
                                                            color: '#1890ff',
                                                        }}
                                                    >
                                                        💰 Chi phí chi tiết
                                                    </div>
                                                    <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                                                        <div>
                                                            • Giá thuê:{' '}
                                                            {msg.calculation.pricePerDay.toLocaleString('vi-VN')}đ/ngày
                                                        </div>
                                                        <div>• Thời gian: {msg.calculation.durationText}</div>
                                                        <div>• Tính toán: {msg.calculation.breakdown.formula}</div>
                                                        <div
                                                            style={{
                                                                marginTop: '8px',
                                                                paddingTop: '8px',
                                                                borderTop: '1px solid #91d5ff',
                                                                fontSize: '15px',
                                                                fontWeight: 'bold',
                                                                color: '#ff4d4f',
                                                            }}
                                                        >
                                                            → Tổng tiền: {msg.calculation.breakdown.result}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 📚 Show category list (NEW) */}
                                            {msg.categories && msg.categories.length > 0 && (
                                                <div
                                                    style={{
                                                        marginTop: '12px',
                                                        padding: '12px',
                                                        background: '#f6ffed',
                                                        borderRadius: '8px',
                                                        border: '1px solid #b7eb8f',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 'bold',
                                                            marginBottom: '10px',
                                                            color: '#52c41a',
                                                            fontSize: '14px',
                                                        }}
                                                    >
                                                        📚 Danh sách danh mục sách
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '8px',
                                                        }}
                                                    >
                                                        {msg.categories.map((cat, idx) => (
                                                            <div
                                                                key={idx}
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    background: 'white',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #d9f7be',
                                                                    fontSize: '13px',
                                                                }}
                                                            >
                                                                <div style={{ fontWeight: 'bold', color: '#389e0d' }}>
                                                                    {cat.nameCategory}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '12px',
                                                                        color: '#8c8c8c',
                                                                        marginTop: '2px',
                                                                    }}
                                                                >
                                                                    {cat.bookCount} cuốn
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                                                <div className="related-questions">
                                                    <Divider style={{ margin: '12px 0' }} />
                                                    <p className="related-title">
                                                        <QuestionCircleOutlined /> Câu hỏi liên quan:
                                                    </p>
                                                    {msg.relatedQuestions.map((q, idx) => (
                                                        <Button
                                                            key={idx}
                                                            type="link"
                                                            size="small"
                                                            onClick={() => handleQuestionClick(q.question)}
                                                            className="related-question-btn"
                                                        >
                                                            • {q.question}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 📚 NGUỒN THAM KHẢO - Book References */}
                                            {msg.relatedBooks && msg.relatedBooks.length > 0 && (
                                                <BookReferences books={msg.relatedBooks} />
                                            )}
                                        </div>
                                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="message-wrapper bot">
                                    <div className="message-avatar">
                                        <RobotOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble bot typing">
                                            <Spin size="small" />
                                            <span style={{ marginLeft: '10px' }}>Đang suy nghĩ...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggested Questions */}
                        {suggestedQuestions.length > 0 && (
                            <div className="chatbot-suggestions">
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setFaqExpanded(!faqExpanded)}
                                >
                                    <p className="suggestions-title">Câu hỏi thường gặp:</p>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={faqExpanded ? <UpOutlined /> : <DownOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFaqExpanded(!faqExpanded);
                                        }}
                                    />
                                </div>
                                {faqExpanded && (
                                    <>
                                        <div className="suggestions-list">
                                            {suggestedQuestions.map((q, idx) => (
                                                <Button
                                                    key={idx}
                                                    size="small"
                                                    onClick={() => handleQuestionClick(q.question)}
                                                    className="suggestion-btn"
                                                >
                                                    {q.question}
                                                </Button>
                                            ))}
                                        </div>
                                        {/* Chỉ hiển thị nút Chat với Thủ thư cho user (không phải admin/librarian) */}
                                        {dataUser && dataUser.role === 'user' && (
                                            <div
                                                style={{
                                                    marginTop: '12px',
                                                    paddingTop: '12px',
                                                    borderTop: '1px solid #f0f0f0',
                                                }}
                                            >
                                                <Button
                                                    type="default"
                                                    icon={<CustomerServiceOutlined />}
                                                    onClick={() => setLiveChatOpen(true)}
                                                    block
                                                    style={{ height: '36px' }}
                                                >
                                                    Chat với Thủ thư
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="chatbot-input-area">
                            <TextArea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onPressEnter={(e) => {
                                    if (!e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Nhập câu hỏi của bạn..."
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                disabled={loading}
                                className="chatbot-textarea"
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleSendMessage}
                                loading={loading}
                                disabled={!inputValue.trim()}
                                className="chatbot-send-btn"
                            >
                                Gửi
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Live Chat Modal */}
            <LiveChatModal visible={liveChatOpen} onClose={() => setLiveChatOpen(false)} />
        </>
    );
}

export default Chatbot;
