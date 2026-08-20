import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Avatar, Divider, Rate, message, Spin, Badge } from 'antd';
import {
    SendOutlined,
    UserOutlined,
    CloseOutlined,
    CustomerServiceOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
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
            // Poll for new messages every 2 seconds
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
            // Check if there's an active chat
            const activeRes = await requestGetActiveChat();
            if (activeRes.metadata) {
                setChat(activeRes.metadata);
            } else {
                // Create new chat request
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

        Modal.confirm({
            title: 'Kết thúc cuộc trò chuyện?',
            content: 'Bạn có chắc muốn kết thúc cuộc trò chuyện với thủ thư?',
            okText: 'Kết thúc',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestCloseChat({ chatId: chat._id });
                    setShowRating(true);
                } catch (error) {
                    message.error('Không thể kết thúc cuộc trò chuyện');
                }
            },
        });
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
                    <div style={{ textAlign: 'center', padding: '20px', color: '#faad14' }}>
                        <Spin />
                        <p style={{ marginTop: '10px' }}>Đang chờ thủ thư phản hồi...</p>
                        <p style={{ fontSize: '12px', color: '#999' }}>Vui lòng đợi trong giây lát</p>
                    </div>
                );
            case 'active':
                return (
                    <div style={{ padding: '8px 16px', background: '#f0f9ff', borderBottom: '1px solid #e6f7ff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar
                                src={chat.librarianId?.avatar}
                                icon={<CustomerServiceOutlined />}
                                style={{ background: '#1890ff' }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}>{chat.librarianId?.fullName || 'Thủ thư'}</div>
                                <div style={{ fontSize: '12px', color: '#52c41a' }}>
                                    <Badge status="success" text="Đang trực tuyến" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'closed':
                return (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#52c41a' }}>
                        <CheckCircleOutlined style={{ fontSize: '32px' }} />
                        <p style={{ marginTop: '10px' }}>Cuộc trò chuyện đã kết thúc</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CustomerServiceOutlined style={{ color: '#1890ff' }} />
                        <span>Chat với Thủ thư</span>
                    </div>
                }
                open={visible}
                onCancel={onClose}
                footer={null}
                width={500}
                styles={{
                    body: { padding: 0, height: '500px', display: 'flex', flexDirection: 'column' },
                }}
            >
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {renderStatus()}

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                            {chat?.messages?.map((msg, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.senderRole === 'user' ? 'flex-end' : 'flex-start',
                                        marginBottom: '12px',
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: '70%',
                                            padding: '8px 12px',
                                            borderRadius: '12px',
                                            background: msg.senderRole === 'user' ? '#1890ff' : '#f0f0f0',
                                            color: msg.senderRole === 'user' ? '#fff' : '#000',
                                        }}
                                    >
                                        <div>{msg.message}</div>
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                marginTop: '4px',
                                                opacity: 0.7,
                                                textAlign: 'right',
                                            }}
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

                        {/* Input */}
                        {chat?.status === 'active' && (
                            <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
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
                                    />
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={handleSendMessage}
                                        loading={sending}
                                        disabled={!inputMessage.trim()}
                                    >
                                        Gửi
                                    </Button>
                                </div>
                                <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                    <Button size="small" danger icon={<CloseOutlined />} onClick={handleCloseChat}>
                                        Kết thúc
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal>

            {/* Rating Modal */}
            <Modal
                title="Đánh giá cuộc trò chuyện"
                open={showRating}
                onOk={handleSubmitRating}
                onCancel={() => {
                    setShowRating(false);
                    onClose();
                }}
                okText="Gửi đánh giá"
                cancelText="Bỏ qua"
            >
                <div style={{ textAlign: 'center' }}>
                    <p>Bạn hài lòng với dịch vụ hỗ trợ của chúng tôi?</p>
                    <Rate value={rating} onChange={setRating} style={{ fontSize: '32px' }} />
                    <Divider />
                    <TextArea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Nhận xét của bạn (không bắt buộc)"
                        rows={4}
                    />
                </div>
            </Modal>
        </>
    );
}

export default LiveChatModal;
