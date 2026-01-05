import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Image, List, Tag, Descriptions, Button, Empty, Spin } from 'antd';
import { CalendarOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import { reservationService } from '../../services/reservationService';
import { useAuthStore } from '../../store/useAuthStore';
import type { Room, Reservation } from '../../types';

interface RoomDetailModalProps {
  room: Room | null;
  visible: boolean;
  onClose: () => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  visible,
  onClose
}) => {
  const { userProfile } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room && visible && userProfile?.hotelId) {
      fetchReservations();
    }
  }, [room, visible, userProfile?.hotelId]);

  const fetchReservations = async () => {
    if (!room || !userProfile?.hotelId) return;
    
    setLoading(true);
    try {
      const roomReservations = await reservationService.getReservationsByRoom(
        userProfile.hotelId,
        room.id!
      );
      setReservations(roomReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'green',
      occupied: 'red',
      maintenance: 'orange',
      cleaning: 'blue',
      'out-of-order': 'red',
      blocked: 'purple'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      available: 'Có sẵn',
      occupied: 'Đang sử dụng',
      maintenance: 'Bảo trì',
      cleaning: 'Đang dọn dẹp',
      'out-of-order': 'Hỏng',
      blocked: 'Bị khóa'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getReservationStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      confirmed: 'blue',
      'checked-in': 'green',
      'checked-out': 'default',
      cancelled: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getReservationStatusText = (status: string) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      'checked-in': 'Đã nhận phòng',
      'checked-out': 'Đã trả phòng',
      cancelled: 'Đã hủy'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const items = [
    {
      key: 'info',
      label: 'Thông tin phòng',
      children: (
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Số phòng">{room.roomNumber}</Descriptions.Item>
          <Descriptions.Item label="Loại phòng">{room.roomType}</Descriptions.Item>
          <Descriptions.Item label="Tầng">{room.floor}</Descriptions.Item>
          <Descriptions.Item label="Số khách tối đa">{room.maxGuests}</Descriptions.Item>
          <Descriptions.Item label="Giá cơ bản">
            {room.basePrice?.toLocaleString('vi-VN')} VNĐ
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={getStatusColor(room.status)}>{getStatusText(room.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tiện nghi" span={2}>
            {room.amenities?.map(amenity => (
              <Tag key={amenity}>{amenity}</Tag>
            ))}
          </Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'images',
      label: 'Hình ảnh',
      children: (
        <div className="grid grid-cols-2 gap-4">
          {room.images && room.images.length > 0 ? (
            room.images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`Room ${room.roomNumber} - ${index + 1}`}
                className="rounded-lg"
              />
            ))
          ) : (
            <Empty description="Chưa có hình ảnh" />
          )}
        </div>
      )
    },
    {
      key: 'reservations',
      label: 'Lịch đặt phòng',
      children: (
        <List
          loading={loading}
          dataSource={reservations}
          locale={{ emptyText: 'Chưa có đặt phòng nào' }}
          renderItem={(reservation: Reservation) => (
            <List.Item>
              <List.Item.Meta
                avatar={<UserOutlined />}
                title={
                  <div className="flex items-center gap-2">
                    <span>{reservation.guestName}</span>
                    <Tag color={getReservationStatusColor(reservation.status)}>
                      {getReservationStatusText(reservation.status)}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div>{reservation.checkInDate} - {reservation.checkOutDate}</div>
                    <div className="text-xs text-gray-500">
                      Mã đặt: {reservation.confirmationCode}
                    </div>
                  </div>
                }
              />
              <div className="text-right">
                <div className="font-semibold">
                  {reservation.totalPrice?.toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="text-xs text-gray-500">
                  {reservation.numberOfGuests} khách
                </div>
              </div>
            </List.Item>
          )}
        />
      )
    }
  ];

  return (
    <Modal
      title={`Chi tiết phòng ${room.roomNumber}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
    >
      <Tabs items={items} />
    </Modal>
  );
};