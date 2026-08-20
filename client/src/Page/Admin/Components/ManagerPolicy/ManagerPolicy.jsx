import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Switch, message, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerPolicy.module.scss';
import {
    requestGetAllHomePolicies,
    requestCreateHomePolicy,
    requestUpdateHomePolicy,
    requestDeleteHomePolicy,
    requestToggleHomePolicyStatus,
    requestUploadBannerImage,
} from '../../../../config/request';

const cx = classNames.bind(styles);

function ManagerPolicy() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [form] = Form.useForm();
    const [iconUrl, setIconUrl] = useState('');
    const [fileList, setFileList] = useState([]);

    // Default icon nếu không có icon
    const defaultIcon = 'https://cdn-icons-png.flaticon.com/512/3176/3176366.png';

    // Fetch policies
    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const response = await requestGetAllHomePolicies();
            setPolicies(response.metadata);
        } catch (error) {
            message.error('Lỗi khi tải danh sách chính sách');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    // Handle create
    const handleCreate = () => {
        setEditingPolicy(null);
        form.resetFields();
        form.setFieldsValue({
            iconColor: '#ff6b6b',
            order: 0,
        });
        setIconUrl('');
        setFileList([]);
        setIsModalOpen(true);
    };

    // Handle edit
    const handleEdit = (record) => {
        setEditingPolicy(record);
        form.setFieldsValue({
            title: record.title,
            description: record.description,
            icon: record.icon,
            link: record.link,
            iconColor: record.iconColor,
            order: record.order,
        });
        setIconUrl(record.icon);

        // Set fileList nếu có icon
        if (record.icon && record.icon !== defaultIcon) {
            setFileList([
                {
                    uid: '-1',
                    name: 'policy-icon',
                    status: 'done',
                    url: record.icon,
                },
            ]);
        } else {
            setFileList([]);
        }

        setIsModalOpen(true);
    };

    // Handle submit
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const policyData = {
                title: values.title,
                description: values.description,
                icon: iconUrl || values.icon || defaultIcon,
                link: values.link || '#',
                iconColor: values.iconColor || '#ff6b6b',
                order: values.order || 0,
            };

            if (editingPolicy) {
                await requestUpdateHomePolicy(editingPolicy._id, policyData);
                message.success('Cập nhật chính sách thành công');
            } else {
                await requestCreateHomePolicy(policyData);
                message.success('Tạo chính sách thành công');
            }

            setIsModalOpen(false);
            form.resetFields();
            setIconUrl('');
            setFileList([]);
            fetchPolicies();
        } catch (error) {
            if (error.errorFields) {
                message.error('Vui lòng điền đầy đủ thông tin!');
            } else {
                message.error(editingPolicy ? 'Lỗi khi cập nhật chính sách' : 'Lỗi khi tạo chính sách');
                console.error(error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle delete
    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa chính sách này?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okType: 'danger',
            onOk: async () => {
                try {
                    await requestDeleteHomePolicy(id);
                    message.success('Xóa chính sách thành công');
                    fetchPolicies();
                } catch (error) {
                    message.error('Lỗi khi xóa chính sách');
                    console.error(error);
                }
            },
        });
    };

    // Handle toggle status
    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await requestToggleHomePolicyStatus(id);
            message.success(`${currentStatus ? 'Tắt' : 'Bật'} chính sách thành công`);
            fetchPolicies();
        } catch (error) {
            message.error('Lỗi khi thay đổi trạng thái');
            console.error(error);
        }
    };

    // Handle upload icon
    const handleUploadIcon = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await requestUploadBannerImage(formData);
            setIconUrl(response.metadata.url);
            setFileList([
                {
                    uid: '-1',
                    name: file.name,
                    status: 'done',
                    url: response.metadata.url,
                },
            ]);
            message.success('Upload icon thành công');
            return false; // Prevent default upload behavior
        } catch (error) {
            console.error('Upload error:', error);
            message.error('Lỗi khi upload icon');
            return false;
        }
    };

    // Handle icon URL input
    const handleIconUrlChange = (e) => {
        const url = e.target.value;
        setIconUrl(url);
        form.setFieldsValue({ icon: url });

        // Clear file list khi nhập URL
        if (url && url.trim()) {
            setFileList([]);
        }
    };

    // Columns config
    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Icon',
            dataIndex: 'icon',
            key: 'icon',
            width: 100,
            align: 'center',
            render: (icon, record) => (
                <div
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: record.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                    }}
                >
                    <img src={icon} alt="icon" style={{ width: 35, height: 35, objectFit: 'contain' }} />
                </div>
            ),
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            width: 200,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 300,
        },
        {
            title: 'Link',
            dataIndex: 'link',
            key: 'link',
            width: 150,
        },
        {
            title: 'Màu nền',
            dataIndex: 'iconColor',
            key: 'iconColor',
            width: 100,
            align: 'center',
            render: (color) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <div
                        style={{
                            width: 30,
                            height: 30,
                            backgroundColor: color,
                            border: '1px solid #d9d9d9',
                            borderRadius: 4,
                        }}
                    />
                    <span>{color}</span>
                </div>
            ),
        },
        {
            title: 'Thứ tự',
            dataIndex: 'order',
            key: 'order',
            width: 80,
            align: 'center',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 120,
            align: 'center',
            render: (isActive, record) => (
                <Switch checked={isActive} onChange={() => handleToggleStatus(record._id, isActive)} />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small">
                        Sửa
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record._id)}
                        size="small"
                    >
                        Xóa
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className={cx('manager-policy')}>
            <div className={cx('header')}>
                <h2>Quản lý Chính sách</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Thêm Chính sách
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={policies}
                rowKey="_id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} chính sách`,
                }}
                bordered
            />

            <Modal
                title={editingPolicy ? 'Chỉnh sửa Chính sách' : 'Thêm Chính sách mới'}
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setIconUrl('');
                    setFileList([]);
                }}
                width={700}
                confirmLoading={loading}
                okText={editingPolicy ? 'Cập nhật' : 'Tạo mới'}
                cancelText="Hủy"
                centered
            >
                <Form form={form} layout="vertical" className={cx('policy-form')}>
                    <Form.Item
                        label="Tiêu đề"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input placeholder="Quà tặng hấp dẫn" />
                    </Form.Item>

                    <Form.Item
                        label="Mô tả"
                        name="description"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <Input.TextArea rows={3} placeholder="Khuyến mãi lên đến 40% và nhiều quà tặng hấp dẫn" />
                    </Form.Item>

                    <Form.Item
                        label="Icon Chính sách"
                        tooltip="Upload icon hoặc nhập URL. Nếu để trống sẽ sử dụng icon mặc định"
                    >
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            {/* Upload Component */}
                            <div style={{ flex: 1 }}>
                                <p style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Upload từ máy tính:</p>
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    beforeUpload={handleUploadIcon}
                                    onRemove={() => {
                                        setFileList([]);
                                        setIconUrl('');
                                    }}
                                    maxCount={1}
                                    accept="image/*"
                                >
                                    {fileList.length === 0 && (
                                        <div>
                                            <UploadOutlined />
                                            <div style={{ marginTop: 8 }}>Upload Icon</div>
                                        </div>
                                    )}
                                </Upload>
                            </div>

                            {/* URL Input */}
                            <div style={{ flex: 2 }}>
                                <p style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Hoặc nhập URL:</p>
                                <Form.Item name="icon" style={{ marginBottom: 0 }}>
                                    <Input
                                        placeholder="https://example.com/icon.svg (không bắt buộc)"
                                        value={iconUrl}
                                        onChange={handleIconUrlChange}
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    </Form.Item>

                    {/* Preview Icon */}
                    <div style={{ marginBottom: 16, textAlign: 'center' }}>
                        <p style={{ marginBottom: 8, fontWeight: 600 }}>
                            Xem trước icon {!iconUrl && !form.getFieldValue('icon') && '(sẽ dùng icon mặc định)'}:
                        </p>
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                backgroundColor: form.getFieldValue('iconColor') || '#ff6b6b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                border: '2px solid #d9d9d9',
                            }}
                        >
                            <img
                                src={iconUrl || form.getFieldValue('icon') || defaultIcon}
                                alt="preview"
                                style={{ width: 45, height: 45, objectFit: 'contain' }}
                                onError={(e) => {
                                    e.target.src = defaultIcon;
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item label="Link" name="link" style={{ flex: 1 }}>
                            <Input placeholder="#" />
                        </Form.Item>

                        <Form.Item label="Màu nền icon" name="iconColor" style={{ flex: 1 }}>
                            <Input type="color" />
                        </Form.Item>

                        <Form.Item label="Thứ tự" name="order" style={{ flex: 1 }}>
                            <Input type="number" placeholder="0" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerPolicy;
