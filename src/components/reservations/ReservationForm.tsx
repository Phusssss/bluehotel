import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, InputNumber, Input, Button, message, Divider, Row, Col, Statistic } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { Reservation, ReservationStatus } from '../../types';
import { useRoomStore } from '../../store/useRoomStore';
import { useGuestStore } from '../../store/useGuestStore';
import { useAuthStore } from '../../store/useAuthStore';
import { reservationService } from '../../services/reservationService';

interface ReservationFormProps {
  visible: boolean;
  reservation?: Reservation | null;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export const ReservationForm: React.FC<ReservationFormProps> = ({
  visible,
  reservation,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { userProfile } = useAuthStore();
  const { rooms, fetchRooms } = useRoomStore();
  const { guests, fetchGuests } = useGuestStore();
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [priceCalculation, setPriceCalculation] = useState({
    numberOfNights: 0,
    pricePerNight: 0,
    subtotal: 0,
    tax: 0,
    discount: 0,
    totalPrice: 0
  });

  useEffect(() => {
    if (visible) {
      if (userProfile?.hotelId) {
        fetchRooms(userProfile.hotelId);
      }
      fetchGuests();
    }
  }, [visible, userProfile?.hotelId]);

  useEffect(() => {
    if (visible && reservation) {
      form.setFieldsValue({
        ...reservation,
        dateRange: [dayjs(reservation.checkInDate), dayjs(reservation.checkOutDate)],
      });
    } else if (visible) {
      form.resetFields();
      setAvailableRooms([]);
      setPriceCalculation({
        numberOfNights: 0,
        pricePerNight: 0,
        subtotal: 0,
        tax: 0,
        discount: 0,
        totalPrice: 0
      });
    }
  }, [visible, reservation, form]);

  const handleDateChange = async (dates: [Dayjs, Dayjs] | null) => {
    if (dates && dates[0] && dates[1] && userProfile?.hotelId) {
      const numberOfGuests = form.getFieldValue('numberOfGuests') || 1;
      try {
        const available = await reservationService.getAvailableRooms(
          userProfile.hotelId,
          dates[0].format('YYYY-MM-DD'),
          dates[1].format('YYYY-MM-DD'),
          numberOfGuests
        );
        setAvailableRooms(available);
        
        // Auto-calculate nights
        const nights = dates[1].diff(dates[0], 'day');
        form.setFieldValue('numberOfNights', nights);
        
        // Update price if room is selected
        const selectedRoomId = form.getFieldValue('roomId');
        if (selectedRoomId) {
          const selectedRoom = available.find(ar => ar.room.id === selectedRoomId);
          if (selectedRoom) {
            calculatePrice(nights, selectedRoom.room.basePrice);
          }
        }
      } catch (error) {
        message.error('Failed to fetch available rooms');
      }
    }
  };

  const calculatePrice = (nights: number, pricePerNight: number) => {
    const discountPercent = form.getFieldValue('discountPercent') || 0;
    const subtotal = nights * pricePerNight;
    const discount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * 0.1; // 10% tax
    const totalPrice = afterDiscount + tax;
    
    const calculation = {
      numberOfNights: nights,
      pricePerNight,
      subtotal,
      tax,
      discount,
      totalPrice
    };
    
    setPriceCalculation(calculation);
    form.setFieldsValue({
      pricePerNight,
      totalPrice: Math.round(totalPrice)
    });
  };

  const handleRoomChange = (roomId: string) => {
    const selectedRoom = availableRooms.find(ar => ar.room.id === roomId);
    if (selectedRoom) {
      const nights = form.getFieldValue('numberOfNights') || 0;
      if (nights > 0) {
        calculatePrice(nights, selectedRoom.room.basePrice);
      }
    }
  };

  const handleDiscountChange = (discountPercent: number) => {
    const nights = form.getFieldValue('numberOfNights') || 0;
    const pricePerNight = form.getFieldValue('pricePerNight') || 0;
    if (nights > 0 && pricePerNight > 0) {
      calculatePrice(nights, pricePerNight);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [checkInDate, checkOutDate] = values.dateRange;
      
      const formattedValues = {
        ...values,
        checkInDate: checkInDate.format('YYYY-MM-DD'),
        checkOutDate: checkOutDate.format('YYYY-MM-DD'),
        hotelId: userProfile!.hotelId,
        priceBreakdown: {
          basePrice: priceCalculation.subtotal,
          taxes: priceCalculation.tax,
          fees: 0,
          discounts: priceCalculation.discount
        },
        source: 'online' as const,
        confirmationCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
        paymentStatus: 'pending' as const
      };
      
      delete formattedValues.dateRange;
      delete formattedValues.discountPercent;
      onSubmit(formattedValues);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const reservationStatuses: { value: ReservationStatus; label: string }[] = [
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'checked-in', label: 'Đã check-in' },
    { value: 'checked-out', label: 'Đã check-out' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <Modal
      title={reservation ? 'Chỉnh sửa đặt phòng' : 'Tạo đặt phòng mới'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {reservation ? 'Cập nhật' : 'Tạo mới'}
        </Button>,
      ]}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'pending',
          numberOfGuests: 1,
          discountPercent: 0
        }}
      >
        <Form.Item
          name="guestId"
          label="Khách hàng"
          rules={[{ required: true, message: 'Vui lòng chọn khách hàng!' }]}
        >
          <Select
            placeholder="Chọn khách hàng"
            showSearch
            filterOption={(input, option) => {
              const guest = guests.find(g => g.id === option?.value);
              if (!guest) return false;
              const searchText = `${guest.firstName} ${guest.lastName} ${guest.email}`.toLowerCase();
              return searchText.includes(input.toLowerCase());
            }}
          >
            {guests.map(guest => (
              <Option key={guest.id} value={guest.id}>
                {guest.firstName} {guest.lastName} - {guest.email}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Thời gian"
          rules={[
            { required: true, message: 'Vui lòng chọn thời gian!' },
            {
              validator: (_, value) => {
                if (value && value[0] && value[1]) {
                  if (value[1].isBefore(value[0])) {
                    return Promise.reject('Ngày check-out phải sau ngày check-in!');
                  }
                  if (value[0].isBefore(dayjs().startOf('day'))) {
                    return Promise.reject('Không thể đặt phòng cho ngày trong quá khứ!');
                  }
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <RangePicker
            className="w-full"
            placeholder={['Ngày check-in', 'Ngày check-out']}
            onChange={handleDateChange}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="numberOfGuests"
              label="Số khách"
              rules={[{ required: true, message: 'Vui lòng nhập số khách!' }]}
            >
              <InputNumber min={1} max={10} className="w-full" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="numberOfNights" label="Số đêm">
              <InputNumber readOnly className="w-full" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="pricePerNight" label="Giá/đêm (VNĐ)">
              <InputNumber disabled className="w-full" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="roomId"
          label="Phòng"
          rules={[{ required: true, message: 'Vui lòng chọn phòng!' }]}
        >
          <Select placeholder="Chọn phòng" onChange={handleRoomChange}>
            {availableRooms.map(availableRoom => (
              <Option key={availableRoom.room.id} value={availableRoom.room.id}>
                Phòng {availableRoom.room.roomNumber} - {availableRoom.room.roomType} ({availableRoom.room.basePrice.toLocaleString('vi-VN')} VNĐ/đêm)
                {availableRoom.isRecommended && ' ⭐'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="discountPercent" label="Khuyến mại (%)">
              <InputNumber min={0} max={100} placeholder="0" className="w-full" onChange={handleDiscountChange} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
            >
              <Select placeholder="Chọn trạng thái">
                {reservationStatuses.map(status => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider>Chi tiết giá</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Statistic title="Subtotal" value={priceCalculation.subtotal} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} suffix="VNĐ" />
          </Col>
          <Col span={12}>
            <Statistic title="Thuế (10%)" value={priceCalculation.tax} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} suffix="VNĐ" />
          </Col>
        </Row>
        
        {priceCalculation.discount > 0 && (
          <Row gutter={16}>
            <Col span={12}>
              <Statistic title="Giảm giá" value={priceCalculation.discount} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} suffix="VNĐ" valueStyle={{ color: '#52c41a' }} />
            </Col>
          </Row>
        )}
        
        <Form.Item
          name="totalPrice"
          label="Tổng tiền (VNĐ)"
          rules={[{ required: true, message: 'Vui lòng nhập tổng tiền!' }]}
        >
          <InputNumber min={0} className="w-full" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value!.replace(/\$\s?|(,*)/g, '')} />
        </Form.Item>

        <Form.Item name="notes" label="Ghi chú">
          <TextArea rows={2} placeholder="Ghi chú về đặt phòng..." />
        </Form.Item>

        <Form.Item name="specialRequests" label="Yêu cầu đặc biệt">
          <TextArea rows={2} placeholder="Yêu cầu đặc biệt từ khách hàng..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};