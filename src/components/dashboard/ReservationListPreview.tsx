import React from 'react';
import { Card, List, Tag, Button, Avatar, Space } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  HomeOutlined,
  EyeOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { formatCurrency, formatDate, isToday } from '../../utils/formatUtils';
import { usePermissions } from '../../hooks/usePermissions';
import type { Reservation } from '../../types';

interface ReservationListPreviewProps {
  reservations: Reservation[];
  loading?: boolean;
  onViewReservation: (reservation: Reservation) => void;
  onQuickCheckIn: (reservation: Reservation) => void;
  operationStatus?: { [key: string]: { checkingIn?: boolean } };
}

export const ReservationListPreview: React.FC<ReservationListPreviewProps> = ({
  reservations,
  loading = false,
  onViewReservation,
  onQuickCheckIn,
  operationStatus = {}
}) => {
  const navigate = useNavigate();
  const { canManageReservations, hasPermission } = usePermissions();
  
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      confirmed: 'blue',
      'checked-in': 'green',
      'checked-out': 'gray',
      cancelled: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      'checked-in': 'Đã check-in',
      'checked-out': 'Đã check-out',
      cancelled: 'Đã hủy'
    };
    return texts[status as keyof typeof texts] || status;
  };
  
  const canCheckIn = (reservation: Reservation) => {
    return hasPermission('check_in') && 
           reservation.status === 'confirmed' && 
           isToday(reservation.checkInDate);
  };

  return (
    <Card 
      title="Đặt phòng sắp tới" 
      loading={loading}
      extra={
        <Button type="link" size="small" onClick={() => navigate('/reservations')}>
          Xem tất cả
        </Button>
      }
    >
      <List
        itemLayout="horizontal"
        dataSource={reservations.slice(0, 5)}
        renderItem={(reservation) => (
          <List.Item
            actions={[
              <Button 
                key="view"
                type="text" 
                icon={<EyeOutlined />}
                onClick={() => onViewReservation(reservation)}
              />,
              ...(canCheckIn(reservation) ? [
                <Button 
                  key="checkin"
                  type="primary" 
                  size="small"
                  icon={<CheckOutlined />}
                  loading={operationStatus[reservation.id]?.checkingIn}
                  onClick={() => onQuickCheckIn(reservation)}
                >
                  Check-in
                </Button>
              ] : [])
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} />}
              title={
                <Space>
                  <span>{reservation.guestName || 'N/A'}</span>
                  <Tag color={getStatusColor(reservation.status)}>
                    {getStatusText(reservation.status)}
                  </Tag>
                  {isToday(reservation.checkInDate) && (
                    <Tag color="red">Hôm nay</Tag>
                  )}
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Space>
                    <HomeOutlined />
                    <span>Phòng {reservation.roomNumber || 'N/A'}</span>
                  </Space>
                  <Space>
                    <CalendarOutlined />
                    <span>
                      {formatDate(reservation.checkInDate, 'DD/MM')} - {formatDate(reservation.checkOutDate, 'DD/MM')}
                    </span>
                  </Space>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(reservation.totalPrice || 0)}
                  </span>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};