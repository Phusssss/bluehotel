import React from 'react';
import { Card, Select, Input, Button, Space, InputNumber } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { RoomFilter, RoomType, RoomStatus } from '../../types';

interface RoomFilterProps {
  filter: RoomFilter;
  onFilterChange: (filter: RoomFilter) => void;
  onClear: () => void;
}

const { Option } = Select;

export const RoomFilterComponent: React.FC<RoomFilterProps> = ({
  filter,
  onFilterChange,
  onClear,
}) => {
  const handleFilterChange = (key: keyof RoomFilter, value: any) => {
    onFilterChange({ ...filter, [key]: value });
  };

  const roomTypes: { value: RoomType; label: string }[] = [
    { value: 'single', label: 'Phòng đơn' },
    { value: 'double', label: 'Phòng đôi' },
    { value: 'suite', label: 'Suite' },
    { value: 'deluxe', label: 'Deluxe' },
  ];

  const roomStatuses: { value: RoomStatus; label: string }[] = [
    { value: 'available', label: 'Trống' },
    { value: 'occupied', label: 'Đã đặt' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'blocked', label: 'Khóa' },
  ];

  return (
    <Card className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tìm kiếm</label>
          <Input
            placeholder="Số phòng, tiện nghi..."
            prefix={<SearchOutlined />}
            value={filter.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            allowClear
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <Select
            placeholder="Chọn trạng thái"
            value={filter.status}
            onChange={(value) => handleFilterChange('status', value)}
            allowClear
            className="w-full"
          >
            {roomStatuses.map(status => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Loại phòng</label>
          <Select
            placeholder="Chọn loại phòng"
            value={filter.roomType}
            onChange={(value) => handleFilterChange('roomType', value)}
            allowClear
            className="w-full"
          >
            {roomTypes.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tầng</label>
          <InputNumber
            placeholder="Chọn tầng"
            value={filter.floor}
            onChange={(value) => handleFilterChange('floor', value)}
            min={1}
            max={50}
            className="w-full"
          />
        </div>

        <div className="flex items-end">
          <Button
            icon={<ClearOutlined />}
            onClick={onClear}
            className="w-full"
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>
    </Card>
  );
};