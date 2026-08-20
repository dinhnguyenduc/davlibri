import { useEffect, useState } from 'react';
import { Table, InputNumber, Button, message, Card, Space, Switch, Divider } from 'antd';
import { SaveOutlined, DollarOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerDeposit.module.scss';
import {
    requestGetCategory,
    requestUpdateCategoryDeposit,
    requestGetGlobalDeposit,
    requestUpdateGlobalDeposit,
} from '../../../../config/request';

const cx = classNames.bind(styles);

function ManagerDeposit() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalDeposit, setGlobalDeposit] = useState(50000);
    const [useGlobalDeposit, setUseGlobalDeposit] = useState(true);
    const [tempDeposits, setTempDeposits] = useState({});

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await requestGetCategory();
            setCategories(res.metadata);
            // Khởi tạo tempDeposits
            const deposits = {};
            res.metadata.forEach((cat) => {
                deposits[cat._id] = cat.deposit || 50000;
            });
            setTempDeposits(deposits);
        } catch (error) {
            message.error('Lỗi khi tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalDeposit = async () => {
        try {
            const res = await requestGetGlobalDeposit();
            if (res.metadata) {
                setGlobalDeposit(res.metadata.globalDeposit || 50000);
                setUseGlobalDeposit(res.metadata.useGlobalDeposit !== false);
            }
        } catch (error) {
            console.log('Chưa có cấu hình global deposit');
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchGlobalDeposit();
    }, []);

    const handleDepositChange = (categoryId, value) => {
        setTempDeposits((prev) => ({
            ...prev,
            [categoryId]: value,
        }));
    };

    const handleSaveDeposit = async (categoryId) => {
        try {
            await requestUpdateCategoryDeposit({
                categoryId,
                deposit: tempDeposits[categoryId],
            });
            message.success('Cập nhật tiền cọc thành công');
            fetchCategories();
        } catch (error) {
            message.error('Lỗi khi cập nhật tiền cọc');
        }
    };

    const handleSaveGlobalDeposit = async () => {
        try {
            await requestUpdateGlobalDeposit({
                globalDeposit,
                useGlobalDeposit,
            });
            message.success('Cập nhật tiền cọc chung thành công');
        } catch (error) {
            message.error('Lỗi khi cập nhật tiền cọc chung');
        }
    };

    const columns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'nameCategory',
            key: 'nameCategory',
            width: '40%',
        },
        {
            title: 'Số sản phẩm',
            dataIndex: 'products',
            key: 'products',
            width: '20%',
            render: (products) => products?.length || 0,
        },
        {
            title: 'Tiền cọc (đ)',
            key: 'deposit',
            width: '25%',
            render: (_, record) => (
                <InputNumber
                    min={0}
                    step={10000}
                    value={tempDeposits[record._id] || 50000}
                    onChange={(value) => handleDepositChange(record._id, value)}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: '100%' }}
                    disabled={useGlobalDeposit}
                />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '15%',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => handleSaveDeposit(record._id)}
                    disabled={useGlobalDeposit}
                >
                    Lưu
                </Button>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <h2 className={cx('title')}>Quản lý tiền cọc</h2>

            {/* Cấu hình tiền cọc chung */}
            <Card
                title={
                    <Space>
                        <DollarOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <span>Cấu hình tiền cọc chung</span>
                    </Space>
                }
                className={cx('global-card')}
                style={{ marginBottom: '24px' }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ minWidth: '180px' }}>Sử dụng tiền cọc chung:</span>
                        <Switch
                            checked={useGlobalDeposit}
                            onChange={setUseGlobalDeposit}
                            checkedChildren="Bật"
                            unCheckedChildren="Tắt"
                        />
                        <span className={cx('hint')}>
                            {useGlobalDeposit
                                ? '(Tất cả danh mục sẽ dùng chung một mức tiền cọc)'
                                : '(Mỗi danh mục có thể đặt tiền cọc riêng)'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ minWidth: '180px' }}>Tiền cọc chung:</span>
                        <InputNumber
                            min={0}
                            step={10000}
                            value={globalDeposit}
                            onChange={setGlobalDeposit}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            style={{ width: '300px' }}
                            addonAfter="đ"
                        />
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveGlobalDeposit} size="large">
                            Lưu cấu hình chung
                        </Button>
                    </div>

                    <div className={cx('info-box')}>
                        <strong>Lưu ý:</strong>
                        <ul>
                            <li>Nếu bật "Sử dụng tiền cọc chung", tất cả sản phẩm sẽ dùng cùng một mức tiền cọc</li>
                            <li>Nếu tắt, bạn có thể đặt tiền cọc riêng cho từng danh mục ở bảng bên dưới</li>
                            <li>Tiền cọc sẽ được hoàn lại cho khách hàng khi trả sách</li>
                        </ul>
                    </div>
                </Space>
            </Card>

            <Divider />

            {/* Bảng tiền cọc theo danh mục */}
            <Card title="Tiền cọc theo danh mục" className={cx('category-card')}>
                <Table
                    columns={columns}
                    dataSource={categories}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} danh mục`,
                    }}
                />
            </Card>
        </div>
    );
}

export default ManagerDeposit;
