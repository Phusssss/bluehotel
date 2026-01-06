import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatUtils';
import type { OverviewData } from '../../types/dashboard';

interface OverviewCardsProps {
  data: OverviewData;
  loading?: boolean;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ data, loading = false }) => {
  const availableRooms = data.totalRooms - data.occupiedRooms;
  
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Tỷ lệ lấp phòng"
            value={data.occupancyRate}
            prefix={<HomeOutlined />}
            suffix="%"
            valueStyle={{ color: data.occupancyRate > 80 ? '#cf1322' : '#3f8600' }}
          />
          <div className="text-xs text-gray-500 mt-1">
            {data.occupiedRooms}/{data.totalRooms} phòng
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Check-in hôm nay"
            value={data.todayCheckIns}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
          <div className="text-xs text-gray-500 mt-1">
            {data.todayCheckOuts} check-out
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Doanh thu hôm nay"
            value={data.todayRevenue}
            prefix={<DollarOutlined />}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Đặt phòng sắp tới"
            value={data.upcomingReservations}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
          <div className="text-xs text-gray-500 mt-1">
            7 ngày tới
          </div>
        </Card>
      </Col>
    </Row>
  );
};