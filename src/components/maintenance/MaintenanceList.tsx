import React from 'react';
import { Table, Space, Button, Tag, Tooltip, Badge, Popover } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import type { MaintenanceRequest } from '../../types/maintenance';
import { MAINTENANCE_PRIORITIES, MAINTENANCE_STATUSES } from '../../types/maintenance';
import dayjs from 'dayjs';

interface MaintenanceListProps {
  requests: MaintenanceRequest[];
  loading: boolean;
  selectedRequests?: string[];
  onEdit: (request: MaintenanceRequest) => void;
  onDelete: (id: string) => void;
  onSelectChange?: (ids: string[]) => void;
  onStatusChange?: (id: string, status: string) => void;
  onAssign?: (id: string) => void;
}

export const MaintenanceList: React.FC<MaintenanceListProps> = ({
  requests,
  loading,
  selectedRequests = [],
  onEdit,
  onDelete,
  onSelectChange,
  onStatusChange,
  onAssign
}) => {
  const getPriorityColor = (priority: string) => {
    const priorityConfig = MAINTENANCE_PRIORITIES.find(p => p.value === priority);
    return priorityConfig?.color || 'default';
  };

  const getStatusColor = (status: string) => {
    const statusConfig = MAINTENANCE_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckOutlined style={{ color: 'green' }} />;
    if (status === 'in-progress') return <ClockCircleOutlined style={{ color: 'orange' }} />;
    return null;
  };

  const columns = [
    {
      title: 'Room',
      dataIndex: 'roomId',
      key: 'room',
      width: 80,
      render: (roomId: string) => <strong>{roomId}</strong>
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: MaintenanceRequest) => (
        <div>
          <strong>{title}</strong>
          <br />
          <span className="text-xs text-gray-500 capitalize">{record.category}</span>
        </div>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)}>
            {status.replace('-', ' ').toUpperCase()}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 120,
      render: (assignedTo: string) => (
        <div className="flex items-center">
          <UserOutlined className="mr-1" />
          {assignedTo || 'Unassigned'}
        </div>
      )
    },
    {
      title: 'Cost',
      dataIndex: 'actualCost',
      key: 'cost',
      width: 100,
      render: (cost: number, record: MaintenanceRequest) => (
        <div>
          {cost ? `$${cost.toLocaleString()}` : '-'}
          {record.estimatedCost && (
            <div className="text-xs text-gray-500">
              Est: ${record.estimatedCost.toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (date: Date) => (
        <div>
          {dayjs(date).format('MMM DD')}
          <div className="text-xs text-gray-500">
            {dayjs(date).format('YYYY')}
          </div>
        </div>
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'requiredDate',
      key: 'requiredDate',
      width: 100,
      render: (date: Date) => {
        if (!date) return '-';
        const isOverdue = dayjs(date).isBefore(dayjs());
        return (
          <div className={isOverdue ? 'text-red-500' : ''}>
            {dayjs(date).format('MMM DD')}
            {isOverdue && <div className="text-xs">OVERDUE</div>}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record: MaintenanceRequest) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {onAssign && (
            <Tooltip title="Assign">
              <Button
                icon={<UserOutlined />}
                size="small"
                onClick={() => onAssign(record.id)}
              />
            </Tooltip>
          )}
          {onStatusChange && record.status !== 'completed' && (
            <Tooltip title="Mark Complete">
              <Button
                icon={<CheckOutlined />}
                size="small"
                type="primary"
                onClick={() => onStatusChange(record.id, 'completed')}
              />
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => onDelete(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={requests}
      loading={loading}
      rowKey="id"
      pagination={{ 
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`
      }}
      rowSelection={onSelectChange ? {
        selectedRowKeys: selectedRequests,
        onChange: (keys) => onSelectChange(keys as string[])
      } : undefined}
      className="mt-4"
      scroll={{ x: 1000 }}
      rowClassName={(record) => {
        if (record.priority === 'urgent') return 'bg-red-50';
        if (record.status === 'completed') return 'bg-green-50';
        return '';
      }}
    />
  );
};