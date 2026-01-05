import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  DatePicker, 
  Select, 
  InputNumber, 
  Button, 
  Space, 
  Collapse,
  Tag
} from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
  loading?: boolean;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFiltersChange,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const roomTypes = [
    { label: 'Standard', value: 'standard' },
    { label: 'Deluxe', value: 'deluxe' },
    { label: 'Suite', value: 'suite' },
    { label: 'Presidential', value: 'presidential' }
  ];

  const paymentStatuses = [
    { label: 'Pending', value: 'pending' },
    { label: 'Partial', value: 'partial' },
    { label: 'Paid', value: 'paid' },
    { label: 'Refunded', value: 'refunded' }
  ];

  const sources = [
    { label: 'Direct', value: 'direct' },
    { label: 'Booking.com', value: 'booking' },
    { label: 'Expedia', value: 'expedia' },
    { label: 'Airbnb', value: 'airbnb' },
    { label: 'Phone', value: 'phone' },
    { label: 'Walk-in', value: 'walkin' }
  ];

  const guestTypes = [
    { label: 'Regular', value: 'regular' },
    { label: 'VIP', value: 'vip' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Group', value: 'group' }
  ];

  const handleApplyFilters = () => {
    const values = form.getFieldsValue();
    const filters: any = {};

    if (values.dateRange) {
      filters.dateRange = {
        start: values.dateRange[0].format('YYYY-MM-DD'),
        end: values.dateRange[1].format('YYYY-MM-DD')
      };
    }

    if (values.roomTypes?.length) filters.roomTypes = values.roomTypes;
    if (values.paymentStatus?.length) filters.paymentStatus = values.paymentStatus;
    if (values.sources?.length) filters.sources = values.sources;
    if (values.guestTypes?.length) filters.guestTypes = values.guestTypes;
    if (values.minAmount !== undefined) filters.minAmount = values.minAmount;
    if (values.maxAmount !== undefined) filters.maxAmount = values.maxAmount;

    // Track active filters for display
    const active = [];\n    if (filters.dateRange) active.push('Date Range');\n    if (filters.roomTypes) active.push('Room Types');\n    if (filters.paymentStatus) active.push('Payment Status');\n    if (filters.sources) active.push('Sources');\n    if (filters.guestTypes) active.push('Guest Types');\n    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) active.push('Amount Range');\n    \n    setActiveFilters(active);\n    onFiltersChange(filters);\n  };\n\n  const handleClearFilters = () => {\n    form.resetFields();\n    setActiveFilters([]);\n    onFiltersChange({});\n  };\n\n  return (\n    <Card className=\"mb-4\">\n      <Collapse ghost>\n        <Panel \n          header={\n            <div className=\"flex items-center justify-between\">\n              <div className=\"flex items-center space-x-2\">\n                <FilterOutlined />\n                <span>Advanced Filters</span>\n                {activeFilters.length > 0 && (\n                  <span className=\"text-blue-600\">({activeFilters.length} active)</span>\n                )}\n              </div>\n            </div>\n          } \n          key=\"1\"\n        >\n          <Form form={form} layout=\"vertical\">\n            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">\n              <Form.Item label=\"Date Range\" name=\"dateRange\">\n                <RangePicker \n                  className=\"w-full\"\n                  placeholder={['Check-in', 'Check-out']}\n                />\n              </Form.Item>\n\n              <Form.Item label=\"Room Types\" name=\"roomTypes\">\n                <Select\n                  mode=\"multiple\"\n                  placeholder=\"Select room types\"\n                  options={roomTypes}\n                  className=\"w-full\"\n                />\n              </Form.Item>\n\n              <Form.Item label=\"Payment Status\" name=\"paymentStatus\">\n                <Select\n                  mode=\"multiple\"\n                  placeholder=\"Select payment status\"\n                  options={paymentStatuses}\n                  className=\"w-full\"\n                />\n              </Form.Item>\n\n              <Form.Item label=\"Booking Source\" name=\"sources\">\n                <Select\n                  mode=\"multiple\"\n                  placeholder=\"Select sources\"\n                  options={sources}\n                  className=\"w-full\"\n                />\n              </Form.Item>\n\n              <Form.Item label=\"Guest Types\" name=\"guestTypes\">\n                <Select\n                  mode=\"multiple\"\n                  placeholder=\"Select guest types\"\n                  options={guestTypes}\n                  className=\"w-full\"\n                />\n              </Form.Item>\n\n              <div className=\"space-y-2\">\n                <Form.Item label=\"Min Amount\" name=\"minAmount\" className=\"mb-2\">\n                  <InputNumber\n                    className=\"w-full\"\n                    placeholder=\"0\"\n                    min={0}\n                    formatter={value => `$ ${value}`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}\n                    parser={value => value!.replace(/\\$\\s?|(,*)/g, '')}\n                  />\n                </Form.Item>\n                <Form.Item label=\"Max Amount\" name=\"maxAmount\" className=\"mb-0\">\n                  <InputNumber\n                    className=\"w-full\"\n                    placeholder=\"10000\"\n                    min={0}\n                    formatter={value => `$ ${value}`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}\n                    parser={value => value!.replace(/\\$\\s?|(,*)/g, '')}\n                  />\n                </Form.Item>\n              </div>\n            </div>\n\n            <div className=\"flex justify-between items-center mt-4\">\n              <div className=\"flex flex-wrap gap-1\">\n                {activeFilters.map(filter => (\n                  <Tag key={filter} color=\"blue\">{filter}</Tag>\n                ))}\n              </div>\n              \n              <Space>\n                <Button \n                  icon={<ClearOutlined />} \n                  onClick={handleClearFilters}\n                  disabled={activeFilters.length === 0}\n                >\n                  Clear\n                </Button>\n                <Button \n                  type=\"primary\" \n                  icon={<FilterOutlined />}\n                  onClick={handleApplyFilters}\n                  loading={loading}\n                >\n                  Apply Filters\n                </Button>\n              </Space>\n            </div>\n          </Form>\n        </Panel>\n      </Collapse>\n    </Card>\n  );\n};