import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Spin, Card, Tooltip, Divider } from 'antd';
import {
    ArrowLeftOutlined,
    MessageOutlined,
    SendOutlined,
    RobotOutlined,
    UserOutlined,
    QuestionCircleOutlined,
    CustomerServiceOutlined,
    UpOutlined,
    DownOutlined,
} from '@ant-design/icons';
import { requestAskChatbot, requestGetPublicFAQs } from '../config/request';
import { useStore } from '../hooks/useStore';
import BookReferences from '../Components/Chatbot/BookReferences';
import '../Components/Chatbot/Chatbot.css';

const { TextArea } = Input;

function AIChatPage() {
    const navigate = useNavigate();
    const { dataUser } = useStore();
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: 'Xin chào! Tôi là trợ lý ảo của thư viện. Bạn có thể trò chuyện ở đây như trong một không gian riêng, đầy đủ và toàn màn hình.',
            timestamp: new Date(),
        },
    ]);
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
        if (suggestedQuestions.length === 0) {
            loadSuggestedQuestions();
        }
    }, []);

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
        <div className="ai-chat-page-shell">
            <div className="ai-chat-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} className="ai-chat-back-btn">
                        Về trang chính
                    </Button>
                    <div className="ai-chat-title-wrap">
                        <div className="chatbot-avatar big">
                            <MessageOutlined style={{ fontSize: '22px', color: '#fff' }} />
                        </div>
                        <div>
                            <h2 className="ai-chat-title">Không gian AI Chat riêng</h2>
                            <div className="ai-chat-subtitle">Giao tiếp trực tiếp với trợ lý thư viện</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ai-chat-page-content">
                <Card
                    className="ai-chat-card"
                    bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                    <div className="chatbot-messages ai-chat-messages">
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

                    {suggestedQuestions.length > 0 && (
                        <div className="chatbot-suggestions ai-chat-suggestions">
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
                                                // no-op by design; this page is dedicated to AI chat
                                                block
                                                style={{ height: '36px' }}
                                            >
                                                Tiếp tục với AI
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="chatbot-input-area ai-chat-input-area">
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
        </div>
    );
}

export default AIChatPage;
