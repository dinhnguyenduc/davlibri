import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    message,
    Tag,
    Space,
    Statistic,
    Row,
    Col,
    Tabs,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    KeyOutlined,
    FileProtectOutlined,
    BookOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import {
    requestGetAllApiKeys,
    requestCreateApiKey,
    requestUpdateApiKey,
    requestDeleteApiKey,
    requestGetApiKeyStats,
    requestGetAllPolicies,
    requestCreatePolicy,
    requestUpdatePolicy,
    requestDeletePolicy,
    requestGetAllContextTerms,
    requestAddContextTerm,
    requestUpdateContextTerm,
    requestDeleteContextTerm,
} from '../../../../config/request';
import styles from './ManagerChatbotConfig.module.scss';

const { TextArea } = Input;
const { TabPane } = Tabs;

function ManagerChatbotConfig() {
    // States
    const [activeTab, setActiveTab] = useState('api-keys');
    const [loading, setLoading] = useState(false);

    // API Keys states
    const [apiKeys, setApiKeys] = useState([]);
    const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
    const [apiKeyForm] = Form.useForm();
    const [editingApiKey, setEditingApiKey] = useState(null);

    // Policies states
    const [policies, setPolicies] = useState([]);
    const [policyModalVisible, setPolicyModalVisible] = useState(false);
    const [policyForm] = Form.useForm();
    const [editingPolicy, setEditingPolicy] = useState(null);

    // Context Dictionary states
    const [contextTerms, setContextTerms] = useState([]);
    const [termModalVisible, setTermModalVisible] = useState(false);
    const [termForm] = Form.useForm();
    const [editingTerm, setEditingTerm] = useState(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'api-keys') {
                const response = await requestGetAllApiKeys();
                setApiKeys(response.metadata);
            } else if (activeTab === 'policies') {
                const response = await requestGetAllPolicies();
                setPolicies(response.metadata);
            } else if (activeTab === 'context-dictionary') {
                const response = await requestGetAllContextTerms({});
                setContextTerms(response.metadata);
            }
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // ============ API KEYS ============
    const apiKeysColumns = [
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Provider',
            dataIndex: 'provider',
            key: 'provider',
            render: (provider) => <Tag color="blue">{provider.toUpperCase()}</Tag>,
        },
        {
            title: 'API Key',
            dataIndex: 'maskedKey',
            key: 'maskedKey',
            render: (key) => <code>{key}</code>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Đang dùng' : 'Tắt'}</Tag>,
        },
        {
            title: 'Thống kê',
            key: 'stats',
            render: (_, record) => (
                <Space>
                    <Tag color="cyan">{record.usageStats?.totalRequests || 0} requests</Tag>
                    <Tag color="green">{record.usageStats?.successfulRequests || 0} success</Tag>
                </Space>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEditApiKey(record)}>
                        Sửa
                    </Button>
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteApiKey(record._id)}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const handleCreateApiKey = () => {
        setEditingApiKey(null);
        apiKeyForm.resetFields();
        setApiKeyModalVisible(true);
    };

    const handleEditApiKey = (record) => {
        setEditingApiKey(record);
        apiKeyForm.setFieldsValue({
            name: record.name,
            provider: record.provider,
            isActive: record.isActive,
            dailyLimit: record.quotaLimits?.dailyLimit,
            monthlyLimit: record.quotaLimits?.monthlyLimit,
        });
        setApiKeyModalVisible(true);
    };

    const handleSaveApiKey = async () => {
        try {
            const values = await apiKeyForm.validateFields();
            setLoading(true);

            if (editingApiKey) {
                await requestUpdateApiKey(editingApiKey._id, values);
                message.success('Cập nhật API key thành công');
            } else {
                await requestCreateApiKey(values);
                message.success('Tạo API key thành công');
            }

            setApiKeyModalVisible(false);
            loadData();
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteApiKey = async (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa API key này?',
            onOk: async () => {
                try {
                    await requestDeleteApiKey(id);
                    message.success('Xóa thành công');
                    loadData();
                } catch (error) {
                    message.error('Lỗi khi xóa');
                }
            },
        });
    };

    // ============ POLICIES ============
    const policiesColumns = [
        {
            title: 'Tên Policy',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            sorter: (a, b) => a.priority - b.priority,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>,
        },
        {
            title: 'Quy tắc',
            key: 'rules',
            render: (_, record) => (
                <Space wrap>
                    {record.rules?.truthfulness?.enabled && <Tag color="blue">Trung thực</Tag>}
                    {record.rules?.scopeLimitation?.enabled && <Tag color="cyan">Phạm vi</Tag>}
                    {record.rules?.copyrightProtection?.enabled && <Tag color="purple">Bản quyền</Tag>}
                    {record.rules?.escalation?.enabled && <Tag color="orange">Escalation</Tag>}
                </Space>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEditPolicy(record)}>
                        Sửa
                    </Button>
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeletePolicy(record._id)}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const handleCreatePolicy = () => {
        setEditingPolicy(null);
        policyForm.resetFields();
        setPolicyModalVisible(true);
    };

    const handleEditPolicy = (record) => {
        setEditingPolicy(record);
        policyForm.setFieldsValue({
            name: record.name,
            description: record.description,
            systemPrompt: record.systemPrompt,
            priority: record.priority,
            isActive: record.isActive,
            truthfulnessEnabled: record.rules?.truthfulness?.enabled,
            truthfulnessMessage: record.rules?.truthfulness?.message,
            scopeEnabled: record.rules?.scopeLimitation?.enabled,
            scopeRejectionMessage: record.rules?.scopeLimitation?.rejectionMessage,
            escalationEnabled: record.rules?.escalation?.enabled,
            escalationEmail: record.rules?.escalation?.contactInfo?.email,
            escalationPhone: record.rules?.escalation?.contactInfo?.phone,
        });
        setPolicyModalVisible(true);
    };

    const handleSavePolicy = async () => {
        try {
            const values = await policyForm.validateFields();
            setLoading(true);

            const policyData = {
                name: values.name,
                description: values.description,
                systemPrompt: values.systemPrompt,
                priority: values.priority || 0,
                isActive: values.isActive,
                rules: {
                    truthfulness: {
                        enabled: values.truthfulnessEnabled,
                        message: values.truthfulnessMessage,
                    },
                    scopeLimitation: {
                        enabled: values.scopeEnabled,
                        rejectionMessage: values.scopeRejectionMessage,
                        allowedTopics: ['sách', 'thư viện', 'học thuật', 'tra cứu', 'thủ tục'],
                    },
                    escalation: {
                        enabled: values.escalationEnabled,
                        triggers: ['tranh chấp', 'khiếu nại', 'mất thẻ', 'hỏng sách'],
                        contactInfo: {
                            email: values.escalationEmail,
                            phone: values.escalationPhone,
                            message: `Vui lòng liên hệ: {email} hoặc {phone}`,
                        },
                    },
                },
            };

            if (editingPolicy) {
                await requestUpdatePolicy(editingPolicy._id, policyData);
                message.success('Cập nhật policy thành công');
            } else {
                await requestCreatePolicy(policyData);
                message.success('Tạo policy thành công');
            }

            setPolicyModalVisible(false);
            loadData();
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePolicy = async (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa policy này?',
            onOk: async () => {
                try {
                    await requestDeletePolicy(id);
                    message.success('Xóa thành công');
                    loadData();
                } catch (error) {
                    message.error('Lỗi khi xóa');
                }
            },
        });
    };

    // ============ CONTEXT DICTIONARY ============
    const contextTermsColumns = [
        {
            title: 'Thuật ngữ',
            dataIndex: 'term',
            key: 'term',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Định nghĩa',
            dataIndex: 'definition',
            key: 'definition',
            ellipsis: true,
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            render: (category) => {
                const colors = {
                    politics: 'red',
                    economics: 'green',
                    diplomacy: 'blue',
                    academic: 'purple',
                    general: 'default',
                };
                return <Tag color={colors[category] || 'default'}>{category}</Tag>;
            },
        },
        {
            title: 'Aliases',
            dataIndex: 'aliases',
            key: 'aliases',
            render: (aliases) => (
                <Space wrap>
                    {aliases?.slice(0, 2).map((alias, idx) => (
                        <Tag key={idx}>{alias}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEditTerm(record)}>
                        Sửa
                    </Button>
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTerm(record._id)}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const handleCreateTerm = () => {
        setEditingTerm(null);
        termForm.resetFields();
        setTermModalVisible(true);
    };

    const handleEditTerm = (record) => {
        setEditingTerm(record);
        termForm.setFieldsValue({
            term: record.term,
            definition: record.definition,
            category: record.category,
            aliases: record.aliases?.join(', '),
            relatedTerms: record.relatedTerms?.join(', '),
            isActive: record.isActive,
        });
        setTermModalVisible(true);
    };

    const handleSaveTerm = async () => {
        try {
            const values = await termForm.validateFields();
            setLoading(true);

            const termData = {
                ...values,
                aliases:
                    values.aliases
                        ?.split(',')
                        .map((s) => s.trim())
                        .filter(Boolean) || [],
                relatedTerms:
                    values.relatedTerms
                        ?.split(',')
                        .map((s) => s.trim())
                        .filter(Boolean) || [],
            };

            if (editingTerm) {
                await requestUpdateContextTerm(editingTerm._id, termData);
                message.success('Cập nhật thuật ngữ thành công');
            } else {
                await requestAddContextTerm(termData);
                message.success('Thêm thuật ngữ thành công');
            }

            setTermModalVisible(false);
            loadData();
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTerm = async (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa thuật ngữ này?',
            onOk: async () => {
                try {
                    await requestDeleteContextTerm(id);
                    message.success('Xóa thành công');
                    loadData();
                } catch (error) {
                    message.error('Lỗi khi xóa');
                }
            },
        });
    };

    return (
        <div className={styles.container}>
            <Card
                title={
                    <Space>
                        <FileProtectOutlined />
                        <span>Cấu hình Chatbot AI</span>
                    </Space>
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    {/* API KEYS TAB */}
                    <TabPane
                        tab={
                            <span>
                                <KeyOutlined />
                                API Keys
                            </span>
                        }
                        key="api-keys"
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateApiKey}>
                                Thêm API Key
                            </Button>
                        </div>
                        <Table columns={apiKeysColumns} dataSource={apiKeys} loading={loading} rowKey="_id" />
                    </TabPane>

                    {/* POLICIES TAB */}
                    <TabPane
                        tab={
                            <span>
                                <FileProtectOutlined />
                                Policies & Rules
                            </span>
                        }
                        key="policies"
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePolicy}>
                                Thêm Policy
                            </Button>
                        </div>
                        <Table columns={policiesColumns} dataSource={policies} loading={loading} rowKey="_id" />
                    </TabPane>

                    {/* CONTEXT DICTIONARY TAB */}
                    <TabPane
                        tab={
                            <span>
                                <BookOutlined />
                                Context Dictionary
                            </span>
                        }
                        key="context-dictionary"
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTerm}>
                                Thêm thuật ngữ
                            </Button>
                        </div>
                        <Table columns={contextTermsColumns} dataSource={contextTerms} loading={loading} rowKey="_id" />
                    </TabPane>
                </Tabs>
            </Card>

            {/* API KEY MODAL */}
            <Modal
                title={editingApiKey ? 'Sửa API Key' : 'Thêm API Key'}
                open={apiKeyModalVisible}
                onCancel={() => setApiKeyModalVisible(false)}
                onOk={handleSaveApiKey}
                width={600}
                confirmLoading={loading}
            >
                <Form form={apiKeyForm} layout="vertical">
                    <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                        <Input placeholder="Ví dụ: Gemini API Key - Production" />
                    </Form.Item>

                    <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="gemini">Gemini</Select.Option>
                            <Select.Option value="openai">OpenAI</Select.Option>
                            <Select.Option value="claude">Claude</Select.Option>
                        </Select>
                    </Form.Item>

                    {!editingApiKey && (
                        <Form.Item
                            name="apiKey"
                            label="API Key"
                            rules={[{ required: true, message: 'Vui lòng nhập API key' }]}
                        >
                            <Input.Password placeholder="Nhập API key" />
                        </Form.Item>
                    )}

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="dailyLimit" label="Giới hạn ngày">
                                <Input type="number" placeholder="1000" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="monthlyLimit" label="Giới hạn tháng">
                                <Input type="number" placeholder="30000" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>

            {/* POLICY MODAL */}
            <Modal
                title={editingPolicy ? 'Sửa Policy' : 'Thêm Policy'}
                open={policyModalVisible}
                onCancel={() => setPolicyModalVisible(false)}
                onOk={handleSavePolicy}
                width={800}
                confirmLoading={loading}
            >
                <Form form={policyForm} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Tên Policy"
                        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={2} />
                    </Form.Item>

                    <Form.Item name="systemPrompt" label="System Prompt" rules={[{ required: true }]}>
                        <TextArea rows={6} placeholder="Bạn là trợ lý ảo của thư viện..." />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="priority" label="Priority">
                                <Input type="number" placeholder="0" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Card title="Quy tắc" size="small" style={{ marginTop: 16 }}>
                        <Form.Item name="truthfulnessEnabled" valuePropName="checked">
                            <Switch /> Trung thực tuyệt đối
                        </Form.Item>
                        <Form.Item name="truthfulnessMessage" label="Thông báo khi không tìm thấy">
                            <Input placeholder="Thư viện hiện không có thông tin này..." />
                        </Form.Item>

                        <Form.Item name="scopeEnabled" valuePropName="checked">
                            <Switch /> Giới hạn phạm vi
                        </Form.Item>
                        <Form.Item name="scopeRejectionMessage" label="Thông báo từ chối">
                            <Input placeholder="Xin lỗi, tôi chỉ trả lời về thư viện..." />
                        </Form.Item>

                        <Form.Item name="escalationEnabled" valuePropName="checked">
                            <Switch /> Chuyển tiếp (Escalation)
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="escalationEmail" label="Email hỗ trợ">
                                    <Input placeholder="library@dav.edu.vn" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="escalationPhone" label="Hotline">
                                    <Input placeholder="0123-456-789" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Modal>

            {/* CONTEXT TERM MODAL */}
            <Modal
                title={editingTerm ? 'Sửa thuật ngữ' : 'Thêm thuật ngữ'}
                open={termModalVisible}
                onCancel={() => setTermModalVisible(false)}
                onOk={handleSaveTerm}
                width={700}
                confirmLoading={loading}
            >
                <Form form={termForm} layout="vertical">
                    <Form.Item
                        name="term"
                        label="Thuật ngữ"
                        rules={[{ required: true, message: 'Vui lòng nhập thuật ngữ' }]}
                    >
                        <Input placeholder="Ví dụ: ASEAN" />
                    </Form.Item>

                    <Form.Item name="definition" label="Định nghĩa" rules={[{ required: true }]}>
                        <TextArea rows={3} placeholder="Hiệp hội các quốc gia Đông Nam Á..." />
                    </Form.Item>

                    <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="politics">Politics</Select.Option>
                            <Select.Option value="economics">Economics</Select.Option>
                            <Select.Option value="diplomacy">Diplomacy</Select.Option>
                            <Select.Option value="academic">Academic</Select.Option>
                            <Select.Option value="general">General</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="aliases" label="Aliases (phân cách bằng dấu phẩy)">
                        <Input placeholder="ASEAN, hiệp hội Đông Nam Á" />
                    </Form.Item>

                    <Form.Item name="relatedTerms" label="Thuật ngữ liên quan (phân cách bằng dấu phẩy)">
                        <Input placeholder="Việt Nam, Đông Nam Á, Ngoại giao" />
                    </Form.Item>

                    <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked" initialValue={true}>
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerChatbotConfig;
