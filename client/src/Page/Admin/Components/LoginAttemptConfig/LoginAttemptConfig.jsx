import React, { useState, useEffect } from 'react';
import {
    Card,
    Switch,
    InputNumber,
    Button,
    Statistic,
    Table,
    Space,
    Modal,
    message,
    Alert,
    Divider,
    Tooltip,
    Tag,
} from 'antd';
import {
    LockOutlined,
    UnlockOutlined,
    UserOutlined,
    WarningOutlined,
    ReloadOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config/request';

const { confirm } = Modal;

function LoginAttemptConfig() {
    const [config, setConfig] = useState(null);
    const [stats, setStats] = useState(null);
    const [lockedUsers, setLockedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const API_URL = `${API_BASE_URL}/api/login-attempt-config`;

    // Load dữ liệu ban đầu
    useEffect(() => {
        fetchConfig();
        fetchStats();
        fetchLockedUsers();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/config`, { withCredentials: true });
            setConfig(response.data.metadata);
        } catch (error) {
            message.error('Không thể lấy cấu hình: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/stats`, { withCredentials: true });
            setStats(response.data.metadata);
        } catch (error) {
            console.error('Lỗi lấy thống kê:', error);
        }
    };

    const fetchLockedUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/locked-users`, { withCredentials: true });
            setLockedUsers(response.data.metadata.users);
        } catch (error) {
            console.error('Lỗi lấy danh sách user bị khóa:', error);
        }
    };

    const handleSaveConfig = async () => {
        try {
            setSaving(true);
            await axios.put(`${API_URL}/config`, config, { withCredentials: true });
            message.success('Lưu cấu hình thành công!');
            fetchStats();
        } catch (error) {
            message.error('Lỗi lưu cấu hình: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleResetUser = (userId) => {
        confirm({
            title: 'Xác nhận reset',
            icon: <UnlockOutlined />,
            content: 'Bạn có chắc muốn reset số lần đăng nhập sai cho user này?',
            okText: 'Reset',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const response = await axios.post(`${API_URL}/reset-user`, { userId }, { withCredentials: true });
                    message.success(response.data.message);
                    fetchLockedUsers();
                    fetchStats();
                } catch (error) {
                    message.error('Lỗi reset: ' + (error.response?.data?.message || error.message));
                }
            },
        });
    };

    const handleResetAll = () => {
        confirm({
            title: 'Xác nhận reset tất cả',
            icon: <WarningOutlined />,
            content: 'Bạn có chắc muốn mở khóa TẤT CẢ tài khoản bị khóa?',
            okText: 'Reset tất cả',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const response = await axios.post(`${API_URL}/reset-all`, {}, { withCredentials: true });
                    message.success(response.data.message);
                    fetchLockedUsers();
                    fetchStats();
                } catch (error) {
                    message.error('Lỗi reset: ' + (error.response?.data?.message || error.message));
                }
            },
        });
    };

    const columns = [
        {
            title: 'Họ tên',
            dataIndex: 'fullName',
            key: 'fullName',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Số lần sai',
            dataIndex: 'loginAttempts',
            key: 'loginAttempts',
            render: (attempts) => <Tag color="red">{attempts} lần</Tag>,
        },
        {
            title: 'Khóa đến',
            dataIndex: 'lockedUntil',
            key: 'lockedUntil',
            render: (date) => (date ? new Date(date).toLocaleString('vi-VN') : '-'),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Button type="link" icon={<UnlockOutlined />} onClick={() => handleResetUser(record._id)}>
                    Mở khóa
                </Button>
            ),
        },
    ];

    if (loading || !config) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải...</div>;
    }

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '24px' }}>
                <LockOutlined /> Giới hạn đăng nhập sai
            </h2>

            {/* Thống kê */}
            {stats && (
                <Card style={{ marginBottom: '24px' }}>
                    <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
                        <Statistic title="Tổng người dùng" value={stats.totalUsers} prefix={<UserOutlined />} />
                        <Statistic
                            title="Tài khoản bị khóa"
                            value={stats.lockedUsers}
                            valueStyle={{ color: stats.lockedUsers > 0 ? '#cf1322' : '#3f8600' }}
                            prefix={<LockOutlined />}
                        />
                        <Statistic
                            title="Đã đăng nhập sai"
                            value={stats.usersWithAttempts}
                            prefix={<WarningOutlined />}
                        />
                    </Space>
                </Card>
            )}

            {/* Cấu hình */}
            <Card
                title={
                    <span>
                        <InfoCircleOutlined /> Cấu hình giới hạn
                    </span>
                }
                extra={
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSaveConfig} loading={saving}>
                        Lưu cấu hình
                    </Button>
                }
                style={{ marginBottom: '24px' }}
            >
                <Alert
                    message="Lưu ý"
                    description="Khi bật tính năng này, tài khoản sẽ bị khóa tạm thời nếu đăng nhập sai quá số lần cho phép. Admin có thể mở khóa thủ công."
                    type="info"
                    showIcon
                    style={{ marginBottom: '20px' }}
                />

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Bật/tắt tính năng */}
                    <div>
                        <label style={{ fontWeight: 'bold', marginRight: '12px' }}>Bật giới hạn đăng nhập sai:</label>
                        <Switch
                            checked={config.enabled}
                            onChange={(checked) => setConfig({ ...config, enabled: checked })}
                            checkedChildren="BẬT"
                            unCheckedChildren="TẮT"
                        />
                        <Tooltip title="Tắt để không giới hạn số lần đăng nhập sai">
                            <InfoCircleOutlined style={{ marginLeft: '8px', color: '#1890ff' }} />
                        </Tooltip>
                    </div>

                    <Divider />

                    {/* Các thiết lập chi tiết */}
                    <div style={{ opacity: config.enabled ? 1 : 0.5 }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                                Số lần đăng nhập sai tối đa:
                            </label>
                            <InputNumber
                                min={1}
                                max={100}
                                value={config.maxAttempts}
                                onChange={(value) => setConfig({ ...config, maxAttempts: value })}
                                disabled={!config.enabled}
                                style={{ width: '200px' }}
                                addonAfter="lần"
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                                Thời gian khóa tài khoản:
                            </label>
                            <InputNumber
                                min={1}
                                max={1440}
                                value={config.lockDuration}
                                onChange={(value) => setConfig({ ...config, lockDuration: value })}
                                disabled={!config.enabled}
                                style={{ width: '200px' }}
                                addonAfter="phút"
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                                Thời gian reset số lần sai:
                            </label>
                            <InputNumber
                                min={1}
                                max={1440}
                                value={config.resetAfter}
                                onChange={(value) => setConfig({ ...config, resetAfter: value })}
                                disabled={!config.enabled}
                                style={{ width: '200px' }}
                                addonAfter="phút"
                            />
                            <Tooltip title="Sau khoảng thời gian này, số lần đăng nhập sai sẽ được reset về 0">
                                <InfoCircleOutlined style={{ marginLeft: '8px', color: '#1890ff' }} />
                            </Tooltip>
                        </div>
                    </div>
                </Space>
            </Card>

            {/* Danh sách user bị khóa */}
            {lockedUsers.length > 0 && (
                <Card
                    title={
                        <span>
                            <LockOutlined /> Tài khoản bị khóa ({lockedUsers.length})
                        </span>
                    }
                    extra={
                        <Button type="primary" danger icon={<UnlockOutlined />} onClick={handleResetAll}>
                            Mở khóa tất cả
                        </Button>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={lockedUsers}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                        size="middle"
                    />
                </Card>
            )}

            {lockedUsers.length === 0 && (
                <Card>
                    <Alert
                        message="Không có tài khoản bị khóa"
                        description="Hiện tại không có tài khoản nào bị khóa do đăng nhập sai."
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                    />
                </Card>
            )}

            {/* Nút refresh */}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                        fetchConfig();
                        fetchStats();
                        fetchLockedUsers();
                    }}
                >
                    Làm mới
                </Button>
            </div>
        </div>
    );
}

export default LoginAttemptConfig;
