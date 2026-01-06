import React from 'react';
import { Card, Alert, List, Button, Space, Badge, message } from 'antd';
import { 
  WarningOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { formatDateTime } from '../../utils/formatUtils';
import { usePermissions } from '../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import type { AlertItem } from '../../types/dashboard';

interface AlertsPanelProps {
  alerts: AlertItem[];
  loading?: boolean;
  onViewAlert: (alert: AlertItem) => void;
  onDismissAlert: (alertId: string) => void;
  operationStatus?: { [key: string]: { viewing?: boolean; dismissing?: boolean } };
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  loading = false,
  onViewAlert,
  onDismissAlert,
  operationStatus = {}
}) => {
  const { canViewAlerts, canDismissAlerts } = usePermissions();
  const navigate = useNavigate();
  const getAlertIcon = (type: string) => {
    const icons = {
      warning: <WarningOutlined />,
      error: <ExclamationCircleOutlined />,
      info: <ClockCircleOutlined />
    };
    return icons[type as keyof typeof icons] || <WarningOutlined />;
  };

  const getAlertColor = (type: string) => {
    const colors = {
      warning: 'orange',
      error: 'red',
      info: 'blue'
    };
    return colors[type as keyof typeof colors] || 'orange';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'blue'
    };
    return colors[priority as keyof typeof colors] || 'blue';
  };

  const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high');

  return (
    <Card 
      title={
        <Space>
          <span>Cảnh báo & Thông báo</span>
          {highPriorityAlerts.length > 0 && (
            <Badge count={highPriorityAlerts.length} />
          )}
        </Space>
      }
      loading={loading}
    >
      {alerts.length === 0 ? (
        <Alert
          message="Không có cảnh báo"
          description="Tất cả hoạt động đang diễn ra bình thường."
          type="success"
          showIcon
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={alerts.slice(0, 5)}
          renderItem={(alert) => (
            <List.Item
              actions={[
                canViewAlerts ? (
                  <Button 
                    key="view"
                    type="text" 
                    icon={<EyeOutlined />}
                    loading={operationStatus[alert.id]?.viewing}
                    onClick={() => onViewAlert(alert)}
                  />
                ) : null,
                canDismissAlerts ? (
                  <Button 
                    key="dismiss"
                    type="text" 
                    icon={<CloseOutlined />}
                    loading={operationStatus[alert.id]?.dismissing}
                    onClick={() => onDismissAlert(alert.id)}
                  />
                ) : null
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <div className={`text-${getAlertColor(alert.type)}-500 text-lg`}>
                    {getAlertIcon(alert.type)}
                  </div>
                }
                title={
                  <Space>
                    <span>{alert.title}</span>
                    <Badge 
                      color={getPriorityColor(alert.priority)} 
                      text={alert.priority.toUpperCase()} 
                    />
                  </Space>
                }
                description={
                  <div>
                    <div className="mb-1">{alert.description}</div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(alert.createdAt)}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
      
      {alerts.length > 5 && (
        <div className="text-center mt-3">
          <Button 
            type="link" 
            size="small" 
            onClick={() => {
              if (canViewAlerts) navigate('/alerts');
              else message.warning('Bạn không có quyền xem cảnh báo');
            }}
          >
            Xem tất cả ({alerts.length} cảnh báo)
          </Button>
        </div>
      )}
    </Card>
  );
};