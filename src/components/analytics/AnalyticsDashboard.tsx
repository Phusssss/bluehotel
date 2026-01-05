import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  DatePicker, 
  Progress,
  Table,
  Tag
} from 'antd';
import { 
  CalendarOutlined,
  DollarOutlined,
  HomeOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useReservationStore } from '../../store/useReservationStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useReservationCalendar } from '../../hooks/useReservationCalendar';

const { RangePicker } = DatePicker;

export const AnalyticsDashboard: React.FC = () => {
  const { reservations, fetchReservations } = useReservationStore();
  const { rooms, fetchRooms } = useRoomStore();
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  
  const hotelId = 'hotel-1';
  
  useEffect(() => {
    fetchReservations(hotelId);
    fetchRooms(hotelId);
  }, [fetchReservations, fetchRooms, hotelId]);

  const {
    findConflicts,
    getReservationsInRange,
    calculateRevenue
  } = useReservationCalendar(reservations, rooms, 'month');

  const rangeReservations = getReservationsInRange(dateRange[0], dateRange[1]);
  const totalRevenue = calculateRevenue(dateRange[0], dateRange[1]);
  const totalReservations = rangeReservations.length;
  const avgOccupancy = Math.round(
    rangeReservations.length > 0 
      ? (rangeReservations.filter(r => r.status === 'checked-in').length / rooms.length) * 100
      : 0
  );
  const conflicts = findConflicts();

  const statusBreakdown = rangeReservations.reduce((acc, res) => {
    acc[res.status] = (acc[res.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenueBySource = rangeReservations.reduce((acc, res) => {
    const source = res.source || 'direct';
    acc[source] = (acc[source] || 0) + (res.totalPrice || 0);
    return acc;
  }, {} as Record<string, number>);

  const sourceColumns = [
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={source === 'online' ? 'blue' : source === 'phone' ? 'green' : 'orange'}>
          {source.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `$${revenue.toLocaleString()}`
    }
  ];

  const sourceData = Object.entries(revenueBySource).map(([source, revenue]) => ({
    key: source,
    source,
    revenue
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates)}
          className="w-64"
        />
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Reservations"
              value={totalReservations}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Occupancy"
              value={avgOccupancy}
              suffix="%"
              prefix={<HomeOutlined />}
              valueStyle={{ color: avgOccupancy > 70 ? '#3f8600' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Conflicts"
              value={conflicts.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: conflicts.length > 0 ? '#f5222d' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Reservation Status">
            <div className="space-y-4">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const percentage = (count / totalReservations) * 100;
                const colors = {
                  pending: '#faad14',
                  confirmed: '#1890ff',
                  'checked-in': '#52c41a',
                  'checked-out': '#d9d9d9',
                  cancelled: '#f5222d'
                };
                
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-1">
                      <span className="capitalize">{status}</span>
                      <span>{count}</span>
                    </div>
                    <Progress 
                      percent={percentage} 
                      strokeColor={colors[status as keyof typeof colors]}
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Revenue by Source">
            <Table
              columns={sourceColumns}
              dataSource={sourceData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {conflicts.length > 0 && (
        <Card title="⚠️ Booking Conflicts" className="border-red-200">
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                <div className="font-medium">Room {conflict.roomId}</div>
                <div className="text-sm text-gray-600">
                  Date: {conflict.date} - {conflict.reservations.length} overlapping reservations
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};