import { Card, Button, Space, Statistic, Row, Col, message, Modal, InputNumber, Form, Divider, Alert } from 'antd';
import {
    UserOutlined,
    BookOutlined,
    ShoppingOutlined,
    FileTextOutlined,
    PlusOutlined,
    DeleteOutlined,
    ReloadOutlined,
    LineChartOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config/request';

const API_URL = `${API_BASE_URL}/api/seed`;

function DataSeeder() {
    const [stats, setStats] = useState({
        users: 0,
        books: 0,
        payments: 0,
        loans: 0,
    });
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [seedType, setSeedType] = useState('');
    const [form] = Form.useForm();

    // Fetch current statistics
    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/stats`, { withCredentials: true });
            setStats(response.data.metadata);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Seed functions
    const handleSeedUsers = async (count) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/users`, { count }, { withCredentials: true });
            message.success(response.data.message);
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi tạo người dùng');
        } finally {
            setLoading(false);
            setIsModalVisible(false);
        }
    };

    const handleSeedPayments = async (count) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/payments`, { count }, { withCredentials: true });
            message.success(response.data.message);
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng');
        } finally {
            setLoading(false);
            setIsModalVisible(false);
        }
    };

    const handleSeedLoans = async (count) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/loans`, { count }, { withCredentials: true });
            message.success(response.data.message);
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi tạo phiếu mượn');
        } finally {
            setLoading(false);
            setIsModalVisible(false);
        }
    };

    const handleSeedAll = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/all`, values, { withCredentials: true });
            message.success(response.data.message);
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi tạo dữ liệu');
        } finally {
            setLoading(false);
            setIsModalVisible(false);
        }
    };

    const handleUpdateBookStats = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/update-book-stats`, {}, { withCredentials: true });
            message.success(response.data.message);
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật thống kê');
        } finally {
            setLoading(false);
        }
    };

    const handleClearData = () => {
        Modal.confirm({
            title: 'Xác nhận xóa dữ liệu demo',
            content: 'Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu demo? (Giữ lại admin)',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setLoading(true);
                try {
                    const response = await axios.delete(`${API_URL}/clear`, { withCredentials: true });
                    message.success(response.data.message);
                    fetchStats();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Lỗi khi xóa dữ liệu');
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const showModal = (type) => {
        setSeedType(type);
        setIsModalVisible(true);
        form.resetFields();
    };

    const handleModalOk = () => {
        form.validateFields().then((values) => {
            if (seedType === 'users') {
                handleSeedUsers(values.count);
            } else if (seedType === 'payments') {
                handleSeedPayments(values.count);
            } else if (seedType === 'loans') {
                handleSeedLoans(values.count);
            } else if (seedType === 'all') {
                handleSeedAll(values);
            }
        });
    };

    return (
        <div style={{ padding: '24px' }}>
            <Alert
                message="Quản lý Dữ liệu Demo"
                description="Tạo dữ liệu giả lập để minh họa cho đồ án. Dữ liệu được tạo ngẫu nhiên và có thể xóa bất cứ lúc nào."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Người dùng"
                            value={stats.users}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Sách"
                            value={stats.books}
                            prefix={<BookOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Đơn hàng"
                            value={stats.payments}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Phiếu mượn"
                            value={stats.loans}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Action Buttons */}
            <Card title="Tạo Dữ liệu Giả Lập">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Space wrap>
                        <Button
                            type="primary"
                            icon={<UserOutlined />}
                            onClick={() => showModal('users')}
                            loading={loading}
                        >
                            Tạo Người Dùng
                        </Button>
                        <Button
                            type="primary"
                            icon={<ShoppingOutlined />}
                            onClick={() => showModal('payments')}
                            loading={loading}
                        >
                            Tạo Đơn Hàng
                        </Button>
                        <Button
                            type="primary"
                            icon={<FileTextOutlined />}
                            onClick={() => showModal('loans')}
                            loading={loading}
                        >
                            Tạo Phiếu Mượn
                        </Button>
                        <Button
                            type="primary"
                            icon={<LineChartOutlined />}
                            onClick={handleUpdateBookStats}
                            loading={loading}
                        >
                            Cập Nhật Thống Kê Sách
                        </Button>
                    </Space>

                    <Divider />

                    <Space>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={() => showModal('all')}
                            loading={loading}
                            style={{ backgroundColor: '#52c41a' }}
                        >
                            Tạo Tất Cả Dữ Liệu
                        </Button>
                        <Button
                            danger
                            size="large"
                            icon={<DeleteOutlined />}
                            onClick={handleClearData}
                            loading={loading}
                        >
                            Xóa Dữ Liệu Demo
                        </Button>
                        <Button size="large" icon={<ReloadOutlined />} onClick={fetchStats}>
                            Làm Mới
                        </Button>
                    </Space>
                </Space>
            </Card>

            {/* Modal for seed configuration */}
            <Modal
                title={
                    seedType === 'all'
                        ? 'Tạo Tất Cả Dữ Liệu'
                        : seedType === 'users'
                          ? 'Tạo Người Dùng'
                          : seedType === 'payments'
                            ? 'Tạo Đơn Hàng'
                            : 'Tạo Phiếu Mượn'
                }
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
                    {seedType === 'all' ? (
                        <>
                            <Form.Item
                                name="users"
                                label="Số lượng người dùng"
                                initialValue={30}
                                rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                            >
                                <InputNumber min={1} max={200} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                name="payments"
                                label="Số lượng đơn hàng"
                                initialValue={50}
                                rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                            >
                                <InputNumber min={1} max={500} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                name="loans"
                                label="Số lượng phiếu mượn"
                                initialValue={40}
                                rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                            >
                                <InputNumber min={1} max={500} style={{ width: '100%' }} />
                            </Form.Item>
                        </>
                    ) : (
                        <Form.Item
                            name="count"
                            label="Số lượng"
                            initialValue={seedType === 'users' ? 30 : 50}
                            rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                        >
                            <InputNumber min={1} max={500} style={{ width: '100%' }} />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
}

export default DataSeeder;
