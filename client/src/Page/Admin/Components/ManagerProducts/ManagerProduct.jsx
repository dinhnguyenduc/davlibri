import { Table, Button, Space, Modal, Form, Input, InputNumber, Upload, Select, message } from 'antd';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import ExportButton from '../../../../Components/ExportButton/ExportButton';

import { Editor } from '@tinymce/tinymce-react';

import styles from './ManagerProduct.module.scss';
import classNames from 'classnames/bind';
import {
    requestCreateBook,
    requestGetBooks,
    requestUpdateBook,
    requestUploadImages,
    requestDeleteImage,
    requestDeleteBook,
} from '../../../../config/request';

import { useStore } from '../../../../hooks/useStore';

const cx = classNames.bind(styles);
const { Search } = Input;

function ManagerProduct() {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [editorContent, setEditorContent] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [categories, setCategories] = useState([]);

    const { category } = useStore();

    useEffect(() => {
        setCategories(category);
    }, [category]);

    // Fake data for demonstration
    const [products, setProducts] = useState([]);
    const fetchProducts = async () => {
        const products = await requestGetBooks();
        setProducts(products.metadata);
    };
    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter and sort products based on search keyword
    const filteredProducts = products
        .filter((product) => {
            const matchesSearch =
                product.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchKeyword.toLowerCase()));

            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sắp xếp mặc định theo thời gian mới nhất

    const handleSearch = (value) => {
        setSearchKeyword(value);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        setFileList([]);
        setIsModalOpen(true);
    };

    const handleEdit = (record) => {
        setEditingProduct(record);

        // Ensure all form fields are set correctly
        form.setFieldsValue({
            title: record.title,
            dailyRentalFee: record.dailyRentalFee,
            securityDeposit: record.securityDeposit,
            totalCopies: record.totalCopies,
            availableCopies: record.availableCopies,
            category: record.category,
            description: record.description,
            author: record.author,
            publisher: record.publisher,
            publishingHouse: record.publishingHouse,
            isbn: record.isbn,
            publicationYear: record.publicationYear,
            coverType: record.coverType,
            displayOrder: record.displayOrder && record.displayOrder > 0 ? record.displayOrder : null,
            id: record.id,
        });

        // Set images
        if (record.images) {
            const imageList = Array.isArray(record.images) ? record.images : record.images;

            setFileList(
                imageList.map((img, index) => ({
                    uid: `-${index}`,
                    name: `image-${index}`,
                    status: 'done',
                    url: img,
                })),
            );
        }

        // Set editor content - ensure it's a string
        const descriptionText = typeof record.description === 'string' ? record.description : '';
        setEditorContent(descriptionText);
        setIsModalOpen(true); // Make sure this is being called
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa sách "${record.title}"?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteBook({ id: record._id });
                    await fetchProducts();
                    message.success('Đã xóa sách');
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error(error?.response?.data?.message || 'Lỗi khi xóa sách');
                }
            },
        });
    };

    const handleModalOk = async () => {
        setLoading(true);

        form.validateFields()
            .then(async (values) => {
                try {
                    let imageUrls = [];

                    // Lọc ra ảnh mới (có file gốc) và ảnh cũ (đã có URL)
                    const newImages = fileList.filter((file) => file.originFileObj);
                    const oldImageUrls = fileList
                        .filter((file) => !file.originFileObj && file.url)
                        .map((file) => file.url);

                    // Nếu có ảnh mới → upload
                    if (newImages.length > 0) {
                        const formData = new FormData();
                        newImages.forEach((file) => {
                            formData.append('images', file.originFileObj);
                        });

                        const resImages = await requestUploadImages(formData);

                        // Gộp ảnh cũ và ảnh upload mới
                        imageUrls = [...oldImageUrls, ...(resImages?.metadata || [])];
                    } else {
                        // Chỉ có ảnh cũ
                        imageUrls = [...oldImageUrls];
                    }

                    const data = {
                        ...values,
                        description: editorContent,
                        images: imageUrls,
                    };

                    // Gửi dữ liệu tạo hoặc cập nhật
                    if (editingProduct) {
                        data.id = editingProduct._id;
                        await requestUpdateBook(data);
                    } else {
                        await requestCreateBook(data);
                    }

                    // Làm mới UI
                    await fetchProducts();
                    form.resetFields();
                    setFileList([]);
                    setEditorContent('');
                    message.success(`${editingProduct ? 'Cập nhật' : 'Thêm'} sản phẩm thành công`);
                    setIsModalOpen(false);
                } catch (error) {
                    console.error('Error:', error);
                    console.error('Error response:', error?.response?.data);
                    message.error(
                        error?.response?.data?.message || `Lỗi khi ${editingProduct ? 'cập nhật' : 'thêm'} sản phẩm`,
                    );
                } finally {
                    setLoading(false);
                }
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
                message.error(info?.response?.data?.message || 'Dữ liệu không hợp lệ');
                setLoading(false);
            });
    };

    // Add this useEffect to debug modal state
    useEffect(() => {
        console.log('Modal state:', isModalOpen);
    }, [isModalOpen]);

    const columns = [
        {
            title: 'Ảnh sản phẩm',
            dataIndex: 'images',
            key: 'images',
            render: (images) => (
                <img
                    src={images[0]}
                    alt="Ảnh sản phẩm"
                    style={{ width: '100px', height: '100px', borderRadius: '10px' }}
                />
            ),
        },
        {
            title: 'Tên sách',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            render: (categoryId) => {
                const category = categories.find((cat) => cat._id === categoryId);
                return category ? category.nameCategory : 'N/A';
            },
        },
        {
            title: 'Giá thuê/ngày',
            dataIndex: 'dailyRentalFee',
            key: 'dailyRentalFee',
            render: (dailyRentalFee) => (dailyRentalFee ? `${dailyRentalFee.toLocaleString('vi-VN')} VNĐ/ngày` : 'N/A'),
        },

        {
            title: 'Kho',
            dataIndex: 'stock',
            key: 'stock',
        },
        {
            title: 'Thời gian tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt) => {
                if (!createdAt) return 'N/A';
                const date = new Date(createdAt);
                return date.toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            },
            sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            defaultSortOrder: 'descend',
            width: 150,
        },
        {
            title: 'Thứ tự hiển thị',
            dataIndex: 'displayOrder',
            key: 'displayOrder',
            render: (displayOrder) => (displayOrder && displayOrder > 0 ? displayOrder : 'Mặc định'),
            sorter: (a, b) => (a.displayOrder || 999999) - (b.displayOrder || 999999),
            width: 120,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        Sửa
                    </Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const uploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            return false; // Prevent auto upload
        },
        onChange: (info) => {
            setFileList(info.fileList);
        },
        fileList,
        multiple: true,
    };

    const handleRemoveImage = async (file, id) => {
        const data = {
            id,
            image: file.url,
        };
        await requestDeleteImage(data);
        await fetchProducts();
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2>Quản lý sản phẩm</h2>
                <Space>
                    <ExportButton data={filteredProducts} type="product" buttonText="Export Excel" />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Thêm sản phẩm
                    </Button>
                </Space>
            </div>

            <div className={cx('search-container')} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Search
                        placeholder="Tìm kiếm sản phẩm..."
                        allowClear
                        enterButton
                        size="large"
                        onSearch={handleSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ maxWidth: '500px' }}
                    />
                    <Select
                        size="large"
                        style={{ minWidth: '200px' }}
                        placeholder="Lọc theo danh mục"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                    >
                        <Select.Option value="all">Tất cả danh mục</Select.Option>
                        {categories.map((item) => (
                            <Select.Option key={item._id} value={item._id}>
                                {item.nameCategory}
                            </Select.Option>
                        ))}
                    </Select>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={filteredProducts}
                rowKey="id"
                defaultSortOrder="descend"
                sortDirections={['descend', 'ascend']}
            />

            <Modal
                title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={() => setIsModalOpen(false)}
                width={800}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" className={cx('form')}>
                    <div className={cx('form-row')}>
                        <Form.Item
                            name="title"
                            label="Tên sách"
                            rules={[{ required: true, message: 'Vui lòng nhập tên sách!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="dailyRentalFee"
                            label="Phí thuê mỗi ngày"
                            rules={[{ required: true, message: 'Vui lòng nhập phí thuê!' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/(,*)/g, '')}
                            />
                        </Form.Item>
                    </div>

                    <div className={cx('form-row')}>
                        <Form.Item
                            name="category"
                            label="Danh mục"
                            rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                        >
                            <Select>
                                {categories.map((item) => (
                                    <Select.Option key={item._id} value={item._id}>
                                        {item.nameCategory}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="totalCopies"
                            label="Tổng số bản"
                            rules={[{ required: true, message: 'Vui lòng nhập tổng số bản!' }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                    </div>

                    <div className={cx('form-row')}>
                        <Form.Item
                            name="availableCopies"
                            label="Số bản có sẵn"
                            rules={[{ required: true, message: 'Vui lòng nhập số bản có sẵn!' }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>

                        <Form.Item
                            name="securityDeposit"
                            label="Tiền đặt cọc"
                            rules={[{ required: true, message: 'Vui lòng nhập tiền đặt cọc!' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/(,*)/g, '')}
                            />
                        </Form.Item>
                    </div>

                    <div className={cx('form-row')}>
                        <Form.Item
                            name="isbn"
                            label="Mã ISBN"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã ISBN!' },
                                { pattern: /^[0-9-]+$/, message: 'ISBN chỉ chứa số và dấu gạch ngang!' },
                            ]}
                        >
                            <Input placeholder="VD: 978-604-2-30001-1" />
                        </Form.Item>

                        <Form.Item
                            name="publicationYear"
                            label="Năm xuất bản"
                            rules={[{ required: true, message: 'Vui lòng nhập năm xuất bản!' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={1900}
                                max={new Date().getFullYear()}
                                placeholder="VD: 2023"
                            />
                        </Form.Item>
                    </div>

                    <div className={cx('form-row')}>
                        <Form.Item name="author" label="Tác giả">
                            <Input placeholder="Nhập tên tác giả (không bắt buộc)" />
                        </Form.Item>

                        <Form.Item
                            name="publisher"
                            label="Công ty phát hành"
                            rules={[{ required: true, message: 'Vui lòng nhập công ty phát hành!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </div>

                    <div className={cx('form-row')}>
                        <Form.Item
                            name="publishingHouse"
                            label="Nhà xuất bản"
                            rules={[{ required: true, message: 'Vui lòng nhập nhà xuất bản!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="coverType"
                            label="Loại bìa"
                            rules={[{ required: true, message: 'Vui lòng chọn loại bìa!' }]}
                        >
                            <Select>
                                <Select.Option value="paperback">Bìa mềm</Select.Option>
                                <Select.Option value="hardcover">Bìa cứng</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div className={cx('form-row')}>
                        <Form.Item
                            name="displayOrder"
                            label="Thứ tự hiển thị"
                            tooltip="Số nhỏ hơn sẽ hiển thị trước. Ví dụ: 1, 2, 3... Để trống = mặc định"
                            initialValue={null}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={1}
                                max={999999}
                                placeholder="Nhập thứ tự hiển thị (1-999999)"
                                formatter={(value) => (value ? `${value}` : '')}
                                parser={(value) => (value ? parseInt(value, 10) : null)}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <Editor
                            apiKey="hfm046cu8943idr5fja0r5l2vzk9l8vkj5cp3hx2ka26l84x"
                            init={{
                                plugins:
                                    'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                                toolbar:
                                    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                            }}
                            value={editorContent}
                            onEditorChange={(content, editor) => {
                                setEditorContent(content);
                                form.setFieldsValue({ description: content });
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="images"
                        label="Hình ảnh"
                        rules={[
                            {
                                required: !editingProduct,
                                message: 'Vui lòng tải lên ít nhất 1 hình ảnh!',
                            },
                        ]}
                    >
                        <Upload
                            {...uploadProps}
                            listType="picture-card"
                            onRemove={(file) => {
                                handleRemoveImage(file, editingProduct._id);
                            }}
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Tải ảnh</div>
                            </div>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerProduct;
