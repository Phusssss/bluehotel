import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Checkbox, Row, Col } from 'antd';
import dayjs from 'dayjs';
import type { Staff, StaffPosition } from '../../types';
import { STAFF_PERMISSIONS } from '../../types/staff';

interface StaffFormProps {
  visible: boolean;
  staff: Staff | null;
  onCancel: () => void;
  onSubmit: (values: any, createUserAccount?: boolean) => void;
  loading: boolean;
}

export const StaffForm: React.FC<StaffFormProps> = ({
  visible,
  staff,
  onCancel,
  onSubmit,
  loading
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (staff) {
        form.setFieldsValue({
          ...staff,
          startDate: staff.startDate ? dayjs(staff.startDate) : null
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, staff, form]);

  const handleSubmit = (values: any) => {
    const formData = {
      ...values,
      startDate: values.startDate ? values.startDate.toDate() : null
    };
    
    const createUserAccount = values.createUserAccount || false;
    delete formData.createUserAccount;
    
    onSubmit(formData, createUserAccount);
  };

  const positionOptions = [
    { value: 'manager', label: 'Quản lý' },
    { value: 'receptionist', label: 'Lễ tân' },
    { value: 'housekeeper', label: 'Buồng phòng' },
    { value: 'maintenance', label: 'Kỹ thuật' },
    { value: 'accounting', label: 'Kế toán' }
  ];

  const roleOptions = [
    { value: 'admin', label: 'Quản trị viên' },
    { value: 'manager', label: 'Quản lý' },
    { value: 'staff', label: 'Nhân viên' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Tạm nghỉ' },
    { value: 'terminated', label: 'Đã nghỉ' }
  ];

  const permissionOptions = Object.entries(STAFF_PERMISSIONS).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  return (
    <Modal
      title={staff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
          role: 'staff',
          permissions: []
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="Họ"
              rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
            >
              <Input placeholder="Nhập họ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Tên"
              rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
            >
              <Input placeholder="Nhập tên" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="position"
              label="Vị trí"
              rules={[{ required: true, message: 'Vui lòng chọn vị trí!' }]}
            >
              <Select placeholder="Chọn vị trí" options={positionOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Phòng ban"
            >
              <Input placeholder="Nhập phòng ban" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
            >
              <Select placeholder="Chọn vai trò" options={roleOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
            >
              <Select placeholder="Chọn trạng thái" options={statusOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label="Ngày bắt đầu"
            >
              <DatePicker className="w-full" placeholder="Chọn ngày bắt đầu" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="salary"
              label="Lương (VNĐ)"
            >
              <InputNumber
                className="w-full"
                placeholder="Nhập lương"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="permissions"
          label="Quyền hạn"
        >
          <Checkbox.Group options={permissionOptions} />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Ghi chú"
        >
          <Input.TextArea rows={3} placeholder="Nhập ghi chú" />
        </Form.Item>

        {!staff && (
          <Form.Item
            name="createUserAccount"
            valuePropName="checked"
          >
            <Checkbox>
              Tạo tài khoản đăng nhập cho nhân viên này
            </Checkbox>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};