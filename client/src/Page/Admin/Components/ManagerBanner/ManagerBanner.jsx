import { Table, Button, Space, Modal, Form, Input, Upload, message, Switch, Tag, Image, Select } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    EyeOutlined,
    DragOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import styles from './ManagerBanner.module.scss';
import classNames from 'classnames/bind';
import {
    requestGetAllBanners,
    requestUploadBannerImage,
    requestCreateBanner,
    requestUpdateBanner,
    requestDeleteBanner,
    requestToggleBannerStatus,
    requestUpdateBannerOrder,
} from '../../../../config/request';

const cx = classNames.bind(styles);
const { TextArea } = Input;

function ManagerBanner() {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [banners, setBanners] = useState([]);
    const [imageUrl, setImageUrl] = useState('');

    // State cho preview position
    const [previewPosition, setPreviewPosition] = useState({
        x: 'center',
        y: 'center',
        size: 'cover',
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageOffset, setImageOffset] = useState({ x: 50, y: 50 }); // % position

    // Fetch banners
    const fetchBanners = async () => {
        try {
            const response = await requestGetAllBanners();
            setBanners(response.metadata);
        } catch (error) {
            console.error('Fetch banners error:', error);
            if (error.response) {
                // Server responded with error
                if (error.response.status === 401) {
                    message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                } else if (error.response.status === 404) {
                    message.error('API không tồn tại. Vui lòng kiểm tra server.');
                } else {
                    message.error(`Lỗi: ${error.response.data.message || 'Không thể tải danh sách banner'}`);
                }
            } else if (error.request) {
                // Request was made but no response
                message.error('Không thể kết nối đến server. Vui lòng kiểm tra server có đang chạy không.');
            } else {
                message.error('Lỗi khi tải danh sách banner');
            }
        }
    };

    useEffect(() => {
        fetchBanners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle upload image
    const handleUploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await requestUploadBannerImage(formData);
            setImageUrl(response.metadata.url);
            setFileList([
                {
                    uid: '-1',
                    name: file.name,
                    status: 'done',
                    url: response.metadata.url,
                },
            ]);
            message.success('Upload ảnh thành công');
            return false; // Prevent default upload behavior
        } catch (error) {
            console.error('Upload error:', error);
            message.error('Lỗi khi upload ảnh');
            return false;
        }
    };

    // Handle add banner
    const handleAdd = () => {
        setEditingBanner(null);
        form.resetFields();
        setFileList([]);
        setImageUrl('');
        setPreviewPosition({ x: 'center', y: 'center', size: '100% 100%' });
        setImageOffset({ x: 50, y: 50 });
        setIsModalOpen(true);
    };

    // Handle edit banner
    const handleEdit = (record) => {
        setEditingBanner(record);
        form.setFieldsValue({
            title: record.title,
            subtitle: record.subtitle,
            description: record.description,
            link: record.link,
            buttonText: record.buttonText,
            features: record.features.join('\n'),
            backgroundColor: record.backgroundColor,
            textColor: record.textColor,
            order: record.order,
            imagePositionX: record.imagePositionX || 'center',
            imagePositionY: record.imagePositionY || 'center',
            imageSize: record.imageSize || 'cover',
            showTitle: record.showTitle !== undefined ? record.showTitle : true,
        });
        setImageUrl(record.image);
        setPreviewPosition({
            x: record.imagePositionX || 'center',
            y: record.imagePositionY || 'center',
            size: record.imageSize || 'cover',
        });
        // Sử dụng imageOffsetX và imageOffsetY nếu có, nếu không thì convert từ position
        const xOffset =
            record.imageOffsetX !== undefined
                ? record.imageOffsetX
                : record.imagePositionX === 'left'
                ? 0
                : record.imagePositionX === 'right'
                ? 100
                : 50;
        const yOffset =
            record.imageOffsetY !== undefined
                ? record.imageOffsetY
                : record.imagePositionY === 'top'
                ? 0
                : record.imagePositionY === 'bottom'
                ? 100
                : 50;
        setImageOffset({ x: xOffset, y: yOffset });
        setFileList([
            {
                uid: '-1',
                name: 'banner-image',
                status: 'done',
                url: record.image,
            },
        ]);
        setIsModalOpen(true);
    };

    // Handle preview position change from form
    const handlePositionChange = () => {
        const x = form.getFieldValue('imagePositionX') || 'center';
        const y = form.getFieldValue('imagePositionY') || 'center';
        const size = form.getFieldValue('imageSize') || '100% 100%';
        setPreviewPosition({ x, y, size });

        // Update offset based on position
        const xOffset = x === 'left' ? 0 : x === 'right' ? 100 : 50;
        const yOffset = y === 'top' ? 0 : y === 'bottom' ? 100 : 50;
        setImageOffset({ x: xOffset, y: yOffset });
    };

    // Handle mouse drag on preview
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        setImageOffset({ x: clampedX, y: clampedY });

        // Update form values based on offset
        const posX = clampedX < 33 ? 'left' : clampedX > 66 ? 'right' : 'center';
        const posY = clampedY < 33 ? 'top' : clampedY > 66 ? 'bottom' : 'center';

        form.setFieldsValue({
            imagePositionX: posX,
            imagePositionY: posY,
        });

        setPreviewPosition({
            x: posX,
            y: posY,
            size: form.getFieldValue('imageSize') || 'cover',
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Add global mouse up listener
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            return () => window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isDragging]);

    // Handle delete banner
    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa banner "${record.title}"?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteBanner(record._id);
                    message.success('Đã xóa banner');
                    fetchBanners();
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error('Lỗi khi xóa banner');
                }
            },
        });
    };

    // Handle toggle status
    const handleToggleStatus = async (record) => {
        try {
            await requestToggleBannerStatus(record._id);
            message.success(`${record.isActive ? 'Đã ẩn' : 'Đã kích hoạt'} banner`);
            fetchBanners();
        } catch (error) {
            console.error('Toggle status error:', error);
            message.error('Lỗi khi thay đổi trạng thái');
        }
    };

    // Handle submit form
    const handleModalOk = async () => {
        setLoading(true);
        try {
            const values = await form.validateFields();

            // Parse features from textarea
            const featuresArray = values.features
                ? values.features
                      .split('\n')
                      .filter((f) => f.trim())
                      .map((f) => f.trim())
                : [];

            const bannerData = {
                title: values.title,
                subtitle: values.subtitle,
                description: values.description,
                image: imageUrl,
                link: values.link || '#',
                buttonText: values.buttonText || 'Xem thêm',
                features: featuresArray,
                backgroundColor: values.backgroundColor || '#f8f9fa',
                textColor: values.textColor || '#333333',
                order: values.order || 0,
                imagePositionX: values.imagePositionX || 'center',
                imagePositionY: values.imagePositionY || 'center',
                imageSize: values.imageSize || 'cover',
                imageOffsetX: Math.round(imageOffset.x), // Lưu vị trí chính xác
                imageOffsetY: Math.round(imageOffset.y), // Lưu vị trí chính xác
                showTitle: values.showTitle !== undefined ? values.showTitle : true,
            };

            if (!bannerData.image) {
                message.error('Vui lòng upload hình ảnh banner');
                setLoading(false);
                return;
            }

            if (editingBanner) {
                // Update banner
                await requestUpdateBanner(editingBanner._id, bannerData);
                message.success('Cập nhật banner thành công');
            } else {
                // Create new banner
                await requestCreateBanner(bannerData);
                message.success('Tạo banner thành công');
            }

            setIsModalOpen(false);
            form.resetFields();
            setFileList([]);
            setImageUrl('');
            fetchBanners();
        } catch (error) {
            console.error('Submit error:', error);
            message.error(editingBanner ? 'Lỗi khi cập nhật banner' : 'Lỗi khi tạo banner');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image',
            key: 'image',
            width: 120,
            render: (image) => (
                <Image src={image} alt="banner" style={{ width: 100, height: 60, objectFit: 'cover' }} />
            ),
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            width: 200,
        },
        {
            title: 'Phụ đề',
            dataIndex: 'subtitle',
            key: 'subtitle',
            width: 150,
        },
        {
            title: 'Link',
            dataIndex: 'link',
            key: 'link',
            width: 150,
            render: (link) => (
                <a href={link} target="_blank" rel="noopener noreferrer">
                    {link}
                </a>
            ),
        },
        {
            title: 'Thứ tự',
            dataIndex: 'order',
            key: 'order',
            width: 80,
            sorter: (a, b) => a.order - b.order,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 120,
            render: (isActive, record) => <Switch checked={isActive} onChange={() => handleToggleStatus(record)} />,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small">
                        Sửa
                    </Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} size="small">
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className={cx('manager-banner')}>
            <div className={cx('header')}>
                <h1>Quản lý Banner</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                    Thêm Banner
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={banners}
                rowKey="_id"
                scroll={{ x: 1200 }}
                pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Tổng ${total} banner`,
                }}
            />

            <Modal
                title={editingBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setFileList([]);
                    setImageUrl('');
                }}
                width={800}
                confirmLoading={loading}
                okText={editingBanner ? 'Cập nhật' : 'Tạo mới'}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" className={cx('banner-form')}>
                    <Form.Item
                        label="Tiêu đề"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input placeholder="Nhập tiêu đề banner" />
                    </Form.Item>

                    <Form.Item
                        label="Hiển thị tiêu đề"
                        name="showTitle"
                        valuePropName="checked"
                        initialValue={false}
                        tooltip="Bật/tắt hiển thị tiêu đề trên banner"
                    >
                        <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                    </Form.Item>

                    <Form.Item label="Phụ đề" name="subtitle">
                        <Input placeholder="Nhập phụ đề (không bắt buộc)" />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <TextArea rows={3} placeholder="Nhập mô tả banner (không bắt buộc)" />
                    </Form.Item>

                    <Form.Item label="Hình ảnh Banner" required tooltip="Kích thước khuyến nghị: 1920x600px">
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            beforeUpload={handleUploadImage}
                            onRemove={() => {
                                setFileList([]);
                                setImageUrl('');
                            }}
                            maxCount={1}
                        >
                            {fileList.length === 0 && (
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item label="Tính năng nổi bật" name="features" tooltip="Mỗi tính năng một dòng">
                        <TextArea
                            rows={4}
                            placeholder="Thuê sách không giới hạn&#10;Tặng 60 ngày thuê&#10;..."
                        />
                    </Form.Item>

                    <Form.Item label="Link chuyển hướng" name="link">
                        <Input placeholder="/products hoặc https://..." />
                    </Form.Item>

                    {/* Phần điều chỉnh vị trí ảnh */}
                    <div style={{ marginTop: 20, marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 12, fontWeight: 600 }}>Điều chỉnh vị trí hiển thị ảnh</h4>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Form.Item
                                label="Vị trí ngang"
                                name="imagePositionX"
                                style={{ flex: 1 }}
                                tooltip="Chọn phần nào của ảnh sẽ hiển thị theo chiều ngang"
                                initialValue="center"
                            >
                                <Select placeholder="Chọn vị trí ngang" onChange={handlePositionChange}>
                                    <Select.Option value="left">Trái</Select.Option>
                                    <Select.Option value="center">Giữa</Select.Option>
                                    <Select.Option value="right">Phải</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Vị trí dọc"
                                name="imagePositionY"
                                style={{ flex: 1 }}
                                tooltip="Chọn phần nào của ảnh sẽ hiển thị theo chiều dọc"
                                initialValue="center"
                            >
                                <Select placeholder="Chọn vị trí dọc" onChange={handlePositionChange}>
                                    <Select.Option value="top">Trên</Select.Option>
                                    <Select.Option value="center">Giữa</Select.Option>
                                    <Select.Option value="bottom">Dưới</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Kích thước ảnh"
                                name="imageSize"
                                style={{ flex: 1 }}
                                tooltip="Cách ảnh được hiển thị trong banner"
                                initialValue="100% 100%"
                            >
                                <Select placeholder="Chọn cách hiển thị" onChange={handlePositionChange}>
                                    <Select.Option value="100% 100%">Co giãn phủ kín (Không cắt)</Select.Option>
                                    <Select.Option value="contain">Vừa khung (Giữ tỷ lệ)</Select.Option>
                                    <Select.Option value="cover">Phủ kín (Có thể cắt)</Select.Option>
                                    <Select.Option value="auto">Kích thước gốc</Select.Option>
                                </Select>
                            </Form.Item>
                        </div>

                        {/* Preview ảnh với vị trí đã chọn - Interactive */}
                        {imageUrl && (
                            <div style={{ marginTop: 16 }}>
                                <p style={{ fontWeight: 600, marginBottom: 8 }}>
                                    Xem trước (Kéo chuột để điều chỉnh vị trí):
                                </p>
                                <div
                                    style={{
                                        width: '100%',
                                        height: '400px',
                                        border: '2px solid #1890ff',
                                        borderRadius: '0',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                        backgroundColor: form.getFieldValue('backgroundColor') || '#f6ecdd',
                                        backgroundImage: `url(${imageUrl})`,
                                        backgroundPosition: `${imageOffset.x}% ${imageOffset.y}%`,
                                        backgroundSize: previewPosition.size,
                                        backgroundRepeat: 'no-repeat',
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                >
                                    {/* Crosshair indicator */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: `${imageOffset.x}%`,
                                            top: `${imageOffset.y}%`,
                                            width: '20px',
                                            height: '20px',
                                            transform: 'translate(-50%, -50%)',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'absolute',
                                                width: '2px',
                                                height: '20px',
                                                backgroundColor: 'red',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                width: '20px',
                                                height: '2px',
                                                backgroundColor: 'red',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                            }}
                                        />
                                    </div>
                                </div>
                                <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                                    💡 Kéo chuột trong khung xem trước để điều chỉnh vị trí hiển thị chính xác. Dấu thập
                                    đỏ hiển thị điểm neo của ảnh. Preview tỷ lệ 1:1 với banner thực tế.
                                </p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item label="Màu nền" name="backgroundColor" style={{ flex: 1 }}>
                            <Input type="color" onChange={handlePositionChange} />
                        </Form.Item>

                        <Form.Item label="Màu chữ" name="textColor" style={{ flex: 1 }}>
                            <Input type="color" />
                        </Form.Item>

                        <Form.Item label="Thứ tự hiển thị" name="order" style={{ flex: 1 }}>
                            <Input type="number" placeholder="0" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerBanner;
