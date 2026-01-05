import React from 'react';
import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Invoice } from '../../types';

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onView: (invoice: Invoice) => void;
  onExportPDF?: (invoice: Invoice) => void;
}

const paymentStatusColors = {
  pending: 'orange',
  paid: 'green',
  partial: 'blue',
};

const paymentStatusLabels = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  partial: 'Thanh toán một phần',
};

const paymentMethodLabels = {
  cash: 'Tiền mặt',
  credit_card: 'Thẻ tín dụng',
  bank_transfer: 'Chuyển khoản',
};

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  loading,
  onEdit,
  onDelete,
  onView,
  onExportPDF,
}) => {
  const columns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <span className="font-mono text-sm">{id.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      title: 'Đặt phòng',
      dataIndex: 'reservationId',
      key: 'reservationId',
      render: (reservationId: string) => (
        <span className="text-sm">{reservationId.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      title: 'Tiền phòng',
      dataIndex: 'roomCharges',
      key: 'roomCharges',
      render: (amount: number) => (
        <span>{amount.toLocaleString('vi-VN')} VNĐ</span>
      ),
    },
    {
      title: 'Dịch vụ thêm',
      dataIndex: 'additionalServices',
      key: 'additionalServices',
      render: (services: any[]) => {
        const total = services?.reduce((sum, service) => sum + service.price, 0) || 0;
        return <span>{total.toLocaleString('vi-VN')} VNĐ</span>;
      },
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <span className="font-semibold text-blue-600">
          {amount.toLocaleString('vi-VN')} VNĐ
        </span>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: keyof typeof paymentMethodLabels) => (
        <span>{paymentMethodLabels[method]}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: keyof typeof paymentStatusColors) => (
        <Tag color={paymentStatusColors[status]}>
          {paymentStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Ngày xuất',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày đến hạn',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record: Invoice) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          {onExportPDF && (
            <Tooltip title="Xuất PDF">
              <Button
                type="text"
                icon={<FilePdfOutlined />}
                onClick={() => onExportPDF(record)}
              />
            </Tooltip>
          )}
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
      dataSource={invoices}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} hóa đơn`,
      }}
      scroll={{ x: 1400 }}
    />
  );
};