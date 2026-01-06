import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, message } from 'antd';
import type { MaintenanceRequest } from '../../types/maintenance';
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES, MAINTENANCE_STATUSES } from '../../types/maintenance';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface MaintenanceFormProps {
  visible: boolean;
  request: MaintenanceRequest | null;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
  loading: boolean;
  rooms?: { id: string; number: string }[];
  staff?: { id: string; firstName: string; lastName: string }[];
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  visible,
  request,
  onCancel,
  onSubmit,
  loading,
  rooms = [],
  staff = []
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && request) {
      form.setFieldsValue({
        ...request,
        requiredDate: request.requiredDate ? dayjs(request.requiredDate) : null,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, request, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Convert dayjs to Date
      if (values.requiredDate) {
        values.requiredDate = values.requiredDate.toDate();
      }

      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={request ? 'Edit Maintenance Request' : 'Create Maintenance Request'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          priority: 'medium',
          status: 'pending',
          category: 'other'
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="roomId"
              label="Room"
              rules={[{ required: true, message: 'Please select a room' }]}
            >
              <Select
                placeholder="Select room"
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                }
              >
                {rooms.map(room => (
                  <Option key={room.id} value={room.id}>
                    Room {room.number}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select category">
                {MAINTENANCE_CATEGORIES.map(cat => (
                  <Option key={cat.type} value={cat.type}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder="e.g., Broken AC unit" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Detailed description of the maintenance issue..."
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select placeholder="Select priority">
                {MAINTENANCE_PRIORITIES.map(priority => (
                  <Option key={priority.value} value={priority.value}>
                    <span style={{ color: priority.color === 'red' ? '#ff4d4f' : priority.color === 'orange' ? '#fa8c16' : '#52c41a' }}>
                      {priority.label}
                    </span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label="Status"
            >
              <Select placeholder="Select status">
                {MAINTENANCE_STATUSES.map(status => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="assignedTo"
              label="Assign To"
            >
              <Select 
                placeholder="Select staff member"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                }
              >
                {staff.map(member => (
                  <Option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="requiredDate"
              label="Required By"
            >
              <DatePicker 
                className="w-full"
                placeholder="Select due date"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="estimatedCost"
              label="Estimated Cost ($)"
            >
              <InputNumber
                className="w-full"
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="estimatedDuration"
              label="Estimated Duration (hours)"
            >
              <InputNumber
                className="w-full"
                min={0}
                precision={1}
                placeholder="0.0"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor"
              label="Vendor (if external)"
            >
              <Input placeholder="External vendor name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="costCategory"
              label="Cost Category"
            >
              <Select placeholder="Select cost category" allowClear>
                <Option value="in-house">In-house</Option>
                <Option value="contractor">Contractor</Option>
                <Option value="parts">Parts</Option>
                <Option value="labor">Labor</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="Additional Notes"
        >
          <TextArea 
            rows={3} 
            placeholder="Any additional notes or special instructions..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};