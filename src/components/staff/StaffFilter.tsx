import React from 'react';
import { Row, Col, Input, Select, Button, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { StaffFilter } from '../../types/staff';

interface StaffFilterProps {
  filter: StaffFilter;
  onFilterChange: (filter: StaffFilter) => void;
}

export const StaffFilterComponent: React.FC<StaffFilterProps> = ({
  filter,
  onFilterChange
}) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filter, search: value });
  };

  const handlePositionChange = (value: string) => {
    onFilterChange({ ...filter, position: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filter, status: value || undefined });
  };

  const handleClear = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg mb-4">
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Input
            placeholder="Tìm theo tên, email..."
            value={filter.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Lọc theo vị trí"
            value={filter.position || undefined}
            onChange={handlePositionChange}
            allowClear
            className="w-full"
            options={[
              { value: 'manager', label: 'Quản lý' },
              { value: 'receptionist', label: 'Lễ tân' },
              { value: 'housekeeper', label: 'Buồng phòng' },
              { value: 'maintenance', label: 'Kỹ thuật' },
              { value: 'accounting', label: 'Kế toán' }
            ]}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Lọc theo trạng thái"
            value={filter.status || undefined}
            onChange={handleStatusChange}
            allowClear
            className="w-full"
            options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Tạm nghỉ' },
              { value: 'terminated', label: 'Đã nghỉ' }
            ]}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Space>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              Xóa bộ lọc
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};