import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, message } from 'antd';
import type { Guest, IdType } from '../../types';

interface GuestFormProps {
  visible: boolean;
  guest?: Guest | null;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const { Option } = Select;
const { TextArea } = Input;

export const GuestForm: React.FC<GuestFormProps> = ({
  visible,
  guest,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && guest) {
      form.setFieldsValue(guest);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, guest, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const idTypes: { value: IdType; label: string }[] = [
    { value: 'national_id', label: 'CMND/CCCD' },
    { value: 'passport', label: 'Hộ chiếu' },
    { value: 'driver_license', label: 'Bằng lái xe' },
  ];

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
    <Modal
      title={guest ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {guest ? 'Cập nhật' : 'Tạo mới'}
        </Button>,
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          idType: 'national_id',
          country: 'Vietnam',
          isVIP: false,
          totalStays: 0,
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="firstName"
            label="Họ"
            rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
          >
            <Input placeholder="Nguyễn" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Tên"
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input placeholder="Văn A" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="example@email.com" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="+84901234567" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="idType"
            label="Loại giấy tờ"
            rules={[{ required: true, message: 'Vui lòng chọn loại giấy tờ!' }]}
          >
            <Select placeholder="Chọn loại giấy tờ">
              {idTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="idNumber"
            label="Số giấy tờ"
            rules={[{ required: true, message: 'Vui lòng nhập số giấy tờ!' }]}
          >
            <Input placeholder="123456789" />
          </Form.Item>
        </div>

        <Form.Item
          name="address"
          label="Địa chỉ"
          rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
        >
          <TextArea rows={2} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="country"
            label="Quốc gia"
            rules={[{ required: true, message: 'Vui lòng chọn quốc gia!' }]}
          >
            <Select
              placeholder="Chọn quốc gia"
              showSearch
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
          </Form.Item>

          <Form.Item name="isVIP" label="Khách VIP" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Ghi chú">
          <TextArea rows={3} placeholder="Ghi chú về khách hàng..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};