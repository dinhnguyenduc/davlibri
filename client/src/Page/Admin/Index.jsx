import classNames from 'classnames/bind';
import styles from './Index.module.scss';
import { Layout, Menu, theme, Dropdown, Avatar, Badge } from 'antd';
import {
    HomeOutlined,
    ShoppingOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    FileOutlined,
    GiftFilled,
    TagsOutlined,
    RobotOutlined,
    SettingOutlined,
    CustomerServiceOutlined,
    PictureOutlined,
    DashboardOutlined,
    BookOutlined,
    MoneyCollectOutlined,
    TeamOutlined,
    MessageOutlined,
    LayoutOutlined,
    DatabaseOutlined,
    DollarOutlined,
    CommentOutlined,
    LockOutlined,
    MailOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useStore } from '../../hooks/useStore';

import ManagerProduct from './Components/ManagerProducts/ManagerProduct';
import DashBoard from './Components/DashBoard/DashBoard';
import ManagerCategory from './Components/ManagerCategory/ManagerCategory';
import ManagerOrder from './Components/ManagerOrder/ManagerOrder';
import ManagerUser from './Components/ManagerUser/ManagerUser';
import ManagerDeposit from './Components/ManagerDeposit/ManagerDeposit';
import ManagerCoupon from './Components/ManagerCoupon/ManagerCoupon';
import ManagerFAQ from './Components/ManagerFAQ/ManagerFAQ';
import ManagerChatbotConfig from './Components/ManagerChatbotConfig/ManagerChatbotConfig';
import ManagerLiveChat from './Components/ManagerLiveChat/ManagerLiveChat';
import ManagerBanner from './Components/ManagerBanner/ManagerBanner';
import ManagerHeadline from './Components/ManagerHeadline/ManagerHeadline';
import ManagerPolicy from './Components/ManagerPolicy/ManagerPolicy';
import DataSeeder from './Components/DataSeeder/DataSeeder';
import LoginAttemptConfig from './Components/LoginAttemptConfig/LoginAttemptConfig';
import EmailConfig from './Components/EmailConfig/EmailConfig';
// import { requestAdmin } from '../../config/request';
import { useNavigate } from 'react-router-dom';
import { requestAdmin } from '../../config/request';
const { Header, Sider, Content } = Layout;
const cx = classNames.bind(styles);

function Admin() {
    const [collapsed, setCollapsed] = useState(false);
    const { token } = theme.useToken();
    const [selectedKey, setSelectedKey] = useState('home');
    const [openKeys, setOpenKeys] = useState([]);
    const [sidebarWidth, setSidebarWidth] = useState(250); // Default width
    const [isResizing, setIsResizing] = useState(false);
    const { dataUser } = useStore();

    const navigate = useNavigate();

    const handleOpenChange = (keys) => {
        setOpenKeys(keys);
    };

    // Resize handlers
    const handleMouseDown = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isResizing) return;

        const windowWidth = window.innerWidth;
        const minWidth = windowWidth * 0.1; // 1/10 khung hình
        const maxWidth = windowWidth * 0.2; // 1/5 khung hình
        const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);

        setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };

    // Add global mouse events
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Update width on window resize
    useEffect(() => {
        const handleWindowResize = () => {
            const windowWidth = window.innerWidth;
            const minWidth = windowWidth * 0.1;
            const maxWidth = windowWidth * 0.2;

            if (sidebarWidth < minWidth) setSidebarWidth(minWidth);
            if (sidebarWidth > maxWidth) setSidebarWidth(maxWidth);
        };

        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, [sidebarWidth]);

    const handleLogout = async () => {
        try {
            const { requestLogout } = await import('../../config/request');
            await requestLogout();
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                await requestAdmin();
            } catch (error) {
                navigate('/');
            }
        };
        checkAdmin();
    }, []);

    const menuItems = [
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: 'Bảng điều khiển',
        },
        {
            type: 'divider',
        },
        {
            key: 'interface',
            icon: <LayoutOutlined />,
            label: 'Giao diện Website',
            children: [
                {
                    key: 'banner',
                    icon: <PictureOutlined />,
                    label: 'Banner Slider',
                },
                {
                    key: 'headline',
                    icon: <FileOutlined />,
                    label: 'Tiêu đề động',
                },
                {
                    key: 'policy',
                    icon: <TagsOutlined />,
                    label: 'Chính sách dịch vụ',
                },
            ],
        },
        {
            key: 'catalog',
            icon: <DatabaseOutlined />,
            label: 'Quản lý Kho sách',
            children: [
                {
                    key: 'products',
                    icon: <BookOutlined />,
                    label: 'Kho sách',
                },
                {
                    key: 'category',
                    icon: <FileOutlined />,
                    label: 'Danh mục',
                },
            ],
        },
        {
            key: 'business',
            icon: <DollarOutlined />,
            label: 'Kinh doanh',
            children: [
                {
                    key: 'order',
                    icon: <ShoppingOutlined />,
                    label: 'Đơn hàng',
                },
                {
                    key: 'deposit',
                    icon: <GiftFilled />,
                    label: 'Đặt cọc',
                },
                {
                    key: 'coupon',
                    icon: <TagsOutlined />,
                    label: 'Khuyến mãi',
                },
            ],
        },
        {
            key: 'customer',
            icon: <TeamOutlined />,
            label: 'Khách hàng',
            children: [
                {
                    key: 'users',
                    icon: <UserOutlined />,
                    label: 'Tài khoản',
                },
                {
                    key: 'live-chat',
                    icon: <CustomerServiceOutlined />,
                    label: 'Hỗ trợ trực tiếp',
                },
            ],
        },
        {
            key: 'ai',
            icon: <CommentOutlined />,
            label: 'AI & Chatbot',
            children: [
                {
                    key: 'faq',
                    icon: <RobotOutlined />,
                    label: 'FAQ & Chatbot',
                },
                {
                    key: 'chatbot-config',
                    icon: <SettingOutlined />,
                    label: 'Cấu hình AI',
                },
            ],
        },
        {
            key: 'tools',
            icon: <DatabaseOutlined />,
            label: 'Công cụ',
            children: [
                {
                    key: 'data-seeder',
                    icon: <DatabaseOutlined />,
                    label: 'Dữ liệu giả lập',
                },
                {
                    key: 'login-attempt-config',
                    icon: <LockOutlined />,
                    label: 'Giới hạn đăng nhập',
                },
                {
                    key: 'email-config',
                    icon: <MailOutlined />,
                    label: 'Cấu hình Email',
                },
            ],
        },
    ];

    const renderContent = () => {
        switch (selectedKey) {
            case 'products':
                return <ManagerProduct />;
            case 'home':
                return <DashBoard />;
            case 'banner':
                return <ManagerBanner />;
            case 'headline':
                return <ManagerHeadline />;
            case 'policy':
                return <ManagerPolicy />;
            case 'category':
                return <ManagerCategory />;
            case 'coupon':
                return <ManagerCoupon />;
            case 'deposit':
                return <ManagerDeposit />;
            case 'order':
                return <ManagerOrder />;
            case 'users':
                return <ManagerUser />;
            case 'live-chat':
                return <ManagerLiveChat />;
            case 'faq':
                return <ManagerFAQ />;
            case 'chatbot-config':
                return <ManagerChatbotConfig />;
            case 'data-seeder':
                return <DataSeeder />;
            case 'login-attempt-config':
                return <LoginAttemptConfig />;
            case 'email-config':
                return <EmailConfig />;
            default:
                return <ManagerUser />;
        }
    };

    return (
        <Layout
            className={cx('wrapper')}
            style={{
                cursor: isResizing ? 'col-resize' : 'default',
                userSelect: isResizing ? 'none' : 'auto',
            }}
        >
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                width={collapsed ? 80 : sidebarWidth}
                collapsedWidth={80}
                style={{
                    background: '#001529',
                    position: 'relative',
                    transition: collapsed ? 'all 0.2s' : 'none',
                }}
            >
                <div className={cx('logo')}>{collapsed ? 'A' : 'ADMIN'}</div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    openKeys={collapsed ? [] : openKeys}
                    onOpenChange={handleOpenChange}
                    items={menuItems}
                    onClick={(item) => setSelectedKey(item.key)}
                    style={{
                        background: 'transparent',
                        borderRight: 'none',
                    }}
                />

                {/* Resize Handle */}
                {!collapsed && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '4px',
                            height: '100%',
                            background: 'transparent',
                            cursor: 'col-resize',
                            zIndex: 10,
                            transition: 'background 0.2s',
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isResizing) {
                                e.target.style.background = 'transparent';
                            }
                        }}
                    />
                )}
            </Sider>
            <Layout>
                <Header className={cx('header')}>
                    <button
                        type="button"
                        style={{
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                            fontSize: '16px',
                            color: token.colorTextSecondary,
                        }}
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    </button>
                    <div className={cx('header-right')}>
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'profile',
                                        icon: <UserOutlined />,
                                        label: (
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{dataUser?.fullName || 'Admin'}</div>
                                                <div style={{ fontSize: '12px', color: '#999' }}>{dataUser?.email}</div>
                                            </div>
                                        ),
                                        disabled: true,
                                    },
                                    {
                                        type: 'divider',
                                    },
                                    {
                                        key: 'role',
                                        icon: <Badge status="success" />,
                                        label: (
                                            <span>
                                                Vai trò:{' '}
                                                <strong>
                                                    {dataUser?.role === 'admin' ? 'Quản trị viên' : 'Thủ thư'}
                                                </strong>
                                            </span>
                                        ),
                                        disabled: true,
                                    },
                                    {
                                        type: 'divider',
                                    },
                                    {
                                        key: 'logout',
                                        icon: <LogoutOutlined />,
                                        label: 'Đăng xuất',
                                        danger: true,
                                        onClick: handleLogout,
                                    },
                                ],
                            }}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <div className={cx('user-info')}>
                                <Avatar src={dataUser?.avatar} icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
                                <span className={cx('user-name')}>{dataUser?.fullName || 'Admin'}</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content className={cx('content')}>{renderContent()}</Content>
            </Layout>
        </Layout>
    );
}

export default Admin;
