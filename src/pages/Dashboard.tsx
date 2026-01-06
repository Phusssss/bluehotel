import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, Space, Modal } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { OverviewCards } from '../components/dashboard/OverviewCards';
import { ReservationListPreview } from '../components/dashboard/ReservationListPreview';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { showConfirmationModal } from '../components/common/ConfirmationModal';
import { PermissionGuard } from '../components/common/PermissionGuard';
import { useDashboardData } from '../hooks/useDashboardData';
import { useReservationStore } from '../store/useReservationStore';
import { useAuth } from '../hooks/useAuth';
import { alertService } from '../services/alertService';
import { formatCurrency, formatDateTime } from '../utils/formatUtils';
import { message } from 'antd';

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [alertOpStatus, setAlertOpStatus] = useState<{ [key: string]: { viewing?: boolean; dismissing?: boolean } }>({});
  const hotelId = userProfile?.hotelId || 'hotel-1';
  const { data, loading, error, refreshData } = useDashboardData(hotelId);
  const { checkInReservation, operationStatus } = useReservationStore();

  const handleViewReservation = (reservation: any) => {
    navigate(`/reservations?id=${reservation.id}`);
  };

  const handleQuickCheckIn = async (reservation: any) => {
    showConfirmationModal({
      title: 'Xác nhận Check-in',
      content: (
        <div>
          <p><strong>Khách:</strong> {reservation.guestName}</p>
          <p><strong>Phòng:</strong> {reservation.roomNumber}</p>
          <p><strong>Thời gian:</strong> {formatDateTime(new Date())}</p>
        </div>
      ),
      onConfirm: async () => {
        try {
          await checkInReservation(reservation.id, {
            actualCheckInTime: new Date().toISOString(),
            notes: 'Quick check-in from dashboard'
          });
          message.success('Check-in thành công!');
          refreshData();
        } catch (error: any) {
          console.error('Check-in error:', error);
          message.error(`Check-in thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
      }
    });
  };

  const handleViewAlert = async (alert: any) => {
    try {
      setAlertOpStatus(prev => ({ ...prev, [alert.id]: { viewing: true } }));
      await alertService.markAsViewed(alert.id);
      Modal.info({
        title: alert.title,
        content: (
          <div>
            <p><strong>Mô tả:</strong> {alert.description}</p>
            <p><strong>Mức độ:</strong> {alert.priority.toUpperCase()}</p>
            <p><strong>Thời gian:</strong> {formatDateTime(alert.createdAt)}</p>
            {alert.action && <p><strong>Hành động:</strong> {alert.action}</p>}
          </div>
        ),
        okText: 'Đóng',
        onOk: () => setAlertOpStatus(prev => ({ ...prev, [alert.id]: { viewing: false } }))
      });
    } catch (error: any) {
      setAlertOpStatus(prev => ({ ...prev, [alert.id]: { viewing: false } }));
      message.error(`Lỗi xem cảnh báo: ${error.message}`);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    showConfirmationModal({
      title: 'Xác nhận ẩn cảnh báo',
      content: 'Bạn có chắc chắn muốn ẩn cảnh báo này?',
      onConfirm: async () => {
        try {
          setAlertOpStatus(prev => ({ ...prev, [alertId]: { dismissing: true } }));
          await alertService.dismissAlert(alertId);
          message.success('Đã ẩn cảnh báo');
          setAlertOpStatus(prev => ({ ...prev, [alertId]: { dismissing: false } }));
          refreshData();
        } catch (error: any) {
          setAlertOpStatus(prev => ({ ...prev, [alertId]: { dismissing: false } }));
          message.error(`Lỗi ẩn cảnh báo: ${error.message}`);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Dashboard</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={refreshData}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>
      
      {error && (
        <Card>
          <div className="text-center text-red-500">
            <p>Lỗi tải dữ liệu: {error}</p>
            <Button onClick={refreshData} type="primary">
              Thử lại
            </Button>
          </div>
        </Card>
      )}
      
      {/* Overview Statistics */}
      <OverviewCards data={data.overview} loading={loading} />

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ lấp đầy phòng (7 ngày)" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.occupancyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} phòng`, 
                    name === 'occupied' ? 'Đã đặt' : 'Trống'
                  ]}
                />
                <Bar dataKey="occupied" fill="#1890ff" name="occupied" />
                <Bar dataKey="available" fill="#52c41a" name="available" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Doanh thu (7 ngày)" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#1890ff" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Reservations and Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <PermissionGuard permission="view_reservations">
            <ReservationListPreview
              reservations={data.upcomingReservations}
              loading={loading}
              onViewReservation={handleViewReservation}
              onQuickCheckIn={handleQuickCheckIn}
              operationStatus={operationStatus}
            />
          </PermissionGuard>
        </Col>
        
        <Col xs={24} lg={12}>
          <AlertsPanel
            alerts={data.alerts}
            loading={loading}
            onViewAlert={handleViewAlert}
            onDismissAlert={handleDismissAlert}
            operationStatus={alertOpStatus}
          />
        </Col>
      </Row>

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <Card title="Hoạt động gần đây" loading={loading}>
          <Space direction="vertical" className="w-full">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium">{activity.guest}</div>
                  <div className="text-sm text-gray-500">{activity.room}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{activity.type}</div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(activity.time)}
                  </div>
                </div>
              </div>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
};