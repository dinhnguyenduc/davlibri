import React, { useState, useEffect, useRef } from 'react';
import { Card, List, Avatar, Badge, Button, Input, message, Empty, Spin, Divider, Tabs } from 'antd';
import {
    CustomerServiceOutlined,
    SendOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    requestGetWaitingChats,
    requestAcceptChat,
    requestGetLibrarianChats,
    requestSendChatMessage,
    requestCloseChat,
} from '../../../../config/request';
import styles from './ManagerLiveChat.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);
const { TextArea } = Input;

function ManagerLiveChat() {
    const [waitingChats, setWaitingChats] = useState([]);
    const [myChats, setMyChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const pollInterval = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.messages]);

    useEffect(() => {
        loadData();
        // Poll every 3 seconds
        pollInterval.current = setInterval(() => {
            loadData();
        }, 3000);

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, []);

    const loadData = async () => {
        try {
            const [waitingRes, myChatsRes] = await Promise.all([requestGetWaitingChats(), requestGetLibrarianChats()]);
            setWaitingChats(waitingRes.metadata || []);
            setMyChats(myChatsRes.metadata || []);

            // Update selected chat if it's in my chats
            if (selectedChat) {
                const updated = myChatsRes.metadata?.find((c) => c._id === selectedChat._id);
                if (updated) {
                    setSelectedChat(updated);
                }
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    };

    const handleAcceptChat = async (chatId) => {
        setLoading(true);
        try {
            const res = await requestAcceptChat({ chatId });
            message.success('Đã nhận phiên chat');
            setSelectedChat(res.metadata);
            loadData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể nhận phiên chat');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedChat) return;

        setSending(true);
        try {
            const res = await requestSendChatMessage({
                chatId: selectedChat._id,
                message: inputMessage.trim(),
            });
            setSelectedChat(res.metadata);
            setInputMessage('');
            loadData();
        } catch (error) {
            message.error('Không thể gửi tin nhắn');
        } finally {
            setSending(false);
        }
    };

    const handleCloseChat = async () => {
        if (!selectedChat) return;

        try {
            await requestCloseChat({ chatId: selectedChat._id });
            message.success('Đã kết thúc phiên chat');
            setSelectedChat(null);
            loadData();
        } catch (error) {
            message.error('Không thể kết thúc phiên chat');
        }
    };

    const renderWaitingList = () => (
        <Card title="Yêu cầu chờ xử lý" className={cx('card')}>
            {waitingChats.length === 0 ? (
                <Empty description="Không có yêu cầu nào" />
            ) : (
                <List
                    dataSource={waitingChats}
                    renderItem={(chat) => (
                        <List.Item
                            actions={[
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => handleAcceptChat(chat._id)}
                                    loading={loading}
                                >
                                    Nhận chat
                                </Button>,
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Badge dot>
                                        <Avatar src={chat.userId?.avatar} icon={<UserOutlined />} />
                                    </Badge>
                                }
                                title={chat.userId?.fullName || 'Người dùng'}
                                description={
                                    <span>
                                        <ClockCircleOutlined /> Đang chờ từ{' '}
                                        {new Date(chat.startedAt).toLocaleTimeString('vi-VN')}
                                    </span>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Card>
    );

    const renderMyChatsList = () => (
        <Card title="Phiên chat của tôi" className={cx('card')}>
            {myChats.length === 0 ? (
                <Empty description="Bạn chưa có phiên chat nào" />
            ) : (
                <List
                    dataSource={myChats}
                    renderItem={(chat) => (
                        <List.Item
                            className={cx('chat-item', { active: selectedChat?._id === chat._id })}
                            onClick={() => setSelectedChat(chat)}
                            style={{ cursor: 'pointer' }}
                        >
                            <List.Item.Meta
                                avatar={<Avatar src={chat.userId?.avatar} icon={<UserOutlined />} />}
                                title={chat.userId?.fullName || 'Người dùng'}
                                description={
                                    chat.messages.length > 0
                                        ? chat.messages[chat.messages.length - 1].message.substring(0, 30) + '...'
                                        : 'Chưa có tin nhắn'
                                }
                            />
                            {chat.messages.some((m) => !m.read && m.senderRole === 'user') && (
                                <Badge dot style={{ marginLeft: '8px' }} />
                            )}
                        </List.Item>
                    )}
                />
            )}
        </Card>
    );

    const renderChatWindow = () => {
        if (!selectedChat) {
            return (
                <Card className={cx('chat-window')}>
                    <Empty description="Chọn một phiên chat để bắt đầu" />
                </Card>
            );
        }

        return (
            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar src={selectedChat.userId?.avatar} icon={<UserOutlined />} />
                            <div>
                                <div>{selectedChat.userId?.fullName || 'Người dùng'}</div>
                                <div style={{ fontSize: '12px', color: '#999' }}>{selectedChat.userId?.email}</div>
                            </div>
                        </div>
                        <Button danger onClick={handleCloseChat} icon={<CheckCircleOutlined />}>
                            Kết thúc
                        </Button>
                    </div>
                }
                className={cx('chat-window')}
            >
                <div className={cx('messages-container')}>
                    {selectedChat.messages.map((msg, index) => (
                        <div
                            key={index}
                            className={cx('message', msg.senderRole === 'librarian' ? 'sent' : 'received')}
                        >
                            <div className={cx('message-bubble')}>
                                <div>{msg.message}</div>
                                <div className={cx('message-time')}>
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

                <Divider />

                <div className={cx('input-area')}>
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
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        disabled={sending}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                        loading={sending}
                        disabled={!inputMessage.trim()}
                        style={{ marginTop: '8px' }}
                    >
                        Gửi
                    </Button>
                </div>
            </Card>
        );
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2 className={cx('title')}>
                    <CustomerServiceOutlined /> Quản lý Chat trực tiếp
                </h2>
                <p className={cx('subtitle')}>Hỗ trợ người dùng qua chat realtime</p>
            </div>

            <div className={cx('content')}>
                <div className={cx('sidebar')}>
                    <Tabs
                        items={[
                            {
                                key: 'waiting',
                                label: (
                                    <span>
                                        Chờ xử lý <Badge count={waitingChats.length} />
                                    </span>
                                ),
                                children: renderWaitingList(),
                            },
                            {
                                key: 'my-chats',
                                label: (
                                    <span>
                                        Của tôi <Badge count={myChats.length} />
                                    </span>
                                ),
                                children: renderMyChatsList(),
                            },
                        ]}
                    />
                </div>
                <div className={cx('main')}>{renderChatWindow()}</div>
            </div>
        </div>
    );
}

export default ManagerLiveChat;
