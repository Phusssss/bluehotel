import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, Table, Space, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Invoice, PaymentMethod, PaymentStatus, AdditionalService } from '../../types';
import { useReservationStore } from '../../store/useReservationStore';
import { useAuthStore } from '../../store/useAuthStore';

interface InvoiceFormProps {
  visible: boolean;
  invoice?: Invoice | null;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const { Option } = Select;
const { TextArea } = Input;

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  visible,
  invoice,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { userProfile } = useAuthStore();
  const { reservations, fetchReservations } = useReservationStore();
  const [services, setServices] = useState<AdditionalService[]>([]);

  useEffect(() => {
    if (visible && userProfile?.hotelId) {
      fetchReservations(userProfile.hotelId);
    }
  }, [visible, userProfile?.hotelId]);

  useEffect(() => {
    if (visible && invoice) {
      form.setFieldsValue({
        ...invoice,
        issueDate: dayjs(invoice.issueDate),
        dueDate: dayjs(invoice.dueDate),
      });
      setServices(invoice.additionalServices || []);
    } else if (visible) {
      form.resetFields();
      setServices([]);
    }
  }, [visible, invoice, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const formattedValues = {
        ...values,
        issueDate: values.issueDate.format('YYYY-MM-DD'),
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        additionalServices: services,
        hotelId: userProfile!.hotelId,
      };
      
      onSubmit(formattedValues);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'credit_card', label: 'Thẻ tín dụng' },
    { value: 'bank_transfer', label: 'Chuyển khoản' },
  ];

  const paymentStatuses: { value: PaymentStatus; label: string }[] = [
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'partial', label: 'Thanh toán một phần' },
  ];

  const addService = () => {
    setServices([...services, { name: '', price: 0 }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof AdditionalService, value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const serviceColumns = [
    {
      title: 'Tên dịch vụ',
      key: 'name',
      render: (_: any, record: AdditionalService, index: number) => (
        <Input
          value={record.name}
          onChange={(e) => updateService(index, 'name', e.target.value)}
          placeholder="Tên dịch vụ"
        />
      ),
    },
    {
      title: 'Giá (VNĐ)',
      key: 'price',
      render: (_: any, record: AdditionalService, index: number) => (
        <InputNumber
          value={record.price}
          onChange={(value) => updateService(index, 'price', value || 0)}
          min={0}
          className="w-full"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: AdditionalService, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeService(index)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={invoice ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {invoice ? 'Cập nhật' : 'Tạo mới'}
        </Button>,
      ]}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          taxes: 0,
          discount: 0,
          issueDate: dayjs(),
          dueDate: dayjs(),
        }}
      >
        <Form.Item
          name="reservationId"
          label="Đặt phòng"
          rules={[{ required: true, message: 'Vui lòng chọn đặt phòng!' }]}
        >
          <Select placeholder="Chọn đặt phòng">
            {reservations.map(reservation => (
              <Option key={reservation.id} value={reservation.id}>
                {reservation.id.slice(-8).toUpperCase()} - {reservation.totalPrice.toLocaleString('vi-VN')} VNĐ
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="roomCharges"
            label="Tiền phòng (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập tiền phòng!' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            name="totalAmount"
            label="Tổng tiền (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập tổng tiền!' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="font-medium">Dịch vụ thêm</label>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addService}
            >
              Thêm dịch vụ
            </Button>
          </div>
          <Table
            columns={serviceColumns}
            dataSource={services}
            pagination={false}
            size="small"
            rowKey={(_, index) => index!}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="taxes" label="Thuế (VNĐ)">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item name="discount" label="Giảm giá (VNĐ)">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="paymentMethod"
            label="Phương thức thanh toán"
            rules={[{ required: true, message: 'Vui lòng chọn phương thức!' }]}
          >
            <Select placeholder="Chọn phương thức">
              {paymentMethods.map(method => (
                <Option key={method.value} value={method.value}>
                  {method.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="paymentStatus"
            label="Trạng thái thanh toán"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              {paymentStatuses.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="issueDate"
            label="Ngày xuất hóa đơn"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Ngày đến hạn"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Ghi chú">
          <TextArea rows={3} placeholder="Ghi chú về hóa đơn..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};