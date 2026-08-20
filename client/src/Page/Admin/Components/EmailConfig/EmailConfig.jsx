import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Button,
    Input,
    Form,
    message,
    Descriptions,
    Badge,
    Space,
    Typography,
    Divider,
    Alert,
    Spin,
    Modal,
    Tag,
} from 'antd';
import {
    MailOutlined,
    SendOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    ReloadOutlined,
    BulbOutlined,
    EditOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config/request';

const { Title, Text, Paragraph } = Typography;

const EmailConfig = () => {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState(null);
    const [stats, setStats] = useState(null);
    const [testEmail, setTestEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [editForm] = Form.useForm();

    // Load cấu hình email
    const loadConfig = async () => {
        setLoading(true);
        try {
            const [configRes, statsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/email-config/config`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/email-config/stats`, { withCredentials: true }),
            ]);

            setConfig(configRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            message.error('Không thể tải cấu hình email');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleOpenEditModal = () => {
        editForm.setFieldsValue({
            davHost: config?.davEmail?.host || '',
            davPort: config?.davEmail?.port || '587',
            davUser: config?.davEmail?.user || '',
            davEmailFrom: config?.davEmail?.emailFrom || '',
            davPassword: '',
            gmailEmail: config?.gmail?.email || '',
            gmailClientId: '',
            gmailClientSecret: '',
            gmailRedirectUri: 'https://developers.google.com/oauthplayground',
            gmailRefreshToken: '',
        });
        setIsEditModalOpen(true);
    };

    const handleSaveConfig = async () => {
        try {
            const values = await editForm.validateFields();
            setSavingConfig(true);

            const payload = {
                davEmail: {
                    host: values.davHost,
                    port: values.davPort,
                    user: values.davUser,
                    emailFrom: values.davEmailFrom,
                    password: values.davPassword,
                },
                gmail: {
                    email: values.gmailEmail,
                    clientId: values.gmailClientId,
                    clientSecret: values.gmailClientSecret,
                    redirectUri: values.gmailRedirectUri,
                    refreshToken: values.gmailRefreshToken,
                },
            };

            const res = await axios.put(`${API_BASE_URL}/api/email-config/config`, payload, {
                withCredentials: true,
            });

            message.success(res.data.message || 'Đã cập nhật cấu hình email');
            setIsEditModalOpen(false);
            await loadConfig();
        } catch (error) {
            if (error?.errorFields) {
                return;
            }
            message.error(error?.response?.data?.message || 'Không thể lưu cấu hình email');
        } finally {
            setSavingConfig(false);
        }
    };

    // Test email @dav.edu.vn
    const handleTestDavEmail = async () => {
        if (!testEmail) {
            message.warning('Vui lòng nhập email để test');
            return;
        }

        setSending(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/email-config/test-dav`,
                { testEmail },
                { withCredentials: true },
            );

            message.success(response.data.message);
            Modal.success({
                title: 'Email đã gửi thành công!',
                content: (
                    <div>
                        <p>
                            <strong>From:</strong> {response.data.data.from}
                        </p>
                        <p>
                            <strong>To:</strong> {response.data.data.to}
                        </p>
                        <p>
                            <strong>Message ID:</strong> {response.data.data.messageId}
                        </p>
                        <Alert
                            message="Vui lòng kiểm tra hộp thư (kể cả thư mục Spam/Junk)"
                            type="info"
                            style={{ marginTop: 10 }}
                        />
                    </div>
                ),
            });
        } catch (error) {
            message.error(error.response?.data?.message || 'Gửi email thất bại');
        } finally {
            setSending(false);
        }
    };

    // Test email Gmail
    const handleTestGmailEmail = async () => {
        if (!testEmail) {
            message.warning('Vui lòng nhập email để test');
            return;
        }

        setSending(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/email-config/test-gmail`,
                { testEmail },
                { withCredentials: true },
            );

            message.success(response.data.message);
            Modal.success({
                title: 'Email đã gửi thành công!',
                content: (
                    <div>
                        <p>
                            <strong>From:</strong> {response.data.data.from}
                        </p>
                        <p>
                            <strong>To:</strong> {response.data.data.to}
                        </p>
                        <p>
                            <strong>Message ID:</strong> {response.data.data.messageId}
                        </p>
                        <Alert
                            message="Vui lòng kiểm tra hộp thư (kể cả thư mục Spam/Junk)"
                            type="info"
                            style={{ marginTop: 10 }}
                        />
                    </div>
                ),
            });
        } catch (error) {
            message.error(error.response?.data?.message || 'Gửi email thất bại');
        } finally {
            setSending(false);
        }
    };

    // Hiển thị hướng dẫn
    const showGuide = () => {
        Modal.info({
            title: 'Hướng dẫn cấu hình Email',
            width: 700,
            content: (
                <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                    <Title level={5}>Email @dav.edu.vn (Khuyến nghị)</Title>
                    <Paragraph>
                        <Text strong>Ưu điểm:</Text>
                        <ul>
                            <li>Email chính thức từ trường</li>
                            <li>Không hết hạn như OAuth2</li>
                            <li>Không giới hạn gửi email</li>
                            <li>Chuyên nghiệp và đáng tin cậy</li>
                        </ul>
                    </Paragraph>

                    <Paragraph>
                        <Text strong>Các bước cấu hình:</Text>
                        <ol>
                            <li>Liên hệ phòng IT: 024 3845 3736</li>
                            <li>Yêu cầu thông tin SMTP server</li>
                            <li>
                                Mở file <Text code>server/.env</Text>
                            </li>
                            <li>
                                Thêm cấu hình:
                                <pre style={{ background: '#f5f5f5', padding: 10, marginTop: 5 }}>
                                    {`DAV_SMTP_HOST="mail.dav.edu.vn"
DAV_SMTP_PORT="587"
DAV_SMTP_USER="your-email@dav.edu.vn"
DAV_SMTP_PASS="your-password"
DAV_EMAIL_FROM="Thư viện HVNG <your-email@dav.edu.vn>"`}
                                </pre>
                            </li>
                            <li>
                                Restart server: <Text code>npm run dev</Text>
                            </li>
                            <li>Test email tại trang này</li>
                        </ol>
                    </Paragraph>

                    <Divider />

                    <Title level={5}>Gmail OAuth2 (Backup)</Title>
                    <Paragraph>
                        <Text type="warning">Chỉ dùng khi chưa có email @dav.edu.vn</Text>
                    </Paragraph>
                    <Paragraph>
                        <Text strong>Nhược điểm:</Text>
                        <ul>
                            <li>Refresh token hết hạn thường xuyên</li>
                            <li>Giới hạn 500 email/ngày</li>
                            <li>Email từ @dav.edu.vn không chuyên nghiệp</li>
                        </ul>
                    </Paragraph>
                </div>
            ),
        });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Đang tải cấu hình email..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card
                        extra={
                            <Button icon={<EditOutlined />} onClick={handleOpenEditModal}>
                                Sửa cấu hình
                            </Button>
                        }
                    >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Title level={3} style={{ margin: 0 }}>
                                <MailOutlined /> Quản lý Email Hệ thống
                            </Title>
                            <Text type="secondary">Cấu hình và kiểm tra hệ thống gửi email OTP, thông báo</Text>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Thống kê */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {/* Email @dav.edu.vn */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <MailOutlined style={{ color: '#1890ff' }} />
                                <span>Email @dav.edu.vn</span>
                                <Tag color="success">Khuyến nghị</Tag>
                            </Space>
                        }
                        extra={
                            stats?.davEmail?.status === 'active' ? (
                                <Badge status="success" text="Đang hoạt động" />
                            ) : (
                                <Badge status="default" text="Chưa cấu hình" />
                            )
                        }
                    >
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Trạng thái">
                                {config?.davEmail?.configured ? (
                                    <Tag color="success" icon={<CheckCircleOutlined />}>
                                        Đã cấu hình
                                    </Tag>
                                ) : (
                                    <Tag color="default">Chưa cấu hình</Tag>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="SMTP Host">
                                {config?.davEmail?.host || <Text type="secondary">Chưa có</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Port">{config?.davEmail?.port || '587'}</Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {config?.davEmail?.user || <Text type="secondary">Chưa có</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="From">
                                {config?.davEmail?.emailFrom || <Text type="secondary">Chưa có</Text>}
                            </Descriptions.Item>
                        </Descriptions>

                        {config?.davEmail?.configured ? (
                            <Alert
                                message="Email chính thức của trường"
                                description="Không giới hạn, ổn định, chuyên nghiệp"
                                type="success"
                                showIcon
                                style={{ marginTop: 16 }}
                            />
                        ) : (
                            <Alert
                                message="Chưa cấu hình"
                                description="Khuyến nghị cấu hình email @dav.edu.vn cho môi trường production"
                                type="info"
                                showIcon
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </Card>
                </Col>

                {/* Gmail */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <MailOutlined style={{ color: '#ff4d4f' }} />
                                <span>Gmail OAuth2</span>
                                <Tag color="warning">Backup</Tag>
                            </Space>
                        }
                        extra={
                            stats?.gmail?.status === 'active' ? (
                                <Badge status="processing" text="Backup" />
                            ) : (
                                <Badge status="default" text="Không hoạt động" />
                            )
                        }
                    >
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Trạng thái">
                                {config?.gmail?.configured ? (
                                    <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                                        Đã cấu hình
                                    </Tag>
                                ) : (
                                    <Tag color="default">Chưa cấu hình</Tag>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {config?.gmail?.email || <Text type="secondary">Chưa có</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="OAuth2">
                                {config?.gmail?.configured
                                    ? 'Đã cấu hình Client ID, Secret, Refresh Token'
                                    : 'Chưa cấu hình'}
                            </Descriptions.Item>
                        </Descriptions>

                        {config?.gmail?.configured && (
                            <Alert
                                message="Chỉ dùng làm backup"
                                description="Token thường xuyên hết hạn, giới hạn 500 email/ngày"
                                type="warning"
                                showIcon
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Phương thức đang dùng */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card>
                        <Alert
                            message={
                                <Space>
                                    <InfoCircleOutlined />
                                    <Text strong>Phương thức ưu tiên:</Text>
                                    {config?.activeMethod === 'dav' ? (
                                        <Tag color="success">Email @dav.edu.vn</Tag>
                                    ) : config?.activeMethod === 'gmail' ? (
                                        <Tag color="warning">Gmail OAuth2</Tag>
                                    ) : (
                                        <Tag color="error">Chưa cấu hình</Tag>
                                    )}
                                </Space>
                            }
                            description={
                                config?.activeMethod === 'dav'
                                    ? 'Hệ thống đang sử dụng email @dav.edu.vn. Nếu lỗi sẽ tự động fallback sang Gmail.'
                                    : config?.activeMethod === 'gmail'
                                      ? 'Hệ thống đang dùng Gmail. Khuyến nghị cấu hình email @dav.edu.vn.'
                                      : 'Chưa có phương thức gửi email nào hoạt động. Vui lòng cấu hình.'
                            }
                            type={config?.activeMethod === 'dav' ? 'success' : 'warning'}
                            showIcon
                        />
                    </Card>
                </Col>
            </Row>

            {/* Test Email */}
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card
                        title={
                            <Space>
                                <SendOutlined />
                                <span>Test gửi Email</span>
                            </Space>
                        }
                        extra={
                            <Button icon={<BulbOutlined />} onClick={showGuide}>
                                Hướng dẫn
                            </Button>
                        }
                    >
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Text strong>Email nhận thử nghiệm:</Text>
                                <Input
                                    prefix={<MailOutlined />}
                                    placeholder="Nhập email để test (VD: your-email@dav.edu.vn)"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    size="large"
                                    style={{ marginTop: 8 }}
                                />
                            </div>

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={handleTestDavEmail}
                                        loading={sending}
                                        disabled={!config?.davEmail?.configured || !testEmail}
                                        block
                                        size="large"
                                    >
                                        Test Email @dav.edu.vn
                                    </Button>
                                    {!config?.davEmail?.configured && (
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                            Chưa cấu hình trong file .env
                                        </Text>
                                    )}
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Button
                                        icon={<SendOutlined />}
                                        onClick={handleTestGmailEmail}
                                        loading={sending}
                                        disabled={!config?.gmail?.configured || !testEmail}
                                        block
                                        size="large"
                                    >
                                        Test Email Gmail
                                    </Button>
                                    {!config?.gmail?.configured && (
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                            Chưa cấu hình trong file .env
                                        </Text>
                                    )}
                                </Col>
                            </Row>

                            <Alert
                                message="Lưu ý khi test email"
                                description={
                                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                        <li>
                                            Email test sẽ chứa mã OTP: <Text code>123456</Text>
                                        </li>
                                        <li>
                                            Kiểm tra cả thư mục <Text strong>Spam/Junk</Text>
                                        </li>
                                        <li>Nếu không nhận được, kiểm tra logs server console</li>
                                        <li>Email @dav.edu.vn có độ tin cậy cao hơn, ít vào spam</li>
                                    </ul>
                                }
                                type="info"
                                showIcon
                            />
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Nút refresh */}
            <Row style={{ marginTop: 16 }}>
                <Col span={24} style={{ textAlign: 'right' }}>
                    <Button icon={<ReloadOutlined />} onClick={loadConfig} loading={loading}>
                        Làm mới
                    </Button>
                </Col>
            </Row>

            <Modal
                title="Sửa cấu hình Email"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                onOk={handleSaveConfig}
                okText="Lưu cấu hình"
                cancelText="Hủy"
                width={900}
                confirmLoading={savingConfig}
            >
                <Form form={editForm} layout="vertical">
                    <Row gutter={16}>
                        <Col xs={24} lg={12}>
                            <Card size="small" title="Email @dav.edu.vn">
                                <Form.Item name="davHost" label="SMTP Host">
                                    <Input placeholder="smtp.office365.com" />
                                </Form.Item>
                                <Form.Item name="davPort" label="SMTP Port">
                                    <Input placeholder="587" />
                                </Form.Item>
                                <Form.Item
                                    name="davUser"
                                    label="SMTP User"
                                    rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                                >
                                    <Input placeholder="support.pmtv@dav.edu.vn" />
                                </Form.Item>
                                <Form.Item
                                    name="davPassword"
                                    label="SMTP Password"
                                    extra="Để trống nếu không muốn thay đổi mật khẩu hiện tại"
                                >
                                    <Input.Password placeholder="********" />
                                </Form.Item>
                                <Form.Item name="davEmailFrom" label="Email From">
                                    <Input placeholder="support.pmtv@dav.edu.vn" />
                                </Form.Item>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card size="small" title="Gmail OAuth2 (Backup)">
                                <Form.Item
                                    name="gmailEmail"
                                    label="Gmail Email"
                                    rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                                >
                                    <Input placeholder="dinhnguyenduc1985@gmail.com" />
                                </Form.Item>
                                <Form.Item name="gmailClientId" label="Client ID" extra="Để trống nếu giữ nguyên">
                                    <Input placeholder="Google OAuth2 Client ID" />
                                </Form.Item>
                                <Form.Item
                                    name="gmailClientSecret"
                                    label="Client Secret"
                                    extra="Để trống nếu giữ nguyên"
                                >
                                    <Input.Password placeholder="********" />
                                </Form.Item>
                                <Form.Item name="gmailRedirectUri" label="Redirect URI" extra="Để trống nếu giữ nguyên">
                                    <Input placeholder="https://developers.google.com/oauthplayground" />
                                </Form.Item>
                                <Form.Item
                                    name="gmailRefreshToken"
                                    label="Refresh Token"
                                    extra="Để trống nếu giữ nguyên"
                                >
                                    <Input.Password placeholder="********" />
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default EmailConfig;
