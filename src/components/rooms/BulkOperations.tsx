import React from 'react';
import { Button, Dropdown, Modal, Select, message } from 'antd';
import { DownOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useRoomStore } from '../../store/useRoomStore';

interface BulkOperationsProps {
  selectedCount: number;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({ selectedCount }) => {
  const { selectedRooms, bulkUpdateStatus, bulkDelete, clearSelection } = useRoomStore();

  const handleBulkStatusUpdate = () => {
    Modal.confirm({
      title: 'Cập nhật trạng thái phòng',
      content: (
        <div className="mt-4">
          <p>Chọn trạng thái mới cho {selectedCount} phòng đã chọn:</p>
          <Select
            className="w-full mt-2"
            placeholder="Chọn trạng thái"
            onChange={(status) => {
              Modal.destroyAll();
              bulkUpdateStatus(selectedRooms, status).then(() => {
                message.success(`Đã cập nhật trạng thái cho ${selectedCount} phòng`);
              });
            }}
          >
            <Select.Option value="available">Có sẵn</Select.Option>
            <Select.Option value="occupied">Đang sử dụng</Select.Option>
            <Select.Option value="maintenance">Bảo trì</Select.Option>
            <Select.Option value="cleaning">Đang dọn dẹp</Select.Option>
            <Select.Option value="out-of-order">Hỏng</Select.Option>
          </Select>
        </div>
      ),
      okText: 'Cập nhật',
      cancelText: 'Hủy',
      onOk: () => {},
    });
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'Xóa phòng',
      content: `Bạn có chắc chắn muốn xóa ${selectedCount} phòng đã chọn? Thao tác này có thể được hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await bulkDelete(selectedRooms);
          message.success(`Đã xóa ${selectedCount} phòng`);
        } catch (error: any) {
          if (error.message.includes('đặt phòng')) {
            Modal.confirm({
              title: 'Phòng có đặt phòng đang hoạt động',
              content: 'Một số phòng có đặt phòng đang hoạt động. Bạn có muốn xóa bắt buộc?',
              okText: 'Xóa bắt buộc',
              okType: 'danger',
              cancelText: 'Hủy',
              onOk: () => bulkDelete(selectedRooms, true),
            });
          } else {
            message.error(error.message);
          }
        }
      },
    });
  };

  const menuItems = [
    {
      key: 'status',
      label: 'Cập nhật trạng thái',
      icon: <EditOutlined />,
      onClick: handleBulkStatusUpdate,
    },
    {
      key: 'delete',
      label: 'Xóa phòng',
      icon: <DeleteOutlined />,
      onClick: handleBulkDelete,
      danger: true,
    },
  ];

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-blue-700">
        Đã chọn {selectedCount} phòng
      </span>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button type="primary" size="small">
          Thao tác <DownOutlined />
        </Button>
      </Dropdown>
      <Button size="small" onClick={clearSelection}>
        Bỏ chọn
      </Button>
    </div>
  );
};