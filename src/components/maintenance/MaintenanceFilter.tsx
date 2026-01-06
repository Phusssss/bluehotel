import React from 'react';
import { Row, Col, Input, Select, Button, Space, DatePicker } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { MaintenanceFilter } from '../../types/maintenance';
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES, MAINTENANCE_STATUSES } from '../../types/maintenance';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface MaintenanceFilterProps {
  filter: MaintenanceFilter;
  onFilterChange: (filter: MaintenanceFilter) => void;
  staff?: { id: string; firstName: string; lastName: string }[];
  rooms?: { id: string; number: string }[];
}

export const MaintenanceFilter: React.FC<MaintenanceFilterProps> = ({
  filter,
  onFilterChange,
  staff = [],
  rooms = []
}) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filter, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filter, status: value || undefined });
  };

  const handlePriorityChange = (value: string) => {
    onFilterChange({ ...filter, priority: value || undefined });
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({ ...filter, category: value || undefined });
  };

  const handleAssignedToChange = (value: string) => {
    onFilterChange({ ...filter, assignedTo: value || undefined });
  };

  const handleRoomChange = (value: string) => {
    onFilterChange({ ...filter, roomId: value || undefined });
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      onFilterChange({ 
        ...filter, 
        dateRange: [dates[0].toDate(), dates[1].toDate()] 
      });
    } else {
      onFilterChange({ ...filter, dateRange: undefined });
    }
  };

  const handleClear = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg mb-4 shadow-sm">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Input
            placeholder="Search by title, room..."
            value={filter.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        
        <Col xs={24} sm={12} lg={4}>
          <Select
            placeholder="Status"
            value={filter.status || undefined}
            onChange={handleStatusChange}
            allowClear
            className="w-full"
          >
            {MAINTENANCE_STATUSES.map(status => (
              <Select.Option key={status.value} value={status.value}>
                {status.label}
              </Select.Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <Select
            placeholder="Priority"
            value={filter.priority || undefined}
            onChange={handlePriorityChange}
            allowClear
            className="w-full"
          >
            {MAINTENANCE_PRIORITIES.map(priority => (
              <Select.Option key={priority.value} value={priority.value}>
                <span style={{ color: priority.color === 'red' ? '#ff4d4f' : priority.color === 'orange' ? '#fa8c16' : '#52c41a' }}>
                  {priority.label}
                </span>
              </Select.Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <Select
            placeholder="Category"
            value={filter.category || undefined}
            onChange={handleCategoryChange}
            allowClear
            className="w-full"
          >
            {MAINTENANCE_CATEGORIES.map(category => (
              <Select.Option key={category.type} value={category.type}>
                {category.label}
              </Select.Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Assigned to"
            value={filter.assignedTo || undefined}
            onChange={handleAssignedToChange}
            allowClear
            className="w-full"
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
            }
          >
            <Select.Option value="">Unassigned</Select.Option>
            {staff.map(member => (
              <Select.Option key={member.id} value={member.id}>
                {member.firstName} {member.lastName}
              </Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Room"
            value={filter.roomId || undefined}
            onChange={handleRoomChange}
            allowClear
            className="w-full"
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
            }
          >
            {rooms.map(room => (
              <Select.Option key={room.id} value={room.id}>
                Room {room.number}
              </Select.Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <RangePicker
            placeholder={['Start date', 'End date']}
            value={filter.dateRange ? [dayjs(filter.dateRange[0]), dayjs(filter.dateRange[1])] : null}
            onChange={handleDateRangeChange}
            className="w-full"
          />
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <Button 
            icon={<ClearOutlined />} 
            onClick={handleClear}
            className="w-full"
          >
            Clear All
          </Button>
        </Col>
      </Row>

      {/* Filter summary */}
      {(filter.search || filter.status || filter.priority || filter.category || filter.assignedTo || filter.roomId || filter.dateRange) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Space wrap>
            <span className="text-sm text-gray-500">Active filters:</span>
            {filter.search && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Search: {filter.search}</span>}
            {filter.status && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Status: {filter.status}</span>}
            {filter.priority && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Priority: {filter.priority}</span>}
            {filter.category && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Category: {filter.category}</span>}
            {filter.assignedTo && <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Assigned</span>}
            {filter.roomId && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Room filter</span>}
            {filter.dateRange && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Date range</span>}
          </Space>
        </div>
      )}
    </div>
  );
};