import { useEffect, useState } from 'react';
import { Table, Space, Button, message, Popconfirm, Modal, Form, Select, Input, Switch, Radio, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerUser.module.scss';
import ExportButton from '../../../../Components/ExportButton/ExportButton';
import {
    requestGetUsers,
    requestUpdateRoleUser,
    requestCreateUserByAdmin,
    requestDeleteUser,
    requestResetUserPasswordByAdmin,
} from '../../../../config/request';

const cx = classNames.bind(styles);

function ManagerUser() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [editForm] = Form.useForm();
    const [addForm] = Form.useForm();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await requestGetUsers();
            setUsers(Array.isArray(res?.metadata) ? res.metadata : []);
        } catch {
            setUsers([]);
            message.error('Lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        const searchValue = searchText.trim().toLowerCase();
        const matchesSearch =
            !searchValue ||
            [user.fullName, user.email, user.phone, user.address]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(searchValue));
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    // Xử lý sửa quyền user
    const handleEditUser = (user) => {
        setSelectedUser(user);
        editForm.setFieldsValue({
            userId: user._id,
            role: user.role === 'admin' ? '1' : user.role === 'librarian' ? 'librarian' : '0',
            permissions: user.permissions || [],
            resetPasswordEnabled: false,
            resetMode: 'auto',
            requirePasswordChange: true,
            newPassword: undefined,
        });
        setIsEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        setSelectedUser(null);
        editForm.resetFields();
    };

    const handleEditOk = () => {
        editForm.submit();
    };

    const handleEditFinish = async (values) => {
        try {
            await requestUpdateRoleUser({
                userId: values.userId,
                role: values.role,
                permissions: values.permissions,
            });

            if (values.resetPasswordEnabled) {
                const resetRes = await requestResetUserPasswordByAdmin({
                    userId: values.userId,
                    resetMode: values.resetMode,
                    newPassword: values.resetMode === 'manual' ? values.newPassword : undefined,
                    requirePasswordChange: values.requirePasswordChange,
                });

                Modal.success({
                    title: 'Reset mật khẩu thành công',
                    content: (
                        <div className={cx('reset-password-result')}>
                            <div className={cx('reset-password-email')}>
                                Mật khẩu mới của:{' '}
                                <Typography.Text strong>
                                    {resetRes?.metadata?.email || selectedUser?.email || 'tài khoản đã chọn'}
                                </Typography.Text>
                            </div>
                            <Typography.Text copyable strong className={cx('generated-password')}>
                                {resetRes?.metadata?.generatedPassword}
                            </Typography.Text>
                            <p className={cx('reset-password-note')}>
                                {values.requirePasswordChange
                                    ? 'Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.'
                                    : 'Người dùng không bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.'}
                            </p>
                        </div>
                    ),
                });
            }

            await fetchUsers();
            message.success('Cập nhật quyền người dùng thành công');
            setIsEditModalVisible(false);
            editForm.resetFields();
        } catch {
            message.error('Lỗi khi cập nhật quyền người dùng');
        }
    };

    // Xử lý thêm user mới
    const handleAddUser = () => {
        setIsAddModalVisible(true);
    };

    const handleAddCancel = () => {
        setIsAddModalVisible(false);
        addForm.resetFields();
    };

    const handleAddOk = () => {
        addForm.submit();
    };

    const handleAddFinish = async (values) => {
        try {
            await requestCreateUserByAdmin(values);
            await fetchUsers();
            message.success('Thêm người dùng thành công');
            setIsAddModalVisible(false);
            addForm.resetFields();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi thêm người dùng');
        }
    };

    // Xử lý xóa user
    const handleDeleteUser = async (userId, userName) => {
        try {
            await requestDeleteUser(userId);
            await fetchUsers();
            message.success(`Đã xóa người dùng ${userName}`);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi xóa người dùng');
        }
    };

    const columns = [
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            sorter: (a, b) => a.fullName.localeCompare(b.fullName),
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
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (address) => address || 'Chưa cập nhật',
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role, record) => {
                let roleText = 'Người dùng';
                let color = 'default';

                if (role === 'admin') {
                    roleText = 'Quản trị viên';
                    color = 'red';
                } else if (role === 'librarian') {
                    roleText = 'Thủ thư';
                    color = 'blue';
                }

                return (
                    <Space direction="vertical" size="small">
                        <span style={{ color: color === 'red' ? '#ff4d4f' : color === 'blue' ? '#1890ff' : '#000' }}>
                            {roleText}
                        </span>
                        {role === 'librarian' && record.permissions && record.permissions.length > 0 && (
                            <div style={{ fontSize: '11px', color: '#666' }}>
                                {record.permissions
                                    .map((p) => {
                                        const permMap = {
                                            manage_categories: 'Danh mục',
                                            manage_products: 'Sản phẩm',
                                            manage_coupons: 'Mã giảm giá',
                                            manage_deposits: 'Đặt cọc',
                                            manage_orders: 'Đơn hàng',
                                        };
                                        return permMap[p];
                                    })
                                    .join(', ')}
                            </div>
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditUser(record)}
                        className={cx('edit-btn')}
                    >
                        Sửa quyền
                    </Button>
                    <Popconfirm
                        title="Xóa người dùng"
                        description={`Bạn có chắc muốn xóa người dùng "${record.fullName}"?`}
                        onConfirm={() => handleDeleteUser(record._id, record.fullName)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />} className={cx('delete-btn')}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2 className={cx('title')}>Quản lý người dùng</h2>
                <Space>
                    <ExportButton data={filteredUsers} type="user" buttonText="Export Excel" />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddUser}
                        size="large"
                        className={cx('add-btn')}
                    >
                        Thêm người dùng
                    </Button>
                </Space>
            </div>

            <div className={cx('filters')}>
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Tìm theo họ tên, email, số điện thoại hoặc địa chỉ"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                />
                <Select
                    value={roleFilter}
                    onChange={setRoleFilter}
                    aria-label="Lọc theo vai trò"
                    options={[
                        { value: 'all', label: 'Tất cả vai trò' },
                        { value: 'admin', label: 'Quản trị viên' },
                        { value: 'librarian', label: 'Thủ thư' },
                        { value: 'user', label: 'Người dùng' },
                    ]}
                />
                <span className={cx('result-count')}>
                    Hiển thị {filteredUsers.length}/{users.length} người dùng
                </span>
            </div>

            <Table
                columns={columns}
                dataSource={filteredUsers}
                rowKey="_id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng số ${total} người dùng`,
                }}
            />

            {/* Modal sửa quyền */}
            <Modal
                title="Chỉnh sửa quyền người dùng"
                open={isEditModalVisible}
                onOk={handleEditOk}
                onCancel={handleEditCancel}
                okText="Cập nhật"
                cancelText="Hủy"
                className={cx('permission-modal')}
            >
                {selectedUser && (
                    <div className={cx('user-info')}>
                        <p>
                            <strong>Họ và tên:</strong> {selectedUser.fullName}
                        </p>
                        <p>
                            <strong>Email:</strong> {selectedUser.email}
                        </p>
                    </div>
                )}
                <Form form={editForm} layout="vertical" onFinish={handleEditFinish}>
                    <Form.Item name="userId" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                    >
                        <Select
                            onChange={(value) => {
                                if (value !== 'librarian') {
                                    editForm.setFieldsValue({ permissions: [] });
                                }
                            }}
                        >
                            <Select.Option value="0">Người dùng</Select.Option>
                            <Select.Option value="librarian">Thủ thư</Select.Option>
                            <Select.Option value="1">Quản trị viên</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('role') === 'librarian' ? (
                                <Form.Item
                                    name="permissions"
                                    label="Quyền hạn"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng chọn ít nhất một quyền!',
                                            type: 'array',
                                            min: 1,
                                        },
                                    ]}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Chọn quyền cho thủ thư"
                                        options={[
                                            { label: 'Quản lý danh mục', value: 'manage_categories' },
                                            { label: 'Quản lý sản phẩm', value: 'manage_products' },
                                            { label: 'Quản lý mã giảm giá', value: 'manage_coupons' },
                                            { label: 'Quản lý đặt cọc', value: 'manage_deposits' },
                                            { label: 'Quản lý đơn hàng', value: 'manage_orders' },
                                        ]}
                                    />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    <Form.Item name="resetPasswordEnabled" label="Reset mật khẩu" valuePropName="checked">
                        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.resetPasswordEnabled !== currentValues.resetPasswordEnabled ||
                            prevValues.resetMode !== currentValues.resetMode
                        }
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('resetPasswordEnabled') ? (
                                <>
                                    <Form.Item name="resetMode" label="Cách tạo mật khẩu mới" initialValue="auto">
                                        <Radio.Group>
                                            <Radio value="auto">Tự động tạo mật khẩu</Radio>
                                            <Radio value="manual">Tự nhập mật khẩu</Radio>
                                        </Radio.Group>
                                    </Form.Item>

                                    {getFieldValue('resetMode') === 'manual' && (
                                        <Form.Item
                                            name="newPassword"
                                            label="Mật khẩu mới"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                                            ]}
                                        >
                                            <Input.Password placeholder="Nhập mật khẩu mới" />
                                        </Form.Item>
                                    )}

                                    <Form.Item
                                        name="requirePasswordChange"
                                        label="Yêu cầu người dùng đổi mật khẩu khi đăng nhập lần đầu"
                                        valuePropName="checked"
                                        initialValue
                                    >
                                        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                                    </Form.Item>
                                </>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal thêm user mới */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserAddOutlined />
                        <span>Thêm người dùng mới</span>
                    </div>
                }
                open={isAddModalVisible}
                onOk={handleAddOk}
                onCancel={handleAddCancel}
                okText="Thêm"
                cancelText="Hủy"
                width={600}
                className={cx('add-user-modal')}
            >
                <Form form={addForm} layout="vertical" onFinish={handleAddFinish}>
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[
                            { required: true, message: 'Vui lòng nhập họ tên!' },
                            { min: 3, message: 'Họ tên phải có ít nhất 3 ký tự!' },
                        ]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const role = getFieldValue('role');
                                    if (
                                        !value ||
                                        role === 'admin' ||
                                        /^[A-Za-z][A-Za-z._-]*@[A-Za-z.-]+\.[A-Za-z]{2,}$/.test(value)
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error('Tài khoản user/thủ thư chỉ dùng chữ không dấu và không được có số.'),
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input placeholder="email@dav.edu.vn" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                        ]}
                    >
                        <Input.Password placeholder="Mật khẩu (tối thiểu 6 ký tự)" />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại!' },
                            {
                                pattern: /^[0-9]{10,11}$/,
                                message: 'Số điện thoại phải có 10-11 số!',
                            },
                        ]}
                    >
                        <Input placeholder="0901234567" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                        initialValue="user"
                    >
                        <Select
                            onChange={(value) => {
                                if (value !== 'librarian') {
                                    addForm.setFieldsValue({ permissions: [] });
                                }
                            }}
                        >
                            <Select.Option value="user">Người dùng</Select.Option>
                            <Select.Option value="librarian">Thủ thư</Select.Option>
                            <Select.Option value="admin">Quản trị viên</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('role') === 'librarian' ? (
                                <Form.Item
                                    name="permissions"
                                    label="Quyền hạn"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng chọn ít nhất một quyền!',
                                            type: 'array',
                                            min: 1,
                                        },
                                    ]}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Chọn quyền cho thủ thư"
                                        options={[
                                            { label: 'Quản lý danh mục', value: 'manage_categories' },
                                            { label: 'Quản lý sản phẩm', value: 'manage_products' },
                                            { label: 'Quản lý mã giảm giá', value: 'manage_coupons' },
                                            { label: 'Quản lý đặt cọc', value: 'manage_deposits' },
                                            { label: 'Quản lý đơn hàng', value: 'manage_orders' },
                                        ]}
                                    />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerUser;
