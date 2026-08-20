import React, { useState } from 'react';
import { Button, Dropdown, Space } from 'antd';
import { FileExcelOutlined, DownOutlined } from '@ant-design/icons';
import ExportManager from '../../utils/ExportManager';

/**
 * ExportButton Component - Reusable export button with format selection
 *
 * @param {Array} data - Data to export (filtered)
 * @param {string} type - Type of data: 'faq', 'category', 'user', 'product', 'order', 'custom'
 * @param {Object} customOptions - Custom export options for type='custom'
 * @param {string} buttonText - Button text (default: "Export Excel")
 * @param {string} buttonType - Button type (default: "default")
 * @param {boolean} disabled - Disable button
 */
const ExportButton = ({
    data = [],
    type = 'custom',
    customOptions = {},
    buttonText = 'Export Excel',
    buttonType = 'default',
    disabled = false,
    ...props
}) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async (format) => {
        if (!data || data.length === 0) {
            return;
        }

        setLoading(true);

        try {
            // Small delay for UX
            await new Promise((resolve) => setTimeout(resolve, 100));

            switch (type) {
                case 'faq':
                    ExportManager.exportFAQ(data, format);
                    break;
                case 'category':
                    ExportManager.exportCategories(data, format);
                    break;
                case 'user':
                    ExportManager.exportUsers(data, format);
                    break;
                case 'product':
                    ExportManager.exportProducts(data, format);
                    break;
                case 'order':
                    ExportManager.exportOrders(data, format);
                    break;
                case 'custom':
                    ExportManager.export(data, { ...customOptions, format });
                    break;
                default:
                    ExportManager.export(data, { format });
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        {
            key: 'csv',
            label: 'Export CSV',
            icon: <FileExcelOutlined />,
            onClick: () => handleExport('csv'),
        },
        {
            key: 'xlsx',
            label: 'Export XLSX (Excel 2007+)',
            icon: <FileExcelOutlined />,
            onClick: () => handleExport('xlsx'),
        },
        {
            key: 'xls',
            label: 'Export XLS (Excel 97-2003)',
            icon: <FileExcelOutlined />,
            onClick: () => handleExport('xls'),
        },
    ];

    return (
        <Dropdown
            menu={{ items: menuItems }}
            placement="bottomRight"
            disabled={disabled || data.length === 0}
            {...props}
        >
            <Button
                type={buttonType}
                icon={<FileExcelOutlined />}
                loading={loading}
                disabled={disabled || data.length === 0}
            >
                <Space>
                    {buttonText}
                    <DownOutlined />
                </Space>
            </Button>
        </Dropdown>
    );
};

export default ExportButton;
