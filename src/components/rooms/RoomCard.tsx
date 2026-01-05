import React from 'react';
import { Card, Tag, Button, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { Room } from '../../types';

interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
  onView: (room: Room) => void;
}

const statusColors = {
  available: 'green',
  occupied: 'red',
  maintenance: 'orange',
  blocked: 'gray',
};

const statusLabels = {
  available: 'Trống',
  occupied: 'Đã đặt',
  maintenance: 'Bảo trì',
  blocked: 'Khóa',
};

const roomTypeLabels = {
  single: 'Đơn',
  double: 'Đôi',
  suite: 'Suite',
  deluxe: 'Deluxe',
};

export const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onDelete, onView }) => {
  return (
    <Card
      hoverable
      className="h-full"
      cover={
        room.images.length > 0 ? (
          <img
            alt={`Phòng ${room.roomNumber}`}
            src={room.images[0]}
            className="h-48 object-cover"
          />
        ) : (
          <div className="h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Chưa có ảnh</span>
          </div>
        )
      }
      actions={[
        <Tooltip title="Xem chi tiết">
          <Button type="text" icon={<EyeOutlined />} onClick={() => onView(room)} />
        </Tooltip>,
        <Tooltip title="Chỉnh sửa">
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(room)} />
        </Tooltip>,
        <Tooltip title="Xóa">
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(room.id)} />
        </Tooltip>,
      ]}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Phòng {room.roomNumber}</h3>
          <Tag color={statusColors[room.status]}>
            {statusLabels[room.status]}
          </Tag>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Loại: {roomTypeLabels[room.roomType]}</p>
          <p>Tầng: {room.floor}</p>
          <p>Sức chứa: {room.maxGuests} người</p>
          <p className="font-semibold text-blue-600">
            {room.basePrice.toLocaleString('vi-VN')} VNĐ/đêm
          </p>
        </div>
        
        {room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.amenities.slice(0, 3).map((amenity, index) => (
              <Tag key={index} size="small">{amenity}</Tag>
            ))}
            {room.amenities.length > 3 && (
              <Tag size="small">+{room.amenities.length - 3}</Tag>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};