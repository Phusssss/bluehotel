import React from 'react';
import { Card, Select, Input, Button, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { GuestFilter } from '../../types';

interface GuestFilterProps {
  filter: GuestFilter;
  onFilterChange: (filter: GuestFilter) => void;
  onClear: () => void;
}

const { Option } = Select;

export const GuestFilterComponent: React.FC<GuestFilterProps> = ({
  filter,
  onFilterChange,
  onClear,
}) => {
  const handleFilterChange = (key: keyof GuestFilter, value: any) => {
    onFilterChange({ ...filter, [key]: value });
  };

  const countries = [
    'Vietnam',
    'United States',
    'China',
    'Japan',
    'South Korea',
    'Thailand',
    'Singapore',
    'Malaysia',
    'Indonesia',
    'Philippines',
  ];

  return (
    <Card className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tìm kiếm</label>
          <Input
            placeholder="Tên, email, số điện thoại..."
            prefix={<SearchOutlined />}
            value={filter.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            allowClear
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Loại khách</label>
          <Select
            placeholder="Chọn loại khách"
            value={filter.isVIP}
            onChange={(value) => handleFilterChange('isVIP', value)}
            allowClear
            className="w-full"
          >
            <Option value={true}>Khách VIP</Option>
            <Option value={false}>Khách thường</Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quốc gia</label>
          <Select
            placeholder="Chọn quốc gia"
            value={filter.country}
            onChange={(value) => handleFilterChange('country', value)}
            allowClear
            showSearch
            className="w-full"
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {countries.map(country => (
              <Option key={country} value={country}>
                {country}
              </Option>
            ))}
          </Select>
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