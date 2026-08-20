import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    Space,
    message,
    Popconfirm,
    Tag,
    Card,
    Row,
    Col,
    Statistic,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    QuestionCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    UploadOutlined,
    SearchOutlined,
    DownloadOutlined,
} from '@ant-design/icons';
import {
    requestGetAllFAQs,
    requestCreateFAQ,
    requestUpdateFAQ,
    requestDeleteFAQ,
    requestToggleFAQStatus,
    requestBulkDeleteFAQs,
    requestImportFAQs,
} from '../../../../config/request';
import ExportButton from '../../../../Components/ExportButton/ExportButton';
import styles from './ManagerFAQ.module.scss';

const { TextArea } = Input;
const { Option } = Select;

function ManagerFAQ() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState(null);
    const [form] = Form.useForm();
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importData, setImportData] = useState('');
    const [displayedCount, setDisplayedCount] = useState(50); // Số lượng item hiển thị ban đầu
    const [isLoadingMore, setIsLoadingMore] = useState(false); // Loading khi scroll

    const categories = [
        { value: 'general', label: 'Thông tin chung', color: 'blue' },
        { value: 'product', label: 'Sản phẩm', color: 'green' },
        { value: 'payment', label: 'Thanh toán', color: 'orange' },
        { value: 'rental', label: 'Thuê sách', color: 'purple' },
        { value: 'return', label: 'Trả sách', color: 'cyan' },
        { value: 'other', label: 'Khác', color: 'default' },
    ];

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterCategory !== 'all') params.category = filterCategory;
            if (filterStatus !== undefined) params.isActive = filterStatus;

            console.log('Fetching FAQs with params:', params);
            const response = await requestGetAllFAQs(params);
            console.log('FAQ Response:', response);
            setFaqs(response.metadata || []);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            message.error('Lỗi khi tải danh sách FAQ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFAQs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterCategory, filterStatus]);

    const showModal = (faq = null) => {
        setEditingFAQ(faq);
        if (faq) {
            form.setFieldsValue({
                question: faq.question,
                answer: faq.answer,
                keywords: faq.keywords?.join(', ') || '',
                category: faq.category,
                isActive: faq.isActive,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ isActive: true });
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const data = {
                question: values.question,
                answer: values.answer,
                keywords: values.keywords ? values.keywords.split(',').map((k) => k.trim()) : [],
                category: values.category,
                isActive: values.isActive,
            };

            if (editingFAQ) {
                await requestUpdateFAQ(editingFAQ._id, data);
                message.success('Cập nhật FAQ thành công');
            } else {
                await requestCreateFAQ(data);
                message.success('Tạo FAQ thành công');
            }

            setIsModalVisible(false);
            form.resetFields();
            fetchFAQs();
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingFAQ(null);
    };

    const handleDelete = async (id) => {
        try {
            await requestDeleteFAQ(id);
            message.success('Xóa FAQ thành công');
            fetchFAQs();
        } catch (error) {
            message.error('Lỗi khi xóa FAQ');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await requestToggleFAQStatus(id);
            message.success('Cập nhật trạng thái thành công');
            fetchFAQs();
        } catch (error) {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 FAQ để xóa');
            return;
        }

        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc muốn xóa ${selectedRowKeys.length} FAQ đã chọn?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    setLoading(true);
                    await requestBulkDeleteFAQs(selectedRowKeys);
                    message.success(`Đã xóa ${selectedRowKeys.length} FAQ`);
                    setSelectedRowKeys([]);
                    fetchFAQs();
                } catch (error) {
                    message.error('Lỗi khi xóa FAQ');
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleExportTemplate = () => {
        const template = [
            {
                question: 'Câu hỏi mẫu 1',
                answer: 'Câu trả lời mẫu 1',
                category: 'general',
                keywords: 'từ khóa 1, từ khóa 2',
                isActive: true,
            },
            {
                question: 'Câu hỏi mẫu 2',
                answer: 'Câu trả lời mẫu 2',
                category: 'product',
                keywords: 'từ khóa 3, từ khóa 4',
                isActive: true,
            },
        ];

        const csvContent =
            'question,answer,category,keywords,isActive\n' +
            template
                .map((row) => `"${row.question}","${row.answer}","${row.category}","${row.keywords}",${row.isActive}`)
                .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'faq_template.csv';
        link.click();
    };

    // Export function removed - now using ExportButton component

    const handleImport = () => {
        setIsImportModalVisible(true);
        setImportData('');
    };

    const handleImportConfirm = async () => {
        try {
            setLoading(true);
            const faqs = JSON.parse(importData);

            if (!Array.isArray(faqs)) {
                throw new Error('Dữ liệu phải là mảng JSON');
            }

            const response = await requestImportFAQs(faqs);
            message.success(
                `Import thành công! ${response.metadata.imported} FAQ đã được thêm, ${response.metadata.skipped} bị bỏ qua.`,
            );
            setIsImportModalVisible(false);
            setImportData('');
            fetchFAQs();
        } catch (error) {
            if (error.message.includes('JSON')) {
                message.error('Lỗi định dạng JSON. Vui lòng kiểm tra lại!');
            } else {
                message.error('Lỗi khi import FAQ: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const parseCSV = (csv) => {
        const lines = csv.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

        return lines.slice(1).map((line) => {
            const values = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            const obj = {};
            headers.forEach((header, idx) => {
                obj[header] = values[idx] || '';
            });
            return obj;
        });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target.result;

                if (file.name.endsWith('.csv')) {
                    const parsed = parseCSV(content);
                    setImportData(JSON.stringify(parsed, null, 2));
                } else if (file.name.endsWith('.json')) {
                    setImportData(content);
                } else {
                    message.error('Chỉ hỗ trợ file CSV hoặc JSON');
                }
            } catch (error) {
                message.error('Lỗi khi đọc file: ' + error.message);
            }
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    };

    const getCategoryInfo = (category) => {
        return categories.find((c) => c.value === category) || categories[categories.length - 1];
    };

    // Filter FAQs by search keyword
    const filteredFaqs = faqs.filter((faq) => {
        if (!searchKeyword) return true;
        const keyword = searchKeyword.toLowerCase();
        return (
            faq.question?.toLowerCase().includes(keyword) ||
            faq.answer?.toLowerCase().includes(keyword) ||
            faq.keywords?.some((k) => k.toLowerCase().includes(keyword))
        );
    });

    // Lazy loading: Chỉ hiển thị một phần dữ liệu
    const displayedFaqs = filteredFaqs.slice(0, displayedCount);

    // Handle scroll to load more
    const handleTableScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (isNearBottom && displayedCount < filteredFaqs.length && !loading && !isLoadingMore) {
            setIsLoadingMore(true);

            // Simulate async loading (trong trường hợp cần fetch từ server)
            setTimeout(() => {
                // Load thêm 50 items
                setDisplayedCount((prev) => Math.min(prev + 50, filteredFaqs.length));
                setIsLoadingMore(false);
            }, 300);
        }
    };

    // Reset displayedCount khi filter thay đổi
    useEffect(() => {
        setDisplayedCount(50);
    }, [searchKeyword, filterCategory, filterStatus]);

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Câu hỏi',
            dataIndex: 'question',
            key: 'question',
            width: 300,
            ellipsis: true,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm câu hỏi..."
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Tìm
                        </Button>
                        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
            onFilter: (value, record) => record.question?.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: 'Câu trả lời',
            dataIndex: 'answer',
            key: 'answer',
            width: 350,
            ellipsis: true,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm câu trả lời..."
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Tìm
                        </Button>
                        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
            onFilter: (value, record) => record.answer?.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            filters: categories.map((cat) => ({ text: cat.label, value: cat.value })),
            onFilter: (value, record) => record.category === value,
            render: (category) => {
                const catInfo = getCategoryInfo(category);
                return <Tag color={catInfo.color}>{catInfo.label}</Tag>;
            },
        },
        {
            title: 'Từ khóa',
            dataIndex: 'keywords',
            key: 'keywords',
            width: 150,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm từ khóa..."
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Tìm
                        </Button>
                        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
            onFilter: (value, record) => record.keywords?.some((k) => k.toLowerCase().includes(value.toLowerCase())),
            render: (keywords) => (
                <div className={styles.keywords}>
                    {keywords?.slice(0, 2).map((k, idx) => (
                        <Tag key={idx} color="geekblue" style={{ fontSize: '11px' }}>
                            {k}
                        </Tag>
                    ))}
                    {keywords?.length > 2 && <span>+{keywords.length - 2}</span>}
                </div>
            ),
        },
        {
            title: 'Lượt xem',
            dataIndex: 'viewCount',
            key: 'viewCount',
            width: 100,
            align: 'center',
            sorter: (a, b) => a.viewCount - b.viewCount,
            render: (count) => (
                <span>
                    <EyeOutlined /> {count}
                </span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 120,
            align: 'center',
            filters: [
                { text: 'Hoạt động', value: true },
                { text: 'Tạm ẩn', value: false },
            ],
            onFilter: (value, record) => record.isActive === value,
            render: (isActive, record) => (
                <Switch
                    checked={isActive}
                    onChange={() => handleToggleStatus(record._id)}
                    checkedChildren={<CheckCircleOutlined />}
                    unCheckedChildren={<CloseCircleOutlined />}
                />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => showModal(record)}>
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xác nhận xóa FAQ này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />} size="small">
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const stats = {
        total: filteredFaqs.length,
        active: filteredFaqs.filter((f) => f.isActive).length,
        inactive: filteredFaqs.filter((f) => !f.isActive).length,
        totalViews: filteredFaqs.reduce((sum, f) => sum + f.viewCount, 0),
        displayed: displayedFaqs.length, // Số lượng đang hiển thị
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE,
            {
                key: 'active',
                text: 'Chọn FAQ đang hoạt động',
                onSelect: (changeableRowKeys) => {
                    const keys = changeableRowKeys.filter((key) => {
                        const faq = filteredFaqs.find((f) => f._id === key);
                        return faq?.isActive;
                    });
                    setSelectedRowKeys(keys);
                },
            },
            {
                key: 'inactive',
                text: 'Chọn FAQ tạm ẩn',
                onSelect: (changeableRowKeys) => {
                    const keys = changeableRowKeys.filter((key) => {
                        const faq = filteredFaqs.find((f) => f._id === key);
                        return !faq?.isActive;
                    });
                    setSelectedRowKeys(keys);
                },
            },
        ],
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>
                        <QuestionCircleOutlined /> Quản lý FAQ - Chatbot
                    </h2>
                    <p className={styles.subtitle}>Quản lý câu hỏi và câu trả lời cho chatbot</p>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExportTemplate}>
                        Tải mẫu CSV
                    </Button>
                    <ExportButton data={filteredFaqs} type="faq" buttonText="Export Excel" />
                    <Button icon={<UploadOutlined />} onClick={handleImport}>
                        Import FAQ
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => showModal()}>
                        Thêm FAQ mới
                    </Button>
                </Space>
            </div>

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Tổng số FAQ" value={stats.total} prefix={<QuestionCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="FAQ đang hoạt động"
                            value={stats.active}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="FAQ tạm ẩn"
                            value={stats.inactive}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<CloseCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Tổng lượt xem" value={stats.totalViews} prefix={<EyeOutlined />} />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: '16px' }}>
                <Space size="middle" wrap>
                    <Input
                        placeholder="🔍 Tìm kiếm theo câu hỏi, câu trả lời, từ khóa..."
                        prefix={<SearchOutlined />}
                        style={{ width: 350 }}
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        allowClear
                    />

                    <span>Lọc theo danh mục:</span>
                    <Select value={filterCategory} onChange={setFilterCategory} style={{ width: 200 }}>
                        <Option value="all">Tất cả</Option>
                        {categories.map((cat) => (
                            <Option key={cat.value} value={cat.value}>
                                {cat.label}
                            </Option>
                        ))}
                    </Select>

                    <span>Trạng thái:</span>
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        style={{ width: 150 }}
                        allowClear
                        placeholder="Tất cả"
                    >
                        <Option value={true}>Hoạt động</Option>
                        <Option value={false}>Tạm ẩn</Option>
                    </Select>

                    {selectedRowKeys.length > 0 && (
                        <Button danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                            Xóa {selectedRowKeys.length} mục đã chọn
                        </Button>
                    )}
                </Space>
            </Card>

            {/* Table */}
            <Card>
                {displayedCount < filteredFaqs.length && (
                    <div
                        style={{
                            marginBottom: 16,
                            padding: '8px 16px',
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            borderRadius: 4,
                            color: '#1890ff',
                            textAlign: 'center',
                        }}
                    >
                        📊 Đang hiển thị <strong>{displayedCount}</strong> / <strong>{filteredFaqs.length}</strong> FAQ.
                        {isLoadingMore ? ' ⏳ Đang tải thêm...' : ' 👇 Cuộn xuống để tải thêm...'}
                    </div>
                )}
                <Table
                    columns={columns}
                    dataSource={displayedFaqs}
                    rowKey="_id"
                    loading={loading}
                    rowSelection={rowSelection}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        pageSizeOptions: ['10', '20', '50', '100', '200', '300'],
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${filteredFaqs.length} FAQ (hiển thị ${total})`,
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        },
                    }}
                    scroll={{ x: 1500, y: 600 }}
                    onScroll={handleTableScroll}
                />
            </Card>

            {/* Modal */}
            <Modal
                title={
                    <span>
                        <QuestionCircleOutlined /> {editingFAQ ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
                    </span>
                }
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width={700}
                confirmLoading={loading}
                okText={editingFAQ ? 'Cập nhật' : 'Tạo mới'}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="question"
                        label="Câu hỏi"
                        rules={[{ required: true, message: 'Vui lòng nhập câu hỏi' }]}
                    >
                        <Input placeholder="Nhập câu hỏi..." />
                    </Form.Item>

                    <Form.Item
                        name="answer"
                        label="Câu trả lời"
                        rules={[{ required: true, message: 'Vui lòng nhập câu trả lời' }]}
                    >
                        <TextArea rows={4} placeholder="Nhập câu trả lời..." />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                label="Danh mục"
                                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                            >
                                <Select placeholder="Chọn danh mục">
                                    {categories.map((cat) => (
                                        <Option key={cat.value} value={cat.value}>
                                            <Tag color={cat.color}>{cat.label}</Tag>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                                <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm ẩn" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="keywords" label="Từ khóa" extra="Nhập các từ khóa cách nhau bằng dấu phẩy (,)">
                        <Input placeholder="Ví dụ: thuê sách, giá thuê, thời gian thuê" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Import Modal */}
            <Modal
                title={
                    <span>
                        <UploadOutlined /> Import FAQ từ File
                    </span>
                }
                open={isImportModalVisible}
                onOk={handleImportConfirm}
                onCancel={() => {
                    setIsImportModalVisible(false);
                    setImportData('');
                }}
                width={800}
                confirmLoading={loading}
                okText="Import"
                cancelText="Hủy"
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                        <p>
                            <strong>Hướng dẫn:</strong>
                        </p>
                        <ol>
                            <li>Tải file mẫu CSV bằng nút "Tải mẫu CSV"</li>
                            <li>Điền dữ liệu FAQ vào file (hỗ trợ Excel hoặc text editor)</li>
                            <li>Lưu file dạng CSV (UTF-8) hoặc JSON</li>
                            <li>Tải lên và xem trước dữ liệu bên dưới</li>
                            <li>Nhấn "Import" để thêm vào hệ thống</li>
                        </ol>
                        <p>
                            <strong>Danh mục hợp lệ:</strong> general, product, payment, rental, return, other
                        </p>
                    </div>

                    <div>
                        <label htmlFor="fileUpload" style={{ marginRight: 10 }}>
                            Chọn file:
                        </label>
                        <input
                            id="fileUpload"
                            type="file"
                            accept=".csv,.json"
                            onChange={handleFileUpload}
                            style={{ marginBottom: 10 }}
                        />
                    </div>

                    <div>
                        <p>
                            <strong>Dữ liệu JSON (xem trước):</strong>
                        </p>
                        <TextArea
                            rows={12}
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                            placeholder={`Nhập JSON array hoặc tải file CSV/JSON:\n\n[\n  {\n    "question": "Câu hỏi 1",\n    "answer": "Câu trả lời 1",\n    "category": "general",\n    "keywords": "từ khóa 1, từ khóa 2",\n    "isActive": true\n  }\n]`}
                            style={{ fontFamily: 'monospace', fontSize: 12 }}
                        />
                    </div>
                </Space>
            </Modal>
        </div>
    );
}

export default ManagerFAQ;
