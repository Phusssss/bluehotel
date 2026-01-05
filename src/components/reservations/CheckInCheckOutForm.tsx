import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, Button, Space, Divider, message } from 'antd';
import { CheckCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Reservation } from '../../types';

interface CheckInCheckOutFormProps {
  visible: boolean;
  reservation: Reservation | null;
  type: 'checkin' | 'checkout';
  onCancel: () => void;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const { TextArea } = Input;

export const CheckInCheckOutForm: React.FC<CheckInCheckOutFormProps> = ({
  visible,
  reservation,
  type,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        [type === 'checkin' ? 'actualCheckInTime' : 'actualCheckOutTime']: 
          values.actualTime.format('YYYY-MM-DD HH:mm:ss'),
      };
      delete formattedValues.actualTime;
      onSubmit(formattedValues);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const isCheckIn = type === 'checkin';
  const title = isCheckIn ? 'Check-in khách hàng' : 'Check-out khách hàng';
  const icon = isCheckIn ? <CheckCircleOutlined /> : <LogoutOutlined />;

  return (
    <Modal
      title={
        <Space>
          {icon}
          {title}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
          icon={icon}
        >
          {isCheckIn ? 'Check-in' : 'Check-out'}
        </Button>,
      ]}
      width={500}
    >
      {reservation && (
        <>
          <div className="bg-gray-50 p-4 rounded mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Mã đặt phòng:</strong> {reservation.id.slice(-8).toUpperCase()}</div>
              <div><strong>Phòng:</strong> {reservation.roomId.slice(-8).toUpperCase()}</div>
              <div><strong>Ngày {isCheckIn ? 'check-in' : 'check-out'}:</strong> {dayjs(isCheckIn ? reservation.checkInDate : reservation.checkOutDate).format('DD/MM/YYYY')}</div>
              <div><strong>Số khách:</strong> {reservation.numberOfGuests}</div>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              actualTime: dayjs(),
            }}
          >
            <Form.Item
              name="actualTime"
              label={`Thời gian ${isCheckIn ? 'check-in' : 'check-out'} thực tế`}
              rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
            >
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                className="w-full"
                placeholder="Chọn thời gian"
              />
            </Form.Item>

            {isCheckIn && (
              <Form.Item name="guestPreferences" label="Sở thích khách hàng">
                <Input placeholder="VD: Phòng tầng cao, giường đôi..." />
              </Form.Item>
            )}

            <Form.Item name="notes" label="Ghi chú">
              <TextArea 
                rows={3} 
                placeholder={`Ghi chú về quá trình ${isCheckIn ? 'check-in' : 'check-out'}...`} 
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};