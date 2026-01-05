import React from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const { Title } = Typography;

// Mock data
const occupancyData = [
  { name: 'T2', occupied: 65, available: 35 },
  { name: 'T3', occupied: 78, available: 22 },
  { name: 'T4', occupied: 82, available: 18 },
  { name: 'T5', occupied: 90, available: 10 },
  { name: 'T6', occupied: 95, available: 5 },
  { name: 'T7', occupied: 88, available: 12 },
  { name: 'CN', occupied: 75, available: 25 },
];

const revenueData = [
  { month: 'T1', revenue: 45000 },
  { month: 'T2', revenue: 52000 },
  { month: 'T3', revenue: 48000 },
  { month: 'T4', revenue: 61000 },
  { month: 'T5', revenue: 55000 },
  { month: 'T6', revenue: 67000 },
];

const todayActivities = [
  {
    key: '1',
    time: '09:00',
    guest: 'Nguyễn Văn A',
    room: '101',
    action: 'Check-in',
    status: 'completed'
  },
  {
    key: '2',
    time: '10:30',
    guest: 'Trần Thị B',
    room: '205',
    action: 'Check-out',
    status: 'completed'
  },
  {
    key: '3',
    time: '14:00',
    guest: 'Lê Văn C',
    room: '301',
    action: 'Check-in',
    status: 'pending'
  },
];

const columns = [
  {
    title: 'Thời gian',
    dataIndex: 'time',
    key: 'time',
  },
  {
    title: 'Khách hàng',
    dataIndex: 'guest',
    key: 'guest',
  },
  {
    title: 'Phòng',
    dataIndex: 'room',
    key: 'room',
  },
  {
    title: 'Hoạt động',
    dataIndex: 'action',
    key: 'action',
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'completed' ? 'green' : 'orange'}>
        {status === 'completed' ? 'Hoàn thành' : 'Chờ xử lý'}
      </Tag>
    ),
  },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <Title level={2}>Dashboard</Title>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Phòng trống"
              value={25}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Phòng đã đặt"
              value={75}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={12500000}
              prefix={<DollarOutlined />}
              precision={0}
              suffix="VNĐ"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khách mới"
              value={8}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ lấp đầy phòng (7 ngày)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupied" fill="#1890ff" name="Đã đặt" />
                <Bar dataKey="available" fill="#52c41a" name="Trống" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Doanh thu theo tháng">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value?.toLocaleString()} VNĐ`, 'Doanh thu']} />
                <Line type="monotone" dataKey="revenue" stroke="#1890ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Today's Activities */}
      <Card title="Hoạt động hôm nay">
        <Table 
          columns={columns} 
          dataSource={todayActivities} 
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};