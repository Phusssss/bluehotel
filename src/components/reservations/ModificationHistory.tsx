import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Timeline, 
  Tag, 
  Typography, 
  Spin, 
  Empty,
  Descriptions,
  Button
} from 'antd';
import { 
  HistoryOutlined, 
  UserOutlined, 
  CalendarOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reservationService } from '../../services/reservationService';

const { Text, Title } = Typography;

interface ModificationHistoryProps {
  visible: boolean;
  reservationId: string | null;
  onClose: () => void;
}

export const ModificationHistory: React.FC<ModificationHistoryProps> = ({
  visible,
  reservationId,
  onClose
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && reservationId) {
      fetchHistory();
    }
  }, [visible, reservationId]);

  const fetchHistory = async () => {
    if (!reservationId) return;
    
    try {
      setLoading(true);
      const historyData = await reservationService.getModificationHistory(reservationId);
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChangeValue = (value: any) => {
    if (value instanceof Date) {
      return dayjs(value).format('YYYY-MM-DD HH:mm');
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  const getChangeColor = (field: string) => {
    const colorMap: Record<string, string> = {
      status: 'blue',
      checkInDate: 'green',
      checkOutDate: 'orange',
      totalPrice: 'red',
      roomId: 'purple',
      paymentStatus: 'cyan'
    };
    return colorMap[field] || 'default';
  };

  const renderTimelineItem = (log: any) => (
    <Timeline.Item
      key={log.id}
      dot={<EditOutlined className="text-blue-500" />}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <Text strong>{log.modifiedBy}</Text>
            <div className="text-xs text-gray-500">
              {dayjs(log.timestamp).format('MMM DD, YYYY HH:mm')}
            </div>
          </div>
          {log.reason && (
            <Tag color="blue">{log.reason}</Tag>
          )}
        </div>
        
        <div className="space-y-1">
          {Object.entries(log.changes).map(([field, change]: [string, any]) => (
            <div key={field} className="text-sm">
              <Tag color={getChangeColor(field)} className="mb-1">
                {field}
              </Tag>
              <div className="ml-2">
                <Text delete className="text-gray-400">
                  {formatChangeValue(change.from)}
                </Text>
                {' → '}
                <Text strong className="text-green-600">
                  {formatChangeValue(change.to)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Timeline.Item>
  );

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <HistoryOutlined />
          <span>Modification History</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={600}
    >
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
          </div>
        ) : history.length === 0 ? (
          <Empty
            description="No modifications found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Timeline mode="left">
            {history.map(renderTimelineItem)}
          </Timeline>
        )}
      </div>
    </Modal>
  );
};