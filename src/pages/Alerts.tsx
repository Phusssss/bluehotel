import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Modal,
  message,
  Empty,
  Spin,
  Pagination
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { alertService } from '../services/alertService';
import { showConfirmationModal } from '../components/common/ConfirmationModal';
import { PermissionGuard } from '../components/common/PermissionGuard';
import { formatDateTime } from '../utils/formatUtils';
import type { AlertItem } from '../types/dashboard';

interface FilterState {
  type?: string;
  priority?: string;
  status?: string;
  searchText?: string;
}

export const Alerts: React.FC = () => {
  const { userProfile } = useAuth();
  const { canDismissAlerts, canViewAlerts } = usePermissions();
  const hotelId = userProfile?.hotelId || 'hotel-1';

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Fetch alerts
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertService.getAlerts(hotelId);
      setAlerts(data);
    } catch (error: any) {
      message.error(`Lỗi tải cảnh báo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [hotelId]);

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filters.type && alert.type !== filters.type) return false;
    if (filters.priority && alert.priority !== filters.priority) return false;
    if (filters.status && alert.viewed !== (filters.status === 'viewed')) return false;
    if (filters.searchText && !alert.title.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
    return true;
  });

  const paginatedAlerts = filteredAlerts.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  // Get alert type color
  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      warning: 'orange',
      error: 'red',
      info: 'blue'
    };
    return colors[type] || 'default';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      high: 'red',
      medium: 'orange',
      low: 'blue'
    };
    return colors[priority] || 'default';
  };

  // Handle view alert
  const handleViewAlert = async (alert: AlertItem) => {
    try {
      await alertService.markAsViewed(alert.id);
      Modal.info({
        title: alert.title,
        width: 600,
        content: (
          <div>
            <p><strong>Mô tả:</strong> {alert.description}</p>
            <p><strong>Loại:</strong> <Tag color={getTypeColor(alert.type)}>{alert.type.toUpperCase()}</Tag></p>
            <p><strong>Mức độ:</strong> <Tag color={getPriorityColor(alert.priority)}>{alert.priority.toUpperCase()}</Tag></p>
            <p><strong>Thời gian:</strong> {formatDateTime(alert.createdAt)}</p>
            {alert.action && <p><strong>Hành động:</strong> {alert.action}</p>}
          </div>
        ),
        okText: 'Đóng'
      });
      // Refresh to update viewed status
      fetchAlerts();
    } catch (error: any) {
      message.error(`Lỗi xem cảnh báo: ${error.message}`);
    }
  };

  // Handle dismiss single alert
  const handleDismissAlert = (alertId: string) => {
    showConfirmationModal({
      title: 'Xác nhận ẩn cảnh báo',
      content: 'Bạn có chắc chắn muốn ẩn cảnh báo này?',
      onConfirm: async () => {
        try {
          await alertService.dismissAlert(alertId);
          message.success('Đã ẩn cảnh báo');
          fetchAlerts();
        } catch (error: any) {
          message.error(`Lỗi ẩn cảnh báo: ${error.message}`);
        }
      }
    });
  };

  // Handle bulk dismiss
  const handleBulkDismiss = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Chọn ít nhất một cảnh báo');
      return;
    }

    showConfirmationModal({
      title: 'Xác nhận ẩn cảnh báo',
      content: `Bạn có chắc chắn muốn ẩn ${selectedRowKeys.length} cảnh báo đã chọn?`,
      danger: true,
      onConfirm: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => alertService.dismissAlert(id)));
          message.success(`Đã ẩn ${selectedRowKeys.length} cảnh báo`);
          setSelectedRowKeys([]);
          fetchAlerts();
        } catch (error: any) {
          message.error(`Lỗi ẩn cảnh báo: ${error.message}`);
        }
      }
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: AlertItem) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => formatDateTime(time),
      sorter: (a: AlertItem, b: AlertItem) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    },
    {
      title: 'Trạng thái',
      dataIndex: 'viewed',
      key: 'viewed',
      width: 100,
      render: (viewed: boolean) => (
        <Tag color={viewed ? 'green' : 'blue'}>{viewed ? 'Đã xem' : 'Chưa xem'}</Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_: any, record: AlertItem) => (
        <Space size="small">
          {canViewAlerts && (
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewAlert(record)}
              title="Xem chi tiết"
            />
          )}
          {canDismissAlerts && (
            <Button
              type="text"
              size="small"
              danger
              icon={<CheckOutlined />}
              onClick={() => handleDismissAlert(record.id)}
              title="Ẩn cảnh báo"
            />
          )}
        </Space>
      )
    }
  ];

  return (
    <PermissionGuard permission="view_alerts">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cảnh báo & Thông báo</h1>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAlerts}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Input
                placeholder="Tìm kiếm tiêu đề..."
                prefix={<SearchOutlined />}
                value={filters.searchText || ''}
                onChange={(e) =>
                  setFilters({ ...filters, searchText: e.target.value })
                }
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Select
                placeholder="Loại"
                allowClear
                value={filters.type || undefined}
                onChange={(value) => setFilters({ ...filters, type: value })}
                options={[
                  { label: 'Cảnh báo', value: 'warning' },
                  { label: 'Lỗi', value: 'error' },
                  { label: 'Thông tin', value: 'info' }
                ]}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Select
                placeholder="Mức độ"
                allowClear
                value={filters.priority || undefined}
                onChange={(value) => setFilters({ ...filters, priority: value })}
                options={[
                  { label: 'Cao', value: 'high' },
                  { label: 'Trung bình', value: 'medium' },
                  { label: 'Thấp', value: 'low' }
                ]}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Select
                placeholder="Trạng thái"
                allowClear
                value={filters.status || undefined}
                onChange={(value) => setFilters({ ...filters, status: value })}
                options={[
                  { label: 'Hoạt động', value: 'active' },
                  { label: 'Đã ẩn', value: 'dismissed' }
                ]}
              />
            </Col>
          </Row>
        </Card>

        {/* Bulk actions */}
        {selectedRowKeys.length > 0 && (
          <Card className="bg-blue-50">
            <Space>
              <span>Đã chọn {selectedRowKeys.length} cảnh báo</span>
              {canDismissAlerts && (
                <Button
                  type="primary"
                  danger
                  onClick={handleBulkDismiss}
                >
                  Ẩn tất cả đã chọn
                </Button>
              )}
            </Space>
          </Card>
        )}

        {/* Alerts table */}
        <Card loading={loading}>
          {filteredAlerts.length === 0 ? (
            <Empty description="Không có cảnh báo" />
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={paginatedAlerts.map(alert => ({
                  ...alert,
                  key: alert.id
                }))}
                pagination={false}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys as string[])
                }}
                scroll={{ x: 1200 }}
              />
              {filteredAlerts.length > pagination.pageSize && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={filteredAlerts.length}
                    onChange={(page) => setPagination({ ...pagination, current: page })}
                    showSizeChanger
                    onShowSizeChange={(_, pageSize) =>
                      setPagination({ current: 1, pageSize })
                    }
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </PermissionGuard>
  );
};
