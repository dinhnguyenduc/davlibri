import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Switch, message, ColorPicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerHeadline.module.scss';
import {
    requestGetAllHeadlines,
    requestCreateHeadline,
    requestUpdateHeadline,
    requestDeleteHeadline,
    requestToggleHeadlineStatus,
} from '../../../../config/request';

const cx = classNames.bind(styles);

function ManagerHeadline() {
    const [headlines, setHeadlines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [editingHeadline, setEditingHeadline] = useState(null);
    const [form] = Form.useForm();

    // Fetch danh sách headlines
    const fetchHeadlines = async () => {
        try {
            setLoading(true);
            const response = await requestGetAllHeadlines();
            setHeadlines(response.metadata);
        } catch (error) {
            message.error('Lỗi khi tải danh sách headline');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeadlines();
    }, []);

    // Xử lý mở modal tạo mới
    const handleCreate = () => {
        setEditingHeadline(null);
        form.resetFields();
        form.setFieldsValue({
            textColor: '#333333',
            highlightColor: '#ff6b6b',
            order: 0,
        });
        setIsModalOpen(true);
    };

    // Xử lý mở modal chỉnh sửa
    const handleEdit = (record) => {
        setEditingHeadline(record);
        form.setFieldsValue({
            plainText: record.plainText,
            dynamicText: record.dynamicText,
            textColor: record.textColor,
            highlightColor: record.highlightColor,
            order: record.order,
        });
        setIsModalOpen(true);
    };

    // Xử lý submit form (tạo mới hoặc cập nhật)
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const headlineData = {
                plainText: values.plainText,
                dynamicText: values.dynamicText,
                textColor: values.textColor || '#333333',
                highlightColor: values.highlightColor || '#ff6b6b',
                order: values.order || 0,
            };

            if (editingHeadline) {
                // Cập nhật
                await requestUpdateHeadline(editingHeadline._id, headlineData);
                message.success('Cập nhật headline thành công');
            } else {
                // Tạo mới
                await requestCreateHeadline(headlineData);
                message.success('Tạo headline thành công');
            }

            setIsModalOpen(false);
            form.resetFields();
            fetchHeadlines();
        } catch (error) {
            if (error.errorFields) {
                message.error('Vui lòng điền đầy đủ thông tin!');
            } else {
                message.error(editingHeadline ? 'Lỗi khi cập nhật headline' : 'Lỗi khi tạo headline');
                console.error(error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Xử lý xóa headline
    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa headline này?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okType: 'danger',
            onOk: async () => {
                try {
                    await requestDeleteHeadline(id);
                    message.success('Xóa headline thành công');
                    fetchHeadlines();
                } catch (error) {
                    message.error('Lỗi khi xóa headline');
                    console.error(error);
                }
            },
        });
    };

    // Xử lý bật/tắt headline
    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await requestToggleHeadlineStatus(id);
            message.success(`${currentStatus ? 'Tắt' : 'Bật'} headline thành công`);
            fetchHeadlines();
        } catch (error) {
            message.error('Lỗi khi thay đổi trạng thái');
            console.error(error);
        }
    };

    // Xử lý xem trước
    const handlePreview = async () => {
        try {
            await form.validateFields();
            setIsPreviewModalOpen(true);
        } catch (error) {
            message.error('Vui lòng điền đầy đủ thông tin trước khi xem trước!');
        }
    };

    // Cấu hình cột table
    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Nội dung chính',
            dataIndex: 'plainText',
            key: 'plainText',
            width: 300,
        },
        {
            title: 'Nội dung động',
            dataIndex: 'dynamicText',
            key: 'dynamicText',
            width: 150,
            render: (text, record) => <span style={{ color: record.highlightColor, fontWeight: 'bold' }}>{text}</span>,
        },
        {
            title: 'Màu chữ',
            dataIndex: 'textColor',
            key: 'textColor',
            width: 100,
            align: 'center',
            render: (color) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            title: 'Màu highlight',
            dataIndex: 'highlightColor',
            key: 'highlightColor',
            width: 100,
            align: 'center',
            render: (color) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
        <div className={cx('manager-headline')}>
            <div className={cx('header')}>
                <h2>Quản lý Headline động</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Thêm Headline
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={headlines}
                rowKey="_id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} headlines`,
                }}
                bordered
            />

            <Modal
                title={editingHeadline ? 'Chỉnh sửa Headline' : 'Thêm Headline mới'}
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                width={700}
                confirmLoading={loading}
                okText={editingHeadline ? 'Cập nhật' : 'Tạo mới'}
                cancelText="Hủy"
                centered
            >
                <Form form={form} layout="vertical" className={cx('headline-form')}>
                    <Form.Item
                        label="Nội dung chính"
                        name="plainText"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung chính!' }]}
                        tooltip="Phần text thông thường, ví dụ: 'Đọc được nhiều sách hơn và đọc tốt hơn với DAVLibri chỉ từ'"
                    >
                        <Input.TextArea
                            rows={2}
                            placeholder="Đọc được nhiều sách hơn và đọc tốt hơn với DAVLibri chỉ từ"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Nội dung động (có hiệu ứng)"
                        name="dynamicText"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung động!' }]}
                        tooltip="Phần text có hiệu ứng highlight, ví dụ: '1,900đ/ngày'"
                    >
                        <Input placeholder="1,900đ/ngày" style={{ color: '#000000', fontWeight: 'bold' }} />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                                    Màu chữ
                                    <span style={{ color: '#ff4d4f' }}> *</span>
                                </label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <ColorPicker
                                        value={form.getFieldValue('textColor') || '#333333'}
                                        onChange={(color) => {
                                            const hexColor = color.toHexString();
                                            form.setFieldsValue({ textColor: hexColor });
                                        }}
                                        format="hex"
                                        placement="bottom"
                                        style={{ width: 50, height: 32 }}
                                    />
                                    <Form.Item
                                        name="textColor"
                                        style={{ margin: 0, flex: 1 }}
                                        rules={[{ required: true, message: 'Vui lòng chọn màu chữ!' }]}
                                    >
                                        <Input
                                            placeholder="#333333"
                                            maxLength={7}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.startsWith('#') && value.length === 7) {
                                                    form.setFieldsValue({ textColor: value });
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                                    Màu highlight
                                    <span style={{ color: '#ff4d4f' }}> *</span>
                                </label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <ColorPicker
                                        value={form.getFieldValue('highlightColor') || '#ff6b6b'}
                                        onChange={(color) => {
                                            const hexColor = color.toHexString();
                                            form.setFieldsValue({ highlightColor: hexColor });
                                        }}
                                        format="hex"
                                        placement="bottom"
                                        style={{ width: 50, height: 32 }}
                                    />
                                    <Form.Item
                                        name="highlightColor"
                                        style={{ margin: 0, flex: 1 }}
                                        rules={[{ required: true, message: 'Vui lòng chọn màu highlight!' }]}
                                    >
                                        <Input
                                            placeholder="#ff6b6b"
                                            maxLength={7}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.startsWith('#') && value.length === 7) {
                                                    form.setFieldsValue({ highlightColor: value });
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </div>
                            </div>
                        </div>

                        <Form.Item label="Thứ tự hiển thị" name="order" style={{ flex: 1, marginBottom: 8 }}>
                            <Input type="number" placeholder="0" />
                        </Form.Item>
                    </div>

                    <div className={cx('preview-section')}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <h4 style={{ margin: 0 }}>Xem trước nhanh:</h4>
                            <Button type="default" icon={<EyeOutlined />} onClick={handlePreview}>
                                Xem trước đầy đủ
                            </Button>
                        </div>
                        <div className={cx('preview-headline')}>
                            <span style={{ color: form.getFieldValue('textColor') || '#333333' }}>
                                {form.getFieldValue('plainText') || 'Nội dung chính...'}
                            </span>
                            <span
                                style={{
                                    color: form.getFieldValue('highlightColor') || '#ff6b6b',
                                    fontWeight: 'bold',
                                    marginLeft: 8,
                                }}
                            >
                                {form.getFieldValue('dynamicText') || 'Nội dung động...'}
                            </span>
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* Modal Xem trước đầy đủ */}
            <Modal
                title="Xem trước Headline"
                open={isPreviewModalOpen}
                onCancel={() => setIsPreviewModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsPreviewModalOpen(false)}>
                        Đóng
                    </Button>,
                ]}
                width={900}
                centered
            >
                <div className={cx('full-preview-container')}>
                    <div className={cx('animated-headline-preview')}>
                        <h2 style={{ fontSize: '32px', lineHeight: '1.5', margin: 0 }}>
                            <span style={{ color: form.getFieldValue('textColor') || '#333333' }}>
                                {form.getFieldValue('plainText') || 'Nội dung chính...'}
                            </span>
                            <span
                                style={{
                                    color: form.getFieldValue('highlightColor') || '#ff6b6b',
                                    fontWeight: 'bold',
                                    marginLeft: 8,
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                {form.getFieldValue('dynamicText') || 'Nội dung động...'}
                                <svg
                                    style={{
                                        position: 'absolute',
                                        left: '-10%',
                                        top: '-15%',
                                        width: '120%',
                                        height: '130%',
                                        pointerEvents: 'none',
                                        stroke: form.getFieldValue('highlightColor') || '#ff6b6b',
                                        strokeWidth: 3,
                                        fill: 'none',
                                        opacity: 0.7,
                                    }}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 500 150"
                                    preserveAspectRatio="none"
                                >
                                    <path d="M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7"></path>
                                </svg>
                            </span>
                        </h2>
                    </div>
                    <p style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
                        💡 Đây là cách headline sẽ hiển thị trên trang chủ với hiệu ứng vòng tròn.
                    </p>
                </div>
            </Modal>
        </div>
    );
}

export default ManagerHeadline;
