import React from 'react';
import { Table, Tag, Button, Space, Tooltip, Progress } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Reservation } from '../../types';

interface ReservationListProps {
  reservations: Reservation[];
  loading: boolean;
  onEdit: (reservation: Reservation) => void;
  onDelete: (reservationId: string) => void;
  onView: (reservation: Reservation) => void;
  onCheckIn?: (reservation: Reservation) => void;
  onCheckOut?: (reservation: Reservation) => void;
  operationStatus?: { [key: string]: any };
}

const statusColors = {
  pending: '#FAAD14',
  confirmed: '#1890FF',
  'checked-in': '#52C41A',
  'checked-out': '#D9D9D9',
  cancelled: '#F5222D',
};

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  'checked-in': 'Đã check-in',
  'checked-out': 'Đã check-out',
  cancelled: 'Đã hủy',
};

const paymentStatusColors = {
  pending: 'orange',
  partial: 'blue',
  paid: 'green',
  refunded: 'red',
};

const paymentStatusLabels = {
  pending: 'Chờ thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
};

export const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  loading,
  onEdit,
  onDelete,
  onView,
  onCheckIn,
  onCheckOut,
  operationStatus = {},
}) => {
  const columns = [
    {
      title: 'Mã đặt phòng',
      dataIndex: 'id',
      key: 'id',
      render: (id: string, record: Reservation) => (
        <div>
          <span className="font-mono text-sm">{id.slice(-8).toUpperCase()}</span>
          {record.confirmationCode && (
            <div className="text-xs text-gray-500">#{record.confirmationCode}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'guestId',
      key: 'guestId',
      render: (guestId: string) => (
        <span className="text-sm">{guestId.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      title: 'Phòng',
      dataIndex: 'roomId',
      key: 'roomId',
      render: (roomId: string) => (
        <span className="text-sm">{roomId.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      title: 'Check-in',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (date: string, record: Reservation) => (
        <div>
          <div>{dayjs(date).format('DD/MM/YYYY')}</div>
          {record.actualCheckInTime && (
            <div className="text-xs text-green-600">
              Thực tế: {dayjs(record.actualCheckInTime).format('DD/MM HH:mm')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date: string, record: Reservation) => (
        <div>
          <div>{dayjs(date).format('DD/MM/YYYY')}</div>
          {record.actualCheckOutTime && (
            <div className="text-xs text-blue-600">
              Thực tế: {dayjs(record.actualCheckOutTime).format('DD/MM HH:mm')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Số khách',
      dataIndex: 'numberOfGuests',
      key: 'numberOfGuests',
      align: 'center' as const,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => (
        <span className="font-semibold text-blue-600">
          {price.toLocaleString('vi-VN')} VNĐ
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: keyof typeof paymentStatusColors) => (
        <Tag color={paymentStatusColors[status]} size="small">
          {paymentStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Nguồn',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
          {source === 'online' ? 'Online' : 
           source === 'phone' ? 'Điện thoại' :
           source === 'walk-in' ? 'Tại chỗ' : 'Đại lý'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record: Reservation) => {
        const opStatus = operationStatus[record.id] || {};
        
        return (
          <Space>
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView(record)}
              />
            </Tooltip>
            
            {record.status === 'confirmed' && onCheckIn && (
              <Tooltip title="Check-in">
                <Button
                  type="text"
                  icon={<LoginOutlined />}
                  loading={opStatus.checkingIn}
                  onClick={() => onCheckIn(record)}
                  className="text-green-600"
                />
              </Tooltip>
            )}
            
            {record.status === 'checked-in' && onCheckOut && (
              <Tooltip title="Check-out">
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  loading={opStatus.checkingOut}
                  onClick={() => onCheckOut(record)}
                  className="text-blue-600"
                />
              </Tooltip>
            )}
            
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                disabled={opStatus.modifying}
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
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={reservations}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} đặt phòng`,
      }}
      scroll={{ x: 1400 }}
    />
  );
};