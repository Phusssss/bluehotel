import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, Button, Upload, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Room, RoomType, RoomStatus } from '../../types';

interface RoomFormProps {
  visible: boolean;
  room?: Room | null;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const { Option } = Select;
const { TextArea } = Input;

export const RoomForm: React.FC<RoomFormProps> = ({
  visible,
  room,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && room) {
      form.setFieldsValue({
        ...room,
        amenities: room.amenities || [],
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, room, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
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
    <Modal
      title={room ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {room ? 'Cập nhật' : 'Tạo mới'}
        </Button>,
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          roomType: 'single',
          status: 'available',
          maxGuests: 1,
          basePrice: 500000,
          floor: 1,
          amenities: [],
        }}
      >
        <Form.Item
          name="roomNumber"
          label="Số phòng"
          rules={[{ required: true, message: 'Vui lòng nhập số phòng!' }]}
        >
          <Input placeholder="Ví dụ: 101, A01" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="roomType"
            label="Loại phòng"
            rules={[{ required: true, message: 'Vui lòng chọn loại phòng!' }]}
          >
            <Select placeholder="Chọn loại phòng">
              {roomTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              {roomStatuses.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            name="floor"
            label="Tầng"
            rules={[{ required: true, message: 'Vui lòng nhập tầng!' }]}
          >
            <InputNumber min={1} max={50} className="w-full" />
          </Form.Item>

          <Form.Item
            name="maxGuests"
            label="Sức chứa"
            rules={[{ required: true, message: 'Vui lòng nhập sức chứa!' }]}
          >
            <InputNumber min={1} max={10} className="w-full" />
          </Form.Item>

          <Form.Item
            name="basePrice"
            label="Giá cơ bản (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
          >
            <InputNumber
              min={0}
              className="w-full"
            />
          </Form.Item>
        </div>

        <Form.Item name="amenities" label="Tiện nghi">
          <Select
            mode="tags"
            placeholder="Nhập tiện nghi (Enter để thêm)"
            style={{ width: '100%' }}
          >
            <Option value="WiFi">WiFi</Option>
            <Option value="AC">Điều hòa</Option>
            <Option value="TV">TV</Option>
            <Option value="Minibar">Minibar</Option>
            <Option value="Balcony">Ban công</Option>
            <Option value="Bathroom">Phòng tắm riêng</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};