import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag } from 'antd';
import { 
  ToolOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  DollarOutlined 
} from '@ant-design/icons';
import type { MaintenanceStats } from '../../types/maintenance';

interface MaintenanceStatsProps {
  stats: MaintenanceStats;
  loading?: boolean;
}

export const MaintenanceStats: React.FC<MaintenanceStatsProps> = ({
  stats,
  loading = false
}) => {
  const completionRate = stats.totalRequests > 0 
    ? Math.round((stats.completed / stats.totalRequests) * 100) 
    : 0;

  const urgentRate = stats.totalRequests > 0 
    ? Math.round((stats.urgent / stats.totalRequests) * 100) 
    : 0;

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Total Requests"
            value={stats.totalRequests}
            prefix={<ToolOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Pending"
            value={stats.pending}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
          <div className="mt-2">
            <Progress 
              percent={stats.totalRequests > 0 ? Math.round((stats.pending / stats.totalRequests) * 100) : 0}
              size="small" 
              strokeColor="#faad14"
              showInfo={false}
            />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="In Progress"
            value={stats.inProgress}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
          <div className="mt-2">
            <Progress 
              percent={stats.totalRequests > 0 ? Math.round((stats.inProgress / stats.totalRequests) * 100) : 0}
              size="small" 
              strokeColor="#fa8c16"
              showInfo={false}
            />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Completed"
            value={stats.completed}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
          <div className="mt-2">
            <Progress 
              percent={completionRate}
              size="small" 
              strokeColor="#52c41a"
              showInfo={false}
            />
            <div className="text-xs text-gray-500 mt-1">
              {completionRate}% completion rate
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Urgent Requests"
            value={stats.urgent}
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
          <div className="mt-2">
            {stats.urgent > 0 && (
              <Tag color="red" className="mb-1">
                {urgentRate}% urgent
              </Tag>
            )}
            {stats.urgent === 0 && (
              <Tag color="green" className="mb-1">
                No urgent requests
              </Tag>
            )}
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Total Costs"
            value={stats.totalCosts}
            prefix={<DollarOutlined />}
            precision={2}
            valueStyle={{ color: '#722ed1' }}
          />
          <div className="mt-2 text-xs text-gray-500">
            Avg per request: ${stats.totalRequests > 0 ? (stats.totalCosts / stats.totalRequests).toFixed(2) : '0.00'}
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Avg Resolution Time"
            value={stats.averageResolutionTime}
            suffix="hours"
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#13c2c2' }}
          />
          <div className="mt-2 text-xs text-gray-500">
            {stats.averageResolutionTime > 24 
              ? `${Math.round(stats.averageResolutionTime / 24)} days` 
              : `${stats.averageResolutionTime} hours`}
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">System Health</div>
            <Progress
              type="circle"
              percent={completionRate}
              size={80}
              strokeColor={
                completionRate >= 80 ? '#52c41a' : 
                completionRate >= 60 ? '#faad14' : '#ff4d4f'
              }
            />
            <div className="mt-2 text-xs text-gray-500">
              {completionRate >= 80 ? 'Excellent' : 
               completionRate >= 60 ? 'Good' : 'Needs Attention'}
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};