import React from 'react';
import { Table, Tag, Button, Space, Avatar, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, CrownOutlined } from '@ant-design/icons';
import type { Guest } from '../../types';

interface GuestListProps {
  guests: Guest[];
  loading: boolean;
  onEdit: (guest: Guest) => void;
  onDelete: (guestId: string) => void;
  onView: (guest: Guest) => void;
}

export const GuestList: React.FC<GuestListProps> = ({
  guests,
  loading,
  onEdit,
  onDelete,
  onView,
}) => {
  const columns = [
    {
      title: 'Khách hàng',
      key: 'name',
      render: (_, record: Guest) => (
        <div className="flex items-center space-x-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">
                {record.firstName} {record.lastName}
              </span>
              {record.isVIP && (
                <Tooltip title="Khách VIP">
                  <CrownOutlined className="text-yellow-500" />
                </Tooltip>
              )}
            </div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_, record: Guest) => (
        <div>
          <div>{record.phone}</div>
          <div className="text-sm text-gray-500">{record.country}</div>
        </div>
      ),
    },
    {
      title: 'Giấy tờ',
      key: 'id',
      render: (_, record: Guest) => (
        <div>
          <div className="text-sm">
            {record.idType === 'national_id' ? 'CMND/CCCD' :
             record.idType === 'passport' ? 'Hộ chiếu' : 'Bằng lái xe'}
          </div>
          <div className="text-sm text-gray-500">{record.idNumber}</div>
        </div>
      ),
    },
    {
      title: 'Lượt ở',
      dataIndex: 'totalStays',
      key: 'totalStays',
      align: 'center' as const,
      render: (stays: number) => (
        <Tag color={stays > 5 ? 'green' : stays > 2 ? 'blue' : 'default'}>
          {stays} lần
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record: Guest) => (
        <Tag color={record.isVIP ? 'gold' : 'default'}>
          {record.isVIP ? 'VIP' : 'Thường'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record: Guest) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={guests}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} khách hàng`,
      }}
      scroll={{ x: 800 }}
    />
  );
};